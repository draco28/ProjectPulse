use axum::extract::{Path, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::session::*;
use crate::response;
use crate::services::session_service;
use crate::state::AppState;

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<StartSessionRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let session = session_service::start_session(&state.db, req).await?;
    Ok(response::created(session))
}

pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<String>,
) -> Result<Response, AppError> {
    let session = session_service::get_session(&state.db, &id).await?;
    require_project_access(&auth, session.project_id)?;
    Ok(response::success(session))
}

pub async fn update(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<String>,
    Json(req): Json<UpdateSessionRequest>,
) -> Result<Response, AppError> {
    let existing = session_service::get_session(&state.db, &id).await?;
    require_project_access(&auth, existing.project_id)?;
    let session = session_service::update_session(&state.db, &id, req).await?;
    Ok(response::success(session))
}

pub async fn end(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<String>,
    Json(req): Json<EndSessionRequest>,
) -> Result<Response, AppError> {
    let existing = session_service::get_session(&state.db, &id).await?;
    require_project_access(&auth, existing.project_id)?;
    let session = session_service::end_session(&state.db, &id, req).await?;
    Ok(response::success(session))
}

pub async fn resume(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<String>,
) -> Result<Response, AppError> {
    let existing = session_service::get_session(&state.db, &id).await?;
    require_project_access(&auth, existing.project_id)?;
    let session = session_service::resume_session(&state.db, &id).await?;
    Ok(response::success(session))
}
