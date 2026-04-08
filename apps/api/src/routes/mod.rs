pub mod health;
pub mod kanban;
pub mod me;
pub mod rag;
pub mod sprints;
pub mod tickets;

use axum::routing::{get, post};
use axum::Router;

use crate::state::AppState;

/// Public routes — no authentication required.
pub fn public_routes() -> Router<AppState> {
    Router::new().route("/health", get(health::health))
}

/// Protected routes — require valid auth (JWT or bearer token).
/// Auth middleware is applied in lib.rs build_router().
pub fn protected_routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/me", get(me::me))
        // RAG endpoints (Sprint 4)
        .route("/api/v1/rag/ingest", post(rag::ingest))
        .route("/api/v1/rag/ingest/status", get(rag::ingest_status))
        .route("/api/v1/rag/search", get(rag::search))
        // Ticket CRUD (Sprint 6)
        .route("/api/v1/tickets", post(tickets::create_ticket).get(tickets::list_tickets))
        .route(
            "/api/v1/tickets/:id",
            get(tickets::get_ticket)
                .patch(tickets::update_ticket)
                .delete(tickets::delete_ticket),
        )
        // Ticket extensions (Sprint 6 Batch 3)
        .route("/api/v1/tickets/bulk", post(tickets::bulk_create_tickets))
        .route(
            "/api/v1/tickets/by-number/:projectId/:ticketNumber",
            get(tickets::get_by_number),
        )
        .route("/api/v1/tickets/:id/children", get(tickets::get_children))
        .route("/api/v1/tickets/:id/hierarchy", get(tickets::get_hierarchy))
        .route(
            "/api/v1/tickets/:id/comments",
            post(tickets::add_comment).get(tickets::list_comments),
        )
        .route("/api/v1/tickets/:id/labels", axum::routing::patch(tickets::update_labels))
        // Kanban (Sprint 6 Batch 4)
        .route("/api/v1/tickets/:id/move", axum::routing::patch(kanban::move_ticket))
        .route("/api/v1/tickets/:id/status", axum::routing::patch(kanban::set_status))
        .route("/api/v1/tickets/reorder", axum::routing::patch(kanban::reorder_tickets))
        .route("/api/v1/sprints/:sprintId/kanban", get(kanban::get_board))
        // Sprint/Roadmap (Sprint 6 Batch 5)
        .route("/api/v1/roadmap", post(sprints::create_roadmap).get(sprints::get_roadmap))
        .route("/api/v1/roadmap/:id/materialize", post(sprints::materialize_roadmap))
        .route("/api/v1/roadmap/overview", get(sprints::get_overview))
        .route("/api/v1/roadmap/phases/:id/progress", get(sprints::get_phase_progress))
        .route("/api/v1/hierarchy/query", get(sprints::query_hierarchy))
}
