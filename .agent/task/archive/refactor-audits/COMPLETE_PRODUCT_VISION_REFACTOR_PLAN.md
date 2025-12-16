# Complete Product Vision Refactor Plan

**Created:** 2025-11-10
**Purpose:** Align ALL documentation with correct product vision
**Executor:** GPT-high (large context model)
**Status:** Ready for execution

---

## Executive Summary

### The Problem

Documentation describes ProjectPulse as a **"meta-platform that generates .agent/ folders"** but the actual product is a **"web-based project management platform that REPLACES .agent/ folders"**.

### The Confusion

**Current Documentation Says:**
- "ProjectPulse generates CLAUDE.md, memory banks, skills for user's projects"
- "Onboarding creates complete .agent/ folder"
- "Meta-platform vision: generates agent workflow infrastructure"

**Actual Product Vision:**
- ProjectPulse is a **web application** (database + UI + MCP API)
- End users store ALL project data in ProjectPulse database (NOT in repo files)
- User's repository stays CLEAN (no .agent/ folder clutter)
- Agents connect via MCP to CRUD data in ProjectPulse
- Humans view data via web UI (wiki, issues, knowledge base, etc.)

### Impact

This misalignment appears in:
- ✗ Main documentation (PRD, SRS, Architecture)
- ✗ .agent/ memory bank files
- ✗ Skills documentation
- ✗ CLAUDE.md integration guide
- ✗ Project plan and backlog
- ✗ MCP tool descriptions

**Estimated files affected:** 40+ files, 15,000+ lines

---

## Correct Product Vision

### What ProjectPulse Actually IS

**A web-based project management platform that replaces filesystem-based agent workflows with database-backed, UI-accessible project management.**

### End User Journey (Correct Vision)

```
1. Developer (end user) visits projectpulse.com
   └─> Creates new project "My E-commerce App"
   └─> Gets API key for MCP connection

2. Opens IDE, starts Claude Code/Cursor AI
   └─> Agent connects to ProjectPulse via MCP
   └─> Agent reads onboarding prompt from ProjectPulse

3. Onboarding (3 Sessions - Guided by ProjectPulse):
   Session 1: ProjectPulse prompts agent → "Ask user 10 questions"
              → Agent collects executive summary
              → Agent stores in ProjectPulse database (via MCP)

   Session 2: ProjectPulse prompts agent → "Generate PRD, SRS, Architecture"
              → Agent generates industry docs
              → Agent stores in ProjectPulse database (via MCP)

   Session 3: ProjectPulse prompts agent → "Create AI workflow blueprint"
              → Agent creates memory banks, skills, SOPs
              → Agent stores in ProjectPulse database (via MCP)

4. Daily Development:
   - Agent creates issues → via MCP → Visible in ProjectPulse Issues page
   - Agent stores docs → via MCP → Visible in ProjectPulse Wiki page
   - Agent queries knowledge → via MCP → RAG search in ProjectPulse
   - Agent creates tickets → via MCP → Visible in ProjectPulse Tickets page
   - Agent tracks progress → via MCP → Development Cycle page updates
   - User monitors via web UI → Dashboard, Wiki, Issues, Knowledge Base

5. Benefits:
   - User's repo stays CLEAN (no .agent/ folder, no markdown clutter)
   - All data searchable via UI (wiki search, knowledge RAG)
   - All data accessible via MCP (agent CRUD operations)
   - No context loss across sessions (database persistence)
```

### What End Users Get

**NOT:** .agent/ folder generated in their repo
**NOT:** CLAUDE.md file in their repo
**NOT:** Markdown files in their repo

**YES:** Web application at projectpulse.com with:
- Dashboard page (project overview)
- Wiki page (searchable documentation)
- Knowledge Base page (RAG system with semantic search)
- Issues page (bug/feature tracking)
- Tickets page (sprint work items)
- Development Cycle page (hierarchical progress: Sprint → Week → Day → Task)
- Agent Personas page (custom AI agents)
- Project Health page (security/quality/debt metrics)
- SOPs & Workflow page (custom procedures)

**YES:** MCP API for agents to:
- Create/read/update/delete issues
- Store/search wiki pages
- Store/query knowledge base
- Create/update tickets
- Track progress
- Generate onboarding prompts

### Key Differences

| Aspect | ❌ Wrong (Current Docs) | ✅ Correct (Actual Product) |
|--------|------------------------|----------------------------|
| **Output** | Generates .agent/ folder | Web app + Database |
| **Storage** | Files in user's repo | Database in ProjectPulse |
| **Access** | Filesystem (markdown files) | UI (web pages) + MCP (tools) |
| **Repo State** | Cluttered with .agent/ files | Clean (no .agent/ folder) |
| **Documentation** | CLAUDE.md in repo | Wiki page in web app |
| **Knowledge** | Markdown files | RAG database with search |
| **Progress** | STATUS.md file | Development Cycle page |
| **Onboarding** | Generates files locally | Stores in database remotely |

---

## Refactor Execution Plan

### Phase 1: Critical Main Documentation (Priority P0)

**Target:** 6 files, ~8,000 lines
**Effort:** 3-4 hours GPT-high time

#### File 1: `docs/01-PRD.md`

**Lines to Update:** 1-180 (Section 1: Project Overview)

**Current Issues:**
- Line 14: "generates complete agent workflow infrastructure"
- Line 16: "Complete CLAUDE.md with mandatory protocols"
- Line 17: "Structured knowledge files (.agent/)"
- Line 21: "produces a complete .agent/ folder"
- Line 23: "ProjectPulse generates CLAUDE.md, memory banks, skills"

**Required Changes:**

Replace Section 1.1 "Vision" entirely with:

```markdown
### 1.1 Vision

ProjectPulse is a **web-based project management platform** that replaces filesystem-based agent workflows with database-backed, UI-accessible project management.

**What It Does:**
- **Stores Project Data**: All documentation, issues, knowledge, and progress stored in database
- **Web UI for Humans**: Searchable wiki, visual dashboards, issue tracking
- **MCP API for Agents**: CRUD operations via MCP tools (no local files needed)
- **Clean Repositories**: User's repo stays free of .agent/ clutter

**Primary Use Case:**
Developer creates project in ProjectPulse → Agent connects via MCP → Agent follows onboarding prompts → Agent stores all data in ProjectPulse database → Human monitors via web UI → Repository stays clean.

**NOT a File Generator:** ProjectPulse does NOT generate .agent/ folders or CLAUDE.md files in user repos.
```

**Lines Affected:** 14-24 (replace entire "Vision" subsection)

---

Replace Section 1.2 "Onboarding as Core Philosophy" with:

```markdown
**Guided Onboarding Workflow:**

ProjectPulse provides **prompt templates** that guide agents through project initialization:

1. **Session 1 Prompt**: "Ask user these 10 questions about project vision..."
   → Agent collects answers → Stores in ProjectPulse database

2. **Session 2 Prompt**: "Generate PRD, SRS, Architecture based on: {executive_summary}..."
   → Agent generates docs → Stores in ProjectPulse database (visible in Wiki page)

3. **Session 3 Prompt**: "Create AI workflow blueprint: memory banks, skills, SOPs..."
   → Agent creates artifacts → Stores in ProjectPulse database

**Result:** All project data lives in ProjectPulse (database + UI), NOT in user's repo.
```

**Lines Affected:** 43-58 (replace entire "Onboarding as Core Philosophy" subsection)

---

#### File 2: `docs/02-SRS.md`

**Lines to Update:** 1-80 (Introduction and FR-001 to FR-025)

**Current Issues:**
- Line 28: "auto-sync to markdown files"
- Line 29: "Markdown files auto-generated from database"
- Multiple FRs reference "markdown sync"

**Required Changes:**

Line 28 "Purpose" for FR-001 to FR-025:
```markdown
**Purpose:** Hierarchical progress tracking stored in database and displayed in Development Cycle page (web UI)
```

Remove ALL references to:
- "Markdown sync"
- "Auto-generated files"
- "STATUS.md"
- "DEVELOPMENT_PLAN.md"

Add new section after FR-025:

```markdown
### 1.2 Web UI Pages (FR-026 to FR-050)

**Purpose:** Provide human-accessible web interface for project data stored in database

#### FR-026: Wiki Page

**Description:** Display all project documentation stored in database with search, categories, and rich formatting

**Inputs:**
- None (loads from WikiPage table)

**Outputs:**
- List of wiki pages grouped by category (Requirements, Architecture, API Docs, etc.)
- Search interface for finding pages
- Page viewer with syntax highlighting and markdown rendering

**MCP Tools:**
- `wiki.create({ title, content, category })` - Agent creates wiki page
- `wiki.search({ query })` - Agent searches wiki
- `wiki.update({ id, content })` - Agent updates page

**UI Features:**
- Search bar with full-text search
- Category filter (Requirements, Architecture, API, etc.)
- Page editor (manual creation/editing)
- Markdown preview

**Priority:** P0 (Critical - Core end user feature)

**Traceability:**
- PRD: Section 2.1 (Wiki feature)
- Architecture: Database WikiPage model
- Backlog: US-015 to US-020
```

**Lines Affected:** Add after line 80 (new section)

---

#### File 3: `docs/03-Architecture.md`

**Lines to Update:** Scan entire file, update System Context diagram

**Current Issues:**
- System diagram shows ".agent/ folder generation"
- Data flow shows "markdown file creation"

**Required Changes:**

Update System Context Diagram (if exists) to show:

```
┌─────────────────────────────────────────────┐
│           End User's Machine                │
│  ┌──────────────┐      ┌─────────────┐     │
│  │     IDE      │◄────►│  AI Agent   │     │
│  │  (VS Code)   │      │ (Claude)    │     │
│  └──────────────┘      └──────┬──────┘     │
│                               │             │
│                               │ MCP         │
└───────────────────────────────┼─────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────┐
        │       ProjectPulse (Cloud)            │
        │                                        │
        │  ┌──────────────┐  ┌──────────────┐  │
        │  │   Web UI     │  │  MCP API     │  │
        │  │  (Next.js)   │  │  (Tools)     │  │
        │  └──────┬───────┘  └──────┬───────┘  │
        │         │                  │          │
        │         └─────────┬────────┘          │
        │                   │                   │
        │         ┌─────────▼─────────┐         │
        │         │   PostgreSQL DB   │         │
        │         │  - Wiki pages     │         │
        │         │  - Issues         │         │
        │         │  - Knowledge      │         │
        │         │  - Tickets        │         │
        │         │  - Progress       │         │
        │         └───────────────────┘         │
        └───────────────────────────────────────┘

End User's Repo:
┌────────────────────┐
│  my-ecommerce-app/ │
│    ├── src/        │  ← CLEAN (no .agent/ folder)
│    ├── tests/      │  ← CLEAN (no markdown clutter)
│    └── package.json│
└────────────────────┘
```

Remove ALL sections about:
- ".agent/ folder generation"
- "File synchronization"
- "Markdown template rendering"

Add new section:

```markdown
## Data Flow: Agent → ProjectPulse → UI

### Create Issue Flow

1. **Agent (Claude Code):**
   ```typescript
   // Agent calls MCP tool
   await mcp.call("issue.create", {
     title: "Fix login bug",
     description: "Users can't login...",
     priority: "high"
   })
   ```

2. **MCP API (ProjectPulse):**
   ```typescript
   // Validates and stores in database
   const issue = await prisma.issue.create({
     data: { title, description, priority, projectId }
   })
   return { id: issue.id, status: "created" }
   ```

3. **Web UI (Next.js):**
   ```typescript
   // User opens Issues page
   const issues = await prisma.issue.findMany()
   return <IssueList issues={issues} />
   ```

**Result:** Agent creates issue → Database stores → UI displays → No repo files created
```

**Lines Affected:** Replace architecture diagrams and data flow sections

---

#### File 4: `docs/12-Backlog.md`

**Lines to Update:** Epic descriptions, user story acceptance criteria

**Current Issues:**
- EPIC-001 describes "markdown sync" as core feature
- User stories reference ".agent/ folder" generation

**Required Changes:**

Update EPIC-001 description:

```markdown
### EPIC-001: Progress Tracking & Web UI

**Description:**
Hierarchical progress tracking (Sprint → Week → Day → Task → Session) with database storage and web UI visualization in Development Cycle page.

**NOT Included:**
- Markdown file generation (not an end user feature)
- .agent/ folder creation (users don't need local files)

**Included:**
- Database models for hierarchy
- MCP tools for agents to track progress
- Development Cycle page (web UI) for humans to monitor progress
```

Update US-015 to US-025 acceptance criteria to remove:
- "STATUS.md file generated"
- "Markdown template renders"
- "Git hooks prevent manual edits"

Add:
- "Development Cycle page displays hierarchy"
- "MCP tools allow progress updates"
- "Web UI shows real-time progress"

**Lines Affected:** EPIC-001 section and US-015 to US-025 acceptance criteria

---

#### File 5: `docs/13-Project-Plan.md`

**Lines to Update:** Sprint 2 deliverables (lines 656-779)

**Current Issues:**
- Sprint 2 entirely focused on "markdown sync"
- Deliverables: MarkdownFile table, template engine, sync service

**Required Changes:**

Replace Sprint 2 section entirely:

```markdown
### Sprint 2 (Weeks 3-4): Wiki Page + Onboarding System - 58 points

**User Stories:** US-015 to US-031

**Goal:** Build core end user features - Wiki page for documentation and onboarding prompt system

**Key Deliverables:**

**1. Wiki Page (UI + Backend):**
- WikiPage database model (title, slug, content, category, projectId)
- Wiki list page at `/wiki` (search, filter by category)
- Wiki detail page at `/wiki/[slug]` (markdown rendering, syntax highlighting)
- Wiki editor (create/edit pages manually)
- MCP tools: `wiki.create()`, `wiki.search()`, `wiki.update()`, `wiki.delete()`

**2. Onboarding Prompt System:**
- OnboardingSession table (sessionNumber, promptTemplate, response)
- Prompt templates for Sessions 1, 2, 3
- MCP tool: `onboarding.getPrompt(sessionNumber)` returns prompt
- MCP tool: `onboarding.submitResponse(sessionNumber, data)` stores response
- Admin UI to configure prompts

**3. MCP Server Enhancement:**
- Add 8 new tools (wiki.*, onboarding.*)
- Authentication via API key
- Request validation with Zod schemas
- Error handling and logging

**Agent Workflow Example:**
```
Agent connects to ProjectPulse MCP
→ Calls: onboarding.getPrompt(1)
→ Receives: "Ask user these 10 questions: 1. What is your project? ..."
→ Agent asks user, collects answers
→ Calls: onboarding.submitResponse(1, { summary: "E-commerce app..." })
→ ProjectPulse stores in database

Next session:
→ Calls: onboarding.getPrompt(2)
→ Receives: "Generate PRD based on: {summary from session 1}..."
→ Agent generates PRD
→ Calls: wiki.create({ title: "PRD", content: "...", category: "requirements" })
→ User opens /wiki in browser → Sees PRD in searchable wiki
```

**Architecture Requirements:**

```prisma
model WikiPage {
  id          Int      @id @default(autoincrement())
  projectId   Int
  title       String
  slug        String
  content     Text
  category    String   // "requirements", "architecture", "api", "guides"
  createdBy   String   // "agent" or "user"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, slug])
  @@index([category])
}

model OnboardingSession {
  id             Int      @id @default(autoincrement())
  projectId      Int
  sessionNumber  Int      // 1, 2, 3
  promptTemplate String   // Template text with {variables}
  response       Json?    // User/agent responses
  status         String   // "pending", "complete"
  completedAt    DateTime?

  @@unique([projectId, sessionNumber])
}
```

**Exit Criteria:**
- ✅ Wiki page displays all docs with search
- ✅ MCP tools create/search wiki pages successfully
- ✅ Onboarding prompts return templates
- ✅ Agent can complete Session 1 → stores executive summary
- ✅ User can view stored data in wiki UI

**Testing:**
- E2E test: Agent creates wiki page → User sees it in UI
- Integration test: Onboarding flow (Session 1 → Session 2 → Session 3)
- Performance test: Wiki search <200ms

**Dependencies:** Sprint 1 (database must exist)

**Risks:**
- None (straightforward CRUD + UI)
```

**Lines Affected:** 656-779 (replace entire Sprint 2 section)

---

#### File 6: `.agent/project-brief.md`

**Lines to Update:** Entire "Core Mission" and "Primary Goals" sections

**Current Issues:**
- Line 11: "generates agent workflow infrastructure"
- Line 26: "Generates agent workflow infrastructure for users' projects"

**Required Changes:**

Replace lines 9-44 entirely:

```markdown
## Core Mission

Build a web-based project management platform that replaces filesystem-based agent workflows with database-backed, UI-accessible project management.

**What We're Building:**
- Web application (Next.js + PostgreSQL + MCP API)
- Stores ALL project data in database (docs, issues, knowledge, progress)
- Web UI for humans (wiki, dashboards, search)
- MCP API for agents (CRUD operations)

**What We're NOT Building:**
- .agent/ folder generator
- CLAUDE.md file creator
- Markdown template system (this is internal tooling for OUR development, not end user feature)

---

## Primary Goals

### 1. Web Application Platform

- **Wiki Page**: Searchable documentation (category filters, markdown rendering)
- **Knowledge Base**: RAG system with semantic search (pgvector)
- **Issues Page**: Bug/feature tracking with auto-tagging
- **Tickets Page**: Sprint work items with lifecycle tracking
- **Development Cycle**: Hierarchical progress visualization
- **Dashboard**: Project health, metrics, overview

### 2. MCP API for Agents

- **41 MCP Tools** across 9 feature categories
- **Authentication**: API key-based access
- **CRUD Operations**: Create/read/update/delete for all entities
- **Search**: Vector search for knowledge, full-text for wiki

### 3. Database-First Architecture

- **PostgreSQL as Source of Truth**: All data in database
- **No Local Files**: User's repo stays clean
- **Real-time Sync**: UI updates when agents modify data
- **Persistence**: No context loss across sessions

### 4. Guided Onboarding

- **Session 1**: Executive summary (10 questions prompt)
- **Session 2**: Industry docs generation (PRD, SRS, Architecture)
- **Session 3**: AI workflow blueprint (memory banks, skills, SOPs)
- **Storage**: All onboarding data stored in database (Wiki pages, Knowledge base)
```

**Lines Affected:** 9-44 (replace entire sections)

---

### Phase 2: .agent/ Documentation (Priority P1)

**Target:** 15 files, ~5,000 lines
**Effort:** 2-3 hours GPT-high time

#### Files to Update:

1. **`.agent/README.md`**
   - Remove references to "generating .agent/ folders"
   - Update to describe .agent/ as "internal development context for building ProjectPulse"
   - Clarify: "This .agent/ folder is for US (building ProjectPulse), not for end users"

2. **`.agent/system-patterns.md`**
   - Update MCP tool descriptions to focus on database CRUD
   - Remove "file generation" patterns
   - Add "web UI" patterns (wiki pages, dashboards)

3. **`.agent/active-context.md`**
   - Update current work to reflect correct product vision
   - Remove Sprint 2 markdown sync references
   - Add Sprint 2 Wiki page implementation

4. **`.agent/progress.md`**
   - Update progress tracking to remove markdown sync milestone
   - Add Wiki page milestone

5. **`.agent/sops/*.md`** (All SOPs)
   - Review each SOP for .agent/ folder references
   - Update to clarify: SOPs are for building ProjectPulse, not for end users

---

### Phase 3: CLAUDE.md Integration Guide (Priority P0)

**Target:** 1 file, ~1,000 lines
**Effort:** 1 hour GPT-high time

#### File: `CLAUDE.md`

**Lines to Update:** Entire document review

**Current Issues:**
- Describes ProjectPulse as tool for building ProjectPulse
- Confuses dogfooding with end user features

**Required Changes:**

Add new section at top:

```markdown
# 🚨 CRITICAL: Understanding ProjectPulse

## What ProjectPulse IS

ProjectPulse is a **web-based project management platform** for end users.

**End User:** A developer building "My E-commerce App"
**What They Do:** Create project in ProjectPulse → Agent connects via MCP → Agent stores data in ProjectPulse database → User views via web UI
**What They DON'T Do:** Generate .agent/ folder in their repo

## What This .agent/ Folder IS

This `.agent/` folder exists for **US** (developers building ProjectPulse itself).

- We use ProjectPulse to build ProjectPulse (dogfooding)
- This .agent/ folder tracks OUR development
- End users DON'T get a .agent/ folder

## Avoiding Confusion

When implementing features, always ask:
- **Is this for end users?** (Wiki page, MCP tools, database models)
- **Is this for us?** (This .agent/ folder, our development tracking)

**Sprint 2 Example:**
- ❌ WRONG: "Build markdown sync so end users can generate STATUS.md"
- ✅ RIGHT: "Build Wiki page so end users can store/search docs in database"
```

**Lines Affected:** Add at line 1 (before Quick Start)

---

### Phase 4: Skills Documentation (Priority P2)

**Target:** 5 files in `.claude/skills/projectpulse/`
**Effort:** 1-2 hours GPT-high time

#### Files to Scan:

1. `api-patterns.md`
2. `component-patterns.md`
3. `database-patterns.md`
4. `testing-patterns.md`
5. Any other skills

**Changes Needed:**
- Update examples to show building web UI features
- Remove .agent/ folder generation examples
- Add MCP tool implementation patterns

---

### Phase 5: Architecture Decision Records (Priority P1)

**Target:** 5 ADR files
**Effort:** 1 hour GPT-high time

#### Files:

1. `docs/architecture/ADRs/ADR-001-agent-first-architecture.md`
2. `docs/architecture/ADRs/ADR-002-database-as-source-of-truth.md`
3. `docs/architecture/ADRs/ADR-003-hybrid-knowledge-graph.md`
4. `docs/architecture/ADRs/ADR-004-single-mcp-server.md`
5. `docs/architecture/ADRs/ADR-005-five-level-hierarchy.md`

**Changes Needed:**
- Review each ADR for .agent/ folder references
- Update context sections to clarify product vision
- Ensure ADRs align with web application architecture

---

## Validation Checklist

After refactor, GPT-high must verify:

### ✅ Terminology Consistency

Search entire codebase for these terms and verify context:

- [ ] ".agent/ folder" - Should only appear in context of "OUR development", never "end user feature"
- [ ] "CLAUDE.md" - Should only appear in context of "OUR .agent/ folder", never "end user gets CLAUDE.md"
- [ ] "generates" - Should NOT be used with "files", "folders", ".agent/"
- [ ] "markdown sync" - Should be described as "internal tooling" or removed
- [ ] "meta-platform" - Should be removed or redefined as "web platform"

### ✅ Feature Descriptions

Verify these features are described correctly:

- [ ] Wiki Page - Database storage + web UI + MCP tools (NOT markdown file generation)
- [ ] Knowledge Base - RAG + vector search (NOT file-based knowledge graph)
- [ ] Onboarding - Prompt templates + database storage (NOT .agent/ folder creation)
- [ ] Progress Tracking - Database hierarchy + Development Cycle page (NOT STATUS.md generation)

### ✅ User Journey Accuracy

Verify user journey descriptions show:

- [ ] User creates project in ProjectPulse web app
- [ ] Agent connects via MCP (not filesystem)
- [ ] Agent stores data in database (not local files)
- [ ] User views data via web UI (not markdown files)
- [ ] User's repo stays clean (no .agent/ folder)

### ✅ Documentation Cross-References

Verify these documents align:

- [ ] PRD ↔ SRS (features match requirements)
- [ ] SRS ↔ Backlog (FRs match user stories)
- [ ] Backlog ↔ Project Plan (stories match sprint deliverables)
- [ ] Architecture ↔ ADRs (design matches decisions)

---

## Post-Refactor Audit

After GPT-high completes refactor, perform final audit:

### Step 1: Automated Search

Run these searches and verify NO incorrect references:

```bash
# These should NOT appear with "end user" context
rg "generates .agent/" docs/ .agent/
rg "creates CLAUDE.md" docs/ .agent/
rg "markdown sync" docs/ --type md

# These SHOULD appear with correct context
rg "web UI" docs/ --type md
rg "database storage" docs/ --type md
rg "MCP tools" docs/ --type md
```

### Step 2: Manual Review

Human review of:

1. **docs/01-PRD.md** - Vision section (lines 14-24)
2. **docs/13-Project-Plan.md** - Sprint 2 section (lines 656-779)
3. **CLAUDE.md** - Top section (new content added)
4. **.agent/project-brief.md** - Core Mission (lines 9-44)

### Step 3: Consistency Check

Verify these documents tell the same story:

1. Read PRD Section 1.1 (Vision)
2. Read Project Plan Sprint 2 (Deliverables)
3. Read .agent/project-brief.md (Core Mission)

All three should describe:
- Web application platform
- Database storage
- Web UI for humans
- MCP API for agents
- NO .agent/ folder generation

---

## File Manifest

### Phase 1: Critical (Must Fix)

```
docs/01-PRD.md                          (8,000 lines)
docs/02-SRS.md                          (6,000 lines)
docs/03-Architecture.md                 (4,000 lines)
docs/12-Backlog.md                      (5,000 lines)
docs/13-Project-Plan.md                 (3,000 lines)
.agent/project-brief.md                 (270 lines)
```

**Total:** 6 files, ~26,270 lines

### Phase 2: .agent/ Documentation

```
.agent/README.md
.agent/system-patterns.md
.agent/tech-context.md
.agent/active-context.md
.agent/progress.md
.agent/sops/api-route-creation.md
.agent/sops/git-workflow.md
.agent/sops/mac-mini-cloud-architecture.md
.agent/sops/mac-mini-communication-protocol.md
.agent/sops/port-troubleshooting.md
.agent/system/api-catalog.md
.agent/system/component-patterns.md
.agent/system/database-schema.md
.agent/system/mcp-tools-guide.md
.agent/system/memory-mcp-strategy.md
```

**Total:** 15 files, ~5,000 lines

### Phase 3: Integration Guide

```
CLAUDE.md                               (1,000 lines)
```

**Total:** 1 file, ~1,000 lines

### Phase 4: Skills

```
.claude/skills/projectpulse/api-patterns.md
.claude/skills/projectpulse/component-patterns.md
.claude/skills/projectpulse/database-patterns.md
.claude/skills/projectpulse/testing-patterns.md
```

**Total:** 4 files, ~2,000 lines

### Phase 5: ADRs

```
docs/architecture/ADRs/ADR-001-agent-first-architecture.md
docs/architecture/ADRs/ADR-002-database-as-source-of-truth.md
docs/architecture/ADRs/ADR-003-hybrid-knowledge-graph.md
docs/architecture/ADRs/ADR-004-single-mcp-server.md
docs/architecture/ADRs/ADR-005-five-level-hierarchy.md
```

**Total:** 5 files, ~1,500 lines

---

## Grand Total

**Files to Update:** 31 files
**Lines to Update:** ~35,770 lines
**Estimated GPT-high Time:** 8-12 hours
**Estimated Token Usage:** 400K-600K tokens

---

## Execution Instructions for GPT-high

### Phase-by-Phase Execution

1. **Execute Phase 1 First** (Critical files)
   - Start with docs/01-PRD.md
   - Then docs/02-SRS.md
   - Then docs/03-Architecture.md
   - Then docs/12-Backlog.md
   - Then docs/13-Project-Plan.md
   - Finally .agent/project-brief.md

2. **Validate Phase 1** before proceeding
   - Run automated searches
   - Verify terminology consistency
   - Confirm user journey accuracy

3. **Execute Phase 2** (.agent/ documentation)

4. **Execute Phase 3** (CLAUDE.md)

5. **Execute Phase 4** (Skills - if time permits)

6. **Execute Phase 5** (ADRs - if time permits)

7. **Final Audit** (automated + manual)

### Output Format

For each file updated, provide:

```markdown
## File: docs/01-PRD.md

### Changes Made:

1. **Lines 14-24** (Section 1.1 Vision)
   - Removed: "generates .agent/ folders"
   - Added: "web-based project management platform"
   - Context: Corrected product vision

2. **Lines 43-58** (Onboarding section)
   - Removed: "creates CLAUDE.md"
   - Added: "stores in database"
   - Context: Clarified onboarding workflow

### Validation:

- [x] No references to ".agent/ generation" for end users
- [x] User journey shows database storage
- [x] Cross-references updated in SRS
```

---

## Success Criteria

Refactor is complete when:

1. ✅ Zero references to "generates .agent/ folders" in end user context
2. ✅ Zero references to "creates CLAUDE.md" for end users
3. ✅ All features described as database + web UI + MCP tools
4. ✅ Sprint 2 focused on Wiki page (not markdown sync)
5. ✅ User journey shows: create project → agent connects → stores in database → view in UI
6. ✅ Repository stays clean (no .agent/ folder for end users)
7. ✅ Documentation cross-references validated
8. ✅ Automated search passes all checks
9. ✅ Manual review confirms consistency

---

## Notes for GPT-high

### Context Understanding

Before starting, understand:

1. **ProjectPulse = Web Application**
   - Like Jira, Linear, or GitHub Issues
   - Accessed via browser (humans) and MCP (agents)
   - Data lives in cloud database, NOT in user's repo

2. **End User = Developer building THEIR project**
   - They're building "My E-commerce App" or "My SaaS Product"
   - They use ProjectPulse to manage THAT project
   - They DON'T get .agent/ folder in their e-commerce repo

3. **Dogfooding Confusion**
   - WE use ProjectPulse to build ProjectPulse (dogfooding)
   - WE have .agent/ folder in our repo (F:\Web_Projects\AI_HUB\.agent)
   - End users DON'T have .agent/ folder in their repos

4. **Markdown Sync = Internal Tooling**
   - Sprint 2 markdown sync is for US (dogfooding)
   - It helps us track OUR development of ProjectPulse
   - It's NOT an end user feature
   - End users get Wiki page instead

### Key Terminology

Replace these terms:

| ❌ Wrong | ✅ Right |
|---------|---------|
| "generates .agent/ folders" | "provides web UI and MCP API" |
| "creates CLAUDE.md" | "stores documentation in database" |
| "markdown sync" | "internal development tracking" OR "wiki page" |
| "meta-platform" | "web-based project management platform" |
| "produces files" | "stores data in database" |

### Validation Queries

After each phase, run:

```bash
# Should return 0 results (or only in "dogfooding" context)
rg "generates .agent/" docs/ .agent/
rg "creates CLAUDE.md" docs/ .agent/

# Should return many results (correct context)
rg "web UI" docs/ .agent/
rg "database storage" docs/ .agent/
rg "MCP tools" docs/ .agent/
```

---

**Ready for GPT-high execution!**

**Next Steps:**
1. Load this plan into GPT-high (1M context)
2. Execute Phase 1 (critical documentation)
3. Validate Phase 1 results
4. Continue with remaining phases
5. Perform final audit
6. Report completion with change summary
