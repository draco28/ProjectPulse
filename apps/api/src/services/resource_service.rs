//! Shared CRUD service for Skills, SOPs, and Personas.
//!
//! These three resource types follow identical patterns:
//! - List with token-efficient projections (exclude large text fields)
//! - Get by ID or slug with full data
//! - Create with unique (projectId, slug) constraint
//! - Update partial fields

use sqlx::{FromRow, PgPool};

use crate::error::AppError;
use crate::models::persona::*;
use crate::models::skill::*;
use crate::models::sop::*;
use crate::services::pagination::{PaginatedResponse, Pagination};

/// Internal row type for full persona queries (avoids tuple >16 limit).
#[derive(Debug, FromRow)]
struct PersonaRow {
    id: i32,
    name: String,
    slug: String,
    icon: Option<String>,
    description: Option<String>,
    #[sqlx(rename = "systemPrompt")]
    system_prompt: String,
    skills: Vec<String>,
    tools: Vec<String>,
    rules: Vec<String>,
    expertise: Vec<String>,
    personality: Option<String>,
    #[sqlx(rename = "isActive")]
    is_active: bool,
    #[sqlx(rename = "isBuiltIn")]
    is_built_in: bool,
    #[sqlx(rename = "autoActivate")]
    auto_activate: bool,
    #[sqlx(rename = "projectId")]
    project_id: i32,
    created_at: String,
    updated_at: String,
}

// ============================================================================
// Skills
// ============================================================================

pub async fn list_skills(
    db: &PgPool,
    project_id: i32,
    category: Option<&str>,
    pagination: &Pagination,
) -> Result<PaginatedResponse<SkillListItem>, AppError> {
    let (count_sql, data_sql) = if category.is_some() {
        (
            r#"SELECT COUNT(*) FROM skills WHERE "projectId" = $1 AND category = $2"#.to_string(),
            format!(
                r#"SELECT id, slug, title, category, description, tags, frameworks, "usageCount",
                          "createdAt"::text, "updatedAt"::text
                   FROM skills WHERE "projectId" = $1 AND category = $2
                   ORDER BY "updatedAt" DESC LIMIT {} OFFSET {}"#,
                pagination.limit(), pagination.offset()
            ),
        )
    } else {
        (
            r#"SELECT COUNT(*) FROM skills WHERE "projectId" = $1"#.to_string(),
            format!(
                r#"SELECT id, slug, title, category, description, tags, frameworks, "usageCount",
                          "createdAt"::text, "updatedAt"::text
                   FROM skills WHERE "projectId" = $1
                   ORDER BY "updatedAt" DESC LIMIT {} OFFSET {}"#,
                pagination.limit(), pagination.offset()
            ),
        )
    };

    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(project_id);
    let mut data_q = sqlx::query_as::<_, (i32, String, String, String, Option<String>, Vec<String>, Vec<String>, i32, String, String)>(&data_sql).bind(project_id);

    if let Some(cat) = category {
        count_q = count_q.bind(cat);
        data_q = data_q.bind(cat);
    }

    let (total, rows) = tokio::try_join!(count_q.fetch_one(db), data_q.fetch_all(db))
        .map_err(AppError::Database)?;

    let items = rows.into_iter().map(|r| SkillListItem {
        id: r.0, slug: r.1, title: r.2, category: r.3, description: r.4,
        tags: r.5, frameworks: r.6, usage_count: r.7, created_at: r.8, updated_at: r.9,
    }).collect();

    Ok(PaginatedResponse::new(items, pagination, total.0))
}

pub async fn get_skill_by_slug(
    db: &PgPool,
    slug: &str,
    project_id: i32,
) -> Result<SkillResponse, AppError> {
    let row: Option<(i32, String, String, String, String, Option<String>, Vec<String>, Vec<String>, i32, i32, String, String)> =
        sqlx::query_as(
            r#"SELECT id, slug, title, content, category, description, tags, frameworks,
                      "usageCount", "projectId", "createdAt"::text, "updatedAt"::text
               FROM skills WHERE slug = $1 AND "projectId" = $2"#,
        )
        .bind(slug)
        .bind(project_id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    match row {
        Some(r) => {
            // Track usage (fire-and-forget)
            let db2 = db.clone();
            let slug_owned = slug.to_string();
            tokio::spawn(async move {
                let _ = sqlx::query(r#"UPDATE skills SET "usageCount" = "usageCount" + 1, "lastLoadedAt" = NOW() WHERE slug = $1"#)
                    .bind(&slug_owned)
                    .execute(&db2)
                    .await;
            });

            Ok(SkillResponse {
                id: r.0, slug: r.1, title: r.2, content: r.3, category: r.4,
                description: r.5, tags: r.6, frameworks: r.7, usage_count: r.8,
                project_id: r.9, created_at: r.10, updated_at: r.11,
            })
        }
        None => Err(AppError::NotFound(format!("skill '{}' not found", slug))),
    }
}

pub async fn create_skill(db: &PgPool, req: CreateSkillRequest) -> Result<SkillResponse, AppError> {
    let row: (i32, String, String) = sqlx::query_as(
        r#"INSERT INTO skills ("projectId", slug, title, content, category, description, tags, frameworks, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING id, "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(req.project_id)
    .bind(&req.slug)
    .bind(&req.title)
    .bind(&req.content)
    .bind(&req.category)
    .bind(&req.description)
    .bind(&req.tags)
    .bind(&req.frameworks)
    .fetch_one(db)
    .await
    .map_err(|e| match &e {
        sqlx::Error::Database(db_err) if db_err.constraint().is_some() => {
            AppError::Conflict(format!("skill with slug '{}' already exists", req.slug))
        }
        _ => AppError::Database(e),
    })?;

    Ok(SkillResponse {
        id: row.0, slug: req.slug, title: req.title, content: req.content,
        category: req.category, description: req.description, tags: req.tags,
        frameworks: req.frameworks, usage_count: 0, project_id: req.project_id,
        created_at: row.1, updated_at: row.2,
    })
}

pub async fn update_skill(
    db: &PgPool,
    slug: &str,
    project_id: i32,
    req: UpdateSkillRequest,
) -> Result<SkillResponse, AppError> {
    // Fetch existing, merge with partial update, write back all fields.
    let existing = get_skill_by_slug(db, slug, project_id).await?;

    let title = req.title.unwrap_or(existing.title);
    let content = req.content.unwrap_or(existing.content);
    let category = req.category.unwrap_or(existing.category);
    let description = req.description.or(existing.description);
    let tags = req.tags.unwrap_or(existing.tags);
    let frameworks = req.frameworks.unwrap_or(existing.frameworks);

    let row: (String,) = sqlx::query_as(
        r#"UPDATE skills SET title = $3, content = $4, category = $5, description = $6,
                             tags = $7, frameworks = $8, "updatedAt" = NOW()
           WHERE slug = $1 AND "projectId" = $2
           RETURNING "updatedAt"::text"#,
    )
    .bind(slug)
    .bind(project_id)
    .bind(&title)
    .bind(&content)
    .bind(&category)
    .bind(&description)
    .bind(&tags)
    .bind(&frameworks)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(SkillResponse {
        id: existing.id, slug: slug.to_string(), title, content, category,
        description, tags, frameworks, usage_count: existing.usage_count,
        project_id, created_at: existing.created_at, updated_at: row.0,
    })
}

pub async fn search_skills(
    db: &PgPool,
    project_id: i32,
    query: &str,
    category: Option<&str>,
    limit: i32,
) -> Result<Vec<SkillListItem>, AppError> {
    let limit = limit.clamp(1, 50);
    let category_filter = if category.is_some() { "AND category = $4" } else { "" };
    let sql = format!(
        r#"SELECT id, slug, title, category, description, tags, frameworks, "usageCount",
                  "createdAt"::text, "updatedAt"::text
           FROM skills
           WHERE "projectId" = $1 AND (title ILIKE '%' || $2 || '%' OR description ILIKE '%' || $2 || '%') {}
           ORDER BY "usageCount" DESC
           LIMIT $3"#,
        category_filter
    );

    let mut q = sqlx::query_as::<_, (i32, String, String, String, Option<String>, Vec<String>, Vec<String>, i32, String, String)>(&sql)
        .bind(project_id)
        .bind(query)
        .bind(limit);

    if let Some(cat) = category {
        q = q.bind(cat);
    }

    let rows = q.fetch_all(db).await.map_err(AppError::Database)?;

    Ok(rows.into_iter().map(|r| SkillListItem {
        id: r.0, slug: r.1, title: r.2, category: r.3, description: r.4,
        tags: r.5, frameworks: r.6, usage_count: r.7, created_at: r.8, updated_at: r.9,
    }).collect())
}

// ============================================================================
// SOPs
// ============================================================================

pub async fn list_sops(
    db: &PgPool,
    project_id: i32,
    category: Option<&str>,
    pagination: &Pagination,
) -> Result<PaginatedResponse<SopListItem>, AppError> {
    let (count_sql, data_sql) = if category.is_some() {
        (
            r#"SELECT COUNT(*) FROM sops WHERE "projectId" = $1 AND category = $2"#.to_string(),
            format!(
                r#"SELECT id, slug, title, description, category, tags, "createdAt"::text, "updatedAt"::text
                   FROM sops WHERE "projectId" = $1 AND category = $2
                   ORDER BY "updatedAt" DESC LIMIT {} OFFSET {}"#,
                pagination.limit(), pagination.offset()
            ),
        )
    } else {
        (
            r#"SELECT COUNT(*) FROM sops WHERE "projectId" = $1"#.to_string(),
            format!(
                r#"SELECT id, slug, title, description, category, tags, "createdAt"::text, "updatedAt"::text
                   FROM sops WHERE "projectId" = $1
                   ORDER BY "updatedAt" DESC LIMIT {} OFFSET {}"#,
                pagination.limit(), pagination.offset()
            ),
        )
    };

    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(project_id);
    let mut data_q = sqlx::query_as::<_, (i32, String, String, String, String, Vec<String>, String, String)>(&data_sql).bind(project_id);

    if let Some(cat) = category {
        count_q = count_q.bind(cat);
        data_q = data_q.bind(cat);
    }

    let (total, rows) = tokio::try_join!(count_q.fetch_one(db), data_q.fetch_all(db))
        .map_err(AppError::Database)?;

    let items = rows.into_iter().map(|r| SopListItem {
        id: r.0, slug: r.1, title: r.2, description: r.3, category: r.4,
        tags: r.5, created_at: r.6, updated_at: r.7,
    }).collect();

    Ok(PaginatedResponse::new(items, pagination, total.0))
}

pub async fn get_sop_by_id(db: &PgPool, id: i32, project_id: i32) -> Result<SopResponse, AppError> {
    let row: Option<(i32, String, String, String, String, String, Vec<String>, i32, String, String)> =
        sqlx::query_as(
            r#"SELECT id, slug, title, description, content, category, tags, "projectId",
                      "createdAt"::text, "updatedAt"::text
               FROM sops WHERE id = $1 AND "projectId" = $2"#,
        )
        .bind(id)
        .bind(project_id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(SopResponse {
            id: r.0, slug: r.1, title: r.2, description: r.3, content: r.4,
            category: r.5, tags: r.6, project_id: r.7, created_at: r.8, updated_at: r.9,
        }),
        None => Err(AppError::NotFound(format!("SOP {} not found", id))),
    }
}

pub async fn get_sop_by_slug(db: &PgPool, slug: &str, project_id: i32) -> Result<SopResponse, AppError> {
    let row: Option<(i32, String, String, String, String, String, Vec<String>, i32, String, String)> =
        sqlx::query_as(
            r#"SELECT id, slug, title, description, content, category, tags, "projectId",
                      "createdAt"::text, "updatedAt"::text
               FROM sops WHERE slug = $1 AND "projectId" = $2"#,
        )
        .bind(slug)
        .bind(project_id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(SopResponse {
            id: r.0, slug: r.1, title: r.2, description: r.3, content: r.4,
            category: r.5, tags: r.6, project_id: r.7, created_at: r.8, updated_at: r.9,
        }),
        None => Err(AppError::NotFound(format!("SOP '{}' not found", slug))),
    }
}

pub async fn create_sop(db: &PgPool, req: CreateSopRequest) -> Result<SopResponse, AppError> {
    let row: (i32, String, String) = sqlx::query_as(
        r#"INSERT INTO sops ("projectId", slug, title, description, content, category, tags, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id, "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(req.project_id)
    .bind(&req.slug)
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.content)
    .bind(&req.category)
    .bind(&req.tags)
    .fetch_one(db)
    .await
    .map_err(|e| match &e {
        sqlx::Error::Database(db_err) if db_err.constraint().is_some() => {
            AppError::Conflict(format!("SOP with slug '{}' already exists", req.slug))
        }
        _ => AppError::Database(e),
    })?;

    Ok(SopResponse {
        id: row.0, slug: req.slug, title: req.title, description: req.description,
        content: req.content, category: req.category, tags: req.tags,
        project_id: req.project_id, created_at: row.1, updated_at: row.2,
    })
}

pub async fn update_sop(db: &PgPool, id: i32, project_id: i32, req: UpdateSopRequest) -> Result<SopResponse, AppError> {
    let existing = get_sop_by_id(db, id, project_id).await?;

    let title = req.title.unwrap_or(existing.title);
    let description = req.description.unwrap_or(existing.description);
    let content = req.content.unwrap_or(existing.content);
    let category = req.category.unwrap_or(existing.category);
    let tags = req.tags.unwrap_or(existing.tags);

    let row: (String,) = sqlx::query_as(
        r#"UPDATE sops SET title = $3, description = $4, content = $5, category = $6,
                           tags = $7, "updatedAt" = NOW()
           WHERE id = $1 AND "projectId" = $2
           RETURNING "updatedAt"::text"#,
    )
    .bind(id)
    .bind(project_id)
    .bind(&title)
    .bind(&description)
    .bind(&content)
    .bind(&category)
    .bind(&tags)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(SopResponse {
        id, slug: existing.slug, title, description, content, category, tags,
        project_id, created_at: existing.created_at, updated_at: row.0,
    })
}

// ============================================================================
// Personas
// ============================================================================

pub async fn list_personas(
    db: &PgPool,
    project_id: i32,
    is_active: Option<bool>,
    pagination: &Pagination,
) -> Result<PaginatedResponse<PersonaListItem>, AppError> {
    let (active_filter, has_filter) = match is_active {
        Some(_) => (r#"AND "isActive" = $2"#, true),
        None => ("", false),
    };

    let count_sql = format!(
        r#"SELECT COUNT(*) FROM "AgentPersona" WHERE "projectId" = $1 {}"#,
        active_filter
    );
    let data_sql = format!(
        r#"SELECT id, name, slug, icon, description, skills, expertise, "isActive", "isBuiltIn",
                  "createdAt"::text, "updatedAt"::text
           FROM "AgentPersona" WHERE "projectId" = $1 {}
           ORDER BY "updatedAt" DESC LIMIT {} OFFSET {}"#,
        active_filter, pagination.limit(), pagination.offset()
    );

    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(project_id);
    let mut data_q = sqlx::query_as::<_, (i32, String, String, Option<String>, Option<String>, Vec<String>, Vec<String>, bool, bool, String, String)>(&data_sql).bind(project_id);

    if has_filter {
        count_q = count_q.bind(is_active.unwrap());
        data_q = data_q.bind(is_active.unwrap());
    }

    let (total, rows) = tokio::try_join!(count_q.fetch_one(db), data_q.fetch_all(db))
        .map_err(AppError::Database)?;

    let items = rows.into_iter().map(|r| PersonaListItem {
        id: r.0, name: r.1, slug: r.2, icon: r.3, description: r.4,
        skills: r.5, expertise: r.6, is_active: r.7, is_built_in: r.8,
        created_at: r.9, updated_at: r.10,
    }).collect();

    Ok(PaginatedResponse::new(items, pagination, total.0))
}

pub async fn get_persona_by_id(db: &PgPool, id: i32, project_id: i32) -> Result<PersonaResponse, AppError> {
    let row: Option<PersonaRow> = sqlx::query_as(
        r#"SELECT id, name, slug, icon, description, "systemPrompt", skills, tools, rules, expertise,
                  personality, "isActive", "isBuiltIn", "autoActivate", "projectId",
                  "createdAt"::text AS created_at, "updatedAt"::text AS updated_at
           FROM "AgentPersona" WHERE id = $1 AND "projectId" = $2"#,
    )
    .bind(id)
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(persona_row_to_response(r)),
        None => Err(AppError::NotFound(format!("persona {} not found", id))),
    }
}

pub async fn get_persona_by_slug(db: &PgPool, slug: &str, project_id: i32) -> Result<PersonaResponse, AppError> {
    let row: Option<PersonaRow> = sqlx::query_as(
        r#"SELECT id, name, slug, icon, description, "systemPrompt", skills, tools, rules, expertise,
                  personality, "isActive", "isBuiltIn", "autoActivate", "projectId",
                  "createdAt"::text AS created_at, "updatedAt"::text AS updated_at
           FROM "AgentPersona" WHERE slug = $1 AND "projectId" = $2"#,
    )
    .bind(slug)
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(persona_row_to_response(r)),
        None => Err(AppError::NotFound(format!("persona '{}' not found", slug))),
    }
}

pub async fn create_persona(db: &PgPool, req: CreatePersonaRequest) -> Result<PersonaResponse, AppError> {
    let row: (i32, String, String) = sqlx::query_as(
        r#"INSERT INTO "AgentPersona" ("projectId", name, slug, icon, description, "systemPrompt",
                                        skills, tools, rules, expertise, personality,
                                        "isActive", "autoActivate", "activationConditions",
                                        "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
           RETURNING id, "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(req.project_id).bind(&req.name).bind(&req.slug).bind(&req.icon)
    .bind(&req.description).bind(&req.system_prompt).bind(&req.skills)
    .bind(&req.tools).bind(&req.rules).bind(&req.expertise).bind(&req.personality)
    .bind(req.is_active).bind(req.auto_activate).bind(&req.activation_conditions)
    .fetch_one(db)
    .await
    .map_err(|e| match &e {
        sqlx::Error::Database(db_err) if db_err.constraint().is_some() => {
            AppError::Conflict(format!("persona with slug '{}' already exists", req.slug))
        }
        _ => AppError::Database(e),
    })?;

    Ok(PersonaResponse {
        id: row.0, name: req.name, slug: req.slug, icon: req.icon,
        description: req.description, system_prompt: req.system_prompt,
        skills: req.skills, tools: req.tools, rules: req.rules,
        expertise: req.expertise, personality: req.personality,
        is_active: req.is_active, is_built_in: false, auto_activate: req.auto_activate,
        project_id: req.project_id, created_at: row.1, updated_at: row.2,
    })
}

pub async fn update_persona(db: &PgPool, id: i32, project_id: i32, req: UpdatePersonaRequest) -> Result<PersonaResponse, AppError> {
    let existing = get_persona_by_id(db, id, project_id).await?;

    let name = req.name.unwrap_or(existing.name);
    let description = req.description.or(existing.description);
    let system_prompt = req.system_prompt.unwrap_or(existing.system_prompt);
    let icon = req.icon.or(existing.icon);
    let skills = req.skills.unwrap_or(existing.skills);
    let tools = req.tools.unwrap_or(existing.tools);
    let rules = req.rules.unwrap_or(existing.rules);
    let expertise = req.expertise.unwrap_or(existing.expertise);
    let personality = req.personality.or(existing.personality);
    let is_active = req.is_active.unwrap_or(existing.is_active);
    let auto_activate = req.auto_activate.unwrap_or(existing.auto_activate);

    let row: (String,) = sqlx::query_as(
        r#"UPDATE "AgentPersona" SET name = $3, description = $4, "systemPrompt" = $5, icon = $6,
                                      skills = $7, tools = $8, rules = $9, expertise = $10,
                                      personality = $11, "isActive" = $12, "autoActivate" = $13,
                                      "updatedAt" = NOW()
           WHERE id = $1 AND "projectId" = $2
           RETURNING "updatedAt"::text"#,
    )
    .bind(id).bind(project_id).bind(&name).bind(&description).bind(&system_prompt)
    .bind(&icon).bind(&skills).bind(&tools).bind(&rules).bind(&expertise)
    .bind(&personality).bind(is_active).bind(auto_activate)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(PersonaResponse {
        id, name, slug: existing.slug, icon, description, system_prompt,
        skills, tools, rules, expertise, personality, is_active,
        is_built_in: existing.is_built_in, auto_activate, project_id,
        created_at: existing.created_at, updated_at: row.0,
    })
}

// ============================================================================
// Helpers
// ============================================================================

fn persona_row_to_response(r: PersonaRow) -> PersonaResponse {
    PersonaResponse {
        id: r.id, name: r.name, slug: r.slug, icon: r.icon,
        description: r.description, system_prompt: r.system_prompt,
        skills: r.skills, tools: r.tools, rules: r.rules,
        expertise: r.expertise, personality: r.personality,
        is_active: r.is_active, is_built_in: r.is_built_in,
        auto_activate: r.auto_activate, project_id: r.project_id,
        created_at: r.created_at, updated_at: r.updated_at,
    }
}
