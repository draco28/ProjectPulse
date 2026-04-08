use serde::{Deserialize, Serialize};

// ============================================================================
// Request types
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWikiPageRequest {
    pub project_id: i32,
    pub title: String,
    pub path: String,
    pub content: String,
    pub category: Option<String>,
    pub excerpt: Option<String>,
    pub tags: Option<Vec<String>>,
    pub parent_path: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWikiPageRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub excerpt: Option<String>,
    pub tags: Option<Vec<String>>,
    pub parent_path: Option<String>,
    pub changelog: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListWikiParams {
    pub project_id: Option<i32>,
    pub category: Option<String>,
    pub search: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiPathParams {
    pub project_id: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryParams {
    pub project_id: Option<i32>,
    pub limit: Option<i32>,
    pub cursor: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateRequest {
    pub project_id: i32,
    pub project_path: Option<String>,
    pub overwrite_existing: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertRequest {
    pub version: i32,
}

// ============================================================================
// Response types
// ============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiPageResponse {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub path: String,
    pub category: Option<String>,
    pub excerpt: Option<String>,
    pub version: i32,
    pub tags: Vec<String>,
    pub project_id: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiPageDetailResponse {
    pub page: WikiPageResponse,
    pub related_pages: Vec<RelatedPage>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelatedPage {
    pub id: i32,
    pub title: String,
    pub path: String,
    pub category: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiListItem {
    pub id: i32,
    pub title: String,
    pub path: String,
    pub category: Option<String>,
    pub excerpt: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub highlight: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiListResponse {
    pub pages: Vec<WikiListItem>,
    pub pagination: WikiPagination,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiPagination {
    pub total: i64,
    pub limit: i32,
    pub offset: i32,
    pub has_more: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiRevisionResponse {
    pub version: i32,
    pub title: String,
    pub excerpt: Option<String>,
    pub created_by: Option<String>,
    pub created_by_type: Option<String>,
    pub created_at: String,
    pub diff_summary: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WikiHistoryResponse {
    pub revisions: Vec<WikiRevisionResponse>,
    pub pagination: HistoryPagination,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryPagination {
    pub limit: i32,
    pub next_cursor: Option<i32>,
    pub has_more: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsSummaryResponse {
    pub top_pages: Vec<TopPageItem>,
    pub trending_tags: Vec<TagCount>,
    pub feedback: FeedbackSummary,
    pub generated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopPageItem {
    pub id: i32,
    pub title: String,
    pub path: String,
    pub category: Option<String>,
    pub views: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagCount {
    pub tag: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedbackSummary {
    pub positive: i64,
    pub negative: i64,
    pub total_views: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateResponse {
    pub pages_created: i32,
    pub pages_updated: i32,
    pub pages_skipped: i32,
}
