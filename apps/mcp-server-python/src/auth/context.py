"""
Request-scoped authentication context using Python's contextvars.

This is the Python equivalent of Node.js AsyncLocalStorage used in the
TypeScript MCP server (authContext.ts). Each async request gets its own
AgentAuth context that flows through all await boundaries automatically.
"""

import contextvars
from dataclasses import dataclass, field


@dataclass(frozen=True)
class AgentAuth:
    """Authenticated agent context for the current request."""

    project_id: int
    token_id: int
    token_name: str
    raw_token: str
    blocked_tools: list[str] = field(default_factory=list)
    allowed_tools: list[str] = field(default_factory=list)


# Request-scoped context variable (like Node.js AsyncLocalStorage)
_agent_auth: contextvars.ContextVar[AgentAuth | None] = contextvars.ContextVar(
    "agent_auth", default=None
)


def get_agent_auth() -> AgentAuth | None:
    """Get the current request's auth context."""
    return _agent_auth.get()


def set_agent_auth(auth: AgentAuth) -> contextvars.Token:
    """Set auth context for the current request. Returns a token for reset."""
    return _agent_auth.set(auth)


def reset_agent_auth(token: contextvars.Token) -> None:
    """Reset auth context using a token from set_agent_auth."""
    _agent_auth.reset(token)


def is_tool_allowed(tool_name: str) -> bool:
    """Check if a tool is allowed for the current authenticated token.

    Logic (order matters — matches TypeScript isToolAllowed):
    1. No auth context → allow (dev mode, no token)
    2. Tool in blocked_tools → deny
    3. allowed_tools is non-empty and tool not in it → deny
    4. Default → allow
    """
    auth = get_agent_auth()
    if auth is None:
        return True
    if tool_name in auth.blocked_tools:
        return False
    if auth.allowed_tools and tool_name not in auth.allowed_tools:
        return False
    return True
