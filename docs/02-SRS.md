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
- [12-Backlog.md](12-Backlog.md) - User Stories (125 stories mapped to these FRs)

---

## 1. Functional Requirements

### 1.1 Sprint/Phase Tracking (FR-001 to FR-025)

**Purpose:** Hierarchical progress tracking with auto-sync to markdown files

**Database as Source of Truth:** All progress tracked in database (Phase, Week, Day, Task, Session tables). Markdown files auto-generated from database (read-only). Git hooks prevent manual markdown edits.

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

### 1.2 Workflow Orchestration (FR-026 to FR-050)

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

#### FR-026: Define Workflow

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
- Backlog: US-030, US-031

---

#### FR-027: Start Workflow

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
- Backlog: US-032

---

#### FR-028: Get Current Workflow Step

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

#### FR-029: Complete Workflow Step

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

#### FR-030: Validate Workflow Compliance

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

#### FR-031: Pause Workflow

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

#### FR-032: Resume Workflow from Checkpoint

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

#### FR-033: Retry Failed Workflow Steps

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

#### FR-034: Workflow Recovery Suggestions

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

#### FR-035: Workflow Templates

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

#### FR-036: Workflow Step Dependencies

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

#### FR-037: Workflow Branching

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

#### FR-038: Workflow History

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

#### FR-039: Workflow Success Rate Analytics

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

#### FR-040: Workflow Failure Logs

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

#### FR-041: Workflow Step Time Tracking

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

#### FR-042: Workflow Duplication

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

#### FR-043: Workflow Enable/Disable

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

#### FR-044: Workflow Alerts

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

#### FR-045: Workflow Auto-Recovery

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

#### FR-046: Multiple Concurrent Workflows

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

#### FR-047: Workflow Priority

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

#### FR-048: Workflow Context Injection

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

#### FR-049: Workflow Undo

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

#### FR-050: Workflow Export/Import

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

### 1.3 Issues (FR-051 to FR-070)

**Purpose:** Bug and task tracking for agent-created and human-created work items

---

#### FR-051: Create Single Issue

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

#### FR-052: Create Bulk Issues

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

#### FR-053: Update Issue

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

#### FR-054: Query Issues

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

#### FR-055: Link Related Issues

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

#### FR-056: Delete Issue (Soft Delete)

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

#### FR-057: Add Issue Comment

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

#### FR-058: Attach File to Issue

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

#### FR-059: Link Issue to Git Commit

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

#### FR-060: Auto-Tag Based on File Path

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

#### FR-061: Context Injection (Stack Traces)

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

#### FR-062: Issue Templates

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

#### FR-063: Issue Priority Auto-Assignment

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

#### FR-064: Issue Assignment

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

#### FR-065: Issue Labels Management

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

#### FR-066: Issue Status Workflow Customization

**Description:** Define custom status workflow (beyond OPEN → IN_PROGRESS → REVIEW → CLOSED).

**Priority:** P3 (Low - Post-MVP)

**Dependencies:** FR-051, FR-053

**Traceability:**

- PRD: Section 7 (Out of scope)
- Tests: TEST-080
- Backlog: US-071

---

#### FR-067: Issue Search by Code Snippet

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

#### FR-068: Issue Export

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

#### FR-069: Issue Import

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

#### FR-070: Duplicate Issue Detection

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
