# Architecture Analysis: Issue Detail Page Data Flow

**Date**: 2025-10-27 15:15
**Analyzed By**: analyze-architecture agent
**Project**: ProjectPulse
**Phase**: Week 1.5 Phase 3 Day 4

---

## Executive Summary

This analysis traces the complete data flow for implementing an Issue Detail page in ProjectPulse. The codebase uses **Next.js 14 App Router** with **React Server Components** as the default, **Prisma ORM** for database access, and **API Routes** for external mutations. There are **NO Server Actions** currently implemented - all mutations go through API routes with **Zod validation**.

**Key Finding**: The pattern is **Server Components for data fetching** + **Client Components for interactivity** + **API Routes for mutations** (not Server Actions).

---

## Data Flow Architecture

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ISSUE DETAIL PAGE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐         ┌─────────────────────────────────┐  │
│  │ Server Component │ ──────► │ Prisma Query (Direct DB Access) │  │
│  │  page.tsx        │         │   - Issue with relations        │  │
│  │                  │         │   - Comments (ordered)          │  │
│  │ - Fetch issue    │         │   - Attachments                 │  │
│  │ - Fetch comments │ ◄────── │   - Labels                      │  │
│  │ - Fetch timeline │         │   - Linked files/commits        │  │
│  └──────┬───────────┘         └─────────────────────────────────┘  │
│         │                                                            │
│         │ Props (serialized data)                                   │
│         ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │           Client Components (Interactivity)                  │   │
│  │                                                              │   │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │   │
│  │  │ CommentForm  │   │ StatusChange │   │ CommentList  │   │   │
│  │  │              │   │   Dropdown   │   │              │   │   │
│  │  │ - Input      │   │ - Select     │   │ - Display    │   │   │
│  │  │ - Submit btn │   │ - onChange   │   │ - Optimistic │   │   │
│  │  └──────┬───────┘   └──────┬───────┘   └──────────────┘   │   │
│  │         │                  │                               │   │
│  │         │                  │                               │   │
│  └─────────┼──────────────────┼───────────────────────────────┘   │
│            │                  │                                     │
│            ▼                  ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              API Routes (Mutation Handlers)                  │   │
│  │                                                              │   │
│  │  POST /api/issues/[id]/comments                             │   │
│  │  PATCH /api/issues/[id]/status                              │   │
│  │                                                              │   │
│  │  1. Zod Validation                                          │   │
│  │  2. Prisma Mutation                                         │   │
│  │  3. revalidatePath() (cache refresh)                        │   │
│  │  4. Return { data, error }                                  │   │
│  └─────────────────┬───────────────────────────────────────────┘   │
│                    │                                                │
│                    ▼                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Client Component Response Handling                          │   │
│  │  - Update optimistic UI                                      │   │
│  │  - Show success/error toast                                  │   │
│  │  - router.refresh() (Next.js re-fetches Server Component)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1. Database Query Patterns

### 1.1 Prisma Client Setup

**File**: `apps/web/lib/prisma.ts`

```typescript
// Singleton pattern - prevents multiple Prisma clients in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Key Points**:

- ✅ Singleton pattern for hot reload safety
- ✅ Query logging in development
- ✅ Imported directly in Server Components

---

### 1.2 Issue List Query Pattern (Reference Implementation)

**File**: `apps/web/app/issues/page.tsx` (lines 99-115)

```typescript
const [issues, totalCount] = await Promise.all([
  prisma.issue.findMany({
    where,
    include: {
      comments: {
        select: { id: true }, // Count only - minimal data
      },
      attachments: {
        select: { id: true }, // Count only
      },
    },
    orderBy,
    take: perPage,
    skip: (page - 1) * perPage,
  }),
  prisma.issue.count({ where }),
]);
```

**Strategy**:

- ✅ **Parallel queries** with `Promise.all()` for performance
- ✅ **Minimal data selection** (`select: { id: true }`) for counts
- ✅ **Relations included** via `include` (not nested queries)
- ✅ **Pagination** with `take` and `skip`

---

### 1.3 Recommended Query Pattern for Issue Detail Page

**File**: `apps/web/app/issues/[id]/page.tsx` (to be created)

```typescript
async function getIssueDetail(id: number) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      // Full comment data with author info
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          author: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      // Full attachment data
      attachments: {
        select: {
          id: true,
          filename: true,
          filepath: true,
          mimetype: true,
          size: true,
          uploadedAt: true,
        },
      },

      // Labels (many-to-many)
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },

      // Linked files
      linkedFiles: {
        select: {
          id: true,
          filePath: true,
          lineNumber: true,
          createdAt: true,
        },
      },

      // Linked commits
      linkedCommits: {
        orderBy: { commitDate: 'desc' },
        take: 10, // Limit recent commits
        select: {
          id: true,
          commitHash: true,
          commitMessage: true,
          commitDate: true,
        },
      },

      // Project context
      project: {
        select: {
          id: true,
          name: true,
          repository: true,
        },
      },
    },
  });

  if (!issue) {
    notFound(); // Next.js 404 helper
  }

  return issue;
}
```

**Why this pattern?**:

- ✅ **Single query** with all relations (efficient - no N+1 queries)
- ✅ **Selective fields** via `select` (avoid over-fetching)
- ✅ **Ordered comments** (ASC for chronological display)
- ✅ **Limited commits** (avoid huge payloads)
- ✅ **Type-safe** (Prisma generates exact TypeScript types)

---

### 1.4 Database Schema Relations

**File**: `apps/web/prisma/schema.prisma` (lines 56-100)

```prisma
model Issue {
  id            Int       @id @default(autoincrement())
  title         String
  description   String?   @db.Text
  status        String    @default("open")
  priority      String    @default("medium")
  module        String?
  assignee      String?

  // Relations
  projectId     Int
  project       Project   @relation(...)

  labels        Label[]           // Many-to-many (implicit join table)
  comments      Comment[]         // One-to-many
  attachments   Attachment[]      // One-to-many
  linkedFiles   LinkedFile[]      // One-to-many
  linkedCommits LinkedCommit[]    // One-to-many

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  closedAt      DateTime?
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  author    String?

  issueId   Int
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([issueId])
  @@index([createdAt(sort: Desc)])
}
```

**Key Relationships**:

- ✅ **Cascade deletes** on Issue → Comments/Attachments
- ✅ **Indexed foreign keys** for performance
- ✅ **Timestamps** on all entities (createdAt, updatedAt)
- ✅ **Optional closedAt** for status tracking

---

## 2. Server Component to Client Component Data Flow

### 2.1 Server Component Pattern (Data Fetching)

**File**: `apps/web/app/issues/page.tsx` (lines 158-165)

```typescript
export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // 1. Await search params (Next.js 15 async pattern)
  const params = await searchParams;

  // 2. Fetch data in parallel
  const [{ issues, totalCount, currentPage, totalPages, perPage }, filterCounts] =
    await Promise.all([getIssues(params), getFilterCounts()]);

  // 3. Render layout with Client Components
  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 gap-4 overflow-hidden">
          {/* Pass data as props to Client Components */}
          <FilterSidebar counts={filterCounts} searchParams={params} />
          <SearchSortBar searchParams={params} />

          {/* Map over server-fetched data */}
          {issues.map((issue) => (
            <IssueListCard
              key={issue.id}
              issue={{
                id: issue.id.toString(),
                title: issue.title,
                // ... transform Prisma data to component props
              }}
            />
          ))}
        </main>
      </div>
    </>
  );
}
```

**Data Flow Rules**:

- ✅ **Server Component is async** - can await database queries directly
- ✅ **Data passed as props** - serialized to Client Components
- ✅ **Data transformation** - Prisma types → Component prop types
- ✅ **Dates converted to strings** - JSON serialization requirement

---

### 2.2 Client Component Pattern (Interactivity)

**File**: `apps/web/components/issues/SearchSortBar.tsx` (lines 24-64)

```typescript
'use client';  // Required for hooks and interactivity

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function SearchSortBar({ searchParams }: SearchSortBarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // 1. Local state for immediate feedback
  const [searchValue, setSearchValue] = useState(searchParams.search || '');

  // 2. Debounced value for URL updates
  const debouncedSearch = useDebounce(searchValue, 300);

  // 3. Update URL → triggers Server Component re-render
  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams?.toString());
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }
    router.push(`/issues?${params.toString()}`);  // ← Server Component re-fetches
  }, [debouncedSearch]);

  return (
    <input
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}  // ← Local state update
    />
  );
}
```

**Key Patterns**:

- ✅ **`'use client'` directive** - marks boundary
- ✅ **Props from Server Component** - initial state
- ✅ **useState for UI state** - immediate feedback
- ✅ **router.push() updates URL** - triggers Server Component re-fetch
- ✅ **Debouncing** - avoid excessive re-renders

---

### 2.3 Recommended Pattern for Issue Detail

```typescript
// apps/web/app/issues/[id]/page.tsx (Server Component)
export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssueDetail(parseInt(id, 10));

  return (
    <div>
      {/* Server-rendered issue header */}
      <IssueHeader
        title={issue.title}
        status={issue.status}
        priority={issue.priority}
      />

      {/* Client Component for status changes */}
      <StatusChangeDropdown
        issueId={issue.id}
        currentStatus={issue.status}
      />

      {/* Server-rendered comment list (initial data) */}
      <CommentList
        issueId={issue.id}
        initialComments={issue.comments}  // ← Pass as prop
      />

      {/* Client Component for adding comments */}
      <CommentForm issueId={issue.id} />
    </div>
  );
}
```

---

## 3. API Route Response Patterns

### 3.1 Current API Route Pattern (Reference)

**File**: `apps/web/app/api/preferences/route.ts` (lines 14-44)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 1. Zod validation schema
const PreferencesSchema = z.object({
  theme: z.enum(['desert', 'neon', 'earthy', 'coral']),
});

export async function PATCH(request: NextRequest) {
  try {
    // 2. Parse and validate request body
    const body = await request.json();
    const { theme } = PreferencesSchema.parse(body);

    // 3. Perform database mutation
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { theme },
      create: { userId, theme },
    });

    // 4. Return standard response format
    return NextResponse.json({ data: preferences, error: null });
  } catch (error) {
    // 5. Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: 'Invalid theme value', details: error.errors },
        { status: 400 }
      );
    }

    // 6. Handle other errors
    console.error('Preferences API error:', error);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
```

**Response Format Standard**:

```typescript
// Success
{ data: T, error: null }

// Validation Error (400)
{ data: null, error: string, details?: ZodError[] }

// Server Error (500)
{ data: null, error: string }
```

---

### 3.2 Recommended API Routes for Issue Detail

#### POST /api/issues/[id]/comments

```typescript
// apps/web/app/api/issues/[id]/comments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schema
const CommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(10000),
  author: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const issueId = parseInt(id, 10);

    // Validate request
    const body = await request.json();
    const validatedData = CommentSchema.parse(body);

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        author: validatedData.author || 'Anonymous',
        issueId,
      },
      include: {
        issue: {
          select: { id: true, title: true },
        },
      },
    });

    // Revalidate issue detail page (clears Next.js cache)
    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({ data: comment, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: 'Invalid comment data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Comment creation error:', error);
    return NextResponse.json({ data: null, error: 'Failed to create comment' }, { status: 500 });
  }
}
```

#### PATCH /api/issues/[id]/status

```typescript
// apps/web/app/api/issues/[id]/status/route.ts

const StatusUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const issueId = parseInt(id, 10);

    const body = await request.json();
    const { status } = StatusUpdateSchema.parse(body);

    // Update issue status
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status,
        closedAt: status === 'closed' ? new Date() : null,
      },
      include: {
        comments: { select: { id: true } },
        attachments: { select: { id: true } },
      },
    });

    // Revalidate both list and detail pages
    revalidatePath('/issues');
    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({ data: issue, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: 'Invalid status value', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Status update error:', error);
    return NextResponse.json({ data: null, error: 'Failed to update status' }, { status: 500 });
  }
}
```

---

## 4. Cache Revalidation Pattern

### 4.1 Current Cache Behavior

**Current Implementation**: ❌ No revalidation found in codebase

- Issues list is cached by Next.js Server Component cache
- No manual cache invalidation after mutations
- **Issue**: Stale data after creating/updating issues

---

### 4.2 Recommended Revalidation Strategy

**Import**: `import { revalidatePath } from 'next/cache';`

**When to use**:

```typescript
// After POST /api/issues/[id]/comments
revalidatePath(`/issues/${issueId}`); // Refresh detail page

// After PATCH /api/issues/[id]/status
revalidatePath('/issues'); // Refresh list page
revalidatePath(`/issues/${issueId}`); // Refresh detail page

// After DELETE /api/issues/[id]
revalidatePath('/issues'); // Refresh list page
```

**Alternative: Client-side refresh**

```typescript
// In Client Component after mutation
import { useRouter } from 'next/navigation';

const router = useRouter();

async function handleSubmit() {
  const res = await fetch('/api/issues/1/comments', { method: 'POST', ... });
  if (res.ok) {
    router.refresh();  // Re-fetches Server Component data
  }
}
```

**Recommendation**: Use **both**:

- `revalidatePath()` in API route (clears cache globally)
- `router.refresh()` in Client Component (immediate UI update)

---

## 5. TypeScript Type Safety

### 5.1 Prisma Generated Types

**File**: `node_modules/.prisma/client/index.d.ts` (auto-generated)

```typescript
// Prisma generates exact types from schema
export type Issue = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  module: string | null;
  assignee: string | null;
  customFields: Prisma.JsonValue | null;
  searchVector: string | null;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
};

// Include types for relations
export type IssueWithRelations = Issue & {
  comments: Comment[];
  attachments: Attachment[];
  labels: Label[];
  linkedFiles: LinkedFile[];
  linkedCommits: LinkedCommit[];
};
```

**Usage in Server Component**:

```typescript
import { Prisma } from '@prisma/client';

// Get exact type from Prisma query
type IssueDetailPayload = Prisma.IssueGetPayload<{
  include: {
    comments: true;
    attachments: true;
    labels: true;
  };
}>;

async function getIssueDetail(id: number): Promise<IssueDetailPayload | null> {
  return prisma.issue.findUnique({
    where: { id },
    include: {
      comments: true,
      attachments: true,
      labels: true,
    },
  });
}
```

---

### 5.2 Component Props Types

**Current Pattern** (from `IssueListCard.tsx`):

```typescript
// Custom type for component props (transformed from Prisma type)
interface IssueListCardProps {
  issue: {
    id: string; // Transformed: number → string
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low'; // Narrowed from string
    module: string;
    status: 'open' | 'in_progress' | 'closed'; // Narrowed from string
    assignee: string;
    createdAt: Date;
    commentsCount: number; // Derived from relation count
    attachmentsCount: number;
  };
}
```

**Why transformation?**:

- ✅ **String IDs for URLs** - easier client-side routing
- ✅ **Literal types** - better type safety than `string`
- ✅ **Derived fields** - counts instead of full arrays
- ✅ **Serialization-safe** - Dates remain Dates in Server Components

---

### 5.3 Recommended Type Structure

```typescript
// apps/web/types/issue.ts (to be created)

import { Prisma } from '@prisma/client';

// 1. Server-side type (from Prisma query)
export type IssueDetail = Prisma.IssueGetPayload<{
  include: {
    comments: {
      select: {
        id: true;
        content: true;
        author: true;
        createdAt: true;
        updatedAt: true;
      };
    };
    attachments: true;
    labels: true;
    linkedFiles: true;
    linkedCommits: true;
    project: {
      select: {
        id: true;
        name: true;
        repository: true;
      };
    };
  };
}>;

// 2. Client-side type (serialized for props)
export interface IssueDetailProps {
  id: string; // number → string
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  module: string | null;
  assignee: string | null;
  createdAt: string; // Date → string (JSON serialization)
  updatedAt: string;
  closedAt: string | null;

  project: {
    id: string;
    name: string;
    repository: string | null;
  };

  comments: Array<{
    id: string;
    content: string;
    author: string | null;
    createdAt: string;
    updatedAt: string;
  }>;

  attachments: Array<{
    id: string;
    filename: string;
    filepath: string;
    mimetype: string;
    size: number;
    uploadedAt: string;
  }>;

  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

// 3. Helper to transform Prisma → Props
export function serializeIssueDetail(issue: IssueDetail): IssueDetailProps {
  return {
    id: issue.id.toString(),
    title: issue.title,
    description: issue.description,
    status: issue.status as IssueDetailProps['status'],
    priority: issue.priority as IssueDetailProps['priority'],
    module: issue.module,
    assignee: issue.assignee,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    closedAt: issue.closedAt?.toISOString() || null,

    project: {
      id: issue.project.id.toString(),
      name: issue.project.name,
      repository: issue.project.repository,
    },

    comments: issue.comments.map((c) => ({
      id: c.id.toString(),
      content: c.content,
      author: c.author,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),

    attachments: issue.attachments.map((a) => ({
      id: a.id.toString(),
      filename: a.filename,
      filepath: a.filepath,
      mimetype: a.mimetype,
      size: a.size,
      uploadedAt: a.uploadedAt.toISOString(),
    })),

    labels: issue.labels.map((l) => ({
      id: l.id.toString(),
      name: l.name,
      color: l.color,
    })),
  };
}
```

---

## 6. Complete Implementation Flow

### Step-by-Step: Add Comment to Issue

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Click "Add Comment" button                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CLIENT COMPONENT: CommentForm.tsx                            │
│                                                                  │
│    'use client';                                                │
│                                                                  │
│    async function handleSubmit(e: FormEvent) {                  │
│      e.preventDefault();                                        │
│      setIsSubmitting(true);                                     │
│                                                                  │
│      // Optimistic update (optional)                            │
│      setOptimisticComment({ id: 'temp', content, ... });       │
│                                                                  │
│      try {                                                       │
│        const res = await fetch(`/api/issues/${issueId}/comments`, {│
│          method: 'POST',                                        │
│          headers: { 'Content-Type': 'application/json' },      │
│          body: JSON.stringify({ content, author }),            │
│        });                                                       │
│                                                                  │
│        const { data, error } = await res.json();               │
│                                                                  │
│        if (error) {                                             │
│          toast.error(error);                                    │
│          return;                                                │
│        }                                                         │
│                                                                  │
│        // Clear form, show success                              │
│        setContent('');                                          │
│        toast.success('Comment added!');                         │
│                                                                  │
│        // Trigger Server Component re-fetch                     │
│        router.refresh();                                        │
│                                                                  │
│      } catch (err) {                                            │
│        toast.error('Failed to add comment');                    │
│      } finally {                                                │
│        setIsSubmitting(false);                                  │
│      }                                                           │
│    }                                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. API ROUTE: POST /api/issues/[id]/comments/route.ts          │
│                                                                  │
│    export async function POST(request, { params }) {            │
│      const { id } = await params;                               │
│      const issueId = parseInt(id, 10);                          │
│                                                                  │
│      // Zod validation                                          │
│      const body = await request.json();                         │
│      const { content, author } = CommentSchema.parse(body);     │
│                                                                  │
│      // Prisma mutation                                         │
│      const comment = await prisma.comment.create({              │
│        data: { content, author, issueId },                      │
│      });                                                         │
│                                                                  │
│      // Clear Next.js cache                                     │
│      revalidatePath(`/issues/${issueId}`);                      │
│                                                                  │
│      return NextResponse.json({ data: comment, error: null });  │
│    }                                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DATABASE: PostgreSQL                                         │
│                                                                  │
│    INSERT INTO comments (content, author, issue_id,             │
│                          created_at, updated_at)                │
│    VALUES ($1, $2, $3, NOW(), NOW())                            │
│    RETURNING *;                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE: API → Client                                       │
│                                                                  │
│    {                                                             │
│      data: {                                                    │
│        id: 42,                                                  │
│        content: "Great idea!",                                  │
│        author: "John Doe",                                      │
│        issueId: 7,                                              │
│        createdAt: "2025-10-27T15:30:00.000Z",                  │
│        updatedAt: "2025-10-27T15:30:00.000Z"                   │
│      },                                                          │
│      error: null                                                │
│    }                                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CLIENT COMPONENT: Handle success                             │
│                                                                  │
│    - Clear optimistic update                                    │
│    - Show success toast                                         │
│    - Reset form                                                 │
│    - Call router.refresh()                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. NEXT.JS CACHE: Revalidation                                  │
│                                                                  │
│    revalidatePath(`/issues/${issueId}`) cleared cache           │
│    router.refresh() triggers Server Component re-render         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. SERVER COMPONENT: Re-fetch issue with new comment            │
│                                                                  │
│    export default async function IssueDetailPage({ params }) {  │
│      const issue = await getIssueDetail(id);  // Fresh query    │
│                                                                  │
│      return (                                                    │
│        <CommentList                                             │
│          initialComments={issue.comments}  // ← New comment!   │
│        />                                                        │
│      );                                                          │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Key Integration Points

### 7.1 File Structure

```
apps/web/
├── app/
│   ├── issues/
│   │   ├── page.tsx                    ← List page (Server Component)
│   │   └── [id]/
│   │       └── page.tsx                ← Detail page (Server Component) [NEW]
│   │
│   └── api/
│       └── issues/
│           └── [id]/
│               ├── comments/
│               │   └── route.ts        ← POST /api/issues/[id]/comments [NEW]
│               └── status/
│                   └── route.ts        ← PATCH /api/issues/[id]/status [NEW]
│
├── components/
│   └── issues/
│       ├── IssueHeader.tsx             ← Display issue title/metadata [NEW]
│       ├── StatusChangeDropdown.tsx    ← Change status (Client) [NEW]
│       ├── CommentList.tsx             ← Display comments (Client) [NEW]
│       ├── CommentForm.tsx             ← Add comment (Client) [NEW]
│       └── AttachmentList.tsx          ← Display attachments [NEW]
│
├── lib/
│   └── prisma.ts                       ← Prisma client singleton [EXISTS]
│
└── types/
    └── issue.ts                        ← Type definitions [NEW]
```

---

### 7.2 Dependencies Check

**Current `package.json`** (from existing code):

```json
{
  "dependencies": {
    "next": "^15.0.3",           ✅ App Router with Server Components
    "@prisma/client": "^5.22.0", ✅ Database ORM
    "zod": "^3.23.8",            ✅ Validation
    "date-fns": "^4.1.0",        ✅ Date formatting
    "clsx": "^2.1.1",            ✅ Conditional classes
    "tailwind-merge": "^2.5.5"   ✅ Tailwind utilities
  }
}
```

**Additional Dependencies Needed**: ❌ None! All required libraries already installed.

---

## 8. Architectural Observations

### ✅ Strengths

1. **Server Components First** - Default async data fetching pattern
2. **Prisma Singleton** - Proper connection pooling in development
3. **Parallel Queries** - `Promise.all()` for performance
4. **Selective Includes** - Avoid over-fetching with `select`
5. **Zod Validation** - Runtime type safety in API routes
6. **Consistent Response Format** - `{ data, error }` pattern
7. **TypeScript Strict** - Zero `any` types in codebase
8. **Debouncing** - Optimized search with custom hook

---

### ⚠️ Concerns

1. **No Cache Revalidation** - Stale data after mutations
   - **Fix**: Add `revalidatePath()` in API routes

2. **No Server Actions** - All mutations through API routes
   - **Note**: This is fine! API routes work well for external access (MCP tools)
   - **Consideration**: Server Actions could simplify form handling (progressive enhancement)

3. **String-based Status/Priority** - Not enums in Prisma schema
   - **Risk**: Typos like `"opne"` instead of `"open"` won't be caught at DB level
   - **Fix**: Use Prisma enums or add CHECK constraints in PostgreSQL

4. **No Optimistic Updates** - UI feels sluggish during mutations
   - **Fix**: Add optimistic UI updates in Client Components

5. **No Error Boundary** - Client Components could crash entire page
   - **Fix**: Add React Error Boundaries

---

### 💡 Recommendations

1. **Add `revalidatePath()` to all mutation endpoints**

   ```typescript
   // After every mutation
   revalidatePath('/issues');
   revalidatePath(`/issues/${issueId}`);
   ```

2. **Consider Server Actions for forms** (optional)

   ```typescript
   // apps/web/app/issues/[id]/actions.ts
   'use server';

   export async function addComment(formData: FormData) {
     const content = formData.get('content');
     // ... validation, mutation, revalidation
     redirect(`/issues/${issueId}`);
   }
   ```

   **Pros**: Progressive enhancement, no JavaScript needed
   **Cons**: Less flexible than API routes (no MCP access)

3. **Create shared Zod schemas**

   ```typescript
   // apps/web/lib/validations/issue.ts
   export const CommentSchema = z.object({
     content: z.string().min(1).max(10000),
     author: z.string().optional(),
   });

   export const StatusUpdateSchema = z.object({
     status: z.enum(['open', 'in_progress', 'closed']),
   });
   ```

4. **Use Prisma enums for status/priority**

   ```prisma
   enum IssueStatus {
     OPEN
     IN_PROGRESS
     CLOSED
   }

   model Issue {
     status IssueStatus @default(OPEN)
   }
   ```

5. **Add optimistic updates**

   ```typescript
   // In CommentForm.tsx
   const [optimisticComments, setOptimisticComments] = useState([]);

   async function handleSubmit() {
     const tempId = `temp-${Date.now()}`;
     setOptimisticComments([...optimisticComments, { id: tempId, content, ... }]);

     const res = await fetch(...);

     if (res.ok) {
       setOptimisticComments([]);  // Clear on success
       router.refresh();
     }
   }
   ```

---

## 9. Implementation Checklist for Issue Detail Page

### Phase 1: Server Component Setup

- [ ] Create `apps/web/app/issues/[id]/page.tsx`
- [ ] Implement `getIssueDetail()` function with Prisma query
- [ ] Add `include` for all relations (comments, attachments, labels, etc.)
- [ ] Handle 404 with `notFound()` helper
- [ ] Create type definitions in `apps/web/types/issue.ts`
- [ ] Add serialization helper `serializeIssueDetail()`

### Phase 2: Client Components

- [ ] Create `IssueHeader.tsx` - Display title, metadata, badges
- [ ] Create `StatusChangeDropdown.tsx` - Change status (Client Component)
- [ ] Create `CommentList.tsx` - Display comments with timestamps
- [ ] Create `CommentForm.tsx` - Add new comments
- [ ] Create `AttachmentList.tsx` - Display file attachments
- [ ] Add `TimelineView.tsx` - Show activity history (optional)

### Phase 3: API Routes

- [ ] Create `POST /api/issues/[id]/comments/route.ts`
  - [ ] Zod validation with `CommentSchema`
  - [ ] Prisma `comment.create()`
  - [ ] `revalidatePath()` for cache invalidation
  - [ ] Return `{ data, error }` format

- [ ] Create `PATCH /api/issues/[id]/status/route.ts`
  - [ ] Zod validation with `StatusUpdateSchema`
  - [ ] Prisma `issue.update()`
  - [ ] Set `closedAt` when status = 'closed'
  - [ ] `revalidatePath()` for both list and detail pages
  - [ ] Return updated issue

### Phase 4: Validation & Types

- [ ] Create `apps/web/lib/validations/issue.ts`
  - [ ] `CommentSchema`
  - [ ] `StatusUpdateSchema`
  - [ ] `AttachmentSchema` (future)

- [ ] Create `apps/web/types/issue.ts`
  - [ ] `IssueDetail` type (from Prisma)
  - [ ] `IssueDetailProps` type (for components)
  - [ ] `serializeIssueDetail()` helper

### Phase 5: Optimistic UI & UX

- [ ] Add optimistic comment rendering in `CommentList.tsx`
- [ ] Add loading states (`isSubmitting`) in forms
- [ ] Add success/error toast notifications
- [ ] Add `router.refresh()` after successful mutations
- [ ] Add form reset after successful submission

### Phase 6: Error Handling

- [ ] Add React Error Boundary around Client Components
- [ ] Add Zod error display in forms
- [ ] Add 404 page for non-existent issues
- [ ] Add database error handling in API routes

### Phase 7: Testing

- [ ] Unit tests for Zod schemas
- [ ] Integration tests for API routes
- [ ] React Testing Library tests for Client Components
- [ ] Playwright E2E test for complete flow:
  - [ ] Open issue detail page
  - [ ] Add comment
  - [ ] Change status
  - [ ] Verify UI updates

---

## 10. File Templates

### Template 1: Issue Detail Page

```typescript
// apps/web/app/issues/[id]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { IssueHeader } from '@/components/issues/IssueHeader';
import { StatusChangeDropdown } from '@/components/issues/StatusChangeDropdown';
import { CommentList } from '@/components/issues/CommentList';
import { CommentForm } from '@/components/issues/CommentForm';
import { serializeIssueDetail } from '@/types/issue';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id: parseInt(id, 10) },
    select: { title: true },
  });

  return {
    title: issue ? `${issue.title} | Issues` : 'Issue Not Found',
  };
}

async function getIssueDetail(id: number) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          author: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      attachments: true,
      labels: true,
      linkedFiles: true,
      linkedCommits: {
        orderBy: { commitDate: 'desc' },
        take: 10,
      },
      project: {
        select: {
          id: true,
          name: true,
          repository: true,
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  return issue;
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issueId = parseInt(id, 10);
  const issue = await getIssueDetail(issueId);
  const serializedIssue = serializeIssueDetail(issue);

  return (
    <div className="content-wrapper p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Issue Header */}
        <IssueHeader
          title={serializedIssue.title}
          status={serializedIssue.status}
          priority={serializedIssue.priority}
          module={serializedIssue.module}
          assignee={serializedIssue.assignee}
          createdAt={serializedIssue.createdAt}
        />

        {/* Status Change */}
        <StatusChangeDropdown
          issueId={serializedIssue.id}
          currentStatus={serializedIssue.status}
        />

        {/* Description */}
        <div className="neu-raised rounded-3xl p-6">
          <p className="text-white">{serializedIssue.description}</p>
        </div>

        {/* Comments Section */}
        <div className="neu-raised rounded-3xl p-6">
          <h3 className="mb-4 text-xl font-bold text-white">
            Comments ({serializedIssue.comments.length})
          </h3>

          <CommentList
            issueId={serializedIssue.id}
            initialComments={serializedIssue.comments}
          />

          <div className="mt-6">
            <CommentForm issueId={serializedIssue.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Template 2: Comment Form (Client Component)

```typescript
// apps/web/components/issues/CommentForm.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  issueId: string;
}

export function CommentForm({ issueId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          author: 'Current User',  // TODO: Get from auth session
        }),
      });

      const { data, error: apiError } = await res.json();

      if (apiError) {
        setError(apiError);
        return;
      }

      // Success - clear form and refresh
      setContent('');
      router.refresh();  // Re-fetch Server Component

    } catch (err) {
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={4}
        className="neu-pressed smooth-transition w-full rounded-2xl p-4 text-white focus:outline-none"
        disabled={isSubmitting}
        required
      />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="coral-gradient smooth-transition rounded-2xl px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add Comment'}
      </button>
    </form>
  );
}
```

### Template 3: API Route for Comments

```typescript
// apps/web/app/api/issues/[id]/comments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(10000),
  author: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const issueId = parseInt(id, 10);

    // Validate request body
    const body = await request.json();
    const validatedData = CommentSchema.parse(body);

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        author: validatedData.author || 'Anonymous',
        issueId,
      },
    });

    // Revalidate issue detail page
    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({ data: comment, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: 'Invalid comment data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Comment creation error:', error);
    return NextResponse.json({ data: null, error: 'Failed to create comment' }, { status: 500 });
  }
}
```

---

## Summary

### Architecture Pattern: **Server Components + API Routes**

```
┌─────────────────────────────────────────────────────────────┐
│                   MOKSHA DEVHUB PATTERN                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Server Components (Data Fetching)                          │
│  ├── Direct Prisma queries                                  │
│  ├── Parallel data loading                                  │
│  ├── Selective includes                                     │
│  └── Pass serialized props to Client Components             │
│                                                              │
│  Client Components (Interactivity)                          │
│  ├── Forms with useState                                    │
│  ├── Debounced inputs                                       │
│  ├── Optimistic updates                                     │
│  └── Call API routes for mutations                          │
│                                                              │
│  API Routes (Mutations)                                     │
│  ├── Zod validation                                         │
│  ├── Prisma mutations                                       │
│  ├── revalidatePath() for cache                             │
│  └── Return { data, error }                                 │
│                                                              │
│  Cache Strategy                                             │
│  ├── Next.js caches Server Components by default            │
│  ├── revalidatePath() in API routes (server-side)           │
│  └── router.refresh() in Client Components (client-side)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Files Created for Issue Detail Implementation

1. `apps/web/app/issues/[id]/page.tsx` - Server Component (detail page)
2. `apps/web/components/issues/CommentForm.tsx` - Client Component
3. `apps/web/components/issues/CommentList.tsx` - Client Component
4. `apps/web/components/issues/StatusChangeDropdown.tsx` - Client Component
5. `apps/web/app/api/issues/[id]/comments/route.ts` - API endpoint
6. `apps/web/app/api/issues/[id]/status/route.ts` - API endpoint
7. `apps/web/types/issue.ts` - Type definitions
8. `apps/web/lib/validations/issue.ts` - Zod schemas

---

**Report Complete** ✅

This analysis provides a complete architectural understanding for implementing the Issue Detail page following ProjectPulse's established patterns.
