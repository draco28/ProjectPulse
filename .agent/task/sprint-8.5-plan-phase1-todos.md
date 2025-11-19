# Sprint 8.5 Phase 1: Development Roadmap Materialization + UI - Todos

**Created**: 2025-11-17 (Updated with full alignment + gap fixes)
**Story Points**: 12 points
**Status**: 0/17 complete (0%)
**Estimated Time**: 3.75 days (~31-35 hours)

---

## Part 0: Database Schema (NEW - 4 hours, 1 point)

### ⏳ Task 0.0: Add Document Model

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 30 minutes

**Subtasks**:
- [ ] Add Document model to `apps/web/prisma/schema.prisma` (from 3-session-onboarding-REFERENCE.md)
- [ ] Add fields: id, onboardingSessionId, filename, content (@db.Text), wordCount, generatedAt, category, tags
- [ ] Add relationship: OnboardingSession → Document[] (one-to-many)
- [ ] Create migration: `npx prisma migrate dev --name add_document_model`
- [ ] Verify migration runs successfully
- [ ] Test: Session 2 can save documents via MCP

**Success Criteria**:
- [ ] Document model created
- [ ] Foreign key to OnboardingSession
- [ ] content field supports large text (@db.Text)
- [ ] Migration runs successfully
- [ ] Session 2 can save documents via MCP

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_document_model/migration.sql` (CREATE)

---

### ⏳ Task 0.1: Add Roadmap Model

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 1.5 hours

**Subtasks**:
- [ ] Update `apps/web/prisma/schema.prisma` with Roadmap model
- [ ] Add fields: id, **projectId (Int - NOT String)**, phases (JSON), currentPhase, currentSprint, currentWeek, currentDay
- [ ] Add relationship: Project → Roadmap (one-to-one)
- [ ] Add relationship: Roadmap → Phase[] (one-to-many)
- [ ] Create migration: `npx prisma migrate dev --name add_roadmap_model`
- [ ] Verify migration runs successfully
- [ ] Test Roadmap.create() in Prisma Studio

**Success Criteria**:
- [ ] Roadmap model created with projectId Int (not String)
- [ ] Foreign key to Project works correctly
- [ ] phases JSON field supports nested structure (@db.JsonB)
- [ ] Migration runs successfully
- [ ] Can create Roadmap linked to existing Project

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_roadmap_model/migration.sql` (CREATE)

---

### ⏳ Task 0.2: Add Sprint Model (5-Level Hierarchy)

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 1.5 hours

**Subtasks**:
- [ ] Update `apps/web/prisma/schema.prisma` with Sprint model
- [ ] Add fields: id, name, description, duration, goals[], deliverables[], storyPoints
- [ ] Add fields: status, progress, startDate, endDate
- [ ] Add relationship: Phase → Sprint[] (one-to-many)
- [ ] Add relationship: Sprint → Week[] (one-to-many)
- [ ] Update Phase model: Add `sprints Sprint[]` and `roadmapId String?`
- [ ] Update Week model: REMOVE `phaseId`, ADD `sprintId String`
- [ ] Create migration: `npx prisma migrate dev --name add_sprint_layer`
- [ ] Verify migration runs successfully
- [ ] Test Sprint.create() in Prisma Studio

**Success Criteria**:
- [ ] Sprint model created with all fields
- [ ] Phase → Sprint → Week → Day → Task hierarchy works
- [ ] Week.phaseId removed, Week.sprintId added
- [ ] Migration runs without errors
- [ ] Database hierarchy: Phase → Sprint → Week → Day → Task (5 levels)

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_sprint_layer/migration.sql` (CREATE)

---

### ⏳ Task 0.3: Update Existing Hierarchy API for Sprint Layer

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 30 minutes

**Subtasks**:
- [ ] Update `apps/web/app/api/hierarchy/query/route.ts`
- [ ] Change Prisma includes: week.phase → week.sprint.phase
- [ ] Create `apps/web/scripts/migrate-sprint-layer.ts` (data migration script)
- [ ] Migration script: Create one Sprint per existing Phase
- [ ] Migration script: Backfill Week.sprintId from Week.phaseId
- [ ] Run migration script
- [ ] Test: /api/hierarchy/query returns data after migration
- [ ] Update other routes if they use week.phase

**Success Criteria**:
- [ ] /api/hierarchy/query returns data after migration
- [ ] All queries using week.phase updated to week.sprint.phase
- [ ] Data migration script runs successfully
- [ ] Existing Week records have sprintId populated
- [ ] No 500 errors in Sprint 8 routes

**Files**:
- `apps/web/app/api/hierarchy/query/route.ts` (UPDATE)
- `apps/web/scripts/migrate-sprint-layer.ts` (CREATE - migration script)
- Other API routes using week.phase (UPDATE if needed)

---

### ⏳ Task 0.4: Add DevelopmentSession Model

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 30 minutes

**Subtasks**:
- [ ] Add DevelopmentSession model to `apps/web/prisma/schema.prisma` (from 3-session-onboarding-REFERENCE.md)
- [ ] Add fields: id, projectId, phase, goals[], plan (@db.Text), todos (@db.JsonB), progress, status
- [ ] Add timestamps: createdAt, updatedAt, completedAt
- [ ] Add relationship: Project → DevelopmentSession[] (one-to-many)
- [ ] Add indexes: [projectId, status], [projectId, createdAt]
- [ ] Create migration: `npx prisma migrate dev --name add_development_session_model`
- [ ] Verify migration runs successfully
- [ ] Test: CurrentWorkModal can query active sessions

**Success Criteria**:
- [ ] DevelopmentSession model created
- [ ] Foreign key to Project
- [ ] plan field supports markdown (@db.Text)
- [ ] todos field supports JSON array (@db.JsonB)
- [ ] Migration runs successfully
- [ ] CurrentWorkModal can query active sessions

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_development_session_model/migration.sql` (CREATE)

---

## Part A: Roadmap Parsing + Materialization (5-6 hours, 2 points)

### ⏳ Task A.1: Markdown Parser (NEW)

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts`
- [ ] Implement ParsedRoadmap interface (phases → sprints → weeks structure)
- [ ] Implement parseProjectPlan() function:
  - Fetch 13-Project-Plan.md CONTENT from Document table (markdown string, NOT file)
  - Parse Phase headers with regex: `## Phase A: Name (Weeks X-Y, Sprints X-Y)`
  - Parse Sprint headers with regex: `### Sprint N (Weeks X-Y): Name - XX points`
  - Extract goals using extractListItems() helper
  - Extract deliverables using extractListItems() helper
  - Return nested ParsedRoadmap structure
- [ ] Implement extractListItems() helper function
- [ ] Add error handling (document not found, invalid markdown, missing fields)
- [ ] Write unit tests (4-5 tests):
  - Test successful parsing of valid markdown
  - Test Phase header extraction
  - Test Sprint header extraction with weeks range
  - Test goals/deliverables extraction
  - Test error handling for invalid markdown
- [ ] Create test fixtures with sample 13-Project-Plan.md content
- [ ] Verify all tests passing

**Success Criteria**:
- [ ] Parses Phase headers correctly
- [ ] Parses Sprint headers with weeks range (e.g., "Weeks 1-2")
- [ ] Extracts goals and deliverables as string arrays
- [ ] Returns ParsedRoadmap structure with nested sprints
- [ ] Unit tests passing (4-5 tests)
- [ ] Error handling for edge cases

**Files**:
- `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts` (CREATE)
- `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts` (CREATE)
- `apps/mcp-server/src/tools/roadmap/types.ts` (CREATE - shared interfaces)

---

### ⏳ Task A.2: Roadmap Creation in Session 3

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 1 hour

**Subtasks**:
- [ ] Update `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
- [ ] Import parseProjectPlan function
- [ ] Add code after document creation (Session 3):
  - Find 13-Project-Plan.md in created documents
  - Call parseProjectPlan(documentId)
  - Create Roadmap record with parsedRoadmap.phases JSON
  - Set currentPhase and currentSprint from phases[0]
  - Store roadmapId in OnboardingSession.response
- [ ] Add error handling if 13-Project-Plan.md not found
- [ ] Test Session 3 flow end-to-end
- [ ] Verify Roadmap record created in database
- [ ] Verify OnboardingSession.response contains roadmapId

**Success Criteria**:
- [ ] Session 3 parses 13-Project-Plan.md successfully
- [ ] Roadmap record created with phases JSON
- [ ] roadmapId stored in OnboardingSession.response
- [ ] No errors during Session 3 execution
- [ ] currentPhase and currentSprint set correctly

**Files**:
- `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (UPDATE)

---

### ⏳ Task A.3: Materialization Tool

**Priority**: CRITICAL
**Status**: PENDING
**Estimated Time**: 2-2.5 hours

**Subtasks**:
- [ ] Create `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
- [ ] Implement materializeRoadmapTool:
  - Tool name: `projectpulse.roadmap.materialize`
  - Input schema: `{ roadmapId: string }`
  - Fetch Roadmap record from database
  - Parse phases JSON
  - Loop through phases → create Phase records
  - Loop through sprints → create Sprint records (NEW - 5th level)
  - Loop through weeks → create Week records (linked to sprintId)
  - Loop through days → create Day records (5 per week, Mon-Fri)
  - Return created IDs: { phaseIds[], sprintIds[], weekIds[], dayIds[] }
- [ ] Implement calculateEndDate() helper (parse "2 weeks" → Date)
- [ ] Add transaction support (rollback on error)
- [ ] Add error handling (Roadmap not found, invalid duration, DB constraints)
- [ ] Write unit tests (4-5 tests):
  - Test successful materialization
  - Test Roadmap not found error
  - Test invalid duration handling
  - Test transaction rollback on error
  - Test Sprint record creation
- [ ] Verify all tests passing

**Success Criteria**:
- [ ] Tool creates Phase/Sprint/Week/Day records from JSON
- [ ] 5-level hierarchy: Phase → Sprint → Week → Day
- [ ] Returns created IDs structure
- [ ] Transaction-safe (rollback on error)
- [ ] Unit tests passing (4-5 tests)
- [ ] Date calculation works correctly

**Files**:
- `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (CREATE)
- `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts` (CREATE)

---

### ⏳ Task A.4: MCP Tools Registration + getCurrentPosition

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 1 hour

**Subtasks**:
- [ ] Register materializeRoadmapTool in `apps/mcp-server/src/index.ts`
- [ ] Update bootstrapTool.ts (Session 3):
  - Call materializeRoadmapTool.handler({ roadmapId })
  - Store returned IDs in OnboardingSession.response
  - Add roadmapMaterialized: true flag
- [ ] Create `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts`:
  - Tool name: `projectpulse.roadmap.getCurrentPosition`
  - Input: `{ projectId: string }`
  - Query latest IN_PROGRESS task with 5-level nested includes
  - Return breadcrumb: { phase, sprint, week, day, task }
- [ ] Register getCurrentPositionTool in index.ts
- [ ] Test Session 3 flow end-to-end
- [ ] Verify Phase/Sprint/Week/Day records exist after Session 3
- [ ] Test getCurrentPosition tool returns correct breadcrumb

**Success Criteria**:
- [ ] materializeRoadmapTool registered and callable
- [ ] Session 3 calls materialize automatically after Roadmap creation
- [ ] Phase/Sprint/Week/Day records exist after Session 3
- [ ] IDs stored in OnboardingSession.response
- [ ] getCurrentPosition tool works correctly

**Files**:
- `apps/mcp-server/src/index.ts` (UPDATE)
- `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (UPDATE)
- `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts` (CREATE)

---

## Part B: Roadmap UI (18-20 hours, 8 points)

### ⏳ Task B.1: Page + Empty State

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create `apps/web/app/roadmap/page.tsx` (Server Component)
- [ ] Implement data fetching:
  - Query phases with 5-level nested includes (sprints → weeks → days → tasks → sessions)
  - Query currentTask (latest IN_PROGRESS) with full hierarchy
  - Query activeDevelopmentSession (status: IN_PROGRESS)
- [ ] Handle empty state (phases.length === 0)
- [ ] Render page layout with title
- [ ] Render CurrentPositionBanner (if currentTask exists)
- [ ] Render RoadmapFilters
- [ ] Render RoadmapTree
- [ ] Create `apps/web/components/roadmap/EmptyRoadmapState.tsx`:
  - Display "No Roadmap Yet" message
  - Add "Start Onboarding" button linking to /onboarding
- [ ] Add loading states (Suspense boundaries)
- [ ] Add error boundaries
- [ ] Test page at `/roadmap` route

**Success Criteria**:
- [ ] Page accessible at `/roadmap`
- [ ] Empty state shows when no phases
- [ ] 5-level nested data fetches correctly
- [ ] DevelopmentSession data fetched for modal
- [ ] Loading/error states implemented

**Files**:
- `apps/web/app/roadmap/page.tsx` (CREATE)
- `apps/web/components/roadmap/EmptyRoadmapState.tsx` (CREATE)

---

### ⏳ Task B.2: Tree Component

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create `apps/web/components/roadmap/RoadmapTree.tsx` (Client Component)
- [ ] Implement collapsible tree state management (`useState<Set<string>>`)
- [ ] Implement togglePhase function
- [ ] Map phases → render PhaseCard for each
- [ ] Pass isExpanded and onToggle props
- [ ] Add 'use client' directive
- [ ] Add accessibility attributes (aria-expanded, role="tree")
- [ ] Add keyboard navigation support (optional - arrow keys, Enter to toggle)
- [ ] Test expand/collapse functionality

**Success Criteria**:
- [ ] Tree renders 5-level hierarchy
- [ ] Expand/collapse state management works
- [ ] Phases can be expanded independently
- [ ] Multiple phases can be expanded simultaneously
- [ ] Keyboard navigation works (optional)

**Files**:
- `apps/web/components/roadmap/RoadmapTree.tsx` (CREATE)

---

### ⏳ Task B.3: 5-Level Hierarchy Card Components

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 4-5 hours

**Subtasks**:
- [ ] Create `apps/web/components/roadmap/PhaseCard.tsx`:
  - Header with chevron + 📦 icon + title + status badge
  - Progress bar
  - Meta info (sprint count, progress %)
  - Click to expand → renders SprintCard for each sprint
  - Add data-testid="phase-card"
- [ ] Create `apps/web/components/roadmap/SprintCard.tsx` (NEW):
  - Header with chevron + 📅 icon + name + status badge
  - Progress bar
  - Meta info (week count, progress %)
  - Click to expand → renders WeekCard for each week
  - Add ml-6 indentation to show hierarchy
  - Add data-testid="sprint-card"
- [ ] Create `apps/web/components/roadmap/WeekCard.tsx`:
  - Similar pattern to SprintCard
  - 📆 icon + title + status badge
  - Meta info (day count)
  - Expand → renders DayCard for each day
  - Add data-testid="week-card"
- [ ] Create `apps/web/components/roadmap/DayCard.tsx`:
  - Similar pattern
  - 📆 icon + title + status badge
  - Meta info (task count)
  - Expand → renders TaskCard for each task
  - Add data-testid="day-card"
- [ ] Create `apps/web/components/roadmap/TaskCard.tsx`:
  - 📋 icon + title + status badge
  - Meta info (session count)
  - Expand → show sessions (optional)
  - Add data-testid="task-card"
- [ ] Implement consistent status badge colors:
  - NOT_STARTED: gray
  - IN_PROGRESS: blue
  - COMPLETE: green
  - BLOCKED: red
- [ ] Add consistent indentation (ml-6 for each level)
- [ ] Add Progress component to all cards
- [ ] Test nested expansion (Phase → Sprint → Week → Day → Task)

**Success Criteria**:
- [ ] All 5 cards implemented (Phase, Sprint, Week, Day, Task)
- [ ] Consistent styling with indentation showing hierarchy
- [ ] Progress bars work at all levels
- [ ] Click to expand works
- [ ] Status badges display correctly
- [ ] Nested expansion works correctly

**Files**:
- `apps/web/components/roadmap/PhaseCard.tsx` (CREATE)
- `apps/web/components/roadmap/SprintCard.tsx` (CREATE - NEW)
- `apps/web/components/roadmap/WeekCard.tsx` (CREATE)
- `apps/web/components/roadmap/DayCard.tsx` (CREATE)
- `apps/web/components/roadmap/TaskCard.tsx` (CREATE)

---

### ⏳ Task B.4: Current Position Banner + Current Work Modal

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 3 hours

**Subtasks**:
- [ ] Create `apps/web/components/roadmap/CurrentPositionBanner.tsx`:
  - Display MapPin icon
  - Display breadcrumb: "Currently: {phase} → {sprint} → {week} → {day}"
  - Display progress indicators for Phase/Sprint/Week
  - Render CurrentWorkModal if activeSession exists
  - Handle null currentTask case
  - Add responsive layout
- [ ] Create `apps/web/components/roadmap/CurrentWorkModal.tsx` (NEW):
  - Dialog component with trigger button: "📋 View Current Plan/Todos"
  - DialogContent with max-w-3xl and overflow-y-auto
  - Plan section:
    - Render session.plan as markdown using ReactMarkdown
    - Add prose styling for readability
  - Todos section:
    - Display completed count: "✅ Todos (X/Y complete)"
    - Map session.todos → render checklist:
      - ✅ for completed
      - 🔄 for in_progress
      - ⏸️ for pending
    - Add line-through styling for completed todos
  - Add 'use client' directive
  - Test modal open/close
- [ ] Install react-markdown: `pnpm add react-markdown`
- [ ] Test banner displays breadcrumb correctly
- [ ] Test modal opens on button click
- [ ] Test markdown rendering in plan section
- [ ] Test todo checklist rendering

**Success Criteria**:
- [ ] Banner shows current position breadcrumb (Phase → Sprint → Week → Day)
- [ ] Progress indicators display for Phase/Sprint/Week
- [ ] "View Current Plan" button opens modal
- [ ] Modal displays DevelopmentSession.plan (markdown rendered)
- [ ] Modal displays DevelopmentSession.todos (checklist with icons)
- [ ] Handles null activeSession (button hidden)

**Files**:
- `apps/web/components/roadmap/CurrentPositionBanner.tsx` (CREATE)
- `apps/web/components/roadmap/CurrentWorkModal.tsx` (CREATE - NEW)

---

### ⏳ Task B.5: Roadmap Filters

**Priority**: MEDIUM
**Status**: PENDING
**Estimated Time**: 2 hours

**Subtasks**:
- [ ] Create `apps/web/components/roadmap/RoadmapFilters.tsx` (Client Component)
- [ ] Implement status filter (multi-select):
  - Options: IN_PROGRESS, COMPLETE, BLOCKED, PENDING
  - Use Select component from ui/select
  - State: `useState<string[]>([])`
- [ ] Implement progress range slider:
  - Range: 0-100%
  - Step: 5%
  - Use Slider component from ui/slider
  - State: `useState([0, 100])`
- [ ] Add Reset button to clear all filters
- [ ] Connect filters to RoadmapTree (via URL params or props callback)
- [ ] Implement filter logic in RoadmapTree
- [ ] Test filters work correctly
- [ ] Test multiple filters combinable (AND logic)
- [ ] Test reset button clears filters

**Success Criteria**:
- [ ] Status filter works (multi-select)
- [ ] Progress range slider works
- [ ] Tree updates when filters change
- [ ] Multiple filters combinable
- [ ] Reset button clears all filters
- [ ] Filter state persists during expand/collapse

**Files**:
- `apps/web/components/roadmap/RoadmapFilters.tsx` (CREATE)

---

### ⏳ Task B.6: Navigation Integration

**Priority**: LOW
**Status**: PENDING
**Estimated Time**: 30 minutes

**Subtasks**:
- [ ] Update `apps/web/components/Sidebar.tsx`
- [ ] Import Map icon from lucide-react
- [ ] Add navigation item to sidebar array:
  ```typescript
  {
    href: '/roadmap',
    icon: Map,
    label: 'Development Roadmap',
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

## Part C: Testing (4-5 hours, 1 point)

### ⏳ Task C.1: E2E Tests

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 3 hours

**Subtasks**:
- [ ] Create `apps/web/tests/e2e/roadmap.spec.ts`
- [ ] Test 1: Page layout displays correctly
  - Goto /roadmap
  - Verify title "Development Roadmap" visible
- [ ] Test 2: Empty state shows when no roadmap
  - Goto /roadmap (assume no phases)
  - Verify "No Roadmap Yet" message
  - Verify "Start Onboarding" button
- [ ] Test 3: 5-level hierarchy expansion
  - Expand Phase → verify Sprint visible
  - Expand Sprint → verify Week visible (NEW)
  - Expand Week → verify Day visible
  - Expand Day → verify Task visible
- [ ] Test 4: Current position banner
  - Verify "Currently:" breadcrumb visible
  - Verify progress indicators display
- [ ] Test 5: Current work modal (NEW)
  - Click "View Current Plan" button
  - Verify modal opens
  - Verify "Implementation Plan" section visible
  - Verify "Todos (X/Y complete)" section visible
- [ ] Test 6: Filters work
  - Select status filter (IN_PROGRESS)
  - Verify only IN_PROGRESS items visible
- [ ] Test 7: Sprint layer renders correctly (NEW)
  - Verify SprintCard renders between Phase and Week
  - Verify sprint progress bar works
- [ ] Add test data seeding (phases, sprints, weeks, days, tasks)
- [ ] Verify test coverage >80%
- [ ] Run tests: `pnpm test:e2e`

**Success Criteria**:
- [ ] 7-9 tests created
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Tests Sprint layer (NEW)
- [ ] Tests CurrentWorkModal (NEW)

**Files**:
- `apps/web/tests/e2e/roadmap.spec.ts` (CREATE)

---

### ⏳ Task C.2: Integration Testing

**Priority**: HIGH
**Status**: PENDING
**Estimated Time**: 2 hours

**Manual Test Checklist**:
- [ ] **Test 1: Session 2 → Document Creation**
  - Complete Session 2 (Onboarding)
  - Verify 13-Project-Plan.md created in Document table
  - Verify markdown content matches expected structure

- [ ] **Test 2: Session 3 → Roadmap Creation**
  - Complete Session 3 (Onboarding)
  - Verify Roadmap record created with phases JSON
  - Check OnboardingSession.response for roadmapId
  - Verify phases JSON contains nested sprints structure

- [ ] **Test 3: Materialization → Database Records**
  - After Session 3, check database tables
  - Verify Phase records exist
  - Verify Sprint records exist (NEW - 5th level)
  - Verify Week records linked to sprintId (not phaseId)
  - Verify Day records exist (5 per week, Mon-Fri)
  - Verify hierarchy: Phase → Sprint → Week → Day

- [ ] **Test 4: UI → 5-Level Tree Display**
  - Navigate to `/roadmap`
  - Verify phases render in PhaseCard
  - Expand Phase → verify sprints render in SprintCard
  - Expand Sprint → verify weeks render in WeekCard
  - Expand Week → verify days render in DayCard
  - Expand Day → verify tasks render in TaskCard (if any)

- [ ] **Test 5: Current Position Banner**
  - Create a task with status IN_PROGRESS
  - Reload `/roadmap`
  - Verify "Currently:" banner shows
  - Verify breadcrumb displays: Phase → Sprint → Week → Day
  - Verify progress indicators show correct percentages

- [ ] **Test 6: Current Work Modal (NEW)**
  - Agent creates DevelopmentSession with plan and todos
  - Reload `/roadmap`
  - Verify "View Current Plan/Todos" button appears
  - Click button → verify modal opens
  - Verify plan displays as rendered markdown
  - Verify todos display as checklist with icons

- [ ] **Test 7: Performance**
  - Measure page load time (<3s target)
  - Check browser console for errors
  - Verify 5-level nested queries don't cause N+1 problems
  - Test with large hierarchy (10+ phases)

**Success Criteria**:
- [ ] Session 2 → 13-Project-Plan.md created
- [ ] Session 3 → Roadmap JSON created
- [ ] Materialization → Phase/Sprint/Week/Day tables populated
- [ ] UI → 5-level hierarchy displays correctly
- [ ] Modal → plan/todos visible and formatted
- [ ] Performance <3s page load
- [ ] No console errors

---

## Summary

**Total Tasks**: 17 (was 14, added 3 gap fixes)
**Completed**: 0/17 (0%)
**Story Points**: 12 points

**Task Breakdown by Part**:
- **Part 0 (Database Schema)**: 5 tasks - Document + Roadmap + Sprint + API Compatibility + DevelopmentSession (was 2)
- **Part A (Parsing + Materialization)**: 4 tasks - Markdown parser + materialization + tools
- **Part B (UI Components)**: 6 tasks - Page + Tree + 5 Cards + Banner + Modal + Filters + Nav
- **Part C (Testing)**: 2 tasks - E2E + Integration

**Task Breakdown by Priority**:
- **CRITICAL**: 7 tasks (Tasks 0.0, 0.1, 0.2, 0.3, A.1, A.2, A.3) - All schema + API + Parsing + Materialization
- **HIGH**: 7 tasks (Tasks 0.4, A.4, B.1, B.2, B.3, B.4, C.1, C.2) - DevelopmentSession + Tools + UI + Testing
- **MEDIUM**: 2 tasks (Task B.5) - Filters
- **LOW**: 1 task (Task B.6) - Navigation

**Sequential Dependencies**:
1. **Part 0 MUST complete first** (database schema enables everything)
2. **Part 0 tasks sequential**: 0.0 → 0.1 → 0.2 → 0.3 → 0.4
3. **Part A MUST complete before Part B** (materialization enables UI)
3. Task 0.0 before 0.1 (Document before Roadmap - parsing needs Document)
4. Task 0.1 before 0.2 (Roadmap before Sprint)
5. Task 0.2 before 0.3 (Sprint schema before API updates)
6. Task 0.3 before 0.4 (API compatibility before DevelopmentSession)
7. Task A.1 before A.2 (parser before Session 3 integration)
8. Task A.3 before A.4 (materialize tool before registration)
9. Task B.1 before B.2 (page before tree)
10. Task B.2 before B.3 (tree before cards)
11. Task B.3 before B.4 (cards before banner/modal)
12. **Tasks B.1-B.6 before Task C.1** (UI before E2E tests)
13. Task C.1 before C.2 (E2E before integration)

**Critical Path**: 0.0 → 0.1 → 0.2 → 0.3 → 0.4 → A.1 → A.2 → A.3 → A.4 → B.1 → B.2 → B.3 → B.4 → C.1 → C.2

**Parallel Work Opportunities**:
- Tasks B.5 and B.6 can be done in parallel with B.3-B.4
- Task A.4 can start while A.3 tests are running

---

## Progress Tracking

### Part 0: Database Schema (1 point, 4 hours)
- [ ] Task 0.0: Add Document Model (30 min)
- [ ] Task 0.1: Add Roadmap Model (1.5 hours)
- [ ] Task 0.2: Add Sprint Model (1.5 hours)
- [ ] Task 0.3: Update Hierarchy API Compatibility (30 min)
- [ ] Task 0.4: Add DevelopmentSession Model (30 min)

**Progress**: 0/5 tasks (0%)

### Part A: Parsing + Materialization (2 points, 5-6 hours)
- [ ] Task A.1: Markdown Parser (2 hours)
- [ ] Task A.2: Roadmap Creation in Session 3 (1 hour)
- [ ] Task A.3: Materialization Tool (2-2.5 hours)
- [ ] Task A.4: MCP Tools Registration (1 hour)

**Progress**: 0/4 tasks (0%)

### Part B: UI Components (8 points, 18-20 hours)
- [ ] Task B.1: Page + Empty State (2 hours)
- [ ] Task B.2: Tree Component (2 hours)
- [ ] Task B.3: 5-Level Card Components (4-5 hours)
- [ ] Task B.4: Banner + Modal (3 hours)
- [ ] Task B.5: Roadmap Filters (2 hours)
- [ ] Task B.6: Navigation Integration (30 min)

**Progress**: 0/6 tasks (0%)

### Part C: Testing (1 point, 4-5 hours)
- [ ] Task C.1: E2E Tests (3 hours)
- [ ] Task C.2: Integration Testing (2 hours)

**Progress**: 0/2 tasks (0%)

---

## File Checklist

**Files to CREATE** (22 total):

**Database** (2 files):
- [ ] `apps/web/prisma/migrations/*/add_roadmap_model.sql`
- [ ] `apps/web/prisma/migrations/*/add_sprint_layer.sql`

**MCP/Backend** (7 files):
- [ ] `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/__tests__/getCurrentPositionTool.test.ts`
- [ ] `apps/mcp-server/src/tools/roadmap/types.ts`

**Frontend** (11 files):
- [ ] `apps/web/app/roadmap/page.tsx`
- [ ] `apps/web/components/roadmap/EmptyRoadmapState.tsx`
- [ ] `apps/web/components/roadmap/RoadmapTree.tsx`
- [ ] `apps/web/components/roadmap/PhaseCard.tsx`
- [ ] `apps/web/components/roadmap/SprintCard.tsx` (NEW - 5th level)
- [ ] `apps/web/components/roadmap/WeekCard.tsx`
- [ ] `apps/web/components/roadmap/DayCard.tsx`
- [ ] `apps/web/components/roadmap/TaskCard.tsx`
- [ ] `apps/web/components/roadmap/CurrentPositionBanner.tsx`
- [ ] `apps/web/components/roadmap/CurrentWorkModal.tsx` (NEW)
- [ ] `apps/web/components/roadmap/RoadmapFilters.tsx`

**Tests** (2 files):
- [ ] `apps/web/tests/e2e/roadmap.spec.ts`
- [ ] `apps/mcp-server/src/tools/__tests__/integration.test.ts`

**Files to UPDATE** (4 total):
- [ ] `apps/web/prisma/schema.prisma` (add Roadmap + Sprint models)
- [ ] `apps/mcp-server/src/index.ts` (register tools)
- [ ] `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (parse + materialize)
- [ ] `apps/web/components/Sidebar.tsx` (add Development Roadmap link)

---

## Key Changes from Original Plan

**NEW in This Update**:
1. **Part 0 added** - Database schema (Roadmap + Sprint models)
2. **Task A.1 added** - Markdown parser for 13-Project-Plan.md
3. **Sprint layer added** - 5-level hierarchy (Phase → Sprint → Week → Day → Task)
4. **SprintCard component** - New card between Phase and Week
5. **CurrentWorkModal component** - Display DevelopmentSession plan/todos
6. **Story points increased** - 9 → 12 points
7. **Timeline extended** - 2.5 days → 3.5 days
8. **More comprehensive testing** - Sprint layer + modal tests

**What Stayed the Same**:
- Tree component structure
- Card component pattern (reusable)
- Filters and navigation
- E2E and integration testing approach

---

**Reference**: [.agent/task/current-plan.md](.agent/task/current-plan.md) (full detailed plan)
**Source**: [Sprint8.5_alignment_plan](Sprint8.5_alignment_plan)
**Last Updated**: 2025-11-17 (Full alignment)
