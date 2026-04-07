use std::env;

/// Application configuration loaded from environment variables.
///
/// Required: DATABASE_URL, NEXTAUTH_SECRET
/// All other fields have sensible defaults for development.
#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub pulsedb_path: String,
    pub host: String,
    pub port: u16,
    pub allowed_origins: Vec<String>,
    pub nextauth_secret: String,
    pub mcp_internal_secret: Option<String>,
    // LLM provider for PulseHive agents (Sprint 5)
    pub llm_base_url: String,
    pub llm_api_key: Option<String>,
    pub llm_model: String,
}

impl Config {
    /// Load configuration from environment variables.
    /// Panics on missing required vars (fail-fast at startup).
    pub fn from_env() -> Self {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

        let nextauth_secret = env::var("NEXTAUTH_SECRET").expect("NEXTAUTH_SECRET must be set");

        let mcp_internal_secret = env::var("MCP_INTERNAL_SECRET").ok();

        let pulsedb_path =
            env::var("PULSEDB_PATH").unwrap_or_else(|_| "./data/projectpulse.pulsedb".to_string());

        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());

        let port = env::var("PORT")
            .unwrap_or_else(|_| "3003".to_string())
            .parse::<u16>()
            .expect("PORT must be a valid u16");

        let allowed_origins = env::var("ALLOWED_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect();

        let llm_base_url = env::var("LLM_BASE_URL")
            .unwrap_or_else(|_| "https://ollama.com/v1".to_string());
        let llm_api_key = env::var("LLM_API_KEY").ok();
        let llm_model = env::var("LLM_MODEL")
            .unwrap_or_else(|_| "glm-5:cloud".to_string());

        Self {
            database_url,
            pulsedb_path,
            host,
            port,
            allowed_origins,
            nextauth_secret,
            mcp_internal_secret,
            llm_base_url,
            llm_api_key,
            llm_model,
        }
    }

    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
