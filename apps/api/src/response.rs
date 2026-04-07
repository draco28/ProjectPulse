use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

/// Standard API response wrapper.
///
/// All Axum endpoints return this format:
/// - Success: `{ "data": T, "error": null }`
/// - Error: `{ "data": null, "error": { "code": "...", "message": "..." } }`
///
/// This matches the Next.js API format that Python MCP tools (80+) expect.
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub data: Option<T>,
    pub error: Option<ApiError>,
}

/// Structured error with machine-readable code + human-readable message.
#[derive(Debug, Serialize, Clone)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}

/// Create a 200 OK success response.
pub fn success<T: Serialize>(data: T) -> Response {
    (
        StatusCode::OK,
        Json(ApiResponse {
            data: Some(data),
            error: None,
        }),
    )
        .into_response()
}

/// Create a 201 Created success response.
pub fn created<T: Serialize>(data: T) -> Response {
    (
        StatusCode::CREATED,
        Json(ApiResponse {
            data: Some(data),
            error: None,
        }),
    )
        .into_response()
}

/// Create an error response with status code, error code, and message.
pub fn failure(status: StatusCode, code: &str, message: &str) -> Response {
    (
        status,
        Json(ApiResponse::<()> {
            data: None,
            error: Some(ApiError {
                code: code.to_string(),
                message: message.to_string(),
            }),
        }),
    )
        .into_response()
}
