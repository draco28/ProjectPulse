mod common;

use axum_test::TestServer;
use projectpulse_api::build_router;
use serde_json::Value;

async fn test_server() -> (TestServer, tempfile::TempDir) {
    let (state, temp_dir) = common::test_state().await;
    let app = build_router(state);
    let server = TestServer::new(app).expect("failed to create test server");
    (server, temp_dir)
}

// ============================================================================
// Health endpoint tests — updated for {data, error} wrapper format
// ============================================================================

#[tokio::test]
async fn test_health_returns_200() {
    let (server, _dir) = test_server().await;
    let response = server.get("/health").await;
    response.assert_status_ok();
}

#[tokio::test]
async fn test_health_returns_json_content_type() {
    let (server, _dir) = test_server().await;
    let response = server.get("/health").await;
    response.assert_status_ok();
    let content_type = response
        .headers()
        .get("content-type")
        .expect("missing content-type header")
        .to_str()
        .unwrap();
    assert!(
        content_type.contains("application/json"),
        "expected application/json, got: {}",
        content_type
    );
}

#[tokio::test]
async fn test_health_response_structure() {
    let (server, _dir) = test_server().await;
    let body: Value = server.get("/health").await.json();

    // Must have {data, error} wrapper
    assert!(body["data"].is_object(), "response must have 'data' field");
    assert!(body["error"].is_null(), "error must be null on success");

    // Data fields
    let data = &body["data"];
    assert_eq!(data["status"], "healthy");
    assert_eq!(data["database"], "connected");
    assert_eq!(data["pulsedb"], "connected");
    assert!(data["version"].is_string(), "version must be a string");
}

#[tokio::test]
async fn test_health_checks_database_connected() {
    let (server, _dir) = test_server().await;
    let body: Value = server.get("/health").await.json();
    assert_eq!(body["data"]["database"], "connected");
}

#[tokio::test]
async fn test_health_checks_pulsedb_connected() {
    let (server, _dir) = test_server().await;
    let body: Value = server.get("/health").await.json();
    assert_eq!(body["data"]["pulsedb"], "connected");
}

#[tokio::test]
async fn test_health_includes_version() {
    let (server, _dir) = test_server().await;
    let body: Value = server.get("/health").await.json();
    let version = body["data"]["version"]
        .as_str()
        .expect("version must be a string");
    assert_eq!(version, env!("CARGO_PKG_VERSION"));
}
