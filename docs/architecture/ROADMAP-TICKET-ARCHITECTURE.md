# Roadmap UI & Ticket System Architecture

**Version:** 1.0.0
**Last Updated:** 2025-11-25
**Status:** Architecture Specification
**Related Sprints:** Sprint 9.5 (Roadmap UI), Sprint 10 (Ticket System)

---

## Executive Summary

This document clarifies the architectural relationship between three interconnected systems in ProjectPulse:

1. **Roadmap UI** (Sprint 9.5) - Timeline visualization and progress tracking
2. **Ticket System** (Sprint 10) - Detailed work items for agent execution
3. **Project Plan Document** (Session 2) - Source of truth for planning

**Key Insight:** Roadmap UI answers "**when**" work happens; Ticket System answers "**what**" needs to be done. Together they provide the complete picture agents need to execute work effectively.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ONBOARDING (Sessions 1-3)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Session 1: Strategic Planning     Session 2: Document Generation           │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │ 96 Q&A → Executive Summary  │ → │ 13-Project-Plan.md (stored in DB)   │  │
│  │ (project context gathered)  │   │ - Detailed phase breakdown          │  │
│  └─────────────────────────────┘   │ - Sprint goals & deliverables       │  │
│                                    │ - Week-by-week tasks                 │  │
│                                    │ - Success criteria                   │  │
│                                    └─────────────────────────────────────┘  │
│                                                      │                      │
│                                                      ▼                      │
│  Session 3: AI Workflow Bootstrap                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Materialize Roadmap: Parse Project-Plan → Create DB hierarchy           ││
│  │ Phase → Sprint → Week → Day → Task (empty containers)                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RUNTIME SYSTEMS (Post-Onboarding)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐         ┌─────────────────────────────────┐   │
│  │    ROADMAP UI           │         │       TICKET SYSTEM              │   │
│  │   (Sprint 9.5)          │         │       (Sprint 10)                │   │
│  │                         │         │                                  │   │
│  │  "WHEN does work        │  Link   │  "WHAT needs to be done"        │   │
│  │   happen?"              │◄───────►│                                  │   │
│  │                         │         │  WorkItem Tickets:               │   │
│  │  Phase 1: Foundation    │         │  - kind: 'feature'               │   │
│  │  ├── Sprint 1           │         │  - kind: 'task'                  │   │
│  │  │   ├── Week 1         │         │  - kind: 'epic'                  │   │
│  │  │   │   ├── Day 1      │         │  - linkedTaskId → Task           │   │
│  │  │   │   │   └── Task ──┼─────────┼─►Full requirements               │   │
│  │  │   │   │       (empty │         │  Acceptance criteria             │   │
│  │  │   │   │       slot)  │         │  File attachments                │   │
│  │                         │         │  Comments/discussion             │   │
│  │  Progress: 25%          │         │                                  │   │
│  │  Timeline View          │         │  Issue Tickets:                  │   │
│  │  Tree View              │         │  - kind: 'issue'                 │   │
│  └─────────────────────────┘         │  - kind: 'bug'                   │   │
│                                      │  - kind: 'scanner_finding'       │   │
│                                      │  - May link to Task (optional)   │   │
│                                      │                                  │   │
│                                      │  Bugs found during development   │   │
│                                      │  Security scan findings          │   │
│                                      │  Technical debt items            │   │
│                                      └─────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AGENT WORKFLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Agent asks: "What should I work on?"                                       │
│                                                                             │
│  Step 1: Get current position in timeline                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ MCP: getCurrentPosition(projectId) → Returns current Task               ││
│  │ Response: "Phase 1 → Sprint 1 → Week 1 → Day 3 → Task: Setup Auth"     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Step 2: Get detailed work items for the Task                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ MCP: ticket.search({ linkedTaskId: taskId, kind: 'feature' })           ││
│  │ Response: [                                                              ││
│  │   {                                                                      ││
│  │     id: "ticket-123",                                                    ││
│  │     title: "Implement JWT Authentication",                               ││
│  │     kind: "feature",                                                     ││
│  │     description: "Create login/register endpoints with JWT...",         ││
│  │     acceptanceCriteria: ["JWT tokens work", "Password hashing", ...],   ││
│  │     linkedTaskId: "task-xyz"                                             ││
│  │   }                                                                      ││
│  │ ]                                                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Step 3: Agent executes work based on Ticket details                        │
│                                                                             │
│  Step 4: Agent finds a bug during development                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ MCP: ticket.create({                                                     ││
│  │   title: "Login fails when password contains special chars",            ││
│  │   kind: "issue",                                                         ││
│  │   description: "Found during JWT implementation...",                     ││
│  │   linkedTaskId: "task-xyz" // Optional: link to current task            ││
│  │ })                                                                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Step 5: Update progress when done                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ MCP: ticket.setStatus({ ticketId: "ticket-123", status: "done" })       ││
│  │ → Progress auto-rolls up: Task → Day → Week → Sprint → Phase            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model Relationship

### Current State (Sprint 9.5)

```prisma
// Roadmap Hierarchy (5 levels)
model Phase {
  id        String   @id @default(cuid())
  projectId Int
  title     String
  progress  Int      @default(0)  // Auto-calculated from children
  sprints   Sprint[]
}

model Sprint {
  id       String @id @default(cuid())
  phaseId  String
  title    String
  progress Int    @default(0)
  weeks    Week[]
}

model Week {
  id       String @id @default(cuid())
  sprintId String
  title    String
  progress Int    @default(0)
  days     Day[]
}

model Day {
  id       String @id @default(cuid())
  weekId   String
  title    String
  progress Int    @default(0)
  tasks    Task[]
}

model Task {
  id          String    @id @default(cuid())
  dayId       String
  title       String    // "Setup authentication" - HIGH LEVEL
  description String?   // Brief description
  progress    Int       @default(0)
  status      TaskStatus
  sessions    Session[]
  // NO detailed requirements - just a timeline placeholder
}
```

### Future State (Sprint 10 - Ticket System)

```prisma
// Unified Ticket Model (NEW in Sprint 10)
model Ticket {
  id            String       @id @default(cuid())
  projectId     Int

  // Core fields
  title         String       // "Implement JWT authentication"
  description   String?      // Full detailed requirements (Markdown)
  kind          TicketKind   // 'feature' | 'task' | 'issue' | 'bug' | 'epic' | 'scanner_finding'
  status        TicketStatus // 'todo' | 'in_progress' | 'done' | 'blocked'
  priority      Priority     // 'critical' | 'high' | 'medium' | 'low'

  // Assignment
  assigneeType  AssigneeType? // 'human' | 'agent_persona'
  assigneeId    String?       // User ID or AgentPersona ID

  // Roadmap linkage (KEY RELATIONSHIP)
  linkedTaskId  String?       // Optional: Link to Task in roadmap hierarchy
  linkedTask    Task?         @relation(fields: [linkedTaskId], references: [id])

  // Source tracking
  source        TicketSource  // 'manual' | 'onboarding' | 'scanner' | 'agent'
  createdBy     String        // User ID or "agent:<persona>"

  // Rich content
  acceptanceCriteria Json?    // Array of criteria
  attachments       Json?     // File references
  metadata          Json?     // Custom fields

  // Relations
  labels        Label[]
  comments      Comment[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum TicketKind {
  feature          // Planned feature work (linked to Tasks)
  task             // Sub-task of a feature
  epic             // Large work item spanning multiple tasks
  issue            // Bug/problem found during development
  bug              // Alias for issue (user preference)
  scanner_finding  // Automated security/quality finding
  tech_debt        // Technical debt item
}

// Updated Task model with Ticket relation
model Task {
  id          String    @id @default(cuid())
  dayId       String
  title       String
  progress    Int       @default(0)
  status      TaskStatus

  // NEW: Tickets linked to this task
  tickets     Ticket[]  // One Task can have multiple Tickets
}
```

---

## Ticket Kinds Explained

### WorkItem Tickets (Planned Work)

| Kind | Purpose | Created By | Linked to Task? |
|------|---------|------------|-----------------|
| `feature` | New functionality to implement | Onboarding, Human, Agent | **Yes** (required) |
| `task` | Sub-task within a feature | Human, Agent | **Yes** (required) |
| `epic` | Large work spanning multiple sprints | Onboarding, Human | Optional |
| `tech_debt` | Refactoring, cleanup work | Human, Agent | Optional |

**Example:** "Implement user authentication with JWT" → `kind: 'feature'`, linked to Task "Setup Auth" in Day 3

### Issue Tickets (Reactive Work)

| Kind | Purpose | Created By | Linked to Task? |
|------|---------|------------|-----------------|
| `issue` | General problem found | Human, Agent | Optional |
| `bug` | Confirmed bug in code | Human, Agent | Optional |
| `scanner_finding` | Automated scan result | Security scanner | Optional |

**Example:** "Login fails with special characters" → `kind: 'bug'`, optionally linked to Task being worked on

---

## Where Each System Fits

### Roadmap UI (Sprint 9.5) - The "When" View

**Purpose:**
- Timeline visualization of project schedule
- Progress tracking at all hierarchy levels
- Gantt-style or tree-style navigation
- Shows current position in development

**Contains:**
- Phase/Sprint/Week/Day/Task hierarchy
- Progress percentages (auto-rollup)
- Timeline dates and durations
- High-level task titles

**Does NOT contain:**
- Detailed requirements
- Acceptance criteria
- File attachments
- Discussion/comments

### Ticket System (Sprint 10) - The "What" View

**Purpose:**
- Detailed work item management
- Full requirements and acceptance criteria
- Agent execution context
- Issue/bug tracking

**Contains:**
- Full requirements (Markdown)
- Acceptance criteria
- Attachments and context
- Comments and discussion
- Assignment (human or agent)
- Priority and status

**Links to:**
- Tasks in Roadmap (via `linkedTaskId`)

### Project Plan Document (Session 2) - The Source

**Purpose:**
- Comprehensive project planning document
- Generated during onboarding Session 2
- Contains detailed breakdown of all phases

**Used for:**
1. **Session 3 Bootstrap:** Parse → Create Roadmap hierarchy
2. **Sprint 10 (Future):** Parse → Auto-generate WorkItem tickets

---

## Agent Workflow Integration

### How Agents Use Both Systems

```
┌──────────────────────────────────────────────────────────────────┐
│                     AGENT SESSION START                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Load Context                                                 │
│     └─ MCP: memory.sessionStart(projectId)                       │
│        Returns: Memory banks with project context                │
│                                                                  │
│  2. Get Current Position (Roadmap)                               │
│     └─ MCP: sprint.getCurrentPosition(projectId)                 │
│        Returns: {                                                │
│          phase: "Phase 1: Foundation",                           │
│          sprint: "Sprint 1",                                     │
│          week: "Week 1",                                         │
│          day: "Day 3",                                           │
│          task: { id: "task-xyz", title: "Setup Auth" }           │
│        }                                                         │
│        └─ Agent knows WHERE in timeline they are                 │
│                                                                  │
│  3. Get Work Items (Tickets)                                     │
│     └─ MCP: ticket.search({                                      │
│          linkedTaskId: "task-xyz",                               │
│          status: ["todo", "in_progress"]                         │
│        })                                                        │
│        Returns: [{                                               │
│          id: "ticket-123",                                       │
│          title: "Implement JWT Authentication",                  │
│          kind: "feature",                                        │
│          description: "Full requirements...",                    │
│          acceptanceCriteria: [...]                               │
│        }]                                                        │
│        └─ Agent knows WHAT to implement                          │
│                                                                  │
│  4. Execute Work                                                 │
│     └─ Agent implements based on Ticket requirements             │
│                                                                  │
│  5. Log Issue (if problem found)                                 │
│     └─ MCP: ticket.create({                                      │
│          title: "Bug found during auth work",                    │
│          kind: "issue",                                          │
│          linkedTaskId: "task-xyz"                                │
│        })                                                        │
│                                                                  │
│  6. Mark Complete                                                │
│     └─ MCP: ticket.setStatus({                                   │
│          ticketId: "ticket-123",                                 │
│          status: "done"                                          │
│        })                                                        │
│     └─ Progress auto-rolls up through hierarchy                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### MCP Tools Summary

| Tool | System | Purpose |
|------|--------|---------|
| `sprint.getCurrentPosition` | Roadmap | Get current location in timeline |
| `sprint.getPhaseProgress` | Roadmap | Get full phase hierarchy with progress |
| `roadmap.getPhaseProgress` | Roadmap | Same as above, alternate naming |
| `ticket.create` | Tickets | Create new work item or issue |
| `ticket.search` | Tickets | Find tickets by filters |
| `ticket.setStatus` | Tickets | Update ticket status |
| `ticket.addComment` | Tickets | Add discussion to ticket |
| `issue.create` | Tickets | Create issue (delegates to ticket.create with kind='issue') |
| `issue.search` | Tickets | Search issues (delegates to ticket.search with kind filter) |

---

## Implementation Timeline

### Sprint 9.5 (Current) - Roadmap UI

**Status:** ✅ Complete

- [x] 5-level hierarchy UI (Phase/Sprint/Week/Day/Task)
- [x] Tree view and Timeline view
- [x] Progress auto-rollup
- [x] MCP tools for position queries
- [x] Roadmap creation wizard
- [x] Import from JSON

### Sprint 10 (Future) - Ticket System

**Status:** 📅 Planned

**Week 1:**
- [ ] Ticket Prisma model
- [ ] Migration from Issue to Ticket
- [ ] `/api/tickets` REST endpoints
- [ ] Issue→Ticket adapter layer

**Week 2:**
- [ ] `ticket.*` MCP tools
- [ ] `issue.*` adapter tools
- [ ] UI refactor (Issues → Tickets)
- [ ] Dashboard integration

### Future Enhancement (Post-Sprint 10)

**Auto-generate WorkItem Tickets from Project Plan:**
- Parse 13-Project-Plan.md stored in DB
- For each task in the document, create a Ticket with `kind='feature'`
- Link each Ticket to corresponding Task in Roadmap
- Agent gets detailed requirements automatically

---

## Key Distinctions

| Aspect | Roadmap UI | Ticket System |
|--------|-----------|---------------|
| **Question answered** | "When does work happen?" | "What needs to be done?" |
| **Granularity** | High-level (Phase/Sprint/Week/Day/Task) | Detailed (full requirements) |
| **Content** | Titles, dates, progress | Requirements, criteria, discussion |
| **Created from** | Session 3 Bootstrap (Project Plan) | Manual, onboarding, or agent |
| **Primary user** | Human (progress monitoring) | Agent (work execution) |
| **Progress tracking** | Auto-rollup percentages | Status workflow |

---

## Summary

**Roadmap UI** provides the timeline structure - when work should happen and how progress flows up through the hierarchy. It's the "calendar" view of your project.

**Ticket System** provides the work item details - what exactly needs to be done, acceptance criteria, and discussion. It's the "task list" with full context.

**Together** they give agents everything needed:
1. Where am I in the project? (Roadmap)
2. What should I work on? (Tickets linked to current Task)
3. How do I know I'm done? (Acceptance criteria in Ticket)
4. Where do I log problems? (Issue tickets)

---

## References

- [Sprint 10 Project Plan Section](../13-Project-Plan.md#sprint-10-weeks-19-20-ticket-system)
- [EPIC-004: Issues](../12-Backlog.md#epic-004-issues)
- [Roadmap UI Feature Spec](../features/roadmap-ui-standalone.md)
- [Session 3 Bootstrap](../features/onboarding-session-3.md)
