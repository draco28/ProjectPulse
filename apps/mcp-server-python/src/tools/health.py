"""
Health check tool: verify server and API connectivity.

Profile: core (always loaded)
API: GET /api/health
"""

import httpx

from src.config import config, SERVER_NAME, SERVER_VERSION


async def projectpulse_health_check() -> dict:
    """Verify server and API connectivity.

    Returns server status and whether the ProjectPulse API is reachable.
    No authentication required for health checks.
    """
    api_reachable = False
    api_status = "unreachable"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{config.api_base_url}/health")
            api_reachable = response.is_success
            if api_reachable:
                data = response.json()
                api_status = data.get("status", "unknown")
            else:
                api_status = f"error:{response.status_code}"
    except Exception as e:
        api_status = f"error:{e}"

    return {
        "status": "healthy",
        "server": SERVER_NAME,
        "version": SERVER_VERSION,
        "api_reachable": api_reachable,
        "api_status": api_status,
    }
