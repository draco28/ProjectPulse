# Active Context

**Updated**: 2025-12-19
**Current Sprint**: 14 - Bug Fixes & Polish
**Branch**: `fix/sprint-14-fixes`

---

## Current Focus

Working on Sprint 14 fixes and improvements:
- Memory bank sync (this task) - syncing `.agent/` to ProjectPulse database
- Ticket system enhancements (hierarchy, traceability)
- MCP tool gaps (ticket_get added)

---

## Active Work Items

### In Progress
- **Memory Bank Sync**: Condensing bloated `.agent/` files and syncing to ProjectPulse
- **Ticket #12** ✅: Added `ticket_get` MCP tool for full details retrieval

### Open Tickets (Sprint 14)
- #10: Dashboard navigation regression
- #11: Wiki search relevance tuning
- #13: Onboarding Session 3 sync improvement
- #14: Roadmap materialization edge cases
- #15: E2E test flakiness

---

## Recent Completions

- ✅ Sprint 13: Ticket hierarchy (parent/child) + traceability (backlogRefs)
- ✅ Sprint 12: Simplified hierarchy (Phase→Sprint→Week→Day, removed Task/Session)
- ✅ Sprint 11: Client Agent APIs (personas, skills, SOPs via MCP)
- ✅ Sprint 10: Unified Ticket System (7 kinds, MCP tools)

---

## Technical Context

**Environment**: Mac mini Docker (localhost:3000, localhost:3001)
**Database**: PostgreSQL with pgvector
**MCP Tools**: 80+ tools across wiki, tickets, context, knowledge, sessions

---

## Blockers

None currently.

---

*This file tracks current work. See progress.md for completed sprints.*
