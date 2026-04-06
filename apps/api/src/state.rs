use std::sync::Arc;
use std::time::Duration;

use pulsedb::PulseDB;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;

use crate::config::Config;
use crate::services::embeddings::EmbeddingService;
use crate::services::rag_search::RagService;

/// Shared application state, available to all Axum handlers via `State<AppState>`.
///
/// Wraps database connections behind Arc for cheap cloning (Axum requirement).
/// Both PgPool (sqlx) and PulseDB are thread-safe and can be shared across tasks.
///
/// Sprint 4 adds: `rag` (RagService trait) and `embeddings` (Ollama HTTP client).
/// Sprint 5 will add: `hive` (PulseHive HiveMind).
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: PgPool,
    pub pulsedb: Arc<PulseDB>,
    pub rag: Arc<dyn RagService>,
    pub embeddings: Arc<EmbeddingService>,
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
        // Wrapped in spawn_blocking because PulseDB uses sync I/O (redb)
        let pulsedb_path = config.pulsedb_path.clone();
        let pulsedb = tokio::task::spawn_blocking(move || -> anyhow::Result<PulseDB> {
            let pulsedb_config = pulsedb::Config::with_builtin_embeddings();
            let db = PulseDB::open(&pulsedb_path, pulsedb_config)?;

            // Ensure a default collective exists for this project
            let collectives = db.list_collectives()?;
            if !collectives.iter().any(|c| c.name == "projectpulse") {
                db.create_collective("projectpulse")?;
            }

            Ok(db)
        })
        .await
        .map_err(|e| anyhow::anyhow!("PulseDB task join error: {e}"))??;

        tracing::info!(path = %config.pulsedb_path, "PulseDB opened");

        // Embedding service (Ollama HTTP)
        let embeddings = Arc::new(EmbeddingService::from_env());
        tracing::info!("EmbeddingService initialized");

        // RAG service (stub — replaced by PgVectorRagService after migration)
        let rag: Arc<dyn RagService> =
            Arc::new(crate::services::rag_search::StubRagService);

        Ok(Self {
            config: Arc::new(config),
            db,
            pulsedb: Arc::new(pulsedb),
            rag,
            embeddings,
        })
    }
}
