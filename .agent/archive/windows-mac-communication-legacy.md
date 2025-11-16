# Legacy: Windows ↔ Mac Mini Communication Protocol

**Status**: DEPRECATED
**Date Archived**: 2025-11-16
**Reason**: All development now happens on Mac mini directly. No cross-machine handoff needed.

---

## ⚠️ LEGACY PATTERN – WINDOWS ↔ MAC MINI GIT HANDOFF

This section describes a Git-based communication workflow between a Windows
Claude Code instance and a Mac mini Claude Code instance using
`.agent/task/mac-mini-instructions.md` as an instruction queue. It assumes
two machines and is kept **only for historical reference**.

**Current reality:** All development and runtime happen directly on the
**Mac mini** using Docker. There is no active Windows dev machine or
cross-machine handoff in the normal workflow.

**For the current setup, use:**
- `.agent/sops/mac-mini-cloud-architecture.md`
- `.agent/archive/windows-workflows-index.md`

---

## The Problem

Windows Claude Code and Mac mini Claude Code are separate instances. Manually copy-pasting prompts between machines is tedious.

## The Solution: Git-Based Communication

Use `.agent/task/mac-mini-instructions.md` as an instruction queue **ONLY** for server-side operations that cannot be done from Windows (Docker operations, database migrations, server debugging).

## Quick Workflow

**On Windows** (when you need Mac mini to do something):
1. I write instructions to `.agent/task/mac-mini-instructions.md`
2. I commit: `git commit -m "task: [description] for Mac mini"`
3. I push: `git push origin feature/sprint-1-foundation`
4. You tell Mac mini: "Pull git and execute mac-mini-instructions"

**On Mac mini** (when you say "pull git and work as instructed"):
1. Mac mini Claude Code pulls: `git pull origin feature/sprint-1-foundation`
2. Reads: `.agent/task/mac-mini-instructions.md`
3. Executes instructions step by step
4. Updates file with results
5. Commits and pushes back

**Windows pulls to see results**.

## References

**Complete Protocol**: [.agent/sops/mac-mini-communication-protocol.md](.agent/sops/mac-mini-communication-protocol.md)

**Protocol Overview**: [.agent/task/README-mac-mini-communication.md](.agent/task/README-mac-mini-communication.md)
