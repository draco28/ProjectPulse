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

| Phase Contains                | Skills I Load                                                                    | Token Cost |
| ----------------------------- | -------------------------------------------------------------------------------- | ---------- |
| "API", "endpoint", "route"    | [api-patterns](.claude/skills/moksha-devhub/api-patterns.md)                     | 220 tokens |
| "Component", "UI", "page"     | [component-patterns](.claude/skills/moksha-devhub/component-patterns.md)         | 280 tokens |
| "UI", "page", "design"        | [ui-generation-workflow](.claude/skills/moksha-devhub/ui-generation-workflow.md) | 320 tokens |
| "layout", "wireframe"         | [ascii-wireframes](.claude/skills/moksha-devhub/ascii-wireframes.md)             | 200 tokens |
| "animation", "interaction"    | [animation-patterns](.claude/skills/moksha-devhub/animation-patterns.md)         | 180 tokens |
| "Database", "Prisma", "query" | [database-patterns](.claude/skills/moksha-devhub/database-patterns.md)           | 200 tokens |
| "Test", "testing", "coverage" | [testing-patterns](.claude/skills/moksha-devhub/testing-patterns.md)             | 240 tokens |
| Any git operation             | [git-workflow](.claude/skills/workflows/git-workflow.md)                         | 180 tokens |

**Step 3: Auto-Read .agent/ Docs (NOT Full Docs)**

| Phase Type      | Instead of Reading                | I Read                                                                     | Savings |
| --------------- | --------------------------------- | -------------------------------------------------------------------------- | ------- |
| API Development | `docs/01-ARCHITECTURE.md` (50K)   | [.agent/system/api-catalog.md](.agent/system/api-catalog.md)               | 95%     |
| Database Work   | `prisma/schema.prisma` + comments | [.agent/system/database-schema.md](.agent/system/database-schema.md)       | 92%     |
| UI Components   | `docs/02-COMPONENTS.md` (30K)     | [.agent/system/component-patterns.md](.agent/system/component-patterns.md) | 88%     |
| Any Work        | Full troubleshooting docs         | [.agent/sops/](.agent/sops/)                                               | 90%     |

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

| You Say / Phase Needs                      | I Auto-Invoke                                                  | Returns               |
| ------------------------------------------ | -------------------------------------------------------------- | --------------------- |
| "How does [feature] work?"                 | [analyze-architecture](.claude/agents/analyze-architecture.md) | 2-5K token summary    |
| "Find all instances of X"                  | [explore-codebase](.claude/agents/explore-codebase.md)         | 2-5K token summary    |
| Phase requires understanding existing code | [analyze-architecture](.claude/agents/analyze-architecture.md) | Architecture insights |

**After Feature Completion** (Automatic):

| Trigger                     | I Auto-Invoke                                        | Output                        |
| --------------------------- | ---------------------------------------------------- | ----------------------------- |
| Feature implementation done | [synthesize-docs](.claude/agents/synthesize-docs.md) | SOP in .agent/sops/           |
| New patterns established    | [synthesize-docs](.claude/agents/synthesize-docs.md) | Updated skills                |
| System architecture changed | [map-system](.claude/agents/map-system.md)           | Refreshed .agent/system/ docs |

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

---

## Context File Workflow (AUTOMATIC)

**This is the file-based context management pattern from transcript_agent_work.md**

### At Session Start

I will automatically:

1. **Create** `.agent/task/current-session-[YYYYMMDD-HHMM].md`
2. **Document**: Current phase, goals, requirements from STATUS.md
3. **Update** this file throughout the session as I work

### When Invoking Sub-Agents

I will automatically:

1. **Pass context file**: "Read `.agent/task/current-session.md` first"
2. **Wait for report**: Sub-agent creates research/analysis report
3. **Read the report**: Load `.agent/task/[agent]-[topic]-[timestamp].md`
4. **Use report for implementation**: Follow the plan/recommendations
5. **Update context**: Add what I implemented to current-session.md

### File Structure

```
.agent/task/
├── current-session-20251026-1430.md         ← Main context file (I create/update)
├── explore-api-patterns-20251026-1445.md    ← Sub-agent research report
├── architecture-search-20251026-1502.md     ← Sub-agent analysis
└── synthesize-sop-20251026-1530.md          ← Sub-agent documentation
```

### Why This Works

- **Sub-agents have full context**: They read current-session.md first
- **Reports are persistent**: I can read them anytime, even after context compaction
- **No information loss**: Everything is saved to files, not just in messages
- **Parent agent stays informed**: current-session.md tracks entire session progress

### Example Flow with Context Files

```
Session Start:
1. I create: .agent/task/current-session-20251026-1430.md
2. Content: "Phase 3.1: Issue Management API - implementing POST /api/issues"

Need Architecture Understanding:
3. I invoke: analyze-architecture sub-agent
4. I tell it: "Read .agent/task/current-session-20251026-1430.md first"
5. Sub-agent reads context, analyzes, creates:
   .agent/task/architecture-issues-20251026-1445.md
6. Sub-agent returns: "Analysis complete. Read the report at [file path]"
7. I read the report file
8. I use report to guide implementation

Implementation Complete:
9. I update: .agent/task/current-session-20251026-1430.md
   Add: "Implemented POST /api/issues following patterns from architecture report"
10. I invoke: synthesize-docs sub-agent
11. Sub-agent reads context, creates SOP
12. I commit everything
```

### What You'll See

When I invoke sub-agents, you'll see messages like:

```
"Invoking analyze-architecture sub-agent to trace data flow...
Passing context file: .agent/task/current-session-20251026-1430.md

[Sub-agent works in isolated thread]

Sub-agent complete. Reading report: .agent/task/architecture-issues-20251026-1445.md

Key insights from report:
- Current API routes use Zod validation
- Response format: { data, error }
- Follow pattern from /api/preferences

Implementing POST /api/issues following these patterns..."
```

---

## 3-Tier Persistence Strategy (AUTOMATIC)

**NEW: Comprehensive progress tracking that survives context compaction and session interruptions**

To ensure no progress is ever lost, I use three levels of progress tracking:

### Tier 1: Real-Time Tracking (Every Major Step)

**Files I manage automatically**:

- `.agent/task/current-session-[timestamp].md` - What I'm doing RIGHT NOW
- `.agent/task/current-todos.md` - Complete task list with progress

**I update these**:

- After completing any significant action (file created, test passed, component done)
- When invoking sub-agents (note report location)
- When blocked or encountering issues

**Token cost**: ~100-200 tokens per update
**Purpose**: Survive context compaction within active session

### Tier 2: Checkpoints (After Significant Milestones)

**File I update**:

- `STATUS.md` - Add "Last Task Completed" entry with timestamp

**I update when**:

- Component fully implemented and tested
- API endpoint working with tests
- Feature sub-section complete
- Before committing to git

**Token cost**: ~300-500 tokens per update
**Purpose**: Track partial phase progress, survive session interruptions

### Tier 3: Knowledge Capture (Strategic, Infrequent)

**Tool I use**:

- Memory MCP - For patterns, decisions, architectural insights

**I update for**:

- Important architectural decisions made
- New patterns discovered (for future skill generation)
- Phase completion summaries
- Solutions to recurring problems

**Token cost**: ~800-1000 tokens per operation
**Purpose**: Long-term knowledge retention across sessions

### Automatic Workflow

**When starting session**:

1. Create `current-session-[timestamp].md`
2. Check if `current-todos.md` exists (resuming previous work?)
3. If yes → Read todos and continue
4. If no → Create new todos from DEVELOPMENT_PLAN.md

**When creating TodoWrite**:

1. Create UI todo list (visible to you)
2. Save identical list to `current-todos.md` (persistent)

**After each task**:

1. Update `current-session.md` with progress note
2. Update `current-todos.md` (mark complete, update percentage)
3. Update TodoWrite UI

**After significant milestone**:

1. Update STATUS.md with checkpoint
2. Commit to git if appropriate

**After phase completion**:

1. Archive `current-todos.md` → `archive/phase-X-day-Y-todos-COMPLETE.md`
2. Full STATUS.md update
3. Optional Memory MCP update with phase summary

### Recovery Workflow

**If context compacts or session interrupted**:

```
Step 1: Read STATUS.md
→ "Phase 3 Day 4, 60% complete, last: CommentForm component"

Step 2: Find latest .agent/task/current-session-[timestamp].md
→ "Was implementing CommentList at 16:45"

Step 3: Read .agent/task/current-todos.md
→ "5/20 tasks done, CommentList in progress, 14 pending"

Step 4: Resume
→ "I see we're implementing CommentList. Let me continue from line 45..."
```

**No progress is lost!** ✅

**Token overhead**: ~3-5K tokens per phase (2.5% of budget) for complete progress safety

---

### Documentation System

### Session Start - Read in Order

1. **[STATUS.md](STATUS.md)** - Current snapshot
2. **[DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)** - Detailed plan
3. **This file** (CLAUDE.md) - Integration guide
4. **[WORKFLOW_ARCHITECTURE.md](docs/WORKFLOW_ARCHITECTURE.md)** - Workflow
5. **[.agent/README.md](.agent/README.md)** - Documentation index

**Then I automatically load skills/.agent/ docs based on phase keywords.**

### Memory Bank System (NEW)

**Structured context files for efficient knowledge retrieval:**

**Core Memory Bank Files** (.agent/):

1. **[project-brief.md](.agent/project-brief.md)** - WHAT we're building and WHY
   - Core requirements, goals, success criteria
   - User personas, target audience
   - Quality standards, constraints
   - Current status and milestones

2. **[system-patterns.md](.agent/system-patterns.md)** - HOW we build
   - Architecture patterns (Server/Client Components)
   - Database patterns (Prisma queries, optimization)
   - API patterns (endpoints, validation, error handling)
   - Styling patterns (Tailwind, neumorphic design)
   - Testing patterns (Jest, RTL, Playwright)

3. **[tech-context.md](.agent/tech-context.md)** - Technical stack
   - Dependencies (Next.js, Prisma, Zod, etc.)
   - Environment setup, configuration
   - Constraints and limitations
   - Browser support, performance targets
   - Troubleshooting common issues

4. **[active-context.md](.agent/active-context.md)** - Current focus
   - What we're working on RIGHT NOW
   - Recent changes and commits
   - Remaining tasks for current phase
   - Blockers and waiting items

5. **[progress.md](.agent/progress.md)** - Progress tracking
   - What's done, what's left
   - Metrics (velocity, quality gates)
   - Risk assessment
   - Lessons learned

**When to Read Which File:**

```
Need project requirements?          → project-brief.md
Need architectural patterns?        → system-patterns.md
Need tech stack details?            → tech-context.md
Need current task context?          → active-context.md
Need progress overview?             → progress.md
```

**Memory Bank Benefits:**

- 🎯 **Targeted Loading**: Read only what you need (vs loading everything)
- 🔄 **Auto-Updates**: Sub-agents maintain these files automatically
- 💾 **Token Efficient**: ~3-5K tokens per file vs 30K+ for full context
- 📊 **Structured**: Consistent format makes information easy to find

### Finding Information

**Looking for requirements?** → [.agent/project-brief.md](.agent/project-brief.md)
**Looking for patterns?** → [.agent/system-patterns.md](.agent/system-patterns.md)
**Looking for tech details?** → [.agent/tech-context.md](.agent/tech-context.md)
**Looking for current work?** → [.agent/active-context.md](.agent/active-context.md)
**Looking for progress?** → [.agent/progress.md](.agent/progress.md)
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

## Specialized Expert Agents (Tech-Specific)

**Available for deep technical guidance - I'll invoke automatically when needed.**

### Next.js Expert

**[next-js-expert](.claude/agents/next-js-expert.md)** - Next.js 14 App Router specialist

**When I invoke**:

- Page/route structure design questions
- Server vs Client Component decisions
- Data fetching strategy planning
- Caching and performance optimization
- Server Actions vs API routes decisions

**What it provides**:

- Detailed implementation plans with Next.js patterns
- File structure recommendations
- Code examples following App Router conventions
- Performance optimization strategies

### Prisma Expert

**[prisma-expert](.claude/agents/prisma-expert.md)** - Database design and Prisma ORM specialist

**When I invoke**:

- Database schema design
- Migration strategy planning
- Query optimization
- Relation patterns (one-to-many, many-to-many, self-referential)
- PostgreSQL-specific features (pgvector, tsvector, JSONB)

**What it provides**:

- Complete Prisma schema designs
- Migration plans with SQL review
- Optimized query patterns
- Index recommendations

### React Expert

**[react-expert](.claude/agents/react-expert.md)** - React 18+ patterns and optimization specialist

**When I invoke**:

- Component architecture design
- Custom hooks planning
- Performance optimization (memo, useCallback, useMemo)
- State management decisions
- Complex UI pattern implementation

**What it provides**:

- Component architecture plans
- Custom hook implementations
- Performance optimization strategies
- TypeScript type patterns

### How These Work

**You don't request these explicitly** - I invoke them automatically when the phase requires deep technical expertise:

```
Phase: "Design issues page with real-time updates"

Me: "This needs Next.js routing + React optimization expertise.
     Invoking next-js-expert for page structure...
     [Expert creates implementation plan]

     Invoking react-expert for real-time updates pattern...
     [Expert creates component architecture]

     Reading both plans and implementing..."
```

**Key Difference from Research Agents**:

- **Research agents** (explore-codebase, analyze-architecture): Scan existing code, return findings
- **Expert agents** (next-js-expert, prisma-expert, react-expert): Design new implementations, return plans

---

## Legacy Specialized Agents (Orchestrator-Based - Not Used)

The following agents exist but are **NOT used** in your current workflow:

- devhub-architect - Architecture decisions (use next-js-expert/prisma-expert/react-expert instead)
- devhub-fullstack - Full-stack implementation (I do implementation directly)
- devhub-testing - Test creation (use testing-patterns skill instead)
- devhub-auditor - Code review (manual review preferred)
- devhub-mcp-specialist - MCP integration (as needed)

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

## UI & Frontend Design (SuperDesign)

**For standalone HTML/design prototypes**, the SuperDesign workflow is available.

**Complete Guide**: [.claude/skills/moksha-devhub/superdesign-ui-generator.md](.claude/skills/moksha-devhub/superdesign-ui-generator.md)

**When to use**: When asked to "design UI prototype", "create HTML mockup", or specifically "use SuperDesign workflow"

**Output**: Standalone HTML files in `.superdesign/design_iterations/` folder

**Note**: For React components in Moksha DevHub, use [ui-generation-workflow.md](.claude/skills/moksha-devhub/ui-generation-workflow.md) instead.

---
