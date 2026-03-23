"""
Onboarding tools: 3-session project onboarding workflow.

Profile: onboarding (loaded on demand when project needs onboarding)

Session 1: Strategic Planning (10 phases, 96 Q&As)
Session 2: Document Generation (15 documents in 4 batches)
Session 3: Bootstrap (artifacts + roadmap materialization)
"""

from typing import Any, Literal

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.onboarding")


# --- General tools ---

async def projectpulse_onboarding_getPrompt(
    projectId: int, session: int,
) -> str:
    """Get onboarding template prompt for a specific session (1-3)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/onboarding/prompt", params={
            "projectId": str(pid), "session": str(session),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get onboarding prompt: {e}")


async def projectpulse_onboarding_submitResponse(
    projectId: int, session: int, response: str,
) -> str:
    """Submit onboarding response and get next session info."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/onboarding/response", json={
            "projectId": pid, "session": session, "response": response,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to submit onboarding response: {e}")


# --- Session 1: Strategic Planning ---

async def projectpulse_onboarding_getPhasedQuestions(
    projectId: int, phase: int,
) -> str:
    """Get questions for a Session 1 planning phase (1-10)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/onboarding/questions", params={
            "projectId": str(pid), "phase": str(phase),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get phased questions: {e}")


async def projectpulse_onboarding_savePhase(
    projectId: int, phase: int, answers: list[dict[str, Any]],
) -> str:
    """Save answers for a Session 1 planning phase."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/onboarding/phase", json={
            "projectId": pid, "phase": phase, "answers": answers,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to save phase: {e}")


async def projectpulse_onboarding_getExecutiveSummaryPrompt(
    projectId: int,
) -> str:
    """Get the prompt with all 96 answers for generating the executive summary."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/onboarding/executive-summary-prompt", params={
            "projectId": str(pid),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get executive summary prompt: {e}")


async def projectpulse_onboarding_storeExecutiveSummary(
    projectId: int, summary: str,
) -> str:
    """Store the agent-generated executive summary. Completes Session 1."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/onboarding/executive-summary", json={
            "projectId": pid, "summary": summary,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to store executive summary: {e}")


async def projectpulse_onboarding_finalizeSummary(
    projectId: int,
) -> str:
    """Generate and finalize the executive summary from all 96 Q&As."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/onboarding/finalize-summary", json={
            "projectId": pid,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to finalize summary: {e}")


async def projectpulse_onboarding_checkTokenBudget(
    projectId: int, operation: str, estimatedTokens: int | None = None,
) -> str:
    """Check if an operation fits within the 200K token budget."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        params: dict[str, str] = {"projectId": str(pid), "operation": operation}
        if estimatedTokens is not None:
            params["estimatedTokens"] = str(estimatedTokens)
        data = await client.get("/onboarding/token-budget", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to check token budget: {e}")


# --- Session 2: Document Generation ---

async def projectpulse_onboarding_getDocBatchPrompt(
    projectId: int,
    batch: Literal["planning", "architecture", "implementation", "operations"],
) -> str:
    """Get prompts for a batch of 4-5 documents (Session 2)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/onboarding/doc-batch-prompt", params={
            "projectId": str(pid), "batch": batch,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get doc batch prompt: {e}")


async def projectpulse_onboarding_storeBatch(
    projectId: int, documents: list[dict[str, Any]],
) -> str:
    """Bulk store 1-5 agent-generated documents (Session 2)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/onboarding/documents/batch", json={
            "projectId": pid, "documents": documents,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to store document batch: {e}")


# --- Session 3: Bootstrap ---

async def projectpulse_onboarding_getBootstrapPrompt(
    projectId: int,
) -> str:
    """Get the prompt for parsing Project Plan into JSON hierarchy (Session 3)."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/onboarding/bootstrap-prompt", params={
            "projectId": str(pid),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get bootstrap prompt: {e}")


async def projectpulse_onboarding_syncSession3(
    projectId: int,
) -> str:
    """Sync Session 3 completion: count artifacts, mark complete."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/onboarding/sync-session3", json={
            "projectId": pid,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to sync session 3: {e}")


async def projectpulse_blueprint_get(
    projectId: int,
) -> str:
    """Get Session 3 blueprint: project context, tech stack, roadmap, timeline, budget."""
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.get("/onboarding/blueprint", params={
            "projectId": str(pid),
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to get blueprint: {e}")
