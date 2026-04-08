use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::{Extension, Json};

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::ticket::*;
use crate::response;
use crate::services::ticket_service;
use crate::state::AppState;

// ============================================================================
// POST /api/v1/tickets — Create ticket
// ============================================================================

pub async fn create_ticket(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateTicketRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;

    // Validate title
    if req.title.trim().is_empty() || req.title.len() > 200 {
        return Err(AppError::Validation(
            "title must be 1-200 characters".into(),
        ));
    }

    // Validate parent if provided
    if let Some(parent_id) = req.parent_ticket_id {
        ticket_service::validate_parent(&state.db, parent_id, req.project_id)
            .await
            .map_err(|e| AppError::Validation(format!("{e}")))?;
    }

    // Resolve sprintNumber → sprintId
    let sprint_id = if let Some(sn) = req.sprint_number {
        ticket_service::resolve_sprint_id(&state.db, req.project_id, sn)
            .await
            .map_err(AppError::Internal)?
    } else {
        None
    };

    let status = req.status.as_deref().unwrap_or("backlog");
    let priority = req.priority.as_deref().unwrap_or("medium");
    let kind_str = serde_json::to_value(&req.kind)
        .ok()
        .and_then(|v| v.as_str().map(str::to_string))
        .unwrap_or_else(|| "task".into());
    let source_str = serde_json::to_value(&req.source)
        .ok()
        .and_then(|v| v.as_str().map(str::to_string))
        .unwrap_or_else(|| "agent".into());
    let display_order = req.display_order.unwrap_or(0);
    let backlog_refs = req.backlog_refs.unwrap_or_default();

    // Atomic INSERT: ticket_number is computed as MAX+1 within the same statement
    // to avoid the SELECT MAX + INSERT race condition.
    let row: (i32, i32, String) = sqlx::query_as(
        r#"
        INSERT INTO tickets (
            title, description, kind, source, status, priority, module,
            assignee, "assigneeType", "assigneeId",
            "projectId", ticket_number, "displayOrder",
            "parentTicketId", "epicRef", "backlogRefs",
            "sprintNumber", "sprintId", "estimatedDays",
            "customFields", "createdAt", "updatedAt"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10,
            $11,
            (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM tickets WHERE "projectId" = $11),
            $12,
            $13, $14, $15,
            $16, $17, $18,
            $19, NOW(), NOW()
        )
        RETURNING id, ticket_number, "createdAt"::text
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&kind_str)
    .bind(&source_str)
    .bind(status)
    .bind(priority)
    .bind(&req.module)
    .bind(&req.assignee)
    .bind(&req.assignee_type)
    .bind(&req.assignee_id)
    .bind(req.project_id)
    .bind(display_order)
    .bind(req.parent_ticket_id)
    .bind(&req.epic_ref)
    .bind(&backlog_refs)
    .bind(req.sprint_number)
    .bind(&sprint_id)
    .bind(req.estimated_days)
    .bind(&req.custom_fields)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "ticket create INSERT failed");
        AppError::Database(e)
    })?;

    let ticket_number = row.1;
    let ticket = TicketResponse {
        id: row.0,
        ticket_number,
        display_id: ticket_number.to_string(),
        project_id: req.project_id,
        title: req.title,
        description: req.description,
        kind: kind_str,
        source: source_str,
        status: status.to_string(),
        priority: Some(priority.to_string()),
        module: req.module,
        assignee: req.assignee,
        assignee_type: req.assignee_type,
        sprint_number: req.sprint_number,
        parent_ticket_id: req.parent_ticket_id,
        parent_ticket: None,
        children_count: 0,
        epic_ref: req.epic_ref,
        backlog_refs,
        estimated_days: req.estimated_days,
        display_order,
        custom_fields: req.custom_fields,
        labels: Vec::new(),
        closed_at: None,
        created_at: row.2.clone(),
        updated_at: row.2,
    };

    Ok(response::created(ticket))
}

// ============================================================================
// GET /api/v1/tickets — List with filters
// ============================================================================

pub async fn list_tickets(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<TicketListParams>,
) -> Result<Response, AppError> {
    let project_id = params.project_id.ok_or_else(|| {
        AppError::Validation("projectId query parameter is required".into())
    })?;
    require_project_access(&auth, project_id)?;

    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * page_size;
    let sort_by = params.sort_by.as_deref().unwrap_or("createdAt");
    let sort_dir = params.sort_direction.as_deref().unwrap_or("desc");

    // Build parameterized WHERE clauses.
    // $1 is always project_id. Additional bind values are collected in bind_strings
    // (string params), bind_ints (integer params), and tracked by param_idx.
    // For IN-list filters we use ANY($N::text[]) with a Vec<String> bind.
    // For ILIKE patterns we use $N with a pre-formatted "%value%" string.
    let mut conditions: Vec<String> = vec![r#""projectId" = $1"#.to_string()];
    let mut param_idx: i32 = 2; // $1 is project_id

    // Each entry is one bind value; we store them as boxed closures that apply
    // themselves to the query builder, but sqlx's dynamic query API requires we
    // bind each value individually after building the query string.  Instead we
    // collect the values into typed vecs and bind in a fixed order below.
    //
    // Order of binding (after $1 = project_id):
    //   statuses?, kinds?, priorities?, sprint_number?, parent_ticket_id?,
    //   modules?, search_pattern?, epic_pattern?

    let statuses: Option<Vec<String>> = params.status.as_deref().map(|s| {
        s.split(',').map(|v| v.trim().to_string()).collect()
    });
    if statuses.is_some() {
        conditions.push(format!("status = ANY(${})", param_idx));
        param_idx += 1;
    }

    let kinds: Option<Vec<String>> = params.kind.as_deref().map(|s| {
        s.split(',').map(|v| v.trim().to_string()).collect()
    });
    if kinds.is_some() {
        conditions.push(format!("kind = ANY(${})", param_idx));
        param_idx += 1;
    }

    let priorities: Option<Vec<String>> = params.priority.as_deref().map(|s| {
        s.split(',').map(|v| v.trim().to_string()).collect()
    });
    if priorities.is_some() {
        conditions.push(format!("priority = ANY(${})", param_idx));
        param_idx += 1;
    }

    if params.sprint_number.is_some() {
        conditions.push(format!(r#""sprintNumber" = ${}"#, param_idx));
        param_idx += 1;
    }

    if params.parent_ticket_id.is_some() {
        conditions.push(format!(r#""parentTicketId" = ${}"#, param_idx));
        param_idx += 1;
    }

    let modules: Option<Vec<String>> = params.module.as_deref().map(|s| {
        s.split(',').map(|v| v.trim().to_string()).collect()
    });
    if modules.is_some() {
        conditions.push(format!("module = ANY(${})", param_idx));
        param_idx += 1;
    }

    if let Some(true) = params.is_top_level {
        conditions.push(r#""parentTicketId" IS NULL"#.to_string());
    }

    // ILIKE patterns: bind as "%value%" strings
    let search_pattern: Option<String> = params.search.as_ref().map(|s| format!("%{}%", s));
    if search_pattern.is_some() {
        conditions.push(format!(
            "(title ILIKE ${p} OR description ILIKE ${p})",
            p = param_idx
        ));
        param_idx += 1;
    }

    let epic_pattern: Option<String> = params.epic_ref.as_ref().map(|s| format!("%{}%", s));
    if epic_pattern.is_some() {
        conditions.push(format!(r#""epicRef" ILIKE ${}"#, param_idx));
        param_idx += 1;
    }

    // param_idx now equals (number of bind params + 1); used below for LIMIT/OFFSET
    let limit_idx = param_idx;
    let offset_idx = param_idx + 1;

    let where_clause = conditions.join(" AND ");

    // Validate sort column (whitelist — never interpolate user input)
    let order_col = match sort_by {
        "updatedAt" => r#""updatedAt""#,
        "priority" => "priority",
        "sprintNumber" => r#""sprintNumber""#,
        "kind" => "kind",
        "ticketNumber" => "ticket_number",
        _ => r#""createdAt""#,
    };
    let order_dir = if sort_dir == "asc" { "ASC" } else { "DESC" };

    // Helper macro: bind all optional filter params in declaration order.
    // Both count and select queries share the same bind sequence.
    macro_rules! bind_filters {
        ($q:expr) => {{
            let mut q = $q.bind(project_id);
            if let Some(ref v) = statuses    { q = q.bind(v.clone()); }
            if let Some(ref v) = kinds       { q = q.bind(v.clone()); }
            if let Some(ref v) = priorities  { q = q.bind(v.clone()); }
            if let Some(v) = params.sprint_number      { q = q.bind(v); }
            if let Some(v) = params.parent_ticket_id   { q = q.bind(v); }
            if let Some(ref v) = modules     { q = q.bind(v.clone()); }
            if let Some(ref v) = search_pattern  { q = q.bind(v); }
            if let Some(ref v) = epic_pattern    { q = q.bind(v); }
            q
        }};
    }

    // Count total (same WHERE, no ORDER/LIMIT)
    let count_query = format!("SELECT COUNT(*) FROM tickets WHERE {}", where_clause);
    let total: (i64,) = bind_filters!(sqlx::query_as::<_, (i64,)>(&count_query))
        .fetch_one(&state.db)
        .await
        .map_err(AppError::Database)?;

    // Fetch page — LIMIT and OFFSET are safe integer interpolations (clamped above)
    let select_query = format!(
        r#"
        SELECT id, ticket_number, title, description, kind, source, status,
               priority, module, assignee, "assigneeType",
               "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
               "estimatedDays", "displayOrder", "customFields",
               "closedAt"::text, "createdAt"::text, "updatedAt"::text
        FROM tickets
        WHERE {}
        ORDER BY {} {}
        LIMIT ${} OFFSET ${}
        "#,
        where_clause, order_col, order_dir, limit_idx, offset_idx
    );

    let rows: Vec<TicketRow> = bind_filters!(sqlx::query_as::<_, TicketRow>(&select_query))
        .bind(page_size)
        .bind(offset)
        .fetch_all(&state.db)
        .await
        .map_err(AppError::Database)?;

    let tickets: Vec<TicketResponse> = rows
        .into_iter()
        .map(|r| r.into_response(project_id))
        .collect();

    let total_pages = ((total.0 as f64) / (page_size as f64)).ceil() as i32;

    Ok(response::success(TicketListResponse {
        tickets,
        total: total.0,
        page,
        page_size,
        total_pages,
    }))
}

// ============================================================================
// GET /api/v1/tickets/:id — Get single ticket
// ============================================================================

pub async fn get_ticket(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
) -> Result<Response, AppError> {
    let row: Option<TicketRow> = sqlx::query_as(
        r#"
        SELECT id, ticket_number, title, description, kind, source, status,
               priority, module, assignee, "assigneeType",
               "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
               "estimatedDays", "displayOrder", "customFields",
               "closedAt"::text, "createdAt"::text, "updatedAt"::text
        FROM tickets WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some(r) => {
            let project_id = get_project_id(&state.db, id).await?;
            require_project_access(&auth, project_id)?;
            let children_count = ticket_service::count_children(&state.db, id)
                .await
                .unwrap_or(0);
            let mut ticket = r.into_response(project_id);
            ticket.children_count = children_count;

            // Fetch parent info if exists
            if let Some(pid) = ticket.parent_ticket_id {
                let parent: Option<(i32, String)> = sqlx::query_as(
                    "SELECT id, title FROM tickets WHERE id = $1",
                )
                .bind(pid)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten();

                ticket.parent_ticket = parent.map(|(id, title)| ParentTicketRef { id, title });
            }

            Ok(response::success(ticket))
        }
        None => Err(AppError::NotFound(format!("ticket {} not found", id))),
    }
}

// ============================================================================
// PATCH /api/v1/tickets/:id — Update ticket
// ============================================================================

pub async fn update_ticket(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<UpdateTicketRequest>,
) -> Result<Response, AppError> {
    // Verify ticket exists and check project access
    let project_id_row: Option<(i32,)> =
        sqlx::query_as(r#"SELECT "projectId" FROM tickets WHERE id = $1"#)
            .bind(id)
            .fetch_optional(&state.db)
            .await
            .map_err(AppError::Database)?;

    let ticket_project_id = project_id_row
        .ok_or_else(|| AppError::NotFound(format!("ticket {} not found", id)))?
        .0;
    require_project_access(&auth, ticket_project_id)?;

    // Build dynamic SET clause
    let mut sets = Vec::new();
    let mut _param_idx = 2; // $1 is id

    macro_rules! maybe_set {
        ($field:expr, $col:expr) => {
            if $field.is_some() {
                sets.push(format!("{} = ${}", $col, _param_idx));
                _param_idx += 1;
            }
        };
    }

    // Serialize kind enum to string before binding (serde snake_case)
    let kind_str: Option<String> = req.kind.as_ref().and_then(|k| {
        serde_json::to_value(k)
            .ok()
            .and_then(|v| v.as_str().map(str::to_string))
    });

    maybe_set!(req.title, "title");
    maybe_set!(req.description, "description");
    maybe_set!(req.status, "status");
    maybe_set!(req.priority, "priority");
    maybe_set!(kind_str, "kind");
    maybe_set!(req.module, "module");
    maybe_set!(req.assignee, "assignee");
    maybe_set!(req.assignee_type, r#""assigneeType""#);
    maybe_set!(req.assignee_id, r#""assigneeId""#);
    maybe_set!(req.sprint_number, r#""sprintNumber""#);
    maybe_set!(req.parent_ticket_id, r#""parentTicketId""#);
    maybe_set!(req.epic_ref, r#""epicRef""#);
    maybe_set!(req.backlog_refs, r#""backlogRefs""#);
    maybe_set!(req.estimated_days, r#""estimatedDays""#);
    maybe_set!(req.display_order, r#""displayOrder""#);
    maybe_set!(req.custom_fields, r#""customFields""#);

    if sets.is_empty() {
        // Nothing to update — return current ticket
        return get_ticket(State(state), Extension(auth), Path(id)).await;
    }

    sets.push(r#""updatedAt" = NOW()"#.to_string());

    let query = format!(
        "UPDATE tickets SET {} WHERE id = $1 RETURNING id",
        sets.join(", ")
    );

    // Build dynamic query with bindings — order must match maybe_set! calls above
    let mut q = sqlx::query(&query).bind(id);

    if let Some(ref v) = req.title           { q = q.bind(v); }
    if let Some(ref v) = req.description     { q = q.bind(v); }
    if let Some(ref v) = req.status          { q = q.bind(v); }
    if let Some(ref v) = req.priority        { q = q.bind(v); }
    if let Some(ref v) = kind_str            { q = q.bind(v); }
    if let Some(ref v) = req.module          { q = q.bind(v); }
    if let Some(ref v) = req.assignee        { q = q.bind(v); }
    if let Some(ref v) = req.assignee_type   { q = q.bind(v); }
    if let Some(ref v) = req.assignee_id     { q = q.bind(v); }
    if let Some(v) = req.sprint_number       { q = q.bind(v); }
    if let Some(v) = req.parent_ticket_id    { q = q.bind(v); }
    if let Some(ref v) = req.epic_ref        { q = q.bind(v); }
    if let Some(ref v) = req.backlog_refs    { q = q.bind(v.clone()); }
    if let Some(v) = req.estimated_days      { q = q.bind(v); }
    if let Some(v) = req.display_order       { q = q.bind(v); }
    if let Some(ref v) = req.custom_fields   { q = q.bind(v); }

    q.execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    // Return updated ticket
    get_ticket(State(state), Extension(auth), Path(id)).await
}

// ============================================================================
// DELETE /api/v1/tickets/:id — Delete ticket
// ============================================================================

pub async fn delete_ticket(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
) -> Result<Response, AppError> {
    // Verify ticket exists and check project access before mutating
    let project_id_row: Option<(i32,)> =
        sqlx::query_as(r#"SELECT "projectId" FROM tickets WHERE id = $1"#)
            .bind(id)
            .fetch_optional(&state.db)
            .await
            .map_err(AppError::Database)?;

    let ticket_project_id = project_id_row
        .ok_or_else(|| AppError::NotFound(format!("ticket {} not found", id)))?
        .0;
    require_project_access(&auth, ticket_project_id)?;

    // Delete comments first (cascade)
    sqlx::query(r#"DELETE FROM ticket_comments WHERE "ticketId" = $1"#)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    // Unlink children
    sqlx::query(r#"UPDATE tickets SET "parentTicketId" = NULL WHERE "parentTicketId" = $1"#)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    // Delete ticket
    let result = sqlx::query("DELETE FROM tickets WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("ticket {} not found", id)));
    }

    Ok(response::success(serde_json::json!({
        "deleted": true,
        "id": id,
    })))
}

// ============================================================================
// Internal helpers
// ============================================================================

/// Row type for sqlx query results from the tickets table.
#[derive(Debug, sqlx::FromRow)]
struct TicketRow {
    id: i32,
    ticket_number: i32,
    title: String,
    description: Option<String>,
    kind: String,
    source: String,
    status: String,
    priority: String,
    module: Option<String>,
    assignee: Option<String>,
    #[sqlx(rename = "assigneeType")]
    assignee_type: Option<String>,
    #[sqlx(rename = "sprintNumber")]
    sprint_number: Option<i32>,
    #[sqlx(rename = "parentTicketId")]
    parent_ticket_id: Option<i32>,
    #[sqlx(rename = "epicRef")]
    epic_ref: Option<String>,
    #[sqlx(rename = "backlogRefs")]
    backlog_refs: Option<Vec<String>>,
    #[sqlx(rename = "estimatedDays")]
    estimated_days: Option<i32>,
    #[sqlx(rename = "displayOrder")]
    display_order: i32,
    #[sqlx(rename = "customFields")]
    custom_fields: Option<serde_json::Value>,
    #[sqlx(rename = "closedAt")]
    closed_at: Option<String>,
    #[sqlx(rename = "createdAt")]
    created_at: String,
    #[sqlx(rename = "updatedAt")]
    updated_at: String,
}

impl TicketRow {
    fn into_response(self, project_id: i32) -> TicketResponse {
        TicketResponse {
            id: self.id,
            ticket_number: self.ticket_number,
            display_id: self.ticket_number.to_string(),
            project_id,
            title: self.title,
            description: self.description,
            kind: self.kind,
            source: self.source,
            status: self.status,
            priority: Some(self.priority),
            module: self.module,
            assignee: self.assignee,
            assignee_type: self.assignee_type,
            sprint_number: self.sprint_number,
            parent_ticket_id: self.parent_ticket_id,
            parent_ticket: None,
            children_count: 0,
            epic_ref: self.epic_ref,
            backlog_refs: self.backlog_refs.unwrap_or_default(),
            estimated_days: self.estimated_days,
            display_order: self.display_order,
            custom_fields: self.custom_fields,
            labels: Vec::new(),
            closed_at: self.closed_at,
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }
}

async fn get_project_id(db: &sqlx::PgPool, ticket_id: i32) -> Result<i32, AppError> {
    let row: (i32,) = sqlx::query_as(r#"SELECT "projectId" FROM tickets WHERE id = $1"#)
        .bind(ticket_id)
        .fetch_one(db)
        .await
        .map_err(|_| AppError::NotFound(format!("ticket {} not found", ticket_id)))?;
    Ok(row.0)
}

// ============================================================================
// POST /api/v1/tickets/bulk — Bulk create 1-50 tickets
// ============================================================================

pub async fn bulk_create_tickets(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<BulkCreateRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;

    if req.tickets.is_empty() || req.tickets.len() > 50 {
        return Err(AppError::Validation("tickets array must have 1-50 items".into()));
    }

    let mut created_tickets = Vec::new();
    let mut failed = 0;

    // Use an explicit transaction so the atomic MAX+1 subquery is serialized
    // across concurrent requests — prevents duplicate ticket_number assignment.
    let mut tx = state.db.begin().await.map_err(AppError::Database)?;

    for ticket_req in &req.tickets {
        let kind_str = serde_json::to_value(&ticket_req.kind)
            .ok()
            .and_then(|v| v.as_str().map(str::to_string))
            .unwrap_or_else(|| "task".into());
        let source_str = serde_json::to_value(&ticket_req.source)
            .ok()
            .and_then(|v| v.as_str().map(str::to_string))
            .unwrap_or_else(|| "agent".into());
        let status = ticket_req.status.as_deref().unwrap_or("backlog");
        let priority = ticket_req.priority.as_deref().unwrap_or("medium");
        let backlog_refs = ticket_req.backlog_refs.clone().unwrap_or_default();

        let result: Result<(i32, i32, String), _> = sqlx::query_as(
            r#"
            INSERT INTO tickets (
                title, description, kind, source, status, priority, module,
                "projectId", ticket_number, "displayOrder",
                "parentTicketId", "epicRef", "backlogRefs",
                "sprintNumber", "estimatedDays",
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8,
                (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM tickets WHERE "projectId" = $8),
                $9,
                $10, $11, $12,
                $13, $14,
                NOW(), NOW()
            )
            RETURNING id, ticket_number, "createdAt"::text
            "#,
        )
        .bind(&ticket_req.title)
        .bind(&ticket_req.description)
        .bind(&kind_str)
        .bind(&source_str)
        .bind(status)
        .bind(priority)
        .bind(&ticket_req.module)
        .bind(req.project_id)
        .bind(ticket_req.display_order.unwrap_or(0))
        .bind(ticket_req.parent_ticket_id)
        .bind(&ticket_req.epic_ref)
        .bind(&backlog_refs)
        .bind(ticket_req.sprint_number)
        .bind(ticket_req.estimated_days)
        .fetch_one(&mut *tx)
        .await;

        match result {
            Ok((id, ticket_number, _)) => {
                created_tickets.push(BulkTicketRef {
                    ticket_number,
                    id,
                    title: ticket_req.title.clone(),
                    kind: kind_str,
                });
            }
            Err(_) => failed += 1,
        }
    }

    tx.commit().await.map_err(AppError::Database)?;

    Ok(response::created(BulkCreateResponse {
        created: created_tickets.len(),
        failed,
        total: req.tickets.len(),
        tickets: created_tickets,
    }))
}

// ============================================================================
// GET /api/v1/tickets/by-number/:projectId/:ticketNumber — Lookup by display number
// ============================================================================

pub async fn get_by_number(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path((project_id, ticket_number)): Path<(i32, i32)>,
) -> Result<Response, AppError> {
    require_project_access(&auth, project_id)?;

    let row: Option<(i32,)> = sqlx::query_as(
        r#"SELECT id FROM tickets WHERE "projectId" = $1 AND ticket_number = $2"#,
    )
    .bind(project_id)
    .bind(ticket_number)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    match row {
        Some((id,)) => get_ticket(State(state), Extension(auth), Path(id)).await,
        None => Err(AppError::NotFound(format!(
            "ticket #{} not found in project {}",
            ticket_number, project_id
        ))),
    }
}

// ============================================================================
// GET /api/v1/tickets/:id/children — Paginated children
// ============================================================================

pub async fn get_children(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Query(params): Query<ChildrenParams>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let (rows, total): (Vec<TicketRow>, (i64,)) = tokio::try_join!(
        sqlx::query_as::<_, TicketRow>(
            r#"
            SELECT id, ticket_number, title, description, kind, source, status,
                   priority, module, assignee, "assigneeType",
                   "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
                   "estimatedDays", "displayOrder", "customFields",
                   "closedAt"::text, "createdAt"::text, "updatedAt"::text
            FROM tickets WHERE "parentTicketId" = $1
            ORDER BY "displayOrder" ASC, "createdAt" DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(id)
        .bind(page_size as i64)
        .bind(offset as i64)
        .fetch_all(&state.db),
        sqlx::query_as::<_, (i64,)>(
            r#"SELECT COUNT(*) FROM tickets WHERE "parentTicketId" = $1"#,
        )
        .bind(id)
        .fetch_one(&state.db),
    )
    .map_err(AppError::Database)?;

    let tickets: Vec<TicketResponse> = rows
        .into_iter()
        .map(|r| r.into_response(project_id))
        .collect();

    Ok(response::success(TicketListResponse {
        tickets,
        total: total.0,
        page,
        page_size,
        total_pages: ((total.0 as f64) / (page_size as f64)).ceil() as i32,
    }))
}

// ============================================================================
// GET /api/v1/tickets/:id/hierarchy — Full hierarchy context
// ============================================================================

pub async fn get_hierarchy(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    // Fetch the ticket itself
    let ticket_row: TicketRow = sqlx::query_as(
        r#"
        SELECT id, ticket_number, title, description, kind, source, status,
               priority, module, assignee, "assigneeType",
               "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
               "estimatedDays", "displayOrder", "customFields",
               "closedAt"::text, "createdAt"::text, "updatedAt"::text
        FROM tickets WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    let mut ticket = ticket_row.into_response(project_id);
    ticket.children_count = ticket_service::count_children(&state.db, id)
        .await
        .unwrap_or(0);

    // Fetch parent if exists
    let parent = if let Some(pid) = ticket.parent_ticket_id {
        let p: Option<TicketRow> = sqlx::query_as(
            r#"
            SELECT id, ticket_number, title, description, kind, source, status,
                   priority, module, assignee, "assigneeType",
                   "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
                   "estimatedDays", "displayOrder", "customFields",
                   "closedAt"::text, "createdAt"::text, "updatedAt"::text
            FROM tickets WHERE id = $1
            "#,
        )
        .bind(pid)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();
        p.map(|r| r.into_response(project_id))
    } else {
        None
    };

    // Fetch children
    let children_rows: Vec<TicketRow> = sqlx::query_as(
        r#"
        SELECT id, ticket_number, title, description, kind, source, status,
               priority, module, assignee, "assigneeType",
               "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
               "estimatedDays", "displayOrder", "customFields",
               "closedAt"::text, "createdAt"::text, "updatedAt"::text
        FROM tickets WHERE "parentTicketId" = $1
        ORDER BY "displayOrder" ASC
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let children: Vec<TicketResponse> = children_rows
        .into_iter()
        .map(|r| r.into_response(project_id))
        .collect();

    // Fetch siblings (same parent, excluding self)
    let siblings = if let Some(pid) = ticket.parent_ticket_id {
        let sib_rows: Vec<TicketRow> = sqlx::query_as(
            r#"
            SELECT id, ticket_number, title, description, kind, source, status,
                   priority, module, assignee, "assigneeType",
                   "sprintNumber", "parentTicketId", "epicRef", "backlogRefs",
                   "estimatedDays", "displayOrder", "customFields",
                   "closedAt"::text, "createdAt"::text, "updatedAt"::text
            FROM tickets WHERE "parentTicketId" = $1 AND id != $2
            ORDER BY "displayOrder" ASC
            "#,
        )
        .bind(pid)
        .bind(id)
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();
        sib_rows.into_iter().map(|r| r.into_response(project_id)).collect()
    } else {
        Vec::new()
    };

    Ok(response::success(HierarchyResponse {
        ticket,
        parent,
        children,
        siblings,
    }))
}

// ============================================================================
// POST /api/v1/tickets/:id/comments — Add comment
// ============================================================================

pub async fn add_comment(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<AddCommentRequest>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    if req.content.trim().is_empty() {
        return Err(AppError::Validation("comment content is required".into()));
    }

    let author = req.author.as_deref().unwrap_or("Anonymous");

    let row: (i32, String) = sqlx::query_as(
        r#"
        INSERT INTO ticket_comments (content, author, "ticketId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, "createdAt"::text
        "#,
    )
    .bind(&req.content)
    .bind(author)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(response::created(CommentResponse {
        id: row.0,
        content: req.content,
        author: author.to_string(),
        created_at: row.1,
    }))
}

// ============================================================================
// GET /api/v1/tickets/:id/comments — List comments
// ============================================================================

pub async fn list_comments(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    let rows: Vec<(i32, String, Option<String>, String)> = sqlx::query_as(
        r#"
        SELECT id, content, author, "createdAt"::text
        FROM ticket_comments
        WHERE "ticketId" = $1
        ORDER BY "createdAt" DESC
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    let comments: Vec<CommentResponse> = rows
        .into_iter()
        .map(|(cid, content, author, created_at)| CommentResponse {
            id: cid,
            content,
            author: author.unwrap_or_else(|| "Anonymous".to_string()),
            created_at,
        })
        .collect();

    Ok(response::success(comments))
}

// ============================================================================
// PATCH /api/v1/tickets/:id/labels — Update labels
// ============================================================================

pub async fn update_labels(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<i32>,
    Json(req): Json<UpdateLabelsRequest>,
) -> Result<Response, AppError> {
    let project_id = get_project_id(&state.db, id).await?;
    require_project_access(&auth, project_id)?;

    // Validate all label IDs exist in this project
    if !req.label_ids.is_empty() {
        let valid_count: (i64,) = sqlx::query_as(
            r#"SELECT COUNT(*) FROM "Label" WHERE id = ANY($1) AND "projectId" = $2"#,
        )
        .bind(&req.label_ids)
        .bind(project_id)
        .fetch_one(&state.db)
        .await
        .map_err(AppError::Database)?;

        if valid_count.0 != req.label_ids.len() as i64 {
            return Err(AppError::Validation(
                "one or more label IDs are invalid for this project".into(),
            ));
        }
    }

    // Clear existing labels
    sqlx::query(r#"DELETE FROM "_LabelToTicket" WHERE "B" = $1"#)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    // Insert new labels
    for label_id in &req.label_ids {
        sqlx::query(r#"INSERT INTO "_LabelToTicket" ("A", "B") VALUES ($1, $2)"#)
            .bind(label_id)
            .bind(id)
            .execute(&state.db)
            .await
            .map_err(AppError::Database)?;
    }

    // Return current labels
    let labels: Vec<(i32, String)> = sqlx::query_as(
        r#"
        SELECT l.id, l.name FROM "Label" l
        JOIN "_LabelToTicket" lt ON lt."A" = l.id
        WHERE lt."B" = $1
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    let label_responses: Vec<LabelResponse> = labels
        .into_iter()
        .map(|(lid, name)| LabelResponse { id: lid, name })
        .collect();

    Ok(response::success(label_responses))
}
