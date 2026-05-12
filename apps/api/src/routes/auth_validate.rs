//! POST /api/v1/agent-auth/validate — Token validation for MCP auth middleware.
//!
//! Called by the Python MCP server on every authenticated request.
//! This is a PUBLIC route (no auth middleware) since it IS the auth check.
//!
//! Sprint 9: Optimized from O(N x 100ms) to ~O(1) via `token_prefix` narrowing.
//! Legacy tokens with NULL prefix fall back to full scan for backward compat.

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
    #[sqlx(rename = "projectId")]
    project_id: i32,
    name: String,
    #[sqlx(rename = "tokenHash")]
    token_hash: String,
    #[sqlx(rename = "blockedTools")]
    blocked_tools: Vec<String>,
    #[sqlx(rename = "allowedTools")]
    allowed_tools: Vec<String>,
}

pub async fn validate(
    State(state): State<AppState>,
    Json(req): Json<ValidateRequest>,
) -> Result<Response, AppError> {
    if req.token.trim().is_empty() {
        return Err(AppError::Validation("token is required".into()));
    }

    // Compute prefix (first 8 chars). Char-boundary-safe via take.
    let prefix: String = req.token.chars().take(8).collect();

    // Query: narrow by prefix first (indexed), fall through to NULL-prefix
    // tokens for backward compat with legacy tokens.
    let tokens = sqlx::query_as::<_, TokenRow>(
        r#"SELECT id, "projectId", name, "tokenHash", "blockedTools", "allowedTools"
           FROM project_tokens
           WHERE "isRevoked" = false
             AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
             AND (token_prefix = $1 OR token_prefix IS NULL)"#,
    )
    .bind(&prefix)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    for row in tokens {
        if bcrypt::verify(&req.token, &row.token_hash).unwrap_or(false) {
            // Backfill prefix for legacy tokens on first successful validation
            // (so subsequent requests get the fast path).
            // Issue 1 fix: log backfill failures instead of silently discarding —
            // otherwise a legacy token with a flaky write stays on the slow path forever
            // with no operator visibility.
            let db = state.db.clone();
            let token_id = row.id;
            let prefix_clone = prefix.clone();
            tokio::spawn(async move {
                if let Err(e) = sqlx::query(
                    r#"UPDATE project_tokens
                       SET "lastUsedAt" = NOW(),
                           token_prefix = COALESCE(token_prefix, $2)
                       WHERE id = $1"#,
                )
                .bind(token_id)
                .bind(&prefix_clone)
                .execute(&db)
                .await
                {
                    tracing::warn!(token_id, error = %e, "token prefix backfill failed");
                }
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
