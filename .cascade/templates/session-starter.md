# SESSION STARTER - Copy-Paste at Start of Each Session Starter Template - Cascade Edition with Git Workflow

Copy-paste this into Cascade to start a new session with full protocol enforcement:

MANDATORY PROTOCOL - Cascade Edition with Git Workflow

Current phase: [COPY FROM STATUS.md - e.g., "Week 1.5 Phase 3 Day 5"]
Requirements: [COPY FROM DEVELOPMENT_PLAN.md - current phase requirements]

ENFORCE ALL 6 STEPS:
✅ Step 1: Initialize session (check git status, on master)
✅ Step 1.5: CREATE BRANCH (MANDATORY - before plan)
Format: api/[name], ui/[name], or feature/[name]
✅ Step 2: Save plan BEFORE code (on feature branch)

- Create implementation plan
- Get my approval
- IMMEDIATELY save to .agent/task/current-plan.md
- Create .agent/task/current-todos.md
- CONFIRM: "✅ STEP 2 COMPLETE: Plan saved"

✅ Step 3: Consult experts

- Use agent templates from memory for decisions
- react-expert for components
- next-js-expert for Server/Client decisions
- prisma-expert for database
- CONFIRM: "✅ STEP 3 COMPLETE: Consulted [expert]"

✅ Step 4: Checkpoints every 15K tokens

- Update .agent/task/current-session.md
- Update .agent/task/current-todos.md
- CONFIRM: "✅ CHECKPOINT at [X]K tokens: Progress saved"

✅ Step 5: Post-completion workflow

- Create COMPLETION\_[PHASE].md
- Update STATUS.md + DEVELOPMENT_PLAN.md
- Commit docs FIRST, code SECOND
- CONFIRM: "✅ STEP 5 COMPLETE: All documentation updated"

✅ Step 6: Merge to master (MANDATORY)

- Run quality gates (lint, type-check, build, test)
- Switch to master: git checkout master
- Merge feature branch: git merge --no-ff [branch-name]
- Delete feature branch: git branch -d [branch-name]
- CONFIRM: "✅ STEP 6 COMPLETE: Branch merged to master"

IF YOU SKIP ANY STEP, I WILL STOP YOU.
IF YOU DON'T CREATE A BRANCH, I WILL STOP YOU.
IF YOU COMMIT CODE BEFORE DOCS, I WILL STOP YOU.

Proceed with [phase name].
