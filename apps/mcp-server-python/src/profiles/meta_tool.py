"""
manage_profiles meta-tool: dynamically load/unload tool profiles at runtime.

This tool is always registered in the 'core' profile and cannot be unloaded.
It allows the LLM to expand its available toolset on demand — e.g., loading
onboarding tools when context_load detects a project needs onboarding.

Profile: core (always loaded)
"""

from typing import Literal

from mcp.server.fastmcp.server import Context

from src.logger import get_logger

logger = get_logger("profiles.meta_tool")


async def projectpulse_manage_profiles(
    action: Literal["load", "unload", "list", "status"],
    profiles: list[str] | None = None,
    ctx: Context | None = None,
) -> dict:
    """Manage tool profiles to control which tools are available.

    Actions:
    - status: Returns active profiles, available profiles, and tool count
    - list: Returns all profiles with their tools and active state
    - load: Activates the specified profiles (adds their tools)
    - unload: Deactivates the specified profiles (removes their tools)

    After load/unload, the server sends a tools/list_changed notification
    so the client refreshes its tool list automatically.

    Args:
        action: The action to perform
        profiles: Profile names for load/unload (required for those actions)
        ctx: MCP context (auto-injected by FastMCP)
    """
    # Access the ProfileManager via the FastMCP instance
    mcp = ctx.fastmcp if ctx else None
    manager = getattr(mcp, "profile_manager", None) if mcp else None

    if manager is None:
        return {"error": "Profile manager not initialized"}

    if action == "status":
        return {
            "active_profiles": sorted(manager.active_profiles),
            "available_profiles": manager.available_profiles,
            "tool_count": manager.active_tool_count,
        }

    elif action == "list":
        return {
            "profiles": manager.get_profile_info(),
        }

    elif action == "load":
        if not profiles:
            return {"error": "profiles parameter is required for 'load' action"}

        added = manager.activate(profiles)

        # Notify client that tool list changed
        if added and ctx:
            try:
                await ctx.session.send_tool_list_changed()
            except Exception as e:
                logger.warn("Failed to send tool list changed notification", error=str(e))

        return {
            "loaded_profiles": profiles,
            "tools_added": added,
            "total_tools": manager.active_tool_count,
            "active_profiles": sorted(manager.active_profiles),
        }

    elif action == "unload":
        if not profiles:
            return {"error": "profiles parameter is required for 'unload' action"}

        # Prevent unloading core (would remove manage_profiles itself)
        if "core" in profiles:
            return {"error": "Cannot unload 'core' profile (contains manage_profiles tool)"}

        removed = manager.deactivate(profiles)

        # Notify client that tool list changed
        if removed and ctx:
            try:
                await ctx.session.send_tool_list_changed()
            except Exception as e:
                logger.warn("Failed to send tool list changed notification", error=str(e))

        return {
            "unloaded_profiles": profiles,
            "tools_removed": removed,
            "total_tools": manager.active_tool_count,
            "active_profiles": sorted(manager.active_profiles),
        }

    return {"error": f"Unknown action: {action}"}
