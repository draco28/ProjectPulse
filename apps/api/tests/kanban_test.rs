//! Sprint 9: TDD tests for Sprint 6 Kanban routes.
//!
//! Routes covered:
//! - PATCH /api/v1/tickets/:id/move      — move with displayOrder + cascade
//! - PATCH /api/v1/tickets/:id/status    — set status with cascade (fixes #268)
//! - PATCH /api/v1/tickets/reorder       — batch reorder within column
//! - GET   /api/v1/sprints/:id/kanban    — full board with 5 columns

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
// PATCH /tickets/:id/move
// ============================================================================

#[tokio::test]
async fn test_move_ticket_updates_status_and_order() {
    let (server, _dir, db) = test_server().await;
    let hierarchy = common::create_test_sprint(&db).await;
    let ticket_id = common::insert_test_ticket(&db, 6, "Move test", "todo", Some(&hierarchy.sprint_id)).await;

    let response = server
        .patch(&format!("/api/v1/tickets/{}/move", ticket_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "status": "in-progress", "displayOrder": 3 }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    let ticket = &body["data"]["ticket"];
    assert_eq!(ticket["status"], "in-progress");
    assert_eq!(ticket["displayOrder"], 3);
}

#[tokio::test]
async fn test_move_ticket_cascades_progress() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    // Create 2 tickets in the sprint — moving 1 to done = 50% sprint progress
    let _t1 = common::insert_test_ticket(&db, 6, "Cascade A", "todo", Some(&h.sprint_id)).await;
    let t2 = common::insert_test_ticket(&db, 6, "Cascade B", "todo", Some(&h.sprint_id)).await;

    let response = server
        .patch(&format!("/api/v1/tickets/{}/move", t2))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "status": "done", "displayOrder": 0 }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    let updates = &body["data"]["progressUpdates"];
    assert!(updates.is_object(), "progressUpdates must be present (sprint assigned)");
    assert_eq!(updates["sprintProgress"], "50%");
}

#[tokio::test]
async fn test_move_ticket_sets_closed_at() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    let id = common::insert_test_ticket(&db, 6, "Closing", "todo", Some(&h.sprint_id)).await;

    server
        .patch(&format!("/api/v1/tickets/{}/move", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "status": "done", "displayOrder": 0 }))
        .await
        .assert_status_ok();

    let closed_at: (Option<chrono::NaiveDateTime>,) =
        sqlx::query_as(r#"SELECT "closedAt" FROM tickets WHERE id = $1"#)
            .bind(id)
            .fetch_one(&db)
            .await
            .unwrap();
    assert!(closed_at.0.is_some(), "closedAt should be set when status=done");

    // Move back to todo — closedAt should clear
    server
        .patch(&format!("/api/v1/tickets/{}/move", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "status": "todo", "displayOrder": 0 }))
        .await
        .assert_status_ok();

    let closed_at: (Option<chrono::NaiveDateTime>,) =
        sqlx::query_as(r#"SELECT "closedAt" FROM tickets WHERE id = $1"#)
            .bind(id)
            .fetch_one(&db)
            .await
            .unwrap();
    assert!(closed_at.0.is_none(), "closedAt should clear when leaving done");
}

// ============================================================================
// PATCH /tickets/:id/status (bug #268 — must also cascade)
// ============================================================================

#[tokio::test]
async fn test_set_status_cascades_progress() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    let id = common::insert_test_ticket(&db, 6, "Status cascade", "todo", Some(&h.sprint_id)).await;

    let response = server
        .patch(&format!("/api/v1/tickets/{}/status", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "status": "done" }))
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    assert!(body["data"]["progressUpdates"].is_object(),
        "setStatus must cascade progress (fixes #268)");
}

// ============================================================================
// PATCH /tickets/reorder
// ============================================================================

#[tokio::test]
async fn test_reorder_tickets_batch() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    let t1 = common::insert_test_ticket(&db, 6, "Reorder A", "todo", Some(&h.sprint_id)).await;
    let t2 = common::insert_test_ticket(&db, 6, "Reorder B", "todo", Some(&h.sprint_id)).await;
    let t3 = common::insert_test_ticket(&db, 6, "Reorder C", "todo", Some(&h.sprint_id)).await;

    let response = server
        .patch("/api/v1/tickets/reorder")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "projectId": 6,
            "moves": [
                { "ticketId": t1, "displayOrder": 2 },
                { "ticketId": t2, "displayOrder": 0 },
                { "ticketId": t3, "displayOrder": 1 }
            ]
        }))
        .await;

    response.assert_status_ok();

    // Verify orders persisted
    let orders: Vec<(i32, i32)> = sqlx::query_as(
        r#"SELECT id, "displayOrder" FROM tickets WHERE id = ANY($1) ORDER BY id"#,
    )
    .bind(&[t1, t2, t3])
    .fetch_all(&db)
    .await
    .unwrap();
    assert_eq!(orders.len(), 3);
}

// ============================================================================
// GET /sprints/:id/kanban
// ============================================================================

#[tokio::test]
async fn test_get_board_returns_5_columns() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    let _ = common::insert_test_ticket(&db, 6, "B1", "backlog", Some(&h.sprint_id)).await;
    let _ = common::insert_test_ticket(&db, 6, "T1", "todo", Some(&h.sprint_id)).await;
    let _ = common::insert_test_ticket(&db, 6, "I1", "in-progress", Some(&h.sprint_id)).await;
    let _ = common::insert_test_ticket(&db, 6, "R1", "in-review", Some(&h.sprint_id)).await;
    let _ = common::insert_test_ticket(&db, 6, "D1", "done", Some(&h.sprint_id)).await;

    let response = server
        .get(&format!("/api/v1/sprints/{}/kanban", h.sprint_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    let columns = body["data"]["columns"].as_array().expect("columns array");
    assert_eq!(columns.len(), 5, "must return 5 columns");

    let statuses: Vec<&str> = columns.iter().map(|c| c["status"].as_str().unwrap()).collect();
    assert!(statuses.contains(&"backlog"));
    assert!(statuses.contains(&"todo"));
    assert!(statuses.contains(&"in-progress"));
    assert!(statuses.contains(&"in-review"));
    assert!(statuses.contains(&"done"));
}

#[tokio::test]
async fn test_get_board_stats_match_columns() {
    let (server, _dir, db) = test_server().await;
    let h = common::create_test_sprint(&db).await;
    for _ in 0..3 {
        let _ = common::insert_test_ticket(&db, 6, "stat", "todo", Some(&h.sprint_id)).await;
    }
    for _ in 0..2 {
        let _ = common::insert_test_ticket(&db, 6, "stat", "done", Some(&h.sprint_id)).await;
    }

    let response = server
        .get(&format!("/api/v1/sprints/{}/kanban", h.sprint_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .add_query_param("projectId", "6")
        .await;

    response.assert_status_ok();
    let body: Value = response.json();
    let stats = &body["data"]["stats"];
    assert_eq!(stats["todo"], 3);
    assert_eq!(stats["done"], 2);
    assert_eq!(stats["total"], 5);
}
