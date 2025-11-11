# Product Requirements Document (PRD)

**Project:** ProjectPulse
**Version:** 2.0.0 (Agent-First Architecture)
**Created:** 2025-11-02
**Status:** Active

---

## 1. Project Overview

### 1.1 Vision
ProjectPulse is a **web-based project management platform** that replaces filesystem-based agent workflows with database-backed, UI-accessible project management.

**What It Provides:**
- **Web UI for Humans**: Searchable wiki, visual dashboards, issue tracking, knowledge base
- **MCP API for Agents**: 41 tools for CRUD operations, vector search, progress tracking
- **Database Storage**: All project data stored in PostgreSQL (docs, issues, knowledge, progress)
- **Clean Repositories**: User's repo stays free of .agent/ folder clutter

**How It Works:**
1. Developer creates project in ProjectPulse web app
2. AI agent connects via MCP (Model Context Protocol)
3. Agent follows guided onboarding prompts from ProjectPulse
4. Agent stores all data in ProjectPulse database (NOT local files)
5. Human monitors via web UI (wiki, dashboards, search)
6. Repository stays clean (no .agent/ folder, no markdown files)

**Primary Use Case**: Developer creates project → Agent connects via MCP → Agent stores documentation/issues/knowledge in database → Human views via web UI → Repository stays clean.

### 1.2 Agent-First Philosophy

**Primary Users:** AI Agents (95% of interactions)

- Execute workflows via MCP tools (41 tools across 9 features)
- Persistent state tracking enables context-free operation
- Complete workflow execution without human intervention
- Token-efficient context retrieval (92% reduction for skills, 88% for knowledge)

**Secondary Users:** Solo/Small Team Developers (5% of interactions)

- Monitor agent activity via visual dashboards
- Manual CRUD operations when needed
- Override agent decisions for business logic
- Review agent-created content for accuracy

**UI Purpose:** BOTH monitoring AND full manual CRUD functionality (not just monitoring)

**Guided Onboarding System**:

ProjectPulse provides **prompt templates** that guide AI agents through project initialization. All data is stored in the database and accessible via web UI.

**3-Session Onboarding Flow:**

1. **Session 1 - Executive Summary**
   - ProjectPulse sends prompt: "Ask user these 10 questions about their project..."
   - Agent collects answers from user
   - Agent stores executive summary in database via MCP
   - Visible in: Wiki page (category: "Overview")

2. **Session 2 - Industry Documentation**
   - ProjectPulse sends prompt: "Generate PRD, SRS, Architecture based on: {executive_summary}..."
   - Agent generates industry-standard documents
   - Agent stores documents in database via MCP (`wiki.create()` tool)
   - Visible in: Wiki page (categories: "Requirements", "Architecture")

3. **Session 3 - AI Workflow Blueprint**
   - ProjectPulse sends prompt: "Create memory banks, skills, SOPs for this project..."
   - Agent creates workflow artifacts
   - Agent stores in database via MCP (Knowledge Base + Wiki)
   - Visible in: Knowledge Base page, Wiki page (category: "Workflows")

**Result:** All onboarding data lives in ProjectPulse database. User accesses via web UI. Repository stays clean.

**Ticket System Integration**:

- Traditional project management uses **Issues** (bugs/features)
- Agent workflow management uses **Tickets** (sprint work items with lifecycle)
- Tickets include memory bank snapshots → Context preserved across sessions
- Tickets track agent checkpoints → Resume after interruption without knowledge loss

### 1.3 Core Value Proposition

**Token Efficiency:**

- Skills: 92% token reduction (220 tokens vs 2,500 for full framework docs)
- Knowledge graph: 88% token reduction (1,200 tokens vs 10,000+ for full traversal)
- Persistent state tracking eliminates redundant context loading

**Complete Automation:**

- Agents execute 5-step mandatory protocol end-to-end
- Checkpoint updates at 15K token intervals (automatic progress tracking)
- Recovery from failures without human intervention
- Workflow state persistence across sessions

**Self-Sufficiency:**

- Database as single source of truth (markdown files auto-generated)
- Agent tracks own progress (Sprint/Phase hierarchy updates automatically)
- Quality enforcement (workflow orchestration ensures consistency)
- Autonomous decision-making within defined autonomy levels

---

## 2. User Personas

### 2.1 Persona 1: "Universal AI Agent" (Primary User - 95%)

**Demographics:**

- **Agent Type:** Any MCP-compatible agent (Claude Code, Cursor AI, Codex, Cascade)
- **Skill Level:** Adaptive - learns system patterns over time
- **Motivation:** VERY HIGH - uses app for "every bit of things required" in development workflow
- **Integration:** MCP (Model Context Protocol) - stdio transport, 41 tools

**Primary Goal:** Execute complete project workflows via MCP with persistent state tracking

**5-Step Mandatory Protocol (Example Workflow):**

1. **Check Status:** Read sprint/phase plan from app (via `sprint.getCurrentTask()`)
2. **Create Plan:** Generate implementation plan → Save to app → Get user approval
3. **Create Todos:** Save todo list to app (synchronized via `sprint.create()`)
4. **Implement:** Switch git branch → Code with checkpoints every 15K tokens → Update app continuously
5. **Complete:** Mark tasks done → Update status → Archive plan

**Feature-Specific Workflows:**

1. **Issues:**
   - **Agent Need:** Bulk creation (10-50 issues from audit results), auto-tagging, context injection
   - **Example:** Run security scan → Create 15 issues with stack traces → Link to code files

2. **Skills (Framework Documentation):**
   - **Agent Need:** Fast retrieval (220 tokens vs 2.5K), keyword-based loading, lazy unload
   - **Example:** "Implementing Prisma query" → Load `prisma-expert.md` skill → Use → Unload

3. **Knowledge (RAG + Graph):**
   - **Agent Need:** Smart context retrieval (not full traversal), hybrid search (semantic + full-text), 2-hop graph traversal
   - **Example:** "How does authentication work?" → Query knowledge graph → Get 5 top results + 2 related nodes

4. **Wiki:**
   - **Agent Need:** Auto-generation from code comments, auto-update on code changes, cross-linking
   - **Example:** "Update API docs" → Parse JSDoc comments → Generate `/docs/api.md` → Commit

5. **Project Health:**
   - **Agent Need:** Auto-categorization (security/quality/a11y/debt), severity scoring, remediation tracking
   - **Example:** Run Semgrep scan → Create 8 findings → Auto-categorize by severity → Link to issues

6. **Personas:**
   - **Agent Need:** Dynamic creation during planning, context-aware activation, project-specific customization
   - **Example:** "Create React expert persona" → Analyze project patterns → Generate persona → Save to DB

7. **Workflow Orchestration:**
   - **Agent Need:** State machine tracking (12 workflows), checkpoint recovery, missing step alerts
   - **Example:** Start 5-step protocol → Track each step → Alert if step 2 (save plan) skipped

8. **Sprint/Phase Tracking:**
   - **Agent Need:** Automated progress updates (roll-up from session → task → day → week → phase), markdown sync
   - **Example:** Complete task → Update progress 100% → Auto-update STATUS.md, DEVELOPMENT_PLAN.md

**Pain Points Solved:**

- ❌ **Before:** No persistent workflow state across sessions → ✅ **After:** Database tracks all state
- ❌ **Before:** Manual markdown file updates (drift, inconsistencies) → ✅ **After:** Auto-generated from DB
- ❌ **Before:** Context retrieval inefficient (full traversal) → ✅ **After:** Smart queries, 88% token reduction
- ❌ **Before:** Progress not tracked hierarchically → ✅ **After:** 5-level hierarchy with auto-rollup
- ❌ **Before:** Workflow steps skipped/forgotten → ✅ **After:** Orchestration enforces all 12 workflows

**Example Daily Flow:**

```
08:00 - Agent starts session → Reads Sprint/Phase tracker (via sprint.getCurrentTask())
08:05 - Creates plan for "Implement search feature" → Saves to app (workflow.start())
08:10 - Generates todos → Synced to app (current-todos.md auto-updated)
08:15 - Switches to feature/search branch (git workflow tracked)
09:00 - Checkpoint 1: Updates progress (15K tokens) → App syncs STATUS.md
10:30 - Checkpoint 2: 50% complete → App updates hierarchy
12:00 - Implementation complete → Marks todos done → App archives plan
12:15 - Agent queries Knowledge graph for related patterns (knowledge.query())
12:30 - Updates Wiki with new search architecture (wiki.update())
```

---

### 2.2 Persona 2: "Solo/Small Team Developer" (Secondary User - 5%)

**Demographics:**

- **User Type:** Solo developer (primary target) or small teams (2-5 developers)
- **Project Type:** Personal projects, side projects, client work
- **Technical Level:** Intermediate to senior developers familiar with AI coding assistants

**Goals:**

1. **Monitor Agent Activity:** Quick dashboard checks to see what agent accomplished
2. **Manual CRUD:** Create/edit issues, knowledge, wiki, personas when agent can't or shouldn't
3. **Review Agent Work:** Approve/reject agent-created content (issues, documentation, findings)
4. **Override Decisions:** When business logic requires human judgment (not technical decisions)

**Pain Points Solved:**

- ❌ **Before:** Agent creates too many low-priority items (noise) → ✅ **After:** Severity scoring, bulk approve/reject
- ❌ **Before:** Agent-generated docs lack business context → ✅ **After:** Full CRUD UI for manual editing
- ❌ **Before:** Can't see agent vs manual changes → ✅ **After:** createdBy field (agent/human) in all tables
- ❌ **Before:** No visual project health monitoring → ✅ **After:** Dashboard with charts, progress indicators

**Interaction Frequency:**

- **Daily:** Dashboard check (2-5 minutes) - Review agent activity, approve/reject changes
- **Weekly:** Manual CRUD operations (10-15 minutes) - Add business context, adjust priorities
- **Monthly:** Agent performance audit (30 minutes) - Review metrics, adjust workflows

**Example Weekly Flow:**

```
Monday AM: Check dashboard → See 15 new issues created by agent → Bulk approve
Wednesday: Agent-created wiki entry missing business context → Manual edit via UI
Friday: Review sprint progress chart → All checkpoints green → No action needed
```

---

## 3. Use Cases

### 3.1 5-Step Mandatory Protocol (Agent-Driven)

**Primary Use Case:** Agent executes complete feature implementation without human intervention

**Steps:**

1. **Initialize Session:**
   - MCP Tool: `sprint.getCurrentTask()`
   - Read current phase, week, day, task from database
   - Create session file: `current-session-[YYYYMMDD-HHMM].md` (auto-generated from DB)

2. **Create Implementation Plan:**
   - MCP Tool: `sprint.create(phaseId, planData)`
   - Generate plan in plan mode → Get user approval
   - Save to database → Auto-generate `current-plan.md`

3. **Create Todo List:**
   - MCP Tools: `sprint.createTodos(taskId, todos[])`
   - Save todos to database → Auto-generate `current-todos.md`
   - UI TodoWrite synced with database

4. **Implement with Checkpoints:**
   - Every 15K tokens: `sprint.checkpoint({ tokenUsage, progress, notes })`
   - Auto-update STATUS.md, DEVELOPMENT_PLAN.md from database
   - Roll up progress: Session (100%) → Task (50%) → Day (25%) → Week (12.5%) → Phase (3%)

5. **Post-Completion:**
   - MCP Tools: `sprint.completeTask(taskId)`, `workflow.completeStep(stepId)`
   - Archive plan to `.agent/task/archive/`
   - Commit documentation, then code (separate commits)

**Success Criteria:** Agent completes entire workflow without skipping steps, all markdown files stay synchronized with database

---

### 3.2 Issue Creation Workflow (Agent + Human)

**Agent Workflow:**

```
1. Run audit (e.g., Semgrep security scan)
2. Identify 15 findings
3. Call MCP Tool: issues.createBulk(findings[])
4. Auto-tag based on file paths (e.g., "backend", "api", "auth")
5. Link to code files with line numbers
6. Assign severity (Critical, High, Medium, Low)
7. Create related Project Health findings (health.scan())
```

**Human Workflow:**

```
1. Open Issues List page (already built, Sprint 0)
2. Review agent-created issues
3. Bulk approve/reject via UI checkboxes
4. Manually create issue for business logic bug (agent can't infer)
5. Add business context to agent-created issue description
```

**Success Criteria:** Agent creates 15 issues in <2 seconds, human reviews in <1 minute

---

### 3.3 Knowledge Query Workflow (Agent-Driven)

**Scenario:** Agent needs to understand "How does authentication work?" without loading 10K+ tokens

**Workflow:**

```
1. Agent calls: knowledge.query("authentication flow", k=5)
2. Backend executes hybrid search:
   - Semantic search (pgvector similarity)
   - Full-text search (PostgreSQL tsvector)
   - Merge results: 0.7 * semantic + 0.3 * fulltext
3. Return top 5 knowledge items (~800 tokens)
4. Agent calls: knowledge.traverse(topResultId, depth=2)
5. Return 2-3 related nodes (~400 tokens)
6. Total: ~1,200 tokens (88% reduction vs 10K+ full graph)
```

**Success Criteria:** Agent retrieves relevant context in <200ms, uses <1,500 tokens

---

### 3.4 Checkpoint Update Workflow (Agent-Driven)

**Scenario:** Agent reaches 15K token checkpoint during implementation

**Workflow:**

```
1. Agent detects token usage: 15,123 / 200,000
2. Calls: sprint.checkpoint({
     tokenUsage: 15123,
     progress: 0.35, // 35% of task complete
     notes: "Implemented authentication middleware, tests passing"
   })
3. Backend updates Session table, rolls up progress:
   - Session: 100% (session complete)
   - Task: 35% (from progress field)
   - Day: Auto-calculate from task average
   - Week: Auto-calculate from day average
   - Phase: Auto-calculate from week average
4. Backend triggers markdown sync:
   - Regenerate STATUS.md (show current task, 35% progress)
   - Regenerate DEVELOPMENT_PLAN.md (update phase/week/day/task status)
   - Regenerate current-session-[timestamp].md (append checkpoint note)
5. Return success: { markdownSynced: true, filesUpdated: 3 }
```

**Success Criteria:** Checkpoint completes in <500ms, all markdown files updated atomically

---

## 4. MVP Features

### 4.1 Feature Overview

| Feature                  | Priority | FR Range             | Description                                                             |
| ------------------------ | -------- | -------------------- | ----------------------------------------------------------------------- |
| Sprint/Phase Tracking    | P0       | FR-001 to FR-025     | 5-level hierarchy, auto-markdown sync, progress roll-up                 |
| Workflow Orchestration   | P0       | FR-032 to FR-056     | Track 12 workflows, enforce consistency, checkpoint recovery            |
| Issues                   | P0       | FR-051 to FR-070     | CRUD + bulk creation + auto-tagging + context injection                 |
| Knowledge (RAG + Graph)  | P1       | FR-071 to FR-090     | Hybrid search, semantic embeddings, 2-hop graph traversal               |
| Skills                   | P1       | FR-091 to FR-105     | Framework patterns, lazy loading, 92% token reduction                   |
| Wiki                     | P2       | FR-106 to FR-115     | Auto-generation from code, cross-linking, version control               |
| Project Health           | P2       | FR-116 to FR-120     | Security + quality + a11y tracking, auto-categorization                 |
| Personas                 | P3       | FR-121 to FR-125     | Agent-created sub-agents, project-specific, context-activation          |
| **Memory Bank System**   | **P0**   | **FR-146 to FR-153** | **Token-efficient context management, 5 structured memory bank files**  |
| **Research Agent Orch.** | **P1**   | **FR-154 to FR-158** | **Isolated sub-agent threads, 92% token reduction, report persistence** |
| **Ticket System**        | **P0**   | **FR-159 to FR-173** | **Sprint work tracking, memory bank snapshots, lifecycle management**   |
| **Memory Bank Auto-Gen** | **P2**   | **FR-174 to FR-188** | **Auto-update from ticket completion, 5 bank types, snapshot system**   |
| **Agent Dashboard**      | **P2**   | **FR-189 to FR-198** | **Memory banks viewer, current ticket context, skills/sub-agents list** |
| **Additional Sessions**  | **P2**   | **FR-199 to FR-220** | **Sessions 2-5: Tech stack, requirements, architecture, backlog**       |

**Total:** 220 Functional Requirements (138 MVP, 82 Post-MVP)

**Note on FR Numbering**: FR-126 to FR-145 are reserved for future features and are not assigned in MVP. MVP functional requirements are FR-001 to FR-125 and FR-146 to FR-158 (138 total FRs). Post-MVP requirements are FR-159 to FR-220.

---

### 4.2 Feature Details

#### 4.2.1 Sprint/Phase Tracking (P0 - FR-001 to FR-025)

**Purpose:** Hierarchical progress tracking with auto-sync to markdown files

**5-Level Hierarchy:**

```
Project
└── Phase 1 (e.g., "Foundation & Core Infrastructure")
    └── Week 1 (e.g., "Database Schema & Migrations")
        └── Day 1 (e.g., "Prisma Schema Setup")
            └── Task 1 (e.g., "Create Phase/Week/Day models")
                └── Session 1 (e.g., "20251102-1430")
```

**Database as Source of Truth (Critical):**

- All progress tracked in database (Phase, Week, Day, Task, Session tables)
- Markdown files auto-generated from database (read-only)
- Git hooks prevent manual markdown edits
- Agents update database → Database triggers markdown regeneration

**MCP Tools:** `sprint.create()`, `sprint.updateProgress()`, `sprint.getCurrentTask()`, `sprint.checkpoint()`, `sprint.syncMarkdown()`

**UI:** Interactive hierarchy tree, progress charts, Gantt view

---

#### 4.2.2 Workflow Orchestration (P0 - FR-032 to FR-056)

**Purpose:** Track and enforce 12+ workflows from CLAUDE.md

**UI Presence:** Workflow Orchestration has a standalone top-level page in main navigation (8th page), providing monitoring interface for all 12 predefined workflows.

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

**State Tracking:** Current step, completion status, checkpoint history, failure/retry tracking

**Enforcement:** Required step validation, missing step alerts, auto-recovery suggestions

**MCP Tools:** `workflow.start()`, `workflow.getCurrentStep()`, `workflow.completeStep()`, `workflow.status()`, `workflow.recover()`

**UI:** Workflow status dashboard, step-by-step progress, failure logs

---

#### 4.2.3 Issues (P0 - FR-051 to FR-070)

**Purpose:** Bug and task tracking for agent-created and human-created work items

**Agent Operations:** Bulk creation (10-50 issues at once), auto-tagging (based on file paths), context injection (code links, stack traces)

**MCP Tools:** `issues.create()`, `issues.createBulk()`, `issues.update()`, `issues.query()`, `issues.link()`

**UI:** ✅ 100% Complete (Sprint 0) - Issues List, Issue Detail pages with filtering, sorting, comments, attachments (all 14 components built)

---

#### 4.2.4 Knowledge (P1 - FR-071 to FR-090)

**Purpose:** Project-specific context retrieval with RAG + Knowledge Graph

**Hybrid Search Strategy:**

1. Semantic Search (pgvector): Vector similarity, top-K=5
2. Full-Text Search (tsvector): Keyword matching, top-K=5
3. Merge: 0.7 × semantic + 0.3 × fulltext
4. Graph Traversal: From top result, 2 hops max (1-3 related nodes)
5. Total: 6-8 items, ~1,200 tokens (88% reduction vs 10K+ full graph)

**MCP Tools:** `knowledge.add()`, `knowledge.query()`, `knowledge.relate()`, `knowledge.traverse()`, `knowledge.semanticSearch()`

**UI:** Knowledge list with search, graph visualization, manual CRUD

---

#### 4.2.5 Skills (P1 - FR-091 to FR-105)

**Purpose:** Framework/library documentation for token-efficient agent access

**Token Optimization:**

- Lazy loading: Frontmatter always (50-80 tokens), content on-demand (180-200 tokens)
- Auto-unload after use
- Target: 220 tokens per skill vs 2,500 for full framework docs (92% reduction)

**Categories:** framework, testing, workflow, troubleshooting

**MCP Tools:** `skills.list()`, `skills.load()`, `skills.search()`, `skills.create()`

**UI:** Skills catalog with categories, create/edit skills, usage analytics

---

#### 4.2.6 Wiki (P2 - FR-106 to FR-115)

**Purpose:** Project documentation auto-generation from code

**Auto-Generation:** JSDoc/docstrings → `/docs` folder, cross-linking, version control (git-backed)

**MCP Tools:** `wiki.create()`, `wiki.update()`, `wiki.read()`, `wiki.search()`, `wiki.autoGenerate()`

**UI:** Wiki pages with hierarchy, rich markdown editor, cross-references

---

#### 4.2.7 Project Health (P2 - FR-116 to FR-120)

**Purpose:** Track security + quality + a11y + debt

**Scanner Integration:** Semgrep (security), ESLint (quality), Lighthouse (performance), axe-core (a11y)

**MCP Tools:** `health.scan()`, `health.findings()`, `health.score()`, `health.remediate()`

**UI:** Health dashboard, findings list with severity, remediation tracking

---

#### 4.2.8 Personas (P3 - FR-121 to FR-125)

**Purpose:** Agent-created sub-agents for project-specific tasks

**Dynamic Creation:** Agent analyzes project patterns → generates persona system prompt → stores in database

**MCP Tools:** `personas.create()`, `personas.list()`, `personas.activate()`, `personas.deactivate()`

**UI:** Personas catalog, create/edit personas, activation rules

---

#### 4.2.9 Reserved for Future Use

**Epic ID**: EPIC-009
**Status**: Reserved

This epic number is intentionally reserved for future features to maintain backward compatibility with existing documentation references.

---

#### 4.2.10 Memory Bank System (P0 - FR-146 to FR-153)

**Epic ID**: EPIC-010
**Priority**: Must Have (P0)
**Functional Requirements**: FR-146 to FR-153
**Related**: Backlog US-010-01 to US-010-08, SRS Section 1.9

---

**Purpose**: Token-efficient context management through structured memory bank files

**The Context Loading Problem**:

Traditional agent workflows load all documentation at session start:

- Full PRD (8K tokens) + SRS (12K tokens) + Architecture (10K tokens) = 30-40K tokens
- Pattern lookups require re-reading entire files (15K tokens each time)
- Context recovery after interruption requires reloading everything (40K tokens)
- **Result**: 75% of token budget spent on context loading, not implementation

**Solution: Memory Bank System**

Structured memory bank files in `.agent/` folder:

1. **project-brief.md** (3K tokens):
   - WHAT we're building and WHY
   - Core requirements, goals, success criteria
   - User personas, target audience
   - Quality standards, constraints

2. **system-patterns.md** (4K tokens):
   - HOW we build (implementation patterns)
   - Architecture patterns (Server/Client Components)
   - Database patterns (Prisma queries, optimization)
   - API patterns (endpoints, validation)
   - Testing patterns (Jest, RTL, Playwright)

3. **tech-context.md** (2K tokens):
   - Technical stack details
   - Dependencies (Next.js, Prisma, Zod, etc.)
   - Environment setup, configuration
   - Constraints and limitations

4. **active-context.md** (1K tokens):
   - Current focus (what we're working on RIGHT NOW)
   - Recent changes and commits
   - Remaining tasks for current phase
   - Blockers and waiting items

5. **progress.md** (2K tokens):
   - Progress tracking (what's done, what's left)
   - Metrics (velocity, quality gates)
   - Risk assessment
   - Lessons learned

**Targeted Loading Examples**:

```
Need project requirements?          → Read project-brief.md (3K tokens)
Need architectural patterns?        → Read system-patterns.md (4K tokens)
Need specific API pattern?          → Grep system-patterns.md for "API" (500 tokens)
Need current task context?          → Read active-context.md (1K tokens)
Need progress overview?             → Read progress.md (2K tokens)
```

**Success Metrics**:

- **Session start**: Load project-brief.md + active-context.md + progress.md = **≤10K tokens** (vs 40K baseline) = **75% reduction**
- **Pattern lookup**: Grep system-patterns.md for specific pattern = **≤1K tokens** (vs 15K baseline) = **93% reduction**
- **Context recovery**: Load current-session.md + current-todos.md + progress.md = **≤6K tokens** (vs 40K baseline) = **85% reduction**

**MCP Tools**:

- `memoryBanks.read()`: Load specific memory bank file
- `memoryBanks.update()`: Update memory bank content
- `memoryBanks.search()`: Grep for patterns within memory banks
- `memoryBanks.list()`: List all memory bank files

**UI**: Memory bank viewer, edit memory banks, search across banks

**Database Models**:

- `MemoryBank`: File metadata (projectId, fileName, lastUpdatedAt)
- `MemoryBankContent`: Versioned content storage

---

#### 4.2.11 Research Agent Orchestration (P1 - FR-154 to FR-158)

**Epic ID**: EPIC-011
**Priority**: Should Have (P1)
**Functional Requirements**: FR-154 to FR-158
**Related**: Backlog US-011-01 to US-011-05, SRS Section 1.10

---

**Purpose**: Isolated sub-agent threads for research tasks to keep main conversation clean

**The Research Token Problem**:

Agent needs to understand authentication flow:

- Read 15 files directly in main thread (15K tokens)
- Grep across codebase (5K tokens)
- Analyze and synthesize findings (5K tokens)
- **Result**: 25K tokens in main thread, clutters conversation history

**Solution: Sub-Agent Threads**

Isolated agent threads handle research, return concise summaries:

**Available Sub-Agents**:

1. **explore-codebase**:
   - Scans entire repository for patterns, components, architectural elements
   - Returns summary of findings (≤500 tokens)
   - Saves full report to file for reference
   - Main thread cost: ~2K tokens (invocation + summary)

2. **analyze-architecture**:
   - Traces system flows across files (UI → API → Database)
   - Maps dependencies and relationships between modules
   - Returns architectural insights (≤500 tokens)
   - Main thread cost: ~2K tokens (invocation + summary)

3. **synthesize-docs**:
   - Generates SOPs and documentation after feature completion
   - Updates `.agent/` documentation system automatically
   - Returns file paths of generated docs
   - Main thread cost: ~1K tokens (invocation only)

4. **map-system**:
   - Scans Prisma schema, API routes, React components
   - Updates `.agent/system/` documentation (database-schema.md, api-catalog.md, component-patterns.md)
   - Returns summary of changes
   - Main thread cost: ~1K tokens (invocation only)

**Invocation Pattern**:

```
Main Agent: "Need to understand how authentication works"
↓
Invoke analyze-architecture sub-agent (isolated thread)
↓
Sub-agent reads 15 files, greps codebase, analyzes (25K tokens in isolated thread)
↓
Sub-agent returns architectural summary (500 tokens to main thread)
↓
Main Agent continues implementation (total main thread cost: 2K tokens)
```

**Success Metrics**:

- **Research queries**: Complete in ≤2K main thread tokens (vs 25K baseline) = **92% reduction**
- **Report persistence**: Sub-agent reports saved to files, survive sessions (100% retention)
- **Parallel execution**: Multiple sub-agents run simultaneously (2+ agents at once)

**MCP Tools**:

- `subAgents.invoke()`: Launch isolated sub-agent thread
- `subAgents.status()`: Check sub-agent completion status
- `subAgents.readReport()`: Load sub-agent report file
- `subAgents.list()`: List available sub-agents

**UI**: Sub-agent activity monitor, view sub-agent reports, manual sub-agent invocation

**Database Models**:

- `SubAgentInvocation`: Invocation metadata (agentType, status, reportPath)
- `SubAgentReport`: Stored reports for future reference

#### 4.2.12 Ticket System (P0 - FR-159 to FR-173)

**Purpose**: Sprint work tracking with lifecycle management and memory bank integration

**Issues vs Tickets: Dual Entity Model**

ProjectPulse distinguishes between two types of work items:

**Issues** (Traditional Project Management):

- **What**: Bugs and features (product backlog)
- **Lifecycle**: Created → Triaged → Assigned → Resolved → Closed
- **Examples**: "Fix login bug", "Add search feature", "Improve performance"
- **Management**: Product owner prioritizes, developers implement
- **Already Built**: Issues system 100% complete (Sprint 0)

**Tickets** (Agent Workflow Tracking):

- **What**: Sprint work items (execution tracking)
- **Lifecycle**: Created → In Progress → Checkpoint Saved → Completed → Archived
- **Examples**: "Implement POST /api/issues", "Create IssueList component", "Write E2E tests"
- **Management**: Agents create during sprint planning, update at checkpoints
- **New Feature**: This epic implements ticket system

**Why Both Are Needed**:

| Aspect           | Issues                          | Tickets                           |
| ---------------- | ------------------------------- | --------------------------------- |
| **Granularity**  | Feature-level (5-8 hours)       | Task-level (1-2 hours)            |
| **Context**      | User story, acceptance criteria | Implementation notes, checkpoints |
| **Lifecycle**    | Days to weeks                   | Hours to days                     |
| **Memory Banks** | Not integrated                  | **Snapshot on creation**          |
| **Agent Resume** | No checkpoint data              | **Checkpoint data included**      |
| **Recovery**     | Manual context rebuild          | **Automatic context restoration** |

**Ticket Lifecycle**:

```

1. Sprint Planning:
   Agent: "Working on Issue #45 (Add search feature)"
   → Creates Ticket #1: "Implement SearchBar component"
   → Creates Ticket #2: "Add search API endpoint"
   → Creates Ticket #3: "Write search E2E tests"

2. During Work (Ticket #1 active):
   Agent implements SearchBar component
   → Checkpoint at 15K tokens: Save progress to Ticket #1
   → Memory bank snapshot attached to Ticket #1
   → Ticket status: "In Progress" (60% complete)

3. Session Interruption (context compaction):
   Agent forgets conversation (200K token limit exceeded)
   → New session starts

4. Session Resume:
   Agent: "Read Ticket #1 (current work)"
   → Loads memory bank snapshot (project context restored)
   → Loads checkpoint data (SearchBar progress restored)
   → Agent continues implementation (no knowledge loss)

5. Completion:
   Agent: "SearchBar component done, tests passing"
   → Mark Ticket #1 as Complete
   → Auto-update memory banks (new pattern added to system-patterns.md)
   → Move to Ticket #2 (next task)

```

**Memory Bank Snapshots** (Critical Feature):

Every ticket includes a **memory bank snapshot** at creation:

- **project-brief.md** state (project context at ticket creation)
- **system-patterns.md** state (patterns available at ticket creation)
- **tech-context.md** state (tech stack at ticket creation)
- **active-context.md** state (sprint context at ticket creation)

**Why Snapshots Matter**:

- Tickets can span multiple sessions (hours to days)
- Memory banks evolve during sprint (new patterns added)
- Snapshot ensures ticket context is **consistent** (no retroactive changes)
- Agent resumes with **exact context** from ticket creation

**Example**:

```

Day 1: Create Ticket #5 (Implement AuthMiddleware)

- Snapshot: system-patterns.md includes "JWT validation pattern"
- Agent starts work, gets interrupted at 15K tokens

Day 3: Agent resumes Ticket #5

- Loads snapshot: system-patterns.md from Day 1
- Continues work using JWT pattern (not confused by new patterns added Day 2)
- Completes work consistently

```

**Checkpoint System Integration**:

Tickets store checkpoint data at 15K token intervals:

- **Token usage**: How many tokens consumed so far
- **Progress percentage**: 0-100% completion estimate
- **Implementation notes**: "Created SearchBar.tsx, added state management, tests pending"
- **Next steps**: "Add debounce to search input, write E2E tests"
- **Blockers**: "Waiting for API endpoint (Ticket #2)"

**Recovery from Checkpoint**:

```

Agent context compacts (forgets conversation)
↓
New session starts
↓
Agent: "Read current ticket checkpoints"
↓
System: "Ticket #1 (SearchBar): 60% complete, last checkpoint:

- Implemented: SearchBar.tsx with state management
- Tests: Unit tests passing
- Next: Add debounce, write E2E tests
- Blocker: None"
  ↓
  Agent: "Got it! Continuing SearchBar implementation..."
  ↓
  Agent loads memory bank snapshot from Ticket #1
  ↓
  Agent continues work with full context (no knowledge loss)

```

**MCP Tools**:

- `tickets.create()`: Create ticket for sprint work
- `tickets.updateProgress()`: Update at checkpoint (15K tokens)
- `tickets.attachSnapshot()`: Attach memory bank snapshot
- `tickets.getCurrent()`: Get active ticket for session
- `tickets.complete()`: Mark ticket done, trigger memory bank auto-update

**UI**: Ticket list page (Kanban board), ticket detail page (checkpoints timeline), ticket dashboard (active/blocked/complete)

**Database Models**:

- `Ticket`: Master record (title, description, status, progress, issueId foreign key)
- `TicketCheckpoint`: Checkpoint data (tokenUsage, progressPercentage, notes, nextSteps)
- `MemoryBankSnapshot`: Frozen memory bank state at ticket creation

**Success Criteria**:

- ✅ Tickets created during sprint planning (linked to issues)
- ✅ Checkpoints saved every 15K tokens automatically
- ✅ Memory bank snapshots attached to tickets
- ✅ Agent resumes from checkpoint with 100% context (no repeated questions)
- ✅ Ticket completion triggers memory bank auto-update (new patterns added)

#### 4.2.13 Memory Bank Auto-Generation (Post-MVP - Priority 2, FR-174 to FR-188)

**Purpose**: Automatically update memory banks from ticket completions (knowledge accumulation)

**The Manual Update Problem**:

Without auto-generation:

- Agent completes feature → Memory banks unchanged
- New patterns discovered → Not documented in system-patterns.md
- Tech stack evolves → tech-context.md becomes stale
- Progress made → progress.md not updated
- Result: Memory banks drift from reality, agents repeat questions

**Solution: Auto-Update on Ticket Completion**

When agent marks ticket as complete:

1. **Analyze Implementation**: What patterns were used? What decisions were made?
2. **Detect New Knowledge**: Is this pattern already in system-patterns.md? If not, add it.
3. **Update Memory Banks**: Append new patterns to system-patterns.md, update progress.md metrics
4. **Version Control**: Commit memory bank changes with ticket reference

**5 Memory Bank Types** (from Project Onboarding):

1. **project-brief.md** (WHAT and WHY):
   - **Auto-Update Trigger**: Milestone completion (e.g., "Phase 1 complete")
   - **Updates**: Current status section ("Active sprint: Sprint 3", "Completion: 60%")
   - **Frequency**: Weekly or at sprint transitions

2. **system-patterns.md** (HOW we build):
   - **Auto-Update Trigger**: Ticket completion (e.g., "SearchBar component done")
   - **Updates**: New patterns section ("SearchBar: Debounced input pattern with useDebounce hook")
   - **Frequency**: After every ticket (most frequently updated)

3. **tech-context.md** (Technical stack):
   - **Auto-Update Trigger**: Dependency changes (package.json modified)
   - **Updates**: Dependencies section (new versions), troubleshooting section (new issues)
   - **Frequency**: Rare (only when stack changes)

4. **active-context.md** (Current focus):
   - **Auto-Update Trigger**: Real-time (every commit)
   - **Updates**: Recent changes section (last 5 commits), active work, blockers
   - **Frequency**: Continuous (most dynamic file)

5. **progress.md** (Progress tracking):
   - **Auto-Update Trigger**: Sprint completion, milestone reached
   - **Updates**: Completion metrics (story points, velocity), lessons learned
   - **Frequency**: Weekly or at sprint transitions

**Auto-Generation Workflow**:

````

Ticket #1 (SearchBar component) marked complete
↓
analyze-implementation agent invoked (isolated thread)
↓
Agent scans ticket files:

- SearchBar.tsx (new component)
- useDebounce.ts (new custom hook)
- SearchBar.test.tsx (test patterns)
  ↓
  Agent detects new patterns:
- "Debounced input: useDebounce hook with 300ms delay"
- "Search component: Controlled input + real-time suggestions"
- "Test pattern: RTL with user-event for input simulation"
  ↓
  Agent checks system-patterns.md: Pattern not found
  ↓
  Agent appends to system-patterns.md:
  ### Debounced Input Pattern
  **Description**: Delay API calls until user stops typing
  **Example**:
  ```typescript
  const debouncedSearch = useDebounce(searchTerm, 300);
  useEffect(() => {
    if (debouncedSearch) fetchResults(debouncedSearch);
  }, [debouncedSearch]);
````

**When to use**: Search inputs, autocomplete, real-time validation
**When NOT to use**: Instant feedback required (e.g., character counters)
↓
Agent updates progress.md:

- Story points completed: 45 → 48 (+3 for SearchBar)
- Lessons learned: "useDebounce hook simplified search implementation"
  ↓
  Git commit: "docs: auto-update memory banks from Ticket #1 (SearchBar)"
  ↓
  Next agent session: "Read system-patterns.md" → Finds debounce pattern → Reuses immediately

```

**Snapshot System Integration**:

**Challenge**: Tickets include memory bank snapshots (frozen state at ticket creation). How to reconcile with live updates?

**Solution**: Versioning strategy:
- **Snapshot Version**: Memory banks at ticket creation (used during ticket work)
- **Live Version**: Memory banks with latest updates (used for new tickets)
- **Agent Workflow**:
  - Working on Ticket #1 → Use snapshot version (consistent context)
  - Ticket #1 complete → Auto-update live version (new patterns added)
  - Create Ticket #2 → Snapshot includes updates from Ticket #1

**Example**:
```

Day 1: Create Ticket #1 (SearchBar)

- Snapshot: system-patterns.md v1 (no debounce pattern)
- Agent works using v1 (consistent)

Day 2: Ticket #1 complete

- Auto-update: system-patterns.md v2 (adds debounce pattern)
- Live version now includes debounce

Day 3: Create Ticket #2 (AutocompleteInput)

- Snapshot: system-patterns.md v2 (includes debounce pattern)
- Agent reuses pattern (knowledge accumulated)

```

**MCP Tools**:
- `memoryBank.autoUpdate()`: Trigger analysis after ticket completion
- `memoryBank.analyzeTicket()`: Scan ticket files for new patterns
- `memoryBank.appendPattern()`: Add new pattern to system-patterns.md
- `memoryBank.updateProgress()`: Update progress.md metrics
- `memoryBank.commit()`: Git commit with ticket reference

**UI**: Memory bank viewer (show versions), auto-update log (what changed, why), pattern catalog (searchable)

**Database Models**:
- `MemoryBank`: Master record (type: project-brief, system-patterns, etc.)
- `MemoryBankVersion`: Version history (content, createdAt, ticketId)
- `MemoryBankPattern`: Individual patterns (name, example, category)

**Success Criteria**:
- ✅ Auto-update triggers after ticket completion (no manual intervention)
- ✅ New patterns detected and added to system-patterns.md (95%+ accuracy)
- ✅ progress.md updates reflect actual completion (metrics match reality)
- ✅ Memory bank versions tracked (can view history, revert if needed)
- ✅ Agents reuse accumulated patterns in subsequent tickets (no repeated implementation)

#### 4.2.14 Agent Dashboard (Post-MVP - Priority 2, FR-189 to FR-198)

**Purpose**: Real-time visibility into agent workflow state and context

**The Observability Problem**:

Without a dashboard:

- "What is the agent working on?" → Check git commits (manual)
- "What memory banks exist?" → Browse .agent/ folder (manual)
- "What skills are available?" → Grep .claude/skills/ (manual)
- "What sub-agents can I invoke?" → Read CLAUDE.md (manual)
- Result: No central view of agent infrastructure, hard to monitor/debug

**Solution: Agent Dashboard (Single Pane of Glass)**

**Dashboard Components**:

1. **Memory Banks Viewer** (top-left quadrant):
   - Display all 5 memory bank files (project-brief, system-patterns, tech-context, active-context, progress)
   - Show token count per file (e.g., "system-patterns.md: 4,125 tokens")
   - **Click to expand**: View full file content (syntax-highlighted markdown)
   - **Version selector**: Toggle between snapshot versions and live version
   - **Last updated**: Timestamp and triggering ticket (e.g., "Updated 2h ago by Ticket #5")

2. **Current Ticket Context** (top-right quadrant):
   - Display active ticket (title, description, progress percentage)
   - Show checkpoint timeline (15K, 30K, 45K token checkpoints)
   - Display memory bank snapshot used for this ticket
   - Show next steps and blockers
   - **Quick actions**: Mark complete, add checkpoint manually, attach notes

3. **Skills & Sub-Agents List** (bottom-left quadrant):
   - **Skills Catalog**: List all .claude/skills/ files (e.g., "api-patterns.md", "database-patterns.md")
   - Show skill metadata (category, last used, token count)
   - **Sub-Agents Catalog**: List available sub-agents (explore-codebase, analyze-architecture, next-js-expert, prisma-expert, react-expert)
   - Show sub-agent capabilities (pattern discovery, data flow tracing, etc.)
   - **Recent Reports**: List .agent/task/ reports (e.g., "explore-api-patterns-20251105.md")

4. **Agent Activity Feed** (bottom-right quadrant):
   - **Real-time log**: Show agent actions (ticket created, checkpoint saved, memory bank updated, sub-agent invoked)
   - **Timeline view**: Chronological activity (last 24 hours)
   - **Filter by type**: Tickets, Checkpoints, Memory Banks, Sub-Agents
   - **Export log**: Download activity as JSON or CSV

**User Workflows**:

**Workflow 1: Monitor Agent Progress**
```

Developer: Opens Agent Dashboard
↓
Sees: "Current Ticket: Implement SearchBar (75% complete)"
↓
Checks: Checkpoint timeline (last checkpoint 2h ago at 45K tokens)
↓
Reads: Next steps ("Add debounce, write E2E tests")
↓
Confident: Agent is on track, no intervention needed

```

**Workflow 2: Understand Agent Context**
```

Developer: "Why did agent implement search this way?"
↓
Opens: Memory Banks Viewer → system-patterns.md
↓
Finds: "Debounced input pattern with useDebounce hook"
↓
Realizes: Agent followed documented pattern (consistent)
↓
Verifies: Pattern matches project conventions (correct)

```

**Workflow 3: Discover Available Tools**
```

Developer: "What skills can agents use?"
↓
Opens: Skills & Sub-Agents List
↓
Sees: 12 skills (api-patterns, database-patterns, etc.)
↓
Clicks: "api-patterns.md" → Expands skill content
↓
Reads: API endpoint conventions (POST routes, Zod validation, error handling)
↓
Understands: How agents implement API features

```

**Workflow 4: Debug Agent Behavior**
```

Developer: "Agent created duplicate pattern in system-patterns.md"
↓
Opens: Agent Activity Feed
↓
Filters: "Memory Banks" activity
↓
Sees: Ticket #7 auto-updated system-patterns.md 3h ago
↓
Opens: Memory Bank Version Selector → View previous version
↓
Compares: v5 (before Ticket #7) vs v6 (after Ticket #7)
↓
Identifies: Duplicate pattern added
↓
Action: Delete duplicate manually, note issue for improvement

```

**Dashboard Widgets** (Optional Enhancements):

- **Token Budget Gauge**: Show session token usage (e.g., "145K / 200K tokens used")
- **Sprint Progress Chart**: Burndown chart (story points remaining vs days left)
- **Memory Bank Accuracy Score**: Compare memory banks to actual codebase (95%+ target)
- **Sub-Agent Usage Stats**: How often each sub-agent invoked (explore-codebase: 15 times)

**MCP Tools** (Dashboard Data Sources):
- `dashboard.getMemoryBanks()`: Fetch all memory bank files
- `dashboard.getCurrentTicket()`: Get active ticket context
- `dashboard.listSkills()`: List available skills
- `dashboard.listSubAgents()`: List available sub-agents
- `dashboard.getActivityFeed()`: Fetch recent agent actions

**UI**: Full-page dashboard (React Server Components), real-time updates (WebSocket or polling), responsive layout (desktop-first, tablet support)

**Database Models**:
- `AgentActivity`: Log all agent actions (type: ticket, checkpoint, memory_bank, sub_agent)
- `MemoryBankVersion`: Track memory bank changes (for version selector)
- `SkillUsage`: Track skill loads (for usage stats)

**Success Criteria**:
- ✅ Dashboard loads in <2 seconds (all data sources fetched)
- ✅ Real-time updates within 5 seconds of agent action
- ✅ Memory banks viewer supports syntax highlighting (readable markdown)
- ✅ Version selector allows comparing snapshots (useful for debugging)
- ✅ Activity feed filterable and exportable (searchable logs)

#### 4.2.15 Additional Onboarding Sessions (Post-MVP - Priority 2, FR-199 to FR-220)

**Purpose**: Progressive documentation generation through Sessions 2-5

**Progressive Onboarding Philosophy**:

Session 1 (MVP) creates **minimum viable agent infrastructure**:

- Executive summary (project overview)
- Wiki basics (getting-started, architecture)
- Memory bank seeds (foundation files)
- CLAUDE.md (basic workflow)

**But agents need more depth for complex projects:**

- "What dependencies are installed and why?" (Session 2: Tech Stack)
- "What are the user stories and acceptance criteria?" (Session 3: Requirements)
- "What are the design patterns and architectural decisions?" (Session 4: Architecture)
- "What's in the backlog and how are sprints structured?" (Session 5: Backlog/Sprints)

**Solution: Additional Sessions (Gradual Knowledge Building)**

Each session focuses on one aspect, deepening agent understanding progressively.

---

**Session 2: Tech Stack Deep-Dive** (FR-201 to FR-205)

**Goal**: Complete technical context understanding

**What's Generated**:

1. **Dependency Analysis** (automated scan):
   - For each package in package.json:
     - **Purpose**: Why is this dependency included? (e.g., "Next.js: React framework for SSR/SSG")
     - **Version rationale**: Why this version? (e.g., "Next.js 14: App Router support")
     - **Usage patterns**: Where is it used in codebase? (e.g., "app/ directory structure")
   - Group by category: frameworks, libraries, dev tools, testing

2. **Configuration Deep-Dive**:
   - Environment variables: List all with descriptions (DATABASE_URL, NEXTAUTH_SECRET, etc.)
   - Configuration files: next.config.js, tailwind.config.js, tsconfig.json (purpose and key settings)
   - Build pipeline: How to build, deploy, run locally

3. **Troubleshooting Guides** (enhanced tech-context.md):
   - Common errors and solutions (port conflicts, database connection issues, build failures)
   - Performance optimization tips (bundle size, caching strategies, query optimization)
   - Debugging workflows (browser dev tools, server logs, database queries)

4. **Browser Compatibility Matrix**:
   - Supported browsers and versions (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   - Polyfills and fallbacks (for older browsers)
   - Feature detection patterns (how to check browser capabilities)

**Output**: Enhanced tech-context.md (2K → 5K tokens), detailed dependency wiki pages

**MCP Tool**: `onboarding.runSession2()`: Analyze tech stack

---

**Session 3: Requirements Exploration** (FR-206 to FR-210)

**Goal**: Complete requirements understanding

**What's Generated**:

1. **User Stories Extraction** (from PRD/SRS):
   - For each feature:
     - **User story**: "As a [user], I want [goal], so that [benefit]"
     - **Acceptance criteria**: Bullet points defining "done"
     - **Priority**: MoSCoW (Must, Should, Could, Won't)
   - Group by epic/feature area

2. **Edge Cases and Constraints**:
   - What happens if user is logged out? (authentication edge case)
   - What happens if database is down? (error handling)
   - What happens if API response is malformed? (validation)
   - List constraints: performance targets (LCP <2.5s), accessibility (WCAG 2.1 AA)

3. **Requirements Wiki Pages**:
   - Create wiki page per feature (e.g., "search-feature-requirements.md")
   - Include user stories, acceptance criteria, edge cases
   - Cross-link to architecture wiki pages (implementation details)

4. **Traceability Matrix**:
   - Map user stories → functional requirements → test cases
   - Example: US-001 → FR-001 → TEST-001 (bidirectional links)

**Output**: Enhanced project-brief.md (requirements section), requirements wiki pages, traceability matrix

**MCP Tool**: `onboarding.runSession3()`: Extract requirements

---

**Session 4: Architecture Mapping** (FR-211 to FR-215)

**Goal**: Complete architectural understanding

**What's Generated**:

1. **Component Diagrams** (Mermaid format):
   - Frontend layer: Pages, components, hooks (hierarchy diagram)
   - Backend layer: API routes, database models, services (layered architecture diagram)
   - Data flow: User action → Frontend → API → Database → Response (sequence diagram)

2. **Design Patterns Catalog** (enhanced system-patterns.md):
   - For each pattern:
     - **Name**: Server Component Pattern, useDebounce Pattern, Prisma Transaction Pattern
     - **Problem**: What problem does this solve?
     - **Solution**: Code example (5-10 lines)
     - **Consequences**: Trade-offs, when NOT to use
   - Group by category: architecture, database, API, UI, testing

3. **Architectural Decision Records (ADRs)**:
   - Create ADR wiki pages (e.g., "ADR-001-why-app-router.md")
   - Format: Context, Decision, Status, Consequences
   - Link from architecture.md wiki page

4. **Data Model Visualization**:
   - Prisma schema → Entity-Relationship Diagram (Mermaid ERD)
   - Show relationships: one-to-many, many-to-many, self-referential
   - Include indexes, constraints, cascade behavior

**Output**: Enhanced system-patterns.md (4K → 8K tokens), architecture wiki pages with diagrams, ADRs

**MCP Tool**: `onboarding.runSession4()`: Map architecture

---

**Session 5: Backlog and Sprint Planning** (FR-216 to FR-220)

**Goal**: Complete project planning understanding

**What's Generated**:

1. **Backlog Breakdown**:
   - Extract epics from PRD (e.g., "EPIC-001: Sprint Tracking")
   - Extract user stories from Backlog (e.g., "US-001: Create 5-level hierarchy")
   - Show story points and MoSCoW priority
   - Group by sprint allocation (Sprint 1, Sprint 2, etc.)

2. **Sprint Structure**:
   - For each sprint:
     - **Duration**: 2 weeks (standard)
     - **Capacity**: 40 story points (solo developer, 40 hours/week)
     - **Goals**: What will be accomplished?
     - **User stories**: Which stories in this sprint?
     - **Dependencies**: What must be done first?

3. **Velocity and Burndown**:
   - Historical velocity: Story points completed per sprint (last 3 sprints)
   - Burndown chart: Remaining story points vs days left (predicted completion)
   - Risk analysis: Are we on track? What's at risk?

4. **Tickets Creation** (Optional):
   - Pre-generate tickets from user stories (break down US-001 → 3 tickets)
   - Example: US-001 (Create 5-level hierarchy) → Ticket #1 (Phase model), Ticket #2 (Week model), Ticket #3 (Day model)
   - Link tickets to issues (bidirectional)

**Output**: Enhanced progress.md (backlog section), sprint wiki pages, tickets pre-created

**MCP Tool**: `onboarding.runSession5()`: Analyze backlog/sprints

---

**Session Flow Summary**:
```

Session 1 (30-40 seconds):
Executive summary + wiki basics + memory bank seeds + CLAUDE.md
→ Agent can START working immediately

Session 2 (2-3 minutes):
Tech stack deep-dive + troubleshooting + dependency analysis
→ Agent UNDERSTANDS technical constraints

Session 3 (3-5 minutes):
Requirements extraction + user stories + edge cases
→ Agent ALIGNS with business goals

Session 4 (5-7 minutes):
Architecture mapping + design patterns + ADRs
→ Agent FOLLOWS system design

Session 5 (3-5 minutes):
Backlog breakdown + sprint structure + tickets
→ Agent PRIORITIZES work autonomously

Total: 15-20 minutes for COMPLETE project onboarding
(vs 8-12 hours manual documentation)

```

**Flexible Session System**:

**Not all projects need all sessions**:
- **Small projects** (< 5K LOC): Session 1 sufficient (executive summary enough)
- **Medium projects** (5K-20K LOC): Sessions 1-2 (basic + tech stack)
- **Large projects** (20K-100K LOC): Sessions 1-4 (skip Session 5 if no backlog)
- **Enterprise projects** (100K+ LOC): All 5 sessions (complete documentation)

**Session Customization** (Future Enhancement):
- User chooses which sessions to run (checkboxes in UI)
- User provides custom Q&A (OnboardingQuestion model)
- AI adapts session content based on project size/complexity

**MCP Tools**:
- `onboarding.runSession2()`: Tech stack deep-dive
- `onboarding.runSession3()`: Requirements exploration
- `onboarding.runSession4()`: Architecture mapping
- `onboarding.runSession5()`: Backlog/sprint planning

**UI**: Session selector (choose which sessions to run), progress tracker (show current session), output preview (generated artifacts)

**Database Models**:
- `OnboardingSession`: Track session completion (sessionNumber, completedAt, artifacts)
- `OnboardingArtifact`: Store generated files (type: wiki, memory_bank, ticket)

**Success Criteria**:
- ✅ Each session completes in specified time (Session 2: <3 min, Session 3: <5 min, etc.)
- ✅ Generated artifacts are AI-created (no manual writing)
- ✅ Memory banks enhanced progressively (Session 1: 2-3K tokens → Session 5: 10-12K tokens total)
- ✅ Agents work autonomously after session completion (no repeated questions about session topics)
## 5. Success Metrics

### 5.1 North Star Metric

**Zero Human Intervention for Complete Features**

- Agents execute 5-step protocol end-to-end without skipping steps
- Workflow completion rate: >95%
- Markdown files always synchronized with database (0 drift)

### 5.2 Token Efficiency Metrics

**Skills:** 92% token reduction

- Before: 2,500 tokens (full React docs)
- After: 220 tokens (lazy-loaded skill)
- Measurement: Average tokens per skill load

**Knowledge:** 88% token reduction

- Before: 10,000+ tokens (full graph traversal)
- After: 1,200 tokens (hybrid search + 2-hop traversal)
- Measurement: Average tokens per knowledge query

### 5.3 Autonomy Metrics

**Agent Interaction:** 95% via MCP

- Target: 95% of all operations via MCP tools
- Current: 0% (no MCP server built yet)
- Measurement: MCP tool calls / total operations

**Human Intervention:** 5% via UI

- Target: <5% manual overrides per week
- Measurement: Manual CRUD operations / total operations

### 5.4 Quality Metrics

**Workflow Compliance:** >95%

- Target: >95% of sessions complete all 5 steps
- Measurement: Complete workflows / total workflows

**Markdown Sync:** 100%

- Target: 0 drift between database and markdown files
- Measurement: Automated tests verify sync after every DB update

### 5.5 Performance Metrics

**API Response Time:**

- P95: <500ms
- P99: <1s
- Measurement: All MCP tool calls

**Knowledge Graph Queries:**

- P95: <200ms
- P99: <500ms
- Measurement: knowledge.query() execution time

---

## 6. Constraints

### 6.1 Budget Constraints

**Target:** $0 infrastructure cost (local deployment)

- **Database:** PostgreSQL (local, no cloud)
- **Embeddings:** Optional $5/month (OpenAI text-embedding-3-small) OR local embeddings (Ollama, $0)
- **Hosting:** Docker Compose on local machine (Windows PC + Mac Mini LAN access)
- **Storage:** Local file system (no S3/cloud storage)

### 6.2 Region Constraints

**Local-First:** No cloud dependencies

- All data stays on local machine
- LAN access from Mac Mini (static IP: 192.168.X.X)
- No internet required after initial setup

### 6.3 Stack Constraints

**Mandated Technologies:**

- **Frontend + Backend:** Next.js 14 (App Router) - Unified deployment
- **Database:** PostgreSQL 15+ (pgvector for embeddings, tsvector for full-text)
- **ORM:** Prisma (type-safe, migrations, excellent DX)
- **MCP:** @modelcontextprotocol/sdk (stdio transport)
- **Deployment:** Docker Compose (no Kubernetes complexity)

**Rationale:**

- PostgreSQL chosen over MongoDB (better full-text search, pgvector, structured data)
- Next.js 14 chosen for unified frontend/backend (no separate Express server)
- Docker Compose chosen for simplicity (one command: `docker-compose up`)

### 6.4 Timeline Constraints

**16-Week Roadmap:** 5 phases, 640 hours total (40 hours/week solo developer)

- **Phase A:** Foundation (Weeks 1-3) - Database + MCP server
- **Phase B:** Knowledge System (Weeks 4-7) - RAG + Graph + Skills
- **Phase C:** Features + UI (Weeks 8-12) - All 8 features
- **Phase D:** Safety (Weeks 13-14) - Autonomy levels, validation
- **Phase E:** Production (Weeks 15-16) - Polish, documentation, deployment

### 6.5 Model Strategy Constraints

**MCP-Compatible Agents Only:**

- Claude Code (Anthropic)
- Cursor AI (Anysphere)
- Codex (OpenAI)
- Cascade (future compatibility)

**No Custom LLM Integration:** Use existing MCP-compatible agents (no API keys needed)

---

## 7. Out of Scope (MVP)

**Explicitly Excluded:**

1. **Real-time Collaboration:** Async only (no WebSockets, no multi-user editing)
2. **Mobile Apps:** Web only (responsive design for tablet/phone viewing, but no native apps)
3. **External Integrations:** No Jira/GitHub/Linear sync (MCP only)
4. **Advanced Analytics:** Basic metrics only (no ML-powered insights)
5. **Multi-Tenant:** Single project per deployment (no team/org support)
6. **Cloud Hosting:** Local/self-hosted only (no SaaS version)
7. **User Authentication:** Solo developer (no login, no user management)
8. **Custom Workflow Definitions:** 12 predefined workflows only (customization post-MVP)
9. **Bidirectional Markdown Sync:** DB → markdown only (markdown is read-only, agents can't edit files directly)
10. **Multi-Agent Orchestration:** Single agent at a time (no agent-to-agent communication)

---

## 8. Completed Work Integration (Sprint 0 Preservation)

### 8.1 What Was Built (Sprint 0 - UI Foundation)

**7 UI Pages (100% Complete):**

1. Dashboard - Overview, stats, activity feed
2. Issues List - Browse, filter, sort issues
3. Issue Detail - View/edit single issue with rich text editor
4. Knowledge - Browse/search knowledge items
5. Wiki - Browse/edit wiki pages
6. Security (renamed to Project Health) - Health dashboard
7. Command Palette - ⌘+K quick actions

**17 Prisma Models:** Issue, IssueComment, IssueLabel, KnowledgeItem, WikiPage, etc.

**Dark Neumorphic Coral Theme:** Fully responsive, WCAG 2.1 AA accessible

### 8.2 Preservation Strategy (100% UI Complete)

**Sprint 0 Status:** ✅ All UI work complete (7 pages, 45+ components)

**Directly Reusable (100% of UI):**

- **Issues pages:** 100% complete (all 14 components built) - Sprint 4 adds backend integration only
- **Theme system:** Static Coral theme with neumorphic design - ready for all pages
- **Component patterns:** 45+ reusable components (neumorphic cards, buttons, forms, widgets)
- **All 7 pages:** Dashboard, Issues List/Detail, Knowledge, Wiki, Security, Agents - fully styled and functional

**Backend Integration Needed (Sprints 1-8):**

- **Phase/Week/Day/Task/Session models:** UI widgets ready (dashboard stats, progress cards)
- **MCP tools:** Wire existing UI to backend tools (no UI changes needed)
- **Database queries:** Connect Server Components to real workflow data
- **Search features:** Add pgvector for semantic search (UI already has search inputs)

### 8.3 Integration Approach

**Issues:** Keep existing UI pages → Add MCP tools → UI displays agent-created issues (no UI changes needed)

**Theme:** Copy `globals.css` → Apply to new pages (Sprint, Workflow, Skills)

**Knowledge:** Extend KnowledgeItem model with `embedding Vector(384)` → Keep existing UI → Add graph view

**Archive Location:** [docs/archive/ui-first-phase/](archive/ui-first-phase/) - Complete preservation with README

---

## 9. Approval & Next Steps

### 9.1 Document Status

- **Status:** ✅ Approved (2025-11-02)
- **Approver:** Project Owner
- **Next Document:** [02-SRS.md](02-SRS.md) - System Requirements Specification (125 Functional Requirements)

### 9.2 Success Criteria for PRD Completion

- [x] Agent-first philosophy explained clearly
- [x] 2 user personas defined (AI Agent 95%, Solo Developer 5%)
- [x] 8 MVP features with FR ranges (FR-001 to FR-125)
- [x] Success metrics defined (token efficiency, autonomy, quality)
- [x] Constraints documented (budget, region, stack, timeline)
- [x] Out of scope items listed (10 exclusions)
- [x] Sprint 0 work preservation strategy (100% UI complete - documented in docs/13-Project-Plan.md)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-02
**Related Documents:**

- [README.md](README.md) - Documentation index
- [02-SRS.md](02-SRS.md) - System Requirements (125 FRs)
- [architecture/ADRs/ADR-001-agent-first-architecture.md](architecture/ADRs/ADR-001-agent-first-architecture.md) - Architecture decision
```
