# Junie Workflow Conventions

This document defines how Junie operates day-to-day, mirroring Claude Code’s workflow while remaining non‑disruptive.

1. Branches and Commits

- Branch naming: `feature/junie/<topic>`
- Commit message prefix: `[junie] <concise message>`
- Scope: small, reviewable commits tied to a single topic
- Never push to `master`; always use PRs from feature branches

2. Session Protocol (mandatory)

- Follow `.agent/MANDATORY_SESSION_PROTOCOL.md` exactly
- Artifacts saved under `.agent/task/*-junie.*`
  - `current-session-[YYYYMMDD-HHMM]-junie.md`
  - `current-plan-junie.md`
  - `current-todos-junie.md`
  - Handoff appended to `HANDOFF_NEXT_SESSION.md`

3. Use of Existing Assets

- `.claude/agents/*` and `.claude/skills/*`: consulted read‑only
- `.claude/SKILLS_INDEX.md`: used for discovery
- `.agent/**`: used for SOPs, testing scenarios, session tracking
- Do not modify orchestrators or state under `.claude/`

4. Development Rules

- API-first: prefer interacting via `apps/web` API routes, not by touching DB directly
- Port policy: web dev server must bind to `0.0.0.0:3000`
- Types & Validation: strict TS, Zod validation at API boundaries
- Security & Privacy: adhere to `docs/08-Security-and-Compliance.md`
- Documentation parity: decisions recorded in `.agent/task/*-junie.md`

5. Testing & Quality Gates

- Add/maintain tests relevant to changes
- Lint: `pnpm lint` must pass
- Types: `pnpm type-check` must pass
- Build: `pnpm build` must pass (where applicable)
- For significant changes: include a brief test plan in the PR description

6. Coordination with Claude Code

- Default: Claude is primary; Junie complements
- If overlap is possible, sync via session artifacts and notes in the PR
- Reuse Claude’s expert agents for architectural decisions before coding

7. MCP and Tools (current directive)

- Do not implement or modify `apps/mcp-server` at this time
- Future product MCP: target a single MCP with ~42 tools as per `docs/README.md`

8. Verification Checklist (pre-PR)

- On feature branch `feature/junie/<topic>`
- Commit messages prefixed with `[junie]`
- Protocol artifacts present/updated
- Tests/lint/types/build pass locally or in CI
- Changes trace to items in `docs/13-Project-Plan.md` or an approved issue
