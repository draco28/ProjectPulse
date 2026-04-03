mod common;

use axum::http::HeaderValue;
use axum_test::TestServer;
use projectpulse_api::build_router;
use serde_json::Value;

async fn test_server() -> (TestServer, tempfile::TempDir) {
    let (state, temp_dir) = common::test_state().await;
    let app = build_router(state);
    let server = TestServer::new(app).expect("failed to create test server");
    (server, temp_dir)
}

fn bearer(token: &str) -> HeaderValue {
    format!("Bearer {}", token).parse().unwrap()
}

// ============================================================================
// Auth Tests — TDD for dual auth middleware
// ============================================================================

#[tokio::test]
async fn test_no_auth_returns_401() {
    let (server, _dir) = test_server().await;
    let response = server.get("/api/v1/me").await;
    response.assert_status_unauthorized();
}

#[tokio::test]
async fn test_invalid_token_returns_401() {
    let (server, _dir) = test_server().await;
    let response = server
        .get("/api/v1/me")
        .add_header(axum::http::header::AUTHORIZATION, bearer("invalid_garbage"))
        .await;
    response.assert_status_unauthorized();
}

#[tokio::test]
async fn test_valid_jwt_returns_200() {
    let (server, _dir) = test_server().await;
    let jwt = common::create_test_jwt("user123", "test@example.com", "USER");
    let response = server
        .get("/api/v1/me")
        .add_header(axum::http::header::AUTHORIZATION, bearer(&jwt))
        .await;
    response.assert_status_ok();
}

#[tokio::test]
async fn test_jwt_extracts_user_context() {
    let (server, _dir) = test_server().await;
    let jwt = common::create_test_jwt("user456", "admin@example.com", "ADMIN");
    let response = server
        .get("/api/v1/me")
        .add_header(axum::http::header::AUTHORIZATION, bearer(&jwt))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();

    assert_eq!(body["type"], "User");
    assert_eq!(body["user_id"], "user456");
    assert_eq!(body["email"], "admin@example.com");
    assert_eq!(body["role"], "ADMIN");
}

#[tokio::test]
async fn test_expired_jwt_returns_401() {
    let (server, _dir) = test_server().await;

    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::json;

    let claims = json!({
        "sub": "user789",
        "email": "expired@example.com",
        "role": "USER",
        "iat": chrono::Utc::now().timestamp() - 7200,
        "exp": chrono::Utc::now().timestamp() - 3600,
    });

    let expired_jwt = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(common::TEST_SECRET.as_bytes()),
    )
    .unwrap();

    let response = server
        .get("/api/v1/me")
        .add_header(axum::http::header::AUTHORIZATION, bearer(&expired_jwt))
        .await;
    response.assert_status_unauthorized();
}

#[tokio::test]
async fn test_health_requires_no_auth() {
    let (server, _dir) = test_server().await;
    let response = server.get("/health").await;
    response.assert_status_ok();
}

#[tokio::test]
async fn test_wrong_secret_jwt_returns_401() {
    let (server, _dir) = test_server().await;

    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::json;

    let claims = json!({
        "sub": "hacker",
        "email": "evil@example.com",
        "role": "ADMIN",
        "iat": chrono::Utc::now().timestamp(),
        "exp": chrono::Utc::now().timestamp() + 3600,
    });

    let bad_jwt = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(b"wrong-secret-completely-different"),
    )
    .unwrap();

    let response = server
        .get("/api/v1/me")
        .add_header(axum::http::header::AUTHORIZATION, bearer(&bad_jwt))
        .await;
    response.assert_status_unauthorized();
}

#[tokio::test]
async fn test_basic_auth_returns_401() {
    let (server, _dir) = test_server().await;
    let response = server
        .get("/api/v1/me")
        .add_header(
            axum::http::header::AUTHORIZATION,
            HeaderValue::from_static("Basic dXNlcjpwYXNz"),
        )
        .await;
    response.assert_status_unauthorized();
}
