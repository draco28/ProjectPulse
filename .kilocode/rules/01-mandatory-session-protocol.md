# 01 Mandatory Session Protocol

Enforce the project’s session workflow with explicit confirmations. Use this in tandem with workflows/01-mandatory-session-protocol.md.

Steps:

- Step 0: Pre-Work
  - pnpm dev must show 0.0.0.0:3000
  - Local-only; no cloud deps
- Step 1: Initialize Session
  - Read .agent/progress.md and docs/13-Project-Plan.md
  - Create .agent/task/current-session-[YYYYMMDD-HHMM].md
  - Confirm: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"
- Step 1.5: Create Branch
  - Naming: api/_, ui/_, feature/\*
  - Confirm: "✅ STEP 1.5 COMPLETE: Created branch [branch-name]"
- Step 2: Save Plan Before Code
  - Save .agent/task/current-plan.md and .agent/task/current-todos.md
  - Confirm: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md"
- Step 3: Expert Consultation
  - Invoke next-js-expert, prisma-expert, react-expert as required
  - Confirm: "✅ STEP 3 COMPLETE: Consulted [expert-name] for [decision-topic]"
- Step 4: Checkpoints
  - At ~15K token intervals, update session and todos
  - Confirm: "✅ CHECKPOINT at [X]K tokens: Progress saved"
- Step 4.5: Verification Gate (Evidence-Based)
  - Provide concrete evidence for each requirement:
    - Files: list changed files and key diffs
    - Tests: attach pnpm test results and coverage summary (≥80% new code)
    - Endpoints: attach example curl or client outputs
    - Database: counts/constraints verified via Prisma or psql
  - Fail-fast: if any requirement fails, continue work until all pass
  - Confirm: "✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence"
- Step 5: Post-Completion
  - Update STATUS/progress + docs/13-Project-Plan.md
  - If patterns changed → synthesize-docs; if architecture changed → map-system
  - Commit documentation first, then code
  - Confirm: "✅ STEP 5 COMPLETE: All documentation updated and committed"

References:

- .agent/MANDATORY_SESSION_PROTOCOL.md
- CLAUDE.md (Session Start Pattern), AGENTS.md (Golden Rules)
