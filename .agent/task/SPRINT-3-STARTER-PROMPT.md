# Sprint 3 Starter Prompt - Workflow Orchestration System

**Copy-paste this entire prompt into a new Claude Code chat to begin Sprint 3**

---

## MANDATORY PROTOCOL - Session Initialization

Read `.agent/MANDATORY_SESSION_PROTOCOL.md` and follow ALL 5 steps.

**Current Phase**: Sprint 3 - Workflow Orchestration System
**User Stories**: US-032 to US-050 (19 user stories, 48 points)
**Duration**: 2 weeks (Weeks 5-6)
**Branch**: `feature/sprint-3-workflow-orchestration` (create from master)

---

## Context: Sprint 2 Complete ✅

**Sprint 2 Status**: 100% COMPLETE (82/82 points)
- Week 3: Wiki System (US-015 to US-025) - 58 points ✅
- Week 4: Onboarding System (US-026 to US-031) - 24 points ✅

**Current Master Branch**: `v2.0.0-sprint2`
**Overall Progress**: 132/484 story points (27% total, 31% MVP)
**Completed Sprints**: 2/9 (Sprint 1: 50 points, Sprint 2: 82 points)

**Available Infrastructure**:
- ✅ 5-level sprint hierarchy (Phase → Week → Day → Task → Session)
- ✅ 8 sprint MCP tools (phase.create, getCurrentTask, updateProgress, etc.)
- ✅ 3 wiki MCP tools (create, search, update)
- ✅ 2 onboarding MCP tools (getPrompt, submitResponse)
- ✅ Mac mini cloud architecture (192.168.1.15:3000)
- ✅ PostgreSQL database with 20+ models
- ✅ Next.js 14 App Router with ISR
- ✅ TypeScript strict mode (0 errors)

---

## Sprint 3 Goal: Workflow Orchestration System (48 points)

**Vision**: Enable agents to execute predefined multi-step workflows with state tracking, validation, and checkpoint recovery.

**User Stories**: US-032 to US-050 (19 stories across 3 epics)

**Core Concept**:
Agents should be able to:
1. Start a workflow (e.g., "Feature Implementation" workflow)
2. Execute each step sequentially with validation
3. Track progress and state across sessions
4. Resume workflows after context loss (using checkpoints)
5. Complete workflows with success/failure status

**Example Workflow**: "Feature Implementation"
```
Step 1: Create feature branch (validates: clean git status)
Step 2: Run onboarding for feature context (uses onboarding.getPrompt)
Step 3: Create wiki page for feature docs (uses wiki.create)
Step 4: Create sprint task for tracking (uses sprint.task.create)
Step 5: Implement feature code (manual, agent-guided)
Step 6: Run tests (validates: all tests pass)
Step 7: Create checkpoint (uses sprint.checkpoint.create)
Step 8: Create PR (validates: branch pushed)
Step 9: Update wiki with results (uses wiki.update)
Step 10: Mark task complete (uses sprint.updateProgress)
```

---

## Requirements to Read (STEP 1 - MANDATORY)

**Memory Bank Files** (MUST read ALL):
1. `.agent/project-brief.md` - Project vision and goals
2. `.agent/system-patterns.md` - Established patterns (JSONB, ISR, validation)
3. `.agent/tech-context.md` - Tech stack and constraints
4. `.agent/active-context.md` - Current focus (Sprint 3 section)
5. `.agent/progress.md` - Sprint 2 completion summary

**Project Documentation** (read in order):
1. `docs/13-Project-Plan.md` - Sprint 3 section
2. `docs/12-Backlog.md` - US-032 to US-050 user stories
3. `docs/02-SRS.md` - FR-032 to FR-056 functional requirements
4. `docs/03-Architecture.md` - Workflow orchestration architecture
5. `docs/04-Data-and-Model-Spec.md` - Workflow models specification

**Reference Documents**:
- `.agent/system/database-schema.md` - Current Prisma schema (for extending)
- `.agent/system/api-catalog.md` - Existing API patterns
- `.agent/system/mcp-tools-guide.md` - MCP tool patterns
- `docs/archive/completions/SPRINT-2-COMPLETION.md` - Lessons learned

---

## Sprint 3 Scope: 3 Epics, 19 User Stories, 48 Points

### EPIC-004: Workflow Template System (16 points)
**US-032 to US-037** - Database models + 12 workflow templates

- **US-032** (3 pts): WorkflowTemplate model (name, description, steps JSON)
- **US-033** (3 pts): WorkflowRun model (templateId, status, currentStep, context JSONB)
- **US-034** (2 pts): WorkflowStep model (runId, stepNumber, status, result JSONB)
- **US-035** (3 pts): Seed 12 workflow templates (Feature Implementation, Bug Fix, Refactoring, etc.)
- **US-036** (3 pts): Workflow state machine (pending → running → completed/failed/paused)
- **US-037** (2 pts): Step validation rules (preconditions, postconditions)

### EPIC-005: Workflow MCP Tools (16 points)
**US-038 to US-044** - MCP tools for workflow execution

- **US-038** (3 pts): `workflow.list()` - List available workflow templates
- **US-039** (4 pts): `workflow.start()` - Initialize new workflow run
- **US-040** (4 pts): `workflow.executeStep()` - Execute current step with validation
- **US-041** (2 pts): `workflow.getStatus()` - Get current workflow state
- **US-042** (2 pts): `workflow.pause()` - Pause workflow (create checkpoint)
- **US-043** (2 pts): `workflow.resume()` - Resume paused workflow
- **US-044** (3 pts): `workflow.complete()` - Mark workflow as completed/failed

### EPIC-006: Workflow Integration & Testing (16 points)
**US-045 to US-050** - API endpoints + integration tests

- **US-045** (3 pts): GET `/api/workflows` - List workflow templates
- **US-046** (3 pts): POST `/api/workflows/run` - Start new workflow run
- **US-047** (3 pts): GET `/api/workflows/run/:id` - Get workflow run status
- **US-048** (2 pts): POST `/api/workflows/run/:id/step` - Execute next step
- **US-049** (3 pts): Integration tests (3 complete workflows end-to-end)
- **US-050** (2 pts): Checkpoint recovery test (pause workflow, resume after context loss)

---

## Key Technical Decisions (Pre-Approved)

### 1. JSONB Storage for Workflow Context
**Pattern**: Store workflow state, step results, and execution context in JSONB columns

**Rationale**:
- Workflows may have varying context requirements
- Step results can be complex objects (API responses, file paths, etc.)
- No schema migrations needed when workflow templates change
- PostgreSQL JSONB provides excellent query performance

**Example**:
```typescript
// WorkflowRun.context JSONB
{
  projectId: 4,
  featureName: "user-authentication",
  branchName: "feature/user-auth",
  filesCreated: ["auth.ts", "login.tsx"],
  testsRun: true,
  checkpointIds: [123, 124]
}
```

### 2. Workflow Template as JSON Definition
**Pattern**: Store workflow steps as JSON array in WorkflowTemplate.steps

**Rationale**:
- Templates are data, not code (easy to add/modify without code changes)
- Each step has: stepNumber, name, description, mcpTool, validations
- Validation rules are declarative (preconditions, postconditions)

**Example**:
```typescript
// WorkflowTemplate.steps JSON
[
  {
    stepNumber: 1,
    name: "Create Feature Branch",
    description: "Create new git branch for feature",
    mcpTool: null, // Manual step, agent-guided
    preconditions: ["git status is clean"],
    postconditions: ["branch exists", "checked out to new branch"]
  },
  {
    stepNumber: 2,
    name: "Create Sprint Task",
    description: "Track feature in sprint system",
    mcpTool: "sprint.task.create",
    mcpToolArgs: { title: "{featureName}", dayId: "{currentDayId}" },
    preconditions: ["dayId exists"],
    postconditions: ["taskId returned"]
  }
]
```

### 3. State Machine for Workflow Runs
**States**: pending → running → (completed | failed | paused)

**Transitions**:
- `workflow.start()`: pending → running
- `workflow.executeStep()`: running → running (or completed if last step)
- `workflow.pause()`: running → paused (with checkpoint)
- `workflow.resume()`: paused → running
- `workflow.complete()`: running → completed/failed

**Validation**: Each transition validates preconditions before executing

### 4. Checkpoint Integration
**Pattern**: Create checkpoint at strategic workflow steps (every 3-5 steps or before risky operations)

**Rationale**:
- Workflows may span multiple sessions (context loss risk)
- Checkpoints enable recovery without re-executing completed steps
- Checkpoint context includes: workflowRunId, currentStepNumber, executionContext

**Integration**:
- Use existing `sprint.checkpoint.create` MCP tool
- Store checkpointIds in WorkflowRun.context JSONB
- `workflow.resume()` loads latest checkpoint to restore state

---

## 12 Workflow Templates to Implement

### Core Development Workflows (6 templates)
1. **Feature Implementation** (10 steps)
   - Branch creation → Onboarding → Wiki doc → Sprint task → Code → Tests → Checkpoint → PR → Wiki update → Task complete

2. **Bug Fix** (8 steps)
   - Branch creation → Issue investigation → Wiki doc (if new) → Sprint task → Fix code → Tests → PR → Task complete

3. **Refactoring** (7 steps)
   - Branch creation → Code analysis → Sprint task → Refactor code → Tests → PR → Task complete

4. **Documentation Update** (5 steps)
   - Branch creation → Wiki page create/update → Review → PR → Task complete

5. **Test Coverage Improvement** (6 steps)
   - Branch creation → Identify gaps → Sprint task → Write tests → Verify coverage → PR

6. **Database Migration** (9 steps)
   - Branch creation → Prisma schema update → Migration generate → Migration test → Seed update → Deploy → Verify → PR → Task complete

### Project Management Workflows (3 templates)
7. **Sprint Planning** (6 steps)
   - Create phase → Create weeks → Create days → Assign tasks → Set goals → Create checkpoint

8. **Sprint Review** (5 steps)
   - Gather metrics → Create completion doc → Update progress tracker → Demo → Archive

9. **Progress Checkpoint** (4 steps)
   - Query current task → Create checkpoint → Update progress → Save session log

### Knowledge Management Workflows (3 templates)
10. **Wiki Page Creation** (5 steps)
    - Onboarding (gather context) → Draft wiki page → Create page via MCP → Review → Publish

11. **Knowledge Search** (4 steps)
    - Query requirements → Search wiki → Search codebase → Synthesize results

12. **Onboarding New Project** (7 steps)
    - Session 1 (Executive Summary) → Session 2 (Industry Docs) → Session 3 (AI Workflow) → Create wiki → Create sprint phase → Set up tracking → Checkpoint

---

## Database Schema (To Be Created)

### WorkflowTemplate Model
```prisma
model WorkflowTemplate {
  id          Int      @id @default(autoincrement())
  name        String   @unique // "Feature Implementation"
  description String   @db.Text
  category    String   // "development", "project-management", "knowledge"
  steps       Json     // Array of step definitions
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  runs        WorkflowRun[]
}
```

### WorkflowRun Model
```prisma
model WorkflowRun {
  id          Int      @id @default(autoincrement())
  templateId  Int
  projectId   Int?     // Optional: link to project
  status      String   // "pending", "running", "completed", "failed", "paused"
  currentStep Int      @default(1)
  context     Json     // Execution context (JSONB)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  pausedAt    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  template    WorkflowTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  project     Project?         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  steps       WorkflowStep[]

  @@index([templateId, status])
  @@index([projectId, status])
}
```

### WorkflowStep Model
```prisma
model WorkflowStep {
  id          Int      @id @default(autoincrement())
  runId       Int
  stepNumber  Int
  name        String
  status      String   // "pending", "running", "completed", "failed", "skipped"
  result      Json?    // Step execution result (JSONB)
  startedAt   DateTime?
  completedAt DateTime?
  error       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  run         WorkflowRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@unique([runId, stepNumber])
  @@index([runId, status])
}
```

---

## MCP Tools API Signatures

### workflow.list()
```typescript
Input: { category?: string, isActive?: boolean }
Output: { templates: Array<{ id, name, description, category, stepCount }> }
```

### workflow.start()
```typescript
Input: { templateId: number, projectId?: number, initialContext?: Record<string, any> }
Output: { runId: number, status: string, currentStep: number, nextStepName: string }
```

### workflow.executeStep()
```typescript
Input: { runId: number, stepResult?: Record<string, any> }
Output: {
  stepNumber: number,
  stepName: string,
  status: "completed" | "failed",
  nextStep: { stepNumber: number, name: string, description: string } | null,
  workflowStatus: "running" | "completed" | "failed"
}
```

### workflow.getStatus()
```typescript
Input: { runId: number }
Output: {
  runId: number,
  templateName: string,
  status: string,
  currentStep: number,
  totalSteps: number,
  completedSteps: number,
  context: Record<string, any>
}
```

### workflow.pause()
```typescript
Input: { runId: number, reason?: string }
Output: { runId: number, status: "paused", checkpointId: number }
```

### workflow.resume()
```typescript
Input: { runId: number, checkpointId?: number }
Output: { runId: number, status: "running", currentStep: number, nextStepName: string }
```

### workflow.complete()
```typescript
Input: { runId: number, status: "completed" | "failed", summary?: string }
Output: { runId: number, finalStatus: string, completedAt: string, duration: number }
```

---

## API Endpoints to Implement

### GET /api/workflows
**Purpose**: List workflow templates
**Query**: `?category=development&isActive=true`
**Response**: `{ templates: [...] }`

### POST /api/workflows/run
**Purpose**: Start new workflow run
**Body**: `{ templateId, projectId?, initialContext? }`
**Response**: `{ runId, status, currentStep, nextStepName }`

### GET /api/workflows/run/:id
**Purpose**: Get workflow run status
**Response**: `{ run: { id, templateName, status, currentStep, totalSteps, context } }`

### POST /api/workflows/run/:id/step
**Purpose**: Execute next workflow step
**Body**: `{ stepResult?: {...} }`
**Response**: `{ stepNumber, stepName, status, nextStep, workflowStatus }`

---

## Success Criteria (Sprint 3 Exit Criteria)

### Functionality ✅
- [ ] 12 workflow templates seeded in database
- [ ] Agent can list available workflows via MCP
- [ ] Agent can start workflow via `workflow.start()`
- [ ] Agent can execute each step via `workflow.executeStep()`
- [ ] Agent can pause/resume workflows with checkpoints
- [ ] Agent can query workflow status at any time
- [ ] Workflow state persists across sessions (JSONB context)
- [ ] Failed workflows provide error details
- [ ] Completed workflows show execution summary

### Quality ✅
- [ ] TypeScript: 0 errors (strict mode)
- [ ] ESLint: 0 warnings
- [ ] Tests: 100% passing (unit + integration)
- [ ] Performance: API endpoints <500ms (P95), MCP tools <1s (P95)
- [ ] Database: 3 new models with proper indexes
- [ ] Validation: Zod schemas for all MCP tools and API routes

### Integration ✅
- [ ] Workflows can call existing MCP tools (sprint.*, wiki.*, onboarding.*)
- [ ] Checkpoint system integrated (workflow.pause creates checkpoint)
- [ ] Context recovery works (resume workflow after session loss)
- [ ] 3 end-to-end workflow tests passing (Feature Implementation, Bug Fix, Sprint Planning)

### Documentation ✅
- [ ] API endpoints documented in `.agent/system/api-catalog.md`
- [ ] MCP tools documented in `.agent/system/mcp-tools-guide.md`
- [ ] Workflow templates documented in `.agent/system/workflow-templates.md`
- [ ] Session logs created and committed
- [ ] Progress tracker updated (`.agent/progress.md`)

---

## Expert Consultations Required (STEP 3)

**Before starting implementation, consult these experts:**

### 1. prisma-expert
**Topic**: Workflow database schema design
**Questions**:
- Best practices for JSONB storage (context, steps, results)
- Index strategy for workflow queries (status, templateId, projectId)
- Migration strategy (3 new models)
- Relations: WorkflowTemplate → WorkflowRun → WorkflowStep

### 2. next-js-expert
**Topic**: Workflow API architecture
**Questions**:
- API route structure (workflows vs workflows/run)
- Workflow execution endpoint (POST /api/workflows/run/:id/step)
- State management for long-running workflows
- Error handling for failed workflow steps

### 3. react-expert (optional for UI components)
**Topic**: Workflow visualization components (if UI is needed)
**Questions**:
- Workflow step progress indicator
- Live status updates (polling vs SSE)
- Error boundary for failed workflows

**Note**: Sprint 3 focuses on backend/MCP tools. UI can be deferred to Sprint 4+.

---

## Implementation Phases (Suggested 2-Week Plan)

### Week 5 (Days 1-7): Database + Templates
**Day 1-2**: Database schema + migration
- Create WorkflowTemplate, WorkflowRun, WorkflowStep models
- Generate and apply migration
- Consult prisma-expert

**Day 3-5**: Workflow templates
- Seed 12 workflow templates (steps JSON)
- Define validation rules (preconditions, postconditions)
- Test template structure

**Day 6-7**: State machine logic
- Implement workflow state transitions
- Step validation functions
- Error handling

### Week 6 (Days 8-14): MCP Tools + Integration
**Day 8-10**: MCP tools
- Implement 7 MCP tools (list, start, executeStep, getStatus, pause, resume, complete)
- Register tools in `apps/mcp-server/src/tools/index.ts`
- Unit tests for each tool

**Day 11-12**: API endpoints
- Implement 4 API endpoints (GET /api/workflows, POST /api/workflows/run, etc.)
- Zod validation schemas
- Error handling

**Day 13**: Integration tests
- 3 end-to-end workflow tests (Feature Implementation, Bug Fix, Sprint Planning)
- Checkpoint recovery test
- Verify all exit criteria

**Day 14**: Documentation + Sprint closure
- Update `.agent/progress.md`, `.agent/active-context.md`
- Update API catalog and MCP tools guide
- Create Sprint 3 completion document
- Commit and merge to master

---

## Checkpoints (STEP 4 - Every 15K Tokens)

**MANDATORY**: Update these files at every checkpoint:
- `.agent/task/current-session-[timestamp].md`
- `.agent/task/current-todos.md`

**Checkpoint Triggers**: 15K, 30K, 45K, 60K, 75K, 90K tokens

**At Each Checkpoint**:
1. Document progress (what's done, what's next)
2. Update todo list statuses
3. Note any blockers or decisions needed
4. Commit checkpoint to git

---

## Token Budget Management

**Total Budget**: 200K tokens per session
**Sprint 3 Estimate**: 120-150K tokens (moderate complexity)

**Token Allocation**:
- Reading context: ~20K tokens (memory banks + docs)
- Expert consultations: ~15K tokens (3 experts)
- Implementation: ~60-80K tokens (database + MCP tools + API)
- Testing: ~15K tokens (integration tests)
- Documentation: ~10K tokens (progress updates)
- Buffer: ~20K tokens (unexpected issues)

**Strategy**:
- Use sub-agents for research tasks (explore-codebase, analyze-architecture)
- Commit frequently to save progress
- Create checkpoints every 15K tokens

---

## Post-Completion (STEP 5)

**After Sprint 3 is 100% complete:**

1. Create Sprint 3 completion document (use COMPLETION_TEMPLATE.md)
2. Update memory banks:
   - `.agent/progress.md` (Sprint 3 summary)
   - `.agent/active-context.md` (Sprint 4 preview)
   - `.agent/system/workflow-templates.md` (new doc)
3. Invoke sub-agents:
   - `synthesize-docs` (generate workflow SOP)
   - `map-system` (update system docs)
4. Commit documentation first, then code
5. Merge to master with tag `v3.0.0-sprint3`

---

## Common Pitfalls to Avoid (From Sprint 2 Lessons)

### 1. Don't Forget JSONB Flexibility
**Issue**: Hard-coding context fields limits workflow flexibility
**Solution**: Use JSONB for context, steps, and results (schema-less)

### 2. Don't Skip Expert Consultations (STEP 3)
**Issue**: Wrong architectural decisions cost 2-3 days to fix
**Solution**: Consult prisma-expert and next-js-expert BEFORE implementing

### 3. Don't Batch Commit Documentation
**Issue**: Losing progress to context compaction
**Solution**: Commit documentation IMMEDIATELY after each major milestone

### 4. Don't Implement UI Too Early
**Issue**: Sprint 3 focuses on backend/MCP tools, not UI
**Solution**: Defer workflow visualization UI to Sprint 4+ (unless explicitly requested)

### 5. Don't Forget Checkpoint Integration
**Issue**: Workflows span sessions, context loss is inevitable
**Solution**: Integrate `sprint.checkpoint.create` at strategic workflow steps

---

## Quick Start Commands

### Create Sprint 3 Branch
```bash
git checkout master
git pull origin master
git checkout -b feature/sprint-3-workflow-orchestration
git push -u origin feature/sprint-3-workflow-orchestration
```

### Verify Mac Mini Services
```bash
curl http://192.168.1.15:3000/api/health
# Should return: {"status":"healthy","database":"connected"}
```

### Check Current State
```bash
git status
git log --oneline -5
# Verify on master branch, v2.0.0-sprint2 tag visible
```

---

## ENFORCE Protocol Steps (Mandatory)

**At session start, you MUST:**
1. ✅ Read all memory bank files + Sprint 3 docs (STEP 1)
2. ✅ Create implementation plan and save to `.agent/task/current-plan.md` (STEP 2)
3. ✅ Consult experts (prisma-expert, next-js-expert) BEFORE coding (STEP 3)
4. ✅ Create checkpoints every 15K tokens (STEP 4)
5. ✅ Complete post-completion workflow (STEP 5)

**If any step is skipped, STOP and remind me to follow the protocol.**

---

## Final Confirmation

Before proceeding, confirm you have:
- [ ] Read this entire prompt
- [ ] Understand Sprint 3 scope (workflow orchestration, 48 points)
- [ ] Know the 12 workflow templates to implement
- [ ] Understand JSONB storage pattern
- [ ] Know to consult experts BEFORE coding (STEP 3)
- [ ] Understand checkpoint integration requirement
- [ ] Ready to follow MANDATORY_SESSION_PROTOCOL.md

**Reply with**: "✅ Sprint 3 initialized. Ready to consult experts and begin workflow orchestration system implementation."

---

🚀 **Let's build the workflow orchestration system that enables agents to execute complex multi-step processes autonomously!**
