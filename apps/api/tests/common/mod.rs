use projectpulse_api::config::Config;
use projectpulse_api::state::AppState;
use tempfile::TempDir;

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
        port: 0, // Not used in tests (no TCP listener)
        allowed_origins: vec!["http://localhost:3000".to_string()],
    };

    let state = AppState::new(config)
        .await
        .expect("failed to create test AppState — is PostgreSQL running?");

    (state, temp_dir)
}
