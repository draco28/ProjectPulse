# Sprint 2 Session Start Prompt

**Copy-paste this at the start of your next session to begin Sprint 2 implementation.**

---

## 🎯 MANDATORY SESSION START PROTOCOL

Read [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md) and follow ALL steps.

**Current Phase**: Sprint 2 - Wiki Page + Onboarding System
**Sprint 2 Target**: 58 points (34 Wiki + 24 Onboarding)
**Requirements**: [docs/13-Project-Plan.md](docs/13-Project-Plan.md) Sprint 2 section, [docs/12-Backlog.md](docs/12-Backlog.md) US-015 to US-031

---

## ✅ CRITICAL CONTEXT (Read First)

**Sprint 2 Vision Clarified** (2025-11-10):
- ❌ **WRONG**: Markdown sync (generates .agent/ folders for users)
- ✅ **CORRECT**: Wiki Page + Onboarding System (database-backed web features)

**What Happened**:
- Original Sprint 2 plan was based on confusion between dogfooding (using ProjectPulse to build itself) vs end user features
- Refactor completed: All docs updated, MarkdownFile removed, memory banks corrected
- Mac mini migration complete: Database cleaned (markdown_files table dropped)

**What ProjectPulse IS**:
- Web-based PM platform that REPLACES .agent/ folders
- End users visit projectpulse.com, create projects, get API keys
- Agents connect via MCP, interact with database
- ALL data in database (Wiki, Knowledge Base, Issues, Development Cycle pages)
- User's repo stays CLEAN (no .agent/ folder, no markdown files)

**What ProjectPulse is NOT**:
- Platform that generates .agent/ folders for end users
- CLAUDE.md generator
- Markdown template system for end users

---

## 📋 SPRINT 2 SCOPE

### EPIC-002: Wiki & Knowledge (34 points)

**Week 3 (Days 1-7)**:

- **US-015**: Wiki database model (3 points) - ✅ WikiPage already exists, seed data needed
- **US-016**: Wiki list page UI (5 points)
- **US-017**: Wiki detail page UI (5 points)
- **US-018**: Wiki editor UI (8 points)
- **US-019**: Wiki search functionality (5 points)
- **US-020**: MCP tool `wiki.create()` (3 points)
- **US-021**: MCP tool `wiki.search()` (3 points)
- **US-022**: MCP tool `wiki.update()` (2 points)

### EPIC-003: Onboarding System (24 points)

**Week 4 (Days 8-14)**:

- **US-026**: Onboarding database models (3 points)
- **US-027**: Session 1 prompt template (3 points) - Executive Summary
- **US-028**: Session 2 prompt template (5 points) - Industry/Domain Docs
- **US-029**: Session 3 prompt template (5 points) - AI Workflow Blueprint
- **US-030**: MCP tool `onboarding.getPrompt()` (5 points)
- **US-031**: MCP tool `onboarding.submitResponse()` (3 points)

---

## 🚀 DAY 1 TASKS

### Step 1: Initialize Session (MANDATORY)

1. ✅ Read [.agent/progress.md](.agent/progress.md) - Sprint 2 section
2. ✅ Read [.agent/active-context.md](.agent/active-context.md) - Current focus
3. ✅ Create `.agent/task/current-session-[YYYYMMDD-HHMM].md`
4. ✅ **CONFIRM**: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

### Step 2: Create Implementation Plan (MANDATORY)

1. ✅ Read [docs/13-Project-Plan.md](docs/13-Project-Plan.md) Sprint 2 section (lines 780-950)
2. ✅ Read [docs/12-Backlog.md](docs/12-Backlog.md) US-015 to US-031
3. ✅ Create implementation plan for Week 3 Days 1-2 (Wiki DB + seed)
4. ✅ Get user approval
5. ✅ **IMMEDIATELY save to** `.agent/task/current-plan.md`
6. ✅ Create `.agent/task/current-todos.md`
7. ✅ **CONFIRM**: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md"

### Step 3: Expert Consultation (MANDATORY)

1. ✅ Invoke `prisma-expert` for WikiPage seed data design
   - Sample pages: "Getting Started", "API Documentation", "Troubleshooting"
   - Category structure (e.g., "guides", "reference", "troubleshooting")
2. ✅ **CONFIRM**: "✅ STEP 3 COMPLETE: Consulted prisma-expert for seed data design"

### Step 4: Implementation (Days 1-2)

**Day 1-2 Goal**: Wiki database ready with seed data

1. ✅ Review WikiPage model in [prisma/schema.prisma](prisma/schema.prisma) (lines 263-285)
2. ✅ Create seed script for WikiPage (3-5 sample pages)
   - Getting Started guide
   - API Documentation
   - Troubleshooting guide
3. ✅ Run seed: `pnpm prisma db seed`
4. ✅ Verify via Prisma Studio or psql query
5. ✅ Update todos at each checkpoint

### Step 5: Post-Completion (MANDATORY)

1. ✅ Update [.agent/active-context.md](.agent/active-context.md) (Day 1-2 complete)
2. ✅ Update [.agent/progress.md](.agent/progress.md) (Sprint 2 progress 3/58 points)
3. ✅ Commit with message: "feat(wiki): add WikiPage seed data (US-015)"
4. ✅ **CONFIRM**: "✅ STEP 5 COMPLETE: All documentation updated and committed"

---

## 🔍 KEY REMINDERS

### Mac Mini Architecture

- **Services run on Mac mini** (192.168.1.15), NOT on Windows
- **Web app**: http://192.168.1.15:3000
- **Database**: `postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev`
- **Health check**: `curl http://192.168.1.15:3000/api/health`

### Git Workflow

- **Current branch**: `master` (refactor merged)
- **Create new branch**: `git checkout -b feature/sprint-2-wiki-onboarding`
- **Work on Windows**: All code editing and Git operations
- **Use Mac mini for**: Docker operations, database migrations, service verification

### Sprint 1 Foundation (Preserved)

- ✅ Phase/Week/Day/Task/Session models - **KEEP** (needed for Development Cycle page)
- ✅ 8 MCP tools operational
- ✅ Progress roll-up working
- ✅ Zero TypeScript errors

---

## 📚 ENFORCE PROTOCOL

**I MUST**:
- ✅ Create session file BEFORE any work
- ✅ Save plan to current-plan.md IMMEDIATELY after approval
- ✅ Consult experts BEFORE implementing
- ✅ Update todos at every checkpoint (15K tokens)
- ✅ Update documentation BEFORE final commit

**If you skip ANY step, STOP ME immediately!**

---

## 🎬 BEGIN SPRINT 2

Ready to start Week 3 Day 1 - Wiki database seed data implementation.

**Proceed with Sprint 2 implementation following the mandatory protocol.**
