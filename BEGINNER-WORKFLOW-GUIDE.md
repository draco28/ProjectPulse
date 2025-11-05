# Beginner's Guide to Professional AI-Assisted Development Workflow

**Version**: 1.0
**Last Updated**: January 5, 2025
**For Project**: ProjectPulse (AI-Powered Development Hub)
**Audience**: Developers new to professional documentation systems and AI-assisted workflows

---

## Table of Contents

- [Introduction](#introduction)
- [Part 1: From Old to New - Your Journey](#part-1-from-old-to-new---your-journey)
- [Part 2: The 30,000-Foot View](#part-2-the-30000-foot-view)
- [Part 3: Understanding Your Documents](#part-3-understanding-your-documents)
- [Part 4: The Memory Bank Deep Dive](#part-4-the-memory-bank-deep-dive)
- [Part 5: The 5-Step Protocol](#part-5-the-5-step-protocol)
- [Part 6: Working with Claude Code (AI Collaboration)](#part-6-working-with-claude-code-ai-collaboration)
- [Part 7: Agents & Skills Reference](#part-7-agents--skills-reference)
- [Part 8: Ticket System Mastery](#part-8-ticket-system-mastery)
- [Part 9: Your Daily AI-Assisted Workflow](#part-9-your-daily-ai-assisted-workflow)
- [Part 10: Practical Scenarios](#part-10-practical-scenarios)
- [Part 11: Prompts Library](#part-11-prompts-library)
- [Part 12: Common Pitfalls & Solutions](#part-12-common-pitfalls--solutions)
- [Part 13: Token Management & Context Discipline](#part-13-token-management--context-discipline)
- [Part 14: Quick Reference](#part-14-quick-reference)
- [Appendices](#appendices)

---

## Introduction

Welcome to your new professional development workflow! If you're feeling overwhelmed by the transition from a simple development plan to a comprehensive documentation system, you're in the right place.

### Who This Guide Is For

This guide is specifically designed for developers who:

- Previously worked with simple, single-file development plans
- Are new to professional project management systems
- Want to leverage AI (specifically Claude Code) in their workflow
- Need practical, step-by-step guidance (not just theory)
- Are building ProjectPulse, the AI-powered development hub

### What You'll Learn

By the end of this guide, you'll understand:

1. **What** the professional documentation system is and why it exists
2. **How** to navigate and use 27+ interconnected documents
3. **How** to work effectively with Claude Code as your AI pair programmer
4. **How** to follow the 5-step protocol for every feature
5. **How** to manage tickets, sprints, and progress tracking
6. **What** to do when things go wrong (recovery workflows)

### How to Use This Guide

**First time reading?**

- Read Parts 1-5 to understand the system
- Focus heavily on Part 6 (AI Collaboration)
- Skim Parts 7-14 for reference

**Ready to start working?**

- Use Part 9 (Daily Workflow) as your daily guide
- Keep Part 11 (Prompts Library) open for copy-paste
- Reference Part 14 (Quick Reference) as needed

**Something went wrong?**

- Check Part 12 (Common Pitfalls)
- Use recovery prompts from Part 11

### A Note on Complexity

Yes, this system is more complex than a single development plan file. But it solves real problems:

- ❌ **Old way**: Constant context loss, unclear progress, no traceability
- ✅ **New way**: Persistent context, clear progress tracking, full traceability

The learning curve is worth it. Let's begin.

---

## Part 1: From Old to New - Your Journey

### What You Had: The Single Development Plan

Previously, your entire project plan lived in one file:

```
development_plan.md
├─ Phase 1
│  ├─ Week 1
│  │  ├─ Day 1: Task A, Task B
│  │  └─ Day 2: Task C, Task D
│  ├─ Week 2
│  │  └─ ...
├─ Phase 2
└─ ...
```

**How you worked with Claude:**

```
You: "Follow the development plan and work on Phase 2, Week 1"
Claude: *reads entire 5000-line file*
Claude: *starts working*
```

### Problems with the Old Approach

1. **Context Overload**
   - Claude had to re-read the entire massive file every session
   - 50-100K tokens wasted on context loading
   - Slow startup, hitting token limits

2. **No Traceability**
   - Tasks didn't link to requirements
   - Hard to know WHY a task existed
   - No connection between planning docs and code

3. **Progress Invisibility**
   - Hard to see what's complete vs what's pending
   - No clear sprint boundaries
   - Difficult to track overall progress percentage

4. **Maintenance Nightmare**
   - One file to rule them all = constant merge conflicts
   - Hard to update without breaking formatting
   - Difficult to find specific information

5. **No Quality Assurance**
   - No enforced protocol
   - Easy to skip planning, testing, documentation
   - Inconsistent code quality

### What You Have Now: Professional Documentation System

Your project now has a **structured, interconnected documentation ecosystem**:

```
📁 docs/                          (27+ planning & design documents)
├─ 01-PRD.md                     (What to build)
├─ 02-SRS.md                     (Technical requirements)
├─ 03-Architecture.md           (Architecture)
├─ 12-Backlog.md                 (All work tickets)
├─ 13-Project-Plan.md            (13 sprints)
└─ ...

📁 .agent/                        (Memory Bank - instant context)
├─ project-brief.md              (High-level overview)
├─ system-patterns.md            (Architecture patterns)
├─ tech-context.md               (Tech stack)
├─ active-context.md             (Current sprint & tickets)
├─ progress.md                   (Progress tracking)
├─ task/                         (Created during work)
│  ├─ current-plan.md
│  └─ current-todos.md
└─ sessions/                     (Created during work)
   └─ session-*.md

📁 .claude/                       (AI workflow)
├─ sops/
│  └─ session-protocol.md        (5-step mandatory protocol)
├─ agents/                       (15 expert agents)
└─ skills/                       (9 quick-reference patterns)
```

**How you work with Claude now:**

```
You: "Follow the 5-step protocol and implement US-001"

Claude:
  ✅ Step 1: Loaded 5 Memory Bank files (~8K tokens vs 50K)
  ✅ Step 2: Created implementation plan
  ✅ Step 3: Consulted next-js-expert + react-expert
  ✅ Step 4: Implemented with checkpoints
  ✅ Step 5: Updated backlog + progress files + created commits
```

### Why This Is Better

| Aspect                | Old Way              | New Way                       |
| --------------------- | -------------------- | ----------------------------- |
| **Context Loading**   | 50-100K tokens       | 8K tokens (92% reduction)     |
| **Traceability**      | None                 | PRD → SRS → Ticket → Code     |
| **Progress Tracking** | Manual scanning      | 3 auto-synced files           |
| **Quality**           | Inconsistent         | Enforced 5-step protocol      |
| **AI Collaboration**  | Ad-hoc               | Structured with agents/skills |
| **Documentation**     | One file             | 27+ specialized documents     |
| **Scalability**       | Breaks at 3-4 phases | Handles 13 sprints easily     |

### The Learning Curve Is Real (But Worth It)

**Honest talk**: You're going from 1 file to 35+ files. That's intimidating.

**But consider**:

- The Memory Bank gives you instant context (no more massive file reads)
- The 5-step protocol prevents rookie mistakes
- The ticket system makes progress visible
- AI agents provide expert guidance
- Full traceability means you always know WHY code exists

**This guide will make the transition smooth**. By Part 9, you'll have a clear daily workflow.

---

## Part 2: The 30,000-Foot View

### The Big Picture: How Everything Fits Together

Think of your project as having **three interconnected systems**:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. DOCUMENTATION SYSTEM                   │
│                  (What to build + How to build)              │
│                                                               │
│  Planning Docs ──→ Architecture Docs ──→ Implementation Docs │
│   (PRD, SRS)      (System Design, API)     (Backlog, Plan)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    2. MEMORY BANK SYSTEM                     │
│               (Compressed context for AI sessions)           │
│                                                               │
│  5 core files (~8K tokens) loaded at every session start     │
│  Provides instant project understanding to Claude            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  3. WORKFLOW EXECUTION SYSTEM                │
│            (5-step protocol + AI agents + tickets)           │
│                                                               │
│  You + Claude Code work together following mandatory protocol│
│  Agents provide expertise, tickets track progress            │
└─────────────────────────────────────────────────────────────┘
```

### The Journey of a Ticket (From Idea to Code)

Let's follow ticket **US-001** ("Create Phase hierarchy system") through the entire system:

**1. Planning Phase** (Already completed for you)

```
Product Manager thinking:
  "We need a 5-level hierarchy system to track project phases, weeks, days, tasks, and sessions"
     ↓
Writes in PRD (01-PRD.md):
  Feature F1: "Sprint/Phase Tracking with 5-level hierarchy"
     ↓
Technical lead writes in SRS (02-SRS.md):
  FR-001: "Create Phase Hierarchy - System shall support Phase → Week → Day → Task → Session levels"
     ↓
Architect writes in System Design (03-Architecture.md):
  "5-level hierarchy using Prisma schema with self-referential relations"
     ↓
Project manager creates ticket in Backlog (12-Backlog.md):
  US-001: "Create Phase hierarchy system" (1 point)
  - Links to: FR-001, PRD-F1, EPIC-001
  - Acceptance criteria: Create/read/update all 5 levels via API
     ↓
Assigns to Sprint 1 in Project Plan (13-Project-Plan.md)
```

**2. Memory Bank Updates** (Happens during Phase 0)

```
Key information gets compressed into Memory Bank:
  - project-brief.md: "AI-powered development hub with 5-level hierarchy tracking"
  - system-patterns.md: "Prisma self-referential pattern, Server Component pattern"
  - tech-context.md: "Next.js 14+, Prisma ORM, PostgreSQL with pgvector"
  - active-context.md: "Sprint 1 (Phase A Week 1-2) - US-001 in progress"
  - progress.md: "Phase A, Sprint 1, 0/40 points complete"
```

**3. Implementation Day** (This is where you are now!)

```
Morning - You say:
  "Follow 5-step protocol and implement US-001"

Step 1 - Claude loads context:
  ✓ Reads 5 Memory Bank files (8K tokens)
  ✓ Knows: Sprint 1, ticket US-001, phase hierarchy, 2 points
  ✓ Creates: .agent/sessions/session-20250105-0900.md

Step 2 - Claude plans:
  ✓ Creates: .agent/task/current-plan.md
    - Task 1: Design Prisma schema for 5-level hierarchy
    - Task 2: Create database migration
    - Task 3: Build API endpoints (POST, GET, PUT for each level)
    - Task 4: Write tests
  ✓ Creates: .agent/task/current-todos.md
    - [ ] Design Prisma schema
    - [ ] Create migration
    - [ ] Build API endpoints
    - [ ] Write tests

Step 3 - Claude consults experts:
  ✓ Reads: .claude/agents/prisma-expert.md (for schema design)
  ✓ Reads: .claude/agents/next-js-expert.md (for API routes)
  ✓ Checks: .claude/skills/moksha-devhub/database-patterns.md
  ✓ Updates plan with expert recommendations

Step 4 - Claude implements:
  ✓ Writes code following the plan
  ✓ Creates tests (85% coverage target)
  ✓ Updates session log every ~15K tokens
  ✓ Marks todos complete as they're done

Step 5 - Claude completes:
  ✓ Updates: docs/12-Backlog.md (US-001: Done)
  ✓ Updates: .agent/active-context.md (2/10 points, 20%)
  ✓ Updates: .agent/progress.md (✅ US-001 complete)
  ✓ Creates commit: "feat: add phase hierarchy (closes US-001)"

Evening - You have:
  ✓ Working phase hierarchy
  ✓ Tests passing (>80% coverage)
  ✓ All documentation updated
  ✓ Clear record of what was done (session log)
  ✓ Ready for next ticket
```

### Key Terminology (Your New Vocabulary)

**Memory Bank**

- 5 compressed files (.agent/\*.md) that give Claude instant project context
- Think of it as "cliff notes" vs reading the full manual
- Saves 90% of context loading time
- Updated infrequently (except active-context.md and progress.md)

**5-Step Protocol**

- Mandatory workflow for every feature
- Ensures quality, documentation, and consistency
- Steps: Initialize → Plan → Consult → Implement → Complete
- Defined in `.claude/sops/session-protocol.md`

**Agent**

- A specialized AI expert (like next-js-expert or react-expert)
- Provides deep, detailed guidance on specific topics
- Consulted in Step 3 of the protocol
- Lives in `.claude/agents/` folder

**Skill**

- Quick-reference code patterns (like moksha-devhub/api-patterns)
- Faster than full agents, for common snippets
- Lives in `.claude/skills/` folder

**Ticket**

- A granular work item (like US-001)
- Format: US-### (US-001 = User Story 001)
- Has: points, acceptance criteria, links to requirements
- Tracked in docs/12-Backlog.md

**Sprint**

- 2-week development cycle (40 points capacity)
- Your project has 8 sprints across 16 weeks (Phase A-D)
- Planned in docs/13-Project-Plan.md

**Epic**

- A group of related tickets (like "EPIC-001: Sprint/Phase Tracking")
- Your project has 8 epics (EPIC-001 through EPIC-008)

**Traceability**

- The linkage chain: PRD Feature → SRS Requirement → Ticket → Code
- Means you can always trace WHY code exists back to business value

**Session Log**

- A markdown file (.agent/sessions/session-\*.md) created each work session
- Records decisions, checkpoints, and progress
- Helps recover if session crashes

**Context Budget**

- Claude Code has 200K token limit per conversation
- Memory Bank uses only 8K, leaving 192K for work
- Checkpoints help manage long sessions

### ProjectPulse-Specific Concepts

**🏗️ 5-Level Hierarchy System**

ProjectPulse uses a unique 5-level hierarchy to track work at different granularities:

```
Level 1: Phase (e.g., "Phase A: Foundation")
   ↓
Level 2: Week (e.g., "Phase A Week 1-2")
   ↓
Level 3: Day (e.g., "Day 3 of Week 1")
   ↓
Level 4: Task (e.g., "Implement Prisma schema")
   ↓
Level 5: Session (e.g., "Session with Claude at 10:30 AM")
```

**Why 5 levels?**

- **Phase**: Strategic scope (Phase A-D across 16 weeks)
- **Week**: Sprint scope (2-week sprints, 40 points each)
- **Day**: Daily work scope (what gets done today)
- **Task**: Granular work item (specific implementation)
- **Session**: AI collaboration session (timestamped work with Claude)

**Implementation**: Prisma schema with self-referential relations tracking parent-child relationships across all 5 levels.

**🔄 Workflow Orchestration System**

ProjectPulse includes 12 automated workflows that orchestrate development tasks:

1. **Issue Management** - Create, update, resolve issues
2. **Sprint Planning** - Plan sprints, allocate tickets
3. **Daily Standup** - Generate standup reports
4. **Code Review** - Automated code review workflow
5. **Testing** - Test execution and coverage tracking
6. **Deployment** - CI/CD pipeline orchestration
7. **Documentation** - Auto-generate and update docs
8. **Knowledge Base** - RAG + Knowledge Graph updates
9. **Skill Generation** - Create new skills from patterns
10. **Persona Management** - AI agent persona workflows
11. **Progress Tracking** - Update all progress files
12. **Health Monitoring** - Project health metrics

**Why workflows?** Automate repetitive tasks that follow patterns, freeing Claude to focus on creative problem-solving.

**🤖 Agent-First Philosophy**

ProjectPulse is designed for **95% MCP (Model Context Protocol) interaction**:

- **Primary Interface**: AI agents (via Claude Code)
- **Human Interface**: Dashboard for oversight and review
- **Data Flow**: Agent → MCP Tools → Database → Agent
- **Decision Making**: AI-driven with human approval gates

**Key Principle**: The system assumes AI agents are the primary users, with humans providing strategic direction and approval.

**🗄️ Database as Source of Truth**

All documentation (except ADRs) is **auto-generated from database**:

- `docs/12-Backlog.md` → Generated from database user stories
- `docs/13-Project-Plan.md` → Generated from database sprints
- Progress files → Real-time queries from database
- Memory Bank → Aggregated from database + manual curation

**Why?** Single source of truth eliminates documentation drift. The database is authoritative; markdown files are views.

### The Three Levels of Documentation

**Level 1: Strategic (Rarely changes)**

- PRD, SRS, System Design, Architecture Docs
- **When to read**: At project start, or when confused about "why"
- **Update frequency**: Rare (major pivots only)

**Level 2: Tactical (Changes per sprint)**

- Backlog, Project Plan, API Spec, DB Schema
- **When to read**: Sprint planning, when implementing features
- **Update frequency**: Weekly (sprint boundaries)

**Level 3: Operational (Changes daily)**

- Memory Bank (active-context.md, progress.md)
- Session logs, current plan/todos
- **When to read**: Every session
- **Update frequency**: Daily or per-ticket

### How Claude Code Uses This System

When you start a session, Claude:

1. **Loads Memory Bank** → Gets full project context in seconds
2. **Checks active-context.md** → Knows current sprint and tickets
3. **Follows 5-step protocol** → Ensures quality and consistency
4. **Consults agents/skills** → Gets expert guidance
5. **Updates progress files** → Keeps documentation in sync
6. **Creates checkpoints** → Ensures no work is lost

**You don't have to remember all this** - the protocol is enforced automatically when you use the right prompts (covered in Part 11).

### Visual: Information Flow

```
┌──────────────┐
│  You (Human) │
└──────┬───────┘
       │ "Implement US-001"
       ↓
┌──────────────────────────────────────────┐
│  Claude Code (AI)                        │
│                                          │
│  Step 1: Load Memory Bank                │
│  ┌─→ project-brief.md                   │
│  ├─→ system-patterns.md                 │
│  ├─→ tech-context.md                    │
│  ├─→ active-context.md ← "Sprint 1!"   │
│  └─→ progress.md                         │
│                                          │
│  Step 2: Create Plan                     │
│  ├─→ .agent/task/current-plan.md       │
│  └─→ .agent/task/current-todos.md      │
│                                          │
│  Step 3: Consult Experts                 │
│  ├─→ .claude/agents/vscode-extension-*  │
│  └─→ .claude/skills/vscode-api-*        │
│                                          │
│  Step 4: Implement                       │
│  ├─→ src/app/layout.tsx (write code)     │
│  ├─→ tests/*.test.ts (write tests)     │
│  └─→ session log (checkpoint)           │
│                                          │
│  Step 5: Complete                        │
│  ├─→ docs/12-Backlog.md (✓ Done)       │
│  ├─→ .agent/active-context.md (20%)    │
│  ├─→ .agent/progress.md (✅ US-001)   │
│  └─→ git commit                         │
└──────────────────────────────────────────┘
       │
       ↓
┌──────────────┐
│  Working     │
│  Feature +   │
│  Updated     │
│  Docs        │
└──────────────┘
```

### What This Means for You

**Old workflow:**

- "Claude, work on Phase 2 Week 1"
- Hope for the best
- Manually track what's done
- Context loss every session

**New workflow:**

- "Follow 5-step protocol and implement US-001"
- Claude follows structured process
- Automatic progress tracking
- Persistent context via Memory Bank

**The difference**: Professional, repeatable, traceable development vs ad-hoc improvisation.

Now that you understand the big picture, let's dive into the details...

---

## Part 3: Understanding Your Documents

You have **27+ documents**. Let's organize them so you know when to read what.

### Documents Organized by Purpose

#### Group 1: Planning & Requirements (The "Why")

**When to read**: When you need to understand the business purpose or overall features

| Document                  | Purpose                                  | Read When                              | Update Freq |
| ------------------------- | ---------------------------------------- | -------------------------------------- | ----------- |
| `docs/01-PRD.md`          | Product requirements, features F1-F16    | Starting project, unclear on "why"     | Rare        |
| `docs/02-SRS.md`          | Technical requirements, FR-001 to FR-098 | Need detailed requirement              | Rare        |
| `docs/12-Backlog.md`      | 125 user stories organized by epic       | Planning work, checking ticket details | Weekly      |
| `docs/13-Project-Plan.md` | 8 sprints, 16-week timeline, 4 phases    | Sprint planning, milestones            | Weekly      |

**Key insight**: These docs define WHAT to build and WHY. Already complete for you.

#### Group 2: Architecture & Design (The "How - High Level")

**When to read**: When you need to understand system structure or patterns

| Document                                       | Purpose                                 | Read When                  | Update Freq |
| ---------------------------------------------- | --------------------------------------- | -------------------------- | ----------- |
| `docs/03-Architecture.md`                      | Complete architecture, patterns, layers | Designing new feature      | Occasional  |
| `docs/11-DATA-FLOW.md`                         | How data moves through system           | Debugging flow issues      | Occasional  |
| `docs/07-UI-UX.md`                             | Interface specs, user flows             | Building UI                | Occasional  |
| `docs/architecture/ADRs/` (ADR-001 to ADR-005) | Architecture decisions (why we chose X) | Understanding tech choices | Rare        |

**Key insight**: These docs explain the architecture and WHY decisions were made.

#### Group 3: Implementation Specs (The "How - Low Level")

**When to read**: When you're actively implementing features

| Document                         | Purpose                                              | Read When                    | Update Freq |
| -------------------------------- | ---------------------------------------------------- | ---------------------------- | ----------- |
| `docs/06-API/openapi.yaml`       | Service APIs, request/response                       | Implementing API calls       | Occasional  |
| `docs/04-Data-and-Model-Spec.md` | Database schemas, Prisma models                      | Working with data storage    | Occasional  |
| `docs/09-Testing-and-QA.md`      | Testing strategy, quality targets (85% coverage, CI) | Writing tests, setting up CI | Rare        |

**Key insight**: These docs provide technical specs for implementation.

#### Group 4: Project Management (The "When" and "What's Done")

**When to read**: Every session start, and when updating progress

| Document                   | Purpose                                | Read When                 | Update Freq      |
| -------------------------- | -------------------------------------- | ------------------------- | ---------------- |
| `docs/12-Backlog.md`       | All 125 user stories organized by epic | Planning, checking status | **Every ticket** |
| `docs/13-Project-Plan.md`  | 13 sprints, milestone dates            | Sprint planning           | Weekly           |
| `docs/ROADMAP-P0.md`       | 4-6 week priority roadmap              | Strategic planning        | Weekly           |
| `.agent/active-context.md` | Current sprint & tickets               | **Every session**         | **Daily**        |
| `.agent/progress.md`       | Progress tracking                      | **Every session**         | **Every ticket** |

**Key insight**: These are your "living" documents, updated frequently.

#### Group 5: Operations & Quality (The "Standards")

**When to read**: When setting up infrastructure or security

| Document                                   | Purpose               | Read When               | Update Freq |
| ------------------------------------------ | --------------------- | ----------------------- | ----------- |
| `docs/08-Security-and-Compliance.md`       | Security requirements | Handling sensitive data | Rare        |
| `docs/15-Observability-and-SRE.md`         | Monitoring strategy   | Setting up logging      | Rare        |
| `docs/16-Infrastructure-and-Deployment.md` | Deployment guide      | Publishing extension    | Rare        |
| `docs/14-Glossary.md`                      | Term definitions      | Confused by terminology | Rare        |

**Key insight**: Reference docs for specific operational needs.

### The "Read This First" Priority List

**For your first work session** (implementing your first ticket):

1. **`.agent/active-context.md`** (2 min) ← MUST READ
   - Shows current sprint and which tickets are active

2. **`.agent/progress.md`** (3 min) ← MUST READ
   - Shows overall progress and what's complete

3. **`docs/12-Backlog.md`** (5 min) ← Find your ticket
   - Search for US-001 to see ticket details

4. **`docs/03-Architecture.md`** (15 min) ← Skim relevant sections
   - Focus on sections related to your ticket

5. **This guide (Part 6 & 9)** (10 min) ← AI collaboration
   - How to work with Claude effectively

**Total**: ~35 minutes to get oriented

### The "Reference When Needed" List

Don't try to read everything upfront. Reference these as needed:

- **Need API details?** → `docs/06-API/openapi.yaml`
- **Need database info?** → `docs/04-Data-and-Model-Spec.md`
- **Forgot what a feature does?** → `docs/01-PRD.md`
- **Need acceptance criteria?** → `docs/12-Backlog.md`
- **Confused about architecture choice?** → ADR files
- **Need testing guidance?** → `docs/09-Testing-and-QA.md`

### Update Frequency Guide

**Never update** (read-only for you):

- PRD, SRS, User Stories, Executive Summary
- ADRs (architecture decisions)
- System Design, Data Flow, UI/UX
- Security, Observability, Infrastructure

**Rarely update** (only if patterns change):

- API Spec, DB Schema
- TDD, QA Strategy
- `.agent/system-patterns.md`, `.agent/tech-context.md`

**Update every ticket completion**:

- `docs/12-Backlog.md` (mark ticket done)
- `.agent/active-context.md` (sprint progress)
- `.agent/progress.md` (mark task complete)

**Update during work**:

- `.agent/sessions/session-*.md` (every ~15K tokens)
- `.agent/task/current-plan.md` (created in Step 2)
- `.agent/task/current-todos.md` (created in Step 2)

### Document Interconnections (Traceability)

Here's how documents link together:

```
PRD (Feature F1)
  ↓ "Chat-based code assistance"
  ↓
SRS (Requirement FR-001)
  ↓ "System shall provide chat participant API"
  ↓
Backlog (Ticket US-001)
  ↓ "Create Phase hierarchy system" - 2 points
  ↓
Project Plan (Sprint 1)
  ↓ Week 1-2 of Phase A
  ↓
System Design (Section 4.2)
  ↓ "Chat Participant Implementation"
  ↓
API Spec (PhaseService)
  ↓ Interface definition
  ↓
Implementation (src/app/layout.tsx)
  ↓ Actual code
  ↓
Tests (tests/PhaseService.test.ts)
  ↓ 85% coverage
```

**This chain is called "traceability"** - you can trace from business value (PRD) all the way to code.

### Pro Tips for Document Navigation

**Tip 1: Use your IDE's search**

- Press `Ctrl+Shift+F` (VS Code) to search across all docs
- Search for ticket IDs (like "US-001") to find all mentions

**Tip 2: Use markdown links**

- Many docs have hyperlinks to related docs
- Click to jump quickly

**Tip 3: Keep tabs open**

- Keep these open while working:
  - `.agent/active-context.md`
  - `docs/12-Backlog.md`
  - Your current ticket's section in System Design

**Tip 4: Let Claude read for you**

- Don't manually read everything
- Claude loads Memory Bank automatically
- Ask Claude: "What does the API spec say about X?"

**Tip 5: Trust the Memory Bank**

- The 5 `.agent/*.md` files contain compressed versions
- You don't need to read all 27 docs yourself
- Claude reads them for you via Memory Bank

### What Claude Reads vs What You Read

**Claude reads** (every session via Memory Bank):

- `.agent/project-brief.md` (project overview)
- `.agent/system-patterns.md` (key patterns)
- `.agent/tech-context.md` (tech stack)
- `.agent/active-context.md` (current work)
- `.agent/progress.md` (progress tracking)

**Claude references** (as needed during implementation):

- `docs/03-Architecture.md` (architecture details)
- `docs/06-API/openapi.yaml` (API contracts)
- `docs/04-Data-and-Model-Spec.md` (database schemas)
- `.claude/agents/*.md` (expert guidance)
- `.claude/skills/*.md` (code patterns)

**You read**:

- `.agent/active-context.md` (to know what's happening)
- This guide (to understand the workflow)
- Ticket acceptance criteria (to verify completion)

**The division of labor**: Claude handles the details, you handle the direction.

### Common Newbie Mistakes

❌ **Mistake 1**: "I need to read all 27 documents before starting"

- ✅ **Reality**: Read Memory Bank files + this guide. That's enough.

❌ **Mistake 2**: "I'll manually update all progress files"

- ✅ **Reality**: Use `npm run sync-progress` automation or let Claude do it in Step 5

❌ **Mistake 3**: "I need to memorize the ticket system"

- ✅ **Reality**: Just know your current ticket (US-001). Claude tracks the rest.

❌ **Mistake 4**: "I should understand the entire architecture"

- ✅ **Reality**: Understand enough for your ticket. Learn as you go.

❌ **Mistake 5**: "Documentation updates are optional"

- ✅ **Reality**: Step 5 of protocol REQUIRES updates. Non-negotiable.

### The Mental Model

Think of your documentation as a **layered knowledge system**:

**Layer 1: Strategic (Rare access)**

- PRD, SRS, ADRs
- Read once at project start
- Reference when confused

**Layer 2: Tactical (Weekly access)**

- System Design, API Spec, Backlog
- Read during sprint planning
- Reference during implementation

**Layer 3: Operational (Daily access)**

- Memory Bank, session logs, todos
- Read every session
- Update constantly

**You live in Layer 3. Claude navigates all three layers for you.**

Now let's understand the Memory Bank, your secret weapon for efficient AI collaboration...

---

## Part 4: The Memory Bank Deep Dive

The Memory Bank is your **secret weapon** for efficient AI collaboration. Let's understand it deeply.

### What Is the Memory Bank?

The Memory Bank is a set of **5 carefully curated files** that compress your entire project context into ~8K tokens.

**The problem it solves**:

- Without Memory Bank: Claude reads 50-100K tokens of docs every session
- With Memory Bank: Claude reads 8K tokens and has full context
- **Result**: 92% reduction in context loading, faster startup, more tokens for actual work

**The files**:

```
.agent/
├─ project-brief.md       (~1.5K tokens)
├─ system-patterns.md     (~2K tokens)
├─ tech-context.md        (~1.8K tokens)
├─ active-context.md      (~1.2K tokens) ← Updated frequently
└─ progress.md            (~1.5K tokens) ← Updated frequently
```

### The 5 Memory Bank Files Explained

#### 1. `project-brief.md` - The "What" and "Why"

**Purpose**: High-level project overview

**Contains**:

- Value propositions (what makes this project valuable)
- Target users (who will use it)
- Core features (F1 through F16)
- Tech stack summary
- Success metrics

**When updated**: Rare (monthly or when scope changes)

**Example content**:

```markdown
## Value Propositions

1. Persistent context across sessions
2. Automated documentation
3. Multi-provider AI support
   ...

## Core Features

- F1: Chat-based code assistance
- F2: Multi-provider support (Claude, GPT-4, local)
- F3: Hybrid memory system (RAG + Knowledge Graph)
  ...
```

**Why it's in Memory Bank**: Gives Claude the "big picture" - what this project is about and why it matters.

#### 2. `system-patterns.md` - The "How We Build"

**Purpose**: Key architecture patterns and conventions

**Contains**:

- Provider abstraction pattern
- Hybrid memory pattern (RAG + Knowledge Graph)
- Server Component implementation pattern
- Testing conventions
- Summaries of key ADRs

**When updated**: Occasional (when new patterns are adopted)

**Example content**:

```markdown
## Provider Abstraction Pattern

We use a common interface for AI providers:

- AIProvider interface with: generateResponse, streamResponse
- Implementations: ClaudeProvider, OpenAIProvider, LocalProvider
- Hot-swappable at runtime
- ADR-002: Chose this for vendor flexibility

## Hybrid Memory Pattern

- Vector DB (Qdrant) for semantic search
- Graph DB (Memgraph) for relationships
- SQLite for structured data
- ADR-010: Hybrid approach for best of both worlds
```

**Why it's in Memory Bank**: Ensures Claude follows established patterns, not reinventing the wheel.

#### 3. `tech-context.md` - The "Tech Stack"

**Purpose**: Technology choices and configuration

**Contains**:

- Languages and frameworks (TypeScript, React, Node.js)
- Key dependencies and versions
- Next.js App Router, Prisma ORM, PostgreSQL database
- Database choices (Qdrant, Memgraph, SQLite)
- Performance targets
- Development setup

**When updated**: Rare (when tech stack changes)

**Example content**:

```markdown
## Core Stack

- TypeScript 5.3+
- Node.js 20+
- React 18 (Server and Client Components)
- Next.js 14+ (App Router, Server Components, Server Actions)

## Dependencies

- @anthropic-ai/sdk for Claude
- openai for GPT-4
- qdrant-client for vector DB
- ws for WebSocket connections

## Performance Targets

- Chat response latency: <2s for first token
- Memory search: <100ms for 10K documents
- Application startup: <1s
```

**Why it's in Memory Bank**: Claude knows what tech to use and what constraints to follow.

#### 4. `active-context.md` - The "Right Now" ⭐ MOST IMPORTANT

**Purpose**: Current sprint, current tickets, immediate focus

**Contains**:

- **Current Phase/Sprint/Step**
- **"Current Sprint & Tickets" section** ← YOU CARE ABOUT THIS
- What We Just Completed
- What We're Doing Right Now
- What's Next
- Recent decisions
- Blockers or notes

**When updated**: **Every session** (Step 5 of protocol)

**Example content** (for Sprint 1, working on US-001):

```markdown
## Current Status

- **Phase**: Phase 1 (Development)
- **Sprint**: Sprint 1 (Week 1-2 of Phase A)
- **Sprint Goal**: Chat foundation + provider baseline
- **Sprint Progress**: 2/10 points (20%)

## Current Sprint & Tickets

### Tickets In Progress

- US-001: Create Phase hierarchy system (2 points)
  - Status: In Progress
  - Started: Sprint 1

### Tickets Planned

- US-002: Provider abstraction layer (5 points)
- US-003: Claude API integration (3 points)

### Tickets Completed This Sprint

[None yet]

## What We Just Completed

✅ Phase 0: Planning & Documentation (Phase 0 completion)

- All 27 documents created
- Memory Bank set up
- 5-step protocol defined

## What We're Doing Right Now

🔨 Implementing US-001 (Chat interface)

- Task: Register Next.js Server Components
- Expected completion: Sprint 1

## What's Next

📋 After US-001:

1. US-002: Provider abstraction layer
2. US-003: Claude API integration
3. Sprint 1 review (End of Sprint 1)
```

**Why it's in Memory Bank**: Claude instantly knows where you are in the project. This is the MOST frequently updated file.

**This is the file Claude checks to know which tickets are active!**

#### 5. `progress.md` - The "Progress Tracking"

**Purpose**: Detailed progress across all sprints and phases

**Contains**:

- Overall project progress (Sprint X of 13)
- Sprint-by-sprint breakdown
- Tasks completed per sprint (✅ marks)
- Milestone tracking (M1: MVP, M2: v1.0)
- Recent updates log

**When updated**: **Every ticket completion** (Step 5 of protocol)

**Example content**:

```markdown
## Overall Progress

- **Current Sprint**: Sprint 1 of 8 (12.5%)
- **Phase**: Phase 1 (Development)
- **Milestone**: Working toward M1 (MVP) - Sprint 3

## Sprint Progress

### Sprint 1 (Week 1-2 of Phase A) - 20% Complete

**Goal**: Chat foundation + provider baseline
**Capacity**: 10 points (intentionally under-capacity for first sprint)
**Progress**: 2/10 points (20%)

**Tasks**:

- ✅ US-001: Create Phase hierarchy system (2 points) - DONE Nov 5
- ⏳ US-002: Provider abstraction layer (5 points) - PLANNED
- ⏳ US-003: Claude API integration (3 points) - PLANNED

### Sprint 2 (Week 3-4 of Phase A) - 0% Complete

**Goal**: File operations + streaming
**Capacity**: 10 points
**Status**: Not started

**Tasks**:

- ⏳ US-004: Show conversation history (2 points)
- ⏳ US-005: Support file attachments (2 points)
- ⏳ US-006: Read project files (2 points)
- ⏳ US-007: Display file diffs (4 points)

...

## Recent Updates

- 2025-11-05: US-001 Complete ✅ (Chat interface implemented)
- 2025-11-03: Phase 0 Complete ✅ (All documentation done)
- 2025-11-03: Memory Bank initialized
```

**Why it's in Memory Bank**: Claude can see the overall progress and understand project momentum.

### How the Memory Bank is Used (Step by Step)

**When you say**: "Follow 5-step protocol and implement US-001"

**Step 1 - Claude loads Memory Bank**:

```
1. Read project-brief.md
   → Claude learns: "This is a Next.js web application for AI code assistance"

2. Read system-patterns.md
   → Claude learns: "Use provider abstraction pattern, follow ADR-010"

3. Read tech-context.md
   → Claude learns: "TypeScript + React, VS Code 1.85+, target <1s activation"

4. Read active-context.md ← MOST IMPORTANT
   → Claude learns: "Sprint 1, working on US-001 (phase hierarchy), 0/10 points done"

5. Read progress.md
   → Claude learns: "Phase 0 complete, starting Phase 1, Sprint 1 of 13"

Total time: ~5 seconds, 8K tokens
Claude now has FULL project context
```

**Result**: Claude knows:

- What the project is (brief)
- How to build it (patterns)
- What tech to use (tech-context)
- What to work on RIGHT NOW (active-context)
- Where we are overall (progress)

**Without Memory Bank**:
Claude would need to read:

- PRD (3K tokens)
- SRS (5K tokens)
- System Design (8K tokens)
- Backlog (4K tokens)
- Project Plan (3K tokens)
- ADRs (15K tokens)
- API Spec (6K tokens)
- DB Schema (4K tokens)
- ... Total: 50-100K tokens, 2-3 minutes

### Update Workflow for Memory Bank Files

**After every ticket completion** (Step 5 of protocol):

**Update `active-context.md`**:

```markdown
Before:

- Tickets In Progress: US-001 (2 points)
- Tickets Completed: [None]
- Sprint Progress: 0/10 points (0%)

After:

- Tickets In Progress: [None]
- Tickets Completed: US-001 (2 points)
- Sprint Progress: 2/10 points (20%)
```

**Update `progress.md`**:

```markdown
Before:

- ⏳ US-001: Create Phase hierarchy system (2 points)

After:

- ✅ US-001: Create Phase hierarchy system (2 points)

Recent Updates:

- 2025-11-05: US-001 Complete ✅
```

**Option 1: Let Claude do it** (recommended)

- Step 5 of protocol requires Claude to update these files
- Claude knows the format and updates correctly

**Option 2: Use automation script**:

```bash
npm run sync-progress -- --ticket US-001 --status done
```

This updates all three files automatically (Backlog, active-context, progress).

### Recovery Workflow: Using Memory Bank When Session Crashes

**Scenario**: Your session crashed mid-implementation. How to resume?

**Recovery steps**:

```
1. Open .agent/active-context.md
   → Check "What We're Doing Right Now" section
   → Example: "🔨 Implementing US-001 (Chat interface)"

2. Open .agent/progress.md
   → Check most recent "Recent Updates"
   → Example: Last update was Phase 0 complete, US-001 not done yet

3. Open latest .agent/sessions/session-*.md
   → Check last checkpoint
   → Example: "✅ CHECKPOINT at 15K - Chat registration complete"

4. Start new session with prompt:
   "Resume work on US-001. Load Memory Bank and check:
    - .agent/active-context.md for current status
    - .agent/sessions/session-20250105-0900.md for last checkpoint
    Continue from where we left off."

5. Claude loads Memory Bank + session log
   → Claude knows exactly where you were
   → Claude continues implementation
```

**The Memory Bank makes recovery trivial** - no need to re-explain the entire project.

### Pro Tips for Memory Bank Success

**Tip 1: Trust the compression**

- Don't worry that Memory Bank is "too small"
- 8K tokens is enough for full context
- Detailed specs are referenced on-demand

**Tip 2: Keep active-context.md current**

- This is THE file that tells Claude what to work on
- Update it every session (Step 5)
- If this file is stale, Claude won't know current priorities

**Tip 3: Use progress.md for motivation**

- Seeing ✅ marks accumulate is motivating
- Shows concrete progress
- Helps with sprint reviews

**Tip 4: Don't edit brief/patterns/tech-context often**

- These are intentionally stable
- Only update when there's a real pattern or tech change
- Stability = consistency

**Tip 5: Session logs complement Memory Bank**

- Memory Bank = high-level context
- Session logs = detailed decisions for this session
- Together = complete picture

### Memory Bank vs Traditional Documentation

| Aspect      | Traditional Docs     | Memory Bank                      |
| ----------- | -------------------- | -------------------------------- |
| Size        | 50-100K tokens       | 8K tokens                        |
| Load time   | 2-3 minutes          | 5 seconds                        |
| Coverage    | Comprehensive detail | Compressed essentials            |
| Update freq | Rare                 | Daily (active-context, progress) |
| Purpose     | Complete reference   | Quick context loading            |
| When to use | Deep dives           | Every session start              |

**The key insight**: Memory Bank is NOT a replacement for detailed docs. It's a **compressed index** that gives Claude enough context to know what to do and where to find details.

**Analogy**:

- Detailed docs = Full textbook
- Memory Bank = Cliff notes + table of contents
- You use cliff notes to get oriented, then reference textbook as needed

### What Makes a Good Memory Bank File?

**Good Memory Bank file characteristics**:

1. **Concise**: No fluff, every sentence adds value
2. **Current**: Updated regularly (especially active-context.md)
3. **Actionable**: Tells Claude what to do, not just what exists
4. **Traceable**: Links to detailed docs for deep dives
5. **Scannable**: Headers, bullets, clear structure

**Bad Memory Bank file**:

- Too detailed (defeats the purpose of compression)
- Stale information (confuses Claude)
- Vague (Claude doesn't know what to prioritize)
- No links (Claude can't find details)

### The Memory Bank is Your Competitive Advantage

**Most AI-assisted development workflows don't have this.**

**They suffer from**:

- Context loss every session
- Token waste on repeated doc loading
- Claude "forgetting" project patterns
- Difficulty resuming work

**You have**:

- Persistent context via Memory Bank
- 92% token savings
- Consistent pattern application
- Easy session recovery

**This is professional AI-assisted development.**

Now let's understand the 5-step protocol that uses this Memory Bank...

---

## Part 5: The 5-Step Protocol

The 5-step protocol is the **mandatory workflow** for every feature implementation. It ensures quality, consistency, and proper documentation.

### Why a Mandatory Protocol?

**Without a protocol**:

- Claude starts coding immediately (no planning)
- Patterns are inconsistent
- Documentation gets skipped
- Progress tracking is forgotten
- Quality varies wildly

**With the 5-step protocol**:

- ✅ Planning happens BEFORE coding
- ✅ Expert guidance is consulted
- ✅ Implementation is structured
- ✅ Documentation is always updated
- ✅ Quality is consistent

**Think of it as a checklist** - like a pilot's pre-flight checklist. Every step matters.

### The 5 Steps Overview

```
STEP 1: Initialize Session
  ↓ Load Memory Bank, create session log

STEP 2: Plan BEFORE Code
  ↓ Create implementation plan and todos

STEP 3: Consult Experts
  ↓ Review relevant agents and skills

STEP 4: Implement with Checkpoints
  ↓ Follow the plan, update session log

STEP 5: Complete and Update
  ↓ Update all progress tracking files
```

**Total time**: ~30 minutes to 2 hours depending on ticket complexity

Let's dive into each step in detail.

---

### STEP 1: Initialize Session

**Purpose**: Load full project context and create session tracking

**What Claude does**:

1. Reads all 5 Memory Bank files (~8K tokens)
2. Checks `.agent/active-context.md` for current sprint and tickets
3. Creates `.agent/sessions/session-[timestamp].md` file
4. Records session metadata (sprint, ticket, goals)

**What you see**:

```
✅ STEP 1 COMPLETE - Loaded Memory Bank + Sprint Context

Session initialized:
- Sprint: Sprint 1 (Week 1-2 of Phase A)
- Ticket: US-001 (Create Phase hierarchy system)
- Points: 2
- Goal: Implement Next.js Server Components
- Session log: .agent/sessions/session-20250105-0900.md
```

**Files created**:

- `.agent/sessions/session-20250105-0900.md` (new)

**Time**: ~30 seconds

**Why this matters**:

- Claude has FULL project context instantly
- Session is tracked from the beginning
- No context loss if session crashes
- Clear record of what was worked on

**Red flags** (Claude skipped Step 1):

- ❌ Claude starts coding immediately
- ❌ No mention of "Memory Bank loaded"
- ❌ No session log created
- ❌ Claude doesn't know current sprint/ticket

**How to fix**: Use the session starter prompt from Part 11.

---

### STEP 2: Plan BEFORE Code

**Purpose**: Create a clear implementation plan before writing any code

**What Claude does**:

1. Analyzes ticket requirements from Backlog
2. Breaks down into specific tasks
3. Identifies files that will change
4. Lists decisions to make
5. Creates `.agent/task/current-plan.md`
6. Creates `.agent/task/current-todos.md`

**What you see**:

```
✅ STEP 2 COMPLETE - Plan and todos saved

Implementation Plan (US-001):

Tasks:
1. Register Next.js Server Components in extension.ts
2. Create PhaseService with streaming handler
3. Build React PhaseHierarchy component
4. Add message passing (extension ↔ client component)
5. Write unit tests (target 85% coverage)
6. Verify page load time (<1s)

Files to change:
- src/app/layout.tsx (registration)
- src/services/PhaseService.ts (new)
- src/client component/PhaseHierarchy.tsx (new)
- tests/PhaseService.test.ts (new)

Decisions:
- Use Prisma Client queries
- Stream via panel.client component.postMessage
- React for UI (established pattern)

Plan saved to: .agent/task/current-plan.md
Todos saved to: .agent/task/current-todos.md
```

**Files created**:

- `.agent/task/current-plan.md` (new)
- `.agent/task/current-todos.md` (new)

**Example `current-plan.md` structure**:

```markdown
# Implementation Plan: US-001 - Chat Interface

## Objective

Implement VS Code Next.js Server Components for AI code assistance

## Requirements (from Backlog)

- FR-001: System shall provide chat participant API
- PRD-MVP-CHAT: Chat-based code assistance
- AC: Panel opens <1s

## Tasks Breakdown

### Task 1: Register Chat Participant (30 min)

- Update src/app/layout.tsx with registration
- Define participant ID: 'ai-code-assistant'
- Create async handler function

### Task 2: Create PhaseService (45 min)

...

## Files to Modify

- [src/app/layout.tsx](src/app/layout.tsx) - Register participant
- [New] src/services/PhaseService.ts
  ...

## Technical Decisions

1. Use Next.js Server Components (vs TreeView)
   - Reason: Native chat UX, streaming support
2. React for client component UI
   - Reason: Established pattern per system-patterns.md
     ...

## Testing Strategy

- Unit tests for PhaseService (target 85%)
- Integration test for registration
- Manual test: page load time <1s

## Success Criteria

- [ ] Chat panel opens
- [ ] Message streaming works
- [ ] Tests passing (>80%)
- [ ] Activation <1s verified
```

**Time**: ~5-10 minutes

**Why this matters**:

- Forces upfront thinking
- Prevents architectural mistakes
- Makes implementation faster (roadmap exists)
- Provides recovery point if session crashes
- You can review and adjust before any code is written

**Red flags** (Claude skipped Step 2):

- ❌ Claude starts writing code immediately
- ❌ No plan file created
- ❌ Claude says "let's start coding..."
- ❌ Unclear scope or approach

**How to fix**: Stop Claude and say "Wait - follow Step 2 first. Create the implementation plan."

---

### STEP 3: Consult Experts

**Purpose**: Get expert guidance BEFORE implementing

**What Claude does**:

1. Identifies relevant agents for this ticket
2. Reads agent files for detailed guidance
3. Checks skills for code patterns
4. Updates plan with expert recommendations
5. Lists which agents/skills were consulted

**What you see**:

```
✅ STEP 3 COMPLETE - Expert guidance applied

Consulted Experts:
- next-js-expert: Next.js Server Components patterns
- react-expert: Component composition and state
- security-engineer: Input validation requirements

Consulted Skills:
- moksha-devhub/api-patterns.md: Chat registration code
- moksha-devhub/component-patterns.md: Message passing

Key Recommendations Applied:
1. Use Prisma Client queries (next-js-expert)
2. Validate user input before processing (security-engineer)
3. Implement error boundaries in React components (react-expert)
4. Follow client component messaging pattern (moksha-devhub/component-patterns)

Plan updated with expert recommendations.
```

**Files read** (examples):

- `.claude/agents/next-js-expert.md`
- `.claude/agents/core-development/react-expert.md`
- `.claude/agents/core-development/security-engineer.md`
- `.claude/skills/moksha-devhub/api-patterns.md`
- `.claude/skills/moksha-devhub/component-patterns.md`

**Time**: ~2-5 minutes

**Why this matters**:

- Prevents rookie mistakes
- Ensures established patterns are followed
- Catches security issues early
- Leverages project-specific best practices
- You benefit from "expert review" before coding

**When to consult which agent** (common patterns):
| If ticket involves... | Consult this agent |
|----------------------|-------------------|
| Next.js APIs | next-js-expert |
| React components | react-expert |
| TypeScript types | typescript-expert |
| API contracts | api-expert |
| Database queries | database-expert |
| Security concerns | security-engineer |
| Testing strategy | qa-tester |

**Red flags** (Claude skipped Step 3):

- ❌ No mention of agent consultation
- ❌ Claude uses patterns not in system-patterns.md
- ❌ Security vulnerabilities introduced
- ❌ Inconsistent code style

**How to fix**: Say "Consult [agent-name] before proceeding with implementation."

---

### STEP 4: Implement with Checkpoints

**Purpose**: Execute the plan with regular checkpoints

**What Claude does**:

1. Follows the plan from Step 2
2. Implements tasks incrementally
3. Writes tests (TDD when possible)
4. Updates session log every ~15K tokens
5. Marks todos complete as tasks finish
6. Creates checkpoints at key milestones

**What you see**:

```
Starting implementation of US-001...

Task 1: Register Chat Participant
[Code implementation...]
✅ Todo marked complete: Register chat participant

Task 2: Create PhaseService
[Code implementation...]
✅ CHECKPOINT at 15K tokens - Session log updated
✅ Todo marked complete: Create PhaseService

Task 3: Build React PhaseHierarchy
[Code implementation...]
✅ Todo marked complete: Build UI component

Task 4: Write tests
[Test implementation...]
Coverage: 87% ✅
✅ Todo marked complete: Write tests

✅ STEP 4 COMPLETE - Feature implemented with checkpoints
```

**Files created/modified**:

- `src/app/layout.tsx` (modified)
- `src/services/PhaseService.ts` (new)
- `src/client component/PhaseHierarchy.tsx` (new)
- `tests/PhaseService.test.ts` (new)
- `.agent/sessions/session-20250105-0900.md` (updated with checkpoints)
- `.agent/task/current-todos.md` (todos marked complete)

**Example checkpoint in session log**:

```markdown
## Checkpoint 1 (15K tokens) - 10:30 AM

### Progress

- ✅ Task 1: Chat participant registered
- ✅ Task 2: PhaseService created with streaming
- ⏳ Task 3: React UI in progress

### Decisions Made

- Decided to use Context API for state management
- Added error boundary wrapper per react-expert recommendation

### Issues Encountered

- Initial page load time was 1.2s (over budget)
- Solution: Lazy-load PhaseService, now 0.8s ✅

### Next Steps

- Complete React PhaseHierarchy component
- Wire up message passing
- Write tests
```

**Time**: 20 minutes to 2 hours (depends on ticket complexity)

**Why this matters**:

- Checkpoints prevent work loss
- Session log records decisions (for future reference)
- Incremental progress is visible
- Easy to resume if interrupted
- Todos provide clear progress tracking

**Checkpoint guidelines**:

- Create checkpoint every ~15K tokens
- Create checkpoint at natural break points (task completion)
- Create checkpoint before risky refactors
- Update session log with: progress, decisions, issues, next steps

**Red flags** (Claude not following Step 4):

- ❌ No checkpoints created
- ❌ Session log not updated
- ❌ Tests skipped
- ❌ Todos not marked complete
- ❌ Deviates from plan without explanation

**How to fix**: Say "Create a checkpoint now and update the session log."

---

### STEP 5: Complete and Update

**Purpose**: Update all documentation and progress tracking

**What Claude does**:

1. Runs tests (ensures >80% coverage)
2. Updates `docs/12-Backlog.md` (mark ticket Done)
3. Updates `.agent/active-context.md` (move ticket to Completed, update %)
4. Updates `.agent/progress.md` (mark task ✅, add to Recent Updates)
5. Creates git commits (docs first, then code)

**What you see**:

```
✅ STEP 5 COMPLETE - All progress files updated

Test Results:
- Unit tests: 12/12 passing
- Coverage: 87% ✅ (target: 85%)

Documentation Updates:
✓ docs/12-Backlog.md - US-001 marked Done
✓ .agent/active-context.md - Sprint progress: 2/10 points (20%)
✓ .agent/progress.md - US-001 marked complete ✅

Git Commits Created:
1. docs: update progress for US-001 completion
2. feat: add phase hierarchy with streaming (closes US-001)

Ready for review and merge!
```

**Files updated**:

- `docs/12-Backlog.md` (ticket status: Planned → Done)
- `.agent/active-context.md` (sprint progress updated)
- `.agent/progress.md` (task marked complete, Recent Updates)

**Git commits**:

```bash
# Commit 1: Documentation updates
git add docs/12-Backlog.md .agent/
git commit -m "docs: update progress for US-001 completion"

# Commit 2: Feature implementation
git add src/ tests/
git commit -m "feat: add phase hierarchy with streaming (closes US-001)

- Implement Next.js Server Components registration
- Add PhaseService with streaming handler
- Create React PhaseHierarchy component
- Add unit tests (87% coverage)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Time**: ~5 minutes

**Why this matters**:

- Progress is tracked in all three files
- Git history is clean and traceable
- Ticket is marked complete (visible progress)
- Next session knows what's done
- Full traceability maintained

**Alternative**: Use automation script

```bash
npm run sync-progress -- --ticket US-001 --status done
```

This updates Backlog, active-context, and progress files automatically.

**Red flags** (Claude skipped Step 5):

- ❌ Documentation not updated
- ❌ Ticket still shows "Planned" instead of "Done"
- ❌ active-context.md not updated (sprint % stale)
- ❌ No git commits created

**How to fix**: Say "Complete Step 5 - update all progress tracking files."

---

### The Complete Flow (US-001 Example)

Let's see all 5 steps together for ticket US-001:

**Morning - 9:00 AM**

```
You: "Follow 5-step protocol and implement US-001"

Claude (Step 1):
✅ Loaded Memory Bank (8K tokens)
✅ Current sprint: Sprint 1
✅ Current ticket: US-001 (Create Phase hierarchy system - 2 points)
✅ Created session log: .agent/sessions/session-20250105-0900.md
✅ STEP 1 COMPLETE

Claude (Step 2):
✅ Analyzed ticket requirements
✅ Created implementation plan (6 tasks)
✅ Saved to .agent/task/current-plan.md
✅ Created todos in .agent/task/current-todos.md
✅ STEP 2 COMPLETE

Claude (Step 3):
✅ Consulted next-js-expert
✅ Consulted react-expert
✅ Consulted security-engineer
✅ Checked moksha-devhub/api-patterns skill
✅ Updated plan with expert recommendations
✅ STEP 3 COMPLETE

Claude (Step 4):
🔨 Implementing Task 1: Register chat participant...
[Code generated]
✅ Task 1 complete

🔨 Implementing Task 2: Create PhaseService...
[Code generated]
✅ CHECKPOINT at 15K tokens
✅ Task 2 complete

🔨 Implementing Task 3: Build React UI...
[Code generated]
✅ Task 3 complete

🔨 Implementing Task 4: Write tests...
[Tests generated]
✅ Coverage: 87%
✅ Task 4 complete

✅ STEP 4 COMPLETE

Claude (Step 5):
✓ Tests passing (87% coverage)
✓ Updated docs/12-Backlog.md
✓ Updated .agent/active-context.md (20% sprint complete)
✓ Updated .agent/progress.md
✓ Created 2 git commits
✅ STEP 5 COMPLETE

Feature complete! US-001 is done.
```

**Afternoon - 2:00 PM**

You review the work:

- Chat interface working ✅
- Tests passing ✅
- Documentation updated ✅
- Ready for next ticket (US-002)

---

### Common Questions

**Q: Can I skip steps?**
A: No. The protocol is mandatory. Each step serves a critical purpose. Skipping steps leads to inconsistent quality.

**Q: What if Step 2's plan needs revision during implementation?**
A: That's fine! Update the plan and note the reason in the session log. The plan is a guide, not a prison.

**Q: How long does the full protocol take?**
A: Depends on ticket complexity:

- Small ticket (2 points): ~30 minutes to 1 hour
- Medium ticket (3-5 points): ~1-2 hours
- Large ticket (8 points): ~2-4 hours

**Q: Can I work on multiple tickets in one session?**
A: Yes, but complete all 5 steps for each ticket. Don't intermix tickets.

**Q: What if I need to stop mid-implementation (Step 4)?**
A: Create a checkpoint in the session log, note where you stopped, and resume next session using recovery workflow (Part 4).

**Q: Do I need Step 5 if I'm not done with the ticket?**
A: Step 5 is only for COMPLETED tickets. If you're mid-ticket, just checkpoint in Step 4.

**Q: Can Claude do all 5 steps automatically?**
A: Yes! With the right session starter prompt (Part 11), Claude follows all 5 steps autonomously.

---

### Visual: The Protocol Flowchart

```
START SESSION
     ↓
[STEP 1: Initialize]
- Load Memory Bank (5 files)
- Create session log
- Confirm current sprint/ticket
     ↓
   YES: Context loaded?
     ↓
[STEP 2: Plan]
- Break down tasks
- Identify files
- List decisions
- Save plan + todos
     ↓
   YES: Plan approved?
     ↓
[STEP 3: Consult]
- Identify relevant agents
- Read agent files
- Check skills
- Apply recommendations
     ↓
   YES: Expert guidance obtained?
     ↓
[STEP 4: Implement]
┌─────────────────┐
│ For each task:  │
│ - Write code    │
│ - Write tests   │
│ - Mark todo ✓   │
│                 │
│ Every ~15K:     │
│ - Checkpoint    │
│ - Update log    │
└─────────────────┘
     ↓
   YES: All tasks complete? Tests passing?
     ↓
[STEP 5: Complete]
- Update Backlog
- Update active-context
- Update progress
- Create commits
     ↓
FEATURE COMPLETE
```

---

### Enforcement: How to Ensure Claude Follows the Protocol

**Method 1: Use the Session Starter Prompt** (recommended)

- See Part 11 for the exact prompt
- Tells Claude to follow the protocol explicitly
- Most reliable method

**Method 2: Reference CLAUDE.md**

- The protocol is documented in CLAUDE.md
- Claude is instructed to follow it

**Method 3: Verify each step**

- After Step 1, check that session log was created
- After Step 2, review the plan file
- After Step 3, verify agent consultation
- After Step 4, check tests are passing
- After Step 5, verify progress files updated

**Method 4: Use checkpoints as verification**

- At each checkpoint, ask: "Confirm all protocol steps have been followed"

---

### Benefits of the 5-Step Protocol

**Quality Benefits**:

- Consistent code quality
- Fewer bugs (expert review in Step 3)
- Better test coverage (enforced in Step 4)
- Cleaner git history (Step 5)

**Documentation Benefits**:

- Always up-to-date (Step 5)
- Clear traceability (ticket → code)
- Session logs for reference
- Easy progress tracking

**Collaboration Benefits**:

- Easy handoff (session logs document decisions)
- Clear progress visibility (Step 5 updates)
- Consistent patterns (Step 3 expert guidance)
- Recoverable work (Step 4 checkpoints)

**AI Collaboration Benefits**:

- Claude has full context (Step 1)
- Claude follows a structured approach (all steps)
- You can verify Claude's work at each step
- Mistakes are caught early (Step 2 plan review)

---

### The Protocol is Your Safety Net

Think of the 5-step protocol as your **quality assurance system**:

1. **Step 1** prevents context loss
2. **Step 2** prevents "code first, think never"
3. **Step 3** prevents rookie mistakes
4. **Step 4** prevents lost work
5. **Step 5** prevents orphaned changes

**Without it**: chaos, inconsistency, lost work.
**With it**: professional, traceable, quality development.

Now let's see how to work with Claude Code using this protocol...

---

## Part 6: Working with Claude Code (AI Collaboration)

**THIS IS THE MOST IMPORTANT SECTION.** Here's how to work effectively with Claude Code in your professional workflow.

### The Mindset Shift: Claude as Your Structured Partner

**Old mindset** (ad-hoc AI usage):

- "Claude, just code this feature"
- Hope Claude does the right thing
- No verification, no structure
- Inconsistent results

**New mindset** (professional AI collaboration):

- "Claude, follow the 5-step protocol for US-001"
- Claude follows a structured process
- You verify each step
- Consistent, quality results

**The key**: You're not just asking Claude to code. You're asking Claude to follow a **professional development workflow**.

### How to Start Every Session (The Session Starter)

**COPY-PASTE THIS PROMPT**:

```
MANDATORY PROTOCOL — Follow .claude/sops/session-protocol.md and complete ALL 5 steps.

Current task: Implement ticket US-001

ENFORCE:
- ✅ Step 1: Initialize session (load Memory Bank, create session log)
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every ~15K tokens
- ✅ Step 5: Post-completion updates

Confirm each step explicitly before proceeding to the next.
```

**What Claude will do**:

1. Read the session protocol file
2. Load all 5 Memory Bank files
3. Create session log
4. Confirm Step 1 complete
5. Wait for you to proceed or automatically continue through steps

**Why this works**:

- Explicitly references the protocol file
- Lists all 5 steps (reminder)
- Asks for confirmation (accountability)
- Mentions the specific ticket

### What to Expect at Each Protocol Step

Let's walk through what Claude's responses should look like at each step.

---

#### Step 1: What You Should See

**Good Response** (Claude did Step 1 correctly):

```
I'll follow the 5-step protocol for ticket US-001.

✅ STEP 1: Initialize Session - COMPLETE

Memory Bank Loaded:
- project-brief.md: ProjectPulse Next.js web application
- system-patterns.md: Provider abstraction, hybrid memory patterns
- tech-context.md: TypeScript 5.3+, VS Code 1.85+, React 18
- active-context.md: Sprint 1 (Nov 4-10), US-001 in progress
- progress.md: Phase 1, Sprint 1, 0/10 points complete

Current Context:
- Sprint: Sprint 1 (Week 1-2 of Phase A)
- Ticket: US-001 - Create Phase hierarchy system (2 points)
- Goal: Implement Next.js Server Components
- Acceptance Criteria: Panel opens <1s

Session Log Created:
- File: .agent/sessions/session-20250105-0900.md

Ready to proceed to Step 2 (Planning).
```

**Bad Response** (Claude skipped Step 1):

```
Let's implement the phase hierarchy. I'll start by creating PhaseService.ts...
[starts coding immediately]
```

**How to verify**:

- ✅ Check: Does `.agent/sessions/session-YYYYMMDD-HHMM.md` exist?
- ✅ Check: Did Claude mention loading Memory Bank?
- ✅ Check: Did Claude identify the correct sprint and ticket?

**If Claude skipped Step 1**:

```
You: "Stop. You skipped Step 1. Please load the Memory Bank, check active-context.md for the current sprint and ticket, and create a session log file."
```

---

#### Step 2: What You Should See

**Good Response** (Claude did Step 2 correctly):

```
✅ STEP 2: Plan BEFORE Code - COMPLETE

I've created an implementation plan for US-001.

Implementation Plan Summary:
1. Register Next.js Server Components in extension.ts
2. Create PhaseService with streaming handler
3. Build React PhaseHierarchy component
4. Add message passing (extension ↔ client component)
5. Write unit tests (target 85% coverage)
6. Verify page load time (<1s acceptance criteria)

Files to Create/Modify:
- src/app/layout.tsx (modify - add registration)
- src/services/PhaseService.ts (new)
- src/client component/PhaseHierarchy.tsx (new)
- tests/PhaseService.test.ts (new)

Technical Decisions:
- Use Prisma Client queries
- Stream responses via client component.postMessage
- React for UI (established pattern)

Plan saved to: .agent/task/current-plan.md
Todos saved to: .agent/task/current-todos.md

Would you like to review the plan before I proceed to Step 3?
```

**Bad Response** (Claude skipped Step 2):

```
✅ STEP 1 COMPLETE

Now I'll start implementing the phase hierarchy...
[starts writing code without a plan]
```

**How to verify**:

- ✅ Check: Does `.agent/task/current-plan.md` exist?
- ✅ Check: Does `.agent/task/current-todos.md` exist?
- ✅ Check: Did Claude break down tasks clearly?
- ✅ Check: Are files to change identified?

**If Claude skipped Step 2**:

```
You: "Stop. You skipped Step 2. Please create a detailed implementation plan and save it to .agent/task/current-plan.md, and create a todo list in .agent/task/current-todos.md."
```

**Reviewing the plan** (optional but recommended):

```
You: "Show me the complete plan from current-plan.md"

[Claude shows the plan]

You can then say:
- "Looks good, proceed to Step 3"
- "Revise the plan: add error handling for X"
- "I think we should use Y approach instead of Z"
```

---

#### Step 3: What You Should See

**Good Response** (Claude did Step 3 correctly):

```
✅ STEP 3: Consult Experts - COMPLETE

I've consulted the following experts:

Agents Consulted:
1. next-js-expert (.claude/agents/next-js-expert.md)
   - Recommendation: Use Prisma Client queries
   - Pattern: Async handler with stream parameter
   - Security: Validate user input

2. react-expert (.claude/agents/core-development/react-expert.md)
   - Recommendation: Use Context API for state management
   - Pattern: Error boundaries for client component components
   - Testing: Test user interactions with @testing-library/react

3. security-engineer (.claude/agents/core-development/security-engineer.md)
   - Recommendation: Sanitize user input before processing
   - Pattern: Use DOMPurify for HTML sanitization
   - Validation: Validate message types

Skills Referenced:
1. moksha-devhub/api-patterns.md
   - Chat registration code snippet
   - Webview lifecycle management

2. moksha-devhub/component-patterns.md
   - Message passing between extension and client component
   - State sync pattern

Key Changes to Plan Based on Expert Guidance:
- Added input validation step (security-engineer)
- Will use error boundary wrapper (react-expert)
- Will follow exact Chat API pattern (next-js-expert)

Ready to proceed to Step 4 (Implementation).
```

**Bad Response** (Claude skipped Step 3):

```
✅ STEP 2 COMPLETE

Now I'll start implementing...
[starts coding without consulting agents]
```

**How to verify**:

- ✅ Check: Did Claude mention specific agent files?
- ✅ Check: Are recommendations listed?
- ✅ Check: Was the plan updated based on expert guidance?

**If Claude skipped Step 3**:

```
You: "Stop. You skipped Step 3. Please consult these agents: next-js-expert, react-expert, and security-engineer. Apply their recommendations to the plan."
```

**If you want specific agents**:

```
You: "Before implementing, also consult the qa-tester agent for testing strategy."
```

---

#### Step 4: What You Should See

**Good Response** (Claude doing Step 4 correctly):

```
✅ STEP 3 COMPLETE

Starting Step 4: Implementation

Task 1: Register Chat Participant in extension.ts
[Shows code being added to src/app/layout.tsx]
✅ Participant registered successfully

Task 2: Create PhaseService with streaming
[Shows PhaseService.ts implementation]
✅ PhaseService created with streaming support

✅ CHECKPOINT (15K tokens)
Session log updated with:
- Progress: Tasks 1-2 complete
- Decision: Used Context API per react-expert
- Issue resolved: Activation time optimized (lazy loading)
- Next: Tasks 3-4 (UI + tests)

Task 3: Build React PhaseHierarchy component
[Shows PhaseHierarchy.tsx implementation]
✅ PhaseHierarchy component created with error boundary

Task 4: Write unit tests
[Shows test file]
✅ Tests written
Running tests...
✅ All tests passing (12/12)
✅ Coverage: 87% (target: 85%)

✅ STEP 4 COMPLETE - Implementation finished with checkpoints
```

**Bad Response** (Claude not following Step 4):

```
[Dumps all code at once without checkpoints]
[No test coverage reported]
[No session log updates]
[Todos not marked complete]
```

**How to verify**:

- ✅ Check: Are checkpoints created every ~15K tokens?
- ✅ Check: Is `.agent/sessions/session-*.md` being updated?
- ✅ Check: Are tests written and passing?
- ✅ Check: Is coverage >80%?

**Managing Step 4**:

```
# If Claude dumps too much code at once:
You: "Pause. Create a checkpoint now and update the session log."

# If tests are skipped:
You: "Write comprehensive unit tests for PhaseService with >85% coverage."

# If you want to verify before continuing:
You: "Show me the current progress from the session log."

# If implementation deviates from plan:
You: "Why did you choose X instead of Y from the plan? Update the session log with this decision."
```

---

#### Step 5: What You Should See

**Good Response** (Claude did Step 5 correctly):

```
✅ STEP 4 COMPLETE

Now completing Step 5: Update all documentation and progress tracking.

Test Results:
- Unit tests: 12/12 ✅
- Integration tests: 3/3 ✅
- Coverage: 87% ✅ (target: 85%)
- Manual verification: Activation time 0.8s ✅ (target: <1s)

Documentation Updates:

1. docs/12-Backlog.md
   - Changed US-001 status from "Planned" to "Done"
   - Marked checkbox as complete

2. .agent/active-context.md
   - Moved US-001 to "Tickets Completed This Sprint"
   - Updated Sprint Progress: 2/10 points (20%)
   - Updated "What We Just Completed"
   - Updated "What We're Doing Next": US-002

3. .agent/progress.md
   - Marked US-001 as ✅ complete
   - Added to Recent Updates: "2025-11-05: US-001 Complete ✅"
   - Updated Sprint 1 progress: 20%

Git Commits Prepared:

Commit 1 (Documentation):
```

docs: update progress for US-001 completion

- Mark US-001 as Done in Backlog
- Update active-context.md Sprint 1 progress (20%)
- Update progress.md with completion status

```

Commit 2 (Feature):
```

feat: add phase hierarchy with streaming (closes US-001)

- Implement Next.js Server Components registration in extension.ts
- Add PhaseService with streaming handler
- Create React PhaseHierarchy component with error boundaries
- Add message passing between extension and client component
- Write comprehensive unit tests (87% coverage)

Acceptance Criteria Met:
✅ Panel opens <1s (measured: 0.8s)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>

```

✅ STEP 5 COMPLETE - All progress tracking updated, commits ready

US-001 is now complete! Ready to push or proceed to next ticket (US-002).
```

**Bad Response** (Claude skipped Step 5):

```
✅ STEP 4 COMPLETE

Implementation is done! Here's the code...
[No mention of documentation updates]
[No commits created]
```

**How to verify**:

- ✅ Check `docs/12-Backlog.md`: Is US-001 marked "Done"?
- ✅ Check `.agent/active-context.md`: Is sprint % updated?
- ✅ Check `.agent/progress.md`: Is US-001 marked ✅?
- ✅ Check git status: Are commits created?

**If Claude skipped Step 5**:

```
You: "You skipped Step 5. Please:
1. Update docs/12-Backlog.md (mark US-001 as Done)
2. Update .agent/active-context.md (move ticket to Completed, update sprint %)
3. Update .agent/progress.md (mark ✅, add to Recent Updates)
4. Create two git commits (docs first, then feature)"
```

**Alternative** (use automation):

```
You: "Run the progress sync script for US-001"

Claude will run:
npm run sync-progress -- --ticket US-001 --status done
```

---

### How to Verify Claude Is Following the Protocol

Use this checklist after each step:

**After Step 1**:

```bash
# Check if session log exists
ls .agent/sessions/

# Expected: session-20250105-HHMM.md exists

# Check if Claude mentioned Memory Bank
# Expected: Claude lists all 5 files loaded
```

**After Step 2**:

```bash
# Check if plan files exist
ls .agent/task/

# Expected: current-plan.md and current-todos.md exist

# Open and review plan
code .agent/task/current-plan.md
```

**After Step 3**:

- Look for "Consulted Experts:" section in Claude's response
- Verify specific agent files are mentioned
- Check that recommendations are listed

**After Step 4**:

```bash
# Check if tests pass
npm test

# Check coverage
# Expected: >80%

# Check session log has checkpoints
code .agent/sessions/session-*.md
# Expected: Multiple checkpoint entries
```

**After Step 5**:

```bash
# Check documentation updates
git status

# Expected changes:
# modified: docs/12-Backlog.md
# modified: .agent/active-context.md
# modified: .agent/progress.md
# plus src/ and tests/ files

# Check commits exist
git log --oneline -2

# Expected: 2 recent commits (docs + feature)
```

---

### Common AI Collaboration Mistakes and How to Fix Them

#### Mistake 1: Claude Starts Coding Immediately

**What you see**:

```
You: "Implement US-001"

Claude: "I'll create the phase hierarchy. Here's PhaseService.ts..."
[starts coding without protocol]
```

**Why it happens**: Your prompt didn't enforce the protocol.

**How to fix**:

```
You: "STOP. Follow the 5-step protocol from .claude/sops/session-protocol.md. Start with Step 1: Load Memory Bank and create session log."
```

**Prevention**: Always use the session starter prompt from the beginning.

---

#### Mistake 2: Claude Skips Memory Bank Loading

**What you see**:

```
Claude: "I'll implement the phase hierarchy..."
[No mention of Memory Bank, active-context, or sprint]
```

**Why it happens**: Claude forgot to load context.

**How to fix**:

```
You: "You skipped Step 1. Please:
1. Read all 5 Memory Bank files (.agent/*.md)
2. Check .agent/active-context.md for current sprint and ticket
3. Create .agent/sessions/session-[timestamp].md
4. Confirm what sprint and ticket we're working on"
```

---

#### Mistake 3: Claude Creates Plan But Doesn't Save It

**What you see**:

```
Claude: "Here's my implementation plan:
1. Task A
2. Task B
..."
[Plan shown in chat but not saved to file]
```

**Why it happens**: Claude explained the plan but didn't write the file.

**How to fix**:

```
You: "Save this plan to .agent/task/current-plan.md and create todos in .agent/task/current-todos.md"
```

**Verification**:

```bash
ls .agent/task/
# Should show: current-plan.md and current-todos.md
```

---

#### Mistake 4: Claude Doesn't Consult Agents

**What you see**:

```
Claude: "✅ STEP 2 COMPLETE

Now I'll implement..."
[Jumps from Step 2 to Step 4, skipping Step 3]
```

**Why it happens**: Claude rushed through or misunderstood the protocol.

**How to fix**:

```
You: "You skipped Step 3. Before implementing, consult these agents:
- next-js-expert for Chat API patterns
- react-expert for component structure
- security-engineer for input validation

Apply their recommendations to your plan."
```

---

#### Mistake 5: No Checkpoints During Implementation

**What you see**:

```
Claude: [Dumps 100 lines of code]
[Dumps 200 lines of code]
[Dumps tests]
"Done!"
```

**Why it happens**: Claude implemented everything at once without pausing.

**How to fix**:

```
You: "Pause implementation. Create a checkpoint in the session log with:
- What's complete so far
- Any decisions made
- Any issues encountered
- What's next"
```

**Prevention**:

```
You: "Implement incrementally. After each major task, create a checkpoint."
```

---

#### Mistake 6: Claude Doesn't Update Progress Files

**What you see**:

```
Claude: "Implementation complete! Here's the code..."
[No mention of Backlog, active-context, or progress.md]
```

**Why it happens**: Claude forgot Step 5.

**How to fix**:

```
You: "Complete Step 5. Update:
1. docs/12-Backlog.md (mark US-001 Done)
2. .agent/active-context.md (sprint progress %)
3. .agent/progress.md (mark ✅)
4. Create git commits"
```

**Verification**:

```bash
# Check git status
git status

# Should show modified:
# - docs/12-Backlog.md
# - .agent/active-context.md
# - .agent/progress.md
```

---

### Prompts for Common Situations

**Starting a new ticket**:

```
Follow the 5-step protocol and implement US-001.

Load Memory Bank, check active-context.md for current sprint, and confirm each step explicitly.
```

**Reviewing the plan before implementation**:

```
Show me the complete implementation plan from .agent/task/current-plan.md. I want to review it before you proceed to Step 3.
```

**Requesting a specific agent**:

```
Before implementing, also consult the database-expert agent since this ticket involves schema changes.
```

**Asking for a checkpoint**:

```
Create a checkpoint now. Update the session log with progress, decisions, and next steps.
```

**Verifying progress**:

```
Show me:
1. Current sprint progress from active-context.md
2. Last checkpoint from the session log
3. Remaining todos from current-todos.md
```

**Resuming after interruption**:

```
Resume work on US-001. Load Memory Bank, check the last session log (.agent/sessions/session-20250105-0900.md) for the last checkpoint, and continue from where we left off.
```

**Requesting Step 5**:

```
Complete Step 5:
- Update all progress files (Backlog, active-context, progress)
- Create git commits (docs first, then feature)
- Show me the commit messages before committing
```

**When Claude deviates from the plan**:

```
I notice you implemented X differently than planned. Explain the reasoning and update the session log with this decision.
```

**When tests are failing**:

```
Tests are failing. Debug the issue, fix it, re-run tests, and verify coverage is still >85%.
```

---

### Managing Context Budget (200K Tokens)

Claude Code has a **200K token limit per conversation**. Here's how to manage it:

**Current usage**:

- Memory Bank: ~8K tokens (4%)
- Session protocol: ~3K tokens (1.5%)
- Average ticket implementation: ~40K tokens (20%)
- **You can fit ~4-5 tickets per session**

**When to checkpoint** (before hitting limit):

```
You: "We're at ~150K tokens. Create a comprehensive checkpoint in the session log with all progress, then I'll start a new session."
```

**Starting a new session** (after checkpoint):

```
You (in new session): "Resume work. Load Memory Bank, read the latest session log (.agent/sessions/session-20250105-0900.md), and continue from the last checkpoint."

Claude will:
- Load Memory Bank (fresh context)
- Read previous session log (knows what was done)
- Continue where you left off
```

**Token-saving tips**:

- Don't ask Claude to read entire large files - use specific sections
- Use skills (250 tokens) instead of full agents (2-3K tokens) when possible
- Checkpoint and start fresh sessions instead of trying to compress

---

### What Claude Should NOT Do (Red Flags)

**🚩 Red Flag 1**: Starts coding before planning

- **Fix**: "Stop. Follow Step 2 first - create a plan."

**🚩 Red Flag 2**: Uses patterns not in system-patterns.md

- **Fix**: "We use pattern X per system-patterns.md, not pattern Y. Revise."

**🚩 Red Flag 3**: Skips tests

- **Fix**: "Write comprehensive tests with >85% coverage."

**🚩 Red Flag 4**: Creates files not in the plan

- **Fix**: "Why did you create file X? It's not in the plan. Explain and update plan."

**🚩 Red Flag 5**: Doesn't update documentation

- **Fix**: "Complete Step 5. Update Backlog, active-context, and progress files."

**🚩 Red Flag 6**: Git commits are incomplete

- **Fix**: "Create two separate commits: one for docs, one for feature. Include ticket ID."

---

### Building Trust with Claude

**Start small**:

- First ticket: Watch every step, verify everything
- Second ticket: Verify checkpoints only
- Third+ tickets: Trust the process, spot-check

**Give feedback**:

- "Good job following the protocol"
- "Next time, create more checkpoints"
- "The plan was too vague - be more specific"

**Be specific**:

- ❌ "Implement the feature"
- ✅ "Follow 5-step protocol and implement US-001"

**Verify, then trust**:

- First few tickets: Verify every step
- After pattern is established: Trust with spot-checks
- If quality drops: Return to full verification

---

### The AI Collaboration Contract

**You are responsible for**:

- Starting sessions with the right prompt
- Reviewing plans (Step 2)
- Verifying each step is complete
- Course-correcting when Claude skips steps
- Final review before merging

**Claude is responsible for**:

- Following the 5-step protocol
- Loading Memory Bank every session
- Consulting expert agents
- Creating checkpoints
- Updating all documentation
- Writing quality, tested code

**Together you ensure**:

- Consistent quality
- Complete documentation
- Full traceability
- Professional development

---

Now let's look at the agents and skills available to assist with implementation...

---

## Part 7: Agents & Skills Reference

You have **15 expert agents** and **9 quick-reference skills** to help with implementation.

### The 15 Expert Agents

Located in `.claude/agents/` - these provide deep, detailed guidance.

**Core Development Experts** (`.claude/agents/core-development/`):

1. **typescript-expert.md** - TypeScript patterns, types, generics
2. **react-expert.md** - React components, hooks, state management
3. **api-expert.md** - API design, REST patterns, validation
4. **database-expert.md** - Schema design, queries, migrations
5. **security-engineer.md** - Security best practices, validation, auth
6. **qa-tester.md** - Test strategy, coverage, TDD
7. **devops-engineer.md** - Build, CI/CD, deployment
8. **frontend-developer.md** - UI implementation, CSS, UX
9. **backend-developer.md** - Service layer, business logic

**VS Code Specialist**: 10. **next-js-expert.md** - Chat API, TreeView, Webview, VS Code APIs

**Implementation Helpers** (`.claude/agents/implementation/`): 11. **explore-codebase.md** - Codebase scanning and analysis 12. **analyze-architecture.md** - Flow analysis, dependency mapping 13. **synthesize-docs.md** - Post-feature documentation 14. **map-system.md** - System documentation refresh

**Orchestrators** (`.claude/agents/orchestrators/`): 15. **planning-orchestrator.md** - High-level workflow coordination

### The 9 Quick-Reference Skills

Located in `.claude/skills/` - these provide code snippets and patterns (~250 tokens each).

1. **moksha-devhub/api-patterns.md** - Chat, TreeView, Webview, Commands, Storage
2. **moksha-devhub/component-patterns.md** - Webview UI, message passing
3. **testing-patterns.md** - Unit/integration test examples
4. **extension-testing-patterns.md** - VS Code E2E testing
5. **api-route-pattern.md** - API route conventions
6. **database-migration-pattern.md** - Schema versioning
7. **chromadb-patterns.md** - Vector search (RAG) [deprecated, using Qdrant]
8. **memgraph-patterns.md** - Graph queries (Cypher)
9. **mcp-patterns.md** - Model Context Protocol integration

### When to Use What

**Decision Tree**:

```
Need deep consultation? → Use Agent
Need quick code snippet? → Use Skill

TypeScript help? → typescript-expert
React component? → react-expert OR moksha-devhub/component-patterns (skill)
VS Code API? → next-js-expert OR moksha-devhub/api-patterns (skill)
Security review? → security-engineer
Test strategy? → qa-tester OR testing-patterns (skill)
Database design? → database-expert
API design? → api-expert
```

**Rule of thumb**:

- **Agent** = "Why and how" (2-3K tokens, detailed)
- **Skill** = "How to" (250 tokens, quick reference)

### How Claude Uses Agents in Step 3

When Claude reaches Step 3 (Consult Experts), it:

1. Identifies relevant agents based on ticket requirements
2. Reads agent markdown files
3. Extracts recommendations
4. Updates the implementation plan
5. Lists which agents were consulted

**Example** (for US-001 - Chat interface):

```
Claude consults:
- next-js-expert (Chat API patterns)
- react-expert (Component structure)
- security-engineer (Input validation)

Result: Plan updated with security validation, error boundaries, specific Chat API usage
```

### Agent Quick Reference Table

| If Ticket Involves... | Consult This Agent | Also Check This Skill                         |
| --------------------- | ------------------ | --------------------------------------------- |
| Next.js APIs          | next-js-expert     | moksha-devhub/api-patterns                    |
| React UI              | react-expert       | moksha-devhub/component-patterns              |
| TypeScript types      | typescript-expert  | -                                             |
| API design            | api-expert         | api-route-pattern                             |
| Database              | database-expert    | memgraph-patterns, database-migration-pattern |
| Security              | security-engineer  | -                                             |
| Testing               | qa-tester          | testing-patterns, extension-testing-patterns  |
| Build/CI              | devops-engineer    | -                                             |

### Pro Tips

**Tip 1**: Let Claude choose agents automatically in Step 3, but you can override:

```
You: "Also consult the devops-engineer for CI/CD considerations"
```

**Tip 2**: Skills are faster - use them for common patterns:

```
You: "Check moksha-devhub/api-patterns skill for the Chat registration code"
```

**Tip 3**: Agents build on each other:

```
Claude might consult:
1. api-expert (API design)
2. security-engineer (validation)
3. qa-tester (test strategy)

Each agent's recommendations inform the next.
```

---

---

## Part 8: Ticket System Mastery

### Understanding Ticket Format

**Format**: `US-###` (User Story ###)

- US-001 = User Story 001
- US-010 = User Story 010
- US-125 = User Story 125 (project has 125 total user stories)

**Example Ticket** (from `docs/12-Backlog.md`):

```
- [ ] US-001 — Create Phase hierarchy system
  - Epic: EPIC-001 (Sprint/Phase Tracking)
  - FR: FR-001 (links to SRS requirement)
  - PRD: F1 (5-level hierarchy feature)
  - Points: 1 (story points, effort estimate using Fibonacci scale)
  - Sprint: 1 (assigned to Sprint 1, Phase A Week 1-2)
  - Status: Planned → In Progress → Done
  - AC: Create/read/update all 5 hierarchy levels via API
```

### The 8 Epics

| Epic     | Name                   | Focus                                   | User Stories | Complexity |
| -------- | ---------------------- | --------------------------------------- | ------------ | ---------- |
| EPIC-001 | Sprint/Phase Tracking  | 5-level hierarchy system                | ~15 stories  | Foundation |
| EPIC-002 | Workflow Orchestration | 12 workflow automation                  | ~18 stories  | Complex    |
| EPIC-003 | Issues                 | Issue tracking & management             | ~16 stories  | Moderate   |
| EPIC-004 | Knowledge              | RAG + Knowledge Graph (Qdrant/Memgraph) | ~20 stories  | Complex    |
| EPIC-005 | Skills                 | Skill generation & management           | ~14 stories  | Moderate   |
| EPIC-006 | Wiki                   | Documentation wiki system               | ~12 stories  | Simple     |
| EPIC-007 | Project Health         | Metrics & health monitoring             | ~15 stories  | Moderate   |
| EPIC-008 | Personas               | AI agent persona system                 | ~15 stories  | Moderate   |

### Ticket Lifecycle

```
1. Planned (in Backlog)
   ↓
2. Moved to active-context.md ("Tickets In Progress")
   ↓
3. Implementation (following 5-step protocol)
   ↓
4. Done (marked in Backlog)
   ↓
5. Moved to "Tickets Completed" in active-context.md
   ↓
6. Sprint progress % updated
```

### Traceability Chain

Every ticket links back to business value:

```
PRD Feature F1
  ↓
SRS Requirement FR-001
  ↓
Backlog Ticket US-001
  ↓
Implementation (src/app/layout.tsx)
  ↓
Tests (tests/PhaseService.test.ts)
  ↓
Git commit "feat: add phase hierarchy (closes US-001)"
```

**Why this matters**: You can always trace WHY code exists back to user value.

### How to Work with Tickets

**Finding ticket details**:

1. Open `docs/12-Backlog.md`
2. Search for ticket ID (e.g., "US-001")
3. Read: description, FR link, PRD link, points, AC

**Starting a ticket**:

```
You: "Follow 5-step protocol and implement US-001"

Claude: [Loads Memory Bank, finds ticket in active-context.md, begins protocol]
```

**Checking ticket status**:

```bash
# Check Backlog
grep "US-001" docs/12-Backlog.md

# Check active-context
grep "US-001" .agent/active-context.md

# Check progress
grep "US-001" .agent/progress.md
```

### Sprint Planning

**Your sprints** (from `docs/13-Project-Plan.md`):

- 8 sprints total (16 weeks across Phase A-D)
- 40 points capacity per sprint
- 2 weeks per sprint
- 4 phases: Phase A (Foundation), Phase B (Core), Phase C (Advanced), Phase D (Production)

**Sprint 1 example** (Phase A, Week 1-2):

- Goal: 5-level hierarchy foundation + workflow orchestration baseline
- Epic Focus: EPIC-001 (Sprint/Phase Tracking)
- Tickets: US-001 (1pt), US-002 (2pts), US-003 (3pts), + more
- Total: ~40 points (full capacity)

**Current status**: You're in Phase A, Sprint 1, ready to implement US-001.

### Updating Progress (The 3 Files)

After every ticket completion, update these 3 files:

**File 1: `docs/12-Backlog.md`**

```markdown
Before:

- [ ] US-001 — Create Phase hierarchy system

After:

- [x] US-001 — Create Phase hierarchy system
      Status: Done
```

**File 2: `.agent/active-context.md`**

```markdown
Before:

- Tickets In Progress: US-001 (1 point)
- Tickets Completed: [None]
- Sprint Progress: 0/40 points (0%)

After:

- Tickets In Progress: [None]
- Tickets Completed: US-001 (1 point)
- Sprint Progress: 1/40 points (2.5%)
```

**File 3: `.agent/progress.md`**

```markdown
Before:

- ⏳ US-001: Create Phase hierarchy system (1 point)

After:

- ✅ US-001: Create Phase hierarchy system (1 point)

Recent Updates:

- 2025-01-05: US-001 Complete ✅
```

**Automation**:

```bash
npm run sync-progress -- --ticket US-001 --status done
# Updates all 3 files automatically
```

---

---

## Part 9: Your Daily AI-Assisted Workflow

This is your practical guide for day-to-day work with Claude Code.

### Morning Routine (Starting Work)

**Step 1: Check Current Status** (5 minutes)

```bash
# Open key files
code .agent/active-context.md
code .agent/progress.md
code docs/12-Backlog.md
```

**What to look for**:

- `.agent/active-context.md` → Current sprint and active tickets
- `.agent/progress.md` → What's complete, what's pending
- `docs/12-Backlog.md` → Next ticket details

**Step 2: Start Claude Session**

Use the session starter prompt:

```
MANDATORY PROTOCOL — Follow .claude/sops/session-protocol.md and complete ALL 5 steps.

Current task: Implement ticket US-001

ENFORCE:
- ✅ Step 1: Initialize session (load Memory Bank, create session log)
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every ~15K tokens
- ✅ Step 5: Post-completion updates

Confirm each step explicitly before proceeding to the next.
```

**Step 3: Verify Step 1**

- Check that `.agent/sessions/session-[timestamp].md` was created
- Verify Claude mentioned loading all 5 Memory Bank files
- Confirm Claude identified the correct sprint and ticket

### During Implementation (Active Work)

**Checkpoint at regular intervals**:

```
You: "Create a checkpoint now and update the session log."

[Every ~15K tokens or after major tasks]
```

**Verify Step 2 (Planning)**:

```bash
# Check plan files exist
ls .agent/task/

# Review the plan
code .agent/task/current-plan.md
```

**If you need to pause**:

```
You: "Create a comprehensive checkpoint in the session log. I need to pause work."

Claude will update session log with:
- Current progress
- Decisions made
- Issues encountered
- Next steps
```

**Resume after break**:

```
You: "Resume work on US-001. Load Memory Bank, check the last session log (.agent/sessions/session-[timestamp].md), and continue from the last checkpoint."
```

### End of Day (Wrapping Up)

**If ticket is complete**:

- Claude should automatically do Step 5 (update all progress files)
- Verify with: `git status` (should show modified docs and progress files)
- Review commits: `git log --oneline -2`

**If ticket is in progress**:

```
You: "Create a comprehensive checkpoint for end of day. Update session log with current status, decisions, and next steps."
```

### Weekly Review (Sprint Boundaries)

**End of sprint** (e.g., Friday of Sprint 1):

```bash
# Check sprint completion
grep "Sprint 1" .agent/progress.md

# Review completed tickets
grep "✅" .agent/progress.md | grep "Sprint 1"

# Check if sprint goals met
code docs/13-Project-Plan.md
```

**Start of new sprint** (e.g., Monday of Sprint 2):

```bash
# Update active-context.md with new sprint
# (Claude does this in Step 5 when first ticket of new sprint starts)

# Review sprint plan
code docs/13-Project-Plan.md
# Note Sprint 2 tickets and goals
```

### Example: A Full Day's Work

**9:00 AM - Morning**

```
You: Read .agent/active-context.md
→ See: Sprint 1, US-001 pending (2 points)

You: Start Claude session with protocol prompt
Claude: ✅ Step 1 complete, loads Memory Bank, creates session log
Claude: ✅ Step 2 complete, creates plan in .agent/task/current-plan.md
Claude: ✅ Step 3 complete, consults next-js-expert, react-expert, security-engineer

You: Review plan (.agent/task/current-plan.md)
You: "Looks good, proceed with Step 4"
```

**10:00 AM - Implementation**

```
Claude: Implements Task 1 (Register chat participant)
Claude: ✅ Task 1 complete

Claude: Implements Task 2 (Create PhaseService)
Claude: ✅ CHECKPOINT at 15K tokens
Claude: ✅ Task 2 complete

You: Take a break, grab coffee
```

**10:30 AM - Continue**

```
You: "Continue with Task 3"

Claude: Implements Task 3 (React PhaseHierarchy)
Claude: ✅ Task 3 complete

Claude: Implements Task 4 (Write tests)
Claude: ✅ Tests passing, 87% coverage
Claude: ✅ Task 4 complete
```

**11:00 AM - Completion**

```
Claude: ✅ Step 4 complete
Claude: Starting Step 5...
Claude: Updates docs/12-Backlog.md (US-001 → Done)
Claude: Updates .agent/active-context.md (Sprint 1: 2/10 points, 20%)
Claude: Updates .agent/progress.md (✅ US-001)
Claude: Creates git commits (docs + feature)
Claude: ✅ Step 5 complete

You: Review changes with git status
You: Test manually (page load time: 0.8s ✅)
You: git push origin feature/chat-interface
```

**11:30 AM - Ready for Next Ticket**

```
You: Read .agent/active-context.md
→ See: Sprint 1, US-001 complete (2 pts), US-002 next (5 pts)

You: "Follow 5-step protocol and implement US-002"
Claude: [Starts new cycle]
```

**By end of day**:

- 1-3 tickets completed (depending on size)
- All documentation updated
- Session logs created for recovery
- Ready to continue tomorrow

---

---

## Part 10: Practical Scenarios

Real-world examples of working with Claude Code.

### Scenario 1: Your First Ticket (US-001)

**You're brand new. What do you do?**

**Step 1: Read this guide** (30 minutes)

- Parts 1-6 (understand the system)
- Part 9 (daily workflow)
- Part 11 (prompts)

**Step 2: Check your status** (5 minutes)

```bash
code .agent/active-context.md
# See: Sprint 1, US-001 pending
```

**Step 3: Start Claude session**

```
MANDATORY PROTOCOL — Follow .claude/sops/session-protocol.md and complete ALL 5 steps.

Current task: Implement ticket US-001

ENFORCE:
- ✅ Step 1: Initialize session (load Memory Bank, create session log)
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every ~15K tokens
- ✅ Step 5: Post-completion updates

Confirm each step explicitly before proceeding to the next.
```

**Step 4: Watch Claude work**

- Verify Step 1: Check `.agent/sessions/` folder
- Verify Step 2: Review `.agent/task/current-plan.md`
- Verify Step 3: Note which agents were consulted
- Verify Step 4: See checkpoints being created
- Verify Step 5: Check `git status` shows updates

**Step 5: Review and test**

```bash
npm test
# Verify tests pass, coverage >80%

git log --oneline -2
# Verify two commits created

git push
```

**Result**: First ticket complete! You now understand the workflow.

---

### Scenario 2: Session Crashed Mid-Implementation

**The problem**: Your computer crashed while Claude was implementing US-002.

**Don't panic!** The recovery workflow:

**Step 1: Check what was completed** (5 minutes)

```bash
# Check active-context
code .agent/active-context.md
# See: "What We're Doing Right Now"

# Check progress
code .agent/progress.md
# See: US-002 still shows ⏳ (not complete)

# Check latest session log
ls .agent/sessions/
# Find: session-20250105-1030.md (latest)

code .agent/sessions/session-20250105-1030.md
# Read last checkpoint
```

**Step 2: Understand the last checkpoint**

```markdown
## Checkpoint 2 (32K tokens) - 11:15 AM

### Progress

- ✅ Task 1: Define AIProvider interface
- ✅ Task 2: Create base provider class
- ⏳ Task 3: Implement ClaudeProvider (50% done)

### Decisions Made

- Used abstract class instead of interface for shared logic
- Added retry logic in base class

### Issues Encountered

- None

### Next Steps

- Complete ClaudeProvider implementation
- Implement OpenAIProvider
- Write tests
```

**Step 3: Resume with Claude**

```
Resume work on US-002.

Load Memory Bank and read the last session log (.agent/sessions/session-20250105-1030.md).

We were at Checkpoint 2 (32K tokens, 11:15 AM):
- Completed: Tasks 1-2
- In progress: Task 3 (ClaudeProvider 50% done)
- Next: Finish ClaudeProvider, implement OpenAIProvider, write tests

Continue from where we left off. Follow the remaining protocol steps.
```

**Step 4: Claude recovers**

```
Claude:
✅ Memory Bank loaded
✅ Read session log
✅ Last checkpoint: Task 3 (ClaudeProvider 50% done)

Continuing implementation...
[Completes ClaudeProvider]
[Implements OpenAIProvider]
[Writes tests]
✅ Step 4 complete

Completing Step 5...
[Updates all progress files]
✅ Step 5 complete

US-002 is now complete!
```

**Result**: Work resumed seamlessly, no loss.

---

### Scenario 3: Multi-Ticket Day

**The goal**: Complete 3 tickets in one day (US-001, US-004, US-005).

**Morning (9:00 AM) - Ticket 1: US-001**

```
You: "Follow 5-step protocol and implement US-001"

Claude: [Completes all 5 steps]
Result: US-001 done (2 points) - 60 minutes
```

**Mid-Morning (10:00 AM) - Ticket 2: US-004**

```
You: "Follow 5-step protocol and implement US-004"

Claude: [Completes all 5 steps]
Result: US-004 done (2 points) - 45 minutes
```

**Before Lunch (10:45 AM) - Ticket 3: US-005**

```
You: "Follow 5-step protocol and implement US-005"

Claude: [Completes Steps 1-3]
Claude: [Starts Step 4, implements half the feature]

You: "Create checkpoint - breaking for lunch"
```

**After Lunch (1:00 PM) - Resume Ticket 3**

```
You: "Resume US-005. Check last session log and continue from checkpoint."

Claude: [Resumes from checkpoint]
Claude: [Completes Step 4]
Claude: [Completes Step 5]
Result: US-005 done (2 points) - 30 more minutes
```

**Total**: 6 points completed in one day!

**Key insight**: The protocol works for both single-ticket and multi-ticket sessions.

---

### Scenario 4: Sprint Review (End of Sprint 1)

**It's Friday, Sprint 1 is ending. What do you do?**

**Step 1: Check sprint completion**

```bash
code .agent/progress.md
# Check Sprint 1 section
```

```markdown
### Sprint 1 (Week 1-2 of Phase A) - 100% Complete

**Goal**: Chat foundation + provider baseline
**Capacity**: 10 points
**Progress**: 10/10 points (100%)

**Tasks**:

- ✅ US-001: Create Phase hierarchy system (2 points)
- ✅ US-002: Provider abstraction layer (5 points)
- ✅ US-003: Claude API integration (3 points)

Sprint Goal: ✅ ACHIEVED
```

**Step 2: Verify all documentation updated**

```bash
# Check Backlog
grep -A 3 "US-001\|US-002\|US-003" docs/12-Backlog.md
# All should show [x] Done

# Check active-context
code .agent/active-context.md
# Should show Sprint 1: 10/10 points (100%)
```

**Step 3: Prepare for Sprint 2**

```bash
# Review Sprint 2 plan
code docs/13-Project-Plan.md
# Note Sprint 2 tickets and goals

# Update active-context.md for new sprint
# (Claude does this automatically when you start first Sprint 2 ticket)
```

**Monday: Start Sprint 2**

```
You: "Follow 5-step protocol and implement US-004 (first ticket of Sprint 2)"

Claude:
✅ Step 1: Load Memory Bank
✅ Detected: Sprint 1 complete, starting Sprint 2
✅ Updated active-context.md with Sprint 2 info
✅ Proceeding with US-004...
```

**Result**: Smooth transition between sprints.

---

### Scenario 5: Discovering a New Pattern

**The situation**: While implementing E03-S01 (memory feature), you discover a new useful pattern not in `system-patterns.md`.

**Step 1: Complete the ticket normally**

```
[Follow 5-step protocol, complete E03-S01]
```

**Step 2: Document the new pattern**

```
You: "We discovered a new pattern during E03-S01 implementation: the Memory Manager pattern for coordinating vector and graph databases. Add this to .agent/system-patterns.md"

Claude:
✅ Reading current system-patterns.md
✅ Adding new section:

## Memory Manager Pattern
Coordinates vector DB (Qdrant) and graph DB (Memgraph) for hybrid search.

Pattern:
- MemoryManager orchestrates both databases
- Parallel query execution
- Result fusion with relevance scoring
- Used in: src/services/MemoryManager.ts

Benefits:
- Single interface for complex hybrid queries
- Better separation of concerns
- Easier to test

✅ system-patterns.md updated
```

**Step 3: Create a skill (optional)**

```
You: "Create a skill file (.claude/skills/memory-manager-pattern.md) with code examples"

Claude:
✅ Created .claude/skills/memory-manager-pattern.md
✅ Includes: Usage examples, code snippets, common patterns
```

**Result**: New pattern documented for future tickets. System evolves!

---

---

## Part 11: Prompts Library

Copy-paste prompts for every situation.

### Session Starters

**New ticket (standard)**:

```
MANDATORY PROTOCOL — Follow .claude/sops/session-protocol.md and complete ALL 5 steps.

Current task: Implement ticket US-001

ENFORCE:
- ✅ Step 1: Initialize session (load Memory Bank, create session log)
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every ~15K tokens
- ✅ Step 5: Post-completion updates

Confirm each step explicitly before proceeding to the next.
```

**Resume after interruption**:

```
Resume work on US-001.

Load Memory Bank and read the last session log (.agent/sessions/session-YYYYMMDD-HHMM.md).

Check the last checkpoint and continue from where we left off.

Follow the remaining protocol steps to completion.
```

**Multi-ticket session**:

```
Follow 5-step protocol for these tickets in sequence: US-001, US-004, US-005.

Complete all 5 steps for each ticket before moving to the next.
```

### Mid-Session Prompts

**Request checkpoint**:

```
Create a checkpoint now. Update the session log with:
- Current progress
- Decisions made
- Issues encountered
- Next steps
```

**Review plan**:

```
Show me the complete implementation plan from .agent/task/current-plan.md. I want to review it before you proceed.
```

**Request specific agent**:

```
Before implementing, also consult the [agent-name] agent for [specific guidance].
```

**Verify protocol**:

```
Confirm you've completed all protocol steps so far:
- Step 1: Memory Bank loaded?
- Step 2: Plan saved?
- Step 3: Agents consulted?
```

### Correction Prompts

**Enforce Step 1**:

```
You skipped Step 1. Please:
1. Read all 5 Memory Bank files (.agent/*.md)
2. Check .agent/active-context.md for current sprint and ticket
3. Create .agent/sessions/session-[timestamp].md
4. Confirm what sprint and ticket we're working on
```

**Enforce Step 2**:

```
Stop. You skipped Step 2. Create a detailed implementation plan and save it to .agent/task/current-plan.md, and create todos in .agent/task/current-todos.md.
```

**Enforce Step 3**:

```
You skipped Step 3. Before implementing, consult these agents:
- [list relevant agents]

Apply their recommendations to your plan.
```

**Enforce Step 5**:

```
Complete Step 5. Update:
1. docs/12-Backlog.md (mark US-001 Done)
2. .agent/active-context.md (sprint progress %)
3. .agent/progress.md (mark ✅, add to Recent Updates)
4. Create git commits (docs first, then feature)
```

### Status Check Prompts

**Check progress**:

```
Show me:
1. Current sprint progress from active-context.md
2. Last checkpoint from the session log
3. Remaining todos from current-todos.md
```

**Check what's done**:

```
What tickets have been completed in Sprint 1? Check progress.md and list them.
```

**Check what's next**:

```
What's the next ticket to work on? Check active-context.md.
```

### Recovery Prompts

**After crash**:

```
Load Memory Bank, check .agent/active-context.md for current work, and read the latest session log in .agent/sessions/.

Tell me:
- What ticket were we working on?
- What was the last checkpoint?
- What needs to be completed?
```

**Lost context**:

```
I'm lost. Load Memory Bank and tell me:
- Current phase and sprint
- Active tickets
- Recent completions
- What I should work on next
```

### Testing & Quality Prompts

**Run tests**:

```
Run tests and verify:
- All tests passing
- Coverage >85%
- No lint errors
```

**Fix failing tests**:

```
Tests are failing. Debug the issue, fix it, re-run tests, and verify coverage is still >85%.
```

**Code review request**:

```
Before we commit, review the implementation for:
- Security vulnerabilities
- Performance issues
- Missing error handling
- Test coverage gaps
```

### Documentation Prompts

**Update patterns**:

```
We discovered a new pattern: [pattern name]. Add it to .agent/system-patterns.md with:
- Description
- When to use it
- Code example
- Benefits
```

**Create skill**:

```
Create a new skill file at .claude/skills/[name].md with quick-reference code patterns for [topic].
```

**Update progress manually**:

```
Run the automation script to update progress:
npm run sync-progress -- --ticket US-001 --status done
```

---

---

## Part 12: Common Pitfalls & Solutions

Learn from common mistakes.

### Pitfall 1: Not Using the Session Starter Prompt

**❌ What you do**:

```
You: "Implement US-001"
```

**⚠️ Result**: Claude starts coding without loading Memory Bank or following protocol.

**✅ Solution**: Always use the full session starter prompt from Part 11.

---

### Pitfall 2: Forgetting to Verify Each Step

**❌ What you do**: Let Claude run through all 5 steps without checking.

**⚠️ Result**: You don't notice when steps are skipped until it's too late.

**✅ Solution**: Verify after each step:

- Step 1: Check `.agent/sessions/` folder
- Step 2: Review `.agent/task/current-plan.md`
- Step 3: Verify agents were consulted
- Step 4: Check for checkpoints in session log
- Step 5: Run `git status` to verify updates

---

### Pitfall 3: Skipping Plan Review (Step 2)

**❌ What you do**: Claude creates plan, you say "proceed" without reading it.

**⚠️ Result**: Implementation goes in wrong direction, wastes time.

**✅ Solution**: Always review `current-plan.md` after Step 2. Ask:

- Are all tasks clear?
- Are files correctly identified?
- Do decisions make sense?

---

### Pitfall 4: Not Creating Checkpoints

**❌ What you do**: Let Claude implement entire feature (50K tokens) without checkpoints.

**⚠️ Result**: Session crashes, lose all context, hard to resume.

**✅ Solution**: Request checkpoint every ~15K tokens or after major tasks.

---

### Pitfall 5: Forgetting Step 5 Updates

**❌ What you do**: Feature complete, push code, move to next ticket.

**⚠️ Result**: Backlog, active-context, and progress files are stale. Next session, Claude is confused about status.

**✅ Solution**: Always complete Step 5. Verify with `git status` - should see 3 progress files modified.

---

### Pitfall 6: Not Reading active-context.md

**❌ What you do**: Start work without checking current status.

**⚠️ Result**: Work on wrong ticket, duplicate work, or work on completed ticket.

**✅ Solution**: Every morning, read `.agent/active-context.md` to see current sprint and active tickets.

---

### Pitfall 7: Context Budget Overflow

**❌ What you do**: Try to fit 10 tickets in one 200K token session.

**⚠️ Result**: Hit token limit mid-ticket, session becomes slow, risk of errors.

**✅ Solution**: Plan for ~4-5 tickets per session. Checkpoint before 160K tokens, start fresh session.

---

### Pitfall 8: Not Using the Automation Script

**❌ What you do**: Manually update Backlog, active-context, and progress files (Step 5).

**⚠️ Result**: Inconsistencies, typos, missed updates.

**✅ Solution**: Use `npm run sync-progress -- --ticket US-001 --status done` (or let Claude do Step 5 automatically).

---

### Pitfall 9: Working Without Git Branch

**❌ What you do**: Work directly on `master` branch.

**⚠️ Result**: Can't isolate changes, hard to review, risky merges.

**✅ Solution**: Always create feature branch:

```bash
git checkout -b feature/chat-interface
```

---

### Pitfall 10: Ignoring Test Coverage

**❌ What you do**: Accept <80% coverage, skip tests for "quick" features.

**⚠️ Result**: Bugs in production, hard to refactor, technical debt accumulates.

**✅ Solution**: Enforce >85% coverage. Ask Claude to write tests in Step 4.

---

---

## Part 13: Token Management & Context Discipline

Claude Code has a **200K token limit** per conversation. Here's how to manage it.

### Token Budget Breakdown

**Per session** (200K tokens total):

- Memory Bank: ~8K tokens (4%)
- Protocol file: ~3K tokens (1.5%)
- Average small ticket (2 pts): ~20-30K tokens
- Average medium ticket (5 pts): ~40-50K tokens
- **Practical capacity**: 4-5 tickets per session

### When to Checkpoint and Start Fresh

**Warning signs** (approaching limit):

- Session feels slow
- Responses take longer
- You've completed 4-5 tickets
- Token counter shows ~160K+ (if visible)

**Checkpoint workflow**:

```
You: "We're at ~150K tokens. Create a comprehensive checkpoint in the session log with all current progress. I'll start a new session."

Claude: [Creates detailed checkpoint]

[Start new session]

You: "Resume work. Load Memory Bank, read latest session log (.agent/sessions/session-20250105-1030.md), and continue."
```

### Token-Saving Tips

**1. Use Skills Instead of Full Agents** (when possible)

- Skill: ~250 tokens
- Agent: ~2-3K tokens
- Use skills for quick references, agents for deep consultation

**2. Don't Read Entire Large Files**

```
❌ "Show me all of src/app/layout.tsx"
✅ "Show me the chat participant registration section of src/app/layout.tsx"
```

**3. Reference, Don't Repeat**

```
❌ "Here's the entire plan again..."
✅ "As outlined in current-plan.md, Task 3..."
```

**4. Checkpoint and Compress**

- Every ~15K tokens, create checkpoint
- Session log captures decisions
- No need to repeat history in conversation

### Context Discipline Rules

**Rule 1**: Load Memory Bank once per session (Step 1)

- Don't ask Claude to re-read it mid-session

**Rule 2**: Session log is the source of truth

- Decisions recorded there
- No need to remember everything in conversation

**Rule 3**: Plan in files, not in chat

- current-plan.md persists
- Chat history can be forgotten

**Rule 4**: Fresh sessions for fresh starts

- Don't fight context limits
- Checkpoint and resume is seamless

### Multi-Session Workflow

**Session 1** (Morning):

- Tickets: US-001, US-004, US-005 (6 points)
- Tokens used: ~100K
- End: Create checkpoint

**Session 2** (Afternoon):

- Resume from checkpoint
- Tickets: US-003, US-002 (8 points)
- Tokens used: ~110K
- Total day: 14 points completed

**Key**: Session boundaries don't interrupt work. Memory Bank + session logs maintain continuity.

---

---

## Part 14: Quick Reference

Your one-page cheat sheet.

### The 5-Step Protocol (Mandatory)

1. **Initialize** - Load Memory Bank, create session log
2. **Plan** - Create current-plan.md and current-todos.md
3. **Consult** - Read agents, apply recommendations
4. **Implement** - Code + tests + checkpoints
5. **Complete** - Update Backlog, active-context, progress + commit

### File Locations

**Memory Bank** (read every session):

- `.agent/project-brief.md`
- `.agent/system-patterns.md`
- `.agent/tech-context.md`
- `.agent/active-context.md` ← Current sprint/tickets
- `.agent/progress.md` ← Progress tracking

**Runtime** (created during work):

- `.agent/sessions/session-*.md`
- `.agent/task/current-plan.md`
- `.agent/task/current-todos.md`

**Documentation**:

- `docs/12-Backlog.md` ← All tickets
- `docs/13-Project-Plan.md` ← Sprint schedule
- `docs/03-Architecture.md` ← Architecture
- `docs/06-API/openapi.yaml` ← API contracts
- `docs/04-Data-and-Model-Spec.md` ← Database schemas

### Agent Quick Lookup

| Need Help With... | Consult...        |
| ----------------- | ----------------- |
| VS Code API       | next-js-expert    |
| React components  | react-expert      |
| TypeScript        | typescript-expert |
| API design        | api-expert        |
| Database          | database-expert   |
| Security          | security-engineer |
| Testing           | qa-tester         |
| CI/CD             | devops-engineer   |

### Common Commands

**Check status**:

```bash
code .agent/active-context.md  # Current sprint/tickets
code .agent/progress.md        # Progress tracking
code docs/12-Backlog.md        # All tickets
```

**Verify protocol**:

```bash
ls .agent/sessions/            # Step 1: Session log?
ls .agent/task/                # Step 2: Plan files?
npm test                       # Step 4: Tests passing?
git status                     # Step 5: Files updated?
```

**Update progress** (automation):

```bash
npm run sync-progress -- --ticket US-001 --status done
```

### Session Starter (Copy-Paste)

```
MANDATORY PROTOCOL — Follow .claude/sops/session-protocol.md and complete ALL 5 steps.

Current task: Implement ticket US-001

ENFORCE:
- ✅ Step 1: Initialize session (load Memory Bank, create session log)
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every ~15K tokens
- ✅ Step 5: Post-completion updates

Confirm each step explicitly before proceeding to the next.
```

### Recovery (After Crash)

```
Resume work on US-001.

Load Memory Bank and read the last session log (.agent/sessions/session-YYYYMMDD-HHMM.md).

Check the last checkpoint and continue from where we left off.

Follow the remaining protocol steps to completion.
```

### Red Flags (Claude Not Following Protocol)

- ❌ Starts coding immediately (no Step 1/2)
- ❌ No session log created
- ❌ No plan files in `.agent/task/`
- ❌ No mention of agents consulted
- ❌ No checkpoints during implementation
- ❌ No progress file updates after completion

### Daily Workflow Summary

**Morning**:

1. Read `.agent/active-context.md` (5 min)
2. Start Claude with session starter prompt
3. Verify Step 1 completed

**During Work**:

1. Review plan after Step 2
2. Request checkpoints every ~15K tokens
3. Verify tests passing during Step 4

**End of Day**:

1. Verify Step 5 complete (`git status`)
2. Push commits
3. Ready for tomorrow

### Key Numbers

- **13 sprints** (16-week timeline (Phase A-D))
- **20 points/sprint** capacity
- **10 epics, ~125 user stories** total
- **200K tokens** per session limit
- **4-5 tickets** per session realistic
- **85% test coverage** target
- **<1s page load time** for extension

### Success Criteria

✅ All 5 protocol steps followed
✅ Tests passing (>85% coverage)
✅ Documentation updated
✅ Git commits created
✅ Ticket marked Done
✅ Progress files in sync

---

---

## Appendices

### Appendix A: Complete File Tree

```
ai-code-assistant/
├─ .agent/                              # Memory Bank & Runtime
│  ├─ project-brief.md                 # What & Why (~1.5K tokens)
│  ├─ system-patterns.md               # How We Build (~2K tokens)
│  ├─ tech-context.md                  # Tech Stack (~1.8K tokens)
│  ├─ active-context.md                # Current Work (~1.2K tokens) ⭐
│  ├─ progress.md                      # Progress Tracking (~1.5K tokens) ⭐
│  ├─ task/                            # Created during work
│  │  ├─ current-plan.md
│  │  └─ current-todos.md
│  └─ sessions/                        # Created during work
│     └─ session-20250105-0900.md
│
├─ .claude/                            # AI Workflow
│  ├─ sops/
│  │  └─ session-protocol.md          # 5-step protocol (MANDATORY)
│  ├─ agents/                          # 15 expert agents
│  │  ├─ core-development/
│  │  │  ├─ typescript-expert.md
│  │  │  ├─ react-expert.md
│  │  │  ├─ api-expert.md
│  │  │  ├─ database-expert.md
│  │  │  ├─ security-engineer.md
│  │  │  ├─ qa-tester.md
│  │  │  ├─ devops-engineer.md
│  │  │  ├─ frontend-developer.md
│  │  │  └─ backend-developer.md
│  │  ├─ next-js-expert.md
│  │  ├─ implementation/
│  │  │  ├─ explore-codebase.md
│  │  │  ├─ analyze-architecture.md
│  │  │  ├─ synthesize-docs.md
│  │  │  └─ map-system.md
│  │  └─ orchestrators/
│  │     └─ planning-orchestrator.md
│  └─ skills/                          # 9 quick patterns
│     ├─ moksha-devhub/api-patterns.md
│     ├─ moksha-devhub/component-patterns.md
│     ├─ testing-patterns.md
│     ├─ extension-testing-patterns.md
│     ├─ api-route-pattern.md
│     ├─ database-migration-pattern.md
│     ├─ chromadb-patterns.md
│     ├─ memgraph-patterns.md
│     └─ mcp-patterns.md
│
├─ docs/                               # Project Documentation
│  ├─ 01-PRD.md                       # Product Requirements
│  ├─ 02-SRS.md                       # Software Requirements
│  ├─ 12-Backlog.md                   # 125 User Stories (US-001 to US-125)
│  ├─ 03-Architecture.md             # Architecture
│  ├─ 12-API-SPEC.md                  # API Contracts
│  ├─ 13-DB-SCHEMA.md                 # Database Schemas
│  ├─ 12-Backlog.md                   # All Tickets ⭐
│  ├─ 13-Project-Plan.md              # Sprint Schedule ⭐
│  ├─ ROADMAP-P0.md                   # Priority Roadmap
│  ├─ architecture/ADRs/              # Architecture Decisions
│  │  ├─ 04-ADR-001-Extension-vs-Fork.md
│  │  ├─ 16-ADR-009-Qdrant-Over-ChromaDB.md
│  │  └─ ... (14 total ADRs)
│  └─ ... (27+ documents total)
│
├─ src/                                # Source Code
├─ tests/                              # Tests
├─ CLAUDE.md                           # This project's workflow guide
└─ BEGINNER-WORKFLOW-GUIDE.md         # This guide
```

### Appendix B: Traceability Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   BUSINESS VALUE                         │
│                                                           │
│  PRD Feature F1: "Chat-based code assistance"           │
│  └─ Why: Enable developers to code with AI help         │
└─────────────────────────────────────────────────────────┘
                         ↓ maps to
┌─────────────────────────────────────────────────────────┐
│                TECHNICAL REQUIREMENT                      │
│                                                           │
│  SRS FR-001: "System shall provide chat participant API"│
│  └─ Spec: VS Code Chat API, <1s activation              │
└─────────────────────────────────────────────────────────┘
                         ↓ breaks down to
┌─────────────────────────────────────────────────────────┐
│                    WORK ITEM                              │
│                                                           │
│  Backlog US-001: "Create Phase hierarchy system" (2 points)   │
│  └─ AC: Panel opens <1s                                  │
│  └─ Sprint: 1 (Nov 4-10)                                 │
└─────────────────────────────────────────────────────────┘
                         ↓ implemented in
┌─────────────────────────────────────────────────────────┐
│                  IMPLEMENTATION                           │
│                                                           │
│  Code: src/app/layout.tsx, src/services/PhaseService.ts    │
│  Tests: tests/PhaseService.test.ts (87% coverage)        │
│  Commit: "feat: add phase hierarchy (closes US-001)"    │
└─────────────────────────────────────────────────────────┘
                         ↓ verified by
┌─────────────────────────────────────────────────────────┐
│                   VERIFICATION                            │
│                                                           │
│  Tests: ✅ 12/12 passing                                 │
│  Coverage: ✅ 87% (target: 85%)                          │
│  Manual: ✅ Activation time 0.8s (target: <1s)          │
└─────────────────────────────────────────────────────────┘
```

**Result**: Full traceability from business value to verified code.

### Appendix C: Sprint Planning Worksheet

**Use this template for planning sprints**:

```markdown
## Sprint [N] ([Date Range])

**Sprint Goal**: [One sentence describing the sprint objective]

**Capacity**: 20 points (1 FTE)

**Tickets Planned**:

- [ ] E[##]-S[##]: [Description] ([X] points)
  - FR: FR-[###]
  - PRD: PRD-[###]
  - AC: [Acceptance criteria]
  - Assignee: [Name]

[Repeat for each ticket]

**Total Points**: [Sum] / 20

**Dependencies**: [Any blockers or dependencies]

**Risks**: [Potential issues]

**Definition of Done**:

- ✅ All tickets completed (marked Done in Backlog)
- ✅ Tests passing (>85% coverage)
- ✅ Documentation updated
- ✅ Sprint goal achieved
```

### Appendix D: Troubleshooting Guide

**Problem**: Claude doesn't load Memory Bank

**Solution**:

```
You: "You skipped Step 1. Please read all 5 Memory Bank files:
- .agent/project-brief.md
- .agent/system-patterns.md
- .agent/tech-context.md
- .agent/active-context.md
- .agent/progress.md

Then create .agent/sessions/session-[timestamp].md and confirm current sprint/ticket."
```

---

**Problem**: Plan files not created

**Solution**:

```bash
# Check if files exist
ls .agent/task/

# If missing, tell Claude:
You: "Create .agent/task/current-plan.md with detailed implementation plan and .agent/task/current-todos.md with task list."
```

---

**Problem**: Session crashed, how to resume?

**Solution**:

```
1. Check latest session log:
ls -lt .agent/sessions/  # Find most recent

2. Read last checkpoint:
code .agent/sessions/session-[latest].md

3. Resume with Claude:
"Resume work on [ticket]. Load Memory Bank, read session log (.agent/sessions/session-[timestamp].md), continue from last checkpoint."
```

---

**Problem**: Progress files out of sync

**Solution**:

```bash
# Use automation to sync
npm run sync-progress -- --ticket US-001 --status done

# Or manually update:
# 1. docs/12-Backlog.md (mark [x] Done)
# 2. .agent/active-context.md (update sprint %)
# 3. .agent/progress.md (mark ✅, add to Recent Updates)
```

---

**Problem**: Tests failing after implementation

**Solution**:

```
You: "Tests are failing. Debug and fix:
1. Run npm test and show errors
2. Identify root cause
3. Fix the issue
4. Re-run tests
5. Verify coverage still >85%"
```

---

**Problem**: Context limit approaching (180K+ tokens)

**Solution**:

```
You: "Create comprehensive checkpoint with all progress. I'll start a new session."

[In new session]
You: "Resume work. Load Memory Bank, read latest session log, continue from checkpoint."
```

---

### Appendix E: Glossary

- **Memory Bank**: 5 compressed files (~8K tokens) providing instant project context
- **Session Log**: Per-session markdown file tracking decisions and checkpoints
- **Protocol**: The mandatory 5-step workflow (Initialize, Plan, Consult, Implement, Complete)
- **Agent**: Expert AI consultant providing deep guidance (~2-3K tokens)
- **Skill**: Quick-reference code pattern (~250 tokens)
- **Ticket**: Granular work item (format: E##-S##)
- **Epic**: Group of related tickets (E01 through E10)
- **Sprint**: 1-week development cycle (40 points capacity)
- **Story Points**: Effort estimate (1, 2, 3, 5, 8)
- **Acceptance Criteria (AC)**: Definition of "done" for a ticket
- **Traceability**: Linkage from PRD → SRS → Ticket → Code
- **Checkpoint**: Progress snapshot in session log (every ~15K tokens)
- **Context Budget**: 200K token limit per Claude Code session
- **Active Context**: `.agent/active-context.md` - current sprint and tickets
- **Backlog**: `docs/12-Backlog.md` - all tickets across all epics

---

## Conclusion

You now have a complete understanding of professional AI-assisted development.

**What you learned**:

1. ✅ How to transition from single-file planning to professional documentation
2. ✅ The Memory Bank system (92% token savings)
3. ✅ The mandatory 5-step protocol (quality assurance)
4. ✅ How to work with Claude Code effectively
5. ✅ Ticket system, sprints, and progress tracking
6. ✅ Recovery workflows (no work lost)
7. ✅ Practical daily workflows and scenarios

**Your next steps**:

1. 📖 Read `.agent/active-context.md` to see your current sprint
2. 📋 Review ticket US-001 in `docs/12-Backlog.md`
3. 🚀 Use the session starter prompt from Part 11
4. ✅ Follow the 5-step protocol for your first ticket
5. 🔁 Repeat for remaining Sprint 1 tickets

**Remember**:

- The protocol is your quality assurance system
- Memory Bank saves 90% of context loading
- Session logs make recovery trivial
- Claude handles the details, you provide the direction
- Progress tracking happens automatically in Step 5

**You're ready to build professionally with AI assistance. Good luck with Sprint 1!**

---

**Document End**

_Version 2.0 - Updated for ProjectPulse January 5, 2025_
_For: ProjectPulse - AI-Powered Development Hub (Next.js Web Application)_
_By: Claude (Sonnet 4.5) for a developer transitioning to professional workflows_

---

**End of Document**
