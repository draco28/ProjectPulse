//! Wiki page business logic.
//!
//! Handles: CRUD, revision snapshots, tsvector search, cross-link resolution,
//! analytics aggregation. All business logic lives here; route handlers are thin.

use sqlx::PgPool;

use crate::error::AppError;
use crate::models::wiki::*;

// ============================================================================
// Create
// ============================================================================

pub async fn create_page(
    db: &PgPool,
    req: CreateWikiPageRequest,
) -> Result<WikiPageResponse, AppError> {
    let path = normalize_path(&req.path)?;

    // Check uniqueness
    let existing: Option<(i32,)> = sqlx::query_as(
        r#"SELECT id FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
    )
    .bind(&path)
    .bind(req.project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    if existing.is_some() {
        return Err(AppError::Conflict(format!("wiki page at path '{}' already exists", path)));
    }

    // Resolve parent if provided
    let parent_id = resolve_parent(db, req.parent_path.as_deref(), req.project_id).await?;
    let tags = req.tags.unwrap_or_default();

    // Insert page with tsvector
    let row: (i32, i32, String, String) = sqlx::query_as(
        r#"
        INSERT INTO "WikiPage" ("projectId", title, content, path, category, excerpt, "parentId",
                                version, revisions, tags, "lastEditedBy", "lastEditedAt",
                                content_tsv, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 1, $8, 'system', NOW(),
                to_tsvector('english', $2 || ' ' || $3), NOW(), NOW())
        RETURNING id, version, "createdAt"::text, "updatedAt"::text
        "#,
    )
    .bind(req.project_id)
    .bind(&req.title)
    .bind(&req.content)
    .bind(&path)
    .bind(&req.category)
    .bind(&req.excerpt)
    .bind(parent_id)
    .bind(&tags)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "wiki page INSERT failed");
        AppError::Database(e)
    })?;

    Ok(WikiPageResponse {
        id: row.0,
        title: req.title,
        content: req.content,
        path,
        category: req.category,
        excerpt: req.excerpt,
        version: row.1,
        tags,
        project_id: req.project_id,
        created_at: row.2,
        updated_at: row.3,
    })
}

// ============================================================================
// List (with optional tsvector search)
// ============================================================================

pub async fn list_pages(
    db: &PgPool,
    project_id: i32,
    category: Option<&str>,
    search: Option<&str>,
    limit: i32,
    offset: i32,
) -> Result<WikiListResponse, AppError> {
    let limit = limit.clamp(1, 50);
    let offset = offset.max(0);

    if let Some(query) = search {
        if !query.trim().is_empty() {
            return list_pages_search(db, project_id, query, category, limit, offset).await;
        }
    }

    // Simple list (no search)
    let category_filter = if category.is_some() { r#"AND category = $2"# } else { "" };
    let count_sql = format!(
        r#"SELECT COUNT(*) FROM "WikiPage" WHERE "projectId" = $1 {}"#,
        category_filter
    );
    let data_sql = format!(
        r#"SELECT id, title, path, category, excerpt, "createdAt"::text, "updatedAt"::text
           FROM "WikiPage" WHERE "projectId" = $1 {}
           ORDER BY "updatedAt" DESC LIMIT {} OFFSET {}"#,
        category_filter, limit, offset
    );

    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(project_id);
    let mut data_q = sqlx::query_as::<_, (i32, String, String, Option<String>, Option<String>, String, String)>(&data_sql).bind(project_id);

    if let Some(cat) = category {
        count_q = count_q.bind(cat);
        data_q = data_q.bind(cat);
    }

    let (total, rows) = tokio::try_join!(count_q.fetch_one(db), data_q.fetch_all(db))
        .map_err(AppError::Database)?;

    let pages = rows.into_iter().map(|r| WikiListItem {
        id: r.0, title: r.1, path: r.2, category: r.3, excerpt: r.4,
        created_at: r.5, updated_at: r.6, highlight: None,
    }).collect();

    Ok(WikiListResponse {
        pages,
        pagination: WikiPagination {
            total: total.0, limit, offset, has_more: (offset + limit) < total.0 as i32,
        },
    })
}

async fn list_pages_search(
    db: &PgPool,
    project_id: i32,
    query: &str,
    category: Option<&str>,
    limit: i32,
    offset: i32,
) -> Result<WikiListResponse, AppError> {
    let category_filter = if category.is_some() { "AND category = $3" } else { "" };

    let count_sql = format!(
        r#"SELECT COUNT(*) FROM "WikiPage"
           WHERE "projectId" = $1 AND content_tsv @@ plainto_tsquery('english', $2) {}"#,
        category_filter
    );
    let data_sql = format!(
        r#"SELECT id, title, path, category, excerpt, "createdAt"::text, "updatedAt"::text,
                  ts_headline('english', content, plainto_tsquery('english', $2),
                              'MaxFragments=2,MinWords=5,MaxWords=20') AS highlight,
                  ts_rank_cd(content_tsv, plainto_tsquery('english', $2)) AS rank
           FROM "WikiPage"
           WHERE "projectId" = $1 AND content_tsv @@ plainto_tsquery('english', $2) {}
           ORDER BY rank DESC, "updatedAt" DESC
           LIMIT {} OFFSET {}"#,
        category_filter, limit, offset
    );

    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(project_id).bind(query);
    let mut data_q = sqlx::query_as::<_, (i32, String, String, Option<String>, Option<String>, String, String, Option<String>, f32)>(&data_sql)
        .bind(project_id).bind(query);

    if let Some(cat) = category {
        count_q = count_q.bind(cat);
        data_q = data_q.bind(cat);
    }

    let (total, rows) = tokio::try_join!(count_q.fetch_one(db), data_q.fetch_all(db))
        .map_err(AppError::Database)?;

    let pages = rows.into_iter().map(|r| WikiListItem {
        id: r.0, title: r.1, path: r.2, category: r.3, excerpt: r.4,
        created_at: r.5, updated_at: r.6, highlight: r.7,
    }).collect();

    Ok(WikiListResponse {
        pages,
        pagination: WikiPagination {
            total: total.0, limit, offset, has_more: (offset + limit) < total.0 as i32,
        },
    })
}

// ============================================================================
// Get by path
// ============================================================================

pub async fn get_page(
    db: &PgPool,
    path: &str,
    project_id: i32,
) -> Result<WikiPageDetailResponse, AppError> {
    let row: Option<(i32, String, String, String, Option<String>, Option<String>, i32, Vec<String>, i32, String, String)> =
        sqlx::query_as(
            r#"SELECT id, title, content, path, category, excerpt, version, tags, "projectId",
                      "createdAt"::text, "updatedAt"::text
               FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
        )
        .bind(path)
        .bind(project_id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    let r = row.ok_or_else(|| AppError::NotFound(format!("wiki page '{}' not found", path)))?;
    let page_id = r.0;

    // Fetch related pages via PageLinks
    let related = sqlx::query_as::<_, (i32, String, String, Option<String>)>(
        r#"SELECT wp.id, wp.title, wp.path, wp.category
           FROM "PageLink" pl
           JOIN "WikiPage" wp ON wp.id = pl."targetPageId"
           WHERE pl."sourcePageId" = $1"#,
    )
    .bind(page_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(WikiPageDetailResponse {
        page: WikiPageResponse {
            id: r.0, title: r.1, content: r.2, path: r.3, category: r.4,
            excerpt: r.5, version: r.6, tags: r.7, project_id: r.8,
            created_at: r.9, updated_at: r.10,
        },
        related_pages: related.into_iter().map(|r| RelatedPage {
            id: r.0, title: r.1, path: r.2, category: r.3,
        }).collect(),
    })
}

// ============================================================================
// Update (with revision snapshot)
// ============================================================================

pub async fn update_page(
    db: &PgPool,
    path: &str,
    project_id: i32,
    req: UpdateWikiPageRequest,
) -> Result<WikiPageResponse, AppError> {
    // Fetch existing page
    let existing: Option<(i32, String, String, Option<String>, Option<String>, i32, Vec<String>)> =
        sqlx::query_as(
            r#"SELECT id, title, content, category, excerpt, version, tags
               FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
        )
        .bind(path)
        .bind(project_id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    let ex = existing.ok_or_else(|| AppError::NotFound(format!("wiki page '{}' not found", path)))?;
    let page_id = ex.0;
    let old_version = ex.5;

    // Merge fields
    let title = req.title.unwrap_or_else(|| ex.1.clone());
    let content = req.content.unwrap_or_else(|| ex.2.clone());
    let category = req.category.or_else(|| ex.3.clone());
    let excerpt = req.excerpt.or_else(|| ex.4.clone());
    let tags = req.tags.unwrap_or_else(|| ex.6.clone());
    let changelog = req.changelog.unwrap_or_default();

    // Begin transaction: snapshot → event → update
    let mut tx = db.begin().await.map_err(AppError::Database)?;

    // 1. Create revision snapshot (BEFORE updating)
    sqlx::query(
        r#"INSERT INTO "WikiRevision" ("wikiPageId", version, title, excerpt, content,
                                        "diffSummary", "createdBy", "createdByType", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, 'system', 'agent', NOW())"#,
    )
    .bind(page_id)
    .bind(old_version)
    .bind(&ex.1) // old title
    .bind(&ex.4) // old excerpt
    .bind(&ex.2) // old content
    .bind(&changelog)
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    // 2. Create page event
    sqlx::query(
        r#"INSERT INTO "WikiPageEvent" ("wikiPageId", type, actor, metadata, "createdAt")
           VALUES ($1, 'REVISION', 'system', $2, NOW())"#,
    )
    .bind(page_id)
    .bind(serde_json::json!({ "changelog": changelog, "previousVersion": old_version }))
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    // 3. Update page
    let row: (i32, String, String) = sqlx::query_as(
        r#"UPDATE "WikiPage"
           SET title = $3, content = $4, category = $5, excerpt = $6, tags = $7,
               version = version + 1, revisions = revisions + 1,
               "lastEditedBy" = 'system', "lastEditedAt" = NOW(),
               content_tsv = to_tsvector('english', $3 || ' ' || $4),
               "updatedAt" = NOW()
           WHERE id = $1 AND "projectId" = $2
           RETURNING version, "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(page_id)
    .bind(project_id)
    .bind(&title)
    .bind(&content)
    .bind(&category)
    .bind(&excerpt)
    .bind(&tags)
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok(WikiPageResponse {
        id: page_id, title, content, path: path.to_string(), category, excerpt,
        version: row.0, tags, project_id, created_at: row.1, updated_at: row.2,
    })
}

// ============================================================================
// Delete
// ============================================================================

pub async fn delete_page(
    db: &PgPool,
    path: &str,
    project_id: i32,
) -> Result<(), AppError> {
    let result = sqlx::query(
        r#"DELETE FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
    )
    .bind(path)
    .bind(project_id)
    .execute(db)
    .await
    .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("wiki page '{}' not found", path)));
    }
    Ok(())
}

// ============================================================================
// History (revision list)
// ============================================================================

pub async fn get_history(
    db: &PgPool,
    path: &str,
    project_id: i32,
    limit: i32,
    cursor: Option<i32>,
) -> Result<WikiHistoryResponse, AppError> {
    let limit = limit.clamp(1, 50);

    // Get page ID
    let page: Option<(i32,)> = sqlx::query_as(
        r#"SELECT id FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
    )
    .bind(path)
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    let page_id = page.ok_or_else(|| AppError::NotFound(format!("wiki page '{}' not found", path)))?.0;

    // Fetch revisions with cursor-based pagination
    let rows = if let Some(cursor_version) = cursor {
        sqlx::query_as::<_, (i32, String, Option<String>, Option<String>, Option<String>, String, Option<String>)>(
            r#"SELECT version, title, excerpt, "createdBy", "createdByType", "createdAt"::text, "diffSummary"
               FROM "WikiRevision" WHERE "wikiPageId" = $1 AND version < $2
               ORDER BY version DESC LIMIT $3"#,
        )
        .bind(page_id)
        .bind(cursor_version)
        .bind(limit + 1) // fetch one extra to detect has_more
        .fetch_all(db)
        .await
    } else {
        sqlx::query_as::<_, (i32, String, Option<String>, Option<String>, Option<String>, String, Option<String>)>(
            r#"SELECT version, title, excerpt, "createdBy", "createdByType", "createdAt"::text, "diffSummary"
               FROM "WikiRevision" WHERE "wikiPageId" = $1
               ORDER BY version DESC LIMIT $2"#,
        )
        .bind(page_id)
        .bind(limit + 1)
        .fetch_all(db)
        .await
    }
    .map_err(AppError::Database)?;

    let has_more = rows.len() > limit as usize;
    let revisions: Vec<_> = rows.into_iter().take(limit as usize).map(|r| WikiRevisionResponse {
        version: r.0, title: r.1, excerpt: r.2, created_by: r.3,
        created_by_type: r.4, created_at: r.5, diff_summary: r.6,
    }).collect();

    let next_cursor = if has_more { revisions.last().map(|r| r.version) } else { None };

    Ok(WikiHistoryResponse {
        revisions,
        pagination: HistoryPagination { limit, next_cursor, has_more },
    })
}

// ============================================================================
// Revert to revision
// ============================================================================

pub async fn revert_to_version(
    db: &PgPool,
    path: &str,
    project_id: i32,
    target_version: i32,
) -> Result<WikiPageResponse, AppError> {
    // Get the revision content
    let page: Option<(i32,)> = sqlx::query_as(
        r#"SELECT id FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
    )
    .bind(path)
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    let page_id = page.ok_or_else(|| AppError::NotFound(format!("wiki page '{}' not found", path)))?.0;

    let revision: Option<(String, Option<String>, String)> = sqlx::query_as(
        r#"SELECT title, excerpt, content FROM "WikiRevision"
           WHERE "wikiPageId" = $1 AND version = $2"#,
    )
    .bind(page_id)
    .bind(target_version)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    let rev = revision.ok_or_else(|| AppError::NotFound(format!("revision {} not found", target_version)))?;

    // Apply as an update (creates a new revision snapshot automatically)
    let update_req = UpdateWikiPageRequest {
        title: Some(rev.0),
        content: Some(rev.2),
        excerpt: rev.1,
        category: None,
        tags: None,
        parent_path: None,
        changelog: Some(format!("Reverted to version {}", target_version)),
    };

    update_page(db, path, project_id, update_req).await
}

// ============================================================================
// Analytics summary
// ============================================================================

pub async fn get_analytics_summary(
    db: &PgPool,
    project_id: i32,
) -> Result<AnalyticsSummaryResponse, AppError> {
    // Top pages by views
    let top_pages = sqlx::query_as::<_, (i32, String, String, Option<String>, i32)>(
        r#"SELECT wp.id, wp.title, wp.path, wp.category, COALESCE(wa."viewCount", 0) AS views
           FROM "WikiPage" wp
           LEFT JOIN "WikiPageAnalytics" wa ON wa."wikiPageId" = wp.id
           WHERE wp."projectId" = $1
           ORDER BY views DESC
           LIMIT 6"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?
    .into_iter()
    .map(|r| TopPageItem { id: r.0, title: r.1, path: r.2, category: r.3, views: r.4 })
    .collect();

    // Trending tags (in-memory aggregation)
    let tag_rows = sqlx::query_as::<_, (Vec<String>,)>(
        r#"SELECT tags FROM "WikiPage" WHERE "projectId" = $1 AND tags != '{}'"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    let mut tag_counts = std::collections::HashMap::new();
    for (tags,) in &tag_rows {
        for tag in tags {
            *tag_counts.entry(tag.clone()).or_insert(0i32) += 1;
        }
    }
    let mut trending_tags: Vec<TagCount> = tag_counts.into_iter()
        .map(|(tag, count)| TagCount { tag, count })
        .collect();
    trending_tags.sort_by(|a, b| b.count.cmp(&a.count));
    trending_tags.truncate(8);

    // Feedback summary
    let feedback: (i64, i64, i64) = sqlx::query_as(
        r#"SELECT COALESCE(SUM("positiveVotes"), 0), COALESCE(SUM("negativeVotes"), 0),
                  COALESCE(SUM("viewCount"), 0)
           FROM "WikiPageAnalytics" wa
           JOIN "WikiPage" wp ON wa."wikiPageId" = wp.id
           WHERE wp."projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(AnalyticsSummaryResponse {
        top_pages,
        trending_tags,
        feedback: FeedbackSummary {
            positive: feedback.0,
            negative: feedback.1,
            total_views: feedback.2,
        },
        generated_at: chrono::Utc::now().to_rfc3339(),
    })
}

// ============================================================================
// Helpers
// ============================================================================

fn normalize_path(path: &str) -> Result<String, AppError> {
    let normalized = path.trim().trim_start_matches('/').to_lowercase();
    if normalized.is_empty() || normalized.len() > 200 {
        return Err(AppError::Validation("path must be 1-200 characters".into()));
    }
    Ok(normalized)
}

async fn resolve_parent(
    db: &PgPool,
    parent_path: Option<&str>,
    project_id: i32,
) -> Result<Option<i32>, AppError> {
    match parent_path {
        None => Ok(None),
        Some(pp) => {
            let row: Option<(i32,)> = sqlx::query_as(
                r#"SELECT id FROM "WikiPage" WHERE path = $1 AND "projectId" = $2"#,
            )
            .bind(pp)
            .bind(project_id)
            .fetch_optional(db)
            .await
            .map_err(AppError::Database)?;

            match row {
                Some(r) => Ok(Some(r.0)),
                None => Err(AppError::NotFound(format!("parent page '{}' not found", pp))),
            }
        }
    }
}
