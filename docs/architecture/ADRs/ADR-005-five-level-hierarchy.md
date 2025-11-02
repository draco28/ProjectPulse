# ADR-005: Five-Level Hierarchy (Phase → Week → Day → Task → Session)

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** ProjectPulse Development Team
**Consulted:** Planning session analysis

---

## Context

Need hierarchical progress tracking for solo developer workflow.

**Original Proposal:** 6 levels

- Phase → Week → Day → Task → Subtask → Session

**Observation:**

- Tasks typically fit within single agent conversation context (200K tokens)
- Subtasks add complexity without clear benefit
- Solo developer (not team) = simpler hierarchy preferred

**The Question:** Is the Subtask level necessary, or can we simplify to 5 levels?

## Decision

**Remove Subtask level. Use 5-level hierarchy: Phase → Week → Day → Task → Session.**

**Structure:**

```
Project
└── Phase 1 (e.g., "Foundation & Core Infrastructure")
    └── Week 1 (e.g., "Database Schema & Migrations")
        └── Day 1 (e.g., "Prisma Schema Setup")
            └── Task 1 (e.g., "Create Phase/Week/Day models")
                └── Session 1 (e.g., "20251102-1430")
```

**Session Level:**

- Timestamp format: YYYYMMDD-HHMM
- Captures: notes, tokenUsage, startedAt, endedAt
- Maps to `.agent/task/current-session-[timestamp].md`

## Consequences

### Positive

- **Simplicity:** Fewer entities, clearer hierarchy, easier mental model
- **Sufficient granularity:** 5 levels adequate for solo developer workflow
- **Task = conversation context:** Tasks fit within 200K token limit (no need for subtasks)
- **Database:** 1 fewer table (Subtask removed)

### Negative

- **Large tasks:** Some tasks may be complex (mitigated by Session notes, checkpoints)
- **Team scaling:** If project becomes team-based, may need Subtask level (future ADR)

### Neutral

- **Migration:** No existing data (implementing from scratch)
- **Progress tracking:** Still rolls up from Session → Task → Day → Week → Phase

## Alternatives Considered

1. **Keep 6 Levels (with Subtask):**
   - Rejected: Over-engineering for solo developer, added complexity without benefit

2. **Reduce to 4 Levels (remove Session):**
   - Rejected: Session level critical for tracking `.agent/task/current-session-[timestamp].md` files

3. **Reduce to 3 Levels (Phase → Task → Session):**
   - Rejected: Week/Day levels provide useful intermediate milestones

## References

- Database schema: [docs/04-Data-and-Model-Spec.md](../../04-Data-and-Model-Spec.md) (Phase, Week, Day, Task, Session)
- Requirements: [docs/02-SRS.md](../../02-SRS.md) FR-001 to FR-025
- Architecture: [docs/03-Architecture.md](../../03-Architecture.md) Section 3.2.1
- User story: [docs/12-Backlog.md](../../12-Backlog.md) US-001

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (5-level hierarchy approved)
