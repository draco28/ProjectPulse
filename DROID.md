# Factory Droid Integration Guide - ProjectPulse

**Version:** 2.0 (MCP-Based)
**Project:** ProjectPulse
**Stack:** Next.js 14 + PostgreSQL 16 + Prisma + MCP
**Agent System:** Factory Droid with custom droid specialists
**Last Updated:** 2025-12-23

**Foundation Documents:**
- **CLAUDE.md** - Primary workflow reference (MCP-based)
- **AGENTS.md** - Core principles and quality standards
- **This file (DROID.md)** - Adapted for Factory Droid capabilities

---

## Quick Start

Just chat naturally with me (Factory Droid):

```
"Implement POST /api/issues endpoint"
"Write tests for the search API"
"Debug the authentication flow"
"Design the database schema for issue filtering"
```

I'll automatically invoke specialized droids as needed and manage the full workflow.

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

**If PAUSED session found:** Resume with `projectpulse_agent_session_update(sessionId, status: "IN_PROGRESS")`
**If no session:** Start new with `projectpulse_agent_session_start()`

**See**: [.agent/sops/git-workflow.md](.agent/sops/git-workflow.md)

---

## 🎯 Core Principles (Non-Negotiable)

These principles from AGENTS.md apply to **all** Factory Droid work:

1. **Documentation Authority**: All implementations must align with docs/ architecture **[R-DOC-001]**
2. **Data-Driven Development**: No hardcoded values; use database tables or configuration **[R-DATA-001]**
3. **Type Safety**: Strict TypeScript, no `any` types **[R-TS-001]**
4. **Server Components First**: Use React Server Components by default **[R-NEXT-001]**
5. **Prisma Parameterized**: No raw SQL string interpolation (SQL injection prevention) **[R-SEC-001]**
6. **Testing Required**: All features must have tests (80%+ coverage) **[R-TEST-001]**
7. **MCP Pattern**: MCP server calls Next.js API (not direct database) **[R-MCP-001]**
8. **Local-First**: All data stored locally, no cloud dependencies **[R-PRIVACY-001]**

---

## 🖥️ Mac Mini Cloud Architecture

**All development happens on Mac mini using Docker. Use `localhost` for all services.**

### Service URLs (Development)

- **Web App**: http://localhost:3000
- **MCP Server**: http://localhost:3001
- **API Health**: http://localhost:3000/api/health
- **Database**: `postgresql://postgres:postgres123@localhost:5432/projectpulse_dev`
- **Redis**: `localhost:6379`

### Compose Files

- **Mac mini runtime**: `docker-compose.cloud.yml` (primary)
- **CI/local fallback**: `docker-compose.yml` (automated testing only)

### Workflow

**All work happens on Mac mini:**
- Code editing (Read, Edit, Create tools)
- Git operations (commits, pushes, branches)
- Testing (unit, integration, E2E)
- Docker management (restart, logs, migrations)

**Complete Setup**: [.agent/sops/mac-mini-cloud-architecture.md](.agent/sops/mac-mini-cloud-architecture.md)

---

## 🤖 Factory Droid Capabilities

### What I Can Do

**Core Tools:**
- ✅ **Read** - View any file in the codebase
- ✅ **Edit** - Modify existing files with precision
- ✅ **Create** - Generate new files
- ✅ **Execute** - Run commands (pnpm, docker, git, etc.)
- ✅ **Grep** - High-performance content search (ripgrep)
- ✅ **Glob** - Fast file pattern matching
- ✅ **LS** - Directory exploration
- ✅ **TodoWrite** - Real-time task tracking (visible to you)
- ✅ **ExitSpecMode** - Present plans for approval before implementation

**MCP Tools (ProjectPulse):**
- ✅ **Context Tools** - `context_load`, `context_lookup`, `context_update`
- ✅ **Session Tools** - `agent_session_start`, `agent_session_update`, `agent_session_end`
- ✅ **Ticket Tools** - `ticket_create`, `ticket_search`, `ticket_update`, `ticket_setStatus`, `ticket_addComment`, `ticket_get`
- ✅ **Knowledge Tools** - `knowledge_create`, `knowledge_search`, `knowledge_get`
- ✅ **Resource Tools** - `persona_list`, `persona_get`, `skill_list`, `skill_get`, `sop_list`, `sop_get`

**Droid Invocation:**
- ✅ Invoke 14 custom specialist droids
- ✅ Parallel droid coordination
- ✅ Context passing between droids
- ✅ Report reading and application

### What I Cannot Do

**Limitations:**
- ❌ Python orchestrator system (`.claude/devhub_orchestrator.py`)
- ❌ Slash commands (`/update-doc`) - use explicit requests instead
- ❌ ExitPlanMode tool (use **ExitSpecMode** instead)

**Workarounds:**
- Instead of orchestrator → Direct droid invocation in natural language
- Instead of /update-doc → Explicit requests to update documentation

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

**We no longer use:**
- ~~`.agent/task/current-session-*.md`~~ → Use MCP sessions
- ~~`.agent/progress.md`~~ → Use MCP context_load
- ~~`.agent/active-context.md`~~ → Use MCP context_load

**End users get the same clean, database-backed experience we now use ourselves!**

---

## 🔄 MCP-Based Session Workflow

**Project ID**: 6 (always use this for ProjectPulse itself)

### What Are Agent Sessions?

Sessions track work periods that survive context compaction. The **plan** is the crown jewel - deep implementation thoughts that would otherwise be lost.

### Session Lifecycle

| Step | MCP Tool | When to Use |
|------|----------|-------------|
| 1. Entry Point | `projectpulse_context_load` | ALWAYS start here |
| 2. Resume Work | `projectpulse_agent_session_update` | If PAUSED session exists |
| 3. Start New | `projectpulse_agent_session_start` | New task/feature |
| 4. Checkpoint | `projectpulse_agent_session_update` | Every 15K tokens |
| 5. Take Break | `session_update(status: PAUSED)` | Lunch, EOD, switching tasks |
| 6. Complete | `projectpulse_agent_session_end` | Work FULLY done |

### STEP 1: LOAD CONTEXT

```
projectpulse_context_load(projectId: 6)
```

This returns:
- All 5 memory banks (project brief, patterns, tech context, active focus, progress)
- Active sessions (check if work in progress)
- Available resources (personas, skills, SOPs)
- Workflow hints

**If PAUSED session exists:** → Resume it
**If no active session:** → Continue to Step 2

### STEP 2: START SESSION

```
projectpulse_agent_session_start({
  projectId: 6,
  name: "Implementing feature X",
  plan: "## Plan\n1. Do X\n2. Do Y\n...",
  todos: [{content: "Task 1", status: "pending"}, ...],
  activeTicketIds: [25, 26]  // Link to tickets
})
```

- Create implementation plan (use ExitSpecMode for user approval if complex)
- Save plan and todos to MCP session (NOT to files)

### STEP 3: PROGRESS CHECKPOINTS

At 15K, 30K, 45K, 60K, 75K, 90K tokens:

```
projectpulse_agent_session_update({
  sessionId: "...",
  todos: [{content: "Task 1", status: "completed"}, ...],
  progress: "Checkpoint: Completed X, now working on Y"
})
```

**For breaks (lunch, EOD):** Use `status: "PAUSED"` - can resume later with full context.

### STEP 4: COMPLETE SESSION

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

### Pause vs End - Critical Distinction

| Use PAUSED for | Use END for |
|----------------|-------------|
| Lunch break | Feature fully complete |
| End of day | Milestone reached |
| Switching tasks temporarily | Ready for next feature |
| Context compaction imminent | All tickets closed |

⚠️ **CRITICAL**: COMPLETED sessions CANNOT be resumed. Use PAUSED for breaks!

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

Me: projectpulse_agent_session_update({sessionId: "abc123...", status: "IN_PROGRESS"})
→ Returns: full plan, todos, progress

# ... complete the work ...

Me: projectpulse_agent_session_end({
  sessionId: "abc123...",
  progress: "Session complete. API endpoint implemented and tested."
})
→ Auto-syncs to memory banks
```

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

### Agent Ticket Workflow

**Assignee**: Always set `assignee: "Factory Droid"` when:
- I create a ticket that I will immediately work on
- I'm claiming an existing ticket to work on

**Status Transitions** (REQUIRED):
| When | Action |
|------|--------|
| Create ticket | Status defaults to `open` |
| Start working | Update to `in-progress` BEFORE coding |
| Implement | Add comment with implementation details |
| Test | Verify fix works (manual or automated) |
| Close | Update to `closed` ONLY after testing passes |

**Complete Workflow** (6 steps):
| Step | Action | MCP Tool |
|------|--------|----------|
| 1. Create | Create ticket with assignee | `ticket_create` |
| 2. Plan | Add implementation plan to customFields | `ticket_update` |
| 3. Claim | Set status to `in-progress` | `ticket_update` |
| 4. Work | Implement and commit | (code tools) |
| 5. Comment | Add implementation details | `ticket_addComment` |
| 6. Test+Close | After testing passes, set `closed` | `ticket_setStatus` |

**Note**: Valid status values are `open`, `in-progress`, `closed` (NOT `completed`!)

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

**Proactive Retrieval**: When unsure about something, FIRST search knowledge items before asking user.

---

## 🤝 Custom Droid System

You have **14 specialized droids** available. I'll invoke them automatically based on task requirements.

### Research Phase Droids

**@explore-codebase** - Codebase scanning and pattern discovery
- **When invoked:** "Find all X", "Scan repo for Y", "List all components"
- **Output:** Summary report of findings
- **Token savings:** 20-30K (vs reading all files manually)

**@analyze-architecture** - System flow tracing and architectural analysis
- **When invoked:** "How does X work?", "Trace data flow", "Understand authentication"
- **Output:** Architectural insights and flow diagrams
- **Token savings:** 20-30K

### Design Phase Droids

**@devhub-architect** - Architecture and design decisions
- **When invoked:** "How should I structure X?", "Design the database schema", "Plan the component hierarchy"
- **Output:** Architectural design with rationale
- **Use for:** Major design decisions, system architecture

**@react-expert** - React 18+ patterns and optimization
- **When invoked:** Component architecture, custom hooks, performance optimization
- **Output:** Component designs, hook implementations, optimization strategies
- **Use for:** Complex UI patterns, state management, React-specific decisions

**@next-js-expert** - Next.js 14 App Router specialist
- **When invoked:** Page/route structure, Server vs Client Components, data fetching, caching
- **Output:** Next.js implementation plans with best practices
- **Use for:** Routing decisions, SSR/CSR choices, Next.js-specific features

**@prisma-expert** - Database design and Prisma ORM specialist
- **When invoked:** Schema design, migration strategy, query optimization, relations
- **Output:** Prisma schema designs, migration plans, optimized queries
- **Use for:** Database changes, performance tuning, complex queries

### Implementation Phase Droids

**@devhub-fullstack** - Full-stack implementation specialist
- **When invoked:** "Implement X feature", "Build Y component", "Create Z endpoint"
- **Output:** Complete implementation with tests
- **Use for:** Standard feature development following established patterns

**@file-editor** - Bulk file operations and edit tool fallback
- **When invoked:** 3+ file changes, Edit tool failures, large refactors
- **Output:** Automated file modifications with backups
- **Token savings:** 70-90K (vs multiple Edit calls)
- **Use for:** Bulk operations, systematic changes across many files

### Testing Phase Droids

**@devhub-testing** - Test strategy and implementation
- **When invoked:** "Write tests for X", "Create E2E test", "Add regression test"
- **Output:** Test implementation with coverage strategy
- **Use for:** All testing work (unit, integration, E2E)

### Review Phase Droids

**@devhub-auditor** - Code review and quality checks
- **When invoked:** After implementation, before commit
- **Output:** Security audit, accessibility check, performance review
- **Use for:** Final validation before marking work complete

### Documentation Phase Droids

**@synthesize-docs** - Generate SOPs and documentation
- **When invoked:** After feature completion (if new patterns created)
- **Output:** SOPs saved to `.agent/sops/`
- **Use for:** Documenting new patterns for future reference

**@map-system** - Update system documentation
- **When invoked:** After architecture changes
- **Output:** Updated `.agent/system/` docs (API catalog, DB schema, component patterns)
- **Use for:** Keeping system docs in sync with code

### Specialized Droids

**@devhub-mcp-specialist** - MCP integration specialist
- **When invoked:** MCP tool design, MCP resource creation, MCP prompt templates
- **Output:** Complete MCP implementation plans
- **Use for:** All MCP-related work

**@protocol-updater** - Protocol and workflow maintenance
- **When invoked:** Updating workflow documentation, protocol fixes
- **Output:** Updated protocol files
- **Use for:** Maintaining .agent/ workflow files

### Invocation Pattern

```
User: "Implement issue filtering by priority"

Me: [Loading context via MCP...]
    [Invoking @devhub-architect for design...]
    [Architect creates design report]
    
    [Invoking @prisma-expert for query patterns...]
    [Prisma expert creates query strategy]
    
    [Invoking @devhub-fullstack for implementation...]
    [Fullstack implements following designs]
    
    [Invoking @devhub-testing for tests...]
    [Testing creates test suite]
    
    [Invoking @devhub-auditor for review...]
    [Auditor validates implementation]
    
    Done! ✅
```

**You don't need to request droids explicitly** - I route automatically based on task type.

---

## Memory Bank System (via MCP)

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

## MCP Tools Reference

**ProjectPulse MCP Server** (projectId: 6 for this project):

| Category | Tools |
|----------|-------|
| **Context** | `context_load`, `context_lookup`, `context_update` |
| **Sessions** | `agent_session_start`, `agent_session_update`, `agent_session_end` |
| **Tickets** | `ticket_create`, `ticket_search`, `ticket_update`, `ticket_setStatus`, `ticket_addComment`, `ticket_get` |
| **Knowledge** | `knowledge_create`, `knowledge_search`, `knowledge_get` |
| **Resources** | `persona_list`, `persona_get`, `skill_list`, `skill_get`, `sop_list`, `sop_get` |

**Complete guide**: [docs/features/mcp-tools-guide.md](docs/features/mcp-tools-guide.md)

---

## Skills and Context Loading

Based on phase keywords, I load relevant skills:

| Phase Contains | Skills to Load |
|----------------|----------------|
| "API", "endpoint", "route" | [api-patterns](.claude/skills/projectpulse/api-patterns.md) |
| "Component", "UI", "page" | [component-patterns](.claude/skills/projectpulse/component-patterns.md) |
| "Database", "Prisma", "query" | [database-patterns](.claude/skills/projectpulse/database-patterns.md) |
| "Test", "testing", "coverage" | [testing-patterns](.claude/skills/projectpulse/testing-patterns.md) |

---

## 🔧 Technical Standards

### TypeScript Patterns

```typescript
// ✅ Good: Strict typing
interface Issue {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'closed';
  createdAt: Date;
}

// ❌ Bad: Any types
const issue: any = { ... };

// ✅ Good: Type guards
function isValidPriority(value: string): value is Issue['priority'] {
  return ['low', 'medium', 'high', 'critical'].includes(value);
}
```

### API Route Patterns

```typescript
// ✅ Good: Complete validation + error handling
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = issueSchema.parse(body);
    
    const issue = await prisma.issue.create({
      data: validated,
    });
    
    return Response.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Issue creation failed:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Prisma Security Patterns

```typescript
// ✅ Good: Parameterized query (SQL injection safe)
await prisma.$queryRaw`
  SELECT * FROM issues 
  WHERE title ILIKE ${`%${userInput}%`}
  AND status = ${status}
`;

// ❌ Bad: SQL injection vulnerability
await prisma.$queryRawUnsafe(`
  SELECT * FROM issues 
  WHERE title ILIKE '%${userInput}%'
`);

// ✅ Good: Using Prisma query builder (safest)
await prisma.issue.findMany({
  where: {
    title: {
      contains: userInput,
      mode: 'insensitive',
    },
    status,
  },
});
```

### React Server Component Patterns

```typescript
// ✅ Good: Server Component (default)
// app/issues/page.tsx
import { prisma } from '@/lib/prisma';

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  return <IssueList issues={issues} />;
}

// ✅ Good: Client Component (when needed)
// components/IssueFilter.tsx
'use client';

import { useState } from 'react';

export function IssueFilter({ onFilterChange }) {
  const [priority, setPriority] = useState<string>('all');
  
  return (
    <select
      value={priority}
      onChange={(e) => {
        setPriority(e.target.value);
        onFilterChange(e.target.value);
      }}
    >
      <option value="all">All Priorities</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );
}
```

---

## ✅ Quality Gates

All work must pass these gates before completion:

### Build Gate

```bash
pnpm lint        # ✅ Must pass
pnpm type-check  # ✅ Must pass
pnpm build       # ✅ Must succeed
```

### Test Gate

```bash
pnpm test        # ✅ Must pass
pnpm test:coverage  # ✅ 80%+ coverage for new code
```

### Security Gate

- ✅ No SQL injection vulnerabilities (parameterized queries only)
- ✅ Input validated with Zod schemas
- ✅ No XSS vulnerabilities
- ✅ No exposed secrets in code or logs
- ✅ Authentication/authorization checked where applicable

### Architecture Gate

- ✅ Follows patterns in `docs/03-Architecture.md`
- ✅ Data-driven (no hardcoded values)
- ✅ Proper module placement (components/, lib/, app/)
- ✅ Type-safe implementation (no `any` types)
- ✅ Server Components by default, Client Components when needed

---

## 🎯 Best Practices

### Do:

✅ **Use Server Components by default**
✅ **Validate all input with Zod**
✅ **Write tests before marking complete**
✅ **Use Prisma for all database access**
✅ **Follow patterns in docs/**
✅ **Keep commits small and focused**
✅ **Use droids for structured workflows**

### Don't:

❌ **Use `any` types**
❌ **Hardcode values**
❌ **Skip testing**
❌ **Write raw SQL strings**
❌ **Commit without running checks**
❌ **Bypass security validation**
❌ **Ignore accessibility**

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

## 📖 Quick Reference

### Daily Checklist

```markdown
Before starting work:
- [ ] Health OK: curl http://localhost:3000/api/health returns healthy
- [ ] Docker services running: docker compose -f docker-compose.cloud.yml ps
- [ ] On feature branch (not master)
- [ ] Called projectpulse_context_load(projectId: 6) to load memory banks
- [ ] Resumed PAUSED session OR started new session
```

### Common Tasks → Droid Routing

| Task | Droids Invoked |
|---|---|
| **"Design the X feature"** | @devhub-architect |
| **"Implement X endpoint"** | @prisma-expert → @devhub-fullstack → @devhub-testing |
| **"Create X component"** | @react-expert → @devhub-fullstack → @devhub-testing |
| **"Add X to database"** | @prisma-expert → @devhub-fullstack → @map-system |
| **"How does X work?"** | @analyze-architecture |
| **"Find all Y in codebase"** | @explore-codebase |
| **"Write tests for X"** | @devhub-testing |
| **"Review this code"** | @devhub-auditor |
| **"Fix this bug"** | @analyze-architecture → direct fix → @devhub-testing |
| **"Create MCP tool"** | @devhub-mcp-specialist → @devhub-fullstack |
| **"Update documentation"** | @synthesize-docs + @map-system |
| **"Bulk file changes"** | @file-editor |

### Common Commands

```bash
# Health check
curl http://localhost:3000/api/health

# Docker services
docker compose -f docker-compose.cloud.yml ps
docker compose -f docker-compose.cloud.yml up -d
docker compose -f docker-compose.cloud.yml logs -f web

# Quality gates
pnpm lint
pnpm type-check
pnpm test
pnpm build

# Git workflow
git checkout -b feature/your-feature
git add .
git commit -m "feat: your feature"
git push -u origin feature/your-feature

# Database
pnpm prisma studio              # GUI
pnpm prisma migrate dev         # Create migration
pnpm prisma generate            # Generate client
```

---

## Key Documentation

**Product Feature Docs** (for end users):
- [Database Schema](docs/features/database-schema.md) - Prisma models
- [API Reference](docs/features/api-reference.md) - All endpoints
- [MCP Tools Guide](docs/features/mcp-tools-guide.md) - MCP tool usage

**Internal Dev References** (for agents building ProjectPulse):
- [Component Patterns](.agent/system/component-patterns.md) - React conventions

**Procedures (SOPs)**:
- [Port Troubleshooting](.agent/sops/port-troubleshooting.md) - Fix port issues
- [Git Workflow](.agent/sops/git-workflow.md) - Branch management

---

## 🎓 Getting Help

### Documentation Hierarchy

1. **CLAUDE.md** - Primary workflow reference (MCP-based)
2. **This file (DROID.md)** - Factory Droid-specific features
3. **AGENTS.md** - Core principles and quality standards
4. **docs/README.md** - Complete documentation index
5. **docs/13-Project-Plan.md** - Implementation roadmap
6. **.agent/README.md** - Agent context documentation

### When Something Goes Wrong

**Issue:** "Context lost after long session"
→ Call `projectpulse_context_load(projectId: 6)`
→ Check for PAUSED sessions to resume

**Issue:** "Quality gates failing"
→ Check specific gate output (lint, type-check, test, build)
→ Invoke `@devhub-auditor` for comprehensive review

**Issue:** "Services down"
→ Check pre-work checklist (curl health endpoint)
→ Start services: `docker compose -f docker-compose.cloud.yml up -d`

**Issue:** "Don't know which droid to use"
→ Describe task in natural language, I'll route automatically
→ Check "Common Tasks → Droid Routing" table above

---

## ✅ Success Criteria

Development is successful when:

**Code Quality:**
- [ ] All Golden Rules followed
- [ ] All quality gates pass (lint, type-check, test, build)
- [ ] 80%+ test coverage for new code
- [ ] No TypeScript `any` types
- [ ] All input validated with Zod schemas

**Security:**
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No exposed secrets
- [ ] Authentication/authorization checked

**Architecture:**
- [ ] Follows patterns in docs/03-Architecture.md
- [ ] Data-driven (no hardcoded values)
- [ ] Server Components by default

**Testing:**
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] All edge cases covered

**Documentation:**
- [ ] MCP session ended (auto-syncs memory banks)
- [ ] Tickets closed via MCP
- [ ] New patterns documented (if applicable)

**Git:**
- [ ] Small, focused commits
- [ ] Descriptive commit messages
- [ ] Documentation committed first

---

**Remember:** I'm here to help you build high-quality software efficiently. I'll automatically invoke specialist droids when needed, manage the full MCP workflow, and ensure all quality standards are met.

**Just describe what you want to build - I'll handle the rest!**
