"""
Profile Manager: controls which tool profiles are active.

Manages the lifecycle of tool registration/deregistration on the
FastMCP server. Tools are grouped into profiles (core, onboarding,
admin, utility, observability) and can be activated/deactivated
at runtime.
"""

from src.logger import get_logger
from src.profiles.registry import ToolDef

logger = get_logger("profiles.manager")

from typing import Any

# We use the FastMCP instance but reference it as Any to avoid circular imports
MCP = Any  # Actually ProfileAwareMCP


class ProfileManager:
    """Manages tool profiles: activates/deactivates sets of tools on the MCP server."""

    def __init__(
        self,
        mcp: MCP,
        registry: dict[str, list[ToolDef]],
        initial_profiles: list[str],
    ):
        self._mcp = mcp
        self._registry = registry
        self._active_profiles: set[str] = set()
        self._registered_tools: set[str] = set()  # Track which tool names are registered

        # Activate initial profiles
        for profile in initial_profiles:
            if profile == "all":
                self.activate(list(registry.keys()))
                break
            elif profile in registry:
                self.activate([profile])
            else:
                logger.warn("Unknown profile in TOOL_PROFILES", profile=profile)

    @property
    def active_profiles(self) -> set[str]:
        """Currently active profile names."""
        return self._active_profiles.copy()

    @property
    def active_tool_count(self) -> int:
        """Number of currently registered tools."""
        return len(self._registered_tools)

    @property
    def available_profiles(self) -> list[str]:
        """All available profile names."""
        return list(self._registry.keys())

    def activate(self, profiles: list[str]) -> list[str]:
        """Activate profiles and register their tools.

        Returns list of tool names that were newly added.
        """
        added: list[str] = []

        for profile_name in profiles:
            if profile_name not in self._registry:
                logger.warn("Unknown profile", profile=profile_name)
                continue

            self._active_profiles.add(profile_name)

            for tool_def in self._registry[profile_name]:
                if tool_def.name not in self._registered_tools:
                    self._mcp.add_tool(
                        tool_def.fn,
                        name=tool_def.name,
                        description=tool_def.description,
                    )
                    self._registered_tools.add(tool_def.name)
                    added.append(tool_def.name)
                    logger.debug("Registered tool", tool=tool_def.name, profile=profile_name)

        if added:
            logger.info(
                "Profiles activated",
                profiles=profiles,
                tools_added=len(added),
                total_tools=self.active_tool_count,
            )

        return added

    def deactivate(self, profiles: list[str]) -> list[str]:
        """Deactivate profiles and unregister their tools.

        Only removes tools that aren't also in another active profile.
        Returns list of tool names that were removed.
        """
        removed: list[str] = []

        # Collect tools that belong to profiles being deactivated
        tools_to_check: set[str] = set()
        for profile_name in profiles:
            if profile_name not in self._active_profiles:
                continue
            self._active_profiles.discard(profile_name)
            for tool_def in self._registry.get(profile_name, []):
                tools_to_check.add(tool_def.name)

        # Only remove tools not claimed by any remaining active profile
        tools_in_active = set()
        for active_profile in self._active_profiles:
            for tool_def in self._registry.get(active_profile, []):
                tools_in_active.add(tool_def.name)

        for tool_name in tools_to_check:
            if tool_name not in tools_in_active and tool_name in self._registered_tools:
                try:
                    self._mcp.remove_tool(tool_name)
                    self._registered_tools.discard(tool_name)
                    removed.append(tool_name)
                    logger.debug("Unregistered tool", tool=tool_name)
                except Exception as e:
                    logger.warn("Failed to remove tool", tool=tool_name, error=str(e))

        if removed:
            logger.info(
                "Profiles deactivated",
                profiles=profiles,
                tools_removed=len(removed),
                total_tools=self.active_tool_count,
            )

        return removed

    def get_profile_info(self) -> dict[str, dict]:
        """Get info about all profiles for the manage_profiles tool."""
        return {
            name: {
                "tool_count": len(tools),
                "tools": [t.name for t in tools],
                "active": name in self._active_profiles,
            }
            for name, tools in self._registry.items()
        }
