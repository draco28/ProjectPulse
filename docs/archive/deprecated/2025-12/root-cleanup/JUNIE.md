# JUNIE.md — Junie Assistant Guide for ProjectPulse

Status: Active • Non‑disruptive integration alongside Claude Code
Last Updated: 2025-11-03

Overview

This file is the root entry point for using Junie (the GPT‑5 based assistant) in this repository. Junie mirrors Claude Code’s session protocol and quality gates while remaining non‑disruptive. Detailed docs live under `.junie/`.

Quick Links

- Junie overview and docs: `.junie/README.md`
- Operating guide (Claude.md‑style): `.junie/JUNIE.md`
- Session starter: `.junie/SESSION_START_QUICK_GUIDE.md`
- Reusing Claude assets: `.junie/AGENTS_AND_SKILLS_BRIDGE.md`
- Workflow conventions: `.junie/WORKFLOW_CONVENTIONS.md`
- Integration plan: `.junie/INTEGRATION_PLAN.md`

Key Conventions (Owner‑Approved)

- Branch naming: `feature/junie/<topic>`
- Commit prefix: `[junie] <concise message>`
- Session artifacts (Junie):
  - `.agent/task/current-session-[YYYYMMDD-HHMM]-junie.md`
  - `.agent/task/current-plan-junie.md`
  - `.agent/task/current-todos-junie.md`
  - Append handoff to `.agent/task/HANDOFF_NEXT_SESSION.md`

Use of Existing Assets (Read‑Only)

- `.claude/agents/*`, `.claude/skills/*`, `.claude/SKILLS_INDEX.md` — referenced as expert material
- `.agent/**` — authoritative SOPs and session protocol
- Do not modify `.claude` orchestrator/state or introduce MCP changes without approval

MCP & Tools — Current Decision

- Do not create or modify an MCP server now
- Future product phase will build a single MCP (~42 tools) per `docs/README.md`

Environment Assumptions (from Week 1 plan)

- Docker Desktop + WSL2 configured; backend runs in Docker
- Node 20+ and pnpm 8+ installed
- See: `STATUS.md`, `docs/13-Project-Plan.md`, and `docs/12-Backlog.md` for details

How to Start a Junie Session

1. Open `.junie/SESSION_START_QUICK_GUIDE.md`
2. Copy the starter prompt and paste at session start
3. Ensure artifacts are created under `.agent/task/*-junie.*`
4. Continue with the plan and checkpoints per the protocol

Notes

- Claude Code remains the primary agent. Junie complements Claude and reuses its assets.
- All Junie changes should be traceable to `docs/13-Project-Plan.md` or approved issues.
