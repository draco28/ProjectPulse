use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Extension;
use axum::Json;

use crate::middleware::AuthContext;

/// GET /api/v1/me — returns the authenticated context.
///
/// AuthContext is injected by the require_auth middleware into extensions.
pub async fn me(Extension(auth): Extension<AuthContext>) -> impl IntoResponse {
    (StatusCode::OK, Json(auth))
}
