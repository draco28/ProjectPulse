use anyhow::{Context, Result};
use sqlx::PgPool;

/// Resolve sprintNumber to sprintId for a project.
/// Traverses: Roadmap → Phase → Sprint chain.
pub async fn resolve_sprint_id(
    db: &PgPool,
    project_id: i32,
    sprint_number: i32,
) -> Result<Option<String>> {
    let row: Option<(String,)> = sqlx::query_as(
        r#"
        SELECT s.id
        FROM sprints s
        JOIN phases p ON s."phaseId" = p.id
        JOIN roadmaps r ON p."roadmapId" = r.id
        WHERE r."projectId" = $1 AND s."sprintNumber" = $2
        LIMIT 1
        "#,
    )
    .bind(project_id)
    .bind(sprint_number)
    .fetch_optional(db)
    .await
    .context("failed to resolve sprint")?;

    Ok(row.map(|r| r.0))
}

/// Validate that a parent ticket exists, is kind=feature, and belongs to same project.
pub async fn validate_parent(
    db: &PgPool,
    parent_id: i32,
    project_id: i32,
) -> Result<bool> {
    let row: Option<(String, i32)> = sqlx::query_as(
        r#"SELECT kind, "projectId" FROM tickets WHERE id = $1"#,
    )
    .bind(parent_id)
    .fetch_optional(db)
    .await
    .context("failed to validate parent")?;

    match row {
        Some((kind, pid)) => {
            if pid != project_id {
                anyhow::bail!("parent ticket belongs to a different project");
            }
            if kind != "feature" && kind != "epic" {
                anyhow::bail!("parent ticket must be kind=feature or epic, got {}", kind);
            }
            Ok(true)
        }
        None => anyhow::bail!("parent ticket {} not found", parent_id),
    }
}

/// Count children of a ticket.
pub async fn count_children(db: &PgPool, ticket_id: i32) -> Result<i64> {
    let row: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM tickets WHERE "parentTicketId" = $1"#,
    )
    .bind(ticket_id)
    .fetch_one(db)
    .await
    .context("failed to count children")?;

    Ok(row.0)
}
