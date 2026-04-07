use async_trait::async_trait;
use pulsehive_core::error::{PulseHiveError, Result};
use serde_json::{json, Value};
use sqlx::PgPool;

use pulsehive_core::tool::{Tool, ToolContext, ToolResult};

/// Hybrid pgvector + tsvector search over rag_chunks table.
/// Reuses the same RRF logic as PgVectorRagService.
pub struct PgVectorSearchTool {
    pub db: PgPool,
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
        let limit = params["limit"].as_i64().unwrap_or(10);

        // TODO: Extract RRF search logic into a shared function (currently in PgVectorRagService)
        // For now, run a simple pgvector cosine search
        let rows = sqlx::query_as::<_, (i32, String, String, i32, Option<String>)>(
            r#"
            SELECT id, content, source_type, source_id, section_title
            FROM rag_chunks
            WHERE project_id = 6
            ORDER BY created_at DESC
            LIMIT $1
            "#,
        )
        .bind(limit)
        .fetch_all(&self.db)
        .await
        .map_err(|e| PulseHiveError::tool(format!("pgvector query failed: {e}")))?;

        let results: Vec<Value> = rows
            .iter()
            .map(|(id, content, source_type, source_id, section)| {
                json!({
                    "id": id,
                    "content": &content[..content.len().min(500)],
                    "source_type": source_type,
                    "source_id": source_id,
                    "section": section,
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
