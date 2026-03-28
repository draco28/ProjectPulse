pub mod config;
pub mod error;
pub mod routes;
pub mod state;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

/// Build the Axum router with all middleware layers.
///
/// Separated from main.rs so tests can create a router
/// without starting the actual server.
pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any) // Tightened per-environment in production
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .merge(routes::routes())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
