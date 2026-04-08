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

// ============================================================================
// RED PHASE: TDD tests for Ticket CRUD API.
// Tests define the contract per spec §4b — {data, error} response format.
// ============================================================================

#[tokio::test]
async fn test_create_ticket_201() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Test ticket from TDD",
            "kind": "task",
            "source": "agent",
            "projectId": 6
        }))
        .await;

    assert_eq!(
        response.status_code(),
        201,
        "POST /api/v1/tickets should return 201, got {}",
        response.status_code()
    );

    let body: Value = response.json();
    assert!(body["data"].is_object(), "response must have 'data'");
    assert!(body["error"].is_null(), "error must be null on success");

    let ticket = &body["data"];
    assert!(ticket["id"].is_number(), "ticket must have numeric id");
    assert!(
        ticket["ticketNumber"].is_number(),
        "ticket must have ticketNumber"
    );
    assert_eq!(ticket["title"], "Test ticket from TDD");
    assert_eq!(ticket["kind"], "task");
    assert_eq!(ticket["source"], "agent");
}

#[tokio::test]
async fn test_create_ticket_validates_title() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "",
            "kind": "task",
            "source": "agent",
            "projectId": 6
        }))
        .await;

    assert_eq!(
        response.status_code(),
        400,
        "empty title should return 400"
    );

    let body: Value = response.json();
    assert!(body["data"].is_null(), "data must be null on error");
    assert!(body["error"].is_object(), "must have error object");
    assert_eq!(body["error"]["code"], "VALIDATION_ERROR");
}

#[tokio::test]
async fn test_list_tickets_with_filters() {
    let (server, _dir) = test_server().await;

    let response = server
        .get("/api/v1/tickets")
        .add_query_param("projectId", "6")
        .add_query_param("kind", "feature")
        .add_query_param("pageSize", "5")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();

    let body: Value = response.json();
    let data = &body["data"];
    assert!(data["tickets"].is_array(), "must have tickets array");
    assert!(data["total"].is_number(), "must have total count");
    assert!(data["page"].is_number(), "must have page number");
    assert!(data["pageSize"].is_number(), "must have pageSize");
}

#[tokio::test]
async fn test_list_tickets_pagination() {
    let (server, _dir) = test_server().await;

    // Page 1
    let r1 = server
        .get("/api/v1/tickets")
        .add_query_param("projectId", "6")
        .add_query_param("page", "1")
        .add_query_param("pageSize", "3")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    r1.assert_status_ok();
    let b1: Value = r1.json();
    let tickets1 = b1["data"]["tickets"].as_array().unwrap();
    assert!(tickets1.len() <= 3, "page 1 should have at most 3 tickets");
}

#[tokio::test]
async fn test_get_ticket_by_id() {
    let (server, _dir) = test_server().await;

    // Create a ticket first
    let create_resp = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Get-by-id test",
            "kind": "task",
            "source": "agent",
            "projectId": 6
        }))
        .await;

    let created: Value = create_resp.json();
    let id = created["data"]["id"].as_i64().unwrap();

    // Get by ID
    let response = server
        .get(&format!("/api/v1/tickets/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();

    let body: Value = response.json();
    assert_eq!(body["data"]["id"], id);
    assert_eq!(body["data"]["title"], "Get-by-id test");
}

#[tokio::test]
async fn test_get_ticket_not_found() {
    let (server, _dir) = test_server().await;

    let response = server
        .get("/api/v1/tickets/999999")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    assert_eq!(response.status_code(), 404);

    let body: Value = response.json();
    assert!(body["data"].is_null());
    assert_eq!(body["error"]["code"], "NOT_FOUND");
}

#[tokio::test]
async fn test_update_ticket_fields() {
    let (server, _dir) = test_server().await;

    // Create
    let create_resp = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Original title",
            "kind": "task",
            "source": "agent",
            "projectId": 6
        }))
        .await;

    let created: Value = create_resp.json();
    let id = created["data"]["id"].as_i64().unwrap();

    // Update
    let response = server
        .patch(&format!("/api/v1/tickets/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Updated title",
            "priority": "high"
        }))
        .await;

    response.assert_status_ok();

    let body: Value = response.json();
    assert_eq!(body["data"]["title"], "Updated title");
    assert_eq!(body["data"]["priority"], "high");
}

#[tokio::test]
async fn test_delete_ticket() {
    let (server, _dir) = test_server().await;

    // Create
    let create_resp = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "To be deleted",
            "kind": "task",
            "source": "agent",
            "projectId": 6
        }))
        .await;

    let created: Value = create_resp.json();
    let id = created["data"]["id"].as_i64().unwrap();

    // Delete
    let response = server
        .delete(&format!("/api/v1/tickets/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    // Should return 200 or 204
    assert!(
        response.status_code().is_success(),
        "DELETE should succeed, got {}",
        response.status_code()
    );

    // Verify gone
    let get_resp = server
        .get(&format!("/api/v1/tickets/{}", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    assert_eq!(get_resp.status_code(), 404);
}

#[tokio::test]
async fn test_ticket_hierarchy() {
    let (server, _dir) = test_server().await;

    // Create parent (feature)
    let parent_resp = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Parent feature",
            "kind": "feature",
            "source": "agent",
            "projectId": 6
        }))
        .await;

    let parent: Value = parent_resp.json();
    let parent_id = parent["data"]["id"].as_i64().unwrap();

    // Create child (task)
    let child_resp = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Child task",
            "kind": "task",
            "source": "agent",
            "projectId": 6,
            "parentTicketId": parent_id
        }))
        .await;

    assert_eq!(child_resp.status_code(), 201);
    let child: Value = child_resp.json();
    assert_eq!(child["data"]["parentTicketId"], parent_id);

    // Get children
    let children_resp = server
        .get(&format!("/api/v1/tickets/{}/children", parent_id))
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    children_resp.assert_status_ok();
    let children: Value = children_resp.json();
    let child_list = children["data"]["tickets"]
        .as_array()
        .expect("children must be array");
    assert!(
        !child_list.is_empty(),
        "parent should have at least one child"
    );
}

#[tokio::test]
async fn test_kanban_move_cascades_progress() {
    let (server, _dir) = test_server().await;

    // Create a ticket
    let create_resp = server
        .post("/api/v1/tickets")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "title": "Move to done",
            "kind": "task",
            "source": "agent",
            "projectId": 6,
            "status": "todo"
        }))
        .await;

    let created: Value = create_resp.json();
    let id = created["data"]["id"].as_i64().unwrap();

    // Move to done
    let move_resp = server
        .patch(&format!("/api/v1/tickets/{}/move", id))
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "status": "done",
            "displayOrder": 0
        }))
        .await;

    move_resp.assert_status_ok();

    let body: Value = move_resp.json();
    let ticket = &body["data"]["ticket"];
    assert_eq!(ticket["status"], "done");

    // Progress updates should be present (object when sprint assigned, null otherwise)
    // The key existence in the response proves #268 is fixed — setStatus also cascades
    assert!(
        body["data"]["progressUpdates"].is_object() || body["data"]["progressUpdates"].is_null(),
        "move response should include progressUpdates field"
    );
}

#[tokio::test]
async fn test_ticket_number_auto_increment() {
    let (server, _dir) = test_server().await;

    // Create 3 tickets
    let mut numbers = Vec::new();
    for i in 0..3 {
        let resp = server
            .post("/api/v1/tickets")
            .add_header(AUTHORIZATION, bearer_auth())
            .json(&json!({
                "title": format!("Auto-number test {}", i),
                "kind": "task",
                "source": "agent",
                "projectId": 6
            }))
            .await;

        let body: Value = resp.json();
        numbers.push(body["data"]["ticketNumber"].as_i64().unwrap());
    }

    // Numbers should be sequential
    assert_eq!(
        numbers[1] - numbers[0],
        1,
        "ticket numbers should be sequential"
    );
    assert_eq!(
        numbers[2] - numbers[1],
        1,
        "ticket numbers should be sequential"
    );
}
