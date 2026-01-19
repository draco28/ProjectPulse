# Testing Workflow Rebuild Plan (Post-MVP)

**Project**: ProjectPulse

## 0) Problem Statement
ProjectPulse has reached post-MVP scale, but the testing system is not production-grade:

- Tests are **flaky** (often require 2–3 reruns).
- Dev testing is not trusted, pushing validation to prod (high risk).
- Mixed tooling is fine (Jest + Playwright + Node `--test`), but **the workflow + isolation + reliability are missing**.

This document proposes a plan to restructure the testing workflow so that you can validate changes **safely in dev/test**, with CI acting as a reliable gate before deploy.

## 1) Current State (Facts from Repo)

### 1.1 Test Frameworks
- **apps/web**
  - Jest v29.7.0 (`apps/web/jest.config.js`)
  - Playwright v1.56.1 (`apps/web/playwright.config.ts`)
- **apps/mcp-server**
  - Node.js built-in test runner via `tsx --test` (no central config)

### 1.2 Primary Pain Points (ranked)
- **E2E flakiness (HIGH)**
  - Many `waitForTimeout(500)` anti-patterns.
- **Unit test state leakage (HIGH)**
  - Shared `localStorage` store in Jest setup.
- **Integration stability gaps (MEDIUM)**
  - Missing Prisma disconnect cleanup risk.
- **E2E auth isolation (MEDIUM)**
  - Single shared auth state file.

### 1.3 Environment Topology (Authoritative)

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

## 2) Objectives / Acceptance Criteria

### 2.1 Objectives
- Make local testing **reliable on first run**.
- Ensure dev/testing does **not depend on prod-public**, ever.
- Preserve Docker-first E2E (correct architectural choice).
- Reduce cognitive overhead: a clear, documented “how to test changes” flow.

### 2.2 Acceptance Criteria (measurable)
- **E2E stability**: run the full Playwright suite 20 times; **≥ 19/20** runs pass with **no code changes**.
- **No blind prod testing**: day-to-day feature work validated by `pnpm test:*` commands.
- **No `waitForTimeout()` in E2E** except in explicit debug-only helpers.
- **No cross-test state leakage** in Jest (localStorage and similar globals reset).
- CI provides a trustworthy signal; “green” means deploy confidence.

## 3) Target Testing Architecture

### 3.1 Keep the mixed framework approach (but make it coherent)
- **Jest** remains for unit + integration tests in `apps/web`.
- **Playwright** remains for E2E, Docker-first.
- **Node `--test`** remains for MCP server tests.

The change is NOT “switch frameworks” — it’s:
- **Isolation** (dedicated test stack)
- **Deterministic fixtures**
- **Correct waits**
- **Clear layers and commands**
- **CI gating strategy**

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

### 3.3 Environment safety rails (must-have)
Add hard guards so tests cannot accidentally hit prod:

- **Playwright guard**: refuse to run if baseURL contains `projectpulse.dracodev.dev` unless an explicit override env var is set.
- **DB guard**: refuse to run if `DATABASE_URL` points at prod/dev; additionally require test DB (`projectpulse_test`) on port `5434` for integration/e2e.
  - prod DB name (`projectpulse_prod`) or prod-local port (`5433`)
  - dev DB name (`projectpulse_dev`) or dev port (`5432`) when running integration/e2e
- **Redis guard**: similarly prevent pointing at prod-local/dev redis ports (require `6381` for integration/e2e).

## 4) Stabilization Plan by Test Layer

### 4.1 Playwright (highest ROI)

#### Immediate quick wins
- Replace `waitForTimeout()` with deterministic waits:
  - `await page.goto(url, { waitUntil: 'networkidle' })`
  - `await page.waitForLoadState('networkidle')` (when appropriate)
  - `await page.waitForURL(...)`
  - Prefer `await expect(locator).toBeVisible()` as the “page ready” signal

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

#### Trace + diagnostics (to stop “rerun until green”)
- Ensure Playwright captures:
  - trace `on-first-retry`
  - screenshot/video on failure
- Add a consistent debug command that opens trace viewer.

### 4.2 Jest Unit Tests (fix state leakage)
- Fix localStorage mocking so state resets per test:
  - Either reset the backing store in `beforeEach`.
  - Or replace with a proven localStorage mock package.
- Ensure all global mocks are deterministic and reset:
  - `jest.resetAllMocks()` / `jest.clearAllMocks()` policy
  - consistent use of fake timers where timing is tested

Also reduce brittle timing assertions:
- Replace fixed “must happen within 50ms” with deterministic clock control or looser contracts.

### 4.3 Jest Integration Tests (DB + Prisma hygiene)
- Ensure Prisma cleanup:
  - Add a global `afterAll` for `prisma.$disconnect()` where appropriate.
- Move integration tests to target the isolated test DB.
- Add deterministic database reset strategy (approved):
  - **Integration/E2E**: truncate tables + `RESTART IDENTITY` + `CASCADE` between test files/suites, then seed baseline data.
  - **Unit**: unit tests should be DB-free; if a suite must touch DB, treat it as integration by default. Transaction rollback is optional for tightly-scoped DB tests that avoid parallelism.

### 4.4 MCP Server Tests (Node `--test`)
- Keep current runner, but align environment rules:
  - MCP tests should target the same isolated test web stack.
- Add the same “no prod URL” safety checks.

### 4.5 Test data strategy (factories + script-driven seeding)
- Use Prisma/script-driven seeding (no test-only seed API routes).
- Extend existing `apps/web/prisma/seed-e2e.ts` and add `apps/web/prisma/seed-test.ts` for unit/integration baseline.
- Add factories/scenarios under `apps/web/tests/fixtures/` so tests create deterministic data.

## 5) Developer Workflow (Local Commands)
Goal: you can run these before pushing to master.

- `pnpm test` (fast): unit tests only
- `pnpm test:integration`: brings up test DB/Redis (or uses already-running test stack), migrates, runs integration suite
- `pnpm test:e2e`: brings up full test stack (web+db+redis), then Playwright
- `pnpm test:all`: runs unit → integration → e2e in the correct order

Also add explicit “stack” commands:
- `pnpm test:stack:up`
- `pnpm test:stack:down`
- `pnpm test:stack:reset`

## 6) CI / Branch Protection Strategy (approved hybrid policy)

### 6.1 Required checks for ALL PRs
- Keep current required checks (lint/typecheck/unit/integration/build)
- Add a required Playwright **smoke** suite (3–8 tests, target 3–8 minutes):
  - Health check
  - Login flow
  - Create ticket
  - Kanban move
  - Wiki page view

### 6.2 Full E2E for high-risk PRs + nightly
- Labels: `e2e-required`, `high-risk`, `breaking-change`
  - When present, run the full Playwright suite and mark it required.
- Nightly: run the full Playwright suite on `master` at 2 AM and alert on failure.
- Optional hardening: auto-apply `high-risk`/`e2e-required` labels based on changed paths (auth, Prisma/migrations, `app/api`, MCP server).

### 6.3 CI artifacts
- Upload Playwright traces/screenshots/videos on failure.
- Keep logs from docker containers (web/db/redis) on failure.

## 7) Rollout Phases (Incremental, Fast Feedback)

### Phase 0 — Baseline (0.5–1 day)
- Measure current failure rates.
- Identify top 5 flaky spec files.

### Phase 1 — Quick wins (1–2 days)
- Remove `waitForTimeout()` patterns from the worst offenders.
- Fix Jest localStorage isolation.
- Add Prisma disconnect hygiene.

### Phase 2 — Isolated test stack (2–3 days)
- Add `docker-compose.test.yml` + env guards.
- Update Playwright baseURL selection to point at test stack.

### Phase 3 — Deterministic data + fixtures (2–5 days)
- Add seed + reset workflow.
- Introduce factories/fixtures used consistently.

### Phase 4 — CI gating upgrade (1–2 days)
- Add required E2E smoke.
- Add label-based full E2E + nightly full runs.

### Phase 5 — Prod-local smoke (optional, 1 day)
- Add explicit `smoke:prod-local` that targets `http://localhost:8080`.
- This is never for day-to-day development; it’s for release confidence.

## 8) Decisions (Approved)
- **E2E gating**: Hybrid (smoke required for all PRs; full suite required for PRs labeled `e2e-required`, `high-risk`, `breaking-change`; nightly full run on `master`).
- **Test ports**: `3100/3101/5434/6381`.
- **DB reset**: Truncate tables for integration/E2E; unit tests should be DB-free; transaction rollback is allowed only for tightly scoped DB tests that avoid parallelism.
- **Seeding**: Prisma/script-driven seeding + factories (no test-only seed API route).

---

## Appendix: Guiding Principles
- Prefer reliability over speed until stable; then optimize.
- Make prod testing an explicit, small, safe “smoke” layer — not the normal workflow.
- Keep Docker-first E2E; fix flakiness by removing timing hacks and isolating state.
