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

#[derive(Debug, sqlx::FromRow)]
struct TokenRow {
    id: i32,
    project_id: i32,
    name: String,
    token_hash: String,
    blocked_tools: Vec<String>,
    allowed_tools: Vec<String>,
}

pub async fn validate(
    State(state): State<AppState>,
    Json(req): Json<ValidateRequest>,
) -> Result<Response, AppError> {
    if req.token.trim().is_empty() {
        return Err(AppError::Validation("token is required".into()));
    }

    // Query non-revoked, non-expired tokens (matches auth middleware pattern)
    let tokens = sqlx::query_as::<_, TokenRow>(
        r#"SELECT id, project_id, name, token_hash, blocked_tools, allowed_tools
           FROM project_tokens
           WHERE is_revoked = false
           AND (expires_at IS NULL OR expires_at > NOW())"#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    for row in tokens {
        if bcrypt::verify(&req.token, &row.token_hash).unwrap_or(false) {
            // Update last_used_at (fire-and-forget)
            let db = state.db.clone();
            let token_id = row.id;
            tokio::spawn(async move {
                let _ = sqlx::query("UPDATE project_tokens SET last_used_at = NOW() WHERE id = $1")
                    .bind(token_id)
                    .execute(&db)
                    .await;
            });

            return Ok(response::success(ValidateResponse {
                project_id: row.project_id,
                token_id: row.id,
                name: row.name,
                blocked_tools: row.blocked_tools,
                allowed_tools: row.allowed_tools,
            }));
        }
    }

    Err(AppError::Unauthorized)
}
