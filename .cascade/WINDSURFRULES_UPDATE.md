# .windsurfrules Update - Git Workflow Integration

**Action Required:** Manually update `.windsurfrules` file  
**File Location:** `f:\Web_Projects\AI_HUB\.windsurfrules`  
**Lines to Update:** Lines 39-81 (MANDATORY SESSION PROTOCOL section)

---

## Current Content (Lines 39-81)

```markdown
### MANDATORY SESSION PROTOCOL

Every session MUST follow this 5-step protocol:

**STEP 1: INITIALIZATION (Before any code)**

- Read STATUS.md and DEVELOPMENT_PLAN.md
- Create .agent/task/current-session-[YYYYMMDD-HHMM].md
- Load relevant context from .agent/ memory bank
- CONFIRM: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

**STEP 2: PLAN CREATION (Before implementation)**

- Create implementation plan
- Get user approval
- IMMEDIATELY save to .agent/task/current-plan.md
- Create .agent/task/current-todos.md
- CONFIRM: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md"

**STEP 3: EXPERT CONSULTATION (For technical decisions)**

- Invoke react-expert for component architecture
- Invoke next-js-expert for Server/Client decisions
- Invoke prisma-expert for database design
- Read agent template from memory + apply structured prompt
- Save plan to .agent/task/[expert]-[topic]-[timestamp].md
- CONFIRM: "✅ STEP 3 COMPLETE: Consulted [expert] for [topic]"

**STEP 4: PROGRESS CHECKPOINTS (Every 15K tokens)**

- At 15K, 30K, 45K, 60K, 75K, 90K tokens
- Update .agent/task/current-session.md
- Update .agent/task/current-todos.md
- CONFIRM: "✅ CHECKPOINT at [X]K tokens: Progress saved"

**STEP 5: POST-COMPLETION (Before final commit)**

- Create COMPLETION\_[PHASE].md
- Update STATUS.md and DEVELOPMENT_PLAN.md
- Invoke synthesize-docs if new patterns created
- Invoke map-system if architecture changed
- Commit documentation first, then code
- CONFIRM: "✅ STEP 5 COMPLETE: All documentation updated and committed"
```

---

## Replace With (6-Step Protocol with Git Workflow)

```markdown
### MANDATORY SESSION PROTOCOL

Every session MUST follow this 6-step protocol:

**STEP 1: INITIALIZATION (Before any code)**

- Read STATUS.md and DEVELOPMENT_PLAN.md
- Create .agent/task/current-session-[YYYYMMDD-HHMM].md
- Load relevant context from .agent/ memory bank
- Check current branch: `git branch --show-current`
- Ensure on master/main: If not, switch to master first
- Pull latest changes: `git pull origin master`
- CONFIRM: "✅ STEP 1 COMPLETE: Session initialized at [timestamp], on master branch"

**STEP 1.5: BRANCH CREATION (MANDATORY - Before plan)**

- Determine branch type: api/_, ui/_, or feature/\*
- Create feature branch: `git checkout -b [type]/[description]`
- Verify branch created: `git branch --show-current`
- CONFIRM: "✅ STEP 1.5 COMPLETE: Created branch [branch-name]"
- CRITICAL: Do NOT proceed to Step 2 until branch is created!

**STEP 2: PLAN CREATION (Before implementation)**

- Create implementation plan
- Get user approval
- Verify on feature branch: `git branch --show-current`
- IMMEDIATELY save to .agent/task/current-plan.md
- Create .agent/task/current-todos.md
- Optional: Commit plan files if user approves
- CONFIRM: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md on branch [branch-name], todos saved to current-todos.md"

**STEP 3: EXPERT CONSULTATION (For technical decisions)**

- Invoke react-expert for component architecture
- Invoke next-js-expert for Server/Client decisions
- Invoke prisma-expert for database design
- Read agent template from memory + apply structured prompt
- Save plan to .agent/task/[expert]-[topic]-[timestamp].md
- Ensure still on feature branch
- Optional: Commit consultations
- CONFIRM: "✅ STEP 3 COMPLETE: Consulted [expert] for [topic] on branch [branch-name]"

**STEP 4: PROGRESS CHECKPOINTS (Every 15K tokens)**

- At 15K, 30K, 45K, 60K, 75K, 90K tokens
- Update .agent/task/current-session.md
- Update .agent/task/current-todos.md
- Verify still on feature branch
- Optional: Commit checkpoint files
- CONFIRM: "✅ CHECKPOINT at [X]K tokens: Progress saved on branch [branch-name]"

**STEP 5: POST-COMPLETION (Before final commit)**

- Create COMPLETION\_[PHASE].md
- Update STATUS.md and DEVELOPMENT_PLAN.md
- Invoke synthesize-docs if new patterns created
- Invoke map-system if architecture changed

**CRITICAL - Commit order:**

1. Documentation commit FIRST:
   - Stage: docs/, STATUS.md, DEVELOPMENT*PLAN.md, COMPLETION*\*.md, .agent/
   - Commit: `git commit -m "docs: complete [phase] - [description]"`
2. Code commit SECOND:
   - Stage: apps/, packages/, prisma/, _.config._
   - Commit: `git commit -m "feat: implement [feature]"`

- CONFIRM: "✅ STEP 5 COMPLETE: All documentation updated and committed (docs first, code second) on branch [branch-name]"

**STEP 6: MERGE & CLEANUP (MANDATORY - Before ending session)**

- Run quality gates (ALL must pass):
  - `pnpm lint` - Must pass
  - `pnpm type-check` - Must pass
  - `pnpm build` - Must pass
  - `pnpm test` - Must pass (80%+ coverage)
- Switch to master: `git checkout master`
- Pull latest: `git pull origin master`
- Merge feature branch: `git merge --no-ff [branch-name]`
- Optional: Push to remote: `git push origin master`
- Optional: Delete feature branch: `git branch -d [branch-name]`
- CONFIRM: "✅ STEP 6 COMPLETE: Branch [branch-name] merged to master, quality gates passed"
```

---

## How to Update

1. **Open** `.windsurfrules` in your editor
2. **Find** line 39 (starts with "### MANDATORY SESSION PROTOCOL")
3. **Select** lines 39-81 (entire protocol section)
4. **Replace** with the new 6-step protocol above
5. **Save** the file
6. **Restart** Windsurf IDE (important for changes to take effect)

---

## Verification

After updating and restarting, start a new Cascade session and say:

```
"What is the mandatory session protocol?"
```

Cascade should respond with the **6-step protocol** including:

- Step 1.5: Branch creation
- Step 6: Merge & cleanup

---

## Alternative: Use Session Starter Template

If you don't want to manually update `.windsurfrules`, you can:

1. **Always start sessions** with the template from `.cascade/templates/session-starter.md`
2. **Manually enforce** the Git workflow by stopping Cascade if it skips steps
3. **Rely on memories** - Cascade can retrieve the Git workflow memory when needed

**However, this is less reliable than updating `.windsurfrules`.**

---

**Recommendation:** Update `.windsurfrules` manually for automatic enforcement.
