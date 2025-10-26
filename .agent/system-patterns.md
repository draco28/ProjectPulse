# System Patterns & Architecture

**Project**: Moksha DevHub
**Last Updated**: 2025-10-26

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
