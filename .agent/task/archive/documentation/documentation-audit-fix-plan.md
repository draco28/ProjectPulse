# Documentation Audit Fix Plan

**Created**: 2025-11-06
**Audit Source**: `.agent/Junie_audit.md`
**Audit Status**: FAIL (10 critical, 9 major, 6 minor issues)
**Target Status**: PASS (all 25 issues resolved)
**Estimated Time**: 6.5-8 hours (with parallelization)

---

## Executive Summary

**Files Affected**: 7 documents
- docs/01-PRD.md
- docs/02-SRS.md
- docs/03-Architecture.md
- docs/06-API/openapi.yaml
- docs/09-Testing-and-QA.md
- docs/12-Backlog.md
- docs/13-Project-Plan.md

**Key Decisions Made**:
1. **MVP FR ceiling**: FR-158 (not FR-220) - aligns with Sprint 9 scope
2. **MCP tools**: 41 across 9 features (verified from openapi.yaml)
3. **EPIC-009**: Document as intentional gap (reserved for future)
4. **Epic structure**: EPIC-001-008, 010-011 (MVP); EPIC-012-014 (Post-MVP)
5. **FR gap (FR-126 to FR-145)**: Reserved for future features (20 FRs)

---

## PHASE 0: PREPARATION (15 min)

**Actions**:
1. Read openapi.yaml to verify MCP tool count → **Answer: 41 tools, 9 features**
2. Create `.agent/task/documentation-fixes-[YYYYMMDD-HHMM].md` for progress tracking
3. Create `.agent/SOURCE_OF_TRUTH.md` documenting all decisions
4. Review audit report one final time

**Outputs**:
- Source of truth document with all key decisions
- Progress tracking file for checkpoints

---

## PHASE 1: SOURCE OF TRUTH DECISIONS (30 min)

**Create `.agent/SOURCE_OF_TRUTH.md` with:**

```markdown
# Documentation Fix Source of Truth
**Created**: 2025-11-06
**Purpose**: Establish authoritative values for all documentation updates

## Key Decisions

1. **MVP FR Ceiling**: FR-001 to FR-158 (Backlog is source of truth)
2. **Post-MVP FR Range**: FR-159 to FR-220 (PRD Section 4.2.14)
3. **FR Gap (FR-126 to FR-145)**: Reserved for future features (20 FRs)
4. **Epic Numbering**:
   - EPIC-001 to EPIC-008: Core MVP epics
   - EPIC-009: Reserved for future use (intentional gap)
   - EPIC-010 to EPIC-011: New MVP epics (agent-first pivot)
   - EPIC-012 to EPIC-014: Post-MVP (Priority 2)
5. **MCP Tool Count**: 41 tools across 9 features (per openapi.yaml)
6. **Story Counts**: 138 total stories, 118 MVP (Must+Should)
7. **Timeline**: 9 sprints, 18 weeks
8. **Story Points**: 484 total, 422 MVP

## Traceability Rules

- Backlog user stories are source of truth for FR assignments
- openapi.yaml is source of truth for MCP tool count
- Project Plan is source of truth for timeline/sprint structure
```

---

## PHASE 2: CRITICAL FIXES - PARALLEL EXECUTION (60-90 min)

**These groups can run in parallel after Phase 1 completes**

### GROUP A: PRD Updates (60 min)

**File**: `docs/01-PRD.md`

**Changes**:

1. **Add EPIC-010 explicit section** (after Section 4.2.9):
   ```markdown
   #### 4.2.10 Memory Bank System (P0 - FR-146 to FR-153)

   **Epic ID**: EPIC-010
   **Priority**: Must Have (P0)
   **Functional Requirements**: FR-146 to FR-153

   **Description**: Token-efficient context management through structured memory bank files...

   **Success Metrics**:
   - Session start loads context in ≤10K tokens (vs 40K baseline) = 75% reduction
   - Pattern lookups complete in ≤1K tokens (vs 15K baseline) = 93% reduction
   - Context recovery after interruption ≤6K tokens (vs 40K baseline) = 85% reduction
   ```

2. **Add EPIC-011 explicit section**:
   ```markdown
   #### 4.2.11 Research Agent Orchestration (P1 - FR-154 to FR-158)

   **Epic ID**: EPIC-011
   **Priority**: Should Have (P1)
   **Functional Requirements**: FR-154 to FR-158

   **Description**: Isolated sub-agent threads for research tasks...

   **Success Metrics**:
   - Research queries complete in ≤2K main thread tokens (vs 25K baseline) = 92% reduction
   - Sub-agent reports persist across sessions (100% retention)
   - Parallel sub-agent execution (2+ agents simultaneously)
   ```

3. **Mark EPIC-012-014 as Post-MVP**:
   - Find Section 4.2.12-4.2.14
   - Update headers to add "(Post-MVP - Priority 2)"

4. **Add FR gap note** (in Section 4):
   ```markdown
   **Note on FR Numbering**: FR-126 to FR-145 are reserved for future features and are not assigned in MVP. MVP functional requirements are FR-001 to FR-125 and FR-146 to FR-158 (138 total FRs). Post-MVP requirements are FR-159 to FR-220.
   ```

5. **Update MCP tool count** (Section 1.2, line ~29):
   - Change: "41 tools across 8 features"
   - To: "41 tools across 9 features"

6. **Clarify FR ceiling** (Section 4.2, summary):
   - Update table to show MVP = FR-158, Total = FR-220

---

### GROUP B: Architecture Updates (60 min)

**File**: `docs/03-Architecture.md`

**Changes**:

1. **Fix C4 System Context diagram** (line 64):
   - Change: `System(mcp_server, "MCP Server", "59 tools across 13 features<br/>stdio transport")`
   - To: `System(mcp_server, "MCP Server", "41 tools across 9 features<br/>stdio transport")`

2. **Fix C4 Container diagram** (line 74):
   - Verify it says 41 tools (should already be correct)

3. **Update Related Documents table** (line ~27):
   - Change: `[02-SRS.md](02-SRS.md) - System Requirements (220 FRs)`
   - To: `[02-SRS.md](02-SRS.md) - System Requirements (158 MVP FRs, 220 total)`

4. **Add Sub-Agent Architecture section** (new section after Component Architecture):
   ```markdown
   ### 3.X Sub-Agent Architecture

   **Purpose**: Isolated agent threads for research tasks (EPIC-011)

   **Components**:
   - **explore-codebase**: Scans repo for patterns, returns summary (saves 20-30K tokens in main thread)
   - **analyze-architecture**: Traces system flows across files, returns architectural insights
   - **synthesize-docs**: Generates SOPs and updates .agent/ folder automatically
   - **map-system**: Updates system documentation (database-schema.md, api-catalog.md, component-patterns.md)

   **Invocation Pattern**:
   ```mermaid
   sequenceDiagram
       participant Main as Main Agent
       participant SubAgent as Sub-Agent (Isolated Thread)
       participant Context as Context File

       Main->>Context: Write current-session.md
       Main->>SubAgent: Invoke with context file path
       SubAgent->>Context: Read current-session.md
       SubAgent->>SubAgent: Execute research task
       SubAgent->>Context: Write report file
       SubAgent->>Main: Return report path
       Main->>Context: Read report file
       Main->>Main: Use findings for implementation
   ```

   **Token Efficiency**:
   - Main thread cost: ~2K tokens (invocation + report reading)
   - Sub-agent thread cost: 20-30K tokens (isolated, doesn't affect main)
   - Total savings: 92% reduction vs direct research in main thread
   ```

5. **Add Memory Bank Data Flows section**:
   ```markdown
   ### 3.Y Memory Bank Data Flows

   **Purpose**: Token-efficient context retrieval (EPIC-010)

   **Session Start Flow** (≤10K tokens):
   ```mermaid
   sequenceDiagram
       participant Agent
       participant ProjectBrief as project-brief.md (3K)
       participant ActiveContext as active-context.md (1K)
       participant Progress as progress.md (2K)

       Agent->>ProjectBrief: Read project overview
       Agent->>ActiveContext: Read current work focus
       Agent->>Progress: Read completion status
       Note over Agent: Total: ~6-8K tokens
   ```

   **Pattern Lookup Flow** (≤1K tokens):
   ```mermaid
   sequenceDiagram
       participant Agent
       participant SystemPatterns as system-patterns.md

       Agent->>SystemPatterns: Grep for pattern name
       SystemPatterns-->>Agent: Return pattern section (500-1K tokens)
       Note over Agent: 93% reduction vs loading full docs
   ```

   **Context Recovery Flow** (≤6K tokens):
   ```mermaid
   sequenceDiagram
       participant Agent
       participant SessionFile as current-session-[timestamp].md (2K)
       participant TodosFile as current-todos.md (2K)
       participant Progress as progress.md (2K)

       Agent->>SessionFile: Read latest session state
       Agent->>TodosFile: Read task list with progress
       Agent->>Progress: Read phase completion
       Note over Agent: Total: ~6K tokens, resume work immediately
   ```
   ```

---

### GROUP C: Backlog Updates (15 min)

**File**: `docs/12-Backlog.md`

**Changes**:

1. **Add EPIC-009 note** (Section 2, after EPIC-008):
   ```markdown
   ### EPIC-009: Reserved for Future Use

   **Status**: Intentional Gap
   **Rationale**: EPIC-009 is reserved for future features and is not currently assigned. Epic numbering continues with EPIC-010 to maintain backward compatibility with existing references.
   ```

2. **Fix summary table** (line 777):
   - Change: `| **Total** | **10 Epics** | **138** | **484** | - | **~12 sprints (24 weeks)** |`
   - To: `| **Total** | **10 Epics** | **138** | **484** | - | **9 sprints (18 weeks)** |`

3. **Update MVP Scope note** (line ~778):
   - Change: "**MVP Scope (Must + Should):** 118 stories, 422 points, ~11 sprints (22 weeks)"
   - To: "**MVP Scope (Must + Should):** 118 stories, 422 points, 9 sprints (18 weeks)"

---

## PHASE 3: CRITICAL FIXES - SRS (SEQUENTIAL) (90 min)

**File**: `docs/02-SRS.md`
**Dependencies**: Must wait for Phase 2 Groups A & C to complete

**Changes**:

1. **Update Related Documents header** (line ~19):
   - Change: `[12-Backlog.md](12-Backlog.md) - User Stories (125 stories mapped to these FRs)`
   - To: `[12-Backlog.md](12-Backlog.md) - User Stories (138 stories mapped to these FRs)`

2. **Fix FR-154 definition** (line 3774):
   - Change: `FR-154: Onboarding Rollback (undo session if generation fails)`
   - To: `FR-154: Implement explore-codebase Sub-Agent`

3. **MAJOR REWRITE Section 1.9** (lines 3465-3810):

   **OLD**:
   ```markdown
   ### 1.9 Project Onboarding System (FR-146 to FR-160)

   **Purpose:** Intelligent project analysis and automated .agent/ infrastructure generation

   [Contains FR-146 to FR-153 definitions, then brief descriptions for FR-154-160]
   ```

   **NEW**:
   ```markdown
   ### 1.9 Memory Bank System (FR-146 to FR-153)

   **Purpose:** Token-efficient context management through structured memory bank files (EPIC-010)

   **Related**: Backlog US-010-01 to US-010-08, PRD Section 4.2.10

   ---

   #### FR-146: Create project-brief.md Memory Bank
   [Keep existing definition, update related links]

   #### FR-147: Create system-patterns.md Memory Bank
   [Keep existing definition, update related links]

   #### FR-148: Create tech-context.md Memory Bank
   [Keep existing definition, update related links]

   #### FR-149: Create active-context.md Memory Bank
   [Add new definition based on Backlog US-010-04]

   #### FR-150: Create progress.md Memory Bank
   [Add new definition based on Backlog US-010-05]

   #### FR-151: Optimized Session Start Workflow
   [Add new definition based on Backlog US-010-06]

   #### FR-152: Fast Pattern Lookup
   [Add new definition based on Backlog US-010-07]

   #### FR-153: Context Recovery After Interruption
   [Add new definition based on Backlog US-010-08]

   ---

   ### 1.10 Research Agent Orchestration (FR-154 to FR-158)

   **Purpose:** Isolated sub-agent threads for research tasks to keep main conversation clean (EPIC-011)

   **Related**: Backlog US-011-01 to US-011-05, PRD Section 4.2.11

   ---

   #### FR-154: Implement explore-codebase Sub-Agent

   **Description**: System SHALL provide an isolated sub-agent thread that scans entire codebase for patterns, components, and architectural elements, returning a concise summary to the main agent thread.

   **Inputs**:
   - searchPattern: string (what to find, e.g., "all API routes", "all database models")
   - contextFilePath: string (path to current-session.md for context)

   **Outputs**:
   - reportFilePath: string (path to generated report file)
   - summary: string (key findings, ≤500 tokens)
   - tokensUsed: number (sub-agent thread token usage, isolated from main)

   **Success Criteria**:
   - Main thread token cost ≤2K tokens (invocation + report reading)
   - Sub-agent completes scan in isolated thread (20-30K tokens, doesn't affect main)
   - Report persists to file for future reference

   **Acceptance Test**: TEST-154
   **Related**: US-011-01 (explore-codebase sub-agent), EPIC-011

   ---

   #### FR-155: Implement analyze-architecture Sub-Agent
   [Similar structure to FR-154, based on Backlog US-011-02]

   #### FR-156: Automatic Sub-Agent Invocation
   [Based on Backlog US-011-03]

   #### FR-157: Research Report Persistence
   [Based on Backlog US-011-04]

   #### FR-158: Parallel Sub-Agent Execution
   [Based on Backlog US-011-05]
   ```

4. **Add FR gap note** (after Section 1.8, before 1.9):
   ```markdown
   **Note on FR Numbering**: FR-126 to FR-145 are reserved for future features and are not assigned in MVP. These 20 FRs may be allocated to future epics or features as the project evolves beyond MVP scope.
   ```

5. **Add Post-MVP note** (after Section 1.10):
   ```markdown
   ### 1.11 Additional Onboarding Features (FR-159 to FR-220) - Post-MVP

   **Status**: Deferred to Post-MVP (Priority 2)

   **Scope**: Advanced onboarding features including:
   - FR-159 to FR-160: Extended onboarding workflows (see Section 1.9 old notes)
   - FR-161 to FR-200: Ticket system and advanced workflow features
   - FR-201 to FR-220: Additional onboarding sessions (tech stack, requirements, architecture, backlog)

   **Related**: PRD Section 4.2.12-4.2.14 (EPIC-012 to EPIC-014)

   Full specifications for these requirements will be documented when post-MVP development begins.
   ```

---

## PHASE 4: CRITICAL FIXES - TESTING DOC (SEQUENTIAL) (45 min)

**File**: `docs/09-Testing-and-QA.md`
**Dependencies**: Must wait for Phase 3 (SRS) to complete

**Changes**:

1. **Add Test Case Index section** (new section after current content):
   ```markdown
   ## X. Test Case Index

   **Purpose**: Complete enumeration of all test cases with FR and user story mappings

   ### X.1 Memory Bank System Tests (TEST-146 to TEST-153)

   | Test ID  | Test Name                                    | FR     | User Story | Description                                                      |
   |----------|----------------------------------------------|--------|------------|------------------------------------------------------------------|
   | TEST-146 | Memory Bank - project-brief.md Creation     | FR-146 | US-010-01  | Verify project-brief.md created with ≤3K token load time        |
   | TEST-147 | Memory Bank - system-patterns.md Creation   | FR-147 | US-010-02  | Verify system-patterns.md created with ≤1K pattern lookups      |
   | TEST-148 | Memory Bank - tech-context.md Creation      | FR-148 | US-010-03  | Verify tech-context.md created with ≤2K token load time         |
   | TEST-149 | Memory Bank - active-context.md Creation    | FR-149 | US-010-04  | Verify active-context.md created with ≤1K token real-time load  |
   | TEST-150 | Memory Bank - progress.md Creation          | FR-150 | US-010-05  | Verify progress.md created with ≤2K token load time             |
   | TEST-151 | Session Start Workflow Token Budget         | FR-151 | US-010-06  | Verify session start completes in ≤10K tokens total             |
   | TEST-152 | Pattern Lookup Performance                  | FR-152 | US-010-07  | Verify pattern lookups complete in ≤1K tokens                   |
   | TEST-153 | Context Recovery Token Budget               | FR-153 | US-010-08  | Verify context recovery completes in ≤6K tokens                 |

   ### X.2 Research Agent Orchestration Tests (TEST-154 to TEST-158)

   | Test ID  | Test Name                                    | FR     | User Story | Description                                                      |
   |----------|----------------------------------------------|--------|------------|------------------------------------------------------------------|
   | TEST-154 | Sub-Agent - explore-codebase Invocation     | FR-154 | US-011-01  | Verify explore-codebase completes in ≤2K main thread tokens     |
   | TEST-155 | Sub-Agent - analyze-architecture Invocation | FR-155 | US-011-02  | Verify analyze-architecture completes in ≤2K main thread tokens |
   | TEST-156 | Sub-Agent - Automatic Invocation            | FR-156 | US-011-03  | Verify sub-agents invoked automatically without manual trigger   |
   | TEST-157 | Sub-Agent - Research Report Persistence     | FR-157 | US-011-04  | Verify research reports saved to files and persist across sessions |
   | TEST-158 | Sub-Agent - Parallel Execution              | FR-158 | US-011-05  | Verify multiple sub-agents can execute simultaneously           |
   ```

2. **Update test count references** (if any exist):
   - Find any "TEST-001 to TEST-125" references
   - Change to "TEST-001 to TEST-158"

---

## PHASE 5: FINAL FIXES - PROJECT PLAN (SEQUENTIAL) (30 min)

**File**: `docs/13-Project-Plan.md`
**Dependencies**: Must wait for all above phases to complete

**Changes**:

1. **Update Section 8.1 cross-reference table** (lines 1302-1316):

   **OLD**:
   ```markdown
   | **02-SRS.md** | 125 Functional Requirements (FR-001 to FR-125) | [02-SRS.md](02-SRS.md) |
   | **06-API/openapi.yaml** | OpenAPI 3.1 specification (42 MCP tools) | [06-API/openapi.yaml](06-API/openapi.yaml) |
   | **09-Testing-and-QA.md** | Test strategy (TEST-001 to TEST-125) | [09-Testing-and-QA.md](09-Testing-and-QA.md) |
   | **12-Backlog.md** | Product backlog (8 epics, 125 user stories) | [12-Backlog.md](12-Backlog.md) |
   ```

   **NEW**:
   ```markdown
   | **02-SRS.md** | 158 MVP Functional Requirements (FR-001 to FR-158), 220 total | [02-SRS.md](02-SRS.md) |
   | **06-API/openapi.yaml** | OpenAPI 3.1 specification (41 MCP tools across 9 features) | [06-API/openapi.yaml](06-API/openapi.yaml) |
   | **09-Testing-and-QA.md** | Test strategy (TEST-001 to TEST-158 for MVP) | [09-Testing-and-QA.md](09-Testing-and-QA.md) |
   | **12-Backlog.md** | Product backlog (10 epics, 138 user stories, 118 MVP) | [12-Backlog.md](12-Backlog.md) |
   ```

2. **Fix MVP story count references**:
   - Line 262: Find "105 MVP stories"
   - Line 906: Find "105 MVP stories"
   - Change all to: "118 MVP stories"

   Use grep to find all:
   ```bash
   grep -n "105 MVP\|105 stories" docs/13-Project-Plan.md
   ```

3. **Update Section 8.2 Traceability** (verify still accurate):
   ```markdown
   **Complete Traceability Chain:**

   ```
   PRD (Features) → SRS (FR-001 to FR-158 MVP, FR-159-220 Post-MVP) → Architecture (ADR-001 to ADR-005)
                                                                      → Backlog (US-001 to US-138, 10 epics)
                                                                      → Project Plan (Sprint 1-9)
                                                                      → Tests (TEST-001 to TEST-158)
   ```
   ```

---

## PHASE 6: OPENAPI.YAML MINOR FIX (5 min)

**File**: `docs/06-API/openapi.yaml`

**Change**:
- Line ~24: Change "42 MCP tools" → "41 MCP tools"
- This aligns the description with the actual operationId count

---

## PHASE 7: VERIFICATION & VALIDATION (45 min)

**Run comprehensive checks to ensure all fixes are correct**

### 1. Mathematical Verification
```bash
# Verify story points sum
# EPIC-001 (87) + EPIC-002 (95) + EPIC-003 (62) + EPIC-004 (78) +
# EPIC-005 (42) + EPIC-006 (31) + EPIC-007 (19) + EPIC-008 (12) +
# EPIC-010 (34) + EPIC-011 (24) = 484 ✓

# Verify MVP calculation
# Must: 87 + 95 + 62 + 34 = 278 ✓
# Should: 78 + 42 + 24 = 144 ✓
# MVP Total: 278 + 144 = 422 ✓

# Verify timeline
# 9 sprints × 2 weeks = 18 weeks ✓
```

### 2. Number Consistency Checks
```bash
# Should find 0 results for outdated numbers:
grep -r "125 stories" docs/01-PRD.md docs/02-SRS.md docs/13-Project-Plan.md
grep -r "105 MVP\|105 stories" docs/
grep -r "12 sprints\|24 weeks" docs/12-Backlog.md
grep -r "59 tools" docs/03-Architecture.md
grep -r "220 FRs" docs/ | grep -v "220 total"

# Should find updated numbers:
grep -r "138 stories" docs/
grep -r "118 MVP" docs/
grep -r "9 sprints\|18 weeks" docs/
grep -r "41 tools" docs/
```

### 3. Traceability Chain Verification
```bash
# EPIC-010 chain:
# PRD Section 4.2.10 ✓ → Backlog US-010-01 to 08 ✓ →
# SRS FR-146 to 153 ✓ → Testing TEST-146 to 153 ✓

# EPIC-011 chain:
# PRD Section 4.2.11 ✓ → Backlog US-011-01 to 05 ✓ →
# SRS FR-154 to 158 ✓ → Testing TEST-154 to 158 ✓

# FR-154 consistency:
grep -n "FR-154" docs/02-SRS.md docs/12-Backlog.md docs/09-Testing-and-QA.md
# All should say "explore-codebase sub-agent"
```

### 4. Completeness Checks
- ✓ All 10 critical issues addressed
- ✓ All 9 major issues addressed
- ✓ All 6 minor issues addressed
- ✓ All 5 key questions answered
- ✓ No new gaps introduced

---

## PHASE 8: DOCUMENTATION & COMMIT (30 min)

1. **Update progress file**:
   - `.agent/task/documentation-fixes-[timestamp].md` with completion summary

2. **Create comprehensive git commit**:
   ```bash
   git add docs/01-PRD.md docs/02-SRS.md docs/03-Architecture.md \
           docs/06-API/openapi.yaml docs/09-Testing-and-QA.md \
           docs/12-Backlog.md docs/13-Project-Plan.md \
           .agent/SOURCE_OF_TRUTH.md .agent/task/documentation-fixes-*.md

   git commit -m "docs: fix 25 documentation gaps and drift issues from Junie audit

Critical fixes (10):
- Establish MVP FR ceiling (FR-001 to FR-158, Post-MVP FR-159 to FR-220)
- Fix FR-154 conflict: Update SRS to match Backlog (explore-codebase sub-agent)
- Add EPIC-010/011 explicit sections to PRD with success metrics
- Add sub-agent architecture section to Architecture doc
- Add Memory Bank data flow diagrams to Architecture doc
- Rewrite SRS Section 1.9-1.10 with correct FR assignments (EPIC-010/011)
- Add TEST-146 to TEST-158 to Testing doc with FR/story mappings
- Update Project Plan cross-reference table (all counts corrected)
- Document EPIC-009 as intentional gap (reserved for future)
- Document FR-126 to FR-145 as reserved for future features

Major fixes (9):
- Fix Backlog summary row (12 sprints/24 weeks → 9 sprints/18 weeks)
- Fix Architecture MCP tool count (59/13 → 41/9, verified from openapi.yaml)
- Update PRD MCP tool count (41/8 → 41/9)
- Add PRD success metrics for EPIC-010 (token reduction targets)
- Add PRD success metrics for EPIC-011 (sub-agent efficiency targets)
- Mark EPIC-012 to EPIC-014 as Post-MVP (Priority 2)
- Update Architecture Related Documents table (clarify 158 MVP + 220 total)
- Update SRS Related Documents (125 → 138 stories)
- Add note about FR numbering gap and Post-MVP scope

Minor fixes (6):
- Fix openapi.yaml description (42 → 41 tools)
- Fix Project Plan MVP references (105 → 118 stories, lines 262, 906)
- Update traceability diagram to include FR-158 ceiling
- Standardize terminology (consistent use of MVP/Post-MVP)
- Add SOURCE_OF_TRUTH.md documenting all key decisions
- Create documentation-fixes progress tracking file

Audit status: FAIL → PASS
Issues resolved: 10 critical, 9 major, 6 minor (25 total)
Source of truth: openapi.yaml (41 tools), Backlog (FR assignments), Project Plan (timeline)

Refs: .agent/Junie_audit.md, .agent/SOURCE_OF_TRUTH.md"
   ```

3. **Optional: Generate updated audit report**:
   - Re-run audit specification checks
   - Verify PASS status
   - Document in `.agent/DOCUMENTATION_AUDIT_PASS.md`

---

## DEPENDENCY GRAPH

```
PHASE 0 (Prep)
    ↓
PHASE 1 (Decisions) ← MUST COMPLETE FIRST
    ↓
    ├─→ PHASE 2 GROUP A (PRD) ──────┐
    ├─→ PHASE 2 GROUP B (Architecture) ─┤ [Parallel]
    └─→ PHASE 2 GROUP C (Backlog) ──┘
        ↓
    PHASE 3 (SRS) ← Depends on Groups A & C
        ↓
    PHASE 4 (Testing Doc) ← Depends on Phase 3
        ↓
    PHASE 5 (Project Plan) ← Depends on all above
        ↓
    PHASE 6 (OpenAPI minor fix) [Independent, can do anytime]
        ↓
    PHASE 7 (Verification)
        ↓
    PHASE 8 (Commit)
```

---

## TIME ESTIMATES BY PHASE

| Phase | Description | Time | Can Parallelize? |
|-------|-------------|------|------------------|
| 0 | Preparation | 15 min | No |
| 1 | Decisions | 30 min | No |
| 2A | PRD Updates | 60 min | Yes (with 2B, 2C) |
| 2B | Architecture Updates | 60 min | Yes (with 2A, 2C) |
| 2C | Backlog Updates | 15 min | Yes (with 2A, 2C) |
| 3 | SRS Updates | 90 min | No (sequential) |
| 4 | Testing Doc Updates | 45 min | No (sequential) |
| 5 | Project Plan Updates | 30 min | No (sequential) |
| 6 | OpenAPI minor fix | 5 min | Yes (anytime) |
| 7 | Verification | 45 min | No (must be last) |
| 8 | Commit | 30 min | No (must be last) |

**Total Sequential Time**: 8 hours
**Total with Parallelization**: 6.5 hours

---

## RISK ASSESSMENT

### High Risk Fixes
- **SRS Section 1.9-1.10 rewrite**: Large section, complex FR reassignments
  - **Mitigation**: Use Backlog as source of truth, verify every FR definition
- **Sub-agent architecture section**: New technical content
  - **Mitigation**: Reference CLAUDE.md patterns, keep descriptions concise
- **Memory Bank data flows**: New diagrams with performance claims
  - **Mitigation**: Use exact token counts from user requirements

### Medium Risk Fixes
- **FR-154 definition change**: Critical traceability element
  - **Mitigation**: Verify propagation with grep across all docs
- **Project Plan cross-ref table**: Many numbers, prone to typos
  - **Mitigation**: Double-check each number against source docs

### Low Risk Fixes
- Number updates (125→138, 105→118, 41/8→41/9): Simple substitutions
- Backlog summary row: Single table cell
- OpenAPI description fix: One line change

---

## SUCCESS CRITERIA

✅ **Documentation Audit PASSES** (all 25 issues resolved)
✅ **Mathematical verification passes** (story points, MVP calculations)
✅ **Traceability chains complete** (EPIC → FR → US → TEST)
✅ **Number consistency** (no drift across documents)
✅ **All questions answered** (FR ceiling, epic disposition, MCP count, FR-154 conflict, dependencies)
✅ **No new gaps introduced** (verification checks pass)
✅ **Source of truth documented** (authoritative references established)

---

## QUICK START TOMORROW

When you resume work:

1. **Read this file first** to refresh context
2. **Start with Phase 0** (preparation)
3. **Follow phases sequentially** (respect dependencies)
4. **Checkpoint after each phase** (update progress file)
5. **Run verification** (Phase 7) before commit

**Key Files to Reference**:
- `.agent/Junie_audit.md` - Original audit report
- `.agent/DOCUMENTATION_AUDIT_SPEC.md` - Audit specification
- This file - Your complete fix plan

**Ready to begin!** 🚀
