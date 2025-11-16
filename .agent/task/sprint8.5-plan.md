# Sprint 8.5: Agent-First MVP Foundations - DETAILED PLAN

**Sprint ID**: Sprint 8.5
**Type**: Critical MVP Gap Filling
**Duration**: 6.5 days (1.5 weeks)
**Story Points**: 24 points
**Start Date**: 2025-11-17 (after Sprint 8 closure at 82%)
**Owner**: Development Team
**Status**: APPROVED - Ready for Execution
**Created**: 2025-11-16
**Last Updated**: 2025-11-17 (architectural decisions finalized)

---

## Executive Summary

### Problem Statement

Sprint 8 focused on human UI polish (theme switcher, notification indicators) instead of agent-critical infrastructure. Sprint 9-11 **assume** certain MVP features exist:
- Development Cycle UI (to visualize Phase/Week/Day hierarchy)
- Roadmap materialization (to populate hierarchy from Session 3)
- MCP Read Tools (for agents to query their own data)

**These features are MISSING**, blocking the agent-first workflow.

### Solution: Sprint 8.5

Fill critical MVP gaps with agent-first features:
1. **Development Cycle UI + Materialization** (9 points) - Visualize hierarchy + populate from Session 3
2. **Blueprint MCP Tool** (2 points) - Enable agent self-query (no UI)
3. **Agent AI Hub Tabs** (8 points) - Manage skills/workflows
4. **MCP Read Tools** (5 points) - Efficient hierarchy queries

### Success Criteria

**Agent Workflow**:
- ✅ Agent completes onboarding Sessions 1-3 via MCP
- ✅ Agent can query its Session 3 blueprint back (`projectpulse.blueprint.get`)
- ✅ Agent can get current position in one call (`sprint.getCurrentPosition`)
- ✅ Human can monitor agent progress in Development Cycle UI

**MVP Completion**:
- ✅ 91% → 93% (384.5 → 391 points)
- ✅ Sprint 9 unblocked (memory banks can reference roadmap)
- ✅ Sprint 11 unblocked (auto-docs can generate from roadmap)

---

## Context & Research

### Current State (from Research Report)

**Existing Infrastructure** ✅:
- 27 MCP tools operational (ahead of 42-tool target)
- 5-level hierarchy models complete (Phase/Week/Day/Task/Session)
- API endpoint `/api/hierarchy/query` functional
- OnboardingSession storing Session 3 blueprints
- AgentPersona model with skills/tools/rules
- `/agents` page with basic persona list

**Critical Gaps** ❌:
- NO Development Cycle UI page
- NO roadmap materialization tool (Session 3 creates JSON, not Phase/Week/Day records)
- NO Session 3 blueprint MCP read tool
- NO Agent AI Hub tabs (Skills, Workflows, Config)
- NO current position MCP query tool
- NO phase progress nested query tool

**Test Status**:
- MVP tests: 79/115 passing (68.7%)
- Target: >70% pass rate ✅ (acceptable)

---

## Phase 1: Development Cycle UI + Materialization (9 points, 2.5 days)

### Overview

**Goal**: Create `/roadmap` page to visualize the 5-level hierarchy (Phase → Week → Day → Task → Session) with progress tracking, PLUS add materialization tool to populate hierarchy from Session 3.

**Why Critical**:
- Sprint 9 Memory Banks need visual roadmap for "active-context.md"
- Sprint 11 Auto-Docs need to query roadmap structure
- Humans need to monitor agent progress (secondary but required)
- **NEW REQUIREMENT**: Session 3 creates Roadmap (JSON) but NOT Phase/Week/Day records
- **BLOCKER**: Without materialization, Development Cycle UI shows empty tree

**Dependencies**:
- ✅ Database schema complete (Phase/Week/Day/Task/Session models)
- ✅ API endpoint exists (`GET /api/hierarchy/query`)
- ✅ MCP tools exist (`sprint.phase.create`, `sprint.checkpoint`)
- ✅ OnboardingSession stores Session 3 in `response.projectContextJson`

---

### User Stories

**US-8.5-001**: As a **human user**, I want to **view the project roadmap** so that **I can see the current phase/week/day/task status**.

**Acceptance Criteria**:
1. New page at `/roadmap` displays full hierarchy
2. "You are here" breadcrumb shows current Phase → Week → Day → Task
3. Progress bars show completion percentage for each level
4. Status badges show IN_PROGRESS, BLOCKED, PENDING, COMPLETE
5. Clicking a phase expands to show weeks, clicking week shows days, etc.
6. Sidebar has "Development Cycle" link

**US-8.5-002**: As an **AI agent**, I want the **roadmap to update when I call MCP tools** so that **my progress is visible to humans**.

**Acceptance Criteria**:
1. Agent calls `sprint.checkpoint` → UI shows updated progress
2. Agent calls `sprint.updateProgress` → Progress bar updates in real-time
3. Agent creates new task → Task appears in hierarchy tree

---

### Implementation Details

#### Files to Create

1. **Page**: `apps/web/app/roadmap/page.tsx` (Server Component, ~150 lines)
   - Fetch all phases with aggregated counts
   - Get current position (latest IN_PROGRESS task)
   - Render layout with filters, tree, current position banner

2. **Component**: `apps/web/components/roadmap/RoadmapTree.tsx` (Client, ~100 lines)
   - Collapsible tree structure
   - State management for expanded nodes
   - Dynamic loading of children on expand

3. **Component**: `apps/web/components/roadmap/PhaseCard.tsx` (Client, ~80 lines)
   - Display phase title, description, progress
   - Status badge, week count
   - Progress bar visualization
   - Date range display

4. **Component**: `apps/web/components/roadmap/WeekCard.tsx` (Client, ~70 lines)
   - Similar to PhaseCard but for weeks
   - Shows day count

5. **Component**: `apps/web/components/roadmap/DayCard.tsx` (Client, ~70 lines)
   - Shows task count
   - Task list on expand

6. **Component**: `apps/web/components/roadmap/TaskCard.tsx` (Client, ~60 lines)
   - Shows session count
   - Session list on expand

7. **Component**: `apps/web/components/roadmap/CurrentPositionBanner.tsx` (Client, ~60 lines)
   - "You are here" breadcrumb
   - Current phase/week/day/task display
   - Progress indicators for all levels

8. **Component**: `apps/web/components/roadmap/RoadmapFilters.tsx` (Client, ~50 lines)
   - Status filter (multi-select)
   - Progress range slider
   - Date range picker (optional)

9. **Update**: `apps/web/components/Sidebar.tsx` (~5 lines added)
   - Add "Development Cycle" navigation link
   - Icon: Map from lucide-react

10. **NEW MCP Tool**: `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (~150 lines)
    - Read Roadmap.phases JSON from database
    - Create Phase records (1 per phase in JSON)
    - Parse duration string ("2 weeks" → 2)
    - Create Week records (N weeks per phase)
    - Create Day records (5 days per week, Mon-Fri)
    - Return created IDs for agent reference
    - Transaction-safe (rollback on error)

11. **NEW Schema Migration**: `apps/web/prisma/migrations/YYYYMMDD_add_dev_session_fk/migration.sql` (~30 lines)
    - Add phaseId, weekId, dayId, taskId columns to DevelopmentSession
    - Add foreign key constraints to Phase/Week/Day/Task tables
    - Add indexes for query performance
    - Enable agents to link sessions to hierarchy

12. **NEW Empty State**: `apps/web/components/roadmap/EmptyRoadmapState.tsx` (~40 lines)
    - Display when no Phase records exist
    - Message: "Complete onboarding Session 3 to generate your roadmap"
    - CTA button: "Start Onboarding" → `/onboarding`
    - Helpful instructions for first-time users

13. **Update**: `apps/mcp-server/src/index.ts` (~3 lines)
    - Register materializeTool in tools array

14. **Update**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (~10 lines)
    - After creating Roadmap, call materialize(roadmapId)
    - Store returned phase/week/day IDs in Session 3 response

---

### Testing Strategy

**E2E Tests**: `apps/web/tests/e2e/roadmap.spec.ts` (5-7 tests)

```typescript
test('should display page layout', async ({ page }) => {
  await page.goto('/roadmap');
  await expect(page.locator('h1')).toContainText('Development Cycle');
});

test('should display phase cards', async ({ page }) => {
  await expect(page.getByText(/Phase \d+/)).toBeVisible();
  await expect(page.getByText(/\d+%/)).toBeVisible();
});

test('should expand/collapse phases', async ({ page }) => {
  const phaseCard = page.locator('[data-testid="phase-card"]').first();
  await phaseCard.click();
  await expect(page.getByText('Week 1')).toBeVisible();
});

test('should show current position banner', async ({ page }) => {
  await expect(page.getByText('You Are Here')).toBeVisible();
});

test('should filter by status', async ({ page }) => {
  await page.selectOption('select[name="status"]', 'IN_PROGRESS');
  await expect(page.getByText('COMPLETE')).not.toBeVisible();
});
```

---

### Acceptance Checklist

#### Phase 1 Complete When:
- [ ] **Materialization Tool**: MCP tool creates Phase/Week/Day records from Roadmap JSON
- [ ] **Schema Migration**: DevelopmentSession has FK relationships to hierarchy
- [ ] **Session 3 Integration**: Materialization called automatically after roadmap creation
- [ ] `/roadmap` page created and accessible
- [ ] **Empty State**: Shown when no Phase records exist
- [ ] All 9 UI components implemented (page, tree, 4 cards, banner, filters, sidebar)
- [ ] Phase cards display with progress bars
- [ ] Tree expands/collapses correctly
- [ ] "You Are Here" banner shows current task
- [ ] Sidebar has "Development Cycle" link
- [ ] E2E tests: 5-7 tests passing
- [ ] **Integration Test**: Complete Session 3 → Phase/Week/Day records exist → UI displays
- [ ] Manual test: Agent calls `sprint.checkpoint` → UI updates

**Story Points**: 9 points (8 UI + 1 materialization)
**Estimated Time**: 2.5 days
**Priority**: P0 (CRITICAL - blocks Sprint 9)

---

## Phase 2: Blueprint MCP Tool (2 points, 0.5 days)

### Overview

**Goal**: Enable agents to query Session 3 blueprint data via MCP (NO UI component).

**Why Critical**:
- Agents need to recall their onboarding configuration (tech stack, roadmap, budget)
- Session 3 stores data but NO read access exists
- Onboarding workflow is write-only without retrieval

**Why NO UI**:
- Roadmap data → Already shown in Development Cycle UI (Phase 1)
- Agent data → Already shown in Agent AI Hub (Phase 3)
- Blueprint is static snapshot; users need live state (shown in other UIs)
- MCP tool enables agent queries without UI clutter

**Dependencies**:
- ✅ OnboardingSession model stores Session 3 in `response` JSONB
- ✅ project-context.json structure defined in 3-session-onboarding-REFERENCE.md

---

### User Stories

**US-8.5-003**: As an **AI agent**, I want to **query my Session 3 blueprint** so that **I can recall the roadmap/config I defined during onboarding**.

**Acceptance Criteria**:
1. MCP tool `projectpulse.blueprint.get(projectId)` returns Session 3 JSON
2. Tool returns: roadmap phases, tech stack, agent persona, skills, workflows, timeline, budget
3. Tool is callable from Claude Code MCP client
4. Returns error if Session 3 not completed
5. NO UI component created (data displayed in Dev Cycle UI + Agent AI Hub)

---

### Implementation Details

#### Files to Create

1. **MCP Tool**: `apps/mcp-server/src/tools/onboarding/getBlueprintTool.ts` (~80 lines)
   - Query OnboardingSession where sessionType = "bootstrap"
   - Parse response.projectContextJson
   - Return formatted blueprint data
   - Error handling for missing/incomplete sessions

2. **API Route**: `apps/web/app/api/onboarding/blueprint/route.ts` (~50 lines)
   - GET endpoint with projectId param
   - Query Session 3 data
   - Return JSON response
   - 404 if not found

3. **Update**: `apps/mcp-server/src/index.ts` (~3 lines)
   - Register getBlueprintTool in tools array

**REMOVED** (no longer needed):
- ❌ BlueprintView.tsx component
- ❌ BlueprintRoadmapCard.tsx component
- ❌ "Project Blueprint" tab in /agents page
- ❌ E2E tests for Blueprint UI

---

### Testing Strategy

**MCP Integration Test**: `apps/mcp-server/src/tools/__tests__/getBlueprintTool.test.ts` (3-4 tests)

```typescript
describe('projectpulse.blueprint.get', () => {
  it('should return Session 3 blueprint', async () => {
    const result = await getBlueprintTool.handler({ projectId: 1 });
    const blueprint = JSON.parse(result.content[0].text);
    expect(blueprint.roadmap.phases).toBeDefined();
    expect(blueprint.techStack).toBeDefined();
  });

  it('should throw if Session 3 not found', async () => {
    await expect(
      getBlueprintTool.handler({ projectId: 999 })
    ).rejects.toThrow('Session 3 blueprint not found');
  });

  it('should return project-context.json structure', async () => {
    const result = await getBlueprintTool.handler({ projectId: 1 });
    const blueprint = JSON.parse(result.content[0].text);
    expect(blueprint).toHaveProperty('metadata');
    expect(blueprint).toHaveProperty('techStack');
    expect(blueprint).toHaveProperty('phases');
    expect(blueprint).toHaveProperty('timeline');
  });
});
```

---

### Acceptance Checklist

#### Phase 2 Complete When:
- [ ] MCP tool `projectpulse.blueprint.get` implemented
- [ ] Tool registered in MCP server index
- [ ] API endpoint `GET /api/onboarding/blueprint` implemented
- [ ] MCP integration tests: 3-4 tests passing
- [ ] Tool callable from Claude Code
- [ ] Returns correct project-context.json structure
- [ ] No UI components created (verified)

**Story Points**: 2 points (down from 5)
**Estimated Time**: 0.5 days (down from 1.5 days)
**Priority**: P1 (CRITICAL for agents, not for UI)

---

## Phase 3: Agent AI Hub Tabs (8 points, 2 days)

### Overview

**Goal**: Enhance `/agents` page with tabs for Skills, Workflows, and Configuration.

**Why Important**:
- Current `/agents` page shows basic persona list
- No way to view agent skills, workflows, or system prompts
- No way to configure agents beyond toggle active/inactive

**Dependencies**:
- ✅ AgentPersona model has skills[], tools[], rules[]
- ✅ Skill model exists
- ✅ WorkflowTemplate model exists
- ⚠️ Needs Phase 2 Blueprint View patterns

---

### User Stories

**US-8.5-005**: As a **human user**, I want to **view agent skills in a dedicated tab** so that **I can see what capabilities each agent has**.

**US-8.5-006**: As a **human user**, I want to **view agent workflows** so that **I can see what processes the agent follows**.

**US-8.5-007**: As a **human user**, I want to **view agent configuration** so that **I can see the system prompt, rules, and expertise**.

---

### Implementation Details

#### Files to Create

1. **Component**: `apps/web/components/agents/AgentDetailModal.tsx` (Client, ~120 lines)
   - Modal dialog with tabs
   - Tab state management
   - Responsive layout

2. **Component**: `apps/web/components/agents/AgentSkillsTab.tsx` (Client, ~100 lines)
   - Skills list with category filters
   - Tag display
   - Search functionality

3. **Component**: `apps/web/components/agents/AgentWorkflowsTab.tsx` (Client, ~90 lines)
   - Workflow cards
   - Step count, category display
   - Active/inactive status

4. **Component**: `apps/web/components/agents/AgentConfigTab.tsx` (Client, ~100 lines)
   - System prompt display (collapsible)
   - Rules list
   - Expertise tags
   - MCP tools list

5. **Component**: `apps/web/components/agents/SkillPicker.tsx` (Client, ~80 lines)
   - Multi-select skill picker
   - Category grouping
   - Search/filter

6. **API Route**: `apps/web/app/api/agents/[id]/route.ts` (~60 lines)
   - GET full agent data with relations
   - Include skills, workflows
   - Return JSON

7. **Update**: `apps/web/components/agents/AgentCard.tsx` (~10 lines)
   - Add click handler to open modal
   - Pass agent data to modal

---

### Testing Strategy

**E2E Tests**: Extend `apps/web/tests/e2e/agents.spec.ts` (5-7 tests)

```typescript
test('should open agent detail modal', async ({ page }) => {
  await page.goto('/agents');
  await page.click('[data-testid="agent-card"]');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('should display skills tab', async ({ page }) => {
  await page.click('text=Skills');
  await expect(page.getByText('api-patterns')).toBeVisible();
});

test('should filter skills by category', async ({ page }) => {
  await page.click('text=workflow');
  await expect(page.getByText('api-patterns')).not.toBeVisible();
});
```

---

### Acceptance Checklist

#### Phase 3 Complete When:
- [ ] AgentDetailModal component created
- [ ] All 3 tab components created (Skills, Workflows, Config)
- [ ] API route `GET /api/agents/[id]` implemented
- [ ] Modal opens on agent card click
- [ ] Skills tab shows skills grouped by category
- [ ] Workflows tab shows workflow templates
- [ ] Config tab shows system prompt, rules, expertise
- [ ] E2E tests: 5-7 tests passing

**Story Points**: 8 points
**Estimated Time**: 2 days
**Priority**: P1 (High - improves agent management UX)

---

## Phase 4: MCP Read Tools (5 points, 1.5 days)

### Overview

**Goal**: Add 2 efficient MCP read tools for agents to query their state.

**Why Important**:
- Agents currently make 5 sequential calls to get current position
- No way to get full phase progress with all children
- Inefficient, high latency, high token usage

**Dependencies**:
- ✅ Database schema supports nested queries
- ✅ API endpoint `/api/hierarchy/query` exists
- ⚠️ Needs Phase 1 understanding of hierarchy

---

### User Stories

**US-8.5-008**: As an **AI agent**, I want to **get my current position in one call** so that **I know which Phase/Week/Day/Task I'm working on**.

**US-8.5-009**: As an **AI agent**, I want to **get full phase progress** so that **I can see all weeks/days/tasks under a phase**.

---

### Implementation Details

#### Files to Create

1. **MCP Tool**: `apps/mcp-server/src/tools/sprint/getCurrentPositionTool.ts` (~90 lines)
   - Query latest IN_PROGRESS task with nested includes
   - Return full hierarchy context
   - Error handling for no active task

2. **MCP Tool**: `apps/mcp-server/src/tools/sprint/getPhaseProgressTool.ts` (~70 lines)
   - Query phase with all nested children
   - Return tree structure
   - Include progress percentages

3. **API Route**: `apps/web/app/api/sprint/current-position/route.ts` (~50 lines)
   - GET endpoint with projectId param
   - Query current task
   - Return hierarchy

4. **API Route**: `apps/web/app/api/phases/[id]/progress/route.ts` (~40 lines)
   - GET endpoint for phase ID
   - Return nested tree
   - Include all children

5. **Update**: `apps/mcp-server/src/index.ts` (~6 lines)
   - Register 2 new tools

---

### Testing Strategy

**MCP Integration Tests**: `apps/mcp-server/src/tools/__tests__/` (4-5 tests)

```typescript
describe('projectpulse.sprint.getCurrentPosition', () => {
  it('should return current position', async () => {
    const result = await getCurrentPositionTool.handler({ projectId: 1 });
    expect(result.content[0].text).toContain('Phase 1');
  });
});

describe('projectpulse.sprint.getPhaseProgress', () => {
  it('should return nested tree', async () => {
    const result = await getPhaseProgressTool.handler({ phaseId: 1 });
    const phase = JSON.parse(result.content[0].text);
    expect(phase.weeks).toHaveLength(2);
  });
});
```

---

### Acceptance Checklist

#### Phase 4 Complete When:
- [ ] MCP tool `getCurrentPosition` implemented
- [ ] MCP tool `getPhaseProgress` implemented
- [ ] Both tools registered in index
- [ ] API route `/api/sprint/current-position` implemented
- [ ] API route `/api/phases/[id]/progress` implemented
- [ ] MCP integration tests: 4-5 tests passing
- [ ] Tools callable from Claude Code

**Story Points**: 5 points
**Estimated Time**: 1.5 days
**Priority**: P1 (High - improves agent efficiency)

---

## Sprint 8.5 Summary

### Total Scope
- **Story Points**: 24 points (down from 26)
- **Duration**: 6.5 days (1.5 weeks)
- **Phases**: 4 phases (sequential)
- **New Files**: ~22 files (down from ~25)
- **Updated Files**: ~6 files

### Phase Breakdown
| Phase | Focus | Points | Days | Priority | Status |
|-------|-------|--------|------|----------|--------|
| 1 | Development Cycle UI + Materialization | 9 | 2.5 | P0 | PENDING |
| 2 | Blueprint MCP Tool (no UI) | 2 | 0.5 | P1 | PENDING |
| 3 | Agent AI Hub Tabs | 8 | 2 | P1 | PENDING |
| 4 | MCP Read Tools | 5 | 1.5 | P1 | PENDING |

### Success Criteria
- ✅ Agent can complete full onboarding workflow (Sessions 1-3)
- ✅ Session 3 automatically populates Phase/Week/Day hierarchy via materialization
- ✅ Agent can query Session 3 blueprint via MCP
- ✅ Agent can get current position in 1 call (vs 5)
- ✅ Human can view roadmap in Development Cycle UI
- ✅ Human can view agent configuration in Agent AI Hub
- ✅ Sprint 9 unblocked (memory banks can reference roadmap)
- ✅ MVP: 91% → 93% (384.5 → 391 points)

### Testing Targets
- **E2E Tests**: 15-20 new tests
- **MCP Integration Tests**: 10-12 new tests
- **MVP Pass Rate**: 70% → 75%

---

## Execution Plan

### Phase-by-Phase Approach

**Step 1: Phase 1 Deep-Dive**
- Create Phase 1 detailed implementation plan
- Review and approve Phase 1 plan
- Execute Phase 1 (2 days)
- Test and validate Phase 1

**Step 2: Phase 2 Deep-Dive**
- Create Phase 2 detailed implementation plan
- Review and approve Phase 2 plan
- Execute Phase 2 (1.5 days)
- Test and validate Phase 2

**Step 3: Phase 3 Deep-Dive**
- Create Phase 3 detailed implementation plan
- Review and approve Phase 3 plan
- Execute Phase 3 (2 days)
- Test and validate Phase 3

**Step 4: Phase 4 Deep-Dive**
- Create Phase 4 detailed implementation plan
- Review and approve Phase 4 plan
- Execute Phase 4 (1.5 days)
- Test and validate Phase 4

**Step 5: Sprint 8.5 Closure**
- Run full test suite
- Update progress tracking
- Create Sprint 8.5 completion summary
- Commit and push all changes

---

## Risk Management

### Risks

**Risk 1: UI Complexity** (MEDIUM)
- **Mitigation**: Reuse existing components (StatCard, tree patterns)
- **Contingency**: Simplify UI, defer advanced features

**Risk 2: Session 3 Data Structure** (LOW)
- **Mitigation**: Well-defined in FR-031, already stored in DB
- **Contingency**: Mock data for development, real data later

**Risk 3: Agent Tab Modal UX** (MEDIUM)
- **Mitigation**: Use existing modal patterns from issue detail
- **Contingency**: Use separate page instead of modal

**Risk 4: MCP Tool Integration** (LOW)
- **Mitigation**: Follow existing tool patterns
- **Contingency**: Manual testing if automated tests fail

---

## Dependencies

### External
- ✅ Sprint 1-7 complete (5-level hierarchy, onboarding, agent personas)
- ✅ Database schema ready (no migrations needed)
- ✅ MCP server infrastructure operational (27 tools)

### Internal (Between Phases)
- Phase 1: Must complete first (materialization enables other features)
- Phase 2: Independent (MCP tool only, no UI dependencies)
- Phase 3: Independent (Agent AI Hub UI, no dependencies on Phase 1-2)
- Phase 4: Depends on Phase 1 (MCP tools query hierarchy created by materialization)

**Critical Path**: Phase 1 → Phase 4 (materialization enables hierarchy queries)
**Parallel Work**: Phases 2-3 can run concurrently with Phase 1 if needed

---

## Resources

### Documentation
- [docs/13-Project-Plan.md](../../docs/13-Project-Plan.md) - Sprint requirements
- [docs/12-Backlog.md](../../docs/12-Backlog.md) - User stories
- [docs/02-SRS.md](../../docs/02-SRS.md) - Functional requirements
- [.agent/system-patterns.md](../ system-patterns.md) - Architecture patterns

### Code References
- `apps/web/prisma/schema.prisma` - Database models
- `apps/web/app/api/hierarchy/query/route.ts` - Hierarchy API
- `apps/mcp-server/src/tools/` - Existing MCP tools
- `apps/web/components/` - Reusable components

---

**Plan Status**: APPROVED - Ready for Phase 1 Execution
**Next Step**: Create Phase 1 detailed implementation plan
**Estimated Start**: 2025-11-17
