"""
Traceability tools: requirements coverage matrix and document validation.

Profile: utility (loaded on demand)
"""

from typing import Any

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.traceability")


async def projectpulse_traceability_generate(
    projectId: int | None = None,
    expectedRefs: list[str] | None = None,
) -> str:
    """Generate traceability coverage matrix from ticket backlogRefs (FR-001, NFR-001, etc.)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        body: dict = {"projectId": pid}
        if expectedRefs:
            body["expectedRefs"] = expectedRefs
        data = await client.post("/traceability/generate", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to generate traceability: {e}")


async def projectpulse_traceability_validate_documents(
    projectId: int | None = None,
    force: bool = False,
    strict: bool = False,
    strictNfr: bool = False,
) -> str:
    """Validate PRD→SRS→Backlog→Plan document traceability and identify gaps."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/traceability/validate-documents", json={
            "projectId": pid, "force": force,
            "strict": strict, "strictNfr": strictNfr,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to validate documents: {e}")
