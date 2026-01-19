# Testing Workflow Rebuild Plan (Post-MVP)

**Project**: ProjectPulse
**Last Updated**: 2025-01-19

## 0) Problem Statement
ProjectPulse has reached post-MVP scale, but the testing system is not production-grade:

- Tests are **flaky** (often require 2–3 reruns).
- Dev testing is not trusted, pushing validation to prod (high risk).
- Mixed tooling is fine (Jest + Playwright + Node `--test`), but **the workflow + isolation + reliability are missing**.

This document proposes a plan to restructure the testing workflow so that you can validate changes **safely in dev/test**, with CI acting as a reliable gate before deploy.

---

## 1) Current State (Facts from Repo)

### 1.1 Test Frameworks
- **apps/web**
  - Jest v29.7.0 (`apps/web/jest.config.js`)
  - Playwright v1.56.1 (`apps/web/playwright.config.ts`)
- **apps/mcp-server**
  - Node.js built-in test runner via `tsx --test` (no central config)

### 1.2 Primary Pain Points (ranked)
- **E2E flakiness (HIGH)**
  - Many `waitForTimeout(500)` anti-patterns (40+ instances in `tickets-filters.spec.ts` alone).
- **Unit test state leakage (HIGH)**
  - Shared `localStorage` store in Jest setup (`jest.setup.js:58-78`).
- **Integration stability gaps (MEDIUM)**
  - Missing Prisma disconnect cleanup risk.
- **E2E auth isolation (MEDIUM)**
  - Single shared auth state file (`.auth/user.json`).

### 1.3 Root Cause: "Tests Never Work First Time"

**Chain of failures on fresh clone or CI:**

```
pnpm test (FAILS)
  └── Prisma types not generated → "Cannot find module '@prisma/client'"

pnpm prisma generate (MANUAL FIX)
pnpm test (FAILS AGAIN)
  └── DATABASE_URL undefined (dotenv loaded in setup, not config)
  └── Test database doesn't exist

pnpm db:reset (MANUAL FIX)
pnpm test (FAILS AGAIN)
  └── Migrations not applied to test DB
  └── Sequence "Issue_id_seq" doesn't exist (renamed to "Ticket_id_seq")

pnpm prisma migrate deploy (MANUAL FIX)
pnpm test (FINALLY PASSES... sometimes)
  └── localStorage state from previous run causes order-dependent failures
```

**Root cause:** Undocumented implicit dependencies.

### 1.4 Specific Code Issues Identified

| File | Line | Issue | Impact |
|------|------|-------|--------|
| `jest.setup.js` | 4-9 | dotenv loaded in setup, not config | DATABASE_URL undefined on import |
| `jest.setup.js` | 58-78 | localStorage store never reset | Tests affect each other |
| `seed-e2e.ts` | 44-49 | Wrong sequence name `Issue_id_seq` | Sequence reset silently fails |
| `global-setup.ts` | - | No `.auth` directory creation | E2E setup fails to write auth |
| `jest.config.js` | - | No premigration/pregenerate check | Tests fail with missing modules |
| `tests/api/*.test.ts` | - | No `prisma.$disconnect()` | Connection pool exhaustion |

### 1.5 Environment Topology (Authoritative)

#### Host-access URLs (scripts/tests on Mac mini)
- **Dev** (`docker-compose.cloud.yml`)
  - Web: `http://localhost:3000`
  - MCP: `http://localhost:3001`
  - Postgres: `localhost:5432` (`projectpulse_dev`)
  - Redis: `localhost:6379`
- **Prod-local** (`docker-compose.prod-local.yml`)
  - Web: `http://localhost:8080`
  - MCP: `http://localhost:8081`
  - Postgres: `localhost:5433` (`projectpulse_prod`)
  - Redis: `localhost:6380`
- **Test** (`docker-compose.test.yml` - NEW)
  - Web: `http://localhost:3100`
  - MCP: `http://localhost:3101`
  - Postgres: `localhost:5434` (`projectpulse_test`)
  - Redis: `localhost:6381`
- **Prod-public (Cloudflare)**
  - Web: `https://projectpulse.dracodev.dev`
  - MCP: `https://projectpulsemcp.dracodev.dev`

#### Container-to-container URLs
- **Dev**
  - Web → DB: `postgresql://postgres:postgres123@postgres:5432/projectpulse_dev`
  - Web → Redis: `redis://:devredis123@redis:6379`
  - MCP → Web: `PROJECTPULSE_API_URL=http://nextjs:3000`
- **Prod-local**
  - Web → DB: `postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@prod-postgres:5432/$PROD_POSTGRES_DB`
  - Web → Redis: `redis://:$PROD_REDIS_PASSWORD@prod-redis:6379`
  - MCP → Web: `PROJECTPULSE_API_URL=http://prod-nextjs:3000`
- **Test**
  - Web → DB: `postgresql://postgres:testpass123@test-postgres:5432/projectpulse_test`
  - Web → Redis: `redis://:testredis123@test-redis:6379`
  - MCP → Web: `PROJECTPULSE_API_URL=http://test-nextjs:3000`

---

## 2) Objectives / Acceptance Criteria

### 2.1 Objectives
- Make local testing **reliable on first run**.
- Ensure dev/testing does **not depend on prod-public**, ever.
- Preserve Docker-first E2E (correct architectural choice).
- Reduce cognitive overhead: a clear, documented "how to test changes" flow.

### 2.2 Acceptance Criteria (measurable)
- **E2E stability**: run the full Playwright suite 20 times; **≥ 19/20** runs pass with **no code changes**.
- **No blind prod testing**: day-to-day feature work validated by `pnpm test:*` commands.
- **No `waitForTimeout()` in E2E** except in explicit debug-only helpers.
- **No cross-test state leakage** in Jest (localStorage and similar globals reset).
- CI provides a trustworthy signal; "green" means deploy confidence.
- **First-run success**: `pnpm test:stack:up && pnpm test:all` passes on fresh clone.

---

## 3) Target Testing Architecture

### 3.1 Keep the mixed framework approach (but make it coherent)
- **Jest** remains for unit + integration tests in `apps/web`.
- **Playwright** remains for E2E, Docker-first.
- **Node `--test`** remains for MCP server tests.

The change is NOT "switch frameworks" — it's:
- **Isolation** (dedicated test stack)
- **Deterministic fixtures**
- **Correct waits**
- **Clear layers and commands**
- **CI gating strategy**
- **Preflight validation** (NEW)

### 3.2 Introduce a dedicated isolated test stack
Create `docker-compose.test.yml` (new) with:
- **Test Web** container
- **Test Postgres** (separate DB + port)
- **Test Redis** (separate port)
- Optional: **Test MCP** if E2E needs MCP tool flows

Approved host ports (safe, non-conflicting):
- Web: `http://localhost:3100`
- MCP: `http://localhost:3101`
- Postgres: `localhost:5434` (`projectpulse_test`)
- Redis: `localhost:6381`

Key rule: **Tests never point at 5432/5433 or 6379/6380**.

#### docker-compose.test.yml (Full Implementation)

```yaml
version: '3.8'

services:
  test-postgres:
    image: pgvector/pgvector:pg15
    container_name: projectpulse-test-postgres
    ports:
      - "5434:5432"
    environment:
      POSTGRES_DB: projectpulse_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: testpass123
    volumes:
      - test_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d projectpulse_test"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - test-network

  test-redis:
    image: redis:7-alpine
    container_name: projectpulse-test-redis
    ports:
      - "6381:6379"
    command: redis-server --requirepass testredis123 --appendonly yes
    volumes:
      - test_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "testredis123", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - test-network

  test-nextjs:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.test
    container_name: projectpulse-test-web
    ports:
      - "3100:3000"
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://postgres:testpass123@test-postgres:5432/projectpulse_test
      REDIS_URL: redis://:testredis123@test-redis:6379
      NEXTAUTH_URL: http://localhost:3100
      NEXTAUTH_SECRET: test-secret-for-testing-only
    depends_on:
      test-postgres:
        condition: service_healthy
      test-redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - test-network

  test-mcp:
    build:
      context: .
      dockerfile: apps/mcp-server/Dockerfile.test
    container_name: projectpulse-test-mcp
    ports:
      - "3101:3001"
    environment:
      NODE_ENV: test
      MCP_PORT: 3001
      PROJECTPULSE_API_URL: http://test-nextjs:3000
      MCP_INTERNAL_SECRET: test-mcp-secret
    depends_on:
      test-nextjs:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - test-network

volumes:
  test_postgres_data:
  test_redis_data:

networks:
  test-network:
    driver: bridge
```

### 3.3 Environment safety rails (must-have)
Add hard guards so tests cannot accidentally hit prod:

- **Playwright guard**: refuse to run if baseURL contains `projectpulse.dracodev.dev` unless an explicit override env var is set.
- **DB guard**: refuse to run if `DATABASE_URL` points at prod/dev; additionally require test DB (`projectpulse_test`) on port `5434` for integration/e2e.
  - prod DB name (`projectpulse_prod`) or prod-local port (`5433`)
  - dev DB name (`projectpulse_dev`) or dev port (`5432`) when running integration/e2e
- **Redis guard**: similarly prevent pointing at prod-local/dev redis ports (require `6381` for integration/e2e).

#### test-guards.ts (Full Implementation)

```typescript
// apps/web/lib/test-guards.ts

export type TestType = 'unit' | 'integration' | 'e2e';

export function assertTestEnvironment(testType: TestType = 'unit') {
  const dbUrl = process.env.DATABASE_URL || '';
  const redisUrl = process.env.REDIS_URL || '';
  const baseUrl = process.env.TEST_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || '';

  // CRITICAL: Never allow prod-public
  if (baseUrl.includes('projectpulse.dracodev.dev')) {
    if (!process.env.ALLOW_PROD_TESTS) {
      throw new Error(
        '🚫 BLOCKED: Tests cannot run against production!\n' +
        'baseURL contains projectpulse.dracodev.dev\n' +
        'Set ALLOW_PROD_TESTS=true only for explicit smoke tests.'
      );
    }
  }

  // For integration/E2E: require test database
  if (testType !== 'unit') {
    // Block prod database
    if (dbUrl.includes('projectpulse_prod') || dbUrl.includes(':5433')) {
      throw new Error(
        '🚫 BLOCKED: Integration/E2E tests cannot use production database!\n' +
        `DATABASE_URL: ${dbUrl.substring(0, 50)}...`
      );
    }

    // Block dev database for integration/E2E
    if (dbUrl.includes('projectpulse_dev') || dbUrl.includes(':5432')) {
      throw new Error(
        '🚫 BLOCKED: Integration/E2E tests must use test database!\n' +
        `DATABASE_URL points to dev database.\n` +
        'Use: postgresql://postgres:testpass123@localhost:5434/projectpulse_test'
      );
    }

    // Require test database
    if (!dbUrl.includes('projectpulse_test') || !dbUrl.includes('5434')) {
      throw new Error(
        '🚫 BLOCKED: Integration/E2E tests require test database!\n' +
        `Expected: projectpulse_test on port 5434\n` +
        `Got: ${dbUrl.substring(0, 50)}...`
      );
    }

    // Require test Redis
    if (!redisUrl.includes('6381')) {
      throw new Error(
        '🚫 BLOCKED: Integration/E2E tests require test Redis on port 6381!\n' +
        `Got: ${redisUrl.substring(0, 30)}...`
      );
    }
  }

  console.log(`✅ Test environment validated for ${testType} tests`);
}
```

### 3.4 Preflight validation script (NEW)

Add a script that validates ALL prerequisites before running any tests:

```typescript
// scripts/test-preflight.ts
import fs from 'fs';
import path from 'path';

interface PreflightResult {
  passed: boolean;
  checks: { name: string; passed: boolean; message: string }[];
}

async function runPreflight(): Promise<PreflightResult> {
  const checks: PreflightResult['checks'] = [];

  // 1. Check Prisma types generated
  const prismaClientPath = path.join(process.cwd(), 'node_modules/.prisma/client');
  const prismaGenerated = fs.existsSync(prismaClientPath);
  checks.push({
    name: 'Prisma types generated',
    passed: prismaGenerated,
    message: prismaGenerated
      ? 'Found .prisma/client'
      : '❌ Run: pnpm prisma generate',
  });

  // 2. Check .env.test exists
  const envTestPath = path.join(process.cwd(), '.env.test');
  const envTestExists = fs.existsSync(envTestPath);
  checks.push({
    name: '.env.test file exists',
    passed: envTestExists,
    message: envTestExists
      ? 'Found .env.test'
      : '❌ Create .env.test with test database URL',
  });

  // 3. Check DATABASE_URL is set and points to test DB
  const dbUrl = process.env.DATABASE_URL || '';
  const dbValid = dbUrl.includes('projectpulse_test') && dbUrl.includes('5434');
  checks.push({
    name: 'DATABASE_URL points to test DB',
    passed: dbValid,
    message: dbValid
      ? 'DATABASE_URL correctly set'
      : '❌ DATABASE_URL must contain projectpulse_test and port 5434',
  });

  // 4. Check test stack is running (if doing integration/E2E)
  const testType = process.env.TEST_TYPE || 'unit';
  if (testType !== 'unit') {
    try {
      const response = await fetch('http://localhost:3100/api/health', {
        signal: AbortSignal.timeout(5000),
      });
      const healthy = response.ok;
      checks.push({
        name: 'Test stack running',
        passed: healthy,
        message: healthy
          ? 'Test web server healthy at localhost:3100'
          : '❌ Run: pnpm test:stack:up',
      });
    } catch {
      checks.push({
        name: 'Test stack running',
        passed: false,
        message: '❌ Test stack not reachable. Run: pnpm test:stack:up',
      });
    }
  }

  // 5. Check .auth directory exists (for E2E)
  if (testType === 'e2e') {
    const authDir = path.join(process.cwd(), '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    checks.push({
      name: '.auth directory exists',
      passed: true,
      message: 'Created .auth directory if missing',
    });
  }

  // Summary
  const allPassed = checks.every((c) => c.passed);

  console.log('\n🔍 Test Preflight Checks\n');
  console.log('─'.repeat(50));
  for (const check of checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (!check.passed) {
      console.log(`   ${check.message}`);
    }
  }
  console.log('─'.repeat(50));

  if (allPassed) {
    console.log('\n✅ All preflight checks passed!\n');
  } else {
    console.log('\n❌ Some preflight checks failed. Fix issues above before running tests.\n');
    process.exit(1);
  }

  return { passed: allPassed, checks };
}

runPreflight().catch(console.error);
```

---

## 4) Stabilization Plan by Test Layer

### 4.1 Playwright (highest ROI)

#### Immediate quick wins
- Replace `waitForTimeout()` with deterministic waits:
  - `await page.goto(url, { waitUntil: 'networkidle' })`
  - `await page.waitForLoadState('networkidle')` (when appropriate)
  - `await page.waitForURL(...)`
  - Prefer `await expect(locator).toBeVisible()` as the "page ready" signal

**Specific files to fix:**

| File | Instances | Fix Pattern |
|------|-----------|-------------|
| `tickets-filters.spec.ts` | 40+ | Replace all `waitForTimeout(500)` with `waitForLoadState('networkidle')` |
| `kanban.spec.ts` | 10+ | Use `expect(card).toBeVisible()` instead of fixed waits |
| `auth-flow.spec.ts` | 5+ | Use `waitForURL()` after redirects |

**Before/After Example:**

```typescript
// BEFORE (flaky):
await page.goto('/tickets?project=2&kind=feature');
await page.waitForTimeout(500);
await expect(page).toHaveURL(/kind=feature/);

// AFTER (deterministic):
await page.goto('/tickets?project=2&kind=feature');
await page.waitForLoadState('networkidle');
await expect(page).toHaveURL(/kind=feature/);
```

#### Structural upgrades
- Create a small set of **page objects / helpers** for repeated flows:
  - Login
  - Navigate to Tickets
  - Apply Filters
  - Create Ticket
- Standardize selectors:
  - Prefer roles (`getByRole`) and explicit `data-testid` only where needed.

#### Auth state isolation
Current single shared `.auth/user.json` is a flake risk.

Target:
- Create per-worker auth state files (e.g. `.auth/user-worker-0.json`, etc.)
- Ensure each worker uses a unique test user and does not fight for session state.

**Implementation:**

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : 4,
  use: {
    storageState: ({ workerIndex }) =>
      `.auth/user-worker-${workerIndex}.json`,
  },
});

// tests/setup/global-setup.ts
async function globalSetup(config: FullConfig) {
  const workerCount = config.workers || 1;

  // Create .auth directory
  const authDir = path.join(process.cwd(), '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Create auth state for each worker
  for (let i = 0; i < workerCount; i++) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${baseURL}/login`);
    await page.fill('#email', `test-worker-${i}@example.com`);
    await page.fill('#password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await context.storageState({ path: `.auth/user-worker-${i}.json` });
    await browser.close();
  }
}
```

#### Trace + diagnostics (to stop "rerun until green")
- Ensure Playwright captures:
  - trace `on-first-retry`
  - screenshot/video on failure
- Add a consistent debug command that opens trace viewer.

### 4.2 Jest Unit Tests (fix state leakage)

**Critical fix for localStorage:**

```typescript
// jest.setup.js - FIXED VERSION

// Load environment FIRST (before any imports)
// This is now in jest.config.js instead

import '@testing-library/jest-dom';

// ... other setup ...

// Mock localStorage with proper reset
let localStorageStore: Record<string, string> = {};

// Reset before EACH test
beforeEach(() => {
  localStorageStore = {};  // ← Clear the store!
  jest.clearAllMocks();
});

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => localStorageStore[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      localStorageStore[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete localStorageStore[key];
    }),
    clear: jest.fn(() => {
      localStorageStore = {};
    }),
    get length() {
      return Object.keys(localStorageStore).length;
    },
    key: jest.fn((index: number) => Object.keys(localStorageStore)[index] || null),
  },
  writable: true,
});
```

**Move dotenv to config:**

```javascript
// jest.config.js - Add at TOP before module.exports
require('dotenv').config({ path: '.env.test' });

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  // ... rest of config
};
```

- Ensure all global mocks are deterministic and reset:
  - `jest.resetAllMocks()` / `jest.clearAllMocks()` policy
  - consistent use of fake timers where timing is tested

Also reduce brittle timing assertions:
- Replace fixed "must happen within 50ms" with deterministic clock control or looser contracts.

### 4.3 Jest Integration Tests (DB + Prisma hygiene)
- Ensure Prisma cleanup:
  - Add a global `afterAll` for `prisma.$disconnect()` where appropriate.
- Move integration tests to target the isolated test DB.
- Add deterministic database reset strategy (approved):
  - **Integration/E2E**: truncate tables + `RESTART IDENTITY` + `CASCADE` between test files/suites, then seed baseline data.
  - **Unit**: unit tests should be DB-free; if a suite must touch DB, treat it as integration by default. Transaction rollback is optional for tightly-scoped DB tests that avoid parallelism.

#### db-reset.ts (Full Implementation)

```typescript
// apps/web/tests/helpers/db-reset.ts
import { PrismaClient } from '@prisma/client';

// Tables in reverse dependency order (children before parents)
const TABLES_TO_TRUNCATE = [
  'Comment',
  'TicketLabel',
  'Attachment',
  'Ticket',
  'Label',
  'Sprint',
  'Phase',
  'Roadmap',
  'AgentSession',
  'MemoryBank',
  'KnowledgeItem',
  'WikiPage',
  'WorkflowRun',
  'WorkflowTemplate',
  'SOP',
  'Skill',
  'AgentPersona',
  'OnboardingSession',
  'Project',
  'User',
];

export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  // Safety check
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('projectpulse_test')) {
    throw new Error('resetTestDatabase can only run against projectpulse_test!');
  }

  console.log('🗑️  Truncating test database...');

  // Disable FK constraints temporarily
  await prisma.$executeRaw`SET session_replication_role = 'replica'`;

  // Truncate all tables
  for (const table of TABLES_TO_TRUNCATE) {
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`
      );
    } catch (error) {
      // Table might not exist yet (migration pending)
      console.warn(`  ⚠️  Could not truncate ${table}: ${(error as Error).message}`);
    }
  }

  // Re-enable FK constraints
  await prisma.$executeRaw`SET session_replication_role = 'origin'`;

  console.log('✅ Database truncated');

  // Seed baseline data
  await seedBaseline(prisma);
}

async function seedBaseline(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding baseline test data...');

  // Create test user
  const user = await prisma.user.create({
    data: {
      id: 'test-user-001',
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  // Create test project
  const project = await prisma.project.create({
    data: {
      id: 1,
      name: 'Test Project',
      slug: 'test-project',
      description: 'Project for automated tests',
    },
  });

  // Create default labels
  await prisma.label.createMany({
    data: [
      { id: 1, name: 'bug', color: '#dc2626', projectId: project.id },
      { id: 2, name: 'feature', color: '#2563eb', projectId: project.id },
      { id: 3, name: 'enhancement', color: '#7c3aed', projectId: project.id },
    ],
  });

  console.log('✅ Baseline data seeded');
}

// For use in Jest global setup
export async function globalTestSetup(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await resetTestDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

// For use in Jest global teardown
export async function globalTestTeardown(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors
  }
}
```

### 4.4 MCP Server Tests (Node `--test`)
- Keep current runner, but align environment rules:
  - MCP tests should target the same isolated test web stack.
- Add the same "no prod URL" safety checks.

### 4.5 Test data strategy (factories + script-driven seeding)
- Use Prisma/script-driven seeding (no test-only seed API routes).
- Extend existing `apps/web/prisma/seed-e2e.ts` and add `apps/web/prisma/seed-test.ts` for unit/integration baseline.
- Add factories/scenarios under `apps/web/tests/fixtures/` so tests create deterministic data.

#### Directory Structure

```
apps/web/tests/
├── fixtures/
│   ├── factories/
│   │   ├── index.ts           # Re-export all factories
│   │   ├── user.factory.ts
│   │   ├── project.factory.ts
│   │   ├── ticket.factory.ts
│   │   ├── label.factory.ts
│   │   ├── sprint.factory.ts
│   │   └── comment.factory.ts
│   ├── scenarios/
│   │   ├── empty-project.ts       # Project with no tickets
│   │   ├── project-with-tickets.ts # Project + 10 tickets in various states
│   │   ├── kanban-board.ts        # Tickets in all 5 columns
│   │   └── full-sprint.ts         # Roadmap + phase + sprint + tickets
│   └── index.ts               # Re-export all
├── helpers/
│   ├── db-reset.ts            # Truncate + seed
│   ├── auth.ts                # Login/logout helpers
│   └── wait.ts                # Deterministic wait utilities
└── setup/
    ├── global-setup.ts        # Enhanced with .auth directory creation
    └── global-teardown.ts     # Enhanced with proper cleanup
```

#### Factory Example

```typescript
// apps/web/tests/fixtures/factories/ticket.factory.ts
import { faker } from '@faker-js/faker';
import type { Prisma, PrismaClient, TicketKind, TicketStatus } from '@prisma/client';

let ticketCounter = 1;

export interface TicketFactoryOptions {
  projectId?: number;
  title?: string;
  kind?: TicketKind;
  status?: TicketStatus;
  priority?: string;
  description?: string;
  assignee?: string;
  sprintNumber?: number;
}

export function buildTicket(options: TicketFactoryOptions = {}): Prisma.TicketCreateInput {
  const counter = ticketCounter++;
  return {
    title: options.title || `Test Ticket ${counter}: ${faker.lorem.sentence()}`,
    kind: options.kind || 'task',
    status: options.status || 'todo',
    source: 'agent',
    priority: options.priority || 'medium',
    description: options.description || faker.lorem.paragraphs(2),
    assignee: options.assignee,
    sprintNumber: options.sprintNumber,
    project: { connect: { id: options.projectId || 1 } },
  };
}

export async function createTicket(
  prisma: PrismaClient,
  options: TicketFactoryOptions = {}
) {
  return prisma.ticket.create({
    data: buildTicket(options),
  });
}

export async function createTickets(
  prisma: PrismaClient,
  count: number,
  options: TicketFactoryOptions = {}
) {
  const tickets = [];
  for (let i = 0; i < count; i++) {
    tickets.push(await createTicket(prisma, options));
  }
  return tickets;
}

export function resetTicketCounter() {
  ticketCounter = 1;
}
```

#### Scenario Example

```typescript
// apps/web/tests/fixtures/scenarios/kanban-board.ts
import type { PrismaClient } from '@prisma/client';
import { createTickets } from '../factories/ticket.factory';

/**
 * Creates a project with tickets distributed across all Kanban columns.
 * Useful for testing Kanban drag-drop, filtering, and progress calculations.
 */
export async function createKanbanBoardScenario(prisma: PrismaClient, projectId = 1) {
  const statuses = ['backlog', 'todo', 'in-progress', 'in-review', 'done'] as const;
  const tickets: Record<string, Awaited<ReturnType<typeof createTickets>>> = {};

  for (const status of statuses) {
    tickets[status] = await createTickets(prisma, 3, {
      projectId,
      status,
      kind: 'task',
    });
  }

  return {
    projectId,
    tickets,
    totalCount: 15,
    statusCounts: {
      backlog: 3,
      todo: 3,
      'in-progress': 3,
      'in-review': 3,
      done: 3,
    },
  };
}
```

### 4.6 Fix seed-e2e.ts sequence names (CRITICAL)

**Current bug in `apps/web/prisma/seed-e2e.ts`:**

```typescript
// Line 46 - WRONG (table was renamed from Issue to Ticket)
await prisma.$executeRaw`ALTER SEQUENCE "Issue_id_seq" RESTART WITH 1;`;
```

**Fix - use dynamic sequence discovery:**

```typescript
// apps/web/prisma/seed-e2e.ts - FIXED
async function resetSequences(prisma: PrismaClient) {
  console.log('🔄 Resetting ID sequences...');

  // Dynamically find all sequences in the public schema
  const sequences = await prisma.$queryRaw<{ sequence_name: string }[]>`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `;

  for (const seq of sequences) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`
      );
      console.log(`  ✅ Reset ${seq.sequence_name}`);
    } catch (error) {
      console.warn(`  ⚠️  Could not reset ${seq.sequence_name}`);
    }
  }
}
```

---

## 5) Developer Workflow (Local Commands)
Goal: you can run these before pushing to master.

### 5.1 Test commands

- `pnpm test` (fast): unit tests only
- `pnpm test:integration`: brings up test DB/Redis (or uses already-running test stack), migrates, runs integration suite
- `pnpm test:e2e`: brings up full test stack (web+db+redis), then Playwright
- `pnpm test:all`: runs unit → integration → e2e in the correct order
- `pnpm test:preflight`: validates all prerequisites (NEW)

### 5.2 Stack commands

- `pnpm test:stack:up` - Start test containers, wait for health, migrate, seed
- `pnpm test:stack:down` - Stop and remove test containers
- `pnpm test:stack:reset` - Reset database to clean state
- `pnpm test:stack:logs` - View test container logs

### 5.3 Package.json scripts (Full Implementation)

```json
{
  "scripts": {
    "test": "jest --testPathPattern=__tests__",
    "test:unit": "TEST_TYPE=unit jest --testPathPattern=__tests__",
    "test:integration": "TEST_TYPE=integration jest --testPathPattern=api",
    "test:e2e": "TEST_TYPE=e2e playwright test",
    "test:e2e:ui": "TEST_TYPE=e2e playwright test --ui",
    "test:e2e:smoke": "TEST_TYPE=e2e playwright test --grep @smoke",
    "test:all": "pnpm test:preflight && pnpm test:unit && pnpm test:integration && pnpm test:e2e",
    "test:preflight": "tsx scripts/test-preflight.ts",
    "test:stack:up": "docker compose -f docker-compose.test.yml up -d --wait && pnpm prisma:test:migrate && pnpm prisma:test:seed",
    "test:stack:down": "docker compose -f docker-compose.test.yml down",
    "test:stack:reset": "tsx apps/web/tests/helpers/db-reset.ts",
    "test:stack:logs": "docker compose -f docker-compose.test.yml logs -f",
    "prisma:test:migrate": "DATABASE_URL=postgresql://postgres:testpass123@localhost:5434/projectpulse_test prisma migrate deploy",
    "prisma:test:seed": "DATABASE_URL=postgresql://postgres:testpass123@localhost:5434/projectpulse_test tsx apps/web/prisma/seed-test.ts"
  }
}
```

### 5.4 "Works First Time" Flow

```bash
# Fresh clone - one command to set up and run all tests
git clone <repo>
cd AI_HUB
pnpm install
pnpm test:stack:up    # Starts containers, waits, migrates, seeds
pnpm test:all         # Runs unit → integration → e2e

# Expected: ALL PASS on first attempt
```

---

## 6) CI / Branch Protection Strategy (approved hybrid policy)

### 6.1 Required checks for ALL PRs
- Keep current required checks (lint/typecheck/unit/integration/build)
- Add a required Playwright **smoke** suite (3–8 tests, target 3–8 minutes):
  - Health check
  - Login flow
  - Create ticket
  - Kanban move
  - Wiki page view
- Add **fresh-clone validation** job (NEW)

### 6.2 Full E2E for high-risk PRs + nightly
- Labels: `e2e-required`, `high-risk`, `breaking-change`
  - When present, run the full Playwright suite and mark it required.
- Nightly: run the full Playwright suite on `master` at 2 AM and alert on failure.
- Optional hardening: auto-apply `high-risk`/`e2e-required` labels based on changed paths (auth, Prisma/migrations, `app/api`, MCP server).

### 6.3 CI artifacts
- Upload Playwright traces/screenshots/videos on failure.
- Keep logs from docker containers (web/db/redis) on failure.

### 6.4 CI Workflow Updates (Full Implementation)

```yaml
# .github/workflows/ci.yml - Updated test jobs

jobs:
  lint:
    # ... existing lint job unchanged

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm prisma generate
      - run: pnpm test:unit
        env:
          NODE_ENV: test

  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: projectpulse_test
          POSTGRES_PASSWORD: testpass123
        ports:
          - 5434:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6381:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm prisma generate
      - run: pnpm prisma:test:migrate
      - run: pnpm test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:testpass123@localhost:5434/projectpulse_test
          REDIS_URL: redis://localhost:6381

  e2e-smoke:
    name: E2E Smoke (Required)
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:stack:up
      - run: pnpm test:e2e:smoke
        env:
          TEST_BASE_URL: http://localhost:3100
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-smoke-report
          path: playwright-report/
          retention-days: 7

  e2e-full:
    name: E2E Full (Conditional)
    runs-on: ubuntu-latest
    needs: [lint, test-unit, test-integration]
    if: |
      contains(github.event.pull_request.labels.*.name, 'e2e-required') ||
      contains(github.event.pull_request.labels.*.name, 'high-risk') ||
      contains(github.event.pull_request.labels.*.name, 'breaking-change') ||
      github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:stack:up
      - run: pnpm test:e2e
        env:
          TEST_BASE_URL: http://localhost:3100
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-full-report
          path: playwright-report/
          retention-days: 30

  fresh-clone-validation:
    name: Fresh Clone Test
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          # NO cache - simulates fresh clone
      - run: pnpm install
      - run: pnpm test:stack:up
      - run: pnpm test:preflight
      - run: pnpm test:unit
        env:
          NODE_ENV: test
```

### 6.5 Nightly Full E2E Workflow

```yaml
# .github/workflows/nightly-e2e.yml
name: Nightly E2E

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:

jobs:
  e2e-full-nightly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:stack:up
      - run: pnpm test:e2e
        env:
          TEST_BASE_URL: http://localhost:3100

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: 'C123456'  # Your alerts channel
          slack-message: '🚨 Nightly E2E failed on master! <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>'
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: nightly-playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 7) Rollout Phases (Incremental, Fast Feedback)

### Phase 0 — Baseline (0.5–1 day)
- Measure current failure rates.
- Identify top 5 flaky spec files.
- Document the "chain of failures" for fresh clone.

**Deliverable:** Baseline metrics document with:
| Metric | Current | Target |
|--------|---------|--------|
| E2E pass rate (20 runs) | ~70% | ≥95% |
| First-run success | ~20% | ≥95% |
| Top flaky files | [list] | [all fixed] |

### Phase 1 — Quick wins (1–2 days)
- Remove `waitForTimeout()` patterns from the worst offenders.
- Fix Jest localStorage isolation (add `beforeEach` reset).
- Add Prisma disconnect hygiene.
- **Fix `seed-e2e.ts` sequence name** (`Issue_id_seq` → dynamic).
- **Create `.auth` directory in `global-setup.ts`**.
- **Move dotenv loading from `jest.setup.js` to `jest.config.js`**.

**Files to modify:**
| File | Change |
|------|--------|
| `apps/web/jest.setup.js` | Add `beforeEach` localStorage reset |
| `apps/web/jest.config.js` | Add `require('dotenv').config()` at top |
| `apps/web/prisma/seed-e2e.ts` | Use dynamic sequence discovery |
| `apps/web/tests/setup/global-setup.ts` | Add `.auth` directory creation |
| `apps/web/tests/e2e/tickets-filters.spec.ts` | Replace `waitForTimeout()` calls |

### Phase 2 — Isolated test stack (2–3 days)
- Add `docker-compose.test.yml` + env guards.
- Update Playwright baseURL selection to point at test stack.
- Add `test-guards.ts` with safety checks.
- Add `test-preflight.ts` validation script.

**Files to create:**
| File | Purpose |
|------|---------|
| `docker-compose.test.yml` | Test stack definition |
| `apps/web/lib/test-guards.ts` | Environment safety rails |
| `scripts/test-preflight.ts` | Prerequisites validator |
| `.env.test` | Test environment variables |

### Phase 3 — Deterministic data + fixtures (2–5 days)
- Add seed + reset workflow.
- Introduce factories/fixtures used consistently.
- Create `db-reset.ts` helper.
- Add scenarios for common test setups.

**Files to create:**
| File | Purpose |
|------|---------|
| `apps/web/tests/fixtures/factories/*.ts` | Data factories |
| `apps/web/tests/fixtures/scenarios/*.ts` | Test scenarios |
| `apps/web/tests/helpers/db-reset.ts` | DB truncate + seed |
| `apps/web/prisma/seed-test.ts` | Integration test seed |

### Phase 4 — CI gating upgrade (1–2 days)
- Add required E2E smoke.
- Add label-based full E2E + nightly full runs.
- Add fresh-clone validation job.
- Update `ci.yml` workflow.

### Phase 5 — Prod-local smoke (optional, 1 day)
- Add explicit `smoke:prod-local` that targets `http://localhost:8080`.
- This is never for day-to-day development; it's for release confidence.

---

## 8) Decisions (Approved)
- **E2E gating**: Hybrid (smoke required for all PRs; full suite required for PRs labeled `e2e-required`, `high-risk`, `breaking-change`; nightly full run on `master`).
- **Test ports**: `3100/3101/5434/6381`.
- **DB reset**: Truncate tables for integration/E2E; unit tests should be DB-free; transaction rollback is allowed only for tightly scoped DB tests that avoid parallelism.
- **Seeding**: Prisma/script-driven seeding + factories (no test-only seed API route).
- **Safety rails**: Hard guards preventing tests from hitting prod/dev databases.
- **Preflight validation**: Required script that checks all prerequisites.

---

## 9) Verification Plan

After implementation, verify success with:

### 9.1 Fresh Clone Test
```bash
# Simulates new developer or CI fresh checkout
rm -rf node_modules .prisma .auth
pnpm install
pnpm test:stack:up
pnpm test:all

# Expected: ALL PASS on first attempt
```

### 9.2 Stability Test (20 runs)
```bash
# Run full E2E suite 20 times
for i in {1..20}; do
  echo "Run $i/20"
  pnpm test:e2e --reporter=json >> stability-report.json 2>&1
  echo "---"
done

# Expected: ≥19/20 passes (95%+)
```

### 9.3 Isolation Test
```bash
# Run tests in random order to detect state leakage
pnpm test:e2e --shard=1/4 && \
pnpm test:e2e --shard=3/4 && \
pnpm test:e2e --shard=2/4 && \
pnpm test:e2e --shard=4/4

# Expected: All shards pass regardless of order
```

### 9.4 Safety Rails Test
```bash
# Verify guards block wrong environments
DATABASE_URL=postgresql://localhost:5432/projectpulse_dev pnpm test:integration
# Expected: BLOCKED with clear error message

TEST_BASE_URL=https://projectpulse.dracodev.dev pnpm test:e2e
# Expected: BLOCKED with clear error message
```

---

## 10) Summary: Before vs After

| Aspect | Before (Now) | After (Plan Complete) |
|--------|--------------|----------------------|
| **First-run success** | ~20% (needs 3-4 attempts) | ≥95% (documented prerequisites) |
| **E2E flakiness** | ~30% fail rate | <5% fail rate |
| **Test isolation** | Shared state leaks | Clean slate per test |
| **Test data** | Hardcoded, incomplete | Factories + scenarios |
| **CI gating** | E2E advisory only | Smoke required, full E2E for risk |
| **Dev workflow** | Manual setup guessing | `pnpm test:stack:up && pnpm test:all` |
| **Prod safety** | Can accidentally hit prod | Hard guards prevent it |
| **Debug experience** | "Rerun until green" | Traces, screenshots, clear errors |

---

## Appendix A: Guiding Principles
- Prefer reliability over speed until stable; then optimize.
- Make prod testing an explicit, small, safe "smoke" layer — not the normal workflow.
- Keep Docker-first E2E; fix flakiness by removing timing hacks and isolating state.
- Fail fast with clear error messages when prerequisites are missing.

## Appendix B: Files to Create/Modify Summary

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `docker-compose.test.yml` | 2 | Test stack definition |
| `apps/web/lib/test-guards.ts` | 2 | Safety rails |
| `scripts/test-preflight.ts` | 2 | Prerequisites check |
| `.env.test` | 2 | Test environment |
| `apps/web/tests/helpers/db-reset.ts` | 3 | DB reset helper |
| `apps/web/tests/fixtures/factories/*.ts` | 3 | Data factories |
| `apps/web/tests/fixtures/scenarios/*.ts` | 3 | Test scenarios |
| `apps/web/prisma/seed-test.ts` | 3 | Integration seed |
| `.github/workflows/nightly-e2e.yml` | 4 | Nightly E2E |

### Modified Files
| File | Phase | Change |
|------|-------|--------|
| `apps/web/jest.setup.js` | 1 | Add localStorage reset |
| `apps/web/jest.config.js` | 1 | Move dotenv loading |
| `apps/web/prisma/seed-e2e.ts` | 1 | Fix sequence names |
| `apps/web/tests/setup/global-setup.ts` | 1 | Create .auth dir |
| `apps/web/tests/e2e/*.spec.ts` | 1 | Replace waitForTimeout |
| `apps/web/package.json` | 2-4 | Add test scripts |
| `.github/workflows/ci.yml` | 4 | Add test jobs |
