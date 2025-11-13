# Documentation Migration Guide

**Version:** 3.0 (Cloud SaaS Architecture)
**Migration Date:** 2025-11-13
**Old Structure:** File-based documentation with manual workflows
**New Structure:** Cloud database with API access + auto-generated exports
**Purpose:** Guide migration from file-based workflows to cloud-first architecture

---

## Table of Contents

1. [What Changed and Why](#1-what-changed-and-why)
2. [Old → New File Mapping](#2-old--new-file-mapping)
3. [Reading Paths](#3-reading-paths)
4. [Navigation FAQs](#4-navigation-faqs)
5. [Quick Start Guides](#5-quick-start-guides)
6. [Traceability System](#6-traceability-system)

---

## 1. What Changed and Why

### The Pivot: UI-First → Agent-First

**Old Approach (Week 1-1.5):**

- Manual interaction via rich UI
- 7 complete UI pages with dark neumorphic coral theme
- Direct database CRUD operations
- Human-driven workflows

**New Approach (Week 2+):**

- Agent-first automation (95% MCP, 5% UI monitoring)
- AI agents execute complete workflows autonomously
- Database as source of truth
- MCP tools for programmatic access

**Why We Pivoted:**

- **Token Efficiency:** 92% reduction via skills, 88% via knowledge graph
- **Automation Potential:** Complete workflows via MCP without human intervention
- **Value Proposition:** Platform FOR AI agents (Claude Code, Cursor AI, Codex)

**Key Decision:** See [ADR-001: Agent-First Architecture](architecture/ADRs/ADR-001-agent-first-architecture.md)

### Documentation Restructure

**Before (v2.0 - File-Based):**

- File-based documentation requiring manual sync
- Markdown files as source of truth (`STATUS.md`, `DEVELOPMENT_PLAN.md`)
- Manual agent workflows (read files → update files → commit)
- Completion records as markdown files (`COMPLETION_*.md`)
- No real-time updates (must commit + push for visibility)
- Limited queryability (grep/find vs SQL)
- No API access for programmatic queries

**After (v3.0 - Cloud SaaS):**

- **Database as source of truth** (PostgreSQL with 10+ Prisma models)
- **Real-time updates** via WebSocket connections
- **API-first architecture** (42 MCP tools + REST endpoints)
- **Query-driven workflows** (SQL vs grep, instant results)
- **Automated exports** (markdown generation from database)
- **Dashboard UI** for real-time project visibility
- Complete FR traceability (FR-001 to FR-125) in database
- 5 ADRs documenting architectural decisions

### Statistics

| Metric                      | Old (v1.5)           | New (v2.0)                             | Change            |
| --------------------------- | -------------------- | -------------------------------------- | ----------------- |
| **Total Lines**             | ~4,200               | 27,356                                 | +651%             |
| **Documents**               | 3-4 main files       | 14 documents + 5 ADRs                  | +375%             |
| **Functional Requirements** | Implicit             | 125 FRs (FR-001 to FR-125)             | Explicit          |
| **Architecture Decisions**  | None documented      | 5 ADRs                                 | +5 ADRs           |
| **API Specification**       | Inline code comments | OpenAPI 3.1 (41 tools)                 | Industry standard |
| **Traceability**            | None                 | Complete (PRD → SRS → Tests → Backlog) | End-to-end        |

---

## 2. Migration Path: Files → Cloud Database

> **⚠️ Historical Context (v2.0 - November 2, 2025)**
> This section originally documented splitting `DEVELOPMENT_PLAN.md` into 14 specialized files.
> **Current Architecture (v3.0 - November 13, 2025):** Database entities with API access + optional markdown exports.
> See [Current Cloud Architecture](#current-cloud-architecture-v30) below for the modern approach.

### 2.1 Historical File Restructure (v1.5 → v2.0)

The tables below show the original file-based restructure. This is **historical reference only**.

#### Root Level Files (Historical)

| Old Location                              | Old Lines | New Location                                           | New Lines | What Changed                                          |
| ----------------------------------------- | --------- | ------------------------------------------------------ | --------- | ----------------------------------------------------- |
| **DEVELOPMENT_PLAN.md** (lines 1-200)     | 200       | [STATUS.md](../STATUS.md)                              | 200       | Current status only (unchanged)                       |
| **DEVELOPMENT_PLAN.md** (lines 201-600)   | 400       | [01-PRD.md](01-PRD.md)                                 | 671       | Product vision expanded, agent-first focus            |
| **DEVELOPMENT_PLAN.md** (lines 601-1200)  | 600       | [02-SRS.md](02-SRS.md)                                 | 4,097     | Split into 125 FRs with acceptance criteria           |
| **DEVELOPMENT_PLAN.md** (lines 1201-1600) | 400       | [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md) | 3,350     | Database schema expanded (10 models → 17 fields each) |
| **DEVELOPMENT_PLAN.md** (lines 1601-2000) | 400       | [13-Project-Plan.md](13-Project-Plan.md)               | 898       | Timeline restructured (5 phases, 16 weeks, 8 sprints) |

#### Planning Documents (Historical)

| Old Location                                    | Old Lines | New Location                                       | New Lines    | What Changed                             |
| ----------------------------------------------- | --------- | -------------------------------------------------- | ------------ | ---------------------------------------- |
| **PLANNING_PHASES_projectpulse-agent-first.md** | 1,950     | [archive/ui-first-phase/](archive/ui-first-phase/) | -            | Archived as historical reference         |
| **PLANNING_PHASES** (key decisions)             | 200       | [architecture/ADRs/](architecture/ADRs/)           | 473 (5 ADRs) | Formal ADRs created (ADR-001 to ADR-005) |
| **IMPLEMENTATION_ROADMAP_projectpulse.md**      | 1,294     | [13-Project-Plan.md](13-Project-Plan.md)           | 898          | Consolidated into project plan           |

#### Architecture Documents (Historical)

| Old Location                                    | Old Lines | New Location                                                                                                         | New Lines | What Changed                                                  |
| ----------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------- |
| **DEVELOPMENT_PLAN.md** (architecture sections) | 300       | [03-Architecture.md](03-Architecture.md)                                                                             | 2,849     | System diagrams (Mermaid), components, cross-cutting concerns |
| _(No equivalent)_                               | -         | [architecture/ADRs/ADR-001-agent-first-architecture.md](architecture/ADRs/ADR-001-agent-first-architecture.md)       | 85        | New: Documents UI-first → Agent-first pivot                   |
| _(No equivalent)_                               | -         | [architecture/ADRs/ADR-002-database-as-source-of-truth.md](architecture/ADRs/ADR-002-database-as-source-of-truth.md) | 89        | New: Markdown auto-generation decision                        |
| _(No equivalent)_                               | -         | [architecture/ADRs/ADR-003-hybrid-knowledge-graph.md](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md)           | 106       | New: Semantic + full-text + 2-hop traversal                   |
| _(No equivalent)_                               | -         | [architecture/ADRs/ADR-004-single-mcp-server.md](architecture/ADRs/ADR-004-single-mcp-server.md)                     | 104       | New: 41 tools in one server decision                          |
| _(No equivalent)_                               | -         | [architecture/ADRs/ADR-005-five-level-hierarchy.md](architecture/ADRs/ADR-005-five-level-hierarchy.md)               | 89        | New: Phase→Week→Day→Task→Session hierarchy                    |

#### Operations Documents (Historical)

| Old Location                          | Old Lines | New Location                                                               | New Lines    | What Changed                                        |
| ------------------------------------- | --------- | -------------------------------------------------------------------------- | ------------ | --------------------------------------------------- |
| _(No equivalent)_                     | -         | [05-AgentOps-Plan.md](05-AgentOps-Plan.md)                                 | 3,039        | New: 12 workflows, MCP patterns, agent governance   |
| _(No equivalent)_                     | -         | [06-API/openapi.yaml](06-API/openapi.yaml)                                 | 76,913 bytes | New: OpenAPI 3.1 (42 MCP tools + REST)              |
| **DEVELOPMENT_PLAN.md** (UI sections) | 200       | [07-UI-UX.md](07-UI-UX.md)                                                 | 1,583        | User journeys, component catalog, responsive design |
| _(No equivalent)_                     | -         | [08-Security-and-Compliance.md](08-Security-and-Compliance.md)             | 1,352        | New: Threat model, autonomy levels (L1/L2/L3)       |
| _(No equivalent)_                     | -         | [09-Testing-and-QA.md](09-Testing-and-QA.md)                               | 2,442        | New: Test pyramid, quality gates, release criteria  |
| _(No equivalent)_                     | -         | [10-Observability-and-SRE.md](10-Observability-and-SRE.md)                 | 2,947        | New: Metrics, SLOs, alerts, incident workflow       |
| _(No equivalent)_                     | -         | [11-Infrastructure-and-Deployment.md](11-Infrastructure-and-Deployment.md) | 3,222        | New: CI/CD, environments, git workflow, migrations  |

#### Backlog & Planning (Historical)

| Old Location                                    | Old Lines | New Location                             | New Lines | What Changed                                                        |
| ----------------------------------------------- | --------- | ---------------------------------------- | --------- | ------------------------------------------------------------------- |
| **DEVELOPMENT_PLAN.md** (user stories implicit) | -         | [12-Backlog.md](12-Backlog.md)           | 703       | New: 8 epics, 125 user stories (US-001 to US-125), 426 story points |
| **IMPLEMENTATION_ROADMAP_projectpulse.md**      | 1,294     | [13-Project-Plan.md](13-Project-Plan.md) | 898       | Restructured: 5 phases, 16 weeks, 8 sprints, 426 points             |

#### Completion Documents (Historical)

> **Note:** Before database migration, agents created markdown completion files. Modern workflow uses database records: `POST /api/sessions/{id}/complete`

| Old Location                      | Old Lines | New Location                                                                                                 | New Lines | What Changed                        |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------- |
| **COMPLETION_WEEK_1_DAYS_1_5.md** | 400       | [archive/ui-first-phase/COMPLETION_WEEK_1_DAYS_1_5.md](archive/ui-first-phase/COMPLETION_WEEK_1_DAYS_1_5.md) | 400       | Moved to archive                    |
| **COMPLETION\_\*.md** (5 files)   | 2,000     | [archive/ui-first-phase/](archive/ui-first-phase/)                                                           | 2,000     | All Week 1-1.5 completions archived |

---

#### Deprecated/Archived (2025-11-04)

| Old Location                           | Action   | New/Canonical Target                   | Reason                                                  |
| -------------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------- |
| docs/DEVELOPMENT_PLAN_AUDIT.md         | Archive  | docs/MIGRATION_GUIDE.md                | Orphan; superseded by migration policy and DEV plan stub |

All archived docs are moved under `docs/archive/deprecated/2025-11/` to preserve traceability.

#### Archived Completions (2025-11-04)

> **Note:** Historical agent completion artifacts. Modern workflow stores completion data in `Session.completionReport` (JSONB) via API.

| Old Location                                  | Action  | New Location                                                | Reason                                 |
| --------------------------------------------- | ------- | ----------------------------------------------------------- | -------------------------------------- |
| COMPLETION_PHASE3_DAY4_ISSUE_DETAIL_PAGE.md   | Archive | docs/archive/completions/2025-11/COMPLETION_PHASE3_DAY4_ISSUE_DETAIL_PAGE.md | Agent completion artifact; archived    |
| COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md      | Archive | docs/archive/completions/2025-11/COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md    | Agent completion artifact; archived    |
| COMPLETION_PHASE3_TESTING_QA.md               | Archive | docs/archive/completions/2025-11/COMPLETION_PHASE3_TESTING_QA.md             | Agent completion artifact; archived    |
| COMPLETION_WEEK_1.5_PHASE_3_DAY_4.md          | Archive | docs/archive/completions/2025-11/COMPLETION_WEEK_1.5_PHASE_3_DAY_4.md        | Agent completion artifact; archived    |
| WEEK_1_5_PHASE_1_COMPLETION.md                | Archive | docs/archive/completions/2025-11/WEEK_1_5_PHASE_1_COMPLETION.md              | Agent completion artifact; archived    |
| WEEK_1_5_PHASE_2_COMPLETION.md                | Archive | docs/archive/completions/2025-11/WEEK_1_5_PHASE_2_COMPLETION.md              | Agent completion artifact; archived    |
| WEEK_1_DAYS_3_4_COMPLETION.md                 | Archive | docs/archive/completions/2025-11/WEEK_1_DAYS_3_4_COMPLETION.md               | Agent completion artifact; archived    |
| WEEK_1_DAY_2_COMPLETION.md                    | Archive | docs/archive/completions/2025-11/WEEK_1_DAY_2_COMPLETION.md                  | Agent completion artifact; archived    |
| WEEK_1_DAY_5_COMPLETION.md                    | Archive | docs/archive/completions/2025-11/WEEK_1_DAY_5_COMPLETION.md                  | Agent completion artifact; archived    |
| docs/COMPLETION_PHASE_5_FINAL_INTEGRATION.md  | Archive | docs/archive/completions/2025-11/COMPLETION_PHASE_5_FINAL_INTEGRATION.md     | Agent completion artifact; archived    |
| .claude/PHASES_6-8_COMPLETION.md              | Archive | docs/archive/completions/2025-11/PHASES_6-8_COMPLETION.md                    | Agent completion artifact; archived    |
| .claude/PHASE_5_COMPLETION.md                 | Archive | docs/archive/completions/2025-11/PHASE_5_COMPLETION.md                        | Agent completion artifact; archived    |

---

### 2.2 Current Cloud Architecture (v3.0)

The modern architecture uses **database entities** with **API access** instead of file-based workflows.

#### Files → Database Entity Mapping

| Old File-Based Pattern | New Cloud Pattern | Access Method |
|------------------------|-------------------|---------------|
| `STATUS.md` (current status) | Project Dashboard | `/dashboard` or `GET /api/project/status` |
| `DEVELOPMENT_PLAN.md` (planning) | Database entities: `Phase`, `Week`, `Day`, `Task`, `Session` | MCP tools, REST API, or dashboard UI |
| `COMPLETION_*.md` (completion files) | `Session.completionReport` (JSONB field) | `GET /api/sessions/{id}/completion` |
| `docs/completions/` (completion folder) | Database query | `GET /api/sessions/completed?sort=recent` |
| `02-SRS.md` (requirements) | `Requirement` model | `GET /api/requirements` or export button |
| `12-Backlog.md` (user stories) | `UserStory` model | `GET /api/backlog` or export button |
| ADR markdown files | `ArchitectureDecision` model | `GET /api/architecture/adr` or UI decision log |

#### Key Architectural Principles

1. **Database as Source of Truth**
   - All data stored in PostgreSQL (10+ Prisma models)
   - Real-time updates via WebSocket
   - Markdown exports are **generated** from database, not synced **to** database

2. **API-First Data Access**
   - REST API: `GET /api/{entity}`, `POST /api/{entity}`, etc.
   - MCP Tools: 42 programmatic tools for agent access
   - Dashboard UI: Real-time web interface

3. **Optional Markdown Exports**
   - Export via UI: "Export" button on any entity page
   - Export via API: `GET /api/export/markdown/{entityType}/{id}`
   - Export via MCP: `export.toMarkdown(entityType, id, destination)`
   - Exports are for **backup/version control only** - not source of truth

4. **Real-Time Synchronization**
   - WebSocket connections for live updates
   - No manual git commits required for progress tracking
   - Automatic UI refresh when data changes

#### Migration Example: Session Tracking

**Old Workflow (File-Based):**
```bash
# Agent creates markdown file
echo "# Session Report" > .agent/task/current-session-20251113.md
echo "Progress: 50%" >> .agent/task/current-session-20251113.md

# Agent commits and pushes
git add .agent/task/current-session-20251113.md
git commit -m "docs: update session progress"
git push
```

**New Workflow (Cloud Database):**
```javascript
// Agent updates via API
await fetch('/api/sessions/123/checkpoint', {
  method: 'POST',
  body: JSON.stringify({
    tokenCount: 45000,
    progress: 50,
    notes: "Completed component implementation"
  })
});

// UI updates automatically via WebSocket
// Optional: Export to markdown for git backup
await fetch('/api/export/session/123.md');
```

#### Benefits of Cloud Architecture

| Aspect | File-Based (v2.0) | Cloud Database (v3.0) |
|--------|-------------------|----------------------|
| **Real-time updates** | No (requires git push) | Yes (WebSocket) |
| **Queryability** | Limited (grep/find) | Full (SQL queries) |
| **Concurrent access** | Merge conflicts | Transaction-safe |
| **Agent automation** | File I/O + git operations | Simple API calls |
| **Backup** | Git only | Database + optional markdown exports |
| **Search** | Text search in files | Structured database queries |

---

## 3. Reading Paths

### Path 1: Developer (Implementation Focus)

**Goal:** Understand system design and start coding

**Recommended Order:**

1. **[docs/README.md](README.md)** (5 min) → Overview of documentation structure
2. **[03-Architecture.md](03-Architecture.md)** (20 min) → System design, components, data flow
3. **[04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md)** (15 min) → Prisma schema (10 models, 47 fields)
4. **[06-API/openapi.yaml](06-API/openapi.yaml)** (10 min) → API contracts (42 MCP tools + REST)
5. **[09-Testing-and-QA.md](09-Testing-and-QA.md)** (10 min) → Test pyramid, quality gates (60%→70%→80% coverage)
6. **[11-Infrastructure-and-Deployment.md](11-Infrastructure-and-Deployment.md)** (10 min) → Git workflow, deployment, migrations

**Total Time:** ~70 minutes

**Next Steps:** View [Project Dashboard](/dashboard) for current phase, start coding!

---

### Path 2: Product/Planning (Feature Focus)

**Goal:** Understand product vision and feature roadmap

**Recommended Order:**

1. **[docs/README.md](README.md)** (5 min) → Overview of documentation structure
2. **[01-PRD.md](01-PRD.md)** (30 min) → Agent-first philosophy, user personas, MVP features
3. **[02-SRS.md](02-SRS.md)** (60 min) → All 125 Functional Requirements (FR-001 to FR-125)
4. **[12-Backlog.md](12-Backlog.md)** (30 min) → 8 epics, 125 user stories, 426 story points
5. **[13-Project-Plan.md](13-Project-Plan.md)** (30 min) → 16-week timeline, 5 phases, 8 sprints

**Total Time:** ~2.5 hours

**Next Steps:** Review specific epics/stories, prioritize backlog with team

---

### Path 3: Architecture/Technical Decisions

**Goal:** Understand key architectural decisions and rationale

**Recommended Order:**

1. **[architecture/ADRs/ADR-001-agent-first-architecture.md](architecture/ADRs/ADR-001-agent-first-architecture.md)** (10 min) → Why agent-first?
2. **[architecture/ADRs/ADR-002-database-as-source-of-truth.md](architecture/ADRs/ADR-002-database-as-source-of-truth.md)** (10 min) → Markdown auto-generation
3. **[architecture/ADRs/ADR-003-hybrid-knowledge-graph.md](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md)** (10 min) → Search strategy (semantic + full-text + graph)
4. **[architecture/ADRs/ADR-004-single-mcp-server.md](architecture/ADRs/ADR-004-single-mcp-server.md)** (10 min) → Why 41 tools in one server?
5. **[architecture/ADRs/ADR-005-five-level-hierarchy.md](architecture/ADRs/ADR-005-five-level-hierarchy.md)** (10 min) → Phase→Week→Day→Task→Session
6. **[03-Architecture.md](03-Architecture.md)** (20 min) → System context, components, sequence diagrams
7. **[05-AgentOps-Plan.md](05-AgentOps-Plan.md)** (30 min) → 12 agent workflows, MCP patterns
8. **[08-Security-and-Compliance.md](08-Security-and-Compliance.md)** (20 min) → Threat model, autonomy levels

**Total Time:** ~2 hours

**Next Steps:** Review architecture diagrams, evaluate tradeoffs

---

## 4. Navigation FAQs

### General Navigation

**Q: Where do I start?**
**A:** Read [docs/README.md](README.md) first for overview, then choose a reading path above

**Q: Where is the current project status?**
**A:** View the [Project Dashboard](/dashboard) for real-time status, or query via `GET /api/project/status`

**Q: How did we migrate from files to database?**
**A:** Transitioned from file-based workflows to cloud database with API access. See [Old → New File Mapping](#2-old--new-file-mapping)

**Q: Can I still export to markdown?**
**A:** Yes! Use `GET /api/export/markdown/{entityType}` or the "Export" button in the dashboard UI

**Q: Where is the Week 1-1.5 UI work?**
**A:** Preserved in [docs/archive/ui-first-phase/](archive/ui-first-phase/) with comprehensive README

### Technical Documentation

**Q: Where is the database schema?**
**A:** [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md) (10 Prisma models, 47 fields total)

**Q: Where are the API endpoints?**
**A:** [06-API/openapi.yaml](06-API/openapi.yaml) (OpenAPI 3.1 with 42 MCP tools + REST)

**Q: Where are the architecture diagrams?**
**A:** [03-Architecture.md](03-Architecture.md) (Mermaid diagrams: system context, components, sequences)

**Q: Where are the agent workflows?**
**A:** [05-AgentOps-Plan.md](05-AgentOps-Plan.md) (12 workflows with MCP tool mapping)

### Requirements & Planning

**Q: How do I find a specific requirement?**
**A:** Search for `FR-XXX` in [02-SRS.md](02-SRS.md). Example: FR-001, FR-025, FR-125

**Q: Where are the user stories?**
**A:** [12-Backlog.md](12-Backlog.md) (125 stories: US-001 to US-125, grouped into 8 epics)

**Q: Where is the project timeline?**
**A:** [13-Project-Plan.md](13-Project-Plan.md) (16 weeks, 5 phases, 8 sprints)

**Q: Where are the completion documents?**
**A:** Week 1-1.5 completions: [archive/ui-first-phase/](archive/ui-first-phase/)
New completions stored in database: `GET /api/sessions/completed` or view in dashboard

### Architecture Decisions

**Q: Why did we pivot from UI-first to agent-first?**
**A:** See [ADR-001: Agent-First Architecture](architecture/ADRs/ADR-001-agent-first-architecture.md)

**Q: Why 41 tools in one MCP server instead of multiple servers?**
**A:** See [ADR-004: Single MCP Server](architecture/ADRs/ADR-004-single-mcp-server.md)

**Q: How does the knowledge graph work?**
**A:** See [ADR-003: Hybrid Knowledge Graph](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md)

### Finding Specific Content

**Q: Where are the mockups?**
**A:** `mockups/Default theme/` (7 HTML mockups from Week 1-1.5, still in root directory)

**Q: Where is the theme system documentation?**
**A:** `theme/THEME_GUIDE.md` (Dark Neumorphic Coral theme, still in root directory)

**Q: Where are the completion documents for each phase?**
**A:** Historical (UI phase): [archive/ui-first-phase/](archive/ui-first-phase/)
Current: Auto-generated completion reports via `GET /api/sessions/{id}/completion` or dashboard

---

## 5. Quick Start Guides

### For New Contributors

**5-Step Onboarding (30 minutes):**

1. **Read Overview** (5 min)
   - [docs/README.md](README.md) → Understand documentation structure

2. **Understand Product Vision** (10 min)
   - [01-PRD.md](01-PRD.md) → What we're building and why (agent-first philosophy)

3. **Learn System Architecture** (10 min)
   - [03-Architecture.md](03-Architecture.md) → How it works (MCP + Next.js + Prisma)

4. **Check Current Phase** (2 min)
   - [Project Dashboard](/dashboard) → Real-time status, what's been done, what's next

5. **Review Timeline** (5 min)
   - [13-Project-Plan.md](13-Project-Plan.md) → 16-week roadmap, current sprint

**Next:** Pick a task from current sprint in [13-Project-Plan.md](13-Project-Plan.md), start coding!

---

### For Returning Contributors

**Resume Development (10 minutes):**

1. **Check Project Status** (2 min)
   - [Project Dashboard](/dashboard) → Real-time status, last completed session, current phase

2. **Find Latest Completion** (2 min)
   - API: `GET /api/sessions/completed?sort=recent&limit=1`
   - Or view "Recent Sessions" in dashboard
   - Review what changed since you last worked

3. **Check Current Sprint** (3 min)
   - [13-Project-Plan.md](13-Project-Plan.md) → Current week, remaining tasks

4. **Review Requirements** (if needed)
   - [02-SRS.md](02-SRS.md) → Relevant FR-XXX requirements
   - [12-Backlog.md](12-Backlog.md) → Relevant US-XXX user stories

**Next:** Continue from current phase shown in [Project Dashboard](/dashboard)

---

### For Auditors/Reviewers

**Traceability Deep-Dive (2 hours):**

1. **Understand Traceability System** (10 min)
   - [docs/README.md](README.md) → Traceability flow section

2. **Pick a Feature to Trace** (5 min)
   - Example: "Sprint/Phase Tracking" (Feature 1 in PRD)

3. **Trace Through Documents** (60 min)
   - **PRD:** [01-PRD.md](01-PRD.md) → Find feature description
   - **SRS:** [02-SRS.md](02-SRS.md) → Find FR-001 to FR-025 (search "FR-001")
   - **Architecture:** [03-Architecture.md](03-Architecture.md) → Find references to FR-001
   - **ADR:** [ADR-005: Five-Level Hierarchy](architecture/ADRs/ADR-005-five-level-hierarchy.md)
   - **Backlog:** [12-Backlog.md](12-Backlog.md) → Find US-001 to US-025 (EPIC-001)
   - **Tests:** [09-Testing-and-QA.md](09-Testing-and-QA.md) → Find TEST-001 to TEST-025
   - **API:** [06-API/openapi.yaml](06-API/openapi.yaml) → Find MCP tools (sprint.create, sprint.updateProgress, etc.)

4. **Verify Completeness** (30 min)
   - Check all 125 FRs exist in [02-SRS.md](02-SRS.md)
   - Spot-check 10 random FRs for complete traceability
   - Verify ADR references in [03-Architecture.md](03-Architecture.md)

5. **Review Quality** (15 min)
   - Check acceptance criteria for each FR (3-5 testable criteria)
   - Verify story points add up (should be 426 total in [12-Backlog.md](12-Backlog.md))
   - Check OpenAPI validation (41 tools documented)

**Next:** Generate traceability report, identify gaps (if any)

---

## 6. Traceability System

### ID Conventions

All requirements are traceable using standardized IDs:

| ID Pattern   | Meaning                      | Count | Example            | Location                                     |
| ------------ | ---------------------------- | ----- | ------------------ | -------------------------------------------- |
| **FR-XXX**   | Functional Requirement       | 125   | FR-001, FR-125     | [02-SRS.md](02-SRS.md)                       |
| **ADR-XXX**  | Architecture Decision Record | 5     | ADR-001, ADR-005   | [architecture/ADRs/](architecture/ADRs/)     |
| **US-XXX**   | User Story                   | 125   | US-001, US-125     | [12-Backlog.md](12-Backlog.md)               |
| **EPIC-XXX** | Epic                         | 8     | EPIC-001, EPIC-008 | [12-Backlog.md](12-Backlog.md)               |
| **TEST-XXX** | Test Suite                   | 125   | TEST-001, TEST-125 | [09-Testing-and-QA.md](09-Testing-and-QA.md) |

### Traceability Flow

**Complete Traceability Chain:**

```
PRD (8 Features)
    ↓
SRS (125 FRs: FR-001 to FR-125)
    ↓
Architecture (5 ADRs: ADR-001 to ADR-005)
    ↓
Backlog (125 User Stories: US-001 to US-125, 8 Epics)
    ↓
Tests (125 Test Suites: TEST-001 to TEST-125)
    ↓
OpenAPI (42 MCP Tools + REST Endpoints)
```

### Example Traceability: Sprint/Phase Tracking Feature

**1. PRD → Feature Definition**

- **Location:** [01-PRD.md](01-PRD.md), Section 4.2.1
- **Content:** "Sprint/Phase Tracking: 5-level hierarchy (Phase→Week→Day→Task→Session)"

**2. SRS → Functional Requirements**

- **Location:** [02-SRS.md](02-SRS.md), FR-001 to FR-025
- **Example FR-001:**

  ```markdown
  **FR-001: Create 5-Level Hierarchy**

  - Description: System shall support Phase→Week→Day→Task→Session hierarchy
  - Priority: P0 (Must Have)
  - Acceptance Criteria:
    1. Agent can create hierarchy programmatically via MCP
    2. Each level stores progress (0-100%)
    3. Database schema supports nesting
  - Traceability: PRD 4.2.1, ADR-005, US-001, TEST-001
  ```

**3. Architecture → ADR**

- **Location:** [architecture/ADRs/ADR-005-five-level-hierarchy.md](architecture/ADRs/ADR-005-five-level-hierarchy.md)
- **Content:** Decision rationale, alternatives considered, consequences

**4. Backlog → User Story**

- **Location:** [12-Backlog.md](12-Backlog.md), EPIC-001, US-001
- **Example US-001:**

  ```markdown
  **US-001: Create Hierarchy as Agent**

  - Story: As an agent, I want to create a 5-level hierarchy programmatically
  - Acceptance Criteria: Same as FR-001
  - Story Points: 5
  - FR Mapping: FR-001
  ```

**5. Tests → Test Suite**

- **Location:** [09-Testing-and-QA.md](09-Testing-and-QA.md), TEST-001
- **Example TEST-001:**

  ```markdown
  TEST-001: Sprint Creation API

  - Tests FR-001 acceptance criteria
  - Coverage: Integration + E2E
  - Test cases: Create hierarchy, validate nesting, verify progress tracking
  ```

**6. API → MCP Tools**

- **Location:** [06-API/openapi.yaml](06-API/openapi.yaml)
- **Tools:** `sprint.create`, `sprint.updateProgress`, `sprint.getHierarchy`

### How to Trace Any Requirement

**Step 1:** Find the FR-XXX ID (e.g., FR-042)

**Step 2:** Search across documents:

```bash
# In the docs/ directory
grep -r "FR-042" .
```

**Step 3:** Follow the trail:

- **PRD:** Which feature does this belong to?
- **SRS:** What are the acceptance criteria?
- **Architecture:** Which ADR influenced this?
- **Backlog:** Which user story implements this? (US-042)
- **Tests:** Which test suite verifies this? (TEST-042)
- **API:** Which MCP tool exposes this?

**Step 4:** Verify completeness:

- Does FR-042 have 3-5 testable acceptance criteria?
- Is US-042 estimated with story points?
- Does TEST-042 cover all acceptance criteria?
- Is the MCP tool documented in OpenAPI?

---

## 7. Change Control

### Making Changes via API & Database

**UI-Driven Changes (Recommended):**

- Update via dashboard web UI (automatic database saves)
- Changes reflect immediately via WebSocket
- Export to markdown available via "Export" button
- No manual commits required

**API-Driven Changes (Programmatic):**

**Minor Changes (status updates, progress tracking):**
```bash
# Update session progress
POST /api/sessions/{id}/checkpoint
{
  "tokenCount": 45000,
  "tasksCompleted": ["task-1", "task-2"],
  "notes": "Completed component implementation"
}
```

**Major Changes (requirements, architecture decisions):**
```bash
# Add new requirement
POST /api/requirements
{
  "id": "FR-126",
  "title": "WebSocket real-time updates",
  "priority": "high",
  "category": "performance"
}

# Create ADR
POST /api/architecture/adr
{
  "id": "ADR-006",
  "title": "WebSocket Transport Layer",
  "decision": "Use Socket.io for real-time updates",
  "rationale": "Better browser compatibility than raw WebSockets"
}
```

**MCP Tool Changes (Agent-Driven):**
```javascript
// Agent creates requirement programmatically
await mcp.tool('project.createRequirement', {
  id: 'FR-126',
  title: 'WebSocket real-time updates',
  category: 'performance'
});

// Agent creates ADR
await mcp.tool('architecture.createADR', {
  id: 'ADR-006',
  title: 'WebSocket Transport Layer'
});
```

### Database Auto-Updates & Export Schedule

| Entity | Update Method | Frequency | Export Availability |
| ------ | ------------- | --------- | ------------------- |
| **Project Status** | WebSocket (real-time) | Continuous | On-demand via `/dashboard` |
| **Project Plan** | API / UI | Per sprint | `GET /api/export/project-plan.md` |
| **Requirements (FR)** | API / UI | As needed | `GET /api/export/requirements.md` |
| **Backlog (US)** | MCP tools | Per sprint | `GET /api/export/backlog.md` |
| **Architecture (ADR)** | UI Decision Log | As needed | `GET /api/export/adr/{id}.md` |

**Markdown Sync Note:**

All database entities can be exported to markdown for version control:
- **UI:** "Export" button on any entity page
- **API:** `GET /api/export/markdown/{entityType}/{id}`
- **MCP:** `export.toMarkdown(entityType, id, destination)`

Exports are auto-generated from database (database is source of truth).

---

## 8. Summary

### What You Get with v2.0

✅ **Complete Traceability:** FR-001 to FR-125 traceable from PRD → Tests → API
✅ **Industry Standard:** OpenAPI 3.1, ADRs, comprehensive SRS, backlog
✅ **Implementation Ready:** 125 FRs with acceptance criteria, 426 story points estimated
✅ **Architectural Clarity:** 5 ADRs documenting key decisions
✅ **Token Efficiency:** Organized by concern (read only what you need)
✅ **Historical Preservation:** Week 1-1.5 UI work preserved in archive

### Quick Stats

- **14 Documents** + **5 ADRs** = **19 files**
- **27,356 lines** (vs 4,200 old = +651%)
- **125 Functional Requirements** (FR-001 to FR-125)
- **125 User Stories** (US-001 to US-125)
- **8 Epics** (EPIC-001 to EPIC-008)
- **426 Story Points** estimated
- **42 MCP Tools** + REST endpoints documented (OpenAPI 3.1)
- **5 Architecture Decisions** documented (ADR-001 to ADR-005)

### Next Steps

1. Choose a [Reading Path](#3-reading-paths) based on your role
2. View [Project Dashboard](/dashboard) for current project phase and real-time status
3. Start coding following [13-Project-Plan.md](13-Project-Plan.md)!

---

**Questions?** Open an issue or contact the team.

**Documentation Version:** 2.0.0 (Agent-First Architecture)
**Previous Version:** 1.5 (UI-First) - See [archive/ui-first-phase/](archive/ui-first-phase/)
**Last Updated:** 2025-11-02
