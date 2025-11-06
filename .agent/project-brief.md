# Project Brief - ProjectPulse

**Project Name**: ProjectPulse
**Version**: 1.0.0
**Last Updated**: 2025-11-06

---

## Core Mission

Build an agent-first project management platform (meta-platform) that generates agent workflow infrastructure for development projects. ProjectPulse enables AI agents to drive 95% of project workflows through MCP (Model Context Protocol) tools, with the database as the source of truth and human developers providing strategic oversight.

---

## Primary Goals

### 1. Agent-First Architecture

- 95% of workflows driven by AI agents through MCP tools
- Database as single source of truth (not markdown files)
- Zero-drift markdown sync (database → markdown, one-way)
- Human oversight for strategic decisions only

### 2. Meta-Platform Vision

- Generates agent workflow infrastructure for users' projects
- 5-level hierarchy: Phase → Week → Day → Task → Session
- Progress auto-rolls up from sessions to phases
- Workflow orchestration with mandatory protocols

### 3. Intelligent Automation

- 41 MCP tools across 9 feature categories
- Sub-agent system (explore-codebase, analyze-architecture, synthesize-docs)
- Memory bank system for context preservation
- Research agent orchestration for deep analysis

### 4. Developer Features (Secondary)

- Issue tracking with auto-tagging and bulk creation
- Knowledge graph with semantic search (pgvector)
- Wiki with auto-generation from code
- Project health dashboard with security scanning

---

## Target Users

**Primary**: AI agents (Claude Code, Windsurf, other LLM-based dev tools) - 95% interaction
**Secondary**: Human developers for strategic oversight - 5% interaction

**Agent Personas**:

- **DevHub Fullstack**: Implements features across React/Next.js/Prisma stack
- **DevHub Architect**: Makes architecture decisions (Next.js patterns, Prisma schema design)
- **DevHub Testing**: Creates comprehensive test suites (Jest, RTL, Playwright)
- **DevHub MCP Specialist**: Designs and implements MCP tools
- **Research Agents**: Deep codebase analysis, pattern discovery, documentation synthesis

**Human Roles** (Strategic Oversight):

- **Technical Lead**: Approves architecture decisions, sets Sprint goals
- **Product Owner**: Defines features, prioritizes backlog

---

## Success Criteria

### ✅ Documentation Phase (Week 1.5 - Nov 6, 2025) - COMPLETE

- ✅ Architecture pivot documented (5 new epics: EPIC-010 to EPIC-014)
- ✅ PRD updated with Memory Banks and Research Agent features
- ✅ SRS updated with 75 new FRs (FR-146 to FR-220, 13 MVP + 62 Post-MVP)
- ✅ Backlog updated with 37 new user stories (138 total, 484 points)
- ✅ Project Plan updated with Sprint 9 (18 weeks total, 9 sprints)
- ✅ Testing plan updated with TEST-146 to TEST-158
- ✅ Architecture documentation updated with Sub-Agent and Memory Bank sections
- ✅ Audit specification created (.agent/ARCHITECTURE_UPDATE_AUDIT_SPEC.md)
- ✅ All documentation cross-referenced and verified

### 🔄 Sprint 1: Foundation Setup (Weeks 1-2) - READY TO START

**Target**: 52 story points, 14 user stories (US-001 to US-014)

- ⏳ Prisma schema with 5-level hierarchy (Phase, Week, Day, Task, Session)
- ⏳ Progress roll-up algorithm (Session → Task → Day → Week → Phase)
- ⏳ MCP server scaffold (Node.js, stdio transport)
- ⏳ First 7 MCP tools (sprint.phase.create, sprint.getCurrentTask, etc.)
- ⏳ Validation: Foreign keys, progress 0.0-1.0, timestamps

### ⏳ Sprint 2-3: Workflow Orchestration (Weeks 3-6)

- ⏳ Workflow definition system (5-Step Protocol, custom workflows)
- ⏳ Workflow state machine with validation
- ⏳ Markdown sync (database → markdown, zero drift)
- ⏳ 5 workflow MCP tools

### ⏳ Sprint 4: Issue Management (Weeks 7-8)

- ⏳ Issue CRUD with MCP tools
- ⏳ Bulk issue creation (10-50 issues at once)
- ⏳ Auto-tagging and classification
- ⏳ Integration with existing Issues UI from Week 1.5

### ⏳ Sprints 5-8: Advanced Features (Weeks 9-16)

- ⏳ Knowledge graph with semantic search (Sprint 5-6)
- ⏳ Wiki and Health dashboard (Sprint 7)
- ⏳ Integration testing and MVP acceptance (Sprint 8)

### 📅 Sprint 9: Advanced Agent Features (Weeks 17-18) - POST-MVP

- Memory Bank System (EPIC-010, 8 stories, 34 points)
- Research Agent Orchestration (EPIC-011, 5 stories, 24 points)
- Documented but deferred to post-MVP implementation

---

## Technical Stack

**Frontend**:

- Next.js 14.1.0 (App Router)
- React 18.2.0 (Server Components + Client Components)
- TypeScript 5.x (strict mode)
- Tailwind CSS 3.4.1 (utility-first)

**Backend**:

- Next.js API Routes & Server Actions
- Prisma ORM 5.9.0
- PostgreSQL 16 with pgvector
- Zod validation

**Testing**:

- Jest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)

**DevOps**:

- Docker & Docker Compose
- pnpm (package management)
- ESLint & Prettier (code quality)

**AI/MCP**:

- MCP Protocol (Model Context Protocol)
- Claude Code integration
- Custom agent personas

---

## Current Status (2025-11-06)

**Overall Progress**: Documentation Phase Complete (100%), Implementation Phase Ready to Start (0%)

**Latest Milestone**: Architecture Update Complete (Nov 6, 2025)

- 5 new epics documented (EPIC-010 to EPIC-014)
- 75 new FRs added (FR-146 to FR-220)
- 37 new user stories (13 MVP, 24 Post-MVP)
- Sprint 9 added to project plan (18 weeks total)
- 5,500+ lines of documentation added
- Audit specification created for future verification

**Current Work**: Ready to start Sprint 1 implementation
**Next Up**:

1. Merge docs/architecture-pivot-sprint-1-redefinition to master
2. Create feature/sprint-1-foundation branch
3. Design Prisma schema for 5-level hierarchy
4. Implement MCP server scaffold

**Branch**: `docs/architecture-pivot-sprint-1-redefinition` (to be merged)
**Recent Commits**:

- `b4e2afc` - docs: add comprehensive documentation audit specification
- `5e154ff` - docs: add Sprint 9 with Memory Banks and Research Agent Orchestration
- `a1ae4fc` - docs: Update PRD, SRS, and Architecture with 5 new epics (EPIC-010 to EPIC-014)

---

## Quality Standards

**Code Quality**:

- Zero TypeScript errors (strict mode)
- Zero ESLint warnings
- 100% type coverage (no `any` types)
- Comprehensive JSDoc comments

**Testing**:

- Unit tests for all utilities
- Component tests for all React components
- E2E tests for all critical workflows
- 80%+ code coverage

**Design**:

- Pixel-perfect match to mockups
- Responsive across breakpoints
- Accessibility (WCAG 2.1 AA)
- Performance (Lighthouse 90+ scores)

**Git Workflow**:

- Feature branches for all work
- Descriptive commit messages
- Completion docs for all phases
- Clean merge history

---

## Key Constraints

**Technical**:

- Must use Next.js 14 App Router (no Pages Router)
- Must use PostgreSQL (no other databases)
- Must use Prisma (no other ORMs)
- Must support Docker deployment

**Design**:

- Must follow Coral neumorphic theme
- Must be dark theme first
- Must match provided mockups exactly
- Must be responsive mobile-first

**Workflow**:

- Must follow Git workflow (feature branches)
- Must create completion docs
- Must update STATUS.md; verify docs/13-Project-Plan.md and docs/12-Backlog.md
- Must pass all quality gates before committing

---

## Documentation References

**Main Docs**:

- [STATUS.md](../STATUS.md) - Current snapshot
- [13-Project-Plan.md](../docs/13-Project-Plan.md) - Roadmap
- [12-Backlog.md](../docs/12-Backlog.md) - User stories
- [WORKFLOW_ARCHITECTURE.md](../docs/WORKFLOW_ARCHITECTURE.md) - Git workflow

**Architecture**:

- [03-Architecture.md](../docs/03-Architecture.md) - System design
- [02-DATABASE-SCHEMA.md](../docs/02-DATABASE-SCHEMA.md) - Prisma schema
- [04-UI-ARCHITECTURE.md](../docs/04-UI-ARCHITECTURE.md) - Component structure

**Theme/Design**:

- [THEME_GUIDE.md](../theme/THEME_GUIDE.md) - Design system
- [COMPONENTS_REFERENCE.md](../theme/COMPONENTS_REFERENCE.md) - UI patterns
- [MOCKUPS_INDEX.md](../mockups/Default theme/MOCKUPS_INDEX.md) - All mockups

---

**This file defines WHAT we're building and WHY. See system-patterns.md for HOW.**

---

Last reviewed: 2025-11-06
