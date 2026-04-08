use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::models::session::SessionSummary;

// ============================================================================
// Request types
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextLoadParams {
    pub project_id: Option<i32>,
    pub banks_to_load: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextUpdateRequest {
    pub project_id: i32,
    pub bank_type: String,
    pub content: String,
    pub mode: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternLookupParams {
    pub project_id: Option<i32>,
    pub bank_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextRecoveryParams {
    pub project_id: Option<i32>,
}

// ============================================================================
// Response types
// ============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextLoadResponse {
    pub project_id: i32,
    pub project_name: String,
    pub memory_banks: Value,
    pub active_sessions: Vec<SessionSummary>,
    pub available_resources: ResourceCounts,
    pub onboarding_status: OnboardingStatus,
    pub hints: Vec<String>,
    pub total_tokens: i32,
    pub timestamp: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryBankData {
    pub content: String,
    pub tokens: i32,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceCounts {
    pub personas: ResourceMeta,
    pub skills: ResourceMeta,
    pub sops: ResourceMeta,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceMeta {
    pub count: i64,
    pub names: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingStatus {
    pub is_complete: bool,
    pub completed_sessions: i32,
    pub next_session: Option<i32>,
    pub in_progress_session: Option<i32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextUpdateResponse {
    pub bank_type: String,
    pub content: String,
    pub tokens: i32,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternLookupResponse {
    #[serde(rename = "type")]
    pub bank_type: String,
    pub content: String,
    pub tokens: i32,
}
