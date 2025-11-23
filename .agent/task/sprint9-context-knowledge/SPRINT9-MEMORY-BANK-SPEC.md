# Sprint 9 – Memory Bank System Specification (EPIC-010)

**Project:** ProjectPulse  
**Sprint:** Sprint 9 – Context Management & Knowledge Base Integration  
**Epic:** EPIC-010 – Memory Bank System (End User Feature – Cloud-Based)

This document expands EPIC-010 from `docs/12-Backlog.md` into a concrete implementation spec for Sprint 9.

---

## 1. Objectives

- Implement 5 Memory Bank types in PostgreSQL for each project.
- Provide MCP workflows that:
  - Reduce session start overhead to ≤10K tokens.
  - Enable pattern lookups within ≤1K tokens.
  - Enable session context recovery within ≤6K tokens.
- Ensure Memory Banks are **database-backed**, agent-accessible, and keep user repos clean (no `.agent/` folders for end users).

---

## 2. Memory Bank Types & Content

For each project, we maintain five logical banks.

### 2.1 Project Brief (FR-146)

- **Purpose:** High-level description of the project’s goals, value proposition, and constraints in ≤3K tokens.
- **Content examples:**
  - Problem statement and target users.
  - Key features and non-functional requirements.
  - High-level system architecture summary.
- **Sources:**
  - PRD (`docs/01-PRD.md`).
  - Project Plan (`docs/13-Project-Plan.md`).
  - Existing onboarding answers and executive summary.

### 2.2 System Patterns (FR-147)

- **Purpose:** Catalog of core implementation patterns and conventions so the agent can find patterns in ≤1K tokens.
- **Content examples:**
  - How API routes are structured (Next.js app router patterns).
  - Typical Prisma query patterns for common entities.
  - UI component composition patterns (e.g. dashboard cards, tables, filter panels).
  - MCP tool design patterns.
- **Sources:**
  - Architecture docs (`docs/03-Architecture.md`).
  - Existing `.agent/task/*-architecture-*.md` documents.
  - Code examples extracted from key modules (non-verbatim, summarized).

### 2.3 Tech Context (FR-148)

- **Purpose:** Snapshot of technology stack, frameworks, libraries, and infra in ≤2K tokens.
- **Content examples:**
  - Next.js, Prisma, PostgreSQL, MCP server stack.
  - Docker/Mac mini topology.
  - Key third-party dependencies and their roles.
- **Sources:**
  - `AGENTS.md` / `CLAUDE.md` / infra docs.
  - `docs/07-QUICK-START.md` and deployment docs.

### 2.4 Active Context (FR-149)

- **Purpose:** Real-time description of current work focus in ≤1K tokens.
- **Content examples:**
  - Current sprint and day goals.
  - Currently modified modules and open branches.
  - Pending verifications or blocked items.
- **Sources:**
  - `.agent/task/current-plan.md` and `.agent/task/current-todos.md`.
  - Recent `current-session-*.md` notes.

### 2.5 Progress (FR-150)

- **Purpose:** High-level progress overview in ≤2K tokens.
- **Content examples:**
  - Completed epics and sprints.
  - Major milestones achieved and remaining.
  - Known technical debt or follow-ups.
- **Sources:**
  - Sprint completion summaries (e.g. `sprint8-FINAL-STATUS.md`).
  - Roadmap phase status.

---

## 3. Data Model & Storage

> Exact Prisma model names and fields should be finalized in `docs/02-DATABASE-SCHEMA.md` and implemented in `apps/web/prisma/schema.prisma`.

### 3.1 Suggested Models

- **MemoryBank**
  - `id` (cuid)
  - `projectId` (FK → Project)
  - `type` (enum: PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS)
  - `content` (text) – canonical serialized representation (Markdown or structured JSON-as-text).
  - `summaryTokens` (int) – approximate token count for quick budgeting.
  - `createdAt` / `updatedAt` (timestamps)

- Optional: **MemoryBankSnapshot** (for future Sprint 10 work) is documented in `docs/architecture/…` and does not need to be implemented in Sprint 9 beyond what is required for basic operations.

### 3.2 Constraints

- Each `(projectId, type)` should have at most one **active** MemoryBank row at a time.
- Token budgets per bank should be enforced at generation/update time (soft limit with logs when exceeded).

---

## 4. MCP Workflows

### 4.1 Session Start Loading Workflow (FR-151)

- **Tool behavior:**
  - Input: `projectId`, optional flags (e.g. includeProgress, includeActiveContext).
  - Output: consolidated structure containing all 5 Memory Banks for the project, trimmed to fit ≤10K tokens.
- **Implementation notes:**
  - Fetch all 5 Memory Banks by `projectId`.
  - Trim or summarize sections if combined token count exceeds 10K.
  - Return structured JSON with clear sections so the agent can selectively drop lower-priority parts if necessary.

### 4.2 Pattern Lookup Workflow (FR-152)

- **Tool behavior:**
  - Input: `projectId`, `query` (free text), optional filters (e.g. only system-patterns vs tech-context).
  - Output: ranked list of relevant pattern snippets with brief explanations.
- **Implementation notes:**
  - Search primarily within SYSTEM_PATTERNS and TECH_CONTEXT banks.
  - Use simple text search or lightweight embedding search as needed.
  - Enforce ≤1K tokens in the combined response (snippets + annotations).

### 4.3 Context Recovery Workflow (FR-153)

- **Tool behavior:**
  - Input: `projectId`, optional `latestOnly` flag.
  - Output: structure that reconstructs ACTIVE_CONTEXT and PROGRESS for the agent after interruption.
- **Implementation notes:**
  - Fetch latest ACTIVE_CONTEXT and PROGRESS entries.
  - Optionally cross-reference with recent `.agent/task/current-session-*.md` summaries or sprint status docs when generating updated content.
  - Ensure final payload stays within ≤6K tokens.

---

## 5. Security, Scoping & Privacy

- All Memory Bank operations must be **project-scoped**:
  - Tools require `projectId` and validate that it exists and is accessible in the current environment.
- No user-identifying PII beyond what is already in project docs should be stored in Memory Banks.
- Memory Bank content must not leak across projects or tenants.
- All queries use Prisma or parameterized SQL (no raw string interpolation).

---

## 6. Integration Points

- **Onboarding MCP tools:**
  - Session 1–3 flows can call Memory Bank tools for summarization and context loading.
- **Roadmap & sprint tools:**
  - Progress Memory Bank can be updated from sprint completion scripts or MCP tools that summarize recent work.
- **Knowledge Base:**
  - Memory Banks should be conceptually aligned with Knowledge items (e.g. system patterns may be linked to Knowledge graph nodes), but the source of truth remains the DB; no direct coupling is required in Sprint 9.

---

## 7. Acceptance Criteria (Memory Bank System)

The Memory Bank portion of Sprint 9 is considered complete when:

- 5 Memory Bank types are implemented in the DB and accessible via MCP tools.
- Session start, pattern lookup, and context recovery workflows are implemented and tested.
- Token usage targets are met in representative test scenarios.
- No new security or privacy issues are introduced.
- Behavior is documented in `SPRINT9-TESTING-AND-VALIDATION.md` and validated before closing the sprint.
