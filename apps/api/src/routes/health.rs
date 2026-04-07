use axum::extract::State;
use axum::response::Response;
use serde::Serialize;

use crate::response;
use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthData {
    pub status: String,
    pub database: String,
    pub pulsedb: String,
    pub version: String,
}

/// GET /health — checks PostgreSQL and PulseDB connectivity.
///
/// Returns `{ "data": { "status": "healthy", ... }, "error": null }`
pub async fn health(State(state): State<AppState>) -> Response {
    let db_status = check_postgres(&state).await;
    let pulsedb_status = check_pulsedb(&state).await;

    let all_healthy = db_status.is_ok() && pulsedb_status.is_ok();

    let data = HealthData {
        status: if all_healthy { "healthy" } else { "unhealthy" }.to_string(),
        database: if db_status.is_ok() {
            "connected"
        } else {
            "disconnected"
        }
        .to_string(),
        pulsedb: if pulsedb_status.is_ok() {
            "connected"
        } else {
            "disconnected"
        }
        .to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    };

    if all_healthy {
        response::success(data)
    } else {
        response::failure(
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            "UNHEALTHY",
            "one or more services unavailable",
        )
    }
}

async fn check_postgres(state: &AppState) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT 1").execute(&state.db).await?;
    Ok(())
}

async fn check_pulsedb(state: &AppState) -> Result<(), String> {
    state
        .hive
        .substrate()
        .list_collectives()
        .await
        .map_err(|e| format!("PulseDB check failed: {e}"))?;
    Ok(())
}
