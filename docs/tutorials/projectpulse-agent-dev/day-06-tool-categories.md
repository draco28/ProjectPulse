# Day 06 — MCP tool categories mapped to product modules (wiki, tickets, workflows, memory, knowledge)

## Goals (what you should understand today)

By the end of Day 06, you should be able to:

1. Explain ProjectPulse MCP tools as **product modules**, not as a flat list.
2. Answer “Where does the real logic live?” for each tool category.
3. Trace a tool name to:
   - the MCP tool implementation file
   - the Next.js API route it calls
   - the backend service module that does the work
4. Describe how tool categories support an agent’s end-to-end workflow:
   - onboarding → memory/session context → plan/tickets → docs/wiki/knowledge → observability

---

## The canonical source: tool registry and folder structure

### Tool registry (authoritative list)

- `apps/mcp-server/src/tools/index.ts`
  - `loadTools()` is the canonical registry used by `tools/list`.

### Tool folder structure (modules)

- `apps/mcp-server/src/tools/`
  - `tickets/`
  - `knowledge/`
  - `workflow/`
  - `memory/`
  - `onboarding/`
  - `agent-session/`
  - `wiki*.ts` (wiki tools live at the root)
  - `roadmap/`
  - `batch/`
  - `observability/`
  - `repo/`
  - `personas/`, `skills/`, `sops/`

---

## Big picture: tool categories and what they map to

Think of MCP tools as “remote control buttons” for each product module.

- **Agent Gateway Layer (MCP)**: `apps/mcp-server/src/tools/**`
- **Backend APIs (Next.js App Router)**: `apps/web/app/api/**/route.ts`
- **Business logic/services**: `apps/web/lib/**`
- **Persistence**: PostgreSQL via Prisma (`apps/web/prisma/schema.prisma`)

---

## Category 1: Wiki tools (project documentation pages)

### MCP tools (agent-facing)

- `projectpulse_wiki_create` → `apps/mcp-server/src/tools/wikiCreate.ts`
- `projectpulse_wiki_search` → `apps/mcp-server/src/tools/wikiSearch.ts`
- `projectpulse_wiki_update` → `apps/mcp-server/src/tools/wikiUpdate.ts`
- `projectpulse_wiki_generate` → `apps/mcp-server/src/tools/wikiGenerate.ts`
- `projectpulse_wiki_analytics_summary` → `apps/mcp-server/src/tools/wikiAnalyticsTopPages.ts`

### Next.js API routes (core backend)

- `POST /api/wiki` + `GET /api/wiki` → `apps/web/app/api/wiki/route.ts`
- `GET /api/wiki/[slug]` + `PATCH /api/wiki/[slug]` → `apps/web/app/api/wiki/[slug]/route.ts`
- `POST /api/wiki/generate` → `apps/web/app/api/wiki/generate/route.ts`
- `GET /api/wiki/analytics/top` → `apps/web/app/api/wiki/analytics/top/route.ts`

### Where the “real work” happens

- Cross-linking + parsing/generation lives under:
  - `apps/web/lib/wiki/**`

Interview wording:

- “Wiki tools are for long-lived, navigable documentation pages stored in the DB, with cross-linking and revision history.”

---

## Category 2: Ticket tools (work items: issues, bugs, epics, tasks)

### MCP tools

- `projectpulse_ticket_create` → `apps/mcp-server/src/tools/tickets/create.ts`
- `projectpulse_ticket_bulkCreate` → `apps/mcp-server/src/tools/tickets/bulkCreate.ts`
- `projectpulse_ticket_update` → `apps/mcp-server/src/tools/tickets/update.ts`
- `projectpulse_ticket_search` → `apps/mcp-server/src/tools/tickets/search.ts`
- `projectpulse_ticket_addComment` → `apps/mcp-server/src/tools/tickets/addComment.ts`
- `projectpulse_ticket_setStatus` → `apps/mcp-server/src/tools/tickets/setStatus.ts`

### Next.js API routes

- `GET /api/tickets` + `POST /api/tickets` → `apps/web/app/api/tickets/route.ts`
- `POST /api/tickets/bulk` → `apps/web/app/api/tickets/bulk/route.ts`
- `PATCH /api/tickets/[id]` → `apps/web/app/api/tickets/[id]/route.ts`
- `POST /api/tickets/[id]/comments` → `apps/web/app/api/tickets/[id]/comments/route.ts`
- `PATCH /api/tickets/[id]/status` → `apps/web/app/api/tickets/[id]/status/route.ts`

### Where the “real work” happens

- Ticket filtering/validation utilities live under:
  - `apps/web/lib/validations/ticket.ts`
  - `apps/web/app/api/tickets/_utils.ts` (route-level query building)

Interview wording:

- “Tickets are the unified work item model. Issues are represented as `kind='issue'`, so agents use ticket tools for all work tracking.”

---

## Category 3: Knowledge tools (RAG store + retrieval APIs)

### MCP tools

- `projectpulse_knowledge_search` → `apps/mcp-server/src/tools/knowledge/searchTool.ts`
- `projectpulse_knowledge_create` → `apps/mcp-server/src/tools/knowledge/createTool.ts`
- `projectpulse_knowledge_export` → `apps/mcp-server/src/tools/knowledge/exportTool.ts`
- `projectpulse_knowledge_import` → `apps/mcp-server/src/tools/knowledge/importTool.ts`
- `projectpulse_knowledge_archive` → `apps/mcp-server/src/tools/knowledge/archiveTool.ts`
- `projectpulse_knowledge_metrics` → `apps/mcp-server/src/tools/knowledge/metricsTool.ts`
- `projectpulse_knowledge_related` → `apps/mcp-server/src/tools/knowledge/relatedTool.ts`

### Next.js API routes

- `GET /api/knowledge` + `POST /api/knowledge` → `apps/web/app/api/knowledge/route.ts`
- `GET /api/knowledge/search` → `apps/web/app/api/knowledge/search/route.ts`
- `GET /api/knowledge/related` → `apps/web/app/api/knowledge/related/route.ts`
- `PATCH /api/knowledge/[id]/archive` → `apps/web/app/api/knowledge/[id]/archive/route.ts`
- `GET /api/knowledge/export` → `apps/web/app/api/knowledge/export/route.ts`
- `POST /api/knowledge/import` → `apps/web/app/api/knowledge/import/route.ts`
- `GET /api/knowledge/metrics` → `apps/web/app/api/knowledge/metrics/route.ts`

### Where the “real work” happens

- Creation + embeddings + dedup:
  - `apps/web/lib/knowledge/create.ts`
  - `apps/web/lib/embeddings/index.ts`
- Graph traversal:
  - `apps/web/lib/knowledge/graph.ts`

Interview wording:

- “Knowledge is the RAG substrate. Retrieval is implemented server-side (search + graph traversal); generation happens in the agent.”

---

## Category 4: Workflow tools (workflow templates + workflow runs)

### MCP tools

- `projectpulse_workflow_list` → `apps/mcp-server/src/tools/workflow/list.ts`
- `projectpulse_workflow_start` → `apps/mcp-server/src/tools/workflow/start.ts`
- `projectpulse_workflow_executeStep` → `apps/mcp-server/src/tools/workflow/executeStep.ts`
- `projectpulse_workflow_getStatus` → `apps/mcp-server/src/tools/workflow/getStatus.ts`
- `projectpulse_workflow_pause` → `apps/mcp-server/src/tools/workflow/pause.ts`
- `projectpulse_workflow_resume` → `apps/mcp-server/src/tools/workflow/resume.ts`
- `projectpulse_workflow_complete` → `apps/mcp-server/src/tools/workflow/complete.ts`

### Next.js API routes

- `GET /api/workflows` → `apps/web/app/api/workflows/route.ts`
- `POST /api/workflows/run` → `apps/web/app/api/workflows/run/route.ts`
- `GET /api/workflows/run/[id]` → `apps/web/app/api/workflows/run/[id]/route.ts`
- `POST /api/workflows/run/[id]/step` → `apps/web/app/api/workflows/run/[id]/step/route.ts`

Notes you should be able to say:

- Some workflow tools reference checkpoints endpoints (e.g. `/api/checkpoints`) for pause/resume context; those are integration hooks.

---

## Category 5: Roadmap + hierarchy tools (planning structure)

### MCP tools

- `projectpulse_roadmap_create` → `apps/mcp-server/src/tools/roadmap/createTool.ts`
- `projectpulse_roadmap_materialize` → `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
- `projectpulse_sprint_getCurrentPosition` → `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts`
- `projectpulse_roadmap_getPhaseProgress` → `apps/mcp-server/src/tools/roadmap/getPhaseProgressTool.ts`

Also related “sprint utilities”:

- `projectpulse_sprint_queryHierarchy` → `apps/mcp-server/src/tools/sprintQueryHierarchy.ts`
- `projectpulse_sprint_updateProgress` → `apps/mcp-server/src/tools/sprintUpdateProgress.ts`

### Next.js API routes

- `GET /api/roadmap` + `POST /api/roadmap` → `apps/web/app/api/roadmap/route.ts`
- `POST /api/roadmap/[id]/materialize` → `apps/web/app/api/roadmap/[id]/materialize/route.ts`
- `GET /api/roadmap/phases/[id]/progress` → `apps/web/app/api/roadmap/phases/[id]/progress/route.ts`
- `GET /api/hierarchy/query` → `apps/web/app/api/hierarchy/query/route.ts`

Important nuance (interview-safe):

- Roadmap materialization has both:
  - an API-driven path (`/api/roadmap/[id]/materialize`)
  - a tool that calls a shared package and DB directly (`apps/mcp-server/src/tools/roadmap/materializeTool.ts`)

If asked about it:

- “Most tools proxy to APIs; roadmap materialization is a special-case where a shared package is used to create the hierarchy records.”

---

## Category 6: Onboarding tools (3-session project initialization)

### MCP tools (selected)

- Session prompts + responses:
  - `projectpulse_onboarding_getPrompt` → `apps/mcp-server/src/tools/onboarding/getPrompt.ts`
  - `projectpulse_onboarding_submitResponse` → `apps/mcp-server/src/tools/onboarding/submitResponse.ts`
- Session 1 (executive summary storage):
  - `projectpulse_onboarding_storeExecutiveSummary` → `apps/mcp-server/src/tools/onboarding/storeExecutiveSummaryTool.ts`
- Session 2 (documents):
  - `projectpulse_onboarding_getDocBatchPrompt` → `apps/mcp-server/src/tools/onboarding/getDocBatchPromptTool.ts`
  - `projectpulse_onboarding_storeDocument` → `apps/mcp-server/src/tools/onboarding/storeDocumentTool.ts`
  - `projectpulse_onboarding_storeBatch` → `apps/mcp-server/src/tools/onboarding/storeBatchTool.ts`
- Session 3 (bootstrap):
  - legacy: `projectpulse_onboarding_bootstrap` → `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
  - refactor helpers:
    - `projectpulse_onboarding_getBootstrapPrompt` → `apps/mcp-server/src/tools/onboarding/getBootstrapPromptTool.ts`
    - batch create tools (see Category 7)
- Token budgeting:
  - `projectpulse_onboarding_checkTokenBudget` → `apps/mcp-server/src/tools/onboarding/checkTokenBudgetTool.ts`

### Next.js API routes (core backend)

Examples referenced directly in tool code:

- `GET /api/onboarding/prompt` (prompt template)
- `POST /api/onboarding/responses` (store responses)
- `POST /api/onboarding/executive-summary`
- `GET /api/onboarding/doc-batch`
- `POST /api/onboarding/documents`
- `POST /api/onboarding/documents/batch`
- `GET /api/onboarding/bootstrap-prompt`
- `POST /api/onboarding/bootstrap`
- `POST /api/onboarding/token-budget`

All live under:

- `apps/web/app/api/onboarding/**`

Interview wording:

- “Onboarding is a structured agent workflow that writes project context and docs into the database so later tools (tickets/wiki/knowledge) have grounded context.”

---

## Category 7: Batch create tools (bootstrap accelerators)

### MCP tools

- `projectpulse_batch_createAgentPersonas` → `apps/mcp-server/src/tools/batch/createAgentPersonaBatchTool.ts`
- `projectpulse_batch_createSkills` → `apps/mcp-server/src/tools/batch/createSkillBatchTool.ts`
- `projectpulse_batch_createWorkflowTemplates` → `apps/mcp-server/src/tools/batch/createWorkflowTemplateBatchTool.ts`
- `projectpulse_batch_createSOPs` → `apps/mcp-server/src/tools/batch/createSOPBatchTool.ts`

### Next.js API routes

- `POST /api/batch/agent-personas` → `apps/web/app/api/batch/agent-personas/route.ts`
- `POST /api/batch/skills` → `apps/web/app/api/batch/skills/route.ts`
- `POST /api/batch/workflow-templates` → `apps/web/app/api/batch/workflow-templates/route.ts`
- `POST /api/batch/sops` → `apps/web/app/api/batch/sops/route.ts`

---

## Category 8: Memory tools (token-efficient context management)

### MCP tools

- `projectpulse_memory_sessionStart` → `apps/mcp-server/src/tools/memory/sessionStartTool.ts`
- `projectpulse_memory_patternLookup` → `apps/mcp-server/src/tools/memory/patternLookupTool.ts`
- `projectpulse_memory_contextRecovery` → `apps/mcp-server/src/tools/memory/contextRecoveryTool.ts`

### Next.js API routes

- `GET /api/memory/session-start` → `apps/web/app/api/memory/session-start/route.ts`
- `GET /api/memory/pattern-lookup` → `apps/web/app/api/memory/pattern-lookup/route.ts`
- `GET /api/memory/context-recovery` → `apps/web/app/api/memory/context-recovery/route.ts`

Where the data lives:

- `MemoryBank` model in `apps/web/prisma/schema.prisma`

---

## Category 9: Client agent integration data APIs (personas, skills, SOPs)

These tools let an agent discover and load “expert modules” on demand.

### MCP tools

- Personas:
  - `projectpulse_persona_list` → `apps/mcp-server/src/tools/personas/listTool.ts`
  - `projectpulse_persona_get` → `apps/mcp-server/src/tools/personas/getTool.ts`
- Skills:
  - `projectpulse_skill_list` → `apps/mcp-server/src/tools/skills/listTool.ts`
  - `projectpulse_skill_get` → `apps/mcp-server/src/tools/skills/getTool.ts`
- SOPs:
  - `projectpulse_sop_list` → `apps/mcp-server/src/tools/sops/listTool.ts`
  - `projectpulse_sop_get` → `apps/mcp-server/src/tools/sops/getTool.ts`

### Next.js API routes

- Personas:
  - `GET /api/personas` → `apps/web/app/api/personas/route.ts`
  - `GET /api/personas/[id]` → `apps/web/app/api/personas/[id]/route.ts`
  - `GET /api/personas/by-slug/[slug]` → `apps/web/app/api/personas/by-slug/[slug]/route.ts`
- Skills:
  - `GET /api/skills` → `apps/web/app/api/skills/route.ts`
  - `GET /api/skills/[slug]` → `apps/web/app/api/skills/[slug]/route.ts`
- SOPs:
  - `GET /api/sops` → `apps/web/app/api/sops/route.ts`
  - `GET /api/sops/by-id/[id]` → `apps/web/app/api/sops/by-id/[id]/route.ts`
  - `GET /api/sops/by-slug/[slug]` → `apps/web/app/api/sops/by-slug/[slug]/route.ts`

---

## Category 10: Agent session tools (work tracking)

These tools are about tracking the agent’s implementation session (plan/todos/progress).

### MCP tools

- `projectpulse_agent_session_start` → `apps/mcp-server/src/tools/agent-session/startTool.ts`
- `projectpulse_agent_session_update` → `apps/mcp-server/src/tools/agent-session/updateTool.ts`
- `projectpulse_agent_session_end` → `apps/mcp-server/src/tools/agent-session/endTool.ts`

### Next.js API routes

- `POST /api/agent-sessions` → `apps/web/app/api/agent-sessions/route.ts`
- `PATCH /api/agent-sessions/[id]` → `apps/web/app/api/agent-sessions/[id]/route.ts`
- `POST /api/agent-sessions/[id]/end` → `apps/web/app/api/agent-sessions/[id]/end/route.ts`

---

## Category 11: Observability + repo write tools (meta-operations)

### MCP tools

- Observability:
  - `projectpulse_observability_logStep` → `apps/mcp-server/src/tools/observability/logStepTool.ts`
  - `projectpulse_observability_completeSession` → `apps/mcp-server/src/tools/observability/completeSessionTool.ts`
- Repo write:
  - `projectpulse_repo_writeMinimal` → `apps/mcp-server/src/tools/repo/writeMinimalTool.ts`

### Next.js API routes

- `POST /api/observability/log-step` → `apps/web/app/api/observability/log-step/route.ts`
- `POST /api/observability/complete-session` → `apps/web/app/api/observability/complete-session/route.ts`
- `POST /api/repo/write-minimal` → `apps/web/app/api/repo/write-minimal/route.ts`

---

## How to explain this quickly in interviews (30 seconds)

- “Tools are grouped by product module: tickets (work tracking), wiki (docs), knowledge (RAG), workflows (procedural automation), roadmap/hierarchy (planning), onboarding/memory (context bootstrap + token efficiency), and observability (analytics/QA). Each tool is a thin adapter in `apps/mcp-server` that proxies to a Next.js API route where the real authorization and business logic lives.”

---

## Exercises (do later)

### Exercise A: Map one tool end-to-end

Pick one tool from each category and write:

- tool name
- MCP file path
- Next.js API path
- one sentence: “what data is created/updated?”

### Exercise B: Design a new tool category

Propose a new category (e.g., “code health scanning”) and specify:

- 3 tool names (consistent naming)
- the corresponding `apps/web/app/api/**` endpoints
- where the DB schema would live

---

## Completion checklist

- [ ] I can explain the main tool categories without listing 70 tools.
- [ ] I can answer where business logic lives for each category.
- [ ] I can name the top 3 tool categories used in a typical agent workflow.

Next: Day 07 — RAG & Knowledge Graph implementation deep dive (schema + embeddings + search + traversal)
