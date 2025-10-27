# MANDATORY SESSION PROTOCOL - NO EXCEPTIONS

**Version:** 1.0
**Created:** 2025-10-28
**Purpose:** Enforce workflow compliance through user-visible confirmations

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

---

## [STEP 1] INITIALIZATION - REQUIRED BEFORE ANY WORK

**Before writing ANY code or making ANY implementation decisions:**

### Required Actions

- [ ] Read `STATUS.md` - understand current phase and progress
- [ ] Read `DEVELOPMENT_PLAN.md` - understand phase requirements
- [ ] Create `.agent/task/current-session-[YYYYMMDD-HHMM].md`
  - Document: Current phase, goals, requirements from STATUS.md
  - Include: Token budget (200K), session start time, deliverables
- [ ] Read relevant `.agent/` context files based on phase keywords:
  - API work → `.agent/system/api-catalog.md`
  - Database work → `.agent/system/database-schema.md`
  - Component work → `.agent/system/component-patterns.md`

### REQUIRED CONFIRMATION

**You MUST output this exact confirmation:**

```
✅ STEP 1 COMPLETE: Session initialized at [timestamp]

Created: .agent/task/current-session-[YYYYMMDD-HHMM].md
Current phase: [phase name from STATUS.md]
Goals: [brief description of what needs to be done]
Token budget: [current]/200K
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

## [STEP 3] EXPERT CONSULTATION - MANDATORY FOR DECISIONS

**Before implementing, invoke expert agents for technical guidance:**

### When to Invoke Which Expert

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

## [STEP 5] POST-COMPLETION - BEFORE FINAL CODE COMMIT

**After feature implementation complete, BEFORE committing code:**

### Required Documentation Updates

- [ ] Create `COMPLETION_[PHASE].md` using completion template
  - Document: What was done, files created/modified, technical decisions
  - Include: Quality gate results (type-check, lint, build, tests)
- [ ] Update `STATUS.md`
  - Update "Last Completed" section with completion summary
  - Update "Current Phase" to next phase
  - Update git status if needed
- [ ] Update `DEVELOPMENT_PLAN.md`
  - Update "CURRENT STATUS" header section
  - Mark completed phase with ✅

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

- [ ] Stage: `git add .agent/ STATUS.md docs/DEVELOPMENT_PLAN.md COMPLETION_*.md`
- [ ] Commit: `git commit -m "docs: Update documentation after [phase]"`

**Code commit (SECOND):**

- [ ] Stage code files: `git add [code files]`
- [ ] Commit: `git commit -m "feat: [feature description] 🤖 Generated with Claude Code..."`

### REQUIRED CONFIRMATION

**You MUST output this confirmation:**

```
✅ STEP 5 COMPLETE: All documentation updated and committed

Documentation updates:
- Created COMPLETION_[PHASE].md
- Updated STATUS.md with completion summary
- Updated DEVELOPMENT_PLAN.md current status

Sub-agent invocations:
- synthesize-docs → saved SOP to .agent/sops/[topic].md
- map-system → updated .agent/system/[files].md

Git commits:
- [hash] docs: Update documentation after [phase]
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
□ STEP 1: Initialize (create session file, read STATUS/PLAN)
  Confirm: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

□ STEP 2: Plan & Save (create plan, save to files)
  Confirm: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md..."

□ STEP 3: Consult Experts (invoke react/next/prisma experts)
  Confirm: "✅ STEP 3 COMPLETE: Consulted [expert] for [topic]"

□ STEP 4: Checkpoints (every 15K tokens, update session/todos)
  Confirm: "✅ CHECKPOINT at [X]K tokens: Progress saved"

□ STEP 5: Post-Completion (docs → sub-agents → commits)
  Confirm: "✅ STEP 5 COMPLETE: All documentation updated and committed"
```

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
2. Watch for all 5 step confirmations
3. Call out ANY missing confirmations immediately
4. Verify checkpoint confirmations at 15K token intervals
5. Ensure Step 5 complete before final code commit

**This protocol prevents the violations that occurred previously:**

1. ✅ Plan saved immediately after approval (Step 2)
2. ✅ Todos persisted to file (Step 2)
3. ✅ Progress checkpoints every 15K tokens (Step 4)
4. ✅ Expert agents consulted for decisions (Step 3)
5. ✅ Post-completion workflow mandatory (Step 5)

---

**Protocol Status:** ACTIVE
**Last Updated:** 2025-10-28
**Violations Prevented:** 5 (plan-saving, todos, checkpoints, experts, post-completion)
