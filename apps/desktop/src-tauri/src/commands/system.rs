use serde::Serialize;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub version: String,
    pub platform: String,
    pub app_name: String,
}

/// Returns basic application info.
///
/// Called from the frontend via `invoke('get_app_info')`.
/// Note: Tauri v2 does NOT auto-convert command names — the JS invoke string
/// must match the exact Rust function name (snake_case).
#[tauri::command]
pub fn get_app_info(state: State<'_, AppState>) -> Result<AppInfo, AppError> {
    get_app_info_impl(&state)
}

/// Testable version of get_app_info that doesn't require Tauri runtime.
pub fn get_app_info_impl(state: &AppState) -> Result<AppInfo, AppError> {
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
        app_name: state.app_name.clone(),
    })
}
