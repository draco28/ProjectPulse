use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::sop::*;
use crate::response;
use crate::services::pagination::Pagination;
use crate::services::resource_service;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateSopRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let item = resource_service::create_sop(&state.db, req).await?;
    Ok(response::created(item))
}

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListSopsParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let pagination = Pagination::from_params(params.page, params.page_size);
    let result = resource_service::list_sops(&state.db, project_id, params.category.as_deref(), &pagination).await?;
    Ok(response::success(result))
}

pub async fn get_by_id(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Query(params): Query<GetByIdOrSlugParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::get_sop_by_id(&state.db, id, project_id).await?;
    Ok(response::success(item))
}

pub async fn get_by_slug(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(slug): Path<String>,
    Query(params): Query<GetByIdOrSlugParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::get_sop_by_slug(&state.db, &slug, project_id).await?;
    Ok(response::success(item))
}

pub async fn update(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Query(params): Query<GetByIdOrSlugParams>,
    Json(req): Json<UpdateSopRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::update_sop(&state.db, id, project_id, req).await?;
    Ok(response::success(item))
}
