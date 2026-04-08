//! Observability endpoints for onboarding session logging.
//!
//! POST /api/v1/observability/log-step — log an onboarding step
//! POST /api/v1/observability/complete-session — complete an onboarding session

use axum::extract::State;
use axum::response::Response;
use axum::Extension;
use axum::Json;
use serde::Deserialize;
use serde_json::Value;

use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::response;
use crate::services::validation::extract_project_id;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogStepRequest {
    pub project_id: Option<i32>,
    pub session_number: i32,
    pub step_name: String,
    pub status: String,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteSessionRequest {
    pub project_id: Option<i32>,
    pub session_number: i32,
    pub summary: Option<String>,
}

pub async fn log_step(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<LogStepRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, req.project_id)?;

    sqlx::query(
        r#"UPDATE "OnboardingSession"
           SET "planningAnswers" = COALESCE("planningAnswers", '[]'::jsonb) || $3::jsonb,
               "updatedAt" = NOW()
           WHERE "projectId" = $1 AND "sessionNumber" = $2"#,
    )
    .bind(project_id)
    .bind(req.session_number)
    .bind(serde_json::json!([{
        "step": req.step_name,
        "status": req.status,
        "metadata": req.metadata,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }]))
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::success(serde_json::json!({ "logged": true })))
}

pub async fn complete_session(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CompleteSessionRequest>,
) -> Result<Response, AppError> {
    let project_id = extract_project_id(&auth, req.project_id)?;

    let result = sqlx::query(
        r#"UPDATE "OnboardingSession"
           SET status = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW()
           WHERE "projectId" = $1 AND "sessionNumber" = $2 AND status != 'COMPLETED'"#,
    )
    .bind(project_id)
    .bind(req.session_number)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "onboarding session {} not found or already completed",
            req.session_number
        )));
    }

    Ok(response::success(serde_json::json!({
        "completed": true,
        "sessionNumber": req.session_number
    })))
}
