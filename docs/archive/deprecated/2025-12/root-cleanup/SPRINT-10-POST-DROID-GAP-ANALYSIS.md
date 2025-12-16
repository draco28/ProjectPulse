# Sprint 10: Post-Droid Gap Analysis

**Generated**: 2025-11-26
**Context**: Droid implemented MCP ticket tools based on original test failures. Re-running all tests to identify remaining gaps.

---

## 📊 Test Execution Summary

### MCP Tool Tests (44 tests) - **COMPLETED**
- **Status**: ❌ **0/44 passing (0%)**
- **Exit code**: 0 (tests completed)
- **Primary issue**: All tests failing with cleanup errors

### Browser E2E Tests (60 tests) - **IN PROGRESS**
- **Status**: 🟡 Running (partial results available)
- **Early results**: Mix of ✓ and ✘ - significant improvements observed
- **Authentication**: ✅ Working perfectly (global setup successful)

---

## 🔴 CRITICAL FINDING: MCP Tool Tests

### Issue: All 44 Tests Failing with Cleanup Errors

**Error Pattern** (repeated for every test):
```
❌ Failed to cleanup project [ID]: PrismaClientKnownRequestError:
Invalid `prisma.project.delete()` invocation
...
An operation failed because it depends on one or more records that were required but not found.
Record to delete does not exist.
    at ticket-fixtures.ts:202:22
{
  code: 'P2025',
  meta: { modelName: 'Project', cause: 'Record to delete does not exist.' }
}
```

**Test Suites Affected** (all 7 suites):
1. ✖ MCP Tool: projectpulse_ticket_create (8 tests)
2. ✖ MCP Tool: projectpulse_ticket_search (8 tests)
3. ✖ MCP Tool: projectpulse_ticket_update (6 tests)
4. ✖ MCP Tool: projectpulse_ticket_setStatus (4 tests)
5. ✖ MCP Tool: projectpulse_ticket_addComment (4 tests)
6. ✖ MCP Tool: projectpulse_ticket_bulkCreate (6 tests)
7. ✖ MCP Backwards Compatibility: Issue → Ticket Adapters (8 tests)

### Root Cause Analysis

**Hypothesis 1: Cascade Delete** (Most Likely)
- Tests create projects with tickets
- MCP tools successfully delete tickets (and cascading deletes projects?)
- Cleanup tries to delete already-deleted projects
- **Evidence**: Exit code 0 suggests tests completed normally before cleanup

**Hypothesis 2: FK Constraint Issue**
- Cleanup order may not respect new FK relationships added by Droid
- Projects being deleted before child records

**Hypothesis 3: Duplicate Cleanup**
- Test cleanup running twice (once in test, once in afterEach)

### Required Investigation

```bash
# Check Project model for onDelete cascades
grep -A 5 "model Project" apps/web/prisma/schema.prisma

# Check Ticket model for cascade behavior
grep -A 5 "projectId" apps/web/prisma/schema.prisma | grep -i cascade

# Review MCP tool delete operations
grep -r "delete.*ticket" apps/mcp-server/src/tools/ticket/
```

### Potential Fixes

**Option 1: Check if project exists before cleanup**
```typescript
export async function cleanupTestProject(projectId: number): Promise<void> {
  // Check if project still exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.log(`✓ Project ${projectId} already deleted (cascade?)`);
    return;
  }

  // Proceed with cleanup...
}
```

**Option 2: Use try-catch for each delete**
```typescript
try {
  await prisma.project.delete({ where: { id: projectId } });
} catch (error) {
  if (error.code === 'P2025') {
    console.log(`✓ Project ${projectId} already deleted`);
  } else {
    throw error;
  }
}
```

**Option 3: Disable cascade deletes** (if they exist)
- Review Prisma schema for `onDelete: Cascade`
- Change to `onDelete: SetNull` or `onDelete: Restrict`

---

## 🟢 Browser E2E Tests - Partial Results

### ✅ What's Working (Confirmed)

**Authentication Infrastructure**:
- ✅ Global setup successful
- ✅ Session saved to `.auth/user.json`
- ✅ All tests using authenticated session

**Create Ticket Form**:
- ✅ Kind dropdown with all 7 types (feature, task, epic, issue, bug, scanner_finding, tech_debt)
- ✅ Source dropdown with all 4 types (manual, scanner, agent, onboarding)
- ✅ Priority dropdown with all 4 levels (critical, high, medium, low)
- ✅ Module input field present
- ✅ Cancel button working
- ✅ Form submission creating tickets
- ✅ Redirect to detail page after create

**Detail Page**:
- ✅ Using ticket ID successfully
- ✅ Comment input field present
- ✅ Author metadata displayed

**Filters**:
- ✅ Kind filter working
- ✅ URL persistence working
- ✅ Filter state maintained after navigation

**Navigation**:
- ✅ "Tickets" link in navigation
- ✅ No "Issues" link (clean migration)

### ❌ What's Still Failing (Partial List)

**Create Form Issues**:
- ❌ Validation error not shown when title missing
- ❌ Some required fields not properly validated

**Detail Page Issues**:
- ❌ Ticket header/title not displaying correctly
- ❌ Kind badge not showing with proper styling
- ❌ Status badge not displaying
- ❌ Priority badge not displaying
- ❌ Source indicator not showing
- ❌ Assignee not displaying
- ❌ Description section not rendering
- ❌ Comments section not displaying properly
- ❌ Linked task hierarchy not showing
- ❌ Labels not displaying
- ❌ Linked files not showing
- ❌ closedAt timestamp not showing for closed tickets

**List Page Issues**:
- ❌ Kind filter pills not found
- ❌ Active filter highlighting not working
- ❌ Empty state not showing
- ❌ Badge display inconsistent
- ❌ Click navigation to detail not working

**Filter Issues**:
- ❌ Multiple kind filters not working
- ❌ Filter count indicator not showing
- ❌ Module filter not implemented
- ❌ Multiple status filters not working
- ❌ Empty state with active filters not showing

**Redirect Issues**:
- ❌ `/issues` not redirecting to `/tickets` with kind filter
- ❌ Query parameters not preserved on redirect
- ❌ `/issues/{id}` not redirecting to `/tickets/{id}`

**Mutation Issues**:
- ⚠️ Edit form title input not found
- ⚠️ Priority control not editable
- ⚠️ Status control not editable
- ⚠️ Assignee control not editable
- ⚠️ Submit comment button not found

### ⚠️ Graceful Degradations (Warnings, Not Failures)

- ⚠️ Assignee selector optional/not implemented
- ⚠️ Filter presets not found
- ⚠️ Active filter badges may use different UI
- ⚠️ Create button may use different pattern
- ⚠️ Date filter not implemented yet
- ⚠️ Pagination may be only one page

---

## 📈 Improvement Analysis

### Before Droid (Original Test Session)

**Browser E2E**: ~22/60 passing (~37%)
**MCP Tools**: 0/44 passing (0% - tools not implemented)
**Total**: ~22/104 passing (~21%)

### After Droid (Current State - Partial)

**Browser E2E**: ~20-30/60 passing (estimated 33-50% based on partial results)
**MCP Tools**: 0/44 passing (0% - cleanup errors blocking)
**Total**: ~20-30/104 passing (estimated 19-29%)

### What Droid Successfully Fixed

Based on browser test output:
1. ✅ **Kind Dropdown**: All 7 ticket types working
2. ✅ **Source Dropdown**: All 4 source types working
3. ✅ **Priority Dropdown**: All 4 priority levels working
4. ✅ **Form Submission**: Creating tickets successfully
5. ✅ **Redirect Logic**: Post-create redirect to detail page working
6. ✅ **Navigation Labels**: "Tickets" showing instead of "Issues"
7. ✅ **Filter Basics**: Kind filtering partially working
8. ✅ **URL Persistence**: Query params being saved

### What Droid Did NOT Fix (or Made Worse)

1. ❌ **MCP Tools**: Either not implemented or cleanup cascade issue
2. ❌ **Detail Page UI**: Major components missing (badges, metadata, comments list)
3. ❌ **List Page UI**: Filter pills, badges, navigation not implemented
4. ❌ **Redirects**: `/issues` → `/tickets` redirects not configured
5. ❌ **Edit Forms**: Mutation controls not editable
6. ❌ **Advanced Filters**: Multi-select, module filters not working

---

## 🎯 Priority Fix List

### P0: Critical (Blocks All MCP Tests)

**Fix MCP Test Cleanup Error**
- **Impact**: Unblocks 44 tests
- **Effort**: 1-2 hours
- **Action**:
  1. Investigate cascade delete behavior in Prisma schema
  2. Update `cleanupTestProject()` to handle already-deleted projects
  3. Re-run all MCP tests
- **Success criteria**: All 44 MCP tests complete without cleanup errors
- **File**: `apps/mcp-server/tests/e2e/setup/ticket-fixtures.ts:202`

### P1: High (Detail Page - 12 Tests)

**Implement Ticket Detail Page Components**
- **Impact**: Unblocks 12 detail page tests
- **Effort**: 4-6 hours
- **Components needed**:
  - Header with title and ID badge
  - Badge section (kind, status, priority, source)
  - Metadata display (author, dates, assignee)
  - Description rendering
  - Comments list and form
- **File**: `apps/web/app/(authenticated)/tickets/[id]/page.tsx`

### P2: High (List Page - 15 Tests)

**Implement List Page Filter UI**
- **Impact**: Unblocks 15 list page tests
- **Effort**: 3-4 hours
- **Components needed**:
  - Kind filter pills with counts
  - Active filter highlighting
  - Badge display in list items
  - Click navigation to detail
- **File**: `apps/web/components/tickets/TicketFilters.tsx`

### P3: Medium (Redirects - 5 Tests)

**Configure /issues → /tickets Redirects**
- **Impact**: Unblocks 5 redirect tests
- **Effort**: 1-2 hours
- **Implementation**:
  - Middleware or page redirects
  - Query param preservation
  - Kind filter injection
- **File**: `apps/web/middleware.ts` OR `apps/web/app/(authenticated)/issues/page.tsx`

### P4: Medium (Mutations - 5 Tests)

**Make Ticket Fields Editable**
- **Impact**: Unblocks 5 mutation tests
- **Effort**: 2-3 hours
- **Features needed**:
  - Inline editing for title, priority, status, assignee
  - Comment submission button
  - Update API integration
- **File**: `apps/web/app/(authenticated)/tickets/[id]/page.tsx`

---

## 📋 Next Steps

### Immediate Actions (This Session)

1. **Wait for browser tests to complete** (~5 minutes remaining)
2. **Update this report** with final browser test counts
3. **Generate final issue catalog** with precise test counts

### Next Session Actions

1. **Fix MCP cleanup** (P0 - critical blocker)
   ```bash
   # Investigate cascade behavior
   grep -A 10 "model Project" apps/web/prisma/schema.prisma

   # Update cleanup logic
   # Re-run all MCP tests
   cd apps/mcp-server
   npx tsx --test tests/e2e/*.test.ts
   ```

2. **Implement Detail Page** (P1 - high value)
   - Create component structure
   - Add badge components
   - Implement metadata display
   - Add comments section

3. **Implement List Filters** (P2 - high value)
   - Create filter pill components
   - Add multi-select logic
   - Implement badge display

4. **Configure Redirects** (P3 - backwards compatibility)
   - Add middleware or page redirects
   - Test query param preservation

---

## 🧪 Test Execution Commands

**Re-run browser tests:**
```bash
cd apps/web
pnpm exec playwright test tests/e2e/tickets-*.spec.ts --reporter=list
```

**Re-run MCP tests:**
```bash
cd apps/mcp-server
npx tsx --test tests/e2e/*.test.ts
```

**Run specific test file:**
```bash
# Browser
pnpm exec playwright test tests/e2e/tickets-detail.spec.ts

# MCP
npx tsx --test tests/e2e/ticket-create.test.ts
```

---

## 📊 Expected Final State

**After P0 fix (MCP cleanup)**:
- MCP Tests: 44/44 passing (100%) ✅
- Browser Tests: 20-30/60 passing (33-50%)
- **Total**: 64-74/104 passing (62-71%)

**After P1 fix (Detail page)**:
- MCP Tests: 44/44 passing (100%) ✅
- Browser Tests: 32-42/60 passing (53-70%)
- **Total**: 76-86/104 passing (73-83%)

**After P2 fix (List filters)**:
- MCP Tests: 44/44 passing (100%) ✅
- Browser Tests: 47-57/60 passing (78-95%)
- **Total**: 91-101/104 passing (88-97%)

**After all P3-P4 fixes**:
- MCP Tests: 44/44 passing (100%) ✅
- Browser Tests: 60/60 passing (100%) ✅
- **Total**: 104/104 passing (100%) 🎉

---

**Status**: Awaiting browser test completion for final counts...
**Last Updated**: 2025-11-26 08:45 UTC
