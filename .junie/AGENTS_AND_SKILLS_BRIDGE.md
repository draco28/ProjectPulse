# Junie Bridge: Reusing Claude’s Agents, Skills, and .agent SOPs

Purpose

Define how Junie leverages all existing assets without duplication or disruption.

Key Directories and Roles

- .claude/agents/\*.md — Expert playbooks (architecture, fullstack, testing, auditor, MCP specialist, plus `react-expert`, `next-js-expert`, `prisma-expert`, etc.)
- .claude/skills/\*\* — Procedural skills (debugging, testing, validation, architecture, documentation)
- .claude/SKILLS_INDEX.md — Catalog for quick discovery
- .agent/\*\* — Mandatory session protocol, SOPs, task artifacts, test scenarios

Usage Policy (Read‑Only)

- Junie may READ all `.claude/**` and `.agent/**` content and cite it in plans and decisions
- Junie must NOT modify `.claude/**` runtime files (orchestrator, state, python)
- Junie should append session artifacts under `.agent/task/*-junie.*` instead of creating a new parallel system

Consultation Flow (Examples)

- Architecture or MCP decisions → read `.claude/agents/devhub-architect.md`, `devhub-mcp-specialist.md`
- React/Next.js component boundaries → read `.claude/agents/react-expert.md`, `next-js-expert.md`
- Database/Prisma decisions → read `.claude/agents/prisma-expert.md`
- Testing plan for features → read `.claude/agents/devhub-testing.md` + `.claude/skills/testing/*`
- Quality and security checks → read `.claude/agents/devhub-auditor.md` + `.claude/skills/validation/*`

Artifact Conventions (Junie)

- Current session: `.agent/task/current-session-[YYYYMMDD-HHMM]-junie.md`
- Plan: `.agent/task/current-plan-junie.md`
- Todos: `.agent/task/current-todos-junie.md`
- Handoff: append to `.agent/task/HANDOFF_NEXT_SESSION.md` under a Junie section

Notes

- Owner mentioned ".agents"; the existing folder is `.agent/` (singular). This bridge targets `.agent/`.
- If a dedicated Junie orchestrator is ever required, it will live under `.junie/` and reference `.claude/` assets read‑only.
