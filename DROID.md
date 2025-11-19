# Factory Droid Integration Guide - ProjectPulse

**Version:** 1.0  
**Project:** ProjectPulse  
**Stack:** Next.js 14 + PostgreSQL 16 + Prisma + MCP  
**Agent System:** Factory Droid with custom droid specialists

**Foundation Documents:**
- **CLAUDE.md** - Original Claude Code integration guide (reference for workflows)
- **AGENTS.md** - Original agent system architecture (reference for principles)
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

**Droid Invocation:**
- ✅ Invoke 14 custom specialist droids
- ✅ Parallel droid coordination
- ✅ Context passing between droids
- ✅ Report reading and application

### What I Cannot Do

**Limitations:**
- ❌ Python orchestrator system (`.claude/devhub_orchestrator.py`)
- ❌ Memory MCP integration (long-term knowledge retention)
- ❌ Slash commands (`/update-doc`)
- ❌ ExitPlanMode tool (use **ExitSpecMode** instead)
- ❌ Automatic context compaction (manual save required)

**Workarounds:**
- Instead of Memory MCP → Use `.agent/progress.md` and session files
- Instead of orchestrator → Direct droid invocation in natural language
- Instead of /update-doc → Explicit requests to update documentation

---

## 🤝 Custom Droid System

You have **14 specialized droids** available (replicated from `.claude/agents/`). I'll invoke them automatically based on task requirements.

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

Me: [Reading context and planning...]
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

## 📋 Adapted Session Protocol

This workflow adapts CLAUDE.md's Mandatory Session Protocol for Factory Droid capabilities.

### Phase 1: Initialize

**Required Steps:**
1. Read `.agent/active-context.md` and `.agent/progress.md`
2. Read `docs/13-Project-Plan.md` for current phase
3. Create `.agent/task/current-session-[YYYYMMDD-HHMM].md`
4. Create TodoWrite list (parallel with research)

**Confirmation:** "✅ Session initialized - Reading context..."

### Phase 2: Research & Plan

**Required Steps:**
1. Invoke research droids as needed:
   - `@explore-codebase` - Find existing patterns
   - `@analyze-architecture` - Understand current system
2. Create implementation plan
3. Use **ExitSpecMode** for user approval (not ExitPlanMode)
4. **After approval:** Save plan to `.agent/task/current-plan.md`
5. Save todos to `.agent/task/current-todos.md`

**Confirmation:** "✅ Plan approved and saved - Proceeding to expert consultation..."

### Phase 3: Expert Consultation

**Required Steps - Invoke expert droids based on phase type:**

| Phase Contains | Droids to Invoke |
|---|---|
| "Architecture", "Design" | @devhub-architect |
| "Component", "UI", "React" | @react-expert |
| "Page", "Route", "Server Component" | @next-js-expert |
| "Database", "Schema", "Prisma" | @prisma-expert |
| "MCP", "Tool", "Resource" | @devhub-mcp-specialist |

**Process:**
1. Invoke appropriate expert droids
2. Wait for droid reports
3. Read reports (saved to `.agent/task/[droid]-[topic]-[timestamp].md`)
4. Apply recommendations in implementation
5. Update session file with "Consulted X droid for Y"

**Confirmation:** "✅ Expert consultation complete - Proceeding to implementation..."

### Phase 4: Implementation

**Required Steps:**
1. Follow approved plan
2. Invoke implementation droids as needed:
   - `@devhub-fullstack` for standard features
   - `@file-editor` for bulk operations (3+ files)
3. Update session file at **15K token checkpoints**
4. Update TodoWrite progress after each major step

**Checkpoint Intervals:**
- 15K tokens
- 30K tokens
- 45K tokens
- 60K tokens
- 75K tokens
- 90K tokens

**Checkpoint Format:**
```
💾 CHECKPOINT at [X]K tokens:
- Completed: [list]
- In progress: [current task]
- Remaining: [list]
```

**Confirmation:** "✅ Implementation complete - Proceeding to testing..."

### Phase 5: Testing

**Required Steps:**
1. Invoke `@devhub-testing` for test strategy
2. Run quality gates:
   ```bash
   pnpm lint        # Must pass
   pnpm type-check  # Must pass
   pnpm test        # Must pass (80%+ coverage)
   pnpm build       # Must succeed
   ```
3. Fix any failures
4. Update session file with test results

**Confirmation:** "✅ All tests passing - Proceeding to review..."

### Phase 6: Review

**Required Steps:**
1. Invoke `@devhub-auditor` for code review
2. Review checks:
   - Security vulnerabilities (SQL injection, XSS)
   - Accessibility (WCAG 2.1 AA)
   - Performance issues
   - Type safety violations
3. Address any issues found
4. Update session file with review results

**Confirmation:** "✅ Code review complete - Proceeding to documentation..."

### Phase 7: Documentation

**Required Steps:**
1. **If new patterns created:** Invoke `@synthesize-docs`
2. **If architecture changed:** Invoke `@map-system`
3. Update core context files:
   - `.agent/active-context.md`
   - `.agent/progress.md`
   - `docs/13-Project-Plan.md`
4. Commit workflow:
   ```bash
   git add .agent/ docs/
   git commit -m "docs: [description]"
   
   git add [implementation files]
   git commit -m "feat|fix: [description]"
   ```

**Confirmation:** "✅ Documentation updated and committed - Phase complete!"

### Recovery Workflow

**If session interrupted or context lost:**

```bash
Step 1: Read .agent/active-context.md
→ "Current: Phase 3.1, implementing issue API"

Step 2: Read .agent/progress.md
→ "60% complete, last checkpoint: CommentForm component"

Step 3: Find latest .agent/task/current-session-[timestamp].md
→ "Was implementing CommentList at 16:45"

Step 4: Read .agent/task/current-todos.md
→ "5/20 tasks done, CommentList in progress"

Step 5: Resume work
→ "Continuing from CommentList implementation..."
```

---

## 🖥️ Mac Mini Cloud Architecture

**All development happens on Mac mini (192.168.1.15) using Docker.**

### Service URLs

- **Web App:** http://192.168.1.15:3000
- **API Health:** http://192.168.1.15:3000/api/health
- **Database:** `postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev`

### Compose Files

- **Mac mini runtime:** `docker-compose.cloud.yml` (primary)
- **CI/local fallback:** `docker-compose.yml` (automated testing only)

### Pre-Work Checklist

**BEFORE starting ANY coding work:**

#### 1. Mac Mini Services Verification

```bash
# Check Mac mini services are running
curl http://192.168.1.15:3000/api/health
# ✅ MUST return: {"status":"healthy","database":"connected"}
```

**If services down:**
- Ask user to start Mac mini Docker services
- Or use Git communication to tell Mac mini: "Start Docker services"

#### 2. Docker Services Check

```bash
# On Mac mini, check containers
docker compose -f docker-compose.cloud.yml ps
```

**If services down or unhealthy:**
```bash
docker compose -f docker-compose.cloud.yml up -d
```

#### 3. Git Branch Check

```bash
git branch
# ✅ MUST be on feature branch (NOT master!)
```

**If on master:**
```bash
git checkout master && git pull origin master
git checkout -b feature/your-feature
```

### Workflow

**All work happens on Mac mini:**
- Code editing (Read, Edit, Create tools)
- Git operations (commits, pushes, branches)
- Testing (unit, integration, E2E)
- Docker management (restart, logs, migrations)

**Complete Setup:** `.agent/sops/mac-mini-cloud-architecture.md`

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

// ❌ Bad: Type assertions without validation
const priority = userInput as Issue['priority'];
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

// ❌ Bad: No validation, poor error handling
export async function POST(request: Request) {
  const body = await request.json();
  const issue = await prisma.issue.create({ data: body });
  return Response.json(issue);
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

// ❌ Bad: Using 'use client' unnecessarily
'use client';

export default async function IssuesPage() {
  // This should be a Server Component!
  const issues = await prisma.issue.findMany();
  return <IssueList issues={issues} />;
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

**Requirements:**
- No ESLint errors
- No TypeScript errors
- Build completes successfully
- No console errors in build output

### Test Gate

```bash
pnpm test        # ✅ Must pass
pnpm test:coverage  # ✅ 80%+ coverage for new code
```

**Requirements:**
- All tests pass
- 80%+ line coverage for new features
- All edge cases tested
- No skipped tests without justification

### Security Gate

**Requirements:**
- ✅ No SQL injection vulnerabilities (parameterized queries only)
- ✅ Input validated with Zod schemas
- ✅ No XSS vulnerabilities (React escapes by default, verify)
- ✅ No exposed secrets in code or logs
- ✅ Authentication/authorization checked where applicable

**Checklist:**
```typescript
// For every API endpoint:
1. [ ] Input validated with Zod schema
2. [ ] Database queries use parameterized syntax
3. [ ] Error messages don't expose sensitive info
4. [ ] Authentication checked (if protected route)
5. [ ] Authorization verified (user can access resource)
```

### Architecture Gate

**Requirements:**
- ✅ Follows patterns in `docs/03-Architecture.md`
- ✅ Data-driven (no hardcoded values)
- ✅ Proper module placement (components/, lib/, app/)
- ✅ Type-safe implementation (no `any` types)
- ✅ Server Components by default, Client Components when needed

**Checklist:**
```typescript
// For every feature:
1. [ ] Matches architectural patterns in docs/
2. [ ] Configuration in database or config files (not hardcoded)
3. [ ] Files in correct directories per project structure
4. [ ] All types defined (interfaces/types exported)
5. [ ] Uses Server Components unless interactivity required
```

---

## 🎯 Best Practices

### Do:

✅ **Use Server Components by default**
```typescript
// Default: Server Component
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

✅ **Validate all input with Zod**
```typescript
const schema = z.object({
  title: z.string().min(1).max(200),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});
const validated = schema.parse(input);
```

✅ **Write tests before marking complete**
```typescript
describe('POST /api/issues', () => {
  it('creates issue with valid input', async () => {
    const response = await fetch('/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', priority: 'high' }),
    });
    expect(response.status).toBe(201);
  });
});
```

✅ **Use Prisma for all database access**
```typescript
const issues = await prisma.issue.findMany({
  where: { status: 'open' },
  orderBy: { createdAt: 'desc' },
});
```

✅ **Follow patterns in docs/**
```typescript
// Check docs/03-Architecture.md before implementing
// Use established patterns from .agent/system-patterns.md
```

✅ **Keep commits small and focused**
```bash
git commit -m "feat: add issue priority filtering"
git commit -m "test: add tests for issue filtering"
git commit -m "docs: update API documentation"
```

✅ **Use droids for structured workflows**
```
Complex feature → @devhub-architect for design
Database change → @prisma-expert for schema
Bulk edits → @file-editor for efficiency
```

### Don't:

❌ **Use `any` types**
```typescript
// Bad
const data: any = fetchData();

// Good
interface Data { id: number; title: string; }
const data: Data = fetchData();
```

❌ **Hardcode values**
```typescript
// Bad
const priorities = ['low', 'medium', 'high'];

// Good
const priorities = await prisma.priority.findMany();
```

❌ **Skip testing**
```typescript
// Always add tests for new features
// Invoke @devhub-testing if unsure about test strategy
```

❌ **Write raw SQL strings**
```typescript
// Bad - SQL injection risk
await prisma.$queryRawUnsafe(`SELECT * FROM issues WHERE id = ${id}`);

// Good - Parameterized
await prisma.$queryRaw`SELECT * FROM issues WHERE id = ${id}`;

// Best - Query builder
await prisma.issue.findUnique({ where: { id } });
```

❌ **Commit without running checks**
```bash
# Always run before commit:
pnpm lint
pnpm type-check
pnpm test
```

❌ **Bypass security validation**
```typescript
// Always validate input
// Always use parameterized queries
// Always check authentication/authorization
```

❌ **Ignore accessibility**
```typescript
// Use semantic HTML
// Add ARIA labels where needed
// Test keyboard navigation
// Invoke @devhub-auditor for accessibility review
```

---

## 🚀 Droid Invocation Examples

### Feature Development Flow

```
User: "Implement issue filtering by priority and module"

Droid: ✅ Session initialized - Reading context...
       [Reading .agent/active-context.md, docs/13-Project-Plan.md]

Droid: 🔍 Invoking @devhub-architect for filtering design...
       [Architect analyzes requirements and designs filter architecture]
       [Report saved to .agent/task/architect-issue-filtering-20251117-1530.md]

Droid: 🗄️ Invoking @prisma-expert for query optimization...
       [Prisma expert designs efficient filter queries with indexes]
       [Report saved to .agent/task/prisma-filtering-20251117-1532.md]

Droid: ⚛️ Invoking @react-expert for filter UI component...
       [React expert designs FilterBar component with state management]
       [Report saved to .agent/task/react-filter-ui-20251117-1534.md]

Droid: 💻 Invoking @devhub-fullstack for implementation...
       [Fullstack implements following all design recommendations]
       [Creates API endpoint, Prisma queries, React components]

Droid: 🧪 Invoking @devhub-testing for test suite...
       [Testing creates unit tests, integration tests, E2E tests]
       [Achieves 85% coverage]

Droid: 🔍 Invoking @devhub-auditor for final review...
       [Auditor checks security, accessibility, performance]
       [All checks pass ✅]

Droid: 📚 Invoking @synthesize-docs to document pattern...
       [Synthesize-docs creates SOP for filter implementation]
       [Saved to .agent/sops/implementing-filters.md]

Droid: ✅ Feature complete!
       - API endpoint: GET /api/issues?priority=high&module=auth
       - UI component: FilterBar with priority and module dropdowns
       - Tests: 85% coverage, all passing
       - Documentation: SOP created
       - Commits: 4 commits (docs, feat, test, docs)
```

### Bug Fix Flow

```
User: "Debug why POST /api/issues returns 400 for valid input"

Droid: ✅ Session initialized - Reading context...

Droid: 🔍 Invoking @analyze-architecture to trace request flow...
       [Analyze-architecture traces: Client → API route → Prisma → DB]
       [Identifies: Zod schema validation failing on 'module' field]
       [Report: Schema expects 'moduleId' but client sends 'module']

Droid: 💻 Fixing bug directly...
       [Updates Zod schema to accept 'module' and transform to 'moduleId']
       [Adds input transformation layer]

Droid: 🧪 Invoking @devhub-testing for regression test...
       [Testing creates test case for this exact scenario]
       [Adds E2E test to prevent regression]

Droid: ✅ Bug fixed!
       - Root cause: Schema mismatch between client and API
       - Solution: Added transformation layer
       - Test: Regression test added
       - Verified: All existing tests still pass
```

### Database Schema Change Flow

```
User: "Add comments feature to issues"

Droid: ✅ Session initialized - Reading context...

Droid: 🔍 Invoking @devhub-architect for feature design...
       [Architect designs Comment model with Issue relation]
       [Designs API endpoints: GET, POST, PATCH, DELETE /api/comments]

Droid: 🗄️ Invoking @prisma-expert for schema design...
       [Prisma expert creates Comment model]
       [Designs one-to-many Issue → Comments relation]
       [Adds indexes for performance]
       [Creates migration strategy]

Droid: 📋 Presenting migration plan for approval...
       [Uses ExitSpecMode to show migration]
       [Shows SQL changes, rollback strategy]

User: [Approves migration]

Droid: 💻 Applying migration...
       [Creates Prisma migration]
       [Runs migration on Mac mini database]
       [Verifies schema changes]

Droid: 💻 Invoking @devhub-fullstack for API + UI...
       [Implements comment API endpoints]
       [Creates CommentList and CommentForm components]

Droid: 🧪 Invoking @devhub-testing for tests...
       [Tests all CRUD operations]
       [Tests relation loading]
       [Tests edge cases (empty comments, long text, etc.)]

Droid: 📊 Invoking @map-system to update docs...
       [Updates .agent/system/database-schema.md]
       [Updates .agent/system/api-catalog.md]

Droid: ✅ Comments feature complete!
       - Database: Comment model added with Issue relation
       - API: Full CRUD for comments
       - UI: CommentList + CommentForm components
       - Tests: 88% coverage
       - Docs: System docs updated
```

### MCP Tool Creation Flow

```
User: "Create MCP tool for searching issues by text"

Droid: ✅ Session initialized - Reading context...

Droid: 🔌 Invoking @devhub-mcp-specialist for tool design...
       [MCP specialist designs tool structure]
       [Defines input schema, output schema]
       [Designs integration with Next.js API]

Droid: 🔍 Invoking @analyze-architecture for API requirements...
       [Traces how search should work]
       [Identifies need for full-text search]

Droid: 🗄️ Invoking @prisma-expert for search implementation...
       [Prisma expert adds tsvector column]
       [Creates indexes for full-text search]
       [Designs efficient search query]

Droid: 💻 Invoking @devhub-fullstack for implementation...
       [Creates search API endpoint]
       [Implements MCP tool calling the API]
       [Adds error handling and validation]

Droid: 🧪 Invoking @devhub-testing for MCP tool tests...
       [Tests tool with various queries]
       [Tests error handling]
       [Tests performance with large datasets]

Droid: ✅ MCP tool complete!
       - Tool: search_issues(query: string, limit?: number)
       - API: GET /api/search?q=query&limit=10
       - Database: Full-text search with tsvector
       - Tests: All scenarios covered
```

---

## 📖 Quick Reference

### Daily Checklist

```markdown
Before starting work:
- [ ] Mac mini health OK: curl http://192.168.1.15:3000/api/health
- [ ] Application loads: http://192.168.1.15:3000
- [ ] On feature branch (not master)
- [ ] Read .agent/active-context.md for current work
- [ ] Read .agent/progress.md for phase status
- [ ] Read docs/13-Project-Plan.md for requirements
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

### File Locations

```
Documentation:
├── docs/                        # Main documentation
│   ├── 13-Project-Plan.md       # Implementation roadmap
│   ├── 03-Architecture.md       # System architecture
│   └── README.md                # Docs index

Agent Context:
├── .agent/
│   ├── active-context.md        # Current work
│   ├── progress.md              # Phase progress
│   ├── system-patterns.md       # How we build
│   ├── sops/                    # Procedures
│   ├── system/                  # System docs
│   └── task/                    # Session tracking
│       ├── current-session-*.md # Active session
│       ├── current-plan.md      # Current plan
│       └── current-todos.md     # Task list

Droids:
├── .factory/
│   └── droids/                  # 14 custom droids
```

### Common Commands

```bash
# Mac mini health check
curl http://192.168.1.15:3000/api/health

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

## 🔄 Differences from CLAUDE.md

This section explicitly documents what's different between Factory Droid and Claude Code workflows.

### Tools & Features

| Feature | Claude Code | Factory Droid |
|---|---|---|
| **Planning tool** | ExitPlanMode | ✅ **ExitSpecMode** |
| **Task tracking** | File-only todos | ✅ **TodoWrite** (real-time UI) |
| **Orchestrator** | Python devhub_orchestrator.py | ❌ Not available |
| **Memory MCP** | Long-term knowledge retention | ❌ Not available (use session files) |
| **Slash commands** | /update-doc | ❌ Not available (explicit requests) |
| **Droid invocation** | Sub-agent system | ✅ **Custom droids via @mention** |

### Workflow Differences

**Claude Code Workflow:**
```
1. Start Python orchestrator
2. Orchestrator routes to appropriate sub-agent
3. Sub-agent creates plan
4. Use ExitPlanMode for approval
5. Sub-agent implements
6. Continue to next sub-agent
7. Update Memory MCP for long-term retention
```

**Factory Droid Workflow:**
```
1. Natural language request
2. I automatically invoke appropriate droids
3. Droids create reports in .agent/task/
4. I read reports and implement
5. Use ExitSpecMode for complex plans
6. Update session files for context persistence
7. Invoke documentation droids when needed
```

### Context Management

**Claude Code:**
- Uses Memory MCP for long-term knowledge
- Python orchestrator maintains session state
- Automatic context compaction

**Factory Droid:**
- Uses `.agent/task/` session files
- Manual save at 15K token checkpoints
- Session files survive context loss

### Documentation Updates

**Claude Code:**
```bash
/update-doc after-feature     # Slash command
```

**Factory Droid:**
```
User: "Update documentation after this feature"
Droid: [Invokes @synthesize-docs and @map-system]
```

### Key Similarities (Unchanged)

✅ All 8 Golden Rules
✅ Quality gates (build, test, security, architecture)
✅ Technical standards (TypeScript, Prisma, React patterns)
✅ Mac mini Docker architecture
✅ Git workflow
✅ Pre-work checklist
✅ Documentation structure (.agent/ and docs/)
✅ Session file patterns

---

## 🎓 Getting Help

### Documentation Hierarchy

1. **This file (DROID.md)** - Factory Droid workflows and droid invocation
2. **AGENTS.md** - Core principles and quality standards
3. **CLAUDE.md** - Original workflows (reference only)
4. **docs/README.md** - Complete documentation index
5. **docs/13-Project-Plan.md** - Implementation roadmap
6. **.agent/README.md** - Agent context documentation

### When Something Goes Wrong

**Issue:** "Droid isn't invoking specialists"
→ Check if task requires expertise (trivial tasks done directly)
→ Request explicitly: "Invoke @devhub-architect for design"

**Issue:** "Context lost after long session"
→ Read `.agent/task/current-session-[latest].md`
→ Read `.agent/task/current-todos.md`
→ Resume from last checkpoint

**Issue:** "Quality gates failing"
→ Check specific gate output (lint, type-check, test, build)
→ Invoke `@devhub-auditor` for comprehensive review
→ Fix issues systematically

**Issue:** "Mac mini services down"
→ Check pre-work checklist (curl health endpoint)
→ Start services: `docker compose -f docker-compose.cloud.yml up -d`

**Issue:** "Don't know which droid to use"
→ Describe task in natural language, I'll route automatically
→ Check "Common Tasks → Droid Routing" table above

### Key References

**Architecture & Design:**
- `docs/03-Architecture.md` - System architecture
- `.agent/system-patterns.md` - Implementation patterns

**Database:**
- `docs/02-DATABASE-SCHEMA.md` - Schema reference
- `.agent/system/database-schema.md` - Current schema state

**API:**
- `docs/06-API/openapi.yaml` - API specification
- `.agent/system/api-catalog.md` - Endpoint catalog

**Procedures:**
- `.agent/sops/` - All standard operating procedures
- `.agent/sops/git-workflow.md` - Git conventions
- `.agent/sops/mac-mini-cloud-architecture.md` - Infrastructure setup

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
- [ ] No SQL injection vulnerabilities (parameterized queries only)
- [ ] No XSS vulnerabilities
- [ ] No exposed secrets
- [ ] Authentication/authorization checked

**Architecture:**
- [ ] Follows patterns in docs/03-Architecture.md
- [ ] Data-driven (no hardcoded values)
- [ ] Proper module placement
- [ ] Server Components by default

**Testing:**
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] All edge cases covered

**Documentation:**
- [ ] .agent/active-context.md updated
- [ ] .agent/progress.md updated
- [ ] docs/13-Project-Plan.md updated
- [ ] New patterns documented (if applicable)

**Git:**
- [ ] Small, focused commits
- [ ] Descriptive commit messages
- [ ] Documentation committed first
- [ ] Code committed after docs

**Accessibility:**
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] WCAG 2.1 AA compliance

**Performance:**
- [ ] Database queries optimized (indexes, efficient queries)
- [ ] No N+1 query problems
- [ ] Server Components used where possible
- [ ] Build time acceptable

---

**Remember:** I'm here to help you build high-quality software efficiently. I'll automatically invoke specialist droids when needed, manage the full workflow, and ensure all quality standards are met.

**Just describe what you want to build - I'll handle the rest!** 🚀
