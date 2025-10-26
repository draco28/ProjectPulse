---
name: moksha-database-patterns
description: Prisma ORM patterns for Moksha DevHub using PostgreSQL 16. Use when querying database, creating migrations, or working with models and relations.
triggers:
  ['prisma', 'database query', 'schema', 'migration', 'findMany', 'create', 'update', 'delete']
token_estimate: 200
last_updated: 2025-10-26
related_docs:
  - ../../.agent/system/database-schema.md
---

# Moksha Database Patterns

## Common Queries

**Find All (with Relations)**:

```typescript
const issues = await prisma.issue.findMany({
  include: {
    assignee: true,
    labels: true,
  },
  orderBy: { createdAt: 'desc' },
});
```

**Find One**:

```typescript
const issue = await prisma.issue.findUnique({
  where: { id: issueId },
  include: { assignee: true },
});

if (!issue) {
  throw new Error('Issue not found');
}
```

**Create**:

```typescript
const issue = await prisma.issue.create({
  data: {
    title: 'New Issue',
    description: 'Description',
    status: 'OPEN',
    creatorId: userId,
  },
  include: { creator: true }, // Return with relations
});
```

**Update**:

```typescript
const updated = await prisma.issue.update({
  where: { id: issueId },
  data: { status: 'CLOSED', closedAt: new Date() },
});
```

**Delete**:

```typescript
await prisma.issue.delete({
  where: { id: issueId },
});
```

## Our Conventions

**Client Instance**:

```typescript
// lib/db.ts (single instance)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Always Use**:

- Single Prisma client instance (lib/db.ts)
- `include` for relations (not separate queries)
- Proper error handling
- TypeScript types from Prisma

**Never Use**:

- Raw SQL (except for complex queries)
- Multiple Prisma instances
- Undefined/null checks without proper handling

## Relations

**Loading Relations** (`include`):

```typescript
// Load all related data
const issue = await prisma.issue.findUnique({
  where: { id },
  include: {
    assignee: true,
    labels: true,
    comments: {
      include: { author: true },
    },
  },
});
```

**Selective Fields** (`select`):

```typescript
// Only load specific fields
const issues = await prisma.issue.findMany({
  select: {
    id: true,
    title: true,
    assignee: {
      select: { name: true, email: true },
    },
  },
});
```

## Filtering & Pagination

**Where Clauses**:

```typescript
const issues = await prisma.issue.findMany({
  where: {
    status: 'OPEN',
    priority: { in: ['HIGH', 'URGENT'] },
    createdAt: { gte: new Date('2025-01-01') },
  },
});
```

**Cursor Pagination**:

```typescript
const issues = await prisma.issue.findMany({
  take: 21, // Get 1 extra to check hasMore
  ...(cursor && {
    cursor: { id: cursor },
    skip: 1, // Skip the cursor
  }),
  orderBy: { createdAt: 'desc' },
});

const hasMore = issues.length > 20;
const data = hasMore ? issues.slice(0, 20) : issues;
```

## Migrations

**Create Migration**:

```bash
# After changing schema.prisma
pnpm prisma migrate dev --name add_issue_model
```

**Apply Migrations (Production)**:

```bash
pnpm prisma migrate deploy
```

**Generate Client** (after schema changes):

```bash
pnpm prisma generate
```

**Reset Database** (dev only):

```bash
pnpm prisma migrate reset
```

## Transactions

**Multiple Operations** (all or nothing):

```typescript
await prisma.$transaction(async (tx) => {
  const issue = await tx.issue.create({ data: issueData });
  await tx.activity.create({
    data: {
      type: 'ISSUE_CREATED',
      issueId: issue.id,
    },
  });
});
```

## TypeScript Types

**From Prisma**:

```typescript
import type { Issue, User, Prisma } from '@prisma/client';

// With relations
type IssueWithAssignee = Prisma.IssueGetPayload<{
  include: { assignee: true };
}>;
```

## Error Handling

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.issue.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Issue already exists');
    }
  }
  throw error;
}
```

## Full Documentation

**Database Schema Reference**: [.agent/system/database-schema.md](../../.agent/system/database-schema.md)

- All models and fields
- Enums
- Indexes
- Extensions (pgvector, full-text search)
- Common queries
- Performance tips

---

**Token Cost**: ~200 tokens (vs ~2,800 in full schema doc)
**Coverage**: 90% of common database operations
**When to Use Full Docs**: Complex queries, full-text search, vector search, optimization
