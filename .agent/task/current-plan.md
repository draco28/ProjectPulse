# E2E Test Infrastructure Improvement Plan

**Sprint**: 8.7 Phase 2+
**Created**: 2025-11-19
**Status**: Approved, Ready to Execute

## Context

Sprint 8.7 Phase 2 successfully migrated E2E tests from SSE to HTTP streamable transport, resolving the critical 30KB response limit bug. However, several test infrastructure improvements remain:

**Current Test Results**:
- Individual test runs: Session 1 (2/3), Session 2 (3/3), Session 3 (3/4)
- Combined test suite: 6/10 passing (60%)
- Root cause: Test data pollution when tests share TEST_PROJECT_ID=3

**Remaining Work**: 4 phases to achieve 100% test reliability

---

## Phase 1: Test Isolation & Cleanup Hooks

**Goal**: Fix test suite pollution (6/10 passing together → 10/10 passing)

**Estimated Time**: 3-4 hours

### Problem Analysis

- Tests share TEST_PROJECT_ID=3, causing data pollution
- Session 1 creates onboarding sessions
- Session 2 creates documents (linked to session1.id)
- Running all tests together causes duplicate data failures

### Files to Modify

1. **`apps/mcp-server/tests/e2e/setup/fixtures.ts`**
   - Add `generateUniqueProjectId()` function
   - Export cleanup helper function

2. **`apps/mcp-server/tests/e2e/setup/cleanup-test-data.ts`**
   - Expand to clean ALL onboarding-related tables
   - Add cascade delete for Documents, Roadmap, Personas, Skills, Workflows, SOPs

3. **Test files** (session1, session2, session3):
   - Add beforeEach hook to generate unique project ID
   - Add afterEach hook to cleanup test data
   - Use testProjectId instead of TEST_CONSTANTS.TEST_PROJECT_ID

### Implementation Strategy

**Recommended Approach**: Unique Project IDs per Test

```typescript
// fixtures.ts - add this function
export function generateUniqueProjectId(): number {
  // Use timestamp + random to ensure uniqueness across test runs
  return 10000 + Math.floor(Math.random() * 90000);
}

export async function cleanupProjectData(projectId: number): Promise<void> {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev' }
    }
  });

  try {
    await prisma.$transaction([
      // Delete in correct order (children first)
      prisma.document.deleteMany({ where: {
        onboardingSession: { projectId }
      }}),
      prisma.agentPersona.deleteMany({ where: { projectId } }),
      prisma.skill.deleteMany({ where: { projectId } }),
      prisma.workflow.deleteMany({ where: { projectId } }),
      prisma.sop.deleteMany({ where: { projectId } }),
      prisma.roadmap.deleteMany({ where: { projectId } }),
      prisma.onboardingSession.deleteMany({ where: { projectId } }),
    ]);
  } finally {
    await prisma.$disconnect();
  }
}
```

**Test Pattern**:

```typescript
// session1-strategic-planning.test.ts
describe('Session 1', () => {
  let testProjectId: number;

  beforeEach(() => {
    testProjectId = generateUniqueProjectId();
  });

  afterEach(async () => {
    await cleanupProjectData(testProjectId);
  });

  test('Complete 10-phase workflow', async () => {
    // Use testProjectId instead of TEST_CONSTANTS.TEST_PROJECT_ID
    const result = await client.callToolJSON('projectpulse_onboarding_getQuestions', {
      projectId: testProjectId,
      phase: 1
    });
  });
});
```

### Success Criteria

- ✅ All 10/10 tests pass when run together as suite
- ✅ Tests can run in any order without failures
- ✅ Database state is clean before each test
- ✅ No test data pollution between runs

---

## Phase 2: Fix Session 3 Project Plan Mock Data Format

**Goal**: Resolve "Invalid phases structure in roadmap" error

**Estimated Time**: 1-2 hours

### Problem Analysis

From Next.js logs:
```
Error: Invalid phases structure in roadmap cmi6nokbq00016wy4atedw238
    at materializeRoadmap (packages/roadmap-tools/dist/materializeRoadmap.js:73:15)
```

The `parseProjectPlan()` function expects a specific format that `generateMockProjectPlan()` doesn't match.

### Expected Format

From `packages/roadmap-tools/src/parseProjectPlan.ts` and `docs/13-Project-Plan.md`:

```markdown
## Phase A: Foundation (Weeks 1-4, Sprints 1-2)

### Sprint 1 (Weeks 1-2): Database Setup - 8 points

**Goals**:
- Set up PostgreSQL with pgvector extension
- Implement Prisma schema for core entities

**Deliverables**:
- Complete Prisma schema
- Migration files
```

Key requirements:
1. Phase must use letter ("Phase A", not "Phase 1")
2. Sprint header: `### Sprint N (Weeks X-Y): Name - XX points`
3. Must have **Goals** and **Deliverables** sections
4. Parser expects specific structure for ParsedRoadmap interface

### Files to Modify

**`apps/mcp-server/tests/e2e/setup/fixtures.ts`** (lines 197-318)
- Replace `generateMockProjectPlan()` function
- Match format from `docs/13-Project-Plan.md`

### Implementation

```typescript
export function generateMockProjectPlan(): string {
  return `# Project Implementation Plan

**Project**: TaskFlow AI-Powered Project Management
**Duration**: 8 weeks
**Team Size**: 2-3 developers

## Phase A: Foundation (Weeks 1-4, Sprints 1-2)

**Duration**: 4 weeks
**Points**: 20 points
**Goal**: Establish database schema and API foundation

### Sprint 1 (Weeks 1-2): Database Setup - 8 points

**Goals**:
- Set up PostgreSQL with pgvector extension
- Implement Prisma schema for core entities
- Create database migrations

**Deliverables**:
- Complete Prisma schema
- Migration files
- Seed data

### Sprint 2 (Weeks 3-4): Core API - 12 points

**Goals**:
- Build REST API endpoints
- Add input validation with Zod
- Implement error handling

**Deliverables**:
- OpenAPI specification
- API test suite
- Documentation

## Phase B: Implementation (Weeks 5-8, Sprints 3-4)

**Duration**: 4 weeks
**Points**: 25 points
**Goal**: Build user interface and agent integration

### Sprint 3 (Weeks 5-6): Frontend Foundation - 13 points

**Goals**:
- Set up Next.js 14 App Router
- Implement component library with shadcn/ui
- Build responsive layouts

**Deliverables**:
- Reusable UI components
- Responsive layouts
- Storybook documentation

### Sprint 4 (Weeks 7-8): Agent Integration - 12 points

**Goals**:
- Implement MCP server
- Build agent communication layer
- Add context capture

**Deliverables**:
- MCP server
- Agent integration guide
- E2E agent tests
`;
}
```

### Validation Steps

1. Update `generateMockProjectPlan()` in fixtures.ts
2. Run Session 2 tests to generate documents with new format
3. Run Session 3 bootstrap test
4. Verify `parseProjectPlan()` succeeds
5. Verify `materializeRoadmap()` creates Phase/Sprint/Week/Day hierarchy

### Success Criteria

- ✅ `parseProjectPlan()` successfully parses mock data
- ✅ Bootstrap test creates Phase/Sprint/Week/Day hierarchy
- ✅ No "Invalid phases structure" errors
- ✅ At least 2 phases, 4 sprints, 8 weeks materialized

---

## Phase 3: Performance Benchmarking

**Goal**: Document SSE vs HTTP stream performance differences

**Estimated Time**: 2-3 hours

### Context

From `MCP_SSE_LARGE_RESPONSE_BUG.md`:
- SSE works for <15KB responses
- SSE fails silently for >30KB responses (90s+ timeout)
- HTTP stream handles unlimited response sizes

### Files to Create

1. **`apps/mcp-server/tests/e2e/benchmarks/transport-comparison.test.ts`** (new)
2. **`apps/mcp-server/tests/e2e/benchmarks/README.md`** (new)

### Benchmark Scenarios

```typescript
const scenarios = [
  {
    name: 'Small (1KB)',
    tool: 'projectpulse_health_check',
    expectedSize: 1000
  },
  {
    name: 'Medium (15KB)',
    tool: 'projectpulse_onboarding_getQuestions',
    expectedSize: 15000
  },
  {
    name: 'Large (31KB)',
    tool: 'projectpulse_onboarding_getDocumentPrompts',
    expectedSize: 31000
  },
  {
    name: 'Very Large (100KB+)',
    tool: 'projectpulse_wiki_search',
    expectedSize: 100000
  },
];

for (const scenario of scenarios) {
  describe(scenario.name, () => {
    test('SSE transport', async () => {
      const client = new MCPTestClient(MCP_URL, 'sse');
      const startTime = Date.now();

      try {
        await client.connect();
        const result = await client.callToolJSON(scenario.tool, {});
        const latency = Date.now() - startTime;
        logBenchmark('SSE', scenario.name, latency, 'success');
      } catch (error) {
        const latency = Date.now() - startTime;
        logBenchmark('SSE', scenario.name, latency, 'timeout');
      }
    });

    test('HTTP stream transport', async () => {
      const client = new MCPTestClient(MCP_URL, 'http-stream');
      const startTime = Date.now();

      await client.connect();
      const result = await client.callToolJSON(scenario.tool, {});
      const latency = Date.now() - startTime;
      logBenchmark('HTTP Stream', scenario.name, latency, 'success');
    });
  });
}
```

### Metrics to Measure

- Latency (P50, P95, P99)
- Throughput (requests/second)
- Reliability (success rate %)
- Response size vs performance correlation

### Expected Results

| Scenario | SSE Latency | HTTP Stream Latency | Winner |
|----------|-------------|---------------------|--------|
| Small (1KB) | 50ms | 45ms | HTTP Stream |
| Medium (15KB) | 150ms | 120ms | HTTP Stream |
| Large (31KB) | TIMEOUT (90s+) | 200ms | HTTP Stream ✅ |
| Very Large (100KB+) | TIMEOUT | 500ms | HTTP Stream ✅ |

**Recommendation**: Use HTTP Stream as default transport

### Success Criteria

- ✅ Benchmark suite runs successfully
- ✅ Results documented with clear metrics
- ✅ Recommendation provided for default transport
- ✅ Known limitations documented for each transport

---

## Phase 4: Documentation Updates

**Goal**: Update documentation to reflect dual transport architecture

**Estimated Time**: 1-2 hours

### Files to Modify

1. **`apps/mcp-server/tests/e2e/README.md`**
   - Add transport selection guide
   - Update known issues
   - Add troubleshooting section

2. **`apps/mcp-server/tests/e2e/E2E_TEST_RESULTS_SUMMARY.md`**
   - Update with Phase 1 & 2 results
   - Document 10/10 passing achievement

3. **`apps/mcp-server/tests/e2e/MCP_SSE_LARGE_RESPONSE_BUG.md`**
   - Mark as RESOLVED
   - Keep as historical reference

### New README Sections

#### Transport Selection

```markdown
## Transport Selection

ProjectPulse MCP server supports two transports:

### HTTP Streamable (Recommended - Default)
- ✅ Handles responses of any size (no 30KB limit)
- ✅ Stateless (no session management overhead)
- ✅ NDJSON streaming for incremental responses
- ✅ Better performance for large responses
- 🔧 Requires MCP SDK ≥1.0.0

**When to use**: Production, large responses (>15KB), reliability critical

### SSE (Legacy)
- ⚠️ Limited to ~30KB responses
- ⚠️ Stateful (requires session management)
- ✅ Compatible with older MCP clients
- ✅ Works for small responses (<15KB)

**When to use**: Backward compatibility, small responses only

### Environment Variables

```bash
# Use HTTP stream (default)
TRANSPORT_TYPE=http-stream node --test apps/mcp-server/tests/e2e/**/*.test.ts

# Use SSE (legacy)
TRANSPORT_TYPE=sse node --test apps/mcp-server/tests/e2e/**/*.test.ts
```

## Known Issues

### ✅ RESOLVED: Large Response Timeout (Sprint 8.7)
**Issue**: SSE transport fails for responses >30KB
**Solution**: Use HTTP stream transport (default since Sprint 8.7)
**Reference**: MCP_SSE_LARGE_RESPONSE_BUG.md

### ✅ RESOLVED: Test Suite Pollution (Sprint 8.7 Phase 1)
**Issue**: Tests failed when run together due to shared TEST_PROJECT_ID
**Solution**: Unique project IDs per test with cleanup hooks
**Status**: Fixed in Phase 1

## Troubleshooting

### Issue: "Transport timeout for large responses"
**Cause**: Using SSE transport with >30KB response
**Fix**: Switch to HTTP stream transport (default)

### Issue: "Tests pass individually but fail in suite"
**Cause**: Test data pollution (shared project ID)
**Fix**: Use beforeEach/afterEach cleanup hooks (Phase 1)
```

### Success Criteria

- ✅ Documentation clearly explains both transports
- ✅ Known issues section is up-to-date
- ✅ Troubleshooting guide covers common problems
- ✅ Examples show how to switch transports

---

## Dependencies & Execution Order

### Dependency Graph

```
Phase 1 (Isolation) ────► Phase 4 (Documentation)
                             ▲
Phase 2 (Mock Data) ─────────┘
                             ▲
Phase 3 (Benchmarks) ────────┘
```

### Recommended Execution Order

1. **Phase 2** (1-2 hours) - Quick win, unblocks Session 3 test
2. **Phase 1** (3-4 hours) - Critical for test reliability
3. **Phase 3** (2-3 hours) - Validate transport performance
4. **Phase 4** (1-2 hours) - Document everything

**Total Estimated Time**: 7-11 hours

---

## Summary

### Changes Overview

| Phase | Files Modified | Files Created | LOC Changed |
|-------|----------------|---------------|-------------|
| Phase 1 | 5 (test files + fixtures + cleanup) | 0 | ~150 |
| Phase 2 | 1 (fixtures.ts) | 0 | ~50 |
| Phase 3 | 0 | 2 (benchmark + README) | ~300 |
| Phase 4 | 3 (READMEs) | 0 | ~200 |
| **Total** | **7** | **2** | **~700** |

### Final Success Criteria

- ✅ All 10/10 E2E tests pass in suite
- ✅ Session 3 bootstrap test completes successfully
- ✅ Performance benchmarks document transport differences
- ✅ Documentation reflects current architecture
- ✅ Test infrastructure is maintainable and reliable

---

## Notes

**Status**: Plan approved 2025-11-19
**Ready to execute**: Phase 2 (recommended first)
**Context preserved**: For session compaction recovery
