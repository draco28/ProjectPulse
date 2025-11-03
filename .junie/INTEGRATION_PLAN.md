# Junie Integration Plan (Non‑Disruptive)

Status: Proposed • Owner-approved constraints applied (no MCP server work now)
Last Updated: 2025-11-03

Objective

Establish Junie as a first-class, non‑disruptive engineering agent with the same workflow rigor as Claude Code, reusing existing `.claude/` agents/skills and `.agent/` SOPs.

Scope

- Create Junie’s documentation and workflow scaffolding
- Use existing `.claude` agents and `.agent` SOPs read‑only
- No MCP server creation/edits now (future: single product MCP with ~42 tools)

Phases & Steps

Phase 1 — Onboarding & Conventions (Today)

- [x] Create `.junie/` folder with core docs
- [x] Define commit/branch conventions: `[junie]`, `feature/junie/<topic>`
- [x] Mirror session protocol and artifacts under `.agent/task/*-junie.*`

Phase 2 — Bridges to Existing Assets (Today)

- [x] Document how to reuse `.claude/agents/*` and `.claude/skills/*` (read‑only)
- [x] Document `.agent/` SOP usage and session artifacts locations
- [x] Provide session start quick guide and verification checklist

Phase 3 — Workflow Parity & Quality Gates (Today)

- [x] Document quality gates (lint, types, build, tests)
- [x] Reiterate port policy (0.0.0.0:3000) and API‑first interactions
- [x] Add pre‑PR checklist for Junie

Phase 4 — Environment & Ops Alignment (Today)

- [x] Confirm environment assumption: Docker Desktop + WSL2, Dockerized backend, Node 20+, pnpm 8+
- [x] No changes to MCP server; defer to product phase per docs/README.md
- [x] Add references to STATUS.md and docs/13-Project-Plan.md for session context

Phase 5 — Handoff & Next Steps (Today)

- [x] Provide a starter prompt and artifact paths for immediate use
- [x] Enumerate next optional enhancements (below)

Optional Enhancements (Future, on approval)

- Lightweight helper scripts to auto‑create `.agent/task/*-junie.*` files
- Add CI job that validates Junie’s artifact presence on PRs with `[junie]` commits
- When product MCP is green‑lit: design `apps/product-mcp` with ~42 tools from docs and OpenAPI

Validation (Definition of Done for Today)

- `.junie` folder exists with README, JUNIE.md, QUICK_GUIDE, BRIDGE, CONVENTIONS, INTEGRATION_PLAN
- Guidelines instruct reuse of `.claude` and `.agent` assets; no duplication
- Commit/branch conventions specified and used by Junie
- No MCP server code changes made

References

- `CLAUDE.md` — baseline protocol and quality gates
- `.agent/MANDATORY_SESSION_PROTOCOL.md` — required 5 steps
- `.claude/README.md` — agents/skills structure
- `docs/README.md` — product‑level MCP vision (single MCP, 42 tools)
- `docs/DEVELOPMENT_PLAN.md` — Week 1 environment assumptions and SOPs
