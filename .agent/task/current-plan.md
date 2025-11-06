# Sprint 1 Day 3 Implementation Plan

**Created**: 2025-11-06
**Phase**: Sprint 1 - Foundation Setup (Week 1, Day 3)
**Status**: ✅ COMPLETE

---

## Overview

Create utility functions for progress roll-up, tree queries, and Zod validation to complete Sprint 1 Day 3 requirements.

**User Stories**:

- US-014: Validate hierarchy integrity (no orphaned tasks) - 2 points
- US-002 Foundation: Update progress with roll-up
- US-003 Foundation: Retrieve current active task (query helpers)

---

## Implementation Steps

### Task 1: Create Progress Roll-Up Utility ✅

**File**: `apps/web/lib/db/progress.ts`

**Functions**:

1. `updateProgressAndPropagate()` - Update and propagate up tree
2. `recalculateFullTree()` - Recalculate entire Phase tree
3. Helpers: `determineStatus()`, `getParentId()`, `getParentType()`, `getChildType()`

**Algorithm**:

- Session 100% → Task recalculates (avg of Sessions)
- Task → Day → Week → Phase (propagates up)

**Architecture Decision**: Incremental transactions

- Each level updates in own transaction
- Recurse AFTER commit (not during)
- Prevents nested transaction issues

---

### Task 2: Create Tree Query Helpers ✅

**File**: `apps/web/lib/db/hierarchy.ts`

**Functions**:

1. `getFullTree()` - Phase with all nested children
2. `getChildren<T>()` - Generic child fetcher
3. `getParent<T>()` - Fetch parent entity
4. `getAllDescendants()` - Recursive traversal
5. `getCurrentTask()` - Find first IN_PROGRESS task

**Type Safety**: TypeScript conditional types for generics

---

### Task 3: Create Zod Validation Schemas ✅

**File**: `apps/web/lib/db/validation.ts`

**Schemas**: Phase, Week, Day, Task, Session

**Custom Validators**:

- `validateDateRange()` - Child dates within parent dates
- `validateProgress()` - 0-100 integer
- `validateCircularReference()` - Prevent Phase → Phase
- `validateStatusTransition()` - Valid state machine
- `validateHierarchyIntegrity()` - Full tree check (US-014)

---

### Task 4: Create Database Tests ✅

**hierarchy-crud.test.ts** (4 tests):

- Create Phase with nested structure
- Read with getFullTree
- Update Phase
- Delete Phase (cascade)

**progress-calculation.test.ts** (7 tests):

- Session → Task → Day → Week → Phase propagation
- Edge cases (no children, mixed statuses)
- recalculateFullTree

**hierarchy-integrity.test.ts** (6 tests):

- Orphaned Tasks/Sessions detection
- Circular reference validation
- Date range validation
- Progress validation
- Full integrity check

---

## Deliverables

**Files Created**:

1. `apps/web/lib/db/progress.ts` (282 lines)
2. `apps/web/lib/db/hierarchy.ts` (251 lines)
3. `apps/web/lib/db/validation.ts` (324 lines)
4. `apps/web/prisma/__tests__/hierarchy-crud.test.ts` (4 tests)
5. `apps/web/prisma/__tests__/progress-calculation.test.ts` (7 tests)
6. `apps/web/prisma/__tests__/hierarchy-integrity.test.ts` (6 tests)

**Total**: 17 new tests, 22/22 passing

---

## Success Criteria

- ✅ Progress roll-up working (Session → Phase)
- ✅ Tree query helpers implemented
- ✅ Zod validation schemas created
- ✅ Database tests passing (17 new, 22/22 total)
- ✅ US-014 complete (hierarchy integrity)
- ✅ Zero TypeScript errors
- ✅ Token budget: ~65K tokens (32.5% of 200K)

---

## Key Technical Achievement

**Fixed Incremental Transaction Pattern**:

- BEFORE: Recursive call inside transaction → nested transactions → failed
- AFTER: Return parent info, recurse AFTER commit → works perfectly

Ensures progress propagates correctly across all 5 levels.

---

## Next Steps (Day 4-5)

**MCP Server Scaffold**:

1. Initialize MCP server project structure
2. Configure stdio transport
3. Create tool registration system
4. Test MCP connection with Claude Code
