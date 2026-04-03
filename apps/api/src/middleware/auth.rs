use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserRole {
    #[serde(rename = "USER")]
    User,
    #[serde(rename = "ADMIN")]
    Admin,
}

/// Authentication context extracted from the Authorization header.
///
/// Supports two auth modes:
/// - **JWT** (web users): Decoded from NextAuth JWT using NEXTAUTH_SECRET
/// - **Bearer** (MCP agents): bcrypt-compared against project_tokens table
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum AuthContext {
    User {
        user_id: String,
        email: String,
        role: UserRole,
    },
    Agent {
        project_id: i32,
        token_id: i32,
        token_name: String,
        blocked_tools: Vec<String>,
        allowed_tools: Vec<String>,
    },
}

#[derive(Debug, Deserialize)]
struct JwtClaims {
    sub: String,
    email: Option<String>,
    role: Option<String>,
}

/// Middleware that extracts auth context and injects it into request extensions.
///
/// Protected routes should use this via:
/// ```rust,ignore
/// Router::new().route("/api/v1/...", get(handler)).layer(
///     axum::middleware::from_fn_with_state(state, require_auth)
/// )
/// ```
pub async fn require_auth(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    let Some(header) = auth_header else {
        return unauthorized_response();
    };

    if !header.starts_with("Bearer ") {
        return unauthorized_response();
    }

    let token = &header[7..];

    // Try JWT first (starts with "eyJ" = base64-encoded JSON header)
    let auth = if token.starts_with("eyJ") {
        match decode_jwt(token, &state.config.nextauth_secret) {
            Ok(ctx) => ctx,
            Err(_) => return unauthorized_response(),
        }
    } else {
        // Try opaque bearer token (bcrypt against project_tokens table)
        match validate_bearer_token(&state.db, token).await {
            Ok(ctx) => ctx,
            Err(_) => return unauthorized_response(),
        }
    };

    // Inject AuthContext into request extensions for handlers
    request.extensions_mut().insert(auth);
    next.run(request).await
}

fn unauthorized_response() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "unauthorized"})),
    )
        .into_response()
}

fn decode_jwt(token: &str, secret: &str) -> Result<AuthContext, ()> {
    let key = jsonwebtoken::DecodingKey::from_secret(secret.as_bytes());
    let validation = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256);

    let token_data = jsonwebtoken::decode::<JwtClaims>(token, &key, &validation).map_err(|_| ())?;

    let claims = token_data.claims;
    let role = match claims.role.as_deref() {
        Some("ADMIN") => UserRole::Admin,
        _ => UserRole::User,
    };

    Ok(AuthContext::User {
        user_id: claims.sub,
        email: claims.email.unwrap_or_default(),
        role,
    })
}

async fn validate_bearer_token(pool: &PgPool, token: &str) -> Result<AuthContext, ()> {
    let rows = sqlx::query_as::<_, TokenRow>(
        r#"
        SELECT id, project_id, name, token_hash, blocked_tools, allowed_tools
        FROM project_tokens
        WHERE is_revoked = false
        AND (expires_at IS NULL OR expires_at > NOW())
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "failed to query project tokens");
    })?;

    for row in rows {
        if bcrypt::verify(token, &row.token_hash).unwrap_or(false) {
            // Update last_used_at (fire-and-forget)
            let pool = pool.clone();
            let token_id = row.id;
            tokio::spawn(async move {
                let _ = sqlx::query("UPDATE project_tokens SET last_used_at = NOW() WHERE id = $1")
                    .bind(token_id)
                    .execute(&pool)
                    .await;
            });

            return Ok(AuthContext::Agent {
                project_id: row.project_id,
                token_id: row.id,
                token_name: row.name,
                blocked_tools: row.blocked_tools,
                allowed_tools: row.allowed_tools,
            });
        }
    }

    Err(())
}

#[derive(sqlx::FromRow)]
struct TokenRow {
    id: i32,
    project_id: i32,
    name: String,
    token_hash: String,
    blocked_tools: Vec<String>,
    allowed_tools: Vec<String>,
}

/// Helper: verify the auth context has access to a specific project.
pub fn require_project_access(
    auth: &AuthContext,
    project_id: i32,
) -> Result<(), crate::error::AppError> {
    match auth {
        AuthContext::Agent {
            project_id: agent_project_id,
            ..
        } => {
            if *agent_project_id != project_id {
                return Err(crate::error::AppError::Forbidden(format!(
                    "token is scoped to project {}, not {}",
                    agent_project_id, project_id
                )));
            }
            Ok(())
        }
        AuthContext::User { .. } => Ok(()),
    }
}
