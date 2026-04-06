use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use sqlx::PgPool;

use crate::services::chunking::{self, Chunk};
use crate::services::embeddings::EmbeddingService;

/// A row from the rag_chunks table.
#[derive(Debug, sqlx::FromRow)]
pub struct RagChunkRow {
    pub id: i32,
    pub project_id: i32,
    pub source_type: String,
    pub source_id: i32,
    pub chunk_index: i32,
    pub content: String,
    pub section_title: Option<String>,
    pub domain_tags: Vec<String>,
}

/// Result of an ingestion job.
#[derive(Debug)]
pub struct IngestResult {
    pub source_type: String,
    pub chunks_created: usize,
    pub chunks_skipped: usize,
    pub errors: Vec<String>,
}

/// Parameters for inserting a chunk.
struct InsertChunkParams<'a> {
    project_id: i32,
    source_type: &'a str,
    source_id: i32,
    chunk: &'a Chunk,
    total_chunks: i32,
    embedding: &'a [f32],
    domain_tags: &'a [String],
}

fn content_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Insert a single chunk into rag_chunks (UPSERT — skip if content_hash exists).
async fn insert_chunk(db: &PgPool, params: InsertChunkParams<'_>) -> Result<bool> {
    let hash = content_hash(&params.chunk.content);
    let embedding_str = format!(
        "[{}]",
        params.embedding.iter().map(|f| f.to_string()).collect::<Vec<_>>().join(",")
    );

    let result = sqlx::query(
        r#"
        INSERT INTO rag_chunks (
            project_id, source_type, source_id, chunk_index, total_chunks,
            content, content_hash, section_title, embedding, content_tsv,
            domain_tags, metadata
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9::vector,
            ''::tsvector,
            $10, '{}'::jsonb
        )
        ON CONFLICT (project_id, content_hash) DO NOTHING
        "#,
    )
    .bind(params.project_id)
    .bind(params.source_type)
    .bind(params.source_id)
    .bind(params.chunk.index as i32)
    .bind(params.total_chunks)
    .bind(&params.chunk.content)
    .bind(&hash)
    .bind(&params.chunk.section_title)
    .bind(&embedding_str)
    .bind(params.domain_tags)
    .execute(db)
    .await
    .context("failed to insert rag_chunk")?;

    Ok(result.rows_affected() > 0)
}

/// Parameters for content ingestion.
pub struct IngestParams<'a> {
    pub project_id: i32,
    pub source_type: &'a str,
    pub source_id: i32,
    pub domain_tags: &'a [String],
    pub chunks: Vec<Chunk>,
}

/// Chunk, embed, and store content into rag_chunks.
async fn ingest_content(
    db: &PgPool,
    embeddings: &EmbeddingService,
    params: IngestParams<'_>,
) -> Result<(usize, usize)> {
    let total_chunks = params.chunks.len() as i32;
    let mut created = 0usize;
    let mut skipped = 0usize;

    for chunk in &params.chunks {
        let embedding = embeddings
            .embed(&chunk.content)
            .await
            .with_context(|| {
                format!(
                    "embedding failed for {} source_id={} chunk={}",
                    params.source_type, params.source_id, chunk.index
                )
            })?;

        let inserted = insert_chunk(
            db,
            InsertChunkParams {
                project_id: params.project_id,
                source_type: params.source_type,
                source_id: params.source_id,
                chunk,
                total_chunks,
                embedding: &embedding,
                domain_tags: params.domain_tags,
            },
        )
        .await?;

        if inserted {
            created += 1;
        } else {
            skipped += 1;
        }
    }

    Ok((created, skipped))
}

// ============================================================================
// Per-source ingestors
// ============================================================================

/// Ingest all WikiPages for a project.
pub async fn ingest_wiki(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
) -> Result<IngestResult> {
    let rows = sqlx::query_as::<_, (i32, String, String, Option<String>)>(
        r#"SELECT id, title, content, category FROM "WikiPage" WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .context("failed to fetch WikiPages")?;

    let mut result = IngestResult {
        source_type: "wiki".into(),
        chunks_created: 0,
        chunks_skipped: 0,
        errors: Vec::new(),
    };

    for (id, title, content, category) in &rows {
        let domain_tags = vec![
            "wiki".to_string(),
            category.clone().unwrap_or_default(),
        ];
        // Prepend title to content so chunks carry document context
        let titled_content = format!("# {}\n\n{}", title, content);
        let chunks = chunking::chunk_sections(&titled_content);

        match ingest_content(
            db, embeddings, IngestParams {
                project_id, source_type: "wiki", source_id: *id, domain_tags: &domain_tags, chunks,
            },
        )
        .await
        {
            Ok((created, skipped)) => {
                result.chunks_created += created;
                result.chunks_skipped += skipped;
            }
            Err(e) => result.errors.push(format!("wiki id={}: {}", id, e)),
        }
    }

    Ok(result)
}

/// Ingest all Tickets for a project.
pub async fn ingest_tickets(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
) -> Result<IngestResult> {
    let rows = sqlx::query_as::<_, (i32, String, Option<String>, String)>(
        r#"SELECT id, title, description, kind FROM "Ticket" WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .context("failed to fetch Tickets")?;

    let mut result = IngestResult {
        source_type: "ticket".into(),
        chunks_created: 0,
        chunks_skipped: 0,
        errors: Vec::new(),
    };

    for (id, title, description, kind) in &rows {
        let content = description.as_deref().unwrap_or("");
        if content.is_empty() && title.is_empty() {
            continue;
        }

        let domain_tags = vec!["ticket".to_string(), kind.clone()];
        let chunks = chunking::chunk_full(content, Some(title));

        match ingest_content(
            db, embeddings, IngestParams {
                project_id, source_type: "ticket", source_id: *id, domain_tags: &domain_tags, chunks,
            },
        )
        .await
        {
            Ok((created, skipped)) => {
                result.chunks_created += created;
                result.chunks_skipped += skipped;
            }
            Err(e) => result.errors.push(format!("ticket id={}: {}", id, e)),
        }
    }

    Ok(result)
}

/// Ingest all SOPs for a project.
pub async fn ingest_sops(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
) -> Result<IngestResult> {
    let rows = sqlx::query_as::<_, (i32, String, String, String)>(
        r#"SELECT id, title, content, category FROM "SOP" WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .context("failed to fetch SOPs")?;

    let mut result = IngestResult {
        source_type: "sop".into(),
        chunks_created: 0,
        chunks_skipped: 0,
        errors: Vec::new(),
    };

    for (id, _title, content, category) in &rows {
        let domain_tags = vec!["sop".to_string(), category.clone()];
        let chunks = chunking::chunk_sections(content);

        match ingest_content(
            db, embeddings, IngestParams {
                project_id, source_type: "sop", source_id: *id, domain_tags: &domain_tags, chunks,
            },
        )
        .await
        {
            Ok((created, skipped)) => {
                result.chunks_created += created;
                result.chunks_skipped += skipped;
            }
            Err(e) => result.errors.push(format!("sop id={}: {}", id, e)),
        }
    }

    Ok(result)
}

/// Ingest all Skills for a project.
pub async fn ingest_skills(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
) -> Result<IngestResult> {
    let rows = sqlx::query_as::<_, (i32, String, String, String)>(
        r#"SELECT id, title, content, category FROM "Skill" WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .context("failed to fetch Skills")?;

    let mut result = IngestResult {
        source_type: "skill".into(),
        chunks_created: 0,
        chunks_skipped: 0,
        errors: Vec::new(),
    };

    for (id, _title, content, category) in &rows {
        let domain_tags = vec!["skill".to_string(), category.clone()];
        let chunks = chunking::chunk_code_blocks(content);

        match ingest_content(
            db, embeddings, IngestParams {
                project_id, source_type: "skill", source_id: *id, domain_tags: &domain_tags, chunks,
            },
        )
        .await
        {
            Ok((created, skipped)) => {
                result.chunks_created += created;
                result.chunks_skipped += skipped;
            }
            Err(e) => result.errors.push(format!("skill id={}: {}", id, e)),
        }
    }

    Ok(result)
}

/// Ingest all Documents (onboarding session 2 outputs) for a project.
pub async fn ingest_documents(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
) -> Result<IngestResult> {
    // Documents are linked via OnboardingSession → Project
    let rows = sqlx::query_as::<_, (String, String, String, Option<String>)>(
        r#"
        SELECT d.id, d.filename, d.content, d.category
        FROM "Document" d
        JOIN "OnboardingSession" os ON d."onboardingSessionId" = os.id
        WHERE os."projectId" = $1
        "#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .context("failed to fetch Documents")?;

    let mut result = IngestResult {
        source_type: "document".into(),
        chunks_created: 0,
        chunks_skipped: 0,
        errors: Vec::new(),
    };

    for (id, filename, content, category) in &rows {
        let domain_tags = vec![
            "onboarding".to_string(),
            category.clone().unwrap_or_default(),
        ];
        let titled_content = format!("# {}\n\n{}", filename, content);
        let chunks = chunking::chunk_sections(&titled_content);

        // Document IDs are CUIDs (strings) — hash to stable i32 for source_id
        let id_hash = Sha256::digest(id.as_bytes());
        let source_id = i32::from_be_bytes([id_hash[0], id_hash[1], id_hash[2], id_hash[3]]);

        match ingest_content(
            db, embeddings, IngestParams {
                project_id, source_type: "document", source_id, domain_tags: &domain_tags, chunks,
            },
        )
        .await
        {
            Ok((created, skipped)) => {
                result.chunks_created += created;
                result.chunks_skipped += skipped;
            }
            Err(e) => result.errors.push(format!("document id={}: {}", id, e)),
        }
    }

    Ok(result)
}

/// Ingest all KnowledgeItems for a project.
pub async fn ingest_knowledge(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
) -> Result<IngestResult> {
    let rows = sqlx::query_as::<_, (i32, String, String, String)>(
        r#"SELECT id, title, content, category FROM "KnowledgeItem" WHERE "projectId" = $1 AND "archivedAt" IS NULL"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .context("failed to fetch KnowledgeItems")?;

    let mut result = IngestResult {
        source_type: "knowledge".into(),
        chunks_created: 0,
        chunks_skipped: 0,
        errors: Vec::new(),
    };

    for (id, title, content, category) in &rows {
        let domain_tags = vec!["knowledge".to_string(), category.clone()];
        let chunks = chunking::chunk_full(content, Some(title));

        match ingest_content(
            db, embeddings, IngestParams {
                project_id, source_type: "knowledge", source_id: *id, domain_tags: &domain_tags, chunks,
            },
        )
        .await
        {
            Ok((created, skipped)) => {
                result.chunks_created += created;
                result.chunks_skipped += skipped;
            }
            Err(e) => result.errors.push(format!("knowledge id={}: {}", id, e)),
        }
    }

    Ok(result)
}
