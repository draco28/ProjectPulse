use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::{Extension, Json};
use std::time::Instant;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::rag::{
    IngestRequest, IngestResponse, IngestStatusResponse, SearchMetadata, SearchParams,
    SearchResponse, SourceType,
};
use crate::services::ingestion;
use crate::services::relations;
use crate::state::AppState;

/// `POST /api/v1/rag/ingest` — Trigger content ingestion into the RAG index.
///
/// Spawns a background job to read content from PostgreSQL, chunk it,
/// generate embeddings, and insert into the `rag_chunks` table.
pub async fn ingest(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<IngestRequest>,
) -> Result<(StatusCode, Json<IngestResponse>), AppError> {
    require_project_access(&auth, request.project_id)?;

    let job_id = Uuid::new_v4().to_string();
    let project_id = request.project_id;

    // If inline content is provided, ingest synchronously (single document)
    if let Some(content) = &request.content {
        let source_type_str = serde_json::to_value(&request.source_type)
            .ok()
            .and_then(|v| v.as_str().map(str::to_string))
            .unwrap_or_else(|| "wiki".to_string());

        let title = request.title.as_deref();
        let source_id = request.source_id.unwrap_or(0);

        // Choose chunking strategy based on source type
        let chunks = match &request.source_type {
            SourceType::Wiki | SourceType::Sop | SourceType::Document => {
                let titled = if let Some(t) = title {
                    format!("# {}\n\n{}", t, content)
                } else {
                    content.clone()
                };
                crate::services::chunking::chunk_smart(&titled, 512)
            }
            SourceType::Skill => crate::services::chunking::chunk_code_blocks(content),
            _ => crate::services::chunking::chunk_full(content, title),
        };

        let domain_tags = vec![source_type_str.clone()];
        let ingest_params = crate::services::ingestion::IngestParams {
            project_id,
            source_type: &source_type_str,
            source_id,
            domain_tags: &domain_tags,
            chunks,
        };

        // Ingest synchronously — caller waits for completion
        crate::services::ingestion::ingest_content_public(
            &state.db,
            &state.embeddings,
            ingest_params,
        )
        .await
        .map_err(AppError::Internal)?;

        // Build relations for this project
        let _ = relations::build_all_relations(&state.db, project_id).await;

        return Ok((
            StatusCode::CREATED,
            Json(IngestResponse {
                job_id,
                status: "complete".to_string(),
                source_type: request.source_type,
                project_id,
            }),
        ));
    }

    // Bulk ingestion: register job THEN spawn background task (ordering prevents race)
    let job_id_clone = job_id.clone();
    let source_type = request.source_type.clone();

    state.register_job(&job_id).await;

    let db = state.db.clone();
    let embeddings = state.embeddings.clone();
    let jobs = state.jobs.clone();

    tokio::spawn(async move {
        let result = run_ingestion(&db, &embeddings, project_id, &source_type).await;

        let mut tracker = jobs.write().await;
        if let Some(job) = tracker.get_mut(&job_id_clone) {
            match result {
                Ok((processed, errors)) => {
                    job.status = "complete".to_string();
                    job.processed = processed;
                    job.total = processed;
                    job.errors = errors;
                }
                Err(e) => {
                    job.status = "failed".to_string();
                    job.errors = vec![format!("{:#}", e)];
                }
            }
        }
    });

    Ok((
        StatusCode::ACCEPTED,
        Json(IngestResponse {
            job_id,
            status: "accepted".to_string(),
            source_type: request.source_type,
            project_id,
        }),
    ))
}

/// Run the actual ingestion for a source type.
async fn run_ingestion(
    db: &sqlx::PgPool,
    embeddings: &crate::services::embeddings::EmbeddingService,
    project_id: i32,
    source_type: &SourceType,
) -> anyhow::Result<(usize, Vec<String>)> {
    let mut total_processed = 0;
    let mut all_errors = Vec::new();

    let types_to_ingest = match source_type {
        SourceType::All => vec![
            SourceType::Wiki,
            SourceType::Ticket,
            SourceType::Sop,
            SourceType::Skill,
            SourceType::Document,
            SourceType::Knowledge,
        ],
        other => vec![other.clone()],
    };

    for st in &types_to_ingest {
        let result = match st {
            SourceType::Wiki => ingestion::ingest_wiki(db, embeddings, project_id).await,
            SourceType::Ticket => ingestion::ingest_tickets(db, embeddings, project_id).await,
            SourceType::Sop => ingestion::ingest_sops(db, embeddings, project_id).await,
            SourceType::Skill => ingestion::ingest_skills(db, embeddings, project_id).await,
            SourceType::Document => ingestion::ingest_documents(db, embeddings, project_id).await,
            SourceType::Knowledge => ingestion::ingest_knowledge(db, embeddings, project_id).await,
            SourceType::All => unreachable!(),
        };

        match result {
            Ok(r) => {
                total_processed += r.chunks_created + r.chunks_skipped;
                all_errors.extend(r.errors);
            }
            Err(e) => all_errors.push(format!("{:?} ingestion failed: {:#}", st, e)),
        }
    }

    // Build knowledge graph relations after ingestion
    if let Err(e) = relations::build_all_relations(db, project_id).await {
        all_errors.push(format!("relation building failed: {:#}", e));
    }

    Ok((total_processed, all_errors))
}

/// `GET /api/v1/rag/ingest/status` — Check ingestion job progress.
pub async fn ingest_status(
    State(state): State<AppState>,
    Query(params): Query<IngestStatusQuery>,
) -> Result<Json<IngestStatusResponse>, AppError> {
    let job_id = params.job_id.unwrap_or_default();

    // Use write lock to allow cleanup of terminal jobs (prevents memory leak)
    let mut tracker = state.jobs.write().await;
    if let Some(job) = tracker.get(&job_id) {
        let response = IngestStatusResponse {
            job_id: job_id.clone(),
            status: job.status.clone(),
            processed: job.processed,
            total: job.total,
            errors: job.errors.clone(),
        };
        // Clean up terminal jobs after reading (prevents unbounded growth)
        if job.status == "complete" || job.status == "failed" {
            tracker.remove(&job_id);
        }
        Ok(Json(response))
    } else {
        Ok(Json(IngestStatusResponse {
            job_id,
            status: "unknown".to_string(),
            processed: 0,
            total: 0,
            errors: Vec::new(),
        }))
    }
}

#[derive(serde::Deserialize)]
pub struct IngestStatusQuery {
    pub job_id: Option<String>,
}

/// `GET /api/v1/rag/search` — Unified search across all indexed content.
pub async fn search(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<SearchParams>,
) -> Result<Json<SearchResponse>, AppError> {
    require_project_access(&auth, params.project_id)?;

    let start = Instant::now();
    let options = (&params).into();
    let query = params.query.as_deref().unwrap_or("");

    let results = state
        .rag
        .search(query, options)
        .await
        .map_err(AppError::Internal)?;

    let strategy = if query.is_empty() {
        "recent"
    } else {
        "hybrid"
    };

    Ok(Json(SearchResponse {
        results,
        metadata: SearchMetadata {
            strategy: strategy.to_string(),
            search_time_ms: start.elapsed().as_millis() as u64,
        },
    }))
}
