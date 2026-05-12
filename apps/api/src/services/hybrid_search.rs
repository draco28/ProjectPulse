//! Sprint 9: Shared hybrid search module.
//!
//! Extracted from `services::rag_search::PgVectorRagService` so both the
//! production RAG endpoint and PulseHive agent tools share the same RRF
//! implementation (previously duplicated).
//!
//! Operates on the `rag_chunks` table populated by the ingestion pipeline.

use std::collections::HashMap;

use anyhow::Result;
use sqlx::PgPool;

use crate::services::embeddings::EmbeddingService;

/// Row returned from a single-strategy search.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ChunkSearchRow {
    pub id: i32,
    pub content: String,
    pub source_type: String,
    pub source_id: i32,
    pub section_title: Option<String>,
    pub domain_tags: Vec<String>,
    #[allow(dead_code)]
    pub similarity: f64,
}

/// Final merged result with an RRF score.
#[derive(Debug, Clone)]
pub struct ScoredChunk {
    pub id: i32,
    pub content: String,
    pub source_type: String,
    pub source_id: i32,
    pub section_title: Option<String>,
    pub domain_tags: Vec<String>,
    pub rrf_score: f64,
}

/// Semantic search via pgvector cosine similarity.
///
/// `query_embedding`: pre-computed embedding for the query (use `EmbeddingService::embed`).
/// `source_types`: optional filter, e.g. `Some(vec!["wiki".into(), "ticket".into()])`.
pub async fn search_semantic(
    db: &PgPool,
    query_embedding: &[f32],
    project_id: i32,
    limit: usize,
    source_types: Option<&[String]>,
) -> Result<Vec<ChunkSearchRow>> {
    let embedding_str = format!(
        "[{}]",
        query_embedding
            .iter()
            .map(|f| f.to_string())
            .collect::<Vec<_>>()
            .join(",")
    );

    let rows = if let Some(types) = source_types {
        sqlx::query_as::<_, ChunkSearchRow>(
            r#"
            SELECT id, content, source_type, source_id, section_title, domain_tags,
                   (1.0 - (embedding <=> $1::vector))::float8 AS similarity
            FROM rag_chunks
            WHERE project_id = $2 AND source_type = ANY($4)
            ORDER BY embedding <=> $1::vector
            LIMIT $3
            "#,
        )
        .bind(&embedding_str)
        .bind(project_id)
        .bind(limit as i64)
        .bind(types)
        .fetch_all(db)
        .await?
    } else {
        sqlx::query_as::<_, ChunkSearchRow>(
            r#"
            SELECT id, content, source_type, source_id, section_title, domain_tags,
                   (1.0 - (embedding <=> $1::vector))::float8 AS similarity
            FROM rag_chunks
            WHERE project_id = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
            "#,
        )
        .bind(&embedding_str)
        .bind(project_id)
        .bind(limit as i64)
        .fetch_all(db)
        .await?
    };

    Ok(rows)
}

/// Keyword search via tsvector + `ts_rank_cd`.
pub async fn search_keyword(
    db: &PgPool,
    query: &str,
    project_id: i32,
    limit: usize,
    source_types: Option<&[String]>,
) -> Result<Vec<ChunkSearchRow>> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let rows = if let Some(types) = source_types {
        sqlx::query_as::<_, ChunkSearchRow>(
            r#"
            SELECT id, content, source_type, source_id, section_title, domain_tags,
                   ts_rank_cd(content_tsv, plainto_tsquery('english', $1))::float8 AS similarity
            FROM rag_chunks
            WHERE project_id = $2
              AND content_tsv @@ plainto_tsquery('english', $1)
              AND source_type = ANY($4)
            ORDER BY similarity DESC
            LIMIT $3
            "#,
        )
        .bind(query)
        .bind(project_id)
        .bind(limit as i64)
        .bind(types)
        .fetch_all(db)
        .await?
    } else {
        sqlx::query_as::<_, ChunkSearchRow>(
            r#"
            SELECT id, content, source_type, source_id, section_title, domain_tags,
                   ts_rank_cd(content_tsv, plainto_tsquery('english', $1))::float8 AS similarity
            FROM rag_chunks
            WHERE project_id = $2
              AND content_tsv @@ plainto_tsquery('english', $1)
            ORDER BY similarity DESC
            LIMIT $3
            "#,
        )
        .bind(query)
        .bind(project_id)
        .bind(limit as i64)
        .fetch_all(db)
        .await?
    };

    Ok(rows)
}

/// Fallback for empty queries — most recent chunks ordered by `created_at DESC`.
pub async fn search_recent(
    db: &PgPool,
    project_id: i32,
    limit: usize,
) -> Result<Vec<ChunkSearchRow>> {
    let rows = sqlx::query_as::<_, ChunkSearchRow>(
        r#"
        SELECT id, content, source_type, source_id, section_title, domain_tags,
               0.5::float8 AS similarity
        FROM rag_chunks
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(project_id)
    .bind(limit as i64)
    .fetch_all(db)
    .await?;

    Ok(rows)
}

/// Merge semantic + keyword results via Reciprocal Rank Fusion (RRF).
///
/// RRF score = `1/(k + rank_semantic) + 1/(k + rank_keyword)`, with k=60.
///
/// This is the canonical RRF formula from Cormack/Clarke/Buettcher (2009).
/// k=60 is the value recommended in the original paper.
pub fn merge_rrf(
    semantic: Vec<ChunkSearchRow>,
    keyword: Vec<ChunkSearchRow>,
    limit: usize,
) -> Vec<ScoredChunk> {
    const K: f64 = 60.0;
    let mut scores: HashMap<i32, ScoredChunk> = HashMap::new();

    for (rank, row) in semantic.into_iter().enumerate() {
        let rrf = 1.0 / (K + rank as f64 + 1.0);
        scores
            .entry(row.id)
            .or_insert_with(|| ScoredChunk {
                id: row.id,
                content: row.content,
                source_type: row.source_type,
                source_id: row.source_id,
                section_title: row.section_title,
                domain_tags: row.domain_tags,
                rrf_score: 0.0,
            })
            .rrf_score += rrf;
    }

    for (rank, row) in keyword.into_iter().enumerate() {
        let rrf = 1.0 / (K + rank as f64 + 1.0);
        scores
            .entry(row.id)
            .or_insert_with(|| ScoredChunk {
                id: row.id,
                content: row.content,
                source_type: row.source_type,
                source_id: row.source_id,
                section_title: row.section_title,
                domain_tags: row.domain_tags,
                rrf_score: 0.0,
            })
            .rrf_score += rrf;
    }

    let mut results: Vec<ScoredChunk> = scores.into_values().collect();
    results.sort_by(|a, b| {
        b.rrf_score
            .partial_cmp(&a.rrf_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(limit);
    results
}

/// One-shot hybrid search: runs semantic + keyword in parallel, merges via RRF.
///
/// If `query` is empty, falls back to recent chunks.
pub async fn hybrid_search(
    db: &PgPool,
    embeddings: &EmbeddingService,
    query: &str,
    project_id: i32,
    limit: usize,
    source_types: Option<&[String]>,
) -> Result<Vec<ScoredChunk>> {
    if query.trim().is_empty() {
        let recent = search_recent(db, project_id, limit).await?;
        return Ok(recent
            .into_iter()
            .enumerate()
            .map(|(i, row)| ScoredChunk {
                id: row.id,
                content: row.content,
                source_type: row.source_type,
                source_id: row.source_id,
                section_title: row.section_title,
                domain_tags: row.domain_tags,
                rrf_score: 1.0 / (1.0 + i as f64),
            })
            .collect());
    }

    let query_embedding = embeddings.embed(query).await?;
    let over_fetch = (limit * 2).min(100);

    let (semantic, keyword) = tokio::try_join!(
        search_semantic(db, &query_embedding, project_id, over_fetch, source_types),
        search_keyword(db, query, project_id, over_fetch, source_types),
    )?;

    Ok(merge_rrf(semantic, keyword, limit))
}
