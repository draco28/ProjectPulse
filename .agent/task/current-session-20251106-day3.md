# Sprint 1 Day 3 Session - Schema Validation & Utility Functions

**Date**: 2025-11-06
**Session Type**: Implementation (Day 3 of Sprint 1)
**Branch**: feature/sprint-1-foundation
**Phase**: Sprint 1 - Foundation Setup (Week 1, Day 3)

---

## Session Goals

### Primary Objective

Create utility functions for progress roll-up, tree queries, and Zod validation to complete Sprint 1 Day 3 requirements.

### User Story Focus

- **US-014**: Validate hierarchy integrity (no orphaned tasks) - 2 points
- **US-002**: Update progress with roll-up (foundation)
- **US-003**: Retrieve current active task (query helpers)

### Success Criteria

1. ✅ Progress roll-up function working (Session → Phase propagation)
2. ✅ Tree query helpers implemented (getFullTree, getChildren, getParent)
3. ✅ Zod validation schemas created (5 schemas + custom validators)
4. ✅ Database tests passing (14 new tests across 3 test files)

---

## Day 2 Completion Summary

**Status**: 100% COMPLETE ✅

**What Works**:

- Prisma schema with 5 models (Phase, Week, Day, Task, Session)
- 25 indexes for query optimization
- Database migration applied successfully
- Seed data with 1 Phase, 2 Weeks, 7 Days, 10 Tasks, 3 Sessions
- Validation tests: 5/5 passing (2 cascade delete + 3 date filtering)

**Key Technical Decisions**:

- Adjacency list pattern for tree structure
- Application-managed progress roll-up (not database triggers)
- Cascade delete enabled on all FK relationships
- DateTime + composite indexes for date filtering

---

## Day 3 Implementation Plan

### Task 1: Create Progress Roll-Up Utility ⏳

**File**: `apps/web/lib/db/progress.ts`

**Functions**:

1. `calculateProgress(parentId, level)` - Calculate avg progress from children
2. `updateProgressAndPropagate(entityId, entityType, newProgress)` - Update and propagate up tree
3. `recalculateFullTree(phaseId)` - Recalculate entire Phase tree (integrity recovery)

**Algorithm**:

```
Session 100% complete → Task recalculates (avg of Sessions)
Task updated → Day recalculates (avg of Tasks)
Day updated → Week recalculates (avg of Days)
Week updated → Phase recalculates (avg of Weeks)
```

**Edge Cases**:

- No children: progress stays at current value
- Mixed statuses: calculate average regardless of status
- Concurrent updates: handle race conditions

### Task 2: Create Tree Query Helpers ⏳

**File**: `apps/web/lib/db/hierarchy.ts`

**Functions**:

1. `getFullTree(prisma, phaseId)` - Fetch Phase with all nested children
2. `getChildren<T>(prisma, parentId, level)` - Generic child fetcher
3. `getParent<T>(prisma, childId, level)` - Fetch parent entity
4. `getAllDescendants(prisma, entityId, entityType)` - Recursive descendant fetch

**Usage Example**:

```typescript
// Get all Days under Week 1
const days = await getChildren(prisma, week1Id, 'week');

// Get parent Week of Day 3
const week = await getParent(prisma, day3Id, 'day');
```

### Task 3: Create Zod Validation Schemas ⏳

**File**: `apps/web/lib/db/validation.ts`

**Schemas**:

1. `HierarchyBaseSchema` - Shared fields (title, status, progress, dates)
2. `PhaseSchema` - Phase-specific validation
3. `WeekSchema` - Week with phaseId
4. `DaySchema` - Day with weekId
5. `TaskSchema` - Task with dayId
6. `SessionSchema` - Session with taskId

**Custom Validators**:

- `validateDateRange(child, parent)` - Child dates within parent dates
- `validateProgress(progress)` - 0-100 validation
- `validateCircularReference(entityId, parentId)` - Prevent Phase → Phase

### Task 4: Create Database Tests ⏳

**Test File 1**: `apps/web/prisma/__tests__/hierarchy-crud.test.ts`

- Create Phase with nested structure (4 tests)

**Test File 2**: `apps/web/prisma/__tests__/progress-calculation.test.ts`

- Session → Task propagation
- Task → Day propagation
- Day → Week propagation
- Week → Phase propagation
- Edge case: No children
- Edge case: Mixed statuses
  (6 tests)

**Test File 3**: `apps/web/prisma/__tests__/hierarchy-integrity.test.ts`

- Detect orphaned Tasks
- Detect orphaned Sessions
- Validate circular references
- Validate date ranges
  (4 tests)

**Total**: 14 new tests

---

## File Structure

```
apps/web/
├── lib/
│   ├── db/                    ← CREATE DIRECTORY
│   │   ├── progress.ts        ← CREATE (Task 1)
│   │   ├── hierarchy.ts       ← CREATE (Task 2)
│   │   ├── validation.ts      ← CREATE (Task 3)
│   ├── db.ts                  ← EXISTS
│
├── prisma/
│   ├── __tests__/
│   │   ├── cascade-delete.test.ts     ← EXISTS (2/2 passing)
│   │   ├── date-filtering.test.ts     ← EXISTS (3/3 passing)
│   │   ├── hierarchy-crud.test.ts     ← CREATE (Task 4a)
│   │   ├── progress-calculation.test.ts ← CREATE (Task 4b)
│   │   ├── hierarchy-integrity.test.ts  ← CREATE (Task 4c)
```

---

## Dependencies

**Day 2 Complete**: ✅

- Prisma schema designed and migrated
- Seed data loaded
- Validation tests passing

**Day 3 Requires**:

- Day 2 schema and seed data (available)
- Prisma client (available at lib/db.ts)
- Jest test environment (configured)

---

## Token Budget

- Task 1 (progress.ts): ~8K tokens
- Task 2 (hierarchy.ts): ~6K tokens
- Task 3 (validation.ts): ~5K tokens
- Task 4 (3 test files): ~12K tokens
- Test execution & verification: ~3K tokens
- Memory bank updates: ~2K tokens

**Total Estimated**: ~36K tokens (18% of 200K limit)

---

## Risks & Mitigation

**Risk 1**: Progress calculation edge cases

- **Mitigation**: Comprehensive test coverage (6 tests for progress-calculation.test.ts)

**Risk 2**: Generic TypeScript types for getChildren/getParent

- **Mitigation**: Use Prisma generated types (Phase, Week, Day, Task, Session)

**Risk 3**: Test cleanup (orphaned test data)

- **Mitigation**: Follow cascade-delete.test.ts pattern with afterAll cleanup

---

## Session Checkpoints

- **Checkpoint 1** (15K tokens): Tasks 1-2 complete (progress.ts + hierarchy.ts)
- **Checkpoint 2** (30K tokens): Task 3 complete (validation.ts) + Test file 1 created
- **Checkpoint 3** (36K tokens): All tests passing, session complete

---

## Next Steps After Day 3

**Day 4-5**: MCP Server Scaffold

- Initialize MCP server project structure
- Configure stdio transport
- Implement first MCP tool (sprint.phase.create)
- Test MCP connection with Claude Code

---

## Session Complete ✅

**Summary**:

- ✅ All 3 utility files implemented (progress.ts, hierarchy.ts, validation.ts)
- ✅ All 3 test files created (17 new tests)
- ✅ 22/22 tests passing (5 existing + 17 new)
- ✅ US-014 complete (hierarchy integrity validation)
- ✅ Progress roll-up working (Session → Phase propagation)

**Key Technical Achievement**:
Fixed incremental transaction pattern - recursive propagation now happens AFTER transaction commits, preventing nested transaction issues and ensuring correct progress roll-up across all 5 levels.

**Files Created**:

1. `apps/web/lib/db/progress.ts` (282 lines) - Progress propagation with incremental transactions
2. `apps/web/lib/db/hierarchy.ts` (251 lines) - Tree query helpers with type-safe generics
3. `apps/web/lib/db/validation.ts` (324 lines) - Zod schemas + custom validators
4. `apps/web/prisma/__tests__/hierarchy-crud.test.ts` (4 tests passing)
5. `apps/web/prisma/__tests__/progress-calculation.test.ts` (7 tests passing)
6. `apps/web/prisma/__tests__/hierarchy-integrity.test.ts` (6 tests passing)

**Token Usage**: ~65K tokens (32.5% of 200K budget)

**Session Start**: 2025-11-06
**Session End**: 2025-11-06
**Session Status**: ✅ COMPLETE - Day 3 100%
