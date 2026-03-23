"""
ProfileAwareMCP: FastMCP subclass with per-token tool filtering.

Overrides list_tools() to apply per-token blocklist/allowlist filtering
on top of the profile-based tool registration (handled by ProfileManager
in Phase 2). This is the only per-request filtering layer.
"""

from mcp.server.fastmcp import FastMCP
from mcp.types import Tool as MCPTool

from src.auth.context import is_tool_allowed
from src.logger import get_logger

logger = get_logger("server")


class ProfileAwareMCP(FastMCP):
    """FastMCP with per-token tool filtering via auth context."""

    async def list_tools(self) -> list[MCPTool]:
        """List tools filtered by the current token's permissions.

        Profile filtering (which tools are registered) happens at the
        ToolManager level. This method adds per-token blocklist/allowlist
        filtering on top, reading from the auth context set by middleware.
        """
        tools = await super().list_tools()
        filtered = [t for t in tools if is_tool_allowed(t.name)]
        if len(filtered) != len(tools):
            logger.debug(
                "Tools filtered by token permissions",
                total=len(tools),
                visible=len(filtered),
            )
        return filtered
