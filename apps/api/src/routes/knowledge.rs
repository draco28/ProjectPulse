use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::knowledge::*;
use crate::response;
use crate::services::knowledge_service;
use crate::services::pagination::Pagination;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

// ============================================================================
// POST /api/v1/knowledge — create knowledge item
// ============================================================================

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateKnowledgeRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let item = knowledge_service::create_item(&state.db, &state.embeddings, req).await?;
    Ok(response::created(item))
}

// ============================================================================
// GET /api/v1/knowledge — list knowledge items
// ============================================================================

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListKnowledgeParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let pagination = Pagination::from_params(params.page, params.page_size);
    let result = knowledge_service::list_items(
        &state.db,
        project_id,
        params.search.as_deref(),
        params.tag.as_deref(),
        params.category.as_deref(),
        params.sort.as_deref(),
        params.include_archived.unwrap_or(false),
        &pagination,
    )
    .await?;
    Ok(response::success(result))
}

// ============================================================================
// GET /api/v1/knowledge/:id — get knowledge item by ID
// ============================================================================

pub async fn get_by_id(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Query(params): Query<ListKnowledgeParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = knowledge_service::get_item(&state.db, id, project_id).await?;
    Ok(response::success(item))
}

// ============================================================================
// POST /api/v1/knowledge/:id/archive — toggle archive status
// ============================================================================

pub async fn archive(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<ArchiveRequest>,
) -> Result<Response, AppError> {
    let project_id = get_project_from_item(&state.db, id).await?;
    require_project_access(&auth, project_id)?;
    let item = knowledge_service::toggle_archive(&state.db, id, project_id, req.archive).await?;
    Ok(response::success(item))
}

// ============================================================================
// GET /api/v1/knowledge/search — hybrid search
// ============================================================================

pub async fn search(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<SearchKnowledgeParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let query = params.query.as_deref().unwrap_or("");
    let mode = params.mode.as_deref().unwrap_or("hybrid");
    let limit = params.limit.unwrap_or(5);
    let result = knowledge_service::search(
        &state.db,
        &state.embeddings,
        project_id,
        query,
        mode,
        limit,
        params.category.as_deref(),
    )
    .await?;
    Ok(response::success(result))
}

// ============================================================================
// GET /api/v1/knowledge/related — graph traversal
// ============================================================================

pub async fn related(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<RelatedKnowledgeParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item_id = params.item_id.ok_or_else(|| AppError::Validation("itemId is required".into()))?;
    let result = knowledge_service::get_related(
        &state.db,
        item_id,
        project_id,
        params.max_depth.unwrap_or(2),
        params.limit.unwrap_or(10),
        params.min_strength.unwrap_or(0.5),
    )
    .await?;
    Ok(response::success(result))
}

// ============================================================================
// GET /api/v1/knowledge/metrics — analytics
// ============================================================================

pub async fn metrics(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<MetricsParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let result = knowledge_service::get_metrics(&state.db, project_id).await?;
    Ok(response::success(result))
}

// ============================================================================
// GET /api/v1/knowledge/export — export items
// ============================================================================

pub async fn export(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ExportParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let items = knowledge_service::export_items(&state.db, project_id).await?;
    Ok(response::success(items))
}

// ============================================================================
// POST /api/v1/knowledge/import — import items
// ============================================================================

pub async fn import(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<ImportKnowledgeRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let result = knowledge_service::import_items(&state.db, &state.embeddings, req.project_id, req.items).await?;
    Ok(response::success(result))
}

// ============================================================================
// Helpers
// ============================================================================

async fn get_project_from_item(db: &sqlx::PgPool, id: i32) -> Result<i32, AppError> {
    let row: Option<(i32,)> = sqlx::query_as(
        r#"SELECT "projectId" FROM knowledge_items WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    row.map(|r| r.0)
        .ok_or_else(|| AppError::NotFound(format!("knowledge item {} not found", id)))
}
