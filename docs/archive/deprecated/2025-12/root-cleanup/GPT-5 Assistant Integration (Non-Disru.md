# GPT-5 Assistant Integration (Non-Disruptive to Claude Code)

## Principles (from your videos + repo rules)

- Claude Code remains primary; GPT-5 is complementary and docs-first.
- No config changes to `.claude/`, MCP, or orchestrator; reuse `docs/` and `.agent/` SoT.
- Guardrails: architecture [R-DOC-001], type safety [R-TS-001], tests [R-TEST-001], security [R-SEC-001], local-first [R-PRIVACY-001].
- Sub-agent pattern: GPT-5 performs research/planning in separate files, returns concise summaries; implementation only after approval.

## Operating Workflow (how I work without interference)

1. Intake

- Read `STATUS.md`, `.agent/active-context.md`, `.agent/system/*`, and relevant task docs.
- Confirm branch policy: work only on feature branches.

2. Research (token-efficient)

- Perform codebase exploration; save findings to `.agent/task/current-session-gpt5-[YYYYMMDD-HHMM].md`.
- Keep main thread short; link to session file.

3. Plan

- Propose edits and tests referencing concrete files (no writes yet).
- Align with `api-patterns`, `database-patterns`, `testing-patterns` in `.claude/skills/` (read-only).

4. Implement (when approved)

- Small, atomic edits; server components by default; Zod-validated endpoints; Prisma safe queries.
- Co-authoring: if Claude is mid-implementation, I defer or confine changes to non-overlapping files.

5. Verify

- Run gates sequentially: `pnpm lint`, `pnpm type-check`, `pnpm build`, `pnpm test` (>=80% coverage for new code).

6. Document

- Append outcomes to `.agent/active-context.md` and session file; create SOP in `.agent/sops/` when patterns emerge.

7. Handoff/Commit

- Commit with `[gpt5]` prefix on feature branch; never push without your confirmation.

## Artifacts and File Conventions (GPT-5 namespace)

- Session notes: `.agent/task/current-session-gpt5-[timestamp].md`
- Research reports: `.agent/task/research-[topic]-gpt5-[timestamp].md`
- Implementation plans: `.agent/task/impl-plan-[feature]-gpt5.md`
- SOPs (optional): `.agent/sops/[topic]-gpt5.md`
- No edits to `.claude/` files; no collisions with Claude’s session naming.

## Guardrails and Non-Interference Measures

- Never modify `.claude/**`, MCP configs, or Claude rules.
- No long-running background processes without flagging; use port 3000 policy.
- All data stays local; no cloud calls added.
- Prefer docs/test changes first when Claude is actively coding a feature.

## Collaboration Points with Claude Code

- Before any code, read `.agent/system/*` and task docs Claude generated.
- Use Claude’s existing patterns (validation, response shapes, directory layout) to avoid divergence.
- If both agents touch same area, I propose refactors via plan docs and wait for explicit go-ahead.

## Rollout Steps

1. Initialize GPT-5 session file and place non-invasive conventions (no code changes).
2. Dry-run on a small, low-risk task (e.g., add missing tests for an API route) to validate flow.
3. Adopt TDD for my changes: write tests first, then minimal code to pass.
4. Start using commit prefix `[gpt5]` and branch naming `feature/gpt5/<topic>`.
5. After first task, generate a short SOP: “Using GPT-5 alongside Claude Code”.
6. Expand scope gradually: docs, tests, minor refactors, then features.

## Validation and Success Criteria

- Zero changes to `.claude/` and MCP; Claude’s workflows unaffected.
- All gates pass consistently; coverage increases or holds >=80% for new code.
- Session docs show clear provenance and handoffs; no merge conflicts with Claude’s work.
- Measurable improvements: fewer regressions, faster reviews, better docs.
