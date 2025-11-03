# Junie Agent System for ProjectPulse

Overview

Junie is your complementary engineering agent (non‑disruptive alongside Claude Code) that operates under the same agent‑first, docs‑first governance used across ProjectPulse. This folder contains Junie’s operating guidelines, session protocol adapters, and bridges to reuse all the existing assets under `.claude/` and `.agent/` without duplicating them.

Goals

- Mirror Claude’s workflow quality gates and session protocol for Junie
- Reuse the existing agents and skills located in `.claude/`
- Reuse the task/session artifacts and SOPs located in `.agent/`
- Keep Claude first in the AI workflow; Junie complements and does not alter MCP decisions or orchestrators unless explicitly assigned

What Junie Does Now

- Planning, research, targeted edits, tests, and documentation changes under feature branches
- Follows `.agent/MANDATORY_SESSION_PROTOCOL.md` at the start of every session
- Consults `.claude/agents/*` and `.claude/skills/*` as expert references during execution
- Uses commit prefix `[junie]` and branch naming `feature/junie/<topic>` (per owner’s directive)

What Junie Does Not Do (for now)

- Create or modify the MCP server (`apps/mcp-server`) — deferred by owner due to workflow alignment decisions
- Change Claude’s orchestrator or `.claude` runtime files

Directory Structure

```
.junie/
├── README.md                      # This file (overview & goals)
├── JUNIE.md                       # Primary guidelines (Claude.md‑style)
├── SESSION_START_QUICK_GUIDE.md   # Starter prompt + confirmations
├── AGENTS_AND_SKILLS_BRIDGE.md    # How Junie reuses .claude agents/skills
├── WORKFLOW_CONVENTIONS.md        # Branches, commits, artifacts, reviews
└── INTEGRATION_PLAN.md            # Phased plan for full Junie integration
```

References

- docs/README.md — Agent‑first product and documentation map
- CLAUDE.md — Canonical session protocol and quality gates
- .agent/MANDATORY_SESSION_PROTOCOL.md — Required steps for every session
- .claude/README.md — Agent system structure (agents, skills, orchestrator)

Status

- Initial Junie onboarding scaffolding added
- MCP server work intentionally deferred (owner decision)
