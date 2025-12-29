# Claude Code Integration Guide - ProjectPulse

**Version**: 3.0 (MCP-Based)
**Last Updated**: 2025-12-21

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

### 1. Health Check

```bash
curl http://localhost:3000/api/health
# ✅ MUST return: {"status":"healthy","database":"connected"}
```

**If services down:**
```bash
docker compose -f docker-compose.cloud.yml up -d
```

### 2. Git Branch

```bash
git branch
# ✅ MUST be on feature branch (NOT master!)
# If on master:
git checkout master && git pull origin master
git checkout -b feature/your-feature
```

### 3. Load ProjectPulse Context (MCP)

```
projectpulse_context_load(projectId: 6)
```

This returns:
- All 5 memory banks (project brief, patterns, tech context, active focus, progress)
- Active sessions (check if PAUSED work exists)
- Workflow hints

**If PAUSED session found:** Resume with `projectpulse_agent_session_resume(sessionId)`
**If no session:** Start new with `projectpulse_agent_session_start()`

**See**: [.agent/sops/git-workflow.md](.agent/sops/git-workflow.md)

---

## 🖥️ Mac Mini Cloud Architecture

### ⚠️ CRITICAL: Dev vs Prod Understanding

**MCP is connected to PRODUCTION, not localhost!**

| Environment | URL | When Changes Are Visible |
|-------------|-----|-------------------------|
| **PRODUCTION** | Docker containers on Mac mini | After `git push origin master` → auto-deploy |
| **Development** | `pnpm dev` (rarely used) | Immediately (but MCP won't see them) |

### What This Means for Agents

1. **MCP tools** (ticket_create, context_load, etc.) → Talk to **PROD database**
2. **Code edits** → Only visible in prod after **push to master**
3. **API testing via curl** → Tests the **PROD** instance (Docker)
4. **Don't expect** code changes to appear in MCP results until deployed

### Deployment Flow

```
Code Edit → git add → git commit → git push origin master → Auto-deploy → Changes visible in PROD
```

**Time to deploy:** ~2-3 minutes after push to master

### Service URLs (PRODUCTION - Docker on Mac mini)

- **Web App**: http://localhost:3000 (inside Mac mini Docker network)
- **MCP Server**: http://localhost:3001 (MCP tools connect here)
- **API Health**: http://localhost:3000/api/health
- **Database**: `postgresql://postgres:postgres123@localhost:5432/projectpulse_dev`
- **Redis**: `localhost:6379`

> **Note**: "localhost" here means the Mac mini's Docker network, NOT a local dev server.
> These URLs are from the perspective of processes running ON the Mac mini.

### Compose Files

- **Mac mini runtime**: `docker-compose.cloud.yml` (PRODUCTION)
- **CI/local fallback**: `docker-compose.yml` (automated testing only)

### Workflow

**All work happens on Mac mini:**
- Code editing (Read, Edit, Write tools)
- Git operations (commits, pushes, branches)
- Testing (unit, integration, E2E)
- Docker management (restart, logs, migrations)

### When to Verify Changes

| Task | How to Verify |
|------|---------------|
| Code logic fix | Write tests, run `pnpm test` |
| API route change | Push to master, wait for deploy, then test |
| Database schema | Migration via `prisma migrate deploy` in Docker |
| MCP tool behavior | Push to master, wait for deploy, then use MCP tool |

**Complete Setup**: [.agent/sops/mac-mini-cloud-architecture.md](.agent/sops/mac-mini-cloud-architecture.md)

### What I Must Do (MCP-Based Workflow)

**STEP 1: LOAD CONTEXT**

```
projectpulse_context_load(projectId: 6)
```

This returns:
- All 5 memory banks (project brief, patterns, tech context, active focus, progress)
- Active sessions (check if work in progress)
- Available resources (personas, skills, SOPs)
- Workflow hints

**If PAUSED session exists:** → `projectpulse_agent_session_resume(sessionId)`
**If no active session:** → Continue to Step 2

**STEP 2: START SESSION**

```
projectpulse_agent_session_start({
  projectId: 6,
  name: "Implementing feature X",
  plan: "## Plan\n1. Do X\n2. Do Y\n...",
  todos: [{content: "Task 1", status: "pending"}, ...],
  activeTicketIds: [25, 26]  // ONLY "todo" tickets - auto-claimed to "in-progress"
})
```

- Create implementation plan (use EnterPlanMode if needed)
- Get user approval
- Save plan and todos to MCP session (NOT to files)

**Sprint 16 Auto-Claim**: When `activeTicketIds` are provided:
- System validates ALL tickets are in "todo" status
- System moves them to "in-progress" automatically
- Sets `assignee: "Claude Code"` and links `linkedSessionId`
- Session start FAILS if any ticket is not in "todo" status

**STEP 3: PROGRESS CHECKPOINTS**

At 15K, 30K, 45K, 60K, 75K, 90K tokens:

```
projectpulse_agent_session_update({
  sessionId: "...",
  todos: [{content: "Task 1", status: "completed"}, ...],
  progress: "Checkpoint: Completed X, now working on Y"
})
```

**For breaks (lunch, EOD):** Use `status: "PAUSED"` - can resume later with full context.

**STEP 4: COMPLETE SESSION**

When work is FULLY done:

```
projectpulse_agent_session_end({
  sessionId: "...",
  progress: "Session complete. Implemented X, Y, Z."
})
```

This auto-syncs:
- PROGRESS bank: Session summary added
- ACTIVE_CONTEXT bank: Updated with pending todos

**Sprint 16 Ticket Flow**: When session ends:
- All linked tickets (in "in-progress") → moved to "in-review"
- Tickets already in "done" are skipped
- User verifies work and moves "in-review" → "done" via Kanban

⚠️ **CRITICAL**: COMPLETED sessions CANNOT be resumed. Use PAUSED for breaks!

**Expert Consultation (When Needed):**

- Invoke `react-expert` for component architecture decisions
- Invoke `next-js-expert` for Server/Client component and data fetching decisions
- Invoke `prisma-expert` for database schema and query optimization

**When Experts Required:**
- New architectures (component hierarchies, state patterns)
- Complex features (multi-step workflows, performance-critical)
- Database changes (schema design, migration strategy)

**When Experts Optional:**
- Routine CRUD following established patterns
- UI updates matching existing conventions
- Minor refactors within established architecture

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

### Memory Bank System (via MCP)

**All 5 memory banks are loaded automatically via `projectpulse_context_load`.**

No need to read `.agent/` files directly - the MCP tool returns all banks in one call (~10K tokens).

**Memory Banks Returned by context_load:**

| Bank | Content |
|------|---------|
| **PROJECT_BRIEF** | What we're building, goals, success criteria |
| **SYSTEM_PATTERNS** | Architecture patterns, coding conventions |
| **TECH_CONTEXT** | Technical stack, dependencies, constraints |
| **ACTIVE_CONTEXT** | Current focus, recent changes |
| **PROGRESS** | What's done, milestones, velocity |

**How to Access:**

```
# Load all banks at session start
projectpulse_context_load(projectId: 6)
→ Returns: memoryBanks { projectBrief, systemPatterns, techContext, activeContext, progress }

# Load specific bank only (token-efficient)
projectpulse_context_lookup(projectId: 6, bankType: "SYSTEM_PATTERNS")
→ Returns: ~1K tokens of patterns

# Update a bank (user-explicit only)
projectpulse_context_update(projectId: 6, bankType: "PROGRESS", content: "...", mode: "append")
```

**Auto-Sync**: PROGRESS and ACTIVE_CONTEXT banks are auto-updated when you call `session_end`.

**Token Budgets:**
- PROJECT_BRIEF: 3K tokens
- SYSTEM_PATTERNS: 2K tokens
- TECH_CONTEXT: 2K tokens
- ACTIVE_CONTEXT: 1K tokens
- PROGRESS: 2K tokens

---

## 🔧 Dogfooding: We Use Our Own MCP Tools

**We're building ProjectPulse AND using it to build itself!**

### What We Use (Same as End Users)
- `projectpulse_context_load` - Load memory banks at session start
- `projectpulse_agent_session_*` - Track our work sessions
- `projectpulse_ticket_*` - Create and manage our tickets
- `projectpulse_knowledge_*` - Store and retrieve knowledge

### What `.agent/` Folder Is For (Sub-Agent Outputs Only)
- `.agent/sops/` - SOPs generated by `synthesize-docs` sub-agent
- `.agent/system/` - System docs generated by `map-system` sub-agent
- `CLAUDE.md` - This integration guide

**We no longer use:**
- ~~`.agent/task/current-session-*.md`~~ → Use MCP sessions
- ~~`.agent/progress.md`~~ → Use MCP context_load
- ~~`.agent/active-context.md`~~ → Use MCP context_load

**End users get the same clean, database-backed experience we now use ourselves!**

---

### Key Documentation

**Product Feature Docs** (for end users):

- [Database Schema](docs/features/database-schema.md) - Prisma models
- [API Reference](docs/features/api-reference.md) - All endpoints
- [MCP Tools Guide](docs/features/mcp-tools-guide.md) - MCP tool usage
- [Skills System Guide](docs/features/skills-system-guide.md) - Token-efficient skills
- [Workflow Templates](docs/features/workflow-templates.md) - Pre-built workflows

**Internal Dev References** (for agents building ProjectPulse):

- [Component Patterns](.agent/system/component-patterns.md) - React conventions

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

**file-editor**: Bulk file operations (3+ files) or Edit tool failures

- Efficient bulk file editing using sed/bash
- Saves 70-90K tokens in main thread
- Handles Edit tool failures reliably
- Creates automatic backups before modifications

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

## 🔄 Agent Session Workflow

**Project ID**: 6 (always use this for ProjectPulse itself)

### What Are Agent Sessions?

Sessions track Claude Code work periods that survive context compaction. The **plan** is the crown jewel - deep implementation thoughts that would otherwise be lost.

**Key Insight**: Session = Claude Code work period (not a ticket or task)

### Session Lifecycle

| Step | MCP Tool | When to Use |
|------|----------|-------------|
| 1. Entry Point | `projectpulse_context_load` | ALWAYS start here |
| 2. Resume Work | `projectpulse_agent_session_resume` | If PAUSED session exists |
| 3. Start New | `projectpulse_agent_session_start` | New task/feature |
| 4. Checkpoint | `projectpulse_agent_session_update` | Every 15K tokens |
| 5. Take Break | `session_update(status: PAUSED)` | Lunch, EOD, switching tasks |
| 6. Complete | `projectpulse_agent_session_end` | Work FULLY done |

### Pause vs End - Critical Distinction

| Use PAUSED for | Use END for |
|----------------|-------------|
| Lunch break | Feature fully complete |
| End of day | Milestone reached |
| Switching tasks temporarily | Ready for next feature |
| Context compaction imminent | All tickets closed |

⚠️ **CRITICAL**: COMPLETED sessions CANNOT be resumed. Use PAUSED for breaks!

### Multi-Instance Support

Each Claude Code instance gets its own session. When `context_load` returns multiple active sessions:
- Pick your session by ID
- Or create a new one for independent work
- Sessions don't conflict - each tracks its own plan/todos

### Auto-Sync on Session End

When you call `session_end`:
- **PROGRESS bank**: Session summary added automatically
- **ACTIVE_CONTEXT bank**: Updated with pending todos
- Response includes `syncStatus` - check for failures

If sync fails, use `projectpulse_context_update` manually.

### Example Workflow

```
# Session start
Me: projectpulse_context_load(projectId: 6)
→ Returns: memory banks + no active sessions

Me: projectpulse_agent_session_start({
  name: "Implementing API endpoint",
  plan: "## Plan\n1. Create route\n2. Add validation\n...",
  todos: [{content: "Create route", status: "pending"}, ...]
})
→ Returns: sessionId: "abc123..."

# ... work for 30 minutes ...

Me: projectpulse_agent_session_update({
  sessionId: "abc123...",
  todos: [{content: "Create route", status: "completed"}, ...],
  progress: "Completed route, now adding validation"
})

# ... lunch break ...

Me: projectpulse_agent_session_update({
  sessionId: "abc123...",
  status: "PAUSED",
  progress: "Pausing for lunch. Next: finish validation"
})

# ... return from lunch ...

Me: projectpulse_context_load(projectId: 6)
→ Returns: PAUSED session found!

Me: projectpulse_agent_session_resume({sessionId: "abc123..."})
→ Returns: full plan, todos, progress

# ... complete the work ...

Me: projectpulse_agent_session_end({
  sessionId: "abc123...",
  progress: "Session complete. API endpoint implemented and tested."
})
→ Auto-syncs to memory banks
```

---

## MCP Tools

**ProjectPulse MCP Server** (projectId: 6 for this project):

| Category | Tools |
|----------|-------|
| **Context** | `context_load`, `context_lookup`, `context_update` |
| **Sessions** | `agent_session_start`, `agent_session_update`, `agent_session_resume`, `agent_session_end` |
| **Tickets** | `ticket_create`, `ticket_search`, `ticket_update`, `ticket_setStatus`, `ticket_addComment`, `ticket_get` |
| **Knowledge** | `knowledge_create`, `knowledge_search`, `knowledge_get` |
| **Resources** | `persona_list`, `persona_get`, `skill_list`, `skill_get`, `sop_list`, `sop_get` |

**Other MCP Servers**:
- `sequential-thinking` - Complex multi-step reasoning

**Complete guide**: [docs/features/mcp-tools-guide.md](docs/features/mcp-tools-guide.md)

---

## 🗺️ Roadmap Workflow (Optional)

**Use roadmap for multi-week projects with defined phases. Skip for single fixes.**

### What Roadmap Is (vs Tickets vs Sessions)

| Layer | Purpose | Question Answered |
|-------|---------|-------------------|
| **Roadmap** | Phase → Sprint | "WHEN / sequence / progress" |
| **Tickets** | Features, Tasks, Bugs | "WHAT to build" |
| **Sessions** | Plan, todos, checkpoints | "WHAT happened this work session" |

### When to Use Roadmap

- ✅ **Use for**: Multi-week initiatives, greenfield projects, milestone reporting
- ❌ **Skip for**: Small fixes, routine maintenance (tickets-only is fine)

### Daily Workflow with Roadmap (Sprint 16)

```
# Morning: Know where you are
projectpulse_sprint_getCurrentPosition(projectId: 6)
→ Returns: phase/sprint with progress

# Find "todo" tickets ready to be claimed
projectpulse_ticket_search({ sprintNumber: 1, status: ["todo"] })

# Start session WITH tickets (auto-claims to in-progress)
projectpulse_agent_session_start({
  projectId: 6,
  name: "Sprint 1 work",
  activeTicketIds: [42, 43]  // Must be "todo" status
})
→ System: tickets move to in-progress, assignee="Claude Code"

# Work on tickets, checkpoint progress
projectpulse_agent_session_update({ progress: "Completed X, working on Y" })

# End session → tickets auto-move to in-review
projectpulse_agent_session_end({ sessionId: "..." })
→ System: tickets move to in-review

# User verifies and moves to done (auto-cascades progress)
projectpulse_kanban_moveTicket({
  ticketId: 42,
  status: "done",
  displayOrder: 0
})
→ Auto-propagates: Ticket → Sprint → Phase
```

### Ticket Scheduling with Kanban

Tickets are assigned to sprints and managed via Kanban boards:

```
projectpulse_ticket_create({
  title: "Implement feature X",
  kind: "feature",
  sprintNumber: 1,    // Sprint for Kanban board
  estimatedDays: 2    // Estimated duration
})

# View Kanban board at: /roadmap/sprint/1
# Move tickets between columns using kanban_moveTicket
```

### MCP Tools Reference

| Tool | When to Use |
|------|-------------|
| `roadmap_create` | Once per project, after onboarding |
| `getCurrentPosition` | Start of each work day |
| `getPhaseProgress` | See full phase tree |
| `kanban_moveTicket` | Move tickets across columns (auto-cascades progress) |
| `kanban_getBoard` | Get sprint's Kanban board with all tickets |

---

## 🎫 ProjectPulse Ticket Integration

**Project ID**: 6 (always use this for ProjectPulse itself)

When the user mentions work to be tracked, create a ticket via MCP:

| User Says | Ticket Kind |
|-----------|-------------|
| "Add feature X", "We need X" | `feature` |
| "Do X", "Set up X", "Implement X" | `task` |
| "X is broken", "X doesn't work" | `bug` |
| "X needs refactoring", "Clean up X" | `tech_debt` |
| "I'm concerned about X", "X seems off" | `issue` |

**Process**:
1. Create ticket using `projectpulse_ticket_create`
2. Set `kind` based on the table above
3. Set `priority` based on severity/urgency (low, medium, high, critical)
4. Set `source: "agent"` since I'm creating it
5. Include detailed `description`

**Example**:
```
User: "The search returns wrong results when using special characters"
Me: [Creates ticket via MCP: kind="bug", priority="medium",
     title="Search returns wrong results with special characters"]
```

### Agent Ticket Workflow (Sprint 16)

**Status Flow (Agent-Managed)**:
```
backlog ──[user drag]──► todo ──[session_start]──► in-progress ──[session_end]──► in-review ──[user drag]──► done
```

**What Happens Automatically**:
| Event | System Action |
|-------|---------------|
| `session_start({ activeTicketIds: [42] })` | Validates "todo" → moves to "in-progress", sets assignee="Claude Code", links sessionId |
| `session_end({ sessionId })` | Moves linked tickets to "in-review" (except already "done") |

**User-Only Moves** (via Kanban drag):
- ✅ `backlog → todo` - Preparing ticket for agent work
- ✅ `in-review → done` - Verifying completed work

**Blocked Moves** (require agent workflow):
- ❌ `todo → in-progress` - Use `session_start`
- ❌ `in-progress → in-review` - Use `session_end`
- ❌ `any → in-progress` - Only agent sessions can claim

**Complete Workflow (5 steps)**:
| Step | Action | How |
|------|--------|-----|
| 1 | Find work | `ticket_search({ status: ["todo"], sprintNumber: X })` |
| 2 | Start session | `agent_session_start({ activeTicketIds: [42] })` → **AUTO-CLAIMS** |
| 3 | Implement | Code, test, commit |
| 4 | Document | `ticket_addComment({ content: "Implemented X, Y" })` |
| 5 | End session | `agent_session_end()` → **AUTO-MOVES TO IN-REVIEW** |

**Then User**:
6. Verifies work in Kanban
7. Drags `in-review → done`

**Workflow Example**:
```
1. User: "Fix the search bug"
2. Me: [Create ticket: kind=bug, status=todo]
3. Me: [Search for todo tickets in sprint]
4. Me: [Start session: agent_session_start({ activeTicketIds: [42] })]
   → System: ticket moves to in-progress, assignee="Claude Code"
5. Me: [Implement fix, commit]
6. Me: [Add comment: "Fixed in commit abc123. Changed X, Y, Z."]
7. Me: [End session: agent_session_end()]
   → System: ticket moves to in-review
8. User: [Verifies fix, drags to done in Kanban]
```

**Note**: Valid status values are `backlog`, `todo`, `in-progress`, `in-review`, `done`

---

## 📚 ProjectPulse Knowledge Items

**Project ID**: 6 (always use this for ProjectPulse itself)

### When to Store Knowledge
- Important discoveries during development
- Decisions made that affect future work
- Solutions to recurring problems
- When user explicitly asks to remember something

**Store**: Use `projectpulse_knowledge_create` with title, content (markdown), category, tags

### When to Retrieve Knowledge
- Before starting unfamiliar tasks
- When confused about project context
- When user asks to check knowledge
- Before making significant decisions

**Search**: Use `projectpulse_knowledge_search` with query and `mode: "hybrid"`

**⚡ Proactive Retrieval**: When unsure about something, FIRST search knowledge items before asking user.

---

## Best Practices

### 1. Be Specific

```
❌ "Fix the bug"
✅ "Debug why POST /api/issues returns 400 for valid input"
```

### 2. Reference Documentation

```
✅ "Follow the API patterns in docs/features/api-reference.md"
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

**MCP-Based Workflow:**

1. **End session** - `projectpulse_agent_session_end()` auto-syncs memory banks
2. **Close tickets** - `projectpulse_ticket_setStatus(ticketId, "closed")`
3. **Commit and push** - Git operations as normal

**Optional (when new patterns introduced):**

4. **Generate SOP** - Invoke `synthesize-docs` sub-agent
5. **Update system docs** - Invoke `map-system` sub-agent

**Note**: You no longer need to manually update `.agent/progress.md` or `.agent/active-context.md`. The `session_end` tool auto-syncs these memory banks.

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
- [ ] Health OK: curl http://localhost:3000/api/health returns healthy
- [ ] Docker services running: docker compose -f docker-compose.cloud.yml ps
- [ ] On feature branch (not master)
- [ ] Called projectpulse_context_load(projectId: 6) to load memory banks
- [ ] Resumed PAUSED session OR started new session
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
→ Use Gemini CLI (see [GEMINI.md](GEMINI.md))

**Found a bug or issue?**
→ Create ticket via `projectpulse_ticket_create` (projectId: 6)

**Need to remember something important?**
→ Store via `projectpulse_knowledge_create` (projectId: 6)

**Confused about project context?**
→ Search via `projectpulse_knowledge_search` (projectId: 6)

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
2. [.agent/progress.md](.agent/progress.md) - Current state
3. [docs/13-Project-Plan.md](docs/13-Project-Plan.md) - Implementation roadmap
4. [docs/README.md](docs/README.md) - Complete documentation index

**Protocol Enforcement**:

- [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md) - **READ PROTOCOL VIOLATIONS LOG**

**Procedures**:

- [.agent/sops/](.agent/sops/) - All SOPs
- [.claude/CRITICAL_MISTAKES.md](.claude/CRITICAL_MISTAKES.md) - Common errors

**System Docs**:

- [.agent/system/](.agent/system/) - Technical references

---
