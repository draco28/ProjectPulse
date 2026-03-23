"""Shared test fixtures for ProjectPulse Python MCP Server."""

import pytest
from unittest.mock import MagicMock

from src.auth.context import AgentAuth, set_agent_auth, reset_agent_auth


@pytest.fixture
def mock_auth():
    """Set up a mock AgentAuth context for tests."""
    auth = AgentAuth(
        project_id=6,
        token_id=1,
        token_name="test-token",
        raw_token="test-bearer-token",
        blocked_tools=[],
        allowed_tools=[],
    )
    token = set_agent_auth(auth)
    yield auth
    reset_agent_auth(token)


@pytest.fixture
def mock_auth_with_blocked():
    """Set up auth context with a blocked tool."""
    auth = AgentAuth(
        project_id=6,
        token_id=1,
        token_name="restricted-token",
        raw_token="test-bearer-token",
        blocked_tools=["projectpulse_ticket_create"],
        allowed_tools=[],
    )
    token = set_agent_auth(auth)
    yield auth
    reset_agent_auth(token)
