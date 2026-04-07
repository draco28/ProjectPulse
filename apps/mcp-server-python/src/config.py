"""
Environment configuration for ProjectPulse MCP Server.

Uses Pydantic Settings to load from .env file and environment variables.
Field names map to env var names (case-insensitive).
"""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

# Constants
SERVER_NAME = "projectpulse-mcp-python"
SERVER_VERSION = "1.0.0"


class AppConfig(BaseSettings):
    """Type-safe configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API connection
    projectpulse_api_base_url: str = "http://localhost:3000/api"
    projectpulse_axum_api_base_url: str = "http://localhost:3003"
    projectpulse_api_token: str = ""
    mcp_server_port: int = 3002
    node_env: Literal["development", "production", "test"] = "development"

    # Profile system
    tool_profiles: str = "core"

    # Security
    mcp_internal_secret: str = ""
    allowed_origins: str = ""

    # Logging
    log_level: str = "info"

    @property
    def active_profiles(self) -> list[str]:
        """Parse comma-separated profile names."""
        return [p.strip() for p in self.tool_profiles.split(",") if p.strip()]

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated CORS origins."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def api_base_url(self) -> str:
        """Normalized Next.js API base URL (no trailing slash)."""
        return self.projectpulse_api_base_url.rstrip("/")

    @property
    def axum_api_base_url(self) -> str:
        """Normalized Axum API base URL for RAG endpoints (no trailing slash)."""
        return self.projectpulse_axum_api_base_url.rstrip("/")

    @property
    def is_production(self) -> bool:
        return self.node_env == "production"

    @property
    def is_development(self) -> bool:
        return self.node_env == "development"


# Singleton — loaded once at import time
config = AppConfig()
