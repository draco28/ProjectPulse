# MCP Tools Specification - Current Work Tracking

**Created**: 2025-11-17
**Sprint**: 8.5 Phase 2
**Purpose**: Define all MCP tools needed for CurrentPlan and CurrentTodos functionality

---

## Overview

This document specifies the MCP tools required to implement the current work tracking feature, where agents track what week/day they're working on via `CurrentPlan` and `CurrentTodos` records in the ProjectPulse database.

**Use Case**: When an agent starts working on a new week or day, they call `updateCurrentPlan()` and `updateCurrentTodos()` to set their current focus. When work is complete, they call `completeCurrentWork()` to mark the week/day as done and move to the next one.

---

## Data Model Reference

**Prisma Models** (defined in `apps/web/prisma/schema.prisma`):

```prisma
model CurrentPlan {
  id        String   @id @default(cuid())
  projectId Int      @unique
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  content   String   @db.Text
  goals     String[] @default([])
  
  weekId    String?
  dayId     String?
  week      Week?    @relation(fields: [weekId], references: [id], onDelete: SetNull)
  day       Day?     @relation(fields: [dayId], references: [id], onDelete: SetNull)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CurrentTodos {
  id        String   @id @default(cuid())
  projectId Int      @unique
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  todos     Json     @db.JsonB // [{ content, status, priority, completedAt? }]
  
  weekId    String?
  dayId     String?
  week      Week?    @relation(fields: [weekId], references: [id], onDelete: SetNull)
  day       Day?     @relation(fields: [dayId], references: [id], onDelete: SetNull)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## MCP Tools to Implement

### 1. `projectpulse.roadmap.updateCurrentPlan`

**Purpose**: Create or update the current work plan for a specific week/day

**Parameters**:
```typescript
{
  projectId: number,
  weekId: string,
  dayId: string,
  data: {
    content: string,  // Markdown plan
    goals: string[]   // Array of goals
  }
}
```

**Returns**:
```typescript
{
  success: boolean,
  currentPlan: {
    id: string,
    projectId: number,
    content: string,
    goals: string[],
    weekId: string,
    dayId: string,
    createdAt: string,
    updatedAt: string
  }
}
```

**Database Operations**:
1. Check if `CurrentPlan` exists for `projectId`
2. If exists: Update `content`, `goals`, `weekId`, `dayId`, `updatedAt`
3. If not exists: Create new `CurrentPlan` record
4. Update `Week.status = IN_PROGRESS` for `weekId`
5. Update `Day.status = IN_PROGRESS` for `dayId`
6. Update `Roadmap.currentWeek` and `Roadmap.currentDay` to match

**Example Usage**:
```typescript
projectpulse.roadmap.updateCurrentPlan(1, "week_xyz", "day_abc", {
  content: "Week 2 Day 3: Implement user authentication\n\n## Overview\n...",
  goals: ["Complete login flow", "Add JWT middleware", "Write tests"]
})
```

---

### 2. `projectpulse.roadmap.updateCurrentTodos`

**Purpose**: Create or update the current todos list for a specific week/day

**Parameters**:
```typescript
{
  projectId: number,
  weekId: string,
  dayId: string,
  data: {
    todos: Array<{
      content: string,
      status: "pending" | "in_progress" | "completed",
      priority: "low" | "medium" | "high",
      completedAt?: string
    }>
  }
}
```

**Returns**:
```typescript
{
  success: boolean,
  currentTodos: {
    id: string,
    projectId: number,
    todos: Array<{...}>,
    weekId: string,
    dayId: string,
    createdAt: string,
    updatedAt: string
  }
}
```

**Database Operations**:
1. Check if `CurrentTodos` exists for `projectId`
2. If exists: Update `todos` JSONB, `weekId`, `dayId`, `updatedAt`
3. If not exists: Create new `CurrentTodos` record
4. Validate todos array structure (Zod schema)

**Example Usage**:
```typescript
projectpulse.roadmap.updateCurrentTodos(1, "week_xyz", "day_abc", {
  todos: [
    { content: "POST /api/login endpoint", status: "pending", priority: "high" },
    { content: "JWT validation middleware", status: "pending", priority: "high" },
    { content: "Login integration tests", status: "pending", priority: "medium" }
  ]
})
```

---

### 3. `projectpulse.roadmap.getCurrentPlan`

**Purpose**: Get the current work plan for a project

**Parameters**:
```typescript
{
  projectId: number
}
```

**Returns**:
```typescript
{
  success: boolean,
  currentPlan: {
    id: string,
    projectId: number,
    content: string,
    goals: string[],
    weekId: string | null,
    dayId: string | null,
    week?: { id: string, title: string },
    day?: { id: string, title: string },
    createdAt: string,
    updatedAt: string
  } | null
}
```

**Database Operations**:
1. Query `CurrentPlan` where `projectId = ?`
2. Include `week` and `day` relations
3. Return `null` if no current plan exists

**Example Usage**:
```typescript
const plan = await projectpulse.roadmap.getCurrentPlan(1)
console.log(plan.currentPlan.content) // "Week 2 Day 3: Implement user authentication..."
```

---

### 4. `projectpulse.roadmap.getCurrentTodos`

**Purpose**: Get the current todos list for a project

**Parameters**:
```typescript
{
  projectId: number
}
```

**Returns**:
```typescript
{
  success: boolean,
  currentTodos: {
    id: string,
    projectId: number,
    todos: Array<{
      content: string,
      status: "pending" | "in_progress" | "completed",
      priority: "low" | "medium" | "high",
      completedAt?: string
    }>,
    weekId: string | null,
    dayId: string | null,
    week?: { id: string, title: string },
    day?: { id: string, title: string },
    createdAt: string,
    updatedAt: string
  } | null
}
```

**Database Operations**:
1. Query `CurrentTodos` where `projectId = ?`
2. Include `week` and `day` relations
3. Return `null` if no current todos exist

**Example Usage**:
```typescript
const todos = await projectpulse.roadmap.getCurrentTodos(1)
const allComplete = todos.currentTodos.todos.every(t => t.status === "completed")
```

---

### 5. `projectpulse.roadmap.completeCurrentWork`

**Purpose**: Mark current week/day as COMPLETED and move to next week/day

**Parameters**:
```typescript
{
  projectId: number
}
```

**Returns**:
```typescript
{
  success: boolean,
  completed: {
    weekId: string,
    dayId: string,
    week: { id: string, title: string, status: "COMPLETED" },
    day: { id: string, title: string, status: "COMPLETED" }
  },
  next: {
    weekId: string | null,
    dayId: string | null,
    week: { id: string, title: string, status: "NOT_STARTED" } | null,
    day: { id: string, title: string, status: "NOT_STARTED" } | null
  }
}
```

**Database Operations**:
1. Get `CurrentPlan` for `projectId` to identify current `weekId` and `dayId`
2. Update `Day.status = COMPLETED` for `dayId`
3. Calculate day progress: Check if all days in week are complete
4. If all days complete:
   - Update `Week.status = COMPLETED` for `weekId`
   - Update `Week.progress = 100`
5. Find next day in current week or next week's first day
6. If next exists:
   - Return `next.weekId`, `next.dayId`
7. If no next (all work complete):
   - Return `next = null`
8. Clear `CurrentPlan` and `CurrentTodos` (or keep for history?)
9. Update `Roadmap.currentWeek` and `Roadmap.currentDay` to next values

**Decision Point**: Should we clear `CurrentPlan` and `CurrentTodos` when moving to next, or keep for history?
- **Option A**: Clear (agent creates fresh plan/todos for next work)
- **Option B**: Keep (allows viewing history of past current-plans/todos)
- **Recommendation**: Option A (clear) - simpler, agent always creates fresh plan

**Example Usage**:
```typescript
const result = await projectpulse.roadmap.completeCurrentWork(1)
console.log(`Completed: ${result.completed.day.title}`)
console.log(`Next: ${result.next.day.title}`)

// Agent then creates new current-plan/todos for next work
if (result.next.dayId) {
  await projectpulse.roadmap.updateCurrentPlan(1, result.next.weekId, result.next.dayId, {...})
  await projectpulse.roadmap.updateCurrentTodos(1, result.next.weekId, result.next.dayId, {...})
}
```

---

## API Routes to Implement

**Base Path**: `apps/web/app/api/roadmap/current-work/`

### 1. `PUT /api/roadmap/current-work/plan`

**Purpose**: Update current plan (called by MCP tool)

**Request Body**:
```typescript
{
  projectId: number,
  weekId: string,
  dayId: string,
  content: string,
  goals: string[]
}
```

**Response**: Same as `updateCurrentPlan` MCP tool

---

### 2. `PUT /api/roadmap/current-work/todos`

**Purpose**: Update current todos (called by MCP tool)

**Request Body**:
```typescript
{
  projectId: number,
  weekId: string,
  dayId: string,
  todos: Array<{...}>
}
```

**Response**: Same as `updateCurrentTodos` MCP tool

---

### 3. `GET /api/roadmap/current-work/plan?projectId={id}`

**Purpose**: Get current plan (called by MCP tool and Roadmap UI)

**Query Params**: `projectId`

**Response**: Same as `getCurrentPlan` MCP tool

---

### 4. `GET /api/roadmap/current-work/todos?projectId={id}`

**Purpose**: Get current todos (called by MCP tool and Roadmap UI)

**Query Params**: `projectId`

**Response**: Same as `getCurrentTodos` MCP tool

---

### 5. `POST /api/roadmap/current-work/complete`

**Purpose**: Complete current work and move to next (called by MCP tool)

**Request Body**:
```typescript
{
  projectId: number
}
```

**Response**: Same as `completeCurrentWork` MCP tool

---

## Roadmap UI Components to Implement

**Location**: `apps/web/app/(dashboard)/roadmap/page.tsx`

### 1. Current Plan Tab/Card

**Display**:
- Current plan markdown content (with formatting)
- Goals list (checkboxes or bullets)
- Which week/day: "Currently working on: Week 2, Day 3"
- Click to expand full plan view (modal or expandable section)

**Data Fetching**:
```typescript
const { data: currentPlan } = useSWR(
  `/api/roadmap/current-work/plan?projectId=${projectId}`,
  fetcher
)
```

**Updates**:
- Auto-refresh when plan changes (SWR revalidation or WebSocket)
- Show "No current plan" if `currentPlan === null`

---

### 2. Current Todos Tab/Card

**Display**:
- Todos list with status (pending, in_progress, completed)
- Progress: "5/12 tasks completed (42%)"
- Which week/day (same as Current Plan)
- Filter buttons: "All", "Pending", "Completed"
- Click to expand full todos view

**Data Fetching**:
```typescript
const { data: currentTodos } = useSWR(
  `/api/roadmap/current-work/todos?projectId=${projectId}`,
  fetcher
)
```

**Interactions**:
- Mark todo as completed (PUT request to update todos array)
- Add new todo (agent can update via MCP, or manual UI)
- Delete todo (optional)

---

## Testing Checklist

- [ ] **Unit Tests**: API routes (`plan`, `todos`, `complete`)
- [ ] **Integration Tests**: MCP tools calling API routes
- [ ] **E2E Tests**: Agent workflow (create plan → complete → move to next)
- [ ] **UI Tests**: Roadmap page displays current plan/todos correctly
- [ ] **Edge Cases**:
  - [ ] Complete last day of last week (no next work)
  - [ ] Create plan when no weeks/days exist
  - [ ] Update plan when week/day already COMPLETED
  - [ ] Handle missing `CurrentPlan` or `CurrentTodos` gracefully

---

## Migration Script

**Purpose**: Add CurrentPlan and CurrentTodos tables to existing ProjectPulse database

**Command**:
```bash
cd apps/web
pnpm prisma migrate dev --name add-current-work-tracking
```

**Migration SQL** (generated by Prisma):
```sql
-- CreateTable
CREATE TABLE "current_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" INTEGER NOT NULL UNIQUE,
    "content" TEXT NOT NULL,
    "goals" TEXT[],
    "weekId" TEXT,
    "dayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
    FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL,
    FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE SET NULL
);

CREATE INDEX "current_plans_projectId_idx" ON "current_plans"("projectId");
CREATE INDEX "current_plans_weekId_dayId_idx" ON "current_plans"("weekId", "dayId");

-- CreateTable
CREATE TABLE "current_todos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" INTEGER NOT NULL UNIQUE,
    "todos" JSONB NOT NULL,
    "weekId" TEXT,
    "dayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
    FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL,
    FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE SET NULL
);

CREATE INDEX "current_todos_projectId_idx" ON "current_todos"("projectId");
CREATE INDEX "current_todos_weekId_dayId_idx" ON "current_todos"("weekId", "dayId");
```

---

## Next Steps

1. **Run migration**: `pnpm prisma migrate dev --name add-current-work-tracking`
2. **Implement API routes**: Create 5 routes in `apps/web/app/api/roadmap/current-work/`
3. **Implement MCP tools**: Add 5 tools to MCP server (`apps/mcp-server/src/tools/roadmap/`)
4. **Implement Roadmap UI**: Add Current Plan and Current Todos tabs to `/roadmap` page
5. **Write tests**: Unit + integration + E2E tests
6. **Update Session 3 bootstrap**: Use new tools to create initial CurrentPlan/CurrentTodos

---

**Status**: ✅ Specification complete - Ready for implementation
**Estimated Effort**: 2-3 days (API routes: 4 hours, MCP tools: 4 hours, UI: 8 hours, Testing: 4 hours)
