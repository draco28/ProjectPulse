# Architecture Pivot Decisions - ProjectPulse Vision Clarification

**Date**: 2025-11-05
**Status**: APPROVED
**Context**: Major architecture pivot from "project management tool" to "agent workflow infrastructure generator"

---

## Executive Summary

ProjectPulse is NOT a traditional project management tool. It is a **meta-platform that GENERATES the entire agent workflow infrastructure** (memory banks, skills, documentation, sprint plans) from scratch through guided sessions.

### The Paradigm Shift

**BEFORE (Wrong Understanding)**:

- Agents bring existing DEVELOPMENT_PLAN.md → populate ProjectPulse database → ProjectPulse generates markdown back
- Circular dependency: markdown → database → markdown
- ProjectPulse is just a database layer for markdown files

**AFTER (Correct Understanding)**:

- Agent starts fresh → ProjectPulse guides through sessions → generates ALL infrastructure
- ProjectPulse is the **source of truth** from Day 1
- Agents use ProjectPulse-generated artifacts to build their actual projects

---

## Key Architectural Decisions (APPROVED)

### Decision 1: Dual Entity Model (Issues + Tickets)

- **Keep BOTH** Issues (bugs/features) and Tickets (sprint work)
- Different lifecycles, different purposes
- Refactor Impact: LOW

### Decision 2: Flexible Session System

- Sessions are NOT fixed
- Created dynamically based on project type
- Sprint 1: Only Session 1 (Executive Summary)

### Decision 3: Progressive Documentation Generation

- Auto-generate docs after EACH session (not all at once)
- Reduces errors, provides incremental value
- Sprint 1: Only Executive Summary

### Decision 4: Sprint 1 Focus - Onboarding System Only

- EPIC-010: Project Onboarding System (Session 1 only)
- 6 user stories, 39 story points
- Validates core concept before expanding

---

## Sprint 1 Revised Scope

### EPIC-010: Project Onboarding System (Session 1)

**User Stories**:

1. US-146: Define Session 1 questions (5 pts)
2. US-147: Implement onboarding MCP tools (8 pts)
3. US-148: Build executive summary generator (8 pts)
4. US-149: Create Wiki page for summary (5 pts)
5. US-150: Initialize memory banks from summary (5 pts)
6. US-151: Build onboarding UI progress tracker (8 pts)

**Total**: 39 points

---

## Database Schema Changes

### New Tables for Sprint 1:

1. **ProjectOnboarding** - Stores session progress and Q&A data
2. **OnboardingQuestion** - Pre-populated questions for each session
3. **MemoryBank** - Stores memory bank files (project-brief.md in Sprint 1)

**Refactor Impact**: LOW (All new tables, no changes to existing)

---

## MCP Tools for Sprint 1

### 4 New Onboarding Tools:

1. `onboarding.startSession({ projectId, sessionNum })`
2. `onboarding.answerQuestion({ projectId, questionId, answer })`
3. `onboarding.getProgress({ projectId })`
4. `onboarding.generateSummary({ projectId })`

**Total MCP Tools**: 45 (was 41, added 4)

---

## What Changes in Existing Documentation

**Files to Update**:

1. docs/01-PRD.md - Replace EPIC-010/011 with new Onboarding System
2. docs/02-SRS.md - Replace FR-146-170 with new Onboarding FRs
3. docs/03-Architecture.md - Add 3 new models + 4 MCP tools
4. docs/12-Backlog.md - Replace old epics with EPIC-010 (6 stories)
5. docs/13-Project-Plan.md - Replace Sprint 9 with revised Sprint 1

---

## Next Steps

1. Delete `.agent/SPRINT_1_TRANSITION.md` (obsolete)
2. Create `.agent/SPRINT_1_ONBOARDING_SYSTEM.md` (new spec)
3. Update all 5 documentation files
4. Commit architecture pivot

---

## Key Takeaways

### What ProjectPulse IS:

✅ Meta-platform generating agent workflow infrastructure
✅ Guided onboarding through flexible sessions
✅ Source of truth for docs, memory banks, sprint plans
✅ Dual-purpose: Issues + Tickets

### What ProjectPulse IS NOT:

❌ Traditional project management tool
❌ Database layer for external markdown
❌ Requires pre-existing documentation

### Sprint 1 Focus:

🎯 Session 1: Executive Summary Generation
🎯 Prove guided onboarding → auto-generation → Wiki + Memory Banks
🎯 Foundation for future sessions

---

**This represents the CORRECTED architectural vision.**
**Previous SPRINT_1_TRANSITION.md is OBSOLETE.**

Last updated: 2025-11-05
Status: APPROVED
