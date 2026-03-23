"""
Repo tools: generate workflow guides for project repositories.

Profile: utility (loaded on demand)
"""

from src.tools._base import get_client, build_success, build_error, resolve_project_id
from src.logger import get_logger

logger = get_logger("tools.repo")


async def projectpulse_repo_writeMinimal(
    projectId: int, repoPath: str,
) -> str:
    """Generate CLAUDE.md and AGENTS.md workflow guides for a repository.

    Args:
        projectId: Project ID
        repoPath: Path to the repository root
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_client()
        data = await client.post("/repo/write-minimal", json={
            "projectId": pid, "repoPath": repoPath,
        })
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        return build_error(f"Failed to write minimal repo files: {e}")
