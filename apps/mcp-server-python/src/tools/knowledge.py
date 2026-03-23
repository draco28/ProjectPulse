"""
Knowledge base tools: search, create, get, related + admin (export, import, archive, metrics).

Core profile: search, create, get, related
Admin profile: export, import, archive, metrics
"""

from typing import Any, Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.knowledge")


# --- Core profile tools ---

async def projectpulse_knowledge_search(
    projectId: int,
    query: str,
    mode: Literal["semantic", "fulltext", "hybrid"] = "hybrid",
    limit: int = 5,
    category: str | None = None,
) -> str:
    """Search knowledge base with semantic, fulltext, or hybrid search.

    Args:
        projectId: Project ID
        query: Search query (1-1000 chars)
        mode: Search mode — semantic (meaning-based), fulltext (keyword), hybrid (both)
        limit: Max results (1-50, default: 5)
        category: Filter by category
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {
            "projectId": str(pid), "query": query,
            "mode": mode, "limit": str(limit),
        }
        if category:
            params["category"] = category
        data = await client.get("/knowledge/search", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("knowledge_search failed", error=str(e))
        return build_error(f"Failed to search knowledge: {e}")


async def projectpulse_knowledge_create(
    projectId: int,
    title: str,
    content: str,
    category: str,
    tags: list[str] | None = None,
) -> str:
    """Create a knowledge item with auto-embedding for semantic search.

    Args:
        projectId: Project ID
        title: Item title (1-200 chars)
        content: Markdown content (10-50000 chars)
        category: Category name (1-50 chars)
        tags: Optional tags (max 20)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/knowledge", json={
            "projectId": pid, "title": title,
            "content": content, "category": category,
            "tags": tags or [],
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("knowledge_create failed", error=str(e))
        return build_error(f"Failed to create knowledge item: {e}")


async def projectpulse_knowledge_get(
    projectId: int,
    itemId: int,
) -> str:
    """Get full knowledge item content by ID.

    Args:
        projectId: Project ID
        itemId: Knowledge item ID (from search results)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get(f"/knowledge/{itemId}", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("knowledge_get failed", error=str(e))
        return build_error(f"Failed to get knowledge item: {e}")


async def projectpulse_knowledge_related(
    projectId: int,
    itemId: int,
    maxDepth: int = 2,
    limit: int = 10,
    minStrength: float = 0.5,
) -> str:
    """Find related knowledge items via graph traversal (1-2 hops).

    Args:
        projectId: Project ID
        itemId: Source item ID
        maxDepth: Traversal depth (1-2, default: 2)
        limit: Max results (1-50, default: 10)
        minStrength: Minimum relationship strength (0-1, default: 0.5)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/knowledge/related", params={
            "projectId": str(pid), "itemId": str(itemId),
            "maxDepth": str(maxDepth), "limit": str(limit),
            "minStrength": str(minStrength),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("knowledge_related failed", error=str(e))
        return build_error(f"Failed to find related items: {e}")


# --- Admin profile tools ---

async def projectpulse_knowledge_export(
    projectId: int,
    format: Literal["json", "markdown"] = "json",
) -> str:
    """Export all knowledge items in JSON or Markdown format."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/knowledge/export", params={
            "projectId": str(pid), "format": format,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to export knowledge: {e}")


async def projectpulse_knowledge_import(
    projectId: int,
    items: list[dict[str, Any]],
    overwrite: bool = False,
) -> str:
    """Bulk import knowledge items with optional overwrite."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/knowledge/import", json={
            "projectId": pid, "items": items, "overwrite": overwrite,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to import knowledge: {e}")


async def projectpulse_knowledge_archive(
    projectId: int,
    itemId: int,
    archive: bool = True,
) -> str:
    """Archive or unarchive a knowledge item (soft delete)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.patch(f"/knowledge/{itemId}/archive", json={
            "projectId": pid, "archive": archive,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to archive knowledge item: {e}")


async def projectpulse_knowledge_metrics(
    projectId: int,
) -> str:
    """Get knowledge base metrics: usage stats, popular queries, trending topics."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/knowledge/metrics", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get knowledge metrics: {e}")
