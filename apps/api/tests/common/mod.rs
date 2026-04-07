#![allow(dead_code)]

use projectpulse_api::config::Config;
use projectpulse_api::state::AppState;
use tempfile::TempDir;

pub const TEST_SECRET: &str = "test-secret-for-jwt-at-least-32-chars-long";

/// Create an AppState configured for testing.
///
/// Uses the real PostgreSQL database (integration testing, not mocks)
/// and a temporary directory for PulseDB (isolated per test).
///
/// Returns (AppState, TempDir) — hold the TempDir to keep it alive for the test duration.
pub async fn test_state() -> (AppState, TempDir) {
    let temp_dir = TempDir::new().expect("failed to create temp dir for PulseDB");
    let pulsedb_path = temp_dir
        .path()
        .join("test.pulsedb")
        .to_string_lossy()
        .to_string();

    let config = Config {
        database_url: std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgresql://postgres:postgres123@127.0.0.1:5432/projectpulse_dev?sslmode=disable"
                .to_string()
        }),
        pulsedb_path,
        host: "127.0.0.1".to_string(),
        port: 0,
        allowed_origins: vec!["http://localhost:3000".to_string()],
        nextauth_secret: TEST_SECRET.to_string(),
        mcp_internal_secret: None,
        llm_base_url: std::env::var("LLM_BASE_URL")
            .unwrap_or_else(|_| "https://ollama.com/v1".to_string()),
        llm_api_key: std::env::var("LLM_API_KEY").ok(),
        llm_model: std::env::var("LLM_MODEL")
            .unwrap_or_else(|_| "glm-5:cloud".to_string()),
    };

    let state = AppState::new(config)
        .await
        .expect("failed to create test AppState — is PostgreSQL running?");

    (state, temp_dir)
}

/// Create a test JWT token signed with TEST_SECRET.
pub fn create_test_jwt(user_id: &str, email: &str, role: &str) -> String {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::json;

    let claims = json!({
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": chrono::Utc::now().timestamp(),
        "exp": chrono::Utc::now().timestamp() + 3600, // 1 hour
    });

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(TEST_SECRET.as_bytes()),
    )
    .expect("failed to create test JWT")
}
