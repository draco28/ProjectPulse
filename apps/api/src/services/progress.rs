use anyhow::{Context, Result};
use sqlx::PgPool;

use crate::models::ticket::ProgressUpdate;

/// Calculate and cascade progress from ticket → sprint → phase.
///
/// Called by BOTH `move_ticket` AND `set_status` — this fixes bug #268
/// where `set_status` didn't cascade progress.
///
/// Also handles sprint auto-advance (fixes bug #269):
/// when a sprint reaches 100%, the next sprint becomes IN_PROGRESS.
pub async fn cascade_progress(db: &PgPool, ticket_id: i32) -> Result<Option<ProgressUpdate>> {
    // 1. Find the ticket's sprintId
    let sprint_row: Option<(Option<String>,)> = sqlx::query_as(
        r#"SELECT "sprintId" FROM tickets WHERE id = $1"#,
    )
    .bind(ticket_id)
    .fetch_optional(db)
    .await
    .context("cascade: failed to fetch ticket")?;

    let sprint_id = match sprint_row.and_then(|r| r.0) {
        Some(sid) => sid,
        None => return Ok(None), // No sprint assigned — no cascade
    };

    // 2. Count done vs total tickets in this sprint
    let counts: (i64, i64) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*) FILTER (WHERE status = 'done') AS done_count,
            COUNT(*) AS total_count
        FROM tickets
        WHERE "sprintId" = $1
        "#,
    )
    .bind(&sprint_id)
    .fetch_one(db)
    .await
    .context("cascade: failed to count sprint tickets")?;

    let sprint_progress = if counts.1 > 0 {
        ((counts.0 as f64 / counts.1 as f64) * 100.0).round() as i32
    } else {
        0
    };

    // 3. Determine sprint status
    let sprint_status = if sprint_progress >= 100 {
        "COMPLETED"
    } else if sprint_progress > 0 {
        "IN_PROGRESS"
    } else {
        "NOT_STARTED"
    };

    // 4. Update sprint progress + status
    sqlx::query(
        r#"
        UPDATE sprints
        SET progress = $1, status = $2::"Status", "updatedAt" = NOW()
        WHERE id = $3
        "#,
    )
    .bind(sprint_progress)
    .bind(sprint_status)
    .bind(&sprint_id)
    .execute(db)
    .await
    .context("cascade: failed to update sprint")?;

    // 5. Find the sprint's phaseId
    let phase_row: Option<(String,)> = sqlx::query_as(
        r#"SELECT "phaseId" FROM sprints WHERE id = $1"#,
    )
    .bind(&sprint_id)
    .fetch_optional(db)
    .await
    .context("cascade: failed to fetch phase")?;

    let phase_id = match phase_row {
        Some((pid,)) => pid,
        None => {
            return Ok(Some(ProgressUpdate {
                sprint_progress: format!("{}%", sprint_progress),
                phase_progress: "N/A".to_string(),
            }))
        }
    };

    // 6. Average all sprint progresses in this phase
    let phase_avg: (Option<f64>,) = sqlx::query_as(
        r#"SELECT AVG(progress)::float8 FROM sprints WHERE "phaseId" = $1"#,
    )
    .bind(&phase_id)
    .fetch_one(db)
    .await
    .context("cascade: failed to average phase progress")?;

    let phase_progress = phase_avg.0.unwrap_or(0.0).round() as i32;

    let phase_status = if phase_progress >= 100 {
        "COMPLETED"
    } else if phase_progress > 0 {
        "IN_PROGRESS"
    } else {
        "NOT_STARTED"
    };

    // 7. Update phase progress + status
    sqlx::query(
        r#"
        UPDATE phases
        SET progress = $1, status = $2::"Status", "updatedAt" = NOW()
        WHERE id = $3
        "#,
    )
    .bind(phase_progress)
    .bind(phase_status)
    .bind(&phase_id)
    .execute(db)
    .await
    .context("cascade: failed to update phase")?;

    // 8. Sprint auto-advance: if sprint completed, activate next sprint (fixes #269)
    if sprint_status == "COMPLETED" {
        auto_advance_sprint(db, &sprint_id, &phase_id).await.ok();
    }

    Ok(Some(ProgressUpdate {
        sprint_progress: format!("{}%", sprint_progress),
        phase_progress: format!("{}%", phase_progress),
    }))
}

/// When a sprint reaches 100%, find and activate the next sprint in the same phase.
async fn auto_advance_sprint(db: &PgPool, completed_sprint_id: &str, phase_id: &str) -> Result<()> {
    // Find the completed sprint's number
    let current: (i32,) = sqlx::query_as(
        r#"SELECT "sprintNumber" FROM sprints WHERE id = $1"#,
    )
    .bind(completed_sprint_id)
    .fetch_one(db)
    .await
    .context("auto-advance: failed to get sprint number")?;

    // Find the next sprint in the same phase
    let next: Option<(String,)> = sqlx::query_as(
        r#"
        SELECT id FROM sprints
        WHERE "phaseId" = $1 AND "sprintNumber" > $2 AND status = 'NOT_STARTED'::"Status"
        ORDER BY "sprintNumber" ASC
        LIMIT 1
        "#,
    )
    .bind(phase_id)
    .bind(current.0)
    .fetch_optional(db)
    .await
    .context("auto-advance: failed to find next sprint")?;

    if let Some((next_id,)) = next {
        sqlx::query(
            r#"
            UPDATE sprints
            SET status = 'IN_PROGRESS'::"Status", "updatedAt" = NOW()
            WHERE id = $1
            "#,
        )
        .bind(&next_id)
        .execute(db)
        .await
        .context("auto-advance: failed to activate next sprint")?;

        tracing::info!(
            completed = %completed_sprint_id,
            next = %next_id,
            "Sprint auto-advanced"
        );
    }

    Ok(())
}

/// Set closedAt timestamp when ticket moves to done, clear when moving away.
pub async fn update_closed_at(db: &PgPool, ticket_id: i32, new_status: &str) -> Result<()> {
    if new_status == "done" {
        sqlx::query(r#"UPDATE tickets SET "closedAt" = NOW() WHERE id = $1"#)
            .bind(ticket_id)
            .execute(db)
            .await?;
    } else {
        sqlx::query(r#"UPDATE tickets SET "closedAt" = NULL WHERE id = $1"#)
            .bind(ticket_id)
            .execute(db)
            .await?;
    }
    Ok(())
}
