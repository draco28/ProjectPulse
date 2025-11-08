# Day 6-7 Manual Testing & Completion Plan

**Created**: 2025-11-08 08:30 AM
**Sprint**: Sprint 1 Week 2 Days 6-7
**Goal**: Complete manual testing and verification for sprint.phase.create and sprint.getCurrentTask

---

## Context

**Implementation Status**: 95% complete
- ✅ MCP tools implemented (sprint.phase.create, sprint.getCurrentTask)
- ✅ Next.js API routes created (POST /api/phases, GET /api/tasks/current)
- ✅ TypeScript compilation successful (0 errors)
- ✅ Database index created (tasks_updatedAt_idx)
- ✅ Windows Docker networking resolved (WSL2 hybrid workflow)

**Remaining Work**: Manual testing, documentation updates, verification

---

## Phase 1: Manual API Testing (30 minutes)

### 1.1 Start Development Server

**Command** (from WSL2):
```bash
wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/f/Web_Projects/AI_HUB/apps/web && pnpm dev"
```

**Expected Output**: Server running on http://localhost:3000

**Verification**:
```bash
wsl -d Ubuntu-24.04 -- bash -c "curl http://localhost:3000/api/health"
```

### 1.2 Test POST /api/phases (Success Case)

**Command**:
```bash
wsl -d Ubuntu-24.04 -- bash -c "curl -X POST http://localhost:3000/api/phases \
  -H 'Content-Type: application/json' \
  -d '{
    \"title\": \"Phase 2: API Development\",
    \"description\": \"Build REST APIs for MCP integration\",
    \"startDate\": \"2025-11-10T00:00:00.000Z\",
    \"endDate\": \"2025-12-08T00:00:00.000Z\"
  }' \
  -w '\nResponse time: %{time_total}s\n'"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "phase": {
      "id": "...",
      "title": "Phase 2: API Development",
      "description": "Build REST APIs for MCP integration",
      "startDate": "2025-11-10T00:00:00.000Z",
      "endDate": "2025-12-08T00:00:00.000Z",
      "status": "NOT_STARTED",
      "progress": 0,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "weeks": [
      { "id": "...", "title": "Week 1", "startDate": "2025-11-10T00:00:00.000Z", ... },
      { "id": "...", "title": "Week 2", "startDate": "2025-11-17T00:00:00.000Z", ... },
      { "id": "...", "title": "Week 3", "startDate": "2025-11-24T00:00:00.000Z", ... },
      { "id": "...", "title": "Week 4", "startDate": "2025-12-01T00:00:00.000Z", ... }
    ]
  }
}
```

**Verification Points**:
- ✅ Status code: 201 Created
- ✅ Response format matches OpenAPI spec
- ✅ Phase created with correct data
- ✅ 4 weeks auto-generated (28-day duration)
- ✅ Response time <500ms

### 1.3 Test POST /api/phases (Error Cases)

**Test Case 1: Empty Title (Validation Error)**
```bash
wsl -d Ubuntu-24.04 -- bash -c "curl -X POST http://localhost:3000/api/phases \
  -H 'Content-Type: application/json' \
  -d '{
    \"title\": \"\",
    \"description\": \"Test\",
    \"startDate\": \"2025-11-10T00:00:00.000Z\",
    \"endDate\": \"2025-12-08T00:00:00.000Z\"
  }'"
```

**Expected Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "String must contain at least 1 character(s)"
  }
}
```

**Test Case 2: Invalid Date Range (endDate before startDate)**
```bash
wsl -d Ubuntu-24.04 -- bash -c "curl -X POST http://localhost:3000/api/phases \
  -H 'Content-Type: application/json' \
  -d '{
    \"title\": \"Test Phase\",
    \"description\": \"Test\",
    \"startDate\": \"2025-12-08T00:00:00.000Z\",
    \"endDate\": \"2025-11-10T00:00:00.000Z\"
  }'"
```

**Expected Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "End date must be after start date"
  }
}
```

**Verification Points**:
- ✅ Status code: 400 Bad Request
- ✅ Error format matches spec
- ✅ Error messages are clear

### 1.4 Test GET /api/tasks/current

**Test Case 1: Without Query Params**
```bash
wsl -d Ubuntu-24.04 -- bash -c "curl http://localhost:3000/api/tasks/current \
  -w '\nResponse time: %{time_total}s\n'"
```

**Expected Response** (if IN_PROGRESS task exists):
```json
{
  "success": true,
  "data": {
    "currentTask": {
      "id": "...",
      "title": "Design Prisma Schema",
      "status": "IN_PROGRESS",
      "progress": 50,
      "day": {
        "id": "...",
        "title": "Day 2",
        "progress": 40
      },
      "week": {
        "id": "...",
        "title": "Week 1",
        "progress": 40
      },
      "phase": {
        "id": "...",
        "title": "Phase A - Foundation",
        "progress": 20
      }
    }
  }
}
```

**Expected Response** (if no IN_PROGRESS task):
```json
{
  "success": true,
  "data": {
    "currentTask": null
  }
}
```

**Test Case 2: With includeHistory=true**
```bash
wsl -d Ubuntu-24.04 -- bash -c "curl 'http://localhost:3000/api/tasks/current?includeHistory=true' \
  -w '\nResponse time: %{time_total}s\n'"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "currentTask": {
      "id": "...",
      "title": "Design Prisma Schema",
      "sessions": [
        { "id": "...", "title": "Initial planning", "status": "COMPLETED", ... },
        { "id": "...", "title": "Expert consultation", "status": "IN_PROGRESS", ... }
      ],
      ...
    }
  }
}
```

**Verification Points**:
- ✅ Status code: 200 OK
- ✅ Response format correct
- ✅ Hierarchy flattened (day → week → phase)
- ✅ Sessions included when includeHistory=true
- ✅ Response time <500ms

---

## Phase 2: MCP Server Integration (30 minutes)

### 2.1 Build MCP Server

**Command**:
```bash
cd apps/mcp-server
npm run build
```

**Expected Output**: 
- No TypeScript errors
- Build succeeds
- `dist/` folder created

**Verification**:
```bash
ls -la apps/mcp-server/dist/
# Should show: index.js, tools/, config.js, logger.js, httpClient.js
```

### 2.2 Test Tool Invocations

**Manual Test** (if MCP Inspector available):
1. Start MCP server: `node apps/mcp-server/dist/index.js`
2. Connect with MCP Inspector
3. List tools → verify sprint.phase.create and sprint.getCurrentTask appear
4. Invoke sprint.phase.create with test data
5. Invoke sprint.getCurrentTask
6. Review logs for errors

**Smoke Test** (if MCP Inspector not available):
```bash
node apps/mcp-server/tests/smoke-test.js
```

**Verification Points**:
- ✅ MCP server starts without errors
- ✅ Tools registered correctly
- ✅ Tools can call Next.js API successfully
- ✅ Logs show no errors

---

## Phase 3: Documentation Updates (40 minutes)

### 3.1 Update .agent/system/api-catalog.md

**Add to API Endpoints Section**:

#### POST /api/phases

**Description**: Create a new phase with auto-generated child weeks

**Request**:
```json
{
  "title": "Phase 2: API Development",
  "description": "Build REST APIs for MCP integration",
  "startDate": "2025-11-10T00:00:00.000Z",
  "endDate": "2025-12-08T00:00:00.000Z"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "phase": { "id": "...", "title": "...", ... },
    "weeks": [ { "id": "...", "title": "Week 1", ... } ]
  }
}
```

**Errors**:
- 400 Bad Request: Validation error (empty title, invalid dates)
- 500 Internal Server Error: Database error

**Implementation**: `apps/web/app/api/phases/route.ts`

---

#### GET /api/tasks/current

**Description**: Get the first IN_PROGRESS task with full hierarchy context

**Query Parameters**:
- `includeHistory` (boolean, optional): Include session history

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "currentTask": {
      "id": "...",
      "title": "Design Prisma Schema",
      "status": "IN_PROGRESS",
      "progress": 50,
      "day": { "id": "...", "title": "Day 2", "progress": 40 },
      "week": { "id": "...", "title": "Week 1", "progress": 40 },
      "phase": { "id": "...", "title": "Phase A", "progress": 20 },
      "sessions": [ ... ] // Only if includeHistory=true
    }
  }
}
```

**Response** (200 OK - No active task):
```json
{
  "success": true,
  "data": { "currentTask": null }
}
```

**Implementation**: `apps/web/app/api/tasks/current/route.ts`

---

### 3.2 Update .agent/system/mcp-tools-guide.md

**Add ProjectPulse Tools Section** (if not exists):

## ProjectPulse Sprint Tracking Tools

### sprint.phase.create

**Description**: Create a new sprint phase with auto-generated child weeks

**Usage**:
```typescript
// MCP tool invocation
{
  "name": "projectpulse.sprint.phase.create",
  "arguments": {
    "title": "Phase 2: API Development",
    "description": "Build REST APIs for MCP integration",
    "startDate": "2025-11-10T00:00:00.000Z",
    "durationWeeks": 4
  }
}
```

**Parameters**:
- `title` (string, required): Phase title (1-200 characters)
- `description` (string, optional): Phase description
- `startDate` (ISO 8601, required): Phase start date
- `durationWeeks` (number, optional): Duration in weeks (default: 4, range: 1-52)

**Response**:
```json
{
  "phase": {
    "id": "...",
    "title": "Phase 2: API Development",
    "status": "NOT_STARTED",
    "progress": 0,
    "startDate": "2025-11-10T00:00:00.000Z",
    "endDate": "2025-12-08T00:00:00.000Z"
  },
  "weeks": [
    { "id": "...", "title": "Week 1", "startDate": "2025-11-10T00:00:00.000Z", ... },
    ...
  ]
}
```

**Implementation**: `apps/mcp-server/src/tools/sprintPhaseCreate.ts` → POST /api/phases

---

### sprint.getCurrentTask

**Description**: Get the current IN_PROGRESS task with hierarchical context

**Usage**:
```typescript
// MCP tool invocation
{
  "name": "projectpulse.sprint.getCurrentTask",
  "arguments": {
    "includeHistory": true
  }
}
```

**Parameters**:
- `includeHistory` (boolean, optional): Include session history (default: false)

**Response**:
```json
{
  "currentTask": {
    "id": "...",
    "title": "Design Prisma Schema",
    "status": "IN_PROGRESS",
    "progress": 50,
    "phase": { "title": "Phase A - Foundation", "progress": 20 },
    "week": { "title": "Week 1", "progress": 40 },
    "day": { "title": "Day 2", "progress": 40 },
    "sessions": [ ... ] // Only if includeHistory=true
  }
}
```

**Response** (No active task):
```json
{
  "currentTask": null
}
```

**Implementation**: `apps/mcp-server/src/tools/sprintGetCurrentTask.ts` → GET /api/tasks/current

---

### 3.3 Update Context Files

**Update .agent/active-context.md**:
- Change "Day 6-7 95% COMPLETE" → "Day 6-7 100% COMPLETE ✅"
- Add "Manual testing complete" section
- Update "Next Focus" to "Week 2 Days 8-9"

**Update .agent/progress.md**:
- Update Sprint 1 progress: ~30/52 points → ~35/52 points (67%)
- Add "Week 2 Days 6-7 Complete" entry
- Update "Current Sprint" status

---

## Phase 4: Step 4.5 Verification (30 minutes)

### Requirements from Plan

1. **TypeScript Compilation**
   - Command: `cd apps/mcp-server && npm run build`
   - Expected: 0 errors
   - Evidence: Build output showing "Compiled successfully"

2. **POST /api/phases Response Format**
   - Command: curl POST with valid data
   - Expected: `{ success: true, data: { phase, weeks } }`
   - Evidence: Actual curl output

3. **GET /api/tasks/current Response Format**
   - Command: curl GET
   - Expected: `{ success: true, data: { currentTask } }`
   - Evidence: Actual curl output

4. **Response Times <500ms** (NFR-019)
   - Command: curl with `-w '\nTime: %{time_total}s\n'`
   - Expected: <0.500s for all endpoints
   - Evidence: Time measurements from curl

5. **Error Handling Validated**
   - Command: curl POST with invalid data
   - Expected: 400 status with `{ success: false, error: {...} }`
   - Evidence: Error response outputs

### Verification Documentation

**Update current-session-20251108-0830.md** with:

```markdown
## Step 4.5: Verification Results

### Requirement 1: TypeScript Compilation (0 errors)
✅ Evidence:
```
$ cd apps/mcp-server && npm run build
> projectpulse-mcp-server@1.0.0 build
> tsc

Compiled successfully
```
Status: PASS

### Requirement 2: POST /api/phases Response Format
✅ Evidence:
```
$ curl -X POST http://localhost:3000/api/phases ...
{
  "success": true,
  "data": {
    "phase": { ... },
    "weeks": [ ... ]
  }
}
Response time: 0.234s
```
Status: PASS

### Requirement 3: GET /api/tasks/current Response Format
✅ Evidence:
```
$ curl http://localhost:3000/api/tasks/current
{
  "success": true,
  "data": {
    "currentTask": { ... }
  }
}
Response time: 0.156s
```
Status: PASS

### Requirement 4: Response Times <500ms
✅ Evidence:
- POST /api/phases: 0.234s ✅
- GET /api/tasks/current: 0.156s ✅
Status: PASS

### Requirement 5: Error Handling
✅ Evidence:
```
$ curl -X POST http://localhost:3000/api/phases -d '{"title":""}'
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "String must contain at least 1 character(s)"
  }
}
```
Status: PASS
```

### Pass Criteria

**ALL requirements must pass with evidence before proceeding to Step 5.**

If any requirement fails:
- Mark work as IN PROGRESS
- Fix the issue
- Re-run verification
- Do NOT proceed to completion

---

## Phase 5: Completion (15 minutes)

### 5.1 Optional Completion Document

**File**: `COMPLETION_Day-6-7-MCP-Tools.md` (optional but recommended)

**Content**:
- Summary of what was tested
- API endpoints verified
- MCP tools validated
- Performance metrics
- Issues encountered (if any)
- Lessons learned

### 5.2 Git Commits

**Commit 1: Documentation**
```bash
git add .agent/system/api-catalog.md \
        .agent/system/mcp-tools-guide.md \
        .agent/active-context.md \
        .agent/progress.md \
        .agent/task/

git commit -m "docs: update API catalog and MCP tools guide for Day 6-7

- Add POST /api/phases endpoint documentation
- Add GET /api/tasks/current endpoint documentation
- Document sprint.phase.create MCP tool usage
- Document sprint.getCurrentTask MCP tool usage
- Mark Day 6-7 complete in active-context.md
- Update Sprint 1 progress (67% complete)

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit 2: Code (if any fixes needed)**
```bash
git add apps/mcp-server/ apps/web/app/api/

git commit -m "fix: [description of any fixes]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Success Criteria

- ✅ All API endpoints return correct response formats
- ✅ Response times <500ms (NFR-019 compliance)
- ✅ Error handling validated with actual test cases
- ✅ MCP tools successfully invoke API routes
- ✅ Documentation complete and accurate
- ✅ Step 4.5 verification passed with evidence
- ✅ All changes committed to git

---

## Estimated Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Manual API Testing | 30 min |
| 2 | MCP Server Integration | 30 min |
| 3 | Documentation Updates | 40 min |
| 4 | Step 4.5 Verification | 30 min |
| 5 | Completion & Commits | 15 min |
| **Total** | | **2h 25m** |

---

## Risk Mitigation

**Risk 1: WSL2 environment issues**
- Mitigation: Follow `.agent/sops/windows-docker-networking.md`
- Fallback: Use docker exec for database queries

**Risk 2: MCP Inspector not available**
- Mitigation: Use smoke test script instead
- Fallback: Skip MCP integration testing, verify code review only

**Risk 3: Database empty (no IN_PROGRESS tasks)**
- Mitigation: Check seed data or create test task
- Fallback: Test with null response case

---

**Plan created**: 2025-11-08 08:30 AM
**Estimated completion**: 2025-11-08 11:00 AM
**Next phase after completion**: Days 8-9 (additional MCP tools)
