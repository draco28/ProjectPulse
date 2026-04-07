use serde::{Deserialize, Serialize};
use serde_json::Value;

// ============================================================================
// Enums
// ============================================================================

/// Ticket kind (type of work item).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TicketKind {
    Feature,
    Task,
    Epic,
    Issue,
    Bug,
    ScannerFinding,
    TechDebt,
}

/// Ticket source (who created it).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TicketSource {
    Manual,
    Scanner,
    Agent,
    Onboarding,
}

/// Kanban status (column).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum KanbanStatus {
    Backlog,
    Todo,
    InProgress,
    InReview,
    Done,
}

impl KanbanStatus {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Backlog => "backlog",
            Self::Todo => "todo",
            Self::InProgress => "in-progress",
            Self::InReview => "in-review",
            Self::Done => "done",
        }
    }
}

// ============================================================================
// Request types
// ============================================================================

/// POST /api/v1/tickets — create ticket.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTicketRequest {
    pub title: String,
    pub kind: TicketKind,
    pub source: TicketSource,
    pub project_id: i32,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub module: Option<String>,
    pub assignee: Option<String>,
    pub assignee_type: Option<String>,
    pub assignee_id: Option<String>,
    pub sprint_number: Option<i32>,
    pub parent_ticket_id: Option<i32>,
    pub epic_ref: Option<String>,
    pub backlog_refs: Option<Vec<String>>,
    pub estimated_days: Option<i32>,
    pub custom_fields: Option<Value>,
    pub label_ids: Option<Vec<i32>>,
    pub display_order: Option<i32>,
    pub context: Option<TicketContext>,
}

/// Context metadata for ticket creation.
#[derive(Debug, Deserialize, Serialize)]
pub struct TicketContext {
    pub files: Option<Vec<TicketFile>>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketFile {
    pub file_path: String,
    pub line_number: Option<i32>,
    pub snippet: Option<String>,
}

/// PATCH /api/v1/tickets/:id — partial update.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTicketRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub kind: Option<TicketKind>,
    pub module: Option<String>,
    pub assignee: Option<String>,
    pub assignee_type: Option<String>,
    pub assignee_id: Option<String>,
    pub sprint_number: Option<i32>,
    pub parent_ticket_id: Option<i32>,
    pub epic_ref: Option<String>,
    pub backlog_refs: Option<Vec<String>>,
    pub estimated_days: Option<i32>,
    pub custom_fields: Option<Value>,
    pub display_order: Option<i32>,
}

/// PATCH /api/v1/tickets/:id/move — kanban move.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveTicketRequest {
    pub status: KanbanStatus,
    pub display_order: i32,
}

/// PATCH /api/v1/tickets/:id/status — set status.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStatusRequest {
    pub status: KanbanStatus,
}

/// POST /api/v1/tickets/:id/comments — add comment.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddCommentRequest {
    pub content: String,
    pub author: Option<String>,
}

/// POST /api/v1/tickets/bulk — bulk create.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkCreateRequest {
    pub project_id: i32,
    pub tickets: Vec<CreateTicketRequest>,
}

// ============================================================================
// Query params
// ============================================================================

/// GET /api/v1/tickets — list with filters.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketListParams {
    pub project_id: Option<i32>,
    pub status: Option<String>,        // comma-separated
    pub kind: Option<String>,          // comma-separated
    pub priority: Option<String>,      // comma-separated
    pub module: Option<String>,        // comma-separated
    pub sprint_number: Option<i32>,
    pub parent_ticket_id: Option<i32>,
    pub assignee: Option<String>,
    pub search: Option<String>,
    pub epic_ref: Option<String>,
    pub has_children: Option<bool>,
    pub is_top_level: Option<bool>,
    pub sort_by: Option<String>,       // createdAt, updatedAt, priority, sprintNumber
    pub sort_direction: Option<String>, // asc, desc
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

// ============================================================================
// Response types
// ============================================================================

/// Single ticket response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketResponse {
    pub id: i32,
    pub ticket_number: i32,
    pub display_id: String,
    pub project_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub kind: String,
    pub source: String,
    pub status: String,
    pub priority: Option<String>,
    pub module: Option<String>,
    pub assignee: Option<String>,
    pub assignee_type: Option<String>,
    pub sprint_number: Option<i32>,
    pub parent_ticket_id: Option<i32>,
    pub parent_ticket: Option<ParentTicketRef>,
    pub children_count: i64,
    pub epic_ref: Option<String>,
    pub backlog_refs: Vec<String>,
    pub estimated_days: Option<i32>,
    pub display_order: i32,
    pub custom_fields: Option<Value>,
    pub labels: Vec<LabelResponse>,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Minimal parent ticket reference.
#[derive(Debug, Serialize)]
pub struct ParentTicketRef {
    pub id: i32,
    pub title: String,
}

/// Label response.
#[derive(Debug, Serialize)]
pub struct LabelResponse {
    pub id: i32,
    pub name: String,
}

/// Paginated ticket list response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketListResponse {
    pub tickets: Vec<TicketResponse>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
}

/// Ticket comment response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentResponse {
    pub id: i32,
    pub content: String,
    pub author: String,
    pub created_at: String,
}

/// Bulk create response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkCreateResponse {
    pub created: usize,
    pub failed: usize,
    pub total: usize,
    pub tickets: Vec<BulkTicketRef>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkTicketRef {
    pub ticket_number: i32,
    pub id: i32,
    pub title: String,
    pub kind: String,
}

/// Kanban move response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveTicketResponse {
    pub ticket: TicketResponse,
    pub progress_updates: Option<ProgressUpdate>,
}

/// Progress cascade result.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressUpdate {
    pub sprint_progress: String,
    pub phase_progress: String,
}

/// Ticket hierarchy response.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HierarchyResponse {
    pub ticket: TicketResponse,
    pub parent: Option<TicketResponse>,
    pub children: Vec<TicketResponse>,
    pub siblings: Vec<TicketResponse>,
}
