# Implementation Plan - Days 10-12: Additional MCP Tools

**Created**: 2025-11-09 00:00
**Phase**: Sprint 1 Week 2 Days 10-12
**Status**: Ready for implementation

---

## Overview

Implement 3 additional MCP tools to complete Sprint 1's core functionality, enabling agents to create tasks/sessions and update progress with automatic roll-up through the 5-level hierarchy.

## Deliverables

**1. MCP Tools (3 new tools)**
- `sprint.updateProgress` - Update any entity's progress, trigger roll-up algorithm
- `sprint.task.create` - Create task under a day with validation
- `sprint.session.create` - Create session under a task with validation

**2. Next.js API Routes (3 new endpoints)**
- `PUT /api/tasks/:id/progress` - Update task progress
- `POST /api/tasks` - Create task
- `POST /api/sessions` - Create session

**3. Integration Testing**
- Progress propagation workflow test (Session 100% → Task → Day → Week → Phase)
- Task creation with parent validation
- Session creation with task linkage

**4. Documentation Updates**
- `.agent/system/api-catalog.md` - Add 3 new endpoints
- `.agent/system/mcp-tools-guide.md` - Add 3 new tools with examples

---

## Implementation Steps

### Part 1: Sprint.updateProgress Tool (Estimated: 25K tokens)

**Step 1.1: Create API Route** (`apps/web/app/api/tasks/[id]/progress/route.ts`)
- Zod schema: `{ progress: number (0-100) }`
- Call `updateProgressAndPropagate()` from `lib/db/progress.ts`
- Return updated task + affected ancestors

**Step 1.2: Create MCP Tool** (`apps/mcp-server/src/tools/updateProgress.ts`)
- Input schema: `taskId` (string), `progress` (number 0-100)
- Handler: PUT to `/api/tasks/:id/progress`
- Response: Success message + propagation summary

**Step 1.3: Register Tool**
- Add to `src/tools/index.ts` registry
- Export from tools module

**Step 1.4: Test Progress Propagation**
- Manual test: Update Session → verify Task/Day/Week/Phase updated
- Verify incremental transaction pattern works

### Part 2: Sprint.task.create Tool (Estimated: 20K tokens)

**Step 2.1: Create API Route** (`apps/web/app/api/tasks/route.ts`)
- Zod schema: `{ dayId, title, description, status?, startDate?, endDate?, estimatedHours? }`
- Validate: dayId exists, dates within day's range
- Create task with Prisma
- Return created task

**Step 2.2: Create MCP Tool** (`apps/mcp-server/src/tools/createTask.ts`)
- Input schema matching API
- Handler: POST to `/api/tasks`
- Response: Created task with full details

**Step 2.3: Register Tool**
- Add to registry with proper typing

### Part 3: Sprint.session.create Tool (Estimated: 20K tokens)

**Step 3.1: Create API Route** (`apps/web/app/api/sessions/route.ts`)
- Zod schema: `{ taskId, title, description?, startTime, endTime?, tokenCount?, notes? }`
- Validate: taskId exists, times are valid
- Create session with Prisma
- Return created session

**Step 3.2: Create MCP Tool** (`apps/mcp-server/src/tools/createSession.ts`)
- Input schema matching API
- Handler: POST to `/api/sessions`
- Response: Created session with full details

**Step 3.3: Register Tool**
- Add to registry

### Part 4: Integration Testing (Estimated: 15K tokens)

**Test 1: Progress Propagation Workflow**
```bash
# Create session → Update to 100% → Verify propagation
1. Create session under task
2. Update session progress to 100%
3. Query task (should reflect progress)
4. Query day, week, phase (should all update)
```

**Test 2: Task Creation Workflow**
```bash
# Create day → Create task under it → Verify relationship
1. Get existing day ID
2. Create task with required fields
3. Verify task appears in day's tasks
```

**Test 3: Session Creation Workflow**
```bash
# Create task → Create session under it → Verify relationship
1. Get existing task ID
2. Create session with time tracking
3. Verify session appears in task's sessions
```

### Part 5: Documentation Updates (Estimated: 10K tokens)

**Update api-catalog.md**
- Document 3 new endpoints with request/response schemas
- Add cURL examples for each

**Update mcp-tools-guide.md**
- Document 3 new tools with usage examples
- Show progress propagation workflow example

---

## Success Criteria

**Functional Requirements:**
- [ ] All 3 MCP tools compile without TypeScript errors
- [ ] All 3 API endpoints return correct responses
- [ ] Progress roll-up propagates through all 5 levels
- [ ] Task creation validates parent day exists
- [ ] Session creation validates parent task exists

**Testing Requirements:**
- [ ] Progress propagation test passes (Session → Phase)
- [ ] Task creation test passes with validation
- [ ] Session creation test passes with validation
- [ ] All integration tests complete in <2 minutes

**Documentation Requirements:**
- [ ] API catalog includes all 3 endpoints with examples
- [ ] MCP tools guide includes all 3 tools with usage
- [ ] Documentation matches actual implementation

---

## Technical Considerations

**Reusing Day 3 Progress Algorithm:**
- `updateProgressAndPropagate()` already exists in `lib/db/progress.ts`
- Incremental transaction pattern (one level at a time)
- No changes needed to core algorithm - just expose via API/MCP

**Validation Strategy:**
- Reuse Zod schemas from `lib/db/validation.ts`
- Additional API-level validation for parent relationships
- Consistent error messages across all tools

**Error Handling:**
- 400: Invalid input (Zod validation failure)
- 404: Parent entity not found
- 500: Database/transaction errors

---

## Estimated Token Budget

| Part | Activity | Estimated Tokens |
|------|----------|------------------|
| 1 | sprint.updateProgress | 25K |
| 2 | sprint.task.create | 20K |
| 3 | sprint.session.create | 20K |
| 4 | Integration testing | 15K |
| 5 | Documentation | 10K |
| **Total** | | **90K tokens** |

**Buffer:** 110K tokens remaining (30K buffer = 33% contingency)

---

## Dependencies

**Existing Code to Leverage:**
- ✅ `lib/db/progress.ts` - Progress roll-up algorithm (Day 3)
- ✅ `lib/db/validation.ts` - Zod schemas (Day 3)
- ✅ `apps/mcp-server/src/tools/` - Tool patterns (Days 4-7)
- ✅ `apps/web/app/api/` - API route patterns (Days 6-7)

**No External Blockers:**
- Mac mini services running
- Database schema complete
- All prerequisites met
