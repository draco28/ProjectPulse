# Sprint 9 – Testing & Validation (Memory Banks + Knowledge Base)

**Project:** ProjectPulse  
**Sprint:** Sprint 9 – Context Management & Knowledge Base Integration

This document defines the test strategy and concrete checks for the Sprint 9 work. It mirrors the structure used in the onboarding refactor and auth-dashboard testing docs, and explicitly supports the Step 4.5 verification gate.

---

## 1. Test Suites

### 1.1 Unit / Integration – Memory Banks (EPIC-010)

- **Schema & basic CRUD**
  - Prisma models for Memory Banks compile and migrate successfully.
  - Newly created projects automatically receive all 5 bank types via the system MemoryBank templates helper.
  - Create/read/update operations for all 5 bank types succeed for a test project.

- **Session Start Workflow**
  - Given populated banks, the session start tool returns all five banks.
  - Combined payload is ≤10K tokens (happy path) and gracefully trimmed when banks exceed budget.

- **Pattern Lookup Workflow**
  - Queries restricted to SYSTEM_PATTERNS and TECH_CONTEXT banks.
  - Response size ≤1K tokens (snippets + explanations).
  - Results ranked in a reasonable, deterministic way for known queries.

- **Context Recovery Workflow**
  - Reconstructs ACTIVE_CONTEXT and PROGRESS for a project with known state.
  - Response size ≤6K tokens.

### 1.2 Unit / Integration – Knowledge MCP Tools (EPIC-004 slice)

- **knowledge.search**
  - Returns results constrained to `projectId`.
  - Hybrid/semantic/full-text modes behave as expected for seeded data.

- **knowledge.create**
  - Creates knowledge items via MCP proxy and persists embeddings.
  - Duplicate submissions are handled per existing deduplication rules.

- **knowledge.related**
  - Returns graph neighbors within configured hop depth.
  - Honors relationship type filters where provided.

- **knowledge.export / import**
  - Export returns a consistent JSON structure for a subset of items.
  - Import can recreate those items (in a test project) without corruption.

- **knowledge.archive / unarchive**
  - Items can be archived and hidden from default searches.
  - Unarchiving restores discoverability.

- **knowledge.getMetrics**
  - Returns basic counts and performance indicators for knowledge operations.

### 1.3 Route & API Behavior

- Knowledge-related Next.js APIs continue to pass existing tests (e.g. `apps/web/tests/e2e/knowledge.spec.ts`).
- No regression in authentication or project scoping behaviors when Knowledge MCP tools are called.

---

## 2. E2E Scenarios

### 2.1 Agent Session Using Memory Banks + Knowledge

**Test Name:** `memory-banks-knowledge-flow.spec.ts`

Happy path:
1. Use MCP tools to open a new agent session for a project.
2. Call Memory Bank session start workflow for that project.
3. Confirm returned banks fit within ≤10K tokens and contain expected content (brief, patterns, tech, active context, progress).
4. Perform a pattern lookup for a known implementation pattern and verify that the correct snippet is surfaced within ≤1K tokens.
5. Simulate an interruption and call context recovery workflow; verify ACTIVE_CONTEXT and PROGRESS reconstruct the known state.
6. During the same session, call knowledge.search for a topic that exists in seeded Knowledge items.
7. Verify relevant Knowledge items are returned, scoped to the project.

### 2.2 Knowledge MCP E2E

**Test Name:** `knowledge-mcp-tools.spec.ts`

Steps:
1. Call knowledge.create via MCP with a representative payload; verify item appears on `/knowledge` and in subsequent searches.
2. Call knowledge.related for that item and verify graph relationships match seeded expectations.
3. Call knowledge.export for the project and inspect JSON output.
4. In a separate test project, call knowledge.import with that JSON and confirm items and relationships are recreated.
5. Archive an item and verify it disappears from default searches but can be retrieved when explicitly requested.

---

## 3. Security & Scoping Checks

- All Memory Bank and Knowledge MCP tools:
  - Require `projectId`.
  - Validate that `projectId` is in scope for the current environment.
  - Never leak data across projects.

- SQL/DB Access:
  - All DB access uses Prisma or parameterized queries (no string interpolation susceptible to SQL injection).

- Data Privacy:
  - Memory Banks and Knowledge items do not persist unnecessary PII beyond what is already in project documentation.

---

## 4. Performance & Token Targets

- **Memory Banks:**
  - Session start workflow: ≤10K tokens for combined banks.
  - Pattern lookup workflow: ≤1K tokens per query.
  - Context recovery workflow: ≤6K tokens.

- **Knowledge via MCP:**
  - P95 latency < 200ms for typical queries.
  - Token usage < 1,500 tokens/query in representative scenarios.

Validation approach:
- Add lightweight timing logs around critical API paths (development only).
- Run controlled test scripts or E2E tests against the Mac mini Docker stack.
- Capture summary results in `SPRINT9-FINAL-SUMMARY.md`.

---

## 5. Step 4.5 Verification Gate – Evidence Checklist

Before marking Sprint 9 complete, gather the following evidence:

- **Files and docs:**
  - Confirm the following exist and are up to date:
    - `SPRINT9-OVERVIEW.md`
    - `SPRINT9-IMPLEMENTATION-PLAN.md`
    - `SPRINT9-MEMORY-BANK-SPEC.md`
    - `SPRINT9-KNOWLEDGE-BASE-SPEC.md`
    - `SPRINT9-TESTING-AND-VALIDATION.md`
    - `SPRINT9-STATUS.md`
    - `SPRINT9-FINAL-SUMMARY.md`

- **Type safety & build:**
  - `pnpm type-check` passes.
  - `pnpm lint` passes.
  - `pnpm build` succeeds for the web and MCP apps.

- **Tests:**
  - All new unit/integration tests added for Memory Banks and Knowledge MCP tools pass.
  - E2E scenarios described above pass in the Mac mini Docker environment.

- **Database checks:**
  - Inspect Memory Bank tables for at least one project; confirm all 5 types exist and are populated.
  - Inspect Knowledge items and relationships; confirm project-scoped queries return expected results.

- **Performance:**
  - Document measured latencies and token counts for representative Memory Bank workflows.
  - Document measured latencies and token counts for Knowledge MCP queries.

---

## 6. Acceptance Criteria

Sprint 9 passes testing and validation when:

- All checks in Sections 1–4 are satisfied or justified with explicit, documented exceptions.
- Step 4.5 evidence checklist is complete and stored under `.agent/task/sprint9-context-knowledge/`.
- `SPRINT9-STATUS.md` reflects a fully complete sprint, and `SPRINT9-FINAL-SUMMARY.md` captures key results and lessons learned.
