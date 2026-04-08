//! POST /api/v1/agent-auth/validate — Token validation for MCP auth middleware.
//!
//! Called by the Python MCP server on every authenticated request.
//! This is a PUBLIC route (no auth middleware) since it IS the auth check.

use axum::extract::State;
use axum::response::Response;
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::response;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct ValidateRequest {
    pub token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateResponse {
    pub project_id: i32,
    pub token_id: i32,
    pub name: String,
    pub blocked_tools: Vec<String>,
    pub allowed_tools: Vec<String>,
}

pub async fn validate(
    State(state): State<AppState>,
    Json(req): Json<ValidateRequest>,
) -> Result<Response, AppError> {
    if req.token.trim().is_empty() {
        return Err(AppError::Validation("token is required".into()));
    }

    // Look up the token by comparing bcrypt hashes
    let tokens = sqlx::query_as::<_, (i32, i32, String, String, Vec<String>, Vec<String>, bool)>(
        r#"SELECT id, "projectId", name, "tokenHash", "blockedTools", "allowedTools", revoked
           FROM project_tokens
           WHERE revoked = false"#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    for (id, project_id, name, hash, blocked, allowed, _revoked) in tokens {
        if bcrypt::verify(&req.token, &hash).unwrap_or(false) {
            return Ok(response::success(ValidateResponse {
                project_id,
                token_id: id,
                name,
                blocked_tools: blocked,
                allowed_tools: allowed,
            }));
        }
    }

    Err(AppError::Unauthorized)
}
