# Sprint 8 Day 6 Plan: MVP Completion Focus

**Created**: 2025-11-16
**Status**: Ready to Execute
**Estimated Time**: 6-7 hours
**Story Points**: 8-10 points

---

## Context

**Day 5 Results**:
- ✅ Fixed critical bugs (hydration error, status standardization)
- ✅ Chromium-only test results: 54.4% pass rate (80/147 tests)
- ✅ Issue detail pages working correctly
- ✅ Core functionality verified

**Key Insight**:
Many test failures are for **unimplemented or post-MVP features**:
- Health dashboard (not implemented)
- Security page (not implemented)
- Theme switcher (post-MVP)
- Notification system (post-MVP)
- Knowledge base (incomplete)
- Cross-browser compatibility (deferred)

**Decision**: Stop chasing test failures for unimplemented features. Focus on **completing MVP features** that will unlock more tests.

---

## Day 6 Objectives (8-10 points)

### Phase 1: Complete Missing MVP Features (6 points, 4-5 hours)

#### 1. Implement Theme Switcher in Sidebar (2 points, 1.5 hours)

**Current State**: Dashboard tests expect theme switcher in sidebar, but it doesn't exist

**Tasks**:
- [ ] Create `ThemeSwitcher.tsx` component with 4 theme buttons
- [ ] Add theme context/state management (if not exists)
- [ ] Integrate into Sidebar component
- [ ] Wire up theme toggle functionality
- [ ] Test theme switching works in browser

**Files to Modify**:
- `apps/web/components/Sidebar.tsx` (add theme switcher section)
- `apps/web/components/ThemeSwitcher.tsx` (create new component)
- `apps/web/contexts/ThemeContext.tsx` (if needed)

**Expected Impact**:
- Fixes ~8-10 failing dashboard tests
- Unlocks theme switching functionality

**Success Criteria**:
- ✅ Theme buttons visible in sidebar
- ✅ Clicking theme button changes theme
- ✅ E2E tests "should display theme switcher in sidebar" passes
- ✅ E2E test "should switch between all 4 themes" passes

---

#### 2. Implement Notification Indicator (1 point, 45 min)

**Current State**: Tests expect notification button in header, but visibility is "hidden"

**Tasks**:
- [ ] Check if notification button exists in Header
- [ ] Fix visibility state (remove hidden class)
- [ ] Add notification count badge (if needed)
- [ ] Test notification indicator displays

**Files to Modify**:
- `apps/web/components/Header.tsx` (fix visibility)

**Expected Impact**:
- Fixes ~3-5 failing dashboard tests

**Success Criteria**:
- ✅ Notification button visible in header
- ✅ E2E test "should display notification indicator" passes

---

#### 3. Fix Agent Toggle Switch (1 point, 45 min)

**Current State**: Agent persona toggle switches timeout (30s) when trying to click

**Tasks**:
- [ ] Investigate why toggle switch not clickable
- [ ] Add proper click event handlers
- [ ] Fix button disabled state (if applicable)
- [ ] Test toggle switches work in browser

**Files to Modify**:
- `apps/web/app/agents/page.tsx` (or agent card component)
- Agent persona toggle component

**Expected Impact**:
- Fixes ~3-5 failing agent tests

**Success Criteria**:
- ✅ Toggle switches clickable (no 30s timeout)
- ✅ E2E test "should toggle agent status with optimistic UI" passes
- ✅ E2E test "should persist agent state across page reloads" passes

---

#### 4. Fix Dashboard Active Link State (1 point, 30 min)

**Current State**: Tests expect `bg-accent-primary/20` class for active link, but code uses `coral-gradient text-white`

**Tasks**:
- [ ] Decide on standard active state class
- [ ] Update Sidebar active link class
- [ ] Update E2E test selector (or component code)
- [ ] Test navigation active state works

**Files to Modify**:
- `apps/web/components/Sidebar.tsx` (active link class)
- OR `apps/web/tests/e2e/dashboard.spec.ts` (update selector)

**Expected Impact**:
- Fixes ~2-3 failing navigation tests

**Success Criteria**:
- ✅ Active link visually distinct
- ✅ E2E test "should navigate through sidebar menu" passes

---

#### 5. Optional: Quick Actions Widget Visibility (1 point, 30 min)

**Current State**: Tests expect Quick Actions buttons (Create Issue, Add Knowledge, Run Agent) but they're not found

**Tasks**:
- [ ] Check if Quick Actions widget exists
- [ ] Fix visibility or rendering issue
- [ ] Test buttons display correctly

**Files to Modify**:
- Dashboard page or Quick Actions component

**Expected Impact**:
- Fixes ~3-5 failing dashboard tests

**Success Criteria**:
- ✅ Quick Actions buttons visible
- ✅ E2E test "should display widgets in sidebar" passes

---

### Phase 2: Documentation Updates (2 points, 1.5 hours)

#### 6. Update Sprint 8 Progress (0.5 points, 20 min)

**Tasks**:
- [ ] Update `.agent/progress.md` with Day 5 completion
- [ ] Update `.agent/active-context.md` with current state
- [ ] Document Day 5 decision (Chromium-only MVP testing)
- [ ] Document known limitations for post-MVP

**Files to Update**:
- `.agent/progress.md` (add Day 5 milestone)
- `.agent/active-context.md` (update current focus)

---

#### 7. Update Day 6 Session Doc (0.5 points, 20 min)

**Tasks**:
- [ ] Create `.agent/task/current-session-20251116-day6.md`
- [ ] Document Day 6 plan and progress
- [ ] Update session file at checkpoints

**Files to Create**:
- `.agent/task/current-session-20251116-day6.md`

---

#### 8. Create Day 5 Completion Summary (1 point, 45 min)

**Tasks**:
- [ ] Document Day 5 achievements:
  - Hydration error fix (`.next` cache cleanup)
  - Status standardization (11 files, `'in-progress'` format)
  - Chromium-only testing strategy
- [ ] Document testing results (80/147 passing, 54.4%)
- [ ] Document known limitations:
  - Health dashboard not implemented
  - Security page not implemented
  - Knowledge base incomplete
  - Theme switcher deferred (completing on Day 6)
  - Cross-browser compatibility deferred
- [ ] Archive to `docs/archive/completions/sprint8-day5-completion.md`

**Files to Create**:
- `docs/archive/completions/sprint8-day5-completion.md`

---

### Phase 3: Git Commit & Cleanup (1 point, 30 min)

#### 9. Commit Day 5 Fixes (0.5 points, 15 min)

**Tasks**:
- [ ] Stage status standardization changes (11 files):
  - `types/issue.ts`
  - `components/issues/IssueListCard.tsx`
  - `components/issues/detail/IssueActions.tsx`
  - `components/issues/detail/IssueHeader.tsx`
  - `components/issues/detail/RelatedIssues.tsx`
  - `app/issues/page.tsx`
  - `app/issues/[id]/page.tsx`
  - `prisma/seed.ts`
  - `types/filters.ts`
  - `components/issues/__tests__/FilterSidebar.test.tsx`
  - Session documentation
- [ ] Commit with message: `fix(issues): Standardize status values to 'in-progress' format`
- [ ] Push to feature/sprint-8 branch

---

#### 10. Commit Day 6 Features (0.5 points, 15 min)

**Tasks**:
- [ ] Stage Day 6 feature additions:
  - Theme switcher component
  - Notification indicator fix
  - Agent toggle fix
  - Active link state fix
- [ ] Commit with message: `feat(ui): Complete missing MVP dashboard features`
- [ ] Push to feature/sprint-8 branch

---

## Success Criteria

### Must Complete:
- ✅ Theme switcher functional (tests passing)
- ✅ Notification indicator visible (tests passing)
- ✅ Agent toggles clickable (tests passing)
- ✅ Active link state fixed (tests passing)
- ✅ Documentation updated (progress.md, active-context.md)
- ✅ Day 5 completion summary created
- ✅ All changes committed and pushed

### Optional (If Time):
- Quick Actions widget visibility
- Run Chromium-only tests again (expect ~65-70% pass rate)

---

## Expected Outcomes

### Test Impact:
- **Current**: 80/147 Chromium tests passing (54.4%)
- **Expected after Day 6**: ~100/147 passing (~68%)
- **Improvement**: +20 tests fixed (+14% pass rate)

### MVP Readiness:
- ✅ Core dashboard features complete
- ✅ Agent persona page functional
- ✅ Known limitations documented
- ✅ Ready for Days 7-10 (final polish + documentation)

---

## Estimated Time Breakdown

| Phase | Tasks | Time |
|-------|-------|------|
| **Phase 1: Features** | Tasks 1-5 | 4-5 hours |
| Theme Switcher | Task 1 | 1.5 hours |
| Notification Indicator | Task 2 | 45 min |
| Agent Toggle Fix | Task 3 | 45 min |
| Active Link State | Task 4 | 30 min |
| Quick Actions (Optional) | Task 5 | 30 min |
| **Phase 2: Docs** | Tasks 6-8 | 1.5 hours |
| Progress Updates | Tasks 6-7 | 40 min |
| Day 5 Completion Summary | Task 8 | 45 min |
| **Phase 3: Git** | Tasks 9-10 | 30 min |
| **Total** | 10 tasks | **6-7 hours** |

---

## Next Steps After Day 6

**Days 7-8**:
- Final bug fixes
- Performance optimization
- Run full Chromium test suite (target >70% pass rate)

**Days 9-10**:
- Documentation completion (OpenAPI spec, user guides)
- MVP acceptance validation
- Sprint 8 sign-off

---

## Notes

**Strategic Decision**: Day 5 revealed that many test failures are for features not in MVP scope. Day 6 focuses on **completing the missing MVP features** that will unlock test passes, rather than chasing failures for unimplemented features.

**Chromium-Only Testing**: Accepted for MVP. Cross-browser compatibility deferred to post-MVP.

**Known Limitations for Post-MVP**:
- Health dashboard (100% failing - not implemented)
- Security page (100% failing - not implemented)
- Knowledge base (partial - needs completion)
- Theme switcher (completing on Day 6)
- Notification system (partial - fixing on Day 6)
- Cross-browser compatibility (deferred)

---

**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Status**: Ready to Execute
