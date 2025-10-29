# Implementation Plan — Phase 3 Testing & QA

**Created**: 2025-10-29 14:45
**Branch**: feature/phase3-testing-qa
**Status**: APPROVED ✅
**Duration**: ~4–5 hours

---

## Overview

Add comprehensive automated tests and quality verification for the five newly implemented pages (Knowledge, Wiki, Security, Agents) and supporting component (Command Palette). Use Playwright for E2E flows covering critical user paths and Jest + React Testing Library (RTL) for component behavior testing. Ensure pixel/behavior parity with Coral mockups and pass all quality gates.

---

## Deliverables

- `apps/web/tests/e2e/knowledge.spec.ts`
- `apps/web/tests/e2e/wiki.spec.ts`
- `apps/web/tests/e2e/security.spec.ts`
- `apps/web/tests/e2e/agents.spec.ts`
- `apps/web/components/__tests__/CommandPalette.test.tsx`
- `COMPLETION_PHASE3_TESTING_QA.md` (root)

---

## Implementation Steps

### Step 0: Pre-Implementation Checks ✅

#### 0.1: Verify Development Environment

- [ ] Run `pnpm dev` and confirm server starts on port 3000
  - ✅ MUST show: "ready started server on 0.0.0.0:3000"
  - ❌ WRONG: "ready started server on 0.0.0.0:3002"
  - If wrong port: Follow [.agent/sops/port-troubleshooting.md](.agent/sops/port-troubleshooting.md)
- [ ] Verify localhost:3000 loads application successfully
- [ ] Test that all 5 pages are accessible and render without errors

#### 0.2: Git Branch Confirmation

- [ ] Run `git branch` to verify current branch
- [ ] ✅ REQUIRED: Must be on `feature/phase3-testing-qa` (NOT master)
- [ ] If on master:
  ```bash
  git checkout master && git pull origin master
  git checkout feature/phase3-testing-qa
  ```
- [ ] **Confirm branch switch**: Run `git branch` again and verify active branch
- [ ] Output confirmation: "✅ On branch: feature/phase3-testing-qa"

### Step 1: E2E Test Scaffolding

- [ ] Verify Playwright config at `apps/web/playwright.config.ts`:
  - testDir: `./tests/e2e`
  - baseURL: `http://localhost:3000`
  - webServer: `pnpm dev`
- [ ] Review existing E2E pattern from `apps/web/tests/e2e/dashboard.spec.ts`:
  - Semantic locators preferred (text, role, accessible labels)
  - Add `data-testid` only when CSS/text locators are brittle
  - Use `waitForLoadState('networkidle')` for page stability
  - Use `toBeVisible()` for element assertions

### Steps 2-6: Create Test Files

_[Detailed test specifications follow in sections below]_

### Step 7: Pixel/Behavior Verification

**Manual Verification Against Coral Mockups:**

_[Detailed verification checklist follows below]_

### Step 8: Manual Testing Checklist

**End-to-End User Flows:**

_[Detailed user flows follow below]_

### Step 9: Quality Gates & Documentation

#### 9.1: Run Quality Checks

- [ ] `pnpm type-check` → Must pass with 0 errors
- [ ] `pnpm lint` → Must pass with 0 errors (auto-fix if possible)
- [ ] `pnpm test` → All Jest unit tests pass
- [ ] `pnpm test:e2e` → All Playwright E2E tests pass
- [ ] `pnpm build` → Production build succeeds

#### 9.2: Create Completion Documentation

- [ ] Create `COMPLETION_PHASE3_TESTING_QA.md` using completion template
  - Document: All tests created, coverage achieved, quality gate results
  - Include: Test file paths, critical paths covered, manual testing results
  - Note: Any flaky tests or areas needing improvement

#### 9.3: Update Project Documentation

- [ ] Update `STATUS.md`:
  - Move "Phase 3 Testing & QA" to "Last Completed" section
  - Update "Current Phase" to next phase (if applicable)
  - Update completion timestamp

- [ ] Update `docs/DEVELOPMENT_PLAN.md`:
  - Mark Phase 3 Testing & QA with ✅
  - Update "CURRENT STATUS" header section

#### 9.4: System Documentation Update ✅ (NEW)

- [ ] Invoke `map-system` sub-agent to update system docs
  - Updates `.agent/system/testing-patterns.md` (if new patterns introduced)
  - Updates `.agent/system/component-patterns.md` (if test utilities created)
  - Save report to `.agent/task/map-system-phase3-[timestamp].md`
  - Read report and verify accuracy

#### 9.5: Git Commits (Two-Stage Commit)

**Documentation Commit (FIRST):**

```bash
git add .agent/ STATUS.md docs/DEVELOPMENT_PLAN.md COMPLETION_PHASE3_TESTING_QA.md
git commit -m "$(cat <<'EOF'
docs: complete Phase 3 Testing & QA documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Code Commit (SECOND):**

```bash
git add apps/web/tests/e2e/ apps/web/components/__tests__/CommandPalette.test.tsx
git commit -m "$(cat <<'EOF'
test: add comprehensive E2E and unit tests for Phase 3 pages

- E2E tests for Knowledge, Wiki, Security, Agents pages
- Unit tests for CommandPalette component
- 80% coverage of 13 critical user paths
- All quality gates passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Step 3: Expert Consultation ✅ (WAIVED)

**Status:** WAIVED for Phase 3

**Rationale:**
This phase involves testing existing features that have already been implemented and reviewed. No new architecture, component patterns, or database schemas are being introduced. Testing patterns follow established conventions from existing test files.

**Approach:**
Follow existing test patterns from:

- **E2E Pattern:** `apps/web/tests/e2e/dashboard.spec.ts` (Playwright best practices)
  - Semantic locators (text, role, accessible queries)
  - `waitForLoadState('networkidle')` for stability
  - `toBeVisible()` assertions for reliability
  - Test organization with `test.describe()` blocks

- **Unit Pattern:** `apps/web/components/wiki/__tests__/CodeBlock.test.tsx` (Jest/RTL best practices)
  - React Testing Library queries (`screen`, `getByText`, `getByRole`)
  - `@testing-library/user-event` for interactions
  - Mock setup in `jest.setup.js`
  - Component prop testing and edge cases

**✅ STEP 3 WAIVED: Expert consultation not required for testing phase. Following established test patterns from dashboard.spec.ts (E2E) and CodeBlock.test.tsx (unit tests).**

---

## Coverage Target: 80% of Critical User Paths ✅ (CLARIFIED)

### Critical Paths to Test (13 total)

**Knowledge Page (3 paths):**

1. Search functionality (enter query → see filtered results)
2. Tag filter (select tag → see filtered articles)
3. Category filter (select category → see filtered articles)

**Wiki Page (3 paths):** 4. TOC intersection highlighting (scroll → TOC updates) 5. Related links navigation (click link → navigate to related page) 6. ISR rendering (page loads → markdown renders correctly)

**Security Page (2 paths):** 7. Score meter animation (page loads → meter animates to score) 8. Severity filter (select severity → see filtered vulnerabilities)

**Agents Page (2 paths):** 9. Toggle active state (click toggle → optimistic UI → persist) 10. Optimistic UI rollback (API fails → state reverts)

**CommandPalette (3 paths):** 11. Open via Cmd+K/Ctrl+K (keypress → palette opens) 12. Search filter (type query → see debounced results) 13. Keyboard navigation (ArrowUp/Down → Enter → navigate)

**Success Criteria:** ≥11/13 critical paths have automated E2E or unit tests (84% coverage target achieved)

---

## Test Data & Stability

**Assumptions:**

- Seeded data exists for:
  - `KnowledgeItem` (articles, tags, categories)
  - `WikiPage` (pages, TOC data, related links)
  - `SecurityFinding` (vulnerabilities, severity levels, statuses)
  - `AgentPersona` (agents, expertise, active states)

**Stability Best Practices:**

- Prefer robust waits: `toBeVisible()`, `waitForLoadState('networkidle')`
- Avoid fixed timeouts unless absolutely necessary (animations only)
- Use state assertions over timing assumptions
- Add `data-testid` attributes only when CSS/text locators are brittle
- Test real-time features by awaiting network/state changes

---

## Token Checkpoints

- **15K tokens:** Knowledge + Wiki E2E skeletons pass basic assertions
- **30K tokens:** Security + Agents E2E stable; Command Palette unit tests green
- **45K tokens:** Pixel/behavior verification complete; quality gates green
- **60K tokens:** Documentation complete, ready for final commit

---

## Success Criteria

### Automated Testing

- [ ] All 5 test files created and passing reliably (non-flaky)
- [ ] ≥11/13 critical user paths covered by automated tests (84%+)
- [ ] Tests follow established patterns from existing test files
- [ ] Edge cases and error states tested appropriately

### Quality Gates

- [ ] `pnpm type-check` passes with 0 errors
- [ ] `pnpm lint` passes with 0 errors
- [ ] `pnpm test` (Jest) passes all unit tests
- [ ] `pnpm test:e2e` (Playwright) passes all E2E tests
- [ ] `pnpm build` succeeds without errors

### Pixel/Behavior Verification ✅ (DETAILED)

- [ ] All 5 pages match Coral mockups visually
- [ ] Neumorphic styling applied consistently
- [ ] Hover/focus states work as designed
- [ ] Responsive layouts verified at 3+ breakpoints

### Manual Testing ✅ (DETAILED)

- [ ] All 5 end-to-end user flows tested manually and working
- [ ] Browser compatibility verified (Chrome, Firefox minimum)
- [ ] Mobile responsiveness verified

### Documentation

- [ ] `COMPLETION_PHASE3_TESTING_QA.md` created with full details
- [ ] `STATUS.md` and `DEVELOPMENT_PLAN.md` updated
- [ ] System documentation updated via `map-system` sub-agent ✅ (NEW)
- [ ] Documentation committed BEFORE code commit

---

**Plan Status:** APPROVED ✅
**Estimated Duration:** 4-5 hours
**Token Budget:** 60K tokens (30% of limit)

---

## 5 Key Improvements Incorporated

✅ **1. Step 3 Justification:** Explicit waiver with rationale (testing-only phase, no new architecture)
✅ **2. Step 5 Complete:** Added Step 9.4 - map-system sub-agent invocation requirement
✅ **3. Coverage Defined:** 13 critical paths listed explicitly, 80% = ≥11 paths (84%)
✅ **4. Verification Detailed:** Added detailed pixel + manual testing checklists (see full plan for specifics)
✅ **5. Branch Enforced:** Explicit Step 0.2 git checkout with verification required
