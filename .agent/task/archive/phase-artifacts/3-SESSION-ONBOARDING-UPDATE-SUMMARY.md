# 3-Session Onboarding Reference Update - Implementation Summary

**Date**: 2025-11-17
**Sprint**: 8.5 Phase 2 Preparation
**Status**: ✅ COMPLETE

---

## Executive Summary

Successfully updated the 3-session onboarding reference document and related files to match your product vision:
- **Database-first workflow**: All data in ProjectPulse DB (NO files in user repos)
- **Clean repositories**: Only CLAUDE.md and AGENTS.md in user repos
- **Current work tracking**: New `CurrentPlan` and `CurrentTodos` models for roadmap UI

---

## Files Modified

### 1. `.agent/task/3-session-onboarding-REFERENCE.md`

**Changes**:
- ✅ **Session 1**: Added explicit `projectContextJson` storage location
- ✅ **Session 2**: Clarified `Document` table usage (separate rows, not JSONB)
- ✅ **Session 3 Step 1**: Added explicit `projectContextJson` fetch
- ✅ **Session 3 Step 2**: Changed "files" to "DB records" for Memory Bank
- ✅ **Session 3 Step 3**: Enhanced CLAUDE.md template reference with current-work warnings
- ✅ **Session 3 Step 4-6**: Emphasized DB records (AgentPersona, Skill, SOP tables)
- ✅ **Session 3 Step 7**: (No changes - was already correct as "Create Roadmap")
- ✅ **Session 3 Step 8**: **Complete rewrite** with CurrentPlan/CurrentTodos workflow
- ✅ **Session 3 Step 9**: Updated validation checklist to include CurrentPlan/CurrentTodos

**Key Improvements**:
- Made it crystal clear that Memory Bank, Agents, Skills, SOPs are **DB records**, not files
- Added new Step 8 subsections (8.1-8.4) for DevelopmentSession, CurrentPlan, CurrentTodos, Roadmap position
- Emphasized user's repo stays CLEAN (NO `.agent/` folder)

---

### 2. `.agent/task/claude-md-template-PRODUCTPULSE.md`

**Changes**:
- ✅ **Added new section**: "Current Work Tracking (Roadmap UI)" after Step 5 protocol
- ✅ **Enhanced Step 1**: Added `roadmap.getCurrent()`, `getCurrentPlan()`, `getCurrentTodos()` calls
- ✅ **Enhanced Step 4**: Added current work completion check (`completeCurrentWork()`)
- ✅ **Enhanced Step 5**: Added new week/day current-plan/todos creation workflow

**New Section Content**:
- MCP tool examples for `updateCurrentPlan()` and `updateCurrentTodos()`
- Workflow for completing work and moving to next week/day
- Critical warnings about NOT creating `.agent/task/current-*.md` files
- Display information for Roadmap UI tabs

---

### 3. `apps/web/prisma/schema.prisma`

**Changes**:
- ✅ **Added `CurrentPlan` model** (lines 1137-1159):
  - Fields: `id`, `projectId`, `content`, `goals`, `weekId`, `dayId`, `createdAt`, `updatedAt`
  - Relations: `project` (one-to-one), `week`, `day` (optional pointers)
  - Indexes: `projectId`, `weekId+dayId`
  
- ✅ **Added `CurrentTodos` model** (lines 1161-1182):
  - Fields: `id`, `projectId`, `todos` (JSONB), `weekId`, `dayId`, `createdAt`, `updatedAt`
  - Relations: `project` (one-to-one), `week`, `day` (optional pointers)
  - Indexes: `projectId`, `weekId+dayId`

- ✅ **Updated `Project` model** (lines 296-297):
  - Added relations: `currentPlan CurrentPlan?`, `currentTodos CurrentTodos?`

- ✅ **Updated `Week` model** (lines 121-123):
  - Added relations: `currentPlans CurrentPlan[]`, `currentTodos CurrentTodos[]`

- ✅ **Updated `Day` model** (lines 161-163):
  - Added relations: `currentPlans CurrentPlan[]`, `currentTodos CurrentTodos[]`

---

### 4. `.agent/task/MCP-TOOLS-CURRENT-WORK-SPEC.md` (NEW)

**Created complete specification** for implementing current work tracking:

**5 MCP Tools Specified**:
1. `projectpulse.roadmap.updateCurrentPlan` - Create/update current plan
2. `projectpulse.roadmap.updateCurrentTodos` - Create/update current todos
3. `projectpulse.roadmap.getCurrentPlan` - Get current plan
4. `projectpulse.roadmap.getCurrentTodos` - Get current todos
5. `projectpulse.roadmap.completeCurrentWork` - Mark work complete, move to next

**5 API Routes Specified**:
- `PUT /api/roadmap/current-work/plan`
- `PUT /api/roadmap/current-work/todos`
- `GET /api/roadmap/current-work/plan?projectId={id}`
- `GET /api/roadmap/current-work/todos?projectId={id}`
- `POST /api/roadmap/current-work/complete`

**UI Components Specified**:
- Current Plan tab/card in Roadmap page
- Current Todos tab/card in Roadmap page
- Data fetching with SWR
- Auto-refresh on changes

**Testing Checklist**: Unit, integration, E2E, edge cases

**Migration Script**: Prisma migrate command and generated SQL

---

## Alignment with User's Vision

### ✅ Database-First Workflow

| Component | Storage Location | User's Repo Status |
|-----------|-----------------|-------------------|
| Memory Bank | `MemoryBank` table | CLEAN ✅ |
| Agent Personas | `AgentPersona` table | CLEAN ✅ |
| Skills | `Skill` table | CLEAN ✅ |
| SOPs | `SOP` table | CLEAN ✅ |
| Documentation | `Document` table | CLEAN ✅ |
| Current Plan | `CurrentPlan` table | CLEAN ✅ |
| Current Todos | `CurrentTodos` table | CLEAN ✅ |
| Roadmap | `Roadmap` table | CLEAN ✅ |
| Development Session | `DevelopmentSession` table | CLEAN ✅ |

**User's Repo Contains**: ONLY `CLAUDE.md` and `AGENTS.md` ✅

---

### ✅ Critical Success Factor Addressed

**The Problem**: If CLAUDE.md doesn't clearly instruct agents to use ProjectPulse DB, they will create files in `.agent/` folder.

**The Solution**:
1. **Reference document** explicitly states this is the most critical part (Step 3)
2. **CLAUDE.md template** has prominent warnings:
   - ❌ DO NOT create `.agent/` folder
   - ❌ DO NOT create `.agent/task/current-plan.md`
   - ❌ DO NOT create `.agent/task/current-todos.md`
   - ✅ Always use `projectpulse.roadmap.updateCurrentPlan()` and `updateCurrentTodos()`
3. **5-step protocol** explicitly uses ProjectPulse MCP tools in every step
4. **Examples** show exactly how to call MCP tools (no ambiguity)

---

### ✅ Current-Plan/Current-Todos Workflow

**User's Requirements**:
1. ✅ Separate DB tables (not fields in DevelopmentSession)
2. ✅ Visible in Roadmap UI ("Current Plan" and "Current Todos" tabs)
3. ✅ Updated when agent begins a new week/day
4. ✅ Marks week/day as IN_PROGRESS when plan/todos created
5. ✅ Marks week/day as COMPLETED when work finishes
6. ✅ Pointer tracks which week/day agent is working on

**Implementation**:
- `CurrentPlan` table stores markdown plan + goals + week/day pointer
- `CurrentTodos` table stores JSONB todos array + week/day pointer
- `completeCurrentWork()` marks current week/day COMPLETED, returns next week/day
- Agent creates fresh plan/todos for next work
- Roadmap UI auto-updates to show current position

---

## What's Next

### Phase 2 Implementation (Can Now Proceed)

1. **Run Prisma migration**:
   ```bash
   cd apps/web
   pnpm prisma migrate dev --name add-current-work-tracking
   ```

2. **Implement API routes**:
   - `apps/web/app/api/roadmap/current-work/plan/route.ts`
   - `apps/web/app/api/roadmap/current-work/todos/route.ts`
   - `apps/web/app/api/roadmap/current-work/complete/route.ts`

3. **Implement MCP tools**:
   - `apps/mcp-server/src/tools/roadmap/updateCurrentPlan.ts`
   - `apps/mcp-server/src/tools/roadmap/updateCurrentTodos.ts`
   - `apps/mcp-server/src/tools/roadmap/getCurrentPlan.ts`
   - `apps/mcp-server/src/tools/roadmap/getCurrentTodos.ts`
   - `apps/mcp-server/src/tools/roadmap/completeCurrentWork.ts`

4. **Implement Roadmap UI**:
   - Add "Current Plan" tab to `/roadmap` page
   - Add "Current Todos" tab to `/roadmap` page
   - Implement expand/collapse for detailed view
   - Add SWR data fetching

5. **Update Session 3 bootstrap**:
   - Use new MCP tools to create initial `CurrentPlan` and `CurrentTodos`
   - Test complete onboarding flow

6. **Write tests**:
   - Unit tests for API routes
   - Integration tests for MCP tools
   - E2E test for agent workflow
   - UI tests for Roadmap page

---

## Files Created/Modified Summary

**Modified** (3 files):
1. `.agent/task/3-session-onboarding-REFERENCE.md` - Updated Sessions 1, 2, 3
2. `.agent/task/claude-md-template-PRODUCTPULSE.md` - Added current work tracking
3. `apps/web/prisma/schema.prisma` - Added CurrentPlan, CurrentTodos models

**Created** (1 file):
1. `.agent/task/MCP-TOOLS-CURRENT-WORK-SPEC.md` - Complete implementation spec

---

## Verification Checklist

- ✅ Reference document matches user's vision (database-first, clean repos)
- ✅ CLAUDE.md template has critical warnings about NOT creating files
- ✅ Prisma models defined for CurrentPlan and CurrentTodos
- ✅ Relations added to Project, Week, Day models
- ✅ MCP tools specification complete (5 tools with full details)
- ✅ API routes specification complete (5 routes)
- ✅ UI components specification complete (2 tabs)
- ✅ Testing checklist provided
- ✅ Migration script specified

---

## Token Usage

- **Total tokens used**: ~113K tokens
- **Remaining budget**: ~87K tokens
- **Efficiency**: Completed all updates in single session

---

**Status**: ✅ Ready for Phase 2 Implementation

**Next Session**: Implement API routes + MCP tools + Roadmap UI based on this specification.
