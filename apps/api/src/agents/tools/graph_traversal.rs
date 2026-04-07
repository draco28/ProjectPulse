use async_trait::async_trait;
use pulsehive_core::error::{PulseHiveError, Result};
use serde_json::{json, Value};
use sqlx::PgPool;

use pulsehive_core::tool::{Tool, ToolContext, ToolResult};

/// Follow knowledge graph relations from a chunk to find connected chunks.
pub struct GraphTraversalTool {
    pub db: PgPool,
}

#[async_trait]
impl Tool for GraphTraversalTool {
    fn name(&self) -> &str {
        "follow_relations"
    }

    fn description(&self) -> &str {
        "Follow knowledge graph relations from a chunk to find connected chunks. Use after search_content to get deeper context via Elaborates, References, Supports relations."
    }

    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "chunk_id": {
                    "type": "integer",
                    "description": "ID of the chunk to find relations for"
                },
                "direction": {
                    "type": "string",
                    "enum": ["outgoing", "incoming", "both"],
                    "description": "Relation direction (default: both)"
                }
            },
            "required": ["chunk_id"]
        })
    }

    async fn execute(&self, params: Value, _ctx: &ToolContext) -> Result<ToolResult> {
        let chunk_id = params["chunk_id"].as_i64().unwrap_or(0) as i32;

        let rows = sqlx::query_as::<_, (String, String, i32, Option<String>, String)>(
            r#"
            SELECT
                r.relation_type,
                c.content,
                c.source_id,
                c.section_title,
                c.source_type
            FROM rag_relations r
            JOIN rag_chunks c ON c.id = r.to_chunk_id
            WHERE r.from_chunk_id = $1
            UNION ALL
            SELECT
                r.relation_type,
                c.content,
                c.source_id,
                c.section_title,
                c.source_type
            FROM rag_relations r
            JOIN rag_chunks c ON c.id = r.from_chunk_id
            WHERE r.to_chunk_id = $1
            "#,
        )
        .bind(chunk_id)
        .fetch_all(&self.db)
        .await
        .map_err(|e| PulseHiveError::tool(format!("graph traversal query failed: {e}")))?;

        let relations: Vec<Value> = rows
            .iter()
            .map(|(rel_type, content, source_id, section, source_type)| {
                json!({
                    "relation": rel_type,
                    "content": &content[..content.len().min(300)],
                    "source_type": source_type,
                    "source_id": source_id,
                    "section": section,
                })
            })
            .collect();

        Ok(ToolResult::Json(json!({
            "chunk_id": chunk_id,
            "relation_count": relations.len(),
            "relations": relations,
        })))
    }
}
