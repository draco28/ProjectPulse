# Next.js Implementation Plan: Issue Detail Page

**Created**: 2025-10-29 21:54
**Type**: Dynamic Page with Nested Relations
**Route**: `/issues/[id]`

---

## Executive Summary

**RECOMMENDATION**: **Hybrid Server + Client Component Architecture** (Option C - not listed in original question)

**Rationale**: Issue detail pages have conflicting requirements that neither pure Server nor pure Client Component can satisfy optimally:

1. **SEO critical** → Needs Server-Side Rendering
2. **Real-time updates** (comments, status changes) → Needs Client-Side reactivity
3. **Large nested payload** (6 relations) → Needs streaming and progressive loading
4. **Interactive features** (status toggle, quick actions) → Needs client interactivity
5. **Performance target** (<2s LCP) → Needs optimized initial render + deferred loading

**Architecture**: Server Component shell + Client Components for interactive sections + Streaming for heavy data

---

## Part 1: Architecture Decision

### Option Analysis

#### ❌ Option A: Pure Server Component (Rejected)

**Pros**:

- Excellent initial load performance
- Zero client-side JavaScript for data fetching
- Perfect SEO
- Simple caching strategy

**Cons (Deal-breakers for this use case)**:

- **No real-time updates**: Comments added by other users won't appear without full page reload
- **Interactive features require Server Actions**: Status toggle, quick actions need Server Action + full re-render
- **Poor UX for mutations**: Every action causes full page refresh (even with revalidatePath)
- **No optimistic updates**: User waits for server response to see their comment appear
- **Heavy initial payload**: 6 nested includes = 100-500KB JSON in single blocking query

**Verdict**: Not suitable for collaborative, real-time issue tracker

---

#### ❌ Option B: Pure Client Component (Rejected)

**Pros**:

- Excellent interactivity
- Real-time updates easy with SWR/React Query
- Optimistic updates trivial
- Fine-grained loading states

**Cons (Deal-breakers for this use case)**:

- **SEO disaster**: Issue details not in initial HTML (critical for searchability)
- **Poor Core Web Vitals**: LCP delayed until client JS loads + API request completes
- **Unnecessary client bundle**: Issue title, description, metadata don't need client-side fetching
- **Wasted API request**: Server already has Prisma client; why proxy through API route?
- **No streaming**: Entire payload must be ready before rendering starts

**Verdict**: Not suitable for content-heavy detail page with SEO requirements

---

#### ✅ Option C: Hybrid Architecture (RECOMMENDED)

**Strategy**: Server Component for static content + Client Components for dynamic sections

**Structure**:

```
┌─────────────────────────────────────────────────┐
│ page.tsx (Server Component)                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Fetch: Issue + Project (fast, essential)   │ │
│ │ Render: IssueHeader, DescriptionSection    │ │
│ │         (SEO-critical content in HTML)     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ <Suspense fallback={<Skeleton />}>         │ │
│ │   <CommentsSection issueId={id} />         │ │
│ │   (Client Component - real-time updates)   │ │
│ │ </Suspense>                                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ <Suspense fallback={<Skeleton />}>         │ │
│ │   <ActivityTimeline issueId={id} />        │ │
│ │   (Server Component - streamed)            │ │
│ │ </Suspense>                                │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Rationale**:

1. **Server Component page.tsx** fetches critical data (Issue + Project) → Fast initial render, SEO-friendly
2. **Client Components** for interactive sections (Comments, Actions) → Real-time updates, optimistic UI
3. **Streaming with Suspense** for heavy data (Activity, Related Issues) → Progressive loading, fast LCP
4. **Best of both worlds**: SEO + Interactivity + Performance

---

## Part 2: Implementation Strategy

### 2.1 Server Component (page.tsx)

**File**: `apps/web/app/issues/[id]/page.tsx`

**Responsibilities**:

- Fetch critical issue data (title, description, status, priority)
- Fetch project data (name, repository)
- Fetch metadata (assignee, timestamps)
- Render SEO-critical content in initial HTML
- Orchestrate Client Components and Suspense boundaries

**Prisma Query** (Optimized):

```typescript
// SINGLE QUERY - Fetch only essential data for initial render
const issue = await prisma.issue.findUnique({
  where: { id: parseInt(params.id) },
  select: {
    // Core fields (small)
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    module: true,
    assignee: true,
    createdAt: true,
    updatedAt: true,
    closedAt: true,

    // Project (small, essential)
    project: {
      select: {
        id: true,
        name: true,
        repository: true,
      },
    },

    // Labels (small, many-to-many)
    labels: {
      select: {
        id: true,
        name: true,
        color: true,
      },
    },

    // Counts only (avoid fetching full arrays)
    _count: {
      select: {
        comments: true,
        attachments: true,
        linkedFiles: true,
        linkedCommits: true,
      },
    },
  },
});
```

**Key Optimizations**:

- ✅ **Select only needed fields** (avoid fetching `customFields`, `searchVector`)
- ✅ **Fetch counts, not full arrays** (avoid loading 100 comments in initial query)
- ✅ **Small payload** (~2-5KB JSON) → Fast serialization, fast hydration
- ✅ **Single roundtrip** to database (no N+1 queries)

**Why not include all relations?**

- Comments: Can be 100+ items × 1KB each = 100KB+ (fetch separately)
- Attachments: Can be 50+ items = 50KB (fetch separately)
- LinkedCommits: Can be 20+ items = 20KB (fetch separately)
- Activity: Computed from multiple sources (fetch separately)

**Result**: Initial HTML contains critical content → LCP <1s even on 3G

---

### 2.2 Client Components (Real-Time Sections)

#### Component 1: CommentsSection

**File**: `apps/web/components/issues/detail/CommentsSection.tsx`

**Why Client Component?**

- User types comment → Optimistic UI adds it immediately
- New comments from others → Poll every 30s or use WebSocket
- Comment deletion → Optimistic removal, rollback on error

**Data Fetching Strategy**:

```typescript
'use client';

import useSWR from 'swr';

export function CommentsSection({ issueId }: { issueId: number }) {
  const { data, error, mutate } = useSWR(
    `/api/issues/${issueId}/comments`,
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30s for real-time feel
      revalidateOnFocus: true, // Refresh when user returns to tab
      dedupingInterval: 5000, // Avoid duplicate requests
    }
  );

  const addComment = async (content: string) => {
    // Optimistic update
    const optimisticComment = {
      id: Date.now(),
      content,
      author: 'You',
      createdAt: new Date().toISOString(),
      issueId,
    };

    mutate(
      async (currentComments) => {
        // Immediately show comment
        const updated = [...(currentComments || []), optimisticComment];

        // Send to server
        await fetch(`/api/issues/${issueId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });

        return updated;
      },
      {
        optimisticData: [...(data || []), optimisticComment],
        rollbackOnError: true,
      }
    );
  };

  return (
    <div>
      <CommentList comments={data || []} />
      <CommentForm onSubmit={addComment} />
    </div>
  );
}
```

**Why this works**:

- ✅ Optimistic updates = instant feedback
- ✅ Polling = pseudo-real-time for collaborative editing
- ✅ SWR caching = avoid redundant API calls
- ✅ Rollback on error = data consistency

**Alternative**: Use Server Actions instead of API route

```typescript
async function addComment(formData: FormData) {
  'use server';

  const content = formData.get('content') as string;
  const comment = await prisma.comment.create({
    data: { content, issueId },
  });

  revalidatePath(`/issues/${issueId}`);
  return comment;
}
```

**But**: Server Actions don't support optimistic updates easily (need `useOptimistic` + complex setup)

**Recommendation**: **Use API route + SWR** for better UX

---

#### Component 2: IssueActions

**File**: `apps/web/components/issues/detail/IssueActions.tsx`

**Why Client Component?**

- Status toggle (Open ↔ Closed) → Interactive button
- Priority change → Dropdown menu
- Assign to user → Autocomplete

**Pattern**: Optimistic updates with Server Actions

```typescript
'use client';

import { useTransition } from 'react';
import { updateIssueStatus } from '@/app/actions/issues';

export function IssueActions({ issue }: { issue: Issue }) {
  const [isPending, startTransition] = useTransition();

  const toggleStatus = () => {
    startTransition(async () => {
      await updateIssueStatus(issue.id, {
        status: issue.status === 'open' ? 'closed' : 'open',
      });
    });
  };

  return (
    <button onClick={toggleStatus} disabled={isPending}>
      {isPending ? 'Updating...' : issue.status === 'open' ? 'Close Issue' : 'Reopen Issue'}
    </button>
  );
}

// app/actions/issues.ts
'use server';

export async function updateIssueStatus(issueId: number, data: { status: string }) {
  await prisma.issue.update({
    where: { id: issueId },
    data,
  });

  revalidatePath(`/issues/${issueId}`);
  revalidatePath('/issues'); // Also revalidate list page
}
```

**Why Server Actions here?**

- Simple mutation (no optimistic UI needed)
- Automatic revalidation
- Type-safe (TypeScript end-to-end)

---

### 2.3 Server Components (Streamed Sections)

#### Component 3: ActivityTimeline

**File**: `apps/web/components/issues/detail/ActivityTimeline.tsx`

**Why Server Component?**

- Activity is computed from multiple sources (comments, status changes, commits)
- Heavy query (joins multiple tables)
- Doesn't need real-time updates (static history)

**Fetch Strategy**:

```typescript
// Wrap in Suspense from parent
export async function ActivityTimeline({ issueId }: { issueId: number }) {
  // This query is slow (100-500ms) but doesn't block initial render
  const [comments, commits, statusChanges] = await Promise.all([
    prisma.comment.findMany({
      where: { issueId },
      select: { id: true, author: true, createdAt: true, content: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.linkedCommit.findMany({
      where: { issueId },
      select: { id: true, commitHash: true, commitMessage: true, commitDate: true },
      orderBy: { commitDate: 'asc' },
    }),
    // Fetch status changes from audit log (future implementation)
    [],
  ]);

  // Merge and sort by timestamp
  const timeline = mergeTimeline(comments, commits, statusChanges);

  return (
    <div>
      {timeline.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}

// Parent component (page.tsx)
<Suspense fallback={<ActivitySkeleton />}>
  <ActivityTimeline issueId={issue.id} />
</Suspense>
```

**Why Suspense + Server Component?**

- ✅ Heavy query doesn't block critical content (issue title, description)
- ✅ Browser can render header while activity loads
- ✅ User sees skeleton → understands something is loading
- ✅ No client JavaScript needed (static content)

---

#### Component 4: RelatedIssues

**File**: `apps/web/components/issues/detail/RelatedIssues.tsx`

**Why Server Component?**

- Related issues computed from labels/project similarity
- Can be slow query (similarity search)
- Static content (doesn't need interactivity)

**Fetch Strategy**:

```typescript
export async function RelatedIssues({ issueId, projectId, labels }: Props) {
  // Find issues with same labels or in same project
  const related = await prisma.issue.findMany({
    where: {
      AND: [
        { id: { not: issueId } }, // Exclude current issue
        {
          OR: [
            { projectId }, // Same project
            { labels: { some: { id: { in: labels.map((l) => l.id) } } } }, // Shared labels
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
    },
    take: 5, // Limit to 5 related issues
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div>
      {related.map((issue) => (
        <RelatedIssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

// Parent component (page.tsx)
<Suspense fallback={<RelatedIssuesSkeleton />}>
  <RelatedIssues issueId={issue.id} projectId={issue.project.id} labels={issue.labels} />
</Suspense>
```

**Why Suspense?**

- Query can be slow (0.5-2s depending on label count)
- User doesn't need related issues immediately
- Progressive enhancement: page works without related issues

---

## Part 3: Complete File Structure

### File: `apps/web/app/issues/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

// Components
import { IssueHeader } from '@/components/issues/detail/IssueHeader';
import { DescriptionSection } from '@/components/issues/detail/DescriptionSection';
import { CommentsSection } from '@/components/issues/detail/CommentsSection';
import { ActivityTimeline } from '@/components/issues/detail/ActivityTimeline';
import { RelatedIssues } from '@/components/issues/detail/RelatedIssues';
import { IssueDetailSidebar } from '@/components/issues/detail/IssueDetailSidebar';
import { AttachmentList } from '@/components/issues/detail/AttachmentList';
import { CodeSection } from '@/components/issues/detail/CodeSection';

// Skeletons
import { CommentsSkeleton } from '@/components/issues/detail/skeletons/CommentsSkeleton';
import { ActivitySkeleton } from '@/components/issues/detail/skeletons/ActivitySkeleton';
import { RelatedIssuesSkeleton } from '@/components/issues/detail/skeletons/RelatedIssuesSkeleton';

// Type
import { Issue } from '@prisma/client';

// ============================================================================
// METADATA (SEO)
// ============================================================================

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const issue = await prisma.issue.findUnique({
    where: { id: parseInt(params.id) },
    select: { title: true, description: true, status: true },
  });

  if (!issue) {
    return { title: 'Issue Not Found' };
  }

  return {
    title: `${issue.title} - Moksha DevHub`,
    description: issue.description?.substring(0, 160) || `Issue #${params.id}`,
    openGraph: {
      title: issue.title,
      description: issue.description?.substring(0, 160),
      type: 'article',
    },
  };
}

// ============================================================================
// MAIN PAGE COMPONENT (Server Component)
// ============================================================================

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  // Validate ID
  const issueId = parseInt(params.id);
  if (isNaN(issueId)) {
    notFound();
  }

  // Fetch critical data (fast query, small payload)
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      module: true,
      assignee: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,

      // Relations
      project: {
        select: {
          id: true,
          name: true,
          repository: true,
        },
      },
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },

      // Counts only (avoid fetching full arrays)
      _count: {
        select: {
          comments: true,
          attachments: true,
          linkedFiles: true,
          linkedCommits: true,
        },
      },
    },
  });

  // Handle not found
  if (!issue) {
    notFound();
  }

  // ============================================================================
  // RENDER (3-Column Layout)
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Responsive Grid: 1 col (mobile) → 3 cols (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-6">

        {/* LEFT SIDEBAR (Desktop only) */}
        <aside className="hidden lg:block">
          <IssueDetailSidebar issue={issue} />
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6">
          {/* Issue Header (Server Component - critical content) */}
          <IssueHeader issue={issue} />

          {/* Description (Server Component - SEO critical) */}
          <DescriptionSection
            description={issue.description}
            issueId={issue.id}
          />

          {/* Attachments (Server Component - static) */}
          <Suspense fallback={<div>Loading attachments...</div>}>
            <AttachmentList issueId={issue.id} />
          </Suspense>

          {/* Code Section (Server Component - static) */}
          <Suspense fallback={<div>Loading linked files...</div>}>
            <CodeSection issueId={issue.id} />
          </Suspense>

          {/* Comments (Client Component - real-time) */}
          <Suspense fallback={<CommentsSkeleton />}>
            <CommentsSection
              issueId={issue.id}
              commentCount={issue._count.comments}
            />
          </Suspense>

          {/* Activity Timeline (Server Component - heavy query, streamed) */}
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivityTimeline issueId={issue.id} />
          </Suspense>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          {/* Quick Actions (Client Component - interactive) */}
          <IssueActions issue={issue} />

          {/* Watchers (Server Component - static) */}
          <Suspense fallback={<div>Loading watchers...</div>}>
            <WatchersSection issueId={issue.id} />
          </Suspense>

          {/* Related Issues (Server Component - heavy query, streamed) */}
          <Suspense fallback={<RelatedIssuesSkeleton />}>
            <RelatedIssues
              issueId={issue.id}
              projectId={issue.project.id}
              labels={issue.labels}
            />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// ROUTE SEGMENT CONFIG
// ============================================================================

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

// Dynamic params (required for dynamic routes)
export const dynamicParams = true;

// Enable streaming
export const dynamic = 'force-dynamic'; // Or remove for static generation
```

**Key Architecture Points**:

1. ✅ **Server Component page.tsx** → SEO-friendly, fast initial render
2. ✅ **Single optimized query** → Critical data only, <5KB payload
3. ✅ **Suspense boundaries** → Progressive loading, fast LCP
4. ✅ **Client Components** for interactivity (Comments, Actions)
5. ✅ **Server Components** for static content (Activity, Related)
6. ✅ **Metadata function** → Dynamic OpenGraph tags

---

## Part 4: Caching Strategy

### 4.1 Server Component Caching

**Recommendation**: **Incremental Static Regeneration (ISR)** with 5-minute revalidation

**Configuration**:

```typescript
// apps/web/app/issues/[id]/page.tsx

export const revalidate = 300; // 5 minutes
```

**Why 5 minutes?**

- Issue metadata (title, status, priority) changes infrequently (1-10 times per day)
- 5-minute stale data is acceptable (not real-time critical)
- CDN caching saves database load (90%+ cache hit rate)
- On-demand revalidation handles urgent updates

**Alternative**: On-demand revalidation only

```typescript
// Remove revalidate export
// Rely on revalidatePath() from Server Actions

// app/actions/issues.ts
'use server';

export async function updateIssue(id: number, data: Partial<Issue>) {
  await prisma.issue.update({ where: { id }, data });

  revalidatePath(`/issues/${id}`); // Revalidate this issue
  revalidatePath('/issues'); // Revalidate list page
}
```

**Recommendation**: **Use both** (ISR + on-demand)

- ISR: Handles normal traffic (cache hits)
- On-demand: Handles mutations (instant updates)

---

### 4.2 Client Component Caching (SWR)

**Configuration**:

```typescript
// components/issues/detail/CommentsSection.tsx

const { data, error, mutate } = useSWR(`/api/issues/${issueId}/comments`, fetcher, {
  // Cache for 5 minutes
  dedupingInterval: 300000,

  // Refresh every 30 seconds (pseudo-real-time)
  refreshInterval: 30000,

  // Refresh on window focus
  revalidateOnFocus: true,

  // Don't refresh on reconnect (avoid spam)
  revalidateOnReconnect: false,

  // Keep previous data while revalidating
  keepPreviousData: true,
});
```

**Why these settings?**

- `dedupingInterval: 300000` → Avoid duplicate requests within 5 minutes
- `refreshInterval: 30000` → Polling for collaborative editing feel
- `revalidateOnFocus: true` → Fresh data when user returns to tab
- `keepPreviousData: true` → No flash of loading state

**Alternative**: React Query

```typescript
const { data, error } = useQuery({
  queryKey: ['issue', issueId, 'comments'],
  queryFn: () => fetch(`/api/issues/${issueId}/comments`).then((r) => r.json()),
  staleTime: 300000, // 5 minutes
  refetchInterval: 30000, // 30 seconds
  refetchOnWindowFocus: true,
});
```

**Recommendation**: **Use SWR** (already in stack, simpler API)

---

### 4.3 API Route Caching

**File**: `apps/web/app/api/issues/[id]/comments/route.ts`

**Configuration**:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { issueId: parseInt(params.id) },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    { data: comments, error: null },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
```

**Why this Cache-Control?**

- `public` → CDN can cache
- `s-maxage=60` → Cache for 60 seconds at CDN
- `stale-while-revalidate=300` → Serve stale data while revalidating (up to 5 minutes)

**Result**: 95%+ cache hit rate at CDN, minimal database load

---

## Part 5: Error Handling

### 5.1 Not Found (404)

**Pattern**: Use Next.js `notFound()` function

```typescript
import { notFound } from 'next/navigation';

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await prisma.issue.findUnique({ where: { id: parseInt(params.id) } });

  if (!issue) {
    notFound(); // Triggers not-found.tsx
  }

  return <div>{/* ... */}</div>;
}
```

**File**: `apps/web/app/issues/[id]/not-found.tsx`

```typescript
export default function IssueNotFound() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4">Issue Not Found</h1>
      <p className="text-gray-400 mb-8">
        The issue you're looking for doesn't exist or has been deleted.
      </p>
      <a href="/issues" className="btn-primary">
        Back to Issues
      </a>
    </div>
  );
}
```

---

### 5.2 Database Errors (500)

**Pattern**: Use error boundary

```typescript
// apps/web/app/issues/[id]/error.tsx
'use client';

export default function IssueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-gray-400 mb-8">
        {error.message || 'Failed to load issue. Please try again.'}
      </p>
      <button onClick={reset} className="btn-primary">
        Retry
      </button>
    </div>
  );
}
```

**Why error.tsx?**

- Catches all errors in page.tsx and children
- Provides user-friendly error message
- Allows retry without full page reload
- Preserves layout (navbar, sidebar)

---

### 5.3 Loading States

**Pattern**: Use loading.tsx for route-level loading

```typescript
// apps/web/app/issues/[id]/loading.tsx
import { IssueDetailSkeleton } from '@/components/issues/detail/skeletons/IssueDetailSkeleton';

export default function IssueLoading() {
  return <IssueDetailSkeleton />;
}
```

**Why loading.tsx?**

- Instant feedback (no blank screen)
- Rendered immediately while page.tsx fetches data
- Wrapped in Suspense automatically by Next.js
- Better perceived performance

---

## Part 6: Performance Optimization

### 6.1 Query Optimization

**Strategy**: Use `select` instead of `include`

**Bad** (fetches all fields):

```typescript
const issue = await prisma.issue.findUnique({
  where: { id: issueId },
  include: {
    project: true,
    labels: true,
    comments: true, // ❌ All comments loaded (can be 100+)
  },
});
```

**Good** (fetches only needed fields):

```typescript
const issue = await prisma.issue.findUnique({
  where: { id: issueId },
  select: {
    id: true,
    title: true,
    description: true,
    // ... only fields used in initial render

    project: {
      select: {
        id: true,
        name: true, // Only name, not description/repository
      },
    },

    labels: {
      select: {
        id: true,
        name: true,
        color: true, // Only display fields
      },
    },

    _count: {
      select: {
        comments: true, // Count only, not full data
      },
    },
  },
});
```

**Payload reduction**: 150KB → 5KB (97% reduction!)

---

### 6.2 Parallel Queries

**Pattern**: Use `Promise.all()` for independent queries

**Sequential** (slow):

```typescript
const issue = await prisma.issue.findUnique({ where: { id: issueId } });
const comments = await prisma.comment.findMany({ where: { issueId } });
const commits = await prisma.linkedCommit.findMany({ where: { issueId } });
// Total: 300ms + 200ms + 150ms = 650ms
```

**Parallel** (fast):

```typescript
const [issue, comments, commits] = await Promise.all([
  prisma.issue.findUnique({ where: { id: issueId } }),
  prisma.comment.findMany({ where: { issueId } }),
  prisma.linkedCommit.findMany({ where: { issueId } }),
]);
// Total: max(300ms, 200ms, 150ms) = 300ms (2x faster!)
```

**Recommendation**: Use parallel queries for independent data

---

### 6.3 Streaming with Suspense

**Pattern**: Wrap slow queries in Suspense

**Without Suspense** (blocking):

```typescript
export default async function IssueDetailPage({ params }) {
  const issue = await prisma.issue.findUnique({ ... }); // 100ms
  const comments = await prisma.comment.findMany({ ... }); // 200ms
  const activity = await computeActivity(issue.id); // 500ms

  // Total: 800ms before ANY content renders
  return <div>{/* ... */}</div>;
}
```

**With Suspense** (streaming):

```typescript
export default async function IssueDetailPage({ params }) {
  const issue = await prisma.issue.findUnique({ ... }); // 100ms

  // Issue header renders after 100ms (fast!)
  return (
    <div>
      <IssueHeader issue={issue} />

      {/* Comments load in parallel, don't block header */}
      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsSection issueId={issue.id} />
      </Suspense>

      {/* Activity loads in parallel, don't block header */}
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityTimeline issueId={issue.id} />
      </Suspense>
    </div>
  );
}
```

**Result**: LCP improves from 800ms → 100ms (8x faster!)

---

### 6.4 Database Indexes

**Ensure these indexes exist** (already in schema):

```prisma
model Issue {
  // ... fields

  @@index([id]) // Primary key (automatic)
  @@index([projectId]) // For related issues query
  @@index([status]) // For filtering
  @@index([priority]) // For filtering
  @@index([createdAt(sort: Desc)]) // For sorting
}

model Comment {
  // ... fields

  @@index([issueId]) // For comments query
  @@index([createdAt(sort: Desc)]) // For ordering
}

model LinkedCommit {
  // ... fields

  @@index([issueId]) // For commits query
  @@index([commitDate(sort: Desc)]) // For timeline
}
```

**Verify indexes**:

```sql
-- Run in PostgreSQL
EXPLAIN ANALYZE SELECT * FROM "Issue" WHERE id = 123;
-- Should show "Index Scan using Issue_pkey"
```

---

## Part 7: Type Safety

### 7.1 Prisma Types

**Pattern**: Use Prisma-generated types + Pick/Omit

```typescript
import { Issue, Project, Label, Prisma } from '@prisma/client';

// Type for issue with relations
export type IssueWithRelations = Prisma.IssueGetPayload<{
  include: {
    project: true;
    labels: true;
    _count: {
      select: {
        comments: true;
        attachments: true;
      };
    };
  };
}>;

// Type for issue header (minimal fields)
export type IssueHeaderData = Pick<Issue, 'id' | 'title' | 'status' | 'priority' | 'createdAt'> & {
  project: Pick<Project, 'id' | 'name'>;
  labels: Array<Pick<Label, 'id' | 'name' | 'color'>>;
};
```

**Why?**

- ✅ Type-safe (TypeScript validates at compile time)
- ✅ Auto-complete in IDE
- ✅ Refactoring-safe (schema changes caught early)

---

### 7.2 Component Props

**Pattern**: Use explicit prop types

```typescript
// components/issues/detail/IssueHeader.tsx

import { IssueHeaderData } from '@/types/issue';

interface IssueHeaderProps {
  issue: IssueHeaderData;
}

export function IssueHeader({ issue }: IssueHeaderProps) {
  return (
    <header>
      <h1>{issue.title}</h1>
      <div>
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />
      </div>
    </header>
  );
}
```

---

## Part 8: Testing Strategy

### 8.1 Server Component Testing

**Test**: Verify data fetching logic

```typescript
// __tests__/app/issues/[id]/page.test.tsx

import { render, screen } from '@testing-library/react';
import IssueDetailPage from '@/app/issues/[id]/page';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    issue: {
      findUnique: jest.fn(),
    },
  },
}));

describe('IssueDetailPage', () => {
  it('renders issue title and description', async () => {
    // Arrange
    const mockIssue = {
      id: 1,
      title: 'Test Issue',
      description: 'Test Description',
      status: 'open',
      priority: 'high',
      project: { id: 1, name: 'Test Project' },
      labels: [],
      _count: { comments: 5, attachments: 2 },
    };

    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

    // Act
    const page = await IssueDetailPage({ params: { id: '1' } });
    const { container } = render(page);

    // Assert
    expect(screen.getByText('Test Issue')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('returns 404 for non-existent issue', async () => {
    // Arrange
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(IssueDetailPage({ params: { id: '999' } })).rejects.toThrow();
  });
});
```

---

### 8.2 Client Component Testing

**Test**: Verify interactivity

```typescript
// __tests__/components/issues/detail/CommentsSection.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentsSection } from '@/components/issues/detail/CommentsSection';
import { SWRConfig } from 'swr';

describe('CommentsSection', () => {
  it('allows user to add comment', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockComments = [
      { id: 1, content: 'First comment', author: 'Alice', createdAt: '2025-01-01' },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: mockComments }),
      })
    ) as jest.Mock;

    // Act
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommentsSection issueId={1} commentCount={1} />
      </SWRConfig>
    );

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });

    // Type new comment
    const textarea = screen.getByPlaceholderText('Add a comment...');
    await user.type(textarea, 'New comment');
    await user.click(screen.getByText('Submit'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('New comment')).toBeInTheDocument();
    });
  });
});
```

---

### 8.3 E2E Testing

**Test**: Full user flow

```typescript
// e2e/issue-detail.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Issue Detail Page', () => {
  test('displays issue details and allows commenting', async ({ page }) => {
    // Navigate to issue
    await page.goto('/issues/1');

    // Verify issue loaded
    await expect(page.getByRole('heading', { name: /test issue/i })).toBeVisible();

    // Add comment
    await page.getByPlaceholderText('Add a comment...').fill('Great work!');
    await page.getByRole('button', { name: /submit/i }).click();

    // Verify comment appears
    await expect(page.getByText('Great work!')).toBeVisible();

    // Verify comment count updated
    await expect(page.getByText(/6 comments/i)).toBeVisible();
  });

  test('toggles issue status', async ({ page }) => {
    await page.goto('/issues/1');

    // Click close button
    await page.getByRole('button', { name: /close issue/i }).click();

    // Verify status changed
    await expect(page.getByText(/closed/i)).toBeVisible();
  });
});
```

---

## Part 9: Accessibility

### 9.1 WCAG 2.1 AA Compliance

**Requirements**:

- ✅ Semantic HTML (headings, landmarks)
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ ARIA labels for interactive elements
- ✅ Color contrast ≥4.5:1

**Implementation**:

```typescript
// components/issues/detail/IssueHeader.tsx

export function IssueHeader({ issue }: IssueHeaderProps) {
  return (
    <header role="banner" className="issue-header">
      {/* Semantic heading */}
      <h1 className="text-3xl font-bold">{issue.title}</h1>

      {/* Accessible status badge */}
      <div role="status" aria-label={`Issue status: ${issue.status}`}>
        <StatusBadge status={issue.status} />
      </div>

      {/* Accessible actions */}
      <button
        type="button"
        aria-label={`${issue.status === 'open' ? 'Close' : 'Reopen'} issue ${issue.title}`}
        className="btn-primary"
      >
        {issue.status === 'open' ? 'Close Issue' : 'Reopen Issue'}
      </button>
    </header>
  );
}
```

---

### 9.2 Keyboard Navigation

**Test**:

```typescript
// e2e/accessibility.spec.ts

test('supports keyboard navigation', async ({ page }) => {
  await page.goto('/issues/1');

  // Tab through interactive elements
  await page.keyboard.press('Tab'); // Focus on first button
  await page.keyboard.press('Tab'); // Focus on second button
  await page.keyboard.press('Enter'); // Activate button

  // Verify action executed
  await expect(page.getByText(/closed/i)).toBeVisible();
});
```

---

## Part 10: Implementation Checklist

### Phase 1: API Foundation (if needed)

- [ ] Create GET /api/issues/[id]/comments
- [ ] Add Zod validation schema
- [ ] Write unit tests
- [ ] Test with curl/Postman

### Phase 2: Server Components

- [ ] Create page.tsx with optimized query
- [ ] Add generateMetadata for SEO
- [ ] Create IssueHeader component
- [ ] Create DescriptionSection component
- [ ] Create not-found.tsx and error.tsx
- [ ] Create loading.tsx

### Phase 3: Client Components

- [ ] Create CommentsSection with SWR
- [ ] Create IssueActions with Server Actions
- [ ] Add optimistic updates
- [ ] Test real-time polling

### Phase 4: Server Components (Streamed)

- [ ] Create ActivityTimeline component
- [ ] Create RelatedIssues component
- [ ] Wrap in Suspense boundaries
- [ ] Create skeleton components

### Phase 5: Styling

- [ ] Apply neumorphic design system
- [ ] Implement responsive layout
- [ ] Add accessibility features
- [ ] Test on mobile/tablet/desktop

### Phase 6: Testing

- [ ] Write unit tests for API routes
- [ ] Write component tests (RTL)
- [ ] Write E2E tests (Playwright)
- [ ] Verify WCAG 2.1 AA compliance

### Phase 7: Performance Audit

- [ ] Run Lighthouse (target: 90+ on all metrics)
- [ ] Verify LCP <2s
- [ ] Check bundle size (<200KB)
- [ ] Test on slow 3G network

---

## Part 11: Migration from Current Implementation

**If you already have GET /api/issues/[id] endpoint**:

1. **Keep the API endpoint** (needed for Client Components)
2. **Use hybrid approach**:
   - Server Component page.tsx for critical data
   - Client Components fetch from API for dynamic sections
3. **Benefits**:
   - ✅ Existing API tests still valid
   - ✅ Gradual migration path
   - ✅ API available for mobile app (future)

**Migration steps**:

```typescript
// Step 1: Convert page from Client to Server Component
// Before (Client Component)
'use client';
export default function IssueDetailPage({ params }) {
  const { data } = useSWR(`/api/issues/${params.id}`);
  return <div>{/* ... */}</div>;
}

// After (Server Component)
export default async function IssueDetailPage({ params }) {
  const issue = await prisma.issue.findUnique({ ... });
  return <div>{/* ... */}</div>;
}

// Step 2: Move interactive parts to Client Components
<CommentsSection issueId={issue.id} /> // Client Component
<IssueActions issue={issue} /> // Client Component

// Step 3: Add Suspense for streaming
<Suspense fallback={<Skeleton />}>
  <ActivityTimeline issueId={issue.id} />
</Suspense>
```

---

## Summary & Recommendation

### Final Architecture

**✅ RECOMMENDED: Hybrid Server + Client Component Architecture**

**Page Structure**:

```
page.tsx (Server Component)
├─ Fetch critical data (Issue + Project + Labels)
├─ IssueHeader (Server Component)
├─ DescriptionSection (Server Component)
├─ CommentsSection (Client Component + SWR)
├─ <Suspense>
│  └─ ActivityTimeline (Server Component, streamed)
├─ IssueActions (Client Component + Server Actions)
└─ <Suspense>
   └─ RelatedIssues (Server Component, streamed)
```

**Why this is optimal**:

1. ✅ **SEO-friendly**: Critical content in initial HTML
2. ✅ **Fast LCP**: <1s with streaming
3. ✅ **Real-time feel**: Polling + optimistic updates
4. ✅ **Progressive loading**: Suspense for heavy queries
5. ✅ **Type-safe**: Prisma types end-to-end
6. ✅ **Cacheable**: ISR + SWR + CDN = 95%+ cache hit rate

**Performance Targets**:

- LCP: <1s (critical content in initial HTML)
- FID: <100ms (interactive within 100ms)
- CLS: <0.1 (no layout shifts)
- Bundle size: <50KB (Server Components minimize client JS)

**Next Steps for Parent Agent**:

1. Create page.tsx with optimized Prisma query
2. Create Server Components (IssueHeader, DescriptionSection)
3. Create Client Components (CommentsSection, IssueActions)
4. Add Suspense boundaries with skeletons
5. Implement caching (ISR + SWR)
6. Write tests (unit + E2E)
7. Accessibility audit

---

**Report saved to**: `.agent/task/nextjs-issue-detail-20251029-2154.md`

**Key Recommendation**: Use hybrid architecture (Server Component page + Client Components for interactive sections + Suspense for streaming). This balances SEO, performance, and real-time interactivity perfectly for an issue tracker detail page.
