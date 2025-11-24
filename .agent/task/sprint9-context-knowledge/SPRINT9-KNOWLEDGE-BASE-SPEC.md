# Sprint 9 – Knowledge Base Integration Specification (EPIC-004 slice)

**Project:** ProjectPulse  
**Sprint:** Sprint 9 – Context Management & Knowledge Base Integration  
**Epic:** EPIC-004 – Knowledge (slice only: agent-first write + RAG/graph-powered retrieval)

This document narrows the Knowledge epic down to a concrete, shippable slice for Sprint 9 that complements Memory Banks and respects the deferral of Research Agent Orchestration (EPIC-011).

---

## 1. Objectives

- Make the existing Knowledge Base fully usable by agents via MCP tools (external MCP server), without additional human-editable UI complexity.
- Ensure Knowledge search and graph traversal are **project-scoped**, performant, and token-efficient.
- Clarify agent-only write semantics and update `/knowledge` UI to reflect reality.

---

## 2. Current State (High-Level)

Already implemented (from prior analysis):

- **UI:**
  - `/knowledge` page at `apps/web/app/knowledge/page.tsx` displays Knowledge cards with search, tag filters, and sorting.
  - Components in `apps/web/components/knowledge/` (e.g. ArticleCard, SearchBar, TagFilter) support a rich browsing experience.

- **Backend & search:**
  - `apps/web/lib/knowledge/search.ts` – semantic, full-text, and hybrid search using pgvector + tsvector.
  - `apps/web/lib/knowledge/graph.ts` – Knowledge graph traversal (relationships, hop depth, scoring).
  - `apps/web/lib/knowledge/create.ts` – Knowledge creation with embeddings and duplicate detection.
  - `apps/web/lib/knowledge/deduplication.ts` – additional duplicate handling.
  - `apps/web/app/api/knowledge/route.ts` – Knowledge creation API.
  - `apps/web/app/api/knowledge/export/route.ts` – knowledge graph export API.

- **MCP within Next.js app:**
  - `apps/web/lib/mcp/handlers/knowledge-handler.ts` – MCP handlers for knowledge.search, knowledge.create, knowledge.related, knowledge.export, knowledge.import, knowledge.archive, knowledge.getMetrics.
  - `apps/web/lib/mcp/resources/knowledge-resource.ts` – MCP resources for listing/reading knowledge items (knowledge:// URIs).

- **Gaps discovered earlier:**
  - External MCP server (`apps/mcp-server`) does **not** yet register Knowledge tools for remote agents.
  - `/knowledge` UI does not clearly communicate agent-only write semantics.
  - No dedicated detail page for Knowledge items (which is OK to defer).

Sprint 9 focuses on closing these gaps.

---

## 3. Scope for Sprint 9

### 3.1 External MCP Tools for Knowledge

- Implement Knowledge tools in `apps/mcp-server` that proxy to the existing Next.js HTTP APIs (and underlying services):
  - `knowledge.search` → `GET /api/knowledge/search`
  - `knowledge.create` → `POST /api/knowledge`
  - `knowledge.related` → graph traversal via `findRelatedKnowledgeItems` (exposed either through an internal handler or a small `/api/knowledge/related` helper if needed)
  - `knowledge.export` → `GET /api/knowledge/export`
  - `knowledge.import` → `POST /api/knowledge/import`
  - `knowledge.archive` / unarchive → `PATCH /api/knowledge/[id]/archive` / `DELETE /api/knowledge/[id]/archive`
  - `knowledge.getMetrics` → `GET /api/knowledge/metrics`

- Requirements:
  - Tools must be **discoverable** in the MCP server index with the short names above (e.g. `knowledge.create`).
  - Every `knowledge.*` tool input schema must include a `projectId: number` parameter, and this `projectId` must be forwarded to the corresponding web API (query string or JSON body).
  - Web APIs for Knowledge must accept `projectId` and filter all Prisma queries by it (e.g. `where: { projectId }`) so that results are always project-scoped.
  - Errors and input validation should mirror the web MCP handlers where reasonable.
  - As a future hardening step (post–Sprint 9), the HTTP MCP server can forward the validated `agentAuth.projectId` (from `/api/agent-auth/validate`) to the web app (e.g. via `X-Agent-Project-Id`), and web APIs should assert that `projectId` in the payload matches the token’s project.

### 3.2 Project-Scoped RAG & Graph Queries

- Guarantee that all Knowledge queries invoked via MCP:
  - Are restricted to a single `projectId`.
  - Use the existing pgvector + tsvector + graph traversal logic.
- Targets (from updated Project Plan):
  - P95 latency < 200ms.
  - Token usage < 1,500 tokens/query in typical use.
- Implementation notes:
  - Update `semanticSearch`, `fullTextSearch`, `hybridSearch`, and `findRelatedKnowledgeItems` so they all accept a `projectId` argument and constrain their SQL/Prisma queries to that project.
  - Add metrics collection (if not already present) so `knowledge.getMetrics` can report latency and token usage (as far as observable).
  - Prefer existing observability patterns (logs, DB metrics) instead of inventing new infrastructure.

### 3.3 Agent-Only Write Semantics and UI Alignment

- Treat Knowledge as an **agent-managed resource**:
  - All create/update/archive operations happen via MCP tools in response to agent behavior.
  - Human users browse Knowledge cards but do not directly mutate Knowledge in unsupported ways.

- `/knowledge` UI changes:
  - Keep an "Add Knowledge" (or similar) CTA, but implement it as a **guided flow** that thinly wraps `knowledge.create` with constrained inputs (title, content, category, tags) rather than arbitrary edits.
  - Add inline copy to make it clear that Knowledge is primarily curated by agents; human edits are advanced and go through the same validation as MCP-created items.
  - Ensure search mode toggles and filters align with the modes provided by `knowledge.search`.

- Documentation:
  - Update inline copy or help text to explain:
    - Knowledge items are automatically created/updated by agents.
    - Humans can search and filter but not manually edit arbitrary items.

---

## 4. Non-Goals for Sprint 9

- Building a Knowledge detail route (`/knowledge/[id]`).
- Implementing visual knowledge graph exploration UI.
- Implementing Research Agent orchestration (sub-agents that call knowledge.* in complex patterns) – this belongs to EPIC-011 and is explicitly deferred.

---

## 5. Acceptance Criteria (Knowledge Slice)

The Knowledge Base portion of Sprint 9 is considered complete when:

- External MCP tools for Knowledge are implemented, registered, and tested end-to-end.
- All Knowledge queries are project-scoped and validated.
- Performance goals are met in representative workloads (P95 < 200ms, <1,500 tokens/query).
- `/knowledge` clearly behaves as a read-only Knowledge cards view over agent-managed data, with no misleading edit affordances.
- Behavior and tests are captured in `SPRINT9-TESTING-AND-VALIDATION.md` and verification evidence exists for Step 4.5.
