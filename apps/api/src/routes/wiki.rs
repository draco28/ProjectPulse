use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::wiki::*;
use crate::response;
use crate::services::validation::extract_project_id;
use crate::services::wiki_service;
use crate::state::AppState;

// ============================================================================
// POST /api/v1/wiki — create wiki page
// ============================================================================

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateWikiPageRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let page = wiki_service::create_page(&state.db, req).await?;
    Ok(response::created(page))
}

// ============================================================================
// GET /api/v1/wiki — list wiki pages
// ============================================================================

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListWikiParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let result = wiki_service::list_pages(
        &state.db,
        project_id,
        params.category.as_deref(),
        params.search.as_deref(),
        params.limit.unwrap_or(10),
        params.offset.unwrap_or(0),
    )
    .await?;
    Ok(response::success(result))
}

// ============================================================================
// GET /api/v1/wiki/analytics/summary — analytics summary
// ============================================================================

pub async fn analytics_summary(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<WikiPathParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let result = wiki_service::get_analytics_summary(&state.db, project_id).await?;
    Ok(response::success(result))
}

// ============================================================================
// POST /api/v1/wiki/generate — auto-generate from JSDoc (stub)
// ============================================================================

pub async fn generate(
    State(_state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<GenerateRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    // Stub — full JSDoc parsing is a Phase 4+ feature
    Ok(response::success(GenerateResponse {
        pages_created: 0,
        pages_updated: 0,
        pages_skipped: 0,
    }))
}

// ============================================================================
// Wildcard handlers: GET/PATCH/DELETE /api/v1/wiki/*path
//
// Dispatches based on path suffix:
// - /history → revision history
// - /revert  → revert to version (POST only, but we handle in PATCH dispatch)
// - otherwise → page CRUD
// ============================================================================

pub async fn wildcard_get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(raw_path): Path<String>,
    Query(params): Query<HistoryParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;

    // Check for /history suffix
    if let Some(page_path) = raw_path.strip_suffix("/history") {
        let result = wiki_service::get_history(
            &state.db,
            page_path,
            project_id,
            params.limit.unwrap_or(10),
            params.cursor,
        )
        .await?;
        return Ok(response::success(result));
    }

    // Regular page get
    let result = wiki_service::get_page(&state.db, &raw_path, project_id).await?;
    Ok(response::success(result))
}

pub async fn wildcard_patch(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(raw_path): Path<String>,
    Query(params): Query<WikiPathParams>,
    Json(req): Json<UpdateWikiPageRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let result = wiki_service::update_page(&state.db, &raw_path, project_id, req).await?;
    Ok(response::success(result))
}

pub async fn wildcard_delete(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(raw_path): Path<String>,
    Query(params): Query<WikiPathParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    wiki_service::delete_page(&state.db, &raw_path, project_id).await?;
    Ok(response::success(serde_json::json!({"deleted": true})))
}

/// POST handler for wildcard — handles /revert suffix.
pub async fn wildcard_post(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(raw_path): Path<String>,
    Query(params): Query<WikiPathParams>,
    Json(req): Json<RevertRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;

    if let Some(page_path) = raw_path.strip_suffix("/revert") {
        let result = wiki_service::revert_to_version(&state.db, page_path, project_id, req.version).await?;
        return Ok(response::success(result));
    }

    Err(AppError::NotFound(format!("unknown wiki POST path: {}", raw_path)))
}
