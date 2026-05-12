//! Sprint 9: Focused tests for services::progress::cascade_progress.
//!
//! Direct service-level tests (bypasses HTTP) for tight feedback on the
//! sprint -> phase rollup, status derivation, and auto-advance logic.

mod common;

use projectpulse_api::services::progress;

#[tokio::test]
async fn test_cascade_no_sprint_returns_none() {
    let (state, _dir) = common::test_state().await;

    // Insert a ticket with NULL sprintId
    let row: (i32,) = sqlx::query_as(
        r#"INSERT INTO tickets
            (title, kind, source, status, priority, "projectId", ticket_number, "displayOrder", "createdAt", "updatedAt")
           VALUES ('No sprint', 'task', 'agent', 'done', 'medium',
                   6, (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM tickets WHERE "projectId" = 6),
                   0, NOW(), NOW())
           RETURNING id"#,
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    let result = progress::cascade_progress(&state.db, row.0).await.unwrap();
    assert!(result.is_none(), "ticket without sprint must return None");
}

#[tokio::test]
async fn test_cascade_single_ticket_done_yields_100() {
    let (state, _dir) = common::test_state().await;
    let h = common::create_test_sprint(&state.db).await;
    let id = common::insert_test_ticket(&state.db, 6, "Solo", "done", Some(&h.sprint_id)).await;

    let result = progress::cascade_progress(&state.db, id).await.unwrap();
    let updates = result.expect("must return Some when sprint assigned");
    assert_eq!(updates.sprint_progress, "100%", "1 done / 1 total = 100%");
}

#[tokio::test]
async fn test_cascade_partial_progress() {
    let (state, _dir) = common::test_state().await;
    let h = common::create_test_sprint(&state.db).await;
    let _ = common::insert_test_ticket(&state.db, 6, "A", "todo", Some(&h.sprint_id)).await;
    let _ = common::insert_test_ticket(&state.db, 6, "B", "todo", Some(&h.sprint_id)).await;
    let c = common::insert_test_ticket(&state.db, 6, "C", "todo", Some(&h.sprint_id)).await;

    // Mark one as done
    sqlx::query(r#"UPDATE tickets SET status = 'done' WHERE id = $1"#)
        .bind(c)
        .execute(&state.db)
        .await
        .unwrap();

    let updates = progress::cascade_progress(&state.db, c).await.unwrap().unwrap();
    // 1 of 3 done = 33% (rounded)
    assert_eq!(updates.sprint_progress, "33%");
}

#[tokio::test]
async fn test_cascade_status_derivation() {
    let (state, _dir) = common::test_state().await;
    let h = common::create_test_sprint(&state.db).await;
    let id = common::insert_test_ticket(&state.db, 6, "Status check", "todo", Some(&h.sprint_id)).await;

    // 0% = NOT_STARTED initially (no done tickets)
    progress::cascade_progress(&state.db, id).await.unwrap();
    let status: (String,) = sqlx::query_as(r#"SELECT status::text FROM sprints WHERE id = $1"#)
        .bind(&h.sprint_id)
        .fetch_one(&state.db)
        .await
        .unwrap();
    assert_eq!(status.0, "NOT_STARTED");

    // Mark done -> 100% = COMPLETED
    sqlx::query(r#"UPDATE tickets SET status = 'done' WHERE id = $1"#)
        .bind(id)
        .execute(&state.db)
        .await
        .unwrap();
    progress::cascade_progress(&state.db, id).await.unwrap();
    let status: (String,) = sqlx::query_as(r#"SELECT status::text FROM sprints WHERE id = $1"#)
        .bind(&h.sprint_id)
        .fetch_one(&state.db)
        .await
        .unwrap();
    assert_eq!(status.0, "COMPLETED");
}

#[tokio::test]
async fn test_cascade_auto_advance_next_sprint() {
    let (state, _dir) = common::test_state().await;
    let h = common::create_test_sprint(&state.db).await;

    // Add sprint 2 in same phase
    let next_sprint_id = cuid2::create_id();
    sqlx::query(
        r#"INSERT INTO sprints (id, title, description, status, progress, "sprintNumber",
                                "startDate", "phaseId", "createdAt", "updatedAt")
           VALUES ($1, 'Next', NULL, 'NOT_STARTED'::"Status", 0, 2, NOW(), $2, NOW(), NOW())"#,
    )
    .bind(&next_sprint_id)
    .bind(&h.phase_id)
    .execute(&state.db)
    .await
    .unwrap();

    // Complete sprint 1 (all tickets done)
    let id = common::insert_test_ticket(&state.db, 6, "Done", "done", Some(&h.sprint_id)).await;
    progress::cascade_progress(&state.db, id).await.unwrap();

    // Sprint 2 should now be IN_PROGRESS
    let status: (String,) = sqlx::query_as(r#"SELECT status::text FROM sprints WHERE id = $1"#)
        .bind(&next_sprint_id)
        .fetch_one(&state.db)
        .await
        .unwrap();
    assert_eq!(status.0, "IN_PROGRESS", "cascade must auto-advance next sprint (#269)");
}

#[tokio::test]
async fn test_cascade_phase_aggregates_across_sprints() {
    let (state, _dir) = common::test_state().await;
    let h = common::create_test_sprint(&state.db).await;

    // Add a 2nd sprint in same phase
    let sprint2 = cuid2::create_id();
    sqlx::query(
        r#"INSERT INTO sprints (id, title, description, status, progress, "sprintNumber",
                                "startDate", "phaseId", "createdAt", "updatedAt")
           VALUES ($1, 'Sprint 2', NULL, 'NOT_STARTED'::"Status", 0, 2, NOW(), $2, NOW(), NOW())"#,
    )
    .bind(&sprint2)
    .bind(&h.phase_id)
    .execute(&state.db)
    .await
    .unwrap();

    // 2 tickets in sprint 1 (one done), 0 in sprint 2 -> phase total: 1/2 done = 50%
    let _ = common::insert_test_ticket(&state.db, 6, "S1A", "done", Some(&h.sprint_id)).await;
    let s1b = common::insert_test_ticket(&state.db, 6, "S1B", "todo", Some(&h.sprint_id)).await;

    progress::cascade_progress(&state.db, s1b).await.unwrap();

    let phase_progress: (i32,) = sqlx::query_as(r#"SELECT progress FROM phases WHERE id = $1"#)
        .bind(&h.phase_id)
        .fetch_one(&state.db)
        .await
        .unwrap();
    // 1 ticket done across 2 sprints with 2 total tickets = 50%
    assert_eq!(phase_progress.0, 50, "phase aggregates across all child sprint tickets");
}
