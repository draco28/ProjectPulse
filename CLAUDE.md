# Claude Code Integration Guide - Moksha DevHub

**Version**: 2.0 (Context-Optimized)
**Last Updated**: 2025-10-26

---

## Quick Start

Just chat naturally with me (Claude Code):

```
"Implement POST /api/issues endpoint"
"Write tests for the search API"
"Debug the authentication flow"
```

---

## 🚨 CRITICAL: Pre-Work Checklist

**BEFORE starting ANY coding work:**

### 1. Port Configuration

```bash
pnpm dev
# ✅ MUST show: "ready started server on 0.0.0.0:3000"
# ❌ WRONG: "ready started server on 0.0.0.0:3002"
```

**See**: [.agent/sops/port-troubleshooting.md](.agent/sops/port-troubleshooting.md)

### 2. Git Branch

```bash
git branch
# ✅ MUST be on feature branch (NOT master!)
# If on master:
git checkout master && git pull origin master
git checkout -b feature/your-feature
```

**See**: [.agent/sops/git-workflow.md](.agent/sops/git-workflow.md)

---

## Documentation System

### Session Start - Read in Order

1. **[STATUS.md](STATUS.md)** - Current snapshot
2. **[DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)** - Detailed plan
3. **This file** (CLAUDE.md) - Integration guide
4. **[WORKFLOW_ARCHITECTURE.md](docs/WORKFLOW_ARCHITECTURE.md)** - Workflow
5. **[.agent/README.md](.agent/README.md)** - Task-specific context

### Finding Information

**Looking for technical details?** → [.agent/README.md](.agent/README.md)
**Looking for procedures?** → [.agent/sops/](.agent/sops/)
**Looking for system docs?** → [.agent/system/](.agent/system/)

### Key Documentation

**System References**:

- [Database Schema](.agent/system/database-schema.md) - Prisma models
- [API Catalog](.agent/system/api-catalog.md) - All endpoints
- [Component Patterns](.agent/system/component-patterns.md) - React conventions
- [MCP Tools Guide](.agent/system/mcp-tools-guide.md) - MCP tool usage

**Procedures (SOPs)**:

- [Port Troubleshooting](.agent/sops/port-troubleshooting.md) - Fix port issues
- [Git Workflow](.agent/sops/git-workflow.md) - Branch management

---

## Sub-Agents (Context Management)

**Use sub-agents for research tasks to keep main conversation clean.**

### When I'll Invoke Sub-Agents

**explore-codebase**: "Find all X", "Scan repo for Y"

- Scans entire repo, returns summary
- Saves 20-30K tokens in main thread

**analyze-architecture**: "How does X work?", "Trace data flow"

- Traces system flows across files
- Returns architectural insights

**synthesize-docs**: After feature completion

- Generates SOPs and documentation
- Updates .agent/ folder automatically

**map-system**: "Update system documentation"

- Scans Prisma/API/components
- Refreshes .agent/system/ docs

**You don't need to request these - I'll invoke them automatically when appropriate.**

---

## Specialized Agents (From .claude/agents/)

### Architecture & Design

**devhub-architect** - System design, schema design, architecture decisions

### Implementation

**devhub-fullstack** - API routes, React components, Prisma queries

### Testing

**devhub-testing** - Unit tests, E2E tests, test coverage

### Code Quality

**devhub-auditor** - Security, performance, accessibility review

### MCP Integration

**devhub-mcp-specialist** - MCP tools, resources, prompts

**Note**: These are invoked via the orchestrator system (not currently used in your workflow)

---

## Gemini Integration (Deep Analysis)

### When to Use Gemini

I'll suggest Gemini CLI when you request:

- "Analyze entire codebase..."
- "Review all files..."
- "System-wide migration..."
- Any analysis requiring >200K tokens

### The Workflow

```
You: "Analyze entire codebase for tech debt"

Me: "This needs Gemini's 1M context.
     Run: analyze-with-gemini 'Analyze entire codebase for tech debt'
     Then tell me to read the results!"

[You run command in terminal]

You: "Read the Gemini analysis file"

Me: [Reads analysis, implements fixes]
```

**Complete Guide**: [SIMPLE_GEMINI_WORKFLOW.md](SIMPLE_GEMINI_WORKFLOW.md)

---

## MCP Tools

**Current tools available**:

- memory - Knowledge graph
- filesystem - File operations
- git - Version control
- gitkraken - GitHub integration
- postgres - Database queries
- playwright - Browser automation
- docker-devhub - Container management
- sequential-thinking - Complex reasoning

**Complete guide**: [.agent/system/mcp-tools-guide.md](.agent/system/mcp-tools-guide.md)

---

## Token Optimization

### How .agent/ System Saves Tokens

**Before** (Old CLAUDE.md approach):

- CLAUDE.md: ~360 lines = ~10K tokens
- Full context always loaded
- Research clutters main thread
- Total: 30-40K tokens per task

**After** (New .agent/ approach):

- CLAUDE.md: ~150 lines = ~3K tokens (70% reduction)
- Read only relevant docs via index
- Sub-agents handle research in isolated threads
- Total: 5-10K tokens per task (75% reduction)

### Sub-Agent Token Savings

**Example**: "How does authentication work?"

**Without sub-agent**:

1. Read 15 files in main thread (15K tokens)
2. Grep across codebase (5K tokens)
3. Analyze and respond (5K tokens)
4. **Total in main thread**: 25K tokens

**With analyze-architecture sub-agent**:

1. Sub-agent reads 15 files (15K tokens in isolated thread)
2. Sub-agent greps and analyzes (10K tokens in isolated thread)
3. Sub-agent returns summary (2K tokens to main thread)
4. **Total in main thread**: 2K tokens (92% reduction!)

---

## Best Practices

### 1. Be Specific

```
❌ "Fix the bug"
✅ "Debug why POST /api/issues returns 400 for valid input"
```

### 2. Reference Documentation

```
✅ "Follow the API patterns in .agent/system/api-catalog.md"
✅ "Use the git workflow from .agent/sops/git-workflow.md"
```

### 3. Let Me Invoke Sub-Agents

```
You: "How does search work across the codebase?"
Me: [Automatically invokes analyze-architecture sub-agent]
    [Returns concise architectural summary]
```

### 4. Use /update-doc for Documentation

```
After completing a feature:
You: "/update-doc after-feature"
Me: [Generates SOP, updates .agent/ docs]
```

---

## Maintenance Workflow

### After EVERY Feature Completion

**Your existing workflow** (unchanged):

1. Create completion doc (COMPLETION_TEMPLATE.md)
2. Update STATUS.md
3. Update DEVELOPMENT_PLAN.md
4. Commit and push

**Optional - New** (when feature introduces new patterns): 5. Ask me to generate SOP:

```
You: "Generate SOP for adding API endpoints"
Me: [Invokes synthesize-docs sub-agent]
    [Saves to .agent/sops/]
```

6. If system changed, update docs:
   ```
   You: "Update system documentation"
   Me: [Invokes map-system sub-agent]
       [Refreshes .agent/system/ docs]
   ```

---

## Slash Commands

### /update-doc

Initialize or update .agent/ documentation system

**Usage**:

```
/update-doc initialize       # Set up .agent/ structure
/update-doc after-feature    # Save plan + generate SOP
/update-doc sop [topic]      # Generate specific SOP
/update-doc refresh-system   # Update system docs
```

**See**: [.claude/commands/update-doc.md](.claude/commands/update-doc.md)

---

## Quick Reference

### Daily Checklist

```markdown
- [ ] pnpm dev shows port 3000
- [ ] localhost:3000 loads application
- [ ] On feature branch (not master)
- [ ] Read STATUS.md + DEVELOPMENT_PLAN.md
- [ ] Check .agent/README.md for task context
```

### Common Tasks

**Need to know API structure?**
→ Read [.agent/system/api-catalog.md](.agent/system/api-catalog.md)

**Need to know database schema?**
→ Read [.agent/system/database-schema.md](.agent/system/database-schema.md)

**Port configuration broken?**
→ Follow [.agent/sops/port-troubleshooting.md](.agent/sops/port-troubleshooting.md)

**Creating new branch?**
→ Follow [.agent/sops/git-workflow.md](.agent/sops/git-workflow.md)

**Deep codebase analysis needed?**
→ Use Gemini CLI (see [SIMPLE_GEMINI_WORKFLOW.md](SIMPLE_GEMINI_WORKFLOW.md))

---

## Integration Checklist

**Before starting development**:

- [ ] MCP tools configured and working
- [ ] Can access .agent/ documentation
- [ ] Can run pnpm dev successfully
- [ ] On correct git branch
- [ ] Read STATUS.md and DEVELOPMENT_PLAN.md

---

## Getting Help

**Documentation**:

1. [.agent/README.md](.agent/README.md) - Doc index
2. [STATUS.md](STATUS.md) - Current state
3. [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) - Full plan
4. [WORKFLOW_ARCHITECTURE.md](docs/WORKFLOW_ARCHITECTURE.md) - Workflow

**Procedures**:

- [.agent/sops/](.agent/sops/) - All SOPs
- [.claude/CRITICAL_MISTAKES.md](.claude/CRITICAL_MISTAKES.md) - Common errors

**System Docs**:

- [.agent/system/](.agent/system/) - Technical references

---

## Key Differences from v1.0

### What Changed?

**1. Context Optimization**

- Leaner CLAUDE.md (360 → 150 lines)
- Documentation split into .agent/ folder
- Sub-agents for research tasks

**2. Sub-Agent System**

- explore-codebase - Repo scanning
- analyze-architecture - System flow analysis
- synthesize-docs - SOP generation
- map-system - System doc updates

**3. Structured Documentation**

- .agent/README.md - Doc index
- .agent/sops/ - Procedures
- .agent/system/ - Technical references
- .agent/task/ - Implementation plans

**4. Removed**

- Orchestrator sections (you use direct chat)
- Session management (not needed)
- Detailed examples (moved to SOPs)
- Troubleshooting (moved to SOPs)

### What Stayed the Same?

- Your workflow (STATUS.md → DEVELOPMENT_PLAN.md → work)
- Git workflow rules
- Port configuration checks
- Gemini integration for deep analysis
- Agent specializations (architect, fullstack, etc.)

---

**Ready to code?**

1. Check pre-work checklist
2. Start conversation with me
3. I'll handle sub-agents, documentation, and context optimization automatically

🚀 **Happy coding with optimized context!**
