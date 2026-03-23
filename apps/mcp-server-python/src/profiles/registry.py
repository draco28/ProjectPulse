"""
Master tool registry: maps profile names to tool definitions.

Each tool definition contains the function, name, and description needed
to register it with FastMCP. Tools are organized by profile — only tools
in active profiles get registered with the server.

Profiles are populated incrementally as tools are implemented:
- Phase 2: core (health_check + manage_profiles)
- Phase 3: core += context + sessions
- Phase 4: core += tickets + kanban
- ...etc
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ToolDef:
    """Definition of a tool to be registered with FastMCP."""

    fn: Callable[..., Any]
    name: str
    description: str


def build_registry() -> dict[str, list[ToolDef]]:
    """Build the complete tool registry.

    Imports are done inside the function to avoid circular imports
    and to allow tools to be added incrementally across phases.
    """
    from src.tools.health import projectpulse_health_check
    from src.profiles.meta_tool import projectpulse_manage_profiles
    from src.tools.context import (
        projectpulse_context_load,
        projectpulse_context_lookup,
        projectpulse_context_update,
    )
    from src.tools.sessions import (
        projectpulse_agent_session_start,
        projectpulse_agent_session_update,
        projectpulse_agent_session_end,
        projectpulse_agent_session_resume,
    )
    from src.tools.tickets import (
        projectpulse_ticket_create,
        projectpulse_ticket_bulkCreate,
        projectpulse_ticket_search,
        projectpulse_ticket_get,
        projectpulse_ticket_update,
        projectpulse_ticket_setStatus,
        projectpulse_ticket_addComment,
        projectpulse_ticket_getChildren,
        projectpulse_ticket_getHierarchy,
    )
    from src.tools.kanban import (
        projectpulse_kanban_getBoard,
        projectpulse_kanban_moveTicket,
    )
    from src.tools.knowledge import (
        projectpulse_knowledge_search, projectpulse_knowledge_create,
        projectpulse_knowledge_get, projectpulse_knowledge_related,
        projectpulse_knowledge_export, projectpulse_knowledge_import,
        projectpulse_knowledge_archive, projectpulse_knowledge_metrics,
    )
    from src.tools.wiki import (
        projectpulse_wiki_search, projectpulse_wiki_get,
        projectpulse_wiki_create, projectpulse_wiki_update,
        projectpulse_wiki_analytics_summary, projectpulse_wiki_generate,
    )
    from src.tools.resources import (
        projectpulse_persona_list, projectpulse_persona_get,
        projectpulse_skill_list, projectpulse_skill_get,
        projectpulse_sop_list, projectpulse_sop_get,
    )
    from src.tools.roadmap import (
        projectpulse_sprint_getCurrentPosition, projectpulse_roadmap_getPhaseProgress,
        projectpulse_roadmap_create, projectpulse_roadmap_materialize,
        projectpulse_roadmap_delete,
    )
    from src.tools.sprint import (
        projectpulse_sprint_queryHierarchy, projectpulse_sprint_updateProgress,
        projectpulse_sprint_phase_create,
    )
    from src.tools.workflow import (
        projectpulse_workflow_list, projectpulse_workflow_start,
        projectpulse_workflow_executeStep, projectpulse_workflow_getStatus,
        projectpulse_workflow_pause, projectpulse_workflow_resume,
        projectpulse_workflow_complete,
    )
    from src.tools.backlog import (
        projectpulse_backlog_list, projectpulse_backlog_getBySprint,
    )
    from src.tools.onboarding import (
        projectpulse_onboarding_getPrompt, projectpulse_onboarding_submitResponse,
        projectpulse_onboarding_getPhasedQuestions, projectpulse_onboarding_savePhase,
        projectpulse_onboarding_getExecutiveSummaryPrompt,
        projectpulse_onboarding_storeExecutiveSummary,
        projectpulse_onboarding_finalizeSummary, projectpulse_onboarding_checkTokenBudget,
        projectpulse_onboarding_getDocBatchPrompt, projectpulse_onboarding_storeBatch,
        projectpulse_onboarding_getBootstrapPrompt, projectpulse_onboarding_syncSession3,
        projectpulse_blueprint_get,
    )
    from src.tools.batch import (
        projectpulse_batch_createAgentPersonas, projectpulse_batch_createSkills,
        projectpulse_batch_createWorkflowTemplates, projectpulse_batch_createSOPs,
    )
    from src.tools.traceability import (
        projectpulse_traceability_generate, projectpulse_traceability_validate_documents,
    )
    from src.tools.observability import (
        projectpulse_observability_logStep, projectpulse_observability_completeSession,
    )
    from src.tools.repo import projectpulse_repo_writeMinimal

    return {
        "core": [
            # --- Always loaded ---
            ToolDef(
                fn=projectpulse_health_check,
                name="projectpulse_health_check",
                description=(
                    "Verify server and API connectivity. "
                    "Returns server status and whether the ProjectPulse API is reachable."
                ),
            ),
            ToolDef(
                fn=projectpulse_manage_profiles,
                name="projectpulse_manage_profiles",
                description=(
                    "Manage tool profiles to control which tools are available. "
                    "Actions: 'status' (current state), 'list' (all profiles with tools), "
                    "'load' (activate profiles), 'unload' (deactivate profiles). "
                    "Use this to load additional tools on demand (e.g., onboarding tools)."
                ),
            ),
            # --- Phase 3: Context tools ---
            ToolDef(
                fn=projectpulse_context_load,
                name="projectpulse_context_load",
                description=(
                    "Load full project context: all 5 memory banks, active sessions, and workflow hints. "
                    "This is the ENTRY POINT tool — call this first at the start of every session. "
                    "Returns: projectBrief, systemPatterns, techContext, activeContext, progress banks, "
                    "plus active agent sessions, onboarding status, and available resources."
                ),
            ),
            ToolDef(
                fn=projectpulse_context_lookup,
                name="projectpulse_context_lookup",
                description=(
                    "Look up a single memory bank by type. Token-efficient alternative to context_load. "
                    "Bank types: PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS."
                ),
            ),
            ToolDef(
                fn=projectpulse_context_update,
                name="projectpulse_context_update",
                description=(
                    "Update a memory bank's content. Use only when explicitly requested by user. "
                    "Modes: 'replace' (overwrite) or 'append' (add to existing). "
                    "Token budgets are enforced per bank."
                ),
            ),
            # --- Phase 3: Session tools ---
            ToolDef(
                fn=projectpulse_agent_session_start,
                name="projectpulse_agent_session_start",
                description=(
                    "Start a new agent work session with optional plan, todos, and ticket claiming. "
                    "When activeTicketIds or activeTicketNumbers are provided, tickets are auto-claimed: "
                    "validated as 'todo' status, moved to 'in-progress', assignee set to 'Claude Code'. "
                    "Use activeTicketNumbers for user-referenced tickets (e.g., #5, #7)."
                ),
            ),
            ToolDef(
                fn=projectpulse_agent_session_update,
                name="projectpulse_agent_session_update",
                description=(
                    "Update session progress, todos, plan, or status at checkpoints. "
                    "Call at regular intervals (every 15K tokens) to persist state. "
                    "Set status='PAUSED' for breaks (lunch, EOD). "
                    "Use appendProgress=true to add to existing progress notes."
                ),
            ),
            ToolDef(
                fn=projectpulse_agent_session_end,
                name="projectpulse_agent_session_end",
                description=(
                    "End a work session. Auto-syncs PROGRESS and ACTIVE_CONTEXT memory banks. "
                    "Linked in-progress tickets are moved to 'in-review'. "
                    "WARNING: Completed sessions CANNOT be resumed. Use PAUSED status for breaks."
                ),
            ),
            ToolDef(
                fn=projectpulse_agent_session_resume,
                name="projectpulse_agent_session_resume",
                description=(
                    "Resume a paused session with full context recovery. "
                    "Returns complete session state: plan, todos, progress, active tickets. "
                    "Only PAUSED sessions can be resumed."
                ),
            ),
            # --- Phase 4: Ticket tools ---
            ToolDef(
                fn=projectpulse_ticket_create,
                name="projectpulse_ticket_create",
                description=(
                    "Create a new ticket (feature, task, epic, issue, bug, scanner_finding, tech_debt). "
                    "Supports hierarchy (parentTicketId), sprint assignment, labels, and custom fields."
                ),
            ),
            ToolDef(
                fn=projectpulse_ticket_bulkCreate,
                name="projectpulse_ticket_bulkCreate",
                description="Atomic bulk creation of 1-50 tickets. All succeed or all fail.",
            ),
            ToolDef(
                fn=projectpulse_ticket_search,
                name="projectpulse_ticket_search",
                description=(
                    "Search tickets with 20+ filters: kind, status, priority, sprint, assignee, "
                    "date ranges, hierarchy, labels, free-text search, and pagination."
                ),
            ),
            ToolDef(
                fn=projectpulse_ticket_get,
                name="projectpulse_ticket_get",
                description=(
                    "Get full ticket details. Accepts ticketId (global) or "
                    "ticketNumber+projectId (user-facing #5). Includes comments, hierarchy, custom fields."
                ),
            ),
            ToolDef(
                fn=projectpulse_ticket_update,
                name="projectpulse_ticket_update",
                description="Update ticket fields. Only provided fields are changed. Supports dual-ID.",
            ),
            ToolDef(
                fn=projectpulse_ticket_setStatus,
                name="projectpulse_ticket_setStatus",
                description="Change ticket workflow status: backlog, todo, in-progress, in-review, done.",
            ),
            ToolDef(
                fn=projectpulse_ticket_addComment,
                name="projectpulse_ticket_addComment",
                description="Add a comment or progress note to a ticket. Supports dual-ID.",
            ),
            ToolDef(
                fn=projectpulse_ticket_getChildren,
                name="projectpulse_ticket_getChildren",
                description="Get paginated children of a feature/epic ticket with optional status filter.",
            ),
            ToolDef(
                fn=projectpulse_ticket_getHierarchy,
                name="projectpulse_ticket_getHierarchy",
                description="Get complete hierarchy context: parent, children, siblings, and status counts.",
            ),
            # --- Phase 4: Kanban tools ---
            ToolDef(
                fn=projectpulse_kanban_getBoard,
                name="projectpulse_kanban_getBoard",
                description=(
                    "Get complete kanban board for a sprint (5 columns). "
                    "Returns tickets grouped by column with ghost cards and statistics. "
                    "Get sprintId from sprint_getCurrentPosition."
                ),
            ),
            ToolDef(
                fn=projectpulse_kanban_moveTicket,
                name="projectpulse_kanban_moveTicket",
                description=(
                    "Move ticket between kanban columns. Auto-cascades progress to parent sprint/phase. "
                    "Columns: backlog, todo, in-progress, in-review, done."
                ),
            ),
            # --- Phase 5: Knowledge tools (core) ---
            ToolDef(fn=projectpulse_knowledge_search, name="projectpulse_knowledge_search",
                    description="Search knowledge base with semantic, fulltext, or hybrid search modes."),
            ToolDef(fn=projectpulse_knowledge_create, name="projectpulse_knowledge_create",
                    description="Create a knowledge item with auto-embedding for semantic search."),
            ToolDef(fn=projectpulse_knowledge_get, name="projectpulse_knowledge_get",
                    description="Get full knowledge item content by ID."),
            ToolDef(fn=projectpulse_knowledge_related, name="projectpulse_knowledge_related",
                    description="Find related knowledge items via graph traversal (1-2 hops)."),
            # --- Phase 5: Wiki tools (core) ---
            ToolDef(fn=projectpulse_wiki_search, name="projectpulse_wiki_search",
                    description="Search wiki pages by title and content with category filter."),
            ToolDef(fn=projectpulse_wiki_get, name="projectpulse_wiki_get",
                    description="Get full wiki page content by path."),
            ToolDef(fn=projectpulse_wiki_create, name="projectpulse_wiki_create",
                    description="Create a new wiki page with category and hierarchy support."),
            ToolDef(fn=projectpulse_wiki_update, name="projectpulse_wiki_update",
                    description="Update wiki page fields with audit trail (changelog, actor)."),
            ToolDef(fn=projectpulse_wiki_analytics_summary, name="projectpulse_wiki_analytics_summary",
                    description="Get wiki analytics: top pages, trending tags, helpful ratio."),
            # --- Phase 5: Resource tools (core) ---
            ToolDef(fn=projectpulse_persona_list, name="projectpulse_persona_list",
                    description="List available agent personas (metadata only)."),
            ToolDef(fn=projectpulse_persona_get, name="projectpulse_persona_get",
                    description="Get full persona with systemPrompt, skills, tools, and rules. Use id or slug."),
            ToolDef(fn=projectpulse_skill_list, name="projectpulse_skill_list",
                    description="List skills (metadata). Filter by category, tags, frameworks."),
            ToolDef(fn=projectpulse_skill_get, name="projectpulse_skill_get",
                    description="Get full skill content with code patterns and examples. Use slug."),
            ToolDef(fn=projectpulse_sop_list, name="projectpulse_sop_list",
                    description="List SOPs (metadata). Filter by category."),
            ToolDef(fn=projectpulse_sop_get, name="projectpulse_sop_get",
                    description="Get full SOP with step-by-step procedures and checklists. Use id or slug."),
            # --- Phase 6: Roadmap tools (core) ---
            ToolDef(fn=projectpulse_sprint_getCurrentPosition, name="projectpulse_sprint_getCurrentPosition",
                    description="Get current position in roadmap: active phase, sprint, week, day with Kanban URL."),
            ToolDef(fn=projectpulse_roadmap_getPhaseProgress, name="projectpulse_roadmap_getPhaseProgress",
                    description="Get full phase progress tree with nested sprints/weeks/days (90% token reduction)."),
            # --- Phase 6: Sprint tools (core) ---
            ToolDef(fn=projectpulse_sprint_queryHierarchy, name="projectpulse_sprint_queryHierarchy",
                    description="Query phase/sprint hierarchy with status filters."),
            ToolDef(fn=projectpulse_sprint_updateProgress, name="projectpulse_sprint_updateProgress",
                    description="Update sprint/phase progress (0-100). Auto-propagates to parent."),
            # --- Phase 6: Workflow tools (core) ---
            ToolDef(fn=projectpulse_workflow_list, name="projectpulse_workflow_list",
                    description="List workflow templates. Filter by category: development, project-management, knowledge."),
            ToolDef(fn=projectpulse_workflow_start, name="projectpulse_workflow_start",
                    description="Start a new workflow run from a template."),
            ToolDef(fn=projectpulse_workflow_executeStep, name="projectpulse_workflow_executeStep",
                    description="Execute the current workflow step and advance to the next."),
            ToolDef(fn=projectpulse_workflow_getStatus, name="projectpulse_workflow_getStatus",
                    description="Get detailed workflow run status with current step."),
            ToolDef(fn=projectpulse_workflow_pause, name="projectpulse_workflow_pause",
                    description="Pause workflow run and create checkpoint for recovery."),
            ToolDef(fn=projectpulse_workflow_resume, name="projectpulse_workflow_resume",
                    description="Resume paused workflow from checkpoint."),
            ToolDef(fn=projectpulse_workflow_complete, name="projectpulse_workflow_complete",
                    description="Mark workflow completed or failed with optional summary."),
            # --- Phase 6: Backlog tools (core) ---
            ToolDef(fn=projectpulse_backlog_list, name="projectpulse_backlog_list",
                    description="List all backlog items. Filter by epicRef."),
            ToolDef(fn=projectpulse_backlog_getBySprint, name="projectpulse_backlog_getBySprint",
                    description="Get backlog items for a specific sprint with traceability."),
        ],
        "onboarding": [
            ToolDef(fn=projectpulse_onboarding_getPrompt, name="projectpulse_onboarding_getPrompt",
                    description="Get onboarding template prompt for a specific session (1-3)."),
            ToolDef(fn=projectpulse_onboarding_submitResponse, name="projectpulse_onboarding_submitResponse",
                    description="Submit onboarding response and get next session info."),
            ToolDef(fn=projectpulse_onboarding_getPhasedQuestions, name="projectpulse_onboarding_getPhasedQuestions",
                    description="Get questions for a Session 1 planning phase (1-10)."),
            ToolDef(fn=projectpulse_onboarding_savePhase, name="projectpulse_onboarding_savePhase",
                    description="Save answers for a Session 1 planning phase."),
            ToolDef(fn=projectpulse_onboarding_getExecutiveSummaryPrompt, name="projectpulse_onboarding_getExecutiveSummaryPrompt",
                    description="Get prompt with all 96 answers for generating executive summary."),
            ToolDef(fn=projectpulse_onboarding_storeExecutiveSummary, name="projectpulse_onboarding_storeExecutiveSummary",
                    description="Store agent-generated executive summary. Completes Session 1."),
            ToolDef(fn=projectpulse_onboarding_finalizeSummary, name="projectpulse_onboarding_finalizeSummary",
                    description="Generate and finalize executive summary from all 96 Q&As."),
            ToolDef(fn=projectpulse_onboarding_checkTokenBudget, name="projectpulse_onboarding_checkTokenBudget",
                    description="Check if operation fits within the 200K token budget."),
            ToolDef(fn=projectpulse_onboarding_getDocBatchPrompt, name="projectpulse_onboarding_getDocBatchPrompt",
                    description="Get prompts for a batch of 4-5 documents (Session 2)."),
            ToolDef(fn=projectpulse_onboarding_storeBatch, name="projectpulse_onboarding_storeBatch",
                    description="Bulk store 1-5 agent-generated documents (Session 2)."),
            ToolDef(fn=projectpulse_onboarding_getBootstrapPrompt, name="projectpulse_onboarding_getBootstrapPrompt",
                    description="Get prompt for parsing Project Plan into JSON hierarchy (Session 3)."),
            ToolDef(fn=projectpulse_onboarding_syncSession3, name="projectpulse_onboarding_syncSession3",
                    description="Sync Session 3 completion: count artifacts, mark complete."),
            ToolDef(fn=projectpulse_blueprint_get, name="projectpulse_blueprint_get",
                    description="Get Session 3 blueprint: project context, tech stack, roadmap, budget."),
        ],
        "admin": [
            # Knowledge admin tools
            ToolDef(fn=projectpulse_knowledge_export, name="projectpulse_knowledge_export",
                    description="Export all knowledge items in JSON or Markdown format."),
            ToolDef(fn=projectpulse_knowledge_import, name="projectpulse_knowledge_import",
                    description="Bulk import knowledge items with optional overwrite."),
            ToolDef(fn=projectpulse_knowledge_archive, name="projectpulse_knowledge_archive",
                    description="Archive or unarchive a knowledge item (soft delete)."),
            ToolDef(fn=projectpulse_knowledge_metrics, name="projectpulse_knowledge_metrics",
                    description="Get knowledge base metrics: usage stats, popular queries."),
            # Roadmap admin tools
            ToolDef(fn=projectpulse_roadmap_create, name="projectpulse_roadmap_create",
                    description="Create roadmap with phases/sprints, auto-materialize to DB records."),
            ToolDef(fn=projectpulse_roadmap_materialize, name="projectpulse_roadmap_materialize",
                    description="Materialize roadmap JSON to Phase/Sprint database records."),
            ToolDef(fn=projectpulse_roadmap_delete, name="projectpulse_roadmap_delete",
                    description="Cascade-delete roadmap and all materialized phases/sprints/weeks/days."),
            # Sprint admin tool
            ToolDef(fn=projectpulse_sprint_phase_create, name="projectpulse_sprint_phase_create",
                    description="Create a new phase with auto-generated weeks."),
            # Batch tools (Phase 7)
            ToolDef(fn=projectpulse_batch_createAgentPersonas, name="projectpulse_batch_createAgentPersonas",
                    description="Bulk create 1-10 agent personas atomically."),
            ToolDef(fn=projectpulse_batch_createSkills, name="projectpulse_batch_createSkills",
                    description="Bulk create 1-10 skills atomically."),
            ToolDef(fn=projectpulse_batch_createWorkflowTemplates, name="projectpulse_batch_createWorkflowTemplates",
                    description="Bulk create 1-10 workflow templates atomically."),
            ToolDef(fn=projectpulse_batch_createSOPs, name="projectpulse_batch_createSOPs",
                    description="Bulk create 1-10 SOPs atomically."),
        ],
        "utility": [
            ToolDef(fn=projectpulse_wiki_generate, name="projectpulse_wiki_generate",
                    description="Auto-generate wiki pages from JSDoc/docstring comments."),
            ToolDef(fn=projectpulse_traceability_generate, name="projectpulse_traceability_generate",
                    description="Generate traceability coverage matrix from ticket backlogRefs."),
            ToolDef(fn=projectpulse_traceability_validate_documents, name="projectpulse_traceability_validate_documents",
                    description="Validate PRD→SRS→Backlog→Plan document traceability."),
            ToolDef(fn=projectpulse_repo_writeMinimal, name="projectpulse_repo_writeMinimal",
                    description="Generate CLAUDE.md and AGENTS.md workflow guides for a repository."),
        ],
        "observability": [
            ToolDef(fn=projectpulse_observability_logStep, name="projectpulse_observability_logStep",
                    description="Log agent action/step with metadata for audit trails."),
            ToolDef(fn=projectpulse_observability_completeSession, name="projectpulse_observability_completeSession",
                    description="Mark observability session completed with quality/validation report."),
        ],
    }
