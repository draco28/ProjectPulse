use serde::{Deserialize, Serialize};

// ============================================================================
// Request types
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSkillRequest {
    pub project_id: i32,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub category: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub frameworks: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSkillRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub frameworks: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSkillsParams {
    pub project_id: Option<i32>,
    pub category: Option<String>,
    pub tags: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchSkillsParams {
    pub project_id: Option<i32>,
    pub query: Option<String>,
    pub category: Option<String>,
    pub limit: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetBySlugParams {
    pub project_id: Option<i32>,
}

// ============================================================================
// Response types
// ============================================================================

/// Full skill (includes content).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillResponse {
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub frameworks: Vec<String>,
    pub usage_count: i32,
    pub project_id: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// List item (excludes content for token efficiency).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillListItem {
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub category: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub frameworks: Vec<String>,
    pub usage_count: i32,
    pub created_at: String,
    pub updated_at: String,
}
