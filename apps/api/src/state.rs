use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use pulsedb::PulseDB;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use tokio::sync::RwLock;

use crate::config::Config;
use crate::services::embeddings::EmbeddingService;
use crate::services::rag_search::RagService;

/// Tracks background ingestion job status.
#[derive(Debug, Clone)]
pub struct IngestJobStatus {
    pub status: String,
    pub processed: usize,
    pub total: usize,
    pub errors: Vec<String>,
}

/// Shared application state, available to all Axum handlers via `State<AppState>`.
///
/// Sprint 4 adds: `rag`, `embeddings`, `jobs`.
/// Sprint 5 will add: `hive` (PulseHive HiveMind).
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: PgPool,
    pub pulsedb: Arc<PulseDB>,
    pub rag: Arc<dyn RagService>,
    pub embeddings: Arc<EmbeddingService>,
    pub jobs: Arc<RwLock<HashMap<String, IngestJobStatus>>>,
}

impl AppState {
    /// Initialize application state: connect to PostgreSQL and open PulseDB.
    pub async fn new(config: Config) -> anyhow::Result<Self> {
        let connect_options: PgConnectOptions = config.database_url.parse()?;

        let db = PgPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(Duration::from_secs(5))
            .idle_timeout(Duration::from_secs(600))
            .connect_with(connect_options)
            .await?;

        tracing::info!("connected to PostgreSQL");

        let pulsedb_path = config.pulsedb_path.clone();
        let pulsedb = tokio::task::spawn_blocking(move || -> anyhow::Result<PulseDB> {
            let pulsedb_config = pulsedb::Config::with_builtin_embeddings();
            let db = PulseDB::open(&pulsedb_path, pulsedb_config)?;

            let collectives = db.list_collectives()?;
            if !collectives.iter().any(|c| c.name == "projectpulse") {
                db.create_collective("projectpulse")?;
            }

            Ok(db)
        })
        .await
        .map_err(|e| anyhow::anyhow!("PulseDB task join error: {e}"))??;

        tracing::info!(path = %config.pulsedb_path, "PulseDB opened");

        let embeddings = Arc::new(EmbeddingService::from_env());
        tracing::info!("EmbeddingService initialized");

        let rag: Arc<dyn RagService> = Arc::new(
            crate::services::rag_search::PgVectorRagService::new(
                db.clone(),
                (*embeddings).clone(),
            ),
        );

        Ok(Self {
            config: Arc::new(config),
            db,
            pulsedb: Arc::new(pulsedb),
            rag,
            embeddings,
            jobs: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Register a new ingestion job in the tracker.
    /// Must be awaited before spawning the background task to prevent race conditions.
    pub async fn register_job(&self, job_id: &str) {
        self.jobs.write().await.insert(
            job_id.to_string(),
            IngestJobStatus {
                status: "running".to_string(),
                processed: 0,
                total: 0,
                errors: Vec::new(),
            },
        );
    }
}
