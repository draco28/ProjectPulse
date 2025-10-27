# SOP: Creating API Routes with Standard Response Format

## Purpose

Standard procedure for creating API routes in Moksha DevHub with consistent validation, error handling, and response format. Ensures all API endpoints follow project conventions and best practices.

## When to Use

- Adding new API endpoints for external access (MCP server, webhooks)
- Creating mutation endpoints (POST, PATCH, PUT, DELETE)
- Exposing backend functionality via REST API

**Note**: For form submissions and page mutations, consider Server Actions instead.

## Prerequisites

- Familiarity with Next.js 14 App Router API routes
- Understanding of Prisma ORM
- Knowledge of Zod validation schemas

---

## Core Pattern

All API routes in this project follow a standardized pattern:

1. **Zod validation** for request body/params
2. **Standard response format**: `{ data, error }`
3. **Granular error handling** (Zod errors, Prisma errors, generic errors)
4. **Cache revalidation** via `revalidatePath()`
5. **Selective Prisma queries** (use `select`, not `include` for everything)

---

## Procedure

### Step 1: Create Route File

Create file at `apps/web/app/api/[resource]/route.ts` (or nested path like `[resource]/[id]/[action]/route.ts`).

**File location pattern**:

```
apps/web/app/api/
├── issues/
│   ├── route.ts                    # GET /api/issues, POST /api/issues
│   └── [id]/
│       ├── route.ts                # GET /api/issues/[id]
│       ├── comments/
│       │   └── route.ts           # POST /api/issues/[id]/comments
│       └── status/
│           └── route.ts           # PATCH /api/issues/[id]/status
```

**Example**:

```typescript
// apps/web/app/api/issues/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CommentSchema } from '@/lib/validations/issue';
import { z } from 'zod';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Implementation follows...
}
```

**Gotcha**:

- Use **named exports only** (GET, POST, PATCH, etc.), NOT default export
- `params` is now a **Promise** in Next.js 14+ (must await it)

---

### Step 2: Add Comprehensive JSDoc Header

Document the endpoint at the top of the file.

**Template**:

```typescript
/**
 * [Endpoint Name] API Route
 *
 * [METHOD] /api/[path] - [Brief description]
 *
 * Request body:
 * - field1: type (required/optional, validation rules)
 * - field2: type (required/optional, validation rules)
 *
 * Response format:
 * - Success ([status code]): { data: [Type], error: null }
 * - Validation Error (400): { data: null, error: string, details: ZodError[] }
 * - Not Found (404): { data: null, error: string }
 * - Server Error (500): { data: null, error: string }
 *
 * Side effects: (if applicable)
 * - [Describe cache revalidation, timestamps, etc.]
 */
```

**Example**:

```typescript
/**
 * Issue Comments API Route
 *
 * POST /api/issues/[id]/comments - Create a new comment on an issue
 *
 * Request body:
 * - content: string (required, 1-10000 characters)
 * - author: string (optional, defaults to 'Anonymous')
 *
 * Response format:
 * - Success (201): { data: Comment, error: null }
 * - Validation Error (400): { data: null, error: string, details: ZodError[] }
 * - Not Found (404): { data: null, error: string }
 * - Server Error (500): { data: null, error: string }
 *
 * Side effects:
 * - Revalidates /issues/[id] page to show new comment
 */
```

---

### Step 3: Extract and Validate Route Parameters

For dynamic routes like `[id]`, extract and validate the parameter.

**Pattern**:

```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract and validate route parameter
    const { id } = await params;
    const issueId = parseInt(id, 10);

    if (isNaN(issueId)) {
      return NextResponse.json({ data: null, error: 'Invalid issue ID' }, { status: 400 });
    }

    // Continue with validation and logic...
  } catch (error) {
    // Error handling...
  }
}
```

**Gotcha**:

- **Always await params** in Next.js 14+
- Validate numeric IDs with `parseInt()` and `isNaN()`
- Return early with 400 for invalid params

---

### Step 4: Verify Related Resources Exist (If Needed)

For nested resources (e.g., comment on issue), verify parent exists.

**Pattern**:

```typescript
// 2. Verify parent resource exists
const issueExists = await prisma.issue.findUnique({
  where: { id: issueId },
  select: { id: true }, // Only select what you need
});

if (!issueExists) {
  return NextResponse.json({ data: null, error: 'Issue not found' }, { status: 404 });
}
```

**Gotcha**:

- Use `select: { id: true }` for existence checks (don't fetch full record)
- Return 404 for missing parent resources before processing request

---

### Step 5: Parse and Validate Request Body

Use Zod schemas to validate request data.

**Pattern**:

```typescript
// 3. Parse and validate request body
const body = await request.json();
const validatedData = CommentSchema.parse(body);
```

**Zod Schema Example**:

```typescript
// apps/web/lib/validations/issue.ts
import { z } from 'zod';

export const CommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  author: z.string().optional(),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed'], {
    errorMap: () => ({ message: 'Status must be open, in_progress, or closed' }),
  }),
});
```

**Gotcha**:

- Define schemas in `lib/validations/` for reusability
- Use `.parse()` not `.safeParse()` (let errors throw to be caught)
- Provide helpful error messages in schemas

---

### Step 6: Execute Database Operation

Use Prisma with **selective queries** (only fetch what you need).

**Pattern**:

```typescript
// 4. Create/update record in database
const comment = await prisma.comment.create({
  data: {
    content: validatedData.content,
    author: validatedData.author || 'Anonymous',
    issueId,
  },
  select: {
    id: true,
    content: true,
    author: true,
    createdAt: true,
    updatedAt: true,
    issueId: true,
  },
});
```

**For updates with conditional logic**:

```typescript
// Example: Update issue status with conditional timestamp
const issue = await prisma.issue.update({
  where: { id: issueId },
  data: {
    status,
    // Set closedAt timestamp when closing, clear it when reopening
    closedAt: status === 'closed' ? new Date() : null,
  },
  select: {
    id: true,
    title: true,
    status: true,
    closedAt: true,
    // Include counts for related data
    _count: {
      select: {
        comments: true,
        attachments: true,
      },
    },
  },
});
```

**Gotcha**:

- Use `select` to fetch only needed fields (not `include` for everything)
- Use `_count` for relation counts instead of fetching full relations
- Implement business logic in `data` object (e.g., conditional timestamps)

---

### Step 7: Revalidate Cached Pages

Use `revalidatePath()` to clear Next.js cache for affected pages.

**Pattern**:

```typescript
// 5. Revalidate affected pages (clears Next.js cache)
revalidatePath(`/issues/${issueId}`); // Detail page
revalidatePath('/issues'); // List page (if needed)
```

**When to revalidate**:

- **Always**: The page that displays the created/updated data
- **Sometimes**: List pages if order/filters depend on the change
- **Multiple paths**: If data appears on multiple pages

**Gotcha**:

- Call `revalidatePath()` AFTER successful DB operation
- Revalidate all affected pages (detail page + list page if needed)
- Don't revalidate on errors (cache should remain valid)

---

### Step 8: Return Standard Response Format

All responses follow: `{ data: T | null, error: string | null }`

**Success response**:

```typescript
// 6. Return success response
return NextResponse.json(
  { data: comment, error: null },
  { status: 201 } // Use appropriate status code
);
```

**HTTP Status Codes**:

- **200**: Successful GET, PATCH, DELETE
- **201**: Successful POST (resource created)
- **400**: Validation error, invalid input
- **404**: Resource not found
- **500**: Server error

**Gotcha**:

- Always include both `data` and `error` in response
- Use correct HTTP status code (201 for creation, 200 for update)
- Don't leak internal errors to client (generic messages)

---

### Step 9: Implement Granular Error Handling

Handle different error types with specific messages.

**Complete error handling pattern**:

```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ... main logic ...
  } catch (error) {
    // Handle Zod validation errors (400)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: 'Invalid comment data',
          details: error.errors, // Include Zod error details
        },
        { status: 400 }
      );
    }

    // Handle Prisma "not found" error (404)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ data: null, error: 'Issue not found' }, { status: 404 });
    }

    // Handle other Prisma errors (500)
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error creating comment:', error);
      return NextResponse.json(
        { data: null, error: 'Database error while creating comment' },
        { status: 500 }
      );
    }

    // Handle unexpected errors (500)
    console.error('Unexpected error creating comment:', error);
    return NextResponse.json({ data: null, error: 'Failed to create comment' }, { status: 500 });
  }
}
```

**Error handling order**:

1. **Zod validation errors** (400) - Invalid input
2. **Prisma P2025** (404) - Record not found (for updates/deletes)
3. **Other Prisma errors** (500) - Database issues
4. **Unexpected errors** (500) - Catch-all

**Gotcha**:

- Check error types in specific order (Zod → Prisma → Generic)
- Log server errors with `console.error()` for debugging
- Don't expose internal error details to client
- Include `details` field for Zod errors (helpful for debugging)

---

### Step 10: Add TypeScript Types

Define request/response types for type safety and documentation.

**Create types file** (if doesn't exist):

```typescript
// apps/web/types/issue.ts

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response format used throughout the application
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  details?: unknown; // Zod validation errors or additional context
}

/**
 * Comment creation request body
 */
export interface CreateCommentRequest {
  content: string;
  author?: string;
}

/**
 * Status update request body
 */
export interface UpdateStatusRequest {
  status: 'open' | 'in_progress' | 'closed';
}
```

**Use in route**:

```typescript
import { ApiResponse, CreateCommentRequest } from '@/types/issue';

// TypeScript will infer response type
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Comment>>> {
  // ...
}
```

---

### Step 11: Write Tests

Create test file at `__tests__/api/[resource]/route.test.ts`.

**Basic test structure**:

```typescript
// __tests__/api/issues/[id]/comments/route.test.ts
import { POST } from '@/app/api/issues/[id]/comments/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    issue: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
    },
  },
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('POST /api/issues/[id]/comments', () => {
  it('creates a comment successfully', async () => {
    // Arrange
    const mockIssue = { id: 1 };
    const mockComment = {
      id: 1,
      content: 'Test comment',
      author: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      issueId: 1,
    };

    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);
    (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

    const request = new NextRequest('http://localhost:3000/api/issues/1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test comment', author: 'Test User' }),
    });

    const params = Promise.resolve({ id: '1' });

    // Act
    const response = await POST(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.data).toEqual(mockComment);
    expect(data.error).toBeNull();
  });

  it('returns 400 for invalid input', async () => {
    // Test validation error handling
  });

  it('returns 404 when issue not found', async () => {
    // Test not found error handling
  });
});
```

---

## Verification Checklist

After creating API route, verify:

- [ ] Endpoint accessible at correct path
- [ ] Request validation works (test with invalid data via Postman/curl)
- [ ] Database record created/updated correctly (check via Prisma Studio)
- [ ] Response format matches `{ data, error }` standard
- [ ] Appropriate HTTP status codes returned (201/200/400/404/500)
- [ ] Cache revalidation works (page updates after mutation)
- [ ] TypeScript types defined and used
- [ ] Error handling covers all cases (Zod, Prisma, generic)
- [ ] Tests written and passing
- [ ] JSDoc documentation complete

---

## Common Patterns

### Pattern 1: POST endpoint (Create)

```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract params (if dynamic route)
    const { id } = await params;
    const resourceId = parseInt(id, 10);
    if (isNaN(resourceId))
      return NextResponse.json({ data: null, error: 'Invalid ID' }, { status: 400 });

    // 2. Verify parent exists (if nested resource)
    const parent = await prisma.parent.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });
    if (!parent)
      return NextResponse.json({ data: null, error: 'Parent not found' }, { status: 404 });

    // 3. Validate request body
    const body = await request.json();
    const validated = Schema.parse(body);

    // 4. Create resource
    const resource = await prisma.resource.create({
      data: validated,
      select: {
        /* select only needed fields */
      },
    });

    // 5. Revalidate pages
    revalidatePath(`/parent/${resourceId}`);

    // 6. Return success
    return NextResponse.json({ data: resource, error: null }, { status: 201 });
  } catch (error) {
    // Handle errors...
  }
}
```

### Pattern 2: PATCH endpoint (Update)

```typescript
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract and validate ID
    const { id } = await params;
    const resourceId = parseInt(id, 10);
    if (isNaN(resourceId))
      return NextResponse.json({ data: null, error: 'Invalid ID' }, { status: 400 });

    // 2. Validate request body
    const body = await request.json();
    const validated = UpdateSchema.parse(body);

    // 3. Update resource (Prisma will throw P2025 if not found)
    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: validated,
      select: {
        /* select only needed fields */
      },
    });

    // 4. Revalidate pages
    revalidatePath(`/resources/${resourceId}`);
    revalidatePath('/resources'); // If list page needs update

    // 5. Return success
    return NextResponse.json({ data: resource, error: null }, { status: 200 });
  } catch (error) {
    // Handle Prisma P2025 (not found) specifically
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ data: null, error: 'Resource not found' }, { status: 404 });
    }
    // Handle other errors...
  }
}
```

### Pattern 3: GET endpoint (Read)

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract and validate ID
    const { id } = await params;
    const resourceId = parseInt(id, 10);
    if (isNaN(resourceId))
      return NextResponse.json({ data: null, error: 'Invalid ID' }, { status: 400 });

    // 2. Fetch resource
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        /* select only needed fields */
      },
    });

    if (!resource) {
      return NextResponse.json({ data: null, error: 'Resource not found' }, { status: 404 });
    }

    // 3. Return success (no cache revalidation for GET)
    return NextResponse.json({ data: resource, error: null }, { status: 200 });
  } catch (error) {
    // Handle errors...
  }
}
```

---

## Troubleshooting

### Issue: 404 Not Found

**Symptom**: API returns 404 when called
**Cause**: File not in correct location or named incorrectly
**Solution**:

- Verify file is at `apps/web/app/api/[path]/route.ts`
- Check route matches URL structure exactly
- Ensure named export (GET, POST, etc.), not default export

### Issue: TypeScript Errors

**Symptom**: `NextRequest` type not found
**Cause**: Missing import
**Solution**: `import { NextRequest, NextResponse } from 'next/server'`

### Issue: Validation Not Working

**Symptom**: Invalid data accepted
**Cause**: Forgot to parse with Zod schema
**Solution**: Ensure `const validated = schema.parse(body)` is called

### Issue: Params is undefined

**Symptom**: Cannot read property 'id' of undefined
**Cause**: Forgot to await params in Next.js 14+
**Solution**: Change `const { id } = params` to `const { id } = await params`

### Issue: Cache Not Revalidating

**Symptom**: Page doesn't update after mutation
**Cause**: Missing or incorrect `revalidatePath()` call
**Solution**:

- Add `revalidatePath('/affected/page')` after successful DB operation
- Verify path matches actual page route

### Issue: Prisma Error Not Caught

**Symptom**: Unhandled promise rejection
**Cause**: Prisma error not caught in try/catch
**Solution**: Wrap all async Prisma calls in try/catch block

---

## Real-World Examples

### Example 1: POST /api/issues/[id]/comments

**File**: `apps/web/app/api/issues/[id]/comments/route.ts`

**Features**:

- Nested resource (comment belongs to issue)
- Verifies parent exists before creating
- Defaults author to 'Anonymous'
- Revalidates issue detail page

**See**: Full implementation in codebase

### Example 2: PATCH /api/issues/[id]/status

**File**: `apps/web/app/api/issues/[id]/status/route.ts`

**Features**:

- Conditional logic (sets closedAt timestamp when status = 'closed')
- Revalidates both list and detail pages
- Handles Prisma P2025 (not found) error specifically

**See**: Full implementation in codebase

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md#api-development) - API development guidelines
- [database-schema.md](../system/database-schema.md) - Prisma models
- [type-serialization.md](./type-serialization.md) - Converting Prisma types for client
- [Next.js API Routes Docs](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)

---

## Quick Reference

### Complete Route Template

```typescript
/**
 * [Resource] API Route
 *
 * [METHOD] /api/[path] - [Description]
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Schema } from '@/lib/validations/[resource]';
import { z } from 'zod';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract and validate params
    const { id } = await params;
    const resourceId = parseInt(id, 10);
    if (isNaN(resourceId)) {
      return NextResponse.json({ data: null, error: 'Invalid ID' }, { status: 400 });
    }

    // 2. Verify parent exists (if nested)
    const parent = await prisma.parent.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ data: null, error: 'Parent not found' }, { status: 404 });
    }

    // 3. Validate request body
    const body = await request.json();
    const validated = Schema.parse(body);

    // 4. Execute database operation
    const resource = await prisma.resource.create({
      data: validated,
      select: {
        /* only needed fields */
      },
    });

    // 5. Revalidate cache
    revalidatePath(`/parent/${resourceId}`);

    // 6. Return success
    return NextResponse.json({ data: resource, error: null }, { status: 201 });
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Prisma not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 });
    }

    // Other Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error:', error);
      return NextResponse.json({ data: null, error: 'Database error' }, { status: 500 });
    }

    // Unexpected errors
    console.error('Unexpected error:', error);
    return NextResponse.json({ data: null, error: 'Failed to process request' }, { status: 500 });
  }
}
```

---

**Last Updated**: 2025-10-28
**Created From**: Phase 3 Day 4 implementation (Issue Detail Page API routes)
**Priority**: HIGH - Follow for all new API routes
