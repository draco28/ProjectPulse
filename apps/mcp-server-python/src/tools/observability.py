"""
Observability tools: agent action logging and session metrics.

Profile: observability (loaded on demand)
"""

from typing import Any

from src.tools._base import get_client, build_success, build_error
from src.logger import get_logger

logger = get_logger("tools.observability")


async def projectpulse_observability_logStep(
    sessionId: int, stepName: str, metadata: dict[str, Any] | None = None,
) -> str:
    """Log an agent action/step with optional metadata for audit trails."""
    try:
        client = get_client()
        body: dict = {"sessionId": sessionId, "stepName": stepName}
        if metadata:
            body["metadata"] = metadata
        data = await client.post("/observability/log-step", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to log step: {e}")


async def projectpulse_observability_completeSession(
    sessionId: int, validationReport: dict[str, Any] | None = None,
) -> str:
    """Mark observability session completed with optional quality/validation report."""
    try:
        client = get_client()
        body: dict = {"sessionId": sessionId}
        if validationReport:
            body["validationReport"] = validationReport
        data = await client.post("/observability/complete-session", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to complete observability session: {e}")
