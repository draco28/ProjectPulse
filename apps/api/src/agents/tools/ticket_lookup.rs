use async_trait::async_trait;
use pulsehive_core::error::{PulseHiveError, Result};
use serde_json::{json, Value};
use sqlx::PgPool;

use pulsehive_core::tool::{Tool, ToolContext, ToolResult};

/// Look up structured ticket details from PostgreSQL.
pub struct TicketLookupTool {
    pub db: PgPool,
}

#[async_trait]
impl Tool for TicketLookupTool {
    fn name(&self) -> &str {
        "lookup_ticket"
    }

    fn description(&self) -> &str {
        "Get structured ticket details: title, status, priority, kind, sprint, assignee, description. Use when the query references a specific ticket number."
    }

    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "ticket_number": {
                    "type": "integer",
                    "description": "Ticket number (e.g., 42 for ticket #42)"
                },
                "project_id": {
                    "type": "integer",
                    "description": "Project ID (default: 6)"
                }
            },
            "required": ["ticket_number"]
        })
    }

    async fn execute(&self, params: Value, _ctx: &ToolContext) -> Result<ToolResult> {
        let ticket_number = params["ticket_number"].as_i64().unwrap_or(0) as i32;
        let project_id = params["project_id"].as_i64().unwrap_or(6) as i32;

        let row = sqlx::query_as::<_, (i32, String, Option<String>, String, String, String, Option<String>, Option<i32>)>(
            r#"
            SELECT id, title, description, status, priority, kind, assignee, "sprintNumber"
            FROM tickets
            WHERE "ticketNumber" = $1 AND "projectId" = $2
            "#,
        )
        .bind(ticket_number)
        .bind(project_id)
        .fetch_optional(&self.db)
        .await
        .map_err(|e| PulseHiveError::tool(format!("ticket lookup query failed: {e}")))?;

        match row {
            Some((id, title, description, status, priority, kind, assignee, sprint)) => {
                Ok(ToolResult::Json(json!({
                    "found": true,
                    "ticket": {
                        "id": id,
                        "number": ticket_number,
                        "title": title,
                        "description": description.unwrap_or_default(),
                        "status": status,
                        "priority": priority,
                        "kind": kind,
                        "assignee": assignee,
                        "sprint": sprint,
                    }
                })))
            }
            None => Ok(ToolResult::Json(json!({
                "found": false,
                "message": format!("Ticket #{} not found in project {}", ticket_number, project_id)
            }))),
        }
    }
}
