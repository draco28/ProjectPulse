# Agent Documentation Index

**Purpose**: This folder contains project-specific technical documentation and accumulated knowledge for Moksha DevHub. It complements (not replaces) the main project docs.

**🎉 Token Optimization Complete**: Phase 5 delivered 74-83% token reduction through skills system. See [.claude/skills/moksha-devhub/](../.claude/skills/moksha-devhub/) for token-efficient patterns.

---

## 📚 Documentation Map

### When Starting a Session

**Always read in this order:**

1. [STATUS.md](../STATUS.md) - Current snapshot
2. [DEVELOPMENT_PLAN.md](../docs/DEVELOPMENT_PLAN.md) - Detailed plan
3. [CLAUDE.md](../CLAUDE.md) - Integration guide
4. [WORKFLOW_ARCHITECTURE.md](../docs/WORKFLOW_ARCHITECTURE.md) - Branching strategy
5. **This file** (.agent/README.md) - For task-specific context

**User Workflow Reference:**

- [WORKFLOW_PROMPTS.md](WORKFLOW_PROMPTS.md) - **Essential**: All prompts needed for daily work, optional features, and troubleshooting

**Documentation Quality Assurance:**

- [gemini/documentation-audit-prompt.md](gemini/documentation-audit-prompt.md) - Comprehensive Gemini prompt for auditing documentation workflow automation compatibility

---

## 🎯 Finding What You Need

### Working on API Development?

- [api-catalog.md](system/api-catalog.md) - All API endpoints
- [database-schema.md](system/database-schema.md) - Prisma schema summary
- [adding-api-endpoint.md](sops/adding-api-endpoint.md) - SOP for new endpoints

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

- [port-troubleshooting.md](sops/port-troubleshooting.md) - Fix port configuration issues
- [git-workflow.md](sops/git-workflow.md) - Branching and commit guidelines
- [adding-api-endpoint.md](sops/adding-api-endpoint.md) - Create new API routes
- [database-migrations.md](sops/database-migrations.md) - Schema change workflow

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

1. **Follow existing workflow** (STATUS.md, DEVELOPMENT_PLAN.md)
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

- [STATUS.md](../STATUS.md) - What's happening now
- [DEVELOPMENT_PLAN.md](../docs/DEVELOPMENT_PLAN.md) - Full roadmap
- [CLAUDE.md](../CLAUDE.md) - How to use Claude Code
- [WORKFLOW_ARCHITECTURE.md](../docs/WORKFLOW_ARCHITECTURE.md) - Git workflow

### Architecture Docs

- [01-ARCHITECTURE.md](../docs/01-ARCHITECTURE.md) - System architecture
- [02-DEVELOPER_GUIDE.md](../docs/02-DEVELOPER_GUIDE.md) - Dev setup
- [03-MCP_ARCHITECTURE.md](../docs/03-MCP_ARCHITECTURE.md) - MCP design

### This Documentation System

- [Context Management Transcript](../transcript_context_management.md) - Original inspiration
- [SIMPLE_GEMINI_WORKFLOW.md](../SIMPLE_GEMINI_WORKFLOW.md) - Deep analysis workflow

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
