use async_trait::async_trait;
use pulsehive_core::error::{PulseHiveError, Result};
use serde_json::{json, Value};
use sqlx::PgPool;

use pulsehive_core::tool::{Tool, ToolContext, ToolResult};

use crate::services::embeddings::EmbeddingService;
use crate::services::hybrid_search;

/// Hybrid pgvector + tsvector search over rag_chunks table.
///
/// Sprint 9: Now uses the shared `services::hybrid_search` module so it gets
/// real RRF hybrid search instead of the previous "ORDER BY created_at DESC"
/// placeholder. Same implementation as the production /rag/search endpoint.
pub struct PgVectorSearchTool {
    pub db: PgPool,
    pub embeddings: EmbeddingService,
    pub project_id: i32,
}

#[async_trait]
impl Tool for PgVectorSearchTool {
    fn name(&self) -> &str {
        "search_content"
    }

    fn description(&self) -> &str {
        "Search ProjectPulse content (wiki, tickets, SOPs, skills, knowledge) via hybrid semantic+keyword search. Returns ranked chunks with source metadata."
    }

    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language search query"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum results to return (default: 10)"
                },
                "source_types": {
                    "type": "string",
                    "description": "Comma-separated source filter (e.g., 'wiki,ticket')"
                }
            },
            "required": ["query"]
        })
    }

    async fn execute(&self, params: Value, _ctx: &ToolContext) -> Result<ToolResult> {
        let query = params["query"].as_str().unwrap_or("");
        let limit = params["limit"].as_u64().unwrap_or(10) as usize;
        let source_types: Option<Vec<String>> = params["source_types"]
            .as_str()
            .map(|s| s.split(',').map(|t| t.trim().to_string()).collect());

        let scored = hybrid_search::hybrid_search(
            &self.db,
            &self.embeddings,
            query,
            self.project_id,
            limit,
            source_types.as_deref(),
        )
        .await
        .map_err(|e| PulseHiveError::tool(format!("hybrid search failed: {e}")))?;

        let results: Vec<Value> = scored
            .into_iter()
            .map(|chunk| {
                let preview_len = chunk.content.len().min(500);
                json!({
                    "id": chunk.id,
                    "content": &chunk.content[..preview_len],
                    "source_type": chunk.source_type,
                    "source_id": chunk.source_id,
                    "section": chunk.section_title,
                    "domain_tags": chunk.domain_tags,
                    "score": chunk.rrf_score,
                })
            })
            .collect();

        Ok(ToolResult::Json(json!({
            "query": query,
            "count": results.len(),
            "results": results,
        })))
    }
}
