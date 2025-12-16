# Vision Misalignment Report: ProjectPulse Documentation Audit

**Date**: 2025-01-12 14:20
**Scope**: docs/ folder analysis
**Issue**: Confusion between dogfooding setup (.agent/, .claude/) vs end product vision

---

## Executive Summary

**Critical Finding**: Documentation correctly describes ProjectPulse as a web app for end users, BUT contains confusing references to "memory banks," "workflow blueprint," and ".agent/ folder" that blur the line between:
- **Internal dogfooding** (how WE build ProjectPulse using .agent/)
- **End product features** (what END USERS get: web UI + MCP tools)

**Impact**: Medium severity - Core vision is correct, but terminology creates confusion about what end users actually receive.

---

## Key Misalignments Found

### 1. PRD Section 1.2: "Session 3 - AI Workflow Blueprint" (Lines 67-72)

**Location**: `docs/01-PRD.md` lines 67-72

**Problem**:
```markdown
3. **Session 3 - AI Workflow Blueprint**
   - ProjectPulse sends prompt: "Create memory banks, skills, SOPs for this project..."
   - Agent creates workflow artifacts
   - Agent stores in database via MCP (Knowledge Base + Wiki)
   - Visible in: Knowledge Base page, Wiki page (category: "Workflows")
```

**Issue**:
- Uses term "memory banks" which is dogfooding-specific (.agent/ folder)
- Says "Create memory banks, skills, SOPs" but these are internal concepts
- End users don't get ".agent/ folders" - they get database-backed wiki/knowledge base

**Should Say**:
```markdown
3. **Session 3 - Development Workflow Setup**
   - ProjectPulse sends prompt: "Create project knowledge, development patterns, SOPs..."
   - Agent creates workflow documentation
   - Agent stores in database via MCP (Knowledge Base + Wiki)
   - Visible in: Knowledge Base page, Wiki page (category: "Workflows")
```

**Severity**: Medium - Correct intent (database storage, web UI access), wrong terminology

---

### 2. PRD Section 1.2: "Tickets include memory bank snapshots" (Line 79)

**Location**: `docs/01-PRD.md` line 79

**Problem**:
```markdown
- Tickets include memory bank snapshots → Context preserved across sessions
```

**Issue**:
- "Memory bank snapshots" is dogfooding terminology
- End users' agents don't have ".agent/ folders" to snapshot
- Feature should be "Tickets include project context snapshots"

**Should Say**:
```markdown
- Tickets include project context snapshots (knowledge, wiki, progress) → Context preserved across sessions
```

**Severity**: Medium - Feature concept correct (context preservation), wrong terminology

---

### 3. PRD Section 4.2.10: Memory Bank System Epic (Lines 521-606)

**Location**: `docs/01-PRD.md` lines 521-606

**Problem**:
- Entire epic describes ".agent/ folder structure" (project-brief.md, system-patterns.md, etc.)
- This is **DOGFOODING ONLY** (how we build ProjectPulse)
- End users don't get these files; they access knowledge via web UI

**Issue**:
```markdown
**Purpose**: Token-efficient context management through structured memory bank files

Structured memory bank files in `.agent/` folder:
1. **project-brief.md** (3K tokens)
2. **system-patterns.md** (4K tokens)
3. **tech-context.md** (2K tokens)
4. **active-context.md** (1K tokens)
5. **progress.md** (2K tokens)
```

**Should Say**:
```markdown
**Purpose**: Token-efficient context management through structured knowledge organization

Structured knowledge categories in database:
1. **Project Overview** (executive summary, goals, users)
2. **System Patterns** (architecture patterns, API conventions)
3. **Tech Context** (dependencies, configuration, troubleshooting)
4. **Active Context** (current sprint, recent changes, blockers)
5. **Progress Tracking** (completed work, metrics, lessons learned)

**Storage**: All data in ProjectPulse database, accessed via Knowledge Base + Wiki pages
**Agent Access**: MCP tools (`knowledge.query()`, `wiki.read()`)
**Human Access**: Web UI (Knowledge Base page, Wiki page)
```

**Severity**: High - Epic describes internal feature as end-user feature

---

### 4. Architecture Doc: ".agent/ folder" references (Lines 132, 179)

**Location**: `docs/03-Architecture.md` lines 132, 179

**Problem**:
```markdown
Line 132: System_Ext(filesystem, "File System", "Internal dogfooding-only markdown export (optional)<br/>.agent/ folder, STATUS.md")

Line 179: **Context:** Reads and writes via MCP to the database; may optionally read internal markdown exports in the ProjectPulse repo (dogfooding only)
```

**Good**: Architecture doc correctly labels ".agent/ folder" as "dogfooding only"

**Issue**: But PRD doesn't make this distinction clear

**Recommendation**: PRD should explicitly state "Memory Bank System is for ProjectPulse internal development only. End users get equivalent features via Knowledge Base + Wiki."

**Severity**: Low - Architecture is correct, but PRD needs clarification

---

### 5. AgentOps Plan: Context File Workflow (Lines 253-489)

**Location**: `docs/05-AgentOps-Plan.md` multiple references to `.agent/task/` files

**Problem**:
```markdown
Line 253:   contextFile: string; // Auto-created: .agent/task/current-session-20251102-1400.md
Line 409:   todosFile: string; // .agent/task/current-todos.md
Line 1554: 3. System creates `.agent/task/current-session-[YYYYMMDD-HHMM].md`
```

**Issue**:
- Describes internal dogfooding workflow (how WE build ProjectPulse)
- End users' agents don't create `.agent/task/` files
- They use Tickets system (database-backed)

**Should Say**:
- "Ticket creation" instead of "context file creation"
- "Ticket snapshots" instead of "markdown file exports"
- "Database records" instead of "markdown files"

**Severity**: Medium - Document correctly describes current dogfooding, but unclear if this is end-user feature

---

### 6. Backlog: EPIC-010 & EPIC-011 (Memory Banks + Research Agents)

**Location**: `docs/12-Backlog.md` lines 367-432

**Problem**:
- EPIC-010 (Memory Bank System) and EPIC-011 (Research Agent Orchestration) are **dogfooding epics**
- Listed as "Must Have (P0)" but they're for internal development, not end users

**Issue**:
```markdown
EPIC-010: Memory Bank System
**Priority:** Must Have (Critical - blocks efficient Claude Code development)
```

**Should Say**:
- Label as "Internal/Dogfooding Feature (Not End User Facing)"
- OR: Reframe as "Knowledge Organization System (End User Feature)" with database storage, not .agent/ files

**Severity**: High - Backlog incorrectly prioritizes internal features as end-user features

---

## Summary of Misalignments

### High Severity (3 issues)

1. **PRD EPIC-010 (Memory Bank System)**: Describes .agent/ folder as end-user feature
2. **Backlog EPIC-010/EPIC-011**: Dogfooding features labeled "Must Have (P0)"
3. **AgentOps Plan**: Context file workflow describes internal dogfooding

### Medium Severity (2 issues)

4. **PRD Session 3 "AI Workflow Blueprint"**: Uses dogfooding terminology ("memory banks")
5. **PRD Ticket System**: References "memory bank snapshots" (dogfooding term)

### Low Severity (1 issue)

6. **Architecture Doc**: Already correctly labeled as "dogfooding only" but PRD doesn't clarify

---

## Root Cause Analysis

**Why this happened**:
1. Sprint 9 added Memory Bank System for internal development efficiency
2. Documentation described implementation details (how it works internally)
3. No clear boundary established: "This is for US" vs "This is for END USERS"

**Evidence of correct vision**:
- ✅ PRD correctly states "Repository stays clean" (line 73)
- ✅ Architecture correctly labels .agent/ as "dogfooding only" (line 132)
- ✅ Database-first design is correct throughout

**The confusion**:
- ❌ Memory Bank terminology used in end-user onboarding flow
- ❌ Epics labeled "Must Have" when they're internal-only
- ❌ No explicit section: "Internal Features vs End User Features"

---

## Recommended Fixes

### 1. Add Clarification Section to PRD

Add new section after 1.2:

```markdown
### 1.2.5 Internal vs End User Features

**For Clarity:**

ProjectPulse is built using its own features (dogfooding). This documentation describes BOTH:
1. **End User Features** (what developers using ProjectPulse get)
2. **Internal Features** (tools we use to build ProjectPulse itself)

**End User Features (Web App + MCP):**
- Wiki pages (database-backed, web UI + MCP tools)
- Knowledge Base (database-backed, web UI + MCP tools)
- Issues (database-backed, web UI + MCP tools)
- Tickets (database-backed, sprint work tracking)
- Progress Tracking (Development Cycle page)

**Internal Features (Dogfooding Only):**
- .agent/ folder (memory banks, task files) - NOT in end users' repos
- .claude/ folder (skills, agents) - NOT in end users' repos
- STATUS.md, DEVELOPMENT_PLAN.md - Optional markdown exports for dogfooding

**Key Principle**: End users' repositories stay clean. No .agent/ or .claude/ folders. All data lives in ProjectPulse database, accessed via web UI or MCP tools.
```

### 2. Rename/Relabel EPIC-010

**Current**: "Memory Bank System (P0 Must Have)"
**Should Be**: "Internal: Context Management System (Dogfooding - Not End User Feature)"

OR: Rename as "Knowledge Organization System" and describe database-backed implementation (not .agent/ files)

### 3. Update PRD Session 3 Terminology

**Current**: "Create memory banks, skills, SOPs..."
**Should Be**: "Create project knowledge, development patterns, SOPs..."

**Current**: "Tickets include memory bank snapshots"
**Should Be**: "Tickets include project context snapshots (knowledge, wiki, progress)"

### 4. Add Labels to Backlog

Add column: **User Facing?**
- EPIC-001 to EPIC-008: ✅ Yes
- EPIC-010 to EPIC-011: ❌ No (Internal/Dogfooding)
- EPIC-012: ✅ Yes (Documentation Generation)

### 5. Clarify AgentOps Plan

Add note at top of document:

```markdown
**Important**: This document describes workflows for AI agents using ProjectPulse.
Sections referencing `.agent/` folders are for internal dogfooding only.
End users' agents interact via MCP tools with database-backed features (wiki, knowledge base, tickets).
```

---

## Conclusion

**Core Vision**: ✅ **CORRECT** - ProjectPulse is a web app for end users

**Problem**: Terminology and epic labeling create confusion by mixing:
- Internal dogfooding features (.agent/ folders, memory banks)
- End user features (database-backed wiki, knowledge base, tickets)

**Recommendation**: Add clarification sections + relabel internal epics + update terminology to distinguish "memory banks" (internal) from "knowledge organization" (end-user feature)

**Action Items**:
1. Add "Internal vs End User Features" section to PRD
2. Relabel EPIC-010/EPIC-011 as "Internal/Dogfooding"
3. Update Session 3 terminology ("memory banks" → "project knowledge")
4. Update Backlog with "User Facing?" column
5. Add clarification note to AgentOps Plan

**Priority**: Medium - Vision is correct, but documentation needs clarity to avoid developer confusion

---

**End of Report**
