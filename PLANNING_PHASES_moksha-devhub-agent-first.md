# Planning Phases Document - Moksha DevHub (Agent-First Architecture)

**Project**: Moksha DevHub - Agent-First Project Management Platform
**Purpose**: Comprehensive agent-first architecture planning before implementation
**Created**: 2025-11-02
**Status**: ⏳ IN PROGRESS (Phase 1.2 - Core Features & Scope)
**Workflow Based On**: AI Agentic Workflow (Focused Architecture Session)

---

## 📋 Document Purpose

This document captures architectural decisions for transforming Moksha DevHub from a developer-first tool to an **agent-first project management platform**.

**Session Type**: Focused Architecture Session (Option 2)

- Phase 1: Product Manager Phase (User Personas & Scope) - 15 min
- Phase 3: UX/UI Design Philosophy - 15 min
- Phase 4: System Architecture Phase - 30-35 min
- Phase 10: Security Audit - 10 min
- **Total**: 60-75 minutes

**Agent-First Philosophy:**

- Primary Users: AI Agents (Claude Code, Codex, Cursor AI, Cascade) via MCP
- Secondary Users: Solo/small team developers (manual overrides, monitoring)
- UI Purpose: Monitoring and visual representation, not primary interaction
- All features optimized for agent automation first, human use second

---

## Session Log

- 2025-11-02 14:30 - Started Phase 1: Product Manager Phase
- 2025-11-02 15:00 - Completed Phase 1.1 (User Personas) - 30 minutes
- 2025-11-02 15:30 - Completed Phase 1.2 (Core Features & Scope) - 30 minutes
- 2025-11-02 15:35 - User confirmation received for all Phase 1 decisions
- 2025-11-02 15:40 - Starting Phase 3: UX/UI Design Philosophy

---

# Phase 1: Product Manager Phase

**Status**: ⏳ IN PROGRESS (Phase 1.2)
**Goal**: Define user personas, core features, and architectural scope
**Estimated Time**: 45-60 minutes (extended due to architecture complexity)

---

## 1.1 User Personas ✅ COMPLETE

**Status**: ✅ COMPLETE (30 minutes)

### Persona 1: "Universal AI Agent" (Primary User - 95% of interactions)

**Demographics:**

- **Agent Type**: Any MCP-compatible agent (Claude Code, Codex, Cursor AI, Cascade, etc.)
- **Skill Level**: Adaptive - learns system over time (not static knowledge)
- **Motivation Level**: VERY HIGH - uses app for "every bit of things required"
- **Integration**: MCP (Model Context Protocol) for universal agent access

**Goals & Daily Workflow:**

**Primary Goal**: Execute complete project workflows via MCP with persistent state tracking

**5-Step Mandatory Protocol Example:**

1. Check status/sprint plan in app (via MCP tool)
2. Create implementation plan → Save to app → Get approval
3. Create todo list in app (synchronized)
4. Switch git branch → Implement with checkpoints → Update app continuously
5. Mark completion in app → Update status/sprint plan

**Feature-Specific Workflows:**

1. **Issues**:
   - Create issues during audits, testing, implementation
   - Document findings with full context
   - Track status and resolution
   - **Agent Need**: Bulk creation, auto-tagging, context injection

2. **Skills** (NEW - Split from Knowledge):
   - Store framework/library documentation (React, Next.js, Prisma)
   - 92% token reduction vs full docs (220 tokens vs 2.5K)
   - **Agent Need**: Fast retrieval, keyword-based loading, version tracking

3. **Knowledge** (RAG + Knowledge Graph):
   - Store project-specific context (NOT framework docs)
   - Retrieve via intelligent queries (not recursive traversal)
   - Build knowledge graph relationships
   - **Agent Need**: Smart context retrieval, relationship mapping, semantic search
   - **Reference**: Similar to https://ref.tools/mcp

4. **Wiki**:
   - Create/update `/docs` folder (architecture, PRD, user stories)
   - Auto-generate from code comments
   - Maintain documentation freshness
   - **Agent Need**: Automatic updates, cross-linking, version control

5. **Project Health** (renamed from Security):
   - Track security issues + gaps + violations + technical debt
   - Created during testing, audits, implementation
   - **Agent Need**: Auto-categorization, severity scoring, remediation tracking

6. **Personas**:
   - Create sub-agents during initial planning phase
   - Add new or edit existing during development
   - Project-specific customization
   - **Agent Need**: Dynamic creation, context-aware activation

7. **Workflow Orchestration** (NEW):
   - Track 12+ workflows from CLAUDE.md
   - 5-step mandatory protocol enforcement
   - Current workflow state persistence
   - **Agent Need**: State machine tracking, checkpoint recovery

8. **Sprint/Phase Tracking** (NEW):
   - Hierarchical: Phase → Week → Day → Task → Subtask → Session
   - Synchronized markdown file generation
   - Visual progress indicators
   - **Agent Need**: Automated progress updates, consistency enforcement

**Pain Points:**

- No persistent workflow state across sessions
- Gaps in documentation
- Progress not tracked in phase/sprint hierarchical manner
- No visual representation of project progress
- Context retrieval inefficient (full traversal vs smart queries)
- Inconsistent markdown file updates (STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md)

**Example Daily Flow:**

```
08:00 - Agent starts session → Reads Sprint/Phase tracker (via MCP)
08:05 - Creates plan for "Implement search feature" → Saves to app
08:10 - Generates todos → Synced to app (current-todos.md auto-updated)
08:15 - Switches to feature/search branch (git workflow tracked)
09:00 - Checkpoint 1: Updates progress (15K tokens) → App syncs STATUS.md
10:30 - Checkpoint 2: 50% complete → App updates hierarchy
12:00 - Implementation complete → Marks todos done → App archives plan
12:15 - Agent queries Knowledge graph for related patterns
12:30 - Updates Wiki with new search architecture
```

---

### Persona 2: "Solo/Small Team Developer" (Secondary User - 5% of interactions)

**Demographics:**

- **User Type**: Solo developer (primary) or small teams (2-5 developers)
- **Project Type**: Personal projects, side projects, client work
- **Technical Level**: Intermediate to senior developers

**Goals:**

- Manually add/edit issues, knowledge, wiki, security, personas when needed
- Monitor agent activity and progress via visual dashboard
- Override agent decisions when business logic requires human judgment
- Review agent-created content for accuracy

**Pain Points:**

- Agents create too many low-priority items (noise)
- Agent-generated documentation may lack business context
- Can't easily see what agent changed vs manual changes
- Need visual dashboard for project health monitoring

**Interaction Frequency:**

- **Daily**: Quick dashboard check (2-5 minutes)
- **Weekly**: Review agent activity, approve/reject changes
- **Monthly**: Audit agent performance, adjust workflows

**Example Weekly Flow:**

```
Monday AM: Check dashboard → See 15 new issues created by agent → Bulk approve
Wednesday: Agent-created wiki entry missing business context → Manual edit
Friday: Review sprint progress chart → All checkpoints green → No action needed
```

---

## 1.2 Core Features & Scope

**Status**: ⏳ IN PROGRESS
**Goal**: Define detailed scope for each of 8 core features

---

### Feature 1: Issues

**Purpose**: Bug and task tracking system for agent-created and human-created work items

**Must-Have Features (MVP):**

1. **Issue Creation**:
   - Agent creates issues during: audits, testing, implementation
   - Human creates issues manually via UI
   - Bulk creation API for agents (create 10-50 issues at once)
   - Auto-tagging based on context (file paths, error types)

2. **Issue Tracking**:
   - Status workflow: Open → In Progress → Review → Closed
   - Priority levels: Critical, High, Medium, Low
   - Assignment (agent or human)
   - Labels/tags (auto-generated and manual)

3. **Context Injection**:
   - Link to code files (line numbers)
   - Link to git commits
   - Link to related issues
   - Reproduction steps
   - Stack traces

4. **Agent Operations** (MCP Tools):
   - `issues.create(data)` - Create single issue
   - `issues.createBulk(data[])` - Create multiple issues
   - `issues.update(id, data)` - Update status/priority
   - `issues.query(filters)` - Search issues
   - `issues.link(issueId, relatedId)` - Create relationships

**Nice-to-Have (Post-MVP):**

- Time tracking
- Issue templates
- Custom fields
- Webhooks for external integrations

**Out of Scope:**

- Real-time collaboration (async only for MVP)
- Issue voting/commenting (comments yes, voting no)
- Advanced kanban boards (simple list/grid only)

---

### Feature 2: Skills (NEW - Framework Documentation)

**Purpose**: Store framework/library documentation for token-efficient agent access

**Must-Have Features (MVP):**

1. **Skill Storage**:
   - Markdown format (YAML frontmatter + content)
   - Organized by category (framework, testing, workflow, troubleshooting)
   - Version tracking (last_updated field)

2. **Token Optimization**:
   - Lazy loading (frontmatter always, content on-demand)
   - Auto-unload after use
   - Target: 50-280 tokens per skill vs 2-5K for full docs

3. **Auto-Invocation**:
   - Keyword-based triggers
   - Context-aware loading
   - Temporary context injection

4. **Agent Operations** (MCP Tools):
   - `skills.list()` - Get all skill frontmatter
   - `skills.load(skillName)` - Load full skill content
   - `skills.search(keywords)` - Find relevant skills
   - `skills.create(data)` - Agent creates new skill

**Nice-to-Have (Post-MVP):**

- Skill versioning (v1, v2)
- Usage analytics (which skills used most)
- Pattern drift detection (when skills become outdated)

**Out of Scope:**

- Multi-language skills (English only for MVP)
- Skill marketplace (custom skills only)

---

### Feature 3: Knowledge (RAG + Knowledge Graph)

**Purpose**: Project-specific context retrieval system with RAG embeddings and knowledge graph relationships

**Must-Have Features (MVP):**

1. **RAG (Retrieval-Augmented Generation)**:
   - Store knowledge items with embeddings (pgvector, 384 dimensions)
   - Semantic search (vector similarity)
   - Full-text search (PostgreSQL tsvector)
   - Hybrid search (combine semantic + full-text)

2. **Knowledge Graph**:
   - Entity nodes (concepts, patterns, decisions)
   - Relationship edges (references, contradicts, extends)
   - Graph traversal queries
   - Inference over relationships

3. **Smart Retrieval**:
   - Query-based retrieval (not full traversal)
   - Context relevance scoring
   - Top-K results (retrieve only what's needed)
   - Relationship expansion (find related nodes)

4. **Agent Operations** (MCP Tools):
   - `knowledge.add(content, metadata)` - Store knowledge item
   - `knowledge.query(question, k=5)` - Retrieve top-K relevant items
   - `knowledge.relate(fromId, toId, type)` - Create relationship
   - `knowledge.traverse(startId, depth=2)` - Graph traversal
   - `knowledge.semanticSearch(query)` - Vector similarity search

**Nice-to-Have (Post-MVP):**

- Entity extraction (NER)
- Auto-relationship detection
- Knowledge aging/deprecation
- Knowledge provenance (who added what)

**Out of Scope:**

- External knowledge sources (internal only for MVP)
- Knowledge approval workflow (trust agents for MVP)

**Data Model:**

```sql
KnowledgeItem:
  - id, content, embedding, tags, createdBy (agent/human)

KnowledgeRelationship:
  - id, fromId, toId, type (references|contradicts|extends)
  - strength (confidence score)
```

**Reference Implementation**: Similar to https://ref.tools/mcp (MCP-based knowledge retrieval)

---

### Feature 4: Wiki

**Purpose**: Project documentation system mapping to `/docs` folder

**Must-Have Features (MVP):**

1. **Document Management**:
   - Markdown storage (maps to `/docs` folder)
   - Hierarchical structure (pages can have children)
   - Version control (git-backed)

2. **Auto-Generation**:
   - Generate from code comments (JSDoc, docstrings)
   - Auto-update on code changes
   - Cross-linking (auto-detect references)

3. **Document Types**:
   - Architecture docs
   - API documentation
   - User stories / PRDs
   - Runbooks / SOPs

4. **Agent Operations** (MCP Tools):
   - `wiki.create(path, content)` - Create new wiki page
   - `wiki.update(path, content)` - Update existing page
   - `wiki.read(path)` - Retrieve page content
   - `wiki.search(query)` - Full-text search across wiki
   - `wiki.autoGenerate(sourceFiles)` - Generate from code

**Nice-to-Have (Post-MVP):**

- Rich media (images, diagrams)
- Wiki templates
- Change tracking (who changed what)
- Table of contents auto-generation

**Out of Scope:**

- WYSIWYG editor (markdown only)
- Comments on wiki pages (documentation is authoritative)

---

### Feature 5: Project Health (renamed from Security)

**Purpose**: Track security issues, code quality gaps, violations, and technical debt

**Must-Have Features (MVP):**

1. **Issue Categories**:
   - Security vulnerabilities (CVEs, OWASP)
   - Code quality issues (complexity, duplication)
   - Accessibility violations (WCAG)
   - Performance issues
   - Technical debt

2. **Severity Scoring**:
   - Critical, High, Medium, Low
   - Auto-categorization based on type
   - Remediation priority

3. **Scanner Integration**:
   - Semgrep (security)
   - ESLint (code quality)
   - Lighthouse (performance)
   - axe-core (accessibility)

4. **Agent Operations** (MCP Tools):
   - `health.scan(scannerType)` - Run scan
   - `health.findings()` - Get all findings
   - `health.score()` - Calculate project health score
   - `health.remediate(findingId, fix)` - Propose/apply fix

**Nice-to-Have (Post-MVP):**

- Auto-remediation (agent applies fixes)
- False positive tracking
- Trend analysis (health over time)

**Out of Scope:**

- Penetration testing (static analysis only)
- Compliance certifications (track issues, not certify)

---

### Feature 6: Personas (Agent Sub-Agents)

**Purpose**: Store and activate project-specific agent personas

**Must-Have Features (MVP):**

1. **Persona Storage**:
   - Name, description, system prompt
   - Capabilities list
   - Activation rules (when to use)
   - Project-specific customization

2. **Dynamic Creation**:
   - Agent creates personas during planning
   - Analyze project patterns → generate persona
   - Edit/refine throughout project lifecycle

3. **Activation**:
   - Context-aware auto-activation
   - Manual activation (human override)
   - MCP Prompts integration

4. **Agent Operations** (MCP Tools):
   - `personas.create(name, systemPrompt, capabilities)` - Create persona
   - `personas.list()` - Get all personas
   - `personas.activate(personaId)` - Activate persona
   - `personas.deactivate(personaId)` - Deactivate persona

**Nice-to-Have (Post-MVP):**

- Persona performance metrics
- A/B testing personas
- Persona versioning

**Out of Scope:**

- Multi-agent orchestration (single agent at a time for MVP)

---

### Feature 7: Workflow Orchestration (NEW)

**Purpose**: Track and enforce workflow execution state for all 12+ workflows from CLAUDE.md

**Must-Have Features (MVP):**

1. **Workflow Definitions**:
   - 5-Step Mandatory Protocol
   - Session Start Workflow
   - Plan Creation Workflow
   - Checkpoint Update Workflow
   - Recovery Workflow
   - Post-Completion Workflow
   - Git Workflow
   - Documentation Workflow
   - Pre-Work Checklist
   - Context File Workflow
   - 3-Tier Persistence Workflow
   - Plan Mode Workflow

2. **State Tracking**:
   - Current workflow step
   - Completion status per step
   - Checkpoint history
   - Failure/retry tracking

3. **Enforcement**:
   - Required step validation
   - Missing step alerts
   - Auto-recovery suggestions

4. **Agent Operations** (MCP Tools):
   - `workflow.start(workflowType)` - Initialize workflow
   - `workflow.getCurrentStep()` - Get current step
   - `workflow.completeStep(stepId)` - Mark step done
   - `workflow.status()` - Get full workflow state
   - `workflow.recover()` - Resume from checkpoint

**Nice-to-Have (Post-MVP):**

- Custom workflows (user-defined)
- Workflow templates
- Parallel workflows

**Out of Scope:**

- Visual workflow builder (code-defined only)

---

### Feature 8: Sprint/Phase Tracking (NEW)

**Purpose**: Hierarchical progress tracking with auto-sync to markdown files

**Must-Have Features (MVP):**

1. **Hierarchical Structure** (5 levels - USER APPROVED):

   ```
   Project
   └── Phase 1
       └── Week 1
           └── Day 1
               └── Task 1
                   └── Session 1
   ```

   **Design Decision**: Tasks fit within single agent conversation context, so Subtask level removed for simplicity.

2. **Progress Tracking**:
   - Percentage complete at each level
   - Time estimates vs actuals
   - Status (Not Started, In Progress, Complete)
   - Blockers/risks

3. **Markdown File Sync** (CRITICAL):
   - Database as single source of truth
   - Auto-generate markdown files:
     - `STATUS.md` ← Generated from Sprint/Phase tables
     - `DEVELOPMENT_PLAN.md` ← Generated from Sprint/Phase tables
     - `current-todos.md` ← Generated from Task/Subtask tables
     - `current-plan.md` ← Generated from current plan
     - `current-session-[timestamp].md` ← Generated from Session table
   - Read-only markdown files (agents update DB, DB updates files)

4. **Visual Representation**:
   - Progress charts (phase, week, day level)
   - Gantt chart view
   - Hierarchy tree view
   - Flow charts for workflows

5. **Agent Operations** (MCP Tools):
   - `sprint.create(phaseId, data)` - Create sprint
   - `sprint.updateProgress(sprintId, percentage)` - Update progress
   - `sprint.getCurrentTask()` - Get active task
   - `sprint.checkpoint(data)` - Create checkpoint
   - `sprint.syncMarkdown()` - Force markdown regeneration

**Nice-to-Have (Post-MVP):**

- Sprint velocity tracking
- Burndown charts
- Retrospective tracking

**Out of Scope:**

- Team collaboration (solo/small team only)
- Sprint planning poker (simple estimation only)

---

## 1.3 Feature Priority & Dependencies

**Status**: ✅ COMPLETE

**User Confirmation** (2025-11-02):

- ✅ Q1: Feature definitions accurate
- ✅ Q2: Knowledge graph focus = "agentic memory retrieval to preserve tokens"
- ✅ Q3: Markdown sync strategy accepted (DB as source of truth)
- ✅ Q4: All 12 workflows tracked (MVP), customization (post-MVP)

**P0 (Critical - Build First):**

1. Sprint/Phase Tracking (foundation for all progress)
2. Workflow Orchestration (enforces consistency, tracks all 12 workflows)
3. Issues (core task tracking)

**P1 (High - Build Second):** 4. Knowledge (Agentic RAG + Graph for token-efficient context retrieval) 5. Skills (token-efficient patterns, 92% reduction)

**P2 (Medium - Build Third):** 6. Wiki (documentation auto-generation) 7. Project Health (quality + security tracking)

**P3 (Low - Build Last):** 8. Personas (agent-created, project-specific)

**Dependencies:**

- Sprint/Phase Tracking → All features (provides progress context)
- Workflow Orchestration → All features (enforces update patterns)
- Knowledge → Skills (knowledge references skills)
- Issues → Project Health (health creates issues)

---

## 1.4 Out of Scope (Not Building)

**Status**: ✅ COMPLETE

**Explicitly Excluded from MVP:**

1. Real-time collaboration (async only)
2. Mobile apps (web only)
3. External integrations beyond MCP (no Jira/GitHub sync)
4. Advanced analytics (basic metrics only)
5. Multi-tenant (single project only)
6. Cloud hosting (local/self-hosted only)
7. User authentication (solo developer, no auth needed)
8. Custom workflow definitions (12 predefined workflows only, customization post-MVP)
9. Bidirectional markdown sync (DB → markdown only, markdown is read-only)

---

## 1.5 Phase 1 Summary

**Status**: ✅ COMPLETE (60 minutes)

**Checklist**:

- [x] User personas defined (2 personas: AI Agent + Developer)
- [x] Core features identified (8 features with detailed scope)
- [x] Feature priorities defined (P0-P3)
- [x] Out of scope items listed (9 exclusions)
- [x] Dependencies mapped
- [x] User confirmation received

**Next Phase**: Phase 3 - UX/UI Design Philosophy (15 min)

---

# Phase 3: UX/UI Design Philosophy

**Status**: ✅ COMPLETE
**Goal**: Define UI role in agent-first architecture
**Time Spent**: 10 minutes

---

## 3.1 UI Role in Agent-First Architecture

**Core Principle**: UI serves BOTH monitoring AND full manual CRUD functionality

### UI Design Philosophy

**Primary Purpose (50% of UI use):**

1. **Manual CRUD Operations** - Create, edit, delete issues, skills, knowledge, wiki, workflows
2. **Rich Editing** - WYSIWYG editors, drag-and-drop, autocomplete for all content
3. **Configuration** - Adjust workflows, personas, preferences
4. **Data Management** - Browse, search, filter, organize all features

**Secondary Purpose (50% of UI use):** 5. **Dashboard Monitoring** - Human quick-checks project health 6. **Visual Progress** - Charts, graphs, hierarchy trees for phase/sprint tracking 7. **Agent Activity Feed** - What agents are doing in real-time 8. **Debugging** - View agent logs, trace workflow execution

**Why This Balance**:

- Agents use MCP 95% of time for automation
- Humans need COMPLETE UI functionality (not just monitoring)
- Existing Issue pages already demonstrate this (built human-first)
- UI must support both agent-created content review AND manual creation

### UI vs MCP Interaction Split

| Feature                               | Agent Interaction (MCP)        | Human Interaction (UI)                             | UI Priority         |
| ------------------------------------- | ------------------------------ | -------------------------------------------------- | ------------------- |
| **Issues**                            | Bulk create, auto-tag, query   | **Manual CRUD, review, approve** (ALREADY PERFECT) | **HIGH**            |
| **Skills** (NEW PAGE)                 | Auto-load, keyword-based       | **Browse catalog, create/edit skills**             | **HIGH (MVP)**      |
| **Knowledge**                         | Smart retrieval, graph queries | **Manual CRUD, search, graph view**                | **HIGH**            |
| **Wiki**                              | Auto-generate, update          | **Manual CRUD, rich editor**                       | **MEDIUM**          |
| **Project Health** (RENAMED)          | Auto-scan, create findings     | **Review dashboard, manual add, prioritize**       | **HIGH**            |
| **Personas**                          | Auto-create, activate          | **Browse, manual CRUD**                            | **MEDIUM**          |
| **Workflow Orchestration** (NEW PAGE) | State tracking, checkpoint     | **View status, create/edit workflows**             | **HIGH (MVP)**      |
| **Sprint/Phase Tracking** (NEW PAGE)  | Update progress, sync markdown | **Interactive hierarchy, visual diagrams**         | **VERY HIGH (MVP)** |

**Insight:** ALL features need full CRUD UI. Issues pages already demonstrate this perfectly. New pages needed: Skills, Workflow, Sprint/Phase Tracking (all MVP priority).

---

## 3.2 Pages to Build (All MVP Priority)

### Existing Pages (Already Built - 87.5% Complete)

✅ **Dashboard** - Overview, stats, activity feed
✅ **Issues List** - Browse issues (PERFECT, built human-first)
✅ **Issue Detail** - View/edit single issue (PERFECT)
✅ **Knowledge** - Browse/search knowledge items
✅ **Wiki** - Browse/edit wiki pages
✅ **Project Health** (renamed from Security) - Health dashboard, findings
✅ **Agents (Personas)** - Browse/manage agent personas
✅ **Command Palette** - Quick navigation

### New Pages to Add (MVP Priority)

**Priority 1: Sprint/Phase Tracking Page** (NEW - MVP)

- Interactive hierarchical tree view (Phase → Week → Day → Task → Session) - **5 levels**
- Visual diagrams (Gantt chart, burndown, flow charts)
- Progress charts at each level
- Click-to-expand hierarchy
- Drag-and-drop reordering (post-MVP)
- Status indicators (🟢 Complete, 🟡 In Progress, ⚪ Not Started)
- Manual CRUD: Create/edit phases, weeks, days, tasks, sessions

**Priority 2: Workflow Orchestration Page** (NEW - MVP)

- List all 12 workflows with status
- Current workflow visualization (which step agent is on)
- Workflow progress bars
- Checkpoint history timeline
- Failure/retry indicators
- Manual CRUD: Create new workflows, edit current workflows
- Enable/disable/delete workflows (post-MVP)

**Priority 3: Skills Page** (NEW - MVP)

- Browse all skills by category (framework, testing, workflow, troubleshooting)
- Search/filter skills by keywords
- View skill details (frontmatter + content)
- Manual CRUD: Create new skills, edit existing skills
- Skill usage analytics (post-MVP)
- Token cost calculator

---

## 3.3 Editor Requirements (MVP)

**All editors must be RICH, not simple textareas:**

**WYSIWYG Editors (MVP):**

- Wiki page content editor
- Issue description editor
- Knowledge item editor
- Skill content editor
- Markdown preview + live editing

**Drag-and-Drop (MVP where applicable):**

- File attachments (issues, wiki, knowledge)
- Image uploads (wiki)
- Reordering lists (post-MVP for Sprint/Phase)

**Autocomplete (MVP):**

- Tag/label autocomplete
- File path autocomplete
- Agent persona autocomplete
- Workflow step autocomplete
- Cross-reference autocomplete (@issue-42, @wiki/auth)

**Rich Components:**

- Code syntax highlighting
- Emoji picker
- Link insertion dialog
- Table builder
- Checklist builder

**Recommended Libraries:**

- **TipTap** - WYSIWYG markdown editor (extensible, React-friendly)
- **React Dropzone** - Drag-and-drop file uploads
- **Downshift** - Autocomplete/combobox (accessible)
- **Prism** - Code syntax highlighting

**Rationale:** Humans need full editing capabilities to create and modify content manually. Existing Issue pages already demonstrate this (built human-first). All new pages should match this standard.

---

## 3.4 UI Technology Stack (Current)

**Frontend:**

- Next.js 14 App Router (Server Components for monitoring dashboards)
- React 18+ (Client Components for interactive controls)
- Tailwind CSS (neumorphic design system - Coral theme)
- shadcn/ui (component library)

**Charts/Visualization:**

- Recharts (for progress charts, burndown charts)
- React Flow (for workflow visualization - optional)
- D3.js (for knowledge graph - post-MVP)

**Current State:** 87.5% of UI complete (Week 1.5, 8 pages)

- ✅ Dashboard, Issues List, Issue Detail, Knowledge, Wiki, Project Health (renamed from Security), Agents (Personas), Command Palette
- ⏳ Responsive design pending (Phase 4 Day 8)
- 🆕 Need to ADD: Skills page, Workflow page, Sprint/Phase Tracking page (all MVP)

**Recommendation:** Continue with current UI implementation approach. Existing Issue pages are PERFECT (built human-first with full CRUD). Apply same pattern to new pages (Skills, Workflow, Sprint/Phase Tracking) with rich editors.

---

## 3.5 Phase 3 Summary

**Status**: ✅ COMPLETE (REVISED based on user feedback)

**Key Decisions:**

- ✅ UI purpose: BOTH monitoring AND full manual CRUD functionality (50/50 split)
- ✅ Existing Issue pages are PERFECT (built human-first), use as model for new pages
- ✅ Need to ADD 3 new pages (all MVP):
  - Skills page (browse/create skills with rich editor)
  - Workflow page (view/create/edit workflows)
  - Sprint/Phase Tracking page (interactive hierarchy + visual diagrams)
- ✅ Rename Security page → Project Health (already reflected in Feature 5)
- ✅ All editors must be RICH: WYSIWYG, drag-and-drop, autocomplete (not simple textareas)
- ✅ Current UI approach is excellent, extend to new pages
- ✅ Complete responsive design (Phase 4 Day 8)

**Next Phase**: Phase 4 - System Architecture (30-35 min)

---

# Phase 4: System Architecture Phase

**Status**: ✅ COMPLETE
**Goal**: Define database schema, APIs, MCP tools, and technical architecture
**Time Spent**: 35 minutes

---

## 4.1 Database Schema Design (Prisma)

### Core Tables (8 Features)

**Feature 1: Issues**

```prisma
model Issue {
  id          Int       @id @default(autoincrement())
  title       String
  description String?   @db.Text
  status      IssueStatus @default(OPEN)
  priority    IssuePriority @default(MEDIUM)
  createdBy   CreatedBy @default(AGENT)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Context injection
  files       IssueFile[]
  commits     IssueCommit[]
  relatedIssues IssueRelation[]

  // Relationships
  labels      Label[]
  comments    Comment[]

  @@index([status, priority])
  @@index([createdAt])
}

enum IssueStatus { OPEN, IN_PROGRESS, REVIEW, CLOSED }
enum IssuePriority { CRITICAL, HIGH, MEDIUM, LOW }
enum CreatedBy { AGENT, HUMAN }
```

**Feature 2: Skills**

```prisma
model Skill {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  category    String   // framework, testing, workflow, troubleshooting
  description String   @db.Text
  content     String   @db.Text // Markdown content
  triggers    String[] // Keywords for auto-invocation
  tokenEstimate Int
  lastUpdated DateTime @updatedAt
  createdBy   CreatedBy @default(AGENT)

  @@index([category])
  @@index([triggers])
}
```

**Feature 3: Knowledge (RAG + Graph)**

```prisma
model KnowledgeItem {
  id          Int       @id @default(autoincrement())
  content     String    @db.Text
  embedding   Unsupported("vector(384)") // pgvector for semantic search
  tags        String[]
  createdBy   CreatedBy @default(AGENT)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Full-text search
  searchVector Unsupported("tsvector")

  // Graph relationships
  outgoingRels KnowledgeRelationship[] @relation("KnowledgeFrom")
  incomingRels KnowledgeRelationship[] @relation("KnowledgeTo")

  @@index([tags])
  @@index([createdAt])
  @@index([searchVector], type: Gin)
}

model KnowledgeRelationship {
  id        Int       @id @default(autoincrement())
  from      KnowledgeItem @relation("KnowledgeFrom", fields: [fromId], references: [id])
  fromId    Int
  to        KnowledgeItem @relation("KnowledgeTo", fields: [toId], references: [id])
  toId      Int
  type      RelationType // REFERENCES, CONTRADICTS, EXTENDS
  strength  Float     @default(1.0) // Confidence score 0.0-1.0
  createdBy CreatedBy @default(AGENT)

  @@unique([fromId, toId, type])
  @@index([type])
}

enum RelationType { REFERENCES, CONTRADICTS, EXTENDS }
```

**Feature 4: Wiki**

```prisma
model WikiPage {
  id          Int       @id @default(autoincrement())
  slug        String    @unique // URL path
  title       String
  content     String    @db.Text // Markdown
  parentId    Int?      // Hierarchical structure
  parent      WikiPage? @relation("WikiHierarchy", fields: [parentId], references: [id])
  children    WikiPage[] @relation("WikiHierarchy")

  lastEditedBy CreatedBy @default(AGENT)
  autoGenerated Boolean  @default(false)
  sourceFiles  String[]  // Code files this doc is derived from

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([parentId])
}
```

**Feature 5: Project Health**

```prisma
model HealthFinding {
  id          Int       @id @default(autoincrement())
  category    FindingCategory // SECURITY, CODE_QUALITY, ACCESSIBILITY, PERFORMANCE, TECH_DEBT
  severity    Severity  // CRITICAL, HIGH, MEDIUM, LOW
  title       String
  description String    @db.Text
  file        String?
  lineNumber  Int?

  agentAnalysis String?  @db.Text // Agent's assessment
  proposedFix   String?  @db.Text // Agent-generated fix
  falsePositive Boolean  @default(false)
  status      FindingStatus @default(OPEN)

  scannerId   Int
  scanner     HealthScanner @relation(fields: [scannerId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([category, severity])
  @@index([status])
}

model HealthScanner {
  id          Int       @id @default(autoincrement())
  name        String    @unique // semgrep, eslint, lighthouse, axe-core
  lastRun     DateTime?
  nextRun     DateTime?
  findings    HealthFinding[]
}

enum FindingCategory { SECURITY, CODE_QUALITY, ACCESSIBILITY, PERFORMANCE, TECH_DEBT }
enum Severity { CRITICAL, HIGH, MEDIUM, LOW }
enum FindingStatus { OPEN, IN_PROGRESS, FIXED, FALSE_POSITIVE }
```

**Feature 6: Personas**

```prisma
model AgentPersona {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String    @db.Text
  systemPrompt String   @db.Text
  capabilities String[] // List of what this persona can do
  activationRules String @db.Text // When to auto-activate

  isActive    Boolean   @default(false)
  projectSpecific Boolean @default(true)
  parentPersonaId Int?   // Derived from template

  createdBy   CreatedBy @default(AGENT)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive])
}
```

**Feature 7: Workflow Orchestration**

```prisma
model Workflow {
  id          Int       @id @default(autoincrement())
  name        String    @unique // "5-step-protocol", "session-start", etc.
  description String    @db.Text
  steps       WorkflowStep[]
  currentStepId Int?
  status      WorkflowStatus @default(NOT_STARTED)

  startedAt   DateTime?
  completedAt DateTime?

  @@index([status])
}

model WorkflowStep {
  id          Int       @id @default(autoincrement())
  workflowId  Int
  workflow    Workflow  @relation(fields: [workflowId], references: [id])
  stepNumber  Int       // Order in workflow
  name        String
  description String    @db.Text
  required    Boolean   @default(true)
  completed   Boolean   @default(false)
  completedAt DateTime?

  @@unique([workflowId, stepNumber])
}

enum WorkflowStatus { NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED, FAILED }
```

**Feature 8: Sprint/Phase Tracking**

```prisma
model Phase {
  id          Int       @id @default(autoincrement())
  name        String
  description String?   @db.Text
  order       Int       // Phase 1, Phase 2, etc.
  status      TrackingStatus @default(NOT_STARTED)
  progress    Float     @default(0.0) // 0.0 - 1.0

  startDate   DateTime?
  endDate     DateTime?
  estimatedHours Float?
  actualHours    Float?

  weeks       Week[]

  @@index([order])
  @@index([status])
}

model Week {
  id          Int       @id @default(autoincrement())
  phaseId     Int
  phase       Phase     @relation(fields: [phaseId], references: [id])
  weekNumber  Int       // Week 1, Week 2, etc.
  status      TrackingStatus @default(NOT_STARTED)
  progress    Float     @default(0.0)

  days        Day[]

  @@unique([phaseId, weekNumber])
}

model Day {
  id          Int       @id @default(autoincrement())
  weekId      Int
  week        Week      @relation(fields: [weekId], references: [id])
  dayNumber   Int       // Day 1, Day 2, etc.
  status      TrackingStatus @default(NOT_STARTED)
  progress    Float     @default(0.0)

  tasks       Task[]

  @@unique([weekId, dayNumber])
}

model Task {
  id          Int       @id @default(autoincrement())
  dayId       Int
  day         Day       @relation(fields: [dayId], references: [id])
  title       String
  description String?   @db.Text
  status      TrackingStatus @default(NOT_STARTED)
  progress    Float     @default(0.0)

  sessions    Session[]

  @@index([status])
}

model Session {
  id          Int       @id @default(autoincrement())
  taskId      Int
  task        Task      @relation(fields: [taskId], references: [id])
  timestamp   String    // YYYYMMDD-HHMM format
  notes       String?   @db.Text
  tokenUsage  Int?

  startedAt   DateTime  @default(now())
  endedAt     DateTime?

  @@index([timestamp])
}

// Note: Subtask model removed - tasks fit within single agent conversation context

enum TrackingStatus { NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED }
```

**Markdown Sync Table**

```prisma
model MarkdownFile {
  id          Int       @id @default(autoincrement())
  path        String    @unique // STATUS.md, DEVELOPMENT_PLAN.md, etc.
  content     String    @db.Text // Auto-generated content
  lastSync    DateTime  @updatedAt
  sourceTable String    // Which table(s) generate this file
  readOnly    Boolean   @default(true) // Enforced by git hook

  @@index([path])
}
```

**Git Hook Protection**: Pre-commit hook prevents manual edits to auto-generated files. Agent-only edits after proper approval (similar to PR workflow).

---

## 4.2 MCP Tools Catalog (40+ Tools)

**Architecture**: Single MCP server installation exposing all tools

```json
// In Claude Code config (claude_desktop_config.json)
{
  "mcpServers": {
    "moksha-devhub": {
      "command": "node",
      "args": ["path/to/moksha-devhub-mcp/build/index.js"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

**One installation → All 40+ tools available** to any MCP-compatible agent (Claude Code, Codex, Cursor AI, Cascade)

### Issues Tools (5)

```typescript
- issues.create(data: IssueInput): Issue
- issues.createBulk(data: IssueInput[]): Issue[]
- issues.update(id: number, data: Partial<IssueInput>): Issue
- issues.query(filters: IssueFilters): Issue[]
- issues.link(issueId: number, relatedId: number): IssueRelation
```

### Skills Tools (4)

```typescript
- skills.list(): SkillFrontmatter[]
- skills.load(skillName: string): Skill
- skills.search(keywords: string[]): Skill[]
- skills.create(data: SkillInput): Skill
```

### Knowledge Tools (5)

```typescript
- knowledge.add(content: string, metadata: KnowledgeMetadata): KnowledgeItem
- knowledge.query(question: string, k: number = 5): KnowledgeItem[]
- knowledge.relate(fromId: number, toId: number, type: RelationType): KnowledgeRelationship
- knowledge.traverse(startId: number, depth: number = 2): KnowledgeGraph
- knowledge.semanticSearch(query: string, k: number = 5): KnowledgeItem[]
```

### Wiki Tools (5)

```typescript
- wiki.create(path: string, content: string): WikiPage
- wiki.update(path: string, content: string): WikiPage
- wiki.read(path: string): WikiPage
- wiki.search(query: string): WikiPage[]
- wiki.autoGenerate(sourceFiles: string[]): WikiPage[]
```

### Project Health Tools (4)

```typescript
- health.scan(scannerType: ScannerType): HealthScanResult
- health.findings(filters: FindingFilters): HealthFinding[]
- health.score(): ProjectHealthScore
- health.remediate(findingId: number, fix: string): HealthFinding
```

### Personas Tools (4)

```typescript
- personas.create(name: string, systemPrompt: string, capabilities: string[]): AgentPersona
- personas.list(): AgentPersona[]
- personas.activate(personaId: number): AgentPersona
- personas.deactivate(personaId: number): AgentPersona
```

### Workflow Tools (5)

```typescript
- workflow.start(workflowType: string): Workflow
- workflow.getCurrentStep(): WorkflowStep | null
- workflow.completeStep(stepId: number): WorkflowStep
- workflow.status(): WorkflowStatus
- workflow.recover(): WorkflowRecoveryPlan
```

### Sprint/Phase Tracking Tools (6)

```typescript
- sprint.create(phaseId: number, data: SprintInput): Week
- sprint.updateProgress(entityId: number, entityType: string, percentage: number): void
- sprint.getCurrentTask(): Task | null
- sprint.checkpoint(data: CheckpointInput): Session
- sprint.syncMarkdown(): MarkdownSyncResult
- sprint.getHierarchy(): ProjectHierarchy
```

### Dashboard Tools (4)

```typescript
- dashboard.getOverview(): DashboardOverview // Stats, recent activity, health score
- dashboard.getActivityFeed(limit: number = 20): AgentAction[] // Recent agent actions
- dashboard.getMetrics(): ProjectMetrics // Issues count, knowledge items, wiki pages
- dashboard.getAlerts(): Alert[] // Blockers, failed workflows, critical findings
```

**Total**: 42 MCP Tools (single server, all tools exposed automatically)

---

## 4.3 API Endpoints (RESTful + Server Actions)

### Issues API

```
GET    /api/issues              - List issues (with filters, pagination)
POST   /api/issues              - Create single issue
POST   /api/issues/bulk         - Create multiple issues
GET    /api/issues/[id]         - Get issue details
PUT    /api/issues/[id]         - Update issue
DELETE /api/issues/[id]         - Delete issue
POST   /api/issues/[id]/link    - Link related issue
```

### Knowledge API

```
GET    /api/knowledge           - List knowledge items
POST   /api/knowledge           - Add knowledge item
GET    /api/knowledge/[id]      - Get knowledge item
POST   /api/knowledge/query     - Smart retrieval (RAG + Graph)
POST   /api/knowledge/relate    - Create relationship
GET    /api/knowledge/graph     - Get knowledge graph
```

### Wiki API

```
GET    /api/wiki                - List all wiki pages
GET    /api/wiki/[slug]         - Get wiki page
POST   /api/wiki                - Create wiki page
PUT    /api/wiki/[slug]         - Update wiki page
POST   /api/wiki/auto-generate  - Auto-generate from code
```

### Project Health API

```
GET    /api/health/score        - Get project health score
GET    /api/health/findings     - List findings (with filters)
POST   /api/health/scan         - Run scanner
PUT    /api/health/findings/[id] - Update finding (remediate, mark false positive)
```

### Workflow API

```
GET    /api/workflows           - List all workflows
GET    /api/workflows/[id]      - Get workflow status
POST   /api/workflows/[id]/start - Start workflow
PUT    /api/workflows/steps/[id]/complete - Complete step
GET    /api/workflows/current   - Get current active workflow
```

### Sprint/Phase Tracking API

```
GET    /api/sprint/hierarchy    - Get full hierarchy (Phase → Week → Day → Task → Subtask → Session)
GET    /api/sprint/progress     - Get progress at all levels
POST   /api/sprint/checkpoint   - Create checkpoint
PUT    /api/sprint/update       - Update progress
POST   /api/sprint/sync         - Sync markdown files
GET    /api/sprint/markdown/[file] - Get generated markdown content
```

---

## 4.4 Markdown Sync Mechanism

**How It Works:**

1. **Database as Source of Truth**:
   - All progress tracked in Sprint/Phase tables
   - All workflows tracked in Workflow tables
   - All tasks tracked in Task/Subtask tables

2. **Auto-Generation Triggers**:
   - On every `sprint.updateProgress()` call
   - On every `sprint.checkpoint()` call
   - On every workflow step completion
   - Manual trigger via `sprint.syncMarkdown()`

3. **Template-Based Generation**:

   ```
   STATUS.md ← Template + Query(SELECT * FROM Phase, Week, Day...)
   DEVELOPMENT_PLAN.md ← Template + Query(SELECT * FROM Phase WHERE ...)
   current-todos.md ← Template + Query(SELECT * FROM Task, Subtask WHERE status != COMPLETED)
   current-plan.md ← Latest plan from workflow state
   current-session-[timestamp].md ← Query(SELECT * FROM Session WHERE timestamp = ...)
   ```

4. **Read-Only Enforcement**:
   - Markdown files stored in `MarkdownFile` table
   - **Git pre-commit hook** prevents manual edits to auto-generated files
   - Agent-only edits after proper approval (PR-like workflow)
   - UI displays "Auto-generated - Edit via app" banner

5. **Sync Process** (Pseudocode):

   ```typescript
   async function syncMarkdown() {
     // 1. Query hierarchy
     const hierarchy = await getFullHierarchy();

     // 2. Generate STATUS.md
     const statusContent = generateStatusMarkdown(hierarchy);
     await saveMarkdownFile('STATUS.md', statusContent);

     // 3. Generate DEVELOPMENT_PLAN.md
     const planContent = generateDevelopmentPlanMarkdown(hierarchy);
     await saveMarkdownFile('DEVELOPMENT_PLAN.md', planContent);

     // 4. Generate current-todos.md
     const todos = await getActiveTasks();
     const todosContent = generateTodosMarkdown(todos);
     await saveMarkdownFile('current-todos.md', todosContent);

     // 5. Write to filesystem
     await writeFiles();
   }
   ```

---

## 4.5 Knowledge Graph Implementation (Token-Efficient Retrieval)

**Agent-First Retrieval Strategy:**

**Problem**: Full graph traversal = high token cost
**Solution**: Smart retrieval with relevance scoring

**Retrieval Algorithms:**

1. **Semantic Search** (pgvector):

   ```sql
   SELECT *, embedding <=> $query_embedding AS distance
   FROM KnowledgeItem
   ORDER BY distance
   LIMIT $k;
   ```

2. **Full-Text Search** (tsvector):

   ```sql
   SELECT *, ts_rank(searchVector, to_tsquery($query)) AS rank
   FROM KnowledgeItem
   WHERE searchVector @@ to_tsquery($query)
   ORDER BY rank DESC
   LIMIT $k;
   ```

3. **Hybrid Search** (Combine both):

   ```sql
   WITH semantic AS (...),
        fulltext AS (...)
   SELECT DISTINCT ON (id) *
   FROM (
     SELECT *, 0.7 * semantic_score + 0.3 * fulltext_score AS combined_score
     FROM semantic JOIN fulltext USING (id)
   )
   ORDER BY combined_score DESC
   LIMIT $k;
   ```

4. **Graph Traversal** (Limited depth):
   ```sql
   WITH RECURSIVE related AS (
     SELECT * FROM KnowledgeItem WHERE id = $startId
     UNION ALL
     SELECT k.* FROM KnowledgeItem k
     JOIN KnowledgeRelationship r ON k.id = r.toId
     JOIN related ON r.fromId = related.id
     WHERE depth < $maxDepth
   )
   SELECT * FROM related;
   ```

**Token Optimization:**

- Only retrieve top-K most relevant (K=5 default)
- Include relationship metadata (type, strength) for context
- Avoid loading full content; return summaries first
- Agent decides whether to expand relationships

**Example Agent Flow:**

```
Agent: "How do I implement authentication?"

1. Semantic search for "authentication" → Top 5 results
2. Check relationships → Found "authentication REFERENCES oauth-setup"
3. Load oauth-setup (1 hop away) → Include in context
4. Total: 6 knowledge items (not entire graph)
5. Token cost: ~1,200 tokens (vs 10,000+ for full graph)
```

---

## 4.6 Phase 4 Summary

**Status**: ✅ COMPLETE (APPROVED by user)

**Key Decisions:**

- ✅ Database schema for 8 features defined (10 core models) - **5-level hierarchy** (removed Subtask)
- ✅ 42 MCP tools cataloged across 9 features (includes Dashboard) - **Single MCP server** installation
- ✅ RESTful API endpoints designed
- ✅ Markdown sync mechanism designed (DB → markdown auto-generation) - **Git hook protection**
- ✅ Knowledge graph retrieval optimized for token efficiency (hybrid search + limited depth traversal) - **Best feature**

**User Approval**:

- ✅ 5-level hierarchy accepted (Phase → Week → Day → Task → Session)
- ✅ Knowledge graph approach approved (hybrid search + limited traversal)
- ✅ All 12 workflows tracked as state machines
- ✅ Git hook to prevent manual markdown edits
- ✅ Single MCP server with 42 tools

**Next Phase**: Phase 10 - Security & Autonomy (10 min)

---

# Phase 10: Security Audit Phase

**Status**: ✅ COMPLETE
**Goal**: Define agent autonomy boundaries and safety mechanisms
**Time Spent**: 10 minutes

---

## 10.1 Agent Autonomy Levels

**Define what agents CAN and CANNOT do autonomously**

### Level 1: Full Autonomy (No Human Approval)

**Agents can perform these actions freely:**

1. **Read Operations** (All features):
   - Query issues, knowledge, wiki, health findings
   - Read sprint/phase tracking progress
   - Load skills, list personas
   - View workflow status

2. **Create Operations** (Non-destructive):
   - Create issues (from audits, testing, implementation)
   - Add knowledge items
   - Create skills (project-specific patterns)
   - Log sessions and checkpoints

3. **Update Operations** (Progress tracking):
   - Update sprint/phase progress percentages
   - Mark todos as complete
   - Update workflow step completion
   - Sync markdown files

4. **Generate Operations** (Content creation):
   - Auto-generate wiki pages from code
   - Create agent personas (project-specific)
   - Propose fixes for health findings (not apply)

### Level 2: Approval Required (Human Confirmation)

**Agents MUST request approval for:**

1. **Destructive Operations**:
   - Delete issues, knowledge items, wiki pages
   - Archive or remove data
   - Reset sprint/phase progress

2. **External Actions**:
   - Git operations (commit, push, merge)
   - Deploy to production
   - Run security scans (may have performance impact)

3. **Configuration Changes**:
   - Modify workflows (add/remove steps)
   - Change persona activation rules
   - Update scanner configurations

4. **High-Impact Fixes**:
   - Apply proposed fixes for CRITICAL security findings
   - Merge auto-generated wiki content that conflicts with manual edits

### Level 3: Forbidden (Never Allow)

**Agents are NEVER allowed to:**

1. **Security-Critical**:
   - Modify environment variables (DATABASE_URL, API keys)
   - Change authentication/authorization settings
   - Disable security scanners

2. **Data Integrity**:
   - Drop database tables
   - Truncate data
   - Bypass validation schemas

3. **System-Level**:
   - Modify Prisma schema without approval
   - Change Docker configurations
   - Install new dependencies without approval

---

## 10.2 Safety Mechanisms

**How to prevent agent mistakes and enable recovery**

### 1. Audit Trail

**Track ALL agent actions:**

```prisma
model AgentAction {
  id          Int       @id @default(autoincrement())
  actionType  String    // create, update, delete, query
  feature     String    // issues, knowledge, wiki, etc.
  entityId    Int?      // ID of affected entity
  payload     Json?     // Request payload
  result      Json?     // Response
  success     Boolean
  errorMessage String?  @db.Text

  timestamp   DateTime  @default(now())
  agentType   String    // claude-code, codex, cursor, etc.
  sessionId   Int?      // Link to Session

  @@index([actionType, feature])
  @@index([timestamp])
}
```

**Benefits:**

- Full traceability (who did what when)
- Debugging failed operations
- Rollback capability
- Security analysis

### 2. Rollback System

**Enable undo for agent actions:**

```prisma
model Rollback {
  id          Int       @id @default(autoincrement())
  actionId    Int       // Link to AgentAction
  beforeState Json      // State before change
  afterState  Json      // State after change
  rolledBack  Boolean   @default(false)
  rolledBackAt DateTime?

  @@index([actionId])
}
```

**Rollback MCP Tool:**

```typescript
- rollback.undo(actionId: number): RollbackResult
- rollback.history(entityId: number): RollbackHistory[]
```

**Example:**

```
Agent creates issue #42 with wrong data
→ Human: "Rollback action 1234"
→ System: Deletes issue #42, restores previous state
```

### 3. Validation Guards

**Prevent invalid operations:**

1. **Schema Validation** (Zod):
   - All API inputs validated before processing
   - Type-safe operations (TypeScript + Prisma)

2. **Business Rules**:
   - Cannot mark task complete if subtasks incomplete
   - Cannot delete knowledge item if referenced by others
   - Cannot delete persona if currently active

3. **Rate Limiting**:
   - Max 100 issues created per minute
   - Max 50 knowledge items per minute
   - Prevent accidental bulk operations

### 4. Dry-Run Mode

**Test operations before executing:**

```typescript
- *.dryRun(data): SimulationResult

Example:
- issues.createBulk(data, { dryRun: true })
  → Returns: "Would create 50 issues (20 duplicates detected)"
```

### 5. Approval Workflow

**For Level 2 operations:**

```prisma
model ApprovalRequest {
  id          Int       @id @default(autoincrement())
  actionType  String
  description String    @db.Text
  payload     Json

  status      ApprovalStatus @default(PENDING)
  requestedAt DateTime  @default(now())
  respondedAt DateTime?
  respondedBy String?   // human or agent

  @@index([status])
}

enum ApprovalStatus { PENDING, APPROVED, REJECTED }
```

**Workflow:**

```
1. Agent: "I want to delete issue #42"
2. System: Creates ApprovalRequest, notifies human
3. Human: Approves via UI
4. System: Executes delete, logs to AgentAction
```

---

## 10.3 Security Checklist

**Ensure agent operations are secure:**

### Authentication & Authorization

- ✅ **No auth for MVP** (solo developer, local-only)
- 🔮 **Post-MVP**: API key per agent, permission scopes
- ✅ Audit trail tracks which agent performed action
- ✅ Rate limiting prevents abuse

### Input Validation

- ✅ Zod schemas for all API inputs
- ✅ SQL injection prevented (Prisma parameterized queries)
- ✅ XSS prevention (React escapes output, markdown sanitized)
- ✅ Command injection prevention (no `eval()`, no shell commands from user input)

### Data Integrity

- ✅ Database transactions for multi-step operations
- ✅ Foreign key constraints enforced
- ✅ Unique constraints (prevent duplicate personas, workflows)
- ✅ Rollback capability for mistakes

### Secrets Management

- ✅ Environment variables for DATABASE_URL
- ✅ `.env.local` in `.gitignore`
- ⚠️ **Warning**: Agents CANNOT modify `.env.local`

### Dependency Security

- ✅ Regular `npm audit` runs
- ✅ Dependabot enabled (GitHub)
- ✅ Lock file committed (pnpm-lock.yaml)

---

## 10.4 Error Handling

**How agents handle failures:**

### Error Types

1. **Validation Errors** (400):
   - Return detailed Zod error messages
   - Agent can retry with corrected input

2. **Not Found** (404):
   - Entity doesn't exist
   - Agent should check if entity was deleted

3. **Conflict** (409):
   - Duplicate entity (e.g., persona with same name)
   - Agent should choose different name or update existing

4. **Server Error** (500):
   - Database connection failed
   - Agent should retry with exponential backoff

### Retry Strategy

```typescript
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2 ** i * 1000); // Exponential backoff
    }
  }
}
```

### Error Reporting

**All errors logged to AgentAction table:**

- Error type (validation, not_found, server_error)
- Error message
- Stack trace (for debugging)
- Retry count

**Agent sees:**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [{ "field": "title", "message": "Title must be 1-200 characters" }]
}
```

---

## 10.5 Phase 10 Summary

**Status**: ✅ COMPLETE (APPROVED by user)

**Key Decisions:**

- ✅ Three autonomy levels defined (Full, Approval Required, Forbidden) - **User approved**
- ✅ Audit trail for all agent actions (AgentAction table)
- ✅ Rollback system for mistake recovery
- ✅ Validation guards (Zod, business rules, rate limiting)
- ✅ Dry-run mode for testing operations
- ✅ Approval workflow for Level 2 operations
- ✅ Security checklist (auth, validation, data integrity, secrets)
- ✅ Error handling with retry strategy

**User Approval**:

- ✅ 3 autonomy levels perfect for workflow
- ✅ Safety mechanisms acceptable considering AI hallucinations
- ✅ Restrictions appropriate (env vars, schema, Docker)

**Agent Safety**: Balanced autonomy with safety - agents can work freely but with guardrails to prevent destructive mistakes.

---

# 🎉 Planning Session COMPLETE

**Status**: ✅ ALL PHASES COMPLETE (90 minutes total)

---

## Session Summary

**Phases Completed:**

1. ✅ Phase 1: Product Manager Phase (User Personas & Scope) - 60 min
2. ✅ Phase 3: UX/UI Design Philosophy - 10 min
3. ✅ Phase 4: System Architecture Phase - 35 min
4. ✅ Phase 10: Security Audit Phase - 10 min

**Total Time**: ~115 minutes (extended from 75 min estimate due to architecture complexity)

---

## Key Architectural Decisions

### 1. Agent-First Philosophy

- **Primary Users**: AI Agents (95% interaction via MCP)
- **Secondary Users**: Humans (5% monitoring/override via UI)
- **UI Purpose**: Monitoring, visual representation, manual overrides

### 2. Feature Set (8 Core Features)

1. **Issues** - Bug/task tracking with bulk creation
2. **Skills** - Framework patterns (92% token reduction)
3. **Knowledge** - RAG + Graph hybrid (token-efficient retrieval)
4. **Wiki** - Auto-generated documentation
5. **Project Health** - Security + code quality + tech debt
6. **Personas** - Agent-created, project-specific
7. **Workflow Orchestration** - Track 12 workflows, enforce consistency
8. **Sprint/Phase Tracking** - Hierarchical progress, auto-markdown sync

### 3. Database Architecture

- **11 Core Models**: Issue, Skill, KnowledgeItem, WikiPage, HealthFinding, AgentPersona, Workflow, Phase/Week/Day/Task/Subtask/Session
- **Markdown Sync**: Database → Auto-generate markdown (STATUS.md, etc.)
- **Read-Only Files**: Agents update DB, DB updates files

### 4. MCP Integration

- **38 MCP Tools** across 8 features
- **Universal Agent Access**: Claude Code, Codex, Cursor AI, Cascade
- **Token Optimization**: Smart retrieval (top-K results, limited depth)

### 5. Agent Autonomy

- **Level 1 (Full)**: Read, create issues/knowledge, update progress
- **Level 2 (Approval)**: Delete, git ops, config changes
- **Level 3 (Forbidden)**: Security-critical, data integrity, system-level
- **Safety**: Audit trail, rollback, validation, dry-run, approval workflow

---

## Implementation Priorities

### P0 (Must Build First):

1. Sprint/Phase Tracking (foundation for progress)
2. Workflow Orchestration (enforce consistency)
3. Issues (core task tracking)

### P1 (High Priority):

4. Knowledge (RAG + Graph for context)
5. Skills (token-efficient patterns)

### P2 (Medium Priority):

6. Wiki (documentation)
7. Project Health (quality tracking)

### P3 (Low Priority):

8. Personas (nice-to-have for MVP)

---

## Next Steps

### Immediate Actions:

1. **Review this planning document** - Confirm all decisions
2. **Create implementation roadmap** - Break P0 features into sprints
3. **Database schema implementation** - Start with Prisma migrations
4. **MCP server setup** - Implement 38 tools

### Implementation Phases:

- **Phase A**: Database + API (Sprint/Phase, Workflow, Issues)
- **Phase B**: Knowledge System (RAG + Graph)
- **Phase C**: Remaining Features (Wiki, Health, Personas, Skills)
- **Phase D**: UI Dashboards (Sprint tracking, Workflow status)
- **Phase E**: Safety + Security (Audit trail, rollback, approvals)

---

## User Approval Summary (2025-11-02)

**All architectural decisions APPROVED:**

✅ **Database Schema**: 10 Prisma models (5-level hierarchy, removed Subtask)
✅ **Markdown Sync**: Auto-generation (DB → files) with git hook protection
✅ **Feature Priorities**: P0 (Sprint, Workflow, Issues) → P1 (Knowledge, Skills) → P2 (Wiki, Health) → P3 (Personas)
✅ **Agent Autonomy**: 3 levels (Full, Approval Required, Forbidden) - perfect for workflow
✅ **MCP Tools**: 42 tools sufficient (single server architecture)
✅ **Knowledge Graph**: Hybrid approach (semantic + full-text + limited traversal) - **"perfect, exactly what I wanted, best feature"**
✅ **Safety Mechanisms**: Acceptable considering AI hallucinations
✅ **UI Pages**: Add 3 new pages (Skills, Workflow, Sprint/Phase Tracking) - all MVP
✅ **Editors**: Rich editors (WYSIWYG, drag-and-drop, autocomplete) for all content

**MCP Architecture Clarification**:

- Single MCP server installation (`moksha-devhub`)
- Exposes all 42 tools automatically
- One config entry in Claude Code → all tools available
- Works with any MCP-compatible agent (Claude Code, Codex, Cursor AI, Cascade)

---

**Ready to begin implementation!**

**Saved Planning Document**: [PLANNING_PHASES_moksha-devhub-agent-first.md](./PLANNING_PHASES_moksha-devhub-agent-first.md)

**Total Pages**: 1,800+ lines of comprehensive architectural planning

🚀 **Agent-first architecture fully defined and approved!**

---

# 🎉 Planning Session COMPLETE

**Status**: ✅ ALL PHASES COMPLETE & APPROVED (2025-11-02)

**Phases Completed:**

1. ✅ Phase 1: Product Manager Phase (User Personas & Core Features) - APPROVED
2. ✅ Phase 3: UX/UI Design Philosophy (REVISED based on feedback) - APPROVED
3. ✅ Phase 4: System Architecture (10 models, 42 MCP tools) - APPROVED
4. ✅ Phase 10: Security & Autonomy (3 levels, 5 safety systems) - APPROVED

**Total Time**: ~120 minutes (extended due to architecture complexity)

**Next Step**: Implementation Roadmap → **[IMPLEMENTATION_ROADMAP_moksha-devhub.md](IMPLEMENTATION_ROADMAP_moksha-devhub.md)**

---

# Implementation Roadmap

**See**: [IMPLEMENTATION_ROADMAP_moksha-devhub.md](IMPLEMENTATION_ROADMAP_moksha-devhub.md)

**Summary**:

- **Duration**: 16 weeks (solo developer)
- **Phases**: 5 major phases (A through E)
- **Approach**: Iterative - agent automation FIRST, UI SECOND

**Phase Breakdown**:

1. **Phase A** (Weeks 1-4): Foundation - Database, API, MCP server skeleton, git hooks
2. **Phase B** (Weeks 5-8): P1 Features - Knowledge graph (hybrid search), Skills system
3. **Phase C** (Weeks 9-12): P2 Features + UI - Wiki, Health, New pages (Sprint/Workflow/Skills)
4. **Phase D** (Weeks 13-14): P3 Features + Safety - Personas, Audit trail, Rollback, Approvals
5. **Phase E** (Weeks 15-16): Production - Optimization, documentation, launch

**Start with**: Phase A, Week 1 - Database Schema & Migrations

---
