# Quick Start for Every Session

**Version:** 1.0
**Created:** 2025-10-28
**Purpose:** User guide for enforcing mandatory session protocol

---

## Overview

This guide helps you enforce the **Mandatory Session Protocol** that ensures I follow workflow requirements with user-visible confirmations.

**Why this is needed:** I read instructions but don't follow them unless explicitly prompted with confirmations.

**Full Protocol:** [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md)

---

## Step 1: Copy This Starter Prompt

At the start of **EVERY** session, copy-paste this into Claude Code:

```
MANDATORY PROTOCOL - Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: [copy from STATUS.md]
Requirements: [copy from DEVELOPMENT_PLAN.md]

ENFORCE:
- ✅ Step 1: Initialize session
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 5: Post-completion workflow

Confirm each step explicitly. If you skip ANY step, I will stop you.

Proceed with [phase name].
```

**How to fill in:**

- **Current phase:** Look at `STATUS.md` → "Current Phase" section → copy the phase name
- **Requirements:** Look at `DEVELOPMENT_PLAN.md` → find current phase → copy brief summary
- **[phase name]:** Same as current phase (e.g., "Phase 3 Day 5 - Search & Filtering")

---

## Step 2: Watch for Confirmations

After pasting the starter prompt, you should see **explicit confirmations** for each step:

### Expected Confirmations

#### ✅ Step 1: Initialization

```
✅ STEP 1 COMPLETE: Session initialized at [timestamp]

Created: .agent/task/current-session-[YYYYMMDD-HHMM].md
Current phase: [phase name]
Goals: [brief description]
Token budget: [current]/200K
```

#### ✅ Step 2: Plan Saved

```
✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md

Plan overview: [1-2 sentence summary]
Total tasks: [X]
Files to create/modify: [list]
```

#### ✅ Step 3: Expert Consultation

```
✅ STEP 3 COMPLETE: Consulted [expert-name] for [decision-topic]

Expert recommendation: [summary]
Implementation approach: [what I'll do]
```

**You may see multiple Step 3 confirmations** (one for each expert: react-expert, next-js-expert, prisma-expert)

#### ✅ Step 4: Checkpoints (every 15K tokens)

```
✅ CHECKPOINT at [X]K tokens: Progress saved

Completed since last checkpoint:
- [task 1]
- [task 2]

Current progress: [X]/[Y] tasks complete ([Z]%)
Next checkpoint: [X+15]K tokens
```

**Expected at:** 15K, 30K, 45K, 60K, 75K, 90K, 105K, 120K, 135K, 150K tokens

#### ✅ Step 5: Post-Completion

```
✅ STEP 5 COMPLETE: All documentation updated and committed

Documentation updates:
- Created COMPLETION_[PHASE].md
- Updated STATUS.md
- Updated DEVELOPMENT_PLAN.md

Sub-agent invocations:
- synthesize-docs → SOP saved
- map-system → system docs updated

Git commits:
- [hash] docs: Update documentation after [phase]
- [hash] feat: [feature description]
```

---

## Step 3: If I Skip a Step

**If you DON'T see an expected confirmation, I violated the protocol.**

Stop me immediately with one of these responses:

### Missing Step 1

> "You skipped Step 1. Create current-session-[YYYYMMDD-HHMM].md and confirm RIGHT NOW."

### Missing Step 2

> "You skipped Step 2. Save the plan to current-plan.md and todos to current-todos.md RIGHT NOW before continuing."

### Missing Step 3

> "You made component architecture decisions without consulting react-expert. Invoke the expert NOW and confirm."

### Missing Step 4 Checkpoints

> "You're at 50K tokens with only ONE checkpoint. Update current-session.md and current-todos.md RIGHT NOW."

### Missing Step 5

> "You committed code without completing Step 5. Complete the full post-completion workflow NOW."

---

## Step 4: Verify Completion

After I say "done" or "complete", verify these files exist:

### Required Files

- [ ] `.agent/task/current-session-[YYYYMMDD-HHMM].md` exists and has checkpoints
- [ ] `.agent/task/current-plan.md` exists with implementation plan
- [ ] `.agent/task/current-todos.md` exists with completed tasks marked [x]
- [ ] `COMPLETION_[PHASE].md` exists (if phase complete)
- [ ] `STATUS.md` updated with completion summary (if phase complete)
- [ ] `DEVELOPMENT_PLAN.md` updated with current status (if phase complete)
- [ ] `.agent/sops/` has new SOPs (if new patterns were created)
- [ ] `.agent/system/` docs updated (if architecture changed)

### Quick Verification Commands

```bash
# Check session file exists
ls .agent/task/current-session-*.md

# Check plan and todos exist
ls .agent/task/current-plan.md .agent/task/current-todos.md

# Check completion doc (if phase complete)
ls COMPLETION_*.md

# Check for checkpoints in session file
grep "Checkpoint" .agent/task/current-session-*.md
```

---

## Example Session Flow

Here's what a complete session looks like with all confirmations:

### 1. You Paste Starter Prompt

```
MANDATORY PROTOCOL - Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: Phase 3 Day 5 - Search & Filtering Implementation
Requirements: Implement full-text search with PostgreSQL tsvector + filter system

ENFORCE:
- ✅ Step 1: Initialize session
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 5: Post-completion workflow

Confirm each step explicitly. If you skip ANY step, I will stop you.

Proceed with Phase 3 Day 5.
```

### 2. I Respond with Step 1 Confirmation

```
✅ STEP 1 COMPLETE: Session initialized at 2025-10-28-1500

Created: .agent/task/current-session-20251028-1500.md
Current phase: Phase 3 Day 5 - Search & Filtering Implementation
Goals: Implement full-text search with PostgreSQL tsvector, create filter UI components, add pagination
Token budget: 0/200K
```

### 3. I Create Plan and Confirm Step 2

```
[Creates implementation plan in conversation]

✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md

Plan overview: Implement search API with tsvector, create SearchBar + SearchFilters components, add Playwright E2E tests
Total tasks: 12
Files to create/modify: SearchBar.tsx, SearchFilters.tsx, /api/search route, 3 test files
```

### 4. I Consult Experts and Confirm Step 3

```
[Invokes react-expert for search component architecture]

✅ STEP 3 COMPLETE: Consulted react-expert for search component architecture

Expert recommendation: Use compound component pattern with SearchContext for filter state management
Implementation approach: Create SearchContext with useReducer, separate SearchBar and SearchFilters components


[Invokes prisma-expert for tsvector query optimization]

✅ STEP 3 COMPLETE: Consulted prisma-expert for tsvector query optimization

Expert recommendation: Create GIN index on tsvector column, use ts_rank for relevance sorting
Implementation approach: Add migration for tsvector column and index, implement ranked search query
```

### 5. I Implement with Checkpoint Confirmations

```
[Implements SearchBar component]
[Implements API route]
[Implements tests]

✅ CHECKPOINT at 15K tokens: Progress saved

Completed since last checkpoint:
- SearchBar component created
- /api/search route with tsvector query
- Basic E2E test for search flow

Current progress: 3/12 tasks complete (25%)
Next checkpoint: 30K tokens


[Continues implementation...]

✅ CHECKPOINT at 30K tokens: Progress saved

Completed since last checkpoint:
- SearchFilters component with filter state
- Pagination logic
- 2 more E2E tests

Current progress: 7/12 tasks complete (58%)
Next checkpoint: 45K tokens


[Completes implementation...]
```

### 6. I Complete with Step 5 Confirmation

```
✅ STEP 5 COMPLETE: All documentation updated and committed

Documentation updates:
- Created COMPLETION_PHASE3_DAY5_SEARCH.md
- Updated STATUS.md (Last Completed: Day 5)
- Updated DEVELOPMENT_PLAN.md (Current Phase: Day 6)

Sub-agent invocations:
- synthesize-docs → saved SOP to .agent/sops/search-implementation.md
- map-system → updated .agent/system/api-catalog.md with /api/search endpoint

Git commits:
- a1b2c3d docs: Update documentation after Phase 3 Day 5
- d4e5f6g feat(search): Implement full-text search with tsvector and filters

All quality gates passed ✅
```

---

## Troubleshooting

### Q: I didn't see "✅ STEP 1 COMPLETE" - what happened?

**A:** I skipped session initialization. Stop me immediately:

> "You skipped Step 1. Create current-session-[YYYYMMDD-HHMM].md and confirm RIGHT NOW."

---

### Q: I didn't see "✅ STEP 2 COMPLETE" - what happened?

**A:** I started coding without saving the plan. Stop me immediately:

> "You skipped Step 2. Save the plan to current-plan.md RIGHT NOW before continuing."

---

### Q: I didn't see any "✅ STEP 3 COMPLETE" confirmations

**A:** I made technical decisions without consulting experts. Stop me:

> "You made [component/database/routing] decisions without consulting [react/prisma/next-js]-expert. Invoke the expert NOW."

---

### Q: I'm at 50K tokens and haven't seen any checkpoint confirmations

**A:** I'm violating Step 4 (checkpoints every 15K tokens). Stop me:

> "You're at 50K tokens with ZERO checkpoints. Update current-session.md and current-todos.md RIGHT NOW."

---

### Q: I finished the feature and jumped straight to `git commit`

**A:** I skipped Step 5 (post-completion workflow). Stop me:

> "You skipped Step 5. Complete the full post-completion workflow from the protocol BEFORE committing code."

---

### Q: I said "done" but some files are missing

**A:** Check the verification checklist in "Step 4: Verify Completion" above.

If files are missing:

> "You're missing [file name]. Create it NOW as required by the protocol."

---

## Common Violations

### Violation 1: Plan Not Saved After Approval

**Symptom:** You approved my plan (via ExitPlanMode), but I started coding immediately

**What should happen:** I must save plan to `current-plan.md` BEFORE any code

**Fix:** Stop me and demand:

> "Save the plan to current-plan.md RIGHT NOW before writing any code."

---

### Violation 2: Todos Only in UI, Not Persisted

**Symptom:** You see todos in conversation, but `current-todos.md` doesn't exist

**What should happen:** TodoWrite UI AND file must both be created

**Fix:** Stop me and demand:

> "Save the todos to current-todos.md RIGHT NOW."

---

### Violation 3: Zero Progress Checkpoints

**Symptom:** We're at 75K tokens, but I haven't said "✅ CHECKPOINT" even once

**What should happen:** Checkpoint confirmation every 15K tokens

**Fix:** Stop me and demand:

> "You're at 75K tokens with no checkpoints. Update session/todos files and confirm RIGHT NOW."

---

### Violation 4: Expert Agents Ignored

**Symptom:** I made component architecture decisions but never said "✅ STEP 3 COMPLETE: Consulted react-expert"

**What should happen:** Expert consultation BEFORE making decisions

**Fix:** Stop me and demand:

> "You made component decisions without consulting react-expert. Invoke the expert NOW and get guidance BEFORE continuing."

---

### Violation 5: Post-Completion Workflow Skipped

**Symptom:** I said "done" and committed code, but never said "✅ STEP 5 COMPLETE"

**What should happen:** Full Step 5 workflow (docs → sub-agents → commits) with confirmation

**Fix:** Stop me and demand:

> "Complete the full Step 5 post-completion workflow from the protocol before claiming done."

---

## Protocol Benefits

### What This Fixes

**Previous behavior:**

- I read CLAUDE.md but ignored workflow steps
- Plans existed only in conversation (lost during context compaction)
- No progress checkpoints (entire sessions lost if interrupted)
- Expert agents never consulted
- Documentation updates skipped

**New behavior with protocol:**

- Can't skip steps (they're in the prompt I'm responding to)
- Must save plans to files (survive compaction)
- Must checkpoint every 15K tokens (progress never lost)
- Must consult experts (get proper technical guidance)
- Must complete full post-completion workflow (documentation always updated)

### Enforcement Mechanism

**Old system (failed):**

- CLAUDE.md: "I do things AUTOMATICALLY"
- Reality: I don't
- Problem: Instructions I can ignore

**New system (works):**

- Starter prompt: "Complete Step X and confirm"
- Confirmations: User-visible (missing = caught)
- Enforcement: User calls out violations immediately
- Result: Steps become mandatory, not optional

---

## Next Steps

1. **Save this guide** for reference
2. **Bookmark** the starter prompt section
3. **Next session:** Copy-paste starter prompt
4. **Watch for:** All 5 step confirmations
5. **Enforce:** Call out ANY missing confirmations

---

**Protocol Status:** ACTIVE
**Last Updated:** 2025-10-28
**Purpose:** Prevent the 5 workflow violations that occurred in previous sessions

**For detailed protocol:** See [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md)
