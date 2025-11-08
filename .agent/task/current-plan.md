# Day 8-9 Implementation Plan - Additional MCP Tools

**Created**: 2025-11-08 09:45
**Sprint**: Sprint 1 Week 2 Days 8-9
**Goal**: Implement 3 new MCP tools + fix date validation bug

---

## Overview

**Deliverables**:
1. `sprint.updateProgress` - Update task/session progress with roll-up
2. `sprint.task.create` - Create task within a day
3. `sprint.session.create` - Create session within a task
4. Fix date range validation bug in POST /api/phases

**Total Estimated Time**: 6-8 hours
**Token Budget**: 200K (currently at 110K, 90K remaining)

---

## Success Criteria

**Implementation Complete**:
- ✅ All 3 MCP tools implemented with Zod validation
- ✅ All 3 Next.js API routes created (POST /api/progress, POST /api/tasks, POST /api/sessions)
- ✅ Date validation bug fixed in POST /api/phases
- ✅ TypeScript compilation 0 errors
- ✅ Tools registered in MCP server

**Testing Complete**:
- ✅ Manual curl tests pass for all 4 endpoints
- ✅ Response times <500ms verified
- ✅ Error handling validated (invalid inputs, missing fields)
- ✅ Progress roll-up working (session 100% → task recalculates)

**Documentation Complete**:
- ✅ API catalog updated with 3 new endpoints
- ✅ MCP tools guide updated with 3 new tool examples
- ✅ Context files updated (active-context.md, progress.md)

---

## Implementation Steps

### Phase 1: Bug Fix (30 min)

**Task 1.1: Fix Date Validation in POST /api/phases**

**Current Bug**: API accepts `startDate > endDate` (should reject)

**File to modify**: `apps/web/app/api/phases/route.ts`

**Fix**:
```typescript
// Add custom validator after Zod schema (around line 20)
.refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: "startDate must be before endDate",
  path: ["startDate"],
})
```

**Test**:
```bash
# Should fail with 400
curl -X POST http://localhost:3000/api/phases \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","startDate":"2025-12-01T00:00:00.000Z","endDate":"2025-11-01T00:00:00.000Z"}'
```

---

### Phase 2: Tool 1 - sprint.updateProgress (2 hours)

**User Story**: US-019 from backlog (update progress and trigger roll-up)

**Task 2.1: Create POST /api/progress API Route** (45 min)

**File**: `apps/web/app/api/progress/route.ts`

**Zod Schema**:
```typescript
const schema = z.object({
  entityType: z.enum(['session', 'task', 'day', 'week', 'phase']),
  entityId: z.string().uuid(),
  progress: z.number().int().min(0).max(100),
});
```

**Implementation**:
1. Validate input with Zod
2. Call `updateProgressAndPropagate()` from `lib/db/progress.ts` (already exists from Day 3)
3. Return updated entity + affected parents

**Response Format**:
```typescript
{
  success: true,
  data: {
    updated: { id, type, progress },
    affected: [
      { id, type, progress }, // parent entities that changed
    ]
  }
}
```

**Task 2.2: Create MCP Tool Handler** (45 min)

**File**: `apps/mcp-server/src/tools/sprintUpdateProgress.ts`

**Pattern**: Follow `sprintPhaseCreate.ts` structure
- Zod schema matching API
- httpClient.post to /api/progress
- Type-safe with ApiResponse<> generics
- Formatted response for Claude

**Task 2.3: Register Tool** (5 min)

**File**: `apps/mcp-server/src/tools/index.ts`
- Import tool definition
- Add to loadTools() array

**Task 2.4: Manual Testing** (25 min)

```bash
# Test API directly
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{"entityType":"session","entityId":"<uuid>","progress":100}'

# Test MCP tool (via MCP Inspector or smoke test)
# Verify progress roll-up propagates to parent entities
```

---

### Phase 3: Tool 2 - sprint.task.create (2 hours)

**User Story**: US-004 from backlog (create task within day)

**Task 3.1: Create POST /api/tasks API Route** (45 min)

**File**: `apps/web/app/api/tasks/route.ts`

**Zod Schema**:
```typescript
const schema = z.object({
  dayId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).default('NOT_STARTED'),
  progress: z.number().int().min(0).max(100).default(0),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: "startDate must be before endDate",
  path: ["startDate"],
});
```

**Implementation**:
1. Validate input
2. Verify dayId exists
3. Create task with Prisma
4. Return created task

**Task 3.2: Create MCP Tool Handler** (45 min)

**File**: `apps/mcp-server/src/tools/sprintTaskCreate.ts`

**Pattern**: Similar to sprintPhaseCreate.ts
- Zod schema
- httpClient.post to /api/tasks
- Include hierarchical context in response (day → week → phase)

**Task 3.3: Register Tool** (5 min)

**Task 3.4: Manual Testing** (25 min)

```bash
# Get a valid dayId first
curl http://localhost:3000/api/days  # (needs to be created)

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "dayId":"<uuid>",
    "title":"Implement feature X",
    "startDate":"2025-11-08T08:00:00.000Z",
    "endDate":"2025-11-08T12:00:00.000Z"
  }'
```

---

### Phase 4: Tool 3 - sprint.session.create (2 hours)

**User Story**: US-005 from backlog (create session within task)

**Task 4.1: Create POST /api/sessions API Route** (45 min)

**File**: `apps/web/app/api/sessions/route.ts`

**Zod Schema**:
```typescript
const schema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).default('NOT_STARTED'),
  progress: z.number().int().min(0).max(100).default(0),
  notes: z.string().optional(),
}).refine((data) => !data.endDate || new Date(data.startDate) < new Date(data.endDate), {
  message: "startDate must be before endDate",
  path: ["startDate"],
});
```

**Implementation**:
1. Validate input
2. Verify taskId exists
3. Create session with Prisma
4. Return created session with task context

**Task 4.2: Create MCP Tool Handler** (45 min)

**File**: `apps/mcp-server/src/tools/sprintSessionCreate.ts`

**Pattern**: Similar to previous tools
- Zod schema
- httpClient.post to /api/sessions
- Include full hierarchical context (session → task → day → week → phase)

**Task 4.3: Register Tool** (5 min)

**Task 4.4: Manual Testing** (25 min)

```bash
# Create session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "taskId":"<uuid>",
    "title":"Morning coding session",
    "startDate":"2025-11-08T08:00:00.000Z"
  }'
```

---

### Phase 5: Integration Testing (1 hour)

**Task 5.1: End-to-End Workflow Test** (30 min)

```bash
# Workflow: Create phase → create task → create session → update progress
# 1. Create phase (existing tool)
# 2. Create task in phase's first week's first day
# 3. Create session in that task
# 4. Update session progress to 100%
# 5. Verify progress rolls up to task → day → week → phase
```

**Task 5.2: Build MCP Server** (10 min)

```bash
cd apps/mcp-server
npm run build
# Verify: 0 TypeScript errors
```

**Task 5.3: MCP Tool Smoke Test** (20 min)

- Test tool discovery (list all tools)
- Test each new tool with valid input
- Test error handling with invalid input
- Verify response formats match spec

---

### Phase 6: Documentation (1 hour)

**Task 6.1: Update API Catalog** (20 min)

**File**: `.agent/system/api-catalog.md`

Add sections for:
- POST /api/progress
- POST /api/tasks
- POST /api/sessions

Include: description, request/response examples, validation rules, error responses

**Task 6.2: Update MCP Tools Guide** (20 min)

**File**: `.agent/system/mcp-tools-guide.md`

Add sections for:
- projectpulse.sprint.updateProgress
- projectpulse.sprint.task.create
- projectpulse.sprint.session.create

Include: parameters, examples, use cases, performance notes

**Task 6.3: Update Context Files** (20 min)

**Files**:
- `.agent/active-context.md` - Mark Day 8-9 complete, update recent changes
- `.agent/progress.md` - Update Sprint 1 progress (Week 2 status)

---

## Dependencies

**External Dependencies**: None
- Database already seeded with test data
- Existing utilities (`updateProgressAndPropagate`) ready to use
- MCP server scaffold ready from Day 4

**Internal Dependencies**:
1. Progress roll-up utility (already exists from Day 3)
2. GET /api/days endpoint (may need to create if doesn't exist)
3. WSL2 hybrid workflow (documented in windows-docker-networking.md)

---

## Risk Mitigation

**Risk 1: Progress roll-up performance**
- **Mitigation**: Already optimized with incremental transactions (Day 3)
- **Fallback**: Add indexes if needed (already have 25 indexes from Day 2)

**Risk 2: TypeScript compilation errors**
- **Mitigation**: Define ApiResponse<T> interfaces upfront (learned from Day 6-7)
- **Fallback**: Use Day 6-7 handoff patterns as reference

**Risk 3: WSL2 networking issues**
- **Mitigation**: Use WSL2 commands from start (documented SOP available)
- **Fallback**: Docker exec for quick tests

**Risk 4: Date validation complexity**
- **Mitigation**: Use Zod refine pattern (simple and tested)
- **Example**: Already working in other validation schemas

---

## Token Checkpoints

**15K checkpoint** (~125K total): After Phase 1-2 complete
**30K checkpoint** (~140K total): After Phase 3 complete
**45K checkpoint** (~155K total): After Phase 4-5 complete
**60K checkpoint** (~170K total): After Phase 6 complete (if needed)

**Manual save** if approaching 180K tokens

---

## Technical Decisions

### Decision 1: Use Existing Progress Utility
**Choice**: Call `updateProgressAndPropagate()` from Day 3
**Rationale**: Already tested, handles incremental transactions correctly
**Alternative Rejected**: Rewrite progress logic (duplicates work)

### Decision 2: API Route Structure
**Choice**: Separate routes (POST /api/tasks, POST /api/sessions)
**Rationale**: RESTful design, easier to test, consistent with existing routes
**Alternative Rejected**: Single /api/sprint endpoint with type parameter (less discoverable)

### Decision 3: Date Validation
**Choice**: Zod refine() with custom validator
**Rationale**: Consistent with Zod patterns, easy to test, clear error messages
**Alternative Rejected**: Manual validation in handler (less type-safe)

### Decision 4: Response Format
**Choice**: Include hierarchical context (e.g., session → task → day → week → phase)
**Rationale**: Provides full context for Claude, easier to understand current state
**Alternative Rejected**: Minimal response (forces additional API calls)

---

## File Checklist

**New Files (7)**:
- [ ] `apps/web/app/api/progress/route.ts`
- [ ] `apps/web/app/api/tasks/route.ts`
- [ ] `apps/web/app/api/sessions/route.ts`
- [ ] `apps/mcp-server/src/tools/sprintUpdateProgress.ts`
- [ ] `apps/mcp-server/src/tools/sprintTaskCreate.ts`
- [ ] `apps/mcp-server/src/tools/sprintSessionCreate.ts`
- [ ] `.agent/task/day-8-9-verification-results.md` (Step 4.5)

**Modified Files (3)**:
- [ ] `apps/web/app/api/phases/route.ts` (date validation fix)
- [ ] `apps/mcp-server/src/tools/index.ts` (3 new tool registrations)
- [ ] `.agent/system/api-catalog.md` (3 new endpoints)
- [ ] `.agent/system/mcp-tools-guide.md` (3 new tools)
- [ ] `.agent/active-context.md` (Day 8-9 completion)
- [ ] `.agent/progress.md` (Sprint 1 Week 2 progress)

---

## Completion Criteria

**Code Complete**:
- ✅ All 7 new files created
- ✅ All 6 files modified
- ✅ TypeScript: 0 errors
- ✅ Build: Successful

**Testing Complete**:
- ✅ Manual API tests: All 4 endpoints pass
- ✅ MCP tool tests: All 5 tools functional (including 2 from Day 6-7)
- ✅ Integration test: Phase → Task → Session → Progress workflow
- ✅ Response times: <500ms verified

**Documentation Complete**:
- ✅ API catalog: 3 new endpoints documented
- ✅ MCP tools guide: 3 new tools documented
- ✅ Context files: Updated with Day 8-9 completion
- ✅ Verification report: Step 4.5 evidence documented

---

**Plan Status**: READY FOR APPROVAL
**Estimated Completion**: 6-8 hours
**Token Estimate**: 60-80K tokens (within budget)
