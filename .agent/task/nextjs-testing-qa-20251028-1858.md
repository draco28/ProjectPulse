# Next.js Expert Consultation — E2E Strategy (Playwright)

Date: 2025-10-28 18:58 (UTC+05:30)
Phase: Week 1.5 Phase 3 — Testing & QA
Branch: feature/phase3-testing-qa

---

## Context

- Playwright config uses `testDir: ./tests/e2e`, baseURL `http://localhost:3000`, and `webServer: pnpm dev` with reuse on non-CI.
- Existing E2E tests (dashboard, issue-detail) rely on semantic locators and stable waits.

## Recommendations

- Server vs Client: No changes required to app code; tests will exercise current RSC + client component mix through UI.
- Caching/Revalidation:
  - Wiki uses ISR; favor assertions after `networkidle` and visible content checks rather than fixed delays.
  - For dynamic pages (force-dynamic), avoid caching assumptions; assert state after UI stabilizes.
- Routing:
  - Use baseURL-relative `page.goto('/path')` for consistency with config.
  - Prefer semantic locators over CSS-heavy selectors; add `data-testid` only to stabilize flaky elements (non-visual attribute).
- Flakiness control:
  - Keep `fullyParallel: true`; but avoid stateful cross-test dependencies.
  - Use `test.describe.configure({ mode: 'serial' })` only if a suite must run sequentially due to shared state (avoid when possible).
- Mobile viewport checks: Use Playwright projects for mobile (already configured) and additional `setViewportSize` only when necessary.

## Test Data & State

- Avoid destructive mutations during E2E; where toggles are required (Agents), toggle back to restore original state.
- If a test inherently changes state (e.g., comment creation), prefer to assert idempotent behaviors and avoid strict counts.

## Outcome

Proceed with E2E tests using existing Playwright setup. Focus on semantic, visible-state assertions and stable waits. Avoid introducing test-only code paths in the app; use `data-testid` sparingly for selectors.
