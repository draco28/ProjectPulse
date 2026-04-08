use axum::extract::{Path, State};
use axum::response::Response;
use axum::{Extension, Json};
use serde::Serialize;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::ticket::*;
use crate::response;
use crate::services::progress;
use crate::state::AppState;

// ============================================================================
// PATCH /api/v1/tickets/:id/move — Kanban move with progress cascade
// ============================================================================

pub async fn move_ticket(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<MoveTicketRequest>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    let new_status = req.status.as_str();

    // Update ticket status + displayOrder + closedAt atomically
    sqlx::query(
        r#"
        UPDATE tickets
        SET status = $1,
            "displayOrder" = $2,
            "closedAt" = CASE WHEN $1 = 'done' THEN NOW() ELSE NULL END,
            "updatedAt" = NOW()
        WHERE id = $3
        "#,
    )
    .bind(new_status)
    .bind(req.display_order)
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    // Cascade progress (sprint → phase)
    let progress_updates = progress::cascade_progress(&state.db, id)
        .await
        .map_err(AppError::Internal)?;

    // Fetch updated ticket
    let ticket = fetch_ticket_response(&state.db, id, project_id).await?;

    Ok(response::success(MoveTicketResponse {
        ticket,
        progress_updates,
    }))
}

// ============================================================================
// PATCH /api/v1/tickets/:id/status — Set status with cascade (fixes #268)
// ============================================================================

pub async fn set_status(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<SetStatusRequest>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    let new_status = req.status.as_str();

    // Update status + closedAt atomically
    sqlx::query(
        r#"
        UPDATE tickets
        SET status = $1,
            "closedAt" = CASE WHEN $1 = 'done' THEN NOW() ELSE NULL END,
            "updatedAt" = NOW()
        WHERE id = $2
        "#,
    )
    .bind(new_status)
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    // CASCADE PROGRESS — this is the #268 fix!
    // Previously, setStatus did NOT cascade. Now it does.
    let progress_updates = progress::cascade_progress(&state.db, id)
        .await
        .map_err(AppError::Internal)?;

    let ticket = fetch_ticket_response(&state.db, id, project_id).await?;

    Ok(response::success(MoveTicketResponse {
        ticket,
        progress_updates,
    }))
}

// ============================================================================
// PATCH /api/v1/tickets/reorder — Batch reorder within column
// ============================================================================

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderRequest {
    pub moves: Vec<ReorderMove>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderMove {
    pub ticket_id: i32,
    pub display_order: i32,
}

pub async fn reorder_tickets(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<ReorderRequest>,
) -> Result<Response, AppError> {
    if req.moves.len() > 100 {
        return Err(AppError::Validation("max 100 moves per batch".into()));
    }

    // Resolve project_id from the first ticket and enforce access
    if let Some(first) = req.moves.first() {
        let project_id = get_project_id(&state.db, first.ticket_id).await?;
        require_project_access(&auth, project_id)?;
    }

    for m in &req.moves {
        sqlx::query(
            r#"UPDATE tickets SET "displayOrder" = $1, "updatedAt" = NOW() WHERE id = $2"#,
        )
        .bind(m.display_order)
        .bind(m.ticket_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;
    }

    Ok(response::success(serde_json::json!({
        "reordered": req.moves.len(),
    })))
}

// ============================================================================
// GET /api/v1/sprints/:sprintId/kanban — Kanban board view
// ============================================================================

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KanbanBoard {
    pub sprint: SprintInfo,
    pub columns: Vec<KanbanColumn>,
    pub stats: KanbanStats,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintInfo {
    pub id: String,
    pub title: String,
    pub sprint_number: i32,
    pub progress: i32,
    pub status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KanbanColumn {
    pub status: String,
    pub tickets: Vec<KanbanTicket>,
    pub count: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KanbanTicket {
    pub id: i32,
    pub ticket_number: i32,
    pub title: String,
    pub kind: String,
    pub priority: String,
    pub assignee: Option<String>,
    pub parent_ticket_id: Option<i32>,
    pub display_order: i32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KanbanStats {
    pub total: usize,
    pub backlog: usize,
    pub todo: usize,
    pub in_progress: usize,
    pub in_review: usize,
    pub done: usize,
}

pub async fn get_board(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(sprint_id): Path<String>,
) -> Result<Response, AppError> {
    // Resolve project_id from sprint → phase → roadmap and enforce access
    let project_row: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT r."projectId"
        FROM sprints s
        JOIN phases p ON s."phaseId" = p.id
        JOIN roadmaps r ON p."roadmapId" = r.id
        WHERE s.id = $1
        "#,
    )
    .bind(&sprint_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let project_id = project_row
        .ok_or_else(|| AppError::NotFound(format!("sprint {} not found", sprint_id)))?
        .0;
    require_project_access(&auth, project_id)?;

    // Fetch sprint info
    let sprint: Option<(String, String, i32, i32, String)> = sqlx::query_as(
        r#"SELECT id, title, "sprintNumber", progress, status::text FROM sprints WHERE id = $1"#,
    )
    .bind(&sprint_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let (sid, title, sprint_number, progress, status) = sprint
        .ok_or_else(|| AppError::NotFound(format!("sprint {} not found", sprint_id)))?;

    // Fetch all tickets in this sprint
    #[derive(sqlx::FromRow)]
    struct BoardRow {
        id: i32,
        ticket_number: i32,
        title: String,
        kind: String,
        priority: String,
        assignee: Option<String>,
        #[sqlx(rename = "parentTicketId")]
        parent_ticket_id: Option<i32>,
        #[sqlx(rename = "displayOrder")]
        display_order: i32,
        status: String,
    }

    let rows: Vec<BoardRow> = sqlx::query_as(
        r#"
        SELECT id, ticket_number, title, kind, priority,
               assignee, "parentTicketId", "displayOrder", status
        FROM tickets
        WHERE "sprintId" = $1
        ORDER BY "displayOrder" ASC, "createdAt" ASC
        "#,
    )
    .bind(&sprint_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    // Group by status into columns
    let statuses = ["backlog", "todo", "in-progress", "in-review", "done"];
    let mut columns: Vec<KanbanColumn> = statuses
        .iter()
        .map(|s| KanbanColumn {
            status: s.to_string(),
            tickets: Vec::new(),
            count: 0,
        })
        .collect();

    let mut stats = KanbanStats {
        total: rows.len(),
        backlog: 0,
        todo: 0,
        in_progress: 0,
        in_review: 0,
        done: 0,
    };

    for row in rows {
        let ticket = KanbanTicket {
            id: row.id,
            ticket_number: row.ticket_number,
            title: row.title,
            kind: row.kind,
            priority: row.priority,
            assignee: row.assignee,
            parent_ticket_id: row.parent_ticket_id,
            display_order: row.display_order,
        };

        match row.status.as_str() {
            "backlog" => { columns[0].tickets.push(ticket); stats.backlog += 1; }
            "todo" => { columns[1].tickets.push(ticket); stats.todo += 1; }
            "in-progress" => { columns[2].tickets.push(ticket); stats.in_progress += 1; }
            "in-review" => { columns[3].tickets.push(ticket); stats.in_review += 1; }
            "done" => { columns[4].tickets.push(ticket); stats.done += 1; }
            _ => { columns[0].tickets.push(ticket); stats.backlog += 1; }
        }
    }

    for col in &mut columns {
        col.count = col.tickets.len();
    }

    Ok(response::success(KanbanBoard {
        sprint: SprintInfo {
            id: sid,
            title,
            sprint_number,
            progress,
            status,
        },
        columns,
        stats,
    }))
}

// ============================================================================
// Internal helpers
// ============================================================================

async fn get_project_id(db: &sqlx::PgPool, ticket_id: i32) -> Result<i32, AppError> {
    let row: (i32,) = sqlx::query_as(r#"SELECT "projectId" FROM tickets WHERE id = $1"#)
        .bind(ticket_id)
        .fetch_one(db)
        .await
        .map_err(|_| AppError::NotFound(format!("ticket {} not found", ticket_id)))?;
    Ok(row.0)
}

/// Minimal ticket row for kanban responses (avoids sqlx 16-field tuple limit).
#[derive(sqlx::FromRow)]
struct KanbanTicketRow {
    id: i32,
    ticket_number: i32,
    title: String,
    description: Option<String>,
    kind: String,
    source: String,
    status: String,
    priority: String,
    module: Option<String>,
    assignee: Option<String>,
    #[sqlx(rename = "assigneeType")]
    assignee_type: Option<String>,
    #[sqlx(rename = "sprintNumber")]
    sprint_number: Option<i32>,
    #[sqlx(rename = "parentTicketId")]
    parent_ticket_id: Option<i32>,
    #[sqlx(rename = "epicRef")]
    epic_ref: Option<String>,
    #[sqlx(rename = "backlogRefs")]
    backlog_refs: Option<Vec<String>>,
    #[sqlx(rename = "estimatedDays")]
    estimated_days: Option<i32>,
    #[sqlx(rename = "displayOrder")]
    display_order: i32,
    #[sqlx(rename = "customFields")]
    custom_fields: Option<serde_json::Value>,
    #[sqlx(rename = "closedAt")]
    closed_at: Option<String>,
    #[sqlx(rename = "createdAt")]
    created_at: String,
    #[sqlx(rename = "updatedAt")]
    updated_at: String,
}

async fn fetch_ticket_response(
    db: &sqlx::PgPool,
    id: i32,
    project_id: i32,
) -> Result<TicketResponse, AppError> {
    let row: KanbanTicketRow = sqlx::query_as(
        r#"
        SELECT id, ticket_number, title, description, kind, source, status,
               priority, module, assignee, "assigneeType",
               "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
               "estimatedDays", "displayOrder", "customFields",
               "closedAt"::text, "createdAt"::text, "updatedAt"::text
        FROM tickets WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(TicketResponse {
        id: row.id,
        ticket_number: row.ticket_number,
        display_id: row.ticket_number.to_string(),
        project_id,
        title: row.title,
        description: row.description,
        kind: row.kind,
        source: row.source,
        status: row.status,
        priority: Some(row.priority),
        module: row.module,
        assignee: row.assignee,
        assignee_type: row.assignee_type,
        sprint_number: row.sprint_number,
        parent_ticket_id: row.parent_ticket_id,
        parent_ticket: None,
        children_count: 0,
        epic_ref: row.epic_ref,
        backlog_refs: row.backlog_refs.unwrap_or_default(),
        estimated_days: row.estimated_days,
        display_order: row.display_order,
        custom_fields: row.custom_fields,
        labels: Vec::new(),
        closed_at: row.closed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
    })
}
