use serde::{Deserialize, Serialize};
use serde_json::Value;

// ============================================================================
// Request types
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePersonaRequest {
    pub project_id: i32,
    pub name: String,
    pub slug: String,
    pub system_prompt: String,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub skills: Vec<String>,
    #[serde(default)]
    pub tools: Vec<String>,
    #[serde(default)]
    pub rules: Vec<String>,
    #[serde(default)]
    pub expertise: Vec<String>,
    #[serde(default)]
    pub personality: Option<String>,
    #[serde(default)]
    pub is_active: bool,
    #[serde(default)]
    pub auto_activate: bool,
    #[serde(default)]
    pub activation_conditions: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePersonaRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub system_prompt: Option<String>,
    pub icon: Option<String>,
    pub skills: Option<Vec<String>>,
    pub tools: Option<Vec<String>>,
    pub rules: Option<Vec<String>>,
    pub expertise: Option<Vec<String>>,
    pub personality: Option<String>,
    pub is_active: Option<bool>,
    pub auto_activate: Option<bool>,
    pub activation_conditions: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListPersonasParams {
    pub project_id: Option<i32>,
    pub is_active: Option<bool>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetPersonaParams {
    pub project_id: Option<i32>,
}

// ============================================================================
// Response types
// ============================================================================

/// Full persona (includes systemPrompt).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonaResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub system_prompt: String,
    pub skills: Vec<String>,
    pub tools: Vec<String>,
    pub rules: Vec<String>,
    pub expertise: Vec<String>,
    pub personality: Option<String>,
    pub is_active: bool,
    pub is_built_in: bool,
    pub auto_activate: bool,
    pub project_id: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// List item (excludes systemPrompt for token efficiency).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonaListItem {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub skills: Vec<String>,
    pub expertise: Vec<String>,
    pub is_active: bool,
    pub is_built_in: bool,
    pub created_at: String,
    pub updated_at: String,
}
