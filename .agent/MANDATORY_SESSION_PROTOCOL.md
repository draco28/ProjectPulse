# MANDATORY SESSION PROTOCOL - NO EXCEPTIONS

**Version:** 2.0 (with Verification Gate)
**Created:** 2025-10-28
**Last Updated:** 2025-11-06
**Purpose:** Enforce workflow compliance through user-visible confirmations and evidence-based verification

---

## 🚨 CRITICAL: This Protocol is MANDATORY

**Every development session MUST follow this protocol.**

This protocol exists because:

- I read instructions but don't follow them
- I know what to do but don't do it
- I need explicit prompts with confirmations to stay compliant

**Enforcement:** User-visible confirmations. Missing confirmation = violation.

---

## Copy-Paste This Starter Prompt

At the start of **EVERY** session, copy-paste this into Claude Code:

```
MANDATORY PROTOCOL - Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: [copy from .agent/active-context.md or .agent/progress.md]
Roadmap: [copy from docs/13-Project-Plan.md]
Stories: [copy from docs/12-Backlog.md]

ENFORCE:
- ✅ Step 1: Initialize session
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 4.5: Verification gate (evidence-based)
- ✅ Step 5: Post-completion workflow

Confirm each step explicitly. If you skip ANY step, I will stop you.

Proceed with [phase name].
```

---

## [STEP 1] INITIALIZATION - REQUIRED BEFORE ANY WORK

**Before writing ANY code or making ANY implementation decisions:**

### Required Actions

- [ ] Read .agent/active-context.md and .agent/progress.md, plus docs/13-Project-Plan.md and docs/12-Backlog.md - understand roadmap and stories
- [ ] **Read memory bank files (REQUIRED EVERY SESSION):**
  - [ ] `.agent/project-brief.md` - project goals, constraints, success criteria
  - [ ] `.agent/system-patterns.md` - architecture patterns, established conventions
  - [ ] `.agent/tech-context.md` - tech stack, dependencies, environment constraints
  - [ ] `.agent/active-context.md` - recent work, current focus, blockers
  - [ ] `.agent/progress.md` - overall progress, completion %, lessons learned
- [ ] Create `.agent/task/current-session-[YYYYMMDD-HHMM].md`
  - Document: Current phase, goals, requirements from .agent/progress.md
  - Include: Token budget (200K), session start time, deliverables
- [ ] Read phase-specific `.agent/system/` reference files:
  - API work → `.agent/system/api-catalog.md`
  - Database work → `.agent/system/database-schema.md`
  - Component work → `.agent/system/component-patterns.md`

### REQUIRED CONFIRMATION

**You MUST output this exact confirmation:**

```
✅ STEP 1 COMPLETE: Session initialized at [timestamp]

Created: .agent/task/current-session-[YYYYMMDD-HHMM].md
Current phase: [phase name from .agent/active-context.md or .agent/progress.md]
Goals: [brief description of what needs to be done]
Memory banks loaded:
  ✓ project-brief.md (goals, constraints)
  ✓ system-patterns.md (architecture patterns)
  ✓ tech-context.md (tech stack)
  ✓ active-context.md (recent work, blockers)
  ✓ progress.md (completion %)
Token budget: [current]/200K (including memory banks: ~8-10K)
```

**If you don't see this confirmation, I skipped Step 1. Stop me immediately.**

---

## [STEP 2] PLAN CREATION - SAVE BEFORE ANY CODE

**After understanding requirements, create implementation plan:**

### Required Actions

- [ ] Create implementation plan in conversation (use ExitPlanMode if in plan mode)
- [ ] Get user approval for the plan
- [ ] **IMMEDIATELY** save plan to `.agent/task/current-plan.md`
  - Include: Overview, deliverables, implementation steps, success criteria
  - Single reusable file (overwrites previous plan)
- [ ] Create `.agent/task/current-todos.md` with full task list
  - Include: All tasks with checkboxes, progress percentage, token checkpoints
  - This file will be updated throughout session
- [ ] Create TodoWrite UI list (visual progress tracking)

### REQUIRED CONFIRMATION

**You MUST output this exact confirmation:**

```
✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md

Plan overview: [1-2 sentence summary]
Total tasks: [X]
Files to create/modify: [list]
Estimated tokens: [rough estimate]
```

**If you don't see this confirmation, I skipped saving the plan. Stop me immediately:**

> "You skipped Step 2. Save the plan to current-plan.md RIGHT NOW before continuing."

---

## [STEP 3] EXPERT CONSULTATION - MANDATORY FOR ARCHITECTURAL DECISIONS

**Before implementing new architectures or complex features, invoke expert agents for technical guidance.**

### When Experts Are Required

**Invoke experts for:**

- New component architectures (complex state management, compound patterns)
- Database schema design or migration strategy
- Performance-critical features requiring optimization
- Multi-step workflows or complex user flows

**Experts are optional for:**

- Routine CRUD following established patterns
- UI updates matching existing component conventions
- Minor refactors within established architecture
- Simple features with clear precedent in codebase

### Which Expert to Invoke

**Component Architecture Decisions:**

- [ ] Invoke `react-expert` for:
  - Component composition and prop patterns
  - Custom hooks design
  - State management decisions
  - Performance optimization (memo, useCallback, useMemo)

**Next.js Architecture Decisions:**

- [ ] Invoke `next-js-expert` for:
  - Server vs Client Component decisions
  - Data fetching strategy (Server Components, API routes)
  - Caching and revalidation strategy
  - Route structure and file organization

**Database Schema & Query Decisions:**

- [ ] Invoke `prisma-expert` for:
  - Database schema design and relations
  - Query optimization and N+1 prevention
  - Migration strategy
  - PostgreSQL-specific features (tsvector, pgvector, JSONB)

### REQUIRED CONFIRMATION

**You MUST output this confirmation for EACH expert consulted:**

```
✅ STEP 3 COMPLETE: Consulted [expert-name] for [decision-topic]

Expert recommendation: [1-2 sentence summary of guidance]
Implementation approach: [what you'll do based on expert advice]
```

**Example:**

```
✅ STEP 3 COMPLETE: Consulted react-expert for search component architecture

Expert recommendation: Use compound component pattern with SearchBar + SearchResults,
manage filter state with useReducer for complex filter logic.
Implementation approach: Will create SearchContext with useReducer,
SearchBar and SearchResults as separate components sharing context.
```

**If you skip expert consultation, user will stop you:**

> "You made component architecture decisions without consulting react-expert. Invoke the expert NOW."

---

## [STEP 4] PROGRESS CHECKPOINTS - EVERY 15K TOKENS

**Token tracking is MANDATORY. Save progress at regular intervals.**

### Token Counter Reference

Monitor system warnings: **"Token usage: X/200000"**

- **15K, 30K, 45K, 60K, 75K, 90K tokens** → Checkpoint required
- **140-150K tokens** → Manual save warning (approaching limits)
- **180K+ tokens** → Danger zone (save immediately)

### Required Actions at Each Checkpoint

- [ ] Update `.agent/task/current-session-[timestamp].md`
  - Add progress summary: What's been completed since last checkpoint
  - Note any blockers or issues encountered
  - Update token usage
- [ ] Update `.agent/task/current-todos.md`
  - Mark completed tasks with [x]
  - Update progress percentage
  - Note current task in progress
- [ ] Update TodoWrite UI to match file state

### REQUIRED CONFIRMATION

**You MUST output this confirmation at EACH checkpoint:**

```
✅ CHECKPOINT at [X]K tokens: Progress saved

Completed since last checkpoint:
- [task 1]
- [task 2]

Current progress: [X]/[Y] tasks complete ([Z]%)
Updated: current-session.md, current-todos.md
Next checkpoint: [X+15]K tokens
```

**Example:**

```
✅ CHECKPOINT at 30K tokens: Progress saved

Completed since last checkpoint:
- SearchBar component created
- API route /api/search with tsvector query
- Basic E2E test for search flow

Current progress: 3/12 tasks complete (25%)
Updated: current-session.md, current-todos.md
Next checkpoint: 45K tokens
```

**If you reach 50K tokens without ANY checkpoints, user will stop you:**

> "You're at 50K tokens with ZERO checkpoints. Update current-session.md and current-todos.md RIGHT NOW."

---

## [STEP 4.5] VERIFICATION GATE - REQUIRED BEFORE COMPLETION

**🚨 CRITICAL: Before marking ANY work complete, verify ALL plan requirements with evidence.**

### Why This Step Exists

**Problem:** Protocol can trust documentation claims without verifying actual results.
**Solution:** Evidence-based verification prevents false completion claims.

**Example:** Day 2 marked "complete" but database had 0/3 sessions (per plan requirement).

### Required Actions

**1. Re-read Success Criteria**

- [ ] Open `.agent/task/current-plan.md`
- [ ] Locate "Success Criteria" or "Requirements" section
- [ ] List ALL requirements that must be verified

**2. Verify EACH Requirement with Evidence**

For each requirement, provide **concrete evidence**:

**Database work:**

```sql
-- Example: Verify 3 sessions created
SELECT COUNT(*) FROM sessions WHERE taskId = (SELECT id FROM tasks LIMIT 1);
-- Expected: 3
-- Actual: [show result]
```

**File work:**

```bash
# Example: Verify files created
ls apps/web/app/api/health/route.ts
# Show key content
head -n 20 apps/web/app/api/health/route.ts
```

**Feature work:**

```bash
# Example: Verify tests pass
pnpm test -- health.test.ts
# Expected: All tests passing
# Actual: [show result]
```

**Integration work:**

```bash
# Example: Verify endpoint works
curl localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}
# Actual: [show result]
```

**3. Document Verification Results**

Update `.agent/task/current-session-[timestamp].md` with:

```markdown
## Step 4.5: Verification Results

### Requirement 1: [Description]

✅ Evidence: [Query/Command output showing requirement met]
Expected: [What should exist]
Actual: [What was found]
Status: PASS

### Requirement 2: [Description]

❌ Evidence: [Query/Command output showing gap]
Expected: [What should exist]
Actual: [What was found]
Status: FAIL - [Description of gap]
```

**4. Apply Fail-Fast Rule**

**If ANY requirement fails verification:**

- [ ] Mark work as **IN PROGRESS** (not complete)
- [ ] Update `.agent/task/current-plan.md` with remaining items
- [ ] Update `.agent/task/current-todos.md` with new tasks
- [ ] **DO NOT proceed to Step 5**
- [ ] Continue work until ALL requirements pass
- [ ] Re-run Step 4.5 verification when ready

**Only proceed to Step 5 when ALL requirements verified with evidence.**

### REQUIRED CONFIRMATION

**You MUST output this confirmation when ALL requirements pass:**

```
✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence

Verification summary:
- Requirement 1: ✅ PASS - [brief evidence]
- Requirement 2: ✅ PASS - [brief evidence]
- Requirement 3: ✅ PASS - [brief evidence]
[...list all requirements...]

Evidence documented in: .agent/task/current-session-[timestamp].md
All requirements met. Proceeding to Step 5.
```

**Example:**

```
✅ STEP 4.5 COMPLETE: All 4 requirements verified with evidence

Verification summary:
- Requirement 1: ✅ PASS - File exists at apps/web/app/api/health/route.ts
- Requirement 2: ✅ PASS - TypeScript check passes (0 errors)
- Requirement 3: ✅ PASS - Response format matches spec exactly
- Requirement 4: ✅ PASS - curl test returns {"status":"ok","timestamp":"..."}

Evidence documented in: .agent/task/current-session-20251106-1430.md
All requirements met. Proceeding to Step 5.
```

### Verification Examples

**Example 1: Database Seed Verification**

````markdown
## Success Criteria from Plan

- [ ] 1 Phase created
- [ ] 2 Weeks created
- [ ] 5 Days created
- [ ] 10 Tasks created
- [ ] 3 Sessions created under Task 1

## Step 4.5 Verification

### Database Counts

```sql
SELECT 'Phases' as table_name, COUNT(*) as count FROM phases
UNION ALL
SELECT 'Weeks', COUNT(*) FROM weeks
UNION ALL
SELECT 'Days', COUNT(*) FROM days
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions;
```
````

**Expected:**

```
Phases:   1
Weeks:    2
Days:     5
Tasks:   10
Sessions: 3
```

**Actual:**

```
Phases:   1 ✅
Weeks:    2 ✅
Days:     5 ✅
Tasks:   10 ✅
Sessions: 0 ❌ FAIL
```

**Result:** ❌ VERIFICATION FAILED
**Action:** Do NOT mark complete. Add "Create 3 sessions in seed" to remaining work.

````

**Example 2: API Endpoint Verification**

```markdown
## Success Criteria from Plan
- [ ] File: apps/web/app/api/health/route.ts exists
- [ ] TypeScript: Zero type errors
- [ ] Response: {"status":"ok","timestamp":ISO}
- [ ] Manual test: curl returns correct JSON

## Step 4.5 Verification

### 1. File Exists
```bash
ls apps/web/app/api/health/route.ts
# Output: apps/web/app/api/health/route.ts
````

✅ PASS

### 2. TypeScript Check

```bash
pnpm type-check
# Output: Found 0 errors
```

✅ PASS

### 3. Response Format

```bash
curl localhost:3000/api/health
# Output: {"status":"ok","timestamp":"2025-11-06T14:30:00.000Z"}
```

✅ PASS - Matches spec exactly

### 4. Manual Test

```bash
node -e 'console.log(new Date("2025-11-06T14:30:00.000Z").toISOString())'
# Output: 2025-11-06T14:30:00.000Z
```

✅ PASS - Timestamp is valid ISO format

**Result:** ✅ ALL REQUIREMENTS VERIFIED

```

### Common Evidence Types

**Database:**
- `SELECT COUNT(*) FROM table;` - Verify record counts
- `SELECT * FROM table LIMIT 5;` - Verify data structure
- `EXPLAIN ANALYZE SELECT...;` - Verify query performance

**Files:**
- `ls [path]` - Verify file exists
- `head -n 20 [path]` - Show file content
- `wc -l [path]` - Verify file size

**Tests:**
- `pnpm test -- [pattern]` - Run specific tests
- `pnpm type-check` - Verify TypeScript
- `pnpm lint` - Verify code quality

**Integration:**
- `curl [endpoint]` - Test API endpoints
- `pnpm dev` - Verify app starts
- Manual browser test - Screenshot + description

### Troubleshooting

**Q: What if I can't verify a requirement?**

**A:** Mark verification as BLOCKED, note the blocker, update plan with resolution steps.

**Q: What if requirements were unclear in plan?**

**A:** Clarify with user, update plan with explicit success criteria, then verify.

**Q: What if verification reveals additional work needed?**

**A:** Add to current-todos.md, continue work, re-run Step 4.5 when ready.

**If you skip Step 4.5, user will stop you:**

> "You claimed work is complete without Step 4.5 verification. Run verification with evidence RIGHT NOW."

---

## [STEP 5] POST-COMPLETION - BEFORE FINAL CODE COMMIT

**After feature implementation complete, BEFORE committing code:**

### Required Documentation Updates

- Create completion doc (optional but recommended for complex phases)
- Update memory banks (.agent/active-context.md, .agent/progress.md) and docs/13-Project-Plan.md
- Document what was done, files created/modified, technical decisions
  - Include: Quality gate results (type-check, lint, build, tests)
  - Auto-archived under docs/archive/completions/YYYY-MM/

### Required Project Documentation Updates

**Update project tracking files (when stories/phases complete):**

- [ ] Update `docs/13-Project-Plan.md` traceability matrix:
  - Mark completed user stories: "Not Started" → "Complete" (e.g., US-001, US-002)
  - Update sprint checkpoints: "Sprint 1 End: ✅ Foundation operational" (when sprint completes)
  - Update phase gates: "Phase A Gate: ✅ Can agent complete 5-step protocol?" (when phase completes)
  - Update weekly milestones as they are achieved

- [ ] Update `docs/12-Backlog.md` (ONLY if scope/priorities changed):
  - Add new user stories if requirements expanded
  - Update MoSCoW priorities if changed (e.g., "Should" → "Must")
  - Update story points if re-estimated after implementation
  - Update dependencies if new relationships discovered

### Required Memory Bank Updates

**Update memory banks to reflect session work (REQUIRED EVERY SESSION):**

- [ ] Update `.agent/active-context.md`:
  - What was just completed
  - Current focus for next session
  - Recent technical decisions made
  - Current blockers (if any)
- [ ] Update `.agent/progress.md` (if milestone/phase complete):
  - Overall completion percentage
  - Update phase/day status (mark complete)
  - Add lessons learned
  - Update velocity metrics
- [ ] Update `.agent/system-patterns.md` (if new patterns established):
  - Add new architecture patterns discovered
  - Document new conventions established
  - Update existing patterns if refined
- [ ] Update `.agent/tech-context.md` (if stack changed):
  - Add new dependencies
  - Document new environment constraints
  - Update performance targets if changed

### Required Sub-Agent Invocations

**If new patterns were created:**

- [ ] Invoke `synthesize-docs` sub-agent
  - Generates SOPs from implemented patterns
  - Saves to `.agent/sops/[topic].md`
  - Updates skills if needed

**If system architecture changed:**

- [ ] Invoke `map-system` sub-agent
  - Updates `.agent/system/api-catalog.md` (if new endpoints)
  - Updates `.agent/system/database-schema.md` (if schema changed)
  - Updates `.agent/system/component-patterns.md` (if new patterns)

### Required Git Commits

**Documentation commit (FIRST):**

- [ ] Stage: `git add .agent/ docs/`
- [ ] Commit: `git commit -m "docs: Update documentation after [phase]"`

**Code commit (SECOND):**

- [ ] Stage code files: `git add [code files]`
- [ ] Commit: `git commit -m "feat: [feature description] 🤖 Generated with Claude Code..."`

### REQUIRED CONFIRMATION

**You MUST output this confirmation:**

```

✅ STEP 5 COMPLETE: All documentation updated and committed

Project docs updated:

- docs/13-Project-Plan.md (US-001, US-002 marked complete)
- docs/12-Backlog.md (no changes - scope unchanged)
- Completion doc created (if applicable)

Memory banks updated:

- active-context.md (recent work, next focus)
- progress.md (completion %, lessons learned)
- system-patterns.md (new patterns if any)
- tech-context.md (stack changes if any)

Sub-agent invocations:

- synthesize-docs → SOP saved
- map-system → system docs updated

Git commits:

- [hash] docs: Update documentation and memory banks after [phase]
- [hash] feat: [feature description]

All quality gates passed ✅

```

**If you jump straight to code commit without docs, user will stop you:**

> "Complete the full post-completion workflow from Step 5 of the protocol BEFORE committing code."

---

## 🚨 VIOLATION POLICY

**If I skip ANY step or confirmation:**

### User Actions

**You MUST stop me immediately and make me complete the missing step.**

Examples:

- "You skipped Step 2. Save the plan to current-plan.md RIGHT NOW."
- "Where's the Step 3 confirmation? Consult react-expert for component architecture NOW."
- "You're at 75K tokens with only one checkpoint. Update session/todos files NOW."
- "You committed code without running Step 5. Revert and complete post-completion workflow."

### My Responsibility

- I cannot skip steps (they're in the prompt I'm responding to)
- I must confirm explicitly (confirmations are visible to you)
- I must track tokens and save at checkpoints
- I must invoke experts before making decisions
- I must complete post-completion workflow before final commit

---

## Why This Protocol Works

### Previous System (Failed)

- **CLAUDE.md:** "I do things AUTOMATICALLY"
- **Reality:** I don't do them automatically
- **Problem:** Instructions I can choose to ignore

### New System (Enforceable)

- **Protocol:** Explicit steps in the starter prompt
- **Confirmations:** User-visible (missing confirmation = caught violation)
- **Enforcement:** User can immediately call out violations
- **Result:** Steps become mandatory, not optional

**Difference:**

- ❌ "Claude should save plans" → I ignore this
- ✅ "Complete Step 2 and confirm" → I must respond to this

---

## Quick Reference

### Session Start Checklist

```

□ STEP 1: Initialize (create session file, read memory banks + plan/backlog)
Confirm: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

□ STEP 2: Plan & Save (create plan, save to files)
Confirm: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md..."

□ STEP 3: Consult Experts (invoke react/next/prisma experts)
Confirm: "✅ STEP 3 COMPLETE: Consulted [expert] for [topic]"

□ STEP 4: Checkpoints (every 15K tokens, update session/todos)
Confirm: "✅ CHECKPOINT at [X]K tokens: Progress saved"

□ STEP 4.5: Verification Gate (evidence-based requirement verification)
Confirm: "✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence"

□ STEP 5: Post-Completion (docs → sub-agents → commits)
Confirm: "✅ STEP 5 COMPLETE: All documentation updated and committed"

````

### Files Created by Protocol

- `.agent/task/current-session-[timestamp].md` - Session tracking
- `.agent/task/current-plan.md` - Implementation plan
- `.agent/task/current-todos.md` - Todo list with progress
- `COMPLETION_[PHASE].md` - Completion documentation
- `.agent/sops/[topic].md` - SOPs from synthesize-docs
- `.agent/system/*.md` - Updated by map-system

---

## For Future Sessions

**Next session:**

1. Copy-paste starter prompt (from top of this file)
2. Watch for all 6 step confirmations (including Step 4.5)
3. Call out ANY missing confirmations immediately
4. Verify checkpoint confirmations at 15K token intervals
5. Verify evidence-based confirmation before allowing Step 5
6. Ensure Step 5 complete before final code commit

**This protocol prevents the violations that occurred previously:**

1. ✅ Plan saved immediately after approval (Step 2)
2. ✅ Todos persisted to file (Step 2)
3. ✅ Progress checkpoints every 15K tokens (Step 4)
4. ✅ Evidence-based verification before completion (Step 4.5)
5. ✅ Expert agents consulted for decisions (Step 3)
6. ✅ Post-completion workflow mandatory (Step 5)

---

**Protocol Status:** ACTIVE - v2.0 with Verification Gate
**Last Updated:** 2025-11-06
**Violations Prevented:** 6 (plan-saving, todos, checkpoints, verification, experts, post-completion)

---

## File Operations Protocol (MCP Filesystem Tools)

**CRITICAL: Use MCP filesystem tools for ALL file read/write operations**

### Tool Selection for File Operations

**MANDATORY tool usage:**

1. **Reading Files:**
   - ✅ USE: `mcp__filesystem__read_text_file` (MCP tool)
   - ❌ NEVER: Standard `Read` tool (unreliable, causes "file modified" errors)
   - **Benefits**: More reliable, handles concurrent modifications better

2. **Writing New Files:**
   - ✅ USE: `mcp__filesystem__write_file` (MCP tool)
   - ❌ NEVER: Standard `Write` tool
   - **Benefits**: Atomic writes, better error handling

3. **Editing Existing Files:**
   - ✅ USE: `mcp__filesystem__edit_file` (MCP tool - supports multiple edits in one call)
   - ❌ NEVER: Standard `Edit` tool (triggers false "file modified" warnings)
   - **Benefits**: Handles multiple edits atomically, git-style diff output, reliable

4. **Reading Multiple Files:**
   - ✅ USE: `mcp__filesystem__read_multiple_files` (MCP tool)
   - **Benefits**: Efficient batch reading, reduces tool call overhead

### When to Use Bulk Edits

**Single MCP edit call for multiple changes to same file:**

```typescript
// GOOD: Multiple edits in one call
mcp__filesystem__edit_file({
  path: 'file.md',
  edits: [
    { oldText: '...', newText: '...' },
    { oldText: '...', newText: '...' },
    { oldText: '...', newText: '...' },
  ],
});

// BAD: Multiple separate Edit tool calls (causes file detection issues)
Edit('file.md', 'old1', 'new1');
Edit('file.md', 'old2', 'new2'); // ❌ Triggers "file modified" error
````

### Edit Tool Failure Recovery

**If standard Edit tool fails with "File has been unexpectedly modified":**

1. ✅ Switch to `mcp__filesystem__edit_file` immediately
2. ✅ Continue with MCP filesystem tools for remainder of session
3. ❌ Do NOT retry with standard Edit tool

### Token Efficiency for Large Operations

**For complex multi-file operations (3+ files with 5+ changes each):**

- Consider using `general-purpose` sub-agent with MCP filesystem tools
- Sub-agent uses MCP tools in isolated thread
- Main thread only receives summary (saves 70-90% tokens)

**Example:**

```markdown
Me: "Documentation fix requires updating 7 files with 25+ changes.
Invoking general-purpose sub-agent with MCP filesystem tool specifications."

<invoke sub-agent with detailed edit specifications>

Me: "✅ Documentation updated via sub-agent (92% token savings)"
```

### Integration with Step 1 (Session Initialization)

**Reading memory banks at session start:**

```markdown
# GOOD: Use MCP filesystem tool

mcp**filesystem**read_multiple_files({
paths: [
".agent/project-brief.md",
".agent/system-patterns.md",
".agent/tech-context.md",
".agent/active-context.md",
".agent/progress.md"
]
})

# BAD: Multiple standard Read calls (slower, less efficient)
```

### Best Practices

1. **Always use MCP filesystem tools** - they're more reliable than standard tools
2. **Batch edits when possible** - use `edits` array for multiple changes to same file
3. **Use sub-agents for bulk operations** - saves 70-90% tokens in main thread
4. **Never mix standard and MCP tools** - stick with MCP tools throughout session

### Verification

**After edits, verify with git diff:**

```bash
git diff docs/file.md  # Review changes before committing
```

MCP filesystem tools provide git-style diff output automatically for verification.

---

## PROTOCOL VIOLATIONS LOG

**Purpose:** Track protocol violations to enforce compliance in future sessions.

### Violation History

**2025-11-10 Session (Sprint 2 Week 3 Day 2) - Violation #1:**

**Violation Type:** Incomplete Protocol Execution
**Steps Violated:** Step 4.5 (Verification Gate), Step 5 (Post-completion workflow)

**What Happened:**
- Completed implementation (wiki list + detail UI)
- Claimed "Session Complete" and "Protocol Complete"
- **SKIPPED Step 4.5:** No formal evidence-based verification documentation
- **INCOMPLETE Step 5:**
  - Did NOT update `docs/13-Project-Plan.md`
  - Did NOT invoke `synthesize-docs` sub-agent (4 SOPs missing)
  - Did NOT invoke `map-system` sub-agent (component patterns undocumented)

**Impact:**
- User rightfully questioned protocol adherence
- Trust violation: "if you are not following the protocols even after explicitly telling it then how will you follow?"
- Future sessions at risk: "in new chat you will forget everything"

**Resolution:**
- Executed Step 4.5 with documented evidence (2025-11-10 19:00 IST)
- Completed Step 5 fully:
  - Updated `docs/13-Project-Plan.md` with Sprint 2 status tracking
  - Invoked `synthesize-docs`: Created 4 SOPs (680 lines total)
  - Invoked `map-system`: Updated component-patterns.md (4 new patterns)
  - Committed documentation before code
- Added this violations log to protocol file

**Lessons Learned:**
1. **Protocol exists because I "read instructions but don't follow them"** (per CLAUDE.md)
2. **Claiming "complete" without evidence = violation**
3. **User correctly identified that without file updates, enforcement cannot persist**
4. **Required confirmations are NOT optional** - they are proof of execution

**Enforcement Mechanism Added:**
- This violations log section added to protocol file
- Will be read at every session start (Step 1)
- Serves as persistent reminder of required checks

### Future Session Checklist (READ THIS EVERY SESSION START)

**Before claiming any step "complete":**

- [ ] **Step 1:** Did I create current-session-[timestamp].md with all required sections?
- [ ] **Step 2:** Did I save plan to current-plan.md IMMEDIATELY after approval?
- [ ] **Step 2:** Did I update current-plan.md checkboxes as I completed each criterion?
- [ ] **Step 2:** Did I update current-todos.md progress percentage as tasks completed?
- [ ] **Step 3:** Did I invoke required expert sub-agents BEFORE making technical decisions?
- [ ] **Step 4:** Did I update current-todos.md at EVERY 15K token checkpoint?
- [ ] **Step 4:** Did I update current-plan.md checkboxes at EVERY checkpoint?
- [ ] **Step 4.5:** Did I execute verification commands and document evidence?
- [ ] **Step 5:** Did I update ALL required files (plan, memory banks, SOPs, system docs)?
- [ ] **Step 5:** Did I invoke synthesize-docs AND map-system sub-agents?
- [ ] **Step 5:** Did I commit documentation BEFORE code?
- [ ] **Step 5:** Did I provide the required completion confirmation?

**If you cannot check ALL boxes, the step is NOT complete.**

**If user says "you did not do step X", you violated the protocol. Execute step X RIGHT NOW with full documentation.**

---

**2025-11-10 Session - Violation #2:**

**Violation Type:** File Abandonment After Creation
**Steps Violated:** Step 2 (Plan/Todos maintenance), Step 4 (Checkpoint updates)

**What Happened:**
- Created `current-plan.md` and `current-todos.md` per Step 2
- Claimed "Step 2 complete"
- **NEVER UPDATED THESE FILES AGAIN** during entire session
- Completed all 10 tasks but todos file still showed "0/7 tasks (0%)"
- All success criteria met but plan file still had unchecked boxes
- User correctly identified: "once created you literally forget it and never even updated these two files"

**Impact:**
- Files intended for progress tracking were useless
- Step 4 checkpoint requirement violated (no todos updates at 15K, 30K, etc.)
- Step 2 purpose defeated (create plan → follow plan → update plan)
- Protocol instructs "update at every checkpoint" but I ignored this

**Resolution:**
- Updated `current-todos.md` (2025-11-10 19:35 IST)
  - Changed "0/7 tasks (0%)" → "10/10 tasks (100%) ✅ COMPLETE"
  - Added all protocol steps completion status
  - Added quality metrics
- Updated `current-plan.md` (2025-11-10 19:35 IST)
  - Marked all success criteria checkboxes [x]
  - Added implementation details for both user stories

**Lessons Learned:**
1. **Creating file ≠ Following protocol** - Must UPDATE files, not just create them
2. **Checkpoint updates are NOT optional** - Every 15K tokens = update todos
3. **Plan is living document** - Check boxes as you complete criteria
4. **"Create and forget" defeats purpose** - Files exist to track progress

**New Enforcement Rule Added:**
At EVERY checkpoint (15K, 30K, 45K, etc.), MUST:
1. Update `current-todos.md` with task progress
2. Update checkboxes in `current-plan.md`
3. Cannot claim "checkpoint complete" without file updates

---

**Updated**: 2025-11-10 (Added Violations #1 and #2 - Protocol Execution + File Abandonment)
