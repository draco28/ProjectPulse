use sqlx::PgPool;

use crate::error::AppError;
use crate::models::knowledge::*;
use crate::services::embeddings::EmbeddingService;
use crate::services::pagination::{PaginatedResponse, Pagination};
use crate::services::validation::validate_length;

// ============================================================================
// Create
// ============================================================================

pub async fn create_item(
    db: &PgPool,
    embeddings: &EmbeddingService,
    req: CreateKnowledgeRequest,
) -> Result<KnowledgeResponse, AppError> {
    validate_length("title", &req.title, 1, 200)?;
    validate_length("content", &req.content, 10, 50000)?;
    validate_length("category", &req.category, 1, 50)?;
    if req.tags.len() > 20 {
        return Err(AppError::Validation("tags must have at most 20 items".into()));
    }

    // Generate embedding from title + content
    let embed_text = format!("{}\n\n{}", req.title, req.content);
    let embedding = embeddings
        .embed(&embed_text)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "embedding generation failed");
            AppError::BadRequest(format!("Embedding service unavailable: {}", e))
        })?;

    let embedding_str = format!(
        "[{}]",
        embedding.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(",")
    );

    let row: (i32, String, String) = sqlx::query_as(
        r#"
        INSERT INTO knowledge_items ("projectId", title, content, category, tags, embedding, "contentTsvector", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6::vector, to_tsvector('english', $2 || ' ' || $3), NOW(), NOW())
        RETURNING id, "createdAt"::text, "updatedAt"::text
        "#,
    )
    .bind(req.project_id)
    .bind(&req.title)
    .bind(&req.content)
    .bind(&req.category)
    .bind(&req.tags)
    .bind(&embedding_str)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "knowledge item INSERT failed");
        AppError::Database(e)
    })?;

    Ok(KnowledgeResponse {
        id: row.0,
        title: req.title,
        content: req.content,
        category: req.category,
        tags: req.tags,
        project_id: req.project_id,
        created_at: row.1,
        updated_at: row.2,
        archived_at: None,
    })
}

// ============================================================================
// List
// ============================================================================

pub async fn list_items(
    db: &PgPool,
    project_id: i32,
    search: Option<&str>,
    tag: Option<&str>,
    category: Option<&str>,
    sort: Option<&str>,
    include_archived: bool,
    pagination: &Pagination,
) -> Result<PaginatedResponse<KnowledgeListItem>, AppError> {
    // Build dynamic WHERE clause
    let mut conditions = vec!["ki.\"projectId\" = $1".to_string()];
    let mut param_idx = 2;

    if !include_archived {
        conditions.push("ki.\"archivedAt\" IS NULL".to_string());
    }

    if search.is_some() {
        conditions.push(format!(
            "(ki.title ILIKE '%' || ${} || '%' OR ki.content ILIKE '%' || ${} || '%')",
            param_idx, param_idx
        ));
        param_idx += 1;
    }

    if tag.is_some() {
        conditions.push(format!("${} = ANY(ki.tags)", param_idx));
        param_idx += 1;
    }

    if category.is_some() {
        conditions.push(format!("ki.category = ${}", param_idx));
        let _ = param_idx; // suppress unused warning; param_idx tracks bind order
    }

    let where_clause = conditions.join(" AND ");
    let order = match sort.unwrap_or("newest") {
        "updated" => r#"ki."updatedAt" DESC"#,
        _ => r#"ki."createdAt" DESC"#,
    };

    // Count query
    let count_sql = format!("SELECT COUNT(*) FROM knowledge_items ki WHERE {}", where_clause);
    // Data query
    let data_sql = format!(
        r#"SELECT ki.id, ki.title, ki.content, ki.category, ki.tags, ki."createdAt"::text, ki."updatedAt"::text
           FROM knowledge_items ki
           WHERE {}
           ORDER BY {}
           LIMIT {} OFFSET {}"#,
        where_clause, order, pagination.limit(), pagination.offset()
    );

    // Build and execute count query
    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql).bind(project_id);
    let mut data_query = sqlx::query_as::<_, (i32, String, String, String, Vec<String>, String, String)>(&data_sql).bind(project_id);

    // Bind optional params in the same order
    if let Some(s) = search {
        count_query = count_query.bind(s);
        data_query = data_query.bind(s);
    }
    if let Some(t) = tag {
        count_query = count_query.bind(t);
        data_query = data_query.bind(t);
    }
    if let Some(c) = category {
        count_query = count_query.bind(c);
        data_query = data_query.bind(c);
    }

    let (total_row, rows) = tokio::try_join!(
        count_query.fetch_one(db),
        data_query.fetch_all(db),
    )
    .map_err(|e| {
        tracing::error!(error = %e, "knowledge list query failed");
        AppError::Database(e)
    })?;

    let items = rows
        .into_iter()
        .map(|r| {
            let excerpt = if r.2.len() > 150 {
                format!("{}...", &r.2[..150])
            } else {
                r.2
            };
            KnowledgeListItem {
                id: r.0,
                title: r.1,
                excerpt,
                category: r.3,
                tags: r.4,
                created_at: r.5,
                updated_at: r.6,
            }
        })
        .collect();

    Ok(PaginatedResponse::new(items, pagination, total_row.0))
}

// ============================================================================
// Get by ID
// ============================================================================

pub async fn get_item(
    db: &PgPool,
    id: i32,
    project_id: i32,
) -> Result<KnowledgeResponse, AppError> {
    let row: Option<(i32, String, String, String, Vec<String>, i32, String, String, Option<String>)> =
        sqlx::query_as(
            r#"
            SELECT id, title, content, category, tags, "projectId",
                   "createdAt"::text, "updatedAt"::text, "archivedAt"::text
            FROM knowledge_items
            WHERE id = $1 AND "projectId" = $2
            "#,
        )
        .bind(id)
        .bind(project_id)
        .fetch_optional(db)
        .await
        .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(KnowledgeResponse {
            id: r.0,
            title: r.1,
            content: r.2,
            category: r.3,
            tags: r.4,
            project_id: r.5,
            created_at: r.6,
            updated_at: r.7,
            archived_at: r.8,
        }),
        None => Err(AppError::NotFound(format!("knowledge item {} not found", id))),
    }
}

// ============================================================================
// Archive (toggle)
// ============================================================================

pub async fn toggle_archive(
    db: &PgPool,
    id: i32,
    project_id: i32,
    archive: bool,
) -> Result<KnowledgeResponse, AppError> {
    let archived_expr = if archive { "NOW()" } else { "NULL" };
    let sql = format!(
        r#"
        UPDATE knowledge_items
        SET "archivedAt" = {}, "updatedAt" = NOW()
        WHERE id = $1 AND "projectId" = $2
        RETURNING id, title, content, category, tags, "projectId",
                  "createdAt"::text, "updatedAt"::text, "archivedAt"::text
        "#,
        archived_expr
    );

    let row: Option<(i32, String, String, String, Vec<String>, i32, String, String, Option<String>)> =
        sqlx::query_as(&sql)
            .bind(id)
            .bind(project_id)
            .fetch_optional(db)
            .await
            .map_err(AppError::Database)?;

    match row {
        Some(r) => Ok(KnowledgeResponse {
            id: r.0,
            title: r.1,
            content: r.2,
            category: r.3,
            tags: r.4,
            project_id: r.5,
            created_at: r.6,
            updated_at: r.7,
            archived_at: r.8,
        }),
        None => Err(AppError::NotFound(format!("knowledge item {} not found", id))),
    }
}

// ============================================================================
// Search (semantic, fulltext, hybrid)
// ============================================================================

pub async fn search(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
    query: &str,
    mode: &str,
    limit: i32,
    category: Option<&str>,
) -> Result<SearchResponse, AppError> {
    if query.trim().is_empty() {
        return Err(AppError::Validation("query is required".into()));
    }

    let limit = limit.clamp(1, 50);

    let results = match mode {
        "semantic" => search_semantic(db, embeddings, project_id, query, limit, category).await?,
        "fulltext" => search_fulltext(db, project_id, query, limit, category).await?,
        _ => search_hybrid(db, embeddings, project_id, query, limit, category).await?,
    };

    Ok(SearchResponse {
        count: results.len(),
        query: query.to_string(),
        mode: mode.to_string(),
        results,
    })
}

async fn search_semantic(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
    query: &str,
    limit: i32,
    category: Option<&str>,
) -> Result<Vec<KnowledgeSearchResult>, AppError> {
    let query_embedding = embeddings.embed(query).await.map_err(|e| {
        tracing::error!(error = %e, "search embedding failed");
        AppError::BadRequest(format!("Embedding service unavailable: {}", e))
    })?;

    let embedding_str = format!(
        "[{}]",
        query_embedding.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(",")
    );

    let category_filter = if category.is_some() { "AND ki.category = $4" } else { "" };
    let sql = format!(
        r#"
        SELECT ki.id, ki.title, ki.content, ki.category, ki.tags,
               1 - (ki.embedding <=> $1::vector) AS score
        FROM knowledge_items ki
        WHERE ki."projectId" = $2 AND ki."archivedAt" IS NULL {}
        ORDER BY ki.embedding <=> $1::vector
        LIMIT $3
        "#,
        category_filter
    );

    let mut q = sqlx::query_as::<_, (i32, String, String, String, Vec<String>, f64)>(&sql)
        .bind(&embedding_str)
        .bind(project_id)
        .bind(limit);

    if let Some(cat) = category {
        q = q.bind(cat);
    }

    let rows = q.fetch_all(db).await.map_err(AppError::Database)?;

    Ok(rows.into_iter().map(|r| to_search_result(r, "semantic")).collect())
}

async fn search_fulltext(
    db: &PgPool,
    project_id: i32,
    query: &str,
    limit: i32,
    category: Option<&str>,
) -> Result<Vec<KnowledgeSearchResult>, AppError> {
    let category_filter = if category.is_some() { "AND ki.category = $4" } else { "" };
    let sql = format!(
        r#"
        SELECT ki.id, ki.title, ki.content, ki.category, ki.tags,
               ts_rank_cd(ki."contentTsvector", plainto_tsquery('english', $1)) AS score
        FROM knowledge_items ki
        WHERE ki."projectId" = $2 AND ki."archivedAt" IS NULL
              AND ki."contentTsvector" @@ plainto_tsquery('english', $1) {}
        ORDER BY score DESC
        LIMIT $3
        "#,
        category_filter
    );

    let mut q = sqlx::query_as::<_, (i32, String, String, String, Vec<String>, f64)>(&sql)
        .bind(query)
        .bind(project_id)
        .bind(limit);

    if let Some(cat) = category {
        q = q.bind(cat);
    }

    let rows = q.fetch_all(db).await.map_err(AppError::Database)?;

    Ok(rows.into_iter().map(|r| to_search_result(r, "fulltext")).collect())
}

async fn search_hybrid(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
    query: &str,
    limit: i32,
    category: Option<&str>,
) -> Result<Vec<KnowledgeSearchResult>, AppError> {
    // Run both searches concurrently
    let (semantic, fulltext) = tokio::try_join!(
        search_semantic(db, embeddings, project_id, query, limit, category),
        search_fulltext(db, project_id, query, limit, category),
    )?;

    // Merge and deduplicate, keeping highest score
    let mut seen = std::collections::HashMap::new();
    for item in semantic {
        seen.insert(item.id, item);
    }
    for item in fulltext {
        seen.entry(item.id)
            .and_modify(|existing: &mut KnowledgeSearchResult| {
                if item.score > existing.score {
                    existing.score = item.score;
                }
                existing.match_type = "hybrid".to_string();
            })
            .or_insert(item);
    }

    let mut results: Vec<_> = seen.into_values().collect();
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(limit as usize);

    Ok(results)
}

fn to_search_result(
    row: (i32, String, String, String, Vec<String>, f64),
    match_type: &str,
) -> KnowledgeSearchResult {
    let excerpt = if row.2.len() > 200 {
        format!("{}...", &row.2[..200])
    } else {
        row.2
    };
    KnowledgeSearchResult {
        id: row.0,
        title: row.1,
        excerpt,
        category: row.3,
        tags: row.4,
        score: row.5,
        match_type: match_type.to_string(),
    }
}

// ============================================================================
// Related items (graph traversal)
// ============================================================================

pub async fn get_related(
    db: &PgPool,
    item_id: i32,
    project_id: i32,
    max_depth: i32,
    limit: i32,
    min_strength: f64,
) -> Result<RelatedResponse, AppError> {
    if max_depth < 1 || max_depth > 2 {
        return Err(AppError::Validation("maxDepth must be 1 or 2".into()));
    }
    let limit = limit.clamp(1, 50);

    // Verify source item exists and belongs to project
    let exists: Option<(i32,)> = sqlx::query_as(
        r#"SELECT id FROM knowledge_items WHERE id = $1 AND "projectId" = $2"#,
    )
    .bind(item_id)
    .bind(project_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    if exists.is_none() {
        return Err(AppError::NotFound(format!("knowledge item {} not found", item_id)));
    }

    // 1-hop: direct relationships
    let mut related: Vec<RelatedItem> = sqlx::query_as::<_, (i32, String, String, String, f64)>(
        r#"
        SELECT ki.id, ki.title, ki.category, kr."relationType", kr.strength
        FROM knowledge_relationships kr
        JOIN knowledge_items ki ON ki.id = kr."toItemId"
        WHERE kr."fromItemId" = $1 AND kr.strength >= $2
        UNION
        SELECT ki.id, ki.title, ki.category, kr."relationType", kr.strength
        FROM knowledge_relationships kr
        JOIN knowledge_items ki ON ki.id = kr."fromItemId"
        WHERE kr."toItemId" = $1 AND kr.strength >= $2
        ORDER BY strength DESC
        LIMIT $3
        "#,
    )
    .bind(item_id)
    .bind(min_strength)
    .bind(limit as i64)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?
    .into_iter()
    .map(|r| RelatedItem {
        id: r.0,
        title: r.1,
        category: r.2,
        relation_type: r.3,
        strength: r.4,
        depth: 1,
    })
    .collect();

    // 2-hop: traverse through direct relations (if max_depth >= 2)
    if max_depth >= 2 && (related.len() as i32) < limit {
        let hop1_ids: Vec<i32> = related.iter().map(|r| r.id).collect();
        if !hop1_ids.is_empty() {
            let remaining = (limit as usize).saturating_sub(related.len());
            let hop2_rows = sqlx::query_as::<_, (i32, String, String, String, f64)>(
                r#"
                SELECT DISTINCT ki.id, ki.title, ki.category, kr."relationType", kr.strength
                FROM knowledge_relationships kr
                JOIN knowledge_items ki ON ki.id = CASE
                    WHEN kr."fromItemId" = ANY($1) THEN kr."toItemId"
                    ELSE kr."fromItemId"
                END
                WHERE (kr."fromItemId" = ANY($1) OR kr."toItemId" = ANY($1))
                  AND ki.id != $2
                  AND ki.id != ALL($1)
                  AND kr.strength >= $3
                ORDER BY kr.strength DESC
                LIMIT $4
                "#,
            )
            .bind(&hop1_ids)
            .bind(item_id)
            .bind(min_strength)
            .bind(remaining as i64)
            .fetch_all(db)
            .await
            .map_err(AppError::Database)?;

            for r in hop2_rows {
                related.push(RelatedItem {
                    id: r.0,
                    title: r.1,
                    category: r.2,
                    relation_type: r.3,
                    strength: r.4,
                    depth: 2,
                });
            }
        }
    }

    let count = related.len();
    Ok(RelatedResponse {
        source_item_id: item_id,
        related_items: related,
        count,
    })
}

// ============================================================================
// Metrics
// ============================================================================

pub async fn get_metrics(
    db: &PgPool,
    project_id: i32,
) -> Result<MetricsResponse, AppError> {
    let total: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM knowledge_items WHERE "projectId" = $1"#,
    )
    .bind(project_id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    let archived: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM knowledge_items WHERE "projectId" = $1 AND "archivedAt" IS NOT NULL"#,
    )
    .bind(project_id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    let recent: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM knowledge_items WHERE "projectId" = $1 AND "createdAt" > NOW() - INTERVAL '7 days'"#,
    )
    .bind(project_id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    let by_category = sqlx::query_as::<_, (String, i64)>(
        r#"SELECT category, COUNT(*) FROM knowledge_items WHERE "projectId" = $1 GROUP BY category ORDER BY COUNT(*) DESC"#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(MetricsResponse {
        total_items: total.0,
        archived_items: archived.0,
        recent_items: recent.0,
        items_by_category: by_category
            .into_iter()
            .map(|r| CategoryCount { category: r.0, count: r.1 })
            .collect(),
    })
}

// ============================================================================
// Export
// ============================================================================

pub async fn export_items(
    db: &PgPool,
    project_id: i32,
) -> Result<Vec<ExportItem>, AppError> {
    let rows = sqlx::query_as::<_, (i32, String, String, String, Vec<String>, String, String)>(
        r#"
        SELECT id, title, content, category, tags, "createdAt"::text, "updatedAt"::text
        FROM knowledge_items
        WHERE "projectId" = $1 AND "archivedAt" IS NULL
        ORDER BY "createdAt" DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(rows
        .into_iter()
        .map(|r| ExportItem {
            id: r.0,
            title: r.1,
            content: r.2,
            category: r.3,
            tags: r.4,
            created_at: r.5,
            updated_at: r.6,
        })
        .collect())
}

// ============================================================================
// Import
// ============================================================================

pub async fn import_items(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
    items: Vec<ImportItem>,
) -> Result<ImportResponse, AppError> {
    let mut imported = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for item in items {
        match create_item_for_import(db, embeddings, project_id, &item).await {
            Ok(_) => imported += 1,
            Err(AppError::Conflict(_)) => skipped += 1,
            Err(e) => errors.push(format!("{}: {}", item.title, e)),
        }
    }

    Ok(ImportResponse { imported, skipped, errors })
}

async fn create_item_for_import(
    db: &PgPool,
    embeddings: &EmbeddingService,
    project_id: i32,
    item: &ImportItem,
) -> Result<i32, AppError> {
    // Check for duplicate title
    let existing: Option<(i32,)> = sqlx::query_as(
        r#"SELECT id FROM knowledge_items WHERE "projectId" = $1 AND title = $2"#,
    )
    .bind(project_id)
    .bind(&item.title)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    if existing.is_some() {
        return Err(AppError::Conflict(format!("item '{}' already exists", item.title)));
    }

    let req = CreateKnowledgeRequest {
        project_id,
        title: item.title.clone(),
        content: item.content.clone(),
        category: item.category.clone(),
        tags: item.tags.clone(),
        allow_duplicates: false,
    };

    let result = create_item(db, embeddings, req).await?;
    Ok(result.id)
}
