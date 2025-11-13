# ProjectPulse Documentation

**Architecture:** Agent-First Project Management Platform
**Version:** 2.0.0
**Last Updated:** 2025-11-02

---

## Overview

ProjectPulse is an agent-first project management platform designed for AI agents (Claude Code, Cursor AI, Codex) to manage software development workflows with 95% automation via MCP (Model Context Protocol).

**Primary Users:** AI Agents (95% interaction via MCP)
**Secondary Users:** Solo/small team developers (5% monitoring via UI)

**Core Value Proposition:**

- **Token Efficiency:** 92% reduction for skills, 88% for knowledge graph retrieval
- **Complete Automation:** Agents execute entire workflows without human intervention
- **Persistent State:** Database as source of truth enables context-free operation
- **Self-Sufficiency:** Agents track progress, enforce quality, handle failures autonomously

---

## 📋 Documentation Scope

**IMPORTANT**: This documentation describes ProjectPulse PRODUCT features for end users (teams who will install and use ProjectPulse).

**What This Covers**:
- ✅ Product features: Task/Session entities, Issue tracking, Wiki, Knowledge Graph, MCP API
- ✅ End user workflows: How AI agents interact with ProjectPulse via MCP
- ✅ Database schema: Tables that store end users' project data
- ✅ Architecture: How ProjectPulse works as a product

**What This Does NOT Cover**:
- ❌ Internal tooling: The `.agent/` folder in this repository (our dogfooding workflow)
- ❌ Development setup: How we build ProjectPulse (see `CLAUDE.md` for that)
- ❌ Our own tracking: How we track building ProjectPulse itself

**Key Distinction**: The `.agent/` folder in this repository is ProjectPulse team's internal workflow while building the product. End users who install ProjectPulse will NOT have `.agent/` folders - their AI agents will use the Task/Session database entities described in this documentation, and all data will be stored in the ProjectPulse database (clean repositories, no markdown files).

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

15. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Documentation Migration Guide
    - Old → New file mapping, 3 reading paths, navigation FAQs, quick start guides

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

**Example:**

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
- **Source of Truth:** Database for current state (via /dashboard), this documentation pack for specifications

**Update Frequency:**

- Real-time: Project Dashboard (WebSocket updates)
- Weekly: 13-Project-Plan.md
- Per Phase: 02-SRS.md (if new FRs), 12-Backlog.md (if new stories)
- As Needed: Architecture, ADRs, other docs

---

## Key Metrics

- **Total Documentation:** 4,800+ lines across 14 documents
- **Functional Requirements:** 125 FRs (FR-001 to FR-125)
- **Architecture Decisions:** 5 ADRs documenting key pivots
- **User Stories:** 125 stories with complete acceptance criteria
- **API Endpoints:** 42 MCP tools documented in OpenAPI 3.1

**Quality Standards:**

- ✅ Complete traceability (FR IDs in all documents)
- ✅ Implementation-ready (clear acceptance criteria)
- ✅ Industry-grade structure (follows DOCS_GENERATION_PROMPT.md template)

---

## Questions?

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for help navigating from old documentation structure to new.

---

**Documentation Version:** 2.0.0 (Agent-First Architecture)
**Previous Version:** 1.5 (UI-First) - See [archive/ui-first-phase/](archive/ui-first-phase/)
