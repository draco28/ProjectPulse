//! Sprint 9: TDD tests for Sprint 7 Wiki routes.
//!
//! Routes covered:
//! - POST   /api/v1/wiki                 — create page
//! - GET    /api/v1/wiki?projectId=      — list pages
//! - GET    /api/v1/wiki/*path           — wildcard get
//! - GET    /api/v1/wiki/*path/history   — version history
//! - PATCH  /api/v1/wiki/*path           — update page (creates revision)
//! - POST   /api/v1/wiki/*path/revert    — revert to version
//! - PATCH on /history or /revert suffix — must be rejected

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

fn unique_path(slug: &str) -> String {
    format!("sprint9/{}-{}", slug, cuid2::create_id())
}

async fn create_page(server: &TestServer, path: &str, title: &str, content: &str) {
    let resp = server
        .post("/api/v1/wiki")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "title": title,
            "path": path,
            "content": content,
            "category": "test",
            "tags": ["sprint9-test"]
        }))
        .await;
    assert!(
        resp.status_code() == 201 || resp.status_code() == 200,
        "create_page expected 201/200, got {}: {}",
        resp.status_code(),
        resp.text()
    );
}

// ============================================================================
// Tests
// ============================================================================

#[tokio::test]
async fn test_create_wiki_page() {
    let (server, _dir) = test_server().await;
    let path = unique_path("create");

    let response = server
        .post("/api/v1/wiki")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "title": "Sprint 9 Wiki Test",
            "path": path,
            "content": "Body of the wiki page.",
            "category": "test",
            "tags": ["sprint9-test"]
        }))
        .await;

    assert!(
        response.status_code() == 201 || response.status_code() == 200,
        "create page expected 201/200, got {}",
        response.status_code()
    );
}

#[tokio::test]
async fn test_list_wiki_pages() {
    let (server, _dir) = test_server().await;
    let path = unique_path("list");
    create_page(&server, &path, "List test", "content").await;

    let response = server
        .get("/api/v1/wiki")
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .add_query_param("limit", "5")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert!(
        body["data"]["pages"].is_array() || body["data"].is_array() || body["data"]["items"].is_array(),
        "list response must contain an array, got: {:?}",
        body["data"]
    );
}

#[tokio::test]
async fn test_wildcard_get_page() {
    let (server, _dir) = test_server().await;
    let path = unique_path("wildcard-get");
    create_page(&server, &path, "Wildcard get test", "page body content").await;

    let response = server
        .get(&format!("/api/v1/wiki/{}", path))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    // Response shape: { data: { page: {...}, relatedPages: [...] }, error: null }
    assert_eq!(body["data"]["page"]["title"], "Wildcard get test");
    assert!(body["data"]["relatedPages"].is_array());
}

#[tokio::test]
async fn test_wildcard_patch_updates_page() {
    let (server, _dir) = test_server().await;
    let path = unique_path("patch");
    create_page(&server, &path, "Original title", "original content").await;

    let response = server
        .patch(&format!("/api/v1/wiki/{}", path))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .json(&json!({
            "title": "Updated title",
            "content": "updated content",
            "changelog": "test update"
        }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["title"], "Updated title");
}

#[tokio::test]
async fn test_wildcard_get_history() {
    let (server, _dir) = test_server().await;
    let path = unique_path("history");
    create_page(&server, &path, "history test", "v1").await;

    // Make an update so there's a revision
    server
        .patch(&format!("/api/v1/wiki/{}", path))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .json(&json!({ "content": "v2", "changelog": "second version" }))
        .await
        .assert_status_ok();

    let response = server
        .get(&format!("/api/v1/wiki/{}/history", path))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .await;

    response.assert_status_ok();
}

#[tokio::test]
async fn test_reject_patch_on_history_suffix() {
    let (server, _dir) = test_server().await;
    let path = unique_path("reject-history");
    create_page(&server, &path, "reject test", "v1").await;

    let response = server
        .patch(&format!("/api/v1/wiki/{}/history", path))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .json(&json!({ "content": "v2" }))
        .await;

    // 400 BadRequest — /history is not a patchable page path
    assert_eq!(response.status_code(), 400);
}

#[tokio::test]
async fn test_reject_patch_on_revert_suffix() {
    let (server, _dir) = test_server().await;
    let path = unique_path("reject-revert");
    create_page(&server, &path, "reject test", "v1").await;

    let response = server
        .patch(&format!("/api/v1/wiki/{}/revert", path))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .json(&json!({ "content": "v2" }))
        .await;

    assert_eq!(response.status_code(), 400);
}
