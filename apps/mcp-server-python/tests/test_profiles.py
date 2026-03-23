"""Tests for the tool profile system."""

import pytest
from unittest.mock import MagicMock, AsyncMock

from src.profiles.registry import build_registry, ToolDef
from src.profiles.manager import ProfileManager
from src.auth.context import AgentAuth, set_agent_auth, reset_agent_auth, is_tool_allowed


class TestRegistry:
    """Test the tool registry."""

    def test_registry_has_five_profiles(self):
        registry = build_registry()
        assert set(registry.keys()) == {"core", "onboarding", "admin", "utility", "observability"}

    def test_core_has_48_tools(self):
        registry = build_registry()
        assert len(registry["core"]) == 48

    def test_onboarding_has_13_tools(self):
        registry = build_registry()
        assert len(registry["onboarding"]) == 13

    def test_admin_has_12_tools(self):
        registry = build_registry()
        assert len(registry["admin"]) == 12

    def test_utility_has_4_tools(self):
        registry = build_registry()
        assert len(registry["utility"]) == 4

    def test_observability_has_2_tools(self):
        registry = build_registry()
        assert len(registry["observability"]) == 2

    def test_total_is_79(self):
        registry = build_registry()
        total = sum(len(tools) for tools in registry.values())
        assert total == 79

    def test_all_tool_names_are_prefixed(self):
        registry = build_registry()
        for profile, tools in registry.items():
            for tool in tools:
                assert tool.name.startswith("projectpulse_"), (
                    f"Tool {tool.name} in {profile} missing prefix"
                )

    def test_no_duplicate_tool_names(self):
        registry = build_registry()
        all_names = []
        for tools in registry.values():
            all_names.extend(t.name for t in tools)
        assert len(all_names) == len(set(all_names)), "Duplicate tool names found"


class TestProfileManager:
    """Test profile activation/deactivation."""

    def _make_mcp_mock(self):
        """Create a mock MCP with add_tool/remove_tool."""
        mcp = MagicMock()
        mcp.add_tool = MagicMock()
        mcp.remove_tool = MagicMock()
        return mcp

    def test_initial_core_profile(self):
        mcp = self._make_mcp_mock()
        registry = build_registry()
        manager = ProfileManager(mcp, registry, ["core"])

        assert "core" in manager.active_profiles
        assert manager.active_tool_count == 48
        assert mcp.add_tool.call_count == 48

    def test_activate_onboarding(self):
        mcp = self._make_mcp_mock()
        registry = build_registry()
        manager = ProfileManager(mcp, registry, ["core"])

        added = manager.activate(["onboarding"])
        assert len(added) == 13
        assert "onboarding" in manager.active_profiles
        assert manager.active_tool_count == 61

    def test_deactivate_onboarding(self):
        mcp = self._make_mcp_mock()
        registry = build_registry()
        manager = ProfileManager(mcp, registry, ["core", "onboarding"])

        removed = manager.deactivate(["onboarding"])
        assert len(removed) == 13
        assert "onboarding" not in manager.active_profiles
        assert manager.active_tool_count == 48

    def test_activate_all_profiles(self):
        mcp = self._make_mcp_mock()
        registry = build_registry()
        manager = ProfileManager(mcp, registry, ["all"])

        assert manager.active_tool_count == 79
        assert len(manager.active_profiles) == 5

    def test_deactivate_preserves_shared_tools(self):
        """If a tool is in multiple profiles, deactivating one shouldn't remove it."""
        mcp = self._make_mcp_mock()
        # Create a small registry where "health_check" is in both core and admin
        shared_tool = ToolDef(fn=lambda: None, name="shared_tool", description="test")
        registry = {
            "core": [shared_tool],
            "extra": [shared_tool],
        }
        manager = ProfileManager(mcp, registry, ["core", "extra"])

        removed = manager.deactivate(["extra"])
        # shared_tool should NOT be removed (still in core)
        assert len(removed) == 0
        assert manager.active_tool_count == 1

    def test_unknown_profile_ignored(self):
        mcp = self._make_mcp_mock()
        registry = build_registry()
        manager = ProfileManager(mcp, registry, ["core"])

        added = manager.activate(["nonexistent"])
        assert len(added) == 0

    def test_get_profile_info(self):
        mcp = self._make_mcp_mock()
        registry = build_registry()
        manager = ProfileManager(mcp, registry, ["core"])

        info = manager.get_profile_info()
        assert info["core"]["active"] is True
        assert info["core"]["tool_count"] == 48
        assert info["onboarding"]["active"] is False
        assert info["onboarding"]["tool_count"] == 13


class TestToolAllowed:
    """Test per-token tool filtering."""

    def test_no_auth_allows_all(self):
        assert is_tool_allowed("any_tool") is True

    def test_blocked_tool_denied(self, mock_auth_with_blocked):
        assert is_tool_allowed("projectpulse_ticket_create") is False
        assert is_tool_allowed("projectpulse_ticket_search") is True

    def test_allowed_list_restricts(self):
        auth = AgentAuth(
            project_id=6, token_id=1, token_name="t", raw_token="t",
            blocked_tools=[],
            allowed_tools=["projectpulse_health_check"],
        )
        token = set_agent_auth(auth)
        try:
            assert is_tool_allowed("projectpulse_health_check") is True
            assert is_tool_allowed("projectpulse_ticket_search") is False
        finally:
            reset_agent_auth(token)

    def test_empty_allowed_list_allows_all(self, mock_auth):
        assert is_tool_allowed("projectpulse_anything") is True
