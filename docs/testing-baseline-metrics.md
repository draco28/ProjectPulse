# Testing Baseline Metrics

**Date**: 2026-01-20 (completed)
**Ticket**: #152 - Phase 0: Measure baseline test failure rates
**Branch**: `feature/ticket-152-baseline-metrics`
**Full Test Run Completed**: 2026-01-20 00:41 (40.5 minutes)

---

## Executive Summary

This document establishes baseline metrics for ProjectPulse's testing infrastructure before implementing the Testing Workflow Rebuild Plan. Key findings:

- **E2E pass rate is 19.6%** (80 passed / 328 failed) - far below the 95% target
- **Test infrastructure has 3 blocking issues** preventing reliable first-run execution
- **Top flaky files identified** via `waitForTimeout()` pattern analysis (106 calls total)
- **Severe test/implementation drift** - ~200 tests fail due to outdated UI selectors
- **Primary issue is NOT flakiness** - it's tests written for an older UI version

---

## Test Inventory

| Category | Count | Notes |
|----------|-------|-------|
| E2E spec files | 30 | `apps/web/tests/e2e/*.spec.ts` |
| Test cases | 536 | Across all spec files |
| Browser targets | 5 | Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari |
| **Total test runs per suite** | ~2,680 | 536 × 5 browsers |
| Lines of E2E code | 10,130 | |

---

## Fresh Clone Failure Chain

These issues prevent first-run success. Each must be resolved for tests to run.

### Issue 1: Module Resolution (FIXED)

```
Error: ERR_PACKAGE_PATH_NOT_EXPORTED
Package @projectpulse/infra-config only exports ESM, not CJS
```

| Aspect | Detail |
|--------|--------|
| **Root Cause** | `package.json` exports field only had `import` condition, missing `require` |
| **Impact** | Playwright (CJS) couldn't load config |
| **Fix Applied** | Added `tsup` for dual ESM/CJS build, updated exports |
| **Files Modified** | `packages/infra-config/package.json`, `packages/infra-config/tsup.config.ts` |

### Issue 2: DATABASE_URL Not Set (DOCUMENTED)

```
error: Environment variable not found: DATABASE_URL
```

| Aspect | Detail |
|--------|--------|
| **Root Cause** | Scripts run outside Docker without env vars |
| **Impact** | `pnpm db:seed` fails without explicit DATABASE_URL |
| **Workaround** | `DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" pnpm db:seed` |
| **Recommended Fix** | Add `.env.test` file or update scripts to load env |

### Issue 3: Test User Password Mismatch (FIXED BY RE-SEED)

```
❌ Login failed! Current URL: http://localhost:3000/login
```

| Aspect | Detail |
|--------|--------|
| **Root Cause** | Test user `dev@projectpulse.local` password hash may not match expected `dev123456` |
| **Impact** | Global setup fails, all tests blocked |
| **Fix Applied** | Re-ran `pnpm db:seed` with correct DATABASE_URL |

---

## Top 5 Flaky Files (by `waitForTimeout()` Count)

Static analysis of `waitForTimeout()` calls - a known anti-pattern causing flakiness:

| Rank | File | Count | Pattern Analysis |
|------|------|-------|------------------|
| 1 | `tickets-filters.spec.ts` | 24 | All `waitForTimeout(500)` after `page.goto()` |
| 2 | `knowledge.spec.ts` | 17 | Mix of 300ms and 500ms waits |
| 3 | `agents.spec.ts` | 15 | After page loads and filter changes |
| 4 | `wiki.spec.ts` | 11 | After content changes |
| 5 | `roadmap.spec.ts` | 11 | After navigation |
| - | `dashboard.spec.ts` | 8 | After data loads |
| - | `project-isolation.spec.ts` | 7 | Between project switches |

**Total `waitForTimeout()` calls**: 106 across all E2E files

### Recommended Fix Pattern

```typescript
// BEFORE (flaky):
await page.goto('/tickets?project=2&kind=feature');
await page.waitForTimeout(500);

// AFTER (deterministic):
await page.goto('/tickets?project=2&kind=feature');
await page.waitForLoadState('networkidle');
// OR: await expect(page.locator('[data-testid="ticket-card"]')).toBeVisible();
```

---

## Baseline Pass Rate

### Run 1: health.spec.ts (Chromium Only)

| Metric | Value |
|--------|-------|
| Passed | 6 |
| Failed | 44 |
| Total | 50 |
| **Pass Rate** | 12% |
| Duration | 3.9 minutes |

**Failure Categories**:
- Missing UI elements (data-testid not found): ~30 tests
- Data expectations (count = 0 when > 0 expected): ~10 tests
- Timing issues (load > 5 seconds): ~4 tests

### Run 2: Full Chromium Suite

| Metric | Value |
|--------|-------|
| Passed | 80 |
| Failed | 328 |
| Skipped | 29 |
| Errors (outside tests) | 12 |
| Total | 463 |
| **Pass Rate** | **19.6%** |
| Duration | 40.5 minutes |

**Failure Categories** (based on error analysis):
- **Missing UI elements** (data-testid, role selectors not found): ~200 tests
  - Tests expect UI elements that have been renamed, removed, or restructured
  - Example: `[data-testid="agent-card"]` not found, `getByRole('tab')` not visible
- **Timing/Network issues** (timeouts, net::ERR_ABORTED): ~80 tests
  - Page navigation timeouts
  - `waitForLoadState('networkidle')` exceeding 30s timeout
- **Data expectations** (wrong counts, missing content): ~30 tests
  - Expected data not present in test database
  - Count mismatches (expected > 0, got 0)
- **Test setup failures** (beforeEach hooks): ~18 tests
  - Login failures in hooks propagating to all tests in describe block

**Key Finding**: The majority of failures are **test/implementation drift**, not flakiness. Tests were written for a previous version of the UI and haven't been updated.

---

## Baseline Metrics Summary

| Metric | Current | Target (Post-Rebuild) |
|--------|---------|----------------------|
| E2E pass rate (Chromium) | **19.6%** (80/408) | ≥95% |
| First-run success | ~0% (3 blockers) | 100% |
| Top flaky files | 5 identified | All fixed |
| `waitForTimeout()` calls | 106 | 0 (except debug helpers) |
| Test/implementation drift | **Severe** (~200 tests) | 0 |

---

## Recommendations for Phase 1

### Priority 1: Fix Test/Implementation Drift (Highest Impact)
The baseline run revealed that **~200 tests fail due to outdated selectors**, not flakiness. Before addressing timing issues, tests need to be updated to match the current UI.

1. **Audit and update UI selectors** in failing tests
   - Update `data-testid` attributes to match current implementation
   - Update `getByRole()` selectors for changed component structure
   - Remove tests for deprecated/removed features

2. **Establish selector conventions** going forward
   - Define standard `data-testid` naming patterns
   - Document which selectors to use for common patterns

### Priority 2: Infrastructure Improvements
3. **Create `.env.test` file** with test database URL
4. **Add preflight validation script** to check all prerequisites
5. **Create isolated test Docker stack** (`docker-compose.test.yml`)

### Priority 3: Fix Flakiness Patterns
6. **Fix `waitForTimeout()` in top 5 files** (after drift is fixed)
   - Replace with `waitForLoadState('networkidle')` or explicit element waits
   - Target: 0 `waitForTimeout()` calls except in debug helpers

---

## Appendix: Test File Analysis

### Files with No `waitForTimeout()` (Good Examples)

```bash
# These files may have better patterns to copy:
grep -L "waitForTimeout" tests/e2e/*.spec.ts
```

### Full `waitForTimeout()` Distribution

```
tests/e2e/tickets-filters.spec.ts:24
tests/e2e/knowledge.spec.ts:17
tests/e2e/agents.spec.ts:15
tests/e2e/wiki.spec.ts:11
tests/e2e/roadmap.spec.ts:11
tests/e2e/dashboard.spec.ts:8
tests/e2e/project-isolation.spec.ts:7
tests/e2e/tickets-mutations.spec.ts:5
tests/e2e/health.spec.ts:5
tests/e2e/tickets-list.spec.ts:3
tests/e2e/navigation-history.spec.ts:2
tests/e2e/session-ticket-integration.spec.ts:1
tests/e2e/tickets-create.spec.ts:1
```
