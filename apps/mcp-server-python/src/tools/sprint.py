"""
Sprint tools: query hierarchy, update progress + admin (phase create).

Core profile: queryHierarchy, updateProgress
Admin profile: phase_create
"""

from typing import Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.sprint")


# --- Core profile tools ---

async def projectpulse_sprint_queryHierarchy(
    level: Literal["phase", "sprint"],
    status: list[str] | None = None,
    projectId: int | None = None,
) -> str:
    """Query phase/sprint hierarchy with optional status filter.

    Args:
        level: Query level — "phase" or "sprint"
        status: Filter by status(es)
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"level": level, "projectId": str(pid)}
        if status:
            params["status"] = ",".join(status)
        data = await client.get("/hierarchy", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("queryHierarchy failed", error=str(e))
        return build_error(f"Failed to query hierarchy: {e}")


async def projectpulse_sprint_updateProgress(
    entityType: Literal["sprint", "phase"],
    entityId: str,
    progress: int,
) -> str:
    """Update progress for a sprint or phase. Auto-propagates to parent entities.

    Args:
        entityType: "sprint" or "phase"
        entityId: Entity ID (CUID)
        progress: Progress percentage (0-100)
    """
    try:
        client = get_client()
        endpoint = "sprints" if entityType == "sprint" else "phases"
        data = await client.put(f"/{endpoint}/{entityId}/progress", json={
            "progress": progress,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("updateProgress failed", error=str(e))
        return build_error(f"Failed to update progress: {e}")


# --- Admin profile tool ---

async def projectpulse_sprint_phase_create(
    title: str,
    startDate: str,
    description: str | None = None,
    durationWeeks: int = 4,
    goals: list[str] | None = None,
    projectId: int | None = None,
) -> str:
    """Create a new phase with auto-generated weeks.

    Args:
        title: Phase title
        startDate: Start date (ISO 8601)
        description: Phase description
        durationWeeks: Duration in weeks (1-52, default: 4)
        goals: Phase goals
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        body: dict = {
            "title": title, "startDate": startDate,
            "durationWeeks": durationWeeks, "projectId": pid,
        }
        if description:
            body["description"] = description
        if goals:
            body["goals"] = goals
        data = await client.post("/phases", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to create phase: {e}")
