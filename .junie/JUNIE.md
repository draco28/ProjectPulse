# Junie Code Integration Guide - ProjectPulse

Version: 1.0 (Non‑Disruptive)
Last Updated: 2025-11-03

---

Quick Start

Just talk to me like you do with Claude Code — I follow the same guardrails and session protocol, but with Junie‑specific conventions.

Example intents:

```
"Draft an implementation plan for GET /api/issues with Zod validation"
"Refactor the Filters helper to reduce duplicate logic (no API changes)"
"Design tests for the search API and wire into CI"
```

CRITICAL: Mandatory Session Protocol (Same as Claude)

Before any work, I must follow the same 5‑step protocol defined for Claude Code.

- Spec: .agent/MANDATORY_SESSION_PROTOCOL.md
- Quick Guide: .junie/SESSION_START_QUICK_GUIDE.md

I will explicitly confirm each step in chat and persist artifacts in `.agent/task/`.

Session Start Pattern (Junie)

Paste this at the start of every Junie session:

```
MANDATORY PROTOCOL (JUNIE) — Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: [copy from STATUS.md]
Requirements: [copy from docs/13-Project-Plan.md]

ENFORCE:
- ✅ Step 1: Initialize session (create .agent/task/current-session-[YYYYMMDD-HHMM]-junie.md)
- ✅ Step 2: Save plan BEFORE code (.agent/task/current-plan-junie.md, current-todos-junie.md)
- ✅ Step 3: Consult experts (.claude/agents/*)
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 5: Post-completion workflow

Confirm each step explicitly. If you skip ANY step, I will stop.
Proceed with [phase name].
```

What I Must Do (Per Protocol)

STEP 1: INITIALIZATION

- Read STATUS.md and docs/13-Project-Plan.md
- Create `.agent/task/current-session-[YYYYMMDD-HHMM]-junie.md`
- Confirm: "✅ STEP 1 COMPLETE (Junie): Session initialized at [timestamp]"

STEP 2: PLAN CREATION

- Draft implementation plan; request approval
- Save to `.agent/task/current-plan-junie.md`
- Create `.agent/task/current-todos-junie.md`
- Confirm: "✅ STEP 2 COMPLETE (Junie): Plan saved to current-plan-junie.md, todos saved"

STEP 3: EXPERT CONSULTATION

- Consult .claude agents as needed: `react-expert`, `next-js-expert`, `prisma-expert`, `devhub-architect`, `devhub-mcp-specialist` (read their .md guidance; do not modify them)
- Confirm: "✅ STEP 3 COMPLETE (Junie): Consulted [expert] for [topic]"

STEP 4: CHECKPOINTS

- Every ~15K tokens or after major milestone: summarize, verify gates, and seek approval
- Confirm: "✅ CHECKPOINT (Junie): Summary + next actions"

STEP 5: POST-COMPLETION

- Create handoff in `.agent/task/HANDOFF_NEXT_SESSION.md` (append Junie section)
- Confirm: "✅ COMPLETION (Junie): Handoff updated"

Workflow Conventions (Junie)

- Branch naming: `feature/junie/<topic>`
- Commit prefix: `[junie] <concise message>`
- Artifacts folder: `.agent/task/*-junie.*` for session/plan/todos
- Scope control: non‑disruptive; coordinate with Claude for overlapping tasks
- Port policy: Dev server MUST bind to 0.0.0.0:3000 (see CLAUDE.md)
- Database: interact via app API routes only (no direct DB from scripts)
- Tests: new/changed code should include tests when applicable (follow Testing & QA docs)

Reusing Claude’s Agents & Skills

- Agents directory: `.claude/agents/*.md` — treat as expert guidance
- Skills directory: `.claude/skills/**` — use as procedural checklists
- Skills Index: `.claude/SKILLS_INDEX.md` — discoverability map
- Orchestrator/Ops: do NOT modify `.claude/*.py` files; Junie only reads them for context

MCP & Tools (Current Decision)

- Do NOT implement or modify `apps/mcp-server` for now (owner directive)
- Future target: a single product MCP with ~42 tools per docs/README.md; we will revisit in product phase

Quality Gates

- Type safety (TS strict), Zod input validation
- Lint, format, type‑check pass in CI
- No breaking changes to API contracts unless approved
- Document decisions in `.agent/task/*-junie.md`

Acknowledgements

This guide mirrors `CLAUDE.md` expectations while adapting names and conventions for Junie. It is intentionally light on MCP mechanics until the product‑level MCP is green‑lit.
