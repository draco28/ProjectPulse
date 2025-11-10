# ADR-002: Database as Source of Truth (Markdown Export Optional/Internal)

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** ProjectPulse Development Team
**Consulted:** Planning session analysis

---

## Context

Current pain point: Manual markdown file updates lead to inconsistencies.

**Files requiring synchronization:**

- STATUS.md (current phase, last task completed)
- DEVELOPMENT_PLAN.md (detailed plan)
- .agent/task/current-todos.md (active tasks)
- .agent/task/current-plan.md (implementation plan)
- .agent/task/current-session-[timestamp].md (session notes)

**Problem:**

- Agents update database (Task.progress, Issue.status)
- Humans manually update markdown files
- → **Result:** Database and markdown files drift, inconsistencies, confusion

**The Question:** Should markdown files be authoritative, or should database be source of truth?

## Decision

**Database is the single source of truth. End users consume data via web UI and MCP API. Markdown export is optional/internal (dogfooding) and not required for end users.**

**Implementation:**

- All data tracked in database (Phase, Week, Day, Task, Session; Issues; Wiki; Knowledge)
- End users access data via web UI (Next.js) and agents via MCP API; no markdown dependence in user workflows
- Markdown export is optional for internal development context (dogfooding) and considered read-only by convention
- If markdown export is used, regeneration can be triggered on progress updates/checkpoints; no enforced git hooks for generated files

## Consequences

### Positive

- **Consistency:** Database and markdown always in sync
- **Automation:** No manual markdown updates required
- **Traceability:** Single source of truth for all progress tracking
- **Recovery:** Database transactions ensure data integrity, markdown regenerates

### Negative

- **Read-only markdown:** Developers cannot directly edit STATUS.md, current-todos.md
- **Template maintenance:** Changes to markdown format require template updates

### Neutral

- **MarkdownFile table:** Stores generated content, tracks last sync timestamp
- **Sync triggers:** On progress update, checkpoint, workflow step completion
- **Performance:** <500ms per markdown file generation (acceptable)

## Alternatives Considered

1. **Markdown as Source of Truth:**
   - Parse markdown files, update database from them
   - Rejected: Complex parsing, fragile, error-prone, doesn't leverage database transactions

2. **Bidirectional Sync:**
   - Allow both database and markdown edits, reconcile conflicts
   - Rejected: Conflict resolution complex, race conditions, merge complexity

3. **No Markdown Files (End-User Default):**
   - For end users, ProjectPulse uses database + web UI; no markdown reliance
   - Internal teams may optionally export markdown for dogfooding; this ADR treats markdown as optional/internal

## References

- Database schema: [docs/04-Data-and-Model-Spec.md](../../04-Data-and-Model-Spec.md)
- Markdown sync implementation: [docs/03-Architecture.md](../../03-Architecture.md) Section 3.4
- Git hooks: [docs/11-Infrastructure-and-Deployment.md](../../11-Infrastructure-and-Deployment.md)
- Sprint tracking: [docs/02-SRS.md](../../02-SRS.md) FR-001 to FR-025

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (database as source of truth)
