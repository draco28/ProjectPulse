/// Desktop application state, managed by Tauri via `app.manage()`.
pub struct AppState {
    pub app_name: String,
    /// Reusable HTTP client for API proxy requests.
    pub http: reqwest::Client,
    /// Base URL for the Axum API (e.g., "http://localhost:3003/api/v1").
    pub api_base_url: String,
    /// Bearer token for API authentication. Loaded from PROJECTPULSE_API_TOKEN env var.
    pub api_token: String,
}

impl AppState {
    pub fn new() -> Self {
        let api_base_url = std::env::var("PROJECTPULSE_API_BASE_URL")
            .unwrap_or_else(|_| "http://localhost:3003/api/v1".to_string());
        let api_token = std::env::var("PROJECTPULSE_API_TOKEN").unwrap_or_default();

        Self {
            app_name: "ProjectPulse Desktop".to_string(),
            http: reqwest::Client::new(),
            api_base_url,
            api_token,
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
