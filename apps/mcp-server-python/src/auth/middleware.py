"""
ASGI middleware stack: CORS, Accept header fix, and Bearer token auth.

Provides create_app() which wraps FastMCP's Starlette app with our
middleware chain and adds a /health endpoint.
"""

import json

import httpx
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.types import ASGIApp, Receive, Scope, Send

from src.auth.context import AgentAuth, set_agent_auth, reset_agent_auth
from src.config import AppConfig, SERVER_NAME, SERVER_VERSION
from src.logger import get_logger

logger = get_logger("middleware")


# --- Accept Header Fix Middleware ---

class AcceptHeaderFixMiddleware:
    """Ensure Accept header includes both application/json and text/event-stream.

    The MCP SDK requires both content types. Some clients don't send them.
    ASGI stores headers in scope["headers"] as (name, value) byte tuples.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = list(scope.get("headers", []))
        accept_value = b""
        accept_index = -1

        for i, (name, value) in enumerate(headers):
            if name.lower() == b"accept":
                accept_value = value
                accept_index = i
                break

        accept_str = accept_value.decode("utf-8", errors="replace")
        needs_json = "application/json" not in accept_str
        needs_stream = "text/event-stream" not in accept_str

        if needs_json or needs_stream:
            parts = [accept_str] if accept_str else []
            if needs_json:
                parts.append("application/json")
            if needs_stream:
                parts.append("text/event-stream")
            fixed = ", ".join(parts)

            if accept_index >= 0:
                headers[accept_index] = (b"accept", fixed.encode())
            else:
                headers.append((b"accept", fixed.encode()))

            scope["headers"] = headers

        await self.app(scope, receive, send)


# --- Bearer Auth Middleware ---

class BearerAuthMiddleware:
    """Validate Bearer tokens and set auth context via contextvars.

    - Skips auth for GET /health
    - In dev mode without token: passes through (no auth context)
    - In prod mode without token: returns 401
    - On valid token: sets AgentAuth in contextvars
    """

    def __init__(self, app: ASGIApp, config: AppConfig):
        self.app = app
        self.config = config

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        # Skip auth for health check
        if path == "/health":
            await self.app(scope, receive, send)
            return

        # Extract bearer token
        raw_token = self._extract_token(scope)

        if not raw_token:
            if self.config.is_production:
                await self._send_401(send, "Missing bearer token")
                return
            # Dev mode: allow through without auth context
            await self.app(scope, receive, send)
            return

        # Validate token against the API
        auth = await self._validate_token(raw_token)
        if auth is None:
            await self._send_401(send, "Invalid or expired token")
            return

        # Set auth context for this request
        token = set_agent_auth(auth)
        try:
            await self.app(scope, receive, send)
        finally:
            reset_agent_auth(token)

    def _extract_token(self, scope: Scope) -> str | None:
        """Extract bearer token from Authorization header."""
        for name, value in scope.get("headers", []):
            if name.lower() == b"authorization":
                auth_str = value.decode("utf-8", errors="replace")
                if auth_str.startswith("Bearer "):
                    return auth_str[7:]
        return None

    async def _validate_token(self, raw_token: str) -> AgentAuth | None:
        """Validate token via POST /api/agent-auth/validate."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.config.api_base_url}/agent-auth/validate",
                    json={"token": raw_token},
                    headers={"Content-Type": "application/json"},
                )
                if not response.is_success:
                    logger.warn(
                        "Token validation failed",
                        status=response.status_code,
                    )
                    return None

                data = response.json()
                return AgentAuth(
                    project_id=data["projectId"],
                    token_id=data["tokenId"],
                    token_name=data.get("name", ""),
                    raw_token=raw_token,
                    blocked_tools=data.get("blockedTools", []),
                    allowed_tools=data.get("allowedTools", []),
                )
        except Exception as e:
            logger.error("Token validation error", error=str(e))
            return None

    async def _send_401(self, send: Send, detail: str) -> None:
        """Send a 401 Unauthorized JSON response."""
        body = json.dumps({"error": detail}).encode()
        await send({
            "type": "http.response.start",
            "status": 401,
            "headers": [
                [b"content-type", b"application/json"],
                [b"content-length", str(len(body)).encode()],
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })


# --- Health Endpoint ---

async def health_endpoint(_request: Request) -> JSONResponse:
    """Server health check endpoint (no auth required)."""
    return JSONResponse({
        "status": "healthy",
        "server": SERVER_NAME,
        "version": SERVER_VERSION,
        "transport": "streamable-http",
        "endpoint": "/mcp",
    })


# --- App Factory ---

def create_app(mcp_app: Starlette, config: AppConfig) -> ASGIApp:
    """Wrap FastMCP's Starlette app with middleware and health endpoint.

    Architecture:
    - /health → served directly (no auth required)
    - /mcp/* → routed through AcceptHeaderFix → BearerAuth → FastMCP app
    - Everything wrapped in CORS

    Args:
        mcp_app: The Starlette app from FastMCP.streamable_http_app()
        config: Application configuration
    """
    # Build CORS config
    if config.is_production and config.cors_origins:
        cors_origins = config.cors_origins
    else:
        cors_origins = ["*"]

    # Wrap MCP app with our middleware (innermost → outermost)
    wrapped_mcp = AcceptHeaderFixMiddleware(
        BearerAuthMiddleware(mcp_app, config)
    )

    # Simple health endpoint as ASGI
    health_app = Starlette(
        routes=[Route("/health", health_endpoint, methods=["GET"])],
    )

    # Router: dispatch by path
    async def router(scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path == "/health":
                await health_app(scope, receive, send)
                return
        # Everything else (including /mcp) goes to the wrapped MCP app
        await wrapped_mcp(scope, receive, send)

    # Wrap with CORS (outermost layer)
    final_app = CORSMiddleware(
        app=router,
        allow_origins=cors_origins,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept", "Mcp-Session-Id"],
        expose_headers=["Mcp-Session-Id", "Content-Type"],
    )

    return final_app
