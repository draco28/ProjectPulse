# Industry-Grade Documentation Restructuring Plan

**Project:** ProjectPulse - Agent-First Architecture
**Created:** 2025-11-02
**Status:** Approved - Ready for Execution
**Estimated Effort:** 60 hours across 3 weeks

---

## Executive Summary

**Challenge:** Transform documentation from custom format (DEVELOPMENT_PLAN.md, 2,000 lines) to industry-standard structure (14 professional documents, 4,800+ lines) following DOCS_GENERATION_PROMPT.md template.

**Goal:** Create professional, implementation-ready documentation with complete traceability (FR IDs), architectural decisions (ADRs), and OpenAPI specifications.

**Outcome:** 141% increase in documentation detail while improving organization, consistency, and maintainability.

---

## Key Metrics

- **Current Documentation:** 2,000 lines (DEVELOPMENT_PLAN.md)
- **New Documentation:** 4,800+ lines across 14 documents
- **Functional Requirements:** 125 FRs (FR-001 to FR-125)
- **Architecture Decisions:** 5 ADRs (ADR-001 to ADR-005)
- **User Stories:** 125 stories mapped to FRs
- **API Endpoints:** 42 MCP tools + REST endpoints documented in OpenAPI 3.1
- **Total Effort:** 60 hours (3 weeks at 20 hours/week)

---

## Documentation Structure

```
docs/
├── README.md                          # Documentation index
├── 01-PRD.md                          # Product Requirements Document
├── 02-SRS.md                          # System Requirements Specification (125 FRs)
├── 03-Architecture.md                 # System architecture with Mermaid diagrams
├── 04-Data-and-Model-Spec.md         # Database schema (10 Prisma models)
├── 05-AgentOps-Plan.md               # Agent workflows & MCP patterns
├── 06-API/
│   └── openapi.yaml                   # OpenAPI 3.1 (42 MCP tools + REST)
├── 07-UI-UX.md                        # User journeys & components
├── 08-Security-and-Compliance.md     # Threat model, autonomy levels
├── 09-Testing-and-QA.md              # Test pyramid, quality gates
├── 10-Observability-and-SRE.md       # Metrics, dashboards, SLOs
├── 11-Infrastructure-and-Deployment.md # CI/CD, environments, git workflow
├── 12-Backlog.md                      # 8 epics, 125 user stories
├── 13-Project-Plan.md                 # 16-week roadmap, 5 phases
├── MIGRATION_GUIDE.md                 # Old → New mapping
├── architecture/
│   └── ADRs/
│       ├── ADR-001-agent-first-architecture.md
│       ├── ADR-002-database-as-source-of-truth.md
│       ├── ADR-003-hybrid-knowledge-graph.md
│       ├── ADR-004-single-mcp-server.md
│       └── ADR-005-five-level-hierarchy.md
└── archive/
    └── ui-first-phase/
        ├── README.md
        ├── DEVELOPMENT_PLAN_v1.5_ARCHIVED.md
        ├── PLANNING_PHASES_projectpulse-agent-first.md
        ├── IMPLEMENTATION_ROADMAP_projectpulse.md
        └── COMPLETION_*.md
```

---

## Content Mapping

### Current Documentation → New Location

| Current Location                      | Lines | New Location                        | Lines | Change       |
| ------------------------------------- | ----- | ----------------------------------- | ----- | ------------ |
| DEVELOPMENT_PLAN.md (all)             | 2000  | Archive + multiple docs             | 4800  | +141%        |
| DEVELOPMENT_PLAN.md "Current Status"  | 100   | STATUS.md + 13-Project-Plan.md      | 150   | +50%         |
| DEVELOPMENT_PLAN.md "Week 1 Day 1"    | 200   | 13-Project-Plan.md Phase A Week 1   | 300   | +50%         |
| DEVELOPMENT_PLAN.md "Database Schema" | 200   | 04-Data-and-Model-Spec.md           | 550   | +175%        |
| DEVELOPMENT_PLAN.md "API Endpoints"   | 100   | 06-API/openapi.yaml                 | 800   | +700%        |
| DEVELOPMENT_PLAN.md "Quality Gates"   | 50    | 09-Testing-and-QA.md                | 200   | +300%        |
| DEVELOPMENT_PLAN.md "Git Workflow"    | 100   | 11-Infrastructure-and-Deployment.md | 150   | +50%         |
| PLANNING_PHASES (root)                | 1950  | Archive + ADRs + SRS + Architecture | 2000  | Reorganized  |
| IMPLEMENTATION_ROADMAP (root)         | 1294  | Archive + 13-Project-Plan.md        | 300   | Consolidated |

### Functional Requirements Breakdown

| Feature                | FRs                       | Lines in SRS   |
| ---------------------- | ------------------------- | -------------- |
| Sprint/Phase Tracking  | FR-001 to FR-025 (25 FRs) | 250            |
| Workflow Orchestration | FR-026 to FR-050 (25 FRs) | 250            |
| Issues                 | FR-051 to FR-070 (20 FRs) | 200            |
| Knowledge              | FR-071 to FR-090 (20 FRs) | 200            |
| Skills                 | FR-091 to FR-105 (15 FRs) | 150            |
| Wiki                   | FR-106 to FR-115 (10 FRs) | 100            |
| Project Health         | FR-116 to FR-120 (5 FRs)  | 50             |
| Personas               | FR-121 to FR-125 (5 FRs)  | 50             |
| **Total**              | **125 FRs**               | **1200 lines** |

---

## Detailed Phase Breakdown

### Pre-Work: Save Plan & Create Branch (15 minutes)

**Tasks:**

1. Save this plan to `.agent/task/documentation-restructure-plan-20251102.md`
2. Create feature branch: `git checkout -b feature/docs-industry-grade-restructure`
3. Initialize session file: `.agent/task/current-session-20251102-[HHMM].md`

---

### Phase 1: Archive Current Documentation (2 hours)

**Goal:** Preserve all historical work in organized archive structure

**Tasks:**

1. **Create archive folder structure:**

   ```bash
   mkdir -p docs/archive/ui-first-phase
   ```

2. **Create archive README.md** (30 min):

   ```markdown
   # UI-First Phase Archive (Week 1-1.5)

   **Period:** October 2025 - November 2, 2025
   **Status:** 100% Complete
   **Architecture:** UI-first manual development

   ## What Was Built

   - 7 UI pages (Dashboard, Issues, Knowledge, Wiki, Security, Agents, Command Palette)
   - 17 Prisma models with complete CRUD
   - Dark Neumorphic Coral theme system
   - 30+ React components
   - TypeScript 0 errors, responsive design complete

   ## Why Archived

   Architecture pivot to agent-first (95% MCP automation, 5% UI monitoring)

   ## Work Preservation

   40-50% directly reusable:

   - Issues pages (P0 feature - add MCP tools layer)
   - Theme system (apply to new UI pages)
   - Component patterns (reuse everywhere)

   ## References

   - New architecture: docs/03-Architecture.md
   - Completed work integration: docs/01-PRD.md Section 8
   ```

3. **Move files to archive** (1 hour):

   ```bash
   # Move planning documents from root
   git mv PLANNING_PHASES_projectpulse-agent-first.md docs/archive/ui-first-phase/
   git mv IMPLEMENTATION_ROADMAP_projectpulse.md docs/archive/ui-first-phase/

   # Copy DEVELOPMENT_PLAN.md (don't delete yet - will be replaced)
   cp docs/DEVELOPMENT_PLAN.md docs/archive/ui-first-phase/DEVELOPMENT_PLAN_v1.5_ARCHIVED.md

   # Move completion documents
   mv docs/COMPLETION_*.md docs/archive/ui-first-phase/ 2>/dev/null || true
   ```

4. **Commit:**
   ```bash
   git add docs/archive/
   git commit -m "docs: archive ui-first phase documentation (Week 1-1.5)"
   ```

**Deliverables:**

- ✅ `docs/archive/ui-first-phase/README.md`
- ✅ Historical docs archived
- ✅ Git commit created

---

### Phase 2: Foundation Documents (Week 1 - 24 hours)

#### 2.1 Create docs/README.md (1 hour)

**Purpose:** Documentation index and navigation guide

**Content:**

```markdown
# ProjectPulse Documentation

**Architecture:** Agent-First Project Management Platform
**Version:** 2.0.0
**Last Updated:** 2025-11-02

---

## Overview

ProjectPulse is an agent-first project management platform designed for AI agents (Claude Code, Cursor AI, Codex) to manage software development workflows with 95% automation via MCP (Model Context Protocol).

**Primary Users:** AI Agents (95% interaction via MCP)
**Secondary Users:** Solo/small team developers (5% monitoring via UI)

---

## Documentation Contents

### Product & Requirements

1. **[01-PRD.md](01-PRD.md)** - Product Requirements Document
   - Agent-first philosophy, user personas, MVP features, success metrics

2. **[02-SRS.md](02-SRS.md)** - System Requirements Specification
   - 125 Functional Requirements (FR-001 to FR-125)
   - Non-functional requirements (performance, security, scalability)
   - Data model, integrations, traceability

### Architecture & Design

3. **[03-Architecture.md](03-Architecture.md)** - System Architecture
   - System context diagrams, components, sequence flows
   - Cross-cutting concerns, references to ADRs

4. **[architecture/ADRs/](architecture/ADRs/)** - Architecture Decision Records
   - ADR-001: Agent-First Architecture
   - ADR-002: Database as Source of Truth
   - ADR-003: Hybrid Knowledge Graph
   - ADR-004: Single MCP Server
   - ADR-005: Five-Level Hierarchy

5. **[04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md)** - Database Specification
   - 10 Prisma models, validation limits, cache keys, telemetry

### Operations & Implementation

6. **[05-AgentOps-Plan.md](05-AgentOps-Plan.md)** - Agent Workflows
   - 12 workflows, MCP tool patterns, agent governance, evaluation

7. **[06-API/openapi.yaml](06-API/openapi.yaml)** - API Specification
   - OpenAPI 3.1 for 42 MCP tools + REST endpoints

8. **[07-UI-UX.md](07-UI-UX.md)** - User Experience
   - User journeys, UI states, accessibility, responsive design

9. **[08-Security-and-Compliance.md](08-Security-and-Compliance.md)** - Security
   - Threat model, autonomy levels, secrets management, privacy

10. **[09-Testing-and-QA.md](09-Testing-and-QA.md)** - Testing Strategy
    - Test pyramid, quality gates, performance checks, release criteria

11. **[10-Observability-and-SRE.md](10-Observability-and-SRE.md)** - Monitoring
    - Metrics, dashboards, SLOs, alerts, incident workflow

12. **[11-Infrastructure-and-Deployment.md](11-Infrastructure-and-Deployment.md)** - DevOps
    - Environments, hosting, CI/CD, migrations, git workflow

### Planning & Backlog

13. **[12-Backlog.md](12-Backlog.md)** - Product Backlog
    - 8 epics, 125 user stories mapped to FRs

14. **[13-Project-Plan.md](13-Project-Plan.md)** - Implementation Roadmap
    - 16-week timeline, 5 phases, estimates, risks, success criteria

### Guides & Migration

15. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Documentation Migration
    - Old → New mapping, quick starts, FAQs

### Archive

16. **[archive/ui-first-phase/](archive/ui-first-phase/)** - Historical Work
    - Week 1-1.5 UI-first development (100% complete, 40-50% reusable)

---

## Traceability Approach

All requirements are traceable across documents using standardized IDs:

- **FR-XXX:** Functional Requirements (FR-001 to FR-125)
- **ADR-XXX:** Architecture Decision Records (ADR-001 to ADR-005)
- **US-XXX:** User Stories (US-001 to US-125)
- **EPIC-XXX:** Epics (EPIC-001 to EPIC-008)

**Traceability Flow:**
```

PRD (Features) → SRS (FR-XXX) → Architecture (ADR-XXX) → Backlog (US-XXX + EPIC-XXX) → Tests (FR-XXX)

```

Example:
- **PRD:** Feature 1 "Sprint/Phase Tracking"
- **SRS:** FR-001 "Create 5-level hierarchy"
- **Architecture:** References ADR-005 "Five-Level Hierarchy"
- **Backlog:** US-001 "As an agent, I want to create hierarchy..."
- **Tests:** Test suite for FR-001 acceptance criteria

---

## Change Control

- **Major Changes:** Require ADR (Architecture Decision Record)
- **Minor Changes:** Update relevant doc + git commit
- **Traceability Updates:** Update FR references across all docs

**Git-Based:** All documentation changes tracked in version control.

---

## Reading Paths

### Quick Start (New Developers)
1. README.md (this file) → Overview
2. 01-PRD.md → What we're building and why
3. 03-Architecture.md → How it works
4. 13-Project-Plan.md → Current phase and timeline
5. Start coding!

### Developers (Implementation Focus)
1. 03-Architecture.md → System design
2. 04-Data-and-Model-Spec.md → Database schema
3. 06-API/openapi.yaml → API contracts
4. 09-Testing-and-QA.md → Quality standards
5. 11-Infrastructure-and-Deployment.md → Git workflow, deployment

### Product/Planning (Feature Focus)
1. 01-PRD.md → Product vision
2. 02-SRS.md → All requirements (125 FRs)
3. 12-Backlog.md → User stories
4. 13-Project-Plan.md → Timeline and milestones

### Architecture/Technical Decisions
1. architecture/ADRs/ → Read all 5 ADRs
2. 03-Architecture.md → System context
3. 05-AgentOps-Plan.md → Agent workflows
4. 08-Security-and-Compliance.md → Security model

---

## Document Maintenance

- **Active Documents:** All docs in docs/ root (except archive/)
- **Historical:** docs/archive/ui-first-phase/
- **Source of Truth:** STATUS.md for current phase, this documentation pack for complete reference

**Update Frequency:**
- Daily: STATUS.md
- Weekly: 13-Project-Plan.md
- Per Phase: 02-SRS.md (if new FRs), 12-Backlog.md (if new stories)
- As Needed: Architecture, ADRs, other docs

---

## Questions?

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for help navigating from old documentation structure to new.
```

**Lines:** ~150 lines

---

#### 2.2 Create docs/01-PRD.md (3 hours)

**Purpose:** Product Requirements Document

**Content outline:**

**Section 1: Project Overview** (50 lines)

- Agent-first philosophy (from PLANNING_PHASES Phase 1)
- Vision: Complete agent workflow execution without human intervention
- Core value proposition: Token-efficient automation

**Section 2: User Personas** (100 lines)

- Persona 1: Universal AI Agent (95% of interactions)
  - Demographics, goals, daily workflow, pain points
  - From PLANNING_PHASES Phase 1.1

- Persona 2: Solo/Small Team Developer (5% of interactions)
  - Demographics, goals, interaction frequency
  - From PLANNING_PHASES Phase 1.1

**Section 3: Use Cases** (50 lines)

- 5-Step Mandatory Protocol
- Issue creation workflow
- Knowledge query workflow
- Checkpoint updates

**Section 4: MVP Features** (100 lines with FR labels)

| Feature                | Priority | FR Range         | Description                               |
| ---------------------- | -------- | ---------------- | ----------------------------------------- |
| Sprint/Phase Tracking  | P0       | FR-001 to FR-025 | 5-level hierarchy with auto-markdown sync |
| Workflow Orchestration | P0       | FR-026 to FR-050 | Track 12 workflows, enforce consistency   |
| Issues                 | P0       | FR-051 to FR-070 | CRUD + bulk creation + auto-tagging       |
| Knowledge              | P1       | FR-071 to FR-090 | RAG + graph, hybrid search                |
| Skills                 | P1       | FR-091 to FR-105 | Framework patterns, lazy loading          |
| Wiki                   | P2       | FR-106 to FR-115 | Auto-generation from code                 |
| Project Health         | P2       | FR-116 to FR-120 | Security + quality tracking               |
| Personas               | P3       | FR-121 to FR-125 | Agent-created, project-specific           |

**Section 5: Success Metrics** (30 lines)

- Token efficiency: 92% reduction for skills, 88% for knowledge
- Agent autonomy: 95% MCP interaction, 5% human override
- Workflow completion rate: >95%
- North Star: Zero human intervention for complete features

**Section 6: Constraints** (30 lines)

- Budget: $0 (local deployment) + optional $5/month (OpenAI embeddings)
- Region: Local-first (no cloud dependencies)
- Stack: Next.js 14 + Prisma + PostgreSQL + pgvector
- Timeline: 16 weeks (640 hours at 40 hours/week solo developer)
- Model strategy: MCP-compatible agents (Claude Code, Cursor AI, Codex)

**Section 7: Out of Scope (MVP)** (20 lines)

- Real-time collaboration
- Mobile apps
- External integrations (beyond MCP)
- Multi-tenant
- Cloud hosting
- User authentication (solo developer)
- Custom workflow definitions
- Bidirectional markdown sync

**Section 8: Completed Work Integration** (20 lines from Week 1.5)

- 7 UI pages (Issues, Dashboard, Knowledge, Wiki, Security, Agents, Command Palette)
- Dark Neumorphic Coral theme
- 17 Prisma models
- Preservation: 40-50% reusable (Issues pages, theme, components)

**Total Lines:** ~350 lines

---

#### 2.3 Create docs/02-SRS.md (6 hours) ⭐ CRITICAL

**Purpose:** System Requirements Specification with complete FR details

**This is the most detailed document - comprehensive spec for all features**

**Content structure:**

**Section 1: Functional Requirements (1000 lines)** ⭐

**1.1 Sprint/Phase Tracking (FR-001 to FR-025) - 250 lines**

```markdown
### FR-001: Create Phase Hierarchy

**Description:** System shall allow creating a 5-level hierarchy: Phase → Week → Day → Task → Session

**Acceptance Criteria:**

- [ ] Can create Phase with: id, name, description, order, status, progress, startDate, endDate, estimatedHours, actualHours
- [ ] Can create Week under Phase with: id, phaseId, weekNumber, status, progress
- [ ] Can create Day under Week with: id, weekId, dayNumber, status, progress
- [ ] Can create Task under Day with: id, dayId, title, description, status, progress
- [ ] Can create Session under Task with: id, taskId, timestamp (YYYYMMDD-HHMM), notes, tokenUsage, startedAt, endedAt
- [ ] Hierarchy enforced via foreign keys (cannot create Week without Phase)
- [ ] Progress rolls up from bottom to top (Session → Task → Day → Week → Phase)

**Priority:** P0 (Must Have)
**Dependencies:** Database schema complete (04-Data-and-Model-Spec.md)
**Traceability:**

- SRS: This section
- Architecture: 03-Architecture.md Section 3.2.1
- Tests: 09-Testing-and-QA.md Sprint tracking test suite
- Backlog: US-001, US-002, US-003

---

### FR-002: Update Progress Percentage

**Description:** System shall allow updating progress at any hierarchy level

**Acceptance Criteria:**

- [ ] Can update progress for Phase (0.0 to 1.0)
- [ ] Can update progress for Week
- [ ] Can update progress for Day
- [ ] Can update progress for Task
- [ ] Progress automatically propagates up hierarchy
- [ ] Validation: progress must be 0.0 to 1.0
- [ ] Triggers markdown sync on update

**Priority:** P0
**Dependencies:** FR-001 (hierarchy exists)
**Traceability:**

- SRS: This section
- Architecture: 03-Architecture.md Section 3.3.2
- Tests: 09-Testing-and-QA.md Progress update tests
- Backlog: US-004

---

[Continue for FR-003 to FR-025 - all Sprint/Phase Tracking requirements]
```

**1.2 Workflow Orchestration (FR-026 to FR-050) - 250 lines**
**1.3 Issues (FR-051 to FR-070) - 200 lines**
**1.4 Knowledge (FR-071 to FR-090) - 200 lines**
**1.5 Skills (FR-091 to FR-105) - 150 lines**
**1.6 Wiki (FR-106 to FR-115) - 100 lines**
**1.7 Project Health (FR-116 to FR-120) - 50 lines**
**1.8 Personas (FR-121 to FR-125) - 50 lines**

**Section 2: Non-Functional Requirements (200 lines)**

**2.1 Performance Requirements:**

- API response time: P95 <500ms, P99 <1s
- MCP tool execution: P95 <1s, P99 <2s
- Knowledge graph queries: P95 <200ms, P99 <500ms
- Dashboard First Contentful Paint: <2s
- Markdown sync: <500ms per file

**2.2 Availability:**

- Target: 99.9% (dependent on local machine uptime)
- Recovery Time Objective (RTO): <1 minute (Docker restart)
- Recovery Point Objective (RPO): 0 (database transactions)

**2.3 Security:**

- 3 Autonomy Levels: Full (L1), Approval Required (L2), Forbidden (L3)
- Audit trail: All agent actions logged to AgentAction table
- Rollback capability for L1 operations
- Approval workflow for L2 operations
- Git hooks prevent unauthorized markdown edits

**2.4 Scalability:**

- Solo developer (1 project, 1 concurrent session)
- 10,000 issues
- 1,000 knowledge items
- 500 wiki pages
- 100 agent personas
- 50 concurrent MCP tool calls (queued)

**2.5 Cost:**

- Infrastructure: $0 (local deployment)
- Optional: OpenAI embeddings ~$5/month
- Alert at 80% of free tier limits

**2.6 Observability:**

- All MCP calls logged with success/failure
- Performance metrics (P50, P95, P99 latencies)
- Agent action success rate >95%
- Token usage tracking per session

**2.7 Accessibility (UI):**

- WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader support (aria-labels)
- Color contrast ratios 7:1+

**Section 3: Data Model (100 lines)**

- 10 Core Tables: Phase, Week, Day, Task, Session, Workflow, WorkflowStep, Issue, KnowledgeItem, KnowledgeRelationship
- See 04-Data-and-Model-Spec.md for complete schema

**Section 4: Integrations (50 lines)**

- **Database:** PostgreSQL 15+ with pgvector (vector similarity) + pg_trgm (full-text search)
- **Embeddings:** OpenAI text-embedding-3-small (384 dimensions) OR local via Ollama
- **MCP:** Single server (stdio transport) exposing 42 tools
- **Git:** Hooks prevent manual markdown edits, enforce conventional commits

**Section 5: Traceability Table (50 lines)**

| FR-ID  | Feature          | PRD Section | SRS Section | Architecture | API                   | Tests       | Backlog |
| ------ | ---------------- | ----------- | ----------- | ------------ | --------------------- | ----------- | ------- |
| FR-001 | Create hierarchy | 4.1         | 1.1         | 3.2.1        | sprint.create         | Test-FR-001 | US-001  |
| FR-002 | Update progress  | 4.1         | 1.1         | 3.3.2        | sprint.updateProgress | Test-FR-002 | US-004  |
| FR-026 | Define workflows | 4.2         | 1.2         | 3.2.2        | workflow.start        | Test-FR-026 | US-026  |
| FR-051 | Create issue     | 4.3         | 1.3         | 3.2.3        | issues.create         | Test-FR-051 | US-051  |
| FR-071 | Add knowledge    | 4.4         | 1.4         | 3.2.4        | knowledge.add         | Test-FR-071 | US-071  |
| ...    | ...              | ...         | ...         | ...          | ...                   | ...         | ...     |

**Total Lines:** ~1200 lines (200% more detail than DEVELOPMENT_PLAN.md database section)

---

#### 2.4 Create architecture/ADRs/ (4 hours - 5 ADRs)

**Each ADR follows this structure:**

```markdown
# ADR-XXX: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Decision Makers:** [Who approved]
**Consulted:** [Who provided input]

---

## Context

What is the issue we're facing? What constraints exist? What forces are at play?

## Decision

What decision did we make? Be specific and unambiguous.

## Consequences

What becomes easier or harder as a result of this decision?

### Positive

- Benefit 1
- Benefit 2

### Negative

- Drawback 1
- Drawback 2

### Neutral

- Change 1
- Change 2

## Alternatives Considered

What other options were evaluated? Why were they rejected?

1. **Alternative 1:** Description → Rejected because...
2. **Alternative 2:** Description → Rejected because...

## References

- Related documentation
- External resources
- Related ADRs

---

**Last Updated:** YYYY-MM-DD
**Revision History:**

- YYYY-MM-DD: Initial version
```

---

**ADR-001: Agent-First Architecture (UI-First → Agent-First Pivot)**

```markdown
# ADR-001: Agent-First Architecture

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** Project Owner
**Consulted:** Planning session analysis

---

## Context

Week 1.5 of development completed with UI-first approach:

- 7 UI pages implemented (Dashboard, Issues List/Detail, Knowledge, Wiki, Security, Agents, Command Palette)
- 17 Prisma models with complete CRUD
- Dark Neumorphic Coral theme system
- Focus: Manual interaction via rich UI

Planning session (2025-11-02) revealed opportunities for comprehensive agent automation:

- AI agents (Claude Code, Cursor AI, Codex) can handle 95% of workflows via MCP
- Token efficiency: Skills (92% reduction), Knowledge graph (88% reduction)
- Persistent state tracking enables complete workflow execution without human intervention

**The Question:** Should we continue UI-first development or pivot to agent-first architecture?

## Decision

**Adopt agent-first architecture with 95% MCP automation and 5% UI monitoring.**

**Implications:**

- Primary users: AI Agents (Claude Code, Cursor AI, Codex)
- Secondary users: Solo/small team developers (monitoring, overrides)
- Build order: Agent automation FIRST (MCP tools), UI monitoring SECOND
- UI purpose: Dashboard monitoring, visual representation, manual overrides (not primary interaction)

## Consequences

### Positive

- **Token efficiency:** 92% reduction for skills, 88% for knowledge graph retrieval
- **Automation:** Complete workflows without human intervention (5-step protocol, checkpoints, recovery)
- **Consistency:** Database as source of truth, markdown auto-sync prevents conflicts
- **Preservation:** 40-50% of Week 1.5 work reusable (Issues pages, theme, components)

### Negative

- **Pivot cost:** 2 weeks to restructure documentation (this effort)
- **Learning curve:** Developers must understand MCP + agent workflows
- **UI simplification:** Less emphasis on rich UI features, more on monitoring dashboards

### Neutral

- **Timeline:** 16-week roadmap (vs original estimate unclear)
- **Features:** 8 core features defined (Sprint, Workflow, Issues, Knowledge, Skills, Wiki, Health, Personas)
- **Architecture:** MCP Server → Next.js API → Prisma (3-tier)

## Alternatives Considered

1. **Continue UI-First:**
   - Keep building rich UI with manual interaction
   - Rejected: Doesn't leverage agent capabilities, high manual effort, token inefficient

2. **Hybrid (50/50):**
   - Equal focus on UI and MCP automation
   - Rejected: Dilutes effort, unclear priorities, complex architecture

3. **MCP-Only (100% automation):**
   - No UI, pure MCP server
   - Rejected: Need monitoring dashboards, human overrides for business logic

## References

- Planning session: PLANNING_PHASES_projectpulse-agent-first.md (archived)
- Implementation roadmap: IMPLEMENTATION_ROADMAP_projectpulse.md (archived)
- Week 1.5 completion: docs/archive/ui-first-phase/
- Product vision: docs/01-PRD.md

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (agent-first pivot approved)
```

**Lines:** ~80 lines

---

**ADR-002: Database as Source of Truth for Markdown Files**

```markdown
# ADR-002: Database as Source of Truth for Markdown Files

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** Project Owner
**Consulted:** Planning session analysis

---

## Context

Current pain point: Manual markdown file updates lead to inconsistencies.

**Files requiring synchronization:**

- STATUS.md (current phase, last task completed)
- DEVELOPMENT_PLAN.md (detailed plan)
- .agent/task/current-todos.md (active tasks)
- .agent/task/current-plan.md (implementation plan)
- .agent/task/current-session-[timestamp].md (session notes)

**Problem:**

- Agents update database (Task.progress, Issue.status)
- Humans manually update markdown files
- → **Result:** Database and markdown files drift, inconsistencies, confusion

**The Question:** Should markdown files be authoritative, or should database be source of truth?

## Decision

**Database is the single source of truth. Markdown files are auto-generated and read-only.**

**Implementation:**

- All progress tracked in database (Sprint/Phase tables: Phase, Week, Day, Task, Session)
- Markdown files generated from database via templates
- Agents update database → Automatic markdown regeneration
- Git hooks prevent manual markdown edits (pre-commit validation)
- UI displays "Auto-generated - Edit via app" banner on markdown pages

## Consequences

### Positive

- **Consistency:** Database and markdown always in sync
- **Automation:** No manual markdown updates required
- **Traceability:** Single source of truth for all progress tracking
- **Recovery:** Database transactions ensure data integrity, markdown regenerates

### Negative

- **Read-only markdown:** Developers cannot directly edit STATUS.md, current-todos.md
- **Git hook overhead:** Pre-commit validation adds ~500ms to commit time
- **Template maintenance:** Changes to markdown format require template updates

### Neutral

- **MarkdownFile table:** Stores generated content, tracks last sync timestamp
- **Sync triggers:** On progress update, checkpoint, workflow step completion
- **Performance:** <500ms per markdown file generation (acceptable)

## Alternatives Considered

1. **Markdown as Source of Truth:**
   - Parse markdown files, update database from them
   - Rejected: Complex parsing, fragile, error-prone, doesn't leverage database transactions

2. **Bidirectional Sync:**
   - Allow both database and markdown edits, reconcile conflicts
   - Rejected: Conflict resolution complex, race conditions, merge complexity

3. **No Markdown Files:**
   - Use database/UI only, no markdown files
   - Rejected: Agents (Claude Code) rely on markdown files for context (STATUS.md, DEVELOPMENT_PLAN.md)

## References

- Database schema: docs/04-Data-and-Model-Spec.md
- Markdown sync implementation: docs/03-Architecture.md Section 3.4
- Git hooks: docs/11-Infrastructure-and-Deployment.md
- Sprint tracking: docs/02-SRS.md FR-001 to FR-025

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (database as source of truth)
```

**Lines:** ~70 lines

---

**ADR-003: Hybrid Knowledge Graph (Semantic + Full-Text + Limited Traversal)**

```markdown
# ADR-003: Hybrid Knowledge Graph Search Strategy

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** Project Owner
**Consulted:** Planning session analysis, user feedback ("best feature")

---

## Context

Agents need efficient knowledge retrieval without high token costs.

**Challenge:**

- Full knowledge graph traversal = 10,000+ tokens per query (expensive, slow)
- Semantic search alone misses exact keyword matches
- Full-text search alone misses semantically similar content
- Agents have 200K token context limit (need to preserve for implementation)

**Requirements:**

- Retrieve relevant knowledge items efficiently (<200ms)
- Token cost <1,500 tokens per query
- Combine semantic similarity + keyword matching
- Find related knowledge via graph relationships (not full traversal)

**The Question:** What search strategy balances relevance, token efficiency, and performance?

## Decision

**Implement hybrid knowledge graph search: Semantic + Full-Text + Limited Traversal (max 2 hops)**

**Strategy:**

1. **Semantic Search (pgvector):**
   - Generate embedding for query (OpenAI text-embedding-3-small, 384 dimensions)
   - Vector similarity search: `embedding <=> query_embedding`
   - Return top-K results (K=5)

2. **Full-Text Search (tsvector):**
   - PostgreSQL full-text search: `searchVector @@ to_tsquery(query)`
   - Return top-K results (K=5)

3. **Hybrid Ranking:**
   - Merge results: `0.7 * semantic_score + 0.3 * fulltext_score`
   - Return top-K combined (K=5)

4. **Graph Traversal (limited):**
   - From top result, traverse relationships (REFERENCES, CONTRADICTS, EXTENDS)
   - Max depth: 2 hops
   - Return related items (typically 1-3 additional items)

5. **Total Return:**
   - Top 5 hybrid results + 1-3 related items = 6-8 total items
   - Token cost: ~1,200 tokens (vs 10,000+ for full graph)

## Consequences

### Positive

- **Token efficiency:** 88% reduction (1,200 tokens vs 10,000+)
- **Performance:** <200ms queries (pgvector + tsvector indexes)
- **Relevance:** Semantic captures "auth implementation" = "authentication setup"
- **Precision:** Full-text captures exact keyword matches
- **Context:** Graph traversal finds related/contradictory knowledge

### Negative

- **Index maintenance:** pgvector + tsvector indexes require periodic updates
- **Embedding cost:** OpenAI API ~$0.10/1M tokens (mitigated by local embedding option)
- **Tuning required:** Semantic/fulltext weights (0.7/0.3) may need adjustment

### Neutral

- **Max depth 2 hops:** Prevents token explosion while capturing most relationships
- **Top-K = 5:** Balances coverage vs token cost
- **Lazy loading:** Load only what's needed, expand on-demand

## Alternatives Considered

1. **Semantic Search Only:**
   - Rejected: Misses exact keyword matches ("pgvector" query wouldn't match "pgvector" keyword if embedding mismatch)

2. **Full-Text Search Only:**
   - Rejected: Misses semantic similarity ("authentication" vs "auth" vs "login")

3. **Full Graph Traversal:**
   - Rejected: 10,000+ tokens per query, slow, exceeds context limits

4. **No Graph Traversal:**
   - Rejected: Misses related/contradictory knowledge, context incomplete

## References

- Database schema: docs/04-Data-and-Model-Spec.md (KnowledgeItem, KnowledgeRelationship)
- Performance requirements: docs/02-SRS.md Section 2.1
- Architecture: docs/03-Architecture.md Section 3.5
- User feedback: "perfect, exactly what I wanted, best feature" (planning session)

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (hybrid search approved)
```

**Lines:** ~90 lines

---

**ADR-004: Single MCP Server Architecture**

````markdown
# ADR-004: Single MCP Server (vs Multiple Servers per Feature)

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** Project Owner
**Consulted:** Planning session analysis

---

## Context

Need to expose 42 MCP tools across 8 core features.

**Features and Tool Counts:**

1. Sprint/Phase Tracking: 6 tools
2. Workflow Orchestration: 5 tools
3. Issues: 5 tools
4. Knowledge: 5 tools
5. Skills: 4 tools
6. Wiki: 5 tools
7. Project Health: 4 tools
8. Personas: 4 tools
9. Dashboard: 4 tools

**Total:** 42 MCP tools

**Options:**

- **Option A:** Single MCP server exposing all 42 tools
- **Option B:** 8 separate MCP servers (one per feature)
- **Option C:** Monorepo with multiple MCP servers

**The Question:** What MCP server architecture provides simplicity, maintainability, and universal agent access?

## Decision

**Implement a single MCP server (`projectpulse`) exposing all 42 tools.**

**Configuration (Claude Code example):**

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["path/to/projectpulse-mcp/build/index.js"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```
````

**Result:**

- One installation → All 42 tools available
- Works with any MCP-compatible agent (Claude Code, Codex, Cursor AI, Cascade)

## Consequences

### Positive

- **Simplicity:** One config entry, one installation, one process
- **Discoverability:** Agents see all tools in single namespace
- **Maintenance:** Single codebase, single deployment, single version
- **Universal access:** Any MCP-compatible agent can use all tools
- **Shared logic:** Common Zod validation, error handling, audit logging

### Negative

- **Monolithic:** Single server failure affects all tools (mitigated by quick restart)
- **Namespace pollution:** 42 tools in flat namespace (mitigated by prefix: `sprint.`, `workflow.`, `issues.`)
- **Large bundle:** All tools loaded at startup (~5MB, acceptable for local)

### Neutral

- **Startup time:** ~500ms (acceptable for local MCP server)
- **Memory usage:** ~50MB (acceptable for background process)
- **Tool organization:** Grouped by prefix (sprint._, workflow._, issues.\*)

## Alternatives Considered

1. **8 Separate MCP Servers:**
   - Rejected: 8 config entries, 8 installations, 8 processes, complex maintenance

2. **Monorepo with Multiple Servers:**
   - Rejected: Shared code duplication, complex build process, deployment overhead

3. **Plugin Architecture:**
   - Rejected: Over-engineering for 42 tools, added complexity, no immediate benefit

## References

- MCP specification: https://modelcontextprotocol.io
- Tool catalog: docs/06-API/openapi.yaml
- Architecture: docs/03-Architecture.md Section 3.1
- Installation guide: docs/11-Infrastructure-and-Deployment.md

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (single server approved)

````

**Lines:** ~85 lines

---

**ADR-005: Five-Level Hierarchy for Sprint Tracking (Removed Subtask)**

```markdown
# ADR-005: Five-Level Hierarchy (Phase → Week → Day → Task → Session)

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** Project Owner
**Consulted:** Planning session analysis

---

## Context

Need hierarchical progress tracking for solo developer workflow.

**Original Proposal:** 6 levels
- Phase → Week → Day → Task → Subtask → Session

**Observation:**
- Tasks typically fit within single agent conversation context (200K tokens)
- Subtasks add complexity without clear benefit
- Solo developer (not team) = simpler hierarchy preferred

**The Question:** Is the Subtask level necessary, or can we simplify to 5 levels?

## Decision

**Remove Subtask level. Use 5-level hierarchy: Phase → Week → Day → Task → Session.**

**Structure:**
````

Project
└── Phase 1 (e.g., "Foundation & Core Infrastructure")
└── Week 1 (e.g., "Database Schema & Migrations")
└── Day 1 (e.g., "Prisma Schema Setup")
└── Task 1 (e.g., "Create Phase/Week/Day models")
└── Session 1 (e.g., "20251102-1430")

```

**Session Level:**
- Timestamp format: YYYYMMDD-HHMM
- Captures: notes, tokenUsage, startedAt, endedAt
- Maps to `.agent/task/current-session-[timestamp].md`

## Consequences

### Positive
- **Simplicity:** Fewer entities, clearer hierarchy, easier mental model
- **Sufficient granularity:** 5 levels adequate for solo developer workflow
- **Task = conversation context:** Tasks fit within 200K token limit (no need for subtasks)
- **Database:** 1 fewer table (Subtask removed)

### Negative
- **Large tasks:** Some tasks may be complex (mitigated by Session notes, checkpoints)
- **Team scaling:** If project becomes team-based, may need Subtask level (future ADR)

### Neutral
- **Migration:** No existing data (implementing from scratch)
- **Progress tracking:** Still rolls up from Session → Task → Day → Week → Phase

## Alternatives Considered

1. **Keep 6 Levels (with Subtask):**
   - Rejected: Over-engineering for solo developer, added complexity without benefit

2. **Reduce to 4 Levels (remove Session):**
   - Rejected: Session level critical for tracking `.agent/task/current-session-[timestamp].md` files

3. **Reduce to 3 Levels (Phase → Task → Session):**
   - Rejected: Week/Day levels provide useful intermediate milestones

## References

- Database schema: docs/04-Data-and-Model-Spec.md (Phase, Week, Day, Task, Session)
- Requirements: docs/02-SRS.md FR-001 to FR-025
- Architecture: docs/03-Architecture.md Section 3.2.1
- User story: docs/12-Backlog.md US-001

---

**Last Updated:** 2025-11-02
**Revision History:**
- 2025-11-02: Initial version (5-level hierarchy approved)
```

**Lines:** ~70 lines

---

**Total ADRs:** 5 documents, ~395 lines

---

#### 2.5 Create docs/03-Architecture.md (5 hours)

[Content continues with Architecture document outline - this plan file is already very long, so I'll summarize the structure]

**Content:**

- System Context diagram (Mermaid)
- Components: MCP Server, Next.js App, Database, Markdown Sync
- Sequence diagrams: Agent workflow, Knowledge query, Markdown sync
- Cross-cutting concerns: Validation, Security, Observability, Cost
- References to ADRs

**Lines:** ~450 lines

---

#### 2.6 Create docs/04-Data-and-Model-Spec.md (5 hours)

**Content:**

- All 10 Prisma models (complete schema from PLANNING_PHASES Phase 4.1)
- Validation limits (title 1-500 chars, max depth 2 hops, etc.)
- Cache keys (knowledge frontmatter, dashboard metrics, search queries)
- Telemetry fields (AgentAction structure)

**Lines:** ~550 lines

---

**Phase 2 Total:** 24 hours, 6 documents, ~2,900 lines

**Commit:**

```bash
git add docs/README.md docs/01-PRD.md docs/02-SRS.md docs/architecture/ docs/03-Architecture.md docs/04-Data-and-Model-Spec.md
git commit -m "docs: create foundation documents (README, PRD, SRS, ADRs, Architecture, Data Model)"
```

---

### Phase 3: Operations Documents (Week 2 - 24 hours)

[7 documents: AgentOps, OpenAPI, UI-UX, Security, Testing, Observability, Infrastructure]

**Phase 3 Total:** 24 hours, 7 documents, ~2,350 lines

---

### Phase 4: Backlog & Planning (Week 3 Part 1 - 9 hours)

[2 documents: Backlog with 125 user stories, Project Plan with 16-week roadmap]

**Phase 4 Total:** 9 hours, 2 documents, ~900 lines

---

### Phase 5: Final Integration (Week 3 Part 2 - 12 hours)

[Migration guide, cross-references, validation]

**Phase 5 Total:** 12 hours, 1 document + updates, ~350 lines

---

## Summary

**Total Documentation:**

- 14 industry-standard documents
- 5 ADRs (architecture decisions)
- 4,800+ lines (vs 2,000 current = 141% increase)
- 125 Functional Requirements (FR-001 to FR-125)
- 125 User Stories (US-001 to US-125)
- 8 Epics (EPIC-001 to EPIC-008)
- Complete traceability (PRD → SRS → Architecture → Tests → Backlog)

**Total Effort:** 60 hours across 3 weeks

**Success Criteria:**

- ✅ All 14 documents created
- ✅ No broken cross-references
- ✅ All FR IDs traceable
- ✅ OpenAPI 3.1 validates
- ✅ ≥4,800 lines total
- ✅ Industry-grade quality (clear, actionable, implementation-ready)

---

## Next Steps After Completion

1. Update STATUS.md to Phase A Week 1
2. Begin implementation following docs/13-Project-Plan.md
3. Use docs/README.md as single entry point
4. Maintain traceability (FR IDs in code comments, tests)

---

**END OF PLAN**
