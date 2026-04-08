use axum::extract::{Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::context::*;
use crate::response;
use crate::services::context_service;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

/// GET /api/v1/context/load — load all memory banks + sessions + resources + hints.
pub async fn load(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ContextLoadParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let banks_to_load = params.banks_to_load.as_deref().unwrap_or("all");
    let result = context_service::load_full_context(&state.db, project_id, banks_to_load).await?;
    Ok(response::success(result))
}

/// PUT /api/v1/context/update — update a single memory bank.
pub async fn update(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<ContextUpdateRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let mode = req.mode.as_deref().unwrap_or("replace");
    let result = context_service::update_bank(&state.db, req.project_id, &req.bank_type, &req.content, mode).await?;
    Ok(response::success(result))
}

/// GET /api/v1/memory/session-start — simplified context (banks only).
pub async fn session_start(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ContextLoadParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let banks = context_service::load_memory_banks(&state.db, project_id, "all").await?;
    Ok(response::success(banks))
}

/// GET /api/v1/memory/pattern-lookup — single bank by type.
pub async fn pattern_lookup(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<PatternLookupParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let bank_type = params.bank_type.as_deref()
        .ok_or_else(|| AppError::Validation("bankType is required".into()))?;
    let result = context_service::lookup_bank(&state.db, project_id, bank_type).await?;
    Ok(response::success(result))
}

/// GET /api/v1/memory/context-recovery — ACTIVE_CONTEXT + PROGRESS only.
pub async fn context_recovery(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ContextRecoveryParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let result = context_service::context_recovery(&state.db, project_id).await?;
    Ok(response::success(result))
}
