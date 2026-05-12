//! Sprint 9: TDD tests for /api/v1/agent-auth/validate
//!
//! Validates the token-prefix optimization for bcrypt lookup:
//! - Tokens with `token_prefix` set use indexed lookup (O(1) typical)
//! - Legacy tokens with NULL prefix fall back to full scan (backward compat)
//! - Invalid/expired tokens still return 401

mod common;

use axum_test::TestServer;
use bcrypt::{hash, DEFAULT_COST};
use projectpulse_api::build_router;
use serde_json::{json, Value};

async fn test_server() -> (TestServer, tempfile::TempDir, sqlx::PgPool) {
    let (state, temp_dir) = common::test_state().await;
    let db = state.db.clone();
    let app = build_router(state);
    let server = TestServer::new(app).expect("failed to create test server");
    (server, temp_dir, db)
}

/// Insert a project_tokens row for testing.
/// Returns (token_id, plaintext_token).
async fn insert_test_token(
    db: &sqlx::PgPool,
    project_id: i32,
    name: &str,
    plaintext: &str,
    with_prefix: bool,
    revoked: bool,
    expired: bool,
) -> i32 {
    let hash = hash(plaintext, DEFAULT_COST).expect("bcrypt hash failed");
    let prefix = if with_prefix {
        Some(&plaintext[..plaintext.len().min(8)])
    } else {
        None
    };

    let expires_at: Option<&str> = if expired {
        Some("2000-01-01T00:00:00Z")
    } else {
        None
    };

    let row: (i32,) = sqlx::query_as(
        r#"
        INSERT INTO project_tokens
          ("projectId", name, "tokenHash", token_prefix, "isRevoked", "expiresAt", "blockedTools", "allowedTools", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6::timestamp, ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW())
        RETURNING id
        "#,
    )
    .bind(project_id)
    .bind(name)
    .bind(&hash)
    .bind(prefix)
    .bind(revoked)
    .bind(expires_at)
    .fetch_one(db)
    .await
    .expect("failed to insert test token");

    row.0
}

async fn cleanup_test_tokens(db: &sqlx::PgPool, project_id: i32) {
    let _ = sqlx::query(r#"DELETE FROM project_tokens WHERE "projectId" = $1 AND name LIKE 'sprint9-test-%'"#)
        .bind(project_id)
        .execute(db)
        .await;
}

// ============================================================================
// TDD Tests (RED first)
// ============================================================================

#[tokio::test]
async fn test_validate_with_prefix_match() {
    let (server, _dir, db) = test_server().await;
    cleanup_test_tokens(&db, 6).await;

    // Plaintext token whose first 8 chars are "tk_abcde"
    let plaintext = "tk_abcdef_secret_unique_001";
    insert_test_token(&db, 6, "sprint9-test-prefix-match", plaintext, true, false, false).await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": plaintext }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["projectId"], 6);
    assert_eq!(body["data"]["name"], "sprint9-test-prefix-match");

    cleanup_test_tokens(&db, 6).await;
}

#[tokio::test]
async fn test_validate_null_prefix_fallback() {
    let (server, _dir, db) = test_server().await;
    cleanup_test_tokens(&db, 6).await;

    // Legacy token with NULL prefix must still validate (backward compat)
    let plaintext = "tk_legacy_no_prefix_unique_002";
    insert_test_token(&db, 6, "sprint9-test-null-fallback", plaintext, false, false, false).await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": plaintext }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["projectId"], 6);
    assert_eq!(body["data"]["name"], "sprint9-test-null-fallback");

    cleanup_test_tokens(&db, 6).await;
}

#[tokio::test]
async fn test_validate_invalid_token_returns_401() {
    let (server, _dir, db) = test_server().await;
    cleanup_test_tokens(&db, 6).await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": "tk_completely_wrong_token" }))
        .await;

    response.assert_status_unauthorized();
}

#[tokio::test]
async fn test_validate_expired_token_returns_401() {
    let (server, _dir, db) = test_server().await;
    cleanup_test_tokens(&db, 6).await;

    let plaintext = "tk_expired_unique_003";
    insert_test_token(&db, 6, "sprint9-test-expired", plaintext, true, false, true).await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": plaintext }))
        .await;

    response.assert_status_unauthorized();
    cleanup_test_tokens(&db, 6).await;
}

#[tokio::test]
async fn test_validate_revoked_token_returns_401() {
    let (server, _dir, db) = test_server().await;
    cleanup_test_tokens(&db, 6).await;

    let plaintext = "tk_revoked_unique_004";
    insert_test_token(&db, 6, "sprint9-test-revoked", plaintext, true, true, false).await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": plaintext }))
        .await;

    response.assert_status_unauthorized();
    cleanup_test_tokens(&db, 6).await;
}

#[tokio::test]
async fn test_validate_empty_token_returns_400() {
    let (server, _dir, _db) = test_server().await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": "" }))
        .await;

    // Validation error => 400
    response.assert_status_bad_request();
}

#[tokio::test]
async fn test_validate_short_token_under_8_chars() {
    let (server, _dir, db) = test_server().await;
    cleanup_test_tokens(&db, 6).await;

    // Edge case: token shorter than 8 chars (legacy short token)
    // Should still work via NULL-prefix fallback OR exact prefix match
    let plaintext = "tk_short";
    insert_test_token(&db, 6, "sprint9-test-short", plaintext, true, false, false).await;

    let response = server
        .post("/api/v1/agent-auth/validate")
        .json(&json!({ "token": plaintext }))
        .await;

    response.assert_status_ok();
    cleanup_test_tokens(&db, 6).await;
}
