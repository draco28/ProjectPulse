# Integration Test Plan - Days 10-12 MCP Tools

**Created**: 2025-11-09
**Phase**: Sprint 1 Week 2 Days 10-12
**Mac Mini Services**: http://192.168.1.15:3000

---

## Test Environment

**Services Running on Mac Mini (192.168.1.15)**:
- PostgreSQL: Port 5432
- Next.js API: Port 3000
- Database: `projectpulse_dev`

**Test Execution From**: Windows (via curl to Mac mini)

---

## Test 1: Progress Propagation Workflow

**Goal**: Verify Session → Task → Day → Week → Phase roll-up

**Prerequisites**:
- Get existing session ID from seed data
- Session must have parent task/day/week/phase chain

**Test Steps**:

```bash
# Step 1: Get a session ID from database
curl http://192.168.1.15:3000/api/tasks/current

# Step 2: Update session progress to 100%
curl -X PUT http://192.168.1.15:3000/api/sessions/{sessionId}/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 100}'

# Step 3: Verify propagation result
# Expected: Response includes session + task + day + week + phase in propagation.updated array
```

**Success Criteria**:
- ✅ HTTP 200 response
- ✅ `entity.type` = "session"
- ✅ `entity.progress` = 100
- ✅ `entity.status` = "COMPLETED"
- ✅ `propagation.updated` contains task, day, week, phase
- ✅ Each parent shows recalculated progress

---

## Test 2: Task Creation Workflow

**Goal**: Verify task creation with parent day validation

**Prerequisites**:
- Get existing day ID from seed data
- Day must have valid startDate/endDate range

**Test Steps**:

```bash
# Step 1: Get a day ID
# (Use day from seed data or query via Prisma)

# Step 2: Create task under that day
curl -X POST http://192.168.1.15:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "dayId": "{dayId}",
    "title": "Integration Test Task",
    "description": "Created via integration test",
    "startDate": "2025-11-09T00:00:00Z",
    "endDate": "2025-11-09T23:59:59Z",
    "status": "NOT_STARTED",
    "progress": 0
  }'

# Step 3: Verify task was created
# Expected: HTTP 201, task object with hierarchy context
```

**Success Criteria**:
- ✅ HTTP 201 response
- ✅ `task.id` is valid CUID
- ✅ `task.title` = "Integration Test Task"
- ✅ `task.progress` = 0
- ✅ `task.status` = "NOT_STARTED"
- ✅ `context.day.id` matches input dayId
- ✅ `context.week` and `context.phase` populated

---

## Test 3: Session Creation Workflow

**Goal**: Verify session creation with parent task validation

**Prerequisites**:
- Use task created in Test 2 (or get existing task ID)
- Task must have valid date range

**Test Steps**:

```bash
# Step 1: Use task from Test 2 or get existing task ID

# Step 2: Create session under that task
curl -X POST http://192.168.1.15:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "{taskId}",
    "title": "Integration Test Session",
    "description": "Created via integration test",
    "startDate": "2025-11-09T10:00:00Z",
    "endDate": "2025-11-09T12:00:00Z",
    "status": "IN_PROGRESS",
    "progress": 50,
    "notes": "Testing session creation API"
  }'

# Step 3: Verify session was created
# Expected: HTTP 201, session object with hierarchy context
```

**Success Criteria**:
- ✅ HTTP 201 response
- ✅ `session.id` is valid CUID
- ✅ `session.title` = "Integration Test Session"
- ✅ `session.progress` = 50
- ✅ `session.status` = "IN_PROGRESS"
- ✅ `context.task.id` matches input taskId
- ✅ `context.day`, `context.week`, `context.phase` populated

---

## Test 4: Complete Workflow (End-to-End)

**Goal**: Verify entire lifecycle: Create → Update → Propagate

**Flow**:
1. Create task (Test 2)
2. Create session under task (Test 3)
3. Update session progress to 100% (Test 1)
4. Verify task progress recalculated

**Success Criteria**:
- ✅ All CRUD operations succeed
- ✅ Progress propagates correctly
- ✅ Hierarchical context maintained throughout

---

## Error Cases to Test

**Test 5: Invalid Entity ID**
```bash
curl -X PUT http://192.168.1.15:3000/api/sessions/invalid-id/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 50}'

# Expected: HTTP 400, VALIDATION_ERROR
```

**Test 6: Entity Not Found**
```bash
curl -X PUT http://192.168.1.15:3000/api/sessions/clxxxxnonexistent/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 50}'

# Expected: HTTP 404, NOT_FOUND
```

**Test 7: Invalid Progress Range**
```bash
curl -X PUT http://192.168.1.15:3000/api/sessions/{validId}/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 150}'

# Expected: HTTP 400, VALIDATION_ERROR, "Progress must be between 0 and 100"
```

---

## Execution Log

(Results will be documented here during testing)
