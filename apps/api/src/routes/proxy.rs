//! Reverse proxy fallback: forwards unmatched /api/v1/* requests to Next.js.
//!
//! Covers routes not yet migrated natively to Axum:
//! - Onboarding (14 routes)
//! - Admin (8+ routes)
//! - Backlog (2 routes)
//! - Traceability (2 routes)
//! - Repo (1 route)
//!
//! Strips `/api/v1/` prefix and forwards to `http://localhost:3000/api/`.

use axum::body::Body;
use axum::extract::State;
use axum::http::{Request, StatusCode};
use axum::response::{IntoResponse, Response};

use crate::state::AppState;

/// Catch-all fallback handler: proxy to Next.js API.
pub async fn forward_to_nextjs(
    State(_state): State<AppState>,
    req: Request<Body>,
) -> Response {
    let uri = req.uri().to_string();
    let method = req.method().clone();

    // Strip /api/v1/ prefix to get the Next.js relative path
    let nextjs_path = if uri.starts_with("/api/v1/") {
        &uri[7..] // removes "/api/v1" → leaves "/remaining-path"
    } else {
        &uri
    };

    let nextjs_url = format!("http://localhost:3000/api{}", nextjs_path);

    tracing::debug!(
        proxy_from = %uri,
        proxy_to = %nextjs_url,
        method = %method,
        "proxying to Next.js"
    );

    // Build the proxied request
    let client = reqwest::Client::new();
    let mut proxy_req = client.request(method.clone(), &nextjs_url);

    // Forward relevant headers
    for (name, value) in req.headers() {
        if name == "host" || name == "connection" {
            continue; // skip hop-by-hop headers
        }
        if let Ok(v) = value.to_str() {
            proxy_req = proxy_req.header(name.as_str(), v);
        }
    }

    // Forward body for POST/PUT/PATCH
    let body_bytes = match axum::body::to_bytes(req.into_body(), 10 * 1024 * 1024).await {
        Ok(b) => b,
        Err(e) => {
            tracing::error!(error = %e, "failed to read proxy request body");
            return (StatusCode::BAD_REQUEST, "failed to read request body").into_response();
        }
    };

    if !body_bytes.is_empty() {
        proxy_req = proxy_req.body(body_bytes.to_vec());
    }

    // Execute proxied request
    match proxy_req.send().await {
        Ok(resp) => {
            let status = StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
            let headers = resp.headers().clone();
            let body = resp.bytes().await.unwrap_or_default();

            let mut response = (status, body.to_vec()).into_response();
            // Forward content-type header
            if let Some(ct) = headers.get("content-type") {
                response.headers_mut().insert("content-type", ct.clone());
            }
            response
        }
        Err(e) => {
            tracing::error!(error = %e, url = %nextjs_url, "proxy request failed");
            (
                StatusCode::BAD_GATEWAY,
                format!("proxy to Next.js failed: {}", e),
            )
                .into_response()
        }
    }
}
