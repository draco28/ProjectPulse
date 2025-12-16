# Resume Prompt for Sprint 6: Knowledge Graph + Skills System

**Created**: 2025-11-13 14:00
**Purpose**: Resume Sprint 6 work in a new Claude Code session with full context
**Sprint**: Sprint 6 (Weeks 11-12) - 57 points, 20 user stories

---

## Quick Resume (Copy-Paste This)

```
Resume Sprint 6 work. Follow these steps:

1. Read session context:
   - .agent/task/current-session-20251113-1334.md (Sprint 6 goals, expert decisions)
   - .agent/task/current-plan.md (12-day implementation plan)
   - .agent/task/current-todos.md (20 user stories with progress)

2. Check Mac mini services:
   - curl http://192.168.1.15:3000/api/health
   - Must return: {"status":"healthy","database":"connected"}

3. Verify current progress:
   - Which tasks in current-todos.md are checked [ ] vs [x]?
   - What files were created since session start?
   - Any blockers or errors?

4. Continue from where we left off:
   - If Phase 1 not started: Begin Day 1 (US-086, US-087)
   - If Phase 1 in progress: Resume current task
   - Follow current-plan.md phases in order

5. Protocol Step 4 (Checkpoints):
   - Update current-todos.md every 15K tokens
   - Update current-session.md at checkpoints (~110K, ~140K, ~170K)

Confirm current phase and proceed with implementation.
```

---

## Detailed Resume Instructions

### Step 1: Load Session Context (3 files)

**Priority 1 - Session State**:
```
Read: .agent/task/current-session-20251113-1334.md
```
This tells you:
- Sprint 6 scope (US-086 to US-105)
- Expert decisions (prisma-expert + next-js-expert)
- Critical fixes (projectId must be Int, not String)
- Dependencies required (gray-matter, archiver)

**Priority 2 - Implementation Plan**:
```
Read: .agent/task/current-plan.md
```
This tells you:
- All 7 phases (Knowledge → Skills Schema → API → Advanced → Import/Export → Integration → Testing)
- Daily breakdown (Days 1-12)
- Each user story with tasks and acceptance criteria
- Performance targets and token budgets

**Priority 3 - Task Progress**:
```
Read: .agent/task/current-todos.md
```
This tells you:
- Which of 20 user stories are done [x] vs. pending [ ]
- Current phase status (NOT STARTED / IN PROGRESS / COMPLETE)
- MCP tools list (12 tools to implement)
- Checkpoint schedule

---

### Step 2: Verify Mac Mini Services

**Health Check** (CRITICAL - must pass before coding):
```bash
curl http://192.168.1.15:3000/api/health
```

**Expected Response**:
```json
{"status":"healthy","database":"connected"}
```

**If services down**:
- Tell user: "Mac mini services are down. Please start Docker containers."
- Alternative: Use Git communication protocol (see CLAUDE.md section 🔄)

---

### Step 3: Assess Current Progress

**Check Git Status**:
```bash
cd /Users/draco/projects/AI_HUB
git status
```

**Questions to Answer**:
1. Which phase are we in? (Check current-todos.md "Current Phase" line)
2. Which tasks are complete? (Count [x] checkboxes in current-todos.md)
3. What files were created? (git status --short)
4. Any TypeScript errors? (Run: pnpm type-check)
5. Any blockers? (Check session notes in current-session.md)

---

### Step 4: Resume Implementation

**If Phase 1 Not Started** (Day 1):
```
Begin Phase 1: Knowledge Graph Completion
- US-086: Measure query performance (3 pts)
- US-087: Export knowledge graph (2 pts)

First task: Create KnowledgeQueryMetric Prisma model
```

**If Phase 1 In Progress** (Day 1-2):
```
Continue Phase 1 tasks based on current-todos.md checkboxes
- Review what's done [x]
- Start next pending [ ] task
```

**If Phase 2 Not Started** (Day 3):
```
Begin Phase 2: Skills Database & Schema
- US-095: Create Skills Prisma model (CRITICAL: projectId must be Int)
- US-096: Categorize skills
- US-097: Validate skill frontmatter

First task: Fix projectId type (Int not String) and run migration
```

**If Any Phase In Progress**:
```
1. Read last checkpoint in current-session.md
2. Check which tasks are [x] done in current-todos.md
3. Continue with next [ ] pending task
4. Follow current-plan.md for task details
```

---

### Step 5: Follow Protocol Step 4 (Checkpoints)

**Every 15K Tokens**:
1. Update `current-todos.md`:
   - Mark completed tasks [x]
   - Update "Status" line (e.g., "3/20 user stories complete")
   - Update "Points Completed" line (e.g., "8/57 points")
   - Update "Current Phase" line

2. Update `current-session.md`:
   - Add checkpoint entry with timestamp
   - Note progress (tasks done, files created)
   - Note any blockers or issues

3. Confirm checkpoint:
   ```
   ✅ CHECKPOINT at [X]K tokens: Progress saved
   ```

**Token Budget Checkpoints**:
- Checkpoint 2: ~110K tokens (Day 3 complete - Phase 2 done)
- Checkpoint 3: ~140K tokens (Day 6 complete - Phase 4 done)
- Checkpoint 4: ~170K tokens (Day 10 complete - Phase 6 done)
- Checkpoint 5: ~179K tokens (Sprint complete - Phase 7 done)

---

## Expert Reports (If Needed)

**Prisma Schema Design**:
```
Read: .agent/task/prisma-skills-schema-20251113-1420.md
```
Contains:
- Complete Skill model schema
- 7 optimized indexes
- Migration strategy (3 steps)
- Query patterns (5 examples)
- Token efficiency calculations

**Next.js API Architecture**:
```
Read: .agent/task/nextjs-skills-api-routes-20251113-1334.md
```
Contains:
- 13 API endpoint designs
- Validation schemas (Zod)
- LRU cache implementation
- Business logic patterns
- File upload/export handling

---

## Critical Reminders

**⚠️ CRITICAL FIX** (From prisma-expert):
- Skills.projectId MUST be `Int` (not `String`)
- Existing Project.id is `Int @id @default(autoincrement())`
- Update schema BEFORE running migration

**🔒 Multi-Tenancy** (Security Critical):
- ALL Prisma queries MUST include `where: { projectId }`
- ALL API endpoints MUST validate projectId
- Prevents data leakage between end user teams

**📦 Dependencies Required**:
```bash
# Run on Mac mini
cd apps/web
pnpm add gray-matter archiver
pnpm add -D @types/archiver
```

**🎯 Token Efficiency Goals**:
- List 10 skills (frontmatter only): <80 tokens ✅
- Load 1 skill (full content): <250 tokens ✅
- 92% reduction from 2,500 token baseline ✅

---

## Success Criteria (Sprint 6)

**Functional Requirements**:
- [ ] All 20 user stories implemented (US-086 to US-105)
- [ ] Knowledge graph: export, import, metrics, deduplication, archival
- [ ] Skills: lazy-loading, search, categorization, import/export, usage tracking
- [ ] MCP tools: 12 new tools (4 knowledge + 8 skills) for end users' agents
- [ ] Multi-tenancy: Project isolation working correctly

**Performance Requirements**:
- [ ] Knowledge query <200ms (P95)
- [ ] Skills list <50ms (P95)
- [ ] Skills load <100ms (P95)
- [ ] Skills import 50 files <10 seconds

**Quality Gates**:
- [ ] TypeScript: 0 errors
- [ ] Tests: 100% passing (all integration tests)
- [ ] Documentation: All system docs updated
- [ ] Build: Production build succeeds

---

## Common Issues & Solutions

**Issue 1: Mac mini services down**
```bash
# Check Docker containers
docker ps

# Restart if needed
docker-compose -f docker-compose.cloud.yml restart
```

**Issue 2: TypeScript errors after schema change**
```bash
# Regenerate Prisma client
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma generate

# Check types
pnpm type-check
```

**Issue 3: Missing dependencies**
```bash
# Install on Mac mini
cd apps/web
pnpm add gray-matter archiver
pnpm add -D @types/archiver
```

**Issue 4: Lost context after 150K tokens**
- Read current-session.md last checkpoint
- Read current-todos.md to see what's done
- Continue from next pending task

---

## Reference Files

**Protocol Requirements**:
- `.agent/MANDATORY_SESSION_PROTOCOL.md` - Required steps 1-5
- `CLAUDE.md` - Integration guide, Mac mini architecture

**Project Documentation**:
- `docs/13-Project-Plan.md` - Sprint 6 section (line ~1465)
- `docs/12-Backlog.md` - User stories US-086 to US-105

**Progress Tracking**:
- `.agent/progress.md` - Overall progress (264/484 points = 55%)
- `.agent/active-context.md` - Current sprint status

---

## Example Resume Conversation

**You (User)**:
```
Resume Sprint 6 work. Read current-session and current-todos to continue.
```

**Claude Code**:
```
Let me resume Sprint 6 work.

[Reads 3 files: current-session.md, current-plan.md, current-todos.md]

✅ Session Context Loaded:
- Sprint 6: Knowledge Graph + Skills System (57 points)
- Expert consultations complete (prisma + next-js)
- Critical fix identified: projectId must be Int

[Checks Mac mini]
curl http://192.168.1.15:3000/api/health
✅ Services healthy

[Checks progress]
Current todos: 0/20 complete (0%)
Current phase: Phase 1 - Knowledge Graph Completion (NOT STARTED)

Ready to begin Day 1 (US-086, US-087). Shall I proceed with creating KnowledgeQueryMetric model?
```

**You (User)**:
```
Yes, proceed
```

---

## Token Budget Awareness

**Current Session** (as of 2025-11-13 14:00):
- Session start: ~115K tokens
- Remaining: ~85K tokens
- Target: <179K tokens for full sprint (leave 21K buffer)

**If Approaching 180K Tokens**:
1. Save checkpoint to current-session.md
2. Update current-todos.md with progress
3. Tell user: "Approaching token limit. Recommend starting new session."
4. Provide resume prompt for next session

---

**Created**: 2025-11-13 14:00
**Last Updated**: 2025-11-13 14:00
**Next Update**: After first checkpoint (~110K tokens or Day 3 complete)
