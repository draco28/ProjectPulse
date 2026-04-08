use serde::{Deserialize, Serialize};

// ============================================================================
// Request types
// ============================================================================

/// POST /api/v1/knowledge — create knowledge item.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateKnowledgeRequest {
    pub project_id: i32,
    pub title: String,
    pub content: String,
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub allow_duplicates: bool,
}

/// GET /api/v1/knowledge — list query params.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListKnowledgeParams {
    pub project_id: Option<i32>,
    pub search: Option<String>,
    pub tag: Option<String>,
    pub category: Option<String>,
    pub sort: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
    pub include_archived: Option<bool>,
}

/// GET /api/v1/knowledge/search — search query params.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchKnowledgeParams {
    pub project_id: Option<i32>,
    pub query: Option<String>,
    pub mode: Option<String>,
    pub limit: Option<i32>,
    pub category: Option<String>,
}

/// GET /api/v1/knowledge/related — related items query params.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RelatedKnowledgeParams {
    pub project_id: Option<i32>,
    pub item_id: Option<i32>,
    pub max_depth: Option<i32>,
    pub limit: Option<i32>,
    pub min_strength: Option<f64>,
}

/// GET /api/v1/knowledge/metrics — metrics query params.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsParams {
    pub project_id: Option<i32>,
    pub days: Option<i32>,
}

/// GET /api/v1/knowledge/export — export query params.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportParams {
    pub project_id: Option<i32>,
    pub format: Option<String>,
}

/// POST /api/v1/knowledge/import — import request body.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportKnowledgeRequest {
    pub project_id: i32,
    pub items: Vec<ImportItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportItem {
    pub title: String,
    pub content: String,
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

/// POST /api/v1/knowledge/:id/archive — archive toggle.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveRequest {
    #[serde(default = "default_true")]
    pub archive: bool,
}

fn default_true() -> bool {
    true
}

// ============================================================================
// Response types
// ============================================================================

/// Full knowledge item response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeResponse {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: Vec<String>,
    pub project_id: i32,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
}

/// List item (with excerpt instead of full content).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeListItem {
    pub id: i32,
    pub title: String,
    pub excerpt: String,
    pub category: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Search result with score.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeSearchResult {
    pub id: i32,
    pub title: String,
    pub excerpt: String,
    pub category: String,
    pub tags: Vec<String>,
    pub score: f64,
    pub match_type: String,
}

/// Search response envelope.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResponse {
    pub results: Vec<KnowledgeSearchResult>,
    pub query: String,
    pub mode: String,
    pub count: usize,
}

/// Related item with relationship metadata.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelatedItem {
    pub id: i32,
    pub title: String,
    pub category: String,
    pub relation_type: String,
    pub strength: f64,
    pub depth: i32,
}

/// Related items response envelope.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelatedResponse {
    pub source_item_id: i32,
    pub related_items: Vec<RelatedItem>,
    pub count: usize,
}

/// Metrics summary.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsResponse {
    pub total_items: i64,
    pub items_by_category: Vec<CategoryCount>,
    pub recent_items: i64,
    pub archived_items: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
}

/// Import result.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResponse {
    pub imported: i32,
    pub skipped: i32,
    pub errors: Vec<String>,
}

/// Export item (full data).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportItem {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}
