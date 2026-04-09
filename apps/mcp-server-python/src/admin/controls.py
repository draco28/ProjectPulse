"""
Admin controls: emergency shutdown, global tool blocklist, and tool call logging.

Mirrors TypeScript adminControls.ts with:
- 5-second TTL cache for admin API checks
- HMAC-SHA256 signing for internal requests
- Fail-open pattern (allow on error)
- Fire-and-forget tool call logging
"""

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any

import httpx

from src.config import config
from src.logger import get_logger

logger = get_logger("admin.controls")

CACHE_TTL = 5.0  # seconds


# --- HMAC Signing ---

def create_signed_headers(body: Any = None) -> dict[str, str]:
    """Create HMAC-signed headers for internal admin API requests."""
    secret = config.mcp_internal_secret
    if not secret:
        return {"x-internal-request": "true"}

    timestamp = str(int(time.time() * 1000))
    body_string = json.dumps(body) if body is not None else ""
    payload = f"{timestamp}.{body_string}"

    signature = hmac.new(
        secret.encode(), payload.encode(), hashlib.sha256,
    ).hexdigest()

    return {
        "x-internal-timestamp": timestamp,
        "x-internal-signature": signature,
    }


# --- Cached Emergency Shutdown ---

@dataclass
class EmergencyStatus:
    enabled: bool
    reason: str = ""


_emergency_cache: dict[str, Any] | None = None
_emergency_cache_time: float = 0.0


async def check_emergency_shutdown() -> EmergencyStatus:
    """Check if MCP is in emergency shutdown mode. Cached for 5s. Fail-open."""
    global _emergency_cache, _emergency_cache_time

    now = time.time()
    if _emergency_cache is not None and (now - _emergency_cache_time) < CACHE_TTL:
        return EmergencyStatus(**_emergency_cache)

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{config.axum_api_v1_url}/admin/mcp/emergency",
                headers={
                    "Content-Type": "application/json",
                    **create_signed_headers(),
                },
            )
            if response.is_success:
                data = response.json()
                _emergency_cache = {
                    "enabled": data.get("enabled", False),
                    "reason": data.get("reason", ""),
                }
                _emergency_cache_time = now
                return EmergencyStatus(**_emergency_cache)
    except Exception as e:
        logger.warn("Emergency shutdown check failed, proceeding", error=str(e))

    # Fail-open: allow on error
    return EmergencyStatus(enabled=False)


# --- Cached Tool Blocklist ---

_blocklist_cache: list[str] | None = None
_blocklist_cache_time: float = 0.0


async def check_blocked_tool(tool_name: str) -> bool:
    """Check if a tool is globally blocked by admin. Cached for 5s. Fail-open."""
    global _blocklist_cache, _blocklist_cache_time

    now = time.time()
    if _blocklist_cache is not None and (now - _blocklist_cache_time) < CACHE_TTL:
        return tool_name in _blocklist_cache

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{config.axum_api_v1_url}/admin/mcp/blocked-tools",
                headers={
                    "Content-Type": "application/json",
                    **create_signed_headers(),
                },
            )
            if response.is_success:
                data = response.json()
                _blocklist_cache = data.get("blockedTools", [])
                _blocklist_cache_time = now
                return tool_name in _blocklist_cache
    except Exception as e:
        logger.warn("Blocklist check failed, allowing tool", error=str(e), tool=tool_name)

    # Fail-open: allow on error
    return False


# --- Fire-and-Forget Tool Call Logging ---

async def log_tool_call(
    token_id: int,
    project_id: int,
    tool_name: str,
    duration: int,
    success: bool,
    error: str | None = None,
) -> None:
    """Log a tool call to the admin API. Fire-and-forget (never throws)."""
    try:
        body = {
            "tokenId": token_id,
            "projectId": project_id,
            "toolName": tool_name,
            "duration": duration,
            "success": success,
        }
        if error:
            body["error"] = error

        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{config.axum_api_v1_url}/mcp/log",
                json=body,
                headers={
                    "Content-Type": "application/json",
                    **create_signed_headers(body),
                },
            )
    except Exception:
        pass  # Fire-and-forget: never crash on logging failure
