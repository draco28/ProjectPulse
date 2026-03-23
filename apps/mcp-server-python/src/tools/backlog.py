"""
Backlog tools: list all items and get items by sprint.

Profile: core (both tools always loaded)

API endpoints:
- GET /api/backlog?projectId&epicRef — list all
- GET /api/backlog?projectId&sprintNumber — get by sprint
"""

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.backlog")


async def projectpulse_backlog_list(
    projectId: int,
    epicRef: str | None = None,
) -> str:
    """List all backlog items, optionally filtered by epic.

    Args:
        projectId: Project ID
        epicRef: Filter by epic reference (e.g., "EPIC-001")
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"projectId": str(pid)}
        if epicRef:
            params["epicRef"] = epicRef
        data = await client.get("/backlog", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("backlog_list failed", error=str(e))
        return build_error(f"Failed to list backlog: {e}")


async def projectpulse_backlog_getBySprint(
    projectId: int,
    sprintNumber: int,
) -> str:
    """Get backlog items for a specific sprint with traceability (epicRef, frTraces, nfrTraces).

    Args:
        projectId: Project ID
        sprintNumber: Sprint number to filter by
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/backlog", params={
            "projectId": str(pid),
            "sprintNumber": str(sprintNumber),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("backlog_getBySprint failed", error=str(e))
        return build_error(f"Failed to get backlog by sprint: {e}")
