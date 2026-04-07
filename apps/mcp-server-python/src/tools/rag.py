"""
RAG tools: unified search and context assembly across all content types.

These tools call the Axum API (not Next.js) at the configured
PROJECTPULSE_AXUM_API_BASE_URL (default: http://localhost:3003).

Core profile: rag_search, rag_context
Admin profile: rag_ingest, rag_ingest_status
"""

from src.tools._base import build_success, build_error, resolve_project_id
from src.config import config
from src.http.client import ProjectPulseClient
from src.logger import get_logger

logger = get_logger("tools.rag")

# Separate client for Axum API (RAG endpoints)
_axum_client: ProjectPulseClient | None = None


def get_axum_client() -> ProjectPulseClient:
    """Get the singleton Axum API client for RAG endpoints."""
    global _axum_client
    if _axum_client is None:
        _axum_client = ProjectPulseClient(config.axum_api_base_url)
    return _axum_client


# --- Core profile tools ---

async def projectpulse_rag_search(
    query: str = "",
    projectId: int | None = None,
    limit: int = 10,
    sourceTypes: str | None = None,
    includeRelations: bool = True,
) -> str:
    """[QUERY] Unified RAG search across all content types (wiki, tickets, SOPs, skills, knowledge).

    Returns ranked CHUNKS (not full documents) using hybrid search:
    - Semantic: pgvector cosine similarity (768-dim nomic-embed-text)
    - Keyword: PostgreSQL tsvector BM25 full-text search
    - Ranking: Reciprocal Rank Fusion (RRF) merging both lists

    For cross-content search, prefer this over knowledge_search (which only searches KnowledgeItems).

    When to Use:
    - Finding relevant context across wiki, tickets, SOPs, skills, knowledge
    - Answering questions about the project
    - Building context before starting work on a ticket

    Args:
        query: Search query (natural language). Empty string returns recent chunks.
        projectId: Project ID (auto-fills from auth context when omitted)
        limit: Max results (1-100, default: 10)
        sourceTypes: Comma-separated filter (e.g., "wiki,ticket,sop")
        includeRelations: Include knowledge graph relations in results (default: true)

    Returns:
        Ranked chunks with source metadata, scores, and related chunks.

    Related:
    → projectpulse_rag_context — Assemble full context for a task
    → projectpulse_knowledge_search — KnowledgeItem-only search (legacy)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_axum_client()
        params: dict[str, str] = {
            "projectId": str(pid),
            "limit": str(min(limit, 100)),
            "includeRelations": str(includeRelations).lower(),
        }
        if query:
            params["query"] = query
        if sourceTypes:
            params["sourceTypes"] = sourceTypes
        data = await client.get("/api/v1/rag/search", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("rag_search failed", error=str(e))
        return build_error(f"Failed to search RAG: {e}")


async def projectpulse_rag_context(
    taskDescription: str,
    projectId: int | None = None,
    maxTokens: int = 4000,
    ticketIds: str | None = None,
) -> str:
    """[QUERY] Assemble optimized context for a task within a token budget.

    Performs multi-query RAG search, follows graph relations, and assembles
    a pre-formatted markdown context document. Use this instead of manually
    calling wiki_get + knowledge_search + ticket_get separately.

    When to Use:
    - Starting work on a ticket and need relevant background
    - Before making architectural decisions
    - When an agent needs comprehensive project context

    Args:
        taskDescription: What you're working on (natural language)
        projectId: Project ID (auto-fills from auth context)
        maxTokens: Maximum context size in tokens (default: 4000)
        ticketIds: Comma-separated ticket IDs for additional context

    Returns:
        Pre-formatted markdown context + source attributions + token count.

    Related:
    → projectpulse_rag_search — Raw search results (more control)
    → projectpulse_context_load — Memory banks (orthogonal to RAG)
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_axum_client()
        params: dict[str, str] = {
            "task": taskDescription,
            "projectId": str(pid),
            "budget": str(maxTokens),
        }
        if ticketIds:
            params["ticketIds"] = ticketIds
        data = await client.get("/api/v1/rag/context", params=params)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("rag_context failed", error=str(e))
        return build_error(f"Failed to assemble RAG context: {e}")


# --- Admin profile tools ---

async def projectpulse_rag_ingest(
    sourceType: str = "all",
    projectId: int | None = None,
    content: str | None = None,
    title: str | None = None,
    sourceId: int | None = None,
) -> str:
    """[ACTION] Trigger content ingestion into the RAG index.

    Bulk mode: reads all content of the specified type from PostgreSQL,
    chunks it, generates embeddings, and stores in the rag_chunks table.

    Inline mode: when content is provided, ingests that specific content
    synchronously (useful for ad-hoc ingestion).

    Args:
        sourceType: Content type to ingest (wiki, ticket, sop, skill, document, knowledge, all)
        projectId: Project ID
        content: Optional inline content (skips DB read, ingests synchronously)
        title: Optional title for inline content
        sourceId: Optional source record ID for inline content

    Returns:
        Job ID and status for bulk mode, or completion status for inline mode.
    """
    try:
        pid = resolve_project_id(projectId)
        client = get_axum_client()
        body: dict = {
            "sourceType": sourceType,
            "projectId": pid,
        }
        if content:
            body["content"] = content
        if title:
            body["title"] = title
        if sourceId is not None:
            body["sourceId"] = sourceId
        data = await client.post("/api/v1/rag/ingest", json=body)
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("rag_ingest failed", error=str(e))
        return build_error(f"Failed to trigger ingestion: {e}")


async def projectpulse_rag_ingest_status(
    jobId: str,
) -> str:
    """[QUERY] Check ingestion job progress.

    Args:
        jobId: Job ID returned from rag_ingest

    Returns:
        Job status, processed count, total count, and any errors.
    """
    try:
        client = get_axum_client()
        data = await client.get("/api/v1/rag/ingest/status", params={"jobId": jobId})
        if "error" in data:
            return build_error(data.get("message", data["error"]))
        return build_success(data)
    except Exception as e:
        logger.error("rag_ingest_status failed", error=str(e))
        return build_error(f"Failed to check ingestion status: {e}")
