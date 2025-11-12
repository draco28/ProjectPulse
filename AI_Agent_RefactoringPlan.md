---
**⚠️ STATUS: SUPERSEDED - DO NOT IMPLEMENT**

**Resolution Date**: 2025-11-13
**Resolution Type**: Analysis revealed fundamental misunderstanding

**Summary**: This refactoring plan was based on the assumption that Task/Session entities were incorrectly implemented dogfooding tools that needed replacement with a "Ticket" system. Analysis revealed this assumption was false.

**Actual Situation**:
- ✅ **Task/Session ARE correct product features** - They form the 5-level hierarchy (Phase→Week→Day→Task→Session) for end users' AI agents to track development work
- ✅ **Implemented and working** - 243 story points successfully tracked across 5 sprints using these entities
- ✅ **Properly documented** - PRD Section 4.2.1, Data Model Section 3.1, and Backlog EPIC-001 all correctly describe them as end user features
- ⚠️ **"Ticket system" is a future enhancement** - Not a replacement, but a Phase 2 (Sprint 10) memory bank snapshot enhancement to the existing Task model

**Correct Path Forward**:
1. ✅ **Keep Task/Session as-is** - They are the proven MVP implementation
2. ✅ **Defer memory bank snapshots to Phase 2 (Sprint 10)** - Enhancement, not replacement
3. ✅ **Focus on Sprint 5.5 MCP server** - Critical blocker for 90% use case

**What Changed**:
- PRD Section 4.2.12: Now marked as "Phase 2 Enhancement (Post-MVP)" with clear explanation
- PRD Feature Priority Table: Ticket system changed from P0 to P3 (Phase 2)
- Project Plan: Added Sprint 10 for memory bank snapshot integration (non-breaking enhancement)
- CLAUDE.md & docs/README.md: Added clarification that .agent/ folder is internal tooling
- Task/Session entities: **NO CHANGES** - Working correctly as product features

**Resolution Document**: See docs/13-Project-Plan.md Sprint 10 for the correct approach (enhance existing Task model with optional memory snapshots, fully backward compatible).

**For Historical Reference**: The original plan below is preserved to understand the thinking that led to this investigation, which ultimately confirmed the current architecture is correct.

---

# The AI Agent's Refactoring Plan (SUPERSEDED - See header above)

To (Claude Code): Your objective is to execute a surgical refactoring of the entire documentation set. The goal is to create a single, unified source of truth based on the architect's clarified vision.

The "North Star" Vision:

The Plan (Roadmap): A high-level hierarchy of Phase -> Week -> Day. This is stored in the database and visualized in the "Development Cycle" UI page. Its progress is rolled up from completed work.

The Work (Tickets): The granular, agent-facing work item. This is the Ticket entity. A Ticket contains TicketCheckpoints and MemoryBankSnapshots. This is what agents use MCP tools to create, update, and complete.

The Backlog (Issues): The high-level "what" (bugs, features). This is the Issue entity.

The Links (Critical):

A Ticket is linked to a Day (e.g., dayId). This allows its completion to roll up and update the Plan's progress.

A Ticket is linked to an Issue (e.g., issueId). This provides traceability from the backlog to the work.

Deprecation: The old Task and Session entities are now 100% obsolete and must be removed. Ticket and TicketCheckpoint replace them.

You will now execute the following 6-phase plan to align all documents with this "North Star."

Phase 1: Purge Obsolete and Internal Files
The context is polluted with retired and internal-facing documents. We must clean this first.

Delete Retired Files: These files contain outdated, UI-first information and obsolete MCP specs that contradict the new agent-first vision.

DELETE: 00-INDEX.md

DELETE: 03-MCP-SPECIFICATION.md

Quarantine Internal Tooling: The quick start guide is for building ProjectPulse, not using it. It must be moved so it doesn't confuse the product's context.

MOVE: 07-QUICK-START.md -> internal/BUILD-GUIDE.md

Archive Historical Context: The "Sprint 0" section in 13-Project-Plan.md is historical context, not a future plan.

CUT: The entire "Sprint 0 (Week 1.5): UI Foundation" section from 13-Project-Plan.md.

CREATE: archive/SPRINT-0-UI-FOUNDATION-COMPLETED.md.

PASTE: Paste the cut content into this new archive file.

REPLACE: In 13-Project-Plan.md, replace the cut section with a single line:

Markdown

### Sprint 0 (Week 1.5): UI Foundation (Pre-work) - COMPLETE ✅

**Status:** ✅ **COMPLETE**
**Note:** The UI foundation (7 pages, 45+ components) was completed in Sprint 0. All work is preserved in `archive/SPRINT-0-UI-FOUNDATION-COMPLETED.md`. Sprints 1-9 focus on backend, MCP, and integration.
Phase 2: Refactor the Core Data Model (The "Database Bible")
File: 04-Data-and-Model-Spec.md

This document has the most critical misalignment. It is missing the Ticket system entirely.

Remove Obsolete Models:

In Section 3.1, delete the subsections for 3.1.4 Task Table and 3.1.5 Session Table.

In Section 2 (ERD), remove the Task and Session entities and their relationships.

In Section 7.2 (Indexes), delete all indexes for tasks and sessions.

Add the Ticket System Models:

Create a new section 3.9 Ticket & Work Management (4 Tables).

Add the following complete Prisma schemas to this new section.

Code snippet

// --- BEGIN PASTE for Section 3.9 ---

### 3.9 Ticket & Work Management (4 Tables)

**Purpose:** Replaces the obsolete Task/Session model. This is the granular, agent-facing work item, containing all context, checkpoints, and progress.

#### 3.9.1 Ticket Table

model Ticket {
  id          Int      @id @default(autoincrement())
  title       String   @db.VarChar(500)
  description String?  @db.Text
  status      TicketStatus @default(OPEN)
  priority    IssuePriority @default(P2)
  progress    Decimal  @default(0.0) @db.Decimal(4, 3) // 0.000 to 1.000

  // Foreign Keys (The Links)
  dayId       Int
  issueId     Int?     // Optional: A ticket may not always map to a backlog Issue

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  day         Day     @relation(fields: [dayId], references: [id])
  issue       Issue?  @relation(fields: [issueId], references: [id], onDelete: SetNull)
  checkpoints TicketCheckpoint[]
  snapshot    MemoryBankSnapshot? // A ticket has one snapshot

  @@index([dayId])
  @@index([issueId])
  @@index([status, priority])
  @@map("tickets")
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  BLOCKED
  IN_REVIEW
  COMPLETED
  CLOSED
}

#### 3.9.2 TicketCheckpoint Table

model TicketCheckpoint {
  id          Int      @id @default(autoincrement())
  ticketId    Int
  tokenUsage  Int      @default(0)
  progress    Decimal  @db.Decimal(4, 3) // Progress *at time of checkpoint*
  notes       String   @db.Text // Agent's notes: "Implemented X, tests Y"

  createdAt   DateTime @default(now())

  // Relationships
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId, createdAt])
  @@map("ticket_checkpoints")
}

#### 3.9.3 MemoryBankSnapshot Table

model MemoryBankSnapshot {
  id          Int      @id @default(autoincrement())
  ticketId    Int      @unique // Each ticket gets one snapshot

  // The frozen context
  projectBrief  String   @db.Text
  systemPatterns String  @db.Text
  techContext   String   @db.Text
  activeContext String   @db.Text
  progress      String   @db.Text

  createdAt   DateTime @default(now())

  // Relationships
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@map("memory_bank_snapshots")
}

// --- END PASTE for Section 3.9 ---
Add the Missing Issue Model:

In Section 3.2 (Issues Management), add the Issue model schema. It is defined in 02-SRS.md (FR-057) but was missing here.

Code snippet

// --- BEGIN PASTE for Section 3.2.1 ---

#### 3.2.1 Issue Table

model Issue {
  id                  Int           @id @default(autoincrement())
  title               String        @db.VarChar(500)
  description         String?       @db.Text
  status              IssueStatus   @default(OPEN)
  priority            IssuePriority @default(P2)
  createdBy           CreatedBy     @default(AGENT)

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  // Relationships
  comments            IssueComment[]
  relationsFrom       IssueRelationship[] @relation("FromIssue")
  relationsTo         IssueRelationship[] @relation("ToIssue")
  labels              Label[]       @relation("IssueLabels")
  tickets             Ticket[]      // An Issue can have multiple Tickets

  @@index([status, priority])
  @@index([createdAt])
  @@map("issues")
}
// --- END PASTE for Section 3.2.1 ---
Update the ERD:

In Section 2 (ERD), modify the Mermaid diagram:

Remove Task and Session.

Add Ticket, TicketCheckpoint, MemoryBankSnapshot, and Issue.

Draw the new relationships:

Day ||--o{ Ticket : "contains"

Issue ||--o{ Ticket : "implemented by"

Ticket ||--o{ TicketCheckpoint : "has"

Ticket ||--|| MemoryBankSnapshot : "has one"

Phase 3: Refactor the Product Backlog
File: 12-Backlog.md

This file is building the wrong foundation.

Modify EPIC-001: This epic is for the Plan, not the Work.

Rename: EPIC-001: Progress Tracking & Development Cycle Page -> EPIC-001: Project Roadmap & Planning

Modify Description: Change the description to: "Hierarchical project planning (Phase → Week → Day) with database storage and web UI visualization for high-level progress tracking. Progress is rolled-up from completed Tickets."

Modify User Stories: This is critical. The stories are wrong.

DELETE: US-001 (mentions Task/Session), US-003, US-004, US-009, US-017, US-023, US-024, US-025.

REWRITE: Rewrite the remaining stories to only apply to Phase, Week, and Day.

US-001 (New): "As an agent, I want to create a 3-level hierarchy (Phase/Week/Day) so I can build a project roadmap." (FR-001)

US-002 (Keep): "As a developer, I want progress to automatically roll up to parent levels (Day, Week, Phase) when a Ticket is completed." (FR-002)

US-005 (Keep): "...so that ROADMAP.md is always accurate." (Rename DEVELOPMENT_PLAN.md to ROADMAP.md for clarity).

...and so on. Purge all references to Task and Session.

Add the Ticket Epic: The most important epic is missing.

CREATE: A new, P0 (Must Have) epic: EPIC-013: Ticket & Work Management.

ADD STORIES: Add new user stories for the Ticket system.

US-013-01: "As an agent, I want to create a Ticket linked to a Day and an Issue so I can begin a specific work item."

US-013-02: "As an agent, I want ticket.create to automatically capture a MemoryBankSnapshot so my context is frozen and resilient."

US-013-03: "As an agent, I want to call ticket.addCheckpoint every 15K tokens, storing my notes and progress in the TicketCheckpoint table."

US-013-04: "As an agent, I want to call ticket.complete, which updates the Ticket status and triggers the progress roll-up to the parent Day."

US-013-05: "As an agent, I want to call ticket.getCurrent to resume work, loading the MemoryBankSnapshot and all TicketCheckpoints."

Phase 4: Refactor the Project Plan
File: 13-Project-Plan.md

This plan is building the wrong product.

Modify Sprint 1 (Foundation Setup):

REPLACE: The "Key Deliverables" are wrong.

Old: "Prisma schema: Phase, Week, Day, Task, Session tables..."

New: "Prisma schema: Phase, Week, Day, Issue, Label, Ticket, TicketCheckpoint, MemoryBankSnapshot tables..."

REPLACE: The MCP tools are wrong.

Old: "createTask, createSession"

New: "plan.createPhase, ticket.create, issue.create"

Re-Prioritize Sprint 9 (Memory Banks):

EPIC-010 (Memory Bank System) is a P0 (Must Have). It is a foundational dependency for TicketCheckpoints. It cannot be Sprint 9.

MOVE: Move Sprint 9 (Weeks 17-18) up.

INSERT: Insert it as Sprint 2 (Weeks 3-4).

RATIONALE: We must build the Memory Bank before we can build the Ticket system that snapshots them.

RE-NUMBER: All other sprints (Sprint 2 -> Sprint 3, Sprint 3 -> Sprint 4, etc.) must be pushed back.

Update Sprint 4 (Issues Backend Integration):

ADD NOTE: "UI REUSE: As per archive/SPRINT-0-UI-FOUNDATION-COMPLETED.md, the UI for this sprint is 100% complete. This sprint is backend integration only."

Phase 5: Refactor the Agent's "Brain" (Ops Plan)
File: 05-AgentOps-Plan.md

The agent's instructions are for the wrong data model.

Modify MCP Tools Catalog (Section 2.2):

RENAME: "Category 1: Sprint/Phase Tracking" -> "Category 1: Project Plan & Roadmap".

REWRITE: Delete all tools (sprint.phase.create, sprint.week.create, sprint.day.start, sprint.task.create, sprint.session.start).

ADD: Add new, simpler tools:

plan.createHierarchy (Takes a tree of Phases/Weeks/Days)

plan.getHierarchy (Returns the full project plan)

plan.getDay (Gets a specific Day to link a Ticket to)

Add New MCP Tool Category (Section 2.3):

CREATE: A new P0 section: "Category 2: Ticket & Work Management".

ADD: Add the new Ticket tools:

ticket.create(dayId: Int, issueId: Int, title: String)

ticket.addCheckpoint(ticketId: Int, notes: String, progress: Float, tokenUsage: Int)

ticket.complete(ticketId: Int)

ticket.getCurrent()

ticket.getContextSnapshot(ticketId: Int)

...and so on.

Update 5-Step Protocol (Section 3):

REWRITE: This protocol is based on the old model.

Step 1: Must call plan.getHierarchy and ticket.getCurrent.

Step 2: Must call ticket.create.

Step 4: Must call ticket.addCheckpoint.

Step 5: Must call ticket.complete.

Phase 6: Final Consistency Pass (SRS & Architecture)
File: 02-SRS.md

REWRITE: Section 1.1 (FR-001 to FR-025). These FRs must be rewritten.

FRs for Phase, Week, Day (The Plan) must be retained but simplified.

FRs for Task and Session must be deleted.

ADD: Add new FRs for the Ticket system (e.g., "FR-026: Create Ticket", "FR-027: Add Ticket Checkpoint"). Self-correction: These are already defined as FR-159-173 in the PRD, but are marked "Post-MVP". They must be re-numbered and moved to the MVP section.

MODIFY: Change all FRs to reflect the new model (e.g., "FR-002: Update Progress" must state "Progress rolls up from Tickets").

File: 03-Architecture.md

VALIDATE: The ERD in Section 2.4 is already more correct than the 04-Data-and-Model-Spec.md. This is good. We just need to ensure it's 100% aligned with the new schema from Phase 2 of this plan.

REWRITE: Section 8.1 (5-Step Protocol Sequence Diagram). This diagram is wrong. It must be updated to show the agent calling plan.getHierarchy and ticket.create, not sprint.getCurrentTask.

This 6-phase plan will create a single, unified, and architecturally sound documentation set that reflects your true vision.