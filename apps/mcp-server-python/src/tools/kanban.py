"""
Kanban tools: board view and ticket movement between columns.

Profile: core (always loaded)

API endpoints:
- GET /api/sprints/{sprintId}/kanban — get board with columns
- PATCH /api/tickets/{id}/move — move ticket between columns
"""

from typing import Literal

from src.tools._base import get_client, build_success, build_error, resolve_ticket_id
from src.logger import get_logger

logger = get_logger("tools.kanban")


async def projectpulse_kanban_getBoard(
    sprintId: str,
) -> str:
    """Get complete kanban board for a sprint with tickets grouped by column.

    Returns the 5-column board (backlog, todo, in-progress, in-review, done)
    with tickets, ghost cards, and statistics.

    Get sprintId from sprint_getCurrentPosition or roadmap_getPhaseProgress.

    Args:
        sprintId: Sprint ID (CUID string)
    """
    try:
        client = get_client()
        data = await client.get(f"/sprints/{sprintId}/kanban")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("kanban_getBoard failed", error=str(e), sprintId=sprintId)
        return build_error(f"Failed to get kanban board: {e}")


async def projectpulse_kanban_moveTicket(
    status: Literal["backlog", "todo", "in-progress", "in-review", "done"],
    displayOrder: int,
    ticketId: int | None = None,
    ticketNumber: int | None = None,
    projectId: int | None = None,
) -> str:
    """Move a ticket between kanban columns with automatic progress cascade.

    When a ticket moves, progress auto-propagates up the hierarchy:
    ticket → sprint → phase. Moving to 'done' increases parent progress.

    Args:
        status: Target column — backlog, todo, in-progress, in-review, done
        displayOrder: Position within the column (0-10000)
        ticketId: Global ticket ID
        ticketNumber: Project-scoped number (e.g., #5)
        projectId: Required with ticketNumber (auto-fills from auth)
    """
    try:
        tid = await resolve_ticket_id(ticketId, ticketNumber, projectId)
        client = get_client()
        data = await client.patch(f"/tickets/{tid}/move", json={
            "status": status,
            "displayOrder": displayOrder,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)

    except Exception as e:
        logger.error("kanban_moveTicket failed", error=str(e))
        return build_error(f"Failed to move ticket: {e}")
