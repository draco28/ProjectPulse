//! Sprint 9: TDD tests for Sprint 8 phase/sprint routes.
//!
//! Routes covered (added in Sprint 8):
//! - POST   /api/v1/phases
//! - GET    /api/v1/phases/:id
//! - PUT    /api/v1/phases/:id           — update phase progress
//! - PUT    /api/v1/sprints/:id/progress — cascade to phase, optional auto-advance

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

// ============================================================================
// Phase CRUD
// ============================================================================

#[tokio::test]
async fn test_create_phase() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    let response = server
        .post("/api/v1/phases")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "roadmapId": h.roadmap_id,
            "title": "Sprint 9 Phase Test",
            "description": "Created in TDD test"
        }))
        .await;

    assert_eq!(response.status_code(), 201);
    let body: Value = response.json();
    assert!(body["data"]["id"].is_string());
    assert_eq!(body["data"]["title"], "Sprint 9 Phase Test");
    assert_eq!(body["data"]["status"], "NOT_STARTED");
}

#[tokio::test]
async fn test_get_phase() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    let response = server
        .get(&format!("/api/v1/phases/{}", h.phase_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["id"], h.phase_id);
}

#[tokio::test]
async fn test_update_phase_progress() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    let response = server
        .put(&format!("/api/v1/phases/{}", h.phase_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": 50 }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["progress"], 50);
    assert_eq!(body["data"]["status"], "IN_PROGRESS");
}

#[tokio::test]
async fn test_update_phase_progress_validates_range() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    let response = server
        .put(&format!("/api/v1/phases/{}", h.phase_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": 150 }))
        .await;

    assert_eq!(response.status_code(), 400, "progress > 100 must be rejected");
}

#[tokio::test]
async fn test_update_phase_progress_status_derivation() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    // 0 = NOT_STARTED
    let r0 = server
        .put(&format!("/api/v1/phases/{}", h.phase_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": 0 }))
        .await;
    r0.assert_status_ok();
    let b0: Value = r0.json();
    assert_eq!(b0["data"]["status"], "NOT_STARTED");

    // 100 = COMPLETED
    let r100 = server
        .put(&format!("/api/v1/phases/{}", h.phase_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": 100 }))
        .await;
    r100.assert_status_ok();
    let b100: Value = r100.json();
    assert_eq!(b100["data"]["status"], "COMPLETED");
}

// ============================================================================
// Sprint progress cascade
// ============================================================================

#[tokio::test]
async fn test_update_sprint_progress_cascades_to_phase() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    let response = server
        .put(&format!("/api/v1/sprints/{}/progress", h.sprint_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": 75 }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert_eq!(body["data"]["sprint"]["progress"], 75);
    // Phase progress recalculated from all sprints — with one sprint at 75%, phase = 75
    assert_eq!(body["data"]["phase"]["progress"], 75);
}

#[tokio::test]
async fn test_sprint_auto_advance_on_completion() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;

    // Add a second sprint in the same phase (NOT_STARTED, will be auto-advanced)
    let next_sprint_id = cuid2::create_id();
    sqlx::query(
        r#"INSERT INTO sprints (id, title, description, status, progress, "sprintNumber",
                                "startDate", "phaseId", "createdAt", "updatedAt")
           VALUES ($1, 'Next Sprint', NULL, 'NOT_STARTED'::"Status", 0, 2, NOW(), $2, NOW(), NOW())"#,
    )
    .bind(&next_sprint_id)
    .bind(&h.phase_id)
    .execute(&db)
    .await
    .unwrap();

    // Complete sprint 1 → auto-advance triggers
    server
        .put(&format!("/api/v1/sprints/{}/progress", h.sprint_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "progress": 100 }))
        .await
        .assert_status_ok();

    // Sprint 2 should now be IN_PROGRESS
    let status: (String,) = sqlx::query_as(r#"SELECT status::text FROM sprints WHERE id = $1"#)
        .bind(&next_sprint_id)
        .fetch_one(&db)
        .await
        .unwrap();
    assert_eq!(status.0, "IN_PROGRESS", "next sprint must auto-advance to IN_PROGRESS");
}
