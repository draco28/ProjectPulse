---
name: Defense in Depth (DevHub Web)
description: Multi-layer security and quality validation across all development stages
category: validation
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# Defense in Depth for Moksha DevHub

## Overview

Defense in Depth applies multiple layers of validation at different stages to catch issues early and ensure comprehensive quality assurance.

## The 7 Layers of Defense

### Layer 1: TypeScript (Design Time)
Catch errors before runtime with strict typing.

```typescript
// ✅ Strong typing prevents errors
interface Issue {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical'; // Type-safe enum
}

function processIssue(issue: Issue) {
  // TypeScript ensures issue has correct shape
}

// ❌ This won't compile
processIssue({ id: 1 }); // Error: missing title and priority
```

### Layer 2: Zod Validation (Runtime)
Validate user input at API boundaries.

```typescript
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(1).max(200),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = issueSchema.parse(body); // Throws if invalid
  // Now we know validated has correct structure
}
```

### Layer 3: Database Constraints (Storage)
Enforce integrity at database level.

```prisma
model Issue {
  id       Int    @id @default(autoincrement())
  title    String @db.VarChar(200)  // Max length enforced
  priority String @db.VarChar(50)    // Type enforced
  userId   Int
  user     User   @relation(fields: [userId], references: [id]) // FK enforced

  @@index([priority]) // Performance enforced
}
```

### Layer 4: API Error Handling (Execution)
Handle failures gracefully.

```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validated = schema.parse(data);
    const result = await prisma.issue.create({ data: validated });
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Layer 5: React Error Boundaries (UI)
Catch rendering errors.

```typescript
'use client';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export function IssueList() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <IssueListContent />
    </ErrorBoundary>
  );
}
```

### Layer 6: Automated Tests (Pre-Commit)
Verify behavior before merging.

```typescript
describe('Issue API', () => {
  it('should reject invalid priority', async () => {
    const response = await POST(
      new Request('http://localhost/api/issues', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', priority: 'invalid' }),
      })
    );
    expect(response.status).toBe(400);
  });
});
```

### Layer 7: Monitoring & Logging (Production)
Detect issues in production.

```typescript
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // ... implementation
    const duration = Date.now() - startTime;
    console.log(`Issue created in ${duration}ms`);
  } catch (error) {
    console.error('Issue creation failed:', error);
    // Alert monitoring system if needed
  }
}
```

## Security Defense Layers

### Input Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content
const cleanContent = DOMPurify.sanitize(userInput);
```

### SQL Injection Prevention
```typescript
// ✅ Prisma parameterized queries
await prisma.$queryRaw`
  SELECT * FROM issues WHERE title = ${userInput}
`;

// ❌ NEVER use raw string interpolation
await prisma.$queryRawUnsafe(
  `SELECT * FROM issues WHERE title = '${userInput}'`
);
```

### XSS Prevention
```typescript
// ✅ React auto-escapes
<div>{userContent}</div>

// ❌ Dangerous HTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ If needed, sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### CSRF Protection
```typescript
// Use POST for mutations (not GET)
// Validate origin header
// Use Next.js built-in CSRF protection
```

## Performance Defense Layers

### Database Query Optimization
```typescript
// ❌ N+1 Query Problem
const issues = await prisma.issue.findMany();
for (const issue of issues) {
  issue.comments = await prisma.comment.findMany({
    where: { issueId: issue.id },
  });
}

// ✅ Include Relations
const issues = await prisma.issue.findMany({
  include: { comments: true },
});
```

### Caching Strategy
```typescript
// Server Component with revalidation
export const revalidate = 60; // 60 seconds

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany();
  return <IssueList issues={issues} />;
}
```

### Bundle Size Monitoring
```bash
# Check bundle size
npm run build -- --analyze

# Lazy load heavy components
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  loading: () => <Skeleton />,
});
```

## Accessibility Defense Layers

### Semantic HTML
```typescript
// ✅ Proper semantics
<button onClick={handleClick}>Submit</button>

// ❌ Non-semantic
<div onClick={handleClick}>Submit</div>
```

### ARIA Attributes
```typescript
<input
  type="search"
  aria-label="Search issues"
  aria-describedby="search-help"
/>
<span id="search-help">Enter keywords to search issues</span>
```

### Keyboard Navigation
```typescript
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</button>
```

## Success Criteria

Defense in Depth is successful when:
- [ ] Multiple validation layers exist for critical paths
- [ ] Failures are caught at appropriate layers
- [ ] Errors are logged and monitored
- [ ] Security is enforced at multiple points
- [ ] Performance is optimized at each layer

## Integration with Agents

This skill is used by:
- **All agents** - As a comprehensive quality framework
- **devhub-auditor** - To verify defense layers exist
- **devhub-fullstack** - When implementing features

Pair with:
- **verification-before-completion** - Pre-commit validation
- **systematic-debugging-web** - When defenses fail
- **test-driven-development-web** - Testing as a defense layer

Remember: The goal is not to make systems failure-proof, but to make failures graceful, detectable, and recoverable. Multiple layers ensure that if one fails, others catch the problem.
