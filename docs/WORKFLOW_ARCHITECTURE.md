# Workflow Architecture

> Note: Canonical architecture is maintained in `docs/03-Architecture.md`. This document provides workflow-focused context; for system diagrams and authoritative design, refer to `docs/03-Architecture.md`.

**Version:** 1.0
**Last Updated:** 2025-10-24
**Status:** Active - 3-Track Hybrid Workflow

---

## 📋 Table of Contents

- [Overview](#overview)
- [Development Tracks](#development-tracks)
- [Page-by-Page Coordination](#page-by-page-coordination-strategy)
- [Decision Tree](#decision-tree-which-track)
- [Git Branch Strategy](#git-branch-strategy)
- [Testing Strategy](#testing-strategy)
- [Coordination Points](#coordination-points)
- [Quality Gates](#quality-gates-both-tracks)

---

## 🎯 Overview

ProjectPulse development uses a **hybrid workflow** with **3 parallel tracks** that coordinate at specific integration points. This approach allows:

✅ **Parallel development** - Backend and frontend progress simultaneously
✅ **Clear separation** - API vs UI concerns isolated
✅ **Specialist efficiency** - Developers focus on their expertise
✅ **Better testing** - API, Component, and E2E tests clearly separated
✅ **Faster delivery** - Multiple features progress in parallel

---

## 🛤️ Development Tracks

### Track 1: Backend/API (Priority 1)

**Agents:** devhub-architect → devhub-fullstack → devhub-testing → devhub-auditor

**Focus:**

- Database schema design (Prisma)
- API route implementation (Next.js API Routes)
- Business logic and data validation
- MCP server tools and resources
- Security and performance optimization

**Document:** [13-Project-Plan.md](13-Project-Plan.md)

**Timeline:** Weeks 1-4 (as currently planned), Week 5+ (security features)

**Branch Strategy:** `api/*`

**Deliverables:**

**Week 1:**

- PostgreSQL + Prisma setup
- Database extensions (pgvector, pg_trgm, uuid-ossp)
- Prisma schema (Issue, Comment, Attachment, KnowledgeItem, etc.)
- Day 0 utilities (settings, process executor, validation)

**Week 2:**

- POST/GET/PATCH/DELETE `/api/issues`
- POST/GET `/api/issues/[id]/comments`
- POST `/api/issues/[id]/attachments`
- Prisma queries with proper validation

**Week 3:**

- POST/GET `/api/knowledge`
- GET `/api/search` (hybrid: full-text + semantic)
- POST/GET `/api/wiki/[slug]`
- pgvector embeddings generation

**Week 4:**

- MCP tools: `create_issue`, `search_context`, `get_project_stats`
- MCP resources: Project context injection
- Agent configuration endpoints

**Week 5+:**

- Scanner integration (Semgrep, Snyk, GitGuardian APIs)
- POST/GET `/api/security/vulnerabilities`
- Security scan scheduler
- Compliance tracking endpoints

**Quality Gates:**

- ✅ 80%+ test coverage (Jest + Supertest)
- ✅ No TypeScript `any` types
- ✅ Parameterized Prisma queries only ([R-SEC-001])
- ✅ Input validation with Zod ([R-TS-001])
- ✅ Security audit passed (devhub-auditor)
- ✅ Documentation updated

---

### Track 2: Frontend/UI (Priority 2)

**Agents:** devhub-fullstack (UI specialist mode) → devhub-testing

**Focus:**

- Design system implementation (Tailwind + shadcn/ui)
- Component library development
- Page layouts and routing
- Animations and interactions
- Accessibility compliance

**Document:** [04-UI-ARCHITECTURE.md](04-UI-ARCHITECTURE.md)

**Reference:** [mockups/](../mockups/) folder (7 neon mockups + design system)

**Timeline:** Starts Week 1 Day 3, runs parallel to backend

**Branch Strategy:** `ui/*`

**Deliverables:**

**Week 1 Day 3:**

- Tailwind config with neon colors
- Font setup (Inter, JetBrains Mono)
- Custom animations (pulse, glow, breathing)
- Base components (Button, Card, Input, Badge)

**Week 2:**

- Dashboard layout (stats cards, activity feed)
- Issues page (Kanban board)
- Complex components:
  - `IssueCard` (priority color coding)
  - `KanbanColumn` (drag-and-drop)
  - `AgentCard` (breathing animation)
  - `CommandPalette` (⌘K interface)

**Week 3:**

- Knowledge Base page (document library)
- Wiki page (documentation hub)
- Content components:
  - `DocumentCard` (for KB)
  - `WikiSidebar` (collapsible nav)
  - `CodeBlock` (syntax highlighting)
  - `Callout` (info/tip/warning boxes)

**Week 4:**

- Agent Personas page (management UI)
- Agent components:
  - `AgentCard` (with breathing animation)
  - `AgentToggle` (activate/deactivate switch)
  - `AgentStats` (metrics display)
  - `SkillBadge` (skill tags)

**Week 5+:**

- Security Dashboard page
- Security components:
  - `SecurityScoreMeter` (circular progress)
  - `VulnerabilityCard` (severity colors)
  - `ScannerStatus` (scanner indicators)
  - `ComplianceTracker` (progress bars)

**Quality Gates:**

- ✅ Design system consistency (matches mockups)
- ✅ Accessibility audit (WCAG AA, contrast ratios)
- ✅ Responsive design verified (mobile, tablet, desktop)
- ✅ Animation performance tested
- ✅ Component tests written (Jest + React Testing Library)
- ✅ No hardcoded colors (use Tailwind classes)

---

### Track 3: Integration (Continuous)

**Agents:** devhub-fullstack → devhub-testing

**Focus:**

- Connecting UI components to API endpoints
- Data fetching patterns (Server Components, SWR)
- Error handling and loading states
- E2E testing (Playwright)
- Feature completion and deployment

**Document:** This file (WORKFLOW_ARCHITECTURE.md)

**Timeline:** Continuous throughout development

**Branch Strategy:** `feature/*`

**Deliverables:**

**Week 2:**

- Dashboard page connected to `/api/stats` and `/api/activity`
- Issues page connected to `/api/issues` CRUD endpoints
- Kanban drag-and-drop updating issue status via API
- Command Palette triggering actions via API
- E2E test: Create issue → Move to In Progress → Add comment → Mark Done

**Week 3:**

- Knowledge Base page connected to `/api/knowledge`
- Wiki page connected to `/api/wiki/[slug]`
- Search bar connected to `/api/search` (hybrid search)
- E2E test: Search "authentication" → See results from KB and Wiki

**Week 4:**

- Agent Personas page connected to MCP agent status
- Agent toggles activating/deactivating agents via MCP
- Agent stats displaying real performance metrics
- E2E test: Activate Bug Hunter → Create issue via MCP → See in UI

**Week 5+:**

- Security Dashboard connected to `/api/security/*` endpoints
- Real-time scanner status updates
- Vulnerability list with fix/review actions
- E2E test: Run scan → See vulnerabilities → Mark as fixed → See score update

**Quality Gates:**

- ✅ E2E tests pass (Playwright)
- ✅ Full user flows tested
- ✅ Error handling verified (try invalid inputs)
- ✅ Loading states implemented (skeleton loaders)
- ✅ Empty states implemented (no data messages)
- ✅ Success/error notifications working

---

## 🔗 Page-by-Page Coordination Strategy

### Week 2: Issue Tracker (Dashboard + Issues)

#### Backend Track

**Agent:** devhub-architect → devhub-fullstack → devhub-testing

**Tasks:**

1. Design API routes structure
   - POST `/api/issues` - Create issue
   - GET `/api/issues` - List issues (with filters)
   - PATCH `/api/issues/[id]` - Update issue
   - DELETE `/api/issues/[id]` - Delete issue
   - POST `/api/issues/[id]/comments` - Add comment
   - GET `/api/issues/[id]/comments` - List comments

2. Implement Prisma models

   ```prisma
   model Issue {
     id          Int       @id @default(autoincrement())
     projectId   Int
     title       String
     description String?
     status      IssueStatus @default(OPEN)
     priority    IssuePriority @default(MEDIUM)
     module      String?
     customFields Json?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt

     project     Project   @relation(fields: [projectId], references: [id])
     comments    Comment[]
     attachments Attachment[]
   }
   ```

3. Write API tests (Jest + Supertest)
4. Security review (devhub-auditor)

**Output:** ✅ Working CRUD endpoints with 80%+ test coverage

---

#### Frontend Track (Parallel)

**Agent:** devhub-fullstack (UI specialist) → devhub-testing

**Tasks:**

1. Create Dashboard layout
   - Stats cards (Total Issues, Agents Active, etc.)
   - Quick actions grid
   - Activity timeline

2. Create Issues page (Kanban)
   - 3 columns: To Do, In Progress, Done
   - Drag-and-drop functionality (use `@dnd-kit/core`)
   - Filter sidebar

3. Build components
   - `IssueCard` (priority colors: Critical=red, High=yellow, Medium=cyan, Low=purple)
   - `KanbanColumn` (with drop zone)
   - `StatsCard` (with pulse animation on live metrics)

4. Write component tests (React Testing Library)

**Output:** ✅ Styled Kanban board with static data

---

#### Integration (After Both Complete)

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Connect Dashboard to API
   - Fetch stats from `/api/stats`
   - Fetch activity from `/api/activity`
   - Add loading skeletons

2. Connect Kanban to CRUD APIs
   - Fetch issues from `/api/issues?status={status}`
   - On drag-and-drop: PATCH `/api/issues/[id]` with new status
   - Optimistic UI updates

3. Connect Command Palette
   - "Create Issue" → POST `/api/issues`
   - Navigate to issues page

4. Write E2E test

   ```typescript
   test('Issue lifecycle', async ({ page }) => {
     // Create issue
     await page.getByRole('button', { name: 'Create Issue' }).click();
     await page.fill('[name="title"]', 'Test Bug');
     await page.click('[type="submit"]');

     // Move to In Progress
     await page.dragAndDrop('.issue-card', '.column-in-progress');

     // Add comment
     await page.click('.issue-card');
     await page.fill('[name="comment"]', 'Working on this');
     await page.click('.add-comment');

     // Mark as Done
     await page.dragAndDrop('.issue-card', '.column-done');

     // Verify
     expect(await page.locator('.column-done .issue-card').count()).toBe(1);
   });
   ```

**Output:** ✅ Working Issue Tracker feature end-to-end

---

### Week 3: Knowledge & Documentation (Search)

#### Backend Track

**Agent:** devhub-architect → devhub-fullstack → devhub-testing

**Tasks:**

1. Design search API (hybrid: full-text + semantic)
   - GET `/api/search?q={query}&type=hybrid`
   - Combine PostgreSQL tsvector (full-text) + pgvector (semantic)

2. Implement knowledge base endpoints
   - POST `/api/knowledge` - Create document
   - GET `/api/knowledge` - List documents
   - PATCH `/api/knowledge/[id]` - Update document

3. Implement wiki endpoints
   - POST `/api/wiki/[slug]` - Create wiki page
   - GET `/api/wiki/[slug]` - Get wiki page (Markdown)
   - GET `/api/wiki/[slug]/related` - Related articles

4. Generate embeddings (using @xenova/transformers)
5. Write API tests

**Output:** ✅ Working search and content APIs

---

#### Frontend Track (Parallel)

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Create Knowledge Base page
   - Document grid (3 columns)
   - Category pills (Architecture, API, Deployment, etc.)
   - Search bar with cyan focus glow

2. Create Wiki page
   - Sidebar navigation (collapsible)
   - Table of contents (auto-generated from headings)
   - Code blocks with syntax highlighting
   - Callout boxes (info/tip/warning)

3. Build components
   - `DocumentCard` (title, excerpt, tags, views)
   - `WikiSidebar` (navigation tree)
   - `CodeBlock` (with copy button)
   - `Callout` (color-coded by type)

4. Write component tests

**Output:** ✅ Styled Knowledge Base and Wiki pages

---

#### Integration

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Connect Knowledge Base to `/api/knowledge`
2. Connect Wiki to `/api/wiki/[slug]`
3. Connect search to `/api/search`
4. E2E test: Search → View document → Navigate to wiki

**Output:** ✅ Working search and content features

---

### Week 4: Agent Integration (MCP + UI)

#### Backend Track

**Agent:** devhub-mcp-specialist → devhub-fullstack → devhub-testing

**Tasks:**

1. Design MCP tools
   - `create_issue` - Create issue from Claude Code
   - `search_context` - Search knowledge base for context
   - `get_project_stats` - Get dashboard metrics

2. Design MCP resources
   - Project context (current issues, recent activity)
   - Agent status (active agents, performance metrics)

3. Implement agent configuration endpoints
   - GET `/api/agents` - List agents with stats
   - POST `/api/agents/[id]/activate` - Activate agent
   - POST `/api/agents/[id]/deactivate` - Deactivate agent

**Output:** ✅ Working MCP integration

---

#### Frontend Track (Parallel)

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Create Agent Personas page
   - Agent portfolio overview (stats summary)
   - Agent cards (6 agents: 4 active, 2 inactive)
   - Toggle switches with neon glow

2. Build components
   - `AgentCard` (with breathing animation when active)
   - `AgentToggle` (activate/deactivate switch)
   - `AgentStats` (reviews done, bugs found, time saved)
   - `SkillBadge` (skill tags in agent color)

**Agent Details:**

1. Code Reviewer 🔍 (Cyan #00F5FF) - Active
2. Bug Hunter 🐛 (Purple #B721FF) - Active
3. Feature Architect 🏗️ (Purple #B721FF) - Active
4. Security Auditor 🛡️ (Yellow #FACC15) - Active
5. Documentation Writer 📝 - Inactive
6. Test Automation 🧪 - Inactive

**Output:** ✅ Agent management UI

---

#### Integration

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Connect Agent Personas page to `/api/agents`
2. Connect toggles to activate/deactivate endpoints
3. Connect stats to real agent performance data
4. E2E test: Activate agent → Create issue via MCP → See in UI

**Output:** ✅ Working agent management feature

---

### Week 5+: Security Dashboard (Advanced Feature)

#### Backend Track

**Agent:** devhub-architect → devhub-fullstack → devhub-testing

**Tasks:**

1. Integrate scanners (Semgrep, Snyk, GitGuardian)
2. Design vulnerability database

   ```prisma
   model Vulnerability {
     id          Int       @id @default(autoincrement())
     severity    VulnerabilitySeverity
     title       String
     description String
     cwe         String?
     file        String
     line        Int?
     scanner     String
     status      VulnerabilityStatus @default(OPEN)
     createdAt   DateTime  @default(now())
   }
   ```

3. Implement security endpoints
   - GET `/api/security/score` - Overall score
   - GET `/api/security/vulnerabilities` - List vulnerabilities
   - GET `/api/security/scanners` - Scanner status
   - GET `/api/security/compliance` - Compliance metrics

4. Create scan scheduler

**Output:** ✅ Working security APIs

---

#### Frontend Track (Parallel)

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Create Security Dashboard page
   - Security score meter (circular progress)
   - Vulnerability breakdown (chart)
   - Scanner status cards
   - Recent vulnerabilities list
   - Compliance tracking

2. Build components
   - `SecurityScoreMeter` (with glow)
   - `VulnerabilityCard` (severity color-coded)
   - `ScannerStatus` (Semgrep, Snyk, GitGuardian)
   - `SecurityTimeline` (activity log)
   - `ComplianceTracker` (OWASP, CWE, PCI DSS, SOC 2)

**Output:** ✅ Security dashboard UI

---

#### Integration

**Agent:** devhub-fullstack → devhub-testing

**Tasks:**

1. Connect Security Dashboard to security APIs
2. Add real-time scanner status updates
3. E2E test: Run scan → See vulnerabilities → Fix → Verify score update

**Output:** ✅ Working security feature

---

## 🤔 Decision Tree: "Which Track?"

### Question 1: Does this change API contracts or database schema?

**YES → Backend Track (`api/*`)**

- Modifying Prisma schema
- Adding/changing API endpoints
- Changing request/response formats
- Business logic changes
- Database queries

**NO → Continue to Q2**

---

### Question 2: Does this change visual design, components, or styling?

**YES → Frontend Track (`ui/*`)**

- Adding new components
- Modifying Tailwind config
- Changing layouts
- Adding animations
- Updating styles
- Accessibility improvements

**NO → Continue to Q3**

---

### Question 3: Does this connect UI to API or test full user flows?

**YES → Integration Track (`feature/*`)**

- Connecting pages to API endpoints
- Data fetching patterns
- Error handling
- Loading states
- E2E testing
- Feature completion

**NO → Ask in team chat or GitHub Discussions**

---

## 🌿 Git Branch Strategy

### Branch Naming Conventions

#### Backend Branches (`api/*`)

For API routes, database changes, business logic:

```bash
api/issues-crud           # Issue CRUD endpoints
api/search-hybrid         # Hybrid search implementation
api/mcp-tools             # MCP server tools
api/security-scan         # Security scanner integration
api/wiki-endpoints        # Wiki page endpoints
```

#### Frontend Branches (`ui/*`)

For components, styling, animations:

```bash
ui/design-system          # Tailwind config + base components
ui/issue-kanban           # Kanban board component
ui/wiki-layout            # Wiki page layout
ui/agent-cards            # Agent persona cards
ui/security-dashboard     # Security dashboard UI
ui/command-palette        # ⌘K command interface
```

#### Integration Branches (`feature/*`)

For connecting UI to API, full features:

```bash
feature/dashboard         # Dashboard page (UI + API)
feature/issues            # Issues page (UI + API)
feature/knowledge         # Knowledge Base (UI + API)
feature/wiki              # Wiki page (UI + API)
feature/agents            # Agent Personas (UI + MCP)
feature/security          # Security Dashboard (UI + API)
```

---

### Branching Workflow

```bash
# Create backend branch
git checkout -b api/issues-crud

# Work on API
# ...commit changes...

# Open PR: api/issues-crud → main
# Review, test, merge

# Create frontend branch (parallel)
git checkout -b ui/issue-kanban

# Work on UI
# ...commit changes...

# Open PR: ui/issue-kanban → main
# Review, test, merge

# Create integration branch (after both merged)
git checkout -b feature/issues
git merge main  # Get both API and UI changes

# Connect UI to API
# ...commit changes...

# Open PR: feature/issues → main
# E2E test, review, merge
```

---

## 🧪 Testing Strategy

### API Tests (Backend Track)

**Tool:** Jest + Supertest
**Location:** `app/api/**/*.test.ts`
**Coverage Target:** 80%+ for all API routes

**Example:**

```typescript
// app/api/issues/route.test.ts
describe('POST /api/issues', () => {
  it('creates issue with valid data', async () => {
    const response = await request(app).post('/api/issues').send({
      projectId: 1,
      title: 'Test Issue',
      priority: 'high',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('rejects invalid priority', async () => {
    const response = await request(app)
      .post('/api/issues')
      .send({ projectId: 1, title: 'Test', priority: 'invalid' });

    expect(response.status).toBe(400);
  });
});
```

**Run Command:**

```bash
pnpm test:api
```

---

### Component Tests (Frontend Track)

**Tool:** Jest + React Testing Library
**Location:** `components/**/*.test.tsx`
**Coverage Target:** 80%+ for all components

**Example:**

```typescript
// components/issues/IssueCard.test.tsx
describe('IssueCard', () => {
  it('renders with correct priority color', () => {
    render(<IssueCard priority="critical" title="Critical Bug" />);

    const badge = screen.getByText(/critical/i);
    expect(badge).toHaveClass('bg-error/20', 'text-error');
  });

  it('shows pulse indicator for in-progress status', () => {
    render(<IssueCard status="in_progress" title="Active Task" />);

    const pulse = screen.getByTestId('pulse-indicator');
    expect(pulse).toBeInTheDocument();
  });
});
```

**Run Command:**

```bash
pnpm test:components
```

---

### E2E Tests (Integration Track)

**Tool:** Playwright (with MCP support!)
**Location:** `e2e/**/*.spec.ts`
**Coverage:** All critical user flows

**Example:**

```typescript
// e2e/issue-lifecycle.spec.ts
test('complete issue lifecycle', async ({ page }) => {
  // Create issue
  await page.goto('/issues');
  await page.getByRole('button', { name: 'Create Issue' }).click();
  await page.fill('[name="title"]', 'E2E Test Bug');
  await page.selectOption('[name="priority"]', 'high');
  await page.click('button[type="submit"]');

  // Verify created
  await expect(page.getByText('E2E Test Bug')).toBeVisible();

  // Drag to In Progress
  const issueCard = page.locator('.issue-card').filter({ hasText: 'E2E Test Bug' });
  await issueCard.dragTo(page.locator('.column-in-progress'));

  // Add comment
  await issueCard.click();
  await page.fill('[name="comment"]', 'Working on this now');
  await page.click('.add-comment-button');

  // Verify comment added
  await expect(page.getByText('Working on this now')).toBeVisible();

  // Mark as done
  await page.dragTo(issueCard, page.locator('.column-done'));

  // Verify in Done column
  const doneColumn = page.locator('.column-done');
  await expect(doneColumn.getByText('E2E Test Bug')).toBeVisible();
});
```

**Run Command:**

```bash
pnpm test:e2e
```

---

## 🤝 Coordination Points

### Daily Async Updates

**Backend Team:**

- "✅ API endpoints ready for integration: POST/GET/PATCH `/api/issues`"
- "🔄 Working on hybrid search API, ETA tomorrow"
- "🐛 Fixed validation bug in issue creation"

**Frontend Team:**

- "✅ Kanban board UI complete, ready for API connection"
- "🔄 Working on Wiki sidebar, need wiki schema details"
- "🎨 Added pulse animations to all in-progress cards"

**Integration Team:**

- "✅ Dashboard connected to stats API, E2E tests passing"
- "🔄 Connecting Kanban to CRUD endpoints"
- "❌ E2E test failing: drag-and-drop not updating database"

---

### Weekly Reviews

**Week 1:** Infrastructure setup complete

- PostgreSQL + Prisma configured
- Next.js app running
- Design system implemented
- Base components created

**Week 2:** Issue Tracker feature complete

- API endpoints working
- Kanban board functional
- E2E tests passing
- Ready for production

**Week 3:** Search feature complete

- Hybrid search working
- Knowledge Base connected
- Wiki pages functional

**Week 4:** MCP + Agent UI complete

- MCP tools integrated
- Agent management UI working
- Agents can be activated/deactivated

**Week 5+:** Security feature complete

- Scanners integrated
- Vulnerability tracking working
- Compliance dashboard functional

---

## ✅ Quality Gates (Both Tracks)

### Before Merging to Main

**Code Quality:**

- [ ] All tests pass (80%+ coverage)
- [ ] TypeScript compiles with no errors
- [ ] No `any` types introduced ([R-TS-001])
- [ ] ESLint passes (no warnings)
- [ ] Prettier formatted

**Security:**

- [ ] No secrets committed (.env files gitignored)
- [ ] Input validation with Zod ([R-TS-001])
- [ ] Parameterized queries only ([R-SEC-001])
- [ ] Security audit passed (devhub-auditor)

**Accessibility (UI only):**

- [ ] Contrast ratios pass WCAG AA (7:1+)
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] ARIA labels on icon-only buttons

**Documentation:**

- [ ] README.md updated (if needed)
- [ ] STATUS.md updated with progress (and 13-Project-Plan/12-Backlog as needed)
- [ ] API documented (if new endpoints)
- [ ] Component usage documented (if new components)

**Testing:**

- [ ] Unit tests written (Jest)
- [ ] Integration tests written (for features)
- [ ] E2E tests passing (Playwright)
- [ ] Manual testing completed

**Review:**

- [ ] PR reviewed by at least one other developer
- [ ] All comments addressed
- [ ] CI/CD pipeline passes (GitHub Actions)

---

## 📊 Example: Full Feature Workflow

### Feature: Issue Tracker with Kanban Board

#### Step 1: Backend (Week 2 Day 1-2)

**Agent:** devhub-architect

**Task:** Design API routes structure

**Output:**

```typescript
// API Design Document
POST   /api/issues              - Create issue
GET    /api/issues              - List issues (with filters)
PATCH  /api/issues/[id]         - Update issue
DELETE /api/issues/[id]         - Delete issue
POST   /api/issues/[id]/comments - Add comment
GET    /api/issues/[id]/comments - List comments
```

---

**Agent:** devhub-fullstack

**Task:** Implement CRUD endpoints

**Output:** Working API routes with Prisma queries

---

**Agent:** devhub-testing

**Task:** Write API tests

**Output:** 80%+ test coverage

---

**Agent:** devhub-auditor

**Task:** Security review

**Output:** ✅ No security vulnerabilities, approved

---

#### Step 2: Frontend (Week 2 Day 2-3, parallel)

**Agent:** devhub-fullstack (UI specialist)

**Task:** Create Kanban layout

**Output:**

```typescript
// components/issues/KanbanBoard.tsx
export function KanbanBoard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <KanbanColumn title="To Do" status="to_do" />
      <KanbanColumn title="In Progress" status="in_progress" />
      <KanbanColumn title="Done" status="done" />
    </div>
  );
}
```

---

**Task:** Build IssueCard component

**Output:**

```typescript
// components/issues/IssueCard.tsx
export function IssueCard({ priority, title, status }: IssueCardProps) {
  const priorityColors = {
    critical: 'bg-error/20 text-error',
    high: 'bg-warning/20 text-warning',
    medium: 'bg-info/20 text-info',
    low: 'bg-text-tertiary/20 text-text-tertiary',
  };

  return (
    <div className="card-hover neon-border-pink p-4 rounded-xl">
      {status === 'in_progress' && <PulseIndicator />}
      <h3 className="font-semibold">{title}</h3>
      <Badge className={priorityColors[priority]}>{priority}</Badge>
    </div>
  );
}
```

---

**Agent:** devhub-testing

**Task:** Write component tests

**Output:** Component tests passing

---

#### Step 3: Integration (Week 2 Day 4)

**Agent:** devhub-fullstack

**Task:** Connect Kanban to API

**Output:**

```typescript
// app/(dashboard)/issues/page.tsx
export default async function IssuesPage() {
  const toDoIssues = await prisma.issue.findMany({ where: { status: 'to_do' } });
  const inProgressIssues = await prisma.issue.findMany({ where: { status: 'in_progress' } });
  const doneIssues = await prisma.issue.findMany({ where: { status: 'done' } });

  return (
    <KanbanBoard
      toDo={toDoIssues}
      inProgress={inProgressIssues}
      done={doneIssues}
    />
  );
}
```

---

**Task:** Add drag-and-drop with API updates

**Output:**

```typescript
// components/issues/KanbanBoard.tsx (Client Component)
'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';

export function KanbanBoard() {
  async function handleDragEnd(event: DragEndEvent) {
    const issueId = event.active.id;
    const newStatus = event.over?.id;

    // Optimistic UI update
    // ...

    // Update via API
    await fetch(`/api/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  }

  return <DndContext onDragEnd={handleDragEnd}>...</DndContext>;
}
```

---

**Agent:** devhub-testing

**Task:** Write E2E test

**Output:** E2E test passing (see example above)

---

#### Step 4: Review (Week 2 Day 5)

**Agent:** devhub-auditor

**Task:** Final quality check

**Checklist:**

- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Accessibility verified
- ✅ Security review passed
- ✅ Documentation updated

**Output:** ✅ Approved for merge to main

---

**Result:** 🎉 **Issue Tracker feature complete and deployed!**

---

## 📚 Related Documentation

- **UI Architecture:** [04-UI-ARCHITECTURE.md](04-UI-ARCHITECTURE.md)
- **Backend Plan:** [03-Architecture.md](03-Architecture.md)
- **Design System:** [mockups/DESIGN_DIRECTION.md](../mockups/DESIGN_DIRECTION.md)
- **Mockup Features:** [mockups/MOCKUPS_COMPLETE.md](../mockups/MOCKUPS_COMPLETE.md)

---

**Last Updated:** 2025-10-24
**Maintainer:** Development Team + Claude Code
**Status:** ✅ Active - 3-Track Hybrid Workflow
