# SOP: Server Component Data Fetching with Prisma

## Purpose

Standard procedure for fetching data in Next.js Server Components using optimized Prisma queries. Ensures efficient database queries, proper type safety, and optimal performance through selective field selection and strategic use of `include`.

## When to Use

- Fetching data for Server Component pages
- Loading initial data for pages with Client Components
- Implementing detail pages (e.g., issue detail, project detail)
- Any server-side data loading that will be rendered or passed to Client Components

**Note**: This is for **Server Components only**. Client Components use API routes or Server Actions.

## Prerequisites

- Understanding of Next.js Server Components
- Familiarity with Prisma query API
- Knowledge of TypeScript

---

## Core Principles

### 1. Single Optimized Query

**Avoid N+1 queries** by fetching all related data in one query using `include`.

❌ **Bad** (N+1 queries):

```typescript
const issue = await prisma.issue.findUnique({ where: { id } });
const comments = await prisma.comment.findMany({ where: { issueId: id } }); // Additional query
const attachments = await prisma.attachment.findMany({ where: { issueId: id } }); // Another query
```

✅ **Good** (single query with include):

```typescript
const issue = await prisma.issue.findUnique({
  where: { id },
  include: {
    comments: true,
    attachments: true,
  },
});
```

### 2. Selective Field Selection

**Fetch only needed fields** using `select` to reduce database load and network transfer.

❌ **Bad** (fetches all fields):

```typescript
include: {
  comments: true, // Returns all comment fields
}
```

✅ **Good** (selective fields):

```typescript
include: {
  comments: {
    select: {
      id: true,
      content: true,
      author: true,
      createdAt: true,
      // Omit large/unused fields
    },
  },
}
```

### 3. Use `_count` for Counts

**Don't fetch full relations** when you only need counts.

❌ **Bad** (fetches all comments just to count):

```typescript
include: {
  comments: true, // Loads all comment data
}
// Then count in code: issue.comments.length
```

✅ **Good** (use Prisma \_count):

```typescript
include: {
  _count: {
    select: {
      comments: true,
      attachments: true,
    },
  },
}
// Access: issue._count.comments
```

---

## Procedure

### Step 1: Create Data Fetching Function

Define an async function that returns typed Prisma query results.

**Pattern**:

```typescript
// apps/web/app/issues/[id]/page.tsx

import { prisma } from '@/lib/prisma';
import type { IssueDetail } from '@/types/issue'; // Prisma.GetPayload type

/**
 * Fetches complete issue details with all relations
 *
 * Query strategy:
 * - Single query with selective includes (avoids N+1 queries)
 * - Orders comments chronologically (ASC)
 * - Limits linked commits to recent 10
 * - Returns null if issue not found (handled by notFound())
 */
async function getIssueDetail(id: number): Promise<IssueDetail | null> {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      // Implementation in Step 2...
    },
  });

  return issue;
}
```

**Function naming convention**:

- `get[Resource]Detail(id)` - Single resource with relations
- `get[Resource]List(params)` - Multiple resources
- `get[Resource]Summary(id)` - Resource with minimal data

**Gotcha**:

- Return type should match Prisma query structure (use `Prisma.GetPayload`)
- Return `null` for not found (don't throw error)
- Add JSDoc to explain query strategy

---

### Step 2: Structure the Prisma Query

Build the query with careful attention to `include` vs `select`.

**Complete example**:

```typescript
async function getIssueDetail(id: number): Promise<IssueDetail | null> {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      // Related data with ordering
      comments: {
        orderBy: { createdAt: 'asc' }, // Chronological order
        select: {
          id: true,
          content: true,
          author: true,
          createdAt: true,
          updatedAt: true,
          // Omit: issueId (already known from parent)
        },
      },

      // Attachments with metadata
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

      // Labels for categorization
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },

      // Linked files from codebase
      linkedFiles: {
        select: {
          id: true,
          filePath: true,
          lineNumber: true,
          createdAt: true,
        },
      },

      // Recent commit history (limited)
      linkedCommits: {
        orderBy: { commitDate: 'desc' },
        take: 10, // Limit to most recent
        select: {
          id: true,
          commitHash: true,
          commitMessage: true,
          commitDate: true,
        },
      },

      // Project context (minimal fields)
      project: {
        select: {
          id: true,
          name: true,
          repository: true,
          // Omit: description, createdAt, updatedAt, etc.
        },
      },

      // Counts (don't fetch full relations)
      _count: {
        select: {
          comments: true,
          attachments: true,
        },
      },
    },
  });

  return issue;
}
```

**Key strategies**:

1. **Order by** for chronological/sorted data (`orderBy: { createdAt: 'asc' }`)
2. **Limit** large relations (`take: 10`)
3. **Select** only needed fields (`select: { id: true, name: true }`)
4. **Count** instead of fetching (`_count: { select: { comments: true } }`)

**Gotcha**:

- When using `include`, you can nest `select` inside to choose fields
- Can't use `include` and `select` at same level (choose one)
- `orderBy` and `take` work inside `include`

---

### Step 3: Handle Not Found

Return `null` for missing resources, handle in page component.

**Pattern**:

```typescript
async function getIssueDetail(id: number): Promise<IssueDetail | null> {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      /* ... */
    },
  });

  return issue; // Returns null if not found
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  const issue = await getIssueDetail(issueId);

  if (!issue) {
    notFound(); // Next.js 404 page
  }

  // Continue with rendering...
}
```

**Why not throw?**

- Throwing creates 500 error (server error)
- `notFound()` creates proper 404 response
- More semantic and SEO-friendly

**Gotcha**:

- Check for `null` immediately after query
- Call `notFound()` from `next/navigation` (not custom error)

---

### Step 4: Serialize for Client Components

Convert Prisma types to JSON-serializable types before passing to Client Components.

**Pattern**:

```typescript
import { serializeIssueDetail } from '@/types/issue';

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  // Fetch issue (returns Prisma types with Date objects)
  const issue = await getIssueDetail(issueId);

  if (!issue) {
    notFound();
  }

  // Serialize for client components (Dates → ISO strings, numbers → strings)
  const serializedIssue = serializeIssueDetail(issue);

  return (
    <div>
      {/* Pass serialized data to Client Components */}
      <CommentList
        issueId={serializedIssue.id}
        initialComments={serializedIssue.comments}
      />
    </div>
  );
}
```

**See**: [type-serialization.md](./type-serialization.md) for full serialization patterns

---

### Step 5: Optimize Query Performance

Apply performance optimizations based on data size and usage.

**Optimization strategies**:

#### Use Indexes

Ensure frequently queried fields have database indexes.

```prisma
// prisma/schema.prisma

model Issue {
  id       Int      @id @default(autoincrement())
  status   String   // Frequently filtered
  priority String   // Frequently filtered

  @@index([status])    // Add index for status queries
  @@index([priority])  // Add index for priority queries
  @@index([createdAt]) // Add index for sorting
}
```

#### Limit Large Relations

Use `take` to limit potentially large arrays.

```typescript
linkedCommits: {
  orderBy: { commitDate: 'desc' },
  take: 10, // Only recent 10 commits
  select: { /* ... */ },
}
```

#### Use `distinct` for Unique Values

```typescript
const uniqueLabels = await prisma.label.findMany({
  where: { issues: { some: { projectId } } },
  distinct: ['name'], // Only unique label names
  select: { name: true, color: true },
});
```

#### Use Cursor-Based Pagination

For large lists, use cursor pagination instead of offset.

```typescript
const issues = await prisma.issue.findMany({
  take: 20,
  skip: 1, // Skip cursor itself
  cursor: {
    id: lastIssueId, // Cursor position
  },
  orderBy: { id: 'asc' },
});
```

---

## Common Patterns

### Pattern 1: Detail Page (Single Resource + Relations)

```typescript
async function getResourceDetail(id: number) {
  return await prisma.resource.findUnique({
    where: { id },
    include: {
      // Related data with selective fields
      relatedItems: {
        select: {
          id: true,
          name: true,
          // Only essential fields
        },
      },

      // Counts instead of full data
      _count: {
        select: {
          largeRelation: true,
        },
      },
    },
  });
}
```

### Pattern 2: List Page (Multiple Resources)

```typescript
async function getResourceList(filters: { status?: string; limit?: number }) {
  return await prisma.resource.findMany({
    where: {
      status: filters.status || undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 20,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      // Omit large fields like description

      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
}
```

### Pattern 3: Summary/Preview (Minimal Data)

```typescript
async function getResourceSummary(id: number) {
  return await prisma.resource.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      // No relations, minimal fields
    },
  });
}
```

### Pattern 4: Nested Detail (Deep Relations)

```typescript
async function getProjectWithIssues(id: number) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      issues: {
        orderBy: { priority: 'asc' },
        take: 10, // Recent issues only
        select: {
          id: true,
          title: true,
          status: true,

          // Nested relation (be careful!)
          _count: {
            select: {
              comments: true, // Count, not full data
            },
          },
        },
      },
    },
  });
}
```

**Gotcha**: Deeply nested includes can become slow. Consider separate queries for deep nesting.

---

## Verification Checklist

After implementing data fetching:

- [ ] Single query used (no N+1 queries)
- [ ] All relations use `select` (not fetching unnecessary fields)
- [ ] Counts use `_count` (not loading full relations)
- [ ] Large relations limited with `take`
- [ ] Sorting applied where needed (`orderBy`)
- [ ] Function returns typed result (`Promise<Type | null>`)
- [ ] `null` handled with `notFound()` in page
- [ ] Data serialized before passing to Client Components
- [ ] Query performance tested with realistic data size
- [ ] Indexes exist for filtered/sorted fields

---

## Troubleshooting

### Issue: Slow Query Performance

**Symptom**: Page takes >1s to load
**Possible causes**:

1. Missing database indexes
2. Fetching too many fields
3. N+1 queries (multiple separate queries)
4. Deeply nested includes

**Solution**:

1. Add indexes in Prisma schema: `@@index([fieldName])`
2. Use `select` to fetch only needed fields
3. Combine queries with `include`
4. Limit nested includes with `take`

**Check with Prisma logging**:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"] // Enable query logging
}
```

### Issue: "Cannot serialize Date"

**Symptom**: Error when passing data to Client Component
**Cause**: Forgot to serialize Prisma types
**Solution**: Call serialization function before passing:

```typescript
const serialized = serializeResource(resource);
return <ClientComponent data={serialized} />;
```

**See**: [type-serialization.md](./type-serialization.md)

### Issue: Getting Too Much Data

**Symptom**: Large API responses, slow rendering
**Cause**: Using `include` without `select`
**Solution**: Add `select` inside `include`:

```typescript
include: {
  comments: {
    select: {
      id: true,
      content: true,
      // Only needed fields
    },
  },
}
```

### Issue: TypeScript Type Errors

**Symptom**: "Type 'null' is not assignable to parameter of type..."
**Cause**: Not handling null case from query
**Solution**: Check for null before using:

```typescript
const resource = await getResource(id);
if (!resource) {
  notFound();
}
// TypeScript now knows resource is not null
```

### Issue: Memory Leak/High Memory Usage

**Symptom**: Server memory grows over time
**Cause**: Fetching too many large relations without limits
**Solution**:

1. Use `take` to limit relation size
2. Implement pagination for large lists
3. Use `select` to reduce field size
4. Consider separate queries for very large data

---

## Advanced Patterns

### Conditional Includes

Include relations based on conditions:

```typescript
async function getIssueDetail(id: number, includeHistory: boolean) {
  return await prisma.issue.findUnique({
    where: { id },
    include: {
      comments: true, // Always include

      // Conditionally include history
      ...(includeHistory && {
        linkedCommits: {
          orderBy: { commitDate: 'desc' },
          take: 50,
        },
      }),
    },
  });
}
```

### Aggregations

Use Prisma aggregations for computed values:

```typescript
const stats = await prisma.issue.aggregate({
  where: { projectId },
  _count: {
    id: true, // Total issues
  },
  _avg: {
    priority: true, // Average priority (if numeric)
  },
});
```

### Group By

Group data for analytics:

```typescript
const issuesByStatus = await prisma.issue.groupBy({
  by: ['status'],
  _count: {
    id: true,
  },
  where: { projectId },
});
```

### Raw Queries (Last Resort)

For complex queries not supported by Prisma:

```typescript
const result = await prisma.$queryRaw`
  SELECT i.*, COUNT(c.id) as comment_count
  FROM "Issue" i
  LEFT JOIN "Comment" c ON c."issueId" = i.id
  WHERE i.id = ${id}
  GROUP BY i.id
`;
```

**⚠️ Use sparingly**: Raw queries bypass Prisma type safety.

---

## Real-World Example

**Scenario**: Issue Detail Page

**Requirements**:

- Show issue with all details
- Display recent 10 commits
- Show comment count (not all comments initially)
- Show all labels and attachments
- Include project name

**Implementation**:

```typescript
// apps/web/app/issues/[id]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeIssueDetail, type IssueDetail } from '@/types/issue';

async function getIssueDetail(id: number): Promise<IssueDetail | null> {
  return await prisma.issue.findUnique({
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
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      linkedCommits: {
        orderBy: { commitDate: 'desc' },
        take: 10, // Recent 10 only
        select: {
          id: true,
          commitHash: true,
          commitMessage: true,
          commitDate: true,
        },
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
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  // Lightweight query for metadata only
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { title: true, id: true },
  });

  if (!issue) {
    return {
      title: 'Issue Not Found',
    };
  }

  return {
    title: `#${issue.id} ${issue.title} | Issues`,
  };
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  const issue = await getIssueDetail(issueId);

  if (!issue) {
    notFound();
  }

  const serializedIssue = serializeIssueDetail(issue);

  return (
    <div>
      {/* Render issue details */}
    </div>
  );
}
```

**Query efficiency**:

- **Single query** for all data (no N+1)
- **Selective fields** (only needed columns)
- **Limited commits** (10 most recent)
- **Separate metadata query** (lightweight for `<head>`)

**See full implementation**: `apps/web/app/issues/[id]/page.tsx`

---

## Related Documentation

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Prisma Query API](https://www.prisma.io/docs/concepts/components/prisma-client/crud)
- [type-serialization.md](./type-serialization.md) - Serializing for Client Components
- [api-route-creation.md](./api-route-creation.md) - API endpoint patterns
- [database-schema.md](../system/database-schema.md) - Prisma schema reference

---

## Quick Reference

### Query Strategy Decision Tree

```
Need full relation data?
  ├─ Yes → Use `include` with `select` for fields
  │        include: { comments: { select: { id: true, content: true } } }
  │
  └─ No → Use `_count` for counts
           include: { _count: { select: { comments: true } } }

Large relation (100+ items)?
  ├─ Yes → Add `take` limit
  │        include: { items: { take: 20 } }
  │
  └─ No → Include all
           include: { items: true }

Need sorted data?
  ├─ Yes → Add `orderBy`
  │        include: { items: { orderBy: { createdAt: 'desc' } } }
  │
  └─ No → Default order

Need all fields?
  ├─ Yes → Use `include: { relation: true }`
  │
  └─ No → Use `include: { relation: { select: { ... } } }`
```

### Performance Checklist

```markdown
- [ ] Single query used (no N+1)
- [ ] Selective fields (`select`)
- [ ] Counts use `_count`
- [ ] Large relations limited (`take`)
- [ ] Sorted data uses `orderBy`
- [ ] Indexes exist for filters/sorts
- [ ] Data serialized for Client Components
- [ ] Query tested with realistic data size
```

---

**Last Updated**: 2025-10-28
**Created From**: Phase 3 Day 4 implementation (Issue Detail Page data fetching)
**Priority**: HIGH - Follow for all Server Component data fetching
