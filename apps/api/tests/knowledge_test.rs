//! Sprint 9: TDD tests for Sprint 7 Knowledge routes.
//!
//! Routes covered:
//! - POST   /api/v1/knowledge                — create item
//! - GET    /api/v1/knowledge?projectId=     — list items
//! - GET    /api/v1/knowledge/:id            — get by id
//! - POST   /api/v1/knowledge/:id/archive    — archive toggle
//! - GET    /api/v1/knowledge/search         — search items
//! - GET    /api/v1/knowledge/related        — related items
//! - GET    /api/v1/knowledge/metrics        — analytics

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

async fn create_item(server: &TestServer, title: &str) -> i32 {
    let resp = server
        .post("/api/v1/knowledge")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "title": title,
            "content": format!("Test content for {}", title),
            "category": "test",
            "tags": ["sprint9-test"],
            "allowDuplicates": true
        }))
        .await;
    let body: Value = resp.json();
    body["data"]["id"].as_i64().expect("missing item id") as i32
}

// ============================================================================
// CRUD
// ============================================================================

#[tokio::test]
async fn test_create_knowledge_item_201() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/knowledge")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "title": "Sprint 9 Knowledge Test",
            "content": "Body of the knowledge item.",
            "category": "test",
            "tags": ["sprint9-test"],
            "allowDuplicates": true
        }))
        .await;

    assert_eq!(response.status_code(), 201);
    let body: Value = response.json();
    assert!(body["data"]["id"].is_number());
    assert_eq!(body["data"]["title"], "Sprint 9 Knowledge Test");
}

#[tokio::test]
async fn test_list_knowledge_items() {
    let (server, _dir) = test_server().await;
    let _ = create_item(&server, "List item 1").await;

    let response = server
        .get("/api/v1/knowledge")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .add_query_param("pageSize", "5")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert!(body["data"]["items"].is_array());
}

#[tokio::test]
async fn test_get_knowledge_by_id() {
    let (server, _dir) = test_server().await;
    let id = create_item(&server, "Get by id test").await;

    let response = server
        .get(&format!("/api/v1/knowledge/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["id"], id);
    assert_eq!(body["data"]["title"], "Get by id test");
}

#[tokio::test]
async fn test_archive_toggle() {
    let (server, _dir) = test_server().await;
    let id = create_item(&server, "Archive test").await;

    // Archive: archivedAt should become non-null
    let response = server
        .post(&format!("/api/v1/knowledge/{}/archive", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "archive": true }))
        .await;
    response.assert_status_ok();
    let body: Value = response.json();
    assert!(body["data"]["archivedAt"].is_string(),
        "after archive, archivedAt must be a timestamp string");

    // Unarchive: archivedAt should clear back to null
    let response = server
        .post(&format!("/api/v1/knowledge/{}/archive", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "archive": false }))
        .await;
    response.assert_status_ok();
    let body: Value = response.json();
    assert!(body["data"]["archivedAt"].is_null(),
        "after unarchive, archivedAt must be null");
}

#[tokio::test]
async fn test_search_knowledge_fulltext() {
    let (server, _dir) = test_server().await;
    let _ = create_item(&server, "Searchable distinctive content").await;

    // Use fulltext mode to avoid LLM embedding dependency in tests
    let response = server
        .get("/api/v1/knowledge/search")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .add_query_param("query", "distinctive")
        .add_query_param("mode", "fulltext")
        .add_query_param("limit", "5")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert!(body["data"]["results"].is_array(),
        "fulltext search must include results array");
}

#[tokio::test]
async fn test_search_validates_empty_query() {
    let (server, _dir) = test_server().await;

    let response = server
        .get("/api/v1/knowledge/search")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .add_query_param("query", "")
        .add_query_param("mode", "fulltext")
        .await;

    // Empty query => 400 validation error
    assert_eq!(response.status_code(), 400);
}

#[tokio::test]
async fn test_related_items_endpoint() {
    let (server, _dir) = test_server().await;
    let id = create_item(&server, "Related test").await;

    let response = server
        .get("/api/v1/knowledge/related")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .add_query_param("itemId", id.to_string())
        .add_query_param("limit", "5")
        .await;

    // Empty results are OK — we just want the endpoint to respond cleanly
    response.assert_status_ok();
}

#[tokio::test]
async fn test_metrics_returns_analytics() {
    let (server, _dir) = test_server().await;

    let response = server
        .get("/api/v1/knowledge/metrics")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert!(body["data"].is_object(), "metrics must return object with stats");
}
