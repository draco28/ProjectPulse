---
name: moksha-api-patterns
description: Standard patterns for creating API endpoints in Moksha DevHub using Next.js 14 App Router. Use when implementing GET/POST/PUT/DELETE routes, validating requests, or querying database via Prisma.
triggers:
  ['api endpoint', 'create route', 'api route', 'POST /api', 'GET /api', 'implement endpoint']
token_estimate: 220
last_updated: 2025-10-26
related_docs:
  - ../../.agent/system/api-catalog.md
  - ../../.agent/sops/adding-api-endpoint.md
---

# Moksha API Pattern

## Standard Route Structure

```typescript
// apps/web/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// 1. Define validation schema
const schema = z.object({
  field: z.string().min(1).max(200),
  optional: z.string().optional(),
});

// 2. Implement handler
export async function POST(request: NextRequest) {
  try {
    // Parse and validate
    const body = await request.json();
    const validated = schema.parse(body);

    // Database operation
    const result = await prisma.model.create({
      data: validated,
      include: { relations: true }, // Load relations if needed
    });

    // Success response
    return NextResponse.json({ data: result, error: null }, { status: 201 });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Server error
    console.error('API error:', error);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
```

## Our Conventions

**File Location**:

- `apps/web/app/api/[resource]/route.ts`
- Dynamic routes: `apps/web/app/api/[resource]/[id]/route.ts`

**Validation**:

- Always use Zod schemas
- Validate before database operations
- Return 400 with details on validation failure

**Response Format**:

**ALWAYS use this envelope pattern:**

```typescript
{ data: T | null, error: string | null }
```

- Success: `{ data: T, error: null }` or `{ data: T[], error: null, pagination?: {...} }`
- Error: `{ data: null, error: string, details?: any }`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Error

**Why:** Consistent response structure makes client code predictable and type-safe.

**Database**:

- Use Prisma for all queries
- Use `include` for relations, not separate queries
- Handle Prisma errors gracefully

**Error Handling**:

- Catch Zod errors specifically (400)
- Log server errors, return generic message (500)
- Never expose internal details in production

## Common Patterns

**Pagination (Cursor-Based)**:

```typescript
const { cursor, limit = 20 } = await request.json();

const items = await prisma.model.findMany({
  take: limit + 1,
  ...(cursor && { cursor: { id: cursor }, skip: 1 }),
});

const hasMore = items.length > limit;
const data = hasMore ? items.slice(0, -1) : items;

return NextResponse.json({
  data,
  error: null,
  nextCursor: hasMore ? data[data.length - 1].id : null,
  hasMore,
});
```

**GET with Query Params**:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const items = await prisma.model.findMany({
    where: {
      ...(status && { status }),
      ...(priority && { priority }),
    },
  });

  return NextResponse.json({ data: items, error: null });
}
```

**Dynamic Routes (/:id)**:

```typescript
// apps/web/app/api/issues/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.model.findUnique({
    where: { id: params.id },
  });

  if (!item) {
    return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: item, error: null });
}
```

## Full Documentation

**Complete API Guide**: [.agent/system/api-catalog.md](../../.agent/system/api-catalog.md)

- All endpoints catalog
- Request/response examples
- Authentication patterns (when added)
- Rate limiting (when added)

**Step-by-Step SOP**: [.agent/sops/adding-api-endpoint.md](../../.agent/sops/adding-api-endpoint.md) (when created)

- Detailed procedure
- TypeScript types
- Testing guidelines
- Deployment checklist

---

**Token Cost**: ~220 tokens (vs ~2,400 in full api-catalog.md)
**Coverage**: 90% of common API implementation cases
**When to Use Full Docs**: Complex queries, authentication, advanced patterns
