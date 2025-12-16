# Sprint 8 Day 5 - E2E Test Fix Plan

**Date**: 2025-11-16
**Story Points**: TBD (focus on pass rate improvement)
**Current Pass Rate**: 57.5% (474/825 tests)
**Target Pass Rate**: >90% (743+ tests)
**Gap**: +269 tests needed

---

## 🎯 Primary Objective

Fix E2E test failures to achieve >90% pass rate by addressing:
1. **Database seeding issues** - Empty test data
2. **Issue navigation blocking** - 95 tests blocked
3. **Dashboard missing UI** - 70 tests failing
4. **Dashboard functionality** - 15 tests failing
5. **P1 features** - Agent personas, Security page

---

## 📊 Impact Analysis

| Phase | Tasks | Tests Fixed | New Pass Rate | Cumulative |
|-------|-------|-------------|---------------|------------|
| **Baseline** | - | 474 (57.5%) | 57.5% | - |
| **A: Database** | 1 | +30 | 61.1% | +30 |
| **B: Issue Nav** | 1 | +95 | 72.6% | +125 |
| **C: Dashboard UI** | 11 | +70 | 81.1% | +195 |
| **D: Dashboard Func** | 3 | +15 | 82.9% | +210 |
| **E: Agents** | 2 | +15 | 84.7% | +225 |
| **F: Security** | 4 | +20 | 87.1% | +245 |
| **90% Target** | - | 743+ | >90% | +269 |

To reach 90%, we must complete **Phases A through E**.

---

## 🔴 Phase 1: P0 Blockers (Must Complete)

### Session 1 (2-3 hours) - Database + Navigation + Quick Wins

**A. Database Foundation** ⚡ START HERE (2 min)
- [ ] A1: Create and run `seed-e2e.ts` script
  - 40 issues (12 open, 28 closed)
  - 47 knowledge items
  - 3 security findings
  - 3 agent personas
  - Impact: Fixes stat card numbers, missing data across all tests

**B. Issue Navigation** 🚨 HIGHEST IMPACT (30-60 min)
- [ ] B1: Fix issue card click timeout
  - File: `apps/web/components/issues/IssueListCard.tsx`
  - File: `apps/web/app/issues/page.tsx`
  - Impact: Unlocks 95 blocked tests (11.5% of failures)
  - Verify: `pnpm test:e2e -- tests/e2e/issue-detail.spec.ts --project=chromium`

**C. Dashboard Quick Wins** 💎 (37 min total)
- [ ] C1: Fix welcome banner test timing (10 min)
  - Add `await page.waitForTimeout(100)` for hydration
  - File: `apps/web/tests/e2e/dashboard.spec.ts:28-35`
- [ ] C2: Verify stat cards after seeding (15 min)
  - Should show: 47, 28, 12, 3 after database seed
  - File: `apps/web/app/dashboard/page.tsx`
- [ ] C4: Fix search placeholder text (2 min)
  - Change to: "Search issues, knowledge, wiki..."
  - File: `apps/web/components/Header.tsx:~98`
- [ ] C7: Apply neu-float class to cards (10 min)
  - Add `neu-float` to dashboard cards
  - File: `apps/web/components/dashboard/IssueCard.tsx`

### Session 2 (2-3 hours) - Dashboard UI Completion

**C. Dashboard UI Components** (100 min total)
- [ ] C3: Fix Quick Actions visibility (20 min)
  - Check CSS hiding buttons
  - File: `apps/web/components/dashboard/QuickActionsWidget.tsx`
- [ ] C5: Fix notification indicator visibility (15 min)
  - Remove `visibility: hidden` or responsive hide
  - File: `apps/web/components/Header.tsx`
- [ ] C6: Add pulse indicators to active issues (30 min)
  - Add `.pulse-indicator` and `.pulse-dot` classes
  - File: Issue card components
- [ ] C8: Add agent status indicators (20 min)
  - Add "Idle", "Offline" status text
  - File: `apps/web/components/dashboard/AgentPersonasWidget.tsx`
- [ ] C9: Add user profile online status (15 min)
  - Add element with `title="Online"`
  - File: `apps/web/components/Sidebar.tsx`

### Session 3 (2-3 hours) - Dashboard Functionality + P1

**D. Dashboard Functionality** (60 min total)
- [ ] C10: Add theme switcher to sidebar (45 min)
  - Add theme buttons (Desert Stone, Neon Vibes, Earthy, Dark Neumorphic Coral)
  - File: `apps/web/components/Sidebar.tsx`
- [ ] C11: Fix mobile responsive banner (15 min)
  - Fix CSS for 390×844 viewport
  - File: `apps/web/components/dashboard/WelcomeBanner.tsx`
- [ ] D1: Standardize active link class (10 min)
  - Choose: `coral-gradient` OR `bg-accent-primary/20`
  - File: `apps/web/components/Sidebar.tsx`
- [ ] D2: Fix theme toggle clickability (20 min)
  - Debug 30s timeout issue
  - Related to C10
- [ ] D3: Fix theme switching logic (30 min)
  - Theme context + localStorage
  - Depends on D2

**E. Agent Personas P1** (40 min total)
- [ ] E1: Fix duplicate heading (10 min)
  - Remove duplicate "Agent Personas" heading
  - File: Agents page
- [ ] E2: Fix toggle switch timeout (30 min)
  - Debug 30s click timeout
  - File: Agent persona component

---

## ⚠️ Phase 2: P1 Important (If Time Permits)

**F. Security Page** (2-3 hours)
- [ ] F1: Security score meter UI
- [ ] F2: Vulnerability list rendering
- [ ] F3: Severity filter implementation
- [ ] F4: Status filter URL routing

---

## 🟡 Phase 3: P2 Minor (Deferred to Day 6+)

- Wiki performance tests (2 tests)
- Knowledge base accessibility (3 tests)

---

## 🔍 Root Causes Summary

1. **Missing UI Components** (60%) - Dashboard widgets not rendered
2. **Data Seeding** (20%) - Database empty or wrong counts
3. **Timeout Issues** (15%) - Elements not clickable within 30s
4. **Selector Mismatches** (5%) - Wrong CSS classes or selectors

---

## 📁 Key Files Reference

### Dashboard
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/dashboard/WelcomeBanner.tsx`
- `apps/web/components/dashboard/QuickActionsWidget.tsx`
- `apps/web/components/dashboard/IssueCard.tsx`
- `apps/web/components/dashboard/AgentPersonasWidget.tsx`

### Navigation
- `apps/web/components/Header.tsx`
- `apps/web/components/Sidebar.tsx`

### Issues
- `apps/web/app/issues/page.tsx`
- `apps/web/components/issues/IssueListCard.tsx`

### Tests
- `apps/web/tests/e2e/dashboard.spec.ts`
- `apps/web/tests/e2e/issue-detail.spec.ts`
- `apps/web/tests/e2e/agents.spec.ts`
- `apps/web/tests/e2e/security.spec.ts`

### Database
- `apps/web/prisma/seed-e2e.ts` (to create)
- `apps/web/prisma/schema.prisma`

---

## ✅ Success Criteria

**Minimum Viable (90% target):**
- [ ] Pass rate >90% (743+ tests passing)
- [ ] Database seeded with E2E test data
- [ ] Issue navigation working (95 tests unlocked)
- [ ] Dashboard UI complete (70 tests fixed)
- [ ] TypeScript: 0 errors

**Stretch Goals:**
- [ ] Agent personas fixed (+15 tests)
- [ ] Pass rate >85% (701+ tests)

---

## 📝 Execution Strategy

1. **Highest Impact First** - Database seed fixes multiple test categories
2. **Unblock Dependencies** - Issue navigation blocks 95 tests
3. **Quick Wins** - Low-hanging fruit (placeholders, CSS classes)
4. **Systematic UI** - Dashboard components one by one
5. **Test After Each Phase** - Verify improvements incrementally

---

**Created**: 2025-11-16
**Based On**: `.agent/task/sprint8-day5-baseline-report.md`
**Master Plan**: `.agent/task/current-plan.md` (unchanged)
