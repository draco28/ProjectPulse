# Protocol Redesign: Adding Verification Gate

**Date**: 2025-11-06
**Status**: PAUSED - Ready to implement
**Problem**: Day 2 marked complete without verifying all requirements (0 sessions created vs 3 required)

---

## Root Cause Analysis

### What Failed

The mandatory protocol has 5 steps but **no verification gate** between Step 4 (Checkpoints) and Step 5 (Post-Completion).

**Current Protocol Flow:**

```
Step 1: Initialize → Step 2: Plan → Step 3: Experts → Step 4: Checkpoints → Step 5: Complete
```

**The Gap:**

- Protocol trusts documentation fidelity without evidence verification
- Step 5 says "Update memory banks and commit" but not "Verify all plan requirements met"
- If you reach Step 5, work is assumed done
- No cross-check of actual results against plan success criteria

### How It Manifested

**Day 2 Plan Required:**

- 3 Sessions under Task 1 (explicitly listed)

**Actual Database State:**

- 0 Sessions (verified with `SELECT COUNT(*) FROM sessions;`)

**What Happened:**

1. Previous session did the work and documented "Day 2 Complete"
2. Session saved claims to memory banks (progress.md, active-context.md)
3. This session resumed, read those files, trusted the claims
4. Never verified actual database state against plan
5. Claimed "✅ Seed data with Sprint 1 hierarchy - Day 2 COMPLETE"

---

## Proposed Solution: Protocol v2.0 with Step 4.5

### New 6-Step Protocol

````markdown
## MANDATORY SESSION PROTOCOL v2.0

### Step 1: Initialize Session ✅

- Read .agent/progress.md, .agent/active-context.md
- Read current-todos.md (if exists, resuming work)
- Read relevant docs based on phase
- Create .agent/task/current-session-[YYYYMMDD-HHMM].md
- **Confirm**: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

### Step 2: Create Plan ✅

- Design implementation approach
- Get user approval (ExitPlanMode if needed)
- **IMMEDIATELY save** to .agent/task/current-plan.md
- Create .agent/task/current-todos.md with task list
- **Confirm**: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md"

### Step 3: Expert Consultation ✅ (REQUIRED for technical decisions)

- Invoke relevant expert agents BEFORE making decisions
- Required experts: react-expert, next-js-expert, prisma-expert
- **Confirm**: "✅ STEP 3 COMPLETE: Consulted [expert] for [decision]"

### Step 4: Progress Checkpoints ✅

- Update session + todos at 15K, 30K, 45K, 60K tokens
- **Confirm**: "✅ CHECKPOINT at [X]K tokens: Progress saved"

### **Step 4.5: VERIFICATION GATE ✅ (NEW - REQUIRED BEFORE COMPLETION)**

**Before marking ANY work complete, verify ALL plan requirements:**

1. **Re-read current-plan.md Success Criteria section**
2. **For EACH requirement, provide evidence:**
   - Database work: Run queries, show actual counts/data
   - File work: List files created, show key content
   - Feature work: Run tests, show passing results
   - Integration work: Demonstrate working integration
3. **Document verification in session log:**

   ```markdown
   ## Verification Results

   ### Requirement 1: [Description]

   ✅ Evidence: [Database query showing X records]

   ### Requirement 2: [Description]

   ❌ Gap Found: Missing Y, needs Z more work
   ```
````

4. **If ANY requirement fails:**
   - Mark work as IN PROGRESS (not complete)
   - Update plan with remaining items
   - Do NOT proceed to Step 5
   - Continue work until all requirements pass
5. **Only proceed when ALL requirements verified**

**Confirmation Required:**

```
✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence
```

### Step 5: Post-Completion Updates ✅

- Update .agent/progress.md
- Update .agent/active-context.md
- Invoke synthesize-docs (if new patterns)
- Invoke map-system (if architecture changed)
- Commit documentation FIRST
- Commit code SECOND
- **Confirm**: "✅ STEP 5 COMPLETE: All documentation updated and committed"

````

---

## Example: How Step 4.5 Would Have Caught Day 2 Issue

**Day 2 Plan Success Criteria:**
```markdown
### 7. Create Seed Script (30 min)

Seed script should create:
- [ ] 1 Phase ("Phase A - Foundation")
- [ ] 2 Weeks (Week 1: Setup, Week 2: Implementation)
- [ ] 5 Days under Week 1
- [ ] 10 Tasks under Day 1-2
- [ ] 3 Sessions under Task 1  ← REQUIRED
````

**Step 4.5 Verification:**

```markdown
## Verification Results

### Requirement: Seed script creates 3 Sessions under Task 1

Evidence: Running query...
```

```sql
SELECT COUNT(*) FROM sessions WHERE taskId = (SELECT id FROM tasks LIMIT 1);
```

**Result: 0 sessions**

❌ **VERIFICATION FAILED**

**Action**: Do NOT mark Day 2 complete. Add "Create 3 sessions in seed script" to remaining work. Continue to completion.

````

---

## Implementation Plan

### Phase 1: Update Protocol Document (~10 min)
- Update `.agent/MANDATORY_SESSION_PROTOCOL.md` with Step 4.5
- Add verification examples showing evidence requirements
- Update `SESSION_START_QUICK_GUIDE.md` with new step
- Add verification checklist template

### Phase 2: Test with Simple Task (~20 min)
**Test Task**: "Add API health check endpoint"

**Plan**: Create GET /api/health endpoint returning { status: "ok", timestamp: ISO }

**Success Criteria**:
1. File exists: `apps/web/app/api/health/route.ts`
2. TypeScript: Zero errors (`pnpm type-check`)
3. Response format: Matches spec exactly
4. Manual test: `curl localhost:3000/api/health` returns JSON

**Step 4.5 Verification**:
1. Show file exists (ls command)
2. Show pnpm type-check passes (0 errors)
3. Show actual curl response matches spec
4. If ANY fails: Mark incomplete, fix, reverify

**Estimated**: 20 minutes, ~5-8K tokens

### Phase 3: Resume Sprint 1 with New Protocol

**Option A**: Complete Day 2 properly
- Add 3 sessions to seed script
- Re-run seed (`pnpm db:seed`)
- Test cascade delete
- Test date filtering
- Verify with Step 4.5 gate
- Update docs with honest 100% completion
- Commit with corrections

**Option B**: Accept Day 2 at 85% and continue
- Update all docs to "Day 2: 85% complete (core done, sessions missing)"
- Add missing work to Day 3 plan
- Apply new protocol going forward

---

## Files to Update

### 1. .agent/MANDATORY_SESSION_PROTOCOL.md
- Insert Step 4.5 between Step 4 and Step 5
- Add verification requirements
- Add evidence examples (DB queries, file checks, test results)
- Update confirmation format

### 2. SESSION_START_QUICK_GUIDE.md
- Update step count from 5 to 6
- Add Step 4.5 reminder
- Add example verification checklist

### 3. New: .agent/templates/verification-checklist.md
```markdown
# Verification Checklist Template

## Requirements from current-plan.md

### Requirement 1: [Description]
- [ ] Evidence type: [DB query / File check / Test run / Manual demo]
- [ ] Expected: [What should exist/pass]
- [ ] Actual: [What was found]
- [ ] Status: ✅ Pass / ❌ Fail

[Repeat for all requirements]

## Verification Result

- [ ] ALL requirements verified with evidence
- [ ] Ready to proceed to Step 5 (Post-Completion)
````

---

## Key Design Principles

### 1. Evidence-Based Verification

- Never trust documentation claims alone
- Always verify with actual evidence (queries, commands, tests)
- Document both expected and actual results

### 2. Fail-Fast on Gaps

- If ANY requirement fails verification → Mark work incomplete
- Do NOT proceed to Step 5 until ALL pass
- Update plan with remaining work

### 3. Explicit Confirmation

- Require confirmation message after Step 4.5
- Format: "✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence"
- Missing confirmation = protocol violation

### 4. Verification Examples

- Provide clear examples of what evidence looks like
- Show both passing and failing verification
- Include command examples for common verification types

---

## Test Validation Criteria

**Health Check Test Must Demonstrate:**

1. ✅ All success criteria listed upfront
2. ✅ Explicit Step 4.5 execution
3. ✅ Evidence shown for each requirement
4. ✅ If failure detected → Mark incomplete, fix, reverify
5. ✅ Only mark complete when ALL verified
6. ✅ Explicit "STEP 4.5 COMPLETE" confirmation

**If test fails any of above:**

- Protocol needs further refinement
- Identify gap and update design
- Re-test until working reliably

---

## Next Session Action Items

1. **Update protocol documents** (Phase 1)
2. **Run health check test** (Phase 2)
3. **Evaluate test results**:
   - If successful → Proceed to Phase 3 (resume Sprint 1)
   - If issues found → Refine protocol, retest
4. **Apply to all future work**

---

## Current State Summary

**Sprint 1 Day 2 Status**: 85% complete

- ✅ Schema: 5 models, 25 indexes, migration applied
- ✅ Seed data: Phase, Weeks, Days, Tasks
- ❌ Missing: 0/3 Sessions (per plan requirement)
- ❌ Missing: Cascade delete test
- ❌ Missing: Date filtering test

**Git Status**:

- 2 commits completed (memory banks + schema/migrations)
- Work is committed but incomplete

**Decision Pending**:

- Complete Day 2 with new protocol (Option A)
- OR Accept 85% and continue to Day 3 (Option B)

---

**Protocol Redesign Status**: ✅ Design complete, ready for implementation
**Next Step**: Update protocol docs → Test with health check → Resume Sprint 1
