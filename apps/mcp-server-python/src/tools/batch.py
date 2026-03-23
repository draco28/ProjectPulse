"""
Batch tools: bulk creation of personas, skills, workflow templates, and SOPs.

Profile: admin (loaded on demand for onboarding Session 3 bootstrap)

All operations are atomic: 1-10 items per call, all succeed or all fail.
"""

from typing import Any

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.batch")


async def projectpulse_batch_createAgentPersonas(
    projectId: int, personas: list[dict[str, Any]],
) -> str:
    """Bulk create 1-10 agent personas atomically.

    Each persona: name, slug, systemPrompt (required), plus optional
    description, skills, tools, rules, icon, expertise, personality.
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/batch/agent-personas", json={
            "projectId": pid, "personas": personas,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to batch create personas: {e}")


async def projectpulse_batch_createSkills(
    projectId: int, skills: list[dict[str, Any]],
) -> str:
    """Bulk create 1-10 skills atomically.

    Each skill: title, slug, content (required), plus optional category, frameworks, tags.
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/batch/skills", json={
            "projectId": pid, "skills": skills,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to batch create skills: {e}")


async def projectpulse_batch_createWorkflowTemplates(
    projectId: int, templates: list[dict[str, Any]],
) -> str:
    """Bulk create 1-10 workflow templates atomically.

    Each template: name, category, steps[] (required), plus optional description.
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/batch/workflow-templates", json={
            "projectId": pid, "templates": templates,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to batch create workflow templates: {e}")


async def projectpulse_batch_createSOPs(
    projectId: int, sops: list[dict[str, Any]],
) -> str:
    """Bulk create 1-10 SOPs atomically.

    Each SOP: title, slug, content (required), plus optional description, category, tags.
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/batch/sops", json={
            "projectId": pid, "sops": sops,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to batch create SOPs: {e}")
