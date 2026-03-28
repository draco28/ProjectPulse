pub mod health;

use axum::routing::get;
use axum::Router;

use crate::state::AppState;

/// Compose all route groups into a single Router.
pub fn routes() -> Router<AppState> {
    Router::new().route("/health", get(health::health))
}
