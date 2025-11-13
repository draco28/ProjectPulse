# Project Brief - ProjectPulse

**Project Name**: ProjectPulse
**Version**: 2.0.0 (Cloud SaaS Vision)
**Last Updated**: 2025-11-14

---

## Core Mission

Build a **cloud SaaS project management platform** where AI agents and humans collaborate via PostgreSQL database as single source of truth—**no local files, no repository clutter**.

**What We're Building:**

- **Cloud Web Application** (Next.js + PostgreSQL + MCP API)
- **Database as Source of Truth** (all project data stored in PostgreSQL: docs, issues, knowledge, progress)
- **Web UI for Humans** (wiki, dashboards, search, issue tracking, Development Cycle)
- **MCP API for Agents** (41 tools for CRUD operations via HTTP JSON-RPC)

**What We're NOT Building:**

- `.agent/` folder generator for end users (we use `.agent/` internally for dogfooding, but it's NOT a product feature)
- CLAUDE.md file creator for end users
- Markdown template system for end users (all data in database, not local files)
- File-based workflows (STATUS.md, current-todos.md, etc. are internal tooling only)

**End User Gets:**

A cloud-hosted or self-hosted web application with:
- **Wiki** (searchable documentation stored in database)
- **Knowledge Base** (RAG with semantic search via pgvector)
- **Issues** (bug/feature tracking with auto-tagging)
- **Tickets** (sprint work items with checkpoint recovery)
- **Development Cycle** (5-level hierarchical progress: Phase → Week → Day → Task → Session)
- **Dashboard** (project health overview with real-time updates)
- **MCP Integration** (AI agents access everything via HTTP JSON-RPC)

**End User Does NOT Get:**

- `.agent/` folder in their repository (this is OUR internal dogfooding tool)
- `CLAUDE.md` in their repository
- `STATUS.md`, `current-todos.md`, or any markdown tracking files
- Any local files for project management (everything in database)

---

## Primary Goals

### 1. Web Application Features

**Wiki Page:**
- Database storage (WikiPage model)
- Search interface (full-text + category filters)
- Markdown rendering with syntax highlighting
- Manual editing + agent creation via MCP

**Knowledge Base:**
- RAG system with pgvector
- Semantic search (vector similarity)
- Agent stores via `knowledge.store()`
- Human searches via web UI

**Issues Page:**
- Bug/feature tracking
- Auto-tagging and classification
- Bulk creation (agents create 10-50 at once)
- Priority/status/assignee management

**Development Cycle Page:**
- Hierarchical progress visualization
- Sprint → Week → Day → Task → Session
- Progress auto-rollup
- Real-time updates when agents modify

**Tickets Page:**
- Sprint work items
- Lifecycle tracking (backlog → in progress → done)
- Memory bank snapshots
- Checkpoint recovery

**Dashboard:**
- Project health overview
- Recent activity feed
- Key metrics (velocity, quality gates)

### 2. MCP API for Agents

**41 MCP Tools** across categories:
- Wiki tools (create, search, update, delete, list)
- Knowledge tools (store, query, vector search)
- Issue tools (create, update, bulk create, search)
- Ticket tools (create, update, transition, link)
- Progress tracking tools (update progress, get current task)
- Onboarding tools (getPrompt, submitResponse)

**Authentication:**
- API key-based (generated per project)
- Scoped to project (agents can only access their project data)

### 3. Database-First Architecture

**PostgreSQL as Source of Truth:**
- All data in database (NOT local files)
- Models: WikiPage, KnowledgeChunk, Issue, Ticket, Phase, Week, Day, Task, Session, OnboardingSession

**Real-time Sync:**
- Web UI updates when agents modify data
- No polling required (use Prisma subscriptions or SSE)

**Persistence:**
- No context loss across sessions
- Agents can resume work after interruption
- Checkpoint recovery via database state

### 4. Guided Onboarding

**3-Session Flow:**

Session 1: Executive summary (10 questions)
Session 2: Industry docs (PRD, SRS, Architecture)
Session 3: AI workflow blueprint (memory banks, skills, SOPs)

**All Stored in Database:**
- Onboarding responses → OnboardingSession table
- Generated docs → WikiPage table (visible in Wiki page)
- Knowledge → KnowledgeChunk table (searchable in Knowledge Base)

**User's Repo Stays Clean:**
- No .agent/ folder
- No markdown files
- All data stored locally in the ProjectPulse database (no cloud dependency)

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

### 🔄 Sprint 2: Wiki + Onboarding (Weeks 3-4)

- ✅ Wiki Page (Week 3): list/detail/editor, search, analytics
- ⏳ Onboarding System (Week 4): 3-session prompts, admin prompt editor
- ⏳ MCP tools: `wiki.create/search/update`, `onboarding.getPrompt/submitResponse`

### ⏳ Sprint 3: Workflow Orchestration (Weeks 5-6)

- ⏳ Workflow definition system (5-Step Protocol, session start, git, checkpoint)
- ⏳ Workflow state machine with validation + recovery
- ⏳ Checkpoints every 15K tokens
- ⏳ MCP tools: validate/resume/createCheckpoint

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

## Current Status (2025-11-14)

**Overall Progress**:
- **Documentation**: 100% complete (including Nov 13-14 cloud SaaS refactoring)
- **Implementation**: 62% complete (315/505 story points)
- **Sprints Complete**: 7/9 sprints (Sprint 1-6 complete, Sprint 5.5 gap sprint complete)

**Latest Milestone**: Documentation Refactoring Complete (Nov 14, 2025)

- Eliminated 101 doc-coding references across 18 documents
- Clarified cloud SaaS vision (database as source of truth)
- Separated internal tooling (`.agent/`) from product features
- Aligned all docs with database-first architecture

**Sprint Completion Summary**:
- ✅ Sprint 1: Foundation (50/52 points, 96%)
- ✅ Sprint 2: Wiki + Onboarding (82/82 points, 100%)
- ✅ Sprint 3: Workflow Orchestration (48/48 points, 100%)
- ✅ Sprint 4: Issue Management (42/42 points, 100%)
- ✅ Sprint 5: Knowledge Graph (21/21 points, 100%)
- ✅ Sprint 5.5: MCP Server Infrastructure (21/21 points, 100%)
- ✅ Sprint 6: Skills System (51/51 points, 100%)
- ⏳ Sprint 7: Tasks & Sessions MVP (21 points) - NEXT

**Current Work**: Sprint 7 planning (Tasks & Sessions MVP)
**Next Up**: Design Task/Session entities with checkpoint recovery

**Branch**: `master` (all sprints merged)
**Recent Commits**:

- `6204966` - Merge feature/sprint-7-wiki-health: Complete documentation refactoring
- `4d568c9` - docs: Complete documentation refactoring - 100% doc-coding artifacts eliminated
- `00298bc` - docs: refactor mcp-tools-guide for cloud SaaS vision

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
