"""
Ticket tools: full CRUD, search, hierarchy, status, and comments.

Profile: core (always loaded)
All tools support dual-ID: ticketId (global) or ticketNumber+projectId (user-facing).

API endpoints:
- POST /api/tickets — create
- POST /api/tickets/bulk — bulk create
- GET /api/tickets — search with filters
- GET /api/tickets/{id} — get by ID
- GET /api/tickets/by-number/{pid}/{num} — get by number
- PATCH /api/tickets/{id} — update
- PATCH /api/tickets/{id}/status — set status
- POST /api/tickets/{id}/comments — add comment
- GET /api/tickets/{id}/children — get children
- GET /api/tickets/{id}/hierarchy — get hierarchy
"""

from typing import Any, Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id, resolve_ticket_id
from src.logger import get_logger

logger = get_logger("tools.tickets")


def _build_optional_body(**kwargs: Any) -> dict:
    """Build request body with only non-None fields."""
    return {k: v for k, v in kwargs.items() if v is not None}


def _build_search_params(**kwargs: Any) -> dict[str, str]:
    """Build query params from non-None fields, joining lists with commas."""
    params: dict[str, str] = {}
    for k, v in kwargs.items():
        if v is None:
            continue
        if isinstance(v, list):
            if v:
                params[k] = ",".join(str(i) for i in v)
        elif isinstance(v, bool):
            params[k] = str(v).lower()
        else:
            params[k] = str(v)
    return params


# --- ticket_create ---

async def projectpulse_ticket_create(
    title: str,
    kind: Literal["feature", "task", "epic", "issue", "bug", "scanner_finding", "tech_debt"],
    source: Literal["manual", "scanner", "agent", "onboarding"] = "agent",
    description: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    module: str | None = None,
    assignee: str | None = None,
    assigneeType: str | None = None,
    assigneeId: str | None = None,
    projectId: int | None = None,
    labelIds: list[int] | None = None,
    customFields: dict | None = None,
    context: dict | None = None,
    parentTicketId: int | None = None,
    epicRef: str | None = None,
    backlogRefs: list[str] | None = None,
    sprintNumber: int | None = None,
    estimatedDays: int | None = None,
    displayOrder: int | None = None,
) -> str:
    """Create a new ticket with full metadata.

    Args:
        title: Ticket title (1-200 chars)
        kind: Type — feature, task, epic, issue, bug, scanner_finding, tech_debt
        source: Who created it — manual, scanner, agent, onboarding
        description: Detailed description (markdown, max 50000 chars)
        status: Initial status (default: backlog)
        priority: low, medium, high, critical
        module: Module/component name
        assignee: Assignee name
        assigneeType: human or agent
        assigneeId: Assignee user/agent ID
        projectId: Project ID (auto-fills from auth)
        labelIds: Label IDs to attach (max 25)
        customFields: Custom field key-value pairs
        context: Context object {files?, metadata?}
        parentTicketId: Parent ticket for hierarchy
        epicRef: Epic reference (e.g., EPIC-001)
        backlogRefs: Backlog references (e.g., FR-001, NFR-002)
        sprintNumber: Sprint to assign to (1-999)
        estimatedDays: Estimated duration (1-365)
        displayOrder: Position in kanban column (0-10000)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()

        body = _build_optional_body(
            title=title, kind=kind, source=source, description=description,
            status=status, priority=priority, module=module,
            assignee=assignee, assigneeType=assigneeType, assigneeId=assigneeId,
            projectId=pid, labelIds=labelIds, customFields=customFields,
            context=context, parentTicketId=parentTicketId, epicRef=epicRef,
            backlogRefs=backlogRefs, sprintNumber=sprintNumber,
            estimatedDays=estimatedDays, displayOrder=displayOrder,
        )

        data = await client.post("/tickets", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_create failed", error=str(e))
        return build_error(f"Failed to create ticket: {e}")


# --- ticket_bulkCreate ---

async def projectpulse_ticket_bulkCreate(
    tickets: list[dict],
    projectId: int | None = None,
) -> str:
    """Create multiple tickets atomically (1-50 tickets per call).

    Args:
        tickets: List of ticket objects (same fields as ticket_create)
        projectId: Project ID (auto-fills from auth, applied to all tickets)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/tickets/bulk", json={
            "projectId": pid,
            "tickets": tickets,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_bulkCreate failed", error=str(e))
        return build_error(f"Failed to bulk create tickets: {e}")


# --- ticket_search ---

async def projectpulse_ticket_search(
    kind: list[str] | None = None,
    source: list[str] | None = None,
    status: list[str] | None = None,
    priority: list[str] | None = None,
    module: list[str] | None = None,
    assignee: list[str] | None = None,
    tags: list[str] | None = None,
    search: str | None = None,
    createdFrom: str | None = None,
    createdTo: str | None = None,
    parentTicketId: int | None = None,
    hasChildren: bool | None = None,
    isTopLevel: bool | None = None,
    epicRef: str | None = None,
    sprintNumber: int | None = None,
    milestoneId: int | None = None,
    dueDateFrom: str | None = None,
    dueDateTo: str | None = None,
    overdue: bool | None = None,
    labelIds: list[int] | None = None,
    includeRelations: bool | None = None,
    sortBy: Literal["createdAt", "updatedAt", "priority", "sprintNumber", "kind", "dueDate"] | None = None,
    sortDirection: Literal["asc", "desc"] | None = None,
    page: int = 1,
    pageSize: int = 20,
    projectId: int | None = None,
) -> str:
    """Search tickets with advanced filters and pagination.

    Args:
        kind: Filter by type(s) — feature, task, bug, etc.
        source: Filter by source(s)
        status: Filter by status(es) — backlog, todo, in-progress, in-review, done
        priority: Filter by priority(ies) — low, medium, high, critical
        module: Filter by module(s)
        assignee: Filter by assignee(s)
        tags: Filter by tag(s)
        search: Free-text search (max 200 chars)
        createdFrom/createdTo: Date range filter (ISO datetime)
        parentTicketId: Filter children of a specific ticket
        hasChildren: Filter tickets with/without children
        isTopLevel: Filter top-level tickets only
        epicRef: Filter by epic reference
        sprintNumber: Filter by sprint number
        milestoneId: Filter by milestone
        dueDateFrom/dueDateTo: Due date range
        overdue: Filter overdue tickets
        labelIds: Filter by label IDs
        includeRelations: Include parent/child relations in response
        sortBy: Sort field
        sortDirection: Sort direction (asc/desc)
        page: Page number (default: 1)
        pageSize: Results per page (1-100, default: 20)
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()

        params = _build_search_params(
            projectId=pid, kind=kind, source=source, status=status,
            priority=priority, module=module, assignee=assignee, tags=tags,
            search=search, createdFrom=createdFrom, createdTo=createdTo,
            parentTicketId=parentTicketId, hasChildren=hasChildren,
            isTopLevel=isTopLevel, epicRef=epicRef, sprintNumber=sprintNumber,
            milestoneId=milestoneId, dueDateFrom=dueDateFrom, dueDateTo=dueDateTo,
            overdue=overdue, labelIds=labelIds, includeRelations=includeRelations,
            sortBy=sortBy, sortDirection=sortDirection,
            page=page, pageSize=pageSize,
        )

        data = await client.get("/tickets", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_search failed", error=str(e))
        return build_error(f"Failed to search tickets: {e}")


# --- ticket_get ---

async def projectpulse_ticket_get(
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
) -> str:
    """Get full ticket details by ID or ticket number.

    Use ticketNumber (e.g., #5) when referencing user-visible ticket numbers.
    Use ticketId when chaining from API responses.

    Args:
        ticketId: Global ticket ID (from API responses)
        ticketNumber: Project-scoped number (from user, e.g., #5)
        projectId: Required with ticketNumber (auto-fills from auth)
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()
        data = await client.get(f"/tickets/{tid}")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_get failed", error=str(e))
        return build_error(f"Failed to get ticket: {e}")


# --- ticket_update ---

async def projectpulse_ticket_update(
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
    title: str | None = None,
    description: str | None = None,
    kind: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    module: str | None = None,
    assignee: str | None = None,
    assigneeType: str | None = None,
    assigneeId: str | None = None,
    labelIds: list[int] | None = None,
    customFields: dict | None = None,
    parentTicketId: int | None = None,
    epicRef: str | None = None,
    backlogRefs: list[str] | None = None,
    sprintNumber: int | None = None,
    estimatedDays: int | None = None,
    displayOrder: int | None = None,
    dueDate: str | None = None,
    milestoneId: int | None = None,
) -> str:
    """Update ticket fields. Only provided fields are changed.

    Args:
        ticketId: Global ticket ID
        ticketNumber: Project-scoped number (e.g., #5)
        projectId: Required with ticketNumber
        (all other fields): Same as ticket_create, all optional
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()

        body = _build_optional_body(
            title=title, description=description, kind=kind, status=status,
            priority=priority, module=module, assignee=assignee,
            assigneeType=assigneeType, assigneeId=assigneeId,
            labelIds=labelIds, customFields=customFields,
            parentTicketId=parentTicketId, epicRef=epicRef,
            backlogRefs=backlogRefs, sprintNumber=sprintNumber,
            estimatedDays=estimatedDays, displayOrder=displayOrder,
            dueDate=dueDate, milestoneId=milestoneId,
        )

        data = await client.patch(f"/tickets/{tid}", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_update failed", error=str(e))
        return build_error(f"Failed to update ticket: {e}")


# --- ticket_setStatus ---

async def projectpulse_ticket_setStatus(
    status: str,
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
) -> str:
    """Change a ticket's workflow status.

    Valid statuses: backlog, todo, in-progress, in-review, done

    Args:
        status: New status
        ticketId: Global ticket ID
        ticketNumber: Project-scoped number
        projectId: Required with ticketNumber
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()
        data = await client.patch(f"/tickets/{tid}/status", json={"status": status})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_setStatus failed", error=str(e))
        return build_error(f"Failed to set status: {e}")


# --- ticket_addComment ---

async def projectpulse_ticket_addComment(
    content: str,
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
    author: str | None = None,
) -> str:
    """Add a comment or progress note to a ticket.

    Args:
        content: Comment text (1-10000 chars)
        ticketId: Global ticket ID
        ticketNumber: Project-scoped number
        projectId: Required with ticketNumber
        author: Author name (default: agent)
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()
        body: dict = {"content": content}
        if author:
            body["author"] = author
        data = await client.post(f"/tickets/{tid}/comments", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_addComment failed", error=str(e))
        return build_error(f"Failed to add comment: {e}")


# --- ticket_getChildren ---

async def projectpulse_ticket_getChildren(
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
    status: str | None = None,
    page: int = 1,
    pageSize: int = 20,
) -> str:
    """Get paginated children of a feature/epic ticket.

    Args:
        ticketId: Global ticket ID
        ticketNumber: Project-scoped number
        projectId: Required with ticketNumber
        status: Filter children by status
        page: Page number (default: 1)
        pageSize: Results per page (1-100, default: 20)
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()
        params = _build_search_params(status=status, page=page, pageSize=pageSize)
        data = await client.get(f"/tickets/{tid}/children", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_getChildren failed", error=str(e))
        return build_error(f"Failed to get children: {e}")


# --- ticket_getHierarchy ---

async def projectpulse_ticket_getHierarchy(
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
) -> str:
    """Get complete hierarchy context: parent, children, siblings, and status counts.

    Args:
        ticketId: Global ticket ID
        ticketNumber: Project-scoped number
        projectId: Required with ticketNumber
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()
        data = await client.get(f"/tickets/{tid}/hierarchy")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("ticket_getHierarchy failed", error=str(e))
        return build_error(f"Failed to get hierarchy: {e}")
