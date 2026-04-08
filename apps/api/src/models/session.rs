use serde::{Deserialize, Serialize};
use serde_json::Value;

// ============================================================================
// Request types
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartSessionRequest {
    pub project_id: i32,
    pub name: Option<String>,
    pub plan: Option<String>,
    pub todos: Option<Value>,
    pub active_ticket_ids: Option<Vec<i32>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSessionRequest {
    pub name: Option<String>,
    pub plan: Option<String>,
    pub todos: Option<Value>,
    pub progress: Option<String>,
    pub append_progress: Option<bool>,
    pub active_ticket_ids: Option<Vec<i32>>,
    pub status: Option<String>,
    pub token_count: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EndSessionRequest {
    pub progress: Option<String>,
    pub token_count: Option<i32>,
}

// ============================================================================
// Response types
// ============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    pub id: String,
    pub project_id: i32,
    pub name: Option<String>,
    pub plan: Option<String>,
    pub todos: Option<Value>,
    pub progress: Option<String>,
    pub active_ticket_ids: Vec<String>,
    pub status: String,
    pub token_count: Option<i32>,
    pub started_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
}

/// Lightweight session summary for context_load responses.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    pub id: String,
    pub name: Option<String>,
    pub plan: Option<String>,
    pub todos: Option<Value>,
    pub progress: Option<String>,
    pub active_ticket_ids: Vec<String>,
    pub status: String,
    pub started_at: String,
}
