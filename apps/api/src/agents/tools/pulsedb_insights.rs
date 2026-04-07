use async_trait::async_trait;
use pulsehive_core::error::Result;
use serde_json::{json, Value};

use pulsehive_core::tool::{Tool, ToolContext, ToolResult};

/// Check PulseDB agent experience store for past insights and patterns.
/// Accesses PulseDB via ToolContext.substrate (owned by HiveMind).
pub struct PulseDBInsightsTool;

#[async_trait]
impl Tool for PulseDBInsightsTool {
    fn name(&self) -> &str {
        "check_insights"
    }

    fn description(&self) -> &str {
        "Check the agent experience store for past insights, patterns, and learned knowledge. Use to see if similar queries have been answered before or if agents have discovered relevant patterns."
    }

    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "Topic to search for in agent experiences (e.g., 'authentication', 'deployment')"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum insights to return (default: 5)"
                }
            },
            "required": ["topic"]
        })
    }

    async fn execute(&self, params: Value, ctx: &ToolContext) -> Result<ToolResult> {
        let topic = params["topic"].as_str().unwrap_or("");
        let _limit = params["limit"].as_i64().unwrap_or(5);

        // Access PulseDB via the substrate provider in ToolContext
        // The substrate is automatically provided by HiveMind
        let collectives = ctx.substrate.list_collectives().await?;

        if collectives.is_empty() {
            return Ok(ToolResult::Json(json!({
                "topic": topic,
                "insights": [],
                "message": "No collectives found in PulseDB"
            })));
        }

        // Get recent experiences from the first collective
        let collective_id = collectives[0].id;
        let recent = ctx.substrate.get_recent(collective_id, 10).await?;

        let insights: Vec<Value> = recent
            .iter()
            .filter(|exp| {
                exp.content.to_lowercase().contains(&topic.to_lowercase())
                    || exp.domain.iter().any(|d| d.to_lowercase().contains(&topic.to_lowercase()))
            })
            .take(5)
            .map(|exp| {
                json!({
                    "content": &exp.content[..exp.content.len().min(300)],
                    "type": format!("{:?}", exp.experience_type),
                    "importance": exp.importance,
                    "domains": exp.domain,
                })
            })
            .collect();

        Ok(ToolResult::Json(json!({
            "topic": topic,
            "insight_count": insights.len(),
            "insights": insights,
        })))
    }
}
