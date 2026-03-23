"""
Roadmap tools: current position, phase progress + admin (create, materialize, delete).

Core profile: getCurrentPosition, getPhaseProgress
Admin profile: create, materialize, delete
"""

from typing import Any

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.roadmap")


# --- Core profile tools ---

async def projectpulse_sprint_getCurrentPosition(
    projectId: int,
) -> str:
    """Get current position in the project roadmap hierarchy.

    Returns the active phase, sprint, week, and day with progress info
    and a link to the Kanban board.

    Args:
        projectId: Project ID
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/roadmap/overview", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("getCurrentPosition failed", error=str(e))
        return build_error(f"Failed to get current position: {e}")


async def projectpulse_roadmap_getPhaseProgress(
    phaseId: str,
    projectId: int,
) -> str:
    """Get full phase progress tree with nested sprints, weeks, and days.

    90% token reduction vs sequential queries — use this instead of
    querying sprints individually.

    Args:
        phaseId: Phase ID (UUID)
        projectId: Project ID
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get(f"/phases/{phaseId}", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("getPhaseProgress failed", error=str(e))
        return build_error(f"Failed to get phase progress: {e}")


# --- Admin profile tools ---

async def projectpulse_roadmap_create(
    projectId: int,
    title: str,
    startDate: str,
    phases: list[dict[str, Any]],
    description: str | None = None,
    materialize: bool = True,
) -> str:
    """Create a complete roadmap with phases and sprints, auto-materialize to records.

    Args:
        projectId: Project ID
        title: Roadmap title
        startDate: Start date (ISO 8601)
        phases: List of phases, each with title, sprints[], optional description/duration
        description: Roadmap description
        materialize: Auto-create Phase/Sprint DB records (default: true)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        body: dict = {
            "projectId": pid, "title": title,
            "startDate": startDate, "phases": phases,
            "materialize": materialize,
        }
        if description:
            body["description"] = description
        data = await client.post("/roadmap", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to create roadmap: {e}")


async def projectpulse_roadmap_materialize(
    roadmapId: str,
    projectId: int,
) -> str:
    """Materialize roadmap JSON to Phase/Sprint database records."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post(f"/roadmap/{roadmapId}/materialize", json={"projectId": pid})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to materialize roadmap: {e}")


async def projectpulse_roadmap_delete(
    roadmapId: str,
    projectId: int,
) -> str:
    """Delete roadmap and cascade-delete all materialized phases/sprints/weeks/days."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.delete(f"/roadmap/{roadmapId}")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to delete roadmap: {e}")
