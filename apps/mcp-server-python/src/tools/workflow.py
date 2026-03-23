"""
Workflow tools: template listing, execution lifecycle.

Profile: core (all 7 tools always loaded)

API endpoints:
- GET /api/workflows — list templates
- POST /api/workflows/run — start run
- POST /api/workflows/run/{id}/execute — execute step
- GET /api/workflows/run/{id} — get status
- POST /api/workflows/run/{id}/pause — pause
- POST /api/workflows/run/{id}/resume — resume
- POST /api/workflows/run/{id}/complete — complete
"""

from typing import Any, Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.workflow")


async def projectpulse_workflow_list(
    category: Literal["development", "project-management", "knowledge"] | None = None,
    isActive: bool | None = None,
    projectId: int | None = None,
) -> str:
    """List available workflow templates.

    Args:
        category: Filter by category — development, project-management, knowledge
        isActive: Filter by active status
        projectId: Project ID (auto-fills from auth)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"projectId": str(pid)}
        if category:
            params["category"] = category
        if isActive is not None:
            params["isActive"] = str(isActive).lower()
        data = await client.get("/workflows", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to list workflows: {e}")


async def projectpulse_workflow_start(
    templateId: int,
    projectId: int | None = None,
    initialContext: dict[str, Any] | None = None,
) -> str:
    """Start a new workflow run from a template.

    Args:
        templateId: Workflow template ID
        projectId: Project ID (auto-fills from auth)
        initialContext: Optional initial context data for the workflow
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        body: dict = {"templateId": templateId, "projectId": pid}
        if initialContext:
            body["initialContext"] = initialContext
        data = await client.post("/workflows/run", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to start workflow: {e}")


async def projectpulse_workflow_executeStep(
    runId: int,
    output: dict[str, Any] | None = None,
) -> str:
    """Execute the current workflow step and advance to the next.

    Args:
        runId: Workflow run ID
        output: Output data from the current step
    """
    try:
        client = get_client()
        body: dict = {}
        if output:
            body["output"] = output
        data = await client.post(f"/workflows/run/{runId}/execute", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to execute workflow step: {e}")


async def projectpulse_workflow_getStatus(
    runId: int,
) -> str:
    """Get detailed workflow run status with current step info.

    Args:
        runId: Workflow run ID
    """
    try:
        client = get_client()
        data = await client.get(f"/workflows/run/{runId}")
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get workflow status: {e}")


async def projectpulse_workflow_pause(
    runId: int,
    checkpoint: dict[str, Any] | None = None,
) -> str:
    """Pause a workflow run and create a checkpoint for later recovery.

    Args:
        runId: Workflow run ID
        checkpoint: Optional checkpoint data to save
    """
    try:
        client = get_client()
        body: dict = {}
        if checkpoint:
            body["checkpoint"] = checkpoint
        data = await client.post(f"/workflows/run/{runId}/pause", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to pause workflow: {e}")


async def projectpulse_workflow_resume(
    runId: int,
) -> str:
    """Resume a paused workflow run from its checkpoint.

    Args:
        runId: Workflow run ID
    """
    try:
        client = get_client()
        data = await client.post(f"/workflows/run/{runId}/resume", json={})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to resume workflow: {e}")


async def projectpulse_workflow_complete(
    runId: int,
    status: Literal["completed", "failed"],
    summary: str | None = None,
) -> str:
    """Mark a workflow run as completed or failed.

    Args:
        runId: Workflow run ID
        status: "completed" or "failed"
        summary: Optional summary of the workflow outcome
    """
    try:
        client = get_client()
        body: dict = {"status": status}
        if summary:
            body["summary"] = summary
        data = await client.post(f"/workflows/run/{runId}/complete", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to complete workflow: {e}")
