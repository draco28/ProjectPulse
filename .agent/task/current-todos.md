# Sprint 8.5 Phase 1: Development Cycle UI + Materialization - Todos

**Created**: 2025-11-17
**Story Points**: 9 points
**Status**: 0/11 complete (0%)
**Estimated Time**: 2.5 days (~20 hours)

---

## Part A: Roadmap Materialization (1 point, 3-4 hours)

### ⏳ Task 1: Database Schema Migration

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 1 hour

**Subtasks**:
- [ ] Create migration file `add_dev_session_fk`
- [ ] Add phaseId, weekId, dayId, taskId columns to DevelopmentSession
- [ ] Add foreign key constraints to Phase/Week/Day/Task tables
- [ ] Add indexes for query performance
- [ ] Update Prisma schema with FK relationships
- [ ] Run `npx prisma migrate dev` on dev database
- [ ] Verify constraints in Prisma Studio
- [ ] Test foreign key relationships

**Success Criteria**:
- [ ] Migration runs without errors
- [ ] DevelopmentSession can link to Phase/Week/Day/Task
- [ ] Foreign keys enforced (CASCADE on UPDATE, SET NULL on DELETE)
- [ ] Indexes created for phaseId, weekId, dayId, taskId

**Files**:
- `apps/web/prisma/migrations/YYYYMMDD_add_dev_session_fk/migration.sql` (CREATE)
- `apps/web/prisma/schema.prisma` (UPDATE)

---

### ⏳ Task 2: Materialization MCP Tool

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 2-2.5 hours

**Subtasks**:
- [ ] Create `materializeTool.ts` file in `apps/mcp-server/src/tools/roadmap/`
- [ ] Implement Roadmap JSON parsing
- [ ] Implement Phase record creation loop
- [ ] Implement Week record creation (parse duration "2 weeks" → 2)
- [ ] Implement Day record creation (5 days per week, Mon-Fri)
- [ ] Add transaction support (rollback on error)
- [ ] Add error handling (Roadmap not found, invalid duration, DB constraints)
- [ ] Return created IDs structure: `{ phaseIds[], weekIds[], dayIds[] }`
- [ ] Write unit tests (3-4 tests):
  - Test successful materialization
  - Test Roadmap not found error
  - Test invalid duration handling
  - Test transaction rollback on error
- [ ] Register tool in MCP server index

**Success Criteria**:
- [ ] Tool creates Phase/Week/Day records from JSON
- [ ] Returns created IDs
- [ ] Tests passing (3-4 tests)
- [ ] Callable from MCP client
- [ ] Transaction-safe (rollback on error)

**Files**:
- `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (CREATE)
- `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts` (CREATE)

---

### ⏳ Task 3: Update Session 3 Bootstrap

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 30 minutes

**Subtasks**:
- [ ] Update `bootstrapTool.ts` to call materialize after roadmap.create
- [ ] Store returned phase/week/day IDs in Session 3 response
- [ ] Add error handling if materialization fails
- [ ] Register materializeTool in MCP server index (`src/index.ts`)
- [ ] Test end-to-end onboarding flow (Session 1 → 2 → 3)
- [ ] Verify Phase/Week/Day records exist after Session 3

**Success Criteria**:
- [ ] Session 3 completes successfully
- [ ] Phase/Week/Day records created
- [ ] IDs stored in OnboardingSession.response:
  ```json
  {
    "roadmapMaterialized": true,
    "createdPhaseIds": ["phase-1", "phase-2"],
    "createdWeekIds": ["week-1-1", "week-1-2"],
    "createdDayIds": ["day-1-1-1", "day-1-1-2", ...]
  }
  ```

**Files**:
- `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (UPDATE)
- `apps/mcp-server/src/index.ts` (UPDATE)

---

## Part B: Development Cycle UI (8 points, ~16 hours)

### ⏳ Task 4: Page + Empty State

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create `/roadmap/page.tsx` Server Component
- [ ] Implement data fetching (phases with nested includes)
- [ ] Query current position (latest IN_PROGRESS task)
- [ ] Create EmptyRoadmapState.tsx component
- [ ] Handle empty state (no phases → show EmptyRoadmapState)
- [ ] Implement page layout structure
- [ ] Add loading states (Suspense boundaries)
- [ ] Add error boundaries
- [ ] Import and use RoadmapTree, CurrentPositionBanner, RoadmapFilters

**Success Criteria**:
- [ ] Page accessible at `/roadmap`
- [ ] Empty state shows when `phases.length === 0`
- [ ] Data fetches correctly with nested includes
- [ ] Loading states work
- [ ] Error boundaries handle failures

**Files**:
- `apps/web/app/roadmap/page.tsx` (CREATE)
- `apps/web/components/roadmap/EmptyRoadmapState.tsx` (CREATE)

---

### ⏳ Task 5: Tree Component

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create RoadmapTree.tsx Client Component
- [ ] Implement collapsible tree structure
- [ ] Add expand/collapse state management (`useState<Set<string>>`)
- [ ] Implement togglePhase function
- [ ] Render PhaseCard for each phase
- [ ] Pass isExpanded and onToggle props
- [ ] Add keyboard navigation (optional - arrow keys, Enter to toggle)
- [ ] Add accessibility attributes (aria-expanded, role="tree")

**Success Criteria**:
- [ ] Tree renders hierarchy
- [ ] Expand/collapse works correctly
- [ ] State management correct (Set-based)
- [ ] Multiple phases can be expanded simultaneously
- [ ] Keyboard navigation works (optional)

**Files**:
- `apps/web/components/roadmap/RoadmapTree.tsx` (CREATE)

---

### ⏳ Task 6: Hierarchy Card Components

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 3-4 hours

**Subtasks**:
- [ ] Create PhaseCard.tsx (~80 lines)
  - Header with chevron + title + status badge
  - Progress bar
  - Meta info (week count, dates)
  - Expand to show weeks
- [ ] Create WeekCard.tsx (~70 lines)
  - Similar pattern to PhaseCard
  - Meta info (day count)
  - Expand to show days
- [ ] Create DayCard.tsx (~70 lines)
  - Similar pattern
  - Meta info (task count)
  - Expand to show tasks
- [ ] Create TaskCard.tsx (~60 lines)
  - Similar pattern
  - Meta info (session count)
  - Expand to show sessions
- [ ] Implement consistent styling across all cards
- [ ] Add status badge color mapping:
  - NOT_STARTED: gray
  - IN_PROGRESS: blue
  - COMPLETE: green
  - BLOCKED: red
- [ ] Add progress bars to all cards
- [ ] Add click handlers for expansion
- [ ] Add data-testid attributes for testing

**Success Criteria**:
- [ ] All 4 cards implemented
- [ ] Consistent styling
- [ ] Progress visualization works
- [ ] Click to expand works
- [ ] Status badges display correctly
- [ ] Nested expansion works (Phase → Week → Day → Task)

**Files**:
- `apps/web/components/roadmap/PhaseCard.tsx` (CREATE)
- `apps/web/components/roadmap/WeekCard.tsx` (CREATE)
- `apps/web/components/roadmap/DayCard.tsx` (CREATE)
- `apps/web/components/roadmap/TaskCard.tsx` (CREATE)

---

### ⏳ Task 7: Current Position Banner

**Priority**: MEDIUM
**Status**: PENDING
**Estimated Time**: 1.5 hours

**Subtasks**:
- [ ] Create CurrentPositionBanner.tsx
- [ ] Implement breadcrumb logic (Phase → Week → Day → Task)
- [ ] Add MapPin icon from lucide-react
- [ ] Add progress indicators for all 4 levels (phase, week, day, task)
- [ ] Style "You are here" message
- [ ] Handle null case (no active task)
- [ ] Add responsive grid layout (4 columns on desktop, stack on mobile)
- [ ] Add accent-primary background styling

**Success Criteria**:
- [ ] Banner shows current position when task exists
- [ ] Breadcrumb displays correctly
- [ ] Progress indicators display for all levels
- [ ] Handles null case gracefully (banner doesn't render)
- [ ] Responsive layout works

**Files**:
- `apps/web/components/roadmap/CurrentPositionBanner.tsx` (CREATE)

---

### ⏳ Task 8: Roadmap Filters

**Priority**: MEDIUM
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create RoadmapFilters.tsx Client Component
- [ ] Implement status filter (multi-select):
  - Options: IN_PROGRESS, COMPLETE, BLOCKED, PENDING
  - Use Select component from ui/select
- [ ] Implement progress range slider (0-100%)
  - Use Slider component from ui/slider
  - Step: 5%
- [ ] Add date range picker (optional - low priority)
- [ ] Add Reset button to clear all filters
- [ ] Connect filters to parent page via URL params or props
- [ ] Update tree to filter based on selected criteria
- [ ] Add filter state management (`useState`)

**Success Criteria**:
- [ ] Filters work correctly
- [ ] Tree updates on filter change
- [ ] Multiple filters combinable (AND logic)
- [ ] Reset button clears all filters
- [ ] Filter state persists during expand/collapse

**Files**:
- `apps/web/components/roadmap/RoadmapFilters.tsx` (CREATE)

---

### ⏳ Task 9: Navigation Integration

**Priority**: LOW
**Status**: PENDING
**Estimated Time**: 30 minutes

**Subtasks**:
- [ ] Update Sidebar.tsx
- [ ] Add Map icon import from lucide-react
- [ ] Add navigation item to sidebar array:
  ```typescript
  {
    href: '/roadmap',
    icon: Map,
    label: 'Development Cycle',
    badge: null,
  }
  ```
- [ ] Test navigation (click sidebar → navigate to /roadmap)
- [ ] Verify active state styling works

**Success Criteria**:
- [ ] Link visible in sidebar
- [ ] Navigates to `/roadmap` on click
- [ ] Active state works (bg-accent-primary/20 class)
- [ ] Icon displays correctly

**Files**:
- `apps/web/components/Sidebar.tsx` (UPDATE - ~5 lines added)

---

## Part C: Testing (3-4 hours)

### ⏳ Task 10: E2E Tests

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 2-3 hours

**Subtasks**:
- [ ] Create roadmap.spec.ts file in `tests/e2e/`
- [ ] Test 1: Page layout displays correctly
- [ ] Test 2: Empty state shows when no roadmap
- [ ] Test 3: Phase cards render with correct data
- [ ] Test 4: Tree expand/collapse works
- [ ] Test 5: Current position banner shows active task
- [ ] Test 6: Filters work (status filter)
- [ ] Test 7: Agent checkpoint updates UI (optional - requires MCP setup)
- [ ] Add test data seeding (phases, weeks, days, tasks)
- [ ] Verify test coverage >80%

**Success Criteria**:
- [ ] 5-7 tests created
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Tests run in CI pipeline

**Files**:
- `apps/web/tests/e2e/roadmap.spec.ts` (CREATE)

---

### ⏳ Task 11: Integration Testing

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 1 hour

**Manual Test Checklist**:
- [ ] **Test 1: Session 3 → Roadmap Flow**
  - Complete onboarding Sessions 1-3
  - Verify Phase/Week/Day records created in database
  - Check OnboardingSession.response for created IDs
  - Navigate to `/roadmap`
  - Verify tree displays with correct phase count

- [ ] **Test 2: UI Functionality**
  - Expand Phase 1 → verify weeks show
  - Expand Week 1 → verify days show
  - Expand Day 1 → verify tasks show (if any)
  - Collapse Phase 1 → verify weeks hide
  - Test filters (select IN_PROGRESS → verify filtering)

- [ ] **Test 3: Current Position Banner**
  - Create a task with status IN_PROGRESS
  - Reload `/roadmap`
  - Verify "You Are Here" banner shows
  - Verify breadcrumb displays correct hierarchy

- [ ] **Test 4: Agent Checkpoint Update**
  - Agent calls `sprint.checkpoint`
  - Refresh `/roadmap`
  - Verify task progress updated
  - Verify progress bars reflect changes

- [ ] **Test 5: Performance**
  - Measure page load time (<3s target)
  - Check for console errors
  - Verify nested queries don't cause N+1 problems
  - Test with large hierarchy (10+ phases)

- [ ] **Test 6: Empty State**
  - Delete all Phase records from database
  - Navigate to `/roadmap`
  - Verify EmptyRoadmapState displays
  - Click "Start Onboarding" → verify navigation

**Success Criteria**:
- [ ] Session 3 → roadmap flow works end-to-end
- [ ] Phase/Week/Day records exist in database
- [ ] Agent updates reflected in UI
- [ ] No console errors
- [ ] Performance <3s page load
- [ ] Empty state handles edge case

---

## Summary

**Total Tasks**: 11
**Completed**: 0/11 (0%)
**Story Points**: 9 points

**Task Breakdown by Priority**:
- **CRITICAL**: 3 tasks (Tasks 1-3) - Materialization (MUST complete first)
- **HIGH**: 5 tasks (Tasks 4-6, 10-11) - Core UI + Testing
- **MEDIUM**: 2 tasks (Tasks 7-8) - Banner + Filters
- **LOW**: 1 task (Task 9) - Navigation

**Sequential Dependencies**:
1. **Tasks 1-3 MUST complete first** (materialization infrastructure)
2. Task 4 before Task 5 (page before tree)
3. Task 5 before Task 6 (tree before cards)
4. **Tasks 4-9 before Task 10** (UI before E2E tests)
5. Task 10 before Task 11 (E2E before integration)

**Critical Path**: 1 → 2 → 3 → 4 → 5 → 6 → 10 → 11

**Parallel Work Opportunities**:
- Tasks 7-8-9 can be done in parallel with Task 6 (if multiple developers)
- Tasks 7-8-9 are independent of each other

---

## Progress Tracking

### Part A: Materialization (1 point)
- [ ] Task 1: Schema Migration
- [ ] Task 2: MCP Tool
- [ ] Task 3: Session 3 Integration

**Progress**: 0/3 tasks (0%)

### Part B: UI Components (8 points)
- [ ] Task 4: Page + Empty State
- [ ] Task 5: Tree Component
- [ ] Task 6: Card Components (4 cards)
- [ ] Task 7: Current Position Banner
- [ ] Task 8: Roadmap Filters
- [ ] Task 9: Navigation

**Progress**: 0/6 tasks (0%)

### Part C: Testing (0 points - included in Parts A+B)
- [ ] Task 10: E2E Tests
- [ ] Task 11: Integration Testing

**Progress**: 0/2 tasks (0%)

---

## File Checklist

**Files to CREATE** (15 total):
- [ ] `apps/web/prisma/migrations/*/migration.sql`
- [ ] `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts`
- [ ] `apps/web/app/roadmap/page.tsx`
- [ ] `apps/web/components/roadmap/EmptyRoadmapState.tsx`
- [ ] `apps/web/components/roadmap/RoadmapTree.tsx`
- [ ] `apps/web/components/roadmap/PhaseCard.tsx`
- [ ] `apps/web/components/roadmap/WeekCard.tsx`
- [ ] `apps/web/components/roadmap/DayCard.tsx`
- [ ] `apps/web/components/roadmap/TaskCard.tsx`
- [ ] `apps/web/components/roadmap/CurrentPositionBanner.tsx`
- [ ] `apps/web/components/roadmap/RoadmapFilters.tsx`
- [ ] `apps/web/tests/e2e/roadmap.spec.ts`

**Files to UPDATE** (3 total):
- [ ] `apps/mcp-server/src/index.ts` (register materializeTool)
- [ ] `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (call materialize)
- [ ] `apps/web/components/Sidebar.tsx` (add Development Cycle link)

---

**Reference**: `.agent/task/current-plan.md` (full detailed plan)
**Last Updated**: 2025-11-17
