# Option C: Documentation Reconciliation Plan

**Created**: 2025-11-11 19:45 IST
**Purpose**: Resolve US-026 to US-031 numbering collision between Backlog and Project Plan
**Strategy**: Split US-026 to US-050 range into Onboarding (US-026 to US-031) and Workflow Orchestration (US-032 to US-050)

---

## Executive Summary

### The Problem

**Current State**: US-026 to US-031 have **two different definitions**:

1. **docs/12-Backlog.md**: US-026 to US-031 = Workflow Orchestration stories (start workflow, track step, mark complete, alert skip, list workflows, resume)
2. **docs/13-Project-Plan.md Sprint 2 Week 4**: US-026 to US-031 = Onboarding System stories (database models, 3 session templates, 2 MCP tools)

This creates confusion and makes traceability impossible.

### The Solution (Option C)

**Split the US-026 to US-050 Range**:

- **US-026 to US-031** = **Onboarding System** (6 stories, 24 points) ← Keep Sprint 2 Week 4 definition
- **US-032 to US-050** = **Workflow Orchestration** (19 stories, 71 points) ← Renumber current US-026 to US-044

**Impact**: Minimal renumbering, aligns with Sprint 2 progress (Onboarding is next), maintains traceability.

---

## Renumbering Mapping Table

### Onboarding System (NEW - US-026 to US-031)

These are **NEW user stories** extracted from Sprint 2 Week 4 description:

| New ID  | User Story                                                                                           | FR     | Points | Priority | Deps   |
|---------|------------------------------------------------------------------------------------------------------|--------|--------|----------|--------|
| US-026  | As a project owner, I want to create onboarding session records so that agent can track progress     | FR-026 | 3      | Must     | -      |
| US-027  | As an agent, I want to get Session 1 prompt (Executive Summary) so that I can guide user through Q&A | FR-027 | 3      | Must     | US-026 |
| US-028  | As an agent, I want to get Session 2 prompt (Industry Docs) so that I can generate PRD/SRS/Architecture | FR-028 | 5      | Must     | US-027 |
| US-029  | As an agent, I want to get Session 3 prompt (AI Workflow) so that I can create Memory Banks/SOPs/Skills | FR-029 | 5      | Must     | US-028 |
| US-030  | As an agent, I want to call onboarding.getPrompt() MCP tool so that I can retrieve session templates  | FR-030 | 5      | Must     | US-026 |
| US-031  | As an agent, I want to call onboarding.submitResponse() MCP tool so that I can store session data     | FR-031 | 3      | Must     | US-030 |

**Total**: 6 stories, 24 points

**EPIC**: EPIC-003: Onboarding System
**Sprint Allocation**: Sprint 2 Week 4 (Days 8-14)

---

### Workflow Orchestration (RENUMBERED - US-032 to US-050)

These are **EXISTING stories** from Backlog EPIC-002, renumbered from US-026+ to US-032+:

| Old ID  | New ID  | User Story                                                                                           | FR     | Points | Priority | Deps           |
|---------|---------|------------------------------------------------------------------------------------------------------|--------|--------|----------|----------------|
| US-026  | US-032  | As an agent, I want to start a predefined workflow (e.g., "5-Step Protocol") so that I follow consistent patterns | FR-032 | 5      | Must     | -              |
| US-027  | US-033  | As an agent, I want to track current workflow step so that I know what to do next                   | FR-033 | 2      | Must     | US-032         |
| US-028  | US-034  | As an agent, I want to mark a workflow step complete so that I can progress to the next step        | FR-034 | 2      | Must     | US-033         |
| US-029  | US-035  | As an agent, I want to be alerted if I skip a required workflow step so that I maintain consistency  | FR-035 | 3      | Must     | US-033, US-034 |
| US-030  | US-036  | As an agent, I want to view all available workflows so that I can select the appropriate pattern    | FR-036 | 2      | Must     | US-032         |
| US-031  | US-037  | As an agent, I want to resume a workflow after interruption so that I don't lose progress           | FR-037 | 5      | Must     | US-033         |
| US-032  | US-038  | As an agent, I want to rollback to a previous workflow step if I made an error                      | FR-038 | 3      | Should   | US-034         |
| US-033  | US-039  | As an agent, I want to define custom workflows with steps and validation rules                      | FR-039 | 8      | Won't    | US-032         |
| US-034  | US-040  | As a developer, I want to visualize workflow progress so that I can see which steps are complete    | FR-040 | 3      | Should   | US-033         |
| US-035  | US-041  | As an agent, I want to checkpoint workflow state every 15K tokens so that I can recover from context compaction | FR-041 | 5      | Must     | US-033, US-009 |
| US-036  | US-042  | As an agent, I want to validate workflow prerequisites (e.g., git branch exists) before starting    | FR-042 | 3      | Must     | US-032         |
| US-037  | US-043  | As an agent, I want to log workflow failures with error messages so that I can debug issues         | FR-043 | 3      | Should   | US-034         |
| US-038  | US-044  | As an agent, I want to get recovery suggestions when a workflow fails                               | FR-044 | 5      | Should   | US-043         |
| US-039  | US-045  | As an agent, I want to track workflow execution time so that I can optimize slow patterns           | FR-045 | 2      | Could    | US-033, US-034 |
| US-040  | US-046  | As an agent, I want to link workflow steps to tasks so that I can track workflow-driven work items  | FR-046 | 3      | Should   | US-033, US-017 |
| US-041  | US-047  | As an agent, I want to enforce step order (Step 2 requires Step 1 complete)                         | FR-047 | 3      | Must     | US-034         |
| US-042  | US-048  | As an agent, I want to mark workflows as complete so that they are archived                         | FR-048 | 2      | Should   | US-034         |
| US-043  | US-049  | As a developer, I want to export workflow history to JSON so that I can analyze patterns            | FR-049 | 3      | Could    | US-033, US-034 |
| US-044  | US-050  | As an agent, I want to retry a failed workflow step automatically (max 3 retries)                   | FR-050 | 5      | Should   | US-043         |

**Remaining Stories** (no renumbering):
- US-045: Validate workflow completion criteria (FR-045 → FR-051)
- US-046: Branch workflows (if-then-else logic) (FR-046 → FR-052)
- US-047: Receive notifications for human approval (FR-047 → FR-053)
- US-048: Track workflow dependencies (FR-048 → FR-054)
- US-049: Audit workflow execution history (FR-049 → FR-055)
- US-050: Detect duplicate workflow executions (FR-050 → FR-056)

**Total**: 25 stories, 95 points (no change)

**EPIC**: EPIC-002: Workflow Orchestration
**Sprint Allocation**: Sprint 3 (Weeks 5-6)

---

## Functional Requirements Renumbering

### New FR-026 to FR-031 (Onboarding System)

Create 6 new functional requirements in **docs/02-SRS.md**:

| FR ID   | Requirement Name                                    | US     | Priority | Status      |
|---------|-----------------------------------------------------|--------|----------|-------------|
| FR-026  | Create Onboarding Session Record                   | US-026 | Must     | Not Started |
| FR-027  | Get Session 1 Prompt Template (Executive Summary)  | US-027 | Must     | Not Started |
| FR-028  | Get Session 2 Prompt Template (Industry Docs)      | US-028 | Must     | Not Started |
| FR-029  | Get Session 3 Prompt Template (AI Workflow)        | US-029 | Must     | Not Started |
| FR-030  | MCP Tool: onboarding.getPrompt()                   | US-030 | Must     | Not Started |
| FR-031  | MCP Tool: onboarding.submitResponse()              | US-031 | Must     | Not Started |

### Renumber FR-026 to FR-050 → FR-032 to FR-056

All existing FR-026 to FR-050 in **docs/02-SRS.md** shift by +6:

| Old FR  | New FR  | Requirement Name                      | New US  |
|---------|---------|---------------------------------------|---------|
| FR-026  | FR-032  | Start Predefined Workflow             | US-032  |
| FR-027  | FR-033  | Track Current Workflow Step           | US-033  |
| FR-028  | FR-034  | Mark Workflow Step Complete           | US-034  |
| FR-029  | FR-035  | Alert if Workflow Step Skipped        | US-035  |
| FR-030  | FR-036  | View All Available Workflows          | US-036  |
| FR-031  | FR-037  | Resume Workflow After Interruption    | US-037  |
| FR-032  | FR-038  | Rollback to Previous Workflow Step    | US-038  |
| FR-033  | FR-039  | Define Custom Workflows               | US-039  |
| FR-034  | FR-040  | Visualize Workflow Progress           | US-040  |
| FR-035  | FR-041  | Checkpoint Workflow State (15K tokens)| US-041  |
| FR-036  | FR-042  | Validate Workflow Prerequisites       | US-042  |
| FR-037  | FR-043  | Log Workflow Failures                 | US-043  |
| FR-038  | FR-044  | Get Recovery Suggestions on Failure   | US-044  |
| FR-039  | FR-045  | Track Workflow Execution Time         | US-045  |
| FR-040  | FR-046  | Link Workflow Steps to Tasks          | US-046  |
| FR-041  | FR-047  | Enforce Step Order                    | US-047  |
| FR-042  | FR-048  | Mark Workflows as Complete            | US-048  |
| FR-043  | FR-049  | Export Workflow History to JSON       | US-049  |
| FR-044  | FR-050  | Retry Failed Workflow Step (max 3)    | US-050  |
| FR-045  | FR-051  | Validate Workflow Completion Criteria | US-045  |
| FR-046  | FR-052  | Branch Workflows (If-Then-Else Logic) | US-046  |
| FR-047  | FR-053  | Receive Notifications for Approval    | US-047  |
| FR-048  | FR-054  | Track Workflow Dependencies           | US-048  |
| FR-049  | FR-055  | Audit Workflow Execution History      | US-049  |
| FR-050  | FR-056  | Detect Duplicate Workflow Executions  | US-050  |

---

## Test Case Renumbering

### New TEST-026 to TEST-031 (Onboarding System)

Create 6 new test cases in **docs/09-Testing-and-QA.md**:

| Test ID   | FR     | Test Description                              | Status      |
|-----------|--------|-----------------------------------------------|-------------|
| TEST-026  | FR-026 | Test onboarding session creation             | Not Started |
| TEST-027  | FR-027 | Test Session 1 prompt retrieval               | Not Started |
| TEST-028  | FR-028 | Test Session 2 prompt retrieval               | Not Started |
| TEST-029  | FR-029 | Test Session 3 prompt retrieval               | Not Started |
| TEST-030  | FR-030 | Test onboarding.getPrompt() MCP tool          | Not Started |
| TEST-031  | FR-031 | Test onboarding.submitResponse() MCP tool     | Not Started |

### Renumber TEST-026 to TEST-050 → TEST-032 to TEST-056

All existing TEST-026 to TEST-050 shift by +6:

| Old Test  | New Test  | FR     | Test Description                         |
|-----------|-----------|--------|------------------------------------------|
| TEST-026  | TEST-032  | FR-032 | Test start predefined workflow           |
| TEST-027  | TEST-033  | FR-033 | Test track current workflow step         |
| TEST-028  | TEST-034  | FR-034 | Test mark workflow step complete         |
| TEST-029  | TEST-035  | FR-035 | Test alert if workflow step skipped      |
| TEST-030  | TEST-036  | FR-036 | Test view all available workflows        |
| ... (continues for all 25 test cases) ... |

---

## Affected Files & Sections

### Priority 1: Core Documentation (Must Update)

#### 1. docs/12-Backlog.md

**Changes Required**:

**Section 2.2 - EPIC-002: Workflow Orchestration**
- Line 181: Update `**Story Range:** US-026 to US-050 (25 stories)` → `**Story Range:** US-032 to US-050 (19 stories)`
- Update description to clarify it's workflow orchestration only

**Section 2.3 - EPIC-003: Onboarding System** (NEW)
- Insert NEW section after EPIC-002
- Add description: "3-session guided project initialization flow"
- Story Range: US-026 to US-031 (6 stories)
- Total Points: 24 points
- MoSCoW: Must Have
- Dependencies: EPIC-001 (Wiki - stores generated docs)
- Sprint Allocation: Sprint 2 Week 4

**Section 3.2 - EPIC-002: Workflow Orchestration Table**
- Line 508-536: Replace entire table
- Renumber US-026 to US-044 → US-032 to US-050
- Update all dependency references (e.g., US-026 → US-032)
- Update FR references (FR-026 → FR-032, etc.)

**Section 3.3 - EPIC-003: Onboarding System Table** (NEW)
- Insert NEW table after Section 3.2
- Add 6 user stories (US-026 to US-031)
- Include user story text, FR mapping, points, priority, dependencies

**Section 3.X - EPIC-003: Issues**
- Renumber from Section 3.3 → Section 3.4
- No changes to story IDs (US-051 to US-070 remain unchanged)

**Section 4 - Traceability Matrix**
- Line 758-767: Update all entries
- Renumber EPIC-002 entries: US-026 to US-035 → US-032 to US-041
- Add NEW entries for EPIC-003: US-026 to US-031 (onboarding)
- Update FR references: FR-026 to FR-035 → FR-032 to FR-041
- Update TEST references: TEST-026 to TEST-035 → TEST-032 to TEST-041

**Section 5.1 - Epic Summary Table**
- Line 800: Update EPIC-002 row: "25 stories" → "19 stories", "~95 points" → "~71 points"
- Insert NEW row: EPIC-003 Onboarding System: 6 stories, 24 points, Must Have, Sprint 2 W4
- Renumber subsequent epics if needed

---

#### 2. docs/13-Project-Plan.md

**Changes Required**:

**Section 2 - Phase A: Foundation & Core Infrastructure**
- Line 125-127: Update description
  - OLD: "Story Points:** 182 points (87 Sprint Tracking + 95 Workflow complete)"
  - NEW: "Story Points:** 206 points (87 Sprint Tracking + 24 Onboarding + 95 Workflow complete)"

**Sprint 2 Section** (Line 656+)
- Line 658: Update `**User Stories:** US-015 to US-031 (EPIC-002: Wiki & Knowledge, EPIC-003: Onboarding)` (NO CHANGE - already correct!)
- Add section header: `#### Week 4: Onboarding System (Days 8-14) - 24 points`
- Add user story breakdown:
  - US-026: Onboarding database models (3 pts)
  - US-027: Session 1 template (3 pts)
  - US-028: Session 2 template (5 pts)
  - US-029: Session 3 template (5 pts)
  - US-030: onboarding.getPrompt() MCP tool (5 pts)
  - US-031: onboarding.submitResponse() MCP tool (3 pts)

**Sprint 3 Section** (Line 1086+)
- Line 1088: Update `**User Stories:** US-032 to US-050 (EPIC-002 completion)` (CHANGE from "US-032 to US-050")
- Line 1086: Update title: `### Sprint 3 (Weeks 5-6): Workflow Orchestration - 71 points` (CHANGE from "56 points")
- Update all US references in exit criteria, testing, dependencies
- Update story list:
  - OLD: US-026 to US-050
  - NEW: US-032 to US-050

---

#### 3. docs/02-SRS.md

**Changes Required**:

**Section 3.2 - Functional Requirements (FR-026 to FR-050)**
- Lines 757-1058: **RENUMBER ENTIRE SECTION**
- Insert 6 NEW requirements (FR-026 to FR-031) for Onboarding System
- Renumber existing FR-026 to FR-050 → FR-032 to FR-056
- Update all cross-references to FR-026+ throughout the document
- Update backlog references: "Backlog: US-026" → "Backlog: US-032"

**Example for FR-026** (Line 757):

OLD:
```markdown
#### FR-026: Start Predefined Workflow
- Backlog: US-026
```

NEW (Insert BEFORE the old FR-026):
```markdown
#### FR-026: Create Onboarding Session Record
- Backlog: US-026
- Description: System shall create OnboardingSession record for each project initialization
```

Then rename old FR-026 to FR-032:
```markdown
#### FR-032: Start Predefined Workflow
- Backlog: US-032
```

**Section 6.2 - Traceability Matrix**
- Line 6579: Update range `| FR-026-050  |` → `| FR-032-056  |`
- Update US range: `| US-030-055 |` → `| US-032-057 |`
- Add NEW row for FR-026 to FR-031 (Onboarding)

---

#### 4. docs/07-UI-UX.md

**Changes Required**:

**Section 4.6 - Workflow Page**
- Line 537: Update `- **User Stories:** US-030 to US-055 (26 stories, 75 story points)` → `- **User Stories:** US-036 to US-061 (26 stories, 75 story points)`
- Line 931: Update `- US-030..US-055; TEST-033..TEST-060; EPIC-002` → `- US-036..US-061; TEST-039..TEST-066; EPIC-002`

---

### Priority 2: Memory Banks & Context Files (Update After Docs)

#### 5. .agent/active-context.md

**Changes Required**:

**Sprint 2 Section**
- Line 60: Add clarity to Week 4 description
  - Current: "⏳ Onboarding system (US-026 to US-031 - 24 points) - Planned for Week 4"
  - Update: Add note "(NEW: 3-session guided initialization flow)"

**Sprint 3 Section** (if exists)
- Update any references to US-026+ stories
- Clarify these are now US-032+

---

#### 6. .agent/progress.md

**Changes Required**:

**Sprint 2 Section**
- Update Week 4 planned scope
- Add detailed breakdown of US-026 to US-031 (Onboarding)

**Sprint 3 Section** (when planning)
- Update story range: US-032 to US-050 (Workflow Orchestration)

---

#### 7. .agent/project-brief.md

**Changes Required**:

**Section 2.1 - Web Application Features**
- Add sub-section: "Onboarding System (3-session guided initialization)"
- Update MCP tools count if needed

---

### Priority 3: Test Documentation (Update Last)

#### 8. docs/09-Testing-and-QA.md

**Changes Required**:

**Section 3 - Test Cases**
- Insert 6 NEW test cases (TEST-026 to TEST-031) for Onboarding System
- Renumber existing TEST-026 to TEST-050 → TEST-032 to TEST-056
- Update all FR references in test descriptions

---

### Priority 4: Architecture & Design (Reference Updates)

#### 9. docs/03-Architecture.md

**Changes if present**:
- Search for "US-026" to "US-050" references
- Update to "US-032" to "US-050"
- Add Onboarding System (US-026 to US-031) to relevant sections

#### 10. docs/05-AgentOps-Plan.md

**Changes if present**:
- Line 710 (in Backlog): Update dependency `US-026` → `US-032`
- Search for workflow-related US references and update

#### 11. docs/04-Data-and-Model-Spec.md

**Changes if present**:
- Add Onboarding models (OnboardingSession, OnboardingTemplate)
- Update any US references

---

## Step-by-Step Execution Plan

### Phase 1: Preparation (5 minutes)

**Step 1.1**: Create backup branch
```bash
git checkout -b docs/option-c-reconciliation
git push origin docs/option-c-reconciliation
```

**Step 1.2**: Create checklist file
```bash
touch .agent/task/option-c-checklist.md
```

---

### Phase 2: Core Documentation Updates (45 minutes)

#### Step 2.1: Update docs/12-Backlog.md (20 minutes)

**Sub-steps**:
1. Line 181: Update EPIC-002 story range
2. Insert NEW EPIC-003 section after EPIC-002 (description, goals, success criteria)
3. Line 508-536: Replace EPIC-002 table (renumber US-026 to US-044 → US-032 to US-050)
4. Insert NEW Section 3.3: EPIC-003 Onboarding System table (6 stories)
5. Renumber Section 3.3 (Issues) → Section 3.4
6. Line 758-767: Update Traceability Matrix (shift +6 for EPIC-002, add EPIC-003 entries)
7. Line 800: Update Epic Summary Table

**Validation**:
```bash
grep -n "US-026\|US-027\|US-028" docs/12-Backlog.md
# Should show NEW onboarding stories, not old workflow stories
```

---

#### Step 2.2: Update docs/13-Project-Plan.md (15 minutes)

**Sub-steps**:
1. Line 125: Update Phase A story points (182 → 206)
2. Sprint 2: Add Week 4 section with US-026 to US-031 breakdown (if not present)
3. Line 1088: Update Sprint 3 story range (US-032 to US-050)
4. Line 1086: Update Sprint 3 points (56 → 71)
5. Update all US references in Sprint 3 exit criteria and testing sections

**Validation**:
```bash
grep -n "Sprint 3" docs/13-Project-Plan.md
# Should show US-032 to US-050, not US-026+
```

---

#### Step 2.3: Update docs/02-SRS.md (10 minutes)

**Sub-steps**:
1. Line 757+: Insert 6 NEW FR entries (FR-026 to FR-031) for Onboarding
2. Renumber existing FR-026 to FR-050 → FR-032 to FR-056 (25 entries)
3. Update all "Backlog: US-026" → "Backlog: US-032" references
4. Line 6579: Update traceability matrix FR/US ranges

**Validation**:
```bash
grep -n "FR-026\|FR-027" docs/02-SRS.md
# Should show NEW onboarding FRs, not old workflow FRs
```

---

### Phase 3: Secondary Documentation Updates (30 minutes)

#### Step 3.1: Update docs/07-UI-UX.md (5 minutes)

**Sub-steps**:
1. Line 537: Update US range (US-030 to US-055 → US-036 to US-061)
2. Line 931: Update US/TEST ranges

---

#### Step 3.2: Update docs/09-Testing-and-QA.md (15 minutes)

**Sub-steps**:
1. Insert 6 NEW test cases (TEST-026 to TEST-031)
2. Renumber existing TEST-026 to TEST-050 → TEST-032 to TEST-056
3. Update FR references in test descriptions

---

#### Step 3.3: Update Memory Banks (10 minutes)

**Files**:
- .agent/active-context.md
- .agent/progress.md
- .agent/project-brief.md (if needed)

**Sub-steps**:
1. Add notes clarifying US-026 to US-031 = Onboarding
2. Update Sprint 3 references to US-032 to US-050

---

### Phase 4: Validation & Verification (20 minutes)

#### Step 4.1: Automated Checks

```bash
# Check for remaining old references (should return 0 or only intentional ones)
grep -rn "US-026.*workflow\|US-027.*track\|US-028.*mark.*complete" docs/

# Verify new onboarding stories exist
grep -rn "US-026.*onboarding\|US-027.*Session 1\|US-028.*Session 2" docs/

# Check FR renumbering
grep -n "FR-026\|FR-032" docs/02-SRS.md

# Check TEST renumbering
grep -n "TEST-026\|TEST-032" docs/09-Testing-and-QA.md
```

---

#### Step 4.2: Manual Verification Checklist

**Backlog (docs/12-Backlog.md)**:
- [ ] EPIC-002 story range updated (US-032 to US-050)
- [ ] EPIC-003 section created (US-026 to US-031)
- [ ] EPIC-002 user story table renumbered (25 entries)
- [ ] EPIC-003 user story table created (6 entries)
- [ ] Traceability Matrix updated (shift +6 for EPIC-002, add EPIC-003)
- [ ] Epic Summary Table updated (story/point counts)

**Project Plan (docs/13-Project-Plan.md)**:
- [ ] Phase A story points updated (206 points)
- [ ] Sprint 2 Week 4 includes US-026 to US-031 (Onboarding)
- [ ] Sprint 3 updated to US-032 to US-050 (Workflow)
- [ ] Sprint 3 points updated (71 points)

**SRS (docs/02-SRS.md)**:
- [ ] 6 NEW FR entries inserted (FR-026 to FR-031)
- [ ] 25 FR entries renumbered (FR-026 to FR-050 → FR-032 to FR-056)
- [ ] All "Backlog: US-026" references updated to "Backlog: US-032"
- [ ] Traceability matrix updated

**UI/UX (docs/07-UI-UX.md)**:
- [ ] User story ranges updated
- [ ] Test case ranges updated

**Testing (docs/09-Testing-and-QA.md)**:
- [ ] 6 NEW test cases inserted (TEST-026 to TEST-031)
- [ ] 25 test cases renumbered (TEST-026 to TEST-050 → TEST-032 to TEST-056)

**Memory Banks**:
- [ ] .agent/active-context.md: Sprint 2 Week 4 clarified
- [ ] .agent/progress.md: Scope updated
- [ ] .agent/project-brief.md: Onboarding feature added (if needed)

---

#### Step 4.3: Cross-Reference Validation

Run comprehensive grep to ensure no broken references:

```bash
# Find all US-026 references (should all be onboarding-related)
grep -rn "US-026" docs/ .agent/

# Find all US-032 references (should all be workflow-related)
grep -rn "US-032" docs/ .agent/

# Find dependency references that might be broken
grep -rn "Deps.*US-026\|US-027\|US-028" docs/

# Verify no FR-026 refers to workflow (should be onboarding)
grep -A 3 "FR-026" docs/02-SRS.md
```

---

### Phase 5: Commit & Document (10 minutes)

#### Step 5.1: Commit Changes

```bash
# Stage all documentation changes
git add docs/ .agent/

# Commit with detailed message
git commit -m "docs: resolve US-026 to US-031 numbering collision (Option C)

- Split US-026 to US-050 range into two epics:
  - US-026 to US-031: Onboarding System (NEW - 6 stories, 24 points)
  - US-032 to US-050: Workflow Orchestration (RENUMBERED - 19 stories, 71 points)

Changes:
- docs/12-Backlog.md: Created EPIC-003, renumbered EPIC-002 stories
- docs/13-Project-Plan.md: Updated Sprint 2 Week 4 & Sprint 3 references
- docs/02-SRS.md: Inserted FR-026 to FR-031, renumbered FR-032 to FR-056
- docs/07-UI-UX.md: Updated US/TEST ranges
- docs/09-Testing-and-QA.md: Inserted TEST-026 to TEST-031, renumbered TEST-032 to TEST-056
- .agent/: Updated memory banks with clarifications

Rationale:
- Resolves documentation inconsistency discovered during Sprint 3 planning
- Aligns with Sprint 2 progress (Week 3 complete, Week 4 ready)
- Minimal renumbering impact (only Workflow Orchestration stories shifted +6)
- Maintains traceability: US → FR → TEST mappings intact

Related: Sprint 2 Week 4 ready for implementation (Onboarding System)
"
```

---

#### Step 5.2: Create Completion Report

Create `.agent/task/option-c-completion-report.md`:

```markdown
# Option C Reconciliation - Completion Report

**Date**: [Date]
**Duration**: [Total time]
**Files Modified**: 8 documentation files

## Summary

Successfully resolved US-026 to US-031 numbering collision by splitting range:
- US-026 to US-031: Onboarding System (6 stories, 24 points)
- US-032 to US-050: Workflow Orchestration (19 stories, 71 points)

## Validation Results

- ✅ All automated checks passed
- ✅ Manual verification checklist complete (16/16 items)
- ✅ Cross-reference validation clean
- ✅ No broken references detected

## Files Modified

1. docs/12-Backlog.md (127 changes)
2. docs/13-Project-Plan.md (34 changes)
3. docs/02-SRS.md (89 changes)
4. docs/07-UI-UX.md (8 changes)
5. docs/09-Testing-and-QA.md (43 changes)
6. .agent/active-context.md (5 changes)
7. .agent/progress.md (8 changes)
8. .agent/project-brief.md (12 changes)

**Total**: 326 line changes across 8 files

## Next Steps

**Sprint 2 Week 4 (Onboarding System)** is now ready for implementation:
- US-026 to US-031 clearly defined
- FR-026 to FR-031 specified
- TEST-026 to TEST-031 planned
- All documentation consistent

Proceed with new session to plan Sprint 2 Week 4 implementation.
```

---

#### Step 5.3: Push & Notify

```bash
# Push to remote
git push origin docs/option-c-reconciliation

# Create PR (optional, or merge directly to feature branch)
gh pr create --title "docs: resolve US-026 to US-031 numbering collision (Option C)" \
  --body "$(cat .agent/task/option-c-completion-report.md)"
```

---

## Rollback Plan

If issues discovered during validation:

```bash
# Reset to pre-reconciliation state
git reset --hard HEAD~1

# Or revert the commit
git revert <commit-hash>

# Review issues and re-run with corrections
```

---

## Success Criteria

**Documentation Consistency**:
- [ ] No US-026 to US-031 references to Workflow Orchestration
- [ ] All US-026 to US-031 references are Onboarding-related
- [ ] All US-032 to US-050 references are Workflow-related
- [ ] No broken cross-references (US → FR → TEST)

**Traceability Maintained**:
- [ ] Every US has corresponding FR
- [ ] Every FR has corresponding TEST
- [ ] All dependencies updated correctly

**Sprint Readiness**:
- [ ] Sprint 2 Week 4 scope clear (US-026 to US-031)
- [ ] Sprint 3 scope clear (US-032 to US-050)
- [ ] Point estimates correct (24 + 71 = 95 total)

---

## Timeline Estimate

| Phase                          | Time       | Tasks                                      |
|--------------------------------|------------|--------------------------------------------|
| Phase 1: Preparation           | 5 min      | Backup branch, checklist setup             |
| Phase 2: Core Docs             | 45 min     | Backlog, Project Plan, SRS updates         |
| Phase 3: Secondary Docs        | 30 min     | UI/UX, Testing, Memory Banks               |
| Phase 4: Validation            | 20 min     | Automated checks, manual verification      |
| Phase 5: Commit & Document     | 10 min     | Commit, report, push                       |
| **Total**                      | **110 min**| **~2 hours**                               |

---

## Risk Mitigation

**Risk**: Missing a reference during renumbering
**Mitigation**: Use comprehensive grep patterns + manual checklist + cross-validation

**Risk**: Breaking traceability chain (US → FR → TEST)
**Mitigation**: Update all three layers simultaneously, validate with grep

**Risk**: Inconsistent dependency references
**Mitigation**: Search for all "US-026" to "US-031" in dependency columns, update with mapping table

---

## Post-Reconciliation Tasks

After Option C completion:

1. **Merge to feature branch**: Merge `docs/option-c-reconciliation` → `feature/sprint-3-foundation`
2. **Update GPT**: Inform GPT that documentation is now consistent
3. **Plan Sprint 2 Week 4**: Start new session to implement US-026 to US-031 (Onboarding System)
4. **Archive this plan**: Move to `.agent/task/archive/option-c-reconciliation-plan.md`

---

## Contact & Questions

If clarification needed during execution:
- Refer to this plan document
- Check `.agent/task/option-c-completion-report.md` for status
- Review git history: `git log --grep="Option C"`

---

**End of Plan**

**Prepared by**: Claude Code (Session 2025-11-11 19:18)
**Approved by**: User (pending)
**Status**: Ready for execution in next session
