"""
Agent session tools: start, update, end, and resume work sessions.

Profile: core (always loaded)
Sessions track agent work periods that survive context compaction.

API endpoints:
- POST /api/agent-sessions — start new session
- PATCH /api/agent-sessions/{id} — update session
- POST /api/agent-sessions/{id}/end — end session
- POST /api/agent-sessions/{id}/resume — resume paused session
"""

from typing import Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.sessions")


async def _resolve_ticket_numbers(
    project_id: int,
    ticket_numbers: list[int],
    existing_ids: list[int] | None = None,
) -> list[int]:
    """Resolve project-scoped ticket numbers to global ticket IDs.

    Sprint 17: Users see #5 in the UI (ticketNumber), but the API needs
    the global ticketId. This resolves them via /api/tickets/by-number.
    """
    client = get_client()
    resolved_ids = set(existing_ids or [])

    for num in ticket_numbers:
        try:
            result = await client.get(f"/tickets/by-number/{project_id}/{num}")
            resolved_ids.add(result["id"])
        except Exception as e:
            logger.warn("Failed to resolve ticket number", ticketNumber=num, error=str(e))

    return list(resolved_ids)


async def projectpulse_agent_session_start(
    projectId: int | None = None,
    name: str | None = None,
    plan: str | None = None,
    todos: list[dict] | None = None,
    activeTicketIds: list[int] | None = None,
    activeTicketNumbers: list[int] | None = None,
) -> str:
    """Start a new agent work session with optional plan, todos, and ticket claiming.

    When activeTicketIds or activeTicketNumbers are provided, the system automatically:
    - Validates all tickets are in 'todo' status
    - Moves them to 'in-progress'
    - Sets assignee to 'Claude Code'
    - Links the session ID

    Args:
        projectId: Project ID (auto-fills from auth context)
        name: Session name (e.g., "Implementing feature X")
        plan: Implementation plan (markdown)
        todos: List of todo items [{content, status, ticketId?}]
        activeTicketIds: Global ticket IDs to claim
        activeTicketNumbers: Project-scoped ticket numbers to claim (e.g., [5, 7] for #5, #7)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()

        # Resolve ticket numbers to IDs (Sprint 17)
        resolved_ticket_ids = activeTicketIds
        if activeTicketNumbers:
            resolved_ticket_ids = await _resolve_ticket_numbers(
                pid, activeTicketNumbers, activeTicketIds,
            )

        # Build request body (only include non-None fields)
        body: dict = {"projectId": pid}
        if name is not None:
            body["name"] = name
        if plan is not None:
            body["plan"] = plan
        if todos is not None:
            body["todos"] = todos
        if resolved_ticket_ids:
            body["activeTicketIds"] = resolved_ticket_ids

        data = await client.post("/agent-sessions", json=body)

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("session_start failed", error=str(e))
        return build_error(f"Failed to start session: {e}")


async def projectpulse_agent_session_update(
    sessionId: str,
    name: str | None = None,
    plan: str | None = None,
    todos: list[dict] | None = None,
    progress: str | None = None,
    appendProgress: bool = False,
    activeTicketIds: list[int] | None = None,
    status: Literal["IN_PROGRESS", "PAUSED"] | None = None,
    tokenCount: int | None = None,
) -> str:
    """Update an active session's progress, todos, plan, or status.

    Call this at regular checkpoints (every 15K tokens) and when pausing for breaks.

    Args:
        sessionId: Session ID from session_start response
        name: Update session name
        plan: Update implementation plan
        todos: Replace todo list [{content, status, ticketId?}]
        progress: Progress note for this checkpoint
        appendProgress: If True, append to existing progress instead of replacing
        activeTicketIds: Update claimed ticket IDs
        status: Set to 'PAUSED' for breaks, 'IN_PROGRESS' to resume work
        tokenCount: Current token usage for tracking
    """
    try:
        client = get_client()

        # Build body with only provided fields
        body: dict = {}
        if name is not None:
            body["name"] = name
        if plan is not None:
            body["plan"] = plan
        if todos is not None:
            body["todos"] = todos
        if progress is not None:
            body["progress"] = progress
        if appendProgress:
            body["appendProgress"] = True
        if activeTicketIds is not None:
            body["activeTicketIds"] = activeTicketIds
        if status is not None:
            body["status"] = status
        if tokenCount is not None:
            body["tokenCount"] = tokenCount

        data = await client.patch(f"/agent-sessions/{sessionId}", json=body)

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("session_update failed", error=str(e), sessionId=sessionId)
        return build_error(f"Failed to update session: {e}")


async def projectpulse_agent_session_end(
    sessionId: str,
    progress: str | None = None,
    tokenCount: int | None = None,
) -> str:
    """End a work session. Auto-syncs memory banks and moves tickets to 'in-review'.

    IMPORTANT: Completed sessions CANNOT be resumed. Use session_update with
    status='PAUSED' for breaks instead.

    When the session ends:
    - PROGRESS bank: session summary added automatically
    - ACTIVE_CONTEXT bank: updated with pending todos
    - Linked in-progress tickets → moved to 'in-review'

    Args:
        sessionId: Session ID to complete
        progress: Final progress notes
        tokenCount: Final token usage
    """
    try:
        client = get_client()

        body: dict = {}
        if progress is not None:
            body["progress"] = progress
        if tokenCount is not None:
            body["tokenCount"] = tokenCount

        data = await client.post(f"/agent-sessions/{sessionId}/end", json=body)

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("session_end failed", error=str(e), sessionId=sessionId)
        return build_error(f"Failed to end session: {e}")


async def projectpulse_agent_session_resume(
    sessionId: str,
) -> str:
    """Resume a paused session with full context recovery.

    Returns the complete session state: plan, todos, progress, and active tickets.
    Only PAUSED sessions can be resumed — COMPLETED sessions cannot.

    Args:
        sessionId: Session ID to resume (must be in PAUSED status)
    """
    try:
        client = get_client()
        data = await client.post(f"/agent-sessions/{sessionId}/resume", json={})

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("session_resume failed", error=str(e), sessionId=sessionId)
        return build_error(f"Failed to resume session: {e}")
