# Sprint 8.5 Phase 2: Blueprint MCP Tool

**Phase**: Sprint 8.5 Phase 2 of 4
**Story Points**: 2 points
**Duration**: 0.5 days (~4 hours)
**Status**: PENDING (blocked by Phase 1 Part 0)
**Created**: 2025-11-17
**Dependencies**: Document model (from Phase 1 Task 0.0)

---

## Executive Summary

### Goal
Enable agents to query Session 3 blueprint data via MCP (NO UI component).

### Why No UI
- Roadmap data → Already shown in `/roadmap` (Phase 1)
- Agent data → Already shown in Agent AI Hub (Phase 3)
- Blueprint is static snapshot; users need live state (shown in other UIs)
- MCP tool enables agent queries without UI clutter

### Why Critical
- Agents need to recall their onboarding configuration (tech stack, roadmap, budget)
- Session 3 stores data but NO read access exists
- Onboarding workflow is write-only without retrieval

---

## Gap Analysis & Scope Clarification

### DevelopmentSession vs Blueprint Tool

**Discovered Gap** (2025-11-17):
- Phase 1 Session 3 integration creates Roadmap but NOT DevelopmentSession
- 3-session reference Step 8 requires initial DevelopmentSession for onboarding summary
- CurrentWorkModal exists but has no data source

**Impact on Phase 2**:
- ✅ NO scope changes to Phase 2
- ✅ Blueprint tool remains focused on read-only Session 3 data retrieval
- ✅ DevelopmentSession creation handled in Phase 1 fix (separate task)

**Why Phase 2 Unaffected**:
- Blueprint tool queries OnboardingSession.response (already exists)
- DevelopmentSession is for agent work tracking (different concern)
- Clean separation: Phase 2 = data retrieval, Phase 1 fix = data creation

**Recommendation**: Complete Phase 1 Session 3 fix BEFORE Phase 2 for full UX flow.

### Architecture Overview

```
Agent calls: projectpulse.blueprint.get(projectId)
    ↓
MCP server queries: OnboardingSession (sessionType="bootstrap")
    ↓
Returns: response.projectContextJson
    ↓
Agent receives: {
  metadata: { projectName, projectType, domain, targetUsers },
  techStack: { frontend, backend, database, hosting },
  phases: [ { name, duration, sprints: [...] } ],
  timeline: { startDate, duration, targetLaunch },
  budget: { development, monthly_operating }
}
```

---

## Implementation Plan

### Part A: MCP Tool Implementation (3 hours)

#### Task A.1: Blueprint Get Tool

**File**: `apps/mcp-server/src/tools/onboarding/getBlueprintTool.ts` (~80 lines)

**Purpose**: Query Session 3 blueprint data from OnboardingSession

**Implementation**:
```typescript
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const getBlueprintTool = {
  name: 'projectpulse.blueprint.get',
  description: 'Get Session 3 blueprint data (project context, roadmap, config)',
  inputSchema: z.object({
    projectId: z.number().int().positive(),
  }),

  async handler({ projectId }) {
    // Query OnboardingSession where sessionType = "bootstrap"
    const session = await prisma.onboardingSession.findFirst({
      where: {
        projectId,
        sessionNumber: 3, // Session 3 = Bootstrap
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
    });

    if (!session || !session.response) {
      throw new Error('Session 3 blueprint not found. Complete onboarding first.');
    }

    // Parse response.projectContextJson
    const blueprint = session.response as any;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(blueprint.projectContextJson || blueprint, null, 2),
        },
      ],
    };
  },
};
```

**Error Handling**:
- Session 3 not found → 404 with helpful message
- Response empty → Return error asking to re-run Session 3
- Invalid JSON → Catch and return raw response with warning

**Acceptance**:
- [ ] Tool queries OnboardingSession correctly
- [ ] Returns project-context.json structure
- [ ] Error messages are helpful
- [ ] No hardcoded values

**Files**:
- `apps/mcp-server/src/tools/onboarding/getBlueprintTool.ts` (CREATE)

---

#### Task A.2: API Route

**File**: `apps/web/app/api/onboarding/blueprint/route.ts` (~50 lines)

**Purpose**: REST API endpoint for blueprint data (used by MCP tool)

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId query parameter required' },
      { status: 400 }
    );
  }

  const session = await prisma.onboardingSession.findFirst({
    where: {
      projectId: parseInt(projectId),
      sessionNumber: 3,
      status: 'completed',
    },
    orderBy: { completedAt: 'desc' },
  });

  if (!session || !session.response) {
    return NextResponse.json(
      { error: 'Session 3 blueprint not found' },
      { status: 404 }
    );
  }

  const blueprint = session.response as any;
  return NextResponse.json(blueprint.projectContextJson || blueprint);
}
```

**Acceptance**:
- [ ] GET `/api/onboarding/blueprint?projectId=1` returns data
- [ ] 400 if projectId missing
- [ ] 404 if Session 3 not found
- [ ] Returns correct JSON structure

**Files**:
- `apps/web/app/api/onboarding/blueprint/route.ts` (CREATE)

---

#### Task A.3: Registration

**File**: `apps/mcp-server/src/index.ts` (~3 lines added)

**Purpose**: Register getBlueprintTool in MCP server

**Implementation**:
```typescript
import { getBlueprintTool } from './tools/onboarding/getBlueprintTool.js';

const tools = [
  // ... existing tools ...
  getBlueprintTool,
];
```

**Acceptance**:
- [ ] Tool registered in MCP server
- [ ] MCP server starts without errors
- [ ] Tool appears in tool list

**Files**:
- `apps/mcp-server/src/index.ts` (UPDATE)

---

### Part B: Testing (1 hour)

#### Task B.1: MCP Integration Tests

**File**: `apps/mcp-server/src/tools/__tests__/getBlueprintTool.test.ts` (~60 lines)

**Tests**:
```typescript
import { getBlueprintTool } from '../onboarding/getBlueprintTool';
import { prisma } from '@/lib/db';

describe('projectpulse.blueprint.get', () => {
  beforeEach(async () => {
    // Seed test data
  });

  afterEach(async () => {
    // Clean up
  });

  it('should return Session 3 blueprint', async () => {
    const result = await getBlueprintTool.handler({ projectId: 1 });
    const blueprint = JSON.parse(result.content[0].text);
    
    expect(blueprint).toHaveProperty('metadata');
    expect(blueprint).toHaveProperty('techStack');
    expect(blueprint).toHaveProperty('phases');
    expect(blueprint).toHaveProperty('timeline');
  });

  it('should throw 404 if Session 3 not found', async () => {
    await expect(
      getBlueprintTool.handler({ projectId: 999 })
    ).rejects.toThrow('Session 3 blueprint not found');
  });

  it('should return correct project-context.json structure', async () => {
    const result = await getBlueprintTool.handler({ projectId: 1 });
    const blueprint = JSON.parse(result.content[0].text);
    
    expect(blueprint.metadata).toHaveProperty('projectName');
    expect(blueprint.techStack).toHaveProperty('frontend');
    expect(blueprint.phases).toBeInstanceOf(Array);
  });

  it('should handle missing response gracefully', async () => {
    // Create session without response
    await expect(
      getBlueprintTool.handler({ projectId: 2 })
    ).rejects.toThrow();
  });
});
```

**Acceptance**:
- [ ] 3-4 tests passing
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests use test database

**Files**:
- `apps/mcp-server/src/tools/__tests__/getBlueprintTool.test.ts` (CREATE)

---

## Success Criteria

### Phase 2 Complete When:
- [ ] MCP tool `projectpulse.blueprint.get` implemented
- [ ] Tool registered in MCP server index
- [ ] API endpoint `GET /api/onboarding/blueprint` implemented
- [ ] MCP integration tests: 3-4 tests passing
- [ ] Tool callable from Claude Code MCP client
- [ ] Returns correct project-context.json structure
- [ ] NO UI components created (verified)
- [ ] Error messages are helpful and actionable

### Verification Gate
- [ ] Can retrieve Session 3 blueprint data without Phase 1 fix (independent)
- [ ] CurrentWorkModal data flow is separate concern (Phase 1 responsibility)
- [ ] NO DevelopmentSession creation in Phase 2 scope (verified)

---

## File Inventory

### New Files (3 total)
1. `apps/mcp-server/src/tools/onboarding/getBlueprintTool.ts` (CREATE)
2. `apps/web/app/api/onboarding/blueprint/route.ts` (CREATE)
3. `apps/mcp-server/src/tools/__tests__/getBlueprintTool.test.ts` (CREATE)

### Modified Files (1 total)
1. `apps/mcp-server/src/index.ts` (UPDATE - register tool)

---

## Dependencies

### External
- **Document model** (Phase 1 Task 0.0) - Must exist for OnboardingSession relations
- **OnboardingSession model** - Already exists with response JSONB field
- **DevelopmentSession model** (Phase 1 Task 0.4) - Used by agents (not by Blueprint tool)
- **Phase 1 Session 3 fix** (RECOMMENDED) - Enables full roadmap → current work UX flow
- **project-context.json structure** - Defined in 3-session-onboarding-REFERENCE.md

### Internal
- None (standalone MCP tool, no dependencies on other Phase 2 tasks)

---

## Timeline

**Part A: MCP Tool Implementation** - 3 hours
- Task A.1: Blueprint Get Tool (1.5 hours)
- Task A.2: API Route (1 hour)
- Task A.3: Registration (30 min)

**Part B: Testing** - 1 hour
- Task B.1: MCP Integration Tests (1 hour)

**Total**: 4 hours (0.5 days)

---

## Risks & Mitigations

### Risk 1: Session 3 Data Structure Changes (LOW)
- **Mitigation**: Well-defined in 3-session-onboarding-REFERENCE.md
- **Contingency**: Add schema validation with Zod

### Risk 2: Missing Session 3 Data (MEDIUM)
- **Mitigation**: Clear error messages guide users to complete onboarding
- **Contingency**: Return partial data with warnings if some fields missing

### Risk 3: Large JSON Responses (LOW)
- **Mitigation**: project-context.json is ~5-10KB, acceptable for MCP
- **Contingency**: Add pagination or summary mode if needed

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Complete Session 1-3 onboarding
- [ ] Call `projectpulse.blueprint.get(projectId: 1)` from Claude Code
- [ ] Verify returned JSON matches project-context.json structure
- [ ] Test with missing Session 3 (expect 404)
- [ ] Test with incomplete Session 3 (expect error)
- [ ] Verify no UI components created (no new .tsx files in components/)

### Automated Testing
- [ ] 3-4 unit tests in `getBlueprintTool.test.ts`
- [ ] API route test (optional - covered by MCP tool test)
- [ ] Integration test with real MCP client (manual)

---

**Plan Created**: 2025-11-17
**Last Updated**: 2025-11-17
**Source**: Sprint 8.5 detailed planning
**Review Cycle**: Daily checkpoints
**Next Phase**: Phase 3 (Agent AI Hub Tabs) - Can run parallel
