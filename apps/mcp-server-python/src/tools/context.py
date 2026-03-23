"""
Context tools: load, lookup, and update project memory banks.

Profile: core (always loaded)
These are the entry-point tools for every agent session.

API endpoints:
- GET /api/context/load — load all banks + sessions + hints
- GET /api/memory/pattern-lookup — lookup single bank
- PUT /api/context/update — update bank content
"""

from typing import Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.context")

BANK_TYPES = Literal[
    "PROJECT_BRIEF", "SYSTEM_PATTERNS", "TECH_CONTEXT",
    "ACTIVE_CONTEXT", "PROGRESS",
]


async def projectpulse_context_load(
    projectId: int,
    banksToLoad: Literal["all", "active-only"] = "all",
) -> str:
    """Load full project context: all 5 memory banks, active sessions, and workflow hints.

    This is the entry-point tool — call this first at the start of every session.
    Returns memory banks (project brief, patterns, tech context, active focus, progress),
    active agent sessions, onboarding status, and available resources.

    Args:
        projectId: Project ID (e.g., 6 for ProjectPulse itself)
        banksToLoad: 'all' for full context, 'active-only' for just active context + progress
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/context/load", params={
            "projectId": str(pid),
            "banksToLoad": banksToLoad,
        })

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("context_load failed", error=str(e))
        return build_error(f"Failed to load context: {e}")


async def projectpulse_context_lookup(
    projectId: int,
    bankType: BANK_TYPES,
) -> str:
    """Look up a single memory bank by type. Token-efficient alternative to context_load.

    Use this when you need just one bank's content without loading the full context.

    Args:
        projectId: Project ID
        bankType: One of PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/memory/pattern-lookup", params={
            "projectId": str(pid),
            "bankType": bankType,
        })

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("context_lookup failed", error=str(e), bankType=bankType)
        return build_error(f"Failed to lookup {bankType}: {e}")


async def projectpulse_context_update(
    projectId: int,
    bankType: BANK_TYPES,
    content: str,
    mode: Literal["replace", "append"] = "replace",
) -> str:
    """Update a memory bank's content. Use sparingly — only when explicitly requested by user.

    Args:
        projectId: Project ID
        bankType: Which bank to update
        content: New content (markdown)
        mode: 'replace' overwrites, 'append' adds to existing content
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.put("/context/update", json={
            "projectId": pid,
            "bankType": bankType,
            "content": content,
            "mode": mode,
        })

        if "error" in data:
            return build_error(data.get("message", data["error"]))

        return build_success(data)

    except Exception as e:
        logger.error("context_update failed", error=str(e), bankType=bankType)
        return build_error(f"Failed to update {bankType}: {e}")
