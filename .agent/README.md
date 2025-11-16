# Agent Documentation Index

**Purpose**: This folder contains project-specific technical documentation and accumulated knowledge for ProjectPulse. It complements (not replaces) the main project docs.

**🎉 Token Optimization Complete**: Phase 5 delivered 74-83% token reduction through skills system. See [.claude/skills/projectpulse/](../.claude/skills/projectpulse/) for token-efficient patterns.

**🆕 Memory Bank System**: Structured context files for efficient knowledge retrieval. See [Memory Bank](#-memory-bank-system-new) section below.

---

## 📚 Documentation Map

### When Starting a Session

**🚨 ALWAYS READ THIS FIRST:**

**0. [.agent/QUICK_REFERENCE.md](QUICK_REFERENCE.md) - ⭐ SERVER CONFIG & TROUBLESHOOTING ⭐**
   - Mac mini server locations (192.168.1.15)
   - Service ports, connection strings
   - Common mistakes to avoid
   - Troubleshooting checklist

**Then read in this order:**

1. [.agent/active-context.md](active-context.md) - Current focus and blockers
2. [.agent/progress.md](progress.md) - Progress & metrics snapshot
3. [13-Project-Plan.md](../docs/13-Project-Plan.md) - Roadmap
4. [12-Backlog.md](../docs/12-Backlog.md) - User stories
5. [CLAUDE.md](../CLAUDE.md) - Integration guide
6. **This file** (.agent/README.md) - Documentation index

**User Workflow Reference:**

- [WORKFLOW_PROMPTS.md](WORKFLOW_PROMPTS.md) - **Essential**: All prompts, TDD workflow, dependency mapping

**Documentation Quality Assurance:**

- [gemini/documentation-audit-prompt.md](gemini/documentation-audit-prompt.md) - Comprehensive Gemini prompt for auditing documentation

---

## 🧠 Memory Bank System (NEW)

**Structured context files for efficient knowledge retrieval:**

### Core Memory Bank Files

**Five specialized files replace scattered documentation:**

1. **[project-brief.md](project-brief.md)** - WHAT we're building and WHY
   - Core requirements, goals, success criteria
   - User personas, target audience
   - Quality standards, constraints
   - Current status and milestones
   - **Read when**: Need project requirements or goals

2. **[system-patterns.md](system-patterns.md)** - HOW we build
   - Architecture patterns (Server/Client Components)
   - Database patterns (Prisma queries, optimization)
   - API patterns (endpoints, validation, error handling)
   - Styling patterns (Tailwind, neumorphic design)
   - Testing patterns (Jest, RTL, Playwright, TDD)
   - **Read when**: Need implementation patterns or conventions

3. **[tech-context.md](tech-context.md)** - Technical stack
   - Dependencies (Next.js, Prisma, Zod, etc.)
   - Environment setup, configuration
   - Constraints and limitations
   - Browser support, performance targets
   - Troubleshooting common issues
   - **Read when**: Need tech stack details or setup info

4. **[active-context.md](active-context.md)** - Current focus
   - What we're working on RIGHT NOW
   - Recent changes and commits
   - Remaining tasks for current phase
   - Blockers and waiting items
   - **Read when**: Need current task context (read EVERY session start)

5. **[progress.md](progress.md)** - Progress tracking
   - What's done, what's left
   - Metrics (velocity, quality gates)
   - Risk assessment
   - Lessons learned
   - **Read when**: Need progress overview or metrics

### Memory Bank Benefits

- 🎯 **Targeted Loading**: Read only what you need (3-5K tokens per file vs 30K+ for full context)
- 🔄 **Auto-Updates**: Sub-agents maintain these files automatically
- 💾 **Token Efficient**: Saves 75-85% tokens compared to loading everything
- 📊 **Structured**: Consistent format makes information easy to find

### Quick Lookup

```
Need requirements?          → project-brief.md
Need patterns?             → system-patterns.md
Need tech details?         → tech-context.md
Need current work?         → active-context.md (READ EVERY SESSION)
Need progress?             → progress.md
Need Mac mini info?        → See Mac Mini Cloud section below
```

---

## 🖥️ Mac Mini Cloud

**CRITICAL**: All development and runtime now happen on the Mac mini
(192.168.1.15) using Docker. Windows-based workflows are **legacy only**.

### Quick Reference

**Runtime Environment**: Mac mini cloud architecture (Docker containers)

**Service Access**:
- Web App: `http://192.168.1.15:3000`
- API Health: `http://192.168.1.15:3000/api/health`
- Database: `192.168.1.15:5432`

**Docker Management**: On Mac mini only (`docker-compose.cloud.yml`)

### Key Documents

**Setup & Architecture (Current)**:
- [sops/mac-mini-cloud-architecture.md](sops/mac-mini-cloud-architecture.md) - Complete Mac-mini-only setup guide
- [sops/mac-mini-setup-complete.md](sops/mac-mini-setup-complete.md) - Setup verification report
- [../docs/11-Infrastructure-and-Deployment.md](../docs/11-Infrastructure-and-Deployment.md) - Canonical infra & Docker architecture
- [../docs/07-QUICK-START.md](../docs/07-QUICK-START.md) - Mac mini Docker quick start

**Legacy Windows/Handoff (Archive Only)**:
- [archive/windows-workflows-index.md](archive/windows-workflows-index.md) - Index of legacy Windows + Mac mini workflows

### When to Use Mac Mini

**Use Mac mini for**:
- Docker operations (restart, logs, status)
- Database operations (migrations, queries)
- Service verification (health checks, builds)
- Mac mini-specific setup
- Code editing, Git, documentation, and planning (full dev workflow)

---

## 🎯 Finding What You Need

### Working on Mac Mini / Docker Operations?

- [sops/mac-mini-cloud-architecture.md](sops/mac-mini-cloud-architecture.md) - Complete Mac mini setup
- [sops/mac-mini-communication-protocol.md](sops/mac-mini-communication-protocol.md) - How to delegate tasks
- [task/README-mac-mini-communication.md](task/README-mac-mini-communication.md) - Quick protocol overview

### Working on API Development?

- [api-catalog.md](system/api-catalog.md) - All API endpoints
- [database-schema.md](system/database-schema.md) - Prisma schema summary
- [api-route-creation.md](sops/api-route-creation.md) - Standard API route pattern (Zod + {data, error})
- [type-serialization.md](sops/type-serialization.md) - Converting Prisma types for client
- [server-component-data-fetching.md](sops/server-component-data-fetching.md) - Optimized Prisma queries

### Working on UI/Components?

- [component-patterns.md](system/component-patterns.md) - React patterns used
- [theme-system.md](system/theme-system.md) - Styling approach

### Debugging/Troubleshooting?

- [port-troubleshooting.md](sops/port-troubleshooting.md) - Port configuration issues
- [git-workflow.md](sops/git-workflow.md) - Git branch management

### Need MCP Tools Help?

- [mcp-tools-guide.md](system/mcp-tools-guide.md) - How to use each MCP tool

---

## 📂 Folder Structure

### `task/` - Implementation Plans

Stores implementation plans generated in plan mode. Reference these for similar features.

**Current tasks:**

- _(Empty - will populate as features are planned)_

### `system/` - Technical References

Auto-updated snapshots of system architecture, schemas, and patterns.

**Available:**

- [database-schema.md](system/database-schema.md) - Prisma models and relationships
- [api-catalog.md](system/api-catalog.md) - All API endpoints and their contracts
- [component-patterns.md](system/component-patterns.md) - React component conventions
- [mcp-tools-guide.md](system/mcp-tools-guide.md) - MCP tool usage examples

### `sops/` - Standard Operating Procedures

Step-by-step guides for common operations and troubleshooting.

**Available:**

**Troubleshooting:**

- [port-troubleshooting.md](sops/port-troubleshooting.md) - Fix port configuration issues
- [git-workflow.md](sops/git-workflow.md) - Branching and commit guidelines

**API Development:**

- [adding-api-endpoint.md](sops/adding-api-endpoint.md) - Create new API routes
- [api-route-creation.md](sops/api-route-creation.md) - Standard API route pattern with Zod validation and {data, error} format
- [api-route-pagination-pattern.md](sops/api-route-pagination-pattern.md) - Consistent pagination with metadata (page, limit, total, hasMore)

**Database:**

- [database-migrations.md](sops/database-migrations.md) - Schema change workflow
- [server-component-data-fetching.md](sops/server-component-data-fetching.md) - Optimized Prisma queries for Server Components

**React Patterns:**

- [implementing-use-reducer-state-machines.md](sops/implementing-use-reducer-state-machines.md) - Complex state management with useReducer (10-action state machine)
- [implementing-use-optimistic-updates.md](sops/implementing-use-optimistic-updates.md) - Instant UI feedback during Server Actions
- [implementing-intersection-observer-hooks.md](sops/implementing-intersection-observer-hooks.md) - Battery-efficient scroll detection for TOC scroll spy

**Next.js Patterns:**

- [next-js-isr-pattern.md](sops/next-js-isr-pattern.md) - Incremental Static Regeneration with revalidation
- [isr-wiki-list-pattern.md](sops/isr-wiki-list-pattern.md) - ISR for list pages with search/filter (wiki, blog, catalog)
- [debounced-search-pattern.md](sops/debounced-search-pattern.md) - Client-side debounced search with URL state (300ms delay)
- [multi-select-url-filter-pattern.md](sops/multi-select-url-filter-pattern.md) - Multi-select filters with URL as single source of truth
- [server-component-performance.md](sops/server-component-performance.md) - Performance optimization (React.memo, parallel queries, select)

**Type Safety:**

- [type-serialization.md](sops/type-serialization.md) - Converting Prisma types to JSON-serializable client props

---

## 🤖 Sub-Agents Available

Use these for context-heavy research tasks to keep main thread clean:

### `explore-codebase`

**When to use**: "Find all X", "Scan repo for Y"
**What it does**: Deep codebase exploration, returns focused summary
**Example**: "Scan codebase for authentication patterns"

### `analyze-architecture`

**When to use**: "How does X work?", "Trace data flow for Y"
**What it does**: Reads multiple files, traces system flow
**Example**: "Analyze how search works across the codebase"

### `synthesize-docs`

**When to use**: After feature completion, "Generate SOP for X"
**What it does**: Reviews implementation, creates documentation
**Example**: "Generate SOP for adding new database tables"

### `map-system`

**When to use**: "Update system documentation", "Map all endpoints"
**What it does**: Scans Prisma/API/components, updates system docs
**Example**: "Update API catalog with new routes"

---

## 🔄 Maintenance

### After Completing a Feature

1. **Follow existing workflow** (STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md)
2. **Optional**: If feature introduces new patterns:
   ```
   "Generate SOP for [new pattern]"
   → Uses synthesize-docs sub-agent
   → Saves to .agent/sops/
   → Updates this README
   ```

### When System Changes

If Prisma schema or API structure changes significantly:

```
"Update system documentation"
→ Uses map-system sub-agent
→ Refreshes .agent/system/ docs
```

---

## 📊 Token Optimization

**How this saves tokens:**

- **Targeted reading**: Read only relevant docs instead of full context
- **Sub-agent isolation**: Research happens in separate threads
- **Summary returns**: Only essential info comes back to main thread
- **Leaner CLAUDE.md**: Main config reduced by ~67%

**Example savings:**

- Research task without sub-agent: ~30K tokens in main thread
- Research task with sub-agent: ~2K tokens in main thread (93% reduction)

---

## 📝 Quick Reference Links

### Main Project Docs

- [13-Project-Plan.md](../docs/13-Project-Plan.md) - Roadmap
- [12-Backlog.md](../docs/12-Backlog.md) - User stories
- [CLAUDE.md](../CLAUDE.md) - How to use Claude Code
- [WORKFLOW_ARCHITECTURE.md](../docs/WORKFLOW_ARCHITECTURE.md) - Git workflow

### Architecture Docs

- [03-Architecture.md](../docs/03-Architecture.md) - System architecture
- [02-DEVELOPER_GUIDE.md](../docs/02-DEVELOPER_GUIDE.md) - Dev setup
- [03-MCP_ARCHITECTURE.md](../docs/03-MCP_ARCHITECTURE.md) - MCP design

### This Documentation System

- [Context Management Transcript](../transcript_context_management.md) - Original inspiration
- [SIMPLE_GEMINI_WORKFLOW.md](../SIMPLE_GEMINI_WORKFLOW.md) - Deep analysis workflow

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
