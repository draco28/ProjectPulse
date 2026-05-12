//! Sprint 9: TDD tests for Sprint 7 Agent Session routes.
//!
//! Routes covered:
//! - POST   /api/v1/agent-sessions              — create / start
//! - GET    /api/v1/agent-sessions/:id          — get session
//! - PATCH  /api/v1/agent-sessions/:id          — update (progress, todos, status)
//! - POST   /api/v1/agent-sessions/:id/end      — end session
//! - POST   /api/v1/agent-sessions/:id/resume   — resume paused session

mod common;

use axum::http::header::AUTHORIZATION;
use axum::http::HeaderValue;
use axum_test::TestServer;
use projectpulse_api::build_router;
use serde_json::{json, Value};

async fn test_server() -> (TestServer, tempfile::TempDir, sqlx::PgPool) {
    let (state, temp_dir) = common::test_state().await;
    let db = state.db.clone();
    let app = build_router(state);
    let server = TestServer::new(app).expect("failed to create test server");
    (server, temp_dir, db)
}

fn bearer_auth() -> HeaderValue {
    let token = common::create_test_jwt("test-user-1", "test@example.com", "admin");
    format!("Bearer {}", token).parse().unwrap()
}

async fn create_session(server: &TestServer, name: &str) -> String {
    let resp = server
        .post("/api/v1/agent-sessions")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "name": name,
            "plan": "test plan",
            "todos": [{ "content": "todo 1", "status": "pending" }]
        }))
        .await;
    let body: Value = resp.json();
    body["data"]["id"].as_str().expect("missing session id").to_string()
}

// ============================================================================
// CRUD
// ============================================================================

#[tokio::test]
async fn test_create_session() {
    let (server, _dir, _db) = test_server().await;

    let response = server
        .post("/api/v1/agent-sessions")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "name": "Sprint 9 session test",
            "plan": "## Plan\n- step 1",
            "todos": [{"content": "task 1", "status": "pending"}]
        }))
        .await;

    assert_eq!(response.status_code(), 201);
    let body: Value = response.json();
    assert!(body["data"]["id"].is_string());
    assert_eq!(body["data"]["status"], "IN_PROGRESS");
}

#[tokio::test]
async fn test_get_session() {
    let (server, _dir, _db) = test_server().await;
    let id = create_session(&server, "Get test").await;

    let response = server
        .get(&format!("/api/v1/agent-sessions/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["id"], id);
    assert_eq!(body["data"]["name"], "Get test");
}

#[tokio::test]
async fn test_update_session_progress() {
    let (server, _dir, _db) = test_server().await;
    let id = create_session(&server, "Update test").await;

    let response = server
        .patch(&format!("/api/v1/agent-sessions/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "progress": "made progress",
            "todos": [{"content": "task 1", "status": "completed"}]
        }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["progress"], "made progress");
}

#[tokio::test]
async fn test_end_session() {
    let (server, _dir, _db) = test_server().await;
    let id = create_session(&server, "End test").await;

    let response = server
        .post(&format!("/api/v1/agent-sessions/{}/end", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": "done" }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["status"], "COMPLETED");
}

#[tokio::test]
async fn test_resume_paused_session() {
    let (server, _dir, _db) = test_server().await;
    let id = create_session(&server, "Resume test").await;

    // Pause it
    server
        .patch(&format!("/api/v1/agent-sessions/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "status": "PAUSED" }))
        .await
        .assert_status_ok();

    // Resume
    let response = server
        .post(&format!("/api/v1/agent-sessions/{}/resume", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;
    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["status"], "IN_PROGRESS");
}

#[tokio::test]
async fn test_cannot_resume_completed_session() {
    let (server, _dir, _db) = test_server().await;
    let id = create_session(&server, "Completed resume test").await;

    // End it
    server
        .post(&format!("/api/v1/agent-sessions/{}/end", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({}))
        .await
        .assert_status_ok();

    // Attempt resume
    let response = server
        .post(&format!("/api/v1/agent-sessions/{}/resume", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;
    // Completed sessions must not be resumable
    assert!(
        response.status_code() == 400 || response.status_code() == 409,
        "expected 400/409, got {}",
        response.status_code()
    );
}

#[tokio::test]
async fn test_session_claims_todo_tickets() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    let ticket_id = common::insert_test_ticket(&db, 6, "claim me", "todo", Some(&h.sprint_id)).await;

    let response = server
        .post("/api/v1/agent-sessions")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "name": "Claim test",
            "activeTicketIds": [ticket_id]
        }))
        .await;

    assert_eq!(response.status_code(), 201);

    // Verify ticket moved to in-progress
    let status: (String,) = sqlx::query_as(r#"SELECT status FROM tickets WHERE id = $1"#)
        .bind(ticket_id)
        .fetch_one(&db)
        .await
        .unwrap();
    assert_eq!(status.0, "in-progress", "session start must auto-claim todo tickets");
}
