---
name: API Design Patterns (DevHub Web)
description: Best practices for designing Next.js 14 API Routes and Server Actions with REST principles
category: architecture
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# API Design Patterns for Moksha DevHub

## Overview

This skill provides proven patterns for designing clean, maintainable, and scalable API routes in Next.js 14, following REST principles and modern web standards.

## Core Principles

1. **RESTful Design** - Use HTTP methods correctly
2. **Consistent Structure** - Predictable URL patterns
3. **Proper Status Codes** - Meaningful responses
4. **Error Handling** - Graceful failures
5. **Validation** - Input sanitization
6. **Type Safety** - Strong TypeScript typing

## REST API Patterns

### Resource Naming
```
✅ Good:
/api/issues
/api/issues/[id]
/api/issues/[id]/comments
/api/knowledge
/api/wiki/pages

❌ Bad:
/api/get-issues
/api/createIssue
/api/issue_list
```

### HTTP Methods
```typescript
// GET - Retrieve data
export async function GET(request: Request) {
  const issues = await prisma.issue.findMany();
  return Response.json(issues);
}

// POST - Create new resource
export async function POST(request: Request) {
  const data = await request.json();
  const issue = await prisma.issue.create({ data });
  return Response.json(issue, { status: 201 });
}

// PATCH - Partial update
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const issue = await prisma.issue.update({
    where: { id: parseInt(params.id) },
    data,
  });
  return Response.json(issue);
}

// DELETE - Remove resource
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.issue.delete({
    where: { id: parseInt(params.id) },
  });
  return Response.json({ success: true }, { status: 204 });
}
```

### Status Codes
```typescript
// 200 OK - Successful GET/PATCH
return Response.json(data, { status: 200 });

// 201 Created - Successful POST
return Response.json(newResource, { status: 201 });

// 204 No Content - Successful DELETE
return new Response(null, { status: 204 });

// 400 Bad Request - Invalid input
return Response.json({ error: 'Invalid data' }, { status: 400 });

// 404 Not Found - Resource doesn't exist
return Response.json({ error: 'Not found' }, { status: 404 });

// 500 Internal Server Error - Server error
return Response.json({ error: 'Server error' }, { status: 500 });
```

## Pattern: Pagination

```typescript
// app/api/issues/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.issue.count(),
  ]);

  return Response.json({
    items: issues,
    page,
    limit,
    total,
    hasMore: skip + limit < total,
  });
}

// Usage: GET /api/issues?page=2&limit=10
```

## Pattern: Filtering & Sorting

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Build where clause from query params
  const where: any = {};

  if (searchParams.get('status')) {
    where.status = searchParams.get('status');
  }

  if (searchParams.get('priority')) {
    where.priority = searchParams.get('priority');
  }

  if (searchParams.get('module')) {
    where.module = searchParams.get('module');
  }

  // Build orderBy from query param
  const sortBy = searchParams.get('sort') || 'createdAt';
  const sortOrder = searchParams.get('order') || 'desc';

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
  });

  return Response.json(issues);
}

// Usage: GET /api/issues?status=open&priority=high&sort=updatedAt&order=asc
```

## Pattern: Search API

```typescript
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const semantic = searchParams.get('semantic') === 'true';

  if (!query) {
    return Response.json({ error: 'Query required' }, { status: 400 });
  }

  // Hybrid search
  const results = await hybridSearch(query, {
    useSemanticSearch: semantic,
    limit: 20,
  });

  return Response.json({
    query,
    results,
    count: results.length,
  });
}
```

## Pattern: Nested Resources

```typescript
// app/api/issues/[id]/comments/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const comments = await prisma.comment.findMany({
    where: { issueId: parseInt(params.id) },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();

  const comment = await prisma.comment.create({
    data: {
      ...data,
      issueId: parseInt(params.id),
    },
  });

  return Response.json(comment, { status: 201 });
}

// Usage: GET /api/issues/42/comments
```

## Pattern: Error Response Format

```typescript
type ErrorResponse = {
  error: string;
  details?: any;
  code?: string;
};

// Validation error
return Response.json(
  {
    error: 'Validation failed',
    details: validationErrors,
    code: 'VALIDATION_ERROR',
  } as ErrorResponse,
  { status: 400 }
);

// Not found error
return Response.json(
  {
    error: 'Issue not found',
    code: 'NOT_FOUND',
  } as ErrorResponse,
  { status: 404 }
);

// Server error
return Response.json(
  {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  } as ErrorResponse,
  { status: 500 }
);
```

## Pattern: File Upload

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large' }, { status: 400 });
  }

  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(process.env.UPLOAD_DIR!, filename);

  await fs.writeFile(filepath, buffer);

  // Save metadata
  const attachment = await prisma.attachment.create({
    data: {
      filename: file.name,
      filepath,
      mimeType: file.type,
      size: file.size,
    },
  });

  return Response.json(attachment, { status: 201 });
}
```

## Server Actions Pattern

```typescript
// actions/issue-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export async function createIssue(formData: FormData) {
  // Validate
  const validated = issueSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
  });

  // Create
  const issue = await prisma.issue.create({
    data: validated,
  });

  // Revalidate
  revalidatePath('/issues');

  return issue;
}

// Usage in component:
// <form action={createIssue}>...</form>
```

## Success Criteria

Good API design when:
- [ ] URLs are RESTful and predictable
- [ ] HTTP methods used correctly
- [ ] Status codes are meaningful
- [ ] Responses are consistent
- [ ] Errors are handled gracefully
- [ ] Input is validated
- [ ] Documentation is clear

## Integration with Agents

This skill is used by:
- **devhub-architect** - When designing new APIs
- **devhub-fullstack** - When implementing API routes
- **devhub-auditor** - To verify API design quality

Pair with:
- **api-testing-patterns** - For testing APIs
- **verification-before-completion** - Pre-commit API validation
- **defense-in-depth-web** - For API security

Remember: Good API design makes integration easier, reduces bugs, and improves developer experience. Consistency is key.
