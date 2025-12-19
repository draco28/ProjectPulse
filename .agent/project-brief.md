# Project Brief - ProjectPulse

**Version**: 2.0.0 (Cloud SaaS)
**Updated**: 2025-12-19

---

## Core Mission

Build a **cloud SaaS project management platform** where AI agents and humans collaborate via PostgreSQL database as single source of truth.

### What We Build
- **Cloud Web App**: Next.js + PostgreSQL + MCP API
- **Database as Truth**: All data in PostgreSQL (docs, issues, knowledge, progress)
- **Web UI for Humans**: Wiki, dashboards, search, issue tracking, roadmap
- **MCP API for Agents**: 80+ tools for CRUD operations via HTTP

### What We DON'T Build
- `.agent/` folder generator (internal dogfooding only)
- CLAUDE.md/STATUS.md generators (internal tooling only)
- File-based workflows (all data in database)

### End User Gets
- **Wiki**: Searchable documentation in database
- **Knowledge Base**: RAG with semantic search (pgvector)
- **Tickets**: Unified work tracking (features, tasks, bugs, issues)
- **Roadmap**: Hierarchical progress (Phase → Sprint → Week → Day)
- **Dashboard**: Project health overview
- **MCP Integration**: AI agents via HTTP JSON-RPC

---

## Primary Goals

### 1. Web Application
- Wiki with search, markdown, agent creation via MCP
- Knowledge Base with RAG and semantic search
- Ticket system (7 kinds: feature, task, epic, issue, bug, scanner_finding, tech_debt)
- Roadmap visualization with progress rollup
- Dashboard with real-time updates

### 2. MCP API (80+ Tools)
- Wiki tools (create, search, update, get)
- Knowledge tools (store, search, semantic query)
- Ticket tools (create, update, bulk, hierarchy)
- Context tools (load, lookup, update memory banks)
- Session tools (start, update, end with auto-sync)
- Roadmap tools (create, materialize, progress)

### 3. Database-First Architecture
- All data in PostgreSQL (not local files)
- Real-time sync (agents ↔ web UI)
- Session persistence (resume after interruption)
- Checkpoint recovery via database state

### 4. Guided Onboarding (3 Sessions)
- Session 1: Strategic planning (96 questions → executive summary)
- Session 2: Document generation (15 industry docs)
- Session 3: AI workflow bootstrap (personas, skills, SOPs)

---

## Target Users

**Primary (95%)**: AI Agents (Claude Code, Windsurf, LLM dev tools)
**Secondary (5%)**: Human developers for strategic oversight

### Agent Personas
- DevHub Fullstack, Architect, Testing, MCP Specialist
- Research agents for analysis and documentation

### Human Roles
- Technical Lead: Architecture approval, sprint goals
- Product Owner: Feature definition, backlog priority

---

## Quality Standards

**Code**: Zero TS errors, zero ESLint warnings, no `any` types
**Testing**: 80%+ coverage, unit/component/E2E tests
**Design**: WCAG 2.1 AA, Lighthouse 90+, responsive
**Git**: Feature branches, descriptive commits, clean history

---

## Key Constraints

**Technical**:
- Next.js 14 App Router (no Pages Router)
- PostgreSQL with pgvector (no other DBs)
- Prisma ORM (no other ORMs)
- Docker deployment

**Design**:
- Coral neumorphic theme, dark-first
- Mobile-responsive

**Workflow**:
- Feature branches for all work
- Quality gates before commits

---

## Documentation

**Primary**:
- `docs/13-Project-Plan.md` - Roadmap
- `docs/12-Backlog.md` - User stories
- `docs/03-Architecture.md` - System design

**Memory Banks** (this folder):
- `project-brief.md` - WHAT and WHY (this file)
- `system-patterns.md` - HOW we build
- `tech-context.md` - Stack and config
- `active-context.md` - Current focus
- `progress.md` - Sprint progress

---

*See system-patterns.md for implementation patterns.*
