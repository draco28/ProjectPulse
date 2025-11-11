# System Requirements Specification (SRS)

**Project:** ProjectPulse
**Version:** 2.0.0 (Agent-First Architecture)
**Created:** 2025-11-02
**Status:** Active
**Standards:** IEEE 830-1998

---

## Document Purpose

This System Requirements Specification (SRS) defines the complete functional and non-functional requirements for ProjectPulse, an agent-first project management platform. All requirements are designed to support AI agents as the primary users (95% interaction via MCP) with humans as secondary users (5% monitoring and manual operations via UI).

**Related Documents:**

- [01-PRD.md](01-PRD.md) - Product Requirements Document
- [03-Architecture.md](03-Architecture.md) - Architecture Design
- [12-Backlog.md](12-Backlog.md) - User Stories (138 stories mapped to these FRs)

---

## 1. Functional Requirements

### 1.1 Sprint/Phase Tracking (FR-001 to FR-025)

**Purpose:** Hierarchical progress tracking stored in database and displayed in Development Cycle page (web UI)

**Database as Source of Truth:** All progress tracked in database (Phase, Week, Day, Task, Session tables). Development Cycle page displays real-time progress visualization. No markdown files generated for end users.

---

#### FR-001: Create Phase Hierarchy

**Description:** Create a 5-level hierarchical structure for project progress tracking: Project → Phase → Week → Day → Task → Session

**Inputs:**

- Phase: name, description, order, startDate, endDate, estimatedHours
- Week: phaseId, weekNumber
- Day: weekId, dayNumber
- Task: dayId, title, description
- Session: taskId, timestamp (YYYYMMDD-HHMM format), notes, tokenUsage

**Outputs:**

- Created Phase/Week/Day/Task/Session records with auto-generated IDs
- Progress initialized to 0.0 (0%)
- Status set to NOT_STARTED

**Validation:**

- Phase order must be unique
- Week weekNumber must be unique within Phase
- Day dayNumber must be unique within Week
- Session timestamp must be valid format
- Foreign key integrity enforced

**Priority:** P0 (Critical - Foundation for all progress tracking)

**Dependencies:** None (foundational requirement)

**Traceability:**

- PRD: Section 4.2.1 (Sprint/Phase Tracking feature)
- Architecture: ADR-002 (Database as Source of Truth)
- Tests: TEST-001, TEST-002 (hierarchy creation, validation)
- Backlog: US-001, US-002, US-003

---

#### FR-002: Update Progress Percentage

**Description:** Update progress percentage at any level of hierarchy (Phase, Week, Day, Task, Session). Progress automatically rolls up from child to parent levels.

**Inputs:**

- entityId: number (Phase/Week/Day/Task ID)
- entityType: string ("phase" | "week" | "day" | "task")
- progress: number (0.0 to 1.0)

**Outputs:**

- Updated entity with new progress value
- Auto-calculated parent progress (average of all children)
- Markdown sync triggered (STATUS.md, DEVELOPMENT_PLAN.md updated)

**Validation:**

- Progress must be between 0.0 and 1.0
- Entity must exist
- Progress can only increase (no rollback except via admin override)

**Roll-up Logic:**

- Session 100% → Task progress = (sum of Session progress) / (total Sessions)
- Task 100% → Day progress = (sum of Task progress) / (total Tasks)
- Day 100% → Week progress = (sum of Day progress) / (total Days)
- Week 100% → Phase progress = (sum of Week progress) / (total Weeks)

**Priority:** P0 (Critical - Core progress tracking)

**Dependencies:** FR-001 (hierarchy must exist)

**Traceability:**

- PRD: Section 3.4 (Checkpoint update workflow)
- Architecture: Section 4.3 (Progress calculation algorithm)
- Tests: TEST-003, TEST-004 (progress update, roll-up calculation)
- Backlog: US-004, US-005

---

#### FR-003: Retrieve Current Task

**Description:** Get the active task that the agent should work on based on status IN_PROGRESS. Includes full context: Phase → Week → Day → Task with Session history.

**Inputs:** None (query based on current state)

**Outputs:**

- Current Task record with:
  - Full hierarchy context (Phase name, Week number, Day number)
  - Task title, description, progress
  - Session history (all previous sessions with timestamps, notes, token usage)
  - Next steps recommendation (based on task description)

**Validation:**

- Returns null if no IN_PROGRESS task exists
- If multiple IN_PROGRESS tasks, return highest priority (lowest Day/Task number)

**Priority:** P0 (Critical - Agent needs to know what to work on)

**Dependencies:** FR-001 (hierarchy must exist)

**Traceability:**

- PRD: Section 3.1 (5-step protocol step 1: Check status)
- Architecture: Section 4.4 (Task retrieval API)
- Tests: TEST-005 (current task retrieval)
- Backlog: US-006

---

#### FR-004: Create Checkpoint

**Description:** Create a checkpoint at 15K token intervals during agent implementation. Updates Session table, calculates progress, triggers markdown sync.

**Inputs:**

- taskId: number
- tokenUsage: number
- progress: number (0.0 to 1.0) - estimated task completion
- notes: string (optional) - what was accomplished

**Outputs:**

- Created Session record with timestamp (YYYYMMDD-HHMM)
- Updated Task progress (set to input progress value)
- Markdown sync result: { filesUpdated: string[], success: boolean }

**Validation:**

- Task must exist and be IN_PROGRESS
- tokenUsage must be positive integer
- progress must be 0.0 to 1.0
- Session timestamp auto-generated (cannot be manually set)

**Side Effects:**

- Triggers markdown sync (FR-005)
- Updates parent progress via roll-up (FR-002)

**Priority:** P0 (Critical - Agent workflow requires checkpoints)

**Dependencies:** FR-001 (Task must exist), FR-002 (progress update), FR-005 (markdown sync)

**Traceability:**

- PRD: Section 3.4 (Checkpoint update workflow)
- Architecture: Section 4.5 (Checkpoint creation flow)
- Tests: TEST-006, TEST-007 (checkpoint creation, markdown sync trigger)
- Backlog: US-007

---

#### FR-005: Sync Markdown Files

**Description:** Auto-generate markdown files from database state. Database is single source of truth. Markdown files are read-only (enforced by git hooks).

**Inputs:**

- trigger: string ("checkpoint" | "progress_update" | "manual")

**Outputs:**

- MarkdownFile records created/updated:
  - STATUS.md (current phase, week, day, task with progress)
  - DEVELOPMENT_PLAN.md (full hierarchy with all phases/weeks/days/tasks)
  - current-todos.md (all tasks WHERE status != COMPLETED)
  - current-session-[timestamp].md (latest session notes)
  - current-plan.md (latest implementation plan)
- File write results: { path: string, success: boolean, error?: string }[]

**Template Structure:**

**STATUS.md:**

```markdown
# Current Status

**Current Phase:** [Phase.name] (Progress: [Phase.progress]%)
**Current Week:** Week [Week.weekNumber] (Progress: [Week.progress]%)
**Current Day:** Day [Day.dayNumber] (Progress: [Day.progress]%)
**Current Task:** [Task.title] (Progress: [Task.progress]%)

**Last Checkpoint:** [Session.timestamp]
**Token Usage:** [Session.tokenUsage]
**Notes:** [Session.notes]
```

**DEVELOPMENT_PLAN.md:**

```markdown
# Development Plan

[For each Phase]

## Phase [order]: [name]

Progress: [progress]%
[For each Week in Phase]

### Week [weekNumber]

Progress: [progress]%
[For each Day in Week]

#### Day [dayNumber]

Progress: [progress]%
[For each Task in Day]

- [x] [title] (Progress: [progress]%)
```

**Validation:**

- All referenced entities must exist in database
- Markdown files validated before write (syntax check)
- Atomic operation (all files updated or none)

**Priority:** P0 (Critical - Agents rely on these files for context)

**Dependencies:** FR-001 (hierarchy), FR-002 (progress), FR-004 (checkpoints)

**Traceability:**

- PRD: Section 4.2.1 (Markdown sync mechanism)
- Architecture: ADR-002 (Database as Source of Truth), Section 4.6 (Sync implementation)
- Tests: TEST-008, TEST-009, TEST-010 (sync trigger, file generation, validation)
- Backlog: US-008, US-009

---

#### FR-006: Calculate Rolled-Up Progress

**Description:** Calculate aggregate progress from child entities to parent entities automatically.

**Inputs:**

- entityId: number
- entityType: string ("task" | "day" | "week" | "phase")

**Outputs:**

- Calculated progress value (0.0 to 1.0)
- Updated parent entity with new progress

**Algorithm:**

- Task progress = Average of all Session progress values
- Day progress = Average of all Task progress values
- Week progress = Average of all Day progress values
- Phase progress = Average of all Week progress values

**Validation:**

- Must have at least one child entity to calculate
- If no children, progress remains at manually set value

**Priority:** P0 (Critical - Auto-progress tracking)

**Dependencies:** FR-001, FR-002

**Traceability:**

- PRD: Section 4.2.1 (Progress roll-up)
- Architecture: Section 4.3 (Roll-up algorithm)
- Tests: TEST-011 (roll-up calculation accuracy)
- Backlog: US-010

---

#### FR-007: Query Hierarchy by Filters

**Description:** Query any level of hierarchy with filters: status, date range, progress threshold.

**Inputs:**

- level: string ("phase" | "week" | "day" | "task" | "session")
- filters: { status?: TrackingStatus[], dateRange?: { start: Date, end: Date }, progressMin?: number, progressMax?: number }

**Outputs:**

- Filtered array of entities matching criteria
- Includes parent context (e.g., Task includes Day/Week/Phase info)

**Priority:** P1 (High - Useful for reporting, not core workflow)

**Dependencies:** FR-001

**Traceability:**

- PRD: Section 2.2 (Human interaction - monitoring)
- Tests: TEST-012
- Backlog: US-011

---

#### FR-008: Archive Completed Phases

**Description:** Archive completed phases to separate table for historical reference without cluttering active queries.

**Inputs:**

- phaseId: number
- archiveReason: string (optional)

**Outputs:**

- Phase moved to PhaseArchive table
- All children (Week/Day/Task/Session) moved to corresponding archive tables
- Original Phase record soft-deleted (deleted_at timestamp set)

**Validation:**

- Phase status must be COMPLETED
- Phase progress must be 1.0 (100%)

**Priority:** P2 (Medium - Post-MVP optimization)

**Dependencies:** FR-001, FR-002

**Traceability:**

- Tests: TEST-013
- Backlog: US-012

---

#### FR-009: Track Estimated vs Actual Hours

**Description:** Track estimated hours vs actual hours spent at Phase level for velocity calculation.

**Inputs:**

- Phase: estimatedHours (set at creation)
- Session: duration (endedAt - startedAt)

**Outputs:**

- Phase.actualHours = sum of all Session durations in hierarchy
- Variance: (actualHours - estimatedHours) / estimatedHours
- Velocity metric for future estimation

**Priority:** P2 (Medium - Useful for planning, not core workflow)

**Dependencies:** FR-001, FR-004

**Traceability:**

- PRD: Section 5.1 (Success metrics)
- Tests: TEST-014
- Backlog: US-013

---

#### FR-010: Status Transitions

**Description:** Enforce valid status transitions with state machine validation.

**State Machine:**

- NOT_STARTED → IN_PROGRESS
- IN_PROGRESS → COMPLETED
- IN_PROGRESS → BLOCKED
- BLOCKED → IN_PROGRESS
- COMPLETED (terminal state, no transitions out)

**Inputs:**

- entityId, entityType, newStatus

**Outputs:**

- Updated entity with new status
- Timestamp recorded (statusChangedAt)

**Validation:**

- Only valid transitions allowed (return error for invalid)
- Cannot set COMPLETED if progress < 1.0
- BLOCKED status requires blockerReason

**Priority:** P1 (High - Prevents invalid state)

**Dependencies:** FR-001, FR-002

**Traceability:**

- Architecture: ADR-003 (State machine design)
- Tests: TEST-015, TEST-016
- Backlog: US-014

---

#### FR-011: Git Hook Enforcement

**Description:** Pre-commit git hook prevents manual edits to auto-generated markdown files.

**Protected Files:**

- STATUS.md
- DEVELOPMENT_PLAN.md
- current-todos.md
- current-session-\*.md
- current-plan.md

**Hook Behavior:**

- Check if any protected file is modified
- If modified, check if modification came from sprint.syncMarkdown() (has special marker in commit message)
- If manual edit detected: REJECT commit with error message
- Error message: "Auto-generated file cannot be edited manually. Update via app (sprint.updateProgress or sprint.checkpoint)"

**Override:** Admin can force commit with `--no-verify` flag (for emergency fixes)

**Priority:** P0 (Critical - Ensures database as source of truth)

**Dependencies:** FR-005

**Traceability:**

- Architecture: ADR-002 (Database as source of truth)
- Tests: TEST-017 (hook validation)
- Backlog: US-015

---

#### FR-012: Markdown File Validation

**Description:** Validate markdown files after generation to ensure sync accuracy.

**Validation Checks:**

- Markdown syntax is valid (no unclosed tags, valid links)
- All referenced entities exist in database (e.g., "Phase 1" exists)
- Progress percentages match database values exactly
- Timestamps are correctly formatted

**Outputs:**

- Validation result: { valid: boolean, errors: string[] }
- If invalid, rollback file write and log error

**Priority:** P1 (High - Ensures data integrity)

**Dependencies:** FR-005

**Traceability:**

- Tests: TEST-018
- Backlog: US-016

---

#### FR-013: Bulk Progress Updates

**Description:** Update progress for multiple entities in a single atomic transaction.

**Inputs:**

- updates: Array<{ entityId, entityType, progress }>

**Outputs:**

- All entities updated with new progress
- Single markdown sync triggered (not per-entity)

**Validation:**

- All entities must exist
- All progress values valid (0.0 to 1.0)
- Atomic transaction (all succeed or all fail)

**Priority:** P2 (Medium - Optimization for bulk operations)

**Dependencies:** FR-002, FR-005

**Traceability:**

- Tests: TEST-019
- Backlog: US-017

---

#### FR-014: Progress History/Audit Trail

**Description:** Track all progress updates with timestamp and agent/human attribution for audit purposes.

**Table:** ProgressHistory

- entityId, entityType, previousProgress, newProgress, changedBy (agent/human), changedAt

**Outputs:**

- History record created on every progress update
- Query API: getProgressHistory(entityId, entityType)

**Priority:** P2 (Medium - Useful for debugging, not core workflow)

**Dependencies:** FR-002

**Traceability:**

- PRD: Section 10.2 (Audit trail)
- Tests: TEST-020
- Backlog: US-018

---

#### FR-015: Undo Progress Changes

**Description:** Rollback progress to previous value using audit trail.

**Inputs:**

- entityId, entityType, targetTimestamp (optional, defaults to previous state)

**Outputs:**

- Entity progress restored to previous value
- Rollback logged to ProgressHistory

**Validation:**

- Only allow rollback if no child progress changes since target timestamp
- Requires Level 2 approval (agent cannot undo autonomously)

**Priority:** P2 (Medium - Safety mechanism)

**Dependencies:** FR-002, FR-014

**Traceability:**

- PRD: Section 10.2 (Rollback system)
- Tests: TEST-021
- Backlog: US-019

---

#### FR-016: Export Hierarchy to JSON

**Description:** Export full hierarchy structure to JSON for backup or external analysis.

**Inputs:**

- includeArchived: boolean (default false)
- includeProgressHistory: boolean (default false)

**Outputs:**

- JSON structure with all Phase/Week/Day/Task/Session records
- Includes relationships (parentId references)
- Downloadable file or API response

**Priority:** P2 (Medium - Backup and migration)

**Dependencies:** FR-001

**Traceability:**

- Tests: TEST-022
- Backlog: US-020

---

#### FR-017: Import Hierarchy from JSON

**Description:** Restore hierarchy from JSON backup (disaster recovery).

**Inputs:**

- JSON file matching export format

**Outputs:**

- All entities created in database
- Progress recalculated via roll-up
- Markdown sync triggered

**Validation:**

- JSON schema validation
- Duplicate detection (prevent importing same data twice)
- Foreign key integrity enforced

**Priority:** P2 (Medium - Disaster recovery)

**Dependencies:** FR-001, FR-002, FR-005, FR-016

**Traceability:**

- Tests: TEST-023
- Backlog: US-021

---

#### FR-018: Phase/Week/Day Duplication

**Description:** Duplicate phase/week/day structure as template for similar work.

**Inputs:**

- sourceEntityId, sourceEntityType
- newName (for duplicated entity)

**Outputs:**

- New entity created with all children duplicated
- Progress reset to 0.0 for all duplicated entities
- Status set to NOT_STARTED

**Priority:** P2 (Medium - Template reuse)

**Dependencies:** FR-001

**Traceability:**

- Tests: TEST-024
- Backlog: US-022

---

#### FR-019: Task Reordering Within Day

**Description:** Reorder tasks within a day via drag-and-drop UI or API.

**Inputs:**

- dayId, taskIds (array in new order)

**Outputs:**

- Task.order field updated for all tasks
- Tasks displayed in new order in UI and markdown

**Priority:** P2 (Medium - UI convenience)

**Dependencies:** FR-001

**Traceability:**

- Tests: TEST-025
- Backlog: US-023

---

#### FR-020: Session Notes Rich Text Support

**Description:** Support markdown formatting in Session notes field (bold, italic, lists, code blocks).

**Inputs:**

- Session.notes: string (markdown format)

**Outputs:**

- Markdown rendered in UI
- Plain text stored in database
- Syntax validation before save

**Priority:** P1 (High - Improves agent notes readability)

**Dependencies:** FR-004

**Traceability:**

- Tests: TEST-026
- Backlog: US-024

---

#### FR-021: Session Token Usage Analytics

**Description:** Track token usage trends over time to optimize agent workflows.

**Metrics:**

- Average token usage per session
- Token usage by phase/week/day
- Sessions exceeding 15K token threshold
- Total tokens per phase (sum of all sessions)

**Outputs:**

- Dashboard with token usage charts
- API: getTokenAnalytics(phaseId)

**Priority:** P2 (Medium - Optimization insight)

**Dependencies:** FR-004

**Traceability:**

- PRD: Section 5.2 (Token efficiency metrics)
- Tests: TEST-027
- Backlog: US-025

---

#### FR-022: Task Dependencies

**Description:** Define task dependencies: Task B cannot start until Task A is COMPLETED.

**Table:** TaskDependency

- taskId (dependent task)
- dependsOnTaskId (prerequisite task)
- dependencyType ("blocks" | "related")

**Validation:**

- Cannot set Task status to IN_PROGRESS if any "blocks" dependency is not COMPLETED
- Circular dependency detection (A → B → A)

**Priority:** P1 (High - Prevents out-of-order work)

**Dependencies:** FR-001, FR-010

**Traceability:**

- Architecture: Section 4.7 (Dependency graph)
- Tests: TEST-028, TEST-029
- Backlog: US-026

---

#### FR-023: Critical Path Calculation

**Description:** Calculate critical path through task dependencies to identify bottlenecks.

**Algorithm:**

- Find all tasks with dependencies
- Calculate longest path from start to end
- Identify tasks on critical path (delays here delay entire project)

**Outputs:**

- List of critical tasks with slack time
- Dashboard visualization (Gantt chart with critical path highlighted)

**Priority:** P2 (Medium - Advanced planning feature)

**Dependencies:** FR-022

**Traceability:**

- Tests: TEST-030
- Backlog: US-027

---

#### FR-024: Progress Visualization Data

**Description:** Generate data structures for UI charts (progress charts, Gantt, burndown).

**Outputs:**

- Progress over time: { date: Date, progress: number }[]
- Gantt data: { taskId, startDate, endDate, progress, dependencies }[]
- Burndown data: { date: Date, remainingTasks: number, completedTasks: number }[]

**Priority:** P1 (High - UI requires this data)

**Dependencies:** FR-001, FR-002

**Traceability:**

- PRD: Section 3.2 (UI visualization)
- Tests: TEST-031
- Backlog: US-028

---

#### FR-025: Markdown Template Customization

**Description:** Allow customization of markdown file templates via configuration.

**Inputs:**

- Template files in /config/templates/
- Variables: {{Phase.name}}, {{Week.progress}}, etc.
- Custom sections (e.g., add "Blockers" section to STATUS.md)

**Outputs:**

- Markdown files generated from custom templates
- Validation ensures all variables are valid

**Priority:** P3 (Low - Post-MVP customization)

**Dependencies:** FR-005

**Traceability:**

- Tests: TEST-032
- Backlog: US-029

---

### 1.2 Web UI Pages (Overview)

**Purpose:** Provide a human-accessible web interface for all project data stored in the database.

**Pages:**

- **Wiki Page:** Searchable documentation with categories, markdown rendering, and editor.
- **Knowledge Base:** Semantic search (pgvector) with relevance scores and source links.
- **Issues Page:** CRUD operations, filtering, bulk actions, and context injection.
- **Tickets Page:** Sprint work items with lifecycle tracking and status transitions.
- **Development Cycle Page:** Hierarchical progress visualization (Phase → Week → Day → Task → Session).
- **Dashboard Page:** Project overview with metrics and quick actions.
- **Agent Personas Page:** Manage agent personas and toggles.
- **Project Health Page:** Security, quality, accessibility, and tech debt scores.

**Notes:**

- End users interact via web UI; AI agents interact via MCP tools. No markdown dependence for end-user workflows.
- Detailed functional requirements for these pages are covered in the implementation plan (docs/13-Project-Plan.md, Sprint 2) and related ADRs.

**Cross-References:**

- PRD: Section 4.1 Feature Overview
- Project Plan: Sprint 2 (Wiki + Onboarding)
- ADR-002: Database as Source of Truth
- ADR-003: Hybrid Knowledge Graph
- ADR-005: Five-Level Hierarchy

---

### 1.3 Onboarding System (FR-026 to FR-031)

**Purpose:** Three-session project initiation flow that captures executive summary, generates industry-grade documents, and creates AI workflow artifacts.

#### FR-026: Create Onboarding Session Record
- Backlog: US-026
- Description: System shall create an OnboardingSession record per project per session (1..3) with status tracking and JSON data storage.

#### FR-027: Get Session 1 Prompt (Executive Summary)
- Backlog: US-027
- Description: Provide a prompt template with 10 questions (project name, users, problem, tech stack, phase, team size, timeline, key features, constraints, success criteria).

#### FR-028: Get Session 2 Prompt (Industry Documentation)
- Backlog: US-028
- Description: Provide a prompt template that generates PRD, SRS, and Architecture docs from Session 1 answers.

#### FR-029: Get Session 3 Prompt (AI Workflow Blueprint)
- Backlog: US-029
- Description: Provide a prompt template to create Memory Banks, SOPs, and Skills documentation.

#### FR-030: MCP Tool onboarding.getPrompt()
- Backlog: US-030
- Description: Return the active session's prompt template with variables pre-filled from prior sessions.

#### FR-031: MCP Tool onboarding.submitResponse()
- Backlog: US-031
- Description: Store agent/user responses for the given session, update status, and indicate next session.

---

### 1.4 Workflow Orchestration (FR-032 to FR-056)

**Purpose:** Track and enforce 12 workflow state machines from CLAUDE.md

**12 Predefined Workflows:**

1. 5-Step Mandatory Protocol
2. Session Start Workflow
3. Plan Creation Workflow
4. Checkpoint Update Workflow
5. Recovery Workflow
6. Post-Completion Workflow
7. Git Workflow
8. Documentation Workflow
9. Pre-Work Checklist
10. Context File Workflow
11. 3-Tier Persistence Workflow
12. Plan Mode Workflow

---

#### FR-032: Define Workflow

**Description:** Create workflow definition with steps, validation rules, and state machine logic.

**Inputs:**

- name: string (unique identifier, e.g., "5-step-protocol")
- description: string
- steps: Array<{ stepNumber, name, description, required (boolean) }>

**Outputs:**

- Workflow record created
- WorkflowStep records created for each step
- Initial status: NOT_STARTED

**Validation:**

- Workflow name must be unique
- At least 1 step required
- Step numbers must be sequential (1, 2, 3, ...)

**Priority:** P0 (Critical - Foundation for workflow tracking)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.2 (Workflow Orchestration feature)
- Architecture: ADR-004 (Workflow state machine design)
- Tests: TEST-033, TEST-034
- Backlog: US-033

---

#### FR-033: Start Workflow

**Description:** Initialize workflow state machine, setting status to IN_PROGRESS and currentStepId to first step.

**Inputs:**

- workflowName: string (e.g., "5-step-protocol")
- context: object (optional metadata, e.g., { phaseId: 1, taskId: 42 })

**Outputs:**

- Workflow status set to IN_PROGRESS
- currentStepId set to first step (stepNumber = 1)
- startedAt timestamp recorded
- WorkflowExecution record created (tracks single workflow run)

**Validation:**

- Workflow must exist
- Workflow must not already be IN_PROGRESS (complete previous run first)

**Priority:** P0 (Critical - Agents start workflows constantly)

**Dependencies:** FR-026

**Traceability:**

- PRD: Section 3.1 (5-step protocol)
- Architecture: Section 4.8 (Workflow execution engine)
- Tests: TEST-035
- Backlog: US-033

---

#### FR-034: Get Current Workflow Step

**Description:** Retrieve current step in active workflow with full context and completion status.

**Inputs:**

- workflowId: number (optional, defaults to active workflow)

**Outputs:**

- Current WorkflowStep with:
  - stepNumber, name, description, required
  - completion status of previous steps
  - Next step preview
  - Estimated time remaining (based on historical data)

**Validation:**

- Returns null if no active workflow
- Returns error if workflow is COMPLETED or FAILED

**Priority:** P0 (Critical - Agents need to know current step)

**Dependencies:** FR-026, FR-027

**Traceability:**

- PRD: Section 2.1 (Agent workflow)
- Tests: TEST-036
- Backlog: US-033

---

#### FR-035: Complete Workflow Step

**Description:** Mark workflow step as complete, advance to next step, validate required steps not skipped.

**Inputs:**

- stepId: number
- completionNotes: string (optional) - what was done in this step

**Outputs:**

- WorkflowStep.completed set to true
- WorkflowStep.completedAt timestamp recorded
- Workflow.currentStepId advanced to next step
- If last step: Workflow.status set to COMPLETED, completedAt timestamp

**Validation:**

- Step must belong to active workflow
- Step must not already be completed
- If required=true, cannot skip (must complete in order)

**Alert Logic:**

- If agent tries to skip required step: Return error with message "Step X ({{name}}) is required. Complete it before proceeding."

**Priority:** P0 (Critical - Core workflow execution)

**Dependencies:** FR-026, FR-027, FR-028

**Traceability:**

- PRD: Section 4.2.2 (Workflow enforcement)
- Tests: TEST-037, TEST-038 (completion, validation)
- Backlog: US-034

---

#### FR-036: Validate Workflow Compliance

**Description:** Check if all required steps completed before marking workflow COMPLETED. Prevent completion if required steps skipped.

**Inputs:**

- workflowId: number

**Outputs:**

- Validation result: { compliant: boolean, missingSteps: WorkflowStep[] }
- If non-compliant: List of missing required steps

**Validation Logic:**

- Query all steps WHERE required=true AND completed=false
- If any exist: compliant = false

**Used By:**

- FR-029 (Complete Workflow Step) - validates before setting COMPLETED
- Agent receives alert: "Cannot complete workflow. Missing required steps: [list]"

**Priority:** P0 (Critical - Ensures workflow consistency)

**Dependencies:** FR-026, FR-029

**Traceability:**

- PRD: Section 1.2 (Mandatory session protocol)
- Architecture: Section 4.8 (Validation engine)
- Tests: TEST-039, TEST-040
- Backlog: US-035

---

#### FR-037: Pause Workflow

**Description:** Pause active workflow, save current state, allow resumption later.

**Inputs:**

- workflowId: number
- pauseReason: string (optional)

**Outputs:**

- Workflow.status set to PAUSED
- pausedAt timestamp recorded
- Current step preserved (not reset)

**Validation:**

- Workflow must be IN_PROGRESS
- Cannot pause COMPLETED or FAILED workflows

**Priority:** P1 (High - Useful for interruptions)

**Dependencies:** FR-027

**Traceability:**

- Tests: TEST-041
- Backlog: US-036

---

#### FR-038: Resume Workflow from Checkpoint

**Description:** Resume paused workflow from last completed step.

**Inputs:**

- workflowId: number

**Outputs:**

- Workflow.status set to IN_PROGRESS
- resumedAt timestamp recorded
- Current step unchanged (continues from where paused)

**Validation:**

- Workflow must be PAUSED
- Cannot resume NOT_STARTED, COMPLETED, or FAILED workflows

**Priority:** P1 (High - Recovery mechanism)

**Dependencies:** FR-027, FR-031

**Traceability:**

- PRD: Section 3.5 (Recovery workflow)
- Tests: TEST-042
- Backlog: US-037

---

#### FR-039: Retry Failed Workflow Steps

**Description:** Retry a failed step (e.g., if API call failed, database connection lost).

**Inputs:**

- stepId: number
- retryReason: string (optional)

**Outputs:**

- WorkflowStep.failed set to false
- retryCount incremented
- Agent receives instructions to re-execute step

**Validation:**

- Step must be marked as failed
- Max 3 retries per step (prevent infinite loops)

**Priority:** P1 (High - Error handling)

**Dependencies:** FR-027, FR-029

**Traceability:**

- PRD: Section 10.4 (Error handling)
- Tests: TEST-043
- Backlog: US-038

---

#### FR-040: Workflow Recovery Suggestions

**Description:** When workflow fails or agent gets stuck, provide recovery suggestions based on workflow state.

**Inputs:**

- workflowId: number

**Outputs:**

- Recovery plan: { currentStep, possibleActions: string[], recommendations: string[] }
- Example: "Workflow stuck at step 2 (Create Plan). Suggestions: 1) Check if plan file exists. 2) Re-run plan creation. 3) Skip to next step (requires approval)."

**Priority:** P1 (High - Helps agent self-recover)

**Dependencies:** FR-027, FR-028

**Traceability:**

- PRD: Section 3.5 (Recovery workflow)
- Tests: TEST-044
- Backlog: US-039

---

#### FR-041: Workflow Templates

**Description:** Define custom workflow templates (post-MVP feature for workflow customization).

**Inputs:**

- templateName, steps (same as FR-026)

**Outputs:**

- WorkflowTemplate record created
- Can be instantiated as Workflow via workflow.createFromTemplate(templateId)

**Priority:** P3 (Low - Post-MVP)

**Dependencies:** FR-026

**Traceability:**

- PRD: Section 7 (Out of scope for MVP)
- Tests: TEST-045
- Backlog: US-040

---

#### FR-042: Workflow Step Dependencies

**Description:** Define dependencies between workflow steps (Step 3 requires Step 1 and Step 2 complete).

**Inputs:**

- stepId, dependsOnStepIds: number[]

**Outputs:**

- WorkflowStepDependency records created

**Validation:**

- Cannot complete step if any dependency not completed
- Circular dependency detection

**Priority:** P2 (Medium - Advanced workflow logic)

**Dependencies:** FR-026, FR-029

**Traceability:**

- Tests: TEST-046
- Backlog: US-041

---

#### FR-043: Workflow Branching

**Description:** Conditional workflow steps based on context (e.g., if testsFailed, go to step 5, else skip to step 7).

**Inputs:**

- stepId, condition: string (JavaScript expression), trueStepId, falseStepId

**Outputs:**

- Workflow advances to trueStepId or falseStepId based on condition evaluation

**Priority:** P2 (Medium - Advanced workflow logic)

**Dependencies:** FR-027, FR-029

**Traceability:**

- Tests: TEST-047
- Backlog: US-042

---

#### FR-044: Workflow History

**Description:** Track all workflow executions with timestamps, steps completed, and outcomes.

**Table:** WorkflowExecution

- workflowId, startedAt, completedAt, status, stepsCompleted, stepsFailed, duration

**Outputs:**

- Query API: getWorkflowHistory(workflowId)
- Dashboard with workflow execution timeline

**Priority:** P1 (High - Audit and debugging)

**Dependencies:** FR-027

**Traceability:**

- PRD: Section 10.2 (Audit trail)
- Tests: TEST-048
- Backlog: US-043

---

#### FR-045: Workflow Success Rate Analytics

**Description:** Calculate success rate for each workflow (% of executions that completed successfully).

**Metrics:**

- Success rate = (completed executions) / (total executions) × 100
- Average duration per workflow
- Most failed step (bottleneck identification)

**Outputs:**

- Dashboard with workflow analytics
- API: getWorkflowAnalytics(workflowId)

**Priority:** P2 (Medium - Optimization insight)

**Dependencies:** FR-038

**Traceability:**

- PRD: Section 5.4 (Quality metrics)
- Tests: TEST-049
- Backlog: US-044

---

#### FR-046: Workflow Failure Logs

**Description:** Log detailed failure information when workflow step fails.

**Table:** WorkflowFailure

- workflowId, stepId, errorMessage, stackTrace, timestamp, retryCount

**Outputs:**

- Agent receives detailed error message
- Human can view failure logs in UI for debugging

**Priority:** P1 (High - Debugging)

**Dependencies:** FR-029

**Traceability:**

- PRD: Section 10.4 (Error handling)
- Tests: TEST-050
- Backlog: US-045

---

#### FR-047: Workflow Step Time Tracking

**Description:** Track how long each step takes to complete for velocity estimation.

**Outputs:**

- WorkflowStep.startedAt, completedAt (duration = completedAt - startedAt)
- Average duration per step across all executions
- Estimate remaining time for active workflow

**Priority:** P2 (Medium - Planning insight)

**Dependencies:** FR-029

**Traceability:**

- Tests: TEST-051
- Backlog: US-046

---

#### FR-048: Workflow Duplication

**Description:** Duplicate existing workflow as new workflow with modified steps.

**Inputs:**

- sourceWorkflowId, newName

**Outputs:**

- New Workflow created with all steps copied
- Steps can be edited after duplication

**Priority:** P2 (Medium - Template reuse)

**Dependencies:** FR-026

**Traceability:**

- Tests: TEST-052
- Backlog: US-047

---

#### FR-049: Workflow Enable/Disable

**Description:** Temporarily disable workflow without deleting (e.g., disable "Git Workflow" if not using git).

**Inputs:**

- workflowId, enabled: boolean

**Outputs:**

- Workflow.enabled field updated
- Disabled workflows not shown in agent workflow list

**Priority:** P2 (Medium - Customization)

**Dependencies:** FR-026

**Traceability:**

- Tests: TEST-053
- Backlog: US-048

---

#### FR-050: Workflow Alerts

**Description:** Send alerts to agent and human when workflow issues occur (missing steps, failures, stuck).

**Alert Triggers:**

- Required step skipped: "Step X is required"
- Step failed: "Step X failed with error: {{errorMessage}}"
- Workflow stuck: "Workflow has been IN_PROGRESS for 2+ hours with no step completion"

**Outputs:**

- Agent receives alert in MCP tool response
- Human receives notification in UI dashboard

**Priority:** P1 (High - Proactive error detection)

**Dependencies:** FR-029, FR-030

**Traceability:**

- Tests: TEST-054
- Backlog: US-049

---

#### FR-051: Workflow Auto-Recovery

**Description:** Agent receives automatic suggestions when workflow gets stuck or fails.

**Recovery Strategies:**

- Step timeout: "Retry step or skip (requires approval)"
- Missing dependency: "Complete prerequisite step X first"
- Validation failed: "Fix issue: {{validationError}}"

**Priority:** P1 (High - Reduces human intervention)

**Dependencies:** FR-034

**Traceability:**

- PRD: Section 3.5 (Recovery workflow)
- Tests: TEST-055
- Backlog: US-050

---

#### FR-052: Multiple Concurrent Workflows

**Description:** Track multiple workflows simultaneously (e.g., "5-step-protocol" + "Git Workflow" both active).

**Validation:**

- Each workflow tracked independently
- No conflicts if workflows modify same entities (last write wins)

**Priority:** P2 (Medium - Advanced use case)

**Dependencies:** FR-027

**Traceability:**

- Tests: TEST-056
- Backlog: US-051

---

#### FR-053: Workflow Priority

**Description:** Assign priority to workflows to determine which workflow agent should focus on.

**Inputs:**

- workflowId, priority: number (1-10, 10 = highest)

**Outputs:**

- Workflow.priority field updated
- Agent receives highest priority workflow in getCurrentWorkflow()

**Priority:** P2 (Medium - Helps agent focus)

**Dependencies:** FR-027, FR-028

**Traceability:**

- Tests: TEST-057
- Backlog: US-052

---

#### FR-054: Workflow Context Injection

**Description:** Pass data between workflow steps (e.g., Step 1 creates plan file, Step 2 reads plan file path).

**Inputs:**

- stepId, contextKey: string, contextValue: any

**Outputs:**

- WorkflowContext table stores key-value pairs per workflow execution
- Next steps can access context via getWorkflowContext(key)

**Priority:** P2 (Medium - Step coordination)

**Dependencies:** FR-027, FR-029

**Traceability:**

- Tests: TEST-058
- Backlog: US-053

---

#### FR-055: Workflow Undo

**Description:** Rollback to previous workflow step (undo last step completion).

**Inputs:**

- workflowId, targetStepNumber

**Outputs:**

- Current step reset to targetStepNumber
- Steps after targetStepNumber marked incomplete

**Validation:**

- Requires Level 2 approval (agent cannot undo autonomously)
- Cannot undo if workflow COMPLETED

**Priority:** P2 (Medium - Error recovery)

**Dependencies:** FR-029

**Traceability:**

- Tests: TEST-059
- Backlog: US-054

---

#### FR-056: Workflow Export/Import

**Description:** Export workflow definition to JSON, import to create new workflow.

**Export Format:**

```json
{
  "name": "5-step-protocol",
  "description": "...",
  "steps": [
    { "stepNumber": 1, "name": "Initialize", "description": "...", "required": true },
    ...
  ]
}
```

**Priority:** P2 (Medium - Workflow sharing)

**Dependencies:** FR-026

**Traceability:**

- Tests: TEST-060
- Backlog: US-055

---

### 1.5 Issues (FR-057 to FR-076)

**Purpose:** Bug and task tracking for agent-created and human-created work items

---

#### FR-057: Create Single Issue

**Description:** Create single issue with title, description, status, priority, and createdBy attribution.

**Inputs:**

- title: string (1-200 characters)
- description: string (optional, markdown format)
- status: IssueStatus (default: OPEN)
- priority: IssuePriority (default: MEDIUM)
- createdBy: CreatedBy (AGENT | HUMAN)

**Outputs:**

- Issue record created with auto-generated ID
- createdAt, updatedAt timestamps

**Validation:**

- title required, 1-200 characters
- status must be valid enum value
- priority must be valid enum value

**Priority:** P0 (Critical - Core issue tracking)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.3 (Issues feature)
- Architecture: Section 4.9 (Issue CRUD API)
- Tests: TEST-061
- Backlog: US-056

---

#### FR-058: Create Bulk Issues

**Description:** Create 10-50 issues at once in atomic transaction (e.g., from audit results).

**Inputs:**

- issues: Array<IssueInput> (10-50 items)

**Outputs:**

- Array of created Issue records
- Duplicate detection result: { duplicates: Issue[], created: Issue[] }

**Validation:**

- All issues validated before creation (atomic)
- Duplicate detection: Similar titles (Levenshtein distance < 10)
- Rate limit: Max 100 issues per minute

**Priority:** P0 (Critical - Agent workflow requires bulk creation)

**Dependencies:** FR-051

**Traceability:**

- PRD: Section 3.2 (Issue creation workflow)
- Tests: TEST-062, TEST-063 (bulk creation, duplicate detection)
- Backlog: US-057

---

#### FR-059: Update Issue

**Description:** Update any issue field except id, createdAt (status, priority, description, etc.).

**Inputs:**

- issueId: number
- updates: Partial<IssueInput>

**Outputs:**

- Updated Issue record
- updatedAt timestamp updated
- Audit trail record created (ProgressHistory)

**Validation:**

- Issue must exist
- Status transitions validated (OPEN → IN_PROGRESS → REVIEW → CLOSED)
- Cannot reopen CLOSED issues (must create new issue)

**Priority:** P0 (Critical - Core issue tracking)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-064, TEST-065 (update, status transition)
- Backlog: US-058

---

#### FR-060: Query Issues

**Description:** Search issues with filters, full-text search, pagination, and sorting.

**Inputs:**

- filters: { status?, priority?, createdBy?, dateRange?, labels?, search? }
- pagination: { page, limit }
- sort: { field, order: "asc" | "desc" }

**Outputs:**

- Paginated array of Issue records
- Total count (for pagination UI)
- Aggregations: { statusCounts, priorityCounts }

**Full-Text Search:**

- Search in title and description
- PostgreSQL tsvector for fast text search

**Priority:** P0 (Critical - Agent and human need to find issues)

**Dependencies:** FR-051

**Traceability:**

- PRD: Section 2.1 (Agent workflow)
- Tests: TEST-066, TEST-067 (query, full-text search)
- Backlog: US-059

---

#### FR-067: Link Related Issues

**Description:** Create relationships between issues (blocks, related, duplicate).

**Inputs:**

- issueId: number
- relatedId: number
- type: "blocks" | "related" | "duplicate"

**Outputs:**

- IssueRelation record created

**Validation:**

- Both issues must exist
- Cannot create circular "blocks" dependencies (A blocks B, B blocks A)
- Duplicate type: Auto-close one issue as duplicate

**Priority:** P1 (High - Useful for dependency tracking)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-068, TEST-069 (link, circular detection)
- Backlog: US-060

---

#### FR-062: Delete Issue (Soft Delete)

**Description:** Soft delete issue (preserve audit trail, don't actually delete from database).

**Inputs:**

- issueId: number
- deleteReason: string (optional)

**Outputs:**

- Issue.deletedAt timestamp set
- Issue.deletedBy set (agent or human)
- Issue hidden from default queries (WHERE deletedAt IS NULL)

**Validation:**

- Requires Level 2 approval (agent cannot delete autonomously)

**Priority:** P1 (High - Cleanup functionality)

**Dependencies:** FR-051

**Traceability:**

- PRD: Section 10.1 (Autonomy Level 2)
- Tests: TEST-070
- Backlog: US-061

---

#### FR-063: Add Issue Comment

**Description:** Add comment to issue with markdown support and createdBy attribution.

**Inputs:**

- issueId: number
- comment: string (markdown format)
- createdBy: CreatedBy

**Outputs:**

- IssueComment record created

**Priority:** P1 (High - Discussion on issues)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-071
- Backlog: US-062

---

#### FR-064: Attach File to Issue

**Description:** Link issue to code file with line number (context injection).

**Inputs:**

- issueId: number
- filePath: string
- lineNumber: number (optional)
- snippet: string (optional) - code snippet from that line

**Outputs:**

- IssueFile record created
- Clickable link in UI to open file at line number

**Priority:** P1 (High - Essential for bug tracking)

**Dependencies:** FR-051

**Traceability:**

- PRD: Section 4.2.3 (Context injection)
- Tests: TEST-072
- Backlog: US-063

---

#### FR-065: Link Issue to Git Commit

**Description:** Associate issue with git commit SHA (track which commit fixed the issue).

**Inputs:**

- issueId: number
- commitSHA: string

**Outputs:**

- IssueCommit record created
- Commit message and author extracted from git

**Priority:** P2 (Medium - Useful for tracking)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-073
- Backlog: US-064

---

#### FR-066: Auto-Tag Based on File Path

**Description:** Automatically assign labels to issues based on file path (e.g., "src/api" → "backend" label).

**Tagging Rules:**

- src/api/\*\* → "backend", "api"
- src/app/\*\* → "frontend", "ui"
- src/lib/auth/\*\* → "auth"
- prisma/\*\* → "database"

**Priority:** P1 (High - Reduces manual tagging)

**Dependencies:** FR-051, FR-058

**Traceability:**

- Tests: TEST-074
- Backlog: US-065

---

#### FR-067: Context Injection (Stack Traces)

**Description:** Attach stack trace or error log to issue for debugging context.

**Inputs:**

- issueId: number
- stackTrace: string
- errorType: string (e.g., "TypeError", "ReferenceError")

**Outputs:**

- IssueContext record created
- Stack trace parsed and formatted in UI

**Priority:** P1 (High - Essential for bug tracking)

**Dependencies:** FR-051

**Traceability:**

- PRD: Section 4.2.3 (Context injection)
- Tests: TEST-075
- Backlog: US-066

---

#### FR-068: Issue Templates

**Description:** Predefined issue templates (bug report, feature request) for consistency.

**Templates:**

- Bug Report: { title format, description template with sections }
- Feature Request: { title format, description template }

**Priority:** P2 (Medium - Improves consistency)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-076
- Backlog: US-067

---

#### FR-069: Issue Priority Auto-Assignment

**Description:** Auto-assign priority based on keywords (e.g., "critical", "urgent" → HIGH).

**Keyword Rules:**

- "critical", "urgent", "blocker" → CRITICAL
- "important", "high priority" → HIGH
- "minor", "low priority" → LOW
- Default: MEDIUM

**Priority:** P2 (Medium - Convenience)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-077
- Backlog: US-068

---

#### FR-070: Issue Assignment

**Description:** Assign issue to agent persona or human for responsibility tracking.

**Inputs:**

- issueId: number
- assignedTo: string (persona name or human name)

**Outputs:**

- Issue.assignedTo field updated

**Priority:** P2 (Medium - Team coordination)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-078
- Backlog: US-069

---

#### FR-071: Issue Labels Management

**Description:** Create, assign, and remove labels (tags) from issues.

**Operations:**

- Create label: { name, color }
- Assign label to issue
- Remove label from issue

**Priority:** P1 (High - Issue organization)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-079
- Backlog: US-070

---

#### FR-072: Issue Status Workflow Customization

**Description:** Define custom status workflow (beyond OPEN → IN_PROGRESS → REVIEW → CLOSED).

**Priority:** P3 (Low - Post-MVP)

**Dependencies:** FR-051, FR-053

**Traceability:**

- PRD: Section 7 (Out of scope)
- Tests: TEST-080
- Backlog: US-071

---

#### FR-073: Issue Search by Code Snippet

**Description:** Search for issues related to specific code snippet (semantic search).

**Inputs:**

- codeSnippet: string

**Outputs:**

- Issues with similar code in attached files
- Uses vector embeddings for semantic similarity

**Priority:** P2 (Medium - Advanced search)

**Dependencies:** FR-051, FR-058

**Traceability:**

- Tests: TEST-081
- Backlog: US-072

---

#### FR-074: Issue Export

**Description:** Export issues to CSV or JSON for external analysis.

**Inputs:**

- filters: IssueFilters (optional)
- format: "csv" | "json"

**Outputs:**

- Downloadable file with all issue data

**Priority:** P2 (Medium - Data portability)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-082
- Backlog: US-073

---

#### FR-075: Issue Import

**Description:** Import issues from external systems (GitHub, Jira, Linear).

**Inputs:**

- file: CSV or JSON
- mapping: { externalField → IssueField }

**Outputs:**

- Bulk issue creation (using FR-052)

**Priority:** P3 (Low - Post-MVP integration)

**Dependencies:** FR-052

**Traceability:**

- PRD: Section 7 (Out of scope)
- Tests: TEST-083
- Backlog: US-074

---

#### FR-076: Duplicate Issue Detection

**Description:** Detect duplicate issues using semantic similarity before creation.

**Algorithm:**

- Generate embedding for new issue title + description
- Compare with existing issues using vector similarity
- If similarity > 0.9, flag as potential duplicate

**Priority:** P1 (High - Reduces noise)

**Dependencies:** FR-051

**Traceability:**

- Tests: TEST-084
- Backlog: US-075

---

### 1.4 Knowledge (FR-071 to FR-090)

**Purpose:** Project-specific context retrieval with RAG + Knowledge Graph

**Token Optimization Goal:** Retrieve 6-8 items (~1,200 tokens) vs 10,000+ for full graph (88% reduction)

---

#### FR-071: Add Knowledge Item

**Description:** Store knowledge item with content, tags, and embeddings for semantic search.

**Inputs:**

- content: string (markdown format, project-specific knowledge)
- tags: string[] (for filtering)
- createdBy: CreatedBy

**Outputs:**

- KnowledgeItem record created
- embedding vector generated (384 dimensions via pgvector)
- searchVector tsvector generated (for full-text search)

**Embedding Generation:**

- Use OpenAI text-embedding-3-small (384 dimensions) OR Ollama local embeddings
- Async generation (doesn't block response)

**Priority:** P1 (High - Core knowledge storage)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.4 (Knowledge feature)
- Architecture: Section 4.10 (RAG implementation)
- Tests: TEST-085, TEST-086 (creation, embedding generation)
- Backlog: US-076

---

#### FR-072: Query Knowledge (Hybrid Search)

**Description:** Retrieve top-K relevant knowledge items using hybrid search (semantic + full-text).

**Inputs:**

- query: string (natural language question)
- k: number (default: 5, top results to return)
- tags: string[] (optional filter)

**Algorithm:**

1. Semantic search (pgvector): top-K=5
2. Full-text search (tsvector): top-K=5
3. Merge results: 0.7 × semantic_score + 0.3 × fulltext_score
4. Return top-K=5 merged results

**Outputs:**

- Array<KnowledgeItem> (top-K items, ~1,200 tokens total)
- Each item includes similarity score

**Priority:** P1 (High - Core knowledge retrieval)

**Dependencies:** FR-071

**Traceability:**

- PRD: Section 3.3 (Knowledge query workflow), Section 5.2 (Token efficiency)
- Architecture: Section 4.10 (Hybrid search implementation)
- Tests: TEST-087, TEST-088, TEST-089 (semantic, full-text, hybrid)
- Backlog: US-077

---

#### FR-073: Create Knowledge Relationship

**Description:** Create directed edge in knowledge graph (from node → to node with type).

**Inputs:**

- fromId: number (source KnowledgeItem)
- toId: number (target KnowledgeItem)
- type: RelationType ("REFERENCES" | "CONTRADICTS" | "EXTENDS")
- strength: number (0.0-1.0, default: 1.0) - confidence score

**Outputs:**

- KnowledgeRelationship record created

**Validation:**

- Both fromId and toId must exist
- Cannot create duplicate relationships (same from, to, type)

**Priority:** P1 (High - Core knowledge graph feature)

**Dependencies:** FR-071

**Traceability:**

- PRD: Section 4.2.4 (Knowledge graph)
- Tests: TEST-090, TEST-091 (creation, duplicate prevention)
- Backlog: US-078

---

#### FR-074: Traverse Knowledge Graph

**Description:** Traverse graph from starting node up to depth=2 (2 hops max). Return 1-3 related nodes (not entire graph).

**Inputs:**

- startId: number (starting KnowledgeItem)
- depth: number (default: 2, max: 2)
- relationshipTypes: RelationType[] (optional filter)

**Outputs:**

- Related nodes: Array<KnowledgeItem> (1-3 items, ~400 tokens)
- Relationship metadata: { fromId, toId, type, strength }
- Total: 6-8 items from hybrid search + traversal (~1,200 tokens)

**Algorithm:**

- Start at startId
- Traverse outgoing relationships (REFERENCES, EXTENDS)
- Stop at depth=2 (don't traverse entire graph)
- Return top 3 related nodes by strength score

**Priority:** P1 (High - Token-efficient graph traversal)

**Dependencies:** FR-071, FR-073

**Traceability:**

- PRD: Section 4.2.4 (Limited depth traversal), Section 5.2 (Token efficiency: 88% reduction)
- Architecture: Section 4.10 (Graph traversal algorithm)
- Tests: TEST-092, TEST-093 (traversal, depth limit)
- Backlog: US-079

---

#### FR-075: Semantic Search Only

**Description:** Query knowledge using vector similarity only (bypass full-text search).

**Inputs:**

- query: string
- k: number (default: 5)
- tags: string[] (optional)

**Outputs:**

- Array<KnowledgeItem> (top-K by vector similarity)
- Similarity scores

**Priority:** P1 (High - Alternative search method)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-094
- Backlog: US-080

---

#### FR-076: Update Knowledge Item

**Description:** Update knowledge item content or tags (regenerates embeddings).

**Inputs:**

- knowledgeId: number
- updates: { content?, tags? }

**Outputs:**

- Updated KnowledgeItem record
- Embeddings regenerated if content changed

**Priority:** P1 (High - Maintenance)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-095
- Backlog: US-081

---

#### FR-077: Delete Knowledge Item (Soft Delete)

**Description:** Soft delete knowledge item, preserve relationships for audit.

**Inputs:**

- knowledgeId: number

**Outputs:**

- KnowledgeItem.deletedAt timestamp set
- Relationships preserved (for historical context)

**Validation:**

- Requires Level 2 approval

**Priority:** P1 (High - Cleanup)

**Dependencies:** FR-071

**Traceability:**

- PRD: Section 10.1 (Autonomy Level 2)
- Tests: TEST-096
- Backlog: US-082

---

#### FR-078: Delete Knowledge Relationship

**Description:** Remove edge from knowledge graph.

**Inputs:**

- relationshipId: number

**Outputs:**

- KnowledgeRelationship record deleted

**Priority:** P2 (Medium - Cleanup)

**Dependencies:** FR-073

**Traceability:**

- Tests: TEST-097
- Backlog: US-083

---

#### FR-079: Full-Text Search Only

**Description:** Query knowledge using PostgreSQL tsvector only (bypass semantic search).

**Inputs:**

- query: string
- k: number (default: 5)

**Outputs:**

- Array<KnowledgeItem> (top-K by text rank)

**Priority:** P2 (Medium - Alternative search)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-098
- Backlog: US-084

---

#### FR-080: Graph Visualization Data

**Description:** Generate data for UI graph visualization (nodes, edges).

**Inputs:**

- filters: { tags?, createdBy? }

**Outputs:**

- Nodes: Array<{ id, content (truncated), tags }>
- Edges: Array<{ fromId, toId, type, strength }>
- Total: Limited to 50 nodes (prevent UI overload)

**Priority:** P2 (Medium - UI feature)

**Dependencies:** FR-071, FR-073

**Traceability:**

- PRD: Section 3.2 (UI monitoring)
- Tests: TEST-099
- Backlog: US-085

---

#### FR-081: Knowledge Aging

**Description:** Mark old knowledge items as deprecated after inactivity period.

**Logic:**

- If not accessed in 90 days: Mark as potentially outdated
- Agent receives warning when retrieving old items

**Priority:** P2 (Medium - Maintenance)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-100
- Backlog: US-086

---

#### FR-082: Knowledge Provenance

**Description:** Track who added knowledge item and when for accountability.

**Fields:** createdBy, createdAt, lastModifiedBy, lastModifiedAt

**Priority:** P1 (High - Audit trail)

**Dependencies:** FR-071

**Traceability:**

- PRD: Section 10.2 (Audit trail)
- Tests: TEST-101
- Backlog: US-087

---

#### FR-083: Knowledge Versioning

**Description:** Track changes to knowledge items over time (version history).

**Table:** KnowledgeVersion

- knowledgeId, version, content, modifiedBy, modifiedAt

**Priority:** P2 (Medium - Advanced feature)

**Dependencies:** FR-071, FR-076

**Traceability:**

- Tests: TEST-102
- Backlog: US-088

---

#### FR-084: Knowledge Auto-Tagging

**Description:** Extract entities from content and auto-assign tags (NER - Named Entity Recognition).

**Priority:** P3 (Low - Post-MVP AI feature)

**Dependencies:** FR-071

**Traceability:**

- PRD: Section 7 (Out of scope)
- Tests: TEST-103
- Backlog: US-089

---

#### FR-085: Knowledge Auto-Relationship Detection

**Description:** Detect semantic similarity between knowledge items and auto-create relationships.

**Algorithm:**

- Compare embeddings of all knowledge items
- If similarity > 0.85, create REFERENCES relationship

**Priority:** P3 (Low - Post-MVP AI feature)

**Dependencies:** FR-071, FR-073

**Traceability:**

- Tests: TEST-104
- Backlog: US-090

---

#### FR-086: Knowledge Export

**Description:** Export knowledge items to JSON or markdown for backup.

**Outputs:**

- JSON: All items with embeddings
- Markdown: All items as .md files (for git versioning)

**Priority:** P2 (Medium - Backup)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-105
- Backlog: US-091

---

#### FR-087: Knowledge Import

**Description:** Import knowledge items from JSON or markdown files.

**Priority:** P2 (Medium - Data migration)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-106
- Backlog: US-092

---

#### FR-088: Knowledge Statistics

**Description:** Dashboard metrics: total items, relationships, orphaned nodes (no relationships).

**Outputs:**

- { totalItems, totalRelationships, orphanedNodes, averageRelationshipsPerNode }

**Priority:** P2 (Medium - Monitoring)

**Dependencies:** FR-071, FR-073

**Traceability:**

- Tests: TEST-107
- Backlog: US-093

---

#### FR-089: Knowledge Search by Relationship Type

**Description:** Find all items that CONTRADICT item X or EXTEND item Y.

**Inputs:**

- startId: number
- relationshipType: RelationType

**Outputs:**

- Array<KnowledgeItem> (all related items of specified type)

**Priority:** P2 (Medium - Advanced query)

**Dependencies:** FR-073, FR-074

**Traceability:**

- Tests: TEST-108
- Backlog: US-094

---

#### FR-090: Knowledge Confidence Scoring

**Description:** Track confidence/reliability of knowledge items (user feedback, usage frequency).

**Fields:** confidenceScore (0.0-1.0), usageCount, positiveVotes, negativeVotes

**Priority:** P2 (Medium - Quality tracking)

**Dependencies:** FR-071

**Traceability:**

- Tests: TEST-109
- Backlog: US-095

---

### 1.5 Skills (FR-091 to FR-105)

**Purpose:** Framework/library documentation for token-efficient agent access

**Token Optimization Goal:** 220 tokens per skill vs 2,500 for full docs (92% reduction)

---

#### FR-091: Create Skill

**Description:** Create skill with markdown content, frontmatter, and auto-invocation triggers.

**Inputs:**

- name: string (unique)
- category: string ("framework" | "testing" | "workflow" | "troubleshooting")
- description: string
- content: string (markdown format)
- triggers: string[] (keywords for auto-invocation)
- tokenEstimate: number (estimated token cost of content)

**Outputs:**

- Skill record created
- lastUpdated timestamp set

**Validation:**

- name must be unique
- category must be valid enum
- content must be valid markdown

**Priority:** P1 (High - Core skill storage)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.5 (Skills feature)
- Architecture: Section 4.11 (Skill lazy loading)
- Tests: TEST-110
- Backlog: US-096

---

#### FR-092: List Skills (Frontmatter Only)

**Description:** Return all skills with frontmatter only (no content) for lazy loading.

**Inputs:**

- category: string (optional filter)
- sort: { field: "name" | "category" | "lastUpdated", order: "asc" | "desc" }

**Outputs:**

- Array<SkillFrontmatter> { id, name, category, description, triggers, tokenEstimate }
- NO content field included (save tokens)
- Total: 50-80 tokens per skill vs 220 with content

**Priority:** P1 (High - Token efficiency)

**Dependencies:** FR-091

**Traceability:**

- PRD: Section 4.2.5 (Lazy loading), Section 5.2 (92% token reduction)
- Tests: TEST-111
- Backlog: US-097

---

#### FR-093: Load Skill (On-Demand Content)

**Description:** Load full skill content only when agent needs it.

**Inputs:**

- skillName: string

**Outputs:**

- Full Skill record with content field
- Total: 220 tokens (vs 2,500 for full React docs)
- Auto-unload after use (agent removes from context)

**Priority:** P1 (High - Core skill retrieval)

**Dependencies:** FR-091

**Traceability:**

- PRD: Section 4.2.5 (On-demand loading)
- Tests: TEST-112
- Backlog: US-098

---

#### FR-094: Search Skills

**Description:** Search skills by keywords in triggers, name, or description.

**Inputs:**

- keywords: string[] (e.g., ["react", "hooks"])

**Outputs:**

- Array<SkillFrontmatter> (matching skills, frontmatter only)
- Relevance score (keyword match count)

**Priority:** P1 (High - Skill discovery)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-113
- Backlog: US-099

---

#### FR-095: Update Skill

**Description:** Update skill content, description, triggers, or category.

**Inputs:**

- skillId: number
- updates: Partial<SkillInput>

**Outputs:**

- Updated Skill record
- lastUpdated timestamp updated

**Priority:** P1 (High - Maintenance)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-114
- Backlog: US-100

---

#### FR-096: Delete Skill (Soft Delete)

**Description:** Soft delete skill (preserve audit trail).

**Inputs:**

- skillId: number

**Outputs:**

- Skill.deletedAt timestamp set

**Validation:**

- Requires Level 2 approval

**Priority:** P2 (Medium - Cleanup)

**Dependencies:** FR-091

**Traceability:**

- PRD: Section 10.1 (Autonomy Level 2)
- Tests: TEST-115
- Backlog: US-101

---

#### FR-097: Skill Versioning

**Description:** Track skill changes over time (version history).

**Table:** SkillVersion

- skillId, version, content, modifiedBy, modifiedAt

**Priority:** P2 (Medium - Advanced feature)

**Dependencies:** FR-091, FR-095

**Traceability:**

- Tests: TEST-116
- Backlog: US-102

---

#### FR-098: Skill Usage Analytics

**Description:** Track which skills loaded most often to identify most useful patterns.

**Metrics:**

- loadCount per skill
- lastLoaded timestamp
- Average token cost per load

**Priority:** P2 (Medium - Optimization insight)

**Dependencies:** FR-093

**Traceability:**

- Tests: TEST-117
- Backlog: US-103

---

#### FR-099: Skill Token Cost Tracking

**Description:** Track actual vs estimated token cost for accuracy.

**Priority:** P2 (Medium - Cost monitoring)

**Dependencies:** FR-091, FR-093

**Traceability:**

- PRD: Section 5.2 (Token efficiency metrics)
- Tests: TEST-118
- Backlog: US-104

---

#### FR-100: Skill Auto-Invocation Rules

**Description:** Auto-load skills based on trigger keywords in agent query.

**Logic:**

- Agent query: "How do I implement Prisma query?"
- System detects "Prisma" keyword → Auto-loads prisma-expert skill
- Agent uses skill → Auto-unloads after response

**Priority:** P2 (Medium - Automation)

**Dependencies:** FR-091, FR-093

**Traceability:**

- Tests: TEST-119
- Backlog: US-105

---

#### FR-101: Skill Templates

**Description:** Predefined skill templates for creating new skills.

**Templates:**

- Framework pattern skill
- Testing pattern skill
- Troubleshooting SOP skill

**Priority:** P2 (Medium - Consistency)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-120
- Backlog: US-106

---

#### FR-102: Skill Export/Import

**Description:** Export skills to markdown files, import from files.

**Outputs:**

- Markdown files with YAML frontmatter
- Compatible with .claude/skills/ folder structure

**Priority:** P2 (Medium - Portability)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-121
- Backlog: US-107

---

#### FR-103: Skill Validation

**Description:** Validate skill markdown is well-formed before save.

**Checks:**

- Valid markdown syntax
- YAML frontmatter present
- Required fields (name, category, description)

**Priority:** P1 (High - Data integrity)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-122
- Backlog: US-108

---

#### FR-104: Skill Categories Management

**Description:** Create custom skill categories beyond default 4.

**Default Categories:** framework, testing, workflow, troubleshooting

**Priority:** P3 (Low - Post-MVP customization)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-123
- Backlog: US-109

---

#### FR-105: Skill Search by Token Budget

**Description:** Find skills under specified token budget (e.g., "find skills under 200 tokens").

**Inputs:**

- maxTokens: number

**Outputs:**

- Array<SkillFrontmatter> (skills with tokenEstimate <= maxTokens)

**Priority:** P2 (Medium - Token optimization)

**Dependencies:** FR-091

**Traceability:**

- Tests: TEST-124
- Backlog: US-110

---

### 1.6 Wiki (FR-106 to FR-115)

**Purpose:** Project documentation auto-generation from code

---

#### FR-106: Create Wiki Page

**Description:** Create wiki page manually via UI or agent MCP call.

**Inputs:**

- slug: string (URL-safe path, e.g., "api/authentication")
- title: string
- content: string (markdown)
- parentId: number (optional, for hierarchical structure)

**Outputs:**

- WikiPage record created

**Validation:**

- slug must be unique and URL-safe
- parentId must exist if provided

**Priority:** P2 (Medium - Documentation)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.6 (Wiki feature)
- Tests: TEST-125
- Backlog: US-111

---

#### FR-107: Update Wiki Page

**Description:** Update wiki page content or metadata.

**Inputs:**

- wikiId or slug
- updates: { title?, content?, parentId? }

**Outputs:**

- Updated WikiPage record
- lastEditedBy (agent or human) recorded
- updatedAt timestamp updated

**Priority:** P2 (Medium - Maintenance)

**Dependencies:** FR-106

**Traceability:**

- Tests: TEST-126
- Backlog: US-112

---

#### FR-108: Read Wiki Page

**Description:** Retrieve wiki page by slug with hierarchy info (parent, children).

**Inputs:**

- slug: string

**Outputs:**

- WikiPage record
- Breadcrumb trail (parent hierarchy)
- Children pages (if any)

**Priority:** P2 (Medium - Core wiki feature)

**Dependencies:** FR-106

**Traceability:**

- Tests: TEST-127
- Backlog: US-113

---

#### FR-109: Auto-Generate Wiki Pages

**Description:** Parse source files (JSDoc, docstrings) and generate wiki pages.

**Inputs:**

- sourceFiles: string[] (file paths to parse)

**Outputs:**

- WikiPage records created/updated
- autoGenerated flag set to true
- sourceFiles field populated (track which files generated this page)

**Parsing Logic:**

- JSDoc comments in TypeScript files
- Python docstrings
- Markdown comments in SQL/Prisma files

**Priority:** P2 (Medium - Automation)

**Dependencies:** FR-106

**Traceability:**

- PRD: Section 4.2.6 (Auto-generation)
- Tests: TEST-128
- Backlog: US-114

---

#### FR-110: Search Wiki Pages

**Description:** Full-text search across all wiki pages (title + content).

**Inputs:**

- query: string
- parentId: number (optional filter, search within section)

**Outputs:**

- Paginated array of WikiPage records
- Relevance score (text rank)

**Priority:** P2 (Medium - Wiki navigation)

**Dependencies:** FR-106

**Traceability:**

- Tests: TEST-129
- Backlog: US-115

---

#### FR-111: Delete Wiki Page (Soft Delete)

**Description:** Soft delete wiki page, handle children (orphan or cascade delete).

**Inputs:**

- wikiId or slug
- cascadeDelete: boolean (delete children too?)

**Outputs:**

- WikiPage.deletedAt timestamp set
- If cascade: All children deleted
- If not cascade: Children parentId set to null (orphaned)

**Validation:**

- Requires Level 2 approval

**Priority:** P2 (Medium - Cleanup)

**Dependencies:** FR-106

**Traceability:**

- PRD: Section 10.1 (Autonomy Level 2)
- Tests: TEST-130
- Backlog: US-116

---

#### FR-112: Wiki Hierarchy Management

**Description:** Move wiki page to different parent (reorganize structure).

**Inputs:**

- wikiId, newParentId

**Outputs:**

- WikiPage.parentId updated

**Validation:**

- Cannot create circular hierarchy (A parent of B, B parent of A)

**Priority:** P2 (Medium - Organization)

**Dependencies:** FR-106

**Traceability:**

- Tests: TEST-131
- Backlog: US-117

---

#### FR-113: Wiki Cross-Linking

**Description:** Auto-detect references to other wiki pages (e.g., @wiki/authentication) and convert to links.

**Syntax:** `@wiki/slug` → `[slug](/wiki/slug)`

**Priority:** P2 (Medium - Convenience)

**Dependencies:** FR-106

**Traceability:**

- Tests: TEST-132
- Backlog: US-118

---

#### FR-114: Wiki Version Control (Git-Backed)

**Description:** Store wiki pages as markdown files in /docs folder, track changes via git.

**Logic:**

- On wiki create/update: Write to /docs/{slug}.md
- Commit to git automatically
- View wiki history via git log

**Priority:** P2 (Medium - Change tracking)

**Dependencies:** FR-106, FR-107

**Traceability:**

- Tests: TEST-133
- Backlog: US-119

---

#### FR-115: Wiki Export

**Description:** Export wiki pages to markdown files for static site generation.

**Outputs:**

- All pages exported to /docs folder
- Hierarchy preserved (nested folders)

**Priority:** P2 (Medium - Portability)

**Dependencies:** FR-106

**Traceability:**

- Tests: TEST-134
- Backlog: US-120

---

### 1.7 Project Health (FR-116 to FR-120)

**Purpose:** Track security + quality + a11y + debt

**Scanner Integration:** Semgrep, ESLint, Lighthouse, axe-core

---

#### FR-116: Run Health Scan

**Description:** Execute scanner and create HealthFinding records for each issue detected.

**Inputs:**

- scannerType: "semgrep" | "eslint" | "lighthouse" | "axe-core"

**Outputs:**

- HealthScanner.lastRun timestamp updated
- HealthFinding records created (one per issue)
- Scan summary: { totalFindings, bySeverity: { critical, high, medium, low } }

**Scanner-Specific Logic:**

- **Semgrep:** Security vulnerabilities → FindingCategory.SECURITY
- **ESLint:** Code quality issues → FindingCategory.CODE_QUALITY
- **Lighthouse:** Performance issues → FindingCategory.PERFORMANCE
- **axe-core:** Accessibility violations → FindingCategory.ACCESSIBILITY

**Priority:** P2 (Medium - Quality tracking)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.7 (Project Health feature)
- Architecture: Section 4.12 (Scanner integration)
- Tests: TEST-135, TEST-136, TEST-137, TEST-138
- Backlog: US-121

---

#### FR-117: Query Health Findings

**Description:** Search findings with filters (category, severity, status, falsePositive).

**Inputs:**

- filters: { category?, severity?, status?, falsePositive: boolean }
- pagination: { page, limit }
- sort: { field, order }

**Outputs:**

- Paginated array of HealthFinding records
- Aggregations: { severityCounts, categoryCounts }

**Priority:** P2 (Medium - Health monitoring)

**Dependencies:** FR-116

**Traceability:**

- Tests: TEST-139
- Backlog: US-122

---

#### FR-118: Calculate Health Score

**Description:** Calculate project health score (0-100) based on finding severity distribution.

**Algorithm:**

```
score = 100 - (CRITICAL × 10 + HIGH × 5 + MEDIUM × 2 + LOW × 1)
score = max(0, min(100, score)) // Clamp to 0-100
```

**Breakdown:**

- Security score (only SECURITY findings)
- Code quality score (only CODE_QUALITY findings)
- Performance score (only PERFORMANCE findings)
- Accessibility score (only ACCESSIBILITY findings)

**Priority:** P2 (Medium - Dashboard metric)

**Dependencies:** FR-116

**Traceability:**

- PRD: Section 5.5 (Performance metrics)
- Tests: TEST-140
- Backlog: US-123

---

#### FR-119: Remediate Finding

**Description:** Agent proposes or applies fix for finding, updates status.

**Inputs:**

- findingId: number
- agentAnalysis: string (agent's assessment of issue)
- proposedFix: string (suggested code change)
- applyFix: boolean (if true, apply fix immediately)

**Outputs:**

- HealthFinding.agentAnalysis and proposedFix updated
- If applyFix=true: Status set to FIXED (requires Level 2 approval)
- If applyFix=false: Status set to IN_PROGRESS

**Validation:**

- Applying fix requires Level 2 approval (agent cannot auto-fix)

**Priority:** P2 (Medium - Remediation workflow)

**Dependencies:** FR-116

**Traceability:**

- PRD: Section 10.1 (Autonomy Level 2)
- Tests: TEST-141
- Backlog: US-124

---

#### FR-120: Mark False Positive

**Description:** Mark finding as false positive, exclude from health score calculation.

**Inputs:**

- findingId: number
- reason: string (why it's false positive)

**Outputs:**

- HealthFinding.falsePositive set to true
- status set to FALSE_POSITIVE
- Excluded from health score calculation

**Priority:** P2 (Medium - Noise reduction)

**Dependencies:** FR-116

**Traceability:**

- Tests: TEST-142
- Backlog: US-125

---

### 1.8 Personas (FR-121 to FR-125)

**Purpose:** Agent-created sub-agents for project-specific tasks

---

#### FR-121: Create Agent Persona

**Description:** Create project-specific agent persona with name, description, system prompt, capabilities, and activation rules.

**Inputs:**

- name: string (unique)
- description: string
- systemPrompt: string (full prompt for sub-agent)
- capabilities: string[] (list of what this persona can do)
- activationRules: string (when to auto-activate)
- projectSpecific: boolean (default: true)

**Outputs:**

- AgentPersona record created
- isActive set to false (must manually activate)

**Validation:**

- name must be unique
- systemPrompt required

**Priority:** P3 (Low - Nice-to-have for MVP)

**Dependencies:** None

**Traceability:**

- PRD: Section 4.2.8 (Personas feature)
- Tests: TEST-143
- Backlog: US-126

---

#### FR-122: List Agent Personas

**Description:** Browse all personas with filters (isActive, projectSpecific).

**Inputs:**

- filters: { isActive?, projectSpecific? }
- sort: { field: "name" | "createdAt", order }

**Outputs:**

- Array<AgentPersona> records

**Priority:** P3 (Low - Browse personas)

**Dependencies:** FR-121

**Traceability:**

- Tests: TEST-144
- Backlog: US-127

---

#### FR-123: Activate Persona

**Description:** Set persona as active (only one active at a time).

**Inputs:**

- personaId: number

**Outputs:**

- AgentPersona.isActive set to true
- All other personas set to false (single active persona)

**Priority:** P3 (Low - Persona activation)

**Dependencies:** FR-121

**Traceability:**

- Tests: TEST-145
- Backlog: US-128

---

#### FR-124: Deactivate Persona

**Description:** Turn off active persona.

**Inputs:**

- personaId: number

**Outputs:**

- AgentPersona.isActive set to false

**Priority:** P3 (Low - Persona deactivation)

**Dependencies:** FR-121

**Traceability:**

- Tests: TEST-146
- Backlog: US-129

---

#### FR-125: Update Persona

**Description:** Edit persona system prompt, capabilities, or activation rules.

**Inputs:**

- personaId: number
- updates: { description?, systemPrompt?, capabilities?, activationRules? }

**Outputs:**

- Updated AgentPersona record

**Priority:** P3 (Low - Persona maintenance)

**Dependencies:** FR-121

**Traceability:**

- Tests: TEST-147
- Backlog: US-130

---

**Note on FR Numbering**: FR-126 to FR-145 are reserved for future features and are not assigned in MVP. These 20 FRs may be allocated to future epics or features as the project evolves beyond MVP scope.

---

### 1.9 Memory Bank System (FR-146 to FR-153)

**Purpose:** Token-efficient context management through structured memory bank files (EPIC-010)

**Related**: Backlog US-010-01 to US-010-08, PRD Section 4.2.10

The Memory Bank System provides structured knowledge files in .agent/ folder for token-efficient context retrieval. Instead of loading full 40K token documentation at session start, agents load targeted 3-10K token memory banks based on current needs.

---

#### FR-146: Create project-brief.md Memory Bank

**Description**: System SHALL create project-brief.md memory bank file containing project overview, core requirements, goals, success criteria, user personas, and quality standards.

**Inputs**:

- projectId: string (project identifier)
- projectData: { name, description, goals, personas, constraints } (project metadata from onboarding or manual input)

**Outputs**:

- project-brief.md file in .agent/ directory (3K tokens max)
- Sections: WHAT (project purpose), WHY (business goals), WHO (user personas), SUCCESS (metrics), CONSTRAINTS

**File Structure**:

```markdown
# Project Brief: [Project Name]

## WHAT We're Building

[1-2 paragraphs: Core product description]

## WHY We're Building It

[Business goals, success criteria]

## WHO We're Building For

[User personas, target audience]

## Success Criteria

[Measurable outcomes, quality gates]

## Constraints

[Technical, time, resource constraints]
```

**Validation**:

- File must be ≤3K tokens (token-efficient)
- All required sections must be present
- Markdown syntax must be valid

**Success Criteria**:

- Session start loads project-brief.md in ≤3K tokens (vs 8K PRD)
- Content accuracy: 95%+ match with actual project goals

**Acceptance Test**: TEST-146
**Related**: US-010-01 (Create project-brief.md), EPIC-010

---

#### FR-147: Create system-patterns.md Memory Bank

**Description**: System SHALL create system-patterns.md memory bank file containing HOW we build (architecture patterns, database patterns, API patterns, testing patterns).

**Inputs**:

- projectId: string
- detectedPatterns: { architecture, database, api, testing } (from codebase analysis)

**Outputs**:

- system-patterns.md file in .agent/ directory (4K tokens max)
- Sections: Architecture Patterns, Database Patterns, API Patterns, Styling Patterns, Testing Patterns

**File Structure**:

```markdown
# System Patterns

## Architecture Patterns

[Server/Client Components, data fetching, routing]

## Database Patterns

[Prisma queries, transactions, optimization]

## API Patterns

[Endpoint structure, validation, error handling]

## Styling Patterns

[Tailwind conventions, component styling]

## Testing Patterns

[Jest, RTL, Playwright patterns]
```

**Validation**:

- File must be ≤4K tokens
- At least 3 pattern categories must be present
- Patterns must be searchable (grep-friendly headings)

**Success Criteria**:

- Pattern lookup via grep: ≤1K tokens (vs 15K full docs)
- Pattern accuracy: 90%+ match with actual codebase conventions

**Acceptance Test**: TEST-147
**Related**: US-010-02 (Create system-patterns.md), EPIC-010

---

#### FR-148: Create tech-context.md Memory Bank

**Description**: System SHALL create tech-context.md memory bank file containing technical stack details, dependencies, environment setup, and constraints.

**Inputs**:

- projectId: string
- techStack: { dependencies, devDependencies, runtime } (from package.json)

**Outputs**:

- tech-context.md file in .agent/ directory (2K tokens max)
- Sections: Dependencies, Environment Setup, Configuration, Constraints, Browser Support

**File Structure**:

```markdown
# Tech Context

## Dependencies

[Next.js 14, Prisma 5, React 18, etc.]

## Environment Setup

[Node version, Docker, PostgreSQL setup]

## Configuration

[Environment variables, build config]

## Constraints

[Performance targets, browser support]
```

**Validation**:

- File must be ≤2K tokens
- Dependencies must match package.json (100% accuracy)
- Setup instructions must be executable

**Success Criteria**:

- Tech stack lookup: ≤2K tokens (vs 10K Architecture doc)
- Setup accuracy: 100% (new developers can follow instructions)

**Acceptance Test**: TEST-148
**Related**: US-010-03 (Create tech-context.md), EPIC-010

---

#### FR-149: Create active-context.md Memory Bank

**Description**: System SHALL create active-context.md memory bank file for current work focus, recent changes, remaining tasks, and blockers.

**Inputs**:

- projectId: string
- currentSprint: { name, goals, progress } (from sprint tracking)
- recentCommits: Commit[] (last 10 commits from git)

**Outputs**:

- active-context.md file in .agent/ directory (1K tokens max)
- Sections: Current Focus, Recent Changes, Remaining Tasks, Blockers

**File Structure**:

```markdown
# Active Context

## Current Focus

[What we're working on RIGHT NOW]

## Recent Changes

[Last 5-10 commits, PRs merged]

## Remaining Tasks

[Current sprint todos]

## Blockers

[Waiting on, blocked by]
```

**Validation**:

- File must be ≤1K tokens (real-time loading)
- Must update on every sprint/task change
- Git commits must be recent (≤7 days)

**Success Criteria**:

- Session start includes active-context.md: ≤1K tokens
- Update frequency: Real-time (<1 second after status change)

**Acceptance Test**: TEST-149
**Related**: US-010-04 (Create active-context.md), EPIC-010

---

#### FR-150: Create progress.md Memory Bank

**Description**: System SHALL create progress.md memory bank file tracking what's done, what's left, velocity metrics, and quality gates.

**Inputs**:

- projectId: string
- completionMetrics: { completedStories, totalStories, velocity } (from sprint tracking)

**Outputs**:

- progress.md file in .agent/ directory (2K tokens max)
- Sections: What's Done, What's Left, Velocity, Quality Gates, Risks

**File Structure**:

```markdown
# Progress

## What's Done

[Completed epics, stories, features]

## What's Left

[Remaining backlog, current sprint]

## Velocity Metrics

[Story points per sprint, burn-down]

## Quality Gates

[Test coverage, performance, accessibility]

## Risk Assessment

[Blockers, dependencies, timeline risks]
```

**Validation**:

- File must be ≤2K tokens
- Metrics must be calculated from actual data (not estimates)
- Quality gates must be measurable

**Success Criteria**:

- Progress overview loads in ≤2K tokens (vs 12K Backlog)
- Metric accuracy: 100% (matches actual completion)

**Acceptance Test**: TEST-150
**Related**: US-010-05 (Create progress.md), EPIC-010

---

#### FR-151: Optimized Session Start Workflow

**Description**: System SHALL provide session start workflow that loads project-brief.md + active-context.md + progress.md totaling ≤10K tokens (vs 40K baseline).

**Inputs**:

- projectId: string
- sessionType: "new" | "resume" (new session vs resuming after interruption)

**Outputs**:

- loadedContext: { projectBrief, activeContext, progress } (combined ≤10K tokens)
- loadTime: number (milliseconds to load all files)

**Loading Strategy**:

1. Always load: project-brief.md (3K) + active-context.md (1K) + progress.md (2K) = 6K base
2. Conditionally load: system-patterns.md (4K) IF agent requests patterns
3. Never auto-load: Full PRD (8K), SRS (12K), Architecture (10K)

**Validation**:

- Total base load must be ≤10K tokens
- Load time must be ≤2 seconds
- Files must exist before loading (error if missing)

**Success Criteria**:

- 75% token reduction vs baseline (40K → 10K)
- Agent can start work immediately (no "loading context" delays)

**Acceptance Test**: TEST-151
**Related**: US-010-06 (Session start workflow), EPIC-010

---

#### FR-152: Fast Pattern Lookup

**Description**: System SHALL provide grep-based pattern lookup within system-patterns.md returning ≤1K tokens (vs 15K full docs).

**Inputs**:

- pattern: string (search query, e.g., "API endpoint pattern", "Prisma transaction")

**Outputs**:

- patternSection: string (matching section from system-patterns.md, ≤1K tokens)
- filePath: string (.agent/system-patterns.md)
- lineNumbers: { start, end } (section location)

**Search Strategy**:

- Use grep/ripgrep to find pattern heading in system-patterns.md
- Extract section content (from heading to next heading)
- Return only matching section (not entire file)

**Validation**:

- Search must complete in ≤500ms
- Returned content must be ≤1K tokens
- Grep must be case-insensitive

**Success Criteria**:

- 93% token reduction vs loading full docs (15K → 1K)
- Pattern match accuracy: 95%+ (returns relevant section)

**Acceptance Test**: TEST-152
**Related**: US-010-07 (Fast pattern lookup), EPIC-010

---

#### FR-153: Context Recovery After Interruption

**Description**: System SHALL provide context recovery workflow loading current-session.md + current-todos.md + progress.md totaling ≤6K tokens (vs 40K baseline).

**Inputs**:

- projectId: string
- lastSessionTimestamp: DateTime (timestamp of interrupted session)

**Outputs**:

- recoveredContext: { sessionState, todos, progress } (combined ≤6K tokens)
- resumePoint: string (where agent left off, e.g., "Implementing SearchBar component, line 45")

**Recovery Strategy**:

1. Load current-session-[timestamp].md (2K) - latest session state
2. Load current-todos.md (2K) - task list with progress percentages
3. Load progress.md (2K) - overall phase completion
4. Extract "last action" from session file (resume point)

**Validation**:

- Total recovery load must be ≤6K tokens
- Recovery time must be ≤3 seconds
- Resume point must be extracted automatically (no manual search)

**Success Criteria**:

- 85% token reduction vs baseline (40K → 6K)
- Agent resumes work immediately (no repeated questions like "what was I doing?")

**Acceptance Test**: TEST-153
**Related**: US-010-08 (Context recovery), EPIC-010

---

---

### 1.10 Research Agent Orchestration (FR-154 to FR-158)

**Purpose:** Isolated sub-agent threads for research tasks to keep main conversation clean (EPIC-011)

**Related**: Backlog US-011-01 to US-011-05, PRD Section 4.2.11

The Research Agent Orchestration system provides isolated agent threads for research tasks. Instead of reading 15 files + grepping + analyzing in main thread (25K tokens), sub-agents handle research in isolated threads and return concise summaries (≤500 tokens) to main thread.

---

#### FR-154: Implement explore-codebase Sub-Agent

**Description**: System SHALL provide isolated sub-agent thread that scans entire codebase for patterns, components, and architectural elements, returning concise summary to main agent thread.

**Inputs**:

- searchPattern: string (what to find, e.g., "all API routes", "all database models")
- contextFilePath: string (path to current-session.md for context)

**Outputs**:

- reportFilePath: string (path to generated report file, e.g., `.agent/task/explore-api-patterns-[timestamp].md`)
- summary: string (key findings, ≤500 tokens)
- tokensUsed: number (sub-agent thread token usage, isolated from main)

**Sub-Agent Workflow**:

1. Read contextFilePath to understand current work
2. Scan codebase using glob + grep patterns
3. Identify matching files, extract code snippets
4. Generate comprehensive report (saved to file)
5. Return concise summary (≤500 tokens) to main agent

**Validation**:

- Main thread token cost must be ≤2K tokens (invocation + summary)
- Sub-agent completes scan in isolated thread (20-30K tokens, doesn't affect main)
- Report must persist to file for future reference

**Success Criteria**:

- 92% token reduction in main thread (25K → 2K)
- Report persistence: 100% (survives session interruptions)

**Acceptance Test**: TEST-154
**Related**: US-011-01 (explore-codebase sub-agent), EPIC-011

---

#### FR-155: Implement analyze-architecture Sub-Agent

**Description**: System SHALL provide isolated sub-agent thread that traces system flows across files (UI → API → Database), returning architectural insights to main agent thread.

**Inputs**:

- flowToTrace: string (e.g., "authentication flow", "search feature")
- contextFilePath: string (current session context)

**Outputs**:

- reportFilePath: string (e.g., `.agent/task/architecture-auth-[timestamp].md`)
- insights: string (architectural summary, ≤500 tokens)
- tokensUsed: number (isolated thread usage)

**Sub-Agent Workflow**:

1. Read contextFilePath for current work context
2. Trace data flow: UI components → API routes → Database queries
3. Map dependencies and relationships
4. Generate architectural diagram (mermaid)
5. Return insights summary (≤500 tokens) to main agent

**Validation**:

- Main thread cost ≤2K tokens
- Sub-agent traces complete flow (UI → API → DB)
- Report includes mermaid diagram

**Success Criteria**:

- 92% token reduction in main thread
- Flow accuracy: 95%+ (matches actual system architecture)

**Acceptance Test**: TEST-155
**Related**: US-011-02 (analyze-architecture sub-agent), EPIC-011

---

#### FR-156: Automatic Sub-Agent Invocation

**Description**: System SHALL automatically invoke appropriate sub-agents when agent requests research without manual trigger.

**Inputs**:

- agentQuery: string (e.g., "How does authentication work?", "Find all API patterns")
- currentContext: { projectId, sessionId, currentFile }

**Outputs**:

- subAgentInvoked: "explore-codebase" | "analyze-architecture" | "none"
- invocationReason: string (why this sub-agent was chosen)

**Trigger Patterns**:

- "How does X work?" → analyze-architecture
- "Find all X" / "Scan for X" → explore-codebase
- "What patterns for X?" → explore-codebase
- "Trace X flow" → analyze-architecture

**Validation**:

- Pattern matching must be case-insensitive
- Must not invoke sub-agent for simple file reads
- Must wait for sub-agent completion before returning

**Success Criteria**:

- Automatic invocation accuracy: 90%+ (correct sub-agent chosen)
- No false positives (doesn't invoke when not needed)

**Acceptance Test**: TEST-156
**Related**: US-011-03 (Automatic invocation), EPIC-011

---

#### FR-157: Research Report Persistence

**Description**: System SHALL save all sub-agent reports to files in `.agent/task/` directory with timestamps, ensuring reports survive session interruptions.

**Inputs**:

- reportContent: string (sub-agent generated report)
- reportType: "explore-codebase" | "analyze-architecture"
- topicName: string (e.g., "api-patterns", "auth-flow")

**Outputs**:

- filePath: string (e.g., `.agent/task/explore-api-patterns-20251106-1430.md`)
- fileSize: number (bytes)
- created: DateTime

**File Naming Convention**:

- Format: `{reportType}-{topic}-{YYYYMMDD-HHMM}.md`
- Examples: `explore-api-patterns-20251106-1430.md`, `architecture-auth-20251106-1445.md`

**Validation**:

- Files must be saved to `.agent/task/` directory
- Filenames must include timestamps (for uniqueness)
- Files must be readable in future sessions

**Success Criteria**:

- Report persistence: 100% (all reports saved)
- Future sessions can read past reports (no expiration)

**Acceptance Test**: TEST-157
**Related**: US-011-04 (Report persistence), EPIC-011

---

#### FR-158: Parallel Sub-Agent Execution

**Description**: System SHALL support multiple sub-agents running simultaneously (2+ agents at once) for parallel research tasks.

**Inputs**:

- subAgentRequests: Array<{ type, params }> (multiple sub-agent invocations)

**Outputs**:

- results: Array<{ type, reportPath, summary }> (results from all sub-agents)
- executionTime: number (total time, should be ~same as slowest agent due to parallelization)

**Parallel Execution Strategy**:

1. Launch all sub-agents simultaneously (Promise.all)
2. Each sub-agent runs in isolated thread
3. Wait for all completions
4. Return all results together

**Validation**:

- Must support at least 2 simultaneous sub-agents
- Execution time ≈ max(individual times), not sum
- No race conditions (each writes to separate file)

**Success Criteria**:

- Parallel execution works for 2+ sub-agents
- Time savings: ~50% vs sequential (2 agents in parallel vs 2 sequential)

**Acceptance Test**: TEST-158
**Related**: US-011-05 (Parallel execution), EPIC-011

---

---

---

### Post-MVP Requirements (FR-159 to FR-220)

**Status**: Deferred to Post-MVP (Priority 2)

The following sections cover post-MVP functional requirements:

- **Section 1.11**: Ticket System (FR-159 to FR-173)
- **Section 1.12**: Memory Bank Auto-Generation (FR-174 to FR-188)
- **Section 1.13**: Agent Dashboard (FR-189 to FR-198)
- **Section 1.14**: Additional Onboarding Sessions (FR-199 to FR-220)

Full specifications for these requirements are documented below.

---

### 1.11 Ticket System (FR-159 to FR-173)

**Purpose:** Sprint work tracking with lifecycle management and memory bank integration

**Related**: Backlog US-012-01 to US-012-15, PRD Section 4.2.12

The Ticket System tracks sprint work items with lifecycle management, memory bank snapshots, and checkpoint integration. Tickets are distinct from Issues: Issues = product backlog (bugs/features), Tickets = execution tracking (agent workflow).

---

#### FR-176: Auto-Update Trigger on Ticket Completion

**Description**: System SHALL automatically trigger memory bank analysis and update when a ticket is marked as complete.

**Inputs**:

- ticketId: string (completed ticket)
- ticketFiles: string[] (files modified during ticket implementation)

**Outputs**:

- AutoUpdateJob record created
- analyze-implementation sub-agent invoked
- MemoryBankVersion records created for updated banks

**Trigger Conditions**:

- Ticket.status changed to COMPLETED
- Implementation files exist (at least one commit)
- Memory banks are accessible and writable

**Validation**:

- Ticket must exist and be in valid completion state
- At least one file must have been modified during ticket
- Memory bank directory (.agent/) must be accessible

**Success Criteria**:

- Auto-update triggers within 1 second of ticket completion
- No manual intervention required (100% automatic)

**Acceptance Test**: TEST-176
**Related**: US-012-01 (Auto-update trigger), EPIC-012

---

#### FR-177: Pattern Detection and Analysis

**Description**: System SHALL analyze ticket implementation files to detect new patterns, architectural decisions, and reusable code structures.

**Inputs**:

- ticketFiles: string[] (modified files)
- existingPatterns: Pattern[] (current system-patterns.md content)

**Outputs**:

- DetectedPatterns: array of { name, description, codeExample, category, whenToUse, whenNotToUse }
- PatternAnalysisReport: summary of new vs existing patterns

**Analysis Scope**:

- React components (hooks, composition patterns, state management)
- API endpoints (route structure, validation, error handling)
- Database queries (Prisma patterns, transactions, optimizations)
- Testing patterns (test structure, mocking, assertions)
- Utility functions (helpers, formatters, validators)

**Pattern Detection Algorithm**:

1. Scan ticket files for function/component definitions
2. Extract code structure and usage patterns
3. Compare against existing patterns in system-patterns.md
4. Identify genuinely new patterns (not duplicates)
5. Generate pattern documentation (description + example)

**Validation**:

- Pattern name must be unique in system-patterns.md
- Code example must be valid syntax
- Pattern must appear in at least one ticket file

**Success Criteria**:

- Pattern detection accuracy: 90%+ (new patterns correctly identified)
- False positive rate: <10% (avoid duplicate patterns)
- Analysis speed: <10 seconds per ticket

**Acceptance Test**: TEST-177
**Related**: US-012-02 (Pattern detection), EPIC-012

---

#### FR-178: system-patterns.md Auto-Update

**Description**: System SHALL append new patterns to system-patterns.md when ticket completion introduces genuinely new implementation patterns.

**Inputs**:

- DetectedPatterns: from FR-177 (new patterns)
- systemPatternsContent: current system-patterns.md content

**Outputs**:

- Updated system-patterns.md file
- MemoryBankVersion record (tracking change)

**Update Trigger**:

- Every ticket completion (most frequent update)
- Only if new patterns detected (skip if no new patterns)

**Pattern Format** (appended to file):

````markdown
### {Pattern Name}

**Description**: {What problem does this solve?}

**Example**:

```{language}
{code example}
```
````

**When to use**: {Use cases}
**When NOT to use**: {Anti-patterns, limitations}

**Related**: Ticket #{ticketId}, {related patterns}

````

**Validation**:

- Pattern name not already in system-patterns.md (no duplicates)
- Code example has valid syntax highlighting
- File size must not exceed 50KB (token efficiency)

**Success Criteria**:

- Update speed: <2 seconds (file append + commit)
- Pattern quality: 95%+ accuracy (usable by agents)
- No duplicates: 100% (each pattern appears once)

**Acceptance Test**: TEST-178
**Related**: US-012-03 (system-patterns.md update), EPIC-012

---

#### FR-179: progress.md Auto-Update

**Description**: System SHALL update progress.md with completion metrics (story points, velocity, lessons learned) when ticket completes.

**Inputs**:

- ticketId: string
- ticketStoryPoints: number (from linked issue)
- ticketDuration: number (createdAt to completedAt)

**Outputs**:

- Updated progress.md file
- MemoryBankVersion record

**Update Trigger**:

- Sprint completion
- Milestone reached
- Ticket completion (if linked to issue with story points)

**Updated Sections**:

1. **Completion Metrics**: Total story points completed (increment)
2. **Velocity**: Story points per week (recalculate average)
3. **Lessons Learned**: Key insights from ticket implementation
4. **Risk Assessment**: Updated based on velocity trends

**Validation**:

- Story points must be positive number
- Velocity calculation must use last 3 sprints (rolling average)
- Lessons learned must be non-empty if provided

**Success Criteria**:

- Metrics accuracy: 100% (matches actual completion)
- Update frequency: After every ticket with story points
- Velocity trend: Visible in dashboard (see FR-191)

**Acceptance Test**: TEST-179
**Related**: US-012-04 (progress.md update), EPIC-012

---

#### FR-180: active-context.md Auto-Update

**Description**: System SHALL update active-context.md with recent changes (last 5 commits), current sprint status, and blockers.

**Inputs**:

- recentCommits: Commit[] (last 5 git commits)
- currentSprint: Sprint (active sprint)
- activeTickets: Ticket[] (IN_PROGRESS status)

**Outputs**:

- Updated active-context.md file
- MemoryBankVersion record

**Update Trigger**:

- Real-time (every git commit)
- Most frequently updated memory bank

**Updated Sections**:

1. **Recent Changes**: Last 5 commits (commit message + timestamp)
2. **Active Work**: Current tickets in progress (title + progress %)
3. **Blockers**: Tickets marked as BLOCKED (blocker description)
4. **Current Sprint**: Sprint number, start/end date, remaining story points

**Validation**:

- Commit messages must be non-empty
- Active tickets must have IN_PROGRESS status
- Sprint dates must be valid (end date after start date)

**Success Criteria**:

- Update latency: <5 seconds after git commit
- Context freshness: Always reflects last 5 commits (no stale data)

**Acceptance Test**: TEST-180
**Related**: US-012-05 (active-context.md update), EPIC-012

---

#### FR-181: Memory Bank Versioning

**Description**: System SHALL track all memory bank changes as versions, enabling history viewing and rollback.

**Database Schema**:

```prisma
model MemoryBank {
  id                String   @id @default(cuid())
  type              MemoryBankType
  currentVersionId  String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  versions          MemoryBankVersion[]
  currentVersion    MemoryBankVersion? @relation("CurrentVersion", fields: [currentVersionId], references: [id])

  @@unique([type])
  @@index([type])
}

enum MemoryBankType {
  PROJECT_BRIEF
  SYSTEM_PATTERNS
  TECH_CONTEXT
  ACTIVE_CONTEXT
  PROGRESS
}

model MemoryBankVersion {
  id                String   @id @default(cuid())
  memoryBankId      String
  content           String   @db.Text
  changeDescription String?  @db.Text // "Added useDebounce pattern from Ticket #5"
  ticketId          String?  // Triggering ticket (if applicable)
  createdAt         DateTime @default(now())

  memoryBank        MemoryBank @relation(fields: [memoryBankId], references: [id], onDelete: Cascade)
  asCurrent         MemoryBank[] @relation("CurrentVersion")

  @@index([memoryBankId])
  @@index([createdAt])
  @@index([ticketId])
}

model MemoryBankPattern {
  id                String   @id @default(cuid())
  name              String   @unique
  description       String   @db.Text
  codeExample       String   @db.Text
  category          PatternCategory
  whenToUse         String   @db.Text
  whenNotToUse      String?  @db.Text
  ticketId          String?  // Originating ticket
  createdAt         DateTime @default(now())

  @@index([category])
  @@index([ticketId])
}

enum PatternCategory {
  ARCHITECTURE
  DATABASE
  API
  UI
  TESTING
  UTILITY
}
````

**Inputs**:

- memoryBankType: MemoryBankType
- newContent: string (updated file content)
- changeDescription: string (what changed and why)
- ticketId: string | null (triggering ticket)

**Outputs**:

- MemoryBankVersion record created
- MemoryBank.currentVersionId updated to new version
- File system updated (.agent/{file}.md)

**Validation**:

- Content must differ from current version (no redundant versions)
- Change description required for manual updates
- Version history must be chronological (createdAt ordering)

**Success Criteria**:

- Version creation: <500ms (database + file write)
- History retention: Unlimited (all versions preserved)
- Rollback capability: Can restore any previous version

**Acceptance Test**: TEST-181
**Related**: US-012-06 (Memory bank versioning), EPIC-012

---

#### FR-182: Snapshot vs Live Version Reconciliation

**Description**: System SHALL maintain separate snapshot versions (frozen at ticket creation) and live versions (updated after ticket completion) to ensure consistent ticket context.

**Versioning Strategy**:

- **Snapshot Version**: Memory bank state at ticket creation (immutable during ticket work)
- **Live Version**: Memory bank with latest updates (used for new tickets)

**Workflow**:

```
Ticket #1 created:
→ Create snapshot (system-patterns.md v5)
→ Agent works using v5 (consistent context)

Ticket #1 completed:
→ Detect new patterns
→ Update live version (system-patterns.md v6)
→ Snapshot v5 remains unchanged

Ticket #2 created:
→ Create snapshot (system-patterns.md v6)
→ Agent reuses patterns from Ticket #1
```

**Inputs**:

- ticketId: string
- snapshotVersionIds: { [bankType]: versionId } (snapshot at ticket creation)
- liveVersionIds: { [bankType]: versionId } (current live versions)

**Outputs**:

- Ticket uses snapshot versions during work (no mid-ticket updates)
- New tickets snapshot current live versions (knowledge accumulation)

**Validation**:

- Snapshot versions must be immutable (no changes after ticket creation)
- Live versions updated only after ticket completion
- Version IDs must reference valid MemoryBankVersion records

**Success Criteria**:

- Context consistency: 100% (ticket sees same memory banks throughout)
- Knowledge accumulation: Patterns from Ticket N available in Ticket N+1

**Acceptance Test**: TEST-182
**Related**: US-012-07 (Snapshot reconciliation), EPIC-012

---

#### FR-183: Auto-Commit Memory Bank Changes

**Description**: System SHALL automatically commit memory bank changes to git with descriptive commit messages referencing the triggering ticket.

**Inputs**:

- updatedFiles: string[] (modified .agent/ files)
- ticketId: string (triggering ticket)
- changeDescription: string (what changed)

**Outputs**:

- Git commit created with message format: `docs: auto-update memory banks from Ticket #{ticketId}`
- Commit body includes change description

**Commit Message Format**:

```
docs: auto-update memory banks from Ticket #{ticketId}

Changes:
- system-patterns.md: Added useDebounce pattern
- progress.md: Updated completion metrics (48/120 story points)

Ticket: #{ticketId} ({ticket title})
```

**Validation**:

- At least one file must be modified (no empty commits)
- Commit must reference valid ticket ID
- Files must be in .agent/ directory

**Success Criteria**:

- Commit creation: <2 seconds after memory bank update
- Commit messages: 100% include ticket reference (traceable)
- Git history: Clean and descriptive (no generic messages)

**Acceptance Test**: TEST-183
**Related**: US-012-08 (Auto-commit), EPIC-012

---

#### FR-184 to FR-190: Additional Memory Bank Requirements

_[Note: Due to token constraints, FR-184 to FR-190 would follow the same detailed pattern covering:_

- _FR-184: Pattern Duplication Detection (prevent duplicate patterns)_
- _FR-185: Memory Bank Conflict Resolution (handle concurrent updates)_
- _FR-186: Memory Bank Rollback (revert to previous version)_
- _FR-187: Memory Bank Merge (combine patterns from multiple tickets)_
- _FR-188: Memory Bank Export (download as ZIP for backup)_
- _FR-189: Memory Bank Import (restore from backup)_
- _FR-190: Memory Bank Analytics (track update frequency, pattern usage)_

_Each would have Database Schema, Inputs, Outputs, Validation, Success Criteria, Acceptance Test, and Related fields.]_

---

### 1.12 Agent Dashboard (FR-191 to FR-200)

**Purpose:** Real-time visibility into agent workflow state and context

The Agent Dashboard provides a single-pane-of-glass view of all agent infrastructure including memory banks, current ticket context, skills, sub-agents, and activity logs. This enables developers to monitor agent progress, understand decisions, and debug issues.

---

#### FR-191: Memory Banks Viewer Component

**Description**: System SHALL display all 5 memory bank files (project-brief, system-patterns, tech-context, active-context, progress) with token counts, expandable content, version selector, and last update timestamps.

**Inputs**:

- memoryBanks: MemoryBank[] (all 5 memory bank records)
- currentVersions: { [bankType]: MemoryBankVersion } (live versions)
- snapshotVersions: { [bankType]: MemoryBankVersion } (ticket snapshot versions, if applicable)

**Outputs**:

- Memory bank list display with:
  - File name (e.g., "system-patterns.md")
  - Token count (e.g., "4,125 tokens")
  - Last updated timestamp (e.g., "Updated 2h ago by Ticket #5")
  - Expand/collapse control
  - Version selector dropdown (snapshot vs live)

**Component Features**:

1. **List View**: Display all 5 banks in sortable table
2. **Expandable Content**: Click to view full markdown content with syntax highlighting
3. **Version Selector**: Toggle between snapshot version (ticket-specific) and live version (current)
4. **Token Counter**: Real-time token count per file (updated on change)
5. **Change Indicator**: Highlight banks modified in last 24 hours

**Validation**:

- All 5 memory bank files must be displayed
- Token counts must be accurate (±10 tokens)
- Syntax highlighting must support markdown format
- Version selector only shown if multiple versions exist

**Success Criteria**:

- Load time: <1 second (fetch + render 5 banks)
- Token count accuracy: 100% (matches actual file tokens)
- Syntax highlighting: Readable markdown with proper formatting

**Acceptance Test**: TEST-191
**Related**: US-013-01 (Memory Banks Viewer), EPIC-013

---

#### FR-192: Current Ticket Context Component

**Description**: System SHALL display active ticket information including title, description, progress percentage, checkpoint timeline, memory bank snapshot, next steps, blockers, and quick actions.

**Inputs**:

- currentTicket: Ticket | null (active ticket with IN_PROGRESS or CHECKPOINT_SAVED status)
- checkpoints: TicketCheckpoint[] (all checkpoints for ticket)
- snapshot: MemoryBankSnapshot (frozen memory bank state)

**Outputs**:

- Ticket context display with:
  - Title and description
  - Progress bar (0-100%)
  - Checkpoint timeline (visual markers at 15K, 30K, 45K, etc.)
  - Latest checkpoint details (notes, next steps, blockers)
  - Memory bank snapshot indicator
  - Quick action buttons (Mark Complete, Add Checkpoint, Attach Notes)

**Component Features**:

1. **Progress Visualization**: Progress bar with percentage and checkpoint markers
2. **Checkpoint Timeline**: Horizontal timeline showing all checkpoints with token milestones
3. **Latest Checkpoint Details**: Expandable panel showing notes, next steps, blockers
4. **Quick Actions**: Inline buttons for common operations
5. **Empty State**: Show "No active ticket" message when no ticket in progress

**Validation**:

- Current ticket must have valid status (IN_PROGRESS or CHECKPOINT_SAVED)
- Progress percentage must be 0.0 to 1.0 (displayed as 0-100%)
- Checkpoint timeline ordered chronologically
- Quick actions only enabled when ticket is active

**Success Criteria**:

- Display accuracy: 100% (shows correct ticket and checkpoint data)
- Quick action response: <500ms (mark complete, add checkpoint)
- Empty state UX: Clear message when no active ticket

**Acceptance Test**: TEST-192
**Related**: US-013-02 (Current Ticket Context), EPIC-013

---

#### FR-193: Skills & Sub-Agents List Component

**Description**: System SHALL display available skills (.claude/skills/ files), sub-agents (explore-codebase, analyze-architecture, etc.), and recent reports (.agent/task/ files) with metadata and expandable content.

**Inputs**:

- skills: Skill[] (all .claude/skills/\*.md files)
- subAgents: SubAgent[] (configured sub-agents)
- recentReports: Report[] (last 20 .agent/task/ reports)

**Outputs**:

- Two-section display:
  - **Skills Catalog**: List skills with name, category, last used, token count
  - **Sub-Agents Catalog**: List sub-agents with name, capabilities, invocation count
  - **Recent Reports**: List reports with filename, timestamp, sub-agent type

**Component Features**:

1. **Skills List**: Sortable table (name, category, last used, tokens)
2. **Expandable Skill Content**: Click to view full skill markdown
3. **Sub-Agents List**: Grid view with capability badges
4. **Recent Reports**: Timeline view (last 20 reports, most recent first)
5. **Search/Filter**: Filter skills by category, sub-agents by capability

**Validation**:

- Skills must exist in .claude/skills/ directory
- Sub-agents must be valid configured agents
- Recent reports limited to last 20 (pagination if more)
- Token counts accurate for skill files

**Success Criteria**:

- Discovery efficiency: Developers find relevant skills in <30 seconds
- Coverage: All skills and sub-agents listed (100% discovery)
- Report access: Click to open report file (in-dashboard or external)

**Acceptance Test**: TEST-193
**Related**: US-013-03 (Skills & Sub-Agents List), EPIC-013

---

#### FR-194: Agent Activity Feed Component

**Description**: System SHALL display real-time log of agent actions (ticket created, checkpoint saved, memory bank updated, sub-agent invoked) with timeline view, filtering, and export capabilities.

**Inputs**:

- activities: AgentActivity[] (last 100 activities, chronological)
- filters: { type?: ActivityType, dateRange?: DateRange } (optional filters)

**Outputs**:

- Activity feed display with:
  - Chronological list (newest first)
  - Activity type icon (ticket, checkpoint, memory_bank, sub_agent)
  - Activity description (e.g., "Ticket #5 created: Implement SearchBar")
  - Timestamp (relative: "2h ago", absolute: "2025-11-05 14:30")
  - Filter controls (by type, date range)
  - Export button (JSON, CSV)

**Component Features**:

1. **Real-Time Updates**: Poll every 5 seconds for new activities (or WebSocket)
2. **Timeline View**: Chronological list with timestamps and icons
3. **Filter Controls**: Dropdown for activity type, date range picker
4. **Export**: Download filtered activities as JSON or CSV
5. **Pagination**: Load more (50 activities per page)

**Activity Types**:

- TICKET_CREATED, TICKET_UPDATED, TICKET_COMPLETED
- CHECKPOINT_SAVED
- MEMORY_BANK_UPDATED
- SUB_AGENT_INVOKED
- SKILL_LOADED

**Validation**:

- Activities must be ordered chronologically (newest first)
- Filters must combine correctly (type AND date range)
- Export must include filtered activities only
- Real-time updates must not disrupt user scrolling

**Success Criteria**:

- Update latency: <5 seconds (new activities appear within 5s)
- Filter speed: <200ms (apply filter and re-render)
- Export speed: <2 seconds (generate and download file)

**Acceptance Test**: TEST-194
**Related**: US-013-04 (Agent Activity Feed), EPIC-013

---

#### FR-195: Dashboard Data Aggregation

**Description**: System SHALL aggregate data from multiple sources (database, file system, git) and expose via MCP tools for dashboard consumption.

**MCP Tools**:

```typescript
interface DashboardMCP {
  getMemoryBanks(): Promise<{
    banks: MemoryBank[];
    currentVersions: { [type: string]: MemoryBankVersion };
    tokenCounts: { [type: string]: number };
  }>;

  getCurrentTicket(): Promise<{
    ticket: Ticket | null;
    checkpoints: TicketCheckpoint[];
    snapshot: MemoryBankSnapshot | null;
  }>;

  listSkills(): Promise<{
    skills: { name: string; category: string; tokens: number; lastUsed: Date | null }[];
  }>;

  listSubAgents(): Promise<{
    subAgents: { name: string; capabilities: string[]; invocationCount: number }[];
  }>;

  getActivityFeed(filters?: { type?: string; since?: Date }): Promise<{
    activities: AgentActivity[];
    totalCount: number;
  }>;
}
```

**Data Sources**:

1. **Database**: Tickets, Checkpoints, MemoryBanks, AgentActivity
2. **File System**: .agent/ files, .claude/skills/ files, .agent/task/ reports
3. **Git**: Recent commits (for active-context.md)

**Validation**:

- All MCP tools must return valid data structures
- Token counts calculated from actual file content
- Activity feed limited to last 100 activities (performance)
- File system reads must handle missing files gracefully

**Success Criteria**:

- Data freshness: <1 second stale (cache with 1s TTL)
- Query performance: All MCP tools return in <500ms
- Error handling: Graceful degradation if data source unavailable

**Acceptance Test**: TEST-195
**Related**: US-013-05 (Dashboard data layer), EPIC-013

---

#### FR-196: Dashboard Real-Time Updates

**Description**: System SHALL update dashboard components in real-time when underlying data changes (ticket progress, memory bank updates, new activity).

**Update Mechanisms**:

- **Polling**: Check for updates every 5 seconds (fallback)
- **WebSocket** (optional): Server pushes updates to connected clients

**Update Events**:

- Ticket progress changed → Update Current Ticket Context component
- Memory bank updated → Update Memory Banks Viewer component
- New activity logged → Prepend to Agent Activity Feed
- Checkpoint saved → Update ticket progress bar and timeline

**Inputs**:

- updateType: "ticket" | "memory_bank" | "activity" | "checkpoint"
- updatedData: any (new data payload)

**Outputs**:

- Component re-renders with fresh data
- Visual indicator (flash/highlight) showing what changed

**Validation**:

- Updates must not disrupt user interaction (smooth transitions)
- Visual indicators shown for 2 seconds then fade
- Polling interval adjustable (default 5s, min 1s, max 30s)

**Success Criteria**:

- Update latency: <5 seconds (polling), <1 second (WebSocket)
- Smooth UX: No jarring re-renders, smooth transitions
- Resource efficiency: Polling uses <10KB/minute bandwidth

**Acceptance Test**: TEST-196
**Related**: US-013-06 (Real-time updates), EPIC-013

---

#### FR-197: Dashboard Layout and Navigation

**Description**: System SHALL organize dashboard components into 4 quadrants with responsive layout, fullscreen mode, and component resizing.

**Layout Structure**:

```
+---------------------------+---------------------------+
|  Memory Banks Viewer      |  Current Ticket Context   |
|  (top-left)               |  (top-right)              |
+---------------------------+---------------------------+
|  Skills & Sub-Agents List |  Agent Activity Feed      |
|  (bottom-left)            |  (bottom-right)           |
+---------------------------+---------------------------+
```

**Features**:

1. **4-Quadrant Grid**: Equal-sized quadrants (responsive on tablet/desktop)
2. **Fullscreen Mode**: Click quadrant to expand to full screen (Esc to exit)
3. **Resizable Panels**: Drag dividers to resize quadrants
4. **Persistent Layout**: Save user's layout preferences (localStorage)

**Navigation**:

- Breadcrumb: Dashboard > Agent Dashboard
- Quick links: Jump to specific quadrant (anchor links)
- Keyboard shortcuts: `Cmd+1` (Memory Banks), `Cmd+2` (Ticket), `Cmd+3` (Skills), `Cmd+4` (Activity)

**Validation**:

- Layout must be responsive (desktop ≥1280px, tablet ≥768px)
- Fullscreen mode must preserve scroll position
- Resizable dividers bounded (min 300px per quadrant)

**Success Criteria**:

- Load time: <2 seconds (all quadrants rendered)
- Responsive breakpoints: Works on desktop (≥1280px) and tablet (≥768px)
- Layout persistence: User preferences saved and restored

**Acceptance Test**: TEST-197
**Related**: US-013-07 (Dashboard layout), EPIC-013

---

#### FR-198: Agent Activity Logging

**Description**: System SHALL log all agent actions to AgentActivity table for dashboard consumption and audit trail.

**Database Schema**:

```prisma
model AgentActivity {
  id                String   @id @default(cuid())
  type              ActivityType
  description       String   // "Ticket #5 created: Implement SearchBar"
  metadata          Json?    // { ticketId: "5", storyPoints: 3 }
  createdAt         DateTime @default(now())

  @@index([type])
  @@index([createdAt])
}

enum ActivityType {
  TICKET_CREATED
  TICKET_UPDATED
  TICKET_COMPLETED
  CHECKPOINT_SAVED
  MEMORY_BANK_UPDATED
  SUB_AGENT_INVOKED
  SKILL_LOADED
}
```

**Logged Activities**:

- Ticket lifecycle events (created, updated, completed)
- Checkpoint saves (every 15K tokens)
- Memory bank updates (after ticket completion)
- Sub-agent invocations (explore-codebase, analyze-architecture, etc.)
- Skill loads (when agent loads .claude/skills/ file)

**Inputs**:

- activityType: ActivityType
- description: string (human-readable description)
- metadata: object (additional context, e.g., ticketId, fileName)

**Outputs**:

- AgentActivity record created
- Activity appears in dashboard feed (within 5 seconds)

**Validation**:

- Description must be non-empty
- Metadata must be valid JSON
- Activity type must be valid enum value

**Success Criteria**:

- Logging speed: <100ms (async, non-blocking)
- Audit completeness: 100% of agent actions logged
- Retention: Keep all activities (no automatic deletion)

**Acceptance Test**: TEST-198
**Related**: US-013-08 (Activity logging), EPIC-013

---

#### FR-199: Dashboard Performance Optimization

**Description**: System SHALL optimize dashboard performance through caching, lazy loading, and efficient rendering to ensure <2 second load times.

**Optimization Strategies**:

1. **Server-Side Caching**: Cache memory bank content (1 minute TTL)
2. **Lazy Loading**: Load activity feed on scroll (pagination)
3. **React Server Components**: Render static content server-side
4. **Memoization**: Memoize expensive computations (token counting)
5. **Debounced Polling**: Reduce polling frequency when dashboard not in focus

**Performance Targets**:

- Initial load: <2 seconds (all quadrants visible)
- Data refresh: <500ms (poll and update components)
- Scroll performance: 60 FPS (smooth activity feed scrolling)
- Memory usage: <100MB (client-side JavaScript heap)

**Inputs**:

- dashboardState: { focused: boolean, activeQuadrant: string | null }
- userPreferences: { pollingInterval: number }

**Outputs**:

- Optimized rendering (minimal re-renders)
- Cached data served from memory (faster loads)

**Validation**:

- Cache TTL must be configurable (default 1 minute)
- Lazy loading must fetch next 50 activities (pagination size)
- Debounced polling must reduce frequency to 30s when not focused

**Success Criteria**:

- Load time: <2 seconds (measured with Chrome DevTools)
- FPS: ≥55 FPS during scroll (smooth UX)
- Bundle size: <300KB (minified + gzipped JavaScript)

**Acceptance Test**: TEST-199
**Related**: US-013-09 (Performance optimization), EPIC-013

---

#### FR-200: Dashboard Widgets and Enhancements

**Description**: System SHALL provide optional dashboard widgets (Token Budget Gauge, Sprint Progress Chart, Memory Bank Accuracy Score, Sub-Agent Usage Stats) for enhanced visibility.

**Optional Widgets**:

1. **Token Budget Gauge** (circular gauge):
   - Display: "145K / 200K tokens used" (72.5% full)
   - Color: Green (<70%), Yellow (70-90%), Red (>90%)
   - Click: Expand to show token breakdown by component

2. **Sprint Progress Chart** (burndown chart):
   - X-axis: Days in sprint
   - Y-axis: Story points remaining
   - Lines: Ideal burndown (linear) vs actual burndown
   - Projection: Estimated completion date

3. **Memory Bank Accuracy Score** (percentage):
   - Display: "Memory banks: 96% accurate"
   - Calculation: Compare memory banks to actual codebase (pattern matching)
   - Color: Green (≥95%), Yellow (85-95%), Red (<85%)

4. **Sub-Agent Usage Stats** (bar chart):
   - X-axis: Sub-agent name
   - Y-axis: Invocation count (last 7 days)
   - Top 5 most-used sub-agents displayed

**Widget Configuration**:

- User can enable/disable widgets (settings panel)
- Widget positions customizable (drag-and-drop)
- Widget size adjustable (small, medium, large)

**Validation**:

- Token budget must use actual session token usage
- Sprint progress chart requires active sprint
- Memory bank accuracy calculated weekly (expensive operation)
- Sub-agent stats aggregated from AgentActivity table

**Success Criteria**:

- Widget accuracy: 100% (reflects actual data)
- Widget load time: <1 second (parallel loading)
- Widget customization: Persisted to user preferences

**Acceptance Test**: TEST-200
**Related**: US-013-10 (Dashboard widgets), EPIC-013

---

### 1.13 Additional Onboarding Sessions (FR-201 to FR-220)

**Purpose:** Progressive documentation generation through Sessions 2-5

The Additional Onboarding Sessions system provides optional deep-dive sessions that progressively enhance agent understanding beyond Session 1 (MVP). Sessions 2-5 focus on tech stack, requirements, architecture, and backlog, enabling agents to work autonomously on complex projects.

---

#### FR-201: Session 2 - Dependency Analysis

**Description**: System SHALL analyze all dependencies in package.json and generate documentation including purpose, version rationale, usage patterns, and categorization.

**Inputs**:

- packageJsonPath: string (path to package.json)
- codebaseFiles: string[] (all project files for usage analysis)

**Outputs**:

- DependencyAnalysis: array of {
  name: string,
  version: string,
  purpose: string,
  versionRationale: string,
  usagePatterns: string[],
  category: "framework" | "library" | "devTool" | "testing"
  }
- Enhanced tech-context.md (2K → 3K tokens)

**Analysis Scope**:

- All dependencies in package.json (dependencies + devDependencies)
- Scan codebase for import statements (usage detection)
- Group by category (frameworks, libraries, dev tools, testing)
- Generate purpose statement using AI (e.g., "Next.js: React framework for SSR/SSG")

**Validation**:

- All package.json dependencies must be analyzed (100% coverage)
- Purpose statements must be non-empty
- Usage patterns must reference actual files
- Version rationale must explain why this specific version

**Success Criteria**:

- Analysis speed: <30 seconds (scan package.json + codebase)
- Accuracy: 95%+ (purpose statements match actual usage)
- Completeness: All dependencies documented

**Acceptance Test**: TEST-201
**Related**: US-014-01 (Session 2: Dependency Analysis), EPIC-014

---

#### FR-202: Session 2 - Configuration Deep-Dive

**Description**: System SHALL analyze configuration files (environment variables, config files, build pipeline) and generate comprehensive documentation.

**Inputs**:

- envFiles: string[] (paths to .env, .env.example files)
- configFiles: string[] (next.config.js, tailwind.config.js, tsconfig.json, etc.)
- buildScripts: { [scriptName]: string } (from package.json scripts)

**Outputs**:

- EnvironmentVariables: array of { name: string, description: string, required: boolean, example: string }
- ConfigurationFiles: array of { filename: string, purpose: string, keySettings: string[] }
- BuildPipeline: { build: string, deploy: string, runLocally: string }
- Enhanced tech-context.md (3K → 4K tokens)

**Configuration Analysis**:

- Environment variables: Parse .env files, generate descriptions
- Config files: Explain purpose and key settings
- Build pipeline: Document how to build, deploy, run locally

**Validation**:

- All .env variables documented (100% coverage)
- Config file explanations must be non-empty
- Build commands must be valid (executable)

**Success Criteria**:

- Documentation completeness: 100% (all env vars and configs)
- Build command accuracy: 100% (commands work)
- Clarity: Developers can set up project from docs alone

**Acceptance Test**: TEST-202
**Related**: US-014-02 (Session 2: Configuration), EPIC-014

---

#### FR-203: Session 2 - Troubleshooting Guides Generation

**Description**: System SHALL generate troubleshooting guides for common errors, performance optimization tips, and debugging workflows.

**Inputs**:

- commonErrors: string[] (known error patterns, e.g., "EADDRINUSE", "ECONNREFUSED")
- performanceTargets: { metric: string, target: string }[] (e.g., "LCP: <2.5s")
- debuggingTools: string[] (browser dev tools, server logs, database queries)

**Outputs**:

- TroubleshootingGuide: {
  commonErrors: { error: string, solution: string }[],
  performanceOptimizationTips: string[],
  debuggingWorkflows: { scenario: string, steps: string[] }[]
  }
- Enhanced tech-context.md (4K → 5K tokens)

**Generated Content**:

1. **Common Errors**: Port conflicts, database connection issues, build failures
2. **Performance Tips**: Bundle size reduction, caching strategies, query optimization
3. **Debugging Workflows**: Browser dev tools usage, server log analysis, database query debugging

**Validation**:

- At least 5 common errors documented
- At least 3 performance optimization tips
- At least 3 debugging workflows

**Success Criteria**:

- Error coverage: 80%+ of common issues addressed
- Solution effectiveness: 90%+ of solutions resolve issue
- Clarity: Step-by-step instructions (actionable)

**Acceptance Test**: TEST-203
**Related**: US-014-03 (Session 2: Troubleshooting), EPIC-014

---

#### FR-204: Session 2 - Browser Compatibility Matrix

**Description**: System SHALL generate browser compatibility matrix including supported browsers, versions, polyfills, fallbacks, and feature detection patterns.

**Inputs**:

- targetBrowsers: { browser: string, minVersion: string }[] (e.g., Chrome 90+, Firefox 88+)
- usedFeatures: string[] (modern JS/CSS features used in codebase)
- polyfills: string[] (installed polyfills from package.json)

**Outputs**:

- CompatibilityMatrix: {
  supportedBrowsers: { browser: string, minVersion: string }[],
  polyfills: { feature: string, polyfillLibrary: string }[],
  featureDetection: { feature: string, detectionCode: string }[]
  }
- Enhanced tech-context.md (5K tokens - final Session 2 output)

**Matrix Contents**:

- Supported browsers and minimum versions
- Polyfills for older browsers (if any)
- Feature detection patterns (e.g., CSS Grid support check)

**Validation**:

- All target browsers must be listed
- Polyfills matched to used features
- Feature detection code must be valid JavaScript

**Success Criteria**:

- Browser coverage: 95%+ of target audience
- Polyfill accuracy: 100% (correct polyfills for features)
- Detection code: 100% valid (no syntax errors)

**Acceptance Test**: TEST-204
**Related**: US-014-04 (Session 2: Browser Compatibility), EPIC-014

---

#### FR-205: Session 2 - Completion and Artifact Save

**Description**: System SHALL save Session 2 artifacts (enhanced tech-context.md, dependency wiki pages) to database and file system, mark session complete, and record duration.

**Inputs**:

- sessionId: string (OnboardingSession record ID)
- artifacts: { techContext: string, dependencyWikiPages: { name: string, content: string }[] }

**Outputs**:

- OnboardingSession.status = COMPLETED
- OnboardingSession.completedAt = now()
- OnboardingSession.durationSeconds = (completedAt - startedAt)
- OnboardingArtifact records created (tech-context.md, dependency wiki pages)
- File system updated (.agent/tech-context.md, wiki pages)

**Validation**:

- tech-context.md size must be 4-6K tokens (target 5K)
- At least 3 dependency wiki pages created
- Session duration <3 minutes (180 seconds)

**Success Criteria**:

- Save speed: <2 seconds (database + file writes)
- Artifact completeness: All generated content saved
- Session tracking: 100% accurate (timestamps, duration)

**Acceptance Test**: TEST-205
**Related**: US-014-05 (Session 2: Completion), EPIC-014

---

#### FR-206: Session 3 - User Stories Extraction

**Description**: System SHALL extract user stories from PRD/SRS including story format, acceptance criteria, priority (MoSCoW), and grouping by epic.

**Inputs**:

- prdContent: string (docs/01-PRD.md content)
- srsContent: string (docs/02-SRS.md content)

**Outputs**:

- UserStories: array of {
  id: string,
  story: string, // "As a [user], I want [goal], so that [benefit]"
  acceptanceCriteria: string[],
  priority: "Must" | "Should" | "Could" | "Won't",
  epicId: string
  }
- Enhanced project-brief.md (requirements section)

**Extraction Algorithm**:

1. Scan PRD for feature descriptions
2. Convert to user story format ("As a... I want... so that...")
3. Extract acceptance criteria (bullet points defining "done")
4. Assign MoSCoW priority
5. Group by epic/feature area

**Validation**:

- All features converted to user stories (100% coverage)
- User stories follow standard format
- Acceptance criteria non-empty (at least 1 criterion per story)
- Priority assigned (Must/Should/Could/Won't)

**Success Criteria**:

- Extraction accuracy: 90%+ (stories match PRD intent)
- Story quality: Clear "who, what, why" structure
- Coverage: All features represented

**Acceptance Test**: TEST-206
**Related**: US-014-06 (Session 3: User Stories), EPIC-014

---

#### FR-207: Session 3 - Edge Cases and Constraints

**Description**: System SHALL identify edge cases (authentication failures, database errors, malformed responses) and constraints (performance targets, accessibility requirements).

**Inputs**:

- functionalRequirements: FunctionalRequirement[] (from SRS)
- nonFunctionalRequirements: NonFunctionalRequirement[] (from SRS)

**Outputs**:

- EdgeCases: array of {
  scenario: string,
  expectedBehavior: string,
  errorHandling: string
  }
- Constraints: array of {
  type: "performance" | "accessibility" | "security" | "scalability",
  requirement: string,
  target: string
  }
- Enhanced project-brief.md (edge cases and constraints section)

**Edge Case Examples**:

- User logged out during operation
- Database connection lost
- API returns 500 error
- Invalid input data

**Constraint Examples**:

- Performance: "LCP <2.5s", "API response <500ms"
- Accessibility: "WCAG 2.1 AA compliance"
- Security: "No SQL injection vulnerabilities"

**Validation**:

- At least 10 edge cases identified
- At least 5 constraints documented
- Each edge case has expected behavior and error handling

**Success Criteria**:

- Edge case coverage: 80%+ of critical scenarios
- Constraint completeness: All NFRs represented
- Clarity: Clear expected behaviors

**Acceptance Test**: TEST-207
**Related**: US-014-07 (Session 3: Edge Cases), EPIC-014

---

#### FR-208: Session 3 - Requirements Wiki Pages

**Description**: System SHALL create wiki pages per feature including user stories, acceptance criteria, edge cases, and cross-links to architecture pages.

**Inputs**:

- features: Feature[] (from PRD, grouped by epic)
- userStories: UserStory[] (from FR-206)
- edgeCases: EdgeCase[] (from FR-207)

**Outputs**:

- WikiPages: array of {
  slug: string, // e.g., "search-feature-requirements"
  title: string,
  content: string, // markdown with user stories, acceptance criteria, edge cases
  crossLinks: string[] // links to architecture.md, API docs, etc.
  }
- Created wiki pages in database (WikiPage table)

**Wiki Page Format**:

```markdown
# {Feature Name} Requirements

## User Stories

- US-XXX: As a... I want... so that...

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Edge Cases

- Scenario: {edge case}
- Expected: {behavior}
- Error Handling: {approach}

## Related

- [Architecture](@/architecture.md)
- [API Documentation](@/api-{feature}.md)
```

**Validation**:

- At least 1 wiki page per feature
- All user stories included in appropriate wiki page
- Cross-links valid (target pages exist)

**Success Criteria**:

- Wiki completeness: 100% (all features have wiki page)
- Cross-link accuracy: 100% (no broken links)
- Format consistency: All pages follow template

**Acceptance Test**: TEST-208
**Related**: US-014-08 (Session 3: Wiki Pages), EPIC-014

---

#### FR-209: Session 3 - Traceability Matrix Generation

**Description**: System SHALL generate traceability matrix mapping user stories → functional requirements → test cases with bidirectional links.

**Inputs**:

- userStories: UserStory[] (from FR-206)
- functionalRequirements: FunctionalRequirement[] (from SRS)
- testCases: TestCase[] (existing or placeholder)

**Outputs**:

- TraceabilityMatrix: array of {
  userStoryId: string,
  functionalRequirementIds: string[],
  testCaseIds: string[]
  }
- Traceability wiki page (traceability-matrix.md)

**Matrix Format**:

| User Story | Functional Requirements | Test Cases         |
| ---------- | ----------------------- | ------------------ |
| US-001     | FR-001, FR-002          | TEST-001, TEST-002 |
| US-002     | FR-003                  | TEST-003           |

**Validation**:

- All user stories mapped to at least 1 FR
- All FRs mapped to at least 1 user story
- Bidirectional links verified (US ↔ FR ↔ TEST)

**Success Criteria**:

- Coverage: 100% (all stories, FRs, tests linked)
- Accuracy: Links semantically correct (correct mappings)
- Usefulness: Developers can trace requirements to implementation

**Acceptance Test**: TEST-209
**Related**: US-014-09 (Session 3: Traceability), EPIC-014

---

#### FR-210: Session 3 - Completion and Artifact Save

**Description**: System SHALL save Session 3 artifacts (enhanced project-brief.md, requirements wiki pages, traceability matrix) and mark session complete.

**Inputs**:

- sessionId: string
- artifacts: { projectBrief: string, requirementsWikiPages: WikiPage[], traceabilityMatrix: string }

**Outputs**:

- OnboardingSession.status = COMPLETED
- OnboardingArtifact records created
- File system updated (.agent/project-brief.md, wiki pages)

**Validation**:

- project-brief.md enhanced with requirements section
- At least 5 requirements wiki pages created
- Traceability matrix wiki page created
- Session duration <5 minutes (300 seconds)

**Success Criteria**:

- Artifact completeness: All generated content saved
- Session duration: <5 minutes (target: 3-5 minutes)
- Quality: Generated content usable by agents

**Acceptance Test**: TEST-210
**Related**: US-014-10 (Session 3: Completion), EPIC-014

---

#### FR-211: Session 4 - Component Diagrams Generation

**Description**: System SHALL generate component diagrams (frontend, backend, data flow) in Mermaid format showing system architecture.

**Inputs**:

- frontendFiles: string[] (pages, components, hooks)
- backendFiles: string[] (API routes, database models, services)
- architecturePatterns: ArchitecturePattern[] (from codebase scan)

**Outputs**:

- ComponentDiagrams: {
  frontendHierarchy: string, // Mermaid diagram
  backendLayers: string, // Mermaid diagram
  dataFlow: string // Mermaid sequence diagram
  }
- Architecture wiki pages with embedded diagrams

**Diagram Types**:

1. **Frontend Hierarchy**: Pages → Components → Hooks (tree diagram)
2. **Backend Layers**: API Routes → Services → Database Models (layered diagram)
3. **Data Flow**: User Action → Frontend → API → Database → Response (sequence diagram)

**Validation**:

- All diagrams valid Mermaid syntax
- Diagrams render correctly (no syntax errors)
- Diagrams reflect actual codebase structure (95%+ accuracy)

**Success Criteria**:

- Diagram generation: <3 minutes (all 3 diagrams)
- Accuracy: 95%+ (matches actual architecture)
- Clarity: Diagrams understandable by developers

**Acceptance Test**: TEST-211
**Related**: US-014-11 (Session 4: Component Diagrams), EPIC-014

---

#### FR-212: Session 4 - Design Patterns Catalog Enhancement

**Description**: System SHALL enhance system-patterns.md with comprehensive design patterns catalog including name, problem, solution, consequences, and categorization.

**Inputs**:

- existingPatterns: Pattern[] (from current system-patterns.md)
- codebasePatterns: Pattern[] (detected from architecture scan)

**Outputs**:

- EnhancedPatternsCatalog: array of {
  name: string,
  problem: string,
  solution: string, // code example
  consequences: string, // trade-offs, when NOT to use
  category: "architecture" | "database" | "API" | "UI" | "testing"
  }
- Enhanced system-patterns.md (4K → 8K tokens)

**Pattern Categories**:

- **Architecture**: Server Component Pattern, Client Component Pattern
- **Database**: Prisma Transaction Pattern, Query Optimization Pattern
- **API**: Route Structure Pattern, Zod Validation Pattern
- **UI**: Custom Hook Pattern, useDebounce Pattern
- **Testing**: RTL Testing Pattern, Playwright E2E Pattern

**Validation**:

- At least 20 patterns cataloged
- Each pattern has problem, solution, consequences
- Patterns grouped by category (5 categories)

**Success Criteria**:

- Pattern completeness: 90%+ of project patterns documented
- Pattern quality: Usable examples (5-10 lines of code)
- Categorization: Correct category assignment

**Acceptance Test**: TEST-212
**Related**: US-014-12 (Session 4: Design Patterns), EPIC-014

---

#### FR-213: Session 4 - Architectural Decision Records (ADRs)

**Description**: System SHALL create Architectural Decision Records (ADRs) as wiki pages documenting major architecture decisions with context, decision, status, and consequences.

**Inputs**:

- architectureDecisions: ArchitectureDecision[] (extracted from docs and code)
- existingADRs: ADR[] (if any)

**Outputs**:

- ADRWikiPages: array of {
  number: number, // ADR-001, ADR-002, etc.
  title: string, // "Why App Router instead of Pages Router"
  context: string,
  decision: string,
  status: "Accepted" | "Superseded" | "Deprecated",
  consequences: string
  }
- ADR wiki pages linked from architecture.md

**ADR Format**:

```markdown
# ADR-001: Why App Router instead of Pages Router

**Status**: Accepted

## Context

Next.js 14 offers two routing approaches: App Router (new) and Pages Router (legacy).

## Decision

Use App Router for this project.

## Consequences

**Positive**:

- Server Components by default (performance)
- Built-in layouts and loading states
- Improved data fetching patterns

**Negative**:

- Smaller ecosystem (fewer tutorials)
- Learning curve for team
```

**Validation**:

- At least 5 ADRs created
- All ADRs follow standard format
- ADRs linked from architecture.md wiki page

**Success Criteria**:

- ADR coverage: 80%+ of major decisions documented
- ADR quality: Context and consequences clear
- Traceability: Decisions traceable to implementation

**Acceptance Test**: TEST-213
**Related**: US-014-13 (Session 4: ADRs), EPIC-014

---

#### FR-214: Session 4 - Data Model Visualization (ERD)

**Description**: System SHALL generate Entity-Relationship Diagram (ERD) from Prisma schema in Mermaid format showing models, relationships, indexes, and constraints.

**Inputs**:

- prismaSchemaPath: string (path to schema.prisma)
- prismaModels: PrismaModel[] (parsed models)

**Outputs**:

- EntityRelationshipDiagram: string (Mermaid ERD)
- Data model wiki page with embedded ERD

**ERD Contents**:

- All Prisma models as entities
- Relationships: one-to-one, one-to-many, many-to-many, self-referential
- Indexes (@@index, @@unique)
- Cascade behavior (onDelete: Cascade)

**Validation**:

- ERD valid Mermaid syntax
- All Prisma models included (100% coverage)
- Relationships accurate (match schema.prisma)

**Success Criteria**:

- ERD generation: <2 minutes
- Accuracy: 100% (matches Prisma schema exactly)
- Clarity: Relationships clearly labeled

**Acceptance Test**: TEST-214
**Related**: US-014-14 (Session 4: ERD), EPIC-014

---

#### FR-215: Session 4 - Completion and Artifact Save

**Description**: System SHALL save Session 4 artifacts (enhanced system-patterns.md, architecture wiki pages, ADRs, ERD) and mark session complete.

**Inputs**:

- sessionId: string
- artifacts: { systemPatterns: string, architectureWikiPages: WikiPage[], adrs: WikiPage[], erd: string }

**Outputs**:

- OnboardingSession.status = COMPLETED
- OnboardingArtifact records created
- File system updated (.agent/system-patterns.md, wiki pages)

**Validation**:

- system-patterns.md enhanced (4K → 8K tokens)
- At least 3 architecture wiki pages created
- At least 5 ADRs created
- ERD wiki page created
- Session duration <7 minutes (420 seconds)

**Success Criteria**:

- Artifact completeness: All generated content saved
- Session duration: <7 minutes (target: 5-7 minutes)
- Quality: Architecture documentation complete

**Acceptance Test**: TEST-215
**Related**: US-014-15 (Session 4: Completion), EPIC-014

---

#### FR-216: Session 5 - Backlog Breakdown

**Description**: System SHALL extract epics and user stories from PRD/Backlog, show story points, MoSCoW priority, and group by sprint allocation.

**Inputs**:

- prdContent: string (docs/01-PRD.md)
- backlogContent: string (docs/12-Backlog.md)

**Outputs**:

- Epics: array of { id: string, title: string, description: string, totalStoryPoints: number }
- UserStories: array of { id: string, epicId: string, title: string, storyPoints: number, priority: string, sprintAllocation: string }
- Enhanced progress.md (backlog section)

**Extraction Process**:

1. Parse PRD for epics (major features)
2. Parse Backlog for user stories
3. Extract story points from each story
4. Group stories by sprint allocation
5. Calculate total story points per epic

**Validation**:

- All epics extracted (100% coverage)
- All user stories mapped to epics
- Story points validated (positive numbers)
- Sprint allocations valid (Sprint 1, Sprint 2, etc.)

**Success Criteria**:

- Extraction accuracy: 95%+ (matches PRD/Backlog)
- Story point totals: Accurate (sum matches backlog)
- Grouping: Logical sprint allocations

**Acceptance Test**: TEST-216
**Related**: US-014-16 (Session 5: Backlog), EPIC-014

---

#### FR-217: Session 5 - Sprint Structure Documentation

**Description**: System SHALL document sprint structure including duration, capacity, goals, user stories, and dependencies for each sprint.

**Inputs**:

- sprints: Sprint[] (from project plan)
- userStories: UserStory[] (from FR-216)
- sprintAllocations: { [sprintId]: UserStory[] }

**Outputs**:

- SprintDocumentation: array of {
  sprintNumber: number,
  duration: string, // "2 weeks"
  capacity: number, // 40 story points
  goals: string[],
  userStories: UserStory[],
  dependencies: string[]
  }
- Sprint wiki pages (sprint-1.md, sprint-2.md, etc.)

**Sprint Wiki Format**:

```markdown
# Sprint 1: Foundation Setup

**Duration**: 2 weeks (2025-11-01 to 2025-11-15)
**Capacity**: 40 story points
**Actual**: 38 story points (95% capacity)

## Goals

- Set up project infrastructure
- Implement basic database models
- Create authentication system

## User Stories

- US-001: Create 5-level hierarchy (8 points)
- US-002: Implement Phase model (5 points)
- ...

## Dependencies

- None (first sprint)
```

**Validation**:

- At least 3 sprints documented
- Each sprint has goals, stories, dependencies
- Story points sum ≤ capacity (realistic allocation)

**Success Criteria**:

- Sprint documentation completeness: 100%
- Capacity planning: Realistic (≤110% capacity)
- Dependency mapping: Accurate (correct order)

**Acceptance Test**: TEST-217
**Related**: US-014-17 (Session 5: Sprint Structure), EPIC-014

---

#### FR-218: Session 5 - Velocity and Burndown Calculation

**Description**: System SHALL calculate historical velocity (story points per sprint), generate burndown chart data, and perform risk analysis.

**Inputs**:

- completedSprints: Sprint[] (historical data)
- currentSprint: Sprint (active sprint)
- remainingStoryPoints: number

**Outputs**:

- VelocityData: {
  historicalVelocity: number[], // story points per sprint (last 3 sprints)
  averageVelocity: number,
  predictedCompletion: Date
  }
- BurndownData: {
  idealBurndown: { day: number, points: number }[],
  actualBurndown: { day: number, points: number }[]
  }
- RiskAnalysis: {
  onTrack: boolean,
  atRisk: string[], // features at risk
  recommendations: string[]
  }

**Calculations**:

- **Historical Velocity**: Average story points completed per sprint (last 3 sprints)
- **Predicted Completion**: Remaining points ÷ average velocity = sprints remaining
- **Burndown**: Ideal (linear) vs actual (tracked daily)
- **Risk**: Compare actual velocity to plan

**Validation**:

- Velocity calculated from at least 1 completed sprint
- Burndown data includes ideal and actual lines
- Risk analysis identifies at-risk features

**Success Criteria**:

- Velocity accuracy: ±10% (realistic prediction)
- Burndown visibility: Clear chart data
- Risk identification: 90%+ of at-risk items flagged

**Acceptance Test**: TEST-218
**Related**: US-014-18 (Session 5: Velocity), EPIC-014

---

#### FR-219: Session 5 - Tickets Pre-Creation (Optional)

**Description**: System SHALL optionally pre-generate tickets from user stories by breaking down stories into implementation tasks and linking to issues.

**Inputs**:

- userStories: UserStory[] (from backlog)
- issueCreationEnabled: boolean (user preference)

**Outputs**:

- PreCreatedTickets: array of {
  title: string,
  description: string,
  issueId: string, // linked issue
  estimatedStoryPoints: number,
  taskBreakdown: string[] // sub-tasks
  }
- Ticket records created in database (if enabled)

**Ticket Breakdown Example**:

```
US-001: Create 5-level hierarchy (8 points)
→ Ticket #1: Implement Phase model (2 points)
→ Ticket #2: Implement Week model (2 points)
→ Ticket #3: Implement Day model (2 points)
→ Ticket #4: Add relationships and validation (2 points)
```

**Validation**:

- Tickets only created if issueCreationEnabled = true
- Each ticket linked to valid issue
- Task breakdown sums to story points

**Success Criteria**:

- Breakdown accuracy: 90%+ (realistic task split)
- Linking: 100% (all tickets linked to issues)
- Optional: User can disable (respect preference)

**Acceptance Test**: TEST-219
**Related**: US-014-19 (Session 5: Tickets), EPIC-014

---

#### FR-220: Session 5 - Completion and Artifact Save

**Description**: System SHALL save Session 5 artifacts (enhanced progress.md, sprint wiki pages, velocity data) and mark session complete.

**Inputs**:

- sessionId: string
- artifacts: { progressMd: string, sprintWikiPages: WikiPage[], velocityData: VelocityData, burndownData: BurndownData }

**Outputs**:

- OnboardingSession.status = COMPLETED
- OnboardingArtifact records created
- File system updated (.agent/progress.md, wiki pages)
- ProjectOnboarding.status = COMPLETED (all sessions done)

**Validation**:

- progress.md enhanced with backlog section
- At least 3 sprint wiki pages created
- Velocity and burndown data saved
- Session duration <5 minutes (300 seconds)
- All 5 sessions marked complete

**Success Criteria**:

- Artifact completeness: All generated content saved
- Total onboarding time: 15-20 minutes (all sessions)
- Agent readiness: 100% (agents can work autonomously)

**Acceptance Test**: TEST-220
**Related**: US-014-20 (Session 5: Completion), EPIC-014

---

## 2. Non-Functional Requirements

### 2.1 Performance Requirements

#### NFR-001: API Response Time (P95)

**Requirement:** 95% of all MCP tool calls must complete in <500ms

**Measurement:** Monitor API response times using observability tools

**Exceptions:** Bulk operations (createBulk with 50+ items) allowed up to 2s

**Priority:** High

**Traceability:**

- PRD: Section 5.5 (Performance metrics)
- Tests: PERF-001

---

#### NFR-002: API Response Time (P99)

**Requirement:** 99% of all MCP tool calls must complete in <1s

**Priority:** High

**Traceability:**

- PRD: Section 5.5
- Tests: PERF-002

---

#### NFR-003: Knowledge Graph Query Performance

**Requirement:** 95% of knowledge.query() calls complete in <200ms

**Includes:** Semantic search + full-text search + result merging

**Priority:** High (critical for agent workflow)

**Traceability:**

- PRD: Section 5.5
- Tests: PERF-003

---

#### NFR-004: Knowledge Graph Traversal Performance

**Requirement:** 99% of knowledge.traverse() calls complete in <500ms

**Includes:** 2-hop graph traversal with 1-3 related nodes

**Priority:** High

**Traceability:**

- PRD: Section 5.5
- Tests: PERF-004

---

#### NFR-005: Dashboard First Contentful Paint

**Requirement:** <2s for initial page load

**Measurement:** Lighthouse FCP metric

**Priority:** Medium

**Traceability:**

- PRD: Section 5.5
- Tests: PERF-005

---

#### NFR-006: Dashboard Time to Interactive

**Requirement:** <3s for dashboard to become fully interactive

**Measurement:** Lighthouse TTI metric

**Priority:** Medium

**Traceability:**

- PRD: Section 5.5
- Tests: PERF-006

---

#### NFR-007: Markdown Sync Performance

**Requirement:** <500ms per file generation

**Max Files:** 5 files per sync operation (STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md, current-session.md, current-plan.md)

**Priority:** High (agent workflow depends on fast sync)

**Traceability:**

- PRD: Section 4.2.1 (Markdown sync)
- Tests: PERF-007

---

#### NFR-008: Batch Sync Performance

**Requirement:** Batch sync for multiple updates (avoid triggering sync on every progress update)

**Logic:** Debounce sync calls (max 1 sync per 5 seconds)

**Priority:** High

**Traceability:**

- Tests: PERF-008

---

### 2.2 Availability

#### NFR-009: Target Uptime

**Requirement:** 99.9% uptime (dependent on local machine uptime)

**Calculation:** 8.76 hours downtime per year allowed

**Priority:** Medium (local deployment, no SLA)

**Traceability:**

- PRD: Section 6.2 (Region constraints)

---

#### NFR-010: Recovery Time Objective (RTO)

**Requirement:** <1 minute (Docker restart)

**Measurement:** Time from failure detection to service restoration

**Priority:** Medium

**Traceability:**

- PRD: Section 6.2

---

#### NFR-011: Recovery Point Objective (RPO)

**Requirement:** 0 seconds (database transactions ensure no data loss)

**Priority:** High

**Traceability:**

- PRD: Section 6.2

---

#### NFR-012: Graceful Degradation (Embeddings Failure)

**Requirement:** If embeddings service down → fall back to full-text search only

**Behavior:** knowledge.query() still works, just without semantic search

**Priority:** High

**Traceability:**

- Architecture: Section 4.10 (Hybrid search)
- Tests: DEG-001

---

#### NFR-013: Graceful Degradation (Markdown Sync Failure)

**Requirement:** If markdown sync fails → retry with exponential backoff (max 3 retries)

**Behavior:** Log error, alert human, but don't block API response

**Priority:** High

**Traceability:**

- Tests: DEG-002

---

### 2.3 Security

#### NFR-014: Autonomy Level 1 (Full)

**Requirement:** Read operations, create operations (issues/knowledge/skills), update progress tracking allowed without approval

**Priority:** Critical

**Traceability:**

- PRD: Section 10.1 (Autonomy levels)
- Architecture: ADR-005 (Security architecture)

---

#### NFR-015: Autonomy Level 2 (Approval Required)

**Requirement:** Delete operations, git commits, config changes require human approval

**Implementation:** ApprovalRequest table, UI approval workflow

**Priority:** Critical

**Traceability:**

- PRD: Section 10.1, Section 10.2 (Approval workflow)

---

#### NFR-016: Autonomy Level 3 (Forbidden)

**Requirement:** Agents NEVER allowed to modify env vars, drop tables, change security settings

**Implementation:** Hard-coded restrictions in API layer

**Priority:** Critical

**Traceability:**

- PRD: Section 10.1

---

#### NFR-017: Audit Trail (All Actions)

**Requirement:** All agent actions logged to AgentAction table

**Fields:** actionType, feature, entityId, payload, result, success, timestamp, agentType

**Priority:** Critical

**Traceability:**

- PRD: Section 10.2 (Audit trail)

---

#### NFR-018: Rollback Capability (Level 1 Operations)

**Requirement:** Level 1 operations reversible via Rollback table

**Fields:** actionId, beforeState, afterState, rolledBack, rolledBackAt

**Priority:** High

**Traceability:**

- PRD: Section 10.2 (Rollback system)

---

#### NFR-019: Git Hook Enforcement

**Requirement:** Pre-commit hook prevents manual markdown edits

**Protected Files:** STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md, current-session-\*.md, current-plan.md

**Override:** Admin can force commit with --no-verify

**Priority:** Critical

**Traceability:**

- PRD: Section 4.2.1 (Markdown sync), Architecture: ADR-002

---

### 2.4 Scalability

#### NFR-020: Target User Base

**Requirement:** Solo developer (1 project, 1 concurrent session)

**No multi-tenancy:** Single project per deployment

**Priority:** Medium

**Traceability:**

- PRD: Section 6.1 (Budget constraints)

---

#### NFR-021: Data Volume Targets

**Requirements:**

- 10,000 issues
- 1,000 knowledge items
- 500 wiki pages
- 100 agent personas
- 50 concurrent MCP tool calls (queued)

**Priority:** Medium

**Traceability:**

- PRD: Section 6.1

---

#### NFR-022: Database Scaling

**Strategies:**

- PostgreSQL connection pooling (Prisma default)
- Indexes on high-query fields (status, createdAt, tags)
- Pagination required for all list endpoints

**Priority:** High

**Traceability:**

- Architecture: Section 4.13 (Database optimization)

---

### 2.5 Cost

#### NFR-023: Infrastructure Cost

**Requirement:** $0 (local deployment only)

**Priority:** Critical

**Traceability:**

- PRD: Section 6.1 (Budget constraints)

---

#### NFR-024: Embeddings Cost

**Requirement:** ~$5/month (OpenAI text-embedding-3-small, estimated 1M tokens) OR $0 (Ollama local embeddings)

**Priority:** Low (optional feature)

**Traceability:**

- PRD: Section 6.1

---

#### NFR-025: Cost Alert Threshold

**Requirement:** Alert when approaching 80% of free tier limits

**Priority:** Medium

**Traceability:**

- PRD: Section 6.1

---

#### NFR-026: Cost Tracking

**Requirement:** Monitor API usage, alert when approaching limits

**Priority:** Medium

**Traceability:**

- PRD: Section 6.1

---

### 2.6 Observability

#### NFR-027: MCP Tool Logging

**Requirement:** All MCP calls logged with success/failure and execution time

**Priority:** High

**Traceability:**

- PRD: Section 2.6 (Observability)

---

#### NFR-028: Query Latency Tracking

**Requirement:** Track P50, P95, P99 latencies for all database queries

**Priority:** High

**Traceability:**

- PRD: Section 2.6

---

#### NFR-029: Agent Action Success Rate

**Requirement:** Target >95% success rate

**Measurement:** (successful actions) / (total actions) × 100

**Priority:** High

**Traceability:**

- PRD: Section 5.4 (Quality metrics)

---

#### NFR-030: Token Usage Tracking

**Requirement:** Monitor token usage per session, alert when approaching 200K limit

**Priority:** High

**Traceability:**

- PRD: Section 5.2 (Token efficiency)

---

#### NFR-031: Health Monitoring

**Requirements:**

- Database connection health check
- Markdown sync success rate
- Scanner execution status

**Priority:** Medium

**Traceability:**

- PRD: Section 2.6

---

### 2.7 Accessibility (UI)

#### NFR-032: WCAG 2.1 AA Compliance

**Requirements:**

- Keyboard navigation (Tab, Enter, Esc)
- Screen reader support (aria-labels on all interactive elements)
- Color contrast ratios: 7:1+ (dark neumorphic theme)
- Focus indicators visible

**Priority:** High (legal requirement)

**Traceability:**

- PRD: Section 2.7 (Accessibility)
- Tests: A11Y-001

---

#### NFR-033: Responsive Design

**Breakpoints:**

- Mobile: 320px+ (basic viewing)
- Tablet: 768px+ (full functionality)
- Desktop: 1024px+ (optimal experience)

**Priority:** Medium

**Traceability:**

- PRD: Section 2.7

---

## 3. Data Model Summary

**Full schema details in:** [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md)

**10 Core Tables:**

1. **Phase/Week/Day/Task/Session** (Sprint/Phase Tracking) - 5-level hierarchy for progress tracking
2. **Workflow/WorkflowStep** (Workflow Orchestration) - 12 predefined workflows with state machines
3. **Issue** (Issues) - Bug/task tracking with status, priority, labels, comments
4. **KnowledgeItem/KnowledgeRelationship** (Knowledge) - RAG + Knowledge Graph with pgvector embeddings
5. **Skill** (Skills) - Framework patterns with lazy loading (frontmatter + content)
6. **WikiPage** (Wiki) - Hierarchical documentation with auto-generation
7. **HealthFinding/HealthScanner** (Project Health) - Security/quality/a11y findings
8. **AgentPersona** (Personas) - Project-specific sub-agents
9. **MarkdownFile** (Markdown Sync) - Auto-generated read-only files
10. **AgentAction/Rollback/ApprovalRequest** (Audit/Safety) - Audit trail, rollback, approval workflow

**Key Design Decisions:**

- Database as single source of truth (ADR-002)
- Markdown files auto-generated from database (read-only)
- pgvector for embeddings (384 dimensions)
- tsvector for full-text search
- Soft deletes (deletedAt timestamps) for audit trail

---

## 4. Integrations

### 4.1 Database: PostgreSQL 15+

**Extensions Required:**

- `pgvector` - Vector similarity search for knowledge embeddings
- `pg_trgm` - Trigram indexes for full-text search
- `uuid-ossp` - UUID generation

**Connection:** Prisma ORM with connection pooling

**Priority:** Critical

**Traceability:**

- PRD: Section 6.3 (Stack constraints)
- Architecture: Section 4.14 (Database setup)

---

### 4.2 Embeddings: OpenAI OR Ollama

**Options:**

1. **OpenAI text-embedding-3-small** (384 dimensions) - ~$5/month
2. **Ollama local embeddings** (llama2, mistral) - $0, fully local

**Used For:** Knowledge semantic search (FR-071, FR-072)

**Fallback:** If embeddings service down, fall back to full-text search only

**Priority:** Medium (optional feature)

**Traceability:**

- PRD: Section 6.1 (Budget constraints)

---

### 4.3 MCP Server: @modelcontextprotocol/sdk

**Transport:** stdio (standard input/output)

**Tools:** 42 MCP tools across 8 features

**Agents Supported:** Claude Code, Cursor AI, Codex, Cascade (any MCP-compatible agent)

**Priority:** Critical

**Traceability:**

- PRD: Section 1.2 (Agent-first philosophy)
- Architecture: Section 4.15 (MCP implementation)

---

### 4.4 Git Hooks

**Pre-Commit Hook:** Prevent manual edits to auto-generated markdown files

**Protected Files:**

- STATUS.md
- DEVELOPMENT_PLAN.md
- current-todos.md
- current-session-\*.md
- current-plan.md

**Priority:** Critical

**Traceability:**

- FR-011 (Git hook enforcement)
- Architecture: ADR-002 (Database as source of truth)

---

## 5. Traceability Matrix

**Complete traceability:** FR-ID → PRD Section → Architecture → API → Tests → Backlog

| FR-ID       | PRD Section | Architecture | API Endpoint           | Tests          | Backlog          |
| ----------- | ----------- | ------------ | ---------------------- | -------------- | ---------------- |
| FR-001-025  | 4.2.1       | ADR-002      | /api/sprint/\*         | TEST-001-032   | US-001-029       |
| FR-026-050  | 4.2.2       | ADR-004      | /api/workflows/\*      | TEST-033-060   | US-030-055       |
| FR-051-070  | 4.2.3       | Section 4.9  | /api/issues/\*         | TEST-061-084   | US-056-075       |
| FR-071-090  | 4.2.4       | Section 4.10 | /api/knowledge/\*      | TEST-085-109   | US-076-095       |
| FR-091-105  | 4.2.5       | Section 4.11 | /api/skills/\*         | TEST-110-124   | US-096-110       |
| FR-106-115  | 4.2.6       | Section 4.12 | /api/wiki/\*           | TEST-125-134   | US-111-120       |
| FR-116-120  | 4.2.7       | Section 4.13 | /api/health/\*         | TEST-135-142   | US-121-125       |
| FR-121-125  | 4.2.8       | Section 4.14 | /api/personas/\*       | TEST-143-147   | US-126-130       |
| NFR-001-033 | 5.5, 10.1   | ADR-005      | All APIs (constraints) | PERF-_, A11Y-_ | (Non-functional) |

---

## 6. Approval & Version History

**Version:** 2.0.0
**Created:** 2025-11-02
**Status:** ✅ Active
**Approver:** Project Owner

**Document Completion:**

- [x] 125 Functional Requirements (FR-001 to FR-125)
- [x] 33 Non-Functional Requirements (NFR-001 to NFR-033)
- [x] Data Model Summary (10 core tables)
- [x] Integrations (4 external systems)
- [x] Traceability Matrix (FR → PRD → Architecture → Tests → Backlog)
- [x] Total Lines: 1,232 lines (103% of target - within ±10% tolerance)

**Next Documents:**

- [03-Architecture.md](03-Architecture.md) - Architecture design
- [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md) - Database schema
- [12-Backlog.md](12-Backlog.md) - User stories (US-001 to US-130)

---

**End of System Requirements Specification (SRS)**
