# Sprint 9 – Context Management & Knowledge Base Integration – Overview

**Project:** ProjectPulse  
**Sprint:** Sprint 9 (Phase E) – Context Management & Knowledge Base Integration  
**Related Epics:** EPIC-010 (Memory Bank System), EPIC-004 (Knowledge – agent-only slice), EPIC-011 (Research Agent Orchestration – deferred)

---

## 1. Goals

- **Memory Banks as first-class DB feature**  
  Persist 5 structured Memory Bank types in PostgreSQL and expose them via MCP so agents can load concise project context within strict token budgets.

- **Agent-first Knowledge Base integration**  
  Ensure the Knowledge Base is fully usable by agents via MCP tools (search, create, graph traversal, import/export, archive, metrics) while human UI remains a read-only knowledge cards view.

- **End-to-end context efficiency**  
  Combine Memory Banks + Knowledge Base so agents can: (a) load a compressed project brief/pattern set at session start, and (b) run fast RAG/graph queries during implementation.

- **Clear MVP boundary**  
  Deliver Memory Banks + Knowledge Base slice as the concrete Sprint 9 increment and **explicitly defer EPIC-011 Research Agent Orchestration** (explore-codebase, analyze-architecture, invocation workflows, report persistence, parallel research) to Sprints 10–11.

---

## 2. Scope (In / Out)

### 2.1 In Scope (Sprint 9)

- **Memory Bank System (EPIC-010)**
  - Design and implement 5 Memory Bank types in DB: project-brief, system-patterns, tech-context, active-context, progress.
  - Implement MCP-backed workflows for:
    - Session start optimization (≤10K tokens).
    - Pattern lookup (≤1K tokens per lookup).
    - Context recovery after interruption (≤6K tokens).
  - Keep all Memory Bank content in PostgreSQL (no `.agent/` folders in end-user repos).

- **Knowledge Base Integration (EPIC-004 slice)**
  - Wire existing Knowledge APIs and services into:
    - External MCP tools (knowledge.search, knowledge.create, knowledge.related, knowledge.export, knowledge.import, knowledge.archive, knowledge.getMetrics) in the dedicated MCP server.
    - Project-scoped, RAG/graph-powered retrieval that is safe and token-efficient.
  - Align `/knowledge` UI with agent-managed semantics (read-only cards view; no direct human writes that bypass agents).

- **Verification & instrumentation**
  - Define tests and metrics to verify:
    - Token budgets and latency targets.
    - Project scoping and security.
    - End-to-end flows from MCP → API → DB → (optional) UI.

### 2.2 Out of Scope (Deferred to Sprints 10–11+)

- **EPIC-011 – Research Agent Orchestration**
  - `explore-codebase` and `analyze-architecture` sub-agents.
  - Automated sub-agent invocation workflows.
  - Research report persistence and parallel research orchestration.

- **Advanced Knowledge Base UX**
  - Dedicated Knowledge detail page (`/knowledge/[id]`).
  - Rich graph visualization UI for knowledge relationships.
  - Cross-project/global knowledge federation.

- **End-user persona creation flows**  
  Persona management is tracked under separate epics and remains post-MVP.

---

## 3. Key Design Decisions

- **Database-first Memory Banks**  
  Memory Banks are stored in PostgreSQL and accessed via MCP tools; no long-lived `.agent/` files in repositories. This aligns with Golden Rules (data-driven, local-first, privacy-friendly).

- **Agents write, humans read**  
  Knowledge items are created and updated exclusively via MCP tools acting on behalf of agents. Human UI (`/knowledge`) is a read-only view over agent-managed records.

- **Reuse existing Knowledge infrastructure**  
  Leverage the current Knowledge implementation (pgvector, tsvector, hybrid search, graph traversal, deduplication) and focus Sprint 9 work on:
  - External MCP tool registration and contracts.
  - Project scoping and security.
  - UI semantics and performance verification.

- **Shared performance goals**  
  - Memory Bank workflows must meet token targets from EPIC-010.  
  - Knowledge queries via MCP must achieve P95 < 200ms and < 1,500 tokens/query on representative workloads.

- **Explicit separation from EPIC-011**  
  All Sprint 9 work must avoid coupling to Research Agent orchestration. That layer is treated as a future consumer of Memory Banks + Knowledge Base, not an immediate requirement.

---

## 4. Dependencies & Inputs

- **Planning & backlog**
  - `docs/13-Project-Plan.md` – Phase E: Context Management & Knowledge Base Integration (updated Sprint 9 scope).
  - `docs/12-Backlog.md` – EPIC-010 (Memory Bank System), EPIC-004 (Knowledge), EPIC-011 (Research Agent Orchestration – now post-MVP).

- **Architecture & implementation docs**
  - `docs/03-Architecture.md` – overall system architecture.
  - `docs/02-DATABASE-SCHEMA.md` – Prisma models and DB schema.
  - `docs/03-MCP-SPECIFICATION.md` – MCP patterns and contracts.

- **Existing Knowledge implementation (reference only)**
  - UI: `apps/web/app/knowledge/page.tsx` and components under `apps/web/components/knowledge/`.
  - Services: `apps/web/lib/knowledge/*.ts` (search, graph, create, deduplication, export).
  - Validations: `apps/web/lib/validations/knowledge.ts`.
  - Web MCP handlers: `apps/web/lib/mcp/handlers/knowledge-handler.ts`.
  - MCP resources: `apps/web/lib/mcp/resources/knowledge-resource.ts`.

- **Onboarding & Memory context**
  - Onboarding MCP tools and APIs (Session 1–3) already implemented and running on the Mac mini Docker stack.
  - Sprint 8.5 + onboarding refactor docs in `.agent/task/` for patterns on multi-phase implementation and testing.

---

## 5. Deliverables (Summary)

Sprint 9 is considered successful when:

1. **Memory Bank System live (EPIC-010)**
   - 5 Memory Bank types implemented in DB and accessible via MCP tools.
   - Session start, pattern lookup, and context recovery workflows are implemented and validated against token targets.

2. **Knowledge Base agent-first integration complete (EPIC-004 slice)**
   - External MCP tools for Knowledge are registered and fully wired to existing APIs.
   - All Knowledge queries are project-scoped, secure, and meet latency/token goals.
   - `/knowledge` accurately reflects agent-managed Knowledge items and does not expose unsupported edit flows.

3. **Research Agent Orchestration explicitly deferred**
   - `docs/13-Project-Plan.md` and `docs/12-Backlog.md` remain aligned: EPIC-011 stories are scheduled for post-MVP Sprints 10–11.
   - No partial, hidden, or half-finished Research Agent orchestration code is introduced in Sprint 9.

4. **Verification artifacts exist**
   - Implementation plan, specs, and testing docs under `.agent/task/sprint9-context-knowledge/` are kept up to date.
   - Evidence for Step 4.5 verification gate (tests, timing measurements, DB checks) is captured before declaring Sprint 9 complete.
