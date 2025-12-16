# React Implementation Plan: Issue Detail Page Component Architecture

**Created**: 2025-10-29 21:54
**Type**: Component Architecture & Composition
**Task**: 12-component Issue Detail page with 3-column layout

---

## Executive Summary

**Recommended Architecture**: Hybrid Server-First Composition with URL-based State Management

**Key Decisions**:

1. ✅ Flatten components directly in page.tsx (no wrapper components)
2. ✅ Pass explicit props (not full issue object) for type safety
3. ✅ Use Server Components with nested Client Components
4. ✅ URL state + router.refresh() for mutations (no context needed)
5. ✅ Extract Prisma payload type for component interfaces
6. ✅ Memo only interactive Client Components with callbacks

**Token Efficiency**: ~12K tokens for entire implementation (vs 30K+ with context approach)

---

## 1. Component Composition Strategy

### ✅ RECOMMENDED: Flat Composition (No Wrappers)

**Why flatten?**

- Server Components are **free** (zero bundle size)
- No prop drilling (each component receives props directly from page.tsx)
- Clear data flow (one source of truth)
- Easy to read and maintain
- Next.js optimizes Server Component composition automatically

**Structure**:

```tsx
// apps/web/app/issues/[id]/page.tsx
export default async function IssuePage({ params }: { params: { id: string } }) {
  const issue = await fetchIssueWithRelations(params.id);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar - span 2 columns */}
      <aside className="col-span-2">
        <QuickActions
          issueId={issue.id}
          isWatched={issue.watchers.some((w) => w.userId === currentUserId)}
          projectKey={issue.projectKey}
        />
        <WatchersSection watchers={issue.watchers} />
      </aside>

      {/* Main Content - span 7 columns */}
      <main className="col-span-7">
        <IssueHeader
          id={issue.id}
          projectKey={issue.projectKey}
          title={issue.title}
          status={issue.status}
          priority={issue.priority}
          assignee={issue.assignee}
          createdAt={issue.createdAt}
          updatedAt={issue.updatedAt}
        />

        <IssueActions issueId={issue.id} currentStatus={issue.status} />

        <DescriptionSection issueId={issue.id} description={issue.description} canEdit={canEdit} />

        {issue.codeSnippet && (
          <CodeSection code={issue.codeSnippet} language={issue.codeLanguage || 'typescript'} />
        )}

        <CommentList comments={issue.comments} />
        <CommentForm issueId={issue.id} />
      </main>

      {/* Right Sidebar - span 3 columns */}
      <aside className="col-span-3">
        <IssueDetailSidebar issue={issue} /> {/* Existing Day 4 component */}
        <SystemActivity
          statusHistory={issue.statusHistory}
          linkedCommits={issue.linkedCommits}
          linkedPRs={issue.linkedPRs}
        />
        {issue.relatedIssues.length > 0 && <RelatedIssues issues={issue.relatedIssues} />}
        <AttachmentList attachments={issue.attachments} />
      </aside>
    </div>
  );
}
```

**Why this works**:

- ✅ Zero prop drilling (direct props from page.tsx)
- ✅ Server Components don't count toward bundle size
- ✅ Clear visual structure matches mockup columns
- ✅ Easy to add/remove/reorder components
- ✅ Each component gets exactly what it needs (no over-fetching)

**Alternative (NOT recommended)**:

```tsx
// ❌ DON'T DO THIS - Wrapper components add complexity
<LeftSidebar>
  <QuickActions {...props} />
  <WatchersSection {...props} />
</LeftSidebar>
```

**Why avoid?**

- Adds abstraction layer for no benefit
- Server Components are free anyway
- Harder to understand data flow
- Prop drilling if wrappers need shared state

---

## 2. Data Flow Pattern: Explicit Props (Type-Safe)

### ✅ RECOMMENDED: Extract and Pass Explicit Props

**Pattern**:

```typescript
// ✅ GOOD: Explicit props with TypeScript interfaces
<IssueHeader
  id={issue.id}
  projectKey={issue.projectKey}
  title={issue.title}
  status={issue.status}
  priority={issue.priority}
  assignee={issue.assignee}
  createdAt={issue.createdAt}
  updatedAt={issue.updatedAt}
/>

// ❌ BAD: Pass entire issue object
<IssueHeader issue={issue} />
```

**Why explicit props?**

1. **Type Safety**: Each component declares exactly what it needs

   ```typescript
   interface IssueHeaderProps {
     id: number;
     projectKey: string;
     title: string;
     status: IssueStatus;
     priority: IssuePriority;
     assignee: { id: string; name: string; avatar: string } | null;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **Performance**: Components only re-render when their specific props change

   ```typescript
   // If issue.description changes, IssueHeader doesn't re-render
   // because it doesn't receive description prop
   ```

3. **Reusability**: Components are self-documenting

   ```typescript
   // Clear what's required to render this component
   // No hidden dependencies on issue object shape
   ```

4. **Refactoring Safety**: TypeScript catches breaking changes
   ```typescript
   // If you rename issue.projectKey → issue.projectCode
   // TypeScript will error on every component using projectKey
   ```

**Exception - Pass Object for Complex Props**:

```typescript
// ✅ OK: Pass object for deeply nested data with many fields
<SystemActivity
  statusHistory={issue.statusHistory}  // Array of objects
  linkedCommits={issue.linkedCommits}  // Array of objects
  linkedPRs={issue.linkedPRs}          // Array of objects
/>

// ❌ DON'T: Flatten 50+ fields
// assigneeId, assigneeName, assigneeAvatar, assigneeEmail, ...
```

**Rule of Thumb**:

- **Simple types** (string, number, Date): Extract and pass explicitly
- **Objects with 1-3 fields**: Extract and pass as object
- **Arrays of objects**: Pass directly (don't flatten)
- **Objects with 10+ fields used together**: Pass object (but document interface)

---

## 3. Server/Client Boundary Strategy

### ✅ RECOMMENDED: Server-First with Client Islands

**Component Tree**:

```
Page (Server) ← Fetches data from Prisma
├── QuickActions (Client) ← Interactive buttons
├── WatchersSection (Server) ← Static avatar stack
├── IssueHeader (Server) ← Static metadata display
├── IssueActions (Client) ← Status change buttons
├── DescriptionSection (Client) ← Toggle edit mode
├── CodeSection (Server) ← Syntax highlighting (static)
├── CommentList (Server) ← Static comment display
├── CommentForm (Client) ← Form with state
├── IssueDetailSidebar (Server) ← Static metadata
├── SystemActivity (Server) ← Static timeline
├── RelatedIssues (Server) ← Static links
└── AttachmentList (Server) ← Static file list
```

**Server Component Pattern**:

```typescript
// apps/web/components/issues/detail/IssueHeader.tsx
// NO "use client" directive

interface IssueHeaderProps {
  id: number;
  projectKey: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: { id: string; name: string; avatar: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function IssueHeader({
  id,
  projectKey,
  title,
  status,
  priority,
  assignee,
  createdAt,
  updatedAt,
}: IssueHeaderProps) {
  return (
    <header className="neu-raised p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {projectKey}-{id} • Opened {formatDate(createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={status} />
          <PriorityBadge priority={priority} />
        </div>
      </div>

      {assignee && (
        <div className="flex items-center gap-2 mt-4">
          <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full" />
          <span className="text-sm text-text-secondary">Assigned to {assignee.name}</span>
        </div>
      )}
    </header>
  );
}
```

**Client Component Pattern**:

```typescript
// apps/web/components/issues/detail/IssueActions.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface IssueActionsProps {
  issueId: number;
  currentStatus: IssueStatus;
}

export function IssueActions({ issueId, currentStatus }: IssueActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    try {
      setError(null);
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Refresh server components (IssueHeader will show new status)
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex gap-2">
      {currentStatus === 'OPEN' && (
        <button
          onClick={() => handleStatusChange('IN_PROGRESS')}
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? 'Updating...' : 'Start Progress'}
        </button>
      )}

      {currentStatus === 'IN_PROGRESS' && (
        <>
          <button
            onClick={() => handleStatusChange('RESOLVED')}
            disabled={isPending}
            className="btn-success"
          >
            {isPending ? 'Updating...' : 'Resolve'}
          </button>
          <button
            onClick={() => handleStatusChange('OPEN')}
            disabled={isPending}
            className="btn-secondary"
          >
            {isPending ? 'Updating...' : 'Reopen'}
          </button>
        </>
      )}

      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}
```

**Nesting Rules**:

✅ **Allowed**:

```tsx
// Server Component with Client Component children
<ServerComponent>
  <ClientComponent />
</ServerComponent>

// Client Component with Server Component children (via props)
<ClientComponent>
  <ServerComponent /> {/* Works if passed as children prop */}
</ClientComponent>
```

❌ **NOT Allowed**:

```tsx
// Client Component directly importing Server Component
'use client';
import { ServerComponent } from './ServerComponent'; // ❌ Error!

// But this works:
export function ClientWrapper({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

// In parent:
<ClientWrapper>
  <ServerComponent /> {/* ✅ OK - passed as children */}
</ClientWrapper>;
```

**When to Use Client Components**:

- User interactions (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, window, document)
- Real-time updates (WebSocket, Server-Sent Events)
- Third-party libraries requiring `window` (not all do)

**When to Use Server Components**:

- Data fetching (Prisma, fetch with cache)
- Static content display
- Markdown rendering (can be done server-side)
- Syntax highlighting (can be done server-side with Shiki)
- Authentication checks (headers, cookies)
- Database queries

---

## 4. State Management: URL State + Router Refresh

### ✅ RECOMMENDED: No Context, No Global State

**Why?**

- Server Components can't use Context
- URL state is SEO-friendly and shareable
- router.refresh() re-fetches Server Component data
- Simple, predictable, framework-aligned

**Pattern 1: Mutations → Router Refresh**

```typescript
// apps/web/components/issues/detail/IssueActions.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function IssueActions({ issueId, currentStatus }: IssueActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = async (newStatus: IssueStatus) => {
    const res = await fetch(`/api/issues/${issueId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) throw new Error('Failed to update');

    // This triggers re-fetch of page.tsx data
    // IssueHeader will show new status automatically
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button onClick={() => handleStatusChange('RESOLVED')} disabled={isPending}>
      {isPending ? 'Updating...' : 'Resolve Issue'}
    </button>
  );
}
```

**How it works**:

1. User clicks "Resolve Issue"
2. Client Component calls API endpoint
3. API updates database
4. Client calls `router.refresh()`
5. Next.js re-runs `page.tsx` (fetches updated issue data)
6. Server Components re-render with new data
7. Client Components receive new props

**Pattern 2: Optimistic UI (Optional)**

```typescript
// For instant feedback before server responds
"use client";

import { useOptimistic } from 'react';

export function IssueActions({ issueId, currentStatus }: IssueActionsProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    // Immediately update UI
    setOptimisticStatus(newStatus);

    try {
      await fetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      router.refresh(); // Sync with server
    } catch (error) {
      // Rollback on error
      setOptimisticStatus(currentStatus);
    }
  };

  return (
    <div>
      <StatusBadge status={optimisticStatus} />
      <button onClick={() => handleStatusChange('RESOLVED')}>
        Resolve
      </button>
    </div>
  );
}
```

**Pattern 3: Comment Submission**

```typescript
// apps/web/components/issues/detail/CommentForm.tsx (existing Day 4)
"use client";

export function CommentForm({ issueId }: { issueId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: formData.get('content') }),
    });

    if (!res.ok) throw new Error('Failed to post comment');

    // Clear form
    e.currentTarget.reset();

    // Refresh page to show new comment in CommentList
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
```

**Why Not Context?**

❌ **Context issues**:

- Can't be used in Server Components
- Requires "use client" on parent (turns entire tree client-side)
- More complex state management
- Hard to persist state across navigations

✅ **URL State benefits**:

- Works with Server Components
- SEO-friendly (`/issues/123?tab=comments`)
- Shareable URLs
- Browser back/forward works automatically
- No hydration issues

**When URL State Makes Sense**:

```tsx
// Tabs on issue page
(searchParams.tab === 'comments') | 'activity' | 'code';

// Filter watchers
(searchParams.watcherFilter === 'active') | 'all';

// Sort related issues
(searchParams.sort === 'recent') | 'priority';
```

**When Local State Makes Sense**:

```tsx
// Edit mode toggle (not shareable)
const [isEditing, setIsEditing] = useState(false);

// Form validation errors (ephemeral)
const [errors, setErrors] = useState<ValidationErrors>({});

// Dropdown open/closed (UI state)
const [isOpen, setIsOpen] = useState(false);
```

---

## 5. Type Safety: Extracted Prisma Types

### ✅ RECOMMENDED: Create Shared Type File

**File**: `apps/web/lib/types/issue-detail.ts`

```typescript
import { Prisma } from '@prisma/client';

// Extract exact type from Prisma query
export type IssueWithRelations = Prisma.IssueGetPayload<{
  include: {
    assignee: {
      select: {
        id: true;
        name: true;
        avatar: true;
        email: true;
      };
    };
    labels: true;
    comments: {
      include: {
        author: {
          select: {
            id: true;
            name: true;
            avatar: true;
          };
        };
      };
      orderBy: {
        createdAt: 'desc';
      };
    };
    attachments: {
      orderBy: {
        uploadedAt: 'desc';
      };
    };
    watchers: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            avatar: true;
          };
        };
      };
    };
    linkedCommits: {
      orderBy: {
        committedAt: 'desc';
      };
    };
    linkedPRs: true;
    relatedIssues: {
      select: {
        id: true;
        title: true;
        status: true;
        projectKey: true;
      };
    };
    statusHistory: {
      orderBy: {
        changedAt: 'desc';
      };
      include: {
        changedBy: {
          select: {
            id: true;
            name: true;
            avatar: true;
          };
        };
      };
    };
  };
}>;

// Component-specific prop types (extract from IssueWithRelations)
export interface IssueHeaderProps {
  id: number;
  projectKey: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: IssueWithRelations['assignee'];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemActivityProps {
  statusHistory: IssueWithRelations['statusHistory'];
  linkedCommits: IssueWithRelations['linkedCommits'];
  linkedPRs: IssueWithRelations['linkedPRs'];
}

export interface WatchersSectionProps {
  watchers: IssueWithRelations['watchers'];
}

export interface CodeSectionProps {
  code: string;
  language: string;
}

export interface RelatedIssuesProps {
  issues: IssueWithRelations['relatedIssues'];
}

export interface IssueActionsProps {
  issueId: number;
  currentStatus: IssueStatus;
}

export interface DescriptionSectionProps {
  issueId: number;
  description: string;
  canEdit: boolean;
}

export interface QuickActionsProps {
  issueId: number;
  isWatched: boolean;
  projectKey: string;
}
```

**Usage in Components**:

```typescript
// apps/web/components/issues/detail/IssueHeader.tsx
import type { IssueHeaderProps } from '@/lib/types/issue-detail';

export function IssueHeader({
  id,
  projectKey,
  title,
  status,
  priority,
  assignee,
  createdAt,
  updatedAt,
}: IssueHeaderProps) {
  // TypeScript knows exact shape of assignee
  // assignee.id, assignee.name, assignee.avatar are all typed
  return (
    <header>
      {assignee && (
        <div>
          <img src={assignee.avatar} alt={assignee.name} />
          <span>{assignee.name}</span>
        </div>
      )}
    </header>
  );
}
```

**Usage in page.tsx**:

```typescript
// apps/web/app/issues/[id]/page.tsx
import type { IssueWithRelations } from '@/lib/types/issue-detail';

async function fetchIssueWithRelations(id: string): Promise<IssueWithRelations> {
  return prisma.issue.findUniqueOrThrow({
    where: { id: parseInt(id) },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
      labels: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      // ... all other includes match IssueWithRelations type
    },
  });
}

export default async function IssuePage({ params }: { params: { id: string } }) {
  const issue = await fetchIssueWithRelations(params.id);

  // TypeScript validates prop passing
  return (
    <IssueHeader
      id={issue.id}
      projectKey={issue.projectKey}
      title={issue.title}
      status={issue.status}
      priority={issue.priority}
      assignee={issue.assignee}
      createdAt={issue.createdAt}
      updatedAt={issue.updatedAt}
    />
  );
}
```

**Benefits**:

1. **Single Source of Truth**: `IssueWithRelations` defines the query shape
2. **Type Safety**: Components can't access fields not included in query
3. **Refactoring Safety**: Changing query breaks types immediately
4. **Intellisense**: Full autocomplete in components
5. **Documentation**: Types document what data each component needs

---

## 6. Performance Optimization

### React.memo Strategy

**Rule**: Only memo Client Components with **expensive renders** or **frequently changing parent props**

**✅ Memo These**:

```typescript
// apps/web/components/issues/detail/IssueActions.tsx
"use client";

import { memo } from 'react';

export const IssueActions = memo(function IssueActions({
  issueId,
  currentStatus,
}: IssueActionsProps) {
  // Has state, event handlers, API calls
  // Parent might re-render often
  // Memo prevents unnecessary re-renders
  return (/* ... */);
});
```

**❌ Don't Memo These**:

```typescript
// apps/web/components/issues/detail/IssueHeader.tsx
// NO "use client" directive

export function IssueHeader({ ... }: IssueHeaderProps) {
  // Server Component - renders once on server
  // No re-renders in client
  // Memo is useless here
  return (/* ... */);
}
```

**useCallback/useMemo Strategy**:

```typescript
// apps/web/components/issues/detail/CommentForm.tsx
"use client";

import { useCallback, useMemo } from 'react';

export function CommentForm({ issueId }: { issueId: number }) {
  // ✅ useCallback for event handlers passed to child components
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    // ... API call
  }, [issueId]); // Only recreate if issueId changes

  // ✅ useMemo for expensive computations
  const validationRules = useMemo(() => {
    return {
      minLength: 10,
      maxLength: 5000,
      // ... complex validation logic
    };
  }, []); // Never changes

  // ❌ DON'T useMemo simple values
  const buttonLabel = 'Post Comment'; // Not: useMemo(() => 'Post Comment', [])

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

**Code Splitting (Lazy Loading)**:

```typescript
// apps/web/app/issues/[id]/page.tsx
import { lazy, Suspense } from 'react';

// Heavy components (syntax highlighter, markdown renderer)
const CodeSection = lazy(() => import('@/components/issues/detail/CodeSection'));
const DescriptionSection = lazy(() => import('@/components/issues/detail/DescriptionSection'));

export default async function IssuePage({ params }: { params: { id: string } }) {
  const issue = await fetchIssueWithRelations(params.id);

  return (
    <div>
      <IssueHeader {...headerProps} />

      {/* Load heavy components lazily */}
      <Suspense fallback={<div>Loading description...</div>}>
        <DescriptionSection issueId={issue.id} description={issue.description} />
      </Suspense>

      {issue.codeSnippet && (
        <Suspense fallback={<div>Loading code...</div>}>
          <CodeSection code={issue.codeSnippet} language={issue.codeLanguage || 'typescript'} />
        </Suspense>
      )}
    </div>
  );
}
```

**Bundle Size Considerations**:

```typescript
// Heavy libraries (only import in Client Components that need them)
import ReactMarkdown from 'react-markdown'; // ~40KB
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // ~150KB

// If possible, use server-side alternatives:
// - Marked (markdown) + DOMPurify → render on server
// - Shiki (syntax highlighting) → render on server, send HTML
```

**Virtual Scrolling (If Needed)**:

```typescript
// apps/web/components/issues/detail/CommentList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function CommentList({ comments }: { comments: Comment[] }) {
  // Only if 100+ comments
  if (comments.length < 100) {
    return comments.map(comment => <CommentItem key={comment.id} comment={comment} />);
  }

  // Virtual scrolling for 100+ comments
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Average comment height
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualRow => (
        <div key={virtualRow.index} style={{ transform: `translateY(${virtualRow.start}px)` }}>
          <CommentItem comment={comments[virtualRow.index]} />
        </div>
      ))}
    </div>
  );
}
```

**Image Optimization**:

```typescript
// Use Next.js Image component for avatars
import Image from 'next/image';

<Image
  src={assignee.avatar}
  alt={assignee.name}
  width={32}
  height={32}
  className="rounded-full"
/>
```

---

## 7. Recommended Component Tree

### Visual Structure

```
page.tsx (Server Component)
├─ fetchIssueWithRelations() ← Prisma query with all includes
│
└─ <div className="grid grid-cols-12">
   │
   ├─ <aside className="col-span-2"> ← Left Sidebar
   │  ├─ QuickActions (Client) ← Watch, Copy Link, Create Branch
   │  └─ WatchersSection (Server) ← Avatar stack
   │
   ├─ <main className="col-span-7"> ← Main Content
   │  ├─ IssueHeader (Server) ← Issue metadata
   │  ├─ IssueActions (Client) ← Status change buttons
   │  ├─ DescriptionSection (Client) ← Markdown + edit mode
   │  ├─ CodeSection (Server) ← Syntax highlighting
   │  ├─ CommentList (Server) ← Display comments
   │  └─ CommentForm (Client) ← Add comment
   │
   └─ <aside className="col-span-3"> ← Right Sidebar
      ├─ IssueDetailSidebar (Server) ← Labels, milestones (Day 4)
      ├─ SystemActivity (Server) ← Timeline, commits, PRs
      ├─ RelatedIssues (Server) ← Linked issues
      └─ AttachmentList (Server) ← File uploads (Day 4)
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ page.tsx (Server)                                            │
│                                                              │
│ 1. Fetch issue data with Prisma                             │
│    const issue = await fetchIssueWithRelations(id)          │
│                                                              │
│ 2. Extract props for each component                         │
│    headerProps = { id, title, status, ... }                 │
│    actionsProps = { issueId, currentStatus }                │
│                                                              │
│ 3. Render components with extracted props                   │
│    <IssueHeader {...headerProps} />                         │
│    <IssueActions {...actionsProps} />                       │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─────────────────┬─────────────────┬─────────────────
                    │                 │                 │
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │ IssueHeader      │ │ IssueActions     │ │ DescriptionSection│
         │ (Server)         │ │ (Client)         │ │ (Client)         │
         │                  │ │                  │ │                  │
         │ - Displays data  │ │ - onClick event  │ │ - useState       │
         │ - No interactivity│ │ - Calls API     │ │ - Toggle edit    │
         │ - Zero JS bundle │ │ - router.refresh()│ │ - API call       │
         └──────────────────┘ └──────────────────┘ └──────────────────┘
                                       │                      │
                                       │                      │
                                       ▼                      ▼
                              ┌──────────────────┐  ┌──────────────────┐
                              │ PATCH /api/issues│  │ PATCH /api/issues│
                              │    /[id]/status  │  │ /[id]/description│
                              └──────────────────┘  └──────────────────┘
                                       │                      │
                                       │                      │
                                       ▼                      ▼
                              ┌──────────────────────────────────────┐
                              │ Database Update                       │
                              └──────────────────────────────────────┘
                                       │
                                       │
                                       ▼
                              ┌──────────────────────────────────────┐
                              │ router.refresh()                     │
                              │ → Re-runs page.tsx                   │
                              │ → Fetches updated data from Prisma   │
                              │ → Server Components re-render        │
                              │ → Client Components receive new props│
                              └──────────────────────────────────────┘
```

### Interaction Flow Example

**Scenario**: User clicks "Resolve Issue" button

```
1. User clicks button in IssueActions (Client Component)
   └─ handleStatusChange('RESOLVED')

2. IssueActions calls API endpoint
   └─ fetch('/api/issues/123/status', { body: { status: 'RESOLVED' } })

3. API route updates database
   └─ prisma.issue.update({ where: { id: 123 }, data: { status: 'RESOLVED' } })

4. API returns success
   └─ res.status(200).json({ success: true })

5. IssueActions calls router.refresh()
   └─ startTransition(() => router.refresh())

6. Next.js re-runs page.tsx
   └─ const issue = await fetchIssueWithRelations('123')
   └─ issue.status === 'RESOLVED' (updated!)

7. Server Components re-render with new data
   └─ <IssueHeader status="RESOLVED" /> ← Shows "Resolved" badge
   └─ <SystemActivity /> ← Shows new status change in timeline

8. Client Components receive new props
   └─ <IssueActions currentStatus="RESOLVED" /> ← Button changes to "Reopen"
```

**No manual state synchronization needed!** ✅

---

## 8. Code Example: Complete page.tsx

```typescript
// apps/web/app/issues/[id]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { IssueWithRelations } from '@/lib/types/issue-detail';

// Components
import { IssueHeader } from '@/components/issues/detail/IssueHeader';
import { SystemActivity } from '@/components/issues/detail/SystemActivity';
import { CodeSection } from '@/components/issues/detail/CodeSection';
import { WatchersSection } from '@/components/issues/detail/WatchersSection';
import { RelatedIssues } from '@/components/issues/detail/RelatedIssues';
import { IssueActions } from '@/components/issues/detail/IssueActions';
import { DescriptionSection } from '@/components/issues/detail/DescriptionSection';
import { QuickActions } from '@/components/issues/detail/QuickActions';
import { CommentList } from '@/components/issues/detail/CommentList';
import { CommentForm } from '@/components/issues/detail/CommentForm';
import { AttachmentList } from '@/components/issues/detail/AttachmentList';
import { IssueDetailSidebar } from '@/components/issues/detail/IssueDetailSidebar';

async function fetchIssueWithRelations(id: string): Promise<IssueWithRelations> {
  const issue = await prisma.issue.findUnique({
    where: { id: parseInt(id) },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
      labels: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      attachments: {
        orderBy: { uploadedAt: 'desc' },
      },
      watchers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      linkedCommits: {
        orderBy: { committedAt: 'desc' },
      },
      linkedPRs: true,
      relatedIssues: {
        select: {
          id: true,
          title: true,
          status: true,
          projectKey: true,
        },
      },
      statusHistory: {
        orderBy: { changedAt: 'desc' },
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  return issue;
}

export default async function IssuePage({
  params,
}: {
  params: { id: string };
}) {
  const [issue, currentUser] = await Promise.all([
    fetchIssueWithRelations(params.id),
    getCurrentUser(),
  ]);

  const canEdit = currentUser?.id === issue.createdById || currentUser?.role === 'ADMIN';
  const isWatched = issue.watchers.some((w) => w.userId === currentUser?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-text-secondary">
        <a href="/dashboard" className="hover:text-primary">Dashboard</a>
        <span className="mx-2">/</span>
        <a href="/issues" className="hover:text-primary">Issues</a>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{issue.projectKey}-{issue.id}</span>
      </nav>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Left Sidebar (2 columns) */}
        <aside className="col-span-12 lg:col-span-2 space-y-6">
          <QuickActions
            issueId={issue.id}
            isWatched={isWatched}
            projectKey={issue.projectKey}
          />

          {issue.watchers.length > 0 && (
            <WatchersSection watchers={issue.watchers} />
          )}
        </aside>

        {/* Main Content (7 columns) */}
        <main className="col-span-12 lg:col-span-7 space-y-6">
          <IssueHeader
            id={issue.id}
            projectKey={issue.projectKey}
            title={issue.title}
            status={issue.status}
            priority={issue.priority}
            assignee={issue.assignee}
            createdAt={issue.createdAt}
            updatedAt={issue.updatedAt}
          />

          <IssueActions
            issueId={issue.id}
            currentStatus={issue.status}
          />

          <DescriptionSection
            issueId={issue.id}
            description={issue.description}
            canEdit={canEdit}
          />

          {issue.codeSnippet && (
            <CodeSection
              code={issue.codeSnippet}
              language={issue.codeLanguage || 'typescript'}
            />
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <CommentList comments={issue.comments} />
            <CommentForm issueId={issue.id} />
          </div>
        </main>

        {/* Right Sidebar (3 columns) */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <IssueDetailSidebar issue={issue} />

          <SystemActivity
            statusHistory={issue.statusHistory}
            linkedCommits={issue.linkedCommits}
            linkedPRs={issue.linkedPRs}
          />

          {issue.relatedIssues.length > 0 && (
            <RelatedIssues issues={issue.relatedIssues} />
          )}

          {issue.attachments.length > 0 && (
            <AttachmentList attachments={issue.attachments} />
          )}
        </aside>
      </div>
    </div>
  );
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const issue = await prisma.issue.findUnique({
    where: { id: parseInt(params.id) },
    select: { title: true, projectKey: true, id: true },
  });

  if (!issue) {
    return { title: 'Issue Not Found' };
  }

  return {
    title: `${issue.projectKey}-${issue.id}: ${issue.title}`,
    description: issue.title,
  };
}
```

---

## 9. Testing Strategy

### Component Tests

```typescript
// apps/web/components/issues/detail/__tests__/IssueHeader.test.tsx
import { render, screen } from '@testing-library/react';
import { IssueHeader } from '../IssueHeader';

describe('IssueHeader', () => {
  const mockProps = {
    id: 123,
    projectKey: 'MOKSHA',
    title: 'Fix authentication bug',
    status: 'OPEN' as const,
    priority: 'HIGH' as const,
    assignee: {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
  };

  it('renders issue title and metadata', () => {
    render(<IssueHeader {...mockProps} />);

    expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    expect(screen.getByText(/MOKSHA-123/)).toBeInTheDocument();
    expect(screen.getByText(/Opened/)).toBeInTheDocument();
  });

  it('renders assignee if provided', () => {
    render(<IssueHeader {...mockProps} />);

    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Assigned to John Doe/)).toBeInTheDocument();
  });

  it('does not render assignee section if null', () => {
    render(<IssueHeader {...mockProps} assignee={null} />);

    expect(screen.queryByText(/Assigned to/)).not.toBeInTheDocument();
  });

  it('renders status and priority badges', () => {
    render(<IssueHeader {...mockProps} />);

    // StatusBadge and PriorityBadge are sub-components
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});
```

### Client Component Interaction Tests

```typescript
// apps/web/components/issues/detail/__tests__/IssueActions.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { IssueActions } from '../IssueActions';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('IssueActions', () => {
  const mockRefresh = jest.fn();
  const mockFetch = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
    global.fetch = mockFetch;
  });

  it('shows "Start Progress" button when status is OPEN', () => {
    render(<IssueActions issueId={123} currentStatus="OPEN" />);

    expect(screen.getByText('Start Progress')).toBeInTheDocument();
  });

  it('calls API and refreshes on status change', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<IssueActions issueId={123} currentStatus="OPEN" />);

    const button = screen.getByText('Start Progress');
    fireEvent.click(button);

    // Loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();

    // API called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/issues/123/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_PROGRESS' }),
        })
      );
    });

    // Router refresh called
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });

    render(<IssueActions issueId={123} currentStatus="OPEN" />);

    const button = screen.getByText('Start Progress');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update status/)).toBeInTheDocument();
    });

    // Router refresh NOT called on error
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
```

### E2E Test

```typescript
// apps/web/e2e/issue-detail.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Issue Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to test issue
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await page.goto('/issues/123');
  });

  test('displays issue header and metadata', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Fix authentication bug');
    await expect(page.locator('text=MOKSHA-123')).toBeVisible();
    await expect(page.locator('text=Open')).toBeVisible();
  });

  test('changes status when clicking action button', async ({ page }) => {
    // Initial status
    await expect(page.locator('text=Open')).toBeVisible();

    // Click "Start Progress"
    await page.click('button:has-text("Start Progress")');

    // Wait for status to update
    await expect(page.locator('text=In Progress')).toBeVisible();

    // Buttons change
    await expect(page.locator('button:has-text("Resolve")')).toBeVisible();
    await expect(page.locator('button:has-text("Reopen")')).toBeVisible();
  });

  test('adds comment and displays in list', async ({ page }) => {
    // Initial comment count
    const initialComments = await page.locator('[data-testid="comment-item"]').count();

    // Add comment
    await page.fill('[name="content"]', 'This is a test comment');
    await page.click('button:has-text("Post Comment")');

    // Wait for comment to appear
    await expect(page.locator('text=This is a test comment')).toBeVisible();

    // Comment count increased
    const newComments = await page.locator('[data-testid="comment-item"]').count();
    expect(newComments).toBe(initialComments + 1);
  });

  test('responsive layout on mobile', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Sidebar should be stacked vertically
    const leftSidebar = page.locator('[data-testid="left-sidebar"]');
    const mainContent = page.locator('[data-testid="main-content"]');
    const rightSidebar = page.locator('[data-testid="right-sidebar"]');

    const leftBox = await leftSidebar.boundingBox();
    const mainBox = await mainContent.boundingBox();
    const rightBox = await rightSidebar.boundingBox();

    // All should be full width
    expect(leftBox?.width).toBeGreaterThan(350);
    expect(mainBox?.width).toBeGreaterThan(350);
    expect(rightBox?.width).toBeGreaterThan(350);
  });

  test('keyboard navigation works', async ({ page }) => {
    // Tab to "Start Progress" button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check focus
    const focusedElement = await page.locator(':focus').textContent();
    expect(focusedElement).toContain('Start Progress');

    // Activate with Enter
    await page.keyboard.press('Enter');

    // Status changes
    await expect(page.locator('text=In Progress')).toBeVisible();
  });
});
```

---

## 10. Performance Targets

### Metrics

- **Initial Load (LCP)**: < 2s
- **Time to Interactive (TTI)**: < 3s
- **First Contentful Paint (FCP)**: < 1.2s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size** (Client Components): < 200KB gzipped

### Optimization Checklist

- [ ] Server Components for static content (IssueHeader, SystemActivity, etc.)
- [ ] Client Components only for interactive parts (IssueActions, CommentForm)
- [ ] Code splitting for heavy components (CodeSection, DescriptionSection)
- [ ] Image optimization with Next.js Image component
- [ ] Prisma query optimization (select only needed fields)
- [ ] React.memo for frequently re-rendering Client Components
- [ ] useCallback for event handlers passed to children
- [ ] useMemo for expensive computations
- [ ] Virtual scrolling for 100+ comments (if needed)
- [ ] Lazy load syntax highlighter and markdown renderer
- [ ] Prefetch related issues on hover (optional)

---

## 11. Accessibility Requirements

### WCAG 2.1 AA Compliance

**Keyboard Navigation**:

```tsx
// All interactive elements must be keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  aria-label="Resolve issue"
>
  Resolve
</button>
```

**Screen Reader Support**:

```tsx
// Semantic HTML and ARIA labels
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/issues">Issues</a></li>
    <li aria-current="page">MOKSHA-123</li>
  </ol>
</nav>

<main aria-label="Issue details">
  <IssueHeader {...props} />
</main>

<aside aria-label="Issue metadata">
  <IssueDetailSidebar {...props} />
</aside>
```

**Color Contrast**:

- Text: 4.5:1 minimum ratio
- Large text (18pt+): 3:1 minimum ratio
- Interactive elements: 3:1 minimum ratio

**Focus Indicators**:

```css
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

## 12. Summary of Recommendations

### Component Tree Structure

✅ **Flatten components directly in page.tsx**

- No wrapper components (LeftSidebar, MainContent, etc.)
- Server Components are free (zero bundle size)
- Clear data flow from single source

### Data Flow Pattern

✅ **Extract and pass explicit props**

- Type-safe component interfaces
- Clear dependencies
- Performance optimization (only re-render when specific props change)
- Exception: Pass objects for complex nested data (arrays, deep objects)

### State Management

✅ **URL state + router.refresh() pattern**

- No React Context needed
- Server Components can't use Context anyway
- Mutations → API call → router.refresh() → Server Components re-render
- Use optimistic UI for instant feedback (optional)

### Type Safety

✅ **Extract Prisma payload type**

- Single source of truth: `IssueWithRelations` type
- Component-specific interfaces derive from it
- TypeScript catches breaking changes immediately

### Performance

✅ **Server-First with selective optimization**

- Server Components for static content (majority)
- Client Components only for interactions (minority)
- Memo only interactive components with callbacks
- Code split heavy libraries (markdown, syntax highlighter)
- Virtual scrolling for 100+ comments (if needed)

### Testing

✅ **Comprehensive test coverage**

- Unit tests for Server Components (render output)
- Interaction tests for Client Components (events, API calls)
- E2E tests for full user flows (status change, comment submission)

---

## Next Steps for Parent Agent

1. **Create API Endpoint**
   - File: `apps/web/app/api/issues/[id]/route.ts`
   - Implement `fetchIssueWithRelations()` query
   - Add error handling and validation

2. **Create Type Definitions**
   - File: `apps/web/lib/types/issue-detail.ts`
   - Define `IssueWithRelations` type from Prisma payload
   - Define component prop interfaces

3. **Implement Server Components** (in order)
   - `IssueHeader.tsx` (static metadata display)
   - `WatchersSection.tsx` (static avatar stack)
   - `SystemActivity.tsx` (static timeline)
   - `CodeSection.tsx` (syntax highlighting - use Shiki server-side)
   - `RelatedIssues.tsx` (static links)

4. **Implement Client Components** (in order)
   - `QuickActions.tsx` (Watch, Copy Link, Create Branch buttons)
   - `IssueActions.tsx` (status change with router.refresh())
   - `DescriptionSection.tsx` (toggle edit mode, API call)

5. **Create Main Page**
   - File: `apps/web/app/issues/[id]/page.tsx`
   - Implement `fetchIssueWithRelations()` function
   - Compose all 12 components with explicit props
   - Add responsive grid layout

6. **Wire Up Existing Components**
   - Import `CommentList`, `CommentForm`, `AttachmentList`, `IssueDetailSidebar` from Day 4
   - Pass required props
   - Verify they work with new data structure

7. **Style with Neumorphic Design**
   - Apply `.neu-raised` classes
   - Coral gradient buttons
   - Responsive breakpoints (375px, 768px, 1440px)

8. **Write Tests**
   - Component tests for all new components
   - E2E test for full user flow
   - Verify accessibility compliance

9. **Performance Audit**
   - Check bundle size (< 200KB gzipped)
   - Lighthouse score (90+ on all metrics)
   - Optimize if needed

---

## Key Insights

**1. Server Components are the default** - Only add "use client" when necessary for interactivity

**2. Flat composition is simpler** - No need for wrapper components when Server Components are free

**3. Explicit props prevent bugs** - Type-safe interfaces catch issues at compile time

**4. router.refresh() replaces state management** - No Context needed for Server Component updates

**5. Performance comes from architecture** - Choose Server vs Client carefully, optimize selectively

**6. TypeScript + Prisma = DX magic** - Extract types from Prisma queries for full type safety

---

**Implementation complexity**: Medium (12 components, 3-column layout, real-time updates)

**Estimated implementation time**: 3-4 hours (following this plan)

**Token budget for implementation**: ~60-80K tokens (includes testing)

**Risk level**: Low (well-defined patterns, clear architecture)

---

**Parent agent**: Read this plan and begin Phase 1 (API Endpoint) implementation.
