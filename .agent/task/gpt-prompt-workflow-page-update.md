# Task: Add Workflow as Standalone Top-Level Page in ProjectPulse Documentation

## Project Context

**Project:** ProjectPulse (formerly Moksha DevHub)
**Architecture:** Agent-first platform (95% MCP interaction, 5% UI monitoring)
**Documentation:** Industry-grade with complete traceability (28,352 lines, 125 FRs, 8 Epics)

**Current Status:**

- Workflow is currently documented as "Workflow Monitor" component within Sprint Tracking
- User wants to elevate it to **standalone top-level page** (8th page in main navigation)
- All functional requirements (FR-026 to FR-050) and user stories (US-030 to US-055) are already complete

---

## Files to Update (5 files)

### 1. docs/07-UI-UX.md (PRIMARY - MOST WORK)

**Tasks:**

- Update site map (lines 325-383)
- Update navigation bar example (line 402)
- Update navigation count (line 387: "7 main sections" → "8 main sections")
- **WRITE NEW SECTION:** Complete Workflow page specification (~200-300 lines)

### 2. docs/03-Architecture.md (SECONDARY)

**Task:** Update component diagram (around line 718)

- Change "Workflow Monitor" component description to reference standalone Workflow page

### 3. docs/01-PRD.md (TERTIARY)

**Task:** Update feature description (Section 4.2.2)

- Add clarification that Workflow is a standalone page in main navigation

### 4. docs/13-Project-Plan.md (VERIFICATION)

**Task:** Verify sprint allocation (lines 330-395)

- Ensure UI work for Workflow page is allocated in Sprint 2 or 3

### 5. docs/10-Observability-and-SRE.md (REFERENCE UPDATE)

**Task:** Update reference (around line 2541)

- Change "Workflow Monitor component" → "Workflow page"

---

## Detailed Instructions

### PHASE 1: Update docs/07-UI-UX.md Site Map (Lines 325-383)

**Find this structure:**

```markdown
├── Sprint Tracking
│ ├── Phase Overview
│ ├── Week Drill-Down
│ ├── Day Details
│ ├── Task Management
│ └── Session History
│
├── Issues
│ ├── Issues List (sortable, filterable)
```

**INSERT this between Sprint Tracking and Issues:**

```markdown
├── Workflow
│ ├── Active Workflows List
│ │ ├── Current step indicator
│ │ ├── Progress percentage (0-100%)
│ │ ├── Validation status (✅ compliant / ⚠️ missing steps)
│ │ └── Real-time updates (WebSocket)
│ ├── Workflow History
│ │ ├── Execution timeline (last 50 executions)
│ │ ├── Success/failure rates per workflow
│ │ └── Duration analytics (avg time per workflow)
│ ├── Workflow Templates
│ │ ├── 5-Step Mandatory Protocol
│ │ ├── Session Start Workflow
│ │ ├── Git Workflow (commit, push, PR)
│ │ ├── Checkpoint Workflow (15K token intervals)
│ │ ├── 3-Tier Persistence Workflow
│ │ ├── Plan Creation Workflow
│ │ ├── Expert Consultation Workflow
│ │ ├── Testing Workflow
│ │ ├── Documentation Generation Workflow
│ │ ├── Code Review Workflow
│ │ ├── Deployment Workflow
│ │ └── Recovery Workflow (session interruption)
│ └── Workflow Analytics Dashboard
│ ├── Success rate metrics (target: >95%)
│ ├── Average completion time per workflow
│ ├── Failure analysis (common failure points)
│ └── Compliance trends (protocol adherence over time)
```

**Update navigation count (line 387):**

```markdown
# Before:

1. **Level 1:** Top navigation (7 main sections + Dashboard)

# After:

1. **Level 1:** Top navigation (8 main sections + Dashboard)
```

**Update navigation bar (line 402):**

```markdown
# Before:

│ [Logo] Dashboard | Sprint | Issues | Knowledge | ... [User] │

# After:

│ [Logo] Dashboard | Sprint | Workflow | Issues | Knowledge | ... [User] │
```

---

### PHASE 2: Write Complete Workflow Page Specification in docs/07-UI-UX.md

**Location:** Create new section after Section 3.2 (Navigation Patterns) or insert as Section 3.3

**Write this complete specification (~200-300 lines):**

```markdown
---

### 3.3 Workflow Page Specification

#### 3.3.1 Overview

**Purpose:** Monitor and manage all 12 predefined workflows for agent-first development

**Primary Users:**
- **Agents (95%):** Execute workflows via MCP tools, receive validation alerts
- **Humans (5%):** Monitor workflow status, debug failures, override if needed

**Key Features:**
- **Real-time monitoring:** Active workflows with step-by-step progress (WebSocket-powered)
- **Workflow templates:** 12 predefined workflows (5-step protocol, session start, git, checkpoint, etc.)
- **Validation alerts:** Alert agent when required step skipped (banner notification)
- **Execution history:** Last 50 workflow executions with success/failure analysis
- **Analytics dashboard:** Success rate, average duration, failure breakdown per workflow
- **Manual override:** Pause/resume workflows when human intervention required

**Related Requirements:**
- **Functional Requirements:** FR-026 to FR-050 (25 requirements for workflow orchestration)
- **User Stories:** US-030 to US-055 (26 stories, 75 story points)
- **Test Cases:** TEST-033 to TEST-060 (28 test cases)
- **Epic:** EPIC-002 (Workflow Orchestration, 95 points total)

---

#### 3.3.2 Layout Structure

**Workflow Page Sections:**
```

┌─────────────────────────────────────────────────────────────┐
│ [Top Navigation Bar] │
├─────────────────────────────────────────────────────────────┤
│ 📊 Workflow Dashboard │
│ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐ │
│ │ Active: 2 │ │ Completed: 47 │ │ Success: 92% │ │
│ └─────────────────┘ └─────────────────┘ └──────────────┘ │
│ │
│ 🔄 Active Workflows (2) │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 5-Step Protocol [IN_PROGRESS] 60% │ │
│ │ Current: Step 4 - Implementation │ │
│ │ ✅ Step 1: Initialize ✅ Step 2: Plan ✅ Step 3: Consult │
│ │ 🔄 Step 4: Implementation ⏳ Step 5: Complete │ │
│ │ [View Details] [Pause] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ 📜 Workflow History (Last 50) │
│ [Filters: Last 7 days ▼] [Status: All ▼] │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 5-Step Protocol ✅ Success 2h 15m ago Duration: 45m │ │
│ │ Git Workflow ✅ Success 3h 30m ago Duration: 5m │ │
│ │ Checkpoint ⚠️ Warning 5h ago Duration: 2m │ │
│ │ └ Step 4 skipped, resumed manually │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ 📑 Workflow Templates (12) │
│ [View All Templates] │
└─────────────────────────────────────────────────────────────┘

```

**Sub-Pages:**

1. **Active Workflows List**
   - Real-time status of in-progress workflows
   - Step-by-step progress indicator (visual timeline)
   - Current step highlighted (coral accent color)
   - Validation status badges (✅ compliant / ⚠️ missing step)
   - Pause/Resume/Abort buttons (manual override)

2. **Workflow History**
   - Chronological execution log (last 50 executions)
   - Filter by date range (last 7/30/90 days, all time)
   - Filter by status (success, warning, failed)
   - Filter by workflow type (dropdown: all 12 workflows)
   - Execution duration metrics (average, min, max)
   - Failure analysis (expandable error messages)

3. **Workflow Templates**
   - List of 12 predefined workflows:
     1. **5-Step Mandatory Protocol** (5 steps)
     2. **Session Start Workflow** (initialization + context loading)
     3. **Git Workflow** (add, commit, push, PR creation)
     4. **Checkpoint Workflow** (15K token interval saves)
     5. **3-Tier Persistence Workflow** (real-time, checkpoints, strategic)
     6. **Plan Creation Workflow** (research, plan, approval)
     7. **Expert Consultation Workflow** (invoke sub-agent, wait, integrate)
     8. **Testing Workflow** (write tests, run tests, coverage check)
     9. **Documentation Generation Workflow** (synthesize-docs, map-system)
     10. **Code Review Workflow** (lint, type-check, test, human review)
     11. **Deployment Workflow** (build, test, deploy to staging/prod)
     12. **Recovery Workflow** (session interruption, resume from checkpoint)
   - View workflow definition (step list, validation rules, dependencies)
   - Edit workflow steps (custom workflow creation - future feature)
   - Duplicate template (create custom variation)

4. **Workflow Analytics Dashboard**
   - **Success Rate Chart:** Bar chart per workflow (target: >95% compliance)
   - **Execution Duration:** Line chart showing trend over time
   - **Failure Breakdown:** Pie chart by failure type (skipped step, timeout, validation error)
   - **Compliance Score:** Percentage of workflows executed without warnings (target: >95%)
   - **Most Used Workflows:** Top 5 workflows by execution count
   - **Average Duration per Workflow:** Table with min/max/avg times

---

#### 3.3.3 UI Components

**1. Active Workflow Card**

```

┌─────────────────────────────────────────────────────────┐
│ 5-Step Mandatory Protocol [IN_PROGRESS] 60% │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │
│ Current Step: Step 4 - Implementation (30K tokens) │
│ Started: 2h 15m ago | Estimated completion: 45m │
│ │
│ ✅ Step 1: Initialize (completed 2h ago) │
│ ✅ Step 2: Create Plan (completed 1h 50m ago) │
│ ✅ Step 3: Expert Consultation (completed 1h 30m ago) │
│ 🔄 Step 4: Implementation (in progress - 30K/60K) │
│ ⏳ Step 5: Post-Completion (not started) │
│ │
│ [View Context] [Pause Workflow] [View History] │
└─────────────────────────────────────────────────────────┘

```

**Features:**
- **Real-time progress bar:** Animates 0% → 100% (WebSocket-powered)
- **Step status icons:** ✅ Complete, 🔄 In Progress, ⏳ Pending, ⚠️ Warning, ❌ Failed
- **Current step highlight:** Coral background color on active step
- **Token counter:** Shows 15K, 30K, 45K checkpoint markers
- **Time estimates:** Started time + estimated completion (based on average duration)
- **Action buttons:**
  - **View Context:** Opens modal with workflow context data (key-value pairs)
  - **Pause Workflow:** Manual override (confirmation modal: "Are you sure?")
  - **View History:** Navigate to workflow history page filtered to this workflow type

**Accessibility:**
- ARIA role: `role="article" aria-label="Active Workflow: 5-Step Protocol"`
- Step list: `role="list"` with `role="listitem"` for each step
- Keyboard navigation: Tab through steps, Enter to view context

---

**2. Workflow Timeline Component**

```

┌─────────────────────────────────────────────────────────┐
│ Execution Timeline │
│ │
│ ●━━━━━━━●━━━━━━━●━━━━━━━●━━━━━━━● │
│ Step 1 Step 2 Step 3 Step 4 Step 5 │
│ 5m 15m 10m [now] - │
│ │
│ Checkpoints: 🔖 15K (10m) 🔖 30K (25m) 🔖 45K (est 40m) │
└─────────────────────────────────────────────────────────┘

```

**Features:**
- **Visual timeline:** Horizontal progress line with step markers
- **Step durations:** Time spent per step (display below marker)
- **Checkpoint markers:** 🔖 icon at 15K, 30K, 45K token intervals
- **Current position:** Animated indicator showing current step
- **Failure markers:** ❌ red marker on failed/warning steps with tooltip
- **Hover tooltips:** Detailed step info (start time, end time, duration, status)

---

**3. Workflow Detail Panel (Slide-out)**

```

┌─────────────────────────────────────────────────────────┐
│ [X] Close Workflow: 5-Step Protocol │
├─────────────────────────────────────────────────────────┤
│ │
│ [Overview] [Steps] [Context] [History] │
│ │
│ ───────────────────── Steps ───────────────────────── │
│ │
│ Step 1: Initialize Session │
│ ✅ Status: Complete (5 minutes) │
│ └ Created .agent/task/current-session-[timestamp].md │
│ │
│ Step 2: Create Plan │
│ ✅ Status: Complete (15 minutes) │
│ └ Saved to .agent/task/current-plan.md │
│ └ Created current-todos.md │
│ │
│ Step 3: Expert Consultation │
│ ✅ Status: Complete (10 minutes) │
│ └ Invoked: react-expert, next-js-expert │
│ │
│ Step 4: Implementation │
│ 🔄 Status: In Progress (30 minutes so far) │
│ └ Files modified: 12 │
│ └ Checkpoints: 15K ✅, 30K ✅, 45K ⏳ │
│ │
│ Step 5: Post-Completion │
│ ⏳ Status: Not Started │
│ │
│ ───────────────── Validation Rules ────────────────── │
│ │
│ ✅ All required steps must be completed sequentially │
│ ✅ Cannot skip steps 1, 2, 3, 5 (mandatory) │
│ ✅ Step 4 requires minimum 15K tokens (checkpoint) │
│ ✅ Step 5 must update STATUS.md and commit docs │
│ │
│ ────────────────── Recovery Options ──────────────────│
│ │
│ • Retry failed step │
│ • Resume from last checkpoint (30K tokens) │
│ • Abort workflow (confirmation required) │
│ │
└─────────────────────────────────────────────────────────┘

```

**Features:**
- **4 tabs:** Overview, Steps, Context, History
- **Steps tab:** Complete step list with status, duration, actions taken
- **Context tab:** Key-value pairs passed between steps (e.g., `taskId: 123`, `planFile: current-plan.md`)
- **History tab:** Previous executions of this workflow type (last 10)
- **Validation rules:** List of rules enforced by workflow state machine
- **Recovery options:** Retry, resume, abort buttons with confirmations

---

**4. Workflow Analytics Charts**

```

┌─────────────────────────────────────────────────────────┐
│ 📊 Workflow Analytics Dashboard │
│ │
│ Success Rate by Workflow │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 5-Step Protocol ████████████████████ 92% │ │
│ │ Git Workflow ███████████████████████ 98% │ │
│ │ Checkpoint ██████████████████████ 95% │ │
│ │ Testing ████████████████████ 90% │ │
│ │ Documentation ███████████████████████ 97% │ │
│ └───────────────────────────────────────────────────┘ │
│ Target: >95% ───────────────────────────────────────── │
│ │
│ Execution Duration Trend (Last 30 Days) │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ╱╲ │ │
│ │ ╱ ╲ ╱╲ │ │
│ │ ╱ ╲ ╱ ╲ ╱╲ │ │
│ │ ╱ ╲ ╱ ╲ ╱ ╲ │ │
│ │ ╱ ╲╱ ╲╱ ╲ │ │
│ │ Week 1 Week 2 Week 3 Week 4 │ │
│ └───────────────────────────────────────────────────┘ │
│ Average: 35m | Trend: Decreasing ↓ (15% improvement) │
│ │
│ Failure Breakdown │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Skipped Step: 45% │ │
│ │ Validation Error: 30% │ │
│ │ Timeout: 15% │ │
│ │ Other: 10% │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

```

**Features:**
- **Bar chart:** Success rate per workflow (color-coded: green >95%, yellow 80-95%, red <80%)
- **Line chart:** Execution duration trend over time (last 30 days)
- **Pie chart:** Failure breakdown by type (skipped step, validation error, timeout, other)
- **Key metrics:** Average duration, trend direction (improving/worsening)
- **Export:** Download charts as PNG or CSV data

---

#### 3.3.4 Interaction Patterns

**1. View Active Workflow Details**
- **Trigger:** Click on active workflow card
- **Action:** Workflow detail panel slides in from right (400px width)
- **Animation:** Smooth 300ms ease-in-out transition
- **Panel content:** 4 tabs (Overview, Steps, Context, History)
- **Close action:** Click [X] button or press Esc key

**2. Pause/Resume Workflow (Manual Override)**
- **Trigger:** Click [Pause Workflow] button on active workflow card
- **Confirmation modal:**
```

⚠️ Pause Workflow?

Pausing "5-Step Mandatory Protocol" will:

- Stop current step execution
- Save checkpoint at current token count
- Require manual resume to continue

[Cancel] [Pause Workflow]

```
- **Action:** Workflow status changes to PAUSED
- **UI update:** [Pause] button changes to [Resume Workflow] (coral color)
- **Resume:** Click [Resume Workflow] → Workflow continues from paused step

**3. Retry Failed Step**
- **Trigger:** Click [Retry] button on failed step in workflow detail panel
- **Action:** Re-executes failed step from beginning
- **UI feedback:** Step status changes to 🔄 In Progress
- **Notification:** Toast notification: "Retrying Step 3: Expert Consultation..."
- **Success:** Step status changes to ✅ Complete
- **Failure:** Step status remains ❌ Failed, error message displayed

**4. Filter Workflow History**
- **Trigger:** Click date range dropdown or status dropdown
- **Date range options:** Last 7 days, Last 30 days, Last 90 days, All time
- **Status options:** All, Success, Warning, Failed
- **Action:** History list updates immediately (client-side filtering)
- **URL update:** Query params update (e.g., `?range=7days&status=success`)
- **Persistent:** Filters persist across page reloads (stored in URL)

**5. View Workflow Context Data**
- **Trigger:** Click [View Context] button on active workflow card
- **Modal displayed:**
```

🔍 Workflow Context

taskId: 456
planFile: .agent/task/current-plan.md
expertReports: [react-expert-20251102.md, next-js-expert-20251102.md]
filesModified: 12
tokenCount: 30000
checkpointFile: .agent/task/checkpoint-30K.md

[Copy JSON] [Close]

````
- **Action:** Display key-value pairs in readable format
- **Copy JSON:** Copy entire context object to clipboard
- **Close:** Click [Close] button or press Esc key

---

#### 3.3.5 Real-Time Features (WebSocket)

**1. Active Workflow Step Updates**
- **Event:** Agent completes a step
- **WebSocket message:** `{"type": "workflow.step.complete", "workflowId": 123, "step": 2}`
- **UI update:**
- Progress bar animates (e.g., 40% → 60%)
- Step 2 icon changes: 🔄 → ✅
- Step 3 icon changes: ⏳ → 🔄
- Current step label updates: "Step 2" → "Step 3"
- **Animation:** Smooth 500ms transition

**2. Step Completion Notifications**
- **Event:** Agent completes any step
- **Notification type:** Toast notification (bottom-right corner)
- **Content:** "✅ Step 2: Create Plan completed (15 minutes)"
- **Duration:** Auto-dismiss after 5 seconds
- **Action:** Click notification → Navigate to workflow detail panel

**3. Validation Alerts**
- **Event:** Agent skips required step (validation failure)
- **WebSocket message:** `{"type": "workflow.validation.error", "workflowId": 123, "step": 2, "error": "Step 2 (Create Plan) is required"}`
- **UI update:**
- Red banner appears at top of page:
  ```
  ⚠️ Validation Error: Step 2 (Create Plan) is required
  [View Workflow] [Dismiss]
  ```
- Workflow card shows ⚠️ warning badge
- Step 2 icon changes to ⚠️ Warning
- **Agent alert:** MCP tool returns validation error, blocking further steps

**4. Workflow Failure Notifications**
- **Event:** Workflow fails (e.g., step timeout, unrecoverable error)
- **Notification type:** Red alert banner (top of page, persistent)
- **Content:**
````

❌ Workflow Failed: 5-Step Mandatory Protocol
Error: Step 3 timed out after 30 minutes
[View Details] [Retry Step] [Abort Workflow]

```
- **Action buttons:**
- [View Details]: Opens workflow detail panel with error log
- [Retry Step]: Re-executes failed step
- [Abort Workflow]: Marks workflow as ABORTED, moves to history

**5. Workflow Completion Celebration**
- **Event:** Workflow completes successfully (all steps ✅)
- **Notification type:** Green success banner (top of page, 10 seconds)
- **Content:** "🎉 Workflow Complete: 5-Step Mandatory Protocol (45 minutes)"
- **Animation:** Confetti animation (optional, subtle)
- **UI update:** Workflow card moves from "Active" to "History" section

---

#### 3.3.6 User Journeys

**Agent Journey (95% - Typical Workflow Execution)**

**Scenario:** Agent implements "Implement Search Feature" task using 5-step protocol

```

1. Agent: sprint.getCurrentTask() → Gets taskId: 456
2. Agent: workflow.start("5-step-protocol", taskId: 456) → Workflow created
3. UI: Active workflow card appears, Step 1 highlighted 🔄
4. Agent: workflow.completeStep(workflowId, 1, context: {sessionFile: "current-session.md"})
5. UI: Step 1 icon changes to ✅, Step 2 becomes current (progress: 20%)
6. Agent: workflow.completeStep(workflowId, 2, context: {planFile: "current-plan.md"})
7. UI: Step 2 icon changes to ✅, Step 3 becomes current (progress: 40%)
8. Agent: workflow.completeStep(workflowId, 3, context: {experts: ["react-expert", "next-js-expert"]})
9. UI: Step 3 icon changes to ✅, Step 4 becomes current (progress: 60%)
10. Agent: [Implementation work - 30K tokens]
11. Agent: sprint.checkpoint(taskId, 30000, 0.6) → Checkpoint created
12. UI: Checkpoint marker 🔖 appears on timeline at 30K
13. Agent: workflow.completeStep(workflowId, 4, context: {filesModified: 12})
14. UI: Step 4 icon changes to ✅, Step 5 becomes current (progress: 80%)
15. Agent: workflow.completeStep(workflowId, 5, context: {committed: true})
16. UI: Step 5 icon changes to ✅, progress: 100%
17. Agent: workflow.complete(workflowId)
18. UI: 🎉 Success banner appears, workflow moves to history

```

**Human Interaction:** Zero required (agent completes workflow autonomously)

**UI Features Used:**
- Real-time progress bar (WebSocket updates)
- Step status icons (🔄 → ✅ transitions)
- Checkpoint markers (15K, 30K, 45K)
- Success notification (green banner)

---

**Human Journey (5% - Monitoring & Debugging)**

**Scenario:** Human developer notices workflow stuck at 60%, investigates and resumes

```

1. Human: Opens Workflow page → Sees active workflow at 60% (Step 4)
2. Human: Clicks workflow card → Detail panel slides in
3. Human: Views "Steps" tab → Sees Step 4 in progress (30 minutes)
4. Human: Clicks "Context" tab → Reviews context data:
   - taskId: 456
   - filesModified: 12
   - tokenCount: 30000
   - checkpointFile: checkpoint-30K.md
5. Human: Notices agent might be stuck, clicks [Pause Workflow]
6. UI: Confirmation modal appears: "Pause Workflow?"
7. Human: Clicks [Pause Workflow] → Workflow status: PAUSED
8. Human: Checks agent logs (external tool), identifies issue
9. Human: Fixes blocker (e.g., resolves git conflict)
10. Human: Returns to Workflow page, clicks [Resume Workflow]
11. UI: Confirmation modal: "Resume Workflow?"
12. Human: Clicks [Resume Workflow] → Agent continues from Step 4
13. Agent: Completes Step 4 → UI shows ✅, progress: 80%
14. Agent: Completes Step 5 → Workflow complete 🎉
15. Human: Reviews workflow history → Success (45 minutes total)

```

**Human Interaction:** Manual pause/resume (3 clicks)

**UI Features Used:**
- Active workflow card (monitoring)
- Workflow detail panel (debugging)
- Context tab (understanding state)
- Pause/Resume buttons (manual override)
- Workflow history (verification)

---

**Human Journey (5% - Weekly Sprint Review)**

**Scenario:** End of week, review workflow analytics to assess agent performance

```

1. Human: Opens Workflow page → Clicks [Workflow Analytics Dashboard]
2. UI: Dashboard displays:
   - Success rate: 5-Step Protocol: 92% (target: >95%) ⚠️ Below target
   - Execution duration trend: Decreasing ↓ (15% improvement)
   - Failure breakdown: Skipped Step: 45%, Validation Error: 30%
3. Human: Clicks "5-Step Protocol" bar (92% success) → Drills down
4. UI: Shows last 20 executions:
   - 18 success ✅
   - 2 warnings ⚠️ (Step 2 skipped once, Step 3 timed out once)
5. Human: Clicks warning execution → Views failure details:
   - Workflow #237: Step 2 skipped
   - Reason: Agent forgot to create plan (validation error)
   - Recovery: Manual retry after 10 minutes
6. Human: Notes improvement opportunity → Updates agent prompt to emphasize Step 2
7. Human: Closes workflow page, confident in agent performance trend (improving)

```

**Human Interaction:** Review analytics (5 clicks), identify pattern (2 failures), action item (update prompt)

**UI Features Used:**
- Workflow analytics dashboard (overview)
- Bar chart (success rate per workflow)
- Failure breakdown (pie chart)
- Drill-down (click to view executions)
- Execution history (detailed logs)

---

#### 3.3.7 Accessibility (WCAG 2.1 AA)

**Keyboard Navigation:**
- **Tab:** Navigate between workflow cards, buttons, filters
- **Enter:** Activate buttons (View Details, Pause, Resume)
- **Esc:** Close modals, detail panels
- **Arrow keys:** Navigate step list (up/down), chart data (left/right)

**Screen Reader Support:**
- **ARIA labels:** All interactive elements have descriptive labels
  - `aria-label="Active Workflow: 5-Step Protocol, Step 4 of 5, 60% complete"`
  - `aria-label="Workflow History, showing 50 executions"`
- **Live regions:** Real-time updates announced
  - `aria-live="polite"` for step completions
  - `aria-live="assertive"` for validation errors
- **Focus management:** Focus moves to opened modal/panel

**Color Contrast:**
- **Success (green):** #10b981 on dark background (4.5:1 ratio)
- **Warning (yellow):** #f59e0b on dark background (4.5:1 ratio)
- **Error (red):** #ef4444 on dark background (4.5:1 ratio)
- **Coral accent:** #ff6b6b on dark background (4.5:1 ratio)

**Visual Indicators:**
- **Not just color:** Icons accompany color (✅ ⚠️ ❌ 🔄 ⏳)
- **Progress bar:** Numeric percentage + visual bar
- **Status badges:** Text + icon + color

---

#### 3.3.8 Performance Considerations

**Initial Load:**
- **Target:** Page loads in <2 seconds (FCP)
- **Strategy:** Server-side rendering (Next.js RSC), static generation for templates
- **Data:** Fetch only active workflows + last 10 history items initially
- **Analytics:** Lazy-load charts on scroll/tab switch

**Real-Time Updates:**
- **WebSocket connection:** Persistent connection for active workflows only
- **Polling fallback:** Poll every 5 seconds if WebSocket unavailable
- **Debouncing:** Batch rapid updates (e.g., multiple step completions within 1 second)

**Large Datasets:**
- **Workflow history:** Paginate (50 items per page)
- **Analytics:** Server-side aggregation, cache results (1 hour TTL)
- **Filters:** Client-side filtering for <100 items, server-side for >100 items

---

#### 3.3.9 Acceptance Criteria

✅ **Display all 12 predefined workflows** in templates list
✅ **Show active workflow status** in real-time (WebSocket updates, progress bar animates)
✅ **View workflow history** (last 50 executions with date/status filters)
✅ **Calculate success rate** per workflow (displayed on analytics dashboard)
✅ **Alert when required step skipped** (banner notification + validation status ⚠️)
✅ **Support pause/resume workflow** (manual override with confirmation modal)
✅ **Show workflow context data** (key-value pairs in modal, copy to clipboard)
✅ **Display checkpoint markers** (15K, 30K, 45K tokens on timeline)
✅ **Workflow completion celebration** (🎉 green banner + confetti animation)
✅ **Accessibility compliance** (WCAG 2.1 AA: keyboard nav, screen reader, color contrast)

---

#### 3.3.10 Related Requirements & Cross-References

**Functional Requirements:**
- FR-026 to FR-050: Workflow Orchestration (25 requirements)
- FR-027: Define 12 predefined workflows
- FR-028: Implement workflow state machine
- FR-031: Validate workflow step execution
- FR-035: Support checkpoint recovery

**User Stories:**
- US-030 to US-055: Workflow Orchestration (26 stories, 75 points)
- US-033: Agent can view active workflows (3 pts)
- US-037: Agent receives validation alert when step skipped (5 pts)
- US-046: Human can pause/resume workflow (3 pts)

**Test Cases:**
- TEST-033 to TEST-060: Workflow tests (28 test cases)
- TEST-037: Validate workflow step execution
- TEST-046: Test pause/resume functionality

**Epic:**
- EPIC-002: Workflow Orchestration (95 story points total)

**MCP Tools:**
- `workflow.start(workflowType, context)` - Start workflow
- `workflow.completeStep(workflowId, stepNumber, context)` - Complete step
- `workflow.getActive()` - Get active workflows
- `workflow.getHistory(filters)` - Get workflow history
- `workflow.pause(workflowId)` - Pause workflow (manual override)
- `workflow.resume(workflowId)` - Resume workflow

**Related Pages:**
- Sprint Tracking page: Links to workflows for tasks
- Dashboard: Shows active workflow count

---

**End of Workflow Page Specification**

---
```

---

### PHASE 3: Update docs/03-Architecture.md Component Diagram (Around line 718)

**Find this:**

```markdown
Component(workflow_monitor, "Workflow Monitor", "React Server Components", "Active workflows<br/>Step progress<br/>Validation errors")
```

**Replace with:**

```markdown
Component(workflow_page, "Workflow Page", "React Server Components", "Standalone page for workflow management<br/>Active workflows<br/>Workflow history<br/>12 predefined templates<br/>Analytics dashboard")
```

**Also update any component boundary descriptions that reference "Workflow Monitor component within Sprint Tracking"**

---

### PHASE 4: Update docs/01-PRD.md Feature Description (Section 4.2.2)

**Find Section 4.2.2: Workflow Orchestration**

**Add this clarification sentence:**

```markdown
**UI Presence:** Workflow Orchestration has a **standalone top-level page** in main navigation (8th page), providing monitoring interface for all 12 predefined workflows.
```

---

### PHASE 5: Verify docs/13-Project-Plan.md Sprint Allocation (Lines 330-395)

**Check Sprint 2 and Sprint 3 deliverables**

**Ensure UI work for Workflow page is mentioned:**

- If Sprint 2 or 3 mentions "Workflow state machine" or "Workflow foundation"
- Add this to deliverables list:
  ```markdown
  - **Workflow page UI:** Monitoring interface with active workflows list, history, templates, analytics
  ```

**If NOT mentioned**, add as new deliverable:

```markdown
**Workflow UI Implementation:**

- Workflow page with 4 sections (Active, History, Templates, Analytics)
- Real-time updates (WebSocket integration)
- Workflow detail panel (slide-out with 4 tabs)
- Analytics charts (success rate, duration trend, failure breakdown)
```

---

### PHASE 6: Update docs/10-Observability-and-SRE.md Reference (Around line 2541)

**Find reference to "Workflow Monitor component"**

**Replace with:** "Workflow page" or "Workflow monitoring interface"

**Example:**

```markdown
# Before:

Checkpoint Workflow Monitoring is handled by the Workflow Monitor component within Sprint Tracking.

# After:

Checkpoint Workflow Monitoring is handled by the standalone Workflow page in main navigation.
```

---

## Success Criteria

✅ **docs/07-UI-UX.md:** Site map updated, navigation count updated, navigation bar updated, complete page specification written (~200-300 lines)

✅ **docs/03-Architecture.md:** Component diagram updated from "Workflow Monitor" to "Workflow Page"

✅ **docs/01-PRD.md:** Feature description clarified with "standalone top-level page" mention

✅ **docs/13-Project-Plan.md:** UI work for Workflow page verified in Sprint 2 or 3 deliverables

✅ **docs/10-Observability-and-SRE.md:** Reference updated from "component" to "page"

✅ **Consistency:** All 5 files reference Workflow as standalone page (not component)

✅ **Traceability:** FR-026 to FR-050 (existing) support the standalone page

✅ **Navigation:** Workflow appears as 8th top-level item in main navigation

---

## Implementation Notes

**Pattern to Follow:**

- Look at existing page specifications in docs/07-UI-UX.md:
  - Issues page (lines 342-346)
  - Knowledge Graph page (lines 348-352)
  - Skills page (lines 354-358)
  - Project Health page (lines 366-370)
- Use similar structure: sub-pages, components, interaction patterns, user journeys

**12 Predefined Workflows:**

1. 5-Step Mandatory Protocol
2. Session Start Workflow
3. Git Workflow
4. Checkpoint Workflow
5. 3-Tier Persistence Workflow
6. Plan Creation Workflow
7. Expert Consultation Workflow
8. Testing Workflow
9. Documentation Generation Workflow
10. Code Review Workflow
11. Deployment Workflow
12. Recovery Workflow

**Key Features to Emphasize:**

- **Agent-first:** 95% MCP interaction, 5% UI monitoring
- **Real-time:** WebSocket-powered updates for step progress
- **Validation:** Alerts when required step skipped
- **Manual override:** Pause/resume capabilities
- **Analytics:** Success rate >95% target, failure analysis

---

## Files to Read for Context

**Before starting, read these files to understand existing patterns:**

1. `docs/07-UI-UX.md` (lines 325-450) - Site map + navigation patterns
2. `docs/02-SRS.md` (lines 835-1542) - FR-026 to FR-050 (workflow requirements)
3. `docs/03-Architecture.md` (around line 718) - Workflow Monitor component
4. `docs/12-Backlog.md` - US-030 to US-055 (workflow user stories)

---

## Commit Message After Completion

```bash
docs: add Workflow as standalone top-level page in navigation

- Update site map in 07-UI-UX.md (add Workflow between Sprint and Issues)
- Write complete Workflow page specification (~250 lines)
  - Overview, layout structure, 4 UI components
  - Interaction patterns, real-time features (WebSocket)
  - Agent journey (95%) + Human journey (5%)
  - 12 predefined workflows documented
  - Acceptance criteria and cross-references
- Update navigation bar example (add Workflow button)
- Update navigation count (7 → 8 main sections)
- Update component diagram in 03-Architecture.md (Workflow Monitor → Workflow Page)
- Clarify feature description in 01-PRD.md (standalone page)
- Verify UI work in 13-Project-Plan.md (Sprint 2-3 deliverables)
- Update observability reference in 10-Observability-and-SRE.md

Workflow now elevated from component to 8th top-level page.
All requirements (FR-026 to FR-050) and user stories (US-030 to US-055) support standalone page.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Ready to Execute!

Follow phases 1-6 in order. Estimated time: 2-3 hours for complete documentation update.
