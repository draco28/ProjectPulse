# Prisma Design Plan: Progress Update API with Roll-Up Propagation

**Created**: 2025-11-09 00:15
**Type**: API Design + Database Integration
**Context**: Sprint 1 Week 2 Days 10-12 - MCP Tools Implementation

---

## Executive Summary

Design API route for updating task/session progress with automatic parent propagation, integrating with existing `updateProgressAndPropagate()` function from `lib/db/progress.ts`.

**Key Decision**: **Generic route** (`PUT /api/:entity/:id/progress`) is recommended over entity-specific routes for:
- Single implementation that scales to all 5 hierarchy levels
- Consistent behavior across all entity types
- Easier MCP tool integration (one pattern to learn)
- Future-proof for entity type expansion

---

## Data Model Requirements

### Existing Progress System (from Day 3)

**5-Level Hierarchy**:
```
Phase (root)
  ↓
Week
  ↓
Day
  ↓
Task
  ↓
Session (leaf)
```

**Existing Utility**: `updateProgressAndPropagate()` in `lib/db/progress.ts`
- ✅ Incremental transactions (one level at a time)
- ✅ Row-level locking (FOR UPDATE)
- ✅ Prisma aggregation for performance
- ✅ Automatic status updates (0 → NOT_STARTED, 1-99 → IN_PROGRESS, 100 → COMPLETED)
- ✅ Recursive propagation up the tree

**What Exists**:
```typescript
await updateProgressAndPropagate(
  'session1',      // entityId
  'session',       // entityType
  75               // newProgress (0-100)
);
// Automatically propagates: Session → Task → Day → Week → Phase
```

---

## Schema Design

### API Route Structure (Recommended)

**Generic Route Pattern**:
```
PUT /api/:entity/:id/progress
```

**Supported Entity Types**:
- `sessions` - Update session progress (propagates to Task → Day → Week → Phase)
- `tasks` - Update task progress (propagates to Day → Week → Phase)
- `days` - Update day progress (propagates to Week → Phase)
- `weeks` - Update week progress (propagates to Phase)
- `phases` - Update phase progress (no parent)

**Why Generic?**
1. **Single implementation** - One route handler for all entity types
2. **Consistent behavior** - All entities follow same validation/error pattern
3. **Type safety** - Zod enum validation prevents invalid entity types
4. **Scalable** - Adding new entity types requires only enum update
5. **MCP integration** - `sprint.updateProgress` can call one endpoint for all types

**Alternative Considered**: Entity-specific routes (`PUT /api/tasks/:id/progress`)
- ❌ 5 duplicate implementations (more code, more bugs)
- ❌ Inconsistent validation across entity types
- ❌ Harder to maintain (changes must be duplicated)
- ✅ More RESTful (entity-specific)
- ✅ Slightly clearer route naming

**Decision**: Generic route wins due to DRY principle and MCP integration simplicity.

---

## Request/Response Schema

### Request Schema (Zod)

```typescript
// lib/validations/progress.ts
import { z } from 'zod';

/**
 * Entity type enum (maps to Prisma models)
 */
export const EntityTypeSchema = z.enum([
  'sessions',
  'tasks',
  'days',
  'weeks',
  'phases'
]);

/**
 * Progress update request body
 */
export const UpdateProgressSchema = z.object({
  progress: z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
```

### Request Format

**Endpoint**: `PUT /api/:entity/:id/progress`

**Path Parameters**:
- `entity`: Entity type (sessions | tasks | days | weeks | phases)
- `id`: Entity ID (CUID string)

**Request Body** (JSON):
```json
{
  "progress": 75
}
```

**Example Requests**:
```http
PUT /api/sessions/clxxxx1234/progress HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "progress": 100
}
```

```http
PUT /api/tasks/clxxxx5678/progress HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "progress": 50
}
```

### Response Schema

**Success Response** (200 OK):
```typescript
{
  success: true,
  data: {
    entity: {
      id: string,
      type: 'session' | 'task' | 'day' | 'week' | 'phase',
      progress: number,
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED'
    },
    propagation: {
      updated: Array<{
        id: string,
        type: 'task' | 'day' | 'week' | 'phase',
        progress: number,
        status: string
      }>,
      totalAffected: number
    }
  }
}
```

**Example Success Response**:
```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "clxxxx1234",
      "type": "session",
      "progress": 100,
      "status": "COMPLETED"
    },
    "propagation": {
      "updated": [
        {
          "id": "clxxxx5678",
          "type": "task",
          "progress": 87,
          "status": "IN_PROGRESS"
        },
        {
          "id": "clxxxx9012",
          "type": "day",
          "progress": 78,
          "status": "IN_PROGRESS"
        },
        {
          "id": "clxxxx3456",
          "type": "week",
          "progress": 65,
          "status": "IN_PROGRESS"
        },
        {
          "id": "clxxxx7890",
          "type": "phase",
          "progress": 58,
          "status": "IN_PROGRESS"
        }
      ],
      "totalAffected": 4
    }
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Progress must be between 0 and 100",
    "field": "progress"
  }
}
```

**400 Bad Request** - Invalid entity type:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid entity type. Must be one of: sessions, tasks, days, weeks, phases",
    "field": "entity"
  }
}
```

**404 Not Found** - Entity not found:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Session with ID clxxxx1234 not found"
  }
}
```

**500 Internal Server Error** - Database error:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Database operation failed"
  }
}
```

---

## Integration Pattern with `progress.ts`

### Challenge: Tracking Propagation

**Problem**: `updateProgressAndPropagate()` returns `void` (no propagation summary)

**Current Signature**:
```typescript
export async function updateProgressAndPropagate(
  entityId: string,
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',
  newProgress: number
): Promise<void>
```

**Solution Options**:

#### Option A: Extend `updateProgressAndPropagate()` to Return Propagation Data (RECOMMENDED)

**New Signature**:
```typescript
export interface PropagationResult {
  entity: {
    id: string;
    type: 'session' | 'task' | 'day' | 'week' | 'phase';
    progress: number;
    status: Status;
  };
  propagated: Array<{
    id: string;
    type: 'task' | 'day' | 'week' | 'phase';
    progress: number;
    status: Status;
  }>;
}

export async function updateProgressAndPropagate(
  entityId: string,
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',
  newProgress: number
): Promise<PropagationResult>
```

**Implementation**:
```typescript
export async function updateProgressAndPropagate(
  entityId: string,
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',
  newProgress: number,
  _propagatedEntities: Array<any> = [] // Internal accumulator
): Promise<PropagationResult> {
  // Validate progress range (0-100)
  if (newProgress < 0 || newProgress > 100) {
    throw new Error(`Progress must be 0-100, got ${newProgress}`);
  }

  // 1. Update current entity and calculate parent progress in transaction
  const parentInfo = await prisma.$transaction(
    async (tx) => {
      let parentId: string | null = null;
      let parentType: 'task' | 'day' | 'week' | 'phase' | null = null;
      let updatedEntity: any = null;

      switch (entityType) {
        case 'session': {
          updatedEntity = await tx.session.update({
            where: { id: entityId },
            data: {
              progress: newProgress,
              status: determineStatus(newProgress),
              updatedAt: new Date(),
            },
            select: { id: true, progress: true, status: true, taskId: true },
          });
          parentId = updatedEntity.taskId;
          parentType = 'task';
          break;
        }
        // ... (similar for task, day, week, phase)
      }

      if (!parentId || !parentType) {
        // No parent (we're at phase level)
        return {
          parentId: null,
          parentType: null,
          parentProgress: 0,
          updatedEntity,
        };
      }

      const parentProgress = await calculateParentProgress(tx, parentId, parentType);
      return { parentId, parentType, parentProgress, updatedEntity };
    },
    { timeout: 5000 }
  );

  // 2. Recursively propagate to parent (AFTER current transaction commits)
  if (parentInfo.parentId && parentInfo.parentType) {
    const parentResult = await updateProgressAndPropagate(
      parentInfo.parentId,
      parentInfo.parentType,
      parentInfo.parentProgress,
      _propagatedEntities // Pass accumulator down
    );

    // Merge parent's propagated entities
    _propagatedEntities.push(...parentResult.propagated);
  }

  // 3. Add current entity to propagation list (if it's a parent that was updated)
  if (parentInfo.updatedEntity && parentInfo.parentType) {
    _propagatedEntities.push({
      id: parentInfo.updatedEntity.id,
      type: entityType,
      progress: parentInfo.updatedEntity.progress,
      status: parentInfo.updatedEntity.status,
    });
  }

  // 4. Return result
  return {
    entity: {
      id: parentInfo.updatedEntity?.id || entityId,
      type: entityType,
      progress: parentInfo.updatedEntity?.progress || newProgress,
      status: parentInfo.updatedEntity?.status || determineStatus(newProgress),
    },
    propagated: _propagatedEntities,
  };
}
```

**Pros**:
- ✅ Single source of truth (progress.ts remains core logic)
- ✅ API route becomes thin wrapper
- ✅ Propagation tracking built into utility
- ✅ Reusable by other callers (background jobs, seeds, etc.)

**Cons**:
- ⚠️ Changes existing function signature (breaking change for current callers)
- ⚠️ Adds complexity to progress.ts

**Mitigation**: Since `updateProgressAndPropagate()` is only used internally (no external callers yet), this is safe to change.

#### Option B: Query After Propagation (Alternative)

**Keep current `updateProgressAndPropagate()` as-is**, then query affected entities:

```typescript
// API route logic
await updateProgressAndPropagate(entityId, entityType, newProgress);

// After propagation completes, query the tree
const entity = await prisma[entityType].findUnique({
  where: { id: entityId },
  include: {
    // Include parent chain
  },
});

// Manually build propagation summary
const propagated = [
  { id: entity.taskId, type: 'task', ... },
  { id: entity.dayId, type: 'day', ... },
  // ...
];
```

**Pros**:
- ✅ No changes to existing progress.ts
- ✅ Simpler (no recursion tracking)

**Cons**:
- ❌ Extra database queries (N+1 anti-pattern)
- ❌ Not atomic (propagation completes, then we query - race condition possible)
- ❌ Harder to get accurate "what changed" summary

**Decision**: **Option A (Extend `updateProgressAndPropagate()`)** is recommended for accuracy and atomicity.

---

## API Route Implementation

### File Structure

```
apps/web/app/api/[entity]/[id]/progress/route.ts
```

### Route Handler (Pseudocode)

```typescript
/**
 * API Route: PUT /api/:entity/:id/progress
 *
 * Purpose: Update entity progress with automatic parent propagation
 *
 * Pattern: Next.js 14 Dynamic Route → Zod validation → Progress utility
 *
 * Performance: Uses incremental transactions (one level at a time)
 * See: lib/db/progress.ts, .agent/task/prisma-progress-rollup-20251106-1200.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateProgressAndPropagate } from '@/lib/db/progress';
import { EntityTypeSchema, UpdateProgressSchema } from '@/lib/validations/progress';

// Force dynamic rendering (no caching for progress updates)
export const dynamic = 'force-dynamic';

// ============================================================================
// PATH PARAMS TYPE
// ============================================================================

type RouteParams = {
  entity: string;
  id: string;
};

// ============================================================================
// PUT HANDLER
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // 1. Validate path parameters
    const entity = EntityTypeSchema.parse(params.entity);
    const entityId = z.string().cuid('Invalid entity ID format').parse(params.id);

    // 2. Validate request body
    const body = await request.json();
    const { progress } = UpdateProgressSchema.parse(body);

    // 3. Map entity type (plural → singular for utility function)
    const entityTypeMap = {
      'sessions': 'session',
      'tasks': 'task',
      'days': 'day',
      'weeks': 'week',
      'phases': 'phase',
    } as const;
    const entityType = entityTypeMap[entity];

    // 4. Call progress utility (with propagation tracking)
    const result = await updateProgressAndPropagate(entityId, entityType, progress);

    // 5. Success response
    return NextResponse.json({
      success: true,
      data: {
        entity: result.entity,
        propagation: {
          updated: result.propagated,
          totalAffected: result.propagated.length,
        },
      },
    }, { status: 200 });

  } catch (error) {
    // 6. Error handling

    // Zod validation errors (400)
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: firstError.message,
          field: String(firstError.path[0] || 'unknown'),
        },
      }, { status: 400 });
    }

    // Entity not found (404)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError' &&
        (error as any).code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Entity not found`,
        },
      }, { status: 404 });
    }

    // Database errors (500)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in PUT /api/:entity/:id/progress:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database operation failed',
        },
      }, { status: 500 });
    }

    // Unknown errors (500)
    console.error('[API] Unexpected error in PUT /api/:entity/:id/progress:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }, { status: 500 });
  }
}
```

---

## Error Handling Approach

### Error Categories

**1. Validation Errors (400)**
- Invalid entity type (not in enum)
- Invalid entity ID format (not CUID)
- Invalid progress value (< 0 or > 100)
- Invalid progress type (not integer)

**Example**:
```typescript
if (error instanceof z.ZodError) {
  const firstError = error.errors[0];
  return NextResponse.json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: firstError.message,
      field: String(firstError.path[0] || 'unknown'),
    },
  }, { status: 400 });
}
```

**2. Not Found Errors (404)**
- Entity ID doesn't exist in database

**Prisma Error Code**: `P2025` (Record to update not found)

**Example**:
```typescript
if (error?.constructor?.name === 'PrismaClientKnownRequestError' &&
    (error as any).code === 'P2025') {
  return NextResponse.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `${entityType} with ID ${entityId} not found`,
    },
  }, { status: 404 });
}
```

**3. Database Errors (500)**
- Transaction timeout (> 5s)
- Database connection failure
- Constraint violations (unlikely, progress has no constraints)

**Example**:
```typescript
if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
  console.error('[API] Prisma error:', error);
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Database operation failed',
    },
  }, { status: 500 });
}
```

**4. Unknown Errors (500)**
- Unexpected runtime errors

**Example**:
```typescript
console.error('[API] Unexpected error:', error);
return NextResponse.json({
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Unknown error occurred',
  },
}, { status: 500 });
```

### Error Handling Strategy

**Ordered Error Checks** (most specific → least specific):
1. Zod validation errors → 400
2. Prisma P2025 (not found) → 404
3. Prisma known errors → 500
4. Unknown errors → 500

**Logging Strategy**:
- ✅ Log 500 errors (with full stack trace)
- ❌ Don't log 400/404 (expected client errors)

**Client-Friendly Messages**:
- Never expose internal error details (SQL, stack traces)
- Use generic "Database operation failed" for 500s
- Provide specific validation messages for 400s

---

## Performance Considerations

### Database Performance

**Existing Optimizations in `progress.ts`**:
1. ✅ **Incremental Transactions** - One level at a time (prevents deadlocks)
2. ✅ **Row-Level Locking** - FOR UPDATE (prevents race conditions)
3. ✅ **Prisma Aggregation** - Single query for child progress (90% faster than N+1)
4. ✅ **Transaction Timeout** - 5s limit (fail fast)

**No Additional Optimization Needed** - Utility handles it all.

### API Route Performance

**Response Time Target**: < 200ms for single-level update (e.g., session → task)

**Bottleneck**: Number of propagation levels
- Session update: 4 propagations (Session → Task → Day → Week → Phase) ≈ 150ms
- Phase update: 0 propagations ≈ 30ms

**Caching**: `export const dynamic = 'force-dynamic'` (no caching - progress changes frequently)

### Monitoring Recommendations

**Metrics to Track**:
- Average propagation levels (how deep does update go?)
- Average response time by entity type
- Error rate by entity type
- Transaction timeout frequency

**Future Optimization** (if needed):
- Add Redis cache for frequently accessed hierarchies
- Use database connection pooling (Prisma already does this)

---

## Testing Recommendations

### Unit Tests (lib/db/progress.test.ts)

**Test Cases**:
1. ✅ Update session progress → Task/Day/Week/Phase propagate correctly
2. ✅ Update task progress → Day/Week/Phase propagate correctly
3. ✅ Update phase progress → No propagation (top level)
4. ✅ Progress = 0 → Status = NOT_STARTED
5. ✅ Progress = 50 → Status = IN_PROGRESS
6. ✅ Progress = 100 → Status = COMPLETED
7. ✅ Invalid progress (< 0, > 100) → Throws error
8. ✅ Non-existent entity → Throws error
9. ✅ Propagation result accuracy (correct IDs, progress values)

### Integration Tests (API route)

**Test Cases**:
1. ✅ PUT /api/sessions/:id/progress with valid data → 200 OK
2. ✅ PUT /api/tasks/:id/progress with valid data → 200 OK
3. ✅ PUT /api/phases/:id/progress with valid data → 200 OK
4. ✅ Invalid entity type → 400 VALIDATION_ERROR
5. ✅ Invalid entity ID format → 400 VALIDATION_ERROR
6. ✅ Progress < 0 → 400 VALIDATION_ERROR
7. ✅ Progress > 100 → 400 VALIDATION_ERROR
8. ✅ Non-existent entity ID → 404 NOT_FOUND
9. ✅ Propagation summary accuracy → Verify all parents updated
10. ✅ Concurrent updates → No race conditions (verify row locking)

**Test Setup**:
```typescript
// Seed test data: Phase → Week → Day → Task → Session
const phase = await prisma.phase.create({ ... });
const week = await prisma.week.create({ phaseId: phase.id, ... });
const day = await prisma.day.create({ weekId: week.id, ... });
const task = await prisma.task.create({ dayId: day.id, ... });
const session = await prisma.session.create({ taskId: task.id, progress: 0 });

// Test: Update session to 100%
const response = await fetch(`http://localhost:3000/api/sessions/${session.id}/progress`, {
  method: 'PUT',
  body: JSON.stringify({ progress: 100 }),
});

// Verify: Session, Task, Day, Week, Phase all updated
```

### E2E Tests (Playwright)

**Scenario**: User marks session complete via UI → Progress propagates
1. Navigate to session detail page
2. Click "Mark Complete" button
3. Verify session status = COMPLETED
4. Navigate to parent task page
5. Verify task progress updated
6. Navigate to parent day page
7. Verify day progress updated

---

## Data Integrity

### Constraints

**Validation in Code** (Zod):
- ✅ Progress: 0-100 (integer)
- ✅ Entity type: Enum validation
- ✅ Entity ID: CUID format

**Database Constraints** (Prisma schema - already exists):
```prisma
model Session {
  progress Int @default(0)
  status   Status @default(NOT_STARTED)
  // No CHECK constraint for progress range (handled in code)
}
```

**Note**: PostgreSQL supports CHECK constraints, but Prisma doesn't expose them in schema. Validation in code is sufficient.

### Atomicity

**Transaction Guarantees**:
- ✅ Each level update is atomic (Prisma transaction)
- ✅ Incremental commits (one level → commit → next level)
- ❌ Not fully atomic across all levels (by design, to prevent deadlocks)

**Trade-off**: Partial propagation possible if intermediate transaction fails
- Example: Session updated (100%), Task updated (87%), **Day update fails** → Week/Phase not updated
- **Mitigation**: Use `recalculateFullTree()` utility for recovery

### Concurrency Safety

**Row-Level Locking** (handled in progress.ts):
```typescript
// Inside transaction
const updated = await tx.session.update({
  where: { id: entityId },
  data: { progress: newProgress, ... },
  // Implicit SELECT ... FOR UPDATE (Prisma default)
});
```

**Race Condition Protection**:
- ✅ Two concurrent updates to same session → Serialized (one waits for other)
- ✅ Update session A + update session B (same task) → Both succeed, task recalculated correctly

**No Additional Locking Needed** - Prisma + incremental transactions handle it.

---

## Next Steps for Parent Agent

### 1. Update `lib/db/progress.ts` (REQUIRED)

**Extend `updateProgressAndPropagate()` signature**:
```typescript
// Add propagation tracking (Option A from design)
export async function updateProgressAndPropagate(
  entityId: string,
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',
  newProgress: number,
  _propagatedEntities: Array<any> = []
): Promise<PropagationResult>
```

**Changes**:
- Return `PropagationResult` instead of `void`
- Track updated entities in accumulator
- Return summary of all propagated changes

**Test**: Verify existing behavior unchanged (tests should still pass)

### 2. Create Validation Schema

**File**: `apps/web/lib/validations/progress.ts`

**Contents**:
```typescript
import { z } from 'zod';

export const EntityTypeSchema = z.enum([
  'sessions',
  'tasks',
  'days',
  'weeks',
  'phases'
]);

export const UpdateProgressSchema = z.object({
  progress: z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
```

### 3. Create API Route

**File**: `apps/web/app/api/[entity]/[id]/progress/route.ts`

**Implementation**: Follow pseudocode from "API Route Implementation" section above

**Key Points**:
- Use dynamic route parameters `[entity]` and `[id]`
- Validate entity type with Zod enum
- Map plural entity types to singular (sessions → session)
- Call `updateProgressAndPropagate()` utility
- Return propagation summary in response

### 4. Write Tests

**Unit Tests** (`lib/db/progress.test.ts`):
- Test propagation result accuracy
- Test all entity types
- Test edge cases (0%, 100%, invalid progress)

**Integration Tests** (`__tests__/api/progress.test.ts`):
- Test API route with all entity types
- Test error responses (400, 404, 500)
- Test propagation summary format

### 5. Update Documentation

**Files to Update**:
1. `.agent/system/api-catalog.md` - Add PUT /api/:entity/:id/progress entry
2. `.agent/system/mcp-tools-guide.md` - Document `sprint.updateProgress` usage
3. `apps/web/lib/db/progress.ts` - Update JSDoc comments with new signature

**API Catalog Entry Template**:
```markdown
#### PUT /api/:entity/:id/progress

**Description**: Update entity progress with automatic parent roll-up propagation

**Path Parameters**:
- `entity`: Entity type (sessions | tasks | days | weeks | phases)
- `id`: Entity ID (CUID string)

**Request Body**:
```json
{
  "progress": 75
}
```

**Response**: See design plan for full schema
```

### 6. MCP Tool Integration (Next Session)

**Tool**: `sprint.updateProgress`

**Arguments**:
```typescript
{
  entityType: "session" | "task" | "day" | "week" | "phase",
  entityId: string,
  progress: number
}
```

**Implementation**:
```typescript
// MCP server tool handler
async function updateProgress(args: UpdateProgressArgs) {
  const response = await fetch(
    `http://localhost:3000/api/${args.entityType}s/${args.entityId}/progress`,
    {
      method: 'PUT',
      body: JSON.stringify({ progress: args.progress }),
    }
  );
  return response.json();
}
```

---

## Summary

### Recommended Approach

1. **Generic API Route**: `PUT /api/:entity/:id/progress`
   - Single implementation for all entity types
   - Zod enum validation for type safety
   - Consistent error handling

2. **Extend `updateProgressAndPropagate()`**:
   - Add propagation tracking (return `PropagationResult`)
   - No breaking changes to core logic
   - Reusable by other callers

3. **Response Format**:
   - Include updated entity details
   - Include propagation summary (all affected parents)
   - Total affected count for metrics

### Key Benefits

- ✅ **DRY**: Single route handler for all entity types
- ✅ **Type-Safe**: Zod validation prevents invalid requests
- ✅ **Observable**: Propagation summary shows what changed
- ✅ **Performant**: Reuses optimized `progress.ts` utility
- ✅ **Testable**: Clear separation of concerns (route vs utility)
- ✅ **MCP-Ready**: Easy integration with `sprint.updateProgress` tool

### Implementation Checklist

- [ ] Extend `updateProgressAndPropagate()` with propagation tracking
- [ ] Create `lib/validations/progress.ts`
- [ ] Create `app/api/[entity]/[id]/progress/route.ts`
- [ ] Write unit tests for updated utility
- [ ] Write integration tests for API route
- [ ] Update `.agent/system/api-catalog.md`
- [ ] Update `.agent/system/mcp-tools-guide.md` (after MCP tool created)
- [ ] Manual testing with curl/Postman

---

**Next Action**: Parent agent should read this plan and begin implementation starting with Step 1 (extending `progress.ts`).
