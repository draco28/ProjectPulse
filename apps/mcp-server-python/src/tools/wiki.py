"""
Wiki tools: search, get, create, update, analytics + generate (utility).

Core profile: search, get, create, update, analytics_summary
Utility profile: generate
"""

from typing import Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.wiki")

WIKI_CATEGORIES = Literal["getting-started", "guides", "reference", "troubleshooting"]


# --- Core profile tools ---

async def projectpulse_wiki_search(
    query: str,
    category: WIKI_CATEGORIES | None = None,
    limit: int = 10,
    offset: int = 0,
    projectId: int | None = None,
) -> str:
    """Search wiki pages by title and content.

    Args:
        query: Search text (1-200 chars)
        category: Filter by category
        limit: Max results (1-50, default: 10)
        offset: Skip first N results (default: 0)
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {
            "query": query, "limit": str(limit),
            "offset": str(offset), "projectId": str(pid),
        }
        if category:
            params["category"] = category
        data = await client.get("/wiki", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("wiki_search failed", error=str(e))
        return build_error(f"Failed to search wiki: {e}")


async def projectpulse_wiki_get(
    path: str,
    projectId: int | None = None,
) -> str:
    """Get full wiki page content by path.

    Args:
        path: Wiki page path (e.g., "getting-started/quick-start")
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get(f"/wiki/{path}", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("wiki_get failed", error=str(e))
        return build_error(f"Failed to get wiki page: {e}")


async def projectpulse_wiki_create(
    title: str,
    path: str,
    content: str,
    category: WIKI_CATEGORIES,
    excerpt: str | None = None,
    parentPath: str | None = None,
    projectId: int | None = None,
) -> str:
    """Create a new wiki page.

    Args:
        title: Page title (3-100 chars)
        path: URL path (3-100 chars, lowercase/hyphens)
        content: Page content in markdown (10-50000 chars)
        category: getting-started, guides, reference, or troubleshooting
        excerpt: Short summary (max 200 chars)
        parentPath: Parent page path for hierarchy
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        body: dict = {
            "title": title, "path": path, "content": content,
            "category": category, "projectId": pid,
        }
        if excerpt:
            body["excerpt"] = excerpt
        if parentPath:
            body["parentPath"] = parentPath
        data = await client.post("/wiki", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("wiki_create failed", error=str(e))
        return build_error(f"Failed to create wiki page: {e}")


async def projectpulse_wiki_update(
    path: str,
    title: str | None = None,
    content: str | None = None,
    category: WIKI_CATEGORIES | None = None,
    excerpt: str | None = None,
    parentPath: str | None = None,
    changelog: str | None = None,
    actorName: str | None = None,
    actorType: Literal["human", "agent", "system"] | None = None,
    projectId: int | None = None,
) -> str:
    """Update a wiki page. Only provided fields are changed.

    Args:
        path: Page path (identifies the page)
        title: New title
        content: New content (markdown)
        category: New category
        excerpt: New excerpt
        parentPath: New parent path
        changelog: Change description (max 500 chars)
        actorName: Who made the change
        actorType: human, agent, or system
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        body: dict = {"projectId": pid}
        for key, val in [("title", title), ("content", content), ("category", category),
                         ("excerpt", excerpt), ("parentPath", parentPath),
                         ("changelog", changelog), ("actorName", actorName),
                         ("actorType", actorType)]:
            if val is not None:
                body[key] = val
        data = await client.patch(f"/wiki/{path}", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("wiki_update failed", error=str(e))
        return build_error(f"Failed to update wiki page: {e}")


async def projectpulse_wiki_analytics_summary(
    projectId: int | None = None,
) -> str:
    """Get wiki analytics: top pages by views, trending tags, helpful ratio."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/wiki/analytics/summary", params={"projectId": str(pid)})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get wiki analytics: {e}")


# --- Utility profile tool ---

async def projectpulse_wiki_generate(
    sourcePath: str,
    targetCategory: WIKI_CATEGORIES = "reference",
    projectId: int | None = None,
) -> str:
    """Auto-generate wiki pages from JSDoc/docstring comments in source code."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/wiki/generate", json={
            "projectId": pid, "sourcePath": sourcePath,
            "targetCategory": targetCategory,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to generate wiki: {e}")
