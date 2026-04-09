//! Agent session lifecycle management.
//!
//! Handles: session create/update/end/resume, ticket claiming/releasing,
//! memory bank sync on session end.

use sqlx::PgPool;

use crate::error::AppError;
use crate::models::session::*;

// ============================================================================
// Start session
// ============================================================================

pub async fn start_session(
    db: &PgPool,
    req: StartSessionRequest,
) -> Result<SessionResponse, AppError> {
    let mut tx = db.begin().await.map_err(AppError::Database)?;

    // Claim tickets if provided (validate all are in 'todo' status)
    let active_ticket_ids: Vec<String> = if let Some(ref ticket_ids) = req.active_ticket_ids {
        claim_tickets(&mut tx, ticket_ids, req.project_id).await?;
        ticket_ids.iter().map(|id| id.to_string()).collect()
    } else {
        vec![]
    };

    // Generate CUID for session ID
    let session_id = cuid2::create_id();

    let row: (String, String) = sqlx::query_as(
        r#"INSERT INTO agent_sessions (id, "projectId", name, plan, todos, progress,
                                        "activeTicketIds", status, "startedAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NULL, $6, 'IN_PROGRESS', NOW(), NOW())
           RETURNING "startedAt"::text, "updatedAt"::text"#,
    )
    .bind(&session_id)
    .bind(req.project_id)
    .bind(&req.name)
    .bind(&req.plan)
    .bind(&req.todos)
    .bind(&active_ticket_ids)
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok(SessionResponse {
        id: session_id,
        project_id: req.project_id,
        name: req.name,
        plan: req.plan,
        todos: req.todos,
        progress: None,
        active_ticket_ids,
        status: "IN_PROGRESS".to_string(),
        token_count: None,
        started_at: row.0,
        updated_at: row.1,
        completed_at: None,
    })
}

// ============================================================================
// Get session
// ============================================================================

pub async fn get_session(
    db: &PgPool,
    id: &str,
) -> Result<SessionResponse, AppError> {
    let row: Option<(String, i32, Option<String>, Option<String>, Option<serde_json::Value>, Option<String>, Vec<String>, String, Option<i32>, String, String, Option<String>)> =
        sqlx::query_as(
            r#"SELECT id, "projectId", name, plan, todos, progress, "activeTicketIds",
                      status, "tokenCount", "startedAt"::text, "updatedAt"::text, "completedAt"::text
               FROM agent_sessions WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(SessionResponse {
            id: r.0, project_id: r.1, name: r.2, plan: r.3, todos: r.4,
            progress: r.5, active_ticket_ids: r.6, status: r.7, token_count: r.8,
            started_at: r.9, updated_at: r.10, completed_at: r.11,
        }),
        None => Err(AppError::NotFound(format!("session '{}' not found", id))),
    }
}

// ============================================================================
// Update session
// ============================================================================

pub async fn update_session(
    db: &PgPool,
    id: &str,
    req: UpdateSessionRequest,
) -> Result<SessionResponse, AppError> {
    let existing = get_session(db, id).await?;

    if existing.status == "COMPLETED" {
        return Err(AppError::BadRequest("cannot update a completed session".into()));
    }

    // Merge progress (append mode)
    let progress = match (&req.progress, req.append_progress.unwrap_or(false)) {
        (Some(new_progress), true) => {
            let old = existing.progress.unwrap_or_default();
            Some(format!("{}\n\n{}", old, new_progress))
        }
        (Some(new_progress), false) => Some(new_progress.clone()),
        (None, _) => existing.progress,
    };

    let name = req.name.or(existing.name);
    let plan = req.plan.or(existing.plan);
    let todos = req.todos.or(existing.todos);
    let status = req.status.unwrap_or(existing.status);
    let token_count = req.token_count.or(existing.token_count);
    let active_ticket_ids = req.active_ticket_ids
        .map(|ids| ids.iter().map(|id| id.to_string()).collect())
        .unwrap_or(existing.active_ticket_ids);

    let row: (String,) = sqlx::query_as(
        r#"UPDATE agent_sessions
           SET name = $2, plan = $3, todos = $4, progress = $5, "activeTicketIds" = $6,
               status = $7, "tokenCount" = $8, "updatedAt" = NOW()
           WHERE id = $1
           RETURNING "updatedAt"::text"#,
    )
    .bind(id)
    .bind(&name)
    .bind(&plan)
    .bind(&todos)
    .bind(&progress)
    .bind(&active_ticket_ids)
    .bind(&status)
    .bind(token_count)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(SessionResponse {
        id: id.to_string(),
        project_id: existing.project_id,
        name, plan, todos, progress, active_ticket_ids, status, token_count,
        started_at: existing.started_at, updated_at: row.0,
        completed_at: existing.completed_at,
    })
}

// ============================================================================
// End session
// ============================================================================

pub async fn end_session(
    db: &PgPool,
    id: &str,
    req: EndSessionRequest,
) -> Result<SessionResponse, AppError> {
    let existing = get_session(db, id).await?;

    if existing.status == "COMPLETED" {
        return Err(AppError::BadRequest("session is already completed".into()));
    }

    let mut tx = db.begin().await.map_err(AppError::Database)?;

    // Release tickets to 'in-review'
    let _tickets_moved = release_tickets_to_review(&mut tx, &existing.active_ticket_ids).await?;

    // Update final progress
    let progress = match &req.progress {
        Some(p) => {
            let old = existing.progress.unwrap_or_default();
            if old.is_empty() { Some(p.clone()) } else { Some(format!("{}\n\n{}", old, p)) }
        }
        None => existing.progress,
    };

    // Complete session
    let row: (String, String) = sqlx::query_as(
        r#"UPDATE agent_sessions
           SET status = 'COMPLETED', progress = $2, "tokenCount" = $3,
               "completedAt" = NOW(), "updatedAt" = NOW()
           WHERE id = $1
           RETURNING "updatedAt"::text, "completedAt"::text"#,
    )
    .bind(id)
    .bind(&progress)
    .bind(req.token_count.or(existing.token_count))
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    // Sync memory banks (append session summary to PROGRESS)
    sync_progress_bank(&mut tx, existing.project_id, id, &progress).await?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok(SessionResponse {
        id: id.to_string(),
        project_id: existing.project_id,
        name: existing.name,
        plan: existing.plan,
        todos: existing.todos,
        progress,
        active_ticket_ids: existing.active_ticket_ids,
        status: "COMPLETED".to_string(),
        token_count: req.token_count.or(existing.token_count),
        started_at: existing.started_at,
        updated_at: row.0,
        completed_at: Some(row.1),
    })
}

// ============================================================================
// Resume session
// ============================================================================

pub async fn resume_session(
    db: &PgPool,
    id: &str,
) -> Result<SessionResponse, AppError> {
    let existing = get_session(db, id).await?;

    if existing.status != "PAUSED" {
        return Err(AppError::BadRequest(format!(
            "can only resume PAUSED sessions, current status: {}",
            existing.status
        )));
    }

    let row: (String,) = sqlx::query_as(
        r#"UPDATE agent_sessions SET status = 'IN_PROGRESS', "updatedAt" = NOW()
           WHERE id = $1
           RETURNING "updatedAt"::text"#,
    )
    .bind(id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(SessionResponse {
        id: id.to_string(),
        status: "IN_PROGRESS".to_string(),
        updated_at: row.0,
        ..existing
    })
}

// ============================================================================
// Ticket claiming/releasing (extracted from duplicated Next.js logic)
// ============================================================================

async fn claim_tickets(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ticket_ids: &[i32],
    project_id: i32,
) -> Result<(), AppError> {
    if ticket_ids.is_empty() {
        return Ok(());
    }

    // Atomic claim: UPDATE + validate in one statement to prevent TOCTOU race.
    // Two concurrent sessions with overlapping ticket sets: only one will claim each ticket.
    let result = sqlx::query(
        r#"UPDATE tickets
           SET status = 'in-progress', assignee = 'Claude Code', "updatedAt" = NOW()
           WHERE id = ANY($1) AND "projectId" = $2 AND status = 'todo'"#,
    )
    .bind(ticket_ids)
    .bind(project_id)
    .execute(&mut **tx)
    .await
    .map_err(AppError::Database)?;

    if result.rows_affected() != ticket_ids.len() as u64 {
        return Err(AppError::BadRequest(format!(
            "expected {} tickets in 'todo' status, but only {} were claimable (others may be already claimed or not found)",
            ticket_ids.len(),
            result.rows_affected()
        )));
    }

    Ok(())
}

async fn release_tickets_to_review(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ticket_ids: &[String],
) -> Result<i32, AppError> {
    if ticket_ids.is_empty() {
        return Ok(0);
    }

    // Parse string IDs to ints
    let ids: Vec<i32> = ticket_ids
        .iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();

    if ids.is_empty() {
        return Ok(0);
    }

    // Move in-progress tickets to in-review (skip already done)
    let result = sqlx::query(
        r#"UPDATE tickets
           SET status = 'in-review', "updatedAt" = NOW()
           WHERE id = ANY($1) AND status = 'in-progress'"#,
    )
    .bind(&ids)
    .execute(&mut **tx)
    .await
    .map_err(AppError::Database)?;

    Ok(result.rows_affected() as i32)
}

async fn sync_progress_bank(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    project_id: i32,
    session_id: &str,
    progress: &Option<String>,
) -> Result<(), AppError> {
    let summary = progress.as_deref().unwrap_or("Session completed");
    let entry = format!(
        "\n\n---\n**Session {}** ({}): {}",
        &session_id[..8.min(session_id.len())],
        chrono::Utc::now().format("%Y-%m-%d %H:%M"),
        summary.chars().take(500).collect::<String>()
    );

    // Append to PROGRESS bank
    sqlx::query(
        r#"UPDATE memory_banks
           SET content = content || $2, "updatedAt" = NOW()
           WHERE "projectId" = $1 AND type = 'PROGRESS'"#,
    )
    .bind(project_id)
    .bind(&entry)
    .execute(&mut **tx)
    .await
    .map_err(AppError::Database)?;

    Ok(())
}
