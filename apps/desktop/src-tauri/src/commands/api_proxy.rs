use serde::Serialize;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub status: u16,
    pub body: String,
}

/// Generic IPC proxy that forwards requests to the Axum API.
///
/// The bearer token is attached automatically from AppState —
/// it never touches the JavaScript side.
///
/// Security: the `path` parameter is validated to prevent SSRF.
/// It must start with `/` and the assembled URL must resolve to
/// the same host as `api_base_url`.
#[tauri::command]
pub async fn api_fetch(
    state: State<'_, AppState>,
    path: String,
    method: String,
    body: Option<String>,
) -> Result<ApiResponse, AppError> {
    // Validate path to prevent SSRF — must be a relative API path
    if !path.starts_with('/') || path.contains("://") || path.contains("..") {
        return Err(AppError::Internal("invalid API path".to_string()));
    }

    let base = reqwest::Url::parse(&state.api_base_url)
        .map_err(|_| AppError::Internal("invalid api_base_url".to_string()))?;
    let url = base
        .join(&path[1..]) // strip leading slash for URL join
        .map_err(|_| AppError::Internal("invalid API path".to_string()))?;

    // Verify the assembled URL still points to the same host
    if url.host() != base.host() {
        return Err(AppError::Internal("API path escapes allowed host".to_string()));
    }

    let mut request = match method.to_uppercase().as_str() {
        "GET" => state.http.get(url),
        "POST" => state.http.post(url),
        "PUT" => state.http.put(url),
        "PATCH" => state.http.patch(url),
        "DELETE" => state.http.delete(url),
        _ => return Err(AppError::Internal("unsupported HTTP method".to_string())),
    };

    // Attach auth header if token is configured
    if !state.api_token.is_empty() {
        request = request.header("Authorization", format!("Bearer {}", state.api_token));
    }

    // Attach body for methods that support it
    if let Some(json_body) = body {
        request = request
            .header("Content-Type", "application/json")
            .body(json_body);
    }

    let response = request
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("HTTP request failed: {}", e)))?;

    let status = response.status().as_u16();
    let body = response
        .text()
        .await
        .map_err(|e| AppError::Internal(format!("failed to read response: {}", e)))?;

    Ok(ApiResponse { status, body })
}
