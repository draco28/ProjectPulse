use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::skill::*;
use crate::response;
use crate::services::pagination::Pagination;
use crate::services::resource_service;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateSkillRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let item = resource_service::create_skill(&state.db, req).await?;
    Ok(response::created(item))
}

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListSkillsParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let pagination = Pagination::from_params(params.page, params.page_size);
    let result = resource_service::list_skills(&state.db, project_id, params.category.as_deref(), &pagination).await?;
    Ok(response::success(result))
}

pub async fn search(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<SearchSkillsParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let query = params.query.as_deref().unwrap_or("");
    let result = resource_service::search_skills(&state.db, project_id, query, params.category.as_deref(), params.limit.unwrap_or(10)).await?;
    Ok(response::success(result))
}

pub async fn get_by_slug(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(slug): Path<String>,
    Query(params): Query<GetBySlugParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::get_skill_by_slug(&state.db, &slug, project_id).await?;
    Ok(response::success(item))
}

pub async fn update(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(slug): Path<String>,
    Query(params): Query<GetBySlugParams>,
    Json(req): Json<UpdateSkillRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let item = resource_service::update_skill(&state.db, &slug, project_id, req).await?;
    Ok(response::success(item))
}
