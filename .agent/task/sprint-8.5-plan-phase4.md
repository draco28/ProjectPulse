# Sprint 8.5 Phase 4: MCP Read Tools

**Phase**: Sprint 8.5 Phase 4 of 4
**Story Points**: 5 points
**Duration**: 1.5 days (~12 hours)
**Status**: PENDING (blocked by Phase 1)
**Created**: 2025-11-17
**Dependencies**: Phase 1 complete (queries Phase/Sprint/Week/Day hierarchy)

---

## Executive Summary

### Goal
Add 2 efficient MCP read tools to reduce agent queries:
1. **`projectpulse.sprint.getCurrentPosition`** - Get current position in 1 call (vs 5 sequential calls)
2. **`projectpulse.sprint.getPhaseProgress`** - Get full phase progress with all nested children

### Why Important
- **Current Problem**: Agents make 5 sequential queries to get current position:
  1. Query Task (IN_PROGRESS) → Get taskId
  2. Query Day (by taskId) → Get dayId
  3. Query Week (by dayId) → Get weekId  
  4. Query Sprint (by weekId) → Get sprintId
  5. Query Phase (by sprintId) → Get phaseId
- **Token Usage**: 5 calls × ~200 tokens = 1,000 tokens
- **Latency**: 5 calls × ~100ms = 500ms total
- **Solution**: 1 call with nested includes = ~250 tokens, ~150ms

### Architecture Overview

```
getCurrentPosition Flow:
Agent calls: projectpulse.sprint.getCurrentPosition(projectId)
    ↓
MCP server queries: Task (status=IN_PROGRESS, latest updatedAt)
    ↓
Includes: day.week.sprint.phase (5-level nested)
    ↓
Returns: {
  phase: "Phase A: Foundation",
  sprint: "Sprint 1: Setup",
  week: "Week 2",
  day: "Tuesday",
  task: "Implement auth"
}
    ↓
Agent knows position in 1 call (was 5 calls)
80% token reduction, 70% latency reduction

getPhaseProgress Flow:
Agent calls: projectpulse.sprint.getPhaseProgress(phaseId)
    ↓
MCP server queries: Phase with ALL nested children
    ↓
Includes: sprints.weeks.days.tasks (full tree)
    ↓
Returns: {
  phase: { name, progress },
  sprints: [
    { name, progress, weeks: [
      { name, progress, days: [
        { name, progress, tasks: [...] }
      ]}
    ]}
  ]
}
    ↓
Agent sees full hierarchy in 1 call (was 10+ calls)
90% token reduction, 85% latency reduction
```

---

## Implementation Plan

### Part A: Current Position Tool (6 hours)

#### Task A.1: MCP Tool Implementation

**File**: `apps/mcp-server/src/tools/sprint/getCurrentPositionTool.ts` (~90 lines)

**Purpose**: Get agent's current position in hierarchy with 1 query

**Implementation**:
```typescript
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const getCurrentPositionTool = {
  name: 'projectpulse.sprint.getCurrentPosition',
  description: 'Get current position in development hierarchy (Phase → Sprint → Week → Day → Task)',
  inputSchema: z.object({
    projectId: z.number().int().positive(),
  }),

  async handler({ projectId }) {
    // Query latest IN_PROGRESS task with full hierarchy
    const currentTask = await prisma.task.findFirst({
      where: {
        status: 'IN_PROGRESS',
        day: {
          week: {
            sprint: {
              phase: {
                project: {
                  id: projectId,
                },
              },
            },
          },
        },
      },
      include: {
        day: {
          include: {
            week: {
              include: {
                sprint: {
                  include: {
                    phase: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!currentTask) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                currentPosition: null,
                message: 'No active task found. Start working on a task first.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const position = {
      phase: currentTask.day.week.sprint.phase.title,
      sprint: currentTask.day.week.sprint.name,
      week: currentTask.day.week.title,
      day: currentTask.day.title,
      task: currentTask.title,
      taskId: currentTask.id,
      progress: {
        phase: currentTask.day.week.sprint.phase.progress,
        sprint: currentTask.day.week.sprint.progress,
        week: currentTask.day.week.progress,
        day: currentTask.day.progress,
        task: currentTask.progress,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(position, null, 2),
        },
      ],
    };
  },
};
```

**Error Handling**:
- No active task → Return null with helpful message
- Invalid projectId → Validation error
- Database error → Catch and return error message

**Acceptance**:
- [ ] Returns current position with full hierarchy
- [ ] Includes progress percentages at all levels
- [ ] Returns null if no active task
- [ ] Single database query (no N+1 problem)

**Files**:
- `apps/mcp-server/src/tools/sprint/getCurrentPositionTool.ts` (CREATE)

---

#### Task A.2: API Route

**File**: `apps/web/app/api/sprint/current-position/route.ts` (~50 lines)

**Purpose**: REST API endpoint for current position

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId query parameter required' },
      { status: 400 }
    );
  }

  const currentTask = await prisma.task.findFirst({
    where: {
      status: 'IN_PROGRESS',
      day: {
        week: {
          sprint: {
            phase: {
              project: {
                id: parseInt(projectId),
              },
            },
          },
        },
      },
    },
    include: {
      day: {
        include: {
          week: {
            include: {
              sprint: {
                include: {
                  phase: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!currentTask) {
    return NextResponse.json({ currentPosition: null });
  }

  return NextResponse.json({
    phase: currentTask.day.week.sprint.phase.title,
    sprint: currentTask.day.week.sprint.name,
    week: currentTask.day.week.title,
    day: currentTask.day.title,
    task: currentTask.title,
  });
}
```

**Acceptance**:
- [ ] GET `/api/sprint/current-position?projectId=1` returns data
- [ ] 400 if projectId missing
- [ ] Returns null if no active task
- [ ] Returns hierarchy breadcrumb

**Files**:
- `apps/web/app/api/sprint/current-position/route.ts` (CREATE)

---

#### Task A.3: Tests

**File**: `apps/mcp-server/src/tools/__tests__/getCurrentPositionTool.test.ts` (~50 lines)

**Tests**:
```typescript
import { getCurrentPositionTool } from '../sprint/getCurrentPositionTool';
import { prisma } from '@/lib/db';

describe('projectpulse.sprint.getCurrentPosition', () => {
  beforeEach(async () => {
    // Seed test hierarchy
  });

  it('should return current position', async () => {
    const result = await getCurrentPositionTool.handler({ projectId: 1 });
    const position = JSON.parse(result.content[0].text);
    
    expect(position).toHaveProperty('phase');
    expect(position).toHaveProperty('sprint');
    expect(position).toHaveProperty('week');
    expect(position).toHaveProperty('day');
    expect(position).toHaveProperty('task');
  });

  it('should return null if no active task', async () => {
    const result = await getCurrentPositionTool.handler({ projectId: 999 });
    const data = JSON.parse(result.content[0].text);
    
    expect(data.currentPosition).toBeNull();
  });

  it('should include full hierarchy', async () => {
    const result = await getCurrentPositionTool.handler({ projectId: 1 });
    const position = JSON.parse(result.content[0].text);
    
    expect(position.phase).toBe('Phase A: Foundation');
    expect(position.sprint).toBe('Sprint 1: Setup');
  });
});
```

**Acceptance**:
- [ ] 2-3 tests passing
- [ ] Tests cover happy path
- [ ] Tests cover no active task case
- [ ] Tests verify hierarchy structure

**Files**:
- `apps/mcp-server/src/tools/__tests__/getCurrentPositionTool.test.ts` (CREATE)

---

### Part B: Phase Progress Tool (4 hours)

#### Task B.1: MCP Tool Implementation

**File**: `apps/mcp-server/src/tools/sprint/getPhaseProgressTool.ts` (~70 lines)

**Purpose**: Get full phase progress with all nested children

**Implementation**:
```typescript
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const getPhaseProgressTool = {
  name: 'projectpulse.sprint.getPhaseProgress',
  description: 'Get full phase progress with nested sprints, weeks, days, and tasks',
  inputSchema: z.object({
    phaseId: z.string(),
  }),

  async handler({ phaseId }) {
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        sprints: {
          include: {
            weeks: {
              include: {
                days: {
                  include: {
                    tasks: {
                      select: {
                        id: true,
                        title: true,
                        status: true,
                        progress: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!phase) {
      throw new Error(`Phase not found: ${phaseId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(phase, null, 2),
        },
      ],
    };
  },
};
```

**Acceptance**:
- [ ] Returns full nested tree
- [ ] Includes all children (sprints, weeks, days, tasks)
- [ ] Progress percentages included
- [ ] 404 if phase not found

**Files**:
- `apps/mcp-server/src/tools/sprint/getPhaseProgressTool.ts` (CREATE)

---

#### Task B.2: API Route

**File**: `apps/web/app/api/phases/[id]/progress/route.ts` (~40 lines)

**Purpose**: REST API endpoint for phase progress

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const phase = await prisma.phase.findUnique({
    where: { id: params.id },
    include: {
      sprints: {
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  tasks: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!phase) {
    return NextResponse.json(
      { error: 'Phase not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(phase);
}
```

**Acceptance**:
- [ ] GET `/api/phases/[id]/progress` returns nested tree
- [ ] 404 if phase not found
- [ ] Includes all task counts

**Files**:
- `apps/web/app/api/phases/[id]/progress/route.ts` (CREATE)

---

#### Task B.3: Tests

**File**: `apps/mcp-server/src/tools/__tests__/getPhaseProgressTool.test.ts` (~50 lines)

**Tests**:
```typescript
import { getPhaseProgressTool } from '../sprint/getPhaseProgressTool';

describe('projectpulse.sprint.getPhaseProgress', () => {
  it('should return nested tree', async () => {
    const result = await getPhaseProgressTool.handler({ phaseId: '1' });
    const phase = JSON.parse(result.content[0].text);
    
    expect(phase.sprints).toBeInstanceOf(Array);
    expect(phase.sprints[0].weeks).toBeInstanceOf(Array);
  });

  it('should include all children', async () => {
    const result = await getPhaseProgressTool.handler({ phaseId: '1' });
    const phase = JSON.parse(result.content[0].text);
    
    expect(phase.sprints[0].weeks[0].days).toBeDefined();
    expect(phase.sprints[0].weeks[0].days[0].tasks).toBeDefined();
  });

  it('should throw 404 if phase not found', async () => {
    await expect(
      getPhaseProgressTool.handler({ phaseId: '999' })
    ).rejects.toThrow('Phase not found');
  });
});
```

**Acceptance**:
- [ ] 2-3 tests passing
- [ ] Tests verify nested structure
- [ ] Tests cover 404 case

**Files**:
- `apps/mcp-server/src/tools/__tests__/getPhaseProgressTool.test.ts` (CREATE)

---

### Part C: Registration & Integration (2 hours)

#### Task C.1: Update Index

**File**: `apps/mcp-server/src/index.ts` (~6 lines added)

**Purpose**: Register both new tools

**Implementation**:
```typescript
import { getCurrentPositionTool } from './tools/sprint/getCurrentPositionTool.js';
import { getPhaseProgressTool } from './tools/sprint/getPhaseProgressTool.js';

const tools = [
  // ... existing tools ...
  getCurrentPositionTool,
  getPhaseProgressTool,
];
```

**Acceptance**:
- [ ] Both tools registered
- [ ] MCP server starts without errors
- [ ] Tools appear in tool list

**Files**:
- `apps/mcp-server/src/index.ts` (UPDATE)

---

#### Task C.2: Integration Tests

**Manual Testing**:
1. Complete Phase 1 (hierarchy must exist)
2. Create test task with IN_PROGRESS status
3. Call `getCurrentPosition` from Claude Code
4. Call `getPhaseProgress` from Claude Code
5. Measure latency (P95 should be <1s)
6. Verify response structure matches expected format

**Performance Benchmarks**:
- getCurrentPosition: <150ms P95
- getPhaseProgress: <500ms P95 (larger dataset)
- Token usage: ~250 tokens per call (vs 1,000 before)

**Acceptance**:
- [ ] Both tools callable from Claude Code
- [ ] Response structure correct
- [ ] Latency targets met
- [ ] No N+1 query problems

---

## Success Criteria

### Phase 4 Complete When:
- [ ] MCP tool `getCurrentPosition` implemented
- [ ] MCP tool `getPhaseProgress` implemented
- [ ] Both tools registered in MCP server index
- [ ] API route `/api/sprint/current-position` implemented
- [ ] API route `/api/phases/[id]/progress` implemented
- [ ] MCP integration tests: 4-5 tests passing
- [ ] Tools callable from Claude Code
- [ ] Latency <1s for P95
- [ ] No N+1 query problems (verified with Prisma query logging)
- [ ] 80% token reduction achieved (measured)

---

## File Inventory

### New Files (6 total)
1. `apps/mcp-server/src/tools/sprint/getCurrentPositionTool.ts` (CREATE)
2. `apps/mcp-server/src/tools/sprint/getPhaseProgressTool.ts` (CREATE)
3. `apps/web/app/api/sprint/current-position/route.ts` (CREATE)
4. `apps/web/app/api/phases/[id]/progress/route.ts` (CREATE)
5. `apps/mcp-server/src/tools/__tests__/getCurrentPositionTool.test.ts` (CREATE)
6. `apps/mcp-server/src/tools/__tests__/getPhaseProgressTool.test.ts` (CREATE)

### Modified Files (1 total)
1. `apps/mcp-server/src/index.ts` (UPDATE - register 2 tools)

---

## Dependencies

### External
- **Phase 1 complete** - Phase/Sprint/Week/Day hierarchy must exist
- **Prisma nested includes** - Must support 5-level nested queries
- **Task status tracking** - IN_PROGRESS tasks must exist

### Internal
- None (standalone MCP tools)

---

## Timeline

**Part A: Current Position Tool** - 6 hours
- Task A.1: MCP Tool Implementation (3 hours)
- Task A.2: API Route (2 hours)
- Task A.3: Tests (1 hour)

**Part B: Phase Progress Tool** - 4 hours
- Task B.1: MCP Tool Implementation (2 hours)
- Task B.2: API Route (1 hour)
- Task B.3: Tests (1 hour)

**Part C: Registration & Integration** - 2 hours
- Task C.1: Update Index (30 min)
- Task C.2: Integration Tests (1.5 hours)

**Total**: 12 hours (1.5 days)

---

## Risks & Mitigations

### Risk 1: N+1 Query Problem (MEDIUM)
- **Mitigation**: Use Prisma nested includes (single query)
- **Contingency**: Optimize with raw SQL if Prisma has issues

### Risk 2: Large Dataset Performance (LOW)
- **Mitigation**: Limit task selection (only status, id, title)
- **Contingency**: Add pagination if >1000 tasks

### Risk 3: No Active Task (LOW)
- **Mitigation**: Return null with helpful message
- **Contingency**: Suggest starting a task

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Complete Phase 1 (hierarchy exists)
- [ ] Create task with IN_PROGRESS status
- [ ] Call `getCurrentPosition` from Claude Code
- [ ] Verify returned position matches actual state
- [ ] Call `getPhaseProgress` from Claude Code
- [ ] Verify full tree structure returned
- [ ] Measure latency (should be <1s)
- [ ] Compare token usage (before: 1,000, after: ~250)

### Automated Testing
- [ ] 4-5 unit tests across both tools
- [ ] API route tests (optional - covered by MCP tests)
- [ ] Performance benchmark test (measure query time)

### Performance Validation
```bash
# Enable Prisma query logging
export DEBUG="prisma:query"

# Call tools and measure:
time curl 'http://localhost:3000/api/sprint/current-position?projectId=1'
# Target: <150ms

time curl 'http://localhost:3000/api/phases/1/progress'
# Target: <500ms
```

---

**Plan Created**: 2025-11-17
**Last Updated**: 2025-11-17
**Source**: Sprint 8.5 detailed planning
**Review Cycle**: Daily checkpoints
**Sprint 8.5 Complete After**: Phase 4 → Final testing → Sprint closure
