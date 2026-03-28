use std::sync::Arc;
use std::time::Duration;

use pulsedb::PulseDB;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;

use crate::config::Config;

/// Shared application state, available to all Axum handlers via `State<AppState>`.
///
/// Wraps database connections behind Arc for cheap cloning (Axum requirement).
/// Both PgPool (sqlx) and PulseDB are thread-safe and can be shared across tasks.
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: PgPool,
    pub pulsedb: Arc<PulseDB>,
}

impl AppState {
    /// Initialize application state: connect to PostgreSQL and open PulseDB.
    pub async fn new(config: Config) -> anyhow::Result<Self> {
        // sqlx PostgreSQL connection pool
        let connect_options: PgConnectOptions = config.database_url.parse()?;

        let db = PgPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(Duration::from_secs(5))
            .idle_timeout(Duration::from_secs(600))
            .connect_with(connect_options)
            .await?;

        tracing::info!("connected to PostgreSQL");

        // PulseDB embedded database (builtin ONNX embeddings, 384d all-MiniLM-L6-v2)
        let pulsedb_config = pulsedb::Config::with_builtin_embeddings();
        let pulsedb = PulseDB::open(&config.pulsedb_path, pulsedb_config)?;

        // Ensure a default collective exists for this project
        let collectives = pulsedb.list_collectives()?;
        let _collective = match collectives.iter().find(|c| c.name == "projectpulse") {
            Some(c) => c.id,
            None => pulsedb.create_collective("projectpulse")?,
        };
        tracing::info!(path = %config.pulsedb_path, "PulseDB opened");

        Ok(Self {
            config: Arc::new(config),
            db,
            pulsedb: Arc::new(pulsedb),
        })
    }
}
