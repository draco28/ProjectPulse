"""
ProjectPulse Python MCP Server — Entry Point.

Creates a ProfileAwareMCP server, initializes the profile system,
wraps with auth/CORS/Accept middleware, and runs via uvicorn.
"""

import asyncio
import signal

import uvicorn

from src.auth.middleware import create_app
from src.config import config, SERVER_NAME, SERVER_VERSION
from src.logger import setup_logging, get_logger
from src.profiles.manager import ProfileManager
from src.profiles.registry import build_registry
from src.server import ProfileAwareMCP

logger = get_logger("main")


def create_server() -> tuple[ProfileAwareMCP, uvicorn.Server]:
    """Create and configure the MCP server with profile system and middleware."""
    setup_logging()

    # Create ProfileAwareMCP instance
    mcp = ProfileAwareMCP(
        name=SERVER_NAME,
        instructions=f"ProjectPulse MCP Server v{SERVER_VERSION} (Python)",
    )

    # Initialize profile system
    registry = build_registry()
    manager = ProfileManager(mcp, registry, config.active_profiles)

    # Store manager on MCP instance so tools can access it (via ctx.fastmcp)
    mcp.profile_manager = manager  # type: ignore[attr-defined]

    logger.info(
        "Profile system initialized",
        active_profiles=sorted(manager.active_profiles),
        tool_count=manager.active_tool_count,
    )

    # Get FastMCP's Starlette app and wrap with our middleware
    mcp_starlette = mcp.streamable_http_app()
    app = create_app(mcp_starlette, config)

    # Create uvicorn server
    uv_config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=config.mcp_server_port,
        log_level=config.log_level.lower(),
    )
    server = uvicorn.Server(uv_config)

    return mcp, server


async def main() -> None:
    """Start the MCP server with graceful shutdown."""
    mcp, server = create_server()

    logger.info(
        "Starting ProjectPulse Python MCP Server",
        port=config.mcp_server_port,
        profiles=config.active_profiles,
        environment=config.node_env,
        api_url=config.api_base_url,
    )

    # Set up graceful shutdown
    loop = asyncio.get_event_loop()

    def handle_signal(sig: int) -> None:
        logger.info("Received shutdown signal", signal=signal.Signals(sig).name)
        server.should_exit = True

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, handle_signal, sig)

    await server.serve()
    logger.info("Server stopped")


if __name__ == "__main__":
    asyncio.run(main())
