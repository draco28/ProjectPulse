# SOP: Implementing Generic API Routes in Next.js 14

## Purpose

Standard procedure for creating generic API routes that serve multiple entity types through a single implementation using Next.js 14 dynamic routes and Zod enum validation. This pattern reduces code duplication while maintaining type safety and consistent error handling.

## When to Use

**Use generic routes when:**
- Multiple entity types share the same operation pattern (e.g., progress update, status change)
- Request/response structure is identical across entities
- Validation rules are consistent (only entity type differs)
- You want to follow DRY principle and avoid duplicate code

**Use entity-specific routes when:**
- Different entities require different validation rules
- Business logic varies significantly between entity types
- Request/response formats differ substantially
- Complexity of generic handling outweighs code duplication

## Prerequisites

- Familiarity with Next.js 14 App Router dynamic routes
- Understanding of Zod validation schemas and enums
- Knowledge of TypeScript const assertions and type mapping
- Understanding of Prisma ORM naming conventions

---

## Decision Criteria: Generic vs Entity-Specific

### ✅ Good Candidates for Generic Routes

**Example**: Progress updates across session/task/day/week/phase
- **Same operation**: Update progress percentage (0-100)
- **Same validation**: Integer between 0-100
- **Same side effect**: Propagate to parent entities
- **Same response**: Entity + propagation summary

**Benefits**:
- 1 implementation instead of 5 duplicate routes
- Consistent validation and error handling
- Easier to maintain (one place for bug fixes)
- Reduced testing surface (test once for all entities)

### ❌ Poor Candidates for Generic Routes

**Example**: Entity creation with different required fields
- **Different validation**: Tasks need dayId, sessions need taskId
- **Different relationships**: Each entity has unique parent type
- **Different business logic**: Custom timestamps, defaults per entity
- **Complexity**: Generic handling becomes harder to read than separate routes

**Trade-off**: Added complexity of generic handling outweighs code reduction

---

## Core Pattern

Generic routes in Next.js 14 use:

1. **Dynamic route segments**: `[entity]`, `[id]`, `[action]`
2. **Zod enum validation**: Type-safe entity type checking
3. **Type mapping**: Convert plural routes to singular utility types
4. **Unified error handling**: Consistent across all entity types

**Directory structure**:
```
apps/web/app/api/
├── [entity]/                    # Dynamic entity type (sessions|tasks|days|weeks|phases)
│   └── [id]/                    # Dynamic entity ID (CUID)
│       └── progress/
│           └── route.ts         # PUT /api/:entity/:id/progress
```

**Routes**:
- `PUT /api/sessions/abc123/progress`
- `PUT /api/tasks/def456/progress`
- `PUT /api/days/ghi789/progress`
- `PUT /api/weeks/jkl012/progress`
- `PUT /api/phases/mno345/progress`

All served by **one implementation** at `[entity]/[id]/progress/route.ts`

---

## Procedure

### Step 1: Create Dynamic Route Directory Structure

Create the nested dynamic route directory.

**Command**:
```bash
# From workspace root
mkdir -p apps/web/app/api/[entity]/[id]/progress
```

**Gotcha**:
- On Windows, use PowerShell or Git Bash (CMD may fail with nested creation)
- Use `-p` flag to create parent directories if they don't exist
- Brackets `[entity]` and `[id]` are literal directory names (Next.js convention)

**File location**: `apps/web/app/api/[entity]/[id]/progress/route.ts`

---

### Step 2: Define Zod Validation Schemas

Create validation file for entity types and request schema.

**File**: `apps/web/lib/validations/progress.ts`

**Pattern**:
```typescript
import { z } from 'zod';

/**
 * Entity type enum - Plural form for REST API routes
 * Maps to Prisma models (Session, Task, Day, Week, Phase)
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

/**
 * Map plural entity types (API routes) to singular (Prisma models/utilities)
 */
export const entityTypeMap = {
  'sessions': 'session',
  'tasks': 'task',
  'days': 'day',
  'weeks': 'week',
  'phases': 'phase',
} as const;
```

**Why plural for API routes?**
- RESTful convention: `/api/sessions`, `/api/tasks` (resources are plural)
- Prisma models are singular: `Session`, `Task`
- Type map bridges the gap

**Gotcha**:
- Use `as const` for type map to enable TypeScript literal types
- Zod enum values must match route parameter values exactly
- Export both schema and inferred types for reuse

---

### Step 3: Create Generic Route Handler

Implement the route handler with entity type validation.

**File**: `apps/web/app/api/[entity]/[id]/progress/route.ts`

**Complete implementation**:
```typescript
/**
 * API Route: PUT /api/:entity/:id/progress
 *
 * Purpose: Update entity progress with automatic parent propagation
 *
 * Pattern: Next.js 14 Dynamic Route → Zod validation → Progress utility
 *
 * Performance: Uses incremental transactions (one level at a time)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateProgressAndPropagate } from '@/lib/db/progress';
import { EntityTypeSchema, UpdateProgressSchema, entityTypeMap } from '@/lib/validations/progress';

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
          message: firstError?.message || 'Validation failed',
          field: String(firstError?.path?.[0] || 'unknown'),
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

**Key implementation points**:

1. **Validate entity type FIRST**: `EntityTypeSchema.parse(params.entity)`
   - Throws ZodError if entity type not in enum
   - Type-safe: TypeScript knows entity is one of 5 valid types

2. **Validate entity ID format**: `z.string().cuid('Invalid entity ID format').parse(params.id)`
   - Validates CUID format (our ID strategy)
   - Returns helpful error message if invalid

3. **Map plural to singular**: `entityTypeMap[entity]`
   - Routes use plural: `/api/sessions`
   - Utilities expect singular: `updateProgressAndPropagate(id, 'session', progress)`
   - Type map handles conversion

4. **Return propagation summary**:
   - Client can see which parent entities were updated
   - Useful for UI feedback and debugging

**Gotcha**:
- Don't forget `export const dynamic = 'force-dynamic'` for mutation routes
- Validate path params BEFORE request body (fail fast for invalid routes)
- Use descriptive error messages in Zod validation (they're returned to client)

---

### Step 4: Create Type-Safe Utility Function

Ensure utility functions accept singular entity types.

**File**: `apps/web/lib/db/progress.ts`

**Type definition**:
```typescript
export type EntityTypeSingular = 'session' | 'task' | 'day' | 'week' | 'phase';

export interface PropagationResult {
  entity: any; // Updated entity
  propagated: Array<{
    type: EntityTypeSingular;
    id: string;
    progress: number;
  }>;
}
```

**Function signature**:
```typescript
export async function updateProgressAndPropagate(
  entityId: string,
  entityType: EntityTypeSingular,
  progress: number
): Promise<PropagationResult> {
  // Implementation...
}
```

**Why singular types in utilities?**
- Matches Prisma model names: `prisma.session`, `prisma.task`
- More intuitive for internal functions: `updateSession()` not `updateSessions()`
- Consistent with database naming (table `Session`, not `Sessions`)

**Gotcha**:
- Don't mix plural and singular types in utility signatures
- Use `entityTypeMap` to convert at API boundary only
- Export both type definitions for documentation

---

### Step 5: Implement Comprehensive Error Handling

Handle all error types with appropriate HTTP status codes.

**Error handling order** (specific to generic):
```typescript
try {
  // ... main logic ...
} catch (error) {
  // 1. Zod validation errors (400) - Invalid entity type OR invalid request body
  if (error instanceof z.ZodError) {
    const firstError = error.errors[0];
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError?.message || 'Validation failed',
        field: String(firstError?.path?.[0] || 'unknown'),
      },
    }, { status: 400 });
  }

  // 2. Entity not found (404) - Valid entity type but ID doesn't exist
  if (error?.constructor?.name === 'PrismaClientKnownRequestError' &&
      (error as any).code === 'P2025') {
    return NextResponse.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Entity not found',
      },
    }, { status: 404 });
  }

  // 3. Database errors (500)
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

  // 4. Unknown errors (500)
  console.error('[API] Unexpected error:', error);
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    },
  }, { status: 500 });
}
```

**Common Zod validation errors in generic routes**:
1. Invalid entity type: `PUT /api/invalid-type/abc123/progress` → 400
2. Invalid entity ID format: `PUT /api/sessions/not-a-cuid/progress` → 400
3. Invalid request body: `{ "progress": 150 }` → 400
4. Missing request body: `{}` → 400

**Gotcha**:
- Zod validation catches BOTH path params AND request body errors
- Check `error.errors[0].path` to see which field failed
- Log errors with route context: `'[API] Error in PUT /api/:entity/:id/progress'`

---

### Step 6: Test All Entity Types

Verify generic route works for all entity types.

**Test strategy**:
```typescript
// __tests__/api/[entity]/[id]/progress/route.test.ts

describe('PUT /api/:entity/:id/progress', () => {
  // Test each entity type
  const entityTypes = ['sessions', 'tasks', 'days', 'weeks', 'phases'] as const;

  entityTypes.forEach(entityType => {
    describe(`Entity type: ${entityType}`, () => {
      it('updates progress successfully', async () => {
        // Arrange
        const mockId = 'cuid_123';
        const mockProgress = 75;

        // Act
        const response = await PUT(
          new NextRequest(`http://localhost:3000/api/${entityType}/${mockId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progress: mockProgress }),
          }),
          { params: { entity: entityType, id: mockId } }
        );

        // Assert
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });

      it('validates progress range', async () => {
        // Test progress > 100 returns 400
      });

      it('returns 404 for non-existent entity', async () => {
        // Test invalid ID returns 404
      });
    });
  });

  // Test invalid entity type
  it('returns 400 for invalid entity type', async () => {
    const response = await PUT(
      new NextRequest('http://localhost:3000/api/invalid/abc123/progress', {
        method: 'PUT',
        body: JSON.stringify({ progress: 50 }),
      }),
      { params: { entity: 'invalid', id: 'abc123' } }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

**Test coverage checklist**:
- [ ] All valid entity types work (sessions, tasks, days, weeks, phases)
- [ ] Invalid entity type returns 400 with Zod error
- [ ] Invalid ID format returns 400
- [ ] Non-existent entity ID returns 404
- [ ] Invalid progress range returns 400
- [ ] Successful update returns propagation summary

**Gotcha**:
- Test with ALL entity types (don't assume if one works, all work)
- Test boundary cases: progress 0, progress 100
- Test CUID validation (our ID format)

---

### Step 7: Add TypeScript Types

Define types for generic route responses.

**File**: `apps/web/types/progress.ts`

```typescript
import { EntityType, EntityTypeSingular } from '@/lib/validations/progress';

/**
 * Progress update API response
 */
export interface ProgressUpdateResponse {
  success: boolean;
  data?: {
    entity: any; // Updated entity (Session | Task | Day | Week | Phase)
    propagation: {
      updated: Array<{
        type: EntityTypeSingular;
        id: string;
        progress: number;
      }>;
      totalAffected: number;
    };
  };
  error?: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
    field?: string;
  };
}

/**
 * Progress update request body
 */
export interface ProgressUpdateRequest {
  progress: number; // 0-100 integer
}
```

**Usage in route**:
```typescript
import { ProgressUpdateResponse } from '@/types/progress';

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<NextResponse<ProgressUpdateResponse>> {
  // TypeScript infers response type
}
```

---

### Step 8: Document API Endpoint

Update API catalog with generic route documentation.

**File**: `.agent/system/api-catalog.md`

**Documentation template**:
```markdown
### PUT /api/:entity/:id/progress

Update progress for any entity type with automatic parent propagation.

**Path Parameters**:
- `entity`: Entity type (sessions | tasks | days | weeks | phases)
- `id`: Entity ID (CUID format)

**Request Body**:
```json
{
  "progress": 75
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entity": { ... },
    "propagation": {
      "updated": [
        { "type": "task", "id": "abc123", "progress": 75 },
        { "type": "day", "id": "def456", "progress": 60 }
      ],
      "totalAffected": 2
    }
  }
}
```

**Error Responses**:
- `400 VALIDATION_ERROR`: Invalid entity type, ID format, or progress value
- `404 NOT_FOUND`: Entity ID does not exist
- `500 INTERNAL_ERROR`: Database error

**Example Requests**:
```bash
# Update session progress
curl -X PUT http://localhost:3000/api/sessions/abc123/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 75}'

# Update task progress
curl -X PUT http://localhost:3000/api/tasks/def456/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 50}'
```

**Design Decision**: Generic route pattern (1 implementation for 5 entity types)
- See: [.agent/sops/generic-api-routes.md](.agent/sops/generic-api-routes.md)
```

**Gotcha**:
- Document ALL valid entity types in path parameter description
- Include example requests for multiple entity types
- Reference this SOP in design decision notes

---

## Verification Checklist

After implementing generic route:

- [ ] Directory structure correct: `[entity]/[id]/[action]/route.ts`
- [ ] Zod enum schema includes all entity types
- [ ] Type map handles plural → singular conversion
- [ ] All entity types tested and working
- [ ] Invalid entity type returns 400 with clear error
- [ ] Invalid ID format returns 400
- [ ] Non-existent entity returns 404
- [ ] Error handling comprehensive (Zod, Prisma, generic)
- [ ] TypeScript types defined
- [ ] API catalog updated
- [ ] Tests written for all entity types
- [ ] Performance acceptable (no N+1 queries)

---

## Common Patterns

### Pattern 1: Generic Progress Update (This SOP)

**Use case**: Same operation across multiple entity types

**Structure**:
```
[entity]/[id]/progress/route.ts
→ EntityTypeSchema validation
→ entityTypeMap conversion
→ Unified utility function
```

### Pattern 2: Generic Status Update

**Use case**: Status changes with different allowed values per entity

**Structure**:
```typescript
// Validation with conditional logic
const statusSchemas = {
  'tasks': z.enum(['todo', 'in_progress', 'done']),
  'issues': z.enum(['open', 'in_progress', 'closed']),
  'sessions': z.enum(['active', 'paused', 'complete']),
};

const entity = EntityTypeSchema.parse(params.entity);
const schema = statusSchemas[entity];
const { status } = schema.parse(body);
```

**When to use**: Status values differ but update logic is same

### Pattern 3: Generic Metadata Update

**Use case**: Optional metadata fields (tags, notes, etc.)

**Structure**:
```typescript
const MetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Same schema for all entities
const entity = EntityTypeSchema.parse(params.entity);
const metadata = MetadataSchema.parse(body);
```

**When to use**: Metadata fields identical across entities

---

## Common Pitfalls

### Pitfall 1: Plural vs Singular Confusion

**Symptom**: TypeScript error "Argument of type 'sessions' not assignable to 'session'"

**Cause**: Passing plural route parameter directly to utility expecting singular

**Solution**:
```typescript
// ❌ WRONG
const result = await updateProgressAndPropagate(entityId, params.entity, progress);
// params.entity is 'sessions' (plural)

// ✅ CORRECT
const entity = EntityTypeSchema.parse(params.entity); // Type: 'sessions' | 'tasks' | ...
const entityType = entityTypeMap[entity]; // Type: 'session' | 'task' | ...
const result = await updateProgressAndPropagate(entityId, entityType, progress);
```

### Pitfall 2: Missing Enum Value

**Symptom**: Zod validation error "Invalid enum value" for valid entity

**Cause**: Forgot to add entity type to `EntityTypeSchema` enum

**Solution**:
```typescript
// ❌ MISSING 'phases'
export const EntityTypeSchema = z.enum([
  'sessions',
  'tasks',
  'days',
  'weeks',
  // Forgot 'phases'!
]);

// ✅ COMPLETE
export const EntityTypeSchema = z.enum([
  'sessions',
  'tasks',
  'days',
  'weeks',
  'phases'
]);
```

**Prevention**: Update in 3 places when adding entity type:
1. `EntityTypeSchema` enum
2. `entityTypeMap` object
3. `EntityTypeSingular` type (if exists)

### Pitfall 3: Incorrect Type Mapping

**Symptom**: Runtime error "Cannot read property 'session' of undefined"

**Cause**: Type map key doesn't match enum value

**Solution**:
```typescript
// ❌ WRONG - Keys don't match enum
export const entityTypeMap = {
  'session': 'session',  // Should be 'sessions' (plural)
  'task': 'task',        // Should be 'tasks' (plural)
};

// ✅ CORRECT - Keys match enum exactly
export const entityTypeMap = {
  'sessions': 'session',
  'tasks': 'task',
  'days': 'day',
  'weeks': 'week',
  'phases': 'phase',
} as const;
```

**Prevention**: Use `as const` to enable TypeScript checking

### Pitfall 4: Validating Request Body Before Path Params

**Symptom**: Confusing error messages when entity type is invalid

**Cause**: Request body validation happens before path param validation

**Solution**:
```typescript
// ❌ WRONG ORDER
const body = await request.json();
const { progress } = UpdateProgressSchema.parse(body); // Happens first
const entity = EntityTypeSchema.parse(params.entity); // Happens second

// ✅ CORRECT ORDER
const entity = EntityTypeSchema.parse(params.entity); // Validate path params first
const entityId = z.string().cuid().parse(params.id);
const body = await request.json();
const { progress } = UpdateProgressSchema.parse(body); // Then validate body
```

**Why it matters**: Better error messages (fail fast on invalid route)

### Pitfall 5: Not Testing All Entity Types

**Symptom**: Works for sessions/tasks but fails for weeks/phases

**Cause**: Only tested common entity types, missed edge cases

**Solution**:
```typescript
// ❌ INCOMPLETE TESTING
it('updates session progress', async () => { ... });
it('updates task progress', async () => { ... });
// Missing: days, weeks, phases

// ✅ COMPLETE TESTING
const entityTypes = ['sessions', 'tasks', 'days', 'weeks', 'phases'] as const;
entityTypes.forEach(entityType => {
  it(`updates ${entityType} progress`, async () => { ... });
});
```

**Prevention**: Loop through ALL entity types in tests

---

## Troubleshooting

### Issue: "Invalid enum value" error

**Symptom**: Zod throws error even with valid entity type

**Debugging steps**:
1. Check enum definition includes the entity type
2. Verify case matches exactly (lowercase vs uppercase)
3. Ensure no trailing spaces in enum values
4. Check URL encoding (spaces become %20)

**Solution**: Update enum or fix request URL

### Issue: Type map returns undefined

**Symptom**: `entityTypeMap[entity]` is undefined at runtime

**Debugging steps**:
1. Log `entity` value to console
2. Check enum value matches map key exactly
3. Verify `as const` assertion on map
4. Check TypeScript compilation errors

**Solution**: Add missing entity type to map

### Issue: Wrong utility function called

**Symptom**: Progress updates wrong entity type

**Debugging steps**:
1. Log entity type before and after mapping
2. Verify mapping logic: `entityTypeMap[entity]`
3. Check utility function signature
4. Verify Prisma model name matches

**Solution**: Fix type map or utility function name

### Issue: Tests pass but runtime fails

**Symptom**: All tests green but API returns errors

**Debugging steps**:
1. Check test mocks match runtime behavior
2. Verify test data uses correct ID format (CUID)
3. Test with actual database (integration test)
4. Check environment variables (DATABASE_URL)

**Solution**: Add integration tests with real database

---

## Real-World Example

### Example: Progress Update API (Days 10-12)

**Context**: 5 entity types (Session, Task, Day, Week, Phase) all need progress updates with automatic parent propagation

**Decision**: Generic route instead of 5 separate routes

**Implementation**:
- **Route**: `PUT /api/[entity]/[id]/progress`
- **Validation**: `EntityTypeSchema` with 5 values
- **Type map**: Plural → singular conversion
- **Utility**: `updateProgressAndPropagate(id, type, progress)`

**Results**:
- 1 route file instead of 5 (80% code reduction)
- Consistent validation across all entity types
- Single source of truth for error handling
- Easier testing (loop through entity types)

**Files**:
- Route: `apps/web/app/api/[entity]/[id]/progress/route.ts`
- Validation: `apps/web/lib/validations/progress.ts`
- Utility: `apps/web/lib/db/progress.ts`
- Documentation: `.agent/task/current-session-20251109-0000.md` (lines 95-112)

**Lessons Learned**:
1. Generic routes work well for uniform operations
2. Type mapping is crucial for plural/singular consistency
3. Comprehensive testing prevents entity-specific bugs
4. Documentation should explain generic pattern clearly

---

## Related Documentation

- [api-route-creation.md](./api-route-creation.md) - Standard API route patterns
- [.agent/task/current-session-20251109-0000.md](../task/current-session-20251109-0000.md) - Implementation context
- [.agent/task/step-4-5-verification-checkpoint.md](../task/step-4-5-verification-checkpoint.md) - Architecture verification
- [.agent/system/api-catalog.md](../system/api-catalog.md) - API reference
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Zod Enums](https://zod.dev/?id=zod-enums)

---

## Quick Reference

### Complete Generic Route Template

```typescript
/**
 * Generic API Route: [HTTP_METHOD] /api/:entity/:id/:action
 *
 * Purpose: [Description of what this route does]
 *
 * Serves entity types: [list all entity types]
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EntityTypeSchema, entityTypeMap } from '@/lib/validations/[resource]';

export const dynamic = 'force-dynamic';

type RouteParams = {
  entity: string;
  id: string;
};

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
    const validated = YourSchema.parse(body);

    // 3. Map entity type (plural → singular)
    const entityType = entityTypeMap[entity];

    // 4. Call utility function
    const result = await yourUtilityFunction(entityId, entityType, validated);

    // 5. Success response
    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 200 });

  } catch (error) {
    // 6. Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Validation failed',
          field: String(error.errors[0]?.path?.[0] || 'unknown'),
        },
      }, { status: 400 });
    }

    // Handle Prisma errors...
    // Handle generic errors...
  }
}
```

### Validation Schema Template

```typescript
// lib/validations/[resource].ts
import { z } from 'zod';

export const EntityTypeSchema = z.enum([
  'type1',
  'type2',
  'type3',
]);

export const RequestSchema = z.object({
  field1: z.string(),
  field2: z.number().int().min(0).max(100),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type RequestInput = z.infer<typeof RequestSchema>;

export const entityTypeMap = {
  'type1': 'singularType1',
  'type2': 'singularType2',
  'type3': 'singularType3',
} as const;
```

---

**Last Updated**: 2025-11-09
**Created From**: Days 10-12 implementation (PUT /api/:entity/:id/progress)
**Priority**: MEDIUM - Use when multiple entities share same operation pattern
**Related Pattern**: Standard API routes (entity-specific) - see api-route-creation.md
