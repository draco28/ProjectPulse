---
name: moksha-testing-patterns
description: Testing conventions for Moksha DevHub using Jest, React Testing Library, and Playwright. Use when writing unit tests, API tests, component tests, or E2E tests.
triggers: ['write test', 'test', 'jest', 'testing library', 'playwright', 'e2e', 'unit test']
token_estimate: 240
last_updated: 2025-10-26
related_docs:
  - ../../.agent/sops/testing-workflow.md
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

**Token Cost**: ~240 tokens (vs ~2,000+ in full guide)
**Coverage**: 85% of common testing scenarios
**When to Use Full Docs**: Complex mocking, integration tests, CI setup
