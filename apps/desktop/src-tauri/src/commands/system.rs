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
/// Tauri auto-converts snake_case command names to camelCase on the JS side.
#[tauri::command]
pub fn get_app_info(state: State<'_, AppState>) -> Result<AppInfo, AppError> {
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
        app_name: state.app_name.clone(),
    })
}

/// Testable version of get_app_info that doesn't require Tauri runtime.
pub fn get_app_info_impl(state: &AppState) -> Result<AppInfo, AppError> {
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
        app_name: state.app_name.clone(),
    })
}
