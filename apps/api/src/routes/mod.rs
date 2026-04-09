pub mod auth_validate;
pub mod batch;
pub mod context;
pub mod health;
pub mod kanban;
pub mod knowledge;
pub mod me;
pub mod observability;
pub mod personas;
pub mod proxy;
pub mod rag;
pub mod sessions;
pub mod skills;
pub mod sops;
pub mod sprints;
pub mod tickets;
pub mod wiki;
pub mod workflows;

use axum::routing::{get, post};
use axum::Router;

use crate::state::AppState;

/// Public routes — no authentication required.
pub fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::health))
        // Agent auth validation is public — it IS the auth check (Sprint 7 Batch 5)
        .route("/api/v1/agent-auth/validate", post(auth_validate::validate))
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
        // Phase/Sprint management (Sprint 8)
        .route("/api/v1/phases", post(sprints::create_phase))
        .route("/api/v1/phases/:id", get(sprints::get_phase).put(sprints::update_phase_progress))
        .route("/api/v1/sprints/:id/progress", axum::routing::put(sprints::update_sprint_progress))
        // Knowledge (Sprint 7 Batch 1)
        .route("/api/v1/knowledge", post(knowledge::create).get(knowledge::list))
        .route("/api/v1/knowledge/search", get(knowledge::search))
        .route("/api/v1/knowledge/metrics", get(knowledge::metrics))
        .route("/api/v1/knowledge/related", get(knowledge::related))
        .route("/api/v1/knowledge/export", get(knowledge::export))
        .route("/api/v1/knowledge/import", post(knowledge::import))
        .route("/api/v1/knowledge/:id", get(knowledge::get_by_id))
        .route("/api/v1/knowledge/:id/archive", post(knowledge::archive))
        // Skills (Sprint 7 Batch 2)
        .route("/api/v1/skills", post(skills::create).get(skills::list))
        .route("/api/v1/skills/search", get(skills::search))
        .route("/api/v1/skills/:slug", get(skills::get_by_slug).patch(skills::update))
        // SOPs (Sprint 7 Batch 2)
        .route("/api/v1/sops", post(sops::create).get(sops::list))
        .route("/api/v1/sops/by-slug/:slug", get(sops::get_by_slug))
        .route("/api/v1/sops/:id", get(sops::get_by_id).patch(sops::update))
        // Personas (Sprint 7 Batch 2)
        .route("/api/v1/personas", post(personas::create).get(personas::list))
        .route("/api/v1/personas/by-slug/:slug", get(personas::get_by_slug))
        .route("/api/v1/personas/:id", get(personas::get_by_id).patch(personas::update))
        // Sessions (Sprint 7 Batch 4)
        .route("/api/v1/agent-sessions", post(sessions::create))
        .route("/api/v1/agent-sessions/:id", get(sessions::get).patch(sessions::update))
        .route("/api/v1/agent-sessions/:id/end", post(sessions::end))
        .route("/api/v1/agent-sessions/:id/resume", post(sessions::resume))
        // Context/Memory (Sprint 7 Batch 4)
        .route("/api/v1/context/load", get(context::load))
        .route("/api/v1/context/update", axum::routing::put(context::update))
        .route("/api/v1/memory/session-start", get(context::session_start))
        .route("/api/v1/memory/pattern-lookup", get(context::pattern_lookup))
        .route("/api/v1/memory/context-recovery", get(context::context_recovery))
        // Wiki (Sprint 7 Batch 3) — static routes first, wildcard last
        .route("/api/v1/wiki", post(wiki::create).get(wiki::list))
        .route("/api/v1/wiki/generate", post(wiki::generate))
        .route("/api/v1/wiki/analytics/summary", get(wiki::analytics_summary))
        .route("/api/v1/wiki/*path", get(wiki::wildcard_get)
            .patch(wiki::wildcard_patch)
            .delete(wiki::wildcard_delete)
            .post(wiki::wildcard_post))
        // Workflows (Sprint 7 Batch 5)
        .route("/api/v1/workflows", get(workflows::list))
        .route("/api/v1/workflows/run", post(workflows::start))
        .route("/api/v1/workflows/run/:id", get(workflows::get_status))
        .route("/api/v1/workflows/run/:id/execute", post(workflows::execute_step))
        .route("/api/v1/workflows/run/:id/pause", post(workflows::pause))
        .route("/api/v1/workflows/run/:id/resume", post(workflows::resume))
        .route("/api/v1/workflows/run/:id/complete", post(workflows::complete))
        // Batch creates (Sprint 7 Batch 5)
        .route("/api/v1/batch/agent-personas", post(batch::batch_personas))
        .route("/api/v1/batch/skills", post(batch::batch_skills))
        .route("/api/v1/batch/sops", post(batch::batch_sops))
        .route("/api/v1/batch/workflow-templates", post(batch::batch_workflows))
        // Observability (Sprint 7 Batch 5)
        .route("/api/v1/observability/log-step", post(observability::log_step))
        .route("/api/v1/observability/complete-session", post(observability::complete_session))
        // Reverse proxy fallback — MUST be last (Sprint 7 Batch 5)
        .fallback(proxy::forward_to_nextjs)
}
