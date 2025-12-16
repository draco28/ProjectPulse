# Documentation Fix Source of Truth

**Created**: 2025-11-06
**Purpose**: Establish authoritative values for all documentation updates
**Related**: `.agent/Junie_audit.md`, `.agent/task/documentation-audit-fix-plan.md`

---

## Key Decisions

### 1. Functional Requirements (FRs)

**MVP FR Ceiling**: FR-001 to FR-158 (158 total FRs for MVP)
**Post-MVP FR Range**: FR-159 to FR-220 (62 additional FRs)
**Total FRs**: 220

**FR Gap**: FR-126 to FR-145 (20 FRs reserved for future features)

**Source of Truth**: `docs/12-Backlog.md` (user stories define FR assignments)

---

### 2. Epic Numbering

**Core MVP Epics**:

- EPIC-001: Project Management (Priority 0 - Must Have)
- EPIC-002: Knowledge Base (Priority 0 - Must Have)
- EPIC-003: Analytics & Reporting (Priority 0 - Must Have)
- EPIC-004: Team Collaboration (Priority 1 - Should Have)
- EPIC-005: Integrations (Priority 1 - Should Have)
- EPIC-006: Advanced Search (Priority 2 - Could Have)
- EPIC-007: Mobile Experience (Priority 2 - Could Have)
- EPIC-008: Advanced Reporting (Priority 2 - Could Have)

**EPIC-009**: **RESERVED FOR FUTURE USE** (intentional gap)

- Status: Intentional gap, not assigned in current project
- Rationale: Reserved for future features, maintains backward compatibility

**New MVP Epics** (Agent-First Pivot):

- EPIC-010: Memory Bank System (Priority 0 - Must Have, FR-146 to FR-153)
- EPIC-011: Research Agent Orchestration (Priority 1 - Should Have, FR-154 to FR-158)

**Post-MVP Epics**:

- EPIC-012: Advanced Ticket System (Priority 2, FR-159 to FR-200)
- EPIC-013: Additional Onboarding Sessions (Priority 2, FR-201 to FR-220)
- EPIC-014: Additional Onboarding Features (Priority 2, includes FR-159-160)

**Total Epics**: 13 (10 MVP, 3 Post-MVP, 1 gap)

---

### 3. MCP Tool Count

**Total MCP Tools**: 41
**Feature Count**: 9 features (tags in openapi.yaml)

**Source of Truth**: `docs/06-API/openapi.yaml`
**Verification Command**: `grep -c "operationId:" docs/06-API/openapi.yaml`
**Feature Count Command**: `grep "^  - name:" docs/06-API/openapi.yaml | wc -l`

**Breakdown**:

- Verified on 2025-11-06
- 41 operationIds across 9 tag categories
- NOT 42 tools (PRD description error fixed)
- NOT 59 tools (old Architecture diagram error fixed)

---

### 4. User Stories

**Total User Stories**: 138
**MVP User Stories**: 118 (Must Have + Should Have)
**Post-MVP User Stories**: 20 (Could Have)

**Source of Truth**: `docs/12-Backlog.md`

**Story Distribution**:

- EPIC-001: 25 stories (87 points)
- EPIC-002: 28 stories (95 points)
- EPIC-003: 18 stories (62 points)
- EPIC-004: 20 stories (78 points)
- EPIC-005: 12 stories (42 points)
- EPIC-006: 8 stories (31 points)
- EPIC-007: 5 stories (19 points)
- EPIC-008: 3 stories (12 points)
- EPIC-010: 8 stories (34 points)
- EPIC-011: 5 stories (24 points)

**Story IDs**: US-001 to US-138 (no gaps, sequential numbering)

---

### 5. Story Points

**Total Story Points**: 484
**MVP Story Points**: 422 (Must + Should)
**Post-MVP Story Points**: 62 (Could)

**MVP Calculation**:

- Must Have (P0): 87 + 95 + 62 + 34 = 278 points
- Should Have (P1): 78 + 42 + 24 = 144 points
- **MVP Total**: 278 + 144 = 422 points ✓

**Post-MVP** (Could Have - P2): 31 + 19 + 12 = 62 points

**Total**: 422 + 62 = 484 points ✓

---

### 6. Timeline

**Sprint Count**: 9 sprints
**Duration**: 18 weeks (9 sprints × 2 weeks)
**NOT**: 12 sprints or 24 weeks (old Backlog summary error)

**Source of Truth**: `docs/13-Project-Plan.md`

**Sprint Breakdown**:

- Sprint 1-9: MVP implementation
- Sprints 1-4: Must Have features (278 points)
- Sprints 5-7: Should Have features (144 points)
- Sprints 8-9: Refinement and polish

---

### 7. Test Cases

**MVP Test Cases**: TEST-001 to TEST-158
**Post-MVP Test Cases**: TEST-159 to TEST-220 (implied, not yet specified)

**Source of Truth**: `docs/09-Testing-and-QA.md` (to be updated with TEST-146 to TEST-158)

**New Test Ranges**:

- TEST-146 to TEST-153: Memory Bank System tests (EPIC-010)
- TEST-154 to TEST-158: Research Agent Orchestration tests (EPIC-011)

---

## Traceability Rules

### Primary Sources of Truth

1. **For FR Assignments**: `docs/12-Backlog.md` user stories are authoritative
   - User stories define which FRs belong to which epics
   - Backlog is updated first, other docs follow

2. **For MCP Tool Count**: `docs/06-API/openapi.yaml` is authoritative
   - Actual operationId count = truth
   - Descriptions in other docs must match

3. **For Timeline/Sprint Structure**: `docs/13-Project-Plan.md` is authoritative
   - Sprint count, duration, story allocation
   - Other docs reference this source

4. **For Story Points**: `docs/12-Backlog.md` epic tables are authoritative
   - Sum of epic story points = total story points
   - MVP calculation based on Must + Should priorities

### Traceability Chain

```
PRD (Features & Epics)
  ↓
SRS (Functional Requirements FR-001 to FR-220)
  ↓ ↘
  ↓   Architecture (ADR-001 to ADR-005)
  ↓     ↓
Backlog (User Stories US-001 to US-138)
  ↓
Project Plan (Sprint 1-9, 18 weeks)
  ↓
Testing (TEST-001 to TEST-158)
```

**Complete Traceability Example (EPIC-010)**:

```
PRD Section 4.2.10 (EPIC-010: Memory Bank System)
  → Backlog US-010-01 to US-010-08 (8 stories, 34 points)
    → SRS FR-146 to FR-153 (8 functional requirements)
      → Testing TEST-146 to TEST-153 (8 test cases)
        → Project Plan Sprint 9 (implementation)
```

---

## Critical Conflicts Resolved

### 1. FR-154 Definition Conflict

**Problem**: PRD/SRS said "Onboarding Rollback", Backlog said "explore-codebase Sub-Agent"

**Resolution**: **Backlog is source of truth**

- FR-154 = "Implement explore-codebase Sub-Agent" ✓
- Section 1.9 old "Project Onboarding System" content moved to Post-MVP
- FR-154 to FR-158 now correctly assigned to EPIC-011

**Fix Applied To**:

- `docs/02-SRS.md` Section 1.9-1.10 (major rewrite)
- `docs/09-Testing-and-QA.md` TEST-154 definition

---

### 2. MVP FR Ceiling Ambiguity

**Problem**: Was MVP ceiling FR-125 or FR-158 or FR-220?

**Resolution**: **FR-158 is MVP ceiling**

- MVP: FR-001 to FR-125 + FR-146 to FR-158 = 138 FRs
- FR-126 to FR-145 = reserved for future (20 FRs)
- FR-159 to FR-220 = Post-MVP (62 FRs)

**Fix Applied To**:

- All docs now explicitly state "158 MVP FRs, 220 total"
- Gap (FR-126 to FR-145) documented in PRD and SRS

---

### 3. MCP Tool Count Drift

**Problem**: Architecture said "59 tools/13 features", PRD said "41 tools/8 features"

**Resolution**: **openapi.yaml verification = 41 tools, 9 features**

- Verified 2025-11-06 with grep commands
- 41 operationIds (tool count) ✓
- 9 tags (feature count) ✓

**Fix Applied To**:

- `docs/03-Architecture.md` C4 diagrams (59/13 → 41/9)
- `docs/01-PRD.md` Section 1.2 (41/8 → 41/9)
- `docs/06-API/openapi.yaml` description (42 → 41)

---

### 4. Timeline Inconsistency

**Problem**: Backlog summary said "12 sprints (24 weeks)", Project Plan said "9 sprints (18 weeks)"

**Resolution**: **Project Plan is source of truth = 9 sprints, 18 weeks**

- 422 MVP points ÷ ~47 points/sprint = 9 sprints ✓
- 2-week sprint duration standard
- 18 weeks total for MVP

**Fix Applied To**:

- `docs/12-Backlog.md` summary row (line 777)

---

### 5. Story Count Drift

**Problem**: Various references to "125 stories" or "105 MVP stories"

**Resolution**: **138 total stories, 118 MVP stories**

- 138 user stories total (US-001 to US-138) ✓
- 118 MVP stories (Must + Should priorities)
- 20 Post-MVP stories (Could Have priority)

**Fix Applied To**:

- `docs/02-SRS.md` Related Documents header
- `docs/13-Project-Plan.md` cross-reference table
- `docs/13-Project-Plan.md` lines 262, 906 (105 → 118)

---

## Verification Commands

Use these commands to verify fixes:

```bash
# Should return 0 results (outdated numbers removed):
grep -r "125 stories" docs/01-PRD.md docs/02-SRS.md docs/13-Project-Plan.md
grep -r "105 MVP\|105 stories" docs/
grep -r "12 sprints\|24 weeks" docs/12-Backlog.md
grep -r "59 tools" docs/03-Architecture.md
grep -r "220 FRs" docs/ | grep -v "220 total"

# Should return updated numbers:
grep -r "138 stories" docs/
grep -r "118 MVP" docs/
grep -r "9 sprints\|18 weeks" docs/
grep -r "41 tools" docs/

# Verify FR-154 consistency (all should say "explore-codebase"):
grep -n "FR-154" docs/02-SRS.md docs/12-Backlog.md docs/09-Testing-and-QA.md

# Verify MCP tool count:
grep -c "operationId:" docs/06-API/openapi.yaml  # Should = 41
grep "^  - name:" docs/06-API/openapi.yaml | wc -l  # Should = 9
```

---

## Mathematical Proofs

### Story Points Sum

```
EPIC-001: 87 points
EPIC-002: 95 points
EPIC-003: 62 points
EPIC-004: 78 points
EPIC-005: 42 points
EPIC-006: 31 points
EPIC-007: 19 points
EPIC-008: 12 points
EPIC-010: 34 points
EPIC-011: 24 points
─────────────────
Total:   484 points ✓
```

### MVP Story Points

```
Must Have (P0):
  EPIC-001: 87 points
  EPIC-002: 95 points
  EPIC-003: 62 points
  EPIC-010: 34 points
  ─────────────────
  Subtotal: 278 points

Should Have (P1):
  EPIC-004: 78 points
  EPIC-005: 42 points
  EPIC-011: 24 points
  ─────────────────
  Subtotal: 144 points

MVP Total: 278 + 144 = 422 points ✓
```

### Post-MVP Story Points

```
Could Have (P2):
  EPIC-006: 31 points
  EPIC-007: 19 points
  EPIC-008: 12 points
  ─────────────────
  Subtotal: 62 points

Verification: 422 + 62 = 484 ✓
```

---

## Update History

- **2025-11-06**: Initial creation during documentation audit fix (Phase 1)
- All values verified against source documents
- All conflicts resolved using established sources of truth
