use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::{Extension, Json};
use std::time::Instant;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::rag::{
    IngestRequest, IngestResponse, IngestStatusResponse, SearchMetadata, SearchParams,
    SearchResponse,
};
use crate::state::AppState;

/// `POST /api/v1/rag/ingest` — Trigger content ingestion into the RAG index.
///
/// Accepts a source type and project ID. Spawns a background job to read
/// content from PostgreSQL, chunk it, generate embeddings, and insert into
/// the `rag_chunks` table.
pub async fn ingest(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<IngestRequest>,
) -> Result<(StatusCode, Json<IngestResponse>), AppError> {
    require_project_access(&auth, request.project_id)?;

    let job_id = Uuid::new_v4().to_string();

    // TODO: Spawn actual ingestion background task (ticket #250, #254)
    let _ = &state;

    Ok((
        StatusCode::ACCEPTED,
        Json(IngestResponse {
            job_id,
            status: "accepted".to_string(),
            source_type: request.source_type,
            project_id: request.project_id,
        }),
    ))
}

/// `GET /api/v1/rag/ingest/status` — Check ingestion job progress.
pub async fn ingest_status(
    State(state): State<AppState>,
    Query(params): Query<IngestStatusQuery>,
) -> Result<Json<IngestStatusResponse>, AppError> {
    let _ = &state;

    // TODO: Look up job in AppState job tracker (ticket #254)
    Ok(Json(IngestStatusResponse {
        job_id: params.job_id.unwrap_or_default(),
        status: "unknown".to_string(),
        processed: 0,
        total: 0,
        errors: Vec::new(),
    }))
}

#[derive(serde::Deserialize)]
pub struct IngestStatusQuery {
    pub job_id: Option<String>,
}

/// `GET /api/v1/rag/search` — Unified search across all indexed content.
///
/// Uses Reciprocal Rank Fusion (RRF) over pgvector cosine similarity and
/// tsvector BM25 keyword search. Optionally expands results via knowledge
/// graph relations.
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
