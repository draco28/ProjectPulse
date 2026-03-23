"""
Shared helpers for all MCP tool implementations.

Provides response formatting, project/ticket ID resolution, and
a singleton HTTP client instance.
"""

import json
from typing import Any

from src.auth.context import get_agent_auth
from src.config import config
from src.http.client import ProjectPulseClient

# Singleton HTTP client
_client: ProjectPulseClient | None = None


def get_client() -> ProjectPulseClient:
    """Get the singleton HTTP client for API calls."""
    global _client
    if _client is None:
        _client = ProjectPulseClient(config.api_base_url)
    return _client


def build_success(data: dict | list | str) -> str:
    """Format successful tool response as JSON string."""
    if isinstance(data, str):
        return data
    return json.dumps(data, indent=2)


def build_error(message: str) -> str:
    """Format error tool response as JSON string."""
    return json.dumps({"error": message})


def resolve_project_id(project_id: int | None = None) -> int:
    """Resolve projectId: use provided value or auto-fill from auth context.

    Args:
        project_id: Explicitly provided project ID (from tool input)

    Returns:
        Resolved project ID

    Raises:
        ValueError: If no project ID available from input or auth context
    """
    if project_id is not None:
        return project_id
    auth = get_agent_auth()
    if auth:
        return auth.project_id
    raise ValueError("projectId is required (not authenticated)")


async def resolve_ticket_id(
    ticket_id: int | None = None,
    ticket_number: int | None = None,
    project_id: int | None = None,
) -> int:
    """Resolve to a global ticketId from either ticketId or ticketNumber+projectId.

    Args:
        ticket_id: Global ticket ID (from API responses)
        ticket_number: Project-scoped ticket number (from user, e.g., #5)
        project_id: Required when using ticket_number

    Returns:
        Global ticket ID

    Raises:
        ValueError: If neither ticketId nor ticketNumber provided
    """
    if ticket_id is not None:
        return ticket_id
    if ticket_number is not None:
        pid = resolve_project_id(project_id)
        client = get_client()
        result = await client.get(f"/tickets/by-number/{pid}/{ticket_number}")
        return result["id"]
    raise ValueError("Either ticketId or ticketNumber is required")
