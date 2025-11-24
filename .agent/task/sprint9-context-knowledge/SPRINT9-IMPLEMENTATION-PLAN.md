# Sprint 9 – Context & Knowledge – Implementation Plan

**Project:** ProjectPulse  
**Sprint:** Sprint 9 (Phase E) – Context Management & Knowledge Base Integration  
**Goal:** Deliver Memory Bank System (EPIC-010) and agent-first Knowledge Base integration (EPIC-004 slice) while deferring Research Agent Orchestration (EPIC-011) to Sprints 10–11.

This plan mirrors the structure used for the onboarding refactor and auth-dashboard plans: phase-based, execution-focused, and tightly aligned with docs/13-Project-Plan.md and docs/12-Backlog.md.

---

## Phase 0 – Docs & Alignment

**Objective:** Establish a dedicated Sprint 9 spec space and align scope with planning docs.

Tasks:
- [x] Create `.agent/task/sprint9-context-knowledge/` folder.
- [x] Add:
  - `SPRINT9-OVERVIEW.md` (this sprint’s goals and boundaries).
  - `SPRINT9-IMPLEMENTATION-PLAN.md` (this file).
  - `SPRINT9-MEMORY-BANK-SPEC.md` (detailed EPIC-010 behavior).
  - `SPRINT9-KNOWLEDGE-BASE-SPEC.md` (detailed Knowledge Base slice behavior).
  - `SPRINT9-TESTING-AND-VALIDATION.md` (test matrix and verification gate).
  - `SPRINT9-STATUS.md` (live status tracker).
  - `SPRINT9-FINAL-SUMMARY.md` (to be filled after completion).
- [x] Confirm docs alignment:
  - `docs/13-Project-Plan.md` shows Sprint 9 as “Context Management & Knowledge Base Integration” and moves EPIC-011 to Sprints 10–11.
  - `docs/12-Backlog.md` reflects EPIC-011 as post-MVP (Sprints 10–11) and keeps EPIC-010 in Sprint 9.

Exit criteria:
- Scope, goals, and dependencies clearly documented.
- Sprint 9 spec folder exists and is the single source of truth for this sprint’s implementation plan.

---

## Phase 1 – Memory Bank Schema & Persistence (EPIC-010)

**Objective:** Implement DB schema and basic persistence for the 5 Memory Bank types.

Tasks:
- [ ] Define a `MemoryBank` Prisma model in `apps/web/prisma/schema.prisma`:
  - `id Int @id @default(autoincrement())`
  - `projectId Int` (FK → Project)
  - `type` (string or enum: PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS)
  - `content String @db.Text` (Markdown bank content)
  - `summaryTokens Int?` (optional cached token estimate)
  - `createdAt` / `updatedAt` timestamps and `@@unique([projectId, type])`.
- [ ] Update `docs/02-DATABASE-SCHEMA.md` to mirror the new `MemoryBank` model, treating `schema.prisma` as the source of truth.
- [ ] Implement a small "system MemoryBank templates" helper (e.g. `cloneMemoryBanks(projectId)`), modelled after `cloneWikiTemplates`, and store template banks in the existing System Project.
- [ ] Wire `cloneMemoryBanks` into `POST /api/projects` so that every new project gets all 5 MemoryBank rows at creation time.
- [ ] Run migrations and regenerate client in `apps/web`:
  - `pnpm prisma migrate dev --name memory-bank-system`
  - `pnpm prisma generate`

Exit criteria:
- Prisma schema compiles and migrations run cleanly.
- Memory Bank tables exist in the DB and can be queried via Prisma.

---

## Phase 2 – Memory Bank MCP Workflows (Session Start, Pattern Lookup, Recovery)

**Objective:** Implement the three core workflows from EPIC-010 and expose them as MCP tools for agents.

Tasks:
- [ ] Define Memory Bank service layer in `apps/web/lib/memory/` (directory name TBD but consistent with docs):
  - Functions for reading/writing each Memory Bank type for a project.
  - Aggregation helpers for session start payloads.
- [ ] Implement or extend MCP tools for Memory Banks (as specified in PRD FR-146–153):
  - Session start loading workflow (load 5 banks into a compact structure ≤10K tokens).
  - Pattern lookup workflow (search within system-patterns / tech-context ≤1K tokens).
  - Context recovery workflow (reconstruct active-context + progress ≤6K tokens).
- [ ] Integrate workflows into the existing onboarding/roadmap MCP tools where appropriate, without breaking current behavior.
- [ ] Ensure all Memory Bank operations are project-scoped and validate `projectId`.

Exit criteria:
- All three workflows implemented and callable via MCP tools.
- Measured token usage meets EPIC-010 targets.

---

## Phase 3 – Knowledge MCP Integration (External MCP Server)

**Objective:** Expose Knowledge Base functionality to external agents via the dedicated MCP server, reusing existing web APIs and handlers.

Tasks:
- [ ] Inventory existing Knowledge handlers in the Next.js app:
  - `apps/web/lib/mcp/handlers/knowledge-handler.ts`.
  - `apps/web/lib/knowledge/*.ts` (search, graph, create, deduplication, export/import, archive).
- [ ] In `apps/mcp-server`, add `knowledge.*` tools that proxy to the web APIs:
  - `knowledge.search` → `GET /api/knowledge/search` (include `projectId` and query params).
  - `knowledge.create` → `POST /api/knowledge` (body includes `projectId`, title, content, category, tags).
  - `knowledge.related` → call into the graph service (and/or a small helper route) with `projectId`.
  - `knowledge.export` / `knowledge.import` → `/api/knowledge/export` and `/api/knowledge/import`.
  - `knowledge.archive` / unarchive → `/api/knowledge/[id]/archive` (PATCH/DELETE).
  - `knowledge.getMetrics` → `GET /api/knowledge/metrics`.
- [ ] Ensure every `knowledge.*` MCP tool input schema includes a `projectId: number` and that this `projectId` is forwarded to the corresponding web API.
- [ ] Update Knowledge services and APIs so all queries are project-scoped:
  - Thread `projectId` through `semanticSearch`, `fullTextSearch`, `hybridSearch`, and `findRelatedKnowledgeItems` and filter queries by `projectId`.
  - Require `projectId` in the relevant `/api/knowledge/*` handlers and add `where: { projectId }` to Prisma calls.
- [ ] Register the new tools in the MCP server index so external clients can discover them.
- [ ] Document a future hardening step (post–Sprint 9): propagate the validated `agentAuth.projectId` from the HTTP MCP server to web APIs (e.g. header) and assert that request `projectId` matches the token’s `projectId`.

Exit criteria:
- External MCP tools for Knowledge are available and correctly call the Next.js APIs.
- Basic end-to-end tests from external client → MCP tools → web APIs → DB pass.

---

## Phase 4 – Knowledge Base UI Alignment & Metrics

**Objective:** Ensure `/knowledge` UI accurately represents the agent-managed Knowledge Base and surface key metrics.

Tasks:
- [ ] Review existing `/knowledge` page and components under `apps/web/app/knowledge/` and `apps/web/components/knowledge/`.
- [ ] Align UI semantics with agent-only writes:
  - Confirm or adjust the "Add Knowledge" button and related CTAs to match actual behavior (e.g. explain that Knowledge is agent-managed, or trigger a vetted creation flow that mirrors MCP inputs).
  - Ensure users cannot bypass agents to create/edit Knowledge items in unsupported ways.
- [ ] Ensure filters, search mode toggles, and sorting match how agents query via MCP tools (hybrid/semantic/full-text modes).
- [ ] Add minimal metrics surface (if appropriate) to confirm Knowledge usage and performance, backed by `knowledge.getMetrics`.

Exit criteria:
- `/knowledge` behaves as a consistent read-only Knowledge cards view over agent-managed data.
- UI copy matches actual capabilities (no misleading edit affordances).

---

## Phase 5 – Testing, Verification Gate (Step 4.5) & Deployment

**Objective:** Validate Memory Banks + Knowledge Base integration end-to-end, meet performance and security targets, and capture evidence for the verification gate.

Tasks:
- [ ] Implement tests defined in `SPRINT9-TESTING-AND-VALIDATION.md`:
  - Unit/integration tests for Memory Bank services and MCP tools.
  - Unit/integration tests for Knowledge MCP tools and APIs.
  - E2E scenarios combining Memory Bank loading + Knowledge queries in realistic agent workflows.
- [ ] Measure performance:
  - Token budgets for session start, pattern lookup, and context recovery.
  - Latency and token usage for Knowledge queries via MCP (P95 < 200ms, <1,500 tokens/query).
- [ ] Run TypeScript checks and linting:
  - `pnpm lint`
  - `pnpm type-check`
- [ ] Run relevant test suites:
  - `pnpm test` (or targeted test commands per test plan).
- [ ] Capture verification evidence per Step 4.5 protocol:
  - DB checks: confirm Memory Banks and Knowledge items exist and are linked to the correct project.
  - Logs: summarize test runs and performance measurements.
  - Update `SPRINT9-STATUS.md` and `SPRINT9-FINAL-SUMMARY.md` with outcomes and any deviations.

Exit criteria:
- All planned tests pass or deviations are explicitly documented and accepted.
- Verification evidence is stored under `.agent/task/sprint9-context-knowledge/`.
- Sprint 9 can be marked complete without violating the mandatory session protocol.

---

## 6. Completion Definition

Sprint 9 is considered **complete** when:

- Phases 1–5 exit criteria are all satisfied.
- Memory Bank System (EPIC-010) is implemented, tested, and meets its token efficiency goals.
- Knowledge Base integration slice (EPIC-004) is implemented, tested, and exposes agent-first Knowledge via MCP with required performance and scoping.
- EPIC-011 Research Agent Orchestration remains deferred and is not partially implemented in a way that complicates future work.
- `SPRINT9-FINAL-SUMMARY.md` is updated with test results, metrics, and lessons learned.
