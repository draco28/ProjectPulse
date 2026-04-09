//! Batch create endpoints for personas, skills, SOPs, and workflow templates.
//!
//! POST /api/v1/batch/agent-personas
//! POST /api/v1/batch/skills
//! POST /api/v1/batch/sops
//! POST /api/v1/batch/workflow-templates

use axum::extract::State;
use axum::response::Response;
use axum::Extension;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::response;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BatchResult {
    created: i32,
    skipped: i32,
    errors: Vec<String>,
}

// ============================================================================
// POST /api/v1/batch/agent-personas
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchPersonasRequest {
    pub project_id: i32,
    pub personas: Vec<PersonaItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonaItem {
    pub name: String,
    pub slug: String,
    pub system_prompt: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub skills: Vec<String>,
    #[serde(default)]
    pub tools: Vec<String>,
    #[serde(default)]
    pub rules: Vec<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub expertise: Vec<String>,
    #[serde(default)]
    pub personality: Option<String>,
    #[serde(default = "default_true")]
    pub is_active: bool,
    #[serde(default)]
    pub is_built_in: bool,
}

fn default_true() -> bool { true }

pub async fn batch_personas(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<BatchPersonasRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let mut created = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for p in &req.personas {
        let result = sqlx::query(
            r#"INSERT INTO "AgentPersona" ("projectId", name, slug, description, "systemPrompt",
                                            skills, tools, rules, icon, expertise, personality,
                                            "isActive", "isBuiltIn", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
               ON CONFLICT ("projectId", slug) DO NOTHING"#,
        )
        .bind(req.project_id).bind(&p.name).bind(&p.slug).bind(&p.description)
        .bind(&p.system_prompt).bind(&p.skills).bind(&p.tools).bind(&p.rules)
        .bind(&p.icon).bind(&p.expertise).bind(&p.personality)
        .bind(p.is_active).bind(p.is_built_in)
        .execute(&state.db)
        .await;

        match result {
            Ok(r) if r.rows_affected() > 0 => created += 1,
            Ok(_) => skipped += 1,
            Err(e) => errors.push(format!("{}: {}", p.name, e)),
        }
    }

    Ok(response::success(BatchResult { created, skipped, errors }))
}

// ============================================================================
// POST /api/v1/batch/skills
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSkillsRequest {
    pub project_id: i32,
    pub skills: Vec<SkillItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillItem {
    pub slug: String,
    pub title: String,
    pub content: String,
    pub category: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub frameworks: Vec<String>,
}

pub async fn batch_skills(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<BatchSkillsRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let mut created = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for s in &req.skills {
        let result = sqlx::query(
            r#"INSERT INTO skills ("projectId", slug, title, content, category, description,
                                    tags, frameworks, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
               ON CONFLICT ("projectId", slug) DO NOTHING"#,
        )
        .bind(req.project_id).bind(&s.slug).bind(&s.title).bind(&s.content)
        .bind(&s.category).bind(&s.description).bind(&s.tags).bind(&s.frameworks)
        .execute(&state.db)
        .await;

        match result {
            Ok(r) if r.rows_affected() > 0 => created += 1,
            Ok(_) => skipped += 1,
            Err(e) => errors.push(format!("{}: {}", s.title, e)),
        }
    }

    Ok(response::success(BatchResult { created, skipped, errors }))
}

// ============================================================================
// POST /api/v1/batch/sops
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSopsRequest {
    pub project_id: i32,
    pub sops: Vec<SopItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SopItem {
    pub title: String,
    pub slug: String,
    pub description: String,
    pub content: String,
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

pub async fn batch_sops(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<BatchSopsRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let mut created = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for s in &req.sops {
        let result = sqlx::query(
            r#"INSERT INTO sops ("projectId", title, slug, description, content, category,
                                  tags, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
               ON CONFLICT ("projectId", slug) DO NOTHING"#,
        )
        .bind(req.project_id).bind(&s.title).bind(&s.slug).bind(&s.description)
        .bind(&s.content).bind(&s.category).bind(&s.tags)
        .execute(&state.db)
        .await;

        match result {
            Ok(r) if r.rows_affected() > 0 => created += 1,
            Ok(_) => skipped += 1,
            Err(e) => errors.push(format!("{}: {}", s.title, e)),
        }
    }

    Ok(response::success(BatchResult { created, skipped, errors }))
}

// ============================================================================
// POST /api/v1/batch/workflow-templates
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchWorkflowsRequest {
    pub project_id: i32,
    pub templates: Vec<WorkflowItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowItem {
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub steps: Value,
    #[serde(default = "default_true")]
    pub is_active: bool,
}

pub async fn batch_workflows(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<BatchWorkflowsRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let mut created = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for w in &req.templates {
        let result = sqlx::query(
            r#"INSERT INTO "WorkflowTemplate" ("projectId", name, description, category,
                                                steps, "isActive", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
               ON CONFLICT ("projectId", name) DO NOTHING"#,
        )
        .bind(req.project_id).bind(&w.name).bind(&w.description)
        .bind(&w.category).bind(&w.steps).bind(w.is_active)
        .execute(&state.db)
        .await;

        match result {
            Ok(r) if r.rows_affected() > 0 => created += 1,
            Ok(_) => skipped += 1,
            Err(e) => errors.push(format!("{}: {}", w.name, e)),
        }
    }

    Ok(response::success(BatchResult { created, skipped, errors }))
}
