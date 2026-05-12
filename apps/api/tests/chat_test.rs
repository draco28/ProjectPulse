//! Sprint 9: TDD tests for chat API.
//!
//! - POST /api/v1/chat/conversations
//! - GET  /api/v1/chat/conversations
//! - GET  /api/v1/chat/conversations/:id/messages
//! - POST /api/v1/chat/conversations/:id/messages — error path (no LLM key)
//!
//! Streaming success path is verified manually with a live LLM key.

mod common;

use axum::http::header::AUTHORIZATION;
use axum::http::HeaderValue;
use axum_test::TestServer;
use projectpulse_api::build_router;
use serde_json::{json, Value};

async fn test_server() -> (TestServer, tempfile::TempDir) {
    let (state, temp_dir) = common::test_state().await;
    let app = build_router(state);
    let server = TestServer::new(app).expect("failed to create test server");
    (server, temp_dir)
}

fn bearer_auth() -> HeaderValue {
    let token = common::create_test_jwt("test-user-1", "test@example.com", "admin");
    format!("Bearer {}", token).parse().unwrap()
}

async fn create_conv(server: &TestServer, title: &str) -> String {
    let resp = server
        .post("/api/v1/chat/conversations")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "projectId": 6, "title": title }))
        .await;
    let body: Value = resp.json();
    body["data"]["id"].as_str().unwrap().to_string()
}

// ============================================================================
// Conversation CRUD
// ============================================================================

#[tokio::test]
async fn test_create_conversation_201() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/chat/conversations")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "projectId": 6, "title": "Sprint 9 chat test" }))
        .await;

    assert_eq!(response.status_code(), 201);
    let body: Value = response.json();
    assert!(body["data"]["id"].is_string());
    assert_eq!(body["data"]["title"], "Sprint 9 chat test");
    assert_eq!(body["data"]["projectId"], 6);
}

#[tokio::test]
async fn test_create_conversation_without_title() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/chat/conversations")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "projectId": 6 }))
        .await;

    assert_eq!(response.status_code(), 201);
}

#[tokio::test]
async fn test_list_conversations() {
    let (server, _dir) = test_server().await;
    let _ = create_conv(&server, "List test conv").await;

    let response = server
        .get("/api/v1/chat/conversations")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .add_query_param("limit", "10")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert!(
        body["data"]["conversations"].is_array(),
        "list must return conversations array"
    );
}

// ============================================================================
// Messages
// ============================================================================

#[tokio::test]
async fn test_get_messages_empty_conversation() {
    let (server, _dir) = test_server().await;
    let id = create_conv(&server, "Empty messages").await;

    let response = server
        .get(&format!("/api/v1/chat/conversations/{}/messages", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    let messages = body["data"]["messages"].as_array().expect("messages array");
    assert!(messages.is_empty(), "new conversation has no messages");
}

#[tokio::test]
async fn test_get_messages_unknown_conversation_returns_404() {
    let (server, _dir) = test_server().await;

    let response = server
        .get("/api/v1/chat/conversations/nonexistent-id/messages")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    assert_eq!(response.status_code(), 404);
}

#[tokio::test]
async fn test_send_message_without_llm_key_returns_error() {
    let (server, _dir) = test_server().await;
    let id = create_conv(&server, "no llm key").await;

    // Test env has no LLM_API_KEY, so chat must surface a clear error
    let response = server
        .post(&format!("/api/v1/chat/conversations/{}/messages", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "content": "hello" }))
        .await;

    // 400 BadRequest with descriptive message
    assert_eq!(response.status_code(), 400);
    let body: Value = response.json();
    let err_msg = body["error"]["message"].as_str().unwrap_or("");
    assert!(
        err_msg.contains("LLM_API_KEY") || err_msg.to_lowercase().contains("unavailable"),
        "error must mention LLM key config, got: {}",
        err_msg
    );
}

#[tokio::test]
async fn test_send_message_validates_empty_content() {
    let (server, _dir) = test_server().await;
    let id = create_conv(&server, "empty content test").await;

    let response = server
        .post(&format!("/api/v1/chat/conversations/{}/messages", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "content": "   " }))
        .await;

    assert_eq!(response.status_code(), 400);
}
