use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub database: String,
    pub pulsedb: String,
    pub version: String,
}

/// GET /health — checks PostgreSQL and PulseDB connectivity.
///
/// Returns 200 with `{"status":"healthy","database":"connected","pulsedb":"connected"}`
/// Returns 503 if either database check fails.
pub async fn health(State(state): State<AppState>) -> impl IntoResponse {
    let db_status = check_postgres(&state).await;
    let pulsedb_status = check_pulsedb(&state).await;

    let all_healthy = db_status.is_ok() && pulsedb_status.is_ok();

    let response = HealthResponse {
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

    let status_code = if all_healthy {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (status_code, Json(response))
}

async fn check_postgres(state: &AppState) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT 1").execute(&state.db).await?;
    Ok(())
}

async fn check_pulsedb(state: &AppState) -> Result<(), String> {
    // Verify PulseDB is accessible via HiveMind's substrate
    // HiveMind owns PulseDB exclusively — check by listing collectives
    state
        .hive
        .substrate()
        .list_collectives()
        .await
        .map_err(|e| format!("PulseDB check failed: {e}"))?;
    Ok(())
}
