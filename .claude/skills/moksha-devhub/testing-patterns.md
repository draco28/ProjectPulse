---
name: moksha-testing-patterns
description: TDD-first testing for Moksha DevHub. Test-Driven Development for ALL tasks using Jest, React Testing Library, and Playwright. Write tests first, implement code, iterate until tests pass.
triggers:
  [
    'write test',
    'test',
    'jest',
    'testing library',
    'playwright',
    'e2e',
    'unit test',
    'tdd',
    'test-driven',
  ]
token_estimate: 320
last_updated: 2025-10-26
related_docs:
  - ../../.agent/sops/testing-workflow.md
---

# Moksha Testing Patterns (TDD-First)

## ⚠️ CRITICAL: Test-Driven Development for ALL Tasks

**ALWAYS follow TDD workflow for EVERY implementation task:**

### TDD Workflow (3 Steps)

```
1. 🔴 RED: Write failing test first
   ↓
2. 🟢 GREEN: Write minimal code to pass test
   ↓
3. 🔵 REFACTOR: Improve code quality
   ↓
   Repeat until feature complete
```

### When to Apply TDD

**For ALL tasks** (not just complex ones):

- ✅ API endpoints (write test → implement route)
- ✅ React components (write test → implement component)
- ✅ Utilities/helpers (write test → implement function)
- ✅ Database queries (write test → implement Prisma query)
- ✅ Forms & validation (write test → implement form logic)
- ✅ Business logic (write test → implement algorithm)

### TDD Example: API Endpoint

```typescript
// Step 1: 🔴 Write failing test FIRST
// __tests__/api/issues.test.ts
describe('POST /api/issues', () => {
  it('creates an issue with valid data', async () => {
    const request = new Request('http://localhost/api/issues', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Issue',
        description: 'Test Description',
        priority: 'HIGH',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toMatchObject({
      title: 'Test Issue',
      priority: 'HIGH',
    });
  });

  it('returns 400 for invalid data', async () => {
    const request = new Request('http://localhost/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: '' }), // Invalid: empty title
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });
});

// Run test: pnpm test issues.test.ts
// Result: 🔴 FAILS (route doesn't exist yet)

// Step 2: 🟢 Write minimal code to pass test
// app/api/issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const issueSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = issueSchema.parse(body);
    const issue = await prisma.issue.create({ data: validated });
    return NextResponse.json({ data: issue }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Run test: pnpm test issues.test.ts
// Result: 🟢 PASSES

// Step 3: 🔵 Refactor (if needed)
// - Extract validation schema to separate file
// - Add error handling utilities
// - Improve response formatting
```

### TDD Example: React Component

```typescript
// Step 1: 🔴 Write failing test FIRST
// __tests__/components/IssueCard.test.tsx
import { render, screen } from '@testing-library/react';
import { IssueCard } from '@/components/issues/IssueCard';

describe('IssueCard', () => {
  const mockIssue = {
    id: '1',
    title: 'Test Issue',
    description: 'Test Description',
    status: 'OPEN',
    priority: 'HIGH',
  };

  it('renders issue title and description', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('Test Issue')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows priority badge with correct color', () => {
    render(<IssueCard issue={mockIssue} />);
    const badge = screen.getByText('HIGH');
    expect(badge).toHaveClass('badge-high');
  });

  it('displays status correctly', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });
});

// Run test: pnpm test IssueCard.test.tsx
// Result: 🔴 FAILS (component doesn't exist yet)

// Step 2: 🟢 Write minimal code to pass test
// components/issues/IssueCard.tsx
interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
  };
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <div className="issue-card">
      <h3>{issue.title}</h3>
      <p>{issue.description}</p>
      <span className={`badge-${issue.priority.toLowerCase()}`}>
        {issue.priority}
      </span>
      <span>{issue.status}</span>
    </div>
  );
}

// Run test: pnpm test IssueCard.test.tsx
// Result: 🟢 PASSES

// Step 3: 🔵 Refactor
// - Add neumorphic styling
// - Improve accessibility (ARIA labels)
// - Extract badge component
```

### TDD Benefits for Moksha DevHub

**Why TDD for ALL tasks:**

1. **Prevents bugs**: Tests catch issues before code review
2. **Better design**: Writing tests first forces good API design
3. **Documentation**: Tests serve as executable documentation
4. **Confidence**: Refactor freely knowing tests will catch breaks
5. **Faster debugging**: Failed test pinpoints exact issue
6. **Dependency clarity**: Writing tests reveals missing dependencies early

### TDD Quick Checklist

**Before implementing ANY feature:**

- [ ] Write failing test(s) first
- [ ] Run test to confirm it fails (🔴 RED)
- [ ] Implement minimal code to pass
- [ ] Run test to confirm it passes (🟢 GREEN)
- [ ] Refactor code for quality (🔵 REFACTOR)
- [ ] Repeat for edge cases and error handling
- [ ] Run full test suite before committing

---

# Moksha Testing Patterns

## Test Structure

```
__tests__/
  api/                   # API route tests
    issues.test.ts
  components/            # Component tests
    IssueCard.test.tsx
  lib/                   # Utility tests
    format-date.test.ts

e2e/                     # Playwright E2E tests
  issues.spec.ts
```

## API Tests (Jest + Supertest)

```typescript
// __tests__/api/issues.test.ts
import { POST, GET } from '@/app/api/issues/route';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('POST /api/issues', () => {
  it('creates an issue', async () => {
    const mockIssue = { id: '1', title: 'Test Issue' };
    (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

    const request = new Request('http://localhost/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Issue' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toEqual(mockIssue);
  });

  it('validates input', async () => {
    const request = new Request('http://localhost/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: '' }), // Invalid
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);
  });
});
```

## Component Tests (React Testing Library)

```typescript
// __tests__/components/IssueCard.test.tsx
import { render, screen } from '@testing-library/react';
import { IssueCard } from '@/components/issues/IssueCard';

describe('IssueCard', () => {
  const mockIssue = {
    id: '1',
    title: 'Test Issue',
    description: 'Test Description',
    status: 'OPEN',
  };

  it('renders issue title', () => {
    render(<IssueCard issue={mockIssue} />);

    expect(screen.getByText('Test Issue')).toBeInTheDocument();
  });

  it('shows issue description', () => {
    render(<IssueCard issue={mockIssue} />);

    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    render(<IssueCard issue={mockIssue} />);

    const badge = screen.getByText('OPEN');
    expect(badge).toHaveClass('badge-open');
  });
});
```

## E2E Tests (Playwright)

```typescript
// e2e/issues.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Issues Page', () => {
  test('displays list of issues', async ({ page }) => {
    await page.goto('http://localhost:3000/issues');

    // Wait for issues to load
    await page.waitForSelector('[data-testid="issue-card"]');

    // Check issue is displayed
    const issueCards = await page.locator('[data-testid="issue-card"]');
    expect(await issueCards.count()).toBeGreaterThan(0);
  });

  test('creates new issue', async ({ page }) => {
    await page.goto('http://localhost:3000/issues/new');

    // Fill form
    await page.fill('[name="title"]', 'E2E Test Issue');
    await page.fill('[name="description"]', 'Created by E2E test');

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect and display
    await expect(page).toHaveURL(/\/issues\/\d+/);
    await expect(page.locator('h1')).toContainText('E2E Test Issue');
  });
});
```

## Our Conventions

**Test Files**:

- Colocate: `Component.tsx` → `Component.test.tsx` OR `__tests__/components/Component.test.tsx`
- Naming: `*.test.ts` or `*.test.tsx`
- E2E: `e2e/*.spec.ts`

**Test Structure (AAA)**:

```typescript
it('does something', () => {
  // Arrange
  const input = 'test';

  // Act
  const result = doSomething(input);

  // Assert
  expect(result).toBe('expected');
});
```

**Coverage Goals**:

- API routes: 90%+
- Utilities: 85%+
- Components: 70%+
- E2E: Critical paths

## Mocking Patterns

**Mock Prisma**:

```typescript
jest.mock('@/lib/db', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));
```

**Mock Next.js Router**:

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));
```

**Mock Modules**:

```typescript
jest.mock('@/lib/utils', () => ({
  formatDate: jest.fn(() => '2025-01-01'),
}));
```

## Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Specific test file
pnpm test issues.test.ts
```

## Test Data

**Factory Pattern**:

```typescript
// __tests__/factories/issue.ts
export function createMockIssue(overrides = {}) {
  return {
    id: '1',
    title: 'Test Issue',
    description: 'Test Description',
    status: 'OPEN',
    priority: 'MEDIUM',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage
const issue = createMockIssue({ title: 'Custom Title' });
```

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<IssueCard issue={mockIssue} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Full Documentation

**Testing Guide** (when created): [.agent/sops/testing-workflow.md](../../.agent/sops/testing-workflow.md)

- TDD workflow
- Advanced mocking
- Integration testing
- Performance testing
- CI/CD integration

---

**Token Cost**: ~320 tokens (vs ~2,000+ in full guide)
**Coverage**: 85% of common testing scenarios
**When to Use Full Docs**: Complex mocking, integration tests, CI setup
