# System Patterns & Architecture

**Project**: ProjectPulse
**Last Updated**: 2025-11-06

---

## Architecture Overview

### Technology Stack

**Frontend**:

- Next.js 14.1.0 (App Router)
- React 18.2.0 (Server Components + Client Components)
- TypeScript 5.x (strict mode)
- Tailwind CSS 3.4.1 + shadcn/ui

**Backend**:

- Next.js API Routes & Server Actions
- Prisma ORM 5.9.0
- PostgreSQL 16 + pgvector
- Zod validation

**Testing**:

- Jest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests via MCP)

**DevOps**:

- Docker & Docker Compose
- pnpm (package management)

---

## Component Architecture

### Server vs Client Components

**Default: Server Components** (no "use client" directive)

**When to use Server Components**:

- Fetching data from database
- Reading environment variables
- Rendering static content
- No user interactivity needed

**When to use Client Components** ("use client" at top):

- User interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window, etc.)
- Event listeners, Context consumers

**Hybrid Pattern (Recommended)**:

```typescript
// app/issues/page.tsx (Server Component)
import { IssueList } from '@/components/issues/IssueList';
import { prisma } from '@/lib/db';

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany();
  return <IssueList initialIssues={issues} />;
}

// components/issues/IssueList.tsx (Client Component)
"use client";
import { useState } from 'react';

export function IssueList({ initialIssues }) {
  const [issues, setIssues] = useState(initialIssues);
  // Client-side filtering, sorting, etc.
  return <div>{/* Interactive UI */}</div>;
}
```

---

## Database Patterns

### Prisma Query Optimization

**Select/Include Strategy**:

```typescript
// ✅ GOOD: Only fetch needed fields + relations
const issues = await prisma.issue.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    assignee: { select: { id: true, name: true, avatarUrl: true } },
  },
  where: { status: 'OPEN' },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// ❌ BAD: Fetch everything
const issues = await prisma.issue.findMany({ include: { assignee: true } });
```

**Pagination**:

```typescript
// Cursor-based (for large datasets)
const issues = await prisma.issue.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastIssueId },
  orderBy: { createdAt: 'desc' },
});

// Offset-based (for small datasets)
const issues = await prisma.issue.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});
```

**Full-Text Search** (PostgreSQL tsvector):

> **Security Note ([R-SEC-001])**: Always use Prisma template-literal parameterization. Never string-concatenate SQL. The `${query}` syntax below is safe because Prisma automatically escapes parameters.

```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM "Issue"
  WHERE to_tsvector('english', title || ' ' || description)
  @@ plainto_tsquery('english', ${query})
  ORDER BY ts_rank(to_tsvector('english', title || ' ' || description),
                   plainto_tsquery('english', ${query})) DESC
  LIMIT 20
`;
```

---

## API Patterns

### Endpoint Structure

**File Location**: `app/api/[resource]/route.ts`

**Standard Template**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// 1. Validation Schema
const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

// 2. GET Handler
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.issue.findMany();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

// 3. POST Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const issue = await prisma.issue.create({ data: validated });
    return NextResponse.json({ data: issue }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
```

### Server Actions Pattern

**When to use**: Form submissions, mutations, optimistic updates

**Pattern**:

```typescript
// app/actions/issues.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateStatusSchema = z.object({
  issueId: z.number(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']),
});

export async function updateIssueStatus(formData: FormData) {
  const data = updateStatusSchema.parse({
    issueId: Number(formData.get('issueId')),
    status: formData.get('status'),
  });

  await prisma.issue.update({
    where: { id: data.issueId },
    data: { status: data.status },
  });

  revalidatePath('/issues');
  return { success: true };
}
```

**Client Usage**:

```typescript
"use client";

import { updateIssueStatus } from '@/app/actions/issues';
import { useTransition } from 'react';

export function StatusSelector({ issueId, currentStatus }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('issueId', issueId);
      formData.append('status', newStatus);
      await updateIssueStatus(formData);
    });
  };

  return (
    <select value={currentStatus} onChange={(e) => handleChange(e.target.value)} disabled={isPending}>
      <option value="OPEN">Open</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="CLOSED">Closed</option>
    </select>
  );
}
```

---

## Styling Patterns

### Tailwind CSS Conventions

**Base Classes**:

```tsx
<div className="flex items-center gap-4 p-6 bg-background text-foreground">
```

**Conditional Classes** (use cn() utility):

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)}>
```

**Theme Variables** (from globals.css):

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Neumorphic Design System (Coral Theme)

**Glass-Dark Card**:

```tsx
<div className="glass-dark backdrop-blur-xl border border-white/5 rounded-lg p-6">
  {/* Content */}
</div>
```

**Neumorphic Button**:

```tsx
<button className="neumorphic-btn px-4 py-2 rounded-lg hover:shadow-neumorphic-hover">
  {/* Button text */}
</button>
```

**Coral Gradient**:

```tsx
<div className="bg-gradient-to-r from-coral-400 to-coral-600 text-white">
  {/* Gradient background */}
</div>
```

---

## Testing Patterns

### Unit Tests (Jest)

**Pattern**: Test utilities and business logic

```typescript
// lib/utils.test.ts
import { formatDate } from './utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-10-26');
    expect(formatDate(date)).toBe('October 26, 2025');
  });
});
```

### Component Tests (React Testing Library)

**Pattern**: Test component rendering and interactions

```typescript
// components/IssueCard.test.tsx
import { render, screen } from '@testing-library/react';
import { IssueCard } from './IssueCard';

describe('IssueCard', () => {
  it('renders issue title', () => {
    const issue = { id: 1, title: 'Test Issue', status: 'OPEN' };
    render(<IssueCard issue={issue} />);
    expect(screen.getByText('Test Issue')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright via MCP)

**Pattern**: Test complete user workflows

```typescript
// tests/e2e/issue-detail.spec.ts
import { test, expect } from '@playwright/test';

test('complete issue workflow', async ({ page }) => {
  // Navigate to issue
  await page.goto('/issues/1');

  // Add comment
  await page.fill('[data-testid="comment-input"]', 'Test comment');
  await page.click('[data-testid="submit-comment"]');

  // Change status
  await page.selectOption('[data-testid="status-select"]', 'IN_PROGRESS');

  // Verify changes
  await expect(page.locator('[data-testid="comment-list"]')).toContainText('Test comment');
  await expect(page.locator('[data-testid="status-badge"]')).toHaveText('In Progress');
});
```

**Using Playwright MCP Tool**:

```typescript
// Via MCP tool in Claude Code
// 1. Navigate: mcp__playwright__browser_navigate({ url: "http://localhost:3000/issues/1" })
// 2. Snapshot: mcp__playwright__browser_snapshot() - gets page structure
// 3. Click: mcp__playwright__browser_click({ element: "Add Comment button", ref: "btn-123" })
// 4. Type: mcp__playwright__browser_type({ element: "Comment input", ref: "input-456", text: "Test comment" })
// 5. Screenshot: mcp__playwright__browser_take_screenshot({ filename: "after-comment.png" })
```

---

## State Management Patterns

### Local State (useState)

```typescript
const [isOpen, setIsOpen] = useState(false);
const [filter, setFilter] = useState('all');
```

### Server State (Server Components)

```typescript
// Direct database queries
const issues = await prisma.issue.findMany();
```

### Global State (Context API)

```typescript
"use client";
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("coral");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### URL State (Search Params)

```typescript
"use client";
import { useSearchParams, useRouter } from 'next/navigation';

export function FilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  return (
    <button onClick={() => setFilter('status', 'open')}>
      Show Open Issues
    </button>
  );
}
```

---

## Error Handling Patterns

### Error Boundaries

```typescript
// app/error.tsx
"use client";

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### API Error Handling

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.issue.findMany();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({ error: 'Database error', code: error.code }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## File Organization

```
app/
  (routes)/           # Page routes
    issues/
      page.tsx        # Server Component (data fetching)
      [id]/
        page.tsx      # Dynamic route
    layout.tsx        # Root layout
  api/                # API routes
    issues/
      route.ts        # GET /api/issues, POST /api/issues
      [id]/
        route.ts      # GET/PUT/DELETE /api/issues/:id
  actions/            # Server Actions
    issues.ts         # Issue-related mutations
  globals.css         # Global styles

components/
  ui/                 # shadcn/ui components
    button.tsx
    card.tsx
  issues/             # Issue-specific components
    IssueCard.tsx     # Can be Server or Client
    IssueList.tsx     # Usually Client (interactivity)
    FilterBar.tsx     # Client Component
  shared/             # Reusable components
    Sidebar.tsx
    Header.tsx

lib/
  db.ts               # Prisma client singleton
  utils.ts            # Utility functions (cn, etc.)
  hooks/              # Custom React hooks
    useDebounce.ts
    useLocalStorage.ts
  validations/        # Zod schemas
    issue.ts

types/
  api.d.ts            # API types
  database.d.ts       # Prisma extensions

prisma/
  schema.prisma       # Database schema
  migrations/         # Migration history
  seed.ts             # Seed script
```

---

## Naming Conventions

**Files**:

- Components: `PascalCase.tsx`
- Hooks: `use*.ts`
- Utilities: `kebab-case.ts`
- Types: `*.types.ts` or in `types/` folder

**Components**:

- PascalCase: `IssueCard`, `SearchBar`
- Descriptive: `IssueListCard` not `Card1`

**Props**:

- camelCase: `isOpen`, `onClick`, `hasError`
- Booleans: `is`, `has`, `should`, `can` prefix
- Callbacks: `on` prefix

---

## Best Practices

### TypeScript

**Always type props**:

```typescript
interface Props {
  issue: Issue;
  onUpdate?: (issue: Issue) => void;
}
```

**Use type inference**:

```typescript
const issues = await prisma.issue.findMany(); // Type inferred
```

**Create reusable types**:

```typescript
export type IssueWithRelations = Issue & {
  assignee: User | null;
  labels: Label[];
};
```

### Component Composition

**Prefer composition over props drilling**:

❌ Bad:

```typescript
<IssueCard issue={issue} onUpdate={onUpdate} onDelete={onDelete} theme={theme} />
```

✅ Good:

```typescript
<IssueCard issue={issue}>
  <IssueActions onUpdate={onUpdate} onDelete={onDelete} />
</IssueCard>
```

### Accessibility

**Always include ARIA labels**:

```tsx
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>
```

**Keyboard navigation**:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={onClick}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
>
```

---

**This file documents HOW we build. See project-brief.md for WHAT and WHY.**

---

Last reviewed: 2025-11-06

---

## MCP Tools & Agent Patterns

### MCP Server Architecture

**Protocol**: Model Context Protocol (MCP) via stdio transport
**SDK**: @modelcontextprotocol/sdk
**Tool Count**: 42 tools across 8 categories

**Architecture Pattern**: Single MCP server serves all 42 tools

```typescript
// MCP server initialization
import { McpServer } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

const server = new McpServer({
  name: 'projectpulse-mcp',
  version: '1.0.0',
});

// Tool registration pattern
server.tool('sprint.phase.create', createPhaseSchema, async (params) => {
  // 1. Validate input
  // 2. Execute database operation
  // 3. Return result
});

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Naming Convention

**Pattern**: `<category>.<entity>.<action>`

**Examples**:

- `sprint.phase.create` - Create new phase
- `sprint.getCurrentTask` - Get active task
- `knowledge.query` - Search knowledge graph
- `workflow.completeStep` - Mark workflow step complete

### Tool Implementation Pattern

```typescript
// 1. Define Zod schema for validation
const createPhaseSchema = z.object({
  title: z.string().min(1).max(200),
  startDate: z.date(),
  goals: z.array(z.string()),
  duration: z.number().int().min(1).max(52),
});

// 2. Implement handler
async function createPhase(params: z.infer<typeof createPhaseSchema>) {
  try {
    // 3. Validate input (Zod already does this)

    // 4. Execute Prisma operation
    const phase = await prisma.phase.create({
      data: {
        title: params.title,
        startDate: params.startDate,
        goals: params.goals,
        status: 'PLANNED',
        progress: 0.0,
      },
    });

    // 5. Auto-create child weeks based on duration
    const weeks = await createWeeksForPhase(phase.id, params.duration);

    // 6. Return success result
    return {
      success: true,
      phaseId: phase.id,
      weeksCount: weeks.length,
    };
  } catch (error) {
    // 7. Error handling
    return {
      success: false,
      error: error.message,
    };
  }
}

// 3. Register tool
server.tool('sprint.phase.create', createPhaseSchema, createPhase);
```

### Progress Roll-Up Algorithm

**Pattern**: Bottom-up propagation (Session → Task → Day → Week → Phase)

```typescript
async function updateProgress(
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',
  entityId: number,
  progress: number
) {
  // 1. Update current entity
  await prisma[entityType].update({
    where: { id: entityId },
    data: { progress },
  });

  // 2. Calculate parent progress (average of all children)
  const parent = await getParent(entityType, entityId);
  if (parent) {
    const siblings = await getChildren(parent.type, parent.id);
    const avgProgress = siblings.reduce((sum, s) => sum + s.progress, 0) / siblings.length;

    // 3. Recursively update parent
    await updateProgress(parent.type, parent.id, avgProgress);
  }

  // 4. Trigger markdown sync if top-level (Phase) updated
  if (entityType === 'phase') {
    await syncMarkdownFiles();
  }
}
```

### Markdown Sync Pattern

**Pattern**: Database → Markdown (one-way, read-only markdown)

```typescript
async function syncMarkdownFiles() {
  // 1. Fetch latest data from database
  const currentTask = await prisma.task.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      day: { include: { week: { include: { phase: true } } } },
      sessions: { orderBy: { timestamp: 'desc' } },
    },
  });

  // 2. Generate STATUS.md content
  const statusContent = generateStatusMarkdown(currentTask);

  // 3. Generate DEVELOPMENT_PLAN.md content
  const planContent = await generatePlanMarkdown();

  // 4. Write to files atomically
  await Promise.all([
    fs.writeFile('.agent/STATUS.md', statusContent),
    fs.writeFile('.agent/DEVELOPMENT_PLAN.md', planContent),
  ]);

  // 5. Log sync to database
  await prisma.markdownFile.create({
    data: {
      filename: 'STATUS.md',
      content: statusContent,
      syncedAt: new Date(),
    },
  });
}
```

### Workflow State Machine Pattern

**Pattern**: Define workflows with steps, track state, enforce ordering

```typescript
// 1. Define workflow
const fiveStepProtocol = {
  name: '5-Step Mandatory Protocol',
  steps: [
    { order: 1, name: 'Initialize Session', required: true },
    { order: 2, name: 'Create Implementation Plan', required: true },
    { order: 3, name: 'Create Todo List', required: true },
    { order: 4, name: 'Implement with Checkpoints', required: true },
    { order: 5, name: 'Post-Completion', required: true },
  ],
};

// 2. Start workflow execution
async function startWorkflow(workflowId: number, taskId: number) {
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      taskId,
      status: 'IN_PROGRESS',
      currentStep: 1,
    },
  });
  return execution;
}

// 3. Complete step with validation
async function completeStep(executionId: number, stepNumber: number) {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: { workflow: { include: { steps: true } } },
  });

  // Validate step ordering
  if (stepNumber !== execution.currentStep) {
    throw new Error(`Cannot skip steps. Expected step ${execution.currentStep}, got ${stepNumber}`);
  }

  // Mark step complete, advance to next
  const nextStep = stepNumber + 1;
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      currentStep: nextStep <= execution.workflow.steps.length ? nextStep : null,
      status: nextStep > execution.workflow.steps.length ? 'COMPLETED' : 'IN_PROGRESS',
    },
  });
}
```

---

## Git-Based Cross-Machine Communication

**Pattern**: Use Git commits as async message queue between Claude Code instances on different machines

### When to Use

**Use Mac Mini for**:
- Docker operations (start/stop/restart containers)
- Database operations (migrations, queries, seeding)
- Service verification (health checks, builds, logs)
- Mac mini-specific setup and configuration

**Use Windows for**:
- All code editing (file operations)
- Git operations (commit, push, pull, branches)
- Documentation updates
- Planning and architecture decisions

### The Problem

ProjectPulse uses a distributed architecture:
- **Windows**: Code editing only (no Docker, no local services)
- **Mac mini (192.168.1.15)**: All runtime services (PostgreSQL, Next.js, MCP server in Docker)

Two separate Claude Code instances (Windows and Mac mini) need to coordinate work. Manual copy-paste is tedious and error-prone.

### The Solution

Use `.agent/task/mac-mini-instructions.md` as a Git-based instruction queue:

1. Windows writes instructions to file
2. Windows commits and pushes
3. User tells Mac mini to "pull git and execute instructions"
4. Mac mini pulls, reads, executes
5. Mac mini updates file with results
6. Mac mini commits and pushes
7. User tells Windows to "pull git and read results"

### Pattern Implementation

**Windows Writes Instructions**:

```typescript
// Windows Claude Code writes to .agent/task/mac-mini-instructions.md
const instructions = `
# Mac Mini Instructions from Windows Claude Code

**Last Updated**: ${new Date().toISOString()}
**Status**: PENDING EXECUTION

## 🎯 TASK: ${taskTitle}

### Context
${contextDescription}

### Instructions

#### Step 1: ${action1Title}
\`\`\`bash
${command1}
\`\`\`
**Expected**: ${expectedOutcome1}

#### Step 2: ${action2Title}
\`\`\`bash
${command2}
\`\`\`

### Report Results
Update this file with:
\`\`\`markdown
## ✅ COMPLETED - ${timestamp}
**Results**:
- Step 1: SUCCESS / FAILED
- Step 2: [outcome]
\`\`\`

## 🎯 Success Criteria
- ✅ ${criterion1}
- ✅ ${criterion2}
`;

// Write, commit, push
fs.writeFileSync('.agent/task/mac-mini-instructions.md', instructions);
execSync('git add .agent/task/mac-mini-instructions.md');
execSync('git commit -m "task: ${taskTitle} for Mac mini"');
execSync('git push origin feature/sprint-1-foundation');

// Tell user
console.log('✅ Instructions committed. On Mac mini: git pull and execute mac-mini-instructions');
```

**Mac Mini Executes**:

```typescript
// Mac mini Claude Code pulls and reads
execSync('cd ~/projects/AI_HUB && git pull origin feature/sprint-1-foundation');
const instructions = fs.readFileSync('.agent/task/mac-mini-instructions.md', 'utf8');

// Parse and execute instructions
const steps = parseInstructionSteps(instructions);
const results = [];

for (const step of steps) {
  try {
    const output = execSync(step.command, { cwd: '~/projects/AI_HUB' });
    results.push({ step: step.title, status: 'SUCCESS', output });
  } catch (error) {
    results.push({ step: step.title, status: 'FAILED', error: error.message });
  }
}

// Update file with results
const updatedInstructions = instructions + `
## ✅ COMPLETED - ${new Date().toISOString()}

**Results**:
${results.map(r => `- ${r.status}: ${r.step}`).join('\n')}

**Output**:
\`\`\`
${results.map(r => r.output || r.error).join('\n\n')}
\`\`\`
`;

fs.writeFileSync('.agent/task/mac-mini-instructions.md', updatedInstructions);
execSync('git add .agent/task/mac-mini-instructions.md');
execSync('git commit -m "chore: Mac mini ${taskTitle} complete"');
execSync('git push origin feature/sprint-1-foundation');

// Tell user
console.log('✅ Task complete. On Windows: git pull to read results');
```

**Windows Reads Results**:

```typescript
// Windows pulls and reads results
execSync('git pull origin feature/sprint-1-foundation');
const results = fs.readFileSync('.agent/task/mac-mini-instructions.md', 'utf8');

// Parse results section
const completedSection = results.match(/## ✅ COMPLETED[\s\S]*/)?.[0];
if (completedSection.includes('SUCCESS')) {
  console.log('✅ Mac mini task succeeded');
  // Continue with next steps
} else {
  console.log('⚠️ Mac mini task had issues');
  // Analyze errors, send updated instructions
}
```

### Real-World Examples

**Example 1: Rebuild MCP Server**

```markdown
## 🎯 TASK: Rebuild MCP Server

### Instructions
\`\`\`bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
docker-compose -f docker-compose.cloud.yml restart mcp-server
docker-compose -f docker-compose.cloud.yml logs mcp-server | grep -i "error"
\`\`\`

**Expected**: 0 TypeScript errors, server running
```

**Example 2: Query Database**

```markdown
## 🎯 TASK: Get Day IDs for Testing

### Instructions
\`\`\`bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT d.id, d.title
FROM \"Day\" d
JOIN \"Week\" w ON d.\"weekId\" = w.id
JOIN \"Phase\" p ON w.\"phaseId\" = p.id
WHERE p.title = 'Mac Mini Cloud Test'
LIMIT 5;
"
\`\`\`

Report Day IDs in results.
```

### Benefits of This Pattern

✅ **Versioned**: All instructions and results tracked in Git history
✅ **Asynchronous**: Can work at different times
✅ **Reproducible**: Instructions preserved for future reference
✅ **Auditable**: Full history of what was done and when
✅ **Simple**: Uses existing Git workflow, no external tools
✅ **No Copy-Paste**: Eliminates manual text transfer between machines

### Integration with MCP Tools

This pattern complements MCP tools:

**MCP Tools** (Windows → Mac mini services):
```typescript
// Windows Claude Code uses MCP tool to query Mac mini database
const result = await mcp.call('postgres.query', {
  sql: 'SELECT * FROM "Phase" LIMIT 5'
});
```

**Git Communication** (Windows ↔ Mac mini Claude Code):
```markdown
# When Mac mini Claude Code needs to execute Docker commands
Windows commits: "Restart Next.js container, check logs for errors"
Mac mini executes: docker-compose restart nextjs
Mac mini reports: "SUCCESS - container restarted, no errors"
```

**When to Use Each**:
- **MCP Tools**: Windows needs data from Mac mini services (database queries, API calls)
- **Git Communication**: Mac mini Claude Code needs to execute system operations (Docker, migrations, logs)

### File Location

**Instruction File**: `.agent/task/mac-mini-instructions.md`
**Protocol SOP**: `.agent/sops/mac-mini-communication-protocol.md`
**Setup Guide**: `.agent/sops/mac-mini-cloud-architecture.md`

### Architecture Context

**See**: `.agent/tech-context.md` → "Runtime Environment: Mac Mini Cloud" for complete architecture details.

---

**This section documents MCP-specific patterns for agent-first workflows. See project-brief.md for WHAT we're building.**

**Note**: Sprint 9 advanced patterns (Memory Banks, Research Agent Orchestration) are documented in architecture but implementation is deferred to post-MVP. Sprint 1-8 patterns documented above remain current.

---

Last updated: 2025-11-06
