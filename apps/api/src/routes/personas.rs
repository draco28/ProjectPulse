use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::persona::*;
use crate::response;
use crate::services::pagination::Pagination;
use crate::services::resource_service;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreatePersonaRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let item = resource_service::create_persona(&state.db, req).await?;
    Ok(response::created(item))
}

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListPersonasParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let pagination = Pagination::from_params(params.page, params.page_size);
    let result = resource_service::list_personas(&state.db, project_id, params.is_active, &pagination).await?;
    Ok(response::success(result))
}

pub async fn get_by_id(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Query(params): Query<GetPersonaParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::get_persona_by_id(&state.db, id, project_id).await?;
    Ok(response::success(item))
}

pub async fn get_by_slug(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(slug): Path<String>,
    Query(params): Query<GetPersonaParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::get_persona_by_slug(&state.db, &slug, project_id).await?;
    Ok(response::success(item))
}

pub async fn update(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Query(params): Query<GetPersonaParams>,
    Json(req): Json<UpdatePersonaRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::update_persona(&state.db, id, project_id, req).await?;
    Ok(response::success(item))
}
