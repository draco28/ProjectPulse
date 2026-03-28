/// Desktop application state, managed by Tauri via `app.manage()`.
///
/// Sprint 2: Simple config only. PulseDB integration comes in Phase 2.
pub struct AppState {
    pub app_name: String,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            app_name: "ProjectPulse Desktop".to_string(),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
