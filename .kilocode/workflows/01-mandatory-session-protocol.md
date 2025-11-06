# Workflow 01 — Mandatory Session Protocol

Prereqs:

- Local dev on 3000, project loaded, on feature branch

Steps:

1. Step 1 — Initialize session
   - Read .agent/progress.md and docs/13-Project-Plan.md
   - Create .agent/task/current-session-[YYYYMMDD-HHMM].md
   - Confirm: ✅ STEP 1 COMPLETE: Session initialized at [timestamp]
2. Step 1.5 — Create branch
   - Branch types: api/_, ui/_, feature/\*
   - Confirm: ✅ STEP 1.5 COMPLETE: Created branch [branch-name]
3. Step 2 — Plan & todos (save BEFORE code)
   - Save .agent/task/current-plan.md and .agent/task/current-todos.md
   - Confirm: ✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md
4. Step 3 — Experts
   - Invoke next-js-expert / prisma-expert / react-expert and record outputs
   - Confirm: ✅ STEP 3 COMPLETE: Consulted [expert] for [topic]
5. Step 4 — Checkpoints
   - Update session + todos every ~15K tokens
   - Confirm: ✅ CHECKPOINT at [X]K tokens: Progress saved
6. Step 4.5 — Verification Gate
   - Provide evidence per workflow 11; all requirements must pass
   - Confirm: ✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence
7. Step 5 — Post-completion
   - Update docs and system docs; commit docs first, then code
   - Confirm: ✅ STEP 5 COMPLETE: All documentation updated and committed

Outputs:

- current-session-\*.md, current-plan.md, current-todos.md updated

References: rules/01-mandatory-session-protocol.md
