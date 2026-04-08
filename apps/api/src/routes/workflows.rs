use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::Extension;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::response;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

// ============================================================================
// Models
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListWorkflowsParams {
    pub project_id: Option<i32>,
    pub category: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartWorkflowRequest {
    pub project_id: i32,
    pub template_id: i32,
    pub context: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteStepRequest {
    pub output: Option<Value>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PauseRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteRequest {
    pub summary: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkflowTemplate {
    id: i32,
    name: String,
    description: Option<String>,
    category: Option<String>,
    steps: Value,
    step_count: i32,
    is_active: bool,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkflowRun {
    id: i32,
    template_id: i32,
    status: String,
    current_step: i32,
    context: Option<Value>,
    created_at: String,
    updated_at: String,
}

// ============================================================================
// GET /api/v1/workflows — list workflow templates
// ============================================================================

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListWorkflowsParams>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, params.project_id)?;
    require_project_access(&auth, project_id)?;
    let is_active = params.is_active.unwrap_or(true);

    let (category_filter, has_cat) = match &params.category {
        Some(_) => ("AND category = $3", true),
        None => ("", false),
    };

    let sql = format!(
        r#"SELECT id, name, description, category, steps, "isActive",
                  "createdAt"::text, "updatedAt"::text
           FROM "WorkflowTemplate"
           WHERE "projectId" = $1 AND "isActive" = $2 {}
           ORDER BY category ASC, name ASC"#,
        category_filter
    );

    let mut q = sqlx::query_as::<_, (i32, String, Option<String>, Option<String>, Value, bool, String, String)>(&sql)
        .bind(project_id)
        .bind(is_active);

    if has_cat {
        q = q.bind(params.category.as_ref().unwrap());
    }

    let rows = q.fetch_all(&state.db).await.map_err(AppError::Database)?;

    let templates: Vec<WorkflowTemplate> = rows.into_iter().map(|r| {
        let step_count = r.4.as_array().map(|a| a.len() as i32).unwrap_or(0);
        WorkflowTemplate {
            id: r.0, name: r.1, description: r.2, category: r.3,
            steps: r.4, step_count, is_active: r.5,
            created_at: r.6, updated_at: r.7,
        }
    }).collect();

    Ok(response::success(serde_json::json!({ "templates": templates })))
}

// ============================================================================
// POST /api/v1/workflows/run — start workflow run
// ============================================================================

pub async fn start(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<StartWorkflowRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;

    let row: (i32, String, String) = sqlx::query_as(
        r#"INSERT INTO "WorkflowRun" ("templateId", "projectId", status, "currentStep",
                                       context, "createdAt", "updatedAt")
           VALUES ($1, $2, 'IN_PROGRESS', 0, $3, NOW(), NOW())
           RETURNING id, "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(req.template_id)
    .bind(req.project_id)
    .bind(&req.context)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::created(WorkflowRun {
        id: row.0, template_id: req.template_id, status: "IN_PROGRESS".into(),
        current_step: 0, context: req.context, created_at: row.1, updated_at: row.2,
    }))
}

// ============================================================================
// POST /api/v1/workflows/run/:id/execute — execute next step
// ============================================================================

pub async fn execute_step(
    State(state): State<AppState>,
    Extension(_auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<ExecuteStepRequest>,
) -> Result<Response, AppError> {
    let row: (i32, String, String) = sqlx::query_as(
        r#"UPDATE "WorkflowRun"
           SET "currentStep" = "currentStep" + 1, context = COALESCE($2, context),
               "updatedAt" = NOW()
           WHERE id = $1 AND status = 'IN_PROGRESS'
           RETURNING "currentStep", "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(id)
    .bind(&req.output)
    .fetch_one(&state.db)
    .await
    .map_err(|_| AppError::NotFound(format!("workflow run {} not found or not in progress", id)))?;

    Ok(response::success(serde_json::json!({
        "runId": id, "currentStep": row.0, "updatedAt": row.2
    })))
}

// ============================================================================
// GET /api/v1/workflows/run/:id — get run status
// ============================================================================

pub async fn get_status(
    State(state): State<AppState>,
    Extension(_auth): Extension<AuthContext>,
    Path(id): Path<i32>,
) -> Result<Response, AppError> {
    let row: Option<(i32, i32, String, i32, Option<Value>, String, String)> = sqlx::query_as(
        r#"SELECT id, "templateId", status, "currentStep", context,
                  "createdAt"::text, "updatedAt"::text
           FROM "WorkflowRun" WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(response::success(WorkflowRun {
            id: r.0, template_id: r.1, status: r.2, current_step: r.3,
            context: r.4, created_at: r.5, updated_at: r.6,
        })),
        None => Err(AppError::NotFound(format!("workflow run {} not found", id))),
    }
}

// ============================================================================
// POST /api/v1/workflows/run/:id/pause
// ============================================================================

pub async fn pause(
    State(state): State<AppState>,
    Extension(_auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(_req): Json<PauseRequest>,
) -> Result<Response, AppError> {
    let result = sqlx::query(
        r#"UPDATE "WorkflowRun" SET status = 'PAUSED', "updatedAt" = NOW()
           WHERE id = $1 AND status = 'IN_PROGRESS'"#,
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("workflow run {} not found or not in progress", id)));
    }
    Ok(response::success(serde_json::json!({ "status": "paused", "runId": id })))
}

// ============================================================================
// POST /api/v1/workflows/run/:id/resume
// ============================================================================

pub async fn resume(
    State(state): State<AppState>,
    Extension(_auth): Extension<AuthContext>,
    Path(id): Path<i32>,
) -> Result<Response, AppError> {
    let result = sqlx::query(
        r#"UPDATE "WorkflowRun" SET status = 'IN_PROGRESS', "updatedAt" = NOW()
           WHERE id = $1 AND status = 'PAUSED'"#,
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("workflow run {} not found or not paused", id)));
    }
    Ok(response::success(serde_json::json!({ "status": "in_progress", "runId": id })))
}

// ============================================================================
// POST /api/v1/workflows/run/:id/complete
// ============================================================================

pub async fn complete(
    State(state): State<AppState>,
    Extension(_auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(_req): Json<CompleteRequest>,
) -> Result<Response, AppError> {
    let result = sqlx::query(
        r#"UPDATE "WorkflowRun" SET status = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW()
           WHERE id = $1 AND status IN ('IN_PROGRESS', 'PAUSED')"#,
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("workflow run {} not found or already completed", id)));
    }
    Ok(response::success(serde_json::json!({ "status": "completed", "runId": id })))
}
