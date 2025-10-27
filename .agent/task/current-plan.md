# Implementation Plan: Mandatory Session Protocol System

**Created:** 2025-10-28 15:00
**Phase:** Documentation/Workflow Improvement
**Estimated Completion:** 3 files, ~400 lines total

---

## Overview

Create an enforcement mechanism that replaces optional "AUTOMATIC" claims with mandatory, user-visible confirmations for all workflow steps.

**Problem:** CLAUDE.md claims automatic behavior that doesn't happen. Need user-enforceable protocol.

**Solution:** Mandatory protocol with explicit step-by-step confirmations.

---

## Deliverables

### 1. `.agent/MANDATORY_SESSION_PROTOCOL.md` (~200 lines)

**Purpose:** Single source of truth for mandatory workflow protocol

**Structure:**

- Header: "MANDATORY SESSION PROTOCOL - NO EXCEPTIONS"
- Copy-paste starter block for users
- 5 main steps with checkboxes and confirmation formats:
  - STEP 1: INITIALIZATION (create session file, read STATUS/PLAN)
  - STEP 2: PLAN CREATION (save plan.md, save todos.md)
  - STEP 3: EXPERT CONSULTATION (invoke react/next/prisma experts)
  - STEP 4: PROGRESS CHECKPOINTS (every 15K tokens)
  - STEP 5: POST-COMPLETION (update docs, invoke sub-agents, commit)
- Violation policy: "If I skip ANY step, you MUST stop me"

**Key Features:**

- Checkbox format for visual tracking
- Explicit confirmation text: "✅ STEP X COMPLETE: [description]"
- Token counter reminder
- Clear enforcement policy

---

### 2. Updated `CLAUDE.md` (~50 lines changed)

**Changes Required:**

**A. Replace "Session Start Pattern (AUTOMATIC BEHAVIOR)" section:**

- Remove: Claims about automatic behavior
- Add: Reference to MANDATORY_SESSION_PROTOCOL.md
- Add: Starter prompt format with enforcement checklist
- Add: "I must confirm each step" language

**B. Replace "Context File Workflow (AUTOMATIC)":**

- Change: "I will automatically" → "I am REQUIRED to per protocol"

**C. Replace "3-Tier Persistence Strategy (AUTOMATIC)":**

- Change: "Files I manage automatically" → "Files I must create per protocol Step 1"
- Keep: Manual save guidance (accurate)
- Update: "Automatic Workflow" → "Required Workflow per Protocol"

**D. Update Sub-Agent sections:**

- Change: "I'll invoke automatically" → "I must invoke per protocol Step 3"

**E. Add new section after Pre-Work Checklist:**

```markdown
## 🚨 CRITICAL: Mandatory Session Protocol

**EVERY session MUST start with the protocol**

1. Read .agent/MANDATORY_SESSION_PROTOCOL.md
2. Complete all 5 steps with explicit confirmations
3. Watch for missing confirmations (= violations)

**Why this exists:** I read instructions but don't follow them unless explicitly prompted.
```

---

### 3. `SESSION_START_QUICK_GUIDE.md` (~150 lines, new file)

**Purpose:** User-facing quick reference with copy-paste starter prompt

**Sections:**

1. **Copy This Prompt** - Full starter prompt with enforcement checklist
2. **Watch for Confirmations** - List of expected "✅ STEP X COMPLETE" messages
3. **If I Skip a Step** - How to call out violations
4. **Verify Completion** - Checklist of files to verify after "done"
5. **Example Session Flow** - Complete example with all confirmations
6. **Troubleshooting** - Common issues (missing confirmations, missing checkpoints)

---

## Implementation Steps

1. **Create** `.agent/MANDATORY_SESSION_PROTOCOL.md`
   - Write full protocol with all 5 steps
   - Include explicit confirmation formats
   - Add violation policy

2. **Update** `CLAUDE.md`
   - Remove "AUTOMATIC" sections (lines 48-147, 150-232, 235-413)
   - Replace with "MANDATORY PROTOCOL" references
   - Add new critical section
   - Update sub-agent language

3. **Create** `SESSION_START_QUICK_GUIDE.md`
   - Write copy-paste starter prompt
   - Add confirmation checklist
   - Include example session flow
   - Add troubleshooting section

---

## Success Criteria

✅ MANDATORY_SESSION_PROTOCOL.md created with all 5 steps
✅ CLAUDE.md updated - no more false "AUTOMATIC" claims
✅ SESSION_START_QUICK_GUIDE.md created with starter prompt
✅ All files use consistent confirmation format
✅ Protocol is user-enforceable (missing confirmations = visible violations)

---

## Expected Outcome

**User experience:**

1. Copy-paste starter prompt at session start
2. See explicit confirmations for each step
3. Immediately know if I skip something (missing confirmation)
4. Can enforce compliance by calling out missing steps

**My behavior:**

- Can't ignore steps (they're in the prompt I'm responding to)
- Must confirm explicitly (visible to user)
- Checkpoints become part of implementation flow
- Post-completion workflow becomes mandatory final step

---

## Dependencies

- `.agent/task/` directory must exist (for session files)
- Current CLAUDE.md structure understood
- new_workflow_plan.md as reference

---

## Notes

This plan creates the enforcement mechanism to prevent the workflow violations that occurred in the previous session:

1. Plan not saved after approval
2. Todos not persisted
3. Zero progress checkpoints (103K tokens used)
4. Expert agents ignored
5. Post-completion workflow skipped
