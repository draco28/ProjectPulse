pub mod agents;
pub mod config;
pub mod error;
pub mod middleware;
pub mod models;
pub mod response;
pub mod routes;
pub mod services;
pub mod state;

use axum::http::header;
use axum::http::HeaderValue;
use axum::http::Method;
use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::middleware::auth::require_auth;
use crate::state::AppState;

/// Build the Axum router with all middleware layers.
///
/// Public routes (health) have no auth.
/// Protected routes (/api/v1/*) go through the auth middleware.
pub fn build_router(state: AppState) -> Router {
    let origins: Vec<HeaderValue> = state
        .config
        .allowed_origins
        .iter()
        .filter_map(|o| o.parse().ok())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Protected routes get auth middleware
    let protected = routes::protected_routes().route_layer(axum::middleware::from_fn_with_state(
        state.clone(),
        require_auth,
    ));

    Router::new()
        .merge(routes::public_routes())
        .merge(protected)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
