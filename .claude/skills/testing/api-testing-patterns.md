---
name: API Testing Patterns (DevHub Web)
description: Comprehensive patterns for testing Next.js API routes, Server Actions, and REST endpoints
category: testing
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# API Testing Patterns for Moksha DevHub

## Overview

This skill provides testing patterns specifically for Next.js 14 API routes, Server Actions, and REST endpoints with focus on request/response validation, error handling, and data integrity.

## Core Testing Patterns

### 1. Basic API Route Testing

```typescript
// __tests__/api/issues/route.test.ts
import { GET, POST } from '@/app/api/issues/route';

describe('GET /api/issues', () => {
  it('should return list of issues', async () => {
    const request = new Request('http://localhost/api/issues');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('POST /api/issues', () => {
  it('should create issue with valid data', async () => {
    const request = new Request('http://localhost/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', priority: 'medium' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### 2. Testing with Query Parameters

```typescript
it('should filter issues by status', async () => {
  const url = 'http://localhost/api/issues?status=open&priority=high';
  const request = new Request(url);
  const response = await GET(request);
  const data = await response.json();

  expect(data.every(issue => issue.status === 'open')).toBe(true);
  expect(data.every(issue => issue.priority === 'high')).toBe(true);
});
```

### 3. Testing Validation Errors

```typescript
it('should return 400 for missing required fields', async () => {
  const request = new Request('http://localhost/api/issues', {
    method: 'POST',
    body: JSON.stringify({}), // Missing title
  });

  const response = await POST(request);
  const error = await response.json();

  expect(response.status).toBe(400);
  expect(error).toHaveProperty('error');
});

it('should return 400 for invalid enum value', async () => {
  const request = new Request('http://localhost/api/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test',
      priority: 'invalid-priority', // Not in enum
    }),
  });

  const response = await POST(request);
  expect(response.status).toBe(400);
});
```

### 4. Testing Database Integration

```typescript
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    issue: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

it('should call Prisma with correct arguments', async () => {
  const mockIssues = [{ id: 1, title: 'Test' }];
  (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);

  const request = new Request('http://localhost/api/issues');
  await GET(request);

  expect(prisma.issue.findMany).toHaveBeenCalledWith({
    orderBy: { createdAt: 'desc' },
  });
});

it('should handle database errors gracefully', async () => {
  (prisma.issue.findMany as jest.Mock).mockRejectedValue(
    new Error('Database connection failed')
  );

  const request = new Request('http://localhost/api/issues');
  const response = await GET(request);

  expect(response.status).toBe(500);
});
```

### 5. Testing Server Actions

```typescript
// __tests__/actions/issue-actions.test.ts
import { createIssue } from '@/actions/issue-actions';

describe('createIssue Server Action', () => {
  it('should create issue from FormData', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Issue');
    formData.append('priority', 'high');

    const result = await createIssue(formData);

    expect(result).toHaveProperty('id');
    expect(result.title).toBe('Test Issue');
  });

  it('should revalidate path after creation', async () => {
    const { revalidatePath } = require('next/cache');
    jest.spyOn(revalidatePath as any);

    const formData = new FormData();
    formData.append('title', 'Test');

    await createIssue(formData);

    expect(revalidatePath).toHaveBeenCalledWith('/issues');
  });
});
```

### 6. Testing File Uploads

```typescript
it('should handle file upload', async () => {
  const file = new File(['test content'], 'test.pdf', {
    type: 'application/pdf',
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('issueId', '1');

  const request = new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(201);
  expect(data).toHaveProperty('filepath');
});
```

### 7. Testing Pagination

```typescript
it('should paginate results', async () => {
  const url = 'http://localhost/api/issues?page=2&limit=10';
  const request = new Request(url);
  const response = await GET(request);
  const data = await response.json();

  expect(data.items).toHaveLength(10);
  expect(data.page).toBe(2);
  expect(data.hasMore).toBeDefined();
});
```

### 8. Testing Search Endpoints

```typescript
describe('GET /api/search', () => {
  it('should perform hybrid search', async () => {
    const url = 'http://localhost/api/search?q=authentication&semantic=true';
    const request = new Request(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
    expect(data.results[0]).toHaveProperty('similarity');
  });

  it('should handle empty query', async () => {
    const request = new Request('http://localhost/api/search?q=');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

## Test Organization Patterns

### Pattern 1: Shared Setup
```typescript
describe('Issues API', () => {
  let testIssue;

  beforeEach(async () => {
    // Setup test data
    testIssue = await prisma.issue.create({
      data: { title: 'Test Issue', status: 'open' },
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.issue.deleteMany();
  });

  it('should get issue by ID', async () => { ... });
  it('should update issue', async () => { ... });
});
```

### Pattern 2: Test Suites by HTTP Method
```typescript
describe('/api/issues', () => {
  describe('GET', () => {
    it('should list all issues', () => { ... });
    it('should filter by status', () => { ... });
  });

  describe('POST', () => {
    it('should create issue', () => { ... });
    it('should validate input', () => { ... });
  });

  describe('PATCH', () => {
    it('should update issue', () => { ... });
  });

  describe('DELETE', () => {
    it('should delete issue', () => { ... });
  });
});
```

### Pattern 3: Error Scenario Testing
```typescript
describe('Error Handling', () => {
  it('should return 400 for invalid input', () => { ... });
  it('should return 404 for not found', () => { ... });
  it('should return 500 for server errors', () => { ... });
  it('should return 429 for rate limiting', () => { ... });
});
```

## Integration Testing Patterns

### Full Stack Integration Test
```typescript
describe('Issue Creation Flow (Integration)', () => {
  it('should create issue end-to-end', async () => {
    // 1. Create issue via API
    const createResponse = await fetch('http://localhost:3000/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: 'Integration Test' }),
    });
    const created = await createResponse.json();

    // 2. Verify in database
    const dbIssue = await prisma.issue.findUnique({
      where: { id: created.id },
    });
    expect(dbIssue).not.toBeNull();

    // 3. Retrieve via API
    const getResponse = await fetch(
      `http://localhost:3000/api/issues/${created.id}`
    );
    const retrieved = await getResponse.json();

    expect(retrieved.title).toBe('Integration Test');
  });
});
```

## Success Criteria

API testing is complete when:
- [ ] All HTTP methods (GET, POST, PATCH, DELETE) are tested
- [ ] Validation errors return correct status codes
- [ ] Database errors are handled gracefully
- [ ] Query parameters and filtering work correctly
- [ ] Pagination is tested
- [ ] File uploads work (if applicable)
- [ ] Search endpoints return correct results
- [ ] Rate limiting is enforced (if applicable)
- [ ] Security (SQL injection, XSS) is tested

## Integration with Agents

Used by:
- **devhub-fullstack** - When implementing API routes
- **devhub-testing** - As specialized API testing guidance
- **devhub-auditor** - To verify API test coverage

Pair with:
- **test-driven-development-web** - TDD methodology
- **defense-in-depth-web** - Security testing
- **systematic-debugging-web** - When tests fail

Remember: Good API tests document expected behavior and catch regressions early. Test both happy paths and error scenarios comprehensively.
