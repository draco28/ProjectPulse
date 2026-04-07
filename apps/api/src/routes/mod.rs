pub mod health;
pub mod me;
pub mod rag;

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
}
