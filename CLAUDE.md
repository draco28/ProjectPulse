# Claude Code Integration Guide - ProjectPulse

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

## 🚨 CRITICAL: Mandatory Session Protocol

**EVERY session MUST start with the mandatory protocol.**

**Why this exists:** I read instructions but don't follow them unless explicitly prompted with confirmations.

**How it works:**

1. You copy-paste a starter prompt at session start
2. I must complete all 5 protocol steps
3. I must confirm each step explicitly
4. Missing confirmation = workflow violation (you call me out)

**📋 Full Protocol:** [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md)
**🚀 Quick Start Guide:** [SESSION_START_QUICK_GUIDE.md](SESSION_START_QUICK_GUIDE.md)

---

## Session Start Pattern (REQUIRED PROTOCOL)

### Starter Prompt (Copy-Paste This)

At the start of **EVERY** session, copy-paste this:

```
MANDATORY PROTOCOL - Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: [copy from STATUS.md]
Requirements: [copy from docs/13-Project-Plan.md]

ENFORCE:
- ✅ Step 1: Initialize session
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 5: Post-completion workflow

Confirm each step explicitly. If you skip ANY step, I will stop you.

Proceed with [phase name].
```

### What I Must Do (Per Protocol)

**STEP 1: INITIALIZATION**

- Read STATUS.md and docs/13-Project-Plan.md
- Create `.agent/task/current-session-[YYYYMMDD-HHMM].md`
- **Confirm:** "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

**Reading Path After Step 1:**

After initialization, load additional context based on phase type:

- **Implementation phases:** [docs/03-Architecture.md](docs/03-Architecture.md) → [docs/04-Data-and-Model-Spec.md](docs/04-Data-and-Model-Spec.md) → [docs/06-API/openapi.yaml](docs/06-API/openapi.yaml)
- **Planning phases:** [docs/01-PRD.md](docs/01-PRD.md) → [docs/02-SRS.md](docs/02-SRS.md) → [docs/12-Backlog.md](docs/12-Backlog.md)

See [docs/README.md](docs/README.md) for complete reading paths.

**STEP 2: PLAN CREATION**

- Create implementation plan (use ExitPlanMode if needed)
- Get your approval
- **IMMEDIATELY save** to `.agent/task/current-plan.md`
- Create `.agent/task/current-todos.md`
- **Confirm:** "✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md"

**STEP 3: EXPERT CONSULTATION**

- Invoke `react-expert` for component architecture decisions
- Invoke `next-js-expert` for Server/Client component and data fetching decisions
- Invoke `prisma-expert` for database schema and query optimization
- **Confirm:** "✅ STEP 3 COMPLETE: Consulted [expert-name] for [decision-topic]"

**When Experts Required:**

- New architectures (component hierarchies, state patterns)
- Complex features (multi-step workflows, performance-critical)
- Database changes (schema design, migration strategy)

**When Experts Optional:**

- Routine CRUD following established patterns
- UI updates matching existing conventions
- Minor refactors within established architecture

**STEP 4: PROGRESS CHECKPOINTS**

- At 15K, 30K, 45K, 60K, 75K, 90K tokens: Update session and todos files
- **Confirm:** "✅ CHECKPOINT at [X]K tokens: Progress saved"

**STEP 5: POST-COMPLETION**

- Create completion doc (optional but recommended for complex phases)
- Update STATUS.md and docs/13-Project-Plan.md
- Invoke synthesize-docs (if new patterns)
- Invoke map-system (if architecture changed)
- Commit documentation, then code
- **Confirm:** "✅ STEP 5 COMPLETE: All documentation updated and committed"

### Skills and Context Loading

Based on phase keywords, I load relevant skills:

| Phase Contains                | Skills to Load                                                          |
| ----------------------------- | ----------------------------------------------------------------------- |
| "API", "endpoint", "route"    | [api-patterns](.claude/skills/projectpulse/api-patterns.md)             |
| "Component", "UI", "page"     | [component-patterns](.claude/skills/projectpulse/component-patterns.md) |
| "Database", "Prisma", "query" | [database-patterns](.claude/skills/projectpulse/database-patterns.md)   |
| "Test", "testing", "coverage" | [testing-patterns](.claude/skills/projectpulse/testing-patterns.md)     |

### Sub-Agent Invocations

**Research Agents** (during planning):

- `explore-codebase` - Find existing patterns
- `analyze-architecture` - Trace data flows

**Expert Agents** (before implementing) - **REQUIRED per Step 3**:

- `react-expert` - Component architecture
- `next-js-expert` - Server/Client decisions
- `prisma-expert` - Database design

**Documentation Agents** (after completion) - **REQUIRED per Step 5**:

- `synthesize-docs` - Generate SOPs
- `map-system` - Update system docs

---

## Context File Workflow (REQUIRED PER PROTOCOL)

**File-based context management - REQUIRED by Steps 1, 2, and 4**

### At Session Start (STEP 1)

Per protocol Step 1, I am REQUIRED to:

1. **Create** `.agent/task/current-session-[YYYYMMDD-HHMM].md`
2. **Document**: Current phase, goals, requirements from STATUS.md
3. **Update** this file at every checkpoint (Step 4)

### When Invoking Sub-Agents (STEP 3)

Per protocol Step 3, I am REQUIRED to:

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

## 3-Tier Persistence Strategy (REQUIRED PER PROTOCOL)

**Comprehensive progress tracking - REQUIRED by Steps 1, 2, and 4**

To ensure no progress is ever lost, the protocol requires three levels of progress tracking:

### Tier 1: Real-Time Tracking (Every Major Step)

**Files I must create per protocol Steps 1 & 2**:

- `.agent/task/current-session-[timestamp].md` - What I'm doing RIGHT NOW (Step 1)
- `.agent/task/current-todos.md` - Complete task list with progress (Step 2)

**I must update these per protocol Step 4**:

- At every 15K token checkpoint (Step 4)
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

### Required Workflow per Protocol

**When starting session (STEP 1)**:

1. Create `current-session-[timestamp].md` (REQUIRED)
2. Check if `current-todos.md` exists (resuming previous work?)
3. If yes → Read todos and continue
4. If no → Create new todos from docs/13-Project-Plan.md (STEP 2)

**When creating plan (STEP 2)**:

1. Create UI todo list with TodoWrite (visible to you)
2. Save identical list to `current-todos.md` (persistent - REQUIRED)
3. Save plan to `current-plan.md` (REQUIRED)

**At each checkpoint (STEP 4 - every 15K tokens)**:

1. Update `current-session.md` with progress note (REQUIRED)
2. Update `current-todos.md` (mark complete, update percentage - REQUIRED)
3. Update TodoWrite UI (REQUIRED)
4. Output checkpoint confirmation (REQUIRED)

**After significant milestone**:

1. Update STATUS.md with checkpoint
2. Commit to git if appropriate

**After phase completion (STEP 5)**:

1. Create completion doc (optional but recommended for complex phases)
2. Update STATUS.md and docs/13-Project-Plan.md (REQUIRED)
3. Invoke synthesize-docs and map-system sub-agents (REQUIRED if patterns created or architecture changed)
4. Commit documentation, then code (REQUIRED)
5. Archive `current-todos.md` → `archive/phase-X-day-Y-todos-COMPLETE.md`
6. Optional Memory MCP update with phase summary

### Manual Save Guidance

**⚠️ CRITICAL: There is NO automatic save - you must save manually**

**When to save progress:**

1. **Before reaching 150K tokens** (75% of limit)
   - Monitor system warnings: "Token usage: X/200000"
   - Save when you see 140-150K range

2. **After significant milestones:**
   - Component fully implemented
   - API endpoint working
   - Feature section complete

3. **Before risky operations:**
   - Large refactorings
   - Multi-file changes
   - Long debugging sessions

**How to save manually:**

1. Update `current-session-[timestamp].md` with latest progress
2. Update `current-todos.md` with task statuses
3. Update `STATUS.md` at major checkpoints
4. Brief note: "💾 Progress saved at [X]K tokens"

**Token Counter Quick Reference**:

- Current usage shown in system warnings: "Token usage: X/200000"
- 140-150K = ⚠️ Warning (save soon)
- 150-180K = 🟡 Caution (save frequently)
- 180K+ = 🔴 Danger (save immediately)
- ~200K = 💥 Auto-compaction imminent

**After manual save**:

- Continue working (you have buffer remaining)
- Or manually compact context if approaching limits
- Or start new session for next major task

### Plan Mode Workflow

**⚠️ REQUIRED: Always save plans after user approval**

When you create a plan in plan mode and user approves with ExitPlanMode:

1. **IMMEDIATELY save plan** to `.agent/task/current-plan.md`
   - Single reusable file (overwrites previous plan)
   - Include: overview, steps, dependencies, success criteria

2. **Update session file**: Note that plan was saved

3. **Proceed with implementation** using the saved plan

**Why this matters**:

- Plans in conversation history are LOST during context compaction
- Saved plan survives compaction and session interruptions
- You can always reference `.agent/task/current-plan.md`

**File location**: `.agent/task/current-plan.md` (single file, not timestamped)

**Example workflow**:

```
User: "Create a plan for implementing search feature"
You: [Create plan, call ExitPlanMode]
User: [Approves plan]
You: [Save to current-plan.md, update session file, begin implementation]
```

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
2. **[docs/13-Project-Plan.md](docs/13-Project-Plan.md)** - Implementation roadmap
3. **[docs/README.md](docs/README.md)** - Complete documentation index
4. **This file** (CLAUDE.md) - Integration guide
5. **[.agent/README.md](.agent/README.md)** - Agent documentation

**Then I automatically load skills/.agent/ docs based on phase keywords.**

### Memory Bank System (MANDATORY)

**🚨 REQUIRED BY PROTOCOL: These files must be read EVERY session (Step 1) and updated EVERY session (Step 5).**

See [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md) Step 1 and Step 5 for requirements.

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

**Project Documentation (Main):**
**Looking for requirements?** → [docs/01-PRD.md](docs/01-PRD.md) or [docs/02-SRS.md](docs/02-SRS.md)
**Looking for architecture?** → [docs/03-Architecture.md](docs/03-Architecture.md)
**Looking for API spec?** → [docs/06-API/openapi.yaml](docs/06-API/openapi.yaml)
**Looking for project plan?** → [docs/13-Project-Plan.md](docs/13-Project-Plan.md)
**Looking for all docs?** → [docs/README.md](docs/README.md)

**Agent Context (.agent/):**
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

**You don't need to request these explicitly - I must invoke them per protocol Step 3 (experts) or Step 5 (documentation).**

### When NOT to Invoke Sub-Agents

**Don't invoke sub-agents for:**

- Pattern already documented in .agent/sops/
- Straightforward CRUD following existing conventions
- Minor UI updates matching existing components
- Information available in .agent/system/ docs

**Use direct implementation when:**

- Following established patterns from .agent/ docs
- Implementing routine features with clear precedent
- Making incremental changes to existing systems

---

## Specialized Expert Agents (Tech-Specific)

**Available for deep technical guidance - I must invoke per protocol Step 3 before making technical decisions.**

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

**You don't request these explicitly** - I must invoke per protocol Step 3 when the phase requires deep technical expertise:

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

1. Update STATUS.md
2. Update docs/13-Project-Plan.md (and docs/12-Backlog.md if needed)
3. Optional: Create completion doc (COMPLETION_TEMPLATE.md) — will be archived under `docs/archive/completions/`
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
- [ ] Read STATUS.md + docs/13-Project-Plan.md
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
- [ ] Read STATUS.md and docs/13-Project-Plan.md

---

## Getting Help

**Documentation**:

1. [.agent/README.md](.agent/README.md) - Agent documentation index
2. [STATUS.md](STATUS.md) - Current state
3. [docs/13-Project-Plan.md](docs/13-Project-Plan.md) - Implementation roadmap
4. [docs/README.md](docs/README.md) - Complete documentation index

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

- Your workflow (STATUS.md → docs/13-Project-Plan.md → work)
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

**Complete Guide**: [.claude/skills/projectpulse/superdesign-ui-generator.md](.claude/skills/projectpulse/superdesign-ui-generator.md)

**When to use**: When asked to "design UI prototype", "create HTML mockup", or specifically "use SuperDesign workflow"

**Output**: Standalone HTML files in `.superdesign/design_iterations/` folder

**Note**: For React components in ProjectPulse, use [ui-generation-workflow.md](.claude/skills/projectpulse/ui-generation-workflow.md) instead.

---
