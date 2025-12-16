# Day 6-7 Tool Implementation Plan

**Created**: 2025-11-07  
**Sprint**: Sprint 1 Week 1 Days 6-7  
**Goal**: Implement first two MCP tools demonstrating hierarchy CRUD patterns

---

## Overview

This plan details the implementation of two MCP tools that will serve as reference implementations for the remaining 40+ tools in the Sprint 1-8 roadmap.

**Tools to implement**:
1. **sprint.phase.create** - Create new phase with auto-generated weeks
2. **sprint.getCurrentTask** - Query active task with full context

**Success criteria**:
- ✅ Tools pass smoke test (MCP Inspector)
- ✅ Tools integrate with Next.js API (POST /api/phases, GET /api/tasks/current)
- ✅ Zod validation catches invalid inputs
- ✅ Error handling provides clear messages
- ✅ Unit tests cover happy path + error cases

---

## Tool 1: sprint.phase.create

**MCP Tool Name**: `projectpulse.sprint.phase.create`

**Purpose**: Create a new sprint phase with automatic child week generation.

**Use Case**: Agent invokes this tool when user says "Create Phase 2: API Development starting next Monday for 4 weeks"

### Input Schema (Zod)

```typescript
// src/tools/sprintPhaseCreate.ts
import { z } from 'zod';

export const sprintPhaseCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  
  description: z.string()
    .optional(),
  
  startDate: z.string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Start date must be valid ISO 8601 date'
    ),
  
  durationWeeks: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 week')
    .max(52, 'Duration cannot exceed 52 weeks')
    .default(4),
  
  goals: z.array(z.string())
    .optional()
    .default([]),
});

export type SprintPhaseCreateInput = z.infer<typeof sprintPhaseCreateSchema>;
```

**Field Descriptions**:
- `title`: Phase name (required, 1-200 chars)
- `description`: Optional detailed description
- `startDate`: ISO 8601 date string (e.g., "2025-11-10")
- `durationWeeks`: Number of weeks (1-52, default 4)
- `goals`: Array of goal strings (optional)

**Validation Rules**:
- Title must not be empty or only whitespace
- Start date must be valid ISO 8601 format
- Duration must be positive integer ≤52
- End date calculated as: `startDate + (durationWeeks * 7 days)`

### API Integration

**HTTP Request**:
```typescript
// POST http://localhost:3000/api/phases
{
  "title": "Phase 2: API Development",
  "description": "Implement REST APIs for sprint management",
  "startDate": "2025-11-10T00:00:00.000Z",
  "endDate": "2025-12-08T00:00:00.000Z",  // Calculated: startDate + 4 weeks
  "status": "NOT_STARTED",
  "progress": 0
}
```

**HTTP Response** (Success):
```typescript
{
  "success": true,
  "data": {
    "phase": {
      "id": "cm3abc123def456",
      "title": "Phase 2: API Development",
      "description": "Implement REST APIs for sprint management",
      "status": "NOT_STARTED",
      "progress": 0,
      "startDate": "2025-11-10T00:00:00.000Z",
      "endDate": "2025-12-08T00:00:00.000Z",
      "createdAt": "2025-11-07T12:00:00.000Z",
      "updatedAt": "2025-11-07T12:00:00.000Z"
    },
    "weeks": [
      {
        "id": "cm3week1abc",
        "title": "Phase 2: API Development - Week 1",
        "phaseId": "cm3abc123def456",
        "startDate": "2025-11-10T00:00:00.000Z",
        "endDate": "2025-11-17T00:00:00.000Z",
        "status": "NOT_STARTED",
        "progress": 0
      },
      {
        "id": "cm3week2def",
        "title": "Phase 2: API Development - Week 2",
        "phaseId": "cm3abc123def456",
        "startDate": "2025-11-17T00:00:00.000Z",
        "endDate": "2025-11-24T00:00:00.000Z",
        "status": "NOT_STARTED",
        "progress": 0
      },
      {
        "id": "cm3week3ghi",
        "title": "Phase 2: API Development - Week 3",
        "phaseId": "cm3abc123def456",
        "startDate": "2025-11-24T00:00:00.000Z",
        "endDate": "2025-12-01T00:00:00.000Z",
        "status": "NOT_STARTED",
        "progress": 0
      },
      {
        "id": "cm3week4jkl",
        "title": "Phase 2: API Development - Week 4",
        "phaseId": "cm3abc123def456",
        "startDate": "2025-12-01T00:00:00.000Z",
        "endDate": "2025-12-08T00:00:00.000Z",
        "status": "NOT_STARTED",
        "progress": 0
      }
    ]
  }
}
```

**HTTP Response** (Error):
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be 200 characters or less",
    "field": "title"
  }
}
```

### Implementation Steps

**Step 1: Create Zod schema** (`src/tools/sprintPhaseCreate.ts`)
- Define input validation schema
- Export TypeScript type

**Step 2: Implement tool handler** (`src/tools/sprintPhaseCreate.ts`)
```typescript
export async function sprintPhaseCreateHandler(
  input: SprintPhaseCreateInput,
  httpClient: HttpClient
): Promise<string> {
  try {
    // 1. Calculate end date
    const startDate = new Date(input.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (input.durationWeeks * 7));
    
    // 2. Build API request
    const requestBody = {
      title: input.title,
      description: input.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'NOT_STARTED',
      progress: 0,
    };
    
    // 3. Call Next.js API
    const response = await httpClient.post('/api/phases', requestBody);
    
    // 4. Format response for MCP
    if (response.success) {
      return JSON.stringify({
        message: `Phase "${input.title}" created successfully`,
        phaseId: response.data.phase.id,
        weeksCreated: response.data.weeks.length,
        startDate: response.data.phase.startDate,
        endDate: response.data.phase.endDate,
      }, null, 2);
    } else {
      throw new Error(response.error.message);
    }
  } catch (error) {
    return JSON.stringify({
      error: 'Failed to create phase',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, null, 2);
  }
}
```

**Step 3: Register tool** (`src/tools/index.ts`)
```typescript
import { sprintPhaseCreateSchema, sprintPhaseCreateHandler } from './sprintPhaseCreate.js';

export const TOOL_REGISTRY: ToolDefinition[] = [
  // ... existing tools
  {
    name: 'projectpulse.sprint.phase.create',
    description: 'Create a new sprint phase with automatic week generation',
    inputSchema: zodToJsonSchema(sprintPhaseCreateSchema),
    handler: sprintPhaseCreateHandler,
  },
];
```

**Step 4: Create Next.js API route** (`apps/web/app/api/phases/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPhaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
  progress: z.number().int().min(0).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPhaseSchema.parse(body);
    
    // Create phase with auto-generated weeks
    const phase = await prisma.phase.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        progress: validated.progress,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
    });
    
    // Auto-generate weeks
    const weeks = [];
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const week = await prisma.week.create({
        data: {
          title: `${phase.title} - Week ${i + 1}`,
          phaseId: phase.id,
          status: 'NOT_STARTED',
          progress: 0,
          startDate: weekStart,
          endDate: weekEnd,
        },
      });
      
      weeks.push(week);
    }
    
    return NextResponse.json({
      success: true,
      data: { phase, weeks },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
          field: error.errors[0].path[0],
        },
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create phase',
      },
    }, { status: 500 });
  }
}
```

### Test Cases

**Test 1: Valid input (happy path)**
```typescript
// Input
{
  "title": "Phase 2: API Development",
  "description": "Build REST APIs",
  "startDate": "2025-11-10",
  "durationWeeks": 4
}

// Expected: Phase created with 4 weeks
```

**Test 2: Minimal input (defaults)**
```typescript
// Input
{
  "title": "Phase 3",
  "startDate": "2025-12-01"
}

// Expected: Phase created with 4 weeks (default)
```

**Test 3: Invalid title (validation error)**
```typescript
// Input
{
  "title": "",
  "startDate": "2025-11-10"
}

// Expected: Error - "Title is required"
```

**Test 4: Invalid date format**
```typescript
// Input
{
  "title": "Phase 2",
  "startDate": "not-a-date"
}

// Expected: Error - "Start date must be valid ISO 8601 date"
```

**Test 5: Duration out of range**
```typescript
// Input
{
  "title": "Phase 2",
  "startDate": "2025-11-10",
  "durationWeeks": 100
}

// Expected: Error - "Duration cannot exceed 52 weeks"
```

---

## Tool 2: sprint.getCurrentTask

**MCP Tool Name**: `projectpulse.sprint.getCurrentTask`

**Purpose**: Retrieve the currently active task with full hierarchical context.

**Use Case**: Agent invokes this tool when user asks "What am I working on?" or "Show me the current task"

### Input Schema (Zod)

```typescript
// src/tools/sprintGetCurrentTask.ts
import { z } from 'zod';

export const sprintGetCurrentTaskSchema = z.object({
  includeHistory: z.boolean()
    .optional()
    .default(false)
    .describe('Include recent session history'),
});

export type SprintGetCurrentTaskInput = z.infer<typeof sprintGetCurrentTaskSchema>;
```

**Field Descriptions**:
- `includeHistory`: Whether to include recent session history (optional, default false)

### API Integration

**HTTP Request**:
```typescript
// GET http://localhost:3000/api/tasks/current?includeHistory=false
```

**HTTP Response** (Success - Active Task Found):
```typescript
{
  "success": true,
  "data": {
    "currentTask": {
      "id": "cm3task123",
      "title": "Implement POST /api/phases endpoint",
      "description": "Create API route with Prisma integration",
      "status": "IN_PROGRESS",
      "progress": 60,
      "startDate": "2025-11-07T00:00:00.000Z",
      "endDate": null,
      "createdAt": "2025-11-07T08:00:00.000Z",
      "updatedAt": "2025-11-07T11:30:00.000Z",
      
      // Hierarchical context
      "day": {
        "id": "cm3day456",
        "title": "Sprint 1 Week 1 - Day 6",
        "status": "IN_PROGRESS",
        "progress": 30,
        "startDate": "2025-11-07T00:00:00.000Z"
      },
      
      "week": {
        "id": "cm3week789",
        "title": "Sprint 1 - Week 1",
        "status": "IN_PROGRESS",
        "progress": 70,
        "startDate": "2025-11-04T00:00:00.000Z"
      },
      
      "phase": {
        "id": "cm3phase012",
        "title": "Sprint 1: Foundation Setup",
        "status": "IN_PROGRESS",
        "progress": 75,
        "startDate": "2025-11-01T00:00:00.000Z"
      },
      
      // Active sessions (if includeHistory=true)
      "sessions": [
        {
          "id": "cm3session1",
          "title": "API Implementation Session",
          "status": "IN_PROGRESS",
          "progress": 80,
          "startTime": "2025-11-07T10:00:00.000Z",
          "notes": "Implemented schema validation"
        }
      ]
    }
  }
}
```

**HTTP Response** (Success - No Active Task):
```typescript
{
  "success": true,
  "data": {
    "currentTask": null,
    "message": "No task is currently in progress"
  }
}
```

**HTTP Response** (Error):
```typescript
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch current task"
  }
}
```

### Implementation Steps

**Step 1: Create Zod schema** (`src/tools/sprintGetCurrentTask.ts`)

**Step 2: Implement tool handler** (`src/tools/sprintGetCurrentTask.ts`)
```typescript
export async function sprintGetCurrentTaskHandler(
  input: SprintGetCurrentTaskInput,
  httpClient: HttpClient
): Promise<string> {
  try {
    // Call Next.js API
    const queryParams = input.includeHistory ? '?includeHistory=true' : '';
    const response = await httpClient.get(`/api/tasks/current${queryParams}`);
    
    // Format response for MCP
    if (response.success) {
      const { currentTask } = response.data;
      
      if (!currentTask) {
        return JSON.stringify({
          message: 'No active task found',
          suggestion: 'Use sprint.task.list to see all available tasks',
        }, null, 2);
      }
      
      return JSON.stringify({
        currentTask: {
          id: currentTask.id,
          title: currentTask.title,
          description: currentTask.description,
          status: currentTask.status,
          progress: `${currentTask.progress}%`,
        },
        context: {
          day: currentTask.day.title,
          week: currentTask.week.title,
          phase: currentTask.phase.title,
        },
        activeSessions: currentTask.sessions?.length || 0,
      }, null, 2);
    } else {
      throw new Error(response.error.message);
    }
  } catch (error) {
    return JSON.stringify({
      error: 'Failed to fetch current task',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, null, 2);
  }
}
```

**Step 3: Register tool** (`src/tools/index.ts`)

**Step 4: Create Next.js API route** (`apps/web/app/api/tasks/current/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    
    // Find first task with status IN_PROGRESS
    const currentTask = await prisma.task.findFirst({
      where: {
        status: 'IN_PROGRESS',
      },
      include: {
        day: {
          include: {
            week: {
              include: {
                phase: true,
              },
            },
          },
        },
        sessions: includeHistory ? {
          where: {
            status: {
              in: ['IN_PROGRESS', 'COMPLETED'],
            },
          },
          orderBy: {
            startTime: 'desc',
          },
          take: 5,
        } : false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    if (!currentTask) {
      return NextResponse.json({
        success: true,
        data: {
          currentTask: null,
          message: 'No task is currently in progress',
        },
      });
    }
    
    // Flatten nested structure for easier access
    const response = {
      ...currentTask,
      week: currentTask.day.week,
      phase: currentTask.day.week.phase,
    };
    
    delete response.day.week; // Remove nested duplication
    
    return NextResponse.json({
      success: true,
      data: {
        currentTask: response,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch current task',
      },
    }, { status: 500 });
  }
}
```

### Test Cases

**Test 1: Active task exists (happy path)**
```typescript
// Database state: 1 task with status=IN_PROGRESS
// Expected: Task returned with full context
```

**Test 2: No active task**
```typescript
// Database state: All tasks are NOT_STARTED or COMPLETED
// Expected: null with message "No task is currently in progress"
```

**Test 3: Multiple active tasks**
```typescript
// Database state: 2 tasks with status=IN_PROGRESS
// Expected: Most recently updated task returned
```

**Test 4: Include history flag**
```typescript
// Input: { includeHistory: true }
// Expected: Task with sessions array (up to 5 recent sessions)
```

**Test 5: Database connection failure**
```typescript
// Simulate: Prisma connection error
// Expected: Error response with code=INTERNAL_ERROR
```

---

## Implementation Timeline (Days 6-7)

### Day 6 (8 hours)

**Morning (4 hours)**:
- ✅ Create sprint.phase.create Zod schema
- ✅ Implement sprint.phase.create handler
- ✅ Create POST /api/phases Next.js route
- ✅ Manual test with curl

**Afternoon (4 hours)**:
- ✅ Create sprint.getCurrentTask Zod schema
- ✅ Implement sprint.getCurrentTask handler
- ✅ Create GET /api/tasks/current Next.js route
- ✅ Manual test with curl

### Day 7 (8 hours)

**Morning (4 hours)**:
- ✅ Write unit tests for both tools
- ✅ Run smoke tests with MCP Inspector
- ✅ Fix any bugs discovered

**Afternoon (4 hours)**:
- ✅ Integration test with Claude Code
- ✅ Document patterns for future tools
- ✅ Update system documentation

---

## Success Criteria

**Protocol Level**:
- ✅ Both tools registered in MCP server
- ✅ Tools appear in MCP Inspector UI
- ✅ Tools accept valid input without errors
- ✅ Tools return properly formatted JSON

**Integration Level**:
- ✅ Tools successfully call Next.js API
- ✅ Database records created/queried correctly
- ✅ Error responses are informative
- ✅ Response times <500ms (NFR-019)

**Quality Level**:
- ✅ Zod validation catches all invalid inputs
- ✅ Unit tests pass (5 test cases per tool)
- ✅ TypeScript compilation passes
- ✅ ESLint passes with 0 warnings

**Documentation Level**:
- ✅ Tool specs saved to this file
- ✅ API routes documented in api-catalog.md
- ✅ Patterns documented for future tools
- ✅ Troubleshooting guide updated

---

## Patterns for Future Tools

### Reusable Components

**1. Zod Schema Pattern**:
```typescript
export const toolNameSchema = z.object({
  field1: z.string().min(1).max(200),
  field2: z.number().int().min(0).optional(),
  // ... validation rules
});
```

**2. Handler Pattern**:
```typescript
export async function toolHandler(input, httpClient) {
  try {
    // 1. Transform input
    // 2. Call API
    // 3. Format response
    // 4. Return JSON string
  } catch (error) {
    return JSON.stringify({ error, details });
  }
}
```

**3. Next.js API Pattern**:
```typescript
export async function METHOD(request: NextRequest) {
  try {
    // 1. Parse/validate input
    // 2. Query Prisma
    // 3. Return { success: true, data }
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status });
  }
}
```

**4. Error Handling Pattern**:
- Validation errors: 400 status, code=VALIDATION_ERROR
- Not found: 404 status, code=NOT_FOUND
- Server errors: 500 status, code=INTERNAL_ERROR

---

## Files to Create

### MCP Server (`apps/mcp-server/src/tools/`)
- `sprintPhaseCreate.ts` - Tool 1 implementation
- `sprintGetCurrentTask.ts` - Tool 2 implementation
- Update `index.ts` - Register both tools

### Next.js API (`apps/web/app/api/`)
- `phases/route.ts` - POST /api/phases
- `tasks/current/route.ts` - GET /api/tasks/current

### Tests (`apps/mcp-server/tests/`)
- `sprintPhaseCreate.test.ts` - Unit tests for Tool 1
- `sprintGetCurrentTask.test.ts` - Unit tests for Tool 2

### Documentation
- Update `.agent/system/api-catalog.md` - Add new API routes
- Update `.agent/system/mcp-tools-guide.md` - Add tool usage examples

---

## Notes

**Technical Decisions**:
- Week auto-generation: 7-day intervals from startDate
- Progress calculation: Application-managed (not database trigger)
- Error messages: User-friendly, not technical stack traces
- Date handling: ISO 8601 strings in API, Date objects in Prisma

**Performance Considerations**:
- Batch week creation (single transaction)
- Index on tasks.status for getCurrentTask query
- Prisma include depth limit (3 levels max)

**Future Enhancements** (Post-Sprint 1):
- Bulk phase creation
- Phase templates (pre-defined week structures)
- Progress auto-calculation from child entities
- Real-time progress updates via WebSocket

---

**Plan Status**: Ready for Day 6 kickoff  
**Estimated Effort**: 16 hours (2 days)  
**Risk Level**: Low (patterns established, schema defined)
