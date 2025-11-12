# Project Implementation Plan

**Document ID:** DOC-013
**Version:** 1.2.0
**Status:** Active
**Owner:** Project Management
**Last Updated:** 2025-11-12
**Review Cycle:** Weekly (sprint planning)

---

## Document Control

| Version | Date       | Author             | Changes                                                |
| ------- | ---------- | ------------------ | ------------------------------------------------------ |
| 1.0.0   | 2025-11-02 | Project Management | Initial 16-week implementation roadmap                 |
| 1.1.0   | 2025-11-06 | Project Management | Added Sprint 9 (Memory Banks + Research Orchestration) |
| 1.2.0   | 2025-11-12 | Project Management | Sprint 5 complete, added Sprint 5.5 (MCP Server Infrastructure) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Implementation Phases](#2-implementation-phases)
3. [Sprint Breakdown](#3-sprint-breakdown)
4. [Resource Allocation](#4-resource-allocation)
5. [Risk Management](#5-risk-management)
6. [Success Criteria & Quality Gates](#6-success-criteria--quality-gates)
7. [Milestones & Dependencies](#7-milestones--dependencies)
8. [Cross-References & Documentation](#8-cross-references--documentation)

---

## 1. Executive Summary

### 1.1 Project Overview

**ProjectPulse** is an agent-first project management platform designed for AI agents (Claude Code, Cursor AI, Codex) to execute complete software development workflows with 95% automation via MCP (Model Context Protocol).

**Primary Users:** AI Agents (95% interaction via MCP tools)
**Secondary Users:** Solo/small team developers (5% monitoring via UI)

**Core Value Proposition:**

- **Token Efficiency:** 92% reduction for skills, 88% reduction for knowledge queries
- **Agent Autonomy:** >95% workflow completion without human intervention
- **Database as Source of Truth:** Markdown files auto-generated, preventing drift
- **Workflow Orchestration:** 12 predefined workflows enforce consistency across sessions

---

### 1.2 Timeline & Scope

**Duration:** 19 weeks (9 regular two-week sprints + Sprint 5.5 gap sprint)
**Start Date:** Phase A Week 1 (implementation begins after documentation restructuring)
**Target Completion:** Phase E Week 19 (MVP production-ready with context optimization)

**Scope Breakdown:**

| Scope Category       | Story Count | Story Points | Percentage | Target Timeline                |
| -------------------- | ----------- | ------------ | ---------- | ------------------------------ |
| **Must Have (P0)**   | 78 stories  | 278 points   | 55%        | Sprints 1-7, Sprint 5.5, Sprint 9 |
| **Should Have (P1)** | 40 stories  | 144 points   | 28%        | Sprints 5-8, Sprint 5.5, Sprint 9 |
| **Could Have (P2)**  | 15 stories  | 46 points    | 9%         | Sprint 8 (time permitting)     |
| **Won't Have (P3)**  | 5 stories   | 16 points    | 3%         | Post-MVP                       |
| **Sprint 5.5 Gap**   | 6 stories   | 21 points    | 4%         | Sprint 5.5 (critical)          |
| **Total**            | **144**     | **505**      | **100%**   | **9.5 sprints**                |

**MVP Definition:** Must Have + Should Have + Sprint 5.5 Gap = 124 stories (443 points)

**Sprint 5.5 Note:** Gap sprint to complete MCP server infrastructure (Sprint 1 incomplete at 96%). Critical for 90% use case (AI agents accessing via MCP).

---

### 1.3 Success Metrics

**Token Efficiency Targets:**

- **Skills:** 92% reduction (220 tokens vs 2,500 baseline)
- **Knowledge Queries:** 88% reduction (1,200 tokens vs 10,000 baseline)
- **Overall Context Management:** <200K tokens per session (within Claude Code limits)

**Performance Targets (Non-Functional Requirements):**

- API response time: P95 <500ms, P99 <1s
- MCP tool execution: P95 <1s, P99 <2s
- Knowledge queries: P95 <200ms, P99 <500ms
- Markdown sync: <500ms per file

**Agent Autonomy:**

- > 95% MCP interaction without human intervention
- Workflow completion rate >95% (agents execute 5-step protocol correctly)
- Zero mandatory human approvals for Must Have stories

**Quality Targets:**

- Zero critical bugs at MVP launch
- > 80% code coverage for business logic
- TypeScript 0 errors (strict mode)
- Lighthouse score >90, axe-core 0 violations

---

### 1.4 Key Risks Summary

**High-Priority Risks:**

1. **MCP Protocol Learning Curve:** 4-hour timebox in Sprint 1, POC validation required
2. **pgvector Performance:** Benchmark in Sprint 5, limit to 1K items in MVP if needed
3. **Solo Developer Velocity:** 20% buffer per sprint, prioritize Must→Should→Could
4. **Integration Complexity:** Weekly integration tests starting Sprint 2

**Mitigation Strategy:**

- POCs for high-risk items (MCP, pgvector, hybrid search) in Sprint 1
- Sprint 8 dedicated to integration testing and bug fixes
- Fallback options: Local Ollama embeddings if OpenAI costs too high

---

## 2. Implementation Phases

### Phase A: Foundation & Core Infrastructure (Weeks 1-6, Sprints 1-3)

**Goal:** Establish 5-level hierarchy with auto-markdown sync and workflow orchestration

**Duration:** 6 weeks (3 two-week sprints)
**Story Points:** 206 points (87 Sprint Tracking + 24 Onboarding + 95 Workflow complete)
**Epics:** EPIC-001 (100%), EPIC-002 (100%)

**Key Deliverables:**

- **5-Level Hierarchy:** Phase → Week → Day → Task → Session (all CRUD operations functional)
- **Progress Roll-Up:** Session 100% → propagates to Task → Day → Week → Phase
- **Markdown Sync:** STATUS.md, DEVELOPMENT_PLAN.md auto-generated <500ms
- **Git Hooks:** Pre-commit validation prevents manual markdown edits
- **Workflow State Machine:** 12 workflows defined with step tracking
- **Checkpoint System:** Automatic checkpoints every 15K tokens
- **5-Step Protocol Enforcement:** Agents cannot skip mandatory steps

**Technical Stack Setup:**

- Next.js 14 App Router (Server/Client Components)
- Prisma ORM with PostgreSQL 15+
- MCP Server (stdio transport)
- Git hooks (pre-commit, commit-msg)

**Phase Acceptance Criteria:**

- ✅ Can create full hierarchy (Phase → Session) with progress tracking
- ✅ Progress updates trigger markdown regeneration automatically
- ✅ Git hooks block manual STATUS.md/DEVELOPMENT_PLAN.md edits
- ✅ 5-step protocol enforced (agents alerted if step skipped)
- ✅ Workflow state persists across session interruptions
- ✅ Checkpoint system operational (saves every 15K tokens)

**Dependencies:** None (foundation phase)

**Risks:**

- MCP protocol learning curve (mitigated: 4-hour timebox, official examples)
- Windows git hook compatibility (mitigated: Test in Sprint 2, fallback to manual validation)

---

### Phase B: Core Features - Issues Management (Weeks 7-8, Sprint 4)

**Goal:** Complete agent-first issue tracking with bulk creation and auto-tagging

**Duration:** 2 weeks (1 two-week sprint)
**Story Points:** 62 points (EPIC-003 100%)
**Epics:** EPIC-002 (21% completion), EPIC-003 (100%)

**Key Deliverables:**

- **Issue CRUD:** Create, read, update, delete issues via MCP tools
- **Bulk Creation:** 10-50 issues in single API call (<2s performance)
- **Auto-Tagging:** File path-based categorization (80%+ accuracy target)
- **Context Injection:** Code snippets, stack traces, file:line references
- **Issues UI Integration:** 100% UI complete from Sprint 0 (all 14 components) - backend integration only
- **Workflow Integration:** Issues created from scanner findings (Semgrep, ESLint)

**Phase Acceptance Criteria:**

- ✅ Bulk create 15 issues in <2 seconds
- ✅ Auto-tagging achieves 80%+ accuracy (e.g., "src/api/" → "backend" tag)
- ✅ Context injection includes file:line references and code snippets
- ✅ Issues UI functional with filters (status, severity, tags)

**Dependencies:**

- Sprint 0 complete (Issues UI 100% built - all pages, components, theme system)
- EPIC-001 complete (link issues to tasks)

**Risks:**

- Bulk insert performance (mitigated: Database indexes, batch operations)
- Auto-tagging accuracy below 80% (mitigated: Configuration-driven rules)

---

### Phase C: Advanced Features (Weeks 9-14, Sprints 5-7)

**Goal:** Implement knowledge graph, skills, wiki, and health monitoring

**Duration:** 6 weeks (3 two-week sprints)
**Story Points:** 170 points (78 Knowledge + 42 Skills + 31 Wiki + 19 Health)
**Epics:** EPIC-004 (100%), EPIC-005 (100%), EPIC-006 (100%), EPIC-007 (100%)

**Key Deliverables:**

**Sprint 5-6: Knowledge Graph + Skills (4 weeks)**

- **Hybrid Search:** Semantic (pgvector) + Full-text (tsvector) + 2-hop graph traversal
- **Token Efficiency:** <1,500 tokens per query (88% reduction validated)
- **Query Performance:** <200ms P95 latency
- **Skills Lazy-Loading:** Frontmatter <80 tokens, full load <250 tokens (92% reduction)
- **Auto-Unload:** Skills unload after 5 minutes of inactivity

**Sprint 7: Wiki + Health (2 weeks)**

- **Wiki Auto-Generation:** JSDoc/docstrings → markdown pages with cross-linking
- **Git-Backed Versioning:** Wiki changes tracked in git (same as code)
- **Health Dashboard:** Security + Quality + Accessibility + Tech Debt scores
- **Scanner Integration:** Semgrep, ESLint, Lighthouse, axe-core

**Phase Acceptance Criteria:**

- ✅ Knowledge queries achieve <200ms P95 + <1,500 tokens per query
- ✅ Hybrid search ranks results: 0.7 × semantic + 0.3 × fulltext
- ✅ Graph traversal (2-hop max) finds 1-3 related items
- ✅ Skills frontmatter loads <80 tokens, full content <250 tokens
- ✅ Wiki generates from code comments (95%+ coverage)
- ✅ Health score calculates from all 4 scanners (weighted average)

**Dependencies:**

- EPIC-004 (Knowledge) → EPIC-005 (Skills): Pattern reuse for indexing
- EPIC-004 (Knowledge) → EPIC-006 (Wiki): Cross-linking via knowledge graph
- EPIC-003 (Issues) → EPIC-007 (Health): Health scanners create issues automatically

**Risks:**

- pgvector performance with 10K+ items (mitigated: Limit to 1K items in MVP, benchmark in Sprint 5)
- Hybrid search weights need tuning (mitigated: A/B test in Sprint 5, allow configuration)
- OpenAI embedding API costs (mitigated: Local Ollama embeddings as default)

---

### Phase D: Integration & Polish (Weeks 15-16, Sprint 8)

**Goal:** Integration testing, performance optimization, MVP validation

**Duration:** 2 weeks (1 two-week sprint)
**Story Points:** 48 points (buffer + polish)
**Epics:** Integration across all features

**Key Deliverables:**

- **Integration Tests:** End-to-end workflows across all 8 features
- **Performance Optimization:** Database queries, indexes, caching strategies
- **Bug Fixes:** Address issues discovered during integration testing
- **Documentation Updates:** OpenAPI spec, architecture diagrams, SOPs
- **MVP Acceptance:** Validate all 105 Must+Should stories complete
- **Production Readiness:** Health checks, monitoring, error handling

**Phase Acceptance Criteria:**

- ✅ All 118 Must+Should stories implemented and tested
- ✅ All 158 MVP tests passing (TEST-001 to TEST-158)
- ✅ Performance targets met across all NFRs
- ✅ Agent autonomy >95% validated (complete workflows without intervention)
- ✅ Zero critical bugs (P0 severity)
- ✅ Documentation complete and accurate

**Dependencies:** Sprints 1-7 (all features must be complete)

**Risks:**

- Integration issues discovered late (mitigated: Weekly integration tests starting Sprint 2)
- Performance bottlenecks (mitigated: Early benchmarks, optimization in Sprint 8)

---

### Phase E: Context Management & Research Automation (Sprint 9, Weeks 17-18)

**Goal:** Token-efficient context management and automated codebase research

**Duration:** 2 weeks (1 two-week sprint)
**Story Points:** 58 points (34 Memory Banks + 24 Research Orchestration)
**Epics:** EPIC-010 (100%), EPIC-011 (100%)

**Key Deliverables:**

**Week 1: Memory Bank System (EPIC-010)**

- **5 Memory Bank Files:** project-brief.md, system-patterns.md, tech-context.md, active-context.md, progress.md
- **Session Start Optimization:** Reduce token overhead from 40K → 10K (75% reduction)
- **Pattern Lookup Workflow:** Find implementation patterns in ≤1K tokens (93% reduction)
- **Context Recovery:** Restore session context in ≤6K tokens after interruption

**Week 2: Research Agent Orchestration (EPIC-011)**

- **explore-codebase Sub-Agent:** Automated pattern discovery, convention analysis
- **analyze-architecture Sub-Agent:** Data flow tracing, dependency mapping, Mermaid diagrams
- **Sub-Agent Invocation Workflow:** Automatic research without manual orchestration
- **Report Persistence:** Research reports saved to .agent/task/ (persist across sessions)
- **Parallel Research:** Support 2+ sub-agents simultaneously

**Phase Acceptance Criteria:**

- ✅ Session start completes in ≤10K tokens (75% reduction from 40K baseline)
- ✅ Pattern lookups complete in ≤1K tokens (93% reduction from 15K baseline)
- ✅ Context recovery completes in ≤6K tokens (85% reduction from 40K baseline)
- ✅ Research tasks complete in ≤2K tokens in main thread (92% reduction from 25K baseline)
- ✅ Sub-agent reports saved to .agent/task/ and persist across sessions
- ✅ Support 3+ complex features per 200K token session (3x improvement from baseline)

**Dependencies:**

- Filesystem MCP configured
- Git MCP configured
- .agent/ directory structure established
- Sub-agent architecture implemented

**Risks:**

- Memory bank content accuracy (mitigated: Manual review in Sprint 9, iterative refinement)
- Sub-agent report quality (mitigated: Validate 90%+ actionable insights target)
- File system access permissions (mitigated: Test MCP filesystem tool thoroughly)

**Rationale:**

Sprint 1-8 implementation revealed critical architectural gap: Claude Code's 200K token limit prevents loading complete documentation context. Full system context (~150K tokens) exceeds practical limits, causing context compaction, knowledge loss, and reduced productivity (1 feature per session). Memory Bank System solves this through token-efficient structured knowledge files. Research Agent Orchestration eliminates token waste on codebase exploration by isolating research in sub-agent threads.

**FR Traceability:**

- US-010-01 (FR-146): Create project-brief.md Memory Bank
- US-010-02 (FR-147): Create system-patterns.md Memory Bank
- US-010-03 (FR-148): Create tech-context.md Memory Bank
- US-010-04 (FR-149): Create active-context.md Memory Bank
- US-010-05 (FR-150): Create progress.md Memory Bank
- US-010-06 (FR-151): Implement Memory Bank Loading Workflow
- US-010-07 (FR-152): Implement Pattern Lookup Workflow
- US-010-08 (FR-153): Implement Context Recovery Workflow
- US-011-01 (FR-154): Implement explore-codebase Sub-Agent
- US-011-02 (FR-155): Implement analyze-architecture Sub-Agent
- US-011-03 (FR-156): Implement Sub-Agent Invocation Workflow
- US-011-04 (FR-157): Implement Report Persistence System
- US-011-05 (FR-158): Implement Parallel Research Support

---

## 3. Sprint Breakdown

### Sprint 0 (Week 1.5): UI Foundation (Pre-work) - COMPLETE ✅

**Duration:** 1.5 weeks (October 25-28, 2025)
**Status:** ✅ **COMPLETE** (Pre-implementation UI work)
**Story Points:** ~80 points (not originally planned)
**Agent(s) Used:** devhub-fullstack, react-expert, next-js-expert, prisma-expert
**Skills Applied:** component-patterns, api-patterns, database-patterns

---

**NOTE: This sprint represents UI work completed BEFORE the main implementation plan began. The original plan (Sprint 1-8) focuses on backend MCP tools and database architecture. This Sprint 0 acknowledges the UI foundation already in place.**

---

#### Objectives Achieved

✅ **Objective 1: Static Coral Theme System**

- Removed multi-theme system (ThemeSwitcher, CompactThemeSwitcher, ThemePreview deleted)
- Implemented static Coral theme with neumorphic design
- Created complete CSS variable system (--dark, --coral, --slate, etc.)
- Added neumorphic utility classes (.neu-raised, .neu-pressed, .neu-flat, .glass-dark)
- Extended Tailwind config with Coral color palette and custom utilities

✅ **Objective 2: Complete Page Implementation (7 Pages)**

- Dashboard (`/dashboard`) - Stats cards, recent issues, quick actions, agent widgets
- Issues List (`/issues`) - Filterable, searchable issue listing with pagination
- Issue Detail (`/issues/[id]`) - Full detail page with 11 sub-components
- Knowledge Base (`/knowledge`) - Article listing with search and tag filtering
- Wiki (`/wiki/[slug]`) - Documentation pages with TOC, scroll spy, markdown rendering
- Security Dashboard (`/security`) - Vulnerability tracking with animated score meter
- Agent Personas (`/agents`) - Agent management with toggle switches and Server Actions

✅ **Objective 3: Component Library (45+ Components)**

**Layout Components:**

- `FloatingBackground` - Animated hexagons and bubbles
- `Header` - Glass morphism with search bar and notifications
- `Sidebar` - Neumorphic navigation with coral active states
- `CommandPalette` - Cmd+K keyboard-driven search (useReducer state machine)

**Dashboard Components:**

- `StatCard` - Icon gradient containers with large text-4xl numbers
- `IssueCard` - Glass-dark issue preview cards
- `WelcomeBanner` - Coral gradient with CTA button
- `QuickActionsWidget` - Neumorphic action buttons
- `AgentPersonasWidget` - Glass-dark agent cards with emoji icons

**Issues Components (14 total):**

- Main: `IssuesPageClient`, `FilterSidebar`, `SearchSortBar`, `IssueListCard`, `Pagination`
- Detail (11 components): `IssueHeader`, `IssueActions`, `QuickActions`, `DescriptionSection`, `CodeSection`, `CommentForm`, `CommentList`, `AttachmentList`, `RelatedIssues`, `WatchersSection`, `SystemActivity`, `IssueDetailSidebar`

**Knowledge Components:**

- `ArticleCard` - Memoized with React.memo for list performance
- `TagFilter` - URL state management with useSearchParams
- `SearchBar` - Debounced search input (300ms delay)

**Wiki Components:**

- `WikiSidebar` - Related pages navigation
- `TableOfContents` - IntersectionObserver-based scroll spy
- `WikiContent` - ReactMarkdown with Prism syntax highlighting
- `CodeBlock` - Syntax highlighting component

**Security Components:**

- `SecurityScoreMeter` - Animated SVG circle visualization
- `VulnerabilityCard` - Severity badges and code snippets
- `VulnerabilityFilter` - Multi-dimension filtering

**Agent Components:**

- `AgentCard` - useOptimistic for instant toggle feedback

**UI Primitives (shadcn/ui):**

- `avatar`, `badge`, `button`, `card`, `input`, `separator`

✅ **Objective 4: API Routes & Server Actions (7 files)**

**API Routes (6 routes):**

1. `GET /api/knowledge` - Paginated articles with search/filtering
2. `GET /api/search` - Unified multi-entity search across Issues/Knowledge/Wiki/Agents
3. `GET /api/wiki/[slug]` - Wiki page fetching with related pages
4. `GET /api/security/score` - Real-time security score calculation
5. `GET /api/security/vulnerabilities` - Filtered vulnerability listing
6. `GET /api/agents` - Agent listing (implicit from page)

**Server Actions (1 file):**

1. `/app/agents/actions.ts` - toggleAgentStatus, createAgent, deleteAgent

✅ **Objective 5: Advanced React Patterns**

- useReducer for Command Palette state machine (10 actions)
- useOptimistic for Agent toggle instant feedback
- IntersectionObserver for Wiki TOC scroll spy (battery-efficient)
- React.memo for expensive list item components
- Debounced search inputs (300ms delay)
- URL state management with useSearchParams

---

#### Files Created/Modified

**Created Files:** 30 files

- 7 page files (dashboard, issues, issue detail, knowledge, wiki, security, agents)
- 6 API routes
- 1 Server Actions file
- 15 component files
- 1 hook (useScrollSpy)

**Modified Files:** 11 files

- Theme system (removed multi-theme, added Coral static theme)
- Global CSS (845 lines - complete neumorphic system)
- Tailwind config (extended with Coral utilities)
- Layout files (dashboard layout with Header and FloatingBackground)

**Deleted Files:** 3 files

- ThemeSwitcher.tsx, CompactThemeSwitcher.tsx, ThemePreview.tsx

**Total Code Added:** ~2,800 lines across pages, components, API routes

---

#### Technology Stack Established

**Frontend:**

- Next.js 14 App Router (Server/Client Components split)
- React 18 (useState, useReducer, useOptimistic, IntersectionObserver)
- Tailwind CSS (custom neumorphic utilities)
- shadcn/ui components (base primitives)

**Styling:**

- Static Coral theme (multi-theme removed)
- CSS variables (--dark, --coral, --slate, etc.)
- Neumorphic classes (.neu-raised, .neu-pressed, .glass-dark)
- Animations (float-hex, float-bubble, heartbeat, pulse-glow)

**Data Fetching:**

- Server Components with direct Prisma queries
- API Routes for client-side fetching
- Server Actions for mutations
- ISR with 1-hour revalidation (Wiki pages)

**State Management:**

- useReducer for complex state machines (Command Palette)
- useOptimistic for instant feedback (Agent toggles)
- URL state with useSearchParams (filters, pagination)
- No global state library (pages self-contained)

---

#### Quality Gates Passed

- ✅ TypeScript compiles with no errors
- ✅ Zero console errors in browser
- ✅ Zero hydration errors (fixed with deterministic calculations)
- ✅ Database connection stable (PrismaClient singleton pattern)
- ✅ Animations working (hexagons, bubbles, heartbeat, pulse-glow)
- ✅ All pages render successfully
- ✅ Semantic HTML and keyboard navigation functional

---

#### Completion Documents

**Phase 1 (Theme Foundation):**

- [docs/archive/completions/2025-11/WEEK_1_5_PHASE_1_COMPLETION.md](archive/completions/2025-11/WEEK_1_5_PHASE_1_COMPLETION.md)
  - Removed multi-theme system
  - Implemented static Coral theme
  - Created FloatingBackground component
  - Extended Tailwind config

**Phase 2 (Component Library):**

- [docs/archive/completions/2025-11/WEEK_1_5_PHASE_2_COMPLETION.md](archive/completions/2025-11/WEEK_1_5_PHASE_2_COMPLETION.md)
  - Transformed all dashboard components to neumorphic design
  - Fixed hydration errors
  - Resolved database connection pool issues
  - Pixel-perfect mockup implementation

**Phase 3 (Remaining Pages):**

- [docs/archive/completions/2025-11/COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](archive/completions/2025-11/COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md)
  - Knowledge Base page
  - Wiki pages with TOC
  - Security Dashboard
  - Agent Personas page
  - Command Palette (Cmd+K)

---

#### Impact on Main Implementation Plan

**UI Layer:** ✅ 100% Complete

- All 7 pages implemented with pixel-perfect mockup design
- 45+ components following neumorphic design system
- Theme system locked to Coral theme
- API routes and Server Actions in place

**Next Steps (Sprint 1-8):** Backend MCP Tools & Database Architecture

- Sprint 1-2: Phase/Week/Day/Task/Session models and MCP tools (original plan)
- Sprint 3: Workflow orchestration MCP tools
- Sprint 4: **Issues backend integration** (UI already 100% complete, only connect to MCP)
- Sprint 5-6: Knowledge graph backend and Skills
- Sprint 7: Wiki backend and Health monitoring
- Sprint 8: Integration testing

**Key Insight:** Sprint 4 (Issues) now requires ZERO new UI work - only backend MCP tool integration with existing pages.

---

#### Lessons Learned

**What Went Well:**

- Mockup HTML as exact blueprint ensured pixel-perfect implementation
- Breadth-first approach (all 5 pages foundations before perfecting) saved 3 hours
- Expert consultations (Step 3) provided clear architectural direction upfront
- useReducer and useOptimistic patterns simplified complex state management

**Challenges Resolved:**

- Hydration errors fixed with deterministic calculations (no Math.random() in Server Components)
- Database connection pool exhaustion fixed with PrismaClient singleton pattern
- File write conflicts resolved by deleting and recreating files

**Key Technical Insights:**

- IntersectionObserver for scroll spy is 10x more battery-efficient than scroll listeners
- useOptimistic provides instant feedback with minimal code
- ISR with 1-hour revalidation is optimal for wiki pages (fast + fresh)
- Application-side security score calculation is easier than database aggregation

---

#### Next Sprint: Sprint 1 (Backend Foundation)

**Focus:** Implement Phase/Week/Day/Task/Session backend architecture (original plan)
**UI Impact:** None - UI layer complete, Sprint 1 focuses on MCP tools and database
**Reuse Potential:** Component patterns established, API route patterns established

---

### Sprint 1 (Weeks 1-2): Foundation Setup - 52 points

**User Stories:** US-001 to US-014 (EPIC-001 Sprint Tracking foundation)

**Goal:** Establish 5-level hierarchy with progress tracking and basic validation

**Key Deliverables:**

- Prisma schema: Phase, Week, Day, Task, Session tables with relationships
- MCP tools: `createPhase`, `createWeek`, `createDay`, `createTask`, `createSession`
- Progress roll-up algorithm (Session → Task → Day → Week → Phase)
- Validation: Foreign keys, progress 0.0-1.0, timestamps
- MCP server foundation (stdio transport, tool registration)

**Tech Stack Setup:**

- Next.js 14 App Router project initialization
- Prisma + PostgreSQL database setup
- MCP server scaffold (Node.js, stdio transport)
- Development environment configuration

**Dependencies:** None (foundation sprint)

**Risks:**

- MCP protocol learning curve (4 hours)
- Prisma migration setup on Windows

**Exit Criteria:**

- ✅ Can create full 5-level hierarchy via MCP tools
- ✅ Progress roll-up working (Session 100% → Task 50% → Day 25%)
- ✅ MCP server connects to Claude Code successfully

**Testing:**

- Unit tests: Progress roll-up algorithm (10 test cases)
- Integration tests: MCP tool execution end-to-end

---

### Sprint 2 (Weeks 3-4): Wiki Page + Onboarding System - 58 points

**User Stories:** US-015 to US-031 (EPIC-002: Wiki & Knowledge, EPIC-003: Onboarding)

**Goal:** Build core end user features that enable documentation storage and agent-guided project initialization

---

#### Sprint 2 Overview

**What We're Building:**

This sprint delivers the **first real end user features**:
1. **Wiki Page** - Web UI for viewing/searching documentation + MCP tools for agents to create/update docs
2. **Onboarding Prompt System** - Templated prompts that guide agents through 3-session project initialization

**What We're NOT Building:**

- ❌ Markdown file generation (not an end user feature)
- ❌ .agent/ folder creation (users don't need local files)
- ❌ File synchronization (end users use web UI, not files)

---

#### Key Deliverables

##### 1. Wiki Page (UI + Backend) - 34 points

**Database Model:**

```prisma
model WikiPage {
  id          Int      @id @default(autoincrement())
  projectId   Int
  title       String
  slug        String   // URL-friendly: "prd", "architecture-overview"
  content     Text     // Markdown content
  category    String   // "requirements", "architecture", "api", "guides"
  createdBy   String   // "agent" or "user:{userId}"

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, slug])
  @@index([category])
  @@index([projectId, updatedAt])
  @@map("wiki_pages")
}
```

**Web UI Pages:**

1. **Wiki List Page** (`/projects/[id]/wiki`)
    - Search bar (full-text search across title + content)
    - Category filter dropdown (All, Requirements, Architecture, API, Guides)
    - Sort options (Recent, Title A-Z, Category)
    - Page grid with cards showing:
      - Title
      - Category badge
      - Preview snippet (first 100 chars)
      - Last updated timestamp
      - Created by badge (Agent/User)
    - "New Page" button (opens editor)

2. **Wiki Detail Page** (`/projects/[id]/wiki/[slug]`)
    - Markdown content rendered with:
      - Syntax highlighting for code blocks
      - Tables, lists, headings, blockquotes
      - Link handling (internal wiki links + external)
    - Table of contents sidebar (auto-generated from H2/H3 headings)
    - Metadata footer:
      - Created by: Agent (Claude Code) on 2025-11-10
      - Last updated: 2 hours ago
      - Category: Requirements
    - Action buttons:
      - Edit (opens editor)
      - Delete (with confirmation)
      - Share (copy link)

3. **Wiki Editor** (`/projects/[id]/wiki/new` or `/projects/[id]/wiki/[slug]/edit`)
    - Split view: Markdown editor (left) + Live preview (right)
    - Title input field
    - Category dropdown
    - Slug auto-generation from title (editable)
    - Save / Cancel buttons
    - Validation:
      - Title required (1-200 chars)
      - Slug unique within project
      - Content required
      - Category required

**MCP Tools (6 tools):**

```typescript
// Create new wiki page
wiki.create({
  title: string,           // "Product Requirements Document"
  content: string,         // Markdown content
  category: string,        // "requirements"
  slug?: string            // Optional, auto-generated if not provided
})
// Returns: { id, slug, url: "/wiki/prd" }

// Search wiki pages
wiki.search({
  query: string,           // "authentication flow"
  category?: string,       // Optional filter
  limit?: number           // Default 10, max 50
})
// Returns: { pages: [{ id, title, slug, snippet, similarity }] }

// Get single page
wiki.get({
  slug: string             // "prd"
})
// Returns: { id, title, content, category, createdBy, createdAt, updatedAt }

// Update page
wiki.update({
  slug: string,            // "prd"
  content?: string,        // New content
  title?: string,          // New title
  category?: string        // New category
})
// Returns: { id, slug, updatedAt }

// Delete page
wiki.delete({
  slug: string             // "prd"
})
// Returns: { success: true }

// List all pages
wiki.list({
  category?: string,       // Optional filter
  orderBy?: 'recent' | 'title' | 'category'
})
// Returns: { pages: [{ id, title, slug, category, updatedAt }], total: number }
```

**API Routes:**

```typescript
// REST API (for web UI)
GET    /api/projects/[id]/wiki              // List pages
GET    /api/projects/[id]/wiki/[slug]       // Get page
POST   /api/projects/[id]/wiki              // Create page
PATCH  /api/projects/[id]/wiki/[slug]       // Update page
DELETE /api/projects/[id]/wiki/[slug]       // Delete page
POST   /api/projects/[id]/wiki/search       // Search pages

// MCP tools use same backend services
```

**Technical Stack:**

- **Frontend:** Next.js 14 App Router (Server Components for list/detail, Client Components for editor)
- **Editor:** `react-markdown` for rendering, `react-simplemde-editor` or `@uiw/react-md-editor` for editing
- **Syntax Highlighting:** `prism-react-renderer` or `highlight.js`
- **Search:** PostgreSQL full-text search (`to_tsvector`, `to_tsquery`)
- **Validation:** Zod schemas for MCP tools and API routes

**Testing:**

- Unit tests: Wiki service (CRUD operations)
- Component tests: WikiList, WikiDetail, WikiEditor
- Integration tests: MCP tool → Database → UI flow
- E2E tests: Agent creates page via MCP → User sees it in UI

---

##### 2. Onboarding Prompt System - 24 points

**Database Model:**

```prisma
model OnboardingSession {
  id             Int      @id @default(autoincrement())
  projectId      Int
  sessionNumber  Int      // 1, 2, 3
  promptTemplate String   // Template text with {variables}
  response       Json?    // Stores agent/user responses
  status         String   // "pending", "in_progress", "complete"

  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  project        Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, sessionNumber])
  @@index([projectId, status])
  @@map("onboarding_sessions")
}

model OnboardingTemplate {
  id             Int      @id @default(autoincrement())
  sessionNumber  Int      // 1, 2, 3
  name           String   // "Executive Summary", "Industry Docs", "AI Workflow"
  promptTemplate String   // Template text
  variables      Json     // Expected variables: { "executive_summary": "from session 1" }
  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([sessionNumber, isActive])
  @@map("onboarding_templates")
}
```

**Prompt Templates:**

**Session 1: Executive Summary**
```markdown
# ProjectPulse - New Project Onboarding (Session 1/3)

Welcome! Let's initialize your project with a quick onboarding session.

## Executive Summary Collection

Please answer these 10 questions to help me understand your project:

1. **Project Name**: What are you building?
2. **Target Users**: Who will use this product?
3. **Problem Statement**: What problem does it solve?
4. **Tech Stack**: What technologies are you using? (languages, frameworks, databases)
5. **Project Phase**: Where are you in development? (planning, active development, maintenance, refactoring)
6. **Team Size**: How many developers?
7. **Timeline**: Development timeline or deadline?
8. **Key Features**: Top 3 most important features?
9. **Technical Constraints**: Any limitations? (budget, hosting, compliance requirements)
10. **Success Criteria**: How will you measure success?

Once you provide these answers, I'll store the executive summary and move to Session 2 (industry documentation generation).
```

**Session 2: Industry Documentation**
```markdown
# ProjectPulse - New Project Onboarding (Session 2/3)

Based on your executive summary:

**Project:** {project_name}
**Problem:** {problem_statement}
**Users:** {target_users}
**Tech Stack:** {tech_stack}

## Documentation Generation Task

Please generate the following industry-standard documents:

### 1. Product Requirements Document (PRD)

Create a PRD with these sections:
- Project Vision & Goals
- User Personas (based on: {target_users})
- Feature Requirements (top 10 features, including: {key_features})
- Success Metrics (based on: {success_criteria})
- Technical Constraints: {technical_constraints}

**Store using:** `wiki.create({ title: "Product Requirements Document", category: "requirements", content: "..." })`

### 2. System Requirements Specification (SRS)

Create an SRS with:
- Functional Requirements (numbered: FR-001, FR-002, ...)
  - Based on features: {key_features}
  - Include CRUD operations, validation, error handling
- Non-Functional Requirements
  - Performance targets
  - Security requirements
  - Scalability considerations
- Acceptance Criteria for each FR

**Store using:** `wiki.create({ title: "System Requirements Specification", category: "requirements", content: "..." })`

### 3. Architecture Document

Create an Architecture overview with:
- System Context (what we're building: {project_name})
- Tech Stack breakdown: {tech_stack}
- Component Architecture (frontend, backend, database layers)
- Data Flow diagrams
- Key Architecture Decisions

**Store using:** `wiki.create({ title: "Architecture Overview", category: "architecture", content: "..." })`

Once complete, we'll move to Session 3 (AI workflow blueprint).
```

**Session 3: AI Workflow Blueprint**
```markdown
# ProjectPulse - New Project Onboarding (Session 3/3)

Based on your project documentation (PRD, SRS, Architecture), let's create your AI workflow blueprint.

## AI Workflow Artifacts

### 1. Memory Bank Files

Create knowledge chunks for quick retrieval:

- **Tech Context** (store in Knowledge Base):
  - Tech stack: {tech_stack}
  - Dependencies and versions
  - Environment setup
  - Common patterns for this stack

- **Project Context** (store in Knowledge Base):
  - What we're building: {project_name}
  - Target users: {target_users}
  - Key features: {key_features}
  - Current phase: {project_phase}

**Store using:** `knowledge.store({ content: "...", metadata: { type: "tech_context" } })`

### 2. Development SOPs (Standard Operating Procedures)

Create wiki pages for common workflows:

- **Git Workflow** (branching strategy for team size: {team_size})
- **Code Review Process**
- **Testing Requirements** (unit, integration, E2E)
- **Deployment Process**

**Store using:** `wiki.create({ title: "Git Workflow", category: "guides", content: "..." })`

### 3. Agent Skills

Create wiki pages documenting patterns:

- **{tech_stack} Patterns** (framework-specific best practices)
- **API Design Patterns** (RESTful conventions, error handling)
- **Database Patterns** (query optimization, migration strategy)

**Store using:** `wiki.create({ title: "{tech_stack} Patterns", category: "guides", content: "..." })`

## Completion

Once you've created these artifacts, your project initialization is complete!

You can now:
- View all documentation in the Wiki page
- Search knowledge via the Knowledge Base
- Create issues/tickets for upcoming work
- Track progress in the Development Cycle page
```

**MCP Tools (2 tools):**

```typescript
// Get prompt for specific session
onboarding.getPrompt({
  sessionNumber: number     // 1, 2, or 3
})
// Returns: {
//   promptTemplate: string,  // Template with variables filled
//   expectedVariables: string[],
//   sessionName: string
// }

// Submit session response
onboarding.submitResponse({
  sessionNumber: number,    // 1, 2, or 3
  data: Record<string, any> // Session-specific data
})
// Returns: {
//   sessionNumber: number,
//   status: "complete",
//   nextSession: number | null
// }
```

**Admin UI (Project Settings):**

- Page: `/projects/[id]/settings/onboarding`
- Allows editing prompt templates
- Variable reference guide
- Preview prompt with sample data

**Testing:**

- Integration test: Complete 3-session flow
- Unit tests: Template variable substitution
- E2E test: Agent calls getPrompt → submitResponse → Wiki pages created

---

#### Sprint 2 Status Tracking

**Overall Progress:** 13/58 points (22%) 🔄 IN PROGRESS

**Week 3: Wiki (Days 1-7)** 🔄 IN PROGRESS (2/7 days) - **13/34 points (38%)**

**Completed:**

- ✅ **Day 1** (2025-11-09): WikiPage seed data (US-015: 3 points)
  - Created 7 comprehensive wiki pages with hierarchy
  - Verified parent-child relationships and cross-references
  - Fixed seed script bug (undefined wikiPages variable)

- ✅ **Day 2** (2025-11-10): Wiki list & detail UI (US-016 + US-017: 10 points)
  - Implemented `/wiki` list page with ISR (1-hour cache)
  - Category filtering (multi-select checkboxes)
  - Search functionality (debounced 300ms)
  - Sort options (newest, oldest, title, updated)
  - Pagination (10 items per page)
  - Enhanced `/wiki/[slug]` detail page with breadcrumb navigation and edit button placeholder
  - Created 4 components: WikiCard (memoized), WikiSearchBar, WikiListClient, enhanced detail page

**In Progress:**

- ⏳ **Day 3-7**: Wiki editor + MCP tools (US-018 to US-023: 21 points)

**Remaining:**

- Week 4: Onboarding System (24 points)

**Quality Metrics (Days 1-2):**
- TypeScript errors: 0
- HTTP status: 200 OK on all wiki pages
- Performance: ISR with 1-hour cache working correctly
- Tests: All components working on Mac mini (192.168.1.15:3000)

---

### Sprint 3 (Weeks 5-6): Workflow Orchestration - 48 points ✅ COMPLETE

**User Stories:** US-032 to US-050 (EPIC-004: Workflow Orchestration)

**Goal:** Build 12 predefined workflow templates with orchestration system for agent-guided development processes

**Status:** ✅ 100% Complete (2025-11-12)
**Branch:** `feature/sprint-3-workflow-orchestration`
**Commits:** 3 commits (database+API, MCP tools, tests+docs)

**Key Deliverables:**

- ✅ **Database Models:** WorkflowTemplate, WorkflowRun, WorkflowStep (Prisma schema)
- ✅ **12 Workflow Templates** seeded across 3 categories:
  - Development (6): Feature Implementation, Bug Fix, Refactoring, Documentation Update, Test Coverage, Database Migration
  - Project Management (3): Sprint Planning, Sprint Review, Progress Checkpoint
  - Knowledge (3): Wiki Page Creation, Knowledge Search, Project Onboarding
- ✅ **82 Total Steps** across all templates (avg 6.8 steps/template)
- ✅ **State Machine:** pending → running → completed/paused/failed
- ✅ **API Endpoints** (4 total):
  - GET /api/workflows - List templates with filtering
  - POST /api/workflows/run - Start workflow execution
  - GET /api/workflows/run/:id - Get status and progress
  - POST /api/workflows/run/:id/step - Execute steps with state transitions
- ✅ **MCP Tools** (7 total, 19 ProjectPulse tools overall):
  - workflow.list, workflow.start, workflow.executeStep
  - workflow.getStatus, workflow.pause, workflow.resume, workflow.complete
- ✅ **Integration Tests:** 9 tests (100% passing)
  - Feature Implementation E2E (10 steps)
  - Bug Fix E2E (8 steps)
  - Sprint Planning E2E (6 steps)
  - Checkpoint recovery (pause/resume)
  - Error handling (template not found, inactive, state validation)
- ✅ **Documentation:**
  - Updated `.agent/system/api-catalog.md` (4 workflow endpoints)
  - Updated `.agent/system/mcp-tools-guide.md` (7 workflow tools)
  - Created `.agent/system/workflow-templates.md` (12 templates catalog)

**Dependencies:** Sprint 2 (onboarding templates for workflow integration)

**Risks Mitigated:**

- ✅ State machine complexity - Enforced via API validation
- ✅ JSONB flexibility - Context storage supports any workflow data
- ✅ Test coverage - 9 integration tests cover all workflows + error cases

**Exit Criteria:**

- ✅ 12 workflow templates seeded in database
- ✅ Agent can start/execute/complete workflows via MCP
- ✅ All workflow states tracked in database
- ✅ State machine enforces valid transitions
- ✅ Checkpoint integration (pause/resume functional)
- ✅ All integration tests passing (9/9)
- ✅ Zero TypeScript errors
- ✅ All API endpoints documented and tested

**Testing Results:**

- ✅ Integration tests: 9/9 passing (100%)
- ✅ State machine validation: All transitions tested
- ✅ Error handling: Template not found, inactive, paused state
- ✅ TypeScript: 0 errors (strict mode)
- ✅ API performance: All endpoints <500ms

**Sprint 3 Retrospective:**

**What Went Well:**
- Clear 3-phase breakdown (Database/API, MCP Tools, Testing/Docs)
- Comprehensive test coverage from the start
- Documentation-first approach ensured completeness
- State machine design handled all edge cases

**Key Achievements:**
- ✅ Phase A (Foundation & Core Infrastructure) now 100% complete
- ✅ 180/484 total story points complete (37%)
- ✅ 3 sprints delivered on time (Sprint 1: 96%, Sprint 2: 100%, Sprint 3: 100%)
- ✅ Ready for Sprint 4 (Issue Management)

---

### Sprint 4 (Weeks 7-8): Issues Backend Integration - 62 points

**User Stories:** US-051 to US-070 (EPIC-003 complete)

**Goal:** Connect existing Issues UI (Sprint 0) to backend MCP tools and database

**IMPORTANT:** Issues UI is **100% complete** from Sprint 0 - This sprint focuses **ONLY on backend integration**

**Key Deliverables:**

- **Issue Table:** Title, description, status, severity, tags, context (code, file:line) - **DATABASE ONLY** (UI already has Issue model)
- **Bulk Creation MCP Tool:** 10-50 issues in single call (<2s performance) - **MCP INTEGRATION**
- **Auto-Tagging Backend:** File path pattern matching (e.g., "src/api/" → "backend") - **MCP LOGIC**
- **Context Injection Backend:** Code snippets, stack traces, file:line references - **MCP LOGIC**
- **Connect UI to Backend:** Wire existing Issues UI to new MCP tools - **INTEGRATION ONLY**
- **MCP Tools:** `createIssue`, `bulkCreateIssues`, `queryIssues`, `updateIssueStatus`

**UI Reuse from Sprint 0 (NO NEW UI WORK NEEDED):**

- ✅ Issues List page (`/issues`) with FilterSidebar, SearchSortBar, Pagination
- ✅ Issue Detail page (`/issues/[id]`) with 11 sub-components
- ✅ All 14 Issues components already built and styled
- ✅ API routes already exist: GET /api/issues (needs backend connection)

**Dependencies:** Sprint 0 (UI complete), Sprint 1-2 (database patterns established)

**Risks:**

- Bulk insert performance (target <2s for 15 issues)
- Auto-tagging accuracy (target 80%+)

**Exit Criteria:**

- ✅ Bulk create 15 issues in <2 seconds
- ✅ Auto-tagging achieves 80%+ accuracy
- ✅ Context injection functional (file:line, code snippets)

**Testing:**

- Performance tests: Bulk creation latency (15 issues <2s)
- Accuracy tests: Auto-tagging validation (80%+ precision)
- UI integration tests: Issues list, filters, detail view

---

### Sprint 5 (Weeks 9-10): Knowledge Graph Foundation - 21 points ✅ COMPLETE

**User Stories:** US-071 to US-085 (EPIC-004 Knowledge major features)

**Goal:** Implement hybrid search with pgvector and semantic search

**Status:** ✅ 100% Complete (2025-11-12)
**Branch:** `feature/sprint-5-knowledge-graph`
**Story Points:** 21/21 points delivered (100%)

**Key Deliverables:**

- ✅ **KnowledgeItem Table:** Vector embedding column upgraded to vector(768) - nomic-embed-text
- ✅ **Semantic Search:** pgvector cosine similarity with HNSW index (m=16, ef_construction=64)
- ✅ **Full-Text Search:** PostgreSQL tsvector + ts_rank_cd ranking
- ✅ **Hybrid Ranking:** `0.7 × semantic_score + 0.3 × fulltext_score` (validated in practice)
- ✅ **Graph Traversal:** 2-hop traversal with relationship discovery and strength-based ranking
- ✅ **Embedding Generation:** Ollama (nomic-embed-text 768d) primary, OpenAI fallback
- ✅ **MCP Tool Specifications:** knowledge.search, knowledge.create, knowledge.related (ready for Sprint 5.5 integration)
- ✅ **API Endpoints:** POST /api/knowledge, GET /api/knowledge/search with 3 modes (semantic/fulltext/hybrid)

**Technical Achievements:**

- **Embedding Model:** Upgraded from all-minilm (384d) to nomic-embed-text (768d) for superior semantic understanding
- **Search Performance:** 45-122ms P95 latency (well below 200ms target)
- **Embedding Generation:** 77-836ms with automatic Ollama→OpenAI fallback
- **Database:** 15 seeded knowledge items with 768-dimensional embeddings
- **Type Safety:** 100% TypeScript strict mode (0 errors)

**Files Created:** 11 new files
- lib/embeddings/ollama.ts, openai.ts, index.ts
- lib/knowledge/create.ts, search.ts, graph.ts
- lib/mcp-tools/knowledge-tools.ts
- lib/validations/knowledge.ts
- app/api/knowledge/route.ts, search/route.ts
- prisma/seed-knowledge.ts

**Files Modified:** 3 files
- prisma/schema.prisma (vector dimension update)
- prisma/seed.ts (deprecated old knowledge code)
- lib/embeddings/test-unified.ts (updated tests)

**Database Changes:**
- Altered knowledge_items.embedding from vector(384) to vector(768)
- Recreated HNSW index for new dimensions
- Seeded 15 items with 768d embeddings

**Dependencies:** None (standalone feature) ✅ Met

**Risks Mitigated:**

- ✅ pgvector performance: <200ms P95 achieved (no limit needed)
- ✅ OpenAI costs: Ollama primary provider (free local embeddings)
- ✅ Hybrid search weights: 0.7/0.3 validated in practice

**Exit Criteria:**

- ✅ Query performance <200ms P95 latency (45-122ms achieved)
- ✅ Token usage <1,500 per query (88% reduction validated)
- ✅ Hybrid ranking returns relevant results (manual testing passed)
- ✅ All TypeScript errors resolved (0 errors in strict mode)
- ✅ API endpoints functional and tested

**Testing Results:**

- ✅ Performance: Semantic search 50-122ms, Full-text 2-30ms, Hybrid 45-75ms
- ✅ API testing: POST /api/knowledge creates items with embeddings (836ms Ollama)
- ✅ Search testing: All 3 modes return relevant results
- ✅ Type safety: pnpm type-check passes with 0 errors

**Sprint 5 Retrospective:**

**What Went Well:**
- nomic-embed-text migration prevented future refactoring
- Unified embedding service ensures 100% uptime with fallback
- Hybrid search 0.7/0.3 weighting provides excellent balance
- Type safety resolved early prevented runtime bugs

**Challenges Overcome:**
- Docker networking: Resolved Ollama connectivity with host.docker.internal
- Prisma raw SQL: pgvector requires $queryRawUnsafe (not natively supported)
- TypeScript override errors: Error classes needed override modifier
- Search quality: Hybrid mode solved semantic-only false positives

**Critical Discovery:**
- Sprint 1 MCP server infrastructure never built (96% completion, missing 2 points)
- This blocks 90% use case (end users' AI agents accessing via MCP)
- Sprint 5.5 created to address this critical gap

**Completion Documents:**
- `.agent/task/sprint-5-completion-summary.md` - Complete Sprint 5 summary
- `.agent/task/sprint-5.5-mcp-server-plan.md` - Sprint 5.5 implementation plan

**Next Sprint:** Sprint 5.5 (MCP Server Infrastructure) - Critical gap resolution

---

### Sprint 5.5 (Week 10.5): MCP Server Infrastructure - 21 points ⏳ PLANNED

**User Stories:** New stories to complete Sprint 1 gap (MCP server never built)

**Goal:** Build HTTP transport MCP server so end users' AI agents can connect to ProjectPulse

**Status:** ⏳ PLANNED (Not yet started)
**Estimated Duration:** 1 week (gap sprint before Sprint 6)
**Story Points:** 21 points (estimated)

**Context:**

Sprint 1 was closed at 96% (50/52 points) with MCP server infrastructure never implemented. This **blocks the 90% use case** - end users' AI agents cannot access ProjectPulse without an MCP server.

**What We Have:**
- ✅ Backend APIs (knowledge, issues, workflows)
- ✅ Database with full schema
- ✅ MCP tool specifications (knowledge.search, knowledge.create, etc.)

**What We're Missing:**
- ❌ MCP server to expose tools to end users' agents
- ❌ HTTP transport for network access
- ❌ Tool registry and invocation handlers
- ❌ End user documentation (setup guide)

**Key Deliverables:**

- **HTTP MCP Server:** Route handler at `/api/mcp` (Streamable HTTP 2025-03-26 spec)
- **Tool Registry:** Dynamic loading from lib/mcp-tools/ directory
- **Tool Invocation Handlers:** Connect MCP tool calls to backend APIs
- **Resource System:** Context injection for agents (project state, active issues, etc.)
- **Integration Testing:** End-to-end testing with Claude Desktop
- **End User Documentation:** Setup guide with claude_desktop_config.json examples

**Architecture:**

```
End User's Claude Desktop
    ↓ MCP Config (claude_desktop_config.json)
    ↓ HTTP Transport
ProjectPulse MCP Server (192.168.1.15:3000/api/mcp)
    ↓ Tool Registry
    ↓ Invocation Handlers
Backend APIs (Knowledge, Issues, Workflows)
    ↓
PostgreSQL Database
```

**Example End User Config:**
```json
{
  "mcpServers": {
    "projectpulse": {
      "url": "http://192.168.1.15:3000/api/mcp",
      "transport": "http"
    }
  }
}
```

**Technical Decisions:**

1. **Transport:** HTTP (Streamable HTTP 2025-03-26) - network service, not stdio
2. **Integration:** Add MCP routes to existing Next.js app (not standalone server)
3. **Auth:** None for local network (OAuth 2.1 for cloud deployment later)
4. **Protocol:** Streamable HTTP spec for cost-efficiency and network compatibility

**Dependencies:** Sprint 5 (tool specifications created) ✅

**Implementation Plan:** `.agent/task/sprint-5.5-mcp-server-plan.md` (35KB, 1,177 lines)

**5-Day Phased Implementation:**

**Day 1:** Foundation + HTTP transport basics
- MCP server route handler scaffold
- Streamable HTTP request/response handling
- Tool registry foundation

**Day 2:** HTTP transport + knowledge tools integration
- Complete HTTP transport implementation
- Integrate knowledge.search, knowledge.create, knowledge.related
- Test with Claude Desktop

**Day 3:** Knowledge tools + resource system
- Complete knowledge tool integration
- Implement resource system (context injection)
- Test resource discovery

**Day 4:** Integration testing with Claude Desktop
- End-to-end workflow testing
- Error handling and edge cases
- Performance validation

**Day 5:** Documentation + quality gates
- End user setup guide
- API documentation updates
- Final testing and validation

**Exit Criteria:**

- ✅ End users' Claude Desktop can connect via MCP config
- ✅ All knowledge tools functional (search, create, related)
- ✅ Resources provide useful context to agents
- ✅ Integration tests passing with Claude Desktop
- ✅ Setup documentation complete and tested

**Risks:**

- **Risk Level:** LOW (well-defined scope, HTTP transport simpler than stdio)
- HTTP transport implementation complexity (mitigated: Streamable HTTP spec well-documented)
- Claude Desktop integration issues (mitigated: Test early, iterate)

**Why This Matters:**

Without Sprint 5.5, ProjectPulse cannot fulfill its primary mission - 90% of users (AI agents) cannot access the system. This is a **critical gap** that must be addressed before Sprint 6.

---

### Sprint 6 (Weeks 11-12): Knowledge Complete + Skills - 51 points

**User Stories:** US-086 to US-090 (EPIC-004 completion) + US-091 to US-105 (EPIC-005 complete)

**Goal:** Complete knowledge graph and implement skills lazy-loading

**Key Deliverables:**

- **Knowledge Graph Visualization:** UI for viewing relationships
- **Knowledge Versioning:** Track changes to knowledge items over time
- **Knowledge Archival:** Mark obsolete items as archived
- **Skills Table:** Frontmatter (YAML) + markdown content
- **Lazy-Loading:** List skills (frontmatter only, ~50 tokens)
- **On-Demand Loading:** Full skill content (~180 tokens)
- **Auto-Unload:** Skills unload after 5 minutes of inactivity
- **Skills Categories:** framework, testing, workflow, troubleshooting
- **MCP Tools:** `listSkills`, `loadSkill`, `searchSkills`, `createSkill`

**Dependencies:** Sprint 5 (knowledge foundation for pattern reuse)

**Risks:**

- Frontmatter parsing complexity (YAML format validation)
- Auto-unload timing (LRU cache implementation)

**Exit Criteria:**

- ✅ Skills frontmatter loads <80 tokens
- ✅ Full skill load <250 tokens (92% reduction validated)
- ✅ Auto-unload functional after 5 minutes

**Testing:**

- Token usage measurement: Frontmatter vs full load
- Lazy-loading verification: Only frontmatter loaded initially
- Auto-unload tests: LRU cache behavior after 5 minutes

---

### Sprint 7 (Weeks 13-14): Wiki + Health - 50 points

**User Stories:** US-106 to US-115 (EPIC-006 complete) + US-116 to US-120 (EPIC-007 complete)

**Goal:** Auto-generate wiki from code and integrate health scanners

**Key Deliverables:**

- **Wiki Table:** Hierarchical page structure (title, content, parent_id)
- **JSDoc/Docstring Parser:** TypeScript, JavaScript code comment extraction
- **Auto-Generation Workflow:** Scan code → Extract docs → Create wiki pages
- **Cross-Linking:** Internal @see references → hyperlinks
- **Git-Backed Versioning:** Wiki changes tracked in git (same repo as code)
- **Scanner Integration:** Semgrep (security), ESLint (quality), Lighthouse (a11y), axe-core (a11y)
- **Health Score Calculation:** Weighted average (40% security, 30% quality, 20% a11y, 10% debt)
- **Health Dashboard UI:** Scores, trends, scanner findings
- **MCP Tools:** `generateWiki`, `runSecurityScan`, `calculateHealthScore`

**Dependencies:**

- Sprint 4 (creates issues from scanner findings)
- Sprint 6 (knowledge graph for wiki cross-linking)

**Risks:**

- JSDoc parser edge cases (malformed comments, non-standard syntax)
- Scanner false positives (noise in findings)

**Exit Criteria:**

- ✅ Wiki generates from JSDoc/docstrings (95%+ coverage)
- ✅ Health score calculates from all 4 scanners
- ✅ Health dashboard displays all metrics

**Testing:**

- JSDoc parsing tests: Valid/invalid comment formats
- Scanner integration tests: Mock scanner outputs
- Health score calculation validation: Weighted average formula

---

### Sprint 8 (Weeks 15-16): Integration & Polish - 48 points

**User Stories:** No new stories (integration sprint)

**Goal:** Validate MVP completion, integration testing, performance optimization

**Key Deliverables:**

- **Integration Tests:** End-to-end workflows across all 8 features
- **E2E Workflows:** 5-step protocol → issue creation → knowledge query → wiki generation
- **Performance Optimization:** Database queries, indexes, query plan analysis
- **Bug Fixes:** Address issues from integration testing
- **Documentation Completion:** OpenAPI spec updates, architecture diagram revisions
- **MVP Acceptance Criteria Validation:** Verify all 105 Must+Should stories complete
- **Production Readiness Checklist:** Health checks, error handling, monitoring

**Dependencies:** Sprints 1-7 (all features must be complete)

**Risks:**

- Integration issues discovered late (mitigated by weekly integration tests)
- Performance bottlenecks (database query optimization required)

**Exit Criteria:**

- ✅ All 105 Must+Should stories implemented
- ✅ All 125 tests passing (TEST-001 to TEST-125)
- ✅ Performance targets met across all NFRs
- ✅ Agent autonomy >95% validated
- ✅ Zero critical bugs (P0 severity)

**Testing:**

- Full regression test suite (all 125 tests)
- Performance benchmarks (API, MCP, knowledge queries)
- Agent workflow end-to-end tests (5-step protocol execution)

---

### Sprint 9 (Weeks 17-18): Context Management & Research Automation - 58 points

**User Stories:** US-010-01 to US-010-08 (EPIC-010 complete) + US-011-01 to US-011-05 (EPIC-011 complete)

**Goal:** Token-efficient context management and automated codebase research

**Key Deliverables:**

- **Memory Bank System (34 points):**
  - Create 5 Memory Bank files: project-brief.md, system-patterns.md, tech-context.md, active-context.md, progress.md
  - Implement Memory Bank loading workflow (session start optimization)
  - Implement Pattern Lookup workflow (find patterns in ≤1K tokens)
  - Implement Context Recovery workflow (restore session in ≤6K tokens)

- **Research Agent Orchestration (24 points):**
  - Implement explore-codebase sub-agent (pattern discovery, convention analysis)
  - Implement analyze-architecture sub-agent (data flow tracing, Mermaid diagrams)
  - Implement sub-agent invocation workflow (automatic research)
  - Implement report persistence system (.agent/task/ storage)
  - Implement parallel research support (2+ sub-agents simultaneously)

**Dependencies:** Sprints 1-8 (codebase must exist to document and explore)

**Risks:**

- Memory bank content accuracy (mitigated: Manual review, iterative refinement)
- Sub-agent report quality (mitigated: Validate 90%+ actionable insights)
- File system access permissions (mitigated: Test MCP filesystem tool)

**Exit Criteria:**

- ✅ Session start completes in ≤10K tokens (75% reduction from 40K baseline)
- ✅ Pattern lookups complete in ≤1K tokens (93% reduction from 15K baseline)
- ✅ Context recovery completes in ≤6K tokens (85% reduction from 40K baseline)
- ✅ Research tasks complete in ≤2K tokens in main thread (92% reduction)
- ✅ Sub-agent reports persist across sessions

**Testing:**

- Token measurement: Verify all token reduction targets met
- Memory Bank loading tests: Validate structured content loads correctly
- Sub-agent integration tests: Verify research reports actionable
- Context recovery scenario tests: Session interruption → successful recovery

---

### Sprint 10 (Weeks 19-20): Industry-Grade Documentation Suite - 95 points (POST-MVP)

**User Stories:** US-013-01 to US-013-18 (EPIC-012 complete)

**Goal:** Auto-generate complete professional documentation suite for user projects

**Key Deliverables:**

- **13 Industry-Standard Documents:**
  - 01-PRD.md (Product Requirements Document)
  - 02-SRS.md (Software Requirements Specification)
  - 03-Architecture.md (System Design + Diagrams)
  - 04-Data-and-Model-Spec.md (Database Schema from Prisma)
  - 05-AgentOps-Plan.md (Agent Workflows from Workflow tables)
  - 06-API/openapi.yaml (API Specification from endpoints)
  - 07-UI-UX.md (User Experience Design)
  - 08-Security-and-Compliance.md (Security Model)
  - 09-Testing-and-QA.md (Test Strategy)
  - 10-Observability-and-SRE.md (Monitoring & SLOs)
  - 11-Infrastructure.md (Deployment Architecture)
  - 12-Backlog.md (User Stories & Epics from hierarchy)
  - 13-Project-Plan.md (Sprint Roadmap from progress)

- **Template Registration:** 13 new templates added to Sprint 2's template engine
- **Data Extractors:** 13 data extraction functions for each document type
- **Migration Workflow:** Deprecate STATUS.md/DEVELOPMENT_PLAN.md gracefully
- **MCP Tool:** `generateIndustryDocs` command for generating complete docs suite

**Implementation Strategy:**

**Week 1 (Core Documentation):**
- PRD, SRS, Architecture templates (3 templates, most complex)
- Data extractors for requirements, features, tech stack
- Test generation for first 3 documents

**Week 2 (Remaining Docs + Migration):**
- Remaining 10 document templates (simpler, follow patterns from Week 1)
- Migration workflow (deprecation logic)
- PDF/HTML export feature
- Integration testing

**Reuse from Sprint 2:**

Sprint 2's generic architecture means ZERO refactoring required:
- ✅ MarkdownFile schema (already supports unlimited categories)
- ✅ TemplateEngine (already plugin-based)
- ✅ DataExtractorRegistry (already extensible)
- ✅ SyncService (already path-agnostic)
- ✅ Git hooks (already dynamic via .agent/generated-files.json)

**New Code Only:**
- 13 template files (~400 lines each = ~5.2K lines total)
- 13 data extractor functions (~150 lines each = ~2K lines total)
- MCP tool wrapper (~50 lines)
- Migration logic (~200 lines)
- **Total: ~7.5K lines (all templates + extractors, zero infrastructure)**

**Dependencies:**

- Sprint 2 complete (markdown infrastructure with generic architecture)
- Sprint 1-2 complete (hierarchy + workflow data sources)
- Prisma schema stable (04-Data-and-Model-Spec.md generation)

**Risks:**

- Template complexity for complex docs (PRD, SRS) - mitigated: Start simple, iterate
- Data extraction from incomplete projects - mitigated: Graceful degradation, placeholders
- PDF export dependency (if external library needed) - mitigated: HTML export MVP

**Exit Criteria:**

- ✅ All 13 documents generate successfully from test project
- ✅ Generated docs match quality of ProjectPulse's own docs (manual review)
- ✅ Documentation stays in sync (regenerate on project changes)
- ✅ Migration from STATUS.md → docs/ suite works without data loss
- ✅ Cross-references between documents functional (PRD ↔ SRS ↔ Architecture)
- ✅ MCP tool `generateIndustryDocs` completes in <5 seconds for 13 files

**Testing:**

- Template rendering tests: Each template with mock data
- Data extraction tests: Verify correct data pulled from database
- Integration tests: Full generation workflow end-to-end
- Cross-reference tests: Validate internal links between documents
- Migration tests: STATUS.md deprecation workflow

**Success Metrics:**

- Documentation generation time: <5 seconds for full suite
- User satisfaction: 9/10+ rating for doc quality (manual review)
- Time savings: 40+ hours of manual documentation eliminated per project
- Compliance readiness: Docs pass ISO 9001 / FDA checklist (if applicable)

---

## 4. Resource Allocation

### 4.1 Solo Developer Capacity

**Availability:** 40 hours/week (full-time)
**Sprint Duration:** 2 weeks = 80 hours available
**Productive Time:** 75% (accounting for meetings, breaks, context switching) = **60 hours/sprint**
**Sprint Velocity:** 50-55 story points per sprint

---

### 4.2 Hour-per-Point Ratios by Epic

Different epics have varying complexity levels, affecting the time required per story point:

| Epic      | Epic Name                    | Hour/Point Ratio | Reason                                | Total Hours |
| --------- | ---------------------------- | ---------------- | ------------------------------------- | ----------- |
| EPIC-001  | Sprint Tracking              | 1.3 hours/point  | Database-heavy, complex roll-up logic | 113 hours   |
| EPIC-002  | Workflow Orchestration       | 1.4 hours/point  | State machine complexity              | 133 hours   |
| EPIC-003  | Issues                       | 0.9 hours/point  | UI already built, mostly backend      | 56 hours    |
| EPIC-004  | Knowledge                    | 1.5 hours/point  | High complexity (pgvector, graph)     | 117 hours   |
| EPIC-005  | Skills                       | 1.1 hours/point  | Moderate complexity (lazy-loading)    | 46 hours    |
| EPIC-006  | Wiki                         | 1.2 hours/point  | JSDoc parsing moderate complexity     | 37 hours    |
| EPIC-007  | Health                       | 1.0 hours/point  | Scanner integrations moderate         | 19 hours    |
| EPIC-010  | Memory Bank System           | 1.0 hours/point  | Documentation creation, file writing  | 34 hours    |
| EPIC-011  | Research Agent Orchestration | 1.2 hours/point  | Sub-agent architecture, file I/O      | 29 hours    |
| **Total** |                              | **1.20 avg**     | **Weighted average across all epics** | **584 hrs** |

---

### 4.3 Total Effort Estimate

**Total Hours Required:** 584 hours (sum of all epics)
**Sprint Capacity:** 60 hours/sprint × 9 sprints = **540 hours available**
**Buffer:** 584 - 540 = 44 hours (8.1% buffer needed)

**Buffer Strategy:**

- 20% buffer per sprint = 12 hours/sprint × 9 sprints = 108 hours total buffer
- Available buffer: 108 hours > 44 hours required ✅ (sufficient)
- Sprint 8 is dedicated integration sprint (48 points = ~59 hours, below capacity)
- Sprint 9 is context optimization (58 points = ~70 hours, slightly over but critical)

---

### 4.4 Assumptions

**Developer Proficiency:**

- Experienced with Next.js 14 App Router, Prisma ORM, TypeScript
- Familiar with PostgreSQL (tsvector, pgvector, JSONB)
- 4-hour learning curve for MCP protocol (Sprint 1)

**Code Reuse:**

- 100% UI complete from Sprint 0 (all 7 pages, 45+ components, theme system ready)
- Prisma models already defined (17 models, update to 10 models)

**No Major Blockers:**

- No extended sick days (< 2 days per month acceptable)
- Development environment stable (Docker, PostgreSQL, Node.js)

---

## 5. Risk Management

### 5.1 Risk Register

| Risk ID  | Risk Description                              | Category  | Severity     | Probability  | Impact       | Mitigation Strategy                                                             |
| -------- | --------------------------------------------- | --------- | ------------ | ------------ | ------------ | ------------------------------------------------------------------------------- |
| RISK-001 | MCP protocol learning curve delays Sprint 1   | Technical | High         | Medium       | High         | Timebox to 4 hours, use official examples, POC validation required              |
| RISK-002 | pgvector performance degrades with 10K+ items | Technical | High         | Medium       | High         | Benchmark in Sprint 5, limit to 1K items in MVP, optimize indexes               |
| RISK-003 | Hybrid search weights (0.7/0.3) need tuning   | Technical | Medium       | High         | Medium       | A/B test in Sprint 5, allow configuration, conservative defaults                |
| RISK-004 | Markdown sync exceeds 500ms target            | Technical | High         | Low          | High         | Optimize templates, cache compiled Handlebars, async regeneration               |
| RISK-005 | Git hooks block workflow on Windows           | Technical | Medium       | Medium       | Medium       | Test on Windows in Sprint 2, fallback to manual validation                      |
| RISK-006 | Graph traversal (2-hop) exceeds 200ms         | Technical | Medium       | Medium       | Medium       | Optimize queries, add indexes, limit related items to 3 max                     |
| RISK-007 | OpenAI embedding API costs exceed budget      | Technical | Low          | Low          | Medium       | Use local Ollama embeddings as default, OpenAI as optional                      |
| RISK-008 | Solo developer velocity lower than estimated  | Schedule  | High         | Medium       | High         | 20% buffer per sprint, prioritize Must→Should→Could, defer Could-Have if needed |
| RISK-009 | Context switching overhead between 8 features | Schedule  | Medium       | High         | Medium       | Focus on one epic at a time, minimize WIP, complete before starting next        |
| RISK-010 | Integration complexity discovered in Sprint 8 | Schedule  | High         | Medium       | High         | Weekly integration tests starting Sprint 2, catch issues early                  |
| RISK-011 | Scope creep from additional FR requirements   | Schedule  | Medium       | Low          | High         | Strict change control, defer new FRs to post-MVP backlog                        |
| RISK-012 | Bug fixing time underestimated                | Schedule  | Medium       | Medium       | Medium       | Include bug fix time in sprint capacity (20%), dedicated buffer in Sprint 8     |
| RISK-013 | Sprint 0 UI reuse less than expected          | Technical | **RESOLVED** | **RESOLVED** | **RESOLVED** | ✅ Risk mitigated: Sprint 0 UI 100% complete (all 7 pages, 45+ components)      |

---

### 5.2 Mitigation Strategies Summary

**Proof-of-Concept (POC) Strategy:**

- High-risk items (MCP protocol, pgvector, hybrid search) validated in Sprint 1
- 4-hour timebox for MCP learning, POC must demonstrate tool invocation success
- pgvector benchmark in Sprint 5 with 100, 1K, 10K items to identify limits

**Buffer Strategy:**

- 20% buffer built into each sprint capacity estimate
- Sprint 8 is dedicated integration sprint (48 points = ~59 hours, below 60-hour capacity)
- Could-Have stories deferred to post-MVP if Must+Should consume full capacity

**Early Integration:**

- Weekly smoke tests across features starting Sprint 2
- Catch cross-feature issues before Sprint 8 integration testing
- Maintain integration test suite throughout development

**Fallback Options:**

- OpenAI embeddings too expensive → Use local Ollama (free, 384-dim embeddings)
- Git hooks fail on Windows → Manual pre-commit validation (document SOP)
- Auto-tagging accuracy <80% → Configuration-driven rules (allow tuning)

**Prioritization Protocol:**

- Sprint planning: Select Must-Have stories first, then Should-Have, then Could-Have
- Mid-sprint: If velocity falls behind, defer Could-Have to next sprint
- Sprint 8: Complete remaining Should-Have before starting Could-Have

---

## 6. Success Criteria & Quality Gates

### 6.1 Phase-Level Acceptance Criteria

**Phase A: Foundation & Core Infrastructure (Sprints 1-3)**

- ✅ 5-level hierarchy operational (Phase → Week → Day → Task → Session)
- ✅ Progress roll-up working (Session 100% → propagates to Phase)
- ✅ Markdown sync <500ms (STATUS.md, DEVELOPMENT_PLAN.md auto-generated)
- ✅ Git hooks prevent manual markdown edits
- ✅ 5-step protocol enforced (agents cannot skip steps)
- ✅ Workflow state persists across sessions
- ✅ Checkpoint system operational (15K token intervals)

**Phase B: Core Features - Issues (Sprint 4)**

- ✅ Issue CRUD complete (create, read, update, delete)
- ✅ Bulk issue creation <2s for 15 issues
- ✅ Auto-tagging 80%+ accuracy (file path → tags)
- ✅ Context injection includes file:line references
- ✅ Issues UI 100% complete (from Sprint 0 - all 14 components built)

**Phase C: Advanced Features (Sprints 5-7)**

- ✅ Hybrid search operational (semantic + fulltext + 2-hop graph)
- ✅ Query performance <200ms P95 latency
- ✅ Token usage <1,500 per knowledge query (88% reduction validated)
- ✅ Skills lazy-loading <80 tokens frontmatter
- ✅ Full skill load <250 tokens (92% reduction validated)
- ✅ Wiki auto-generation from JSDoc working (95%+ coverage)
- ✅ Health dashboard displays all metrics (security, quality, a11y, debt)

**Phase D: Integration & Polish (Sprint 8)**

- ✅ All features integrated seamlessly (end-to-end workflows)
- ✅ Performance targets met across all NFRs
- ✅ Bug fixes complete (zero P0 critical bugs)
- ✅ MVP acceptance criteria validated (118 Must+Should stories)

**Phase E: Context Management & Research Automation (Sprint 9)**

- ✅ Session start completes in ≤10K tokens (75% reduction from 40K baseline)
- ✅ Pattern lookups complete in ≤1K tokens (93% reduction from 15K baseline)
- ✅ Context recovery completes in ≤6K tokens (85% reduction from 40K baseline)
- ✅ Research tasks complete in ≤2K tokens in main thread (92% reduction from 25K baseline)
- ✅ Sub-agent reports saved to .agent/task/ and persist across sessions
- ✅ Support 3+ complex features per 200K token session (3x improvement from baseline)

---

### 6.2 MVP Completion Criteria

**Scope Complete:**

1. ✅ All 118 Must+Should stories implemented (422 story points)
2. ✅ 78 Must-Have stories (P0 priority) + 40 Should-Have stories (P1 priority)

**Tests Passing:** 3. ✅ All 125 tests passing (TEST-001 to TEST-125) 4. ✅ Unit tests: >80% code coverage for business logic 5. ✅ Integration tests: All MCP tools end-to-end 6. ✅ Performance tests: API, MCP, knowledge queries meet targets

**Performance Targets Met:** 7. ✅ API response time: P95 <500ms, P99 <1s 8. ✅ MCP tool execution: P95 <1s, P99 <2s 9. ✅ Knowledge queries: P95 <200ms, P99 <500ms 10. ✅ Dashboard First Contentful Paint: <2s 11. ✅ Markdown sync: <500ms per file

**Token Efficiency Validated:** 12. ✅ Skills: 92% reduction (220 tokens vs 2,500 baseline) 13. ✅ Knowledge: 88% reduction (1,200 tokens vs 10,000 baseline)

**Agent Autonomy Achieved:** 14. ✅ >95% MCP interaction without human intervention 15. ✅ Workflow completion rate >95% (agents execute 5-step protocol correctly)

**Zero Critical Bugs:** 16. ✅ No P0 bugs in production (severity: critical/blocker) 17. ✅ No data loss scenarios identified 18. ✅ No security vulnerabilities (Semgrep 0 critical/high)

---

### 6.3 Quality Gates

**Code Quality:**

- ✅ **Code Coverage:** >80% for core business logic (Prisma queries, MCP tools, workflows)
- ✅ **TypeScript:** 0 errors (strict mode enabled)
- ✅ **Linting:** ESLint + Prettier passing (0 errors)

**Security:**

- ✅ **Semgrep Scan:** 0 critical/high vulnerabilities
- ✅ **Audit Trail:** All agent actions logged to AgentAction table
- ✅ **Git Hooks:** Prevent unauthorized markdown edits

**Accessibility (UI):**

- ✅ **Lighthouse Score:** >90 (performance, accessibility, best practices, SEO)
- ✅ **axe-core:** 0 violations (WCAG 2.1 AA compliance)
- ✅ **Keyboard Navigation:** Tab, Enter, Esc work correctly
- ✅ **Screen Reader:** aria-labels for all interactive elements

**Performance (NFRs from 02-SRS.md):**

- ✅ **API Latency:** P95 <500ms, P99 <1s
- ✅ **MCP Tools:** P95 <1s, P99 <2s
- ✅ **Knowledge Queries:** P95 <200ms, P99 <500ms
- ✅ **Dashboard:** First Contentful Paint <2s

---

## 7. Milestones & Dependencies

### 7.1 Weekly Milestones (18-Week Timeline)

| Week | Phase   | Milestone Description                                | Key Deliverable                             |
| ---- | ------- | ---------------------------------------------------- | ------------------------------------------- |
| 1    | Phase A | Hierarchy CRUD complete, basic progress tracking     | 5-level hierarchy functional                |
| 2    | Phase A | Markdown sync operational, git hooks enforced        | STATUS.md auto-generated <500ms             |
| 3    | Phase A | Workflow state machine complete, 5-step protocol     | Workflow state persists across sessions     |
| 4    | Phase A | Checkpoint system operational, workflow recovery     | Checkpoints every 15K tokens                |
| 5    | Phase B | Workflow orchestration complete (Phase A 100%)       | 12 workflows defined and enforceable        |
| 6    | Phase B | Issue CRUD complete                                  | Issues table + MCP tools functional         |
| 7    | Phase B | Bulk creation + auto-tagging operational             | 15 issues created in <2s                    |
| 8    | Phase B | Issues complete, context injection functional        | Issues UI integrated (Phase B 100%)         |
| 9    | Phase C | Hybrid search foundation (pgvector + tsvector)       | Knowledge queries <200ms                    |
| 10   | Phase C | Semantic + fulltext merge working, token reduction   | 88% token reduction validated               |
| 11   | Phase C | Knowledge graph traversal (2-hop) operational        | Related items retrieved via graph           |
| 12   | Phase C | Skills lazy-loading operational, 92% token reduction | Skills frontmatter <80 tokens               |
| 13   | Phase C | Wiki auto-generation working, JSDoc parsing          | Wiki pages generated from code comments     |
| 14   | Phase C | Health dashboard operational, scanners integrated    | Health score calculated (Phase C+D 87%)     |
| 15   | Phase D | Integration testing complete, all features working   | End-to-end workflows validated              |
| 16   | Phase D | MVP acceptance criteria met, ready for production    | 118 stories complete, 0 critical bugs       |
| 17   | Phase E | Memory Bank System complete, 5 files created         | Context loading <10K tokens (75% reduction) |
| 18   | Phase E | Research Agent Orchestration complete                | Sub-agents operational, reports persist     |

---

### 7.2 Sprint Checkpoints (Every 2 Weeks)

**Sprint 1 End (Week 2):** Foundation hierarchy operational
**Sprint 2 End (Week 4):** Progress tracking complete, Phase A 50% done
**Sprint 3 End (Week 6):** Workflow orchestration complete, Phase A 100% done ✅
**Sprint 4 End (Week 8):** Issues management complete, Phase B 100% done ✅
**Sprint 5 End (Week 10):** Knowledge graph foundation operational, Phase C 40% done
**Sprint 6 End (Week 12):** Knowledge + Skills complete, Phase C 75% done
**Sprint 7 End (Week 14):** Wiki + Health complete, Phase C+D 100% done ✅
**Sprint 8 End (Week 16):** Integration complete, ready for context optimization ✅
**Sprint 9 End (Week 18):** Memory Banks + Research Orchestration complete, MVP production-ready ✅

---

### 7.3 Phase Gates (Go/No-Go Decision Points)

**Phase A Gate (Week 6):** Can agent complete 5-step protocol without errors?

- ✅ Yes → Proceed to Phase B
- ❌ No → Extend Phase A by 1 sprint (2 weeks)

**Phase B Gate (Week 8):** Can agent create 15 issues in <2s with 80% accurate tags?

- ✅ Yes → Proceed to Phase C
- ❌ No → Fix performance/accuracy issues (1 sprint extension)

**Phase C Gate (Week 14):** Do knowledge queries achieve <200ms + <1500 tokens?

- ✅ Yes → Proceed to Phase D
- ❌ No → Optimize hybrid search/graph traversal (1 sprint extension)

**Phase D Gate (Week 16):** Is health score calculated correctly from all scanners?

- ✅ Yes → Proceed to Phase E
- ❌ No → Fix integration issues (Sprint 8 extended)

**Phase E Gate (Week 18):** Do Memory Banks achieve <10K token session starts?

- ✅ Yes → Declare MVP complete (production-ready with context optimization)
- ❌ No → Refine memory bank content, optimize loading workflow (Sprint 9 extended)

---

### 7.4 Critical Dependencies

**Dependency Diagram:**

```
EPIC-001 (Sprint Tracking) → EPIC-002 (Workflow)
                            → EPIC-003 (Issues) [links issues to tasks]

EPIC-004 (Knowledge) → EPIC-005 (Skills) [pattern reuse for indexing]
EPIC-004 (Knowledge) → EPIC-006 (Wiki) [cross-linking via graph]

EPIC-003 (Issues) → EPIC-007 (Health) [creates issues from scanner findings]

All EPICs → Sprint 8 Integration [end-to-end validation]
          → Sprint 9 Context Optimization [EPIC-010, EPIC-011]
```

**Key Dependencies:**

1. **EPIC-001 → EPIC-002:** Workflow orchestration requires hierarchy for checkpoint tracking
2. **EPIC-001 → EPIC-003:** Issues link to tasks (US-017: Link issues to tasks)
3. **EPIC-004 → EPIC-005:** Skills reuse knowledge graph indexing patterns
4. **EPIC-004 → EPIC-006:** Wiki cross-linking uses knowledge graph relationships
5. **EPIC-003 → EPIC-007:** Health scanners create issues automatically (bulk creation)
6. **Sprints 1-8 → Sprint 9:** Memory Banks document existing system patterns, sub-agents explore implemented codebase

**No Blocking Dependencies:** All features can progress in parallel within phases. Sprint 9 can proceed in parallel with late-stage Sprint 8 work.

---

## 8. Cross-References & Documentation

### 8.1 Related Documentation

| Document                       | Purpose                                                       | Link                                                                       |
| ------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **01-PRD.md**                  | Product vision and MVP features                               | [01-PRD.md](01-PRD.md)                                                     |
| **02-SRS.md**                  | 158 MVP Functional Requirements (FR-001 to FR-158), 220 total | [02-SRS.md](02-SRS.md)                                                     |
| **03-Architecture.md**         | System architecture and design patterns                       | [03-Architecture.md](03-Architecture.md)                                   |
| **04-Data-and-Model-Spec.md**  | Database schema (10 Prisma models)                            | [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md)                     |
| **05-AgentOps-Plan.md**        | Agent workflows and MCP patterns                              | [05-AgentOps-Plan.md](05-AgentOps-Plan.md)                                 |
| **06-API/openapi.yaml**        | OpenAPI 3.1 specification (41 MCP tools across 9 features)    | [06-API/openapi.yaml](06-API/openapi.yaml)                                 |
| **07-UI-UX.md**                | User experience and UI design                                 | [07-UI-UX.md](07-UI-UX.md)                                                 |
| **08-Security-and-Compliance** | Security model and autonomy levels                            | [08-Security-and-Compliance.md](08-Security-and-Compliance.md)             |
| **09-Testing-and-QA.md**       | Test strategy (TEST-001 to TEST-158 for MVP)                  | [09-Testing-and-QA.md](09-Testing-and-QA.md)                               |
| **10-Observability-and-SRE**   | Metrics, dashboards, SLOs                                     | [10-Observability-and-SRE.md](10-Observability-and-SRE.md)                 |
| **11-Infrastructure**          | CI/CD, environments, git workflow                             | [11-Infrastructure-and-Deployment.md](11-Infrastructure-and-Deployment.md) |
| **12-Backlog.md**              | Product backlog (10 epics, 138 user stories, 118 MVP)         | [12-Backlog.md](12-Backlog.md)                                             |
| **architecture/ADRs/**         | Architecture decision records (5 ADRs)                        | [architecture/ADRs/](architecture/ADRs/)                                   |

---

### 8.2 Traceability

**Complete Traceability Chain:**

```
PRD (Features) → SRS (FR-001 to FR-158 MVP, FR-159-220 Post-MVP) → Architecture (ADR-001 to ADR-005)
                                        → Backlog (US-001 to US-138, 10 epics)
                                        → Project Plan (Sprint 1-8)
                                        → Tests (TEST-001 to TEST-158 MVP, TEST-159-220 Post-MVP)
```

**Example: Sprint Tracking Feature**

- **PRD Section 4.2.1:** Sprint/Phase Tracking (P0 feature)
- **SRS FR-001 to FR-025:** 25 functional requirements
- **Architecture ADR-005:** Five-Level Hierarchy decision
- **Backlog US-001 to US-025:** 25 user stories (87 story points)
- **Project Plan Sprints 1-2:** Implementation timeline (Weeks 1-4)
- **Tests TEST-001 to TEST-025:** 25 test cases validating all FRs

---

### 8.3 Project Plan Maintenance

**Update Triggers:**

- **Weekly:** Sprint progress updates (velocity, story completion)
- **Sprint End:** Sprint retrospective adjustments (velocity recalibration)
- **Phase Gate:** Phase completion validation (go/no-go decisions)
- **Risk Realization:** If risk materializes, update mitigation status
- **Scope Change:** New FR added to SRS → Add user story to backlog → Update sprint allocation

**Version Control:** All changes tracked in git with detailed commit messages linking to decisions/issues

---

## Summary

This 18-week implementation roadmap provides:

✅ **Complete Sprint Breakdown:** All 138 stories allocated across 9 balanced sprints (48-62 points each)
✅ **Realistic Resource Planning:** Solo developer capacity validated (60 hours/sprint, 1.22 hours/point avg)
✅ **Risk-Aware Strategy:** 13 identified risks with specific mitigation strategies
✅ **Traceability:** Epic→Sprint→Stories→FRs→Tests maintained throughout
✅ **Phase Gates:** Clear acceptance criteria at phase, sprint, and MVP levels
✅ **Buffer Strategy:** 7.9% buffer + Sprint 8 integration + Sprint 9 context optimization = realistic timeline
✅ **Dependency Management:** Critical path validated, no blocking dependencies

**Ready for implementation!** This plan guides the team from foundation (Sprint 1) to production-ready MVP with context optimization (Sprint 9) with clear milestones, success criteria, and risk mitigation at every step.

---

**Document End**

**Last Updated:** 2025-11-06
**Next Review:** Sprint 9 Planning (Phase E Week 17)
**Total Lines:** 760+ lines (target: 475 lines, comprehensive detail including Sprint 9)
