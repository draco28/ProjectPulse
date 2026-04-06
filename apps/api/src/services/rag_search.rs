use anyhow::Result;
use async_trait::async_trait;

use crate::models::rag::{RagContext, RagResult, SearchOptions};

/// Trait for RAG search implementations.
///
/// Sprint 4: `PgVectorRagService` (pgvector hybrid search).
/// Sprint 5: `AgenticRagService` wraps PgVectorRagService + HiveMind for complex queries.
///
/// Route handlers call `state.rag.search()` — they never know which
/// implementation is behind it.
#[async_trait]
pub trait RagService: Send + Sync {
    /// Search across all indexed content using hybrid retrieval (vector + keyword).
    async fn search(&self, query: &str, options: SearchOptions) -> Result<Vec<RagResult>>;

    /// Assemble a context document for a task, within a token budget.
    async fn get_context(&self, task: &str, project_id: i32, budget: usize)
        -> Result<RagContext>;
}

/// Stub implementation that returns empty results.
/// Will be replaced by PgVectorRagService once the rag_chunks table and
/// search logic are implemented.
pub struct StubRagService;

#[async_trait]
impl RagService for StubRagService {
    async fn search(&self, _query: &str, _options: SearchOptions) -> Result<Vec<RagResult>> {
        Ok(Vec::new())
    }

    async fn get_context(
        &self,
        _task: &str,
        _project_id: i32,
        _budget: usize,
    ) -> Result<RagContext> {
        Ok(RagContext {
            context: String::new(),
            sources: Vec::new(),
            token_count: 0,
        })
    }
}
