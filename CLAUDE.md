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

## Session Start Pattern (AUTOMATIC BEHAVIOR)

### How You Start Sessions

You typically say:

```
"Read STATUS.md, DEVELOPMENT_PLAN.md, CLAUDE.md,
WORKFLOW_ARCHITECTURE.md, .agent/README.md and continue"
```

### What I Do AUTOMATICALLY (Without You Asking)

**Step 1: Parse Current Phase**
- Read STATUS.md → Extract current phase (e.g., "Phase 3.1: Issue Management API")
- Read DEVELOPMENT_PLAN.md → Understand phase requirements

**Step 2: Auto-Load Skills Based on Keywords**

| Phase Contains | Skills I Load | Token Cost |
|----------------|---------------|------------|
| "API", "endpoint", "route" | [api-patterns](.claude/skills/moksha-devhub/api-patterns.md) | 220 tokens |
| "Component", "UI", "page" | [component-patterns](.claude/skills/moksha-devhub/component-patterns.md) | 280 tokens |
| "Database", "Prisma", "query" | [database-patterns](.claude/skills/moksha-devhub/database-patterns.md) | 200 tokens |
| "Test", "testing", "coverage" | [testing-patterns](.claude/skills/moksha-devhub/testing-patterns.md) | 240 tokens |
| Any git operation | [git-workflow](.claude/skills/workflows/git-workflow.md) | 180 tokens |

**Step 3: Auto-Read .agent/ Docs (NOT Full Docs)**

| Phase Type | Instead of Reading | I Read | Savings |
|------------|-------------------|--------|---------|
| API Development | `docs/01-ARCHITECTURE.md` (50K) | [.agent/system/api-catalog.md](.agent/system/api-catalog.md) | 95% |
| Database Work | `prisma/schema.prisma` + comments | [.agent/system/database-schema.md](.agent/system/database-schema.md) | 92% |
| UI Components | `docs/02-COMPONENTS.md` (30K) | [.agent/system/component-patterns.md](.agent/system/component-patterns.md) | 88% |
| Any Work | Full troubleshooting docs | [.agent/sops/](.agent/sops/) | 90% |

**Step 4: Implement Following Patterns**
- Use loaded skills as reference
- Follow established patterns from .agent/ docs
- Ask clarifying questions if phase is ambiguous

**Step 5: After Completion (AUTO-INVOKE SUB-AGENTS)**
- Invoke [synthesize-docs](.claude/agents/synthesize-docs.md) sub-agent → Generate SOP
- Update STATUS.md
- Commit with proper message

### When I Auto-Invoke Sub-Agents

**During Research** (Keep Main Thread Clean):

| You Say / Phase Needs | I Auto-Invoke | Returns |
|------------------------|---------------|---------|
| "How does [feature] work?" | [analyze-architecture](.claude/agents/analyze-architecture.md) | 2-5K token summary |
| "Find all instances of X" | [explore-codebase](.claude/agents/explore-codebase.md) | 2-5K token summary |
| Phase requires understanding existing code | [analyze-architecture](.claude/agents/analyze-architecture.md) | Architecture insights |

**After Feature Completion** (Automatic):

| Trigger | I Auto-Invoke | Output |
|---------|---------------|--------|
| Feature implementation done | [synthesize-docs](.claude/agents/synthesize-docs.md) | SOP in .agent/sops/ |
| New patterns established | [synthesize-docs](.claude/agents/synthesize-docs.md) | Updated skills |
| System architecture changed | [map-system](.claude/agents/map-system.md) | Refreshed .agent/system/ docs |

**You'll see me say**: "Analyzing architecture... invoking analyze-architecture sub-agent" or "Feature complete, generating SOP..."

### Example Session Flow

```
You: "Read STATUS.md, DEVELOPMENT_PLAN.md and continue"

Me: *reads STATUS.md*
    "Current phase: Phase 3.1 - Issue Management API"

    *auto-loads api-patterns skill* (220 tokens)
    *auto-loads database-patterns skill* (200 tokens)
    *auto-reads .agent/system/api-catalog.md* (2.4K tokens)
    *auto-reads .agent/system/database-schema.md* (2.8K tokens)

    "I'll implement POST /api/issues endpoint following our API patterns..."

    *implements endpoint*

    "Implementation complete. Auto-invoking synthesize-docs sub-agent
    to generate SOP for API endpoint creation..."

    *sub-agent returns SOP*

    "SOP saved to .agent/sops/api-endpoint-creation.md
    Updating STATUS.md and committing..."
```

**Total tokens: ~6K** (vs 50K+ without this system)

### Documentation System

### Session Start - Read in Order

1. **[STATUS.md](STATUS.md)** - Current snapshot
2. **[DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)** - Detailed plan
3. **This file** (CLAUDE.md) - Integration guide
4. **[WORKFLOW_ARCHITECTURE.md](docs/WORKFLOW_ARCHITECTURE.md)** - Workflow
5. **[.agent/README.md](.agent/README.md)** - Task-specific context

**Then I automatically load skills/.agent/ docs based on phase keywords.**

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
