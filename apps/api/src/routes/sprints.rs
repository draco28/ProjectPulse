use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::response;
use crate::state::AppState;

// ============================================================================
// POST /api/v1/roadmap — Create roadmap
// ============================================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRoadmapRequest {
    pub project_id: i32,
    pub phases: Value,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoadmapResponse {
    pub id: String,
    pub project_id: i32,
    pub phases: Value,
    pub created_at: String,
}

pub async fn create_roadmap(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateRoadmapRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;

    let id = cuid2::create_id();

    let row: (String, String) = sqlx::query_as(
        r#"
        INSERT INTO roadmaps (id, "projectId", phases, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, "createdAt"::text
        "#,
    )
    .bind(&id)
    .bind(req.project_id)
    .bind(&req.phases)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::created(RoadmapResponse {
        id: row.0,
        project_id: req.project_id,
        phases: req.phases,
        created_at: row.1,
    }))
}

// ============================================================================
// GET /api/v1/roadmap — Get roadmap for project
// ============================================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoadmapQuery {
    pub project_id: i32,
}

pub async fn get_roadmap(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<RoadmapQuery>,
) -> Result<Response, AppError> {
    require_project_access(&auth, params.project_id)?;

    #[derive(sqlx::FromRow)]
    struct RoadmapRow {
        id: String,
        phases: Value,
        #[sqlx(rename = "currentPhase")]
        current_phase: Option<String>,
        #[sqlx(rename = "currentSprint")]
        current_sprint: Option<String>,
        #[sqlx(rename = "createdAt")]
        created_at: String,
    }

    let row: Option<RoadmapRow> = sqlx::query_as(
        r#"
        SELECT id, phases, "currentPhase", "currentSprint", "createdAt"::text
        FROM roadmaps WHERE "projectId" = $1
        "#,
    )
    .bind(params.project_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some(r) => {
            Ok(response::success(serde_json::json!({
                "id": r.id,
                "projectId": params.project_id,
                "phases": r.phases,
                "currentPhase": r.current_phase,
                "currentSprint": r.current_sprint,
                "createdAt": r.created_at,
            })))
        }
        None => Err(AppError::NotFound(format!(
            "no roadmap for project {}",
            params.project_id
        ))),
    }
}

// ============================================================================
// POST /api/v1/roadmap/:id/materialize — JSON → Phase/Sprint DB records
// ============================================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterializePhase {
    pub title: String,
    pub description: Option<String>,
    pub sprints: Vec<MaterializeSprint>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterializeSprint {
    pub title: String,
    pub description: Option<String>,
}

pub async fn materialize_roadmap(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(roadmap_id): Path<String>,
    Json(phases): Json<Vec<MaterializePhase>>,
) -> Result<Response, AppError> {
    // Verify roadmap exists and get projectId
    let roadmap: Option<(i32,)> = sqlx::query_as(
        r#"SELECT "projectId" FROM roadmaps WHERE id = $1"#,
    )
    .bind(&roadmap_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let project_id = roadmap
        .ok_or_else(|| AppError::NotFound(format!("roadmap {} not found", roadmap_id)))?
        .0;
    require_project_access(&auth, project_id)?;

    // Delete existing materialized phases/sprints for idempotency (re-materialize safe)
    // Sprints cascade-delete via FK when phases are deleted
    sqlx::query(
        r#"DELETE FROM phases WHERE "roadmapId" = $1"#,
    )
    .bind(&roadmap_id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    let mut phases_created = 0;
    let mut sprints_created = 0;
    let mut global_sprint_number = 0;

    for phase_def in &phases {
        let phase_id = cuid2::create_id();

        sqlx::query(
            r#"
            INSERT INTO phases (id, title, description, status, progress, "startDate", "roadmapId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, 'NOT_STARTED'::"Status", 0, NOW(), $4, NOW(), NOW())
            "#,
        )
        .bind(&phase_id)
        .bind(&phase_def.title)
        .bind(&phase_def.description)
        .bind(&roadmap_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;
        phases_created += 1;

        for (i, sprint_def) in phase_def.sprints.iter().enumerate() {
            global_sprint_number += 1;
            let sprint_id = cuid2::create_id();

            sqlx::query(
                r#"
                INSERT INTO sprints (id, title, description, status, progress, "sprintNumber", "startDate", "phaseId", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, 'NOT_STARTED'::"Status", 0, $4, NOW(), $5, NOW(), NOW())
                "#,
            )
            .bind(&sprint_id)
            .bind(&sprint_def.title)
            .bind(&sprint_def.description)
            .bind((i + 1) as i32)  // sprint number within phase
            .bind(&phase_id)
            .execute(&state.db)
            .await
            .map_err(AppError::Database)?;
            sprints_created += 1;
        }
    }

    Ok(response::created(serde_json::json!({
        "roadmapId": roadmap_id,
        "phasesCreated": phases_created,
        "sprintsCreated": sprints_created,
        "globalSprintCount": global_sprint_number,
    })))
}

// ============================================================================
// GET /api/v1/roadmap/overview — Dashboard with progress
// ============================================================================

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhaseOverview {
    pub id: String,
    pub title: String,
    pub progress: i32,
    pub status: String,
    pub sprint_count: i64,
}

pub async fn get_overview(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<RoadmapQuery>,
) -> Result<Response, AppError> {
    require_project_access(&auth, params.project_id)?;

    // Single query with LEFT JOIN + GROUP BY (avoids N+1)
    let overview: Vec<PhaseOverview> = sqlx::query_as::<_, (String, String, i32, String, i64)>(
        r#"
        SELECT p.id, p.title, p.progress, p.status::text, COUNT(s.id) AS sprint_count
        FROM phases p
        JOIN roadmaps r ON p."roadmapId" = r.id
        LEFT JOIN sprints s ON s."phaseId" = p.id
        WHERE r."projectId" = $1
        GROUP BY p.id, p.title, p.progress, p.status, p."startDate"
        ORDER BY p."startDate" ASC
        "#,
    )
    .bind(params.project_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?
    .into_iter()
    .map(|(id, title, progress, status, sprint_count)| PhaseOverview {
        id, title, progress, status, sprint_count,
    })
    .collect();

    Ok(response::success(overview))
}

// ============================================================================
// GET /api/v1/roadmap/phases/:id/progress — Phase progress tree
// ============================================================================

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintProgress {
    pub id: String,
    pub title: String,
    pub sprint_number: i32,
    pub progress: i32,
    pub status: String,
    pub ticket_count: i64,
    pub done_count: i64,
}

pub async fn get_phase_progress(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(phase_id): Path<String>,
) -> Result<Response, AppError> {
    // Resolve project from phase
    let project_row: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT r."projectId" FROM phases p
        JOIN roadmaps r ON p."roadmapId" = r.id
        WHERE p.id = $1
        "#,
    )
    .bind(&phase_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let project_id = project_row
        .ok_or_else(|| AppError::NotFound(format!("phase {} not found", phase_id)))?
        .0;
    require_project_access(&auth, project_id)?;

    // Fetch phase info
    let phase: (String, i32, String) = sqlx::query_as(
        r#"SELECT title, progress, status::text FROM phases WHERE id = $1"#,
    )
    .bind(&phase_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    // Fetch sprints with ticket counts in a single query (avoids N+1)
    let sprints: Vec<(String, String, i32, i32, String, i64, i64)> = sqlx::query_as(
        r#"
        SELECT s.id, s.title, s."sprintNumber", s.progress, s.status::text,
               COUNT(t.id) AS ticket_count,
               COUNT(t.id) FILTER (WHERE t.status = 'done') AS done_count
        FROM sprints s
        LEFT JOIN tickets t ON t."sprintId" = s.id
        WHERE s."phaseId" = $1
        GROUP BY s.id, s.title, s."sprintNumber", s.progress, s.status
        ORDER BY s."sprintNumber" ASC
        "#,
    )
    .bind(&phase_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    let sprint_details: Vec<SprintProgress> = sprints
        .into_iter()
        .map(|(id, title, sprint_number, progress, status, ticket_count, done_count)| {
            SprintProgress { id, title, sprint_number, progress, status, ticket_count, done_count }
        })
        .collect();

    Ok(response::success(serde_json::json!({
        "phase": {
            "id": phase_id,
            "title": phase.0,
            "progress": phase.1,
            "status": phase.2,
        },
        "sprints": sprint_details,
    })))
}

// ============================================================================
// GET /api/v1/hierarchy/query — Filter phases/sprints
// ============================================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HierarchyQuery {
    pub project_id: i32,
    pub level: Option<String>,       // "phase" or "sprint"
    pub status: Option<String>,      // filter by status
}

pub async fn query_hierarchy(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<HierarchyQuery>,
) -> Result<Response, AppError> {
    require_project_access(&auth, params.project_id)?;

    let level = params.level.as_deref().unwrap_or("sprint");

    if level == "phase" {
        let phases: Vec<(String, String, i32, String, String)> = sqlx::query_as(
            r#"
            SELECT p.id, p.title, p.progress, p.status::text, p."createdAt"::text
            FROM phases p
            JOIN roadmaps r ON p."roadmapId" = r.id
            WHERE r."projectId" = $1
            ORDER BY p."startDate" ASC
            "#,
        )
        .bind(params.project_id)
        .fetch_all(&state.db)
        .await
        .map_err(AppError::Database)?;

        let results: Vec<Value> = phases
            .iter()
            .map(|(id, title, progress, status, created)| {
                serde_json::json!({
                    "id": id, "title": title, "progress": progress,
                    "status": status, "createdAt": created,
                })
            })
            .collect();

        Ok(response::success(serde_json::json!({ "results": results, "level": "phase" })))
    } else {
        let mut query = r#"
            SELECT s.id, s.title, s."sprintNumber", s.progress, s.status::text, s."createdAt"::text,
                   p.title as "phaseTitle"
            FROM sprints s
            JOIN phases p ON s."phaseId" = p.id
            JOIN roadmaps r ON p."roadmapId" = r.id
            WHERE r."projectId" = $1
        "#.to_string();

        if let Some(ref status) = params.status {
            // Whitelist validation — PostgreSQL "Status" enum has known values
            let valid = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"];
            if !valid.contains(&status.as_str()) {
                return Err(AppError::Validation(format!(
                    "invalid status '{}', must be one of: {}",
                    status,
                    valid.join(", ")
                )));
            }
            query.push_str(&format!(r#" AND s.status = '{}'::"Status""#, status));
        }

        query.push_str(r#" ORDER BY s."sprintNumber" ASC"#);

        let sprints: Vec<(String, String, i32, i32, String, String, String)> = sqlx::query_as(&query)
            .bind(params.project_id)
            .fetch_all(&state.db)
            .await
            .map_err(AppError::Database)?;

        let results: Vec<Value> = sprints
            .iter()
            .map(|(id, title, num, progress, status, created, phase_title)| {
                serde_json::json!({
                    "id": id, "title": title, "sprintNumber": num,
                    "progress": progress, "status": status,
                    "createdAt": created, "phaseTitle": phase_title,
                })
            })
            .collect();

        Ok(response::success(serde_json::json!({ "results": results, "level": "sprint" })))
    }
}

// ============================================================================
// POST /api/v1/phases — Create a new phase
// ============================================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePhaseRequest {
    pub roadmap_id: String,
    pub title: String,
    pub description: Option<String>,
}

pub async fn create_phase(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreatePhaseRequest>,
) -> Result<Response, AppError> {
    // Resolve projectId from roadmap
    let roadmap: Option<(i32,)> = sqlx::query_as(
        r#"SELECT "projectId" FROM roadmaps WHERE id = $1"#,
    )
    .bind(&req.roadmap_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let project_id = roadmap
        .ok_or_else(|| AppError::NotFound(format!("roadmap {} not found", req.roadmap_id)))?
        .0;
    require_project_access(&auth, project_id)?;

    let id = cuid2::create_id();

    let row: (String, String) = sqlx::query_as(
        r#"
        INSERT INTO phases (id, title, description, status, progress, "startDate", "roadmapId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'NOT_STARTED'::"Status", 0, NOW(), $4, NOW(), NOW())
        RETURNING id, "createdAt"::text
        "#,
    )
    .bind(&id)
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.roadmap_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::created(serde_json::json!({
        "id": row.0,
        "title": req.title,
        "description": req.description,
        "status": "NOT_STARTED",
        "progress": 0,
        "roadmapId": req.roadmap_id,
        "createdAt": row.1,
    })))
}

// ============================================================================
// GET /api/v1/phases/:id — Get phase by ID
// ============================================================================

pub async fn get_phase(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(phase_id): Path<String>,
) -> Result<Response, AppError> {
    // Resolve project from phase → roadmap
    let project_row: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT r."projectId" FROM phases p
        JOIN roadmaps r ON p."roadmapId" = r.id
        WHERE p.id = $1
        "#,
    )
    .bind(&phase_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let project_id = project_row
        .ok_or_else(|| AppError::NotFound(format!("phase {} not found", phase_id)))?
        .0;
    require_project_access(&auth, project_id)?;

    let phase: (String, String, Option<String>, String, i32, String, Option<String>, String) = sqlx::query_as(
        r#"
        SELECT id, title, description, status::text, progress,
               "roadmapId", "startDate"::text, "createdAt"::text
        FROM phases WHERE id = $1
        "#,
    )
    .bind(&phase_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::success(serde_json::json!({
        "id": phase.0,
        "title": phase.1,
        "description": phase.2,
        "status": phase.3,
        "progress": phase.4,
        "roadmapId": phase.5,
        "startDate": phase.6,
        "createdAt": phase.7,
    })))
}

// ============================================================================
// PUT /api/v1/phases/:id/progress — Update phase progress
// ============================================================================

#[derive(Deserialize)]
pub struct UpdateProgressRequest {
    pub progress: i32,
}

pub async fn update_phase_progress(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(phase_id): Path<String>,
    Json(req): Json<UpdateProgressRequest>,
) -> Result<Response, AppError> {
    if req.progress < 0 || req.progress > 100 {
        return Err(AppError::Validation("progress must be 0-100".to_string()));
    }

    // Auth check
    let project_row: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT r."projectId" FROM phases p
        JOIN roadmaps r ON p."roadmapId" = r.id
        WHERE p.id = $1
        "#,
    )
    .bind(&phase_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    let project_id = project_row
        .ok_or_else(|| AppError::NotFound(format!("phase {} not found", phase_id)))?
        .0;
    require_project_access(&auth, project_id)?;

    let status = if req.progress >= 100 {
        "COMPLETED"
    } else if req.progress > 0 {
        "IN_PROGRESS"
    } else {
        "NOT_STARTED"
    };

    sqlx::query(
        r#"
        UPDATE phases
        SET progress = $1, status = $2::"Status", "updatedAt" = NOW()
        WHERE id = $3
        "#,
    )
    .bind(req.progress)
    .bind(status)
    .bind(&phase_id)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::success(serde_json::json!({
        "id": phase_id,
        "progress": req.progress,
        "status": status,
    })))
}

// ============================================================================
// PUT /api/v1/sprints/:id/progress — Update sprint progress (with cascade)
// ============================================================================

pub async fn update_sprint_progress(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(sprint_id): Path<String>,
    Json(req): Json<UpdateProgressRequest>,
) -> Result<Response, AppError> {
    if req.progress < 0 || req.progress > 100 {
        return Err(AppError::Validation("progress must be 0-100".to_string()));
    }

    // Auth: resolve project from sprint → phase → roadmap
    let project_row: Option<(i32, String)> = sqlx::query_as(
        r#"
        SELECT r."projectId", s."phaseId"
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

    let (project_id, phase_id) = project_row
        .ok_or_else(|| AppError::NotFound(format!("sprint {} not found", sprint_id)))?;
    require_project_access(&auth, project_id)?;

    let sprint_status = if req.progress >= 100 {
        "COMPLETED"
    } else if req.progress > 0 {
        "IN_PROGRESS"
    } else {
        "NOT_STARTED"
    };

    // Wrap sprint + phase updates in a transaction for atomicity
    let mut tx = state.db.begin().await.map_err(AppError::Database)?;

    // Update sprint
    sqlx::query(
        r#"
        UPDATE sprints
        SET progress = $1, status = $2::"Status", "updatedAt" = NOW()
        WHERE id = $3
        "#,
    )
    .bind(req.progress)
    .bind(sprint_status)
    .bind(&sprint_id)
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    // Recalculate parent phase progress from all sprints
    let phase_avg: (Option<f64>,) = sqlx::query_as(
        r#"
        SELECT AVG(progress)::float8
        FROM sprints WHERE "phaseId" = $1
        "#,
    )
    .bind(&phase_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    let phase_progress = phase_avg.0.unwrap_or(0.0).round() as i32;
    let phase_status = if phase_progress >= 100 {
        "COMPLETED"
    } else if phase_progress > 0 {
        "IN_PROGRESS"
    } else {
        "NOT_STARTED"
    };

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
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    // Auto-advance next sprint if this one completed (outside tx — non-critical)
    if sprint_status == "COMPLETED" {
        use crate::services::progress;
        let _ = progress::auto_advance_sprint_by_id(&state.db, &sprint_id, &phase_id).await;
    }

    Ok(response::success(serde_json::json!({
        "sprint": {
            "id": sprint_id,
            "progress": req.progress,
            "status": sprint_status,
        },
        "phase": {
            "id": phase_id,
            "progress": phase_progress,
            "status": phase_status,
        },
    })))
}
