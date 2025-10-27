# SOP: Type Serialization for Server to Client Data Transfer

## Purpose

Standard procedure for converting Prisma query results (with Date objects and numeric IDs) to JSON-serializable types for Client Components. Ensures type safety and prevents serialization errors when passing data from Server Components to Client Components.

## When to Use

- Passing Prisma query results to Client Components as props
- Returning data from Server Components to pages
- Converting database types for JSON API responses
- Any time you see: "Error: Objects are not valid as a React child" or "Date cannot be serialized"

**Critical**: Next.js Server Components cannot pass non-serializable objects (Date, BigInt, functions) to Client Components.

## Prerequisites

- Understanding of Next.js Server Components vs Client Components
- Familiarity with Prisma type system
- Knowledge of TypeScript utility types

---

## The Problem

### What Prisma Returns (Server-Side)

```typescript
// Prisma query result
const issue = await prisma.issue.findUnique({
  where: { id: 1 },
  include: {
    comments: true,
  },
});

// Type:
{
  id: number,              // ❌ Not URL-safe
  createdAt: Date,         // ❌ Not JSON-serializable
  updatedAt: Date,         // ❌ Not JSON-serializable
  comments: Comment[]      // ❌ Contains Date objects
}
```

### What Client Components Need (Client-Side)

```typescript
// Props for client component
{
  id: string,              // ✅ URL-safe, can be used in routing
  createdAt: string,       // ✅ JSON-serializable ISO string
  updatedAt: string,       // ✅ JSON-serializable ISO string
  comments: {              // ✅ All serialized
    createdAt: string,
    // ...
  }[]
}
```

### The Error You'll See

```
Error: Error serializing `.issue.createdAt` returned from `getServerSideProps` in "/issues/[id]".
Reason: `object` ("[object Date]") cannot be serialized as JSON. Please only return JSON serializable data types.
```

---

## Core Pattern

### Three-Step Type System

1. **Server-Side Types**: Prisma query result types (Date, number IDs)
2. **Client-Side Types**: Serialized types (ISO strings, string IDs)
3. **Serialization Function**: Converts server types → client types

---

## Procedure

### Step 1: Define Server-Side Type

Use Prisma's `GetPayload` utility to extract the exact type from your query.

**Pattern**:

```typescript
// apps/web/types/issue.ts

import { Prisma } from '@prisma/client';

/**
 * Issue Detail query result type
 * Matches the Prisma query in app/issues/[id]/page.tsx
 */
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
    attachments: {
      select: {
        id: true;
        filename: true;
        filepath: true;
        mimetype: true;
        size: true;
        uploadedAt: true;
      };
    };
    labels: {
      select: {
        id: true;
        name: true;
        color: true;
      };
    };
  };
}>;
```

**Why use `Prisma.GetPayload`?**

- Extracts exact type from your `include`/`select` structure
- Type-safe: Changes to query automatically update type
- Avoids manual type definitions that can drift

**Gotcha**: The `include`/`select` structure must **exactly match** your Prisma query

---

### Step 2: Define Client-Side Types

Create serialized interfaces for Client Components.

**Transformations needed**:

- `number` IDs → `string` IDs (for URL routing, client-side safety)
- `Date` objects → `string` (ISO 8601 format)
- Nested relations → recursively serialized

**Pattern**:

```typescript
// apps/web/types/issue.ts

/**
 * Serialized comment for client components
 * Dates converted to ISO strings for JSON serialization
 */
export interface CommentProps {
  id: string; // Converted from number
  content: string;
  author: string | null;
  createdAt: string; // Converted from Date
  updatedAt: string; // Converted from Date
}

/**
 * Complete serialized issue for client components
 * All dates converted to ISO strings, all IDs to strings
 */
export interface IssueDetailProps {
  id: string; // Converted from number
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'closed'; // Narrowed from string
  priority: 'critical' | 'high' | 'medium' | 'low'; // Narrowed from string
  createdAt: string; // Converted from Date
  updatedAt: string; // Converted from Date
  closedAt: string | null; // Converted from Date | null

  // Relations (all serialized)
  comments: CommentProps[];
  attachments: AttachmentProps[];
  labels: LabelProps[];
}
```

**Gotcha**:

- Use **string literal unions** for enums (`'open' | 'in_progress' | 'closed'`)
- Preserve nullability (`string | null`, not `string`)
- Don't forget to serialize nested relations recursively

---

### Step 3: Create Serialization Function

Implement a function that converts server types to client types.

**Pattern**:

```typescript
// apps/web/types/issue.ts

/**
 * Converts Prisma Issue query result to serialized props for client components
 *
 * Transformations:
 * - number IDs → string IDs (for URLs and client-side routing)
 * - Date objects → ISO string (for JSON serialization)
 * - Prisma relations → nested serialized objects
 *
 * @param issue - Issue query result from Prisma
 * @returns Serialized issue props ready for client components
 */
export function serializeIssueDetail(issue: IssueDetail): IssueDetailProps {
  return {
    // Primitive fields
    id: issue.id.toString(),
    title: issue.title,
    description: issue.description,
    status: issue.status as IssueDetailProps['status'],
    priority: issue.priority as IssueDetailProps['priority'],

    // Date fields
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    closedAt: issue.closedAt?.toISOString() || null,

    // Nested relations (map and serialize each)
    comments: issue.comments.map((comment) => ({
      id: comment.id.toString(),
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),

    attachments: issue.attachments.map((attachment) => ({
      id: attachment.id.toString(),
      filename: attachment.filename,
      filepath: attachment.filepath,
      mimetype: attachment.mimetype,
      size: attachment.size,
      uploadedAt: attachment.uploadedAt.toISOString(),
    })),

    labels: issue.labels.map((label) => ({
      id: label.id.toString(),
      name: label.name,
      color: label.color,
    })),
  };
}
```

**Key transformations**:

1. **Number to string**: `issue.id.toString()`
2. **Date to ISO string**: `issue.createdAt.toISOString()`
3. **Nullable Date**: `issue.closedAt?.toISOString() || null`
4. **Enums/strings**: `issue.status as IssueDetailProps['status']` (type assertion)
5. **Arrays**: `issue.comments.map(...)` (serialize each item)

**Gotcha**:

- Use `.toISOString()` not `.toString()` for Dates (ISO format is standard)
- Handle nullable Dates with optional chaining: `?.toISOString() || null`
- Don't forget to serialize nested arrays (use `.map()`)

---

### Step 4: Use in Server Component

Fetch data with Prisma, serialize it, and pass to Client Components.

**Pattern**:

```typescript
// apps/web/app/issues/[id]/page.tsx (Server Component)

import { prisma } from '@/lib/prisma';
import { serializeIssueDetail, type IssueDetail } from '@/types/issue';
import { CommentList } from '@/components/issues/detail/CommentList'; // Client Component

async function getIssueDetail(id: number): Promise<IssueDetail | null> {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      comments: {
        select: {
          id: true,
          content: true,
          author: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      // ... other includes
    },
  });

  return issue;
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  // Fetch issue with Prisma (returns Date objects)
  const issue = await getIssueDetail(issueId);

  if (!issue) {
    notFound();
  }

  // Serialize for client components (Dates → ISO strings)
  const serializedIssue = serializeIssueDetail(issue);

  return (
    <div>
      {/* Pass serialized data to Client Component */}
      <CommentList
        issueId={serializedIssue.id}
        initialComments={serializedIssue.comments}
      />
    </div>
  );
}
```

**Gotcha**:

- Call serialization function **in Server Component** before passing to Client Component
- Don't try to serialize in Client Component (Date objects won't reach it)

---

### Step 5: Use in Client Component

Receive serialized props and use them safely.

**Pattern**:

```typescript
// apps/web/components/issues/detail/CommentList.tsx (Client Component)

'use client';

import { CommentProps } from '@/types/issue';
import { format } from 'date-fns';

interface CommentListProps {
  issueId: string;
  initialComments: CommentProps[];
}

export function CommentList({ issueId, initialComments }: CommentListProps) {
  return (
    <div>
      {initialComments.map((comment) => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          {/* Convert ISO string back to Date for formatting */}
          <time>{format(new Date(comment.createdAt), 'MMM d, yyyy')}</time>
        </div>
      ))}
    </div>
  );
}
```

**Working with ISO strings in client**:

- Format dates: `format(new Date(comment.createdAt), 'MMM d, yyyy')`
- Display time ago: `formatDistanceToNow(new Date(comment.createdAt))`
- Use directly in `<time>` element: `<time dateTime={comment.createdAt}>`

**Gotcha**:

- Convert ISO string back to Date when needed: `new Date(comment.createdAt)`
- Don't mutate props (use state if you need to modify)

---

## Common Patterns

### Pattern 1: Simple Resource (No Relations)

**Server type**:

```typescript
export type Label = Prisma.LabelGetPayload<{
  select: {
    id: true;
    name: true;
    color: true;
  };
}>;
```

**Client type**:

```typescript
export interface LabelProps {
  id: string;
  name: string;
  color: string;
}
```

**Serializer**:

```typescript
export function serializeLabel(label: Label): LabelProps {
  return {
    id: label.id.toString(),
    name: label.name,
    color: label.color,
  };
}
```

### Pattern 2: Resource with Nested Relations

**Server type**:

```typescript
export type IssueWithProject = Prisma.IssueGetPayload<{
  include: {
    project: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;
```

**Client type**:

```typescript
export interface ProjectProps {
  id: string;
  name: string;
}

export interface IssueWithProjectProps {
  id: string;
  title: string;
  createdAt: string;
  project: ProjectProps; // Nested serialized object
}
```

**Serializer**:

```typescript
export function serializeIssueWithProject(issue: IssueWithProject): IssueWithProjectProps {
  return {
    id: issue.id.toString(),
    title: issue.title,
    createdAt: issue.createdAt.toISOString(),
    project: {
      id: issue.project.id.toString(),
      name: issue.project.name,
    },
  };
}
```

### Pattern 3: Resource with Counts

**Server type**:

```typescript
export type IssueWithCounts = Prisma.IssueGetPayload<{
  include: {
    _count: {
      select: {
        comments: true;
        attachments: true;
      };
    };
  };
}>;
```

**Client type**:

```typescript
export interface IssueWithCountsProps {
  id: string;
  title: string;
  commentCount: number; // Flattened from _count
  attachmentCount: number; // Flattened from _count
}
```

**Serializer**:

```typescript
export function serializeIssueWithCounts(issue: IssueWithCounts): IssueWithCountsProps {
  return {
    id: issue.id.toString(),
    title: issue.title,
    // Flatten _count into individual fields
    commentCount: issue._count.comments,
    attachmentCount: issue._count.attachments,
  };
}
```

---

## File Organization

### Recommended Structure

```
apps/web/
├── types/
│   ├── issue.ts           # Issue types + serializers
│   ├── project.ts         # Project types + serializers
│   └── user.ts            # User types + serializers
├── app/
│   └── issues/
│       └── [id]/
│           └── page.tsx   # Server Component (fetches + serializes)
└── components/
    └── issues/
        └── detail/
            └── CommentList.tsx  # Client Component (receives serialized props)
```

### Type File Template

```typescript
// apps/web/types/[resource].ts

import { Prisma } from '@prisma/client';

// ============================================================================
// SERVER-SIDE TYPES (from Prisma queries)
// ============================================================================

export type ResourceDetail = Prisma.ResourceGetPayload<{
  include: {
    // ... your include structure
  };
}>;

// ============================================================================
// CLIENT-SIDE TYPES (for React component props)
// ============================================================================

export interface ResourceDetailProps {
  id: string;
  // ... serialized fields
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

export function serializeResourceDetail(resource: ResourceDetail): ResourceDetailProps {
  return {
    // ... transformation logic
  };
}

// ============================================================================
// API RESPONSE TYPES (optional)
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
```

---

## Verification Checklist

After implementing serialization:

- [ ] Server-side type uses `Prisma.GetPayload` (type-safe)
- [ ] Client-side type has all `number` → `string` conversions
- [ ] Client-side type has all `Date` → `string` conversions
- [ ] Serialization function handles all fields
- [ ] Serialization function handles nullable fields correctly
- [ ] Serialization function handles nested relations (arrays)
- [ ] Server Component calls serializer before passing to Client Component
- [ ] Client Component receives serialized props (no Date objects)
- [ ] No "cannot serialize Date" errors in browser console
- [ ] Types exported from single source of truth file

---

## Troubleshooting

### Issue: "Error serializing Date"

**Symptom**: Runtime error about Date serialization
**Cause**: Forgot to serialize before passing to Client Component
**Solution**: Call serialization function in Server Component:

```typescript
const serialized = serializeResource(resource);
return <ClientComponent data={serialized} />;
```

### Issue: TypeScript Error on `.toString()`

**Symptom**: "Property 'toString' does not exist on type 'never'"
**Cause**: Prisma type doesn't include `id` field
**Solution**: Add `id: true` to your `select` or `include` structure

### Issue: Nullable Date Conversion Error

**Symptom**: "Cannot read property 'toISOString' of null"
**Cause**: Not handling nullable Dates
**Solution**: Use optional chaining:

```typescript
closedAt: issue.closedAt?.toISOString() || null;
```

### Issue: Type Mismatch in Client Component

**Symptom**: TypeScript error "Type 'Date' is not assignable to type 'string'"
**Cause**: Client Component expecting serialized type but receiving Prisma type
**Solution**: Ensure Server Component calls serialization function

### Issue: Nested Relation Not Serialized

**Symptom**: Client Component receives Date objects in nested array
**Cause**: Forgot to serialize nested relations
**Solution**: Use `.map()` to serialize each nested item:

```typescript
comments: issue.comments.map((comment) => ({
  id: comment.id.toString(),
  createdAt: comment.createdAt.toISOString(),
  // ...
}));
```

---

## Advanced Patterns

### Generic Serialization Helper

For repeated patterns, create generic helpers:

```typescript
// apps/web/lib/serialization.ts

/**
 * Generic helper to serialize array of objects with Dates
 */
export function serializeWithDates<T extends { id: number; createdAt: Date; updatedAt: Date }>(
  items: T[]
): Array<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
> {
  return items.map((item) => ({
    ...item,
    id: item.id.toString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}
```

### Partial Serialization

Sometimes you only need to serialize specific fields:

```typescript
export function serializeIssueSummary(issue: Issue): IssueSummaryProps {
  return {
    id: issue.id.toString(),
    title: issue.title,
    status: issue.status,
    // Only serialize what's needed for the summary view
  };
}
```

---

## Real-World Example

**Scenario**: Issue Detail Page with comments, attachments, and labels

**Files involved**:

1. `apps/web/types/issue.ts` - Types and serializers
2. `apps/web/app/issues/[id]/page.tsx` - Server Component
3. `apps/web/components/issues/detail/CommentList.tsx` - Client Component

**See full implementation in codebase for complete example.**

---

## Related Documentation

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [api-route-creation.md](./api-route-creation.md) - API route patterns
- [server-component-data-fetching.md](./server-component-data-fetching.md) - Data fetching patterns

---

## Quick Reference

### Type Conversions

| Prisma Type       | Client Type          | Conversion                      |
| ----------------- | -------------------- | ------------------------------- |
| `number` ID       | `string`             | `.toString()`                   |
| `Date`            | `string`             | `.toISOString()`                |
| `Date \| null`    | `string \| null`     | `?.toISOString() \|\| null`     |
| `string` enum     | string literal union | `as 'open' \| 'closed'`         |
| nested array      | serialized array     | `.map(item => serialize(item))` |
| `_count.comments` | `number`             | direct access                   |

### Checklist for New Resource

```markdown
- [ ] Define server-side type with `Prisma.GetPayload`
- [ ] Define client-side interface (string IDs, ISO dates)
- [ ] Create serialization function
- [ ] Export all from types file
- [ ] Use in Server Component before passing to Client
- [ ] Test with actual Prisma query
- [ ] Verify no Date serialization errors
```

---

**Last Updated**: 2025-10-28
**Created From**: Phase 3 Day 4 implementation (Issue Detail Page type system)
**Priority**: CRITICAL - Required for all Server → Client data transfer
