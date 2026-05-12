use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use pulsehive::HiveMind;
use pulsehive_core::llm::LlmProvider;
use pulsehive_openai::{OpenAICompatibleProvider, OpenAIConfig};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use tokio::sync::RwLock;

use crate::agents;
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
/// Sprint 5: `pulsedb` removed — HiveMind owns PulseDB exclusively.
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: PgPool,
    pub hive: Arc<HiveMind>,
    pub rag: Arc<dyn RagService>,
    pub embeddings: Arc<EmbeddingService>,
    pub jobs: Arc<RwLock<HashMap<String, IngestJobStatus>>>,
    /// Direct LLM provider handle for chat streaming (Sprint 9).
    /// `None` if `LLM_API_KEY` is unset — chat endpoints return a clear error.
    pub llm: Option<Arc<dyn LlmProvider>>,
}

impl AppState {
    /// Initialize application state: connect to PostgreSQL, build HiveMind (owns PulseDB).
    pub async fn new(config: Config) -> anyhow::Result<Self> {
        let connect_options: PgConnectOptions = config.database_url.parse()?;

        let db = PgPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(Duration::from_secs(5))
            .idle_timeout(Duration::from_secs(600))
            .connect_with(connect_options)
            .await?;

        tracing::info!("connected to PostgreSQL");

        // HiveMind owns PulseDB exclusively (opens via substrate_path)
        let hive = agents::build_hivemind(&config).await?;
        tracing::info!("HiveMind initialized (PulseDB owned)");

        let embeddings = Arc::new(EmbeddingService::from_env());
        tracing::info!("EmbeddingService initialized");

        // RAG service — AgenticRagService wraps PgVector (fast) + HiveMind (complex)
        let simple_rag = crate::services::rag_search::PgVectorRagService::new(
            db.clone(),
            (*embeddings).clone(),
        );
        let rag: Arc<dyn RagService> = Arc::new(
            crate::services::rag_search::AgenticRagService::new(
                simple_rag,
                hive.clone(),
                db.clone(),
                "ollama-cloud".to_string(),
                config.llm_model.clone(),
            ),
        );

        // Sprint 9: Direct LLM provider for chat streaming (bypasses HiveMind agent loop).
        // Only constructed if API key is configured — chat endpoints surface a clear
        // error if `LLM_API_KEY` is unset.
        let llm: Option<Arc<dyn LlmProvider>> = config.llm_api_key.as_ref().map(|key| {
            let provider = OpenAICompatibleProvider::new(
                OpenAIConfig::new(key, &config.llm_model)
                    .with_base_url(&config.llm_base_url)
                    .with_timeout(120),
            );
            Arc::new(provider) as Arc<dyn LlmProvider>
        });

        Ok(Self {
            config: Arc::new(config),
            db,
            hive,
            rag,
            embeddings,
            jobs: Arc::new(RwLock::new(HashMap::new())),
            llm,
        })
    }

    /// Register a new ingestion job in the tracker.
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
