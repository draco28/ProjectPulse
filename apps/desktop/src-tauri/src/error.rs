use serde::Serialize;

/// IPC error type that can cross the Tauri bridge.
///
/// Tauri v2 requires all command errors to implement `serde::Serialize`
/// so they can be transmitted as JSON to the frontend.
#[derive(Debug, thiserror::Error, Serialize)]
pub enum AppError {
    #[error("not found: {0}")]
    NotFound(String),

    #[error("internal error: {0}")]
    Internal(String),

    #[error("io error: {0}")]
    Io(String),
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}
