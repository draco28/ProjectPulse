"""
Resource tools: personas, skills, and SOPs — list and get.

Profile: core (all 6 tools always loaded)

Personas: GET /api/personas, GET /api/personas/{id}, GET /api/personas/by-slug/{slug}
Skills: GET /api/skills, GET /api/skills/{slug}
SOPs: GET /api/sops, GET /api/sops/{id}, GET /api/sops/by-slug/{slug}
"""

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.resources")


# --- Persona tools ---

async def projectpulse_persona_list(
    projectId: int,
    isActive: bool | None = None,
) -> str:
    """List available agent personas (metadata only).

    Args:
        projectId: Project ID
        isActive: Filter by active status
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"projectId": str(pid)}
        if isActive is not None:
            params["isActive"] = str(isActive).lower()
        data = await client.get("/personas", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to list personas: {e}")


async def projectpulse_persona_get(
    projectId: int,
    id: int | None = None,
    slug: str | None = None,
) -> str:
    """Get full persona details including systemPrompt, skills, tools, and rules.

    Args:
        projectId: Project ID
        id: Persona ID (use this or slug)
        slug: Persona slug (use this or id)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        if slug:
            data = await client.get(f"/personas/by-slug/{slug}", params={"projectId": str(pid)})
        elif id:
            data = await client.get(f"/personas/{id}", params={"projectId": str(pid)})
        else:
            return build_error("Either id or slug is required")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get persona: {e}")


# --- Skill tools ---

async def projectpulse_skill_list(
    projectId: int,
    category: str | None = None,
    tags: str | None = None,
    frameworks: str | None = None,
    limit: int = 20,
) -> str:
    """List skills (metadata only, token-efficient).

    Args:
        projectId: Project ID
        category: Filter by category
        tags: Filter by tags (comma-separated)
        frameworks: Filter by frameworks (comma-separated)
        limit: Max results (1-50, default: 20)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"projectId": str(pid), "limit": str(limit)}
        if category:
            params["category"] = category
        if tags:
            params["tags"] = tags
        if frameworks:
            params["frameworks"] = frameworks
        data = await client.get("/skills", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to list skills: {e}")


async def projectpulse_skill_get(
    projectId: int,
    slug: str,
) -> str:
    """Get full skill content with code patterns, procedures, and examples.

    Args:
        projectId: Project ID
        slug: Skill slug (e.g., "api-patterns", "testing-patterns")
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get(f"/skills/{slug}", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get skill: {e}")


# --- SOP tools ---

async def projectpulse_sop_list(
    projectId: int,
    category: str | None = None,
) -> str:
    """List SOPs (metadata only).

    Args:
        projectId: Project ID
        category: Filter by category
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"projectId": str(pid)}
        if category:
            params["category"] = category
        data = await client.get("/sops", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to list SOPs: {e}")


async def projectpulse_sop_get(
    projectId: int,
    id: int | None = None,
    slug: str | None = None,
) -> str:
    """Get full SOP content with step-by-step procedures and checklists.

    Args:
        projectId: Project ID
        id: SOP ID (use this or slug)
        slug: SOP slug (use this or id)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        if slug:
            data = await client.get(f"/sops/by-slug/{slug}", params={"projectId": str(pid)})
        elif id:
            data = await client.get(f"/sops/{id}", params={"projectId": str(pid)})
        else:
            return build_error("Either id or slug is required")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get SOP: {e}")
