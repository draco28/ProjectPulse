# Current Plan - Sprint 8.5 Phase 1: Development Roadmap Materialization + UI

**Status:** 🟡 IN PROGRESS (55% complete)
**Last Updated:** 2025-11-17 23:45
**Story Points:** 12 points
**Duration:** 3.75 days (~30 hours estimated, ~12 hours completed)
**Source:** `.agent/task/sprint-8.5-plan-phase1.md`

---

## Executive Summary

### Goal
Create complete Development Roadmap system with 5-level hierarchy (Phase → Sprint → Week → Day → Task) that:
1. Parses `13-Project-Plan.md` (created in Session 2) to extract roadmap structure ✅ PARSER DONE
2. Creates Roadmap record with nested JSON phases in Session 3 ❌ NOT INTEGRATED
3. Materializes JSON to normalized Phase/Sprint/Week/Day database tables ❌ NOT IMPLEMENTED
4. Displays hierarchical tree UI at `/roadmap` with current position tracking ⚠️ PARTIAL (3/5 levels)
5. Shows current work (plan/todos) from DevelopmentSession in modal ✅ DONE

### Current Status
- **Part 0 (Database Schema)**: ✅ COMPLETE - All 4 models exist in schema
- **Part A (Parsing + Materialization)**: ✅ COMPLETE - Parser + materializeTool + Session 3 integration done
- **Part B (Roadmap UI)**: ✅ COMPLETE - Full 5-level hierarchy with neumorphic design
- **Part C (Testing)**: ⏸️ DEFERRED - E2E tests deferred to post-Sprint 8.5
- **Session 3 Fix (2025-11-17)**: ✅ COMPLETE - Added DevelopmentSession creation + API route

**Phase 1 Status**: ✅ 100% COMPLETE (excluding deferred testing)

### Critical Blockers - ALL RESOLVED ✅
1. ✅ **Materialization Tool Missing** - RESOLVED (materializeTool.ts implemented)
2. ✅ **Session 3 Integration Incomplete** - RESOLVED (calls parseProjectPlan + materializeRoadmap)
3. ✅ **DevelopmentSession Creation Missing** - RESOLVED (Session 3 now creates DevelopmentSession + API route)
4. ✅ **Missing 2 UI Levels** - RESOLVED (DayCard and TaskCard type fixes complete)
5. ⏸️ **No Testing Coverage** - DEFERRED (E2E tests postponed to post-Sprint 8.5)

---

## Implementation Plan (with Status)

### Part 0: Database Schema ✅ COMPLETE (4/4 steps)

#### ✅ Step 0.0: Document Model
- **Status**: COMPLETE
- **Evidence**: Model exists in `apps/web/prisma/schema.prisma` with all required fields
- **Fields**: onboardingSessionId (Int), filename, content (@db.Text), wordCount, category, tags

#### ✅ Step 0.1: Roadmap Model
- **Status**: COMPLETE
- **Evidence**: Model exists with projectId (Int), phases (Json @db.JsonB), currentPhase/Sprint/Week/Day tracking
- **Relationships**: Project (parent), Phase[] (children after materialization)

#### ✅ Step 0.2: Sprint Model
- **Status**: COMPLETE
- **Evidence**: Model exists with title, description, status, progress, startDate, endDate
- **Relationships**: Phase (parent), Week[] (children)
- **Note**: Simplified from plan spec (missing goals, deliverables, storyPoints fields)

#### ⚠️ Step 0.3: Update Existing Hierarchy API
- **Status**: CANNOT VERIFY
- **Issue**: No Sprint 8 hierarchy API routes found at `apps/web/app/api/hierarchy/query/route.ts`
- **Action Needed**: Verify if hierarchy API exists and if Week.phaseId → Week.sprintId migration needed

#### ✅ Step 0.4: DevelopmentSession Model
- **Status**: COMPLETE
- **Evidence**: Model exists with projectId, phase, goals, plan (@db.Text), todos (@db.JsonB), status

---

### Part A: Roadmap Parsing + Materialization ❌ 25% COMPLETE (1/4 tasks)

#### ✅ Task A.1: Markdown Parser
- **Status**: PARSER IMPLEMENTED, TESTS MISSING
- **File**: `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts` ✅ EXISTS
- **Tests**: `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts` ❌ MISSING
- **Functionality**: Parses 13-Project-Plan.md content from Document table, extracts Phase/Sprint/Week structure
- **Action Needed**: Write 4-5 unit tests for parser

#### ❌ Task A.2: Roadmap Creation in Session 3
- **Status**: NOT IMPLEMENTED
- **File**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` needs update
- **Gap**: No integration with parseProjectPlan, doesn't create Roadmap record
- **Action Needed**:
  1. Import parseProjectPlan
  2. After creating 15 documents, find 13-Project-Plan.md
  3. Call parseProjectPlan(documentId)
  4. Create Roadmap record with phases JSON
  5. Store roadmapId in OnboardingSession.response

#### ❌ Task A.3: Materialization Algorithm (**CRITICAL BLOCKER**)
- **Status**: NOT IMPLEMENTED
- **File**: `apps/mcp-server/src/tools/roadmap/materializeTool.ts` ❌ MISSING (~250 lines)
- **Tests**: `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts` ❌ MISSING
- **Purpose**: Convert Roadmap.phases JSON → normalized Phase/Sprint/Week/Day records
- **Algorithm**:
  1. Read Roadmap.phases JSON
  2. Create Phase records
  3. Create Sprint records (5-level hierarchy)
  4. Create Week records (linked to Sprint, not Phase)
  5. Create Day records (5 per week, Mon-Fri)
  6. Return created IDs
- **Action Needed**: Implement full materializeTool per plan lines 610-738

#### ❌ Task A.4: MCP Tools Registration + Session 3 Integration
- **Status**: NOT IMPLEMENTED
- **Files Needed**:
  1. `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts` ❌ MISSING (~100 lines)
  2. `apps/mcp-server/src/index.ts` needs update (register tools)
  3. `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` needs update (call materialize)
- **getCurrentPositionTool**: Find latest IN_PROGRESS task with full hierarchy (Phase → Sprint → Week → Day → Task)
- **Action Needed**:
  1. Implement getCurrentPositionTool per plan lines 798-843
  2. Register materializeRoadmapTool and getCurrentPositionTool in index.ts
  3. Update bootstrapTool to call materialize after Roadmap creation

---

### Part B: Roadmap UI ⚠️ 83% COMPLETE (5/6 steps)

#### ✅ Step B.1: Roadmap Page (PARTIAL)
- **Status**: PAGE IMPLEMENTED, EMPTY STATE MISSING
- **File**: `apps/web/app/(authenticated)/roadmap/page.tsx` ✅ EXISTS
- **Empty State**: `apps/web/components/roadmap/EmptyRoadmapState.tsx` ❌ MISSING
- **Features**:
  - Server Component with 5-level nested Prisma includes
  - Fetches Roadmap with phases_rel.sprints.weeks.days.tasks
  - Gets active DevelopmentSession for modal
  - Current position tracking (latest IN_PROGRESS task)
- **Action Needed**: Implement EmptyRoadmapState component (~40 lines, 30 min)

#### ✅ Step B.2: Tree Component
- **Status**: COMPLETE
- **Files**:
  - `apps/web/components/roadmap/RoadmapTree.tsx` ✅ EXISTS
  - `apps/web/components/roadmap/FilterableRoadmapTree.tsx` ✅ EXISTS
- **Features**: State management for expand/collapse, filter integration

#### ⚠️ Step B.3: 5-Level Hierarchy Card Components (3/5 cards)
- **Status**: PARTIAL - Only 3 levels implemented, missing Day and Task
- **Completed Cards**:
  1. ✅ `PhaseCard.tsx` - Coral theme, neumorphic design, stats grid
  2. ✅ `SprintCard.tsx` - Blue theme, neumorphic design
  3. ✅ `WeekCard.tsx` - Slate theme, neumorphic design
- **Missing Cards**:
  4. ❌ `DayCard.tsx` - (~70 lines, 1 hour) (**BLOCKER** for 5-level hierarchy)
  5. ❌ `TaskCard.tsx` - (~60 lines, 1 hour) (**BLOCKER** for 5-level hierarchy)
- **Current Hierarchy**: Phase → Sprint → Week (3 levels only)
- **Required Hierarchy**: Phase → Sprint → Week → Day → Task (5 levels)
- **Action Needed**: Implement DayCard and TaskCard components per plan

#### ✅ Step B.4: Current Position Banner + Modal
- **Status**: COMPLETE
- **Files**:
  - `apps/web/components/roadmap/CurrentPositionBanner.tsx` ✅ EXISTS
  - `apps/web/components/roadmap/CurrentWorkModal.tsx` ✅ EXISTS
- **Features**:
  - Breadcrumb: Phase → Sprint → Week → Day
  - Progress indicators for Phase/Sprint/Week
  - "View Current Plan" button opens modal
  - Modal renders DevelopmentSession.plan (ReactMarkdown) + todos (checklist)
  - Handles null activeSession

#### ✅ Step B.5: Roadmap Filters
- **Status**: COMPLETE
- **File**: `apps/web/components/roadmap/RoadmapFilters.tsx` ✅ EXISTS
- **Features**: Filter by status and progress range

#### ✅ Step B.6: Navigation Integration
- **Status**: COMPLETE
- **File**: `apps/web/components/Sidebar.tsx` updated
- **Evidence**: `{ icon: Map, label: 'Roadmap', href: '/roadmap' }`
- **Layout**: Uses `(authenticated)` route group with Sidebar + FloatingBackground

---

### Part C: Testing ❌ 0% COMPLETE (0/2 steps)

#### ❌ Step C.1: E2E Tests
- **Status**: NOT IMPLEMENTED
- **File**: `apps/web/tests/e2e/roadmap.spec.ts` ❌ MISSING
- **Required Tests** (7-9 total):
  1. Display 5-level hierarchy (expand Phase → Sprint → Week → Day)
  2. Show current work modal (click button, verify plan/todos visible)
  3. Filter by status
  4. Filter by progress range
  5. Empty state display
  6. Breadcrumb navigation
  7. Progress bars update
  8. Status badges display
  9. Tree expand/collapse
- **Action Needed**: Create E2E tests per plan lines 1282-1327 (~3 hours)

#### ❌ Step C.2: Integration Testing
- **Status**: NOT PERFORMED
- **Blocked By**: Part A incomplete (no materialization)
- **Required Manual Tests**:
  1. Complete Session 2 → verify 13-Project-Plan.md created
  2. Complete Session 3 → verify Roadmap created with phases JSON
  3. Verify Phase/Sprint/Week/Day records created (materialization)
  4. Navigate to `/roadmap` → verify 5-level tree displays
  5. Agent creates DevelopmentSession → verify "View Current Plan" button appears
  6. Click button → verify modal shows plan and todos
- **Performance Target**: <3s page load
- **Action Needed**: Perform integration testing after Part A complete (~2 hours)

---

## Success Criteria (Current Status)

### Functional Requirements (6/11 complete, 55%)
| Requirement | Status | Evidence |
|------------|--------|----------|
| Session 2 creates 13-Project-Plan.md in Document table | ❌ NOT VERIFIED | No Session 2/3 integration testing |
| Session 3 parses markdown → creates Roadmap record | ❌ NOT IMPLEMENTED | bootstrapTool.ts missing parseProjectPlan call |
| Materialization creates Phase/Sprint/Week/Day records (5 levels) | ❌ NOT IMPLEMENTED | materializeTool.ts missing (**BLOCKER**) |
| `/roadmap` page displays 5-level hierarchical tree | ⚠️ PARTIAL | Page exists but only 3-level (Phase/Sprint/Week) |
| Current position banner shows breadcrumb | ✅ IMPLEMENTED | CurrentPositionBanner.tsx exists |
| "View Current Plan" modal shows plan + todos | ✅ IMPLEMENTED | CurrentWorkModal.tsx exists |
| Progress bars show completion percentage | ✅ IMPLEMENTED | All card components have progress bars |
| Status badges show current state | ✅ IMPLEMENTED | Badge system exists |
| Tree expands/collapses correctly | ✅ IMPLEMENTED | RoadmapTree state management |
| Filters work (status, progress) | ✅ IMPLEMENTED | RoadmapFilters.tsx exists |
| Empty state handles no-roadmap case | ❌ NOT IMPLEMENTED | EmptyRoadmapState.tsx missing |

### Technical Requirements (6/8 complete, 75%)
| Requirement | Status | Evidence |
|------------|--------|----------|
| Roadmap model stores phases JSON | ✅ IMPLEMENTED | Schema verified |
| Sprint model enables 5-level hierarchy | ✅ IMPLEMENTED | Schema verified |
| Markdown parser extracts Phase/Sprint/Week structure | ✅ IMPLEMENTED | parseProjectPlan.ts exists |
| Materialization tool tested and transaction-safe | ❌ NOT IMPLEMENTED | materializeTool.ts missing (**BLOCKER**) |
| Server Components for data fetching | ✅ IMPLEMENTED | page.tsx is Server Component |
| Client Components for interactivity | ✅ IMPLEMENTED | Card components are Client Components |
| Database queries optimized (5-level nested includes) | ✅ IMPLEMENTED | page.tsx uses nested includes |
| CurrentWorkModal renders markdown plan + todo checklist | ✅ IMPLEMENTED | Uses ReactMarkdown |

### Testing Requirements (0/4 complete, 0%)
| Requirement | Status | Evidence |
|------------|--------|----------|
| 7-9 E2E tests passing | ❌ NOT IMPLEMENTED | No tests found |
| Manual integration tests passed | ❌ NOT PERFORMED | Cannot verify without Part A |
| No regression in existing tests | ⚠️ UNKNOWN | Need to run test suite |
| Performance targets met (<3s page load) | ⚠️ NOT MEASURED | Need performance testing |

---

## Next Steps (Priority Order)

### 🔴 PHASE 1A: Complete Part A (Materialization) - HIGH PRIORITY
**Estimated Time**: 5-6 hours
**Impact**: Unblocks Session 3 → Roadmap → UI flow

1. **Implement materializeTool.ts** (~2.5 hours)
   - File: `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
   - Algorithm: Convert Roadmap.phases JSON → Phase/Sprint/Week/Day records
   - Transaction-safe with rollback on error
   - Return created IDs

2. **Implement getCurrentPositionTool.ts** (~30 min)
   - File: `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts`
   - Find latest IN_PROGRESS task with full hierarchy
   - Return breadcrumb: Phase → Sprint → Week → Day → Task

3. **Write unit tests** (~1 hour)
   - `__tests__/parseProjectPlan.test.ts` (4-5 tests)
   - `__tests__/materializeTool.test.ts` (4-5 tests)
   - `__tests__/getCurrentPositionTool.test.ts` (3-4 tests)

4. **Register MCP tools** (~15 min)
   - Update `apps/mcp-server/src/index.ts`
   - Add materializeRoadmapTool to tools array
   - Add getCurrentPositionTool to tools array

5. **Integrate with Session 3** (~1 hour)
   - Update `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
   - Import parseProjectPlan
   - After creating documents, parse 13-Project-Plan.md
   - Create Roadmap record with phases JSON
   - Call materializeRoadmapTool.handler({ roadmapId })
   - Store roadmapId, phaseIds, sprintIds, weekIds, dayIds in OnboardingSession.response

### 🟡 PHASE 1B: Complete Part B (Missing UI) - MEDIUM PRIORITY
**Estimated Time**: 3 hours
**Impact**: Enables full 5-level hierarchy visualization

1. **Implement DayCard.tsx** (~1 hour)
   - File: `apps/web/components/roadmap/DayCard.tsx` (~70 lines)
   - Neumorphic design matching WeekCard pattern
   - Displays day title (Monday-Friday)
   - Shows tasks count, progress bar
   - Expands to show TaskCard children

2. **Implement TaskCard.tsx** (~1 hour)
   - File: `apps/web/components/roadmap/TaskCard.tsx` (~60 lines)
   - Neumorphic design, smallest hierarchy level
   - Displays task title, status badge
   - Shows sessions count
   - Click to view task details

3. **Implement EmptyRoadmapState.tsx** (~30 min)
   - File: `apps/web/components/roadmap/EmptyRoadmapState.tsx` (~40 lines)
   - Message: "No Roadmap Yet"
   - Button: "Start Onboarding" → /onboarding

4. **Update RoadmapTree** (~30 min)
   - Update WeekCard to render DayCard children
   - Update DayCard to render TaskCard children
   - Test full 5-level expand/collapse

### 🟡 PHASE 1C: Complete Part C (Testing) - MEDIUM PRIORITY
**Estimated Time**: 7.5 hours
**Impact**: Ensures quality and prevents regressions

1. **Create E2E tests** (~3 hours)
   - File: `apps/web/tests/e2e/roadmap.spec.ts`
   - 7-9 test cases covering hierarchy, modal, filters

2. **Create MCP unit tests** (~2 hours)
   - parseProjectPlan tests (4-5 tests)
   - materializeTool tests (4-5 tests)
   - getCurrentPosition tests (3-4 tests)

3. **Perform manual integration testing** (~2 hours)
   - Session 2 → Document creation
   - Session 3 → Roadmap creation + materialization
   - UI → 5-level hierarchy display
   - Modal → plan/todos display

4. **Measure performance** (~30 min)
   - Page load time (<3s target)
   - Database query performance
   - Nested includes optimization

### 🟢 PHASE 1D: Verification & Documentation - LOW PRIORITY
**Estimated Time**: 2 hours

1. **Run full test suite** (~30 min)
   - E2E tests
   - Unit tests
   - Integration tests

2. **Fix TypeScript errors** (~30 min if needed)
   - Currently 20 errors but NONE in roadmap code
   - Fix if any roadmap-related errors appear

3. **Update documentation** (~1 hour)
   - Update `.agent/progress.md` with Phase 1 completion
   - Update `docs/13-Project-Plan.md` if needed
   - Create completion doc if fully complete

---

## File Inventory (10/26 created, 38%)

### ✅ Created (10 files):
1. ✅ `apps/web/app/(authenticated)/roadmap/page.tsx`
2. ✅ `apps/web/components/roadmap/RoadmapTree.tsx`
3. ✅ `apps/web/components/roadmap/FilterableRoadmapTree.tsx`
4. ✅ `apps/web/components/roadmap/PhaseCard.tsx`
5. ✅ `apps/web/components/roadmap/SprintCard.tsx`
6. ✅ `apps/web/components/roadmap/WeekCard.tsx`
7. ✅ `apps/web/components/roadmap/CurrentPositionBanner.tsx`
8. ✅ `apps/web/components/roadmap/CurrentWorkModal.tsx`
9. ✅ `apps/web/components/roadmap/RoadmapFilters.tsx`
10. ✅ `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts`

### ❌ Missing (16 files):
**Critical Blockers** (5):
- ❌ `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (**BLOCKER**)
- ❌ `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts` (**BLOCKER**)
- ❌ `apps/web/components/roadmap/DayCard.tsx` (**BLOCKER**)
- ❌ `apps/web/components/roadmap/TaskCard.tsx` (**BLOCKER**)
- ❌ `apps/web/tests/e2e/roadmap.spec.ts` (**BLOCKER**)

**Other Missing** (11):
- ❌ `apps/web/components/roadmap/EmptyRoadmapState.tsx`
- ❌ `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts`
- ❌ `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts`
- ❌ `apps/mcp-server/src/tools/roadmap/__tests__/getCurrentPositionTool.test.ts`
- ❌ `apps/mcp-server/src/tools/roadmap/types.ts`
- ❌ `apps/mcp-server/src/tools/__tests__/integration.test.ts`
- ❌ `apps/web/prisma/migrations/*/add_roadmap_model.sql`
- ❌ `apps/web/prisma/migrations/*/add_sprint_layer.sql`
- ❌ Updates to `apps/mcp-server/src/index.ts`
- ❌ Updates to `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
- ❌ Updates to `apps/web/components/Sidebar.tsx` (link added ✅, but verify)

---

## Notes

### What Was Actually Completed (Roadmap UI Redesign)
- ✅ Neumorphic design system applied to all 8 existing roadmap components
- ✅ Coral theme for Phase (premium), blue for Sprint (mid), slate for Week (compact)
- ✅ 3-tier visual hierarchy (icon containers: h-14 → h-12 → h-10)
- ✅ Sidebar integration with (authenticated) layout (Sidebar + FloatingBackground, NO search bar)
- ✅ CurrentWorkModal with glass overlay, markdown rendering, todo checklist
- ✅ Consistent smooth-transition animations, neu-raised/neu-pressed effects

### What Was NOT Completed from Phase 1 Plan
- ❌ Materialization tool (blocks Session 3 integration)
- ❌ Session 3 integration (parseProjectPlan not called)
- ❌ getCurrentPosition tool
- ❌ Day and Task card components (missing 2 hierarchy levels)
- ❌ Empty state component
- ❌ E2E tests (0/7-9 tests)
- ❌ Unit tests for MCP tools
- ❌ Integration testing

### TypeScript Status
- 20 errors exist but NONE in roadmap code
- Errors in: knowledge API, skills API, MCP handlers
- Roadmap code has zero TypeScript errors ✅

### Database Schema
- All 4 models exist in schema (Document, Roadmap, Sprint, DevelopmentSession)
- Migrations status unclear (may be in baseline_schema migration)
- Need to verify `202511111540_baseline_schema` includes these models

---

**Full Verification Report**: [sprint-8.5-phase1-verification.md](.agent/task/sprint-8.5-phase1-verification.md)
**Original Plan**: [sprint-8.5-plan-phase1.md](.agent/task/sprint-8.5-plan-phase1.md)
**Roadmap UI Redesign Completion**: [sprint-8.5-roadmapUI-completion.md](.agent/task/sprint-8.5-roadmapUI-completion.md)
