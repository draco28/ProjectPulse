# Junie Session Start Quick Guide

Purpose

Fast, copy-pasteable starter that enforces the same mandatory protocol used for Claude Code, adapted for Junie.

Starter Prompt (Copy-Paste This)

```
MANDATORY PROTOCOL (JUNIE) — Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: [copy from STATUS.md]
Requirements: [copy from docs/13-Project-Plan.md]

ENFORCE:
- ✅ Step 1: Initialize session (create .agent/task/current-session-[YYYYMMDD-HHMM]-junie.md)
- ✅ Step 2: Save plan BEFORE code (.agent/task/current-plan-junie.md, current-todos-junie.md)
- ✅ Step 3: Consult experts (.claude/agents/* and .claude/skills/*)
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 5: Post-completion workflow (update HANDOFF_NEXT_SESSION.md)

Confirm each step explicitly. If you skip ANY step, I will stop you.
Proceed with [phase name].
```

What Junie Must Produce

1. `.agent/task/current-session-[YYYYMMDD-HHMM]-junie.md`
2. `.agent/task/current-plan-junie.md`
3. `.agent/task/current-todos-junie.md`
4. Checkpoint notes at ~15K tokens or per milestone
5. Handoff update in `.agent/task/HANDOFF_NEXT_SESSION.md`

Verification Checklist

- Port check: `pnpm dev` must bind to 0.0.0.0:3000
- Branch check: on `feature/junie/<topic>`
- Commit format: `[junie] <message>`
- Docs alignment: actions trace back to docs/README.md + docs/13-Project-Plan.md
- No MCP server changes (per current directive)
