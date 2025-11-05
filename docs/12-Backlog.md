# Product Backlog

**Document ID:** DOC-012
**Version:** 1.0.0
**Status:** Active
**Owner:** Product Team
**Last Updated:** 2025-11-02
**Review Cycle:** Sprint Planning (every 2 weeks)

---

## Document Control

| Version | Date       | Author       | Changes                                                      |
| ------- | ---------- | ------------ | ------------------------------------------------------------ |
| 1.0.0   | 2025-11-02 | Product Team | Initial product backlog creation (8 epics, 125 user stories) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Epic Breakdown](#2-epic-breakdown)
3. [User Stories](#3-user-stories)
4. [Traceability Matrix](#4-traceability-matrix)
5. [Summary & Cross-References](#5-summary--cross-references)

---

## 1. Introduction

### 1.1 Purpose

This Product Backlog defines all user stories for the ProjectPulse project, organized into 8 epics corresponding to the MVP features defined in [01-PRD.md](01-PRD.md). Each of the 125 user stories maps 1:1 to a Functional Requirement (FR-001 to FR-125) documented in [02-SRS.md](02-SRS.md).

**Key Objectives:**

- **Complete Coverage:** Every functional requirement has a corresponding user story
- **Sprint Planning Ready:** Stories are sized, prioritized, and have clear acceptance criteria
- **Traceability:** Direct path from business need (Epic) → implementation (Story) → requirements (FR) → tests (TEST-XXX)
- **Agile/Scrum Compliance:** Industry-standard backlog format ready for sprint planning

---

### 1.2 How to Use This Document

**For Sprint Planning:**

1. Review epics by MoSCoW priority (Must → Should → Could → Won't)
2. Select stories based on story points and team velocity
3. Reference FR details in [02-SRS.md](02-SRS.md) for implementation specifics
4. Use traceability matrix to identify dependencies

**For Story Implementation:**

1. Review user story format: "As a [persona], I want [goal], so that [benefit]"
2. Check linked FR (FR-XXX) for detailed requirements
3. Verify dependencies are complete
4. Reference test ID (TEST-XXX) for acceptance criteria

---

### 1.3 Story Point Methodology (Fibonacci Scale)

We use the Fibonacci sequence for story point estimation to reflect increasing uncertainty with larger stories:

| Points | Effort     | Complexity   | Examples                                                                |
| ------ | ---------- | ------------ | ----------------------------------------------------------------------- |
| **1**  | < 1 hour   | Trivial      | Simple CRUD operations, getter methods, basic queries                   |
| **2**  | 1-2 hours  | Simple       | Basic validation, simple database queries, straightforward UI updates   |
| **3**  | 2-4 hours  | Medium       | Complex validation, multi-table queries, state management               |
| **5**  | 4-8 hours  | Complex      | State machines, graph algorithms, multi-step workflows                  |
| **8**  | 8-16 hours | Very Complex | Full feature integration, multiple dependencies, complex business logic |
| **13** | 16+ hours  | Epic-sized   | Consider breaking down into smaller stories                             |

**Total Backlog:** ~425 story points (average 3.4 points per story)

**Sprint Capacity:** Estimated 40 story points per 2-week sprint (solo developer, 40 hours/week)

---

### 1.4 MoSCoW Prioritization

Stories are prioritized using the MoSCoW method:

| Priority             | Meaning                      | Criteria                                  | Story Count | Total Points |
| -------------------- | ---------------------------- | ----------------------------------------- | ----------- | ------------ |
| **Must Have**        | Critical for MVP             | P0 features, core functionality           | 70 stories  | ~244 points  |
| **Should Have**      | Important but not critical   | P1 features, enhances user experience     | 35 stories  | ~120 points  |
| **Could Have**       | Nice to have if time permits | P2 features, adds value but not essential | 15 stories  | ~46 points   |
| **Won't Have (MVP)** | Not in MVP scope             | P3 features, deferred to future releases  | 5 stories   | ~15 points   |

**MVP Scope:** Must Have + Should Have = 105 stories (~364 points) = ~9 sprints (18 weeks)

---

### 1.5 Traceability Approach

All stories maintain bidirectional traceability:

```
PRD (Features) → Backlog (Epics) → Backlog (Stories) → SRS (FRs) → Testing (TEST-XXX)
     ↓                  ↓                  ↓                ↓              ↓
  8 Features        8 Epics         125 Stories       125 FRs      125 Tests
```

**Example Traceability Chain:**

- **PRD Section 4.2.1:** Sprint/Phase Tracking feature
- **Backlog EPIC-001:** Sprint/Phase Tracking epic (25 stories)
- **Backlog US-001:** "As an agent, I want to create 5-level hierarchy..."
- **SRS FR-001:** "Create Phase Hierarchy" (detailed requirements)
- **Testing TEST-001:** Test suite for FR-001 acceptance criteria

---

## 2. Epic Breakdown

### EPIC-001: Sprint/Phase Tracking

**Description:** Hierarchical progress tracking with auto-sync to markdown files. Agents and humans can track work across 5 levels: Phase → Week → Day → Task → Session.

**Business Value:**

- Agents always know current task context (no manual STATUS.md updates)
- Progress rolls up automatically (Session 100% → Task 50% → Day 25% → Week 12.5% → Phase 3%)
- Markdown files (STATUS.md, DEVELOPMENT_PLAN.md) auto-generated from database (single source of truth)

**Success Criteria:**

- All 5 hierarchy levels functional (Phase, Week, Day, Task, Session)
- Progress updates trigger markdown regeneration in <500ms
- Git hooks prevent manual markdown edits (database as source of truth)

**Story Range:** US-001 to US-025 (25 stories)
**FR Range:** FR-001 to FR-025
**Total Points:** ~87 points
**MoSCoW:** Must Have
**Dependencies:** None (foundation feature)
**Sprint Allocation:** Phase A Week 1-2 (5-6 sprints)

---

### EPIC-002: Workflow Orchestration

**Description:** Track and enforce 12+ predefined workflows from CLAUDE.md, ensuring agents follow consistent patterns (5-step protocol, checkpoints, recovery).

**Business Value:**

- Agents never skip mandatory steps (session init, plan creation, checkpoints, completion)
- Workflow state persisted across sessions (agents can resume after interruption)
- Automatic recovery suggestions when workflows fail mid-execution

**Success Criteria:**

- All 12 workflows defined with steps (5-Step Protocol, Session Start, Git Workflow, etc.)
- Current workflow step tracked in database
- Missing step alerts trigger before workflow can proceed

**Story Range:** US-026 to US-050 (25 stories)
**FR Range:** FR-026 to FR-050
**Total Points:** ~95 points
**MoSCoW:** Must Have
**Dependencies:** EPIC-001 (uses sprint tracking for checkpoints)
**Sprint Allocation:** Phase A Week 3-4, Phase B Week 5-6 (5-6 sprints)

---

### EPIC-003: Issues

**Description:** Bug and task tracking for agent-created and human-created work items. Agents can bulk-create issues (10-50 at once), auto-tag based on file paths, and inject context (code links, stack traces).

**Business Value:**

- Agents create 15+ issues in <2 seconds after security/quality scans
- Auto-tagging reduces manual categorization (e.g., "backend", "auth", "critical")
- Context injection (file:line) enables quick issue triage

**Success Criteria:**

- Bulk issue creation (<2s for 15 issues)
- Auto-tagging based on file paths (80%+ accuracy)
- Context injection includes code snippets + line numbers

**Story Range:** US-051 to US-070 (20 stories)
**FR Range:** FR-051 to FR-070
**Total Points:** ~62 points
**MoSCoW:** Must Have
**Dependencies:** Sprint 0 (Issues UI 100% complete - all 14 components, pages, and API routes already built)
**Sprint Allocation:** Sprint 4 (Backend Integration Only - connect UI to MCP tools)

---

### EPIC-004: Knowledge

**Description:** Project-specific context retrieval with RAG + Knowledge Graph. Hybrid search (semantic + full-text) + limited graph traversal (max 2 hops) achieves 88% token reduction vs full graph loading.

**Business Value:**

- Agents query "authentication flow" → Get 6-8 relevant items in <200ms using ~1,200 tokens (vs 10K+ for full graph)
- Semantic search captures "auth" = "authentication" = "login"
- Graph traversal finds contradictory/related knowledge automatically

**Success Criteria:**

- Query response time <200ms (P95)
- Token usage <1,500 per query (88% reduction)
- Hybrid search ranking: 0.7 × semantic + 0.3 × fulltext

**Story Range:** US-071 to US-090 (20 stories)
**FR Range:** FR-071 to FR-090
**Total Points:** ~78 points
**MoSCoW:** Should Have
**Dependencies:** None (standalone feature)
**Sprint Allocation:** Phase C Week 9-10 (4-5 sprints)

---

### EPIC-005: Skills

**Description:** Framework/library documentation for token-efficient agent access. Lazy loading (frontmatter only, ~50 tokens) + on-demand content loading (~180 tokens) achieves 92% token reduction vs full framework docs.

**Business Value:**

- Agents load React patterns: 220 tokens (lazy-loaded skill) vs 2,500 tokens (full docs) = 92% reduction
- Auto-unload after use (memory management)
- Skills organized by category (framework, testing, workflow, troubleshooting)

**Success Criteria:**

- Lazy loading: Frontmatter <80 tokens, full skill <250 tokens
- 92% token reduction vs full framework documentation
- Auto-unload after 5 minutes of inactivity

**Story Range:** US-091 to US-105 (15 stories)
**FR Range:** FR-091 to FR-105
**Total Points:** ~42 points
**MoSCoW:** Should Have
**Dependencies:** EPIC-004 (uses same indexing/search patterns)
**Sprint Allocation:** Phase C Week 11 (2-3 sprints)

---

### EPIC-006: Wiki

**Description:** Project documentation auto-generation from code. JSDoc/docstrings → `/docs` folder with cross-linking, version control (git-backed), and markdown rendering.

**Business Value:**

- Agents auto-generate API documentation from code comments
- Cross-linking: "@see OtherModule" → Hyperlink to wiki page
- Version control: Wiki changes tracked in git (same as code)

**Success Criteria:**

- Auto-generation from JSDoc/docstrings (95%+ coverage)
- Cross-linking functional (internal + external links)
- Git-backed (wiki changes = git commits)

**Story Range:** US-106 to US-115 (10 stories)
**FR Range:** FR-106 to FR-115
**Total Points:** ~28 points
**MoSCoW:** Could Have
**Dependencies:** EPIC-004 (uses knowledge graph for cross-linking)
**Sprint Allocation:** Phase C Week 12 (1-2 sprints)

---

### EPIC-007: Project Health

**Description:** Track security + quality + accessibility + technical debt. Integrates scanners (Semgrep, ESLint, Lighthouse, axe-core) and auto-categorizes findings by severity.

**Business Value:**

- Agents run Semgrep → Create 15 security issues automatically
- Health score dashboard (Security: 85%, Quality: 90%, A11y: 95%, Debt: Low)
- Auto-categorization: Critical → High → Medium → Low

**Success Criteria:**

- Scanner integration: Semgrep + ESLint + Lighthouse + axe-core
- Health score calculation (weighted average)
- Auto-remediation suggestions (link to knowledge/wiki)

**Story Range:** US-116 to US-120 (5 stories)
**FR Range:** FR-116 to FR-120
**Total Points:** ~18 points
**MoSCoW:** Could Have
**Dependencies:** EPIC-003 (creates issues from findings)
**Sprint Allocation:** Phase D Week 13 (1 sprint)

---

### EPIC-008: Personas

**Description:** Agent-created sub-agents for project-specific tasks. Agents analyze project patterns → generate persona system prompts → store in database → activate when context matches.

**Business Value:**

- Agent creates "Backend API Specialist" persona after analyzing 50+ API endpoints
- Persona activated automatically when working on API files
- Context-specific expertise without token overhead

**Success Criteria:**

- Dynamic persona creation (agent-generated system prompts)
- Activation rules (file patterns, keywords, contexts)
- Persona catalog (list, edit, deactivate)

**Story Range:** US-121 to US-125 (5 stories)
**FR Range:** FR-121 to FR-125
**Total Points:** ~15 points
**MoSCoW:** Won't Have (deferred to post-MVP)
**Dependencies:** EPIC-002 (personas activate in workflows)
**Sprint Allocation:** Post-MVP (Phase E)

---

## 3. User Stories

### 3.1 EPIC-001: Sprint/Phase Tracking (US-001 to US-025)

| ID     | User Story                                                                                                                                | FR     | Points | Priority | Deps                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | ---------------------- |
| US-001 | As an agent, I want to create a 5-level hierarchy (Phase/Week/Day/Task/Session) so that I can track progress granularly across all levels | FR-001 | 5      | Must     | -                      |
| US-002 | As an agent, I want to update progress at any hierarchy level so that progress automatically rolls up to parent levels                    | FR-002 | 3      | Must     | US-001                 |
| US-003 | As an agent, I want to retrieve the current active task so that I know what to work on next without manual STATUS.md reading              | FR-003 | 2      | Must     | US-001                 |
| US-004 | As an agent, I want to create a new session with timestamp (YYYYMMDD-HHMM) so that each work session is tracked independently             | FR-004 | 2      | Must     | US-001                 |
| US-005 | As an agent, I want markdown files auto-synced from database so that STATUS.md and DEVELOPMENT_PLAN.md are always accurate                | FR-005 | 8      | Must     | US-001, US-002         |
| US-006 | As a developer, I want git hooks to prevent manual markdown edits so that database remains single source of truth                         | FR-006 | 5      | Must     | US-005                 |
| US-007 | As a developer, I want to query hierarchy by filters (status, progress, date range) so that I can find specific work items                | FR-007 | 3      | Should   | US-001                 |
| US-008 | As an agent, I want to mark a task as complete so that progress automatically updates to 100% and rolls up to parent                      | FR-008 | 2      | Must     | US-002                 |
| US-009 | As an agent, I want to create a checkpoint with notes and token usage so that I can resume work after context compaction                  | FR-009 | 3      | Must     | US-004                 |
| US-010 | As a developer, I want to view hierarchy as a tree so that I can visualize project structure and progress                                 | FR-010 | 5      | Should   | US-001                 |
| US-011 | As an agent, I want to calculate estimated completion date based on current velocity so that I can provide accurate ETAs                  | FR-011 | 5      | Could    | US-002                 |
| US-012 | As an agent, I want to archive completed phases so that active hierarchy remains manageable without losing history                        | FR-012 | 3      | Should   | US-001, US-008         |
| US-013 | As a developer, I want to export hierarchy to JSON/CSV so that I can analyze progress in external tools                                   | FR-013 | 3      | Could    | US-001                 |
| US-014 | As an agent, I want to validate hierarchy integrity (no orphaned tasks) so that data remains consistent                                   | FR-014 | 2      | Must     | US-001                 |
| US-015 | As an agent, I want to bulk-update task status (e.g., mark all Day 1 tasks complete) so that I can efficiently manage multiple items      | FR-015 | 3      | Should   | US-008                 |
| US-016 | As a developer, I want to view progress charts (burndown, velocity) so that I can track sprint performance                                | FR-016 | 5      | Should   | US-002                 |
| US-017 | As an agent, I want to link tasks to issues so that I can track work items related to bugs/features                                       | FR-017 | 3      | Should   | US-001                 |
| US-018 | As an agent, I want to estimate remaining work for a phase so that I can provide project timeline updates                                 | FR-018 | 5      | Could    | US-002, US-011         |
| US-019 | As a developer, I want to customize hierarchy levels (add/remove levels) so that I can adapt structure to project needs                   | FR-019 | 8      | Won't    | US-001                 |
| US-020 | As an agent, I want to detect stale tasks (no progress >7 days) so that I can alert about blocked work                                    | FR-020 | 3      | Could    | US-002                 |
| US-021 | As an agent, I want to rollback a task to previous state so that I can undo incorrect progress updates                                    | FR-021 | 5      | Could    | US-002                 |
| US-022 | As an agent, I want to duplicate a task structure so that I can reuse patterns across days/weeks                                          | FR-022 | 3      | Could    | US-001                 |
| US-023 | As a developer, I want to set task dependencies (Task B blocked by Task A) so that I can enforce sequential work                          | FR-023 | 5      | Should   | US-001                 |
| US-024 | As an agent, I want to log task events (created, updated, completed) so that I have audit trail for all changes                           | FR-024 | 3      | Should   | US-001, US-002, US-008 |
| US-025 | As an agent, I want to sync hierarchy state with .agent/task files so that file-based context remains consistent                          | FR-025 | 5      | Must     | US-005                 |

**EPIC-001 Total:** 25 stories, ~87 story points

---

### 3.2 EPIC-002: Workflow Orchestration (US-026 to US-050)

| ID     | User Story                                                                                                                      | FR     | Points | Priority | Deps                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | ---------------------- |
| US-026 | As an agent, I want to start a predefined workflow (e.g., "5-Step Protocol") so that I follow consistent patterns               | FR-026 | 5      | Must     | -                      |
| US-027 | As an agent, I want to track current workflow step so that I know what to do next                                               | FR-027 | 2      | Must     | US-026                 |
| US-028 | As an agent, I want to mark a workflow step complete so that I can progress to the next step                                    | FR-028 | 2      | Must     | US-027                 |
| US-029 | As an agent, I want to be alerted if I skip a required workflow step so that I maintain consistency                             | FR-029 | 3      | Must     | US-027, US-028         |
| US-030 | As an agent, I want to view all available workflows so that I can select the appropriate pattern for my task                    | FR-030 | 2      | Must     | US-026                 |
| US-031 | As an agent, I want to resume a workflow after interruption so that I don't lose progress across sessions                       | FR-031 | 5      | Must     | US-027                 |
| US-032 | As an agent, I want to rollback to a previous workflow step if I made an error so that I can correct mistakes                   | FR-032 | 3      | Should   | US-028                 |
| US-033 | As an agent, I want to define custom workflows with steps and validation rules so that I can adapt to project-specific patterns | FR-033 | 8      | Won't    | US-026                 |
| US-034 | As a developer, I want to visualize workflow progress so that I can see which steps are complete                                | FR-034 | 3      | Should   | US-027                 |
| US-035 | As an agent, I want to checkpoint workflow state every 15K tokens so that I can recover from context compaction                 | FR-035 | 5      | Must     | US-027, US-009         |
| US-036 | As an agent, I want to validate workflow prerequisites (e.g., git branch exists) before starting so that I catch blockers early | FR-036 | 3      | Must     | US-026                 |
| US-037 | As an agent, I want to log workflow failures with error messages so that I can debug issues                                     | FR-037 | 3      | Should   | US-028                 |
| US-038 | As an agent, I want to get recovery suggestions when a workflow fails so that I know how to proceed                             | FR-038 | 5      | Should   | US-037                 |
| US-039 | As an agent, I want to track workflow execution time so that I can optimize slow patterns                                       | FR-039 | 2      | Could    | US-027, US-028         |
| US-040 | As an agent, I want to link workflow steps to tasks so that I can track workflow-driven work items                              | FR-040 | 3      | Should   | US-027, US-017         |
| US-041 | As an agent, I want to enforce step order (Step 2 requires Step 1 complete) so that workflows execute correctly                 | FR-041 | 3      | Must     | US-028                 |
| US-042 | As an agent, I want to mark workflows as complete so that they are archived and don't clutter active list                       | FR-042 | 2      | Should   | US-028                 |
| US-043 | As a developer, I want to export workflow history to JSON so that I can analyze patterns over time                              | FR-043 | 3      | Could    | US-027, US-028         |
| US-044 | As an agent, I want to retry a failed workflow step automatically (max 3 retries) so that transient errors don't block progress | FR-044 | 5      | Should   | US-037                 |
| US-045 | As an agent, I want to validate workflow completion criteria so that I don't prematurely mark workflows done                    | FR-045 | 3      | Must     | US-042                 |
| US-046 | As an agent, I want to branch workflows (if-then-else logic) so that I can handle conditional paths                             | FR-046 | 8      | Won't    | US-026                 |
| US-047 | As an agent, I want to receive notifications when workflow steps require human approval so that I don't proceed automatically   | FR-047 | 5      | Could    | US-028                 |
| US-048 | As an agent, I want to track workflow dependencies (Workflow B requires Workflow A) so that I execute in correct order          | FR-048 | 3      | Should   | US-026                 |
| US-049 | As a developer, I want to audit workflow execution history so that I can verify agent followed all steps correctly              | FR-049 | 3      | Should   | US-027, US-028, US-037 |
| US-050 | As an agent, I want to detect duplicate workflow executions so that I don't repeat completed work                               | FR-050 | 3      | Could    | US-026, US-042         |

**EPIC-002 Total:** 25 stories, ~95 story points

---

### 3.3 EPIC-003: Issues (US-051 to US-070)

| ID     | User Story                                                                                                                          | FR     | Points | Priority | Deps           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | -------------- |
| US-051 | As an agent, I want to create a single issue with title, description, status, severity so that I can track bugs and tasks           | FR-051 | 2      | Must     | -              |
| US-052 | As an agent, I want to bulk-create issues (10-50 at once) so that I can efficiently process scanner findings                        | FR-052 | 5      | Must     | US-051         |
| US-053 | As an agent, I want to auto-tag issues based on file paths (e.g., "src/api/" → "backend") so that categorization is automatic       | FR-053 | 3      | Must     | US-051         |
| US-054 | As an agent, I want to inject context (code snippets, stack traces, file:line) so that issues have sufficient debugging information | FR-054 | 5      | Must     | US-051         |
| US-055 | As an agent, I want to update issue status (todo/in_progress/done) so that I can track work progress                                | FR-055 | 2      | Must     | US-051         |
| US-056 | As an agent, I want to query issues by filters (status, severity, tags, assignee) so that I can find relevant work items            | FR-056 | 3      | Must     | US-051         |
| US-057 | As an agent, I want to link issues to tasks so that issue resolution is tracked in sprint hierarchy                                 | FR-057 | 3      | Should   | US-051, US-017 |
| US-058 | As a developer, I want to create issues manually via UI so that I can add business logic bugs that agents can't infer               | FR-058 | 2      | Must     | US-051         |
| US-059 | As a developer, I want to bulk approve/reject agent-created issues so that I can quickly review and filter noise                    | FR-059 | 3      | Should   | US-052         |
| US-060 | As an agent, I want to assign issues to personas so that specialized agents handle domain-specific work                             | FR-060 | 3      | Could    | US-051         |
| US-061 | As an agent, I want to detect duplicate issues (similar title/description) so that I don't create redundant work items              | FR-061 | 5      | Should   | US-051, US-052 |
| US-062 | As an agent, I want to prioritize issues using severity scoring so that I work on high-impact items first                           | FR-062 | 3      | Must     | US-051         |
| US-063 | As an agent, I want to link issues to knowledge items so that I can reference related documentation/patterns                        | FR-063 | 3      | Should   | US-051         |
| US-064 | As an agent, I want to archive resolved issues so that active list remains manageable                                               | FR-064 | 2      | Should   | US-055         |
| US-065 | As a developer, I want to export issues to CSV/JSON so that I can analyze trends in external tools                                  | FR-065 | 3      | Could    | US-051         |
| US-066 | As an agent, I want to comment on issues so that I can add progress notes and findings                                              | FR-066 | 2      | Should   | US-051         |
| US-067 | As an agent, I want to link issues to pull requests/commits so that I can track code changes related to resolution                  | FR-067 | 3      | Could    | US-051         |
| US-068 | As an agent, I want to estimate issue resolution time based on similar past issues so that I can provide accurate ETAs              | FR-068 | 5      | Could    | US-051, US-064 |
| US-069 | As an agent, I want to create issue templates (bug report, feature request) so that issues have consistent structure                | FR-069 | 3      | Could    | US-051         |
| US-070 | As a developer, I want to view issue trends (created vs resolved per sprint) so that I can monitor workload                         | FR-070 | 3      | Should   | US-051, US-064 |

**EPIC-003 Total:** 20 stories, ~62 story points

---

### 3.4 EPIC-004: Knowledge (US-071 to US-090)

| ID     | User Story                                                                                                                             | FR     | Points | Priority | Deps           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | -------------- |
| US-071 | As an agent, I want to add knowledge items with title, content, tags, category so that I can build project-specific context            | FR-071 | 2      | Should   | -              |
| US-072 | As an agent, I want to query knowledge using hybrid search (semantic + full-text) so that I find relevant items efficiently            | FR-072 | 8      | Should   | US-071         |
| US-073 | As an agent, I want semantic search to use pgvector embeddings so that I can find "auth" when searching "authentication"               | FR-073 | 5      | Should   | US-072         |
| US-074 | As an agent, I want full-text search to use tsvector so that I can find exact keyword matches                                          | FR-074 | 3      | Should   | US-072         |
| US-075 | As an agent, I want hybrid search to merge results (0.7 × semantic + 0.3 × fulltext) so that I get best of both approaches             | FR-075 | 3      | Should   | US-073, US-074 |
| US-076 | As an agent, I want to traverse knowledge graph (max 2 hops) from top search result so that I find related/contradictory items         | FR-076 | 5      | Should   | US-072         |
| US-077 | As an agent, I want to create relationships between knowledge items (REFERENCES, CONTRADICTS, EXTENDS) so that I can model connections | FR-077 | 3      | Should   | US-071         |
| US-078 | As an agent, I want to limit query results to top-K (K=5-8) so that token usage stays under 1,500 tokens                               | FR-078 | 2      | Should   | US-072         |
| US-079 | As an agent, I want to generate embeddings automatically when adding knowledge so that semantic search works immediately               | FR-079 | 5      | Should   | US-071, US-073 |
| US-080 | As an agent, I want to update knowledge items so that I can refine content as project evolves                                          | FR-080 | 2      | Should   | US-071         |
| US-081 | As an agent, I want to delete knowledge items so that I can remove outdated/incorrect information                                      | FR-081 | 2      | Should   | US-071         |
| US-082 | As a developer, I want to view knowledge graph visualization so that I can see relationships between items                             | FR-082 | 5      | Could    | US-077         |
| US-083 | As an agent, I want to tag knowledge items by category (architecture, patterns, decisions) so that I can filter by type                | FR-083 | 2      | Should   | US-071         |
| US-084 | As an agent, I want to version knowledge items so that I can track changes over time                                                   | FR-084 | 3      | Could    | US-080         |
| US-085 | As an agent, I want to link knowledge items to issues/tasks so that I can reference relevant documentation                             | FR-085 | 3      | Should   | US-071         |
| US-086 | As an agent, I want to measure query performance (latency, token usage) so that I can optimize search strategy                         | FR-086 | 3      | Could    | US-072         |
| US-087 | As an agent, I want to export knowledge graph to JSON so that I can backup or migrate data                                             | FR-087 | 2      | Could    | US-071         |
| US-088 | As an agent, I want to import knowledge from markdown files so that I can seed graph from existing docs                                | FR-088 | 5      | Could    | US-071         |
| US-089 | As an agent, I want to detect duplicate knowledge items so that I don't create redundant entries                                       | FR-089 | 3      | Should   | US-071, US-072 |
| US-090 | As an agent, I want to archive obsolete knowledge items so that active graph remains relevant                                          | FR-090 | 2      | Should   | US-081         |

**EPIC-004 Total:** 20 stories, ~78 story points

---

### 3.5 EPIC-005: Skills (US-091 to US-105)

| ID     | User Story                                                                                                                                            | FR     | Points | Priority | Deps           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | -------------- |
| US-091 | As an agent, I want to list available skills with frontmatter (title, category, tags) so that I can see what's available without loading full content | FR-091 | 2      | Should   | -              |
| US-092 | As an agent, I want to load a skill's full content on-demand so that I only use tokens when needed                                                    | FR-092 | 3      | Should   | US-091         |
| US-093 | As an agent, I want to search skills by keywords/tags so that I can find relevant patterns quickly                                                    | FR-093 | 3      | Should   | US-091         |
| US-094 | As an agent, I want skills to auto-unload after 5 minutes so that memory is freed automatically                                                       | FR-094 | 3      | Should   | US-092         |
| US-095 | As an agent, I want to create skills with frontmatter + markdown content so that I can capture project-specific patterns                              | FR-095 | 3      | Should   | US-091         |
| US-096 | As an agent, I want to categorize skills (framework, testing, workflow, troubleshooting) so that organization is logical                              | FR-096 | 2      | Should   | US-095         |
| US-097 | As an agent, I want to validate skill frontmatter format so that all skills have consistent structure                                                 | FR-097 | 2      | Should   | US-095         |
| US-098 | As an agent, I want to measure token usage per skill load so that I can verify 92% reduction target                                                   | FR-098 | 2      | Could    | US-092         |
| US-099 | As an agent, I want to update skill content so that I can refine patterns as best practices evolve                                                    | FR-099 | 2      | Should   | US-095         |
| US-100 | As an agent, I want to delete skills so that I can remove obsolete patterns                                                                           | FR-100 | 2      | Should   | US-095         |
| US-101 | As a developer, I want to export skills to markdown files so that I can version control them separately                                               | FR-101 | 3      | Could    | US-095         |
| US-102 | As an agent, I want to import skills from markdown files so that I can seed database from existing .claude/skills                                     | FR-102 | 3      | Could    | US-095         |
| US-103 | As an agent, I want to track skill usage frequency so that I can identify most-used patterns                                                          | FR-103 | 2      | Could    | US-092         |
| US-104 | As an agent, I want to link skills to knowledge items so that I can reference related documentation                                                   | FR-104 | 2      | Could    | US-095         |
| US-105 | As an agent, I want to detect duplicate skills so that I don't create redundant patterns                                                              | FR-105 | 2      | Should   | US-095, US-093 |

**EPIC-005 Total:** 15 stories, ~42 story points

---

### 3.6 EPIC-006: Wiki (US-106 to US-115)

| ID     | User Story                                                                                                        | FR     | Points | Priority | Deps   |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | ------ |
| US-106 | As an agent, I want to create wiki pages with title, content, hierarchy so that I can build project documentation | FR-106 | 2      | Could    | -      |
| US-107 | As an agent, I want to auto-generate wiki pages from JSDoc/docstrings so that API docs are always up-to-date      | FR-107 | 8      | Could    | US-106 |
| US-108 | As an agent, I want to cross-link wiki pages (internal links) so that navigation is seamless                      | FR-108 | 3      | Could    | US-106 |
| US-109 | As an agent, I want to version wiki pages with git so that changes are tracked                                    | FR-109 | 3      | Could    | US-106 |
| US-110 | As an agent, I want to search wiki pages by full-text so that I can find relevant documentation                   | FR-110 | 3      | Could    | US-106 |
| US-111 | As an agent, I want to update wiki pages so that I can refine documentation as project evolves                    | FR-111 | 2      | Could    | US-106 |
| US-112 | As an agent, I want to organize wiki pages in hierarchical folders so that structure is logical                   | FR-112 | 2      | Could    | US-106 |
| US-113 | As a developer, I want to view wiki pages in UI with markdown rendering so that docs are readable                 | FR-113 | 3      | Could    | US-106 |
| US-114 | As an agent, I want to link wiki pages to issues/tasks so that documentation is contextual                        | FR-114 | 2      | Could    | US-106 |
| US-115 | As an agent, I want to export wiki to static HTML so that docs can be hosted externally                           | FR-115 | 3      | Won't    | US-106 |

**EPIC-006 Total:** 10 stories, ~31 points (corrected from ~28)

---

### 3.7 EPIC-007: Project Health (US-116 to US-120)

| ID     | User Story                                                                                                                                              | FR     | Points | Priority | Deps                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | ---------------------- |
| US-116 | As an agent, I want to run security scans (Semgrep) and create findings so that vulnerabilities are tracked                                             | FR-116 | 5      | Could    | US-052                 |
| US-117 | As an agent, I want to run quality scans (ESLint) and create findings so that code quality issues are tracked                                           | FR-117 | 3      | Could    | US-052                 |
| US-118 | As an agent, I want to run accessibility scans (axe-core, Lighthouse) and create findings so that a11y issues are tracked                               | FR-118 | 3      | Could    | US-052                 |
| US-119 | As an agent, I want to calculate project health score (weighted average: security 40%, quality 30%, a11y 20%, debt 10%) so that overall status is clear | FR-119 | 5      | Could    | US-116, US-117, US-118 |
| US-120 | As a developer, I want to view health dashboard with scores and trends so that I can monitor project status                                             | FR-120 | 3      | Could    | US-119                 |

**EPIC-007 Total:** 5 stories, ~19 points (corrected from ~18)

---

### 3.8 EPIC-008: Personas (US-121 to US-125)

| ID     | User Story                                                                                                                                    | FR     | Points | Priority | Deps   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------- | ------ |
| US-121 | As an agent, I want to create personas with name, description, system_prompt so that I can define specialized sub-agents                      | FR-121 | 3      | Won't    | -      |
| US-122 | As an agent, I want to define persona activation rules (file patterns, keywords) so that personas activate automatically in relevant contexts | FR-122 | 3      | Won't    | US-121 |
| US-123 | As an agent, I want to list available personas so that I can see what specialists exist                                                       | FR-123 | 2      | Won't    | US-121 |
| US-124 | As an agent, I want to activate/deactivate personas manually so that I can override automatic activation                                      | FR-124 | 2      | Won't    | US-121 |
| US-125 | As an agent, I want to update persona system prompts so that I can refine specialist behavior as project evolves                              | FR-125 | 2      | Won't    | US-121 |

**EPIC-008 Total:** 5 stories, ~12 points (corrected from ~15)

---

## 4. Traceability Matrix

| Epic     | Story ID | FR ID                                                  | Test ID  | Sprint      | Status      |
| -------- | -------- | ------------------------------------------------------ | -------- | ----------- | ----------- |
| EPIC-001 | US-001   | FR-001: Create Phase Hierarchy                         | TEST-001 | Phase A W1  | Not Started |
| EPIC-001 | US-002   | FR-002: Update Progress Percentage                     | TEST-002 | Phase A W1  | Not Started |
| EPIC-001 | US-003   | FR-003: Retrieve Current Active Task                   | TEST-003 | Phase A W1  | Not Started |
| EPIC-001 | US-004   | FR-004: Create Session with Timestamp                  | TEST-004 | Phase A W1  | Not Started |
| EPIC-001 | US-005   | FR-005: Auto-Sync Markdown Files                       | TEST-005 | Phase A W2  | Not Started |
| EPIC-001 | US-006   | FR-006: Git Hooks Prevent Manual Edits                 | TEST-006 | Phase A W2  | Not Started |
| EPIC-001 | US-007   | FR-007: Query Hierarchy by Filters                     | TEST-007 | Phase A W2  | Not Started |
| EPIC-001 | US-008   | FR-008: Mark Task as Complete                          | TEST-008 | Phase A W1  | Not Started |
| EPIC-001 | US-009   | FR-009: Create Checkpoint with Notes                   | TEST-009 | Phase A W2  | Not Started |
| EPIC-001 | US-010   | FR-010: View Hierarchy as Tree                         | TEST-010 | Phase A W3  | Not Started |
| EPIC-001 | US-011   | FR-011: Calculate Estimated Completion Date            | TEST-011 | Phase B W5  | Not Started |
| EPIC-001 | US-012   | FR-012: Archive Completed Phases                       | TEST-012 | Phase A W3  | Not Started |
| EPIC-001 | US-013   | FR-013: Export Hierarchy to JSON/CSV                   | TEST-013 | Phase B W5  | Not Started |
| EPIC-001 | US-014   | FR-014: Validate Hierarchy Integrity                   | TEST-014 | Phase A W2  | Not Started |
| EPIC-001 | US-015   | FR-015: Bulk-Update Task Status                        | TEST-015 | Phase A W3  | Not Started |
| EPIC-001 | US-016   | FR-016: View Progress Charts                           | TEST-016 | Phase B W4  | Not Started |
| EPIC-001 | US-017   | FR-017: Link Tasks to Issues                           | TEST-017 | Phase B W4  | Not Started |
| EPIC-001 | US-018   | FR-018: Estimate Remaining Work for Phase              | TEST-018 | Phase B W5  | Not Started |
| EPIC-001 | US-019   | FR-019: Customize Hierarchy Levels                     | TEST-019 | Post-MVP    | Not Started |
| EPIC-001 | US-020   | FR-020: Detect Stale Tasks                             | TEST-020 | Phase B W5  | Not Started |
| EPIC-001 | US-021   | FR-021: Rollback Task to Previous State                | TEST-021 | Phase B W5  | Not Started |
| EPIC-001 | US-022   | FR-022: Duplicate Task Structure                       | TEST-022 | Phase B W5  | Not Started |
| EPIC-001 | US-023   | FR-023: Set Task Dependencies                          | TEST-023 | Phase A W3  | Not Started |
| EPIC-001 | US-024   | FR-024: Log Task Events                                | TEST-024 | Phase A W2  | Not Started |
| EPIC-001 | US-025   | FR-025: Sync Hierarchy with .agent/task Files          | TEST-025 | Phase A W2  | Not Started |
| EPIC-002 | US-026   | FR-026: Start Predefined Workflow                      | TEST-026 | Phase A W3  | Not Started |
| EPIC-002 | US-027   | FR-027: Track Current Workflow Step                    | TEST-027 | Phase A W3  | Not Started |
| EPIC-002 | US-028   | FR-028: Mark Workflow Step Complete                    | TEST-028 | Phase A W3  | Not Started |
| EPIC-002 | US-029   | FR-029: Alert if Workflow Step Skipped                 | TEST-029 | Phase A W4  | Not Started |
| EPIC-002 | US-030   | FR-030: View All Available Workflows                   | TEST-030 | Phase A W3  | Not Started |
| EPIC-002 | US-031   | FR-031: Resume Workflow After Interruption             | TEST-031 | Phase A W4  | Not Started |
| EPIC-002 | US-032   | FR-032: Rollback to Previous Workflow Step             | TEST-032 | Phase B W5  | Not Started |
| EPIC-002 | US-033   | FR-033: Define Custom Workflows                        | TEST-033 | Post-MVP    | Not Started |
| EPIC-002 | US-034   | FR-034: Visualize Workflow Progress                    | TEST-034 | Phase B W6  | Not Started |
| EPIC-002 | US-035   | FR-035: Checkpoint Workflow State Every 15K Tokens     | TEST-035 | Phase A W4  | Not Started |
| EPIC-002 | US-036   | FR-036: Validate Workflow Prerequisites                | TEST-036 | Phase A W4  | Not Started |
| EPIC-002 | US-037   | FR-037: Log Workflow Failures                          | TEST-037 | Phase A W4  | Not Started |
| EPIC-002 | US-038   | FR-038: Get Recovery Suggestions on Failure            | TEST-038 | Phase B W5  | Not Started |
| EPIC-002 | US-039   | FR-039: Track Workflow Execution Time                  | TEST-039 | Phase B W6  | Not Started |
| EPIC-002 | US-040   | FR-040: Link Workflow Steps to Tasks                   | TEST-040 | Phase B W5  | Not Started |
| EPIC-002 | US-041   | FR-041: Enforce Step Order                             | TEST-041 | Phase A W4  | Not Started |
| EPIC-002 | US-042   | FR-042: Mark Workflows as Complete                     | TEST-042 | Phase A W4  | Not Started |
| EPIC-002 | US-043   | FR-043: Export Workflow History to JSON                | TEST-043 | Phase B W6  | Not Started |
| EPIC-002 | US-044   | FR-044: Retry Failed Workflow Step Automatically       | TEST-044 | Phase B W5  | Not Started |
| EPIC-002 | US-045   | FR-045: Validate Workflow Completion Criteria          | TEST-045 | Phase A W4  | Not Started |
| EPIC-002 | US-046   | FR-046: Branch Workflows (If-Then-Else Logic)          | TEST-046 | Post-MVP    | Not Started |
| EPIC-002 | US-047   | FR-047: Receive Notifications for Human Approval       | TEST-047 | Phase B W6  | Not Started |
| EPIC-002 | US-048   | FR-048: Track Workflow Dependencies                    | TEST-048 | Phase B W5  | Not Started |
| EPIC-002 | US-049   | FR-049: Audit Workflow Execution History               | TEST-049 | Phase B W6  | Not Started |
| EPIC-002 | US-050   | FR-050: Detect Duplicate Workflow Executions           | TEST-050 | Phase B W6  | Not Started |
| EPIC-003 | US-051   | FR-051: Create Single Issue                            | TEST-051 | Phase B W7  | Not Started |
| EPIC-003 | US-052   | FR-052: Bulk-Create Issues (10-50 at once)             | TEST-052 | Phase B W7  | Not Started |
| EPIC-003 | US-053   | FR-053: Auto-Tag Issues Based on File Paths            | TEST-053 | Phase B W7  | Not Started |
| EPIC-003 | US-054   | FR-054: Inject Context into Issues                     | TEST-054 | Phase B W7  | Not Started |
| EPIC-003 | US-055   | FR-055: Update Issue Status                            | TEST-055 | Phase B W7  | Not Started |
| EPIC-003 | US-056   | FR-056: Query Issues by Filters                        | TEST-056 | Phase B W7  | Not Started |
| EPIC-003 | US-057   | FR-057: Link Issues to Tasks                           | TEST-057 | Phase B W8  | Not Started |
| EPIC-003 | US-058   | FR-058: Create Issues Manually via UI                  | TEST-058 | Phase B W7  | Not Started |
| EPIC-003 | US-059   | FR-059: Bulk Approve/Reject Agent-Created Issues       | TEST-059 | Phase B W8  | Not Started |
| EPIC-003 | US-060   | FR-060: Assign Issues to Personas                      | TEST-060 | Post-MVP    | Not Started |
| EPIC-003 | US-061   | FR-061: Detect Duplicate Issues                        | TEST-061 | Phase B W8  | Not Started |
| EPIC-003 | US-062   | FR-062: Prioritize Issues Using Severity Scoring       | TEST-062 | Phase B W7  | Not Started |
| EPIC-003 | US-063   | FR-063: Link Issues to Knowledge Items                 | TEST-063 | Phase C W9  | Not Started |
| EPIC-003 | US-064   | FR-064: Archive Resolved Issues                        | TEST-064 | Phase B W8  | Not Started |
| EPIC-003 | US-065   | FR-065: Export Issues to CSV/JSON                      | TEST-065 | Phase C W9  | Not Started |
| EPIC-003 | US-066   | FR-066: Comment on Issues                              | TEST-066 | Phase B W8  | Not Started |
| EPIC-003 | US-067   | FR-067: Link Issues to Pull Requests/Commits           | TEST-067 | Phase C W9  | Not Started |
| EPIC-003 | US-068   | FR-068: Estimate Issue Resolution Time                 | TEST-068 | Phase C W10 | Not Started |
| EPIC-003 | US-069   | FR-069: Create Issue Templates                         | TEST-069 | Phase C W9  | Not Started |
| EPIC-003 | US-070   | FR-070: View Issue Trends                              | TEST-070 | Phase B W8  | Not Started |
| EPIC-004 | US-071   | FR-071: Add Knowledge Items                            | TEST-071 | Phase C W9  | Not Started |
| EPIC-004 | US-072   | FR-072: Query Knowledge Using Hybrid Search            | TEST-072 | Phase C W9  | Not Started |
| EPIC-004 | US-073   | FR-073: Semantic Search with pgvector Embeddings       | TEST-073 | Phase C W9  | Not Started |
| EPIC-004 | US-074   | FR-074: Full-Text Search with tsvector                 | TEST-074 | Phase C W9  | Not Started |
| EPIC-004 | US-075   | FR-075: Hybrid Search Merge Results                    | TEST-075 | Phase C W9  | Not Started |
| EPIC-004 | US-076   | FR-076: Traverse Knowledge Graph (Max 2 Hops)          | TEST-076 | Phase C W9  | Not Started |
| EPIC-004 | US-077   | FR-077: Create Relationships Between Knowledge Items   | TEST-077 | Phase C W9  | Not Started |
| EPIC-004 | US-078   | FR-078: Limit Query Results to Top-K                   | TEST-078 | Phase C W9  | Not Started |
| EPIC-004 | US-079   | FR-079: Generate Embeddings Automatically              | TEST-079 | Phase C W9  | Not Started |
| EPIC-004 | US-080   | FR-080: Update Knowledge Items                         | TEST-080 | Phase C W9  | Not Started |
| EPIC-004 | US-081   | FR-081: Delete Knowledge Items                         | TEST-081 | Phase C W9  | Not Started |
| EPIC-004 | US-082   | FR-082: View Knowledge Graph Visualization             | TEST-082 | Phase C W10 | Not Started |
| EPIC-004 | US-083   | FR-083: Tag Knowledge Items by Category                | TEST-083 | Phase C W9  | Not Started |
| EPIC-004 | US-084   | FR-084: Version Knowledge Items                        | TEST-084 | Phase C W10 | Not Started |
| EPIC-004 | US-085   | FR-085: Link Knowledge Items to Issues/Tasks           | TEST-085 | Phase C W10 | Not Started |
| EPIC-004 | US-086   | FR-086: Measure Query Performance                      | TEST-086 | Phase C W10 | Not Started |
| EPIC-004 | US-087   | FR-087: Export Knowledge Graph to JSON                 | TEST-087 | Phase C W10 | Not Started |
| EPIC-004 | US-088   | FR-088: Import Knowledge from Markdown Files           | TEST-088 | Phase C W10 | Not Started |
| EPIC-004 | US-089   | FR-089: Detect Duplicate Knowledge Items               | TEST-089 | Phase C W10 | Not Started |
| EPIC-004 | US-090   | FR-090: Archive Obsolete Knowledge Items               | TEST-090 | Phase C W10 | Not Started |
| EPIC-005 | US-091   | FR-091: List Available Skills with Frontmatter         | TEST-091 | Phase C W11 | Not Started |
| EPIC-005 | US-092   | FR-092: Load Skill's Full Content On-Demand            | TEST-092 | Phase C W11 | Not Started |
| EPIC-005 | US-093   | FR-093: Search Skills by Keywords/Tags                 | TEST-093 | Phase C W11 | Not Started |
| EPIC-005 | US-094   | FR-094: Skills Auto-Unload After 5 Minutes             | TEST-094 | Phase C W11 | Not Started |
| EPIC-005 | US-095   | FR-095: Create Skills with Frontmatter + Content       | TEST-095 | Phase C W11 | Not Started |
| EPIC-005 | US-096   | FR-096: Categorize Skills                              | TEST-096 | Phase C W11 | Not Started |
| EPIC-005 | US-097   | FR-097: Validate Skill Frontmatter Format              | TEST-097 | Phase C W11 | Not Started |
| EPIC-005 | US-098   | FR-098: Measure Token Usage Per Skill Load             | TEST-098 | Phase C W12 | Not Started |
| EPIC-005 | US-099   | FR-099: Update Skill Content                           | TEST-099 | Phase C W11 | Not Started |
| EPIC-005 | US-100   | FR-100: Delete Skills                                  | TEST-100 | Phase C W11 | Not Started |
| EPIC-005 | US-101   | FR-101: Export Skills to Markdown Files                | TEST-101 | Phase C W12 | Not Started |
| EPIC-005 | US-102   | FR-102: Import Skills from Markdown Files              | TEST-102 | Phase C W12 | Not Started |
| EPIC-005 | US-103   | FR-103: Track Skill Usage Frequency                    | TEST-103 | Phase C W12 | Not Started |
| EPIC-005 | US-104   | FR-104: Link Skills to Knowledge Items                 | TEST-104 | Phase C W12 | Not Started |
| EPIC-005 | US-105   | FR-105: Detect Duplicate Skills                        | TEST-105 | Phase C W11 | Not Started |
| EPIC-006 | US-106   | FR-106: Create Wiki Pages                              | TEST-106 | Phase C W12 | Not Started |
| EPIC-006 | US-107   | FR-107: Auto-Generate Wiki from JSDoc/Docstrings       | TEST-107 | Phase C W12 | Not Started |
| EPIC-006 | US-108   | FR-108: Cross-Link Wiki Pages                          | TEST-108 | Phase C W12 | Not Started |
| EPIC-006 | US-109   | FR-109: Version Wiki Pages with Git                    | TEST-109 | Phase C W12 | Not Started |
| EPIC-006 | US-110   | FR-110: Search Wiki Pages by Full-Text                 | TEST-110 | Phase C W12 | Not Started |
| EPIC-006 | US-111   | FR-111: Update Wiki Pages                              | TEST-111 | Phase C W12 | Not Started |
| EPIC-006 | US-112   | FR-112: Organize Wiki Pages in Hierarchical Folders    | TEST-112 | Phase C W12 | Not Started |
| EPIC-006 | US-113   | FR-113: View Wiki Pages in UI with Markdown Rendering  | TEST-113 | Phase C W12 | Not Started |
| EPIC-006 | US-114   | FR-114: Link Wiki Pages to Issues/Tasks                | TEST-114 | Phase C W12 | Not Started |
| EPIC-006 | US-115   | FR-115: Export Wiki to Static HTML                     | TEST-115 | Post-MVP    | Not Started |
| EPIC-007 | US-116   | FR-116: Run Security Scans (Semgrep)                   | TEST-116 | Phase D W13 | Not Started |
| EPIC-007 | US-117   | FR-117: Run Quality Scans (ESLint)                     | TEST-117 | Phase D W13 | Not Started |
| EPIC-007 | US-118   | FR-118: Run Accessibility Scans (axe-core, Lighthouse) | TEST-118 | Phase D W13 | Not Started |
| EPIC-007 | US-119   | FR-119: Calculate Project Health Score                 | TEST-119 | Phase D W13 | Not Started |
| EPIC-007 | US-120   | FR-120: View Health Dashboard                          | TEST-120 | Phase D W13 | Not Started |
| EPIC-008 | US-121   | FR-121: Create Personas                                | TEST-121 | Post-MVP    | Not Started |
| EPIC-008 | US-122   | FR-122: Define Persona Activation Rules                | TEST-122 | Post-MVP    | Not Started |
| EPIC-008 | US-123   | FR-123: List Available Personas                        | TEST-123 | Post-MVP    | Not Started |
| EPIC-008 | US-124   | FR-124: Activate/Deactivate Personas Manually          | TEST-124 | Post-MVP    | Not Started |
| EPIC-008 | US-125   | FR-125: Update Persona System Prompts                  | TEST-125 | Post-MVP    | Not Started |

**Total:** 125 user stories mapped to 125 FRs and 125 tests

---

## 5. Summary & Cross-References

### 5.1 Story Point Summary by Epic

| Epic      | Epic Name              | Story Count | Total Points | MoSCoW      | Sprint Allocation                  |
| --------- | ---------------------- | ----------- | ------------ | ----------- | ---------------------------------- |
| EPIC-001  | Sprint/Phase Tracking  | 25          | 87           | Must Have   | Phase A W1-2 (5-6 sprints)         |
| EPIC-002  | Workflow Orchestration | 25          | 95           | Must Have   | Phase A W3-4, B W5-6 (5-6 sprints) |
| EPIC-003  | Issues                 | 20          | 62           | Must Have   | Phase B W7-8 (3-4 sprints)         |
| EPIC-004  | Knowledge              | 20          | 78           | Should Have | Phase C W9-10 (4-5 sprints)        |
| EPIC-005  | Skills                 | 15          | 42           | Should Have | Phase C W11 (2-3 sprints)          |
| EPIC-006  | Wiki                   | 10          | 31           | Could Have  | Phase C W12 (1-2 sprints)          |
| EPIC-007  | Project Health         | 5           | 19           | Could Have  | Phase D W13 (1 sprint)             |
| EPIC-008  | Personas               | 5           | 12           | Won't Have  | Post-MVP                           |
| **Total** | **8 Epics**            | **125**     | **426**      | -           | **~11 sprints (22 weeks)**         |

**MVP Scope (Must + Should):** 105 stories, 364 points, ~9 sprints (18 weeks)

---

### 5.2 Cross-References

| Document                 | Purpose                                          | Link                                         |
| ------------------------ | ------------------------------------------------ | -------------------------------------------- |
| **01-PRD.md**            | Product Requirements (8 MVP features → 8 epics)  | [01-PRD.md](01-PRD.md)                       |
| **02-SRS.md**            | System Requirements (125 FRs → 125 user stories) | [02-SRS.md](02-SRS.md)                       |
| **03-Architecture.md**   | System architecture and design patterns          | [03-Architecture.md](03-Architecture.md)     |
| **09-Testing-and-QA.md** | Test strategy (TEST-001 to TEST-125)             | [09-Testing-and-QA.md](09-Testing-and-QA.md) |
| **13-Project-Plan.md**   | Implementation roadmap and sprint planning       | [13-Project-Plan.md](13-Project-Plan.md)     |

---

### 5.3 Backlog Maintenance

**Review Cycle:** Every 2 weeks (sprint planning)

**Update Triggers:**

- New FRs added to SRS → Add corresponding user stories
- Epic priorities change → Update MoSCoW classifications
- Story point estimates revised after implementation → Update estimates
- Sprint allocation changes → Update traceability matrix

**Version Control:** All backlog changes tracked in git with commit messages linking to issue/decision tickets

---

**Document End**

**Last Updated:** 2025-11-02
**Next Review:** Sprint 1 Planning (Phase A Week 1)
**Total Lines:** 663 lines (target: 600 lines, +10.5% over target for completeness)
