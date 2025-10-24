---
name: Test-Driven Development (DevHub Web)
description: RED/GREEN/REFACTOR workflow for Next.js, React, API routes, and Prisma with comprehensive test coverage
category: testing
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# Test-Driven Development for Moksha DevHub

## Overview

Test-Driven Development (TDD) ensures code quality by writing tests before implementation. This skill adapts TDD for full-stack web development with Next.js 14, React, and PostgreSQL/Prisma.

## The TDD Cycle

### 🔴 RED - Write a Failing Test
Write a test that defines desired behavior. Run it - it should fail (no implementation yet).

### 🟢 GREEN - Make it Pass
Write the minimum code to make the test pass. Don't worry about perfection yet.

### 🔵 REFACTOR - Improve the Code
Clean up code while keeping tests passing. Optimize, remove duplication, improve readability.

### ↻ REPEAT
Continue the cycle for the next feature or requirement.

## TDD Workflow for Different Layers

### 1. API Route TDD

**Example: Create Issue Endpoint**

```typescript
// __tests__/api/issues.test.ts (RED - Write test first)
import { POST } from '@/app/api/issues/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/issues', () => {
  it('should create an issue with valid data', async () => {
    const mockIssue = {
      id: 1,
      title: 'Test Issue',
      status: 'open',
      priority: 'medium',
    };

    (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

    const request = new Request('http://localhost/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Issue', priority: 'medium' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(1);
    expect(data.title).toBe('Test Issue');
  });
});

// Run test: npm test issues.test.ts
// Result: ❌ FAIL (POST function doesn't exist)
```

```typescript
// app/api/issues/route.ts (GREEN - Implement minimum code)
export async function POST(request: Request) {
  const body = await request.json();

  const issue = await prisma.issue.create({
    data: {
      title: body.title,
      status: 'open',
      priority: body.priority || 'medium',
    },
  });

  return Response.json(issue, { status: 201 });
}

// Run test: npm test issues.test.ts
// Result: ✅ PASS
```

```typescript
// app/api/issues/route.ts (REFACTOR - Add validation, error handling)
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = issueSchema.parse(body);

    const issue = await prisma.issue.create({
      data: validated,
    });

    return Response.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Add more tests for validation and errors (RED again)
// Run all tests: npm test
// Result: ✅ PASS (all tests still pass after refactor)
```

### 2. React Component TDD

**Example: IssueCard Component**

```typescript
// __tests__/components/IssueCard.test.tsx (RED)
import { render, screen } from '@testing-library/react';
import { IssueCard } from '@/components/issues/IssueCard';

describe('IssueCard', () => {
  const mockIssue = {
    id: 1,
    title: 'Test Issue',
    status: 'open',
    priority: 'high',
    createdAt: new Date('2025-01-01'),
  };

  it('should render issue title', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('Test Issue')).toBeInTheDocument();
  });

  it('should display high priority badge in red', () => {
    render(<IssueCard issue={mockIssue} />);
    const badge = screen.getByText('high');
    expect(badge).toHaveClass('bg-red-500');
  });
});

// Run test: npm test IssueCard
// Result: ❌ FAIL (component doesn't exist)
```

```typescript
// components/issues/IssueCard.tsx (GREEN)
export function IssueCard({ issue }) {
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-gray-400',
  };

  return (
    <div>
      <h3>{issue.title}</h3>
      <span className={priorityColors[issue.priority]}>{issue.priority}</span>
    </div>
  );
}

// Run test: npm test IssueCard
// Result: ✅ PASS
```

```typescript
// components/issues/IssueCard.tsx (REFACTOR)
interface Issue {
  id: number;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

export function IssueCard({ issue }: { issue: Issue }) {
  const priorityColors: Record<Issue['priority'], string> = {
    low: 'bg-gray-400',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
    critical: 'bg-red-700',
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{issue.title}</h3>
      <div className="flex gap-2 mt-2">
        <span
          className={`px-2 py-1 rounded text-sm text-white ${priorityColors[issue.priority]}`}
        >
          {issue.priority}
        </span>
        <span className="px-2 py-1 rounded text-sm bg-gray-200">{issue.status}</span>
      </div>
    </div>
  );
}

// Run test: npm test IssueCard
// Result: ✅ PASS (with better implementation)
```

### 3. Database/Prisma TDD

**Example: Issue CRUD Operations**

```typescript
// __tests__/integration/issue-crud.test.ts (RED)
import { prisma } from '@/lib/prisma';

describe('Issue CRUD', () => {
  beforeEach(async () => {
    await prisma.issue.deleteMany();
  });

  it('should create and retrieve an issue', async () => {
    const created = await prisma.issue.create({
      data: {
        title: 'Test Issue',
        status: 'open',
        priority: 'medium',
      },
    });

    const retrieved = await prisma.issue.findUnique({
      where: { id: created.id },
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Test Issue');
  });
});

// Run test: npm test issue-crud
// Result: May pass or fail depending on schema
```

```prisma
// prisma/schema.prisma (GREEN - Ensure schema supports test)
model Issue {
  id          Int      @id @default(autoincrement())
  title       String   @db.VarChar(200)
  description String?  @db.Text
  status      String   @default("open") @db.VarChar(50)
  priority    String   @default("medium") @db.VarChar(50)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

```bash
# Run migration
npx prisma migrate dev --name add_issue_table

# Run test
npm test issue-crud
# Result: ✅ PASS
```

## TDD Best Practices

### 1. Write Tests First (Always)
Don't cheat! Writing tests after implementation defeats the purpose.

### 2. Test One Thing at a Time
Each test should verify one specific behavior.

```typescript
// ❌ BAD: Testing multiple things
it('should create, update, and delete issue', async () => {
  const issue = await createIssue();
  const updated = await updateIssue(issue.id);
  await deleteIssue(issue.id);
  // Too much in one test
});

// ✅ GOOD: Separate tests
it('should create an issue', async () => { ... });
it('should update an issue', async () => { ... });
it('should delete an issue', async () => { ... });
```

### 3. Use Descriptive Test Names
Test names should describe the expected behavior.

```typescript
// ❌ BAD: Vague test name
it('test issue creation', () => { ... });

// ✅ GOOD: Clear test name
it('should create an issue with valid data and return 201 status', () => { ... });
it('should return 400 when title is missing', () => { ... });
```

### 4. Follow AAA Pattern
**Arrange** - Set up test data
**Act** - Execute the function/action
**Assert** - Verify the result

```typescript
it('should update issue status', async () => {
  // Arrange
  const issue = await prisma.issue.create({
    data: { title: 'Test', status: 'open' },
  });

  // Act
  const updated = await prisma.issue.update({
    where: { id: issue.id },
    data: { status: 'closed' },
  });

  // Assert
  expect(updated.status).toBe('closed');
});
```

### 5. Test Edge Cases and Errors
Don't just test happy paths.

```typescript
it('should return 400 for empty title', async () => { ... });
it('should return 404 for non-existent issue', async () => { ... });
it('should handle database errors gracefully', async () => { ... });
```

### 6. Keep Tests Fast
- Use mocks for external dependencies
- Use in-memory database for tests
- Run tests in parallel when possible

### 7. Keep Tests Independent
- Don't rely on test execution order
- Clean up after each test (beforeEach/afterEach)
- Don't share mutable state between tests

## Test Coverage Goals

- **Critical Paths**: 100% coverage (auth, payments, data loss scenarios)
- **Business Logic**: 90%+ coverage
- **UI Components**: 80%+ coverage
- **Utility Functions**: 100% coverage
- **Overall**: 80%+ coverage

Check coverage:
```bash
npm test -- --coverage
```

## Common TDD Patterns

### Pattern 1: Test Factories
```typescript
// __tests__/factories/issue.factory.ts
export function createMockIssue(overrides = {}) {
  return {
    id: 1,
    title: 'Test Issue',
    status: 'open',
    priority: 'medium',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage in tests
const highPriorityIssue = createMockIssue({ priority: 'high' });
```

### Pattern 2: Test Fixtures
```typescript
// __tests__/fixtures/issues.json
[
  { "id": 1, "title": "Bug in search", "priority": "high" },
  { "id": 2, "title": "Feature request", "priority": "low" }
]

// Usage
import issuesFixture from './fixtures/issues.json';
```

### Pattern 3: Custom Matchers
```typescript
// __tests__/matchers.ts
expect.extend({
  toBeValidIssue(received) {
    const pass = received.id && received.title && received.status;
    return {
      pass,
      message: () => `Expected valid issue, got ${JSON.stringify(received)}`,
    };
  },
});

// Usage
expect(issue).toBeValidIssue();
```

## Integration with Agents

This skill is used by:
- **devhub-fullstack** - When implementing new features
- **devhub-testing** - As the primary testing methodology
- **devhub-auditor** - To verify test coverage and quality

Pair this skill with:
- **api-testing-patterns** - For API-specific testing strategies
- **systematic-debugging-web** - When tests reveal bugs
- **defense-in-depth-web** - For comprehensive quality assurance

## Success Criteria

TDD is successful when:
- [ ] All tests are written before implementation
- [ ] Tests are clear, focused, and maintainable
- [ ] Test coverage meets goals (80%+)
- [ ] Tests run fast (<5 seconds for unit tests)
- [ ] Tests catch regressions effectively
- [ ] Code is designed better due to testability requirements

## Remember

TDD isn't about testing - it's about design. Writing tests first forces you to think about API design, interfaces, and edge cases before implementation. This leads to better, more maintainable code.
