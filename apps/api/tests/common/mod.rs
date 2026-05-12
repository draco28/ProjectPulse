#![allow(dead_code)]

use projectpulse_api::config::Config;
use projectpulse_api::state::AppState;
use tempfile::TempDir;

pub const TEST_SECRET: &str = "test-secret-for-jwt-at-least-32-chars-long";

/// Create an AppState configured for testing.
///
/// Uses the real PostgreSQL database (integration testing, not mocks)
/// and a temporary directory for PulseDB (isolated per test).
///
/// Returns (AppState, TempDir) — hold the TempDir to keep it alive for the test duration.
pub async fn test_state() -> (AppState, TempDir) {
    let temp_dir = TempDir::new().expect("failed to create temp dir for PulseDB");
    let pulsedb_path = temp_dir
        .path()
        .join("test.pulsedb")
        .to_string_lossy()
        .to_string();

    let config = Config {
        database_url: std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgresql://postgres:postgres123@127.0.0.1:5432/projectpulse_dev?sslmode=disable"
                .to_string()
        }),
        pulsedb_path,
        host: "127.0.0.1".to_string(),
        port: 0,
        allowed_origins: vec!["http://localhost:3000".to_string()],
        nextauth_secret: TEST_SECRET.to_string(),
        mcp_internal_secret: None,
        llm_base_url: std::env::var("LLM_BASE_URL")
            .unwrap_or_else(|_| "https://ollama.com/v1".to_string()),
        llm_api_key: std::env::var("LLM_API_KEY").ok(),
        llm_model: std::env::var("LLM_MODEL")
            .unwrap_or_else(|_| "glm-5:cloud".to_string()),
    };

    let state = AppState::new(config)
        .await
        .expect("failed to create test AppState — is PostgreSQL running?");

    // Ensure test user + project exist (FK constraints require them for ticket creation)
    sqlx::query(
        r#"INSERT INTO users (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
           VALUES ('test-user-1', 'test@example.com', 'Test User', '$2b$10$placeholder', 'ADMIN'::"UserRole", NOW(), NOW())
           ON CONFLICT (id) DO NOTHING"#,
    )
    .execute(&state.db)
    .await
    .ok();

    sqlx::query(
        r#"INSERT INTO "Project" (id, name, "ownerId", "createdAt", "updatedAt")
           VALUES (6, 'Test Project', 'test-user-1', NOW(), NOW())
           ON CONFLICT (id) DO NOTHING"#,
    )
    .execute(&state.db)
    .await
    .ok();

    (state, temp_dir)
}

/// Sprint hierarchy created for testing kanban/progress cascade.
pub struct TestSprintHierarchy {
    pub roadmap_id: String,
    pub phase_id: String,
    pub sprint_id: String,
    /// Sprint number (project-scoped, 1-indexed within phase).
    pub sprint_number: i32,
}

/// Create a phase → sprint hierarchy under the existing project 6 roadmap.
/// Reuses (or creates) a single roadmap for project 6, then creates a UNIQUE
/// phase + sprint per call so tests can run in parallel without conflicts.
pub async fn create_test_sprint(db: &sqlx::PgPool) -> TestSprintHierarchy {
    // Get or create the roadmap for project 6 (unique constraint on projectId)
    let roadmap_id: String = match sqlx::query_as::<_, (String,)>(
        r#"SELECT id FROM roadmaps WHERE "projectId" = 6"#,
    )
    .fetch_optional(db)
    .await
    .expect("failed to query roadmap")
    {
        Some((id,)) => id,
        None => {
            let new_id = cuid2::create_id();
            sqlx::query(
                r#"INSERT INTO roadmaps (id, "projectId", phases, "createdAt", "updatedAt")
                   VALUES ($1, 6, '{}'::jsonb, NOW(), NOW())
                   ON CONFLICT ("projectId") DO NOTHING"#,
            )
            .bind(&new_id)
            .execute(db)
            .await
            .expect("failed to insert roadmap");
            // Re-fetch in case of concurrent insert
            sqlx::query_as::<_, (String,)>(r#"SELECT id FROM roadmaps WHERE "projectId" = 6"#)
                .fetch_one(db)
                .await
                .expect("failed to re-fetch roadmap")
                .0
        }
    };

    let phase_id = cuid2::create_id();
    let sprint_id = cuid2::create_id();

    // Insert phase (always new)
    sqlx::query(
        r#"INSERT INTO phases (id, title, description, status, progress, "startDate", "roadmapId", "createdAt", "updatedAt")
           VALUES ($1, 'Test Phase', NULL, 'NOT_STARTED'::"Status", 0, NOW(), $2, NOW(), NOW())"#,
    )
    .bind(&phase_id)
    .bind(&roadmap_id)
    .execute(db)
    .await
    .expect("failed to insert phase");

    // Insert sprint (sprint_number = 1 within this new phase)
    sqlx::query(
        r#"INSERT INTO sprints (id, title, description, status, progress, "sprintNumber", "startDate", "phaseId", "createdAt", "updatedAt")
           VALUES ($1, 'Test Sprint', NULL, 'NOT_STARTED'::"Status", 0, 1, NOW(), $2, NOW(), NOW())"#,
    )
    .bind(&sprint_id)
    .bind(&phase_id)
    .execute(db)
    .await
    .expect("failed to insert sprint");

    TestSprintHierarchy {
        roadmap_id,
        phase_id,
        sprint_id,
        sprint_number: 1,
    }
}

/// Insert a ticket directly into the DB, assigned to the given sprint.
/// Returns the ticket id. Bypasses API for setup speed.
pub async fn insert_test_ticket(
    db: &sqlx::PgPool,
    project_id: i32,
    title: &str,
    status: &str,
    sprint_id: Option<&str>,
) -> i32 {
    let row: (i32,) = sqlx::query_as(
        r#"INSERT INTO tickets
            (title, kind, source, status, priority, "projectId", ticket_number,
             "displayOrder", "sprintId", "createdAt", "updatedAt")
           VALUES ($1, 'task', 'agent', $2, 'medium',
                   $3,
                   (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM tickets WHERE "projectId" = $3),
                   0, $4, NOW(), NOW())
           RETURNING id"#,
    )
    .bind(title)
    .bind(status)
    .bind(project_id)
    .bind(sprint_id)
    .fetch_one(db)
    .await
    .expect("failed to insert test ticket");
    row.0
}

/// Create a test JWT token signed with TEST_SECRET.
pub fn create_test_jwt(user_id: &str, email: &str, role: &str) -> String {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::json;

    let claims = json!({
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": chrono::Utc::now().timestamp(),
        "exp": chrono::Utc::now().timestamp() + 3600, // 1 hour
    });

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(TEST_SECRET.as_bytes()),
    )
    .expect("failed to create test JWT")
}
