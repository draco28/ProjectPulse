# Implementation Plan: Documentation Refactor Phase 1

**Date**: 2025-11-10 04:10
**Scope**: Phase 1 — Correct product vision across 6 critical files
**Decision**: SRS Option A (minimal) — Update FR-001 “Purpose” only; defer adding new 1.2 section to later phase

---

## Overview

Align docs to: “web-based project management platform (web UI + MCP API + DB storage)”. Remove end‑user claims about generating `.agent/` folders or `CLAUDE.md`. Emphasize: DB is source of truth; end users use the web UI.

## Targets (6 Files)

1) docs/01-PRD.md
- Section 1.1 Vision (lines 14–24) → replace with web‑app vision
- “Onboarding” (lines 43–58) → guided 3‑session onboarding (DB + UI)

2) docs/02-SRS.md (Option A)
- 1.1 FR‑001 Purpose (lines 25–30) → DB + Development Cycle page
- No new 1.2 section in Phase 1

3) docs/13-Project-Plan.md
- Replace Sprint 2 (lines ~656–779) with “Wiki Page + Onboarding System” content

4) docs/12-Backlog.md
- EPIC‑001 → “Progress Tracking & Development Cycle Page” with NOT Included list (no markdown/.agent for end users)

5) .agent/project-brief.md
- Replace Core Mission & Primary Goals with web‑app + MCP + DB vision

6) docs/03-Architecture.md
- Add “System Architecture Overview” diagram block
- De‑emphasize file generation; mark markdown export as internal/dogfooding only
- Update relationships and External Systems → File System sections accordingly

## Success Criteria
- [ ] Zero incorrect end‑user references:
  - “generates .agent/” → 0 results
  - “creates CLAUDE.md” → 0 results
  - “markdown sync.*end user” → 0 results
- [ ] Correct story appears in PRD Vision, Project Plan Sprint 2, Project Brief Core Mission
- [ ] Architecture clarifies DB + UI for end users; markdown only internal

## Implementation Steps
1. Edit PRD (Vision + Onboarding)
2. Edit SRS FR‑001 Purpose (Option A)
3. Replace Project Plan Sprint 2 section
4. Update Backlog EPIC‑001 section
5. Update Project Brief (Core Mission & Primary Goals)
6. Update Architecture (diagram + wording)
7. Run automated searches and manual verification
8. Provide Phase 1 change log

## Validation Plan (Step 4.5 Gate)
- Automated: ripgrep across the 6 files for incorrect terms; confirm presence of “web UI”, “database storage”, “MCP tools” in PRD/Plan/Brief
- Manual: Review PRD Vision, Project Plan Sprint 2, Project Brief Core Mission

## Definition of Done
- [ ] All 6 files updated and saved
- [ ] Automated searches: expected zeros for incorrect references
- [ ] Manual review passed
- [ ] Change log prepared and posted
- [ ] Branch ready for PR
