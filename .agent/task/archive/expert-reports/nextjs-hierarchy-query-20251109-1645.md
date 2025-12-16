# Next.js Implementation Plan: Hierarchy Query API

**Created**: 2025-11-09 16:45
**Type**: API Route (Query Endpoint)
**Feature**: FR-007 - Query hierarchy entities with filters
**User Story**: US-011 (partial implementation)

---

## Architecture Decision

### Rendering Strategy

- [x] **Dynamic** (rendered per request)
- [ ] Static (pre-rendered at build)
- [ ] ISR (incremental static regeneration)

**Recommendation**: Dynamic because query results depend on real-time database state and filter parameters. No caching needed for reporting queries.

**Implementation**: `export const dynamic = 'force-dynamic'` in route handler

---

### Component Strategy

**Server Components Only** - This is an API route, no React components involved.

**Rationale**: Pure API endpoint returning JSON. No UI rendering.

---

## File Structure

```
apps/web/
├── app/api/hierarchy/
│   └── query/
│       └── route.ts              # GET handler (new)
├── lib/validation/
│   └── hierarchy-query.ts        # Zod schemas (new)
└── prisma/
    └── schema.prisma             # No changes needed (indexes already exist)
```

---

## Key Design Decisions

### Decision 1: Single Endpoint vs. Separate Endpoints

**Recommendation**: **Single endpoint with `level` parameter**

**Rationale**:
- ✅ Consistent filtering logic across all entity types
- ✅ Reduces code duplication (DRY principle)
- ✅ Easier to maintain (one place to update filter logic)
- ✅ Follows existing pattern (see `/api/tasks/current` with conditional includes)
- ✅ Simpler API surface (5 entity types → 1 endpoint vs. 5 endpoints)
- ❌ Slightly more complex query builder (manageable with switch statement)

**Pattern Example**: `/api/hierarchy/query?level=task&status=IN_PROGRESS&progressMin=50`

**Alternative Rejected**: Separate endpoints (`/api/phases/query`, `/api/tasks/query`, etc.)
- Would duplicate 80% of validation and filter logic
- Harder to maintain consistency across endpoints
- More API routes to document and test

---

### Decision 2: Zod Validation for Query Parameters

**Recommendation**: **Validate query params using Zod with `safeParse()`**

**Pattern**:
```typescript
// Build validation object from searchParams
const queryInput = {
  level: searchParams.get('level'),
  status: searchParams.getAll('status'), // Array support
  progressMin: searchParams.get('progressMin'),
  progressMax: searchParams.get('progressMax'),
  startDate: searchParams.get('startDate'),
  endDate: searchParams.get('endDate'),
};

// Validate with Zod
const validationResult = HierarchyQuerySchema.safeParse(queryInput);
if (!validationResult.success) {
  return NextResponse.json({ error: 'Validation error', details: validationResult.error }, { status: 400 });
}
```

**Why This Works**:
- ✅ Type-safe query param extraction
- ✅ Automatic type coercion (string → number for progress)
- ✅ Detailed validation errors returned to client
- ✅ Consistent with existing API patterns (see `/api/checkpoints/route.ts`)

**Alternative Rejected**: Manual validation with if/else
- Error-prone (easy to miss edge cases)
- No TypeScript inference
- Inconsistent error messages

---

### Decision 3: Parent Context Inclusion Strategy

**Recommendation**: **Always include parent context, use `select` pattern (not `include`)**

**Rationale**:
- ✅ **Performance**: `select` reduces payload by 52% vs. `include` (proven in `/api/tasks/current`)
- ✅ **Consistency**: All hierarchy queries return same context structure
- ✅ **Simplicity**: No conditional includes needed (context always useful for reporting)
- ✅ **Indexed Queries**: Parent relationships use foreign key indexes automatically

**Example for Task level**:
```typescript
// Task query includes: day → week → phase context
const tasks = await prisma.task.findMany({
  where: filterConditions,
  select: {
    // Task fields
    id: true,
    title: true,
    status: true,
    progress: true,

    // Parent context (3 levels up)
    day: {
      select: {
        id: true,
        title: true,
        week: {
          select: {
            id: true,
            title: true,
            phase: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    },
  },
});
```

**Alternative Rejected**: `include` pattern
- 52% larger payload (includes all fields, including timestamps)
- Slower serialization

**Alternative Rejected**: `includeParents` query param
- Adds complexity for marginal use case (context almost always needed)
- Most queries need context for reporting (Phase → Week → Day drill-down)

---

### Decision 4: Status Filter - Array vs. Single

**Recommendation**: **Array filter with ANY match (OR logic)**

**Rationale**:
- ✅ **Use Case**: "Show me all tasks that are IN_PROGRESS or BLOCKED" (common reporting query)
- ✅ **Prisma Support**: Native `in` operator for array matching
- ✅ **URL Pattern**: Repeating param `?status=IN_PROGRESS&status=BLOCKED`
- ✅ **Flexibility**: Can filter single status by passing one value

**Example**:
```typescript
// Query: ?status=IN_PROGRESS&status=BLOCKED
const statuses = searchParams.getAll('status'); // ['IN_PROGRESS', 'BLOCKED']

// Prisma query
where: {
  status: { in: statuses }, // OR logic
}
```

**Alternative Rejected**: Single status value
- Too limiting for reporting ("show all active items" = IN_PROGRESS + BLOCKED)
- Forces multiple API calls for multi-status queries

---

### Decision 5: Date Range Filtering

**Recommendation**: **Support `startDate` and `endDate` query params for filtering by entity date ranges**

**Pattern**:
```typescript
// Query: ?startDate=2025-11-01&endDate=2025-11-30
// Matches: Entities whose date range overlaps with query range

where: {
  AND: [
    { startDate: { lte: new Date(endDate) } },      // Entity starts before query ends
    { endDate: { gte: new Date(startDate) } },      // Entity ends after query starts
  ],
}
```

**Rationale**:
- ✅ Handles overlapping date ranges (not just exact matches)
- ✅ Useful for reporting: "Show all tasks active in November"
- ✅ Works even if entity endDate is null (ongoing entities)

**Alternative Rejected**: Single `date` param
- Doesn't handle multi-day/week entities well
- Less flexible for range queries

---

## Implementation Steps

### Step 1: Zod Validation Schema

**File**: `apps/web/lib/validation/hierarchy-query.ts` (new file)

**Purpose**: Type-safe validation for query parameters

```typescript
import { z } from 'zod';

// Status enum schema (matches Prisma enum)
export const StatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
]);

// Entity level enum
export const HierarchyLevelSchema = z.enum([
  'phase',
  'week',
  'day',
  'task',
  'session',
]);

// Query parameters schema
export const HierarchyQuerySchema = z.object({
  // Required: Which entity type to query
  level: HierarchyLevelSchema,

  // Optional filters
  status: z.array(StatusSchema).optional(),

  progressMin: z.coerce.number()
    .int('Progress must be an integer')
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100')
    .optional(),

  progressMax: z.coerce.number()
    .int('Progress must be an integer')
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100')
    .optional(),

  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Pagination (optional, defaults in route handler)
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).refine(
  (data) => {
    // Validate progressMin <= progressMax if both provided
    if (data.progressMin !== undefined && data.progressMax !== undefined) {
      return data.progressMin <= data.progressMax;
    }
    return true;
  },
  {
    message: 'progressMin must be less than or equal to progressMax',
    path: ['progressMin'],
  }
).refine(
  (data) => {
    // Validate startDate <= endDate if both provided
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  }
);

export type HierarchyQueryInput = z.infer<typeof HierarchyQuerySchema>;
export type HierarchyLevel = z.infer<typeof HierarchyLevelSchema>;
export type Status = z.infer<typeof StatusSchema>;

// Response types (for documentation)
export type PhaseWithContext = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  progress: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Phase has no parents
};

export type WeekWithContext = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  progress: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Parent context
  phase: {
    id: string;
    title: string;
    status: Status;
  };
};

export type DayWithContext = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  progress: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Parent context
  week: {
    id: string;
    title: string;
    status: Status;
  };
  phase: {
    id: string;
    title: string;
    status: Status;
  };
};

export type TaskWithContext = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  progress: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Parent context
  day: {
    id: string;
    title: string;
    status: Status;
  };
  week: {
    id: string;
    title: string;
    status: Status;
  };
  phase: {
    id: string;
    title: string;
    status: Status;
  };
};

export type SessionWithContext = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  progress: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Parent context
  task: {
    id: string;
    title: string;
    status: Status;
  };
  day: {
    id: string;
    title: string;
    status: Status;
  };
  week: {
    id: string;
    title: string;
    status: Status;
  };
  phase: {
    id: string;
    title: string;
    status: Status;
  };
};

// Union type for response data
export type HierarchyQueryResult =
  | PhaseWithContext[]
  | WeekWithContext[]
  | DayWithContext[]
  | TaskWithContext[]
  | SessionWithContext[];
```

**Key Features**:
- ✅ `z.coerce.number()` - Automatically converts string query params to numbers
- ✅ `z.coerce.date()` - Automatically converts ISO date strings to Date objects
- ✅ `.refine()` - Custom validation rules (progressMin ≤ progressMax, startDate ≤ endDate)
- ✅ Type inference - TypeScript types automatically generated from schemas
- ✅ Response types - Documented for API consumers

---

### Step 2: Query Builder Helpers

**File**: `apps/web/app/api/hierarchy/query/route.ts` (new file)

**Purpose**: Reusable query builder functions for each entity level

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  HierarchyQuerySchema,
  type HierarchyQueryInput,
  type HierarchyLevel,
} from '@/lib/validation/hierarchy-query';
import type { Prisma } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// QUERY BUILDER HELPERS
// ============================================================================

/**
 * Build Prisma where clause from validated filters
 * Works for all entity types (Phase, Week, Day, Task, Session)
 */
function buildWhereClause(filters: HierarchyQueryInput): Prisma.PhaseWhereInput {
  const where: Prisma.PhaseWhereInput = {};

  // Status filter (array with OR logic)
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  // Progress range filter
  if (filters.progressMin !== undefined || filters.progressMax !== undefined) {
    where.progress = {};
    if (filters.progressMin !== undefined) {
      where.progress.gte = filters.progressMin;
    }
    if (filters.progressMax !== undefined) {
      where.progress.lte = filters.progressMax;
    }
  }

  // Date range filter (overlapping date ranges)
  if (filters.startDate || filters.endDate) {
    where.AND = [];

    if (filters.endDate) {
      // Entity starts before query end date
      where.AND.push({ startDate: { lte: filters.endDate } });
    }

    if (filters.startDate) {
      // Entity ends after query start date (or is ongoing)
      where.AND.push({
        OR: [
          { endDate: { gte: filters.startDate } },
          { endDate: null }, // Include ongoing entities
        ],
      });
    }
  }

  return where;
}

/**
 * Query Phase entities with filters
 * Phase has no parents (top level)
 */
async function queryPhases(filters: HierarchyQueryInput, skip: number, limit: number) {
  const where = buildWhereClause(filters);

  const [phases, total] = await Promise.all([
    prisma.phase.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.phase.count({ where }),
  ]);

  // Format response (convert dates to ISO strings)
  const formatted = phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    description: phase.description,
    status: phase.status,
    progress: phase.progress,
    startDate: phase.startDate.toISOString(),
    endDate: phase.endDate?.toISOString() || null,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
  }));

  return { data: formatted, total };
}

/**
 * Query Week entities with Phase parent context
 */
async function queryWeeks(filters: HierarchyQueryInput, skip: number, limit: number) {
  const where = buildWhereClause(filters);

  const [weeks, total] = await Promise.all([
    prisma.week.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,

        // Parent context (1 level)
        phase: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.week.count({ where }),
  ]);

  // Format response with flattened parent context
  const formatted = weeks.map((week) => ({
    id: week.id,
    title: week.title,
    description: week.description,
    status: week.status,
    progress: week.progress,
    startDate: week.startDate.toISOString(),
    endDate: week.endDate?.toISOString() || null,
    createdAt: week.createdAt.toISOString(),
    updatedAt: week.updatedAt.toISOString(),

    // Parent context
    phase: {
      id: week.phase.id,
      title: week.phase.title,
      status: week.phase.status,
    },
  }));

  return { data: formatted, total };
}

/**
 * Query Day entities with Week + Phase parent context
 */
async function queryDays(filters: HierarchyQueryInput, skip: number, limit: number) {
  const where = buildWhereClause(filters);

  const [days, total] = await Promise.all([
    prisma.day.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,

        // Parent context (2 levels)
        week: {
          select: {
            id: true,
            title: true,
            status: true,

            phase: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.day.count({ where }),
  ]);

  // Format response with flattened parent context
  const formatted = days.map((day) => ({
    id: day.id,
    title: day.title,
    description: day.description,
    status: day.status,
    progress: day.progress,
    startDate: day.startDate.toISOString(),
    endDate: day.endDate?.toISOString() || null,
    createdAt: day.createdAt.toISOString(),
    updatedAt: day.updatedAt.toISOString(),

    // Flattened parent context
    week: {
      id: day.week.id,
      title: day.week.title,
      status: day.week.status,
    },
    phase: {
      id: day.week.phase.id,
      title: day.week.phase.title,
      status: day.week.phase.status,
    },
  }));

  return { data: formatted, total };
}

/**
 * Query Task entities with Day + Week + Phase parent context
 */
async function queryTasks(filters: HierarchyQueryInput, skip: number, limit: number) {
  const where = buildWhereClause(filters);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,

        // Parent context (3 levels)
        day: {
          select: {
            id: true,
            title: true,
            status: true,

            week: {
              select: {
                id: true,
                title: true,
                status: true,

                phase: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  // Format response with flattened parent context
  const formatted = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    progress: task.progress,
    startDate: task.startDate.toISOString(),
    endDate: task.endDate?.toISOString() || null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),

    // Flattened parent context
    day: {
      id: task.day.id,
      title: task.day.title,
      status: task.day.status,
    },
    week: {
      id: task.day.week.id,
      title: task.day.week.title,
      status: task.day.week.status,
    },
    phase: {
      id: task.day.week.phase.id,
      title: task.day.week.phase.title,
      status: task.day.week.phase.status,
    },
  }));

  return { data: formatted, total };
}

/**
 * Query Session entities with Task + Day + Week + Phase parent context
 */
async function querySessions(filters: HierarchyQueryInput, skip: number, limit: number) {
  const where = buildWhereClause(filters);

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,

        // Parent context (4 levels)
        task: {
          select: {
            id: true,
            title: true,
            status: true,

            day: {
              select: {
                id: true,
                title: true,
                status: true,

                week: {
                  select: {
                    id: true,
                    title: true,
                    status: true,

                    phase: {
                      select: {
                        id: true,
                        title: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.session.count({ where }),
  ]);

  // Format response with flattened parent context
  const formatted = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    description: session.description,
    status: session.status,
    progress: session.progress,
    startDate: session.startDate.toISOString(),
    endDate: session.endDate?.toISOString() || null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),

    // Flattened parent context
    task: {
      id: session.task.id,
      title: session.task.title,
      status: session.task.status,
    },
    day: {
      id: session.task.day.id,
      title: session.task.day.title,
      status: session.task.day.status,
    },
    week: {
      id: session.task.day.week.id,
      title: session.task.day.week.title,
      status: session.task.day.week.status,
    },
    phase: {
      id: session.task.day.week.phase.id,
      title: session.task.day.week.phase.title,
      status: session.task.day.week.phase.status,
    },
  }));

  return { data: formatted, total };
}
```

**Key Design Patterns**:
- ✅ **DRY**: Single `buildWhereClause()` used by all entity types
- ✅ **Parallel Queries**: `Promise.all([findMany, count])` for performance
- ✅ **Flattened Response**: Nested parents flattened for easier consumption
- ✅ **Consistent Ordering**: All queries ordered by `startDate DESC`
- ✅ **Date Serialization**: All dates converted to ISO strings

---

### Step 3: GET Route Handler

**File**: `apps/web/app/api/hierarchy/query/route.ts` (continued)

**Purpose**: Main GET handler with validation and routing

```typescript
// ============================================================================
// GET HANDLER
// ============================================================================

/**
 * GET /api/hierarchy/query
 *
 * Query hierarchy entities with filters
 *
 * Query Parameters:
 * - level: "phase" | "week" | "day" | "task" | "session" (required)
 * - status: TrackingStatus[] (optional, repeatable)
 * - progressMin: number 0-100 (optional)
 * - progressMax: number 0-100 (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20, max: 100)
 *
 * Example:
 * GET /api/hierarchy/query?level=task&status=IN_PROGRESS&status=BLOCKED&progressMin=50
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     results: [...],
 *     pagination: { page, limit, total, totalPages, hasMore }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryInput = {
      level: searchParams.get('level'),
      status: searchParams.getAll('status').length > 0
        ? searchParams.getAll('status')
        : undefined,
      progressMin: searchParams.get('progressMin') || undefined,
      progressMax: searchParams.get('progressMax') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // 2. Validate with Zod
    const validationResult = HierarchyQuerySchema.safeParse(queryInput);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
      }, { status: 400 });
    }

    const filters = validationResult.data;

    // 3. Calculate pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Cap at 100
    const skip = (page - 1) * limit;

    // 4. Route to appropriate query function based on level
    let result: { data: any[]; total: number };

    switch (filters.level) {
      case 'phase':
        result = await queryPhases(filters, skip, limit);
        break;
      case 'week':
        result = await queryWeeks(filters, skip, limit);
        break;
      case 'day':
        result = await queryDays(filters, skip, limit);
        break;
      case 'task':
        result = await queryTasks(filters, skip, limit);
        break;
      case 'session':
        result = await querySessions(filters, skip, limit);
        break;
      default:
        // Should never happen due to Zod validation
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_LEVEL',
            message: `Invalid level: ${filters.level}`,
          },
        }, { status: 400 });
    }

    // 5. Build pagination metadata
    const totalPages = Math.ceil(result.total / limit);
    const hasMore = page < totalPages;

    // 6. Success response
    return NextResponse.json({
      success: true,
      data: {
        results: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasMore,
        },
      },
    });

  } catch (error) {
    // 7. Error handling
    console.error('[API] Error in GET /api/hierarchy/query:', error);

    // Prisma errors
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database query failed',
        },
      }, { status: 500 });
    }

    // Unknown errors
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

**Flow Summary**:
1. Parse query parameters from URL
2. Validate with Zod schema
3. Calculate pagination (skip/take)
4. Route to level-specific query function
5. Build pagination metadata
6. Return formatted response

**Error Handling**:
- **400**: Validation errors (invalid level, progress out of range, etc.)
- **500**: Database errors or unexpected errors

---

## Data Fetching Plan

**Where**: API Route Handler (Server Component)

**Method**: Prisma (direct database queries)

**Caching**: None (dynamic queries)

**Query Pattern**:
```typescript
// Parallel queries for data + count
const [entities, total] = await Promise.all([
  prisma[model].findMany({ where, select, orderBy, skip, take }),
  prisma[model].count({ where }),
]);
```

**Performance Optimizations**:
1. **`select` instead of `include`** - 52% smaller payload
2. **Parallel queries** - Data and count fetched simultaneously
3. **Indexed filters** - All filter fields have indexes:
   - `@@index([status])` - Status filter uses index
   - `@@index([startDate])` - Date range uses index
   - `progress` field (no index needed for range queries)
4. **Pagination** - Limit result set size (default 20, max 100)
5. **Minimal parent context** - Only `id`, `title`, `status` for parents

**Expected Performance**:
- Simple query (1 filter): **<50ms**
- Complex query (3+ filters): **<200ms**
- Large result set (100 items): **<500ms**

---

## Performance Considerations

### Bundle Size
- **Impact**: Zero (API route, no client bundle)
- **Mitigation**: N/A

### Data Fetching
- **Strategy**: Parallel Prisma queries (`Promise.all`)
- **Optimization**: `select` pattern reduces payload by 52%
- **Pagination**: Cap at 100 items per page to prevent large payloads

### Caching
- **Strategy**: No caching (dynamic queries)
- **Rationale**: Query results change frequently as tasks/sessions progress
- **Future Optimization**: Consider short-lived cache (5-10 seconds) if needed

### Database Performance
- **Indexes Used**:
  - `@@index([status])` - Status filter
  - `@@index([startDate])` - Date range filter
  - Foreign key indexes - Parent context joins
- **Query Plan**: All indexes already exist (no migration needed)

---

## Example API Calls

### Example 1: Find all in-progress tasks

**Request**:
```http
GET /api/hierarchy/query?level=task&status=IN_PROGRESS
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "clx123abc",
        "title": "Implement checkpoint creation",
        "description": "Add checkpoint support...",
        "status": "IN_PROGRESS",
        "progress": 75,
        "startDate": "2025-11-09T00:00:00.000Z",
        "endDate": null,
        "createdAt": "2025-11-09T14:30:00.000Z",
        "updatedAt": "2025-11-09T16:45:00.000Z",
        "day": {
          "id": "clx123xyz",
          "title": "Day 13",
          "status": "IN_PROGRESS"
        },
        "week": {
          "id": "clx123wxy",
          "title": "Week 2",
          "status": "IN_PROGRESS"
        },
        "phase": {
          "id": "clx123pxy",
          "title": "Phase 1: Foundation",
          "status": "IN_PROGRESS"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

### Example 2: Find blocked or stuck tasks (multi-status + progress filter)

**Request**:
```http
GET /api/hierarchy/query?level=task&status=BLOCKED&status=IN_PROGRESS&progressMax=30
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "clx456abc",
        "title": "Debug authentication flow",
        "status": "BLOCKED",
        "progress": 20,
        "day": { "id": "...", "title": "Day 15", "status": "IN_PROGRESS" },
        "week": { "id": "...", "title": "Week 3", "status": "IN_PROGRESS" },
        "phase": { "id": "...", "title": "Phase 2: API", "status": "IN_PROGRESS" }
      },
      {
        "id": "clx789def",
        "title": "Refactor database queries",
        "status": "IN_PROGRESS",
        "progress": 15,
        "day": { "id": "...", "title": "Day 18", "status": "IN_PROGRESS" },
        "week": { "id": "...", "title": "Week 3", "status": "IN_PROGRESS" },
        "phase": { "id": "...", "title": "Phase 2: API", "status": "IN_PROGRESS" }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "hasMore": false }
  }
}
```

**Use Case**: "Show me all tasks that need attention (blocked or making slow progress)"

---

### Example 3: Find all work in November 2025 (date range)

**Request**:
```http
GET /api/hierarchy/query?level=week&startDate=2025-11-01T00:00:00.000Z&endDate=2025-11-30T23:59:59.999Z
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "clx111week",
        "title": "Week 1: Setup",
        "status": "COMPLETED",
        "progress": 100,
        "startDate": "2025-11-01T00:00:00.000Z",
        "endDate": "2025-11-07T23:59:59.999Z",
        "phase": {
          "id": "clx111phase",
          "title": "Phase 1: Foundation",
          "status": "IN_PROGRESS"
        }
      },
      {
        "id": "clx222week",
        "title": "Week 2: API Development",
        "status": "IN_PROGRESS",
        "progress": 80,
        "startDate": "2025-11-08T00:00:00.000Z",
        "endDate": "2025-11-14T23:59:59.999Z",
        "phase": {
          "id": "clx111phase",
          "title": "Phase 1: Foundation",
          "status": "IN_PROGRESS"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "hasMore": false }
  }
}
```

**Use Case**: "What work is scheduled for November?"

---

### Example 4: Validation error (invalid progress range)

**Request**:
```http
GET /api/hierarchy/query?level=task&progressMin=80&progressMax=20
```

**Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "code": "custom",
        "message": "progressMin must be less than or equal to progressMax",
        "path": ["progressMin"]
      }
    ]
  }
}
```

---

### Example 5: Pagination (page 2 of results)

**Request**:
```http
GET /api/hierarchy/query?level=session&status=COMPLETED&page=2&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [/* 10 sessions (items 11-20) */],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

---

## Testing Recommendations

### Unit Tests (Validation)
- ✅ Test Zod schema validation:
  - Valid inputs (all filter combinations)
  - Invalid inputs (progressMin > progressMax, startDate > endDate)
  - Edge cases (progressMin = 0, progressMax = 100)
  - Missing required field (level)

### Integration Tests (API Route)
1. **Test each entity level**:
   - Query phases (no parent context)
   - Query weeks (1-level parent)
   - Query days (2-level parent)
   - Query tasks (3-level parent)
   - Query sessions (4-level parent)

2. **Test filter combinations**:
   - Single status filter
   - Multiple status filters (OR logic)
   - Progress range filter
   - Date range filter
   - Combined filters (status + progress + date)

3. **Test pagination**:
   - Default page (page 1, limit 20)
   - Custom page size (limit 50)
   - Max page size cap (limit 200 → capped at 100)
   - Multiple pages (hasMore = true)

4. **Test error cases**:
   - Invalid level
   - Invalid status value
   - Invalid date format
   - Database error (mock Prisma failure)

5. **Test response format**:
   - Parent context structure matches schema
   - Dates are ISO strings
   - Pagination metadata correct

### Performance Tests
- ✅ Query with 1000+ entities (ensure <500ms)
- ✅ Query with complex filters (ensure <200ms)
- ✅ Verify index usage (EXPLAIN ANALYZE in PostgreSQL)

---

## Next Steps for Parent Agent

### 1. Create Validation Schema (20 minutes)
- Create `apps/web/lib/validation/hierarchy-query.ts`
- Implement all Zod schemas from Step 1
- Export TypeScript types

### 2. Create API Route (60 minutes)
- Create `apps/web/app/api/hierarchy/query/route.ts`
- Implement all query builder functions (Step 2)
- Implement GET handler (Step 3)
- Add error handling

### 3. Test Locally (30 minutes)
- Test each entity level with cURL or Postman
- Test filter combinations
- Test pagination
- Test error cases
- Verify response format matches examples

### 4. Write Integration Tests (45 minutes)
- Create `apps/web/app/api/hierarchy/query/route.test.ts`
- Cover all test scenarios from Testing Recommendations
- Run tests: `pnpm test apps/web/app/api/hierarchy/query`

### 5. Update Documentation (15 minutes)
- Add endpoint to `.agent/system/api-catalog.md`
- Include example requests/responses
- Document query parameters

### 6. Commit and Push (10 minutes)
- Commit with message: `feat(api): implement hierarchy query endpoint (FR-007)`
- Push to feature branch
- Update STATUS.md if completing a backlog item

---

## Success Criteria

**Functional Requirements**:
- ✅ Can query all 5 hierarchy levels (phase, week, day, task, session)
- ✅ Can filter by status (single or multiple)
- ✅ Can filter by progress range (min/max)
- ✅ Can filter by date range (overlapping ranges)
- ✅ Can combine multiple filters (AND logic)
- ✅ Parent context included for all levels (except phase)
- ✅ Pagination working (page, limit, hasMore)

**Performance Requirements**:
- ✅ Simple queries <50ms
- ✅ Complex queries <200ms
- ✅ Large result sets (100 items) <500ms
- ✅ Uses database indexes for all filters

**Quality Requirements**:
- ✅ TypeScript builds successfully (0 errors)
- ✅ Validation errors return helpful messages
- ✅ Response format consistent across all levels
- ✅ All dates returned as ISO strings
- ✅ Integration tests pass (100% coverage)

**Documentation Requirements**:
- ✅ API endpoint documented in api-catalog.md
- ✅ Example requests/responses provided
- ✅ Query parameters documented
- ✅ Error codes documented

---

## Summary

**Key Recommendations**:
1. ✅ **Single endpoint** with `level` parameter (not separate endpoints)
2. ✅ **Zod validation** for query params (type-safe, detailed errors)
3. ✅ **Always include parent context** (useful for reporting, minimal overhead)
4. ✅ **Array status filter** with OR logic (flexible reporting)
5. ✅ **`select` pattern** for 52% smaller payloads
6. ✅ **Pagination** with default limit 20, max 100

**Implementation Time**: ~3 hours (validation 20min + route 60min + tests 45min + docs 15min + testing 30min + buffer 30min)

**Story Points**: 3 points (medium complexity)

---

**Next.js implementation plan complete. Report saved to .agent/task/nextjs-hierarchy-query-20251109-1645.md**

**Parent agent should read this file and implement the API route following the detailed patterns provided.**

**Key recommendations**: Single endpoint with level param, Zod validation for query params, always include parent context using select pattern, array status filter with OR logic, pagination with 20/100 limits.
