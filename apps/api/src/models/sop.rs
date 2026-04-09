use serde::{Deserialize, Serialize};

// ============================================================================
// Request types
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSopRequest {
    pub project_id: i32,
    pub title: String,
    pub slug: String,
    pub description: String,
    pub content: String,
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSopRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSopsParams {
    pub project_id: Option<i32>,
    pub category: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetByIdOrSlugParams {
    pub project_id: Option<i32>,
}

// ============================================================================
// Response types
// ============================================================================

/// Full SOP (includes content).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SopResponse {
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub description: String,
    pub content: String,
    pub category: String,
    pub tags: Vec<String>,
    pub project_id: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// List item (excludes content for token efficiency).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SopListItem {
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}
