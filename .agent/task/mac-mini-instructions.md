# Mac Mini Instructions: Checkpoint Implementation (Day 13)

**Created**: 2025-11-09
**Task**: Run Prisma migration, build MCP server, test checkpoint creation
**Branch**: feature/sprint-1-foundation
**Windows Commit**: Checkpoint implementation complete (Prisma schema, API route, MCP tool, docs)

---

## Context

Windows Claude Code has completed US-009 checkpoint implementation:
- ✅ Prisma schema: Added Checkpoint model with 3 performance indexes
- ✅ Zod validation: Created `lib/validation/checkpoint.ts`
- ✅ API route: Implemented `POST /api/checkpoints`
- ✅ MCP tool: Created `sprintCheckpointCreateTool` and registered
- ✅ Documentation: Updated api-catalog.md + mcp-tools-guide.md

**Your task**: Run migration, build MCP server, test integration, verify TypeScript build.

---

## Step 1: Pull Latest Code

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
```

**Verify**: You should see new files:
- `apps/web/lib/validation/checkpoint.ts`
- `apps/web/app/api/checkpoints/route.ts`
- `apps/mcp-server/src/tools/sprintCheckpointCreate.ts`
- Updated `apps/web/prisma/schema.prisma` (Checkpoint model added)

---

## Step 2: Run Prisma Migration

```bash
cd ~/projects/AI_HUB/apps/web

# Generate migration
npx prisma migrate dev --name add_checkpoint_model

# Expected output:
# ✔ Migrations applied successfully
# ✔ Generated Prisma Client
```

**What this does**:
- Creates `checkpoints` table in PostgreSQL
- Adds 3 indexes for performance (<50ms queries)
- Adds foreign key to sessions table
- Regenerates Prisma Client with Checkpoint types

**Verify migration**:
```bash
# Check database has checkpoints table
npx prisma studio
# Or query directly:
psql -U postgres -d projectpulse_dev -c "\d checkpoints"
```

Expected table structure:
- `id` (String, CUID)
- `sessionId` (String, FK to sessions)
- `notes` (Text)
- `tokenUsage` (Integer)
- `sessionContext` (JSONB, nullable)
- `checkpointNumber` (Integer)
- `createdAt` (Timestamp)

---

## Step 3: Build MCP Server

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
- Compiles `sprintCheckpointCreate.ts` to JavaScript
- Validates all TypeScript types
- Bundles MCP server with new tool

**Verify**:
```bash
# Check build output
ls -la dist/tools/sprintCheckpointCreate.js
# Should exist and be recent
```

---

## Step 4: Restart Docker Services

```bash
cd ~/projects/AI_HUB

# Restart to pick up new Prisma Client
docker-compose -f docker-compose.cloud.yml restart web

# Wait 10 seconds for startup
sleep 10

# Verify health
curl http://192.168.1.15:3000/api/health
# Expected: {"status":"healthy","database":"connected"}
```

---

## Step 5: Integration Testing

### Test 1: API Route - Create Checkpoint (Success)

```bash
# Get a session ID from database first
SESSION_ID=$(psql -U postgres -d projectpulse_dev -t -c "SELECT id FROM sessions LIMIT 1;" | tr -d ' ')

# Create checkpoint via API
curl -X POST http://192.168.1.15:3000/api/checkpoints \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"${SESSION_ID}\",
    \"notes\": \"Test checkpoint from Mac mini integration test\",
    \"tokenUsage\": 15000,
    \"sessionContext\": {
      \"taskTitle\": \"Checkpoint integration test\",
      \"filesModified\": [\"schema.prisma\", \"route.ts\"],
      \"currentBranch\": \"feature/sprint-1-foundation\",
      \"tokenBudgetRemaining\": 185000
    }
  }"
```

**Expected response** (201 Created):
```json
{
  "data": {
    "id": "clx...",
    "sessionId": "clx...",
    "notes": "Test checkpoint from Mac mini integration test",
    "tokenUsage": 15000,
    "sessionContext": { ... },
    "checkpointNumber": 1,
    "createdAt": "2025-11-09T..."
  },
  "error": null
}
```

**If successful**: ✅ API route working

### Test 2: API Route - Sequential Numbering

```bash
# Create second checkpoint (same session)
curl -X POST http://192.168.1.15:3000/api/checkpoints \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"${SESSION_ID}\",
    \"notes\": \"Second checkpoint test\",
    \"tokenUsage\": 30000
  }"
```

**Expected**: `checkpointNumber: 2` (increments correctly)

### Test 3: API Route - Validation Error

```bash
# Invalid tokenUsage (exceeds 200K)
curl -X POST http://192.168.1.15:3000/api/checkpoints \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"${SESSION_ID}\",
    \"notes\": \"Should fail\",
    \"tokenUsage\": 250000
  }"
```

**Expected response** (400 Bad Request):
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid checkpoint data",
    "details": [ ... "Token usage exceeds maximum (200K)" ... ]
  }
}
```

### Test 4: API Route - Session Not Found

```bash
# Invalid session ID
curl -X POST http://192.168.1.15:3000/api/checkpoints \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"invalid-session-id\",
    \"notes\": \"Should fail\",
    \"tokenUsage\": 15000
  }"
```

**Expected response** (404 Not Found):
```json
{
  "data": null,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with ID invalid-session-id not found"
  }
}
```

### Test 5: MCP Tool - Checkpoint Creation (via MCP Inspector or script)

**If MCP Inspector available**:
1. Connect to MCP server
2. Find tool: `projectpulse.sprint.checkpoint.create`
3. Call with:
```json
{
  "sessionId": "<session-id-from-db>",
  "notes": "MCP tool test checkpoint",
  "tokenUsage": 45000
}
```

**Expected MCP response**:
```json
{
  "status": "success",
  "checkpoint": {
    "id": "clx...",
    "checkpointNumber": 3,
    "sessionId": "clx...",
    "tokenUsage": 45000,
    "createdAt": "..."
  },
  "message": "Checkpoint #3 created successfully",
  "nextCheckpoint": "Create next checkpoint at 60000 tokens"
}
```

**If no MCP Inspector**: Skip this test (API tests sufficient)

---

## Step 6: Verify TypeScript Build (Next.js)

```bash
cd ~/projects/AI_HUB/apps/web

# Run TypeScript check
pnpm type-check

# Expected output:
# ✔ No TypeScript errors
```

**If errors occur**: Report them in this file under "Errors Found" section below.

---

## Step 7: Update Mac Mini Instructions with Results

Add results to this file:

```markdown
## Test Results

**Migration**: ✅ PASS / ❌ FAIL
**MCP Server Build**: ✅ PASS / ❌ FAIL
**Docker Restart**: ✅ PASS / ❌ FAIL
**API Test 1 (Success)**: ✅ PASS / ❌ FAIL
**API Test 2 (Sequential)**: ✅ PASS / ❌ FAIL
**API Test 3 (Validation)**: ✅ PASS / ❌ FAIL
**API Test 4 (404)**: ✅ PASS / ❌ FAIL
**MCP Tool Test**: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED
**TypeScript Build**: ✅ PASS / ❌ FAIL

**Checkpoint IDs Created**:
- Checkpoint 1: <id>
- Checkpoint 2: <id>
- Checkpoint 3: <id>

**Errors Found** (if any):
<paste error messages here>
```

---

## Step 8: Commit Results

```bash
# Stage this file with results
git add .agent/task/mac-mini-instructions.md

# Commit
git commit -m "test: verify checkpoint implementation on Mac mini

- Migration: add_checkpoint_model applied
- API tests: All 4 scenarios passing
- MCP tool: <PASS/SKIPPED>
- TypeScript: 0 errors
- Checkpoint creation: <100ms
- Sequential numbering: Working

Sprint 1 Day 13 complete (checkpoint system operational)"

# Push
git push origin feature/sprint-1-foundation
```

---

## Success Criteria

All tests must pass:
- ✅ Migration creates `checkpoints` table
- ✅ API returns 201 for valid checkpoint
- ✅ Sequential numbering increments correctly
- ✅ Validation errors return 400 with details
- ✅ Session not found returns 404
- ✅ TypeScript builds with 0 errors

**If all pass**: Sprint 1 reaches 92% completion (48/52 points) ✅

---

## Troubleshooting

**Migration fails**:
```bash
# Reset migration (if safe)
npx prisma migrate reset
npx prisma migrate dev
```

**TypeScript errors**:
```bash
# Regenerate Prisma Client
npx prisma generate
# Check specific file
pnpm tsc apps/web/app/api/checkpoints/route.ts --noEmit
```

**API returns 500**:
```bash
# Check Next.js logs
docker logs projectpulse-web-1 --tail 50
```

**MCP server won't start**:
```bash
# Check build output
cd apps/mcp-server
pnpm build --verbose
```

---

**Ready to execute**: Pull code → Run migration → Test → Report results → Push
