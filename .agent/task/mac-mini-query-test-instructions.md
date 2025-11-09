# Mac Mini Instructions: Query Hierarchy Implementation (Day 13 continued)

**Created**: 2025-11-09
**Task**: Build MCP server, test hierarchy query endpoint, verify TypeScript compilation
**Branch**: feature/sprint-1-foundation
**Windows Commit**: Query hierarchy implementation complete (API route, MCP tool, docs)

---

## Context

Windows Claude Code has completed US-007 (minimal 2-point implementation):
- ✅ API route: GET /api/hierarchy/query (status + progress filters)
- ✅ Zod validation: `lib/validation/hierarchy-query.ts`
- ✅ MCP tool: `sprintQueryHierarchy` (8th tool registered)
- ✅ Documentation: Updated api-catalog.md + mcp-tools-guide.md

**Your task**: Build MCP server, test query endpoint (5 test scenarios), verify TypeScript build.

---

## Step 1: Pull Latest Code

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
```

**Verify**: You should see new files:
- `apps/web/lib/validation/hierarchy-query.ts`
- `apps/web/app/api/hierarchy/query/route.ts`
- `apps/mcp-server/src/tools/sprintQueryHierarchy.ts`
- Updated `apps/mcp-server/src/tools/index.ts` (8 tools now)

---

## Step 2: Build MCP Server

```bash
cd ~/projects/AI_HUB/apps/mcp-server

# Install dependencies (if needed)
pnpm install

# Build TypeScript
pnpm build

# Expected output:
# ✔ Built successfully
# ✔ No TypeScript errors
```

**What this does**:
- Compiles `sprintQueryHierarchy.ts` to JavaScript
- Validates all TypeScript types
- Bundles MCP server with 8th tool

**Verify**:
```bash
# Check build output
ls -la dist/tools/sprintQueryHierarchy.js
# Should exist and be recent
```

---

## Step 3: Restart Docker Services

```bash
cd ~/projects/AI_HUB

# Restart to pick up new code
docker-compose -f docker-compose.cloud.yml restart web

# Wait 10 seconds for startup
sleep 10

# Verify health
curl http://192.168.1.15:3000/api/health
# Expected: {"status":"healthy","database":"connected"}
```

---

## Step 4: Integration Testing

### Test 1: Query All Blocked Tasks (Success)

```bash
# Find blocked tasks
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task&status=BLOCKED"
```

**Expected response** (200 OK):
```json
{
  "data": {
    "entities": [
      {
        "id": "...",
        "title": "...",
        "status": "BLOCKED",
        "progress": 0,
        "day": {
          "id": "...",
          "title": "...",
          "week": {
            "id": "...",
            "title": "...",
            "phase": {
              "id": "...",
              "title": "..."
            }
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  },
  "error": null
}
```

**If successful**: ✅ Query API working with status filter

---

### Test 2: Query Low-Progress Tasks (Progress Filter)

```bash
# Find stuck tasks (in progress but low completion)
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task&status=IN_PROGRESS&progressMax=30"
```

**Expected response** (200 OK):
- Should return tasks with status=IN_PROGRESS AND progress <= 30
- Entities array may be empty if no matching tasks
- Pagination metadata should be present

**If successful**: ✅ Progress range filtering working

---

### Test 3: Query Multiple Statuses (OR Logic)

```bash
# Find completed OR blocked tasks
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task&status=COMPLETED&status=BLOCKED"
```

**Expected response** (200 OK):
- Should return tasks with status IN (COMPLETED, BLOCKED)
- OR logic working (matches ANY of the provided statuses)

**If successful**: ✅ Multiple status filters working (OR logic)

---

### Test 4: Validation Error (Invalid Level)

```bash
# Invalid level parameter
curl "http://192.168.1.15:3000/api/hierarchy/query?level=invalid"
```

**Expected response** (400 Bad Request):
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "code": "invalid_enum_value",
        "options": ["phase", "week", "day", "task", "session"],
        "path": ["level"],
        "message": "Invalid enum value. Expected 'phase' | 'week' | 'day' | 'task' | 'session', received 'invalid'"
      }
    ]
  }
}
```

**If successful**: ✅ Validation error handling working

---

### Test 5: Pagination Test

```bash
# Query with pagination
curl "http://192.168.1.15:3000/api/hierarchy/query?level=session&page=1&limit=5"
```

**Expected response** (200 OK):
- Should return max 5 sessions
- Pagination metadata should show page=1, limit=5, total=(count), totalPages=(calculated)

**If successful**: ✅ Pagination working

---

### Test 6: Query All Entity Levels

```bash
# Test each entity level
curl "http://192.168.1.15:3000/api/hierarchy/query?level=phase"
curl "http://192.168.1.15:3000/api/hierarchy/query?level=week"
curl "http://192.168.1.15:3000/api/hierarchy/query?level=day"
curl "http://192.168.1.15:3000/api/hierarchy/query?level=task"
curl "http://192.168.1.15:3000/api/hierarchy/query?level=session"
```

**Expected**: All should return 200 OK with appropriate parent context:
- Phase: No parent context (top level)
- Week: Includes phase context
- Day: Includes week → phase context
- Task: Includes day → week → phase context
- Session: Includes task → day → week → phase context

**If successful**: ✅ All 5 entity levels working with parent context

---

## Step 5: Verify TypeScript Build (Next.js)

```bash
cd ~/projects/AI_HUB/apps/web

# Run TypeScript check
pnpm type-check

# Expected output:
# ✔ No TypeScript errors in new query files
```

**If errors occur**: Report them in this file under "Errors Found" section below.

---

## Step 6: Update Mac Mini Instructions with Results

Add results to this file:

```markdown
## Test Results

**MCP Server Build**: ✅ PASS / ❌ FAIL
**Docker Restart**: ✅ PASS / ❌ FAIL
**API Test 1 (Blocked Tasks)**: ✅ PASS / ❌ FAIL
**API Test 2 (Progress Filter)**: ✅ PASS / ❌ FAIL
**API Test 3 (Multiple Status)**: ✅ PASS / ❌ FAIL
**API Test 4 (Validation Error)**: ✅ PASS / ❌ FAIL
**API Test 5 (Pagination)**: ✅ PASS / ❌ FAIL
**API Test 6 (All Entity Levels)**: ✅ PASS / ❌ FAIL (phase: _, week: _, day: _, task: _, session: _)
**TypeScript Build**: ✅ PASS / ❌ FAIL

**Query Response Times**:
- Simple query (single filter): <___ms
- Complex query (multiple filters): <___ms

**Errors Found** (if any):
<paste error messages here>
```

---

## Step 7: Commit Results

```bash
# Stage this file with results
git add .agent/task/mac-mini-query-test-instructions.md

# Commit
git commit -m "test: verify query hierarchy implementation on Mac mini

- MCP server build: <PASS/FAIL>
- API tests: All <X>/6 scenarios passing
- TypeScript: 0 errors
- Query performance: <___ms simple, <___ms complex
- All 5 entity levels tested with parent context

Sprint 1 Day 13 continued - query filters operational"

# Push
git push origin feature/sprint-1-foundation
```

---

## Success Criteria

All tests must pass:
- ✅ MCP server builds with 0 TypeScript errors
- ✅ API returns 200 for valid queries (all 5 entity levels)
- ✅ Status filter works (single + multiple with OR logic)
- ✅ Progress range filter works (min/max)
- ✅ Pagination works (default 20, custom limit)
- ✅ Validation errors return 400 with details
- ✅ Parent context included for all levels
- ✅ TypeScript builds with 0 errors

**If all pass**: Sprint 1 reaches 96% completion (50/52 points) ✅

---

## Troubleshooting

**MCP server build fails**:
```bash
# Check specific file
cd apps/mcp-server
pnpm tsc src/tools/sprintQueryHierarchy.ts --noEmit
```

**TypeScript errors**:
```bash
# Check specific file
pnpm tsc apps/web/app/api/hierarchy/query/route.ts --noEmit
pnpm tsc apps/web/lib/validation/hierarchy-query.ts --noEmit
```

**API returns 500**:
```bash
# Check Next.js logs
docker logs projectpulse-web-1 --tail 50
```

**Query returns no results but should have data**:
```bash
# Check if test data exists
psql -U postgres -d projectpulse_dev -c "SELECT id, title, status, progress FROM tasks LIMIT 5;"
```

---

**Ready to execute**: Pull code → Build MCP → Test API → Report results → Push

