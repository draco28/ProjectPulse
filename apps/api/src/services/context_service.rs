//! Context/memory bank operations.
//!
//! Refactored from 451-line Next.js handler into composable service functions:
//! - load_memory_banks: fetch 5 memory banks
//! - get_active_sessions: find IN_PROGRESS/PAUSED sessions
//! - get_resource_counts: count personas/skills/SOPs
//! - generate_hints: pure function producing workflow guidance
//! - load_full_context: orchestrates all of the above

use sqlx::PgPool;

use crate::error::AppError;
use crate::models::context::*;
use crate::models::session::SessionSummary;

// ============================================================================
// Load full context (the orchestrator)
// ============================================================================

pub async fn load_full_context(
    db: &PgPool,
    project_id: i32,
    banks_to_load: &str,
) -> Result<ContextLoadResponse, AppError> {
    // 1. Get project name
    let project: Option<(String,)> = sqlx::query_as(
        r#"SELECT name FROM projects WHERE id = $1"#,
    )
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    let project_name = project
        .ok_or_else(|| AppError::NotFound(format!("project {} not found", project_id)))?
        .0;

    // 2. Load concurrently: memory banks, active sessions, resources, onboarding
    let (banks, sessions, resources, onboarding) = tokio::try_join!(
        load_memory_banks(db, project_id, banks_to_load),
        get_active_sessions(db, project_id),
        get_resource_counts(db, project_id),
        get_onboarding_status(db, project_id),
    )?;

    // 3. Generate hints (pure function)
    let hints = generate_hints(&onboarding, &sessions, &banks);

    // 4. Estimate token count
    let bank_tokens: i32 = banks.as_object()
        .map(|obj| obj.values()
            .filter_map(|v| v.get("tokens").and_then(|t| t.as_i64()))
            .sum::<i64>() as i32)
        .unwrap_or(0);
    let total_tokens = bank_tokens + (sessions.len() as i32 * 500) + 100;

    Ok(ContextLoadResponse {
        project_id,
        project_name,
        memory_banks: banks,
        active_sessions: sessions,
        available_resources: resources,
        onboarding_status: onboarding,
        hints,
        total_tokens,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

// ============================================================================
// Load memory banks
// ============================================================================

pub async fn load_memory_banks(
    db: &PgPool,
    project_id: i32,
    banks_to_load: &str,
) -> Result<serde_json::Value, AppError> {
    let type_filter = match banks_to_load {
        "active-only" => "AND type IN ('ACTIVE_CONTEXT', 'PROGRESS')",
        _ => "",
    };

    let sql = format!(
        r#"SELECT type::text, content, COALESCE("summaryTokens", 0) AS tokens, "updatedAt"::text
           FROM memory_banks WHERE "projectId" = $1 {}"#,
        type_filter
    );

    let rows = sqlx::query_as::<_, (String, String, i32, String)>(&sql)
        .bind(project_id)
        .fetch_all(db)
        .await
        .map_err(AppError::Database)?;

    let mut banks = serde_json::Map::new();
    for (bank_type, content, tokens, updated_at) in rows {
        banks.insert(
            bank_type,
            serde_json::json!({
                "content": content,
                "tokens": tokens,
                "updatedAt": updated_at,
            }),
        );
    }

    Ok(serde_json::Value::Object(banks))
}

// ============================================================================
// Get active sessions
// ============================================================================

pub async fn get_active_sessions(
    db: &PgPool,
    project_id: i32,
) -> Result<Vec<SessionSummary>, AppError> {
    let rows = sqlx::query_as::<_, (String, Option<String>, Option<String>, Option<serde_json::Value>, Option<String>, Vec<String>, String, String)>(
        r#"SELECT id, name, plan, todos, progress, "activeTicketIds", status, "startedAt"::text
           FROM agent_sessions
           WHERE "projectId" = $1 AND status IN ('IN_PROGRESS', 'PAUSED')
           ORDER BY "updatedAt" DESC
           LIMIT 10"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(rows.into_iter().map(|r| SessionSummary {
        id: r.0, name: r.1, plan: r.2, todos: r.3, progress: r.4,
        active_ticket_ids: r.5, status: r.6, started_at: r.7,
    }).collect())
}

// ============================================================================
// Get resource counts
// ============================================================================

pub async fn get_resource_counts(
    db: &PgPool,
    project_id: i32,
) -> Result<ResourceCounts, AppError> {
    let (personas, skills, sops) = tokio::try_join!(
        get_persona_meta(db, project_id),
        get_skill_meta(db, project_id),
        get_sop_meta(db, project_id),
    )?;

    Ok(ResourceCounts { personas, skills, sops })
}

async fn get_persona_meta(db: &PgPool, project_id: i32) -> Result<ResourceMeta, AppError> {
    let rows = sqlx::query_as::<_, (String,)>(
        r#"SELECT name FROM "AgentPersona" WHERE "projectId" = $1 AND "isActive" = true LIMIT 10"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(ResourceMeta {
        count: rows.len() as i64,
        names: rows.into_iter().map(|r| r.0).collect(),
    })
}

async fn get_skill_meta(db: &PgPool, project_id: i32) -> Result<ResourceMeta, AppError> {
    let rows = sqlx::query_as::<_, (String,)>(
        r#"SELECT DISTINCT category FROM skills WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    let count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM skills WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(ResourceMeta {
        count: count.0,
        names: rows.into_iter().map(|r| r.0).collect(), // categories, not names
    })
}

async fn get_sop_meta(db: &PgPool, project_id: i32) -> Result<ResourceMeta, AppError> {
    let rows = sqlx::query_as::<_, (String,)>(
        r#"SELECT title FROM sops WHERE "projectId" = $1 LIMIT 10"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(ResourceMeta {
        count: rows.len() as i64,
        names: rows.into_iter().map(|r| r.0).collect(),
    })
}

// ============================================================================
// Onboarding status
// ============================================================================

async fn get_onboarding_status(
    db: &PgPool,
    project_id: i32,
) -> Result<OnboardingStatus, AppError> {
    let rows = sqlx::query_as::<_, (i32, String)>(
        r#"SELECT "sessionNumber", status FROM "OnboardingSession"
           WHERE "projectId" = $1 ORDER BY "sessionNumber" ASC"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    let completed = rows.iter()
        .filter(|r| r.1.to_uppercase() == "COMPLETE" || r.1.to_uppercase() == "COMPLETED")
        .count() as i32;

    let in_progress = rows.iter()
        .find(|r| r.1.to_uppercase() == "IN_PROGRESS")
        .map(|r| r.0);

    let mut next_session = None;
    if completed < 3 {
        for i in 1..=3 {
            let session = rows.iter().find(|r| r.0 == i);
            match session {
                Some(s) if s.1.to_uppercase() == "COMPLETE" || s.1.to_uppercase() == "COMPLETED" => continue,
                _ => { next_session = Some(i); break; }
            }
        }
    }

    Ok(OnboardingStatus {
        is_complete: completed >= 3,
        completed_sessions: completed,
        next_session,
        in_progress_session: in_progress,
    })
}

// ============================================================================
// Generate hints (pure function — no DB access)
// ============================================================================

fn generate_hints(
    onboarding: &OnboardingStatus,
    sessions: &[SessionSummary],
    banks: &serde_json::Value,
) -> Vec<String> {
    let mut hints = Vec::new();

    // Onboarding hints (highest priority)
    if !onboarding.is_complete {
        if let Some(in_progress) = onboarding.in_progress_session {
            hints.push(format!(
                "ONBOARDING IN PROGRESS: Session {} of 3 is active. \
                 Continue with projectpulse_onboarding_getQuestions.",
                in_progress
            ));
        } else {
            let next = onboarding.next_session.unwrap_or(1);
            hints.push(format!(
                "ONBOARDING REQUIRED: Session {} of 3 needed. \
                 Call projectpulse_onboarding_start({{ sessionNumber: {} }}) to begin.",
                next, next
            ));
        }
        if onboarding.completed_sessions > 0 {
            hints.push(format!("Sessions completed: {}/3", onboarding.completed_sessions));
        }
        return hints; // Don't suggest session management for non-onboarded projects
    }

    // Session hints
    let in_progress: Vec<_> = sessions.iter().filter(|s| s.status == "IN_PROGRESS").collect();
    let paused: Vec<_> = sessions.iter().filter(|s| s.status == "PAUSED").collect();

    if !sessions.is_empty() {
        if sessions.len() > 1 {
            hints.push(format!(
                "Found {} sessions: {} active, {} paused. \
                 Use projectpulse_agent_session_resume with session ID to continue specific work.",
                sessions.len(), in_progress.len(), paused.len()
            ));
        }

        if let Some(current) = in_progress.first().or(paused.first()) {
            let name = current.name.as_deref().unwrap_or("Unnamed");
            let resume_hint = if current.status == "PAUSED" {
                " Resume with projectpulse_agent_session_resume."
            } else { "" };
            hints.push(format!(
                "Current session: '{}' ({}, ID: {}...){}",
                name, current.status, &current.id[..8.min(current.id.len())], resume_hint
            ));
        }
    } else {
        hints.push(
            "No active work sessions found. Use projectpulse_agent_session_start \
             to track your work if you're starting a new task.".to_string()
        );
    }

    // Bank freshness hints
    if let Some(active) = banks.get("ACTIVE_CONTEXT").and_then(|b| b.get("updatedAt")).and_then(|u| u.as_str()) {
        if let Ok(updated) = chrono::DateTime::parse_from_rfc3339(active) {
            let hours = (chrono::Utc::now() - updated.with_timezone(&chrono::Utc)).num_hours();
            if hours > 24 {
                hints.push(format!(
                    "ACTIVE_CONTEXT was last updated {}h ago. Consider reviewing if focus has changed.",
                    hours
                ));
            }
        }
    }

    hints
}

// ============================================================================
// Update memory bank
// ============================================================================

pub async fn update_bank(
    db: &PgPool,
    project_id: i32,
    bank_type: &str,
    content: &str,
    mode: &str,
) -> Result<ContextUpdateResponse, AppError> {
    let valid_types = ["PROJECT_BRIEF", "SYSTEM_PATTERNS", "TECH_CONTEXT", "ACTIVE_CONTEXT", "PROGRESS"];
    if !valid_types.contains(&bank_type) {
        return Err(AppError::Validation(format!(
            "invalid bank type '{}', must be one of: {}",
            bank_type,
            valid_types.join(", ")
        )));
    }

    let (update_sql, content_value) = match mode {
        "append" => {
            let appended = format!("\n\n{}", content);
            (
                r#"UPDATE memory_banks SET content = content || $3, "updatedAt" = NOW()
                   WHERE "projectId" = $1 AND type = $2::text::"MemoryBankType"
                   RETURNING content, COALESCE("summaryTokens", 0)::int, "updatedAt"::text"#.to_string(),
                appended,
            )
        }
        _ => (
            r#"UPDATE memory_banks SET content = $3, "updatedAt" = NOW()
               WHERE "projectId" = $1 AND type = $2::text::"MemoryBankType"
               RETURNING content, COALESCE("summaryTokens", 0)::int, "updatedAt"::text"#.to_string(),
            content.to_string(),
        ),
    };

    let row: Option<(String, i32, String)> = sqlx::query_as(&update_sql)
        .bind(project_id)
        .bind(bank_type)
        .bind(&content_value)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(ContextUpdateResponse {
            bank_type: bank_type.to_string(),
            content: r.0,
            tokens: r.1,
            updated_at: r.2,
        }),
        None => Err(AppError::NotFound(format!(
            "memory bank '{}' not found for project {}",
            bank_type, project_id
        ))),
    }
}

// ============================================================================
// Pattern lookup (single bank)
// ============================================================================

pub async fn lookup_bank(
    db: &PgPool,
    project_id: i32,
    bank_type: &str,
) -> Result<PatternLookupResponse, AppError> {
    let row: Option<(String, String, i32)> = sqlx::query_as(
        r#"SELECT type::text, content, COALESCE("summaryTokens", 0)::int
           FROM memory_banks WHERE "projectId" = $1 AND type = $2::text::"MemoryBankType""#,
    )
    .bind(project_id)
    .bind(bank_type)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(PatternLookupResponse {
            bank_type: r.0,
            content: r.1,
            tokens: r.2,
        }),
        None => Err(AppError::NotFound(format!(
            "memory bank '{}' not found for project {}",
            bank_type, project_id
        ))),
    }
}

// ============================================================================
// Context recovery (ACTIVE_CONTEXT + PROGRESS only)
// ============================================================================

pub async fn context_recovery(
    db: &PgPool,
    project_id: i32,
) -> Result<serde_json::Value, AppError> {
    load_memory_banks(db, project_id, "active-only").await
}
