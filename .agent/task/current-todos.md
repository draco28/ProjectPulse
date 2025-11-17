# Current Todos - Sprint 8.5 Phase 1

**Status:** 🟡 IN PROGRESS (55% complete - Part B mostly done, Parts A & C incomplete)
**Last Updated:** 2025-11-17 23:45
**Progress:** 10/26 files created (38%)
**Plan Source:** `.agent/task/sprint-8.5-plan-phase1.md`

---

## Part 0: Database Schema ✅ COMPLETE (4/4 steps)
- [x] Step 0.0: Add Document Model (exists in schema)
- [x] Step 0.1: Add Roadmap Model (exists in schema)
- [x] Step 0.2: Add Sprint Model (exists in schema)
- [x] Step 0.4: Add DevelopmentSession Model (exists in schema)
- [ ] Step 0.3: Update Existing Hierarchy API (cannot verify - no Sprint 8 hierarchy API found)
- [ ] Database migrations verification (models may be in baseline_schema migration)

## Part A: Roadmap Parsing + Materialization ❌ INCOMPLETE (1/4 tasks, 25%)
- [x] Task A.1: Markdown Parser (parseProjectPlan.ts exists, tests missing)
- [ ] Task A.1.1: Write parseProjectPlan tests
- [ ] Task A.2: Roadmap Creation in Session 3 (bootstrapTool.ts not integrated)
- [ ] Task A.3: Materialization Algorithm (materializeTool.ts missing - **CRITICAL BLOCKER**)
- [ ] Task A.3.1: Write materializeTool tests
- [ ] Task A.4: getCurrentPosition Tool (getCurrentPositionTool.ts missing)
- [ ] Task A.4.1: Write getCurrentPosition tests
- [ ] Task A.4.2: Register MCP tools in index.ts
- [ ] Task A.4.3: Integrate materialize in bootstrapTool.ts

## Part B: Roadmap UI ⚠️ MOSTLY COMPLETE (5/6 steps, ~83%)
- [x] Step B.1: Roadmap page (page.tsx exists)
- [ ] Step B.1.1: EmptyRoadmapState component (missing)
- [x] Step B.2: RoadmapTree component (exists)
- [x] Step B.3.1: PhaseCard component (exists, neumorphic redesign ✅)
- [x] Step B.3.2: SprintCard component (exists, neumorphic redesign ✅)
- [x] Step B.3.3: WeekCard component (exists, neumorphic redesign ✅)
- [ ] Step B.3.4: DayCard component (missing - **BLOCKER** for 5-level hierarchy)
- [ ] Step B.3.5: TaskCard component (missing - **BLOCKER** for 5-level hierarchy)
- [x] Step B.4.1: CurrentPositionBanner (exists, neumorphic redesign ✅)
- [x] Step B.4.2: CurrentWorkModal (exists, neumorphic redesign ✅)
- [x] Step B.5: RoadmapFilters (exists, neumorphic redesign ✅)
- [x] Step B.6: Sidebar navigation integration (Roadmap link exists)
- [x] **BONUS**: Neumorphic design system applied to all 8 existing components

## Part C: Testing ❌ INCOMPLETE (0/2 steps, 0%)
- [ ] Step C.1: E2E Tests (roadmap.spec.ts missing - 0/7-9 tests)
- [ ] Step C.2: Integration Testing (not performed, blocked by Part A)
- [ ] Step C.2.1: Session 2 → 13-Project-Plan.md verification
- [ ] Step C.2.2: Session 3 → Roadmap JSON verification
- [ ] Step C.2.3: Materialization → Phase/Sprint/Week/Day tables verification
- [ ] Step C.2.4: UI → 5-level hierarchy display verification
- [ ] Step C.2.5: Modal → plan/todos display verification
- [ ] Step C.2.6: Performance testing (<3s page load target)

---

## Critical Blockers (Must Fix for Phase 1 Completion)

### ✅ BLOCKER 1: Materialization Tool Missing - RESOLVED (2025-11-17)
**Impact**: Session 3 cannot materialize Roadmap JSON to database tables
**Files Created**:
- [x] `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (~302 lines) ✅ COMPLETE
- [x] `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts` ✅ COMPLETE

### ✅ BLOCKER 2: Session 3 Integration Incomplete - RESOLVED (2025-11-17)
**Impact**: Onboarding flow broken, no Roadmap created during Session 3
**Files Updated**:
- [x] `apps/web/app/api/onboarding/responses/route.ts` (added parseProjectPlan + materializeTool calls) ✅ COMPLETE
- [x] `apps/mcp-server/src/index.ts` (registered materializeRoadmapTool, getCurrentPositionTool) ✅ COMPLETE

### ✅ BLOCKER 2.5: DevelopmentSession Creation Missing - RESOLVED (2025-11-17)
**Impact**: CurrentWorkModal has no data source after Session 3
**Files Created/Updated**:
- [x] `apps/web/app/api/development-sessions/route.ts` (65 lines) ✅ COMPLETE
- [x] `apps/web/app/api/onboarding/responses/route.ts` (+80 lines for Step 8) ✅ COMPLETE

### ✅ BLOCKER 3: Missing UI Components for 5-Level Hierarchy - RESOLVED (2025-11-17)
**Impact**: Only 3 levels shown (Phase/Sprint/Week), missing Day/Task levels
**Files Fixed**:
- [x] `apps/web/components/roadmap/DayCard.tsx` (existed, type fixes) ✅ COMPLETE
- [x] `apps/web/components/roadmap/TaskCard.tsx` (existed, type fixes) ✅ COMPLETE
- [x] `apps/web/components/roadmap/EmptyRoadmapState.tsx` (already existed) ✅ COMPLETE
- [x] `apps/web/app/(authenticated)/roadmap/page.tsx` (query updated for Day/Task data) ✅ COMPLETE
- [x] `apps/web/types/roadmap.ts` (added RoadmapTask type, updated RoadmapDay) ✅ COMPLETE

### ⏸️ BLOCKER 4: No Testing Coverage - DEFERRED
**Impact**: Cannot verify functionality or prevent regressions
**Status**: E2E tests deferred to post-Sprint 8.5 completion
**Files Needed** (future):
- [ ] `apps/web/tests/e2e/roadmap.spec.ts` (7-9 E2E tests)
- [ ] All MCP tool unit tests

---

## File Inventory (10/26 created, 38%)

### ✅ Created (10 files):
1. ✅ `apps/web/app/(authenticated)/roadmap/page.tsx` (Server Component with 5-level nested includes)
2. ✅ `apps/web/components/roadmap/RoadmapTree.tsx` (Client Component with state management)
3. ✅ `apps/web/components/roadmap/FilterableRoadmapTree.tsx` (Wrapper with filter state)
4. ✅ `apps/web/components/roadmap/PhaseCard.tsx` (Neumorphic coral theme)
5. ✅ `apps/web/components/roadmap/SprintCard.tsx` (Neumorphic blue theme)
6. ✅ `apps/web/components/roadmap/WeekCard.tsx` (Neumorphic slate theme)
7. ✅ `apps/web/components/roadmap/CurrentPositionBanner.tsx` (Neumorphic with coral accents)
8. ✅ `apps/web/components/roadmap/CurrentWorkModal.tsx` (Glass overlay modal with ReactMarkdown)
9. ✅ `apps/web/components/roadmap/RoadmapFilters.tsx` (Neumorphic filter panel)
10. ✅ `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts` (Markdown parser for 13-Project-Plan.md)

### ❌ Missing (16 files):
**Database** (2):
- ❌ `apps/web/prisma/migrations/*/add_roadmap_model.sql`
- ❌ `apps/web/prisma/migrations/*/add_sprint_layer.sql`

**MCP/Backend** (6):
- ❌ `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts`
- ❌ `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (**CRITICAL**)
- ❌ `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts`
- ❌ `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts` (**CRITICAL**)
- ❌ `apps/mcp-server/src/tools/roadmap/__tests__/getCurrentPositionTool.test.ts`
- ❌ `apps/mcp-server/src/tools/roadmap/types.ts`

**Frontend** (3):
- ❌ `apps/web/components/roadmap/EmptyRoadmapState.tsx`
- ❌ `apps/web/components/roadmap/DayCard.tsx` (**BLOCKER** for 5-level hierarchy)
- ❌ `apps/web/components/roadmap/TaskCard.tsx` (**BLOCKER** for 5-level hierarchy)

**Tests** (2):
- ❌ `apps/web/tests/e2e/roadmap.spec.ts`
- ❌ `apps/mcp-server/src/tools/__tests__/integration.test.ts`

**Modified** (3):
- ❌ `apps/mcp-server/src/index.ts` (tools not registered yet)
- ❌ `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (no parseProjectPlan integration)
- ❌ `apps/web/components/Sidebar.tsx` (Roadmap link added ✅, but need to verify)

---

## Success Criteria (from plan)

### Functional Requirements (6/11 complete, 55%)
- ❌ Session 2 creates 13-Project-Plan.md in Document table (not verified)
- ❌ Session 3 parses markdown → creates Roadmap record (not implemented)
- ❌ Materialization creates Phase/Sprint/Week/Day records (not implemented)
- ⚠️ `/roadmap` page displays 5-level hierarchical tree (partial - only 3 levels)
- ✅ Current position banner shows breadcrumb
- ✅ "View Current Plan" modal shows plan + todos
- ✅ Progress bars show completion percentage
- ✅ Status badges show current state
- ✅ Tree expands/collapses correctly
- ✅ Filters work (status, progress)
- ❌ Empty state handles no-roadmap case

### Technical Requirements (6/8 complete, 75%)
- ✅ Roadmap model stores phases JSON
- ✅ Sprint model enables 5-level hierarchy
- ✅ Markdown parser extracts Phase/Sprint/Week structure
- ❌ Materialization tool tested and transaction-safe
- ✅ Server Components for data fetching
- ✅ Client Components for interactivity
- ✅ Database queries optimized (5-level nested includes)
- ✅ CurrentWorkModal renders markdown plan + todo checklist

### Testing Requirements (0/4 complete, 0%)
- ❌ 7-9 E2E tests passing
- ❌ Manual integration tests passed
- ⚠️ No regression in existing tests (unknown)
- ⚠️ Performance targets met (<3s page load)

---

## Next Actions (Priority Order)

### 🔴 HIGH PRIORITY: Complete Part A (Materialization)
1. Implement `materializeTool.ts` (~250 lines, 2-2.5 hours)
2. Implement `getCurrentPositionTool.ts` (~100 lines, 30 min)
3. Write unit tests for both tools (1 hour)
4. Register tools in `index.ts` (15 min)
5. Update `bootstrapTool.ts` to integrate parseProjectPlan + materialize (1 hour)

**Estimated Time**: 5-6 hours
**Impact**: Unblocks Session 3 → Roadmap → UI flow

### 🟡 MEDIUM PRIORITY: Complete Part B (Missing UI)
1. Implement `DayCard.tsx` (~70 lines, 1 hour)
2. Implement `TaskCard.tsx` (~60 lines, 1 hour)
3. Implement `EmptyRoadmapState.tsx` (~40 lines, 30 min)
4. Update RoadmapTree to render full 5-level hierarchy (30 min)

**Estimated Time**: 3 hours
**Impact**: Enables full 5-level hierarchy visualization

### 🟡 MEDIUM PRIORITY: Complete Part C (Testing)
1. Create E2E tests with 7-9 test cases (3 hours)
2. Create unit tests for MCP tools (2 hours)
3. Perform manual integration testing (2 hours)
4. Measure performance (30 min)

**Estimated Time**: 7.5 hours
**Impact**: Ensures quality and prevents regressions

---

## Notes

- **Neumorphic Design Applied**: All 8 existing components redesigned with neumorphic dark theme (coral/blue/slate color scheme)
- **Sidebar Integration**: Roadmap link added to sidebar, layout uses (authenticated) route group
- **TypeScript Errors**: 20 errors exist but NONE in roadmap code (all in knowledge/skills APIs)
- **Database Schema**: All 4 models exist in schema but migrations status unclear (may be in baseline_schema)

**Verification Report**: See [sprint-8.5-phase1-verification.md](.agent/task/sprint-8.5-phase1-verification.md) for complete evidence-based verification.
