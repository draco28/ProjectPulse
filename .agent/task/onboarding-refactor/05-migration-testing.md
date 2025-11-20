# Migration & Testing Strategy

**Related**: [Overview](./01-overview.md) | [Schema](./02-schema-changes.md) | [Tools](./03-mcp-tools.md) | [Implementation](./04-implementation-plan.md)

---

## Overview

This document covers:
1. Data migration from current schema to refactored schema
2. Backward compatibility strategies
3. E2E test isolation fixes
4. Performance benchmarking
5. Rollback procedures

---

## 1. Data Migration

### 1.1 Migration Script

**File**: `scripts/migrate-onboarding-data.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev' }
  }
});

async function migrateOnboardingData() {
  console.log('🔄 Starting onboarding data migration...\n');
  
  // Step 1: Count existing sessions
  const totalSessions = await prisma.onboardingSession.count({
    where: { response: { not: null } }
  });
  
  console.log(`Found ${totalSessions} sessions to migrate\n`);
  
  if (totalSessions === 0) {
    console.log('✅ No sessions to migrate - database is clean');
    return;
  }
  
  // Step 2: Migrate each session
  const sessions = await prisma.onboardingSession.findMany({
    where: { response: { not: null } },
    select: {
      id: true,
      projectId: true,
      sessionNumber: true,
      response: true
    }
  });
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const session of sessions) {
    try {
      const response = session.response as any;
      
      // Skip if already migrated
      if (!response) {
        skipped++;
        continue;
      }
      
      console.log(`Migrating session ${session.id} (project ${session.projectId}, session ${session.sessionNumber})...`);
      
      // Extract data from response JSONB
      const planningAnswers = response.planningAnswers || null;
      const projectContextJson = response.projectContextJson || null;
      const tokensUsed = response.metrics?.tokensUsed || 0;
      const phasesComplete = response.currentPhase || 0;
      
      // Update with new fields
      await prisma.onboardingSession.update({
        where: { id: session.id },
        data: {
          planningAnswers,
          projectContextJson,
          metrics: {
            tokensUsed,
            phasesComplete,
            migratedAt: new Date().toISOString()
          }
          // Keep response field for backward compat (remove Sprint 10)
        }
      });
      
      migrated++;
      console.log(`  ✅ Migrated session ${session.id}\n`);
      
    } catch (error) {
      errors++;
      console.error(`  ❌ Failed to migrate session ${session.id}:`, error);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  Total: ${totalSessions}`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  
  if (errors > 0) {
    console.error('\n⚠️  Some sessions failed to migrate - check errors above');
    process.exit(1);
  }
  
  console.log('\n✅ Migration complete!');
}

migrateOnboardingData()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### 1.2 Running Migration

```bash
# Backup database first
pg_dump -h 192.168.1.15 -U postgres projectpulse_dev > backup-$(date +%Y%m%d).sql

# Run migration script
pnpm tsx scripts/migrate-onboarding-data.ts

# Verify
psql -h 192.168.1.15 -U postgres -d projectpulse_dev
> SELECT id, project_id, session_number, 
>        planning_answers IS NOT NULL as has_planning_answers,
>        project_context_json IS NOT NULL as has_context
> FROM onboarding_sessions;
```

### 1.3 Validation Queries

```sql
-- Check migration status
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN planning_answers IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN response IS NOT NULL AND planning_answers IS NULL THEN 1 END) as pending
FROM onboarding_sessions;

-- Find unmigrated sessions
SELECT id, project_id, session_number
FROM onboarding_sessions
WHERE response IS NOT NULL 
  AND planning_answers IS NULL;

-- Verify projectContextJson structure
SELECT 
  id,
  jsonb_typeof(project_context_json) as type,
  project_context_json->'metadata'->>'projectName' as project_name
FROM onboarding_sessions
WHERE project_context_json IS NOT NULL
LIMIT 5;
```

---

## 2. Backward Compatibility

### 2.1 Legacy Tool Redirects

**Strategy**: Keep old tool names but redirect to new implementations.

```typescript
// apps/mcp-server/src/tools/onboarding/getQuestions.ts (DEPRECATED)

import { getPhasedQuestionsTool } from './getPhasedQuestionsTool.js';

export const getQuestionsTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getQuestions',
  description: 'DEPRECATED: Use getPhasedQuestions instead. This tool redirects for backward compatibility.',
  schema: getPhasedQuestionsTool.schema,
  inputSchema: getPhasedQuestionsTool.inputSchema,
  
  async execute(params: unknown, context: ToolContext) {
    context.logger.warn('DEPRECATED: getQuestions called - redirecting to getPhasedQuestions');
    return getPhasedQuestionsTool.execute(params, context);
  }
};
```

```typescript
// apps/mcp-server/src/tools/onboarding/saveAnswers.ts (DEPRECATED)

import { savePhaseTool } from './savePhaseTool.js';

export const saveAnswersTool: ToolDefinition = {
  name: 'projectpulse_onboarding_saveAnswers',
  description: 'DEPRECATED: Use savePhase instead. This tool redirects for backward compatibility.',
  schema: savePhaseTool.schema,
  inputSchema: savePhaseTool.inputSchema,
  
  async execute(params: unknown, context: ToolContext) {
    context.logger.warn('DEPRECATED: saveAnswers called - redirecting to savePhase');
    return savePhaseTool.execute(params, context);
  }
};
```

### 2.2 Response Field Fallback

**API Routes**: Read from new fields first, fall back to `response` field.

```typescript
// Example: GET /api/onboarding/questions

export async function GET(request: NextRequest) {
  const projectId = parseInt(request.nextUrl.searchParams.get('projectId')!);
  const phase = parseInt(request.nextUrl.searchParams.get('phase')!);
  
  const session = await prisma.onboardingSession.findUnique({
    where: { projectId_sessionNumber: { projectId, sessionNumber: 1 } }
  });
  
  // Try new field first, fall back to response JSONB
  const planningAnswers = session?.planningAnswers || 
                          (session?.response as any)?.planningAnswers || 
                          {};
  
  const currentPhase = (session?.metrics as any)?.phasesComplete || 
                       (session?.response as any)?.currentPhase || 
                       0;
  
  // ... rest of implementation
}
```

### 2.3 Deprecation Timeline

| Sprint | Action | Status |
|--------|--------|--------|
| Sprint 9 | Deploy refactor with redirects | ✅ Active |
| Sprint 9 | Monitor legacy tool usage | 📊 Logging |
| Sprint 10 | Remove `response` field | 🗑️ Planned |
| Sprint 10 | Remove legacy tool redirects | 🗑️ Planned |

---

## 3. E2E Test Isolation Fix

### 3.1 Problem Analysis

**Current Issue**: Tests share `TEST_PROJECT_ID=3`, causing:
- Data pollution between tests
- 6/10 tests pass together, but 10/10 individually
- Failures due to duplicate data

**Root Cause**: Sequential tests create/modify same project without cleanup.

### 3.2 Solution: Unique Project IDs + Cleanup

**Update**: `apps/mcp-server/tests/e2e/setup/fixtures.ts`

```typescript
// Generate unique project ID per test
export function generateUniqueProjectId(): number {
  // Use timestamp + random to ensure uniqueness across test runs
  // Range: 10000-99999 (avoids conflicts with seeded data)
  return 10000 + Math.floor(Math.random() * 90000);
}

// Cleanup all data for a project
export async function cleanupProjectData(projectId: number): Promise<void> {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev' }
    }
  });

  try {
    await prisma.$transaction([
      // Delete in correct order (children first, due to FK constraints)
      
      // Onboarding-related
      prisma.document.deleteMany({ 
        where: { onboardingSession: { projectId } } 
      }),
      prisma.onboardingSession.deleteMany({ 
        where: { projectId } 
      }),
      
      // Session 3 artifacts
      prisma.agentPersona.deleteMany({ where: { projectId } }),
      prisma.skill.deleteMany({ where: { projectId } }),
      prisma.workflow.deleteMany({ where: { projectId } }),
      prisma.sop.deleteMany({ where: { projectId } }),
      
      // Hierarchy (cascades: Phase → Sprint → Week → Day → Task)
      prisma.roadmap.deleteMany({ where: { projectId } }),
      
      // Finally, project itself
      prisma.project.deleteMany({ where: { id: projectId } })
    ]);
  } finally {
    await prisma.$disconnect();
  }
}
```

### 3.3 Test Pattern Update

**Before (Shared ID)**:
```typescript
describe('Session 1: Strategic Planning', () => {
  const TEST_PROJECT_ID = 3;
  
  test('Complete 10-phase workflow', async () => {
    // Uses shared ID - causes pollution
    const result = await client.callToolJSON('projectpulse_onboarding_getQuestions', {
      projectId: TEST_PROJECT_ID,
      phase: 1
    });
  });
});
```

**After (Unique ID + Cleanup)**:
```typescript
describe('Session 1: Strategic Planning', () => {
  let testProjectId: number;

  beforeEach(async () => {
    testProjectId = generateUniqueProjectId();
    await createTestProject(testProjectId); // Helper to create minimal project
  });

  afterEach(async () => {
    await cleanupProjectData(testProjectId);
  });

  test('Complete 10-phase workflow', async () => {
    // Each test gets unique ID
    const result = await client.callToolJSON('projectpulse_onboarding_getPhasedQuestions', {
      projectId: testProjectId,
      phase: 1
    });
    
    // ... test logic
  });
  
  test('Token budget tracking', async () => {
    // Different test, different ID (from beforeEach)
    const result = await client.callToolJSON('projectpulse_onboarding_checkTokenBudget', {
      projectId: testProjectId,
      estimatedTokens: 5000
    });
  });
});
```

### 3.4 Update All E2E Tests

**Files to Update**:
```
apps/mcp-server/tests/e2e/onboarding/session1-strategic-planning.test.ts
apps/mcp-server/tests/e2e/onboarding/session2-documentation.test.ts
apps/mcp-server/tests/e2e/onboarding/session3-bootstrap.test.ts
apps/mcp-server/tests/e2e/onboarding/full-onboarding-workflow.test.ts
```

**Pattern**: Add `beforeEach/afterEach` hooks to all test files.

### 3.5 Integrated Test Suite Pattern

For tests that span multiple sessions (e.g., `full-onboarding-workflow.test.ts`):

```typescript
describe('Full 3-Session Onboarding Workflow (Integrated)', { concurrency: false }, () => {
  let sharedProjectId: number;
  let tempRepoPath: string;

  // ONE-TIME SETUP: Create shared state for entire suite
  before(async () => {
    sharedProjectId = generateUniqueProjectId();
    console.log(`\n🔧 Integrated Test Suite - Shared Project ID: ${sharedProjectId}`);
    await createTestProject(sharedProjectId);
    tempRepoPath = await createTempRepo();
  });

  // ONE-TIME CLEANUP: After all tests complete
  after(async () => {
    console.log(`\n🧹 Cleaning up shared project ${sharedProjectId}...`);
    await cleanupProjectData(sharedProjectId);
    await cleanupTempRepo(tempRepoPath);
  });

  test('Session 1: Complete 10-phase Q&A workflow', async () => {
    // Uses sharedProjectId
  });

  test('Session 2: Generate 15 documents', async () => {
    // Uses sharedProjectId (depends on Session 1)
  });

  test('Session 3: Bootstrap workflow', async () => {
    // Uses sharedProjectId (depends on Session 1+2)
  });
});
```

---

## 4. Performance Benchmarking

### 4.1 Token Efficiency Measurement

**File**: `apps/mcp-server/tests/e2e/benchmarks/token-efficiency.test.ts`

```typescript
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MCPTestClient } from '../setup/mcp-client.js';
import { generateUniqueProjectId, createTestProject, cleanupProjectData } from '../setup/fixtures.js';

const MCP_URL = 'http://192.168.1.15:3001/mcp';

describe('Token Efficiency Benchmarks', () => {
  let testProjectId: number;
  let client: MCPTestClient;

  beforeEach(async () => {
    testProjectId = generateUniqueProjectId();
    await createTestProject(testProjectId);
    client = new MCPTestClient(MCP_URL, 'http-stream');
    await client.connect();
  });

  afterEach(async () => {
    await cleanupProjectData(testProjectId);
    await client.disconnect();
  });

  test('Session 1: Token usage <60K', async () => {
    let totalTokens = 0;
    
    // Complete all 10 phases
    for (let phase = 1; phase <= 10; phase++) {
      const mockAnswers = generateMockAnswers(phase);
      
      await client.callToolJSON('projectpulse_onboarding_savePhase', {
        projectId: testProjectId,
        phase,
        answers: mockAnswers
      });
      
      // Check token budget after each phase
      const budget = await client.callToolJSON('projectpulse_onboarding_checkTokenBudget', {
        projectId: testProjectId,
        estimatedTokens: 0 // Just checking current usage
      });
      
      totalTokens = budget.tokensUsed;
    }
    
    console.log(`Session 1 total tokens: ${totalTokens}`);
    assert(totalTokens < 60000, `Session 1 exceeded 60K tokens: ${totalTokens}`);
  });

  test('Session 2: Token usage <120K', async () => {
    // ... similar pattern for Session 2 batches
  });

  test('Full 3-session flow: Token usage <200K', async () => {
    // ... test entire flow
  });
});
```

### 4.2 Latency Benchmarks

**File**: `apps/mcp-server/tests/e2e/benchmarks/tool-latency.test.ts`

```typescript
test('MCP tool latency: P95 <500ms', async () => {
  const latencies: number[] = [];
  
  // Sample 100 calls
  for (let i = 0; i < 100; i++) {
    const startTime = Date.now();
    
    await client.callToolJSON('projectpulse_onboarding_getPhasedQuestions', {
      projectId: testProjectId,
      phase: 1
    });
    
    const latency = Date.now() - startTime;
    latencies.push(latency);
  }
  
  // Calculate P95
  latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index];
  
  console.log(`P50: ${latencies[Math.floor(latencies.length * 0.5)]}ms`);
  console.log(`P95: ${p95Latency}ms`);
  console.log(`P99: ${latencies[Math.floor(latencies.length * 0.99)]}ms`);
  
  assert(p95Latency < 500, `P95 latency exceeded 500ms: ${p95Latency}ms`);
});
```

### 4.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Session 1 tokens | <60K | `checkTokenBudget` after phase 10 |
| Session 2 tokens | <120K | Sum of 4 batch token counts |
| Session 3 tokens | <20K | Bootstrap + batch creates |
| Total tokens | <200K | Sum of all sessions |
| Token reduction | 88-92% | Compare to old all-at-once flow |
| MCP latency P95 | <500ms | 100 sample calls |
| E2E test pass rate | 10/10 (100%) | Full test suite run |

---

## 5. Rollback Procedures

### 5.1 When to Rollback

Rollback if:
- Migration fails with >10% errors
- E2E tests fail after deploy
- Critical production bug introduced
- Performance significantly degraded

### 5.2 Rollback Steps

#### Step 1: Revert Code Changes

```bash
# Find refactor commit
git log --oneline | grep "onboarding refactor"

# Revert
git revert <commit-hash>
git push origin sprint-9
```

#### Step 2: Rollback Database Migration

```bash
# Restore from backup
psql -h 192.168.1.15 -U postgres -d projectpulse_dev < backup-YYYYMMDD.sql

# OR: Prisma rollback (if migration applied)
pnpm prisma migrate resolve --rolled-back XXXXXX_onboarding_refactor
```

#### Step 3: Verify Rollback

```bash
# Check schema
pnpm prisma db pull

# Verify old tools work
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### 5.3 Partial Rollback

If only specific features fail:

**Option A**: Disable new tools (keep old ones active)
```typescript
// apps/mcp-server/src/tools/index.ts
export const loadTools = (): ToolDefinition[] => [
  // ... existing tools
  
  // Temporarily disable new tools
  // getPhasedQuestionsTool,
  // savePhaseTool,
  
  // Keep old tools active
  getQuestionsTool, // old name
  saveAnswersTool,  // old name
  
  // ...
];
```

**Option B**: Feature flag
```typescript
const USE_REFACTORED_ONBOARDING = process.env.USE_REFACTORED_ONBOARDING === 'true';

export const loadTools = (): ToolDefinition[] => [
  // ...
  
  USE_REFACTORED_ONBOARDING ? getPhasedQuestionsTool : getQuestionsTool,
  USE_REFACTORED_ONBOARDING ? savePhaseTool : saveAnswersTool,
  
  // ...
];
```

---

## 6. Post-Deployment Validation

### 6.1 Smoke Tests (Production)

```bash
# Health check
curl http://192.168.1.15:3000/api/health

# MCP server list tools
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' | jq '.result.tools | length'
# Should return 41+ (all tools including 17 refactored)

# Check WorkflowTemplate seeded
psql -h 192.168.1.15 -U postgres -d projectpulse_dev \
  -c "SELECT COUNT(*) FROM workflow_templates WHERE category='onboarding';"
# Should return 16

# Verify migration
psql -h 192.168.1.15 -U postgres -d projectpulse_dev \
  -c "SELECT COUNT(*) FROM onboarding_sessions WHERE planning_answers IS NOT NULL;"
```

### 6.2 Monitoring Checklist

- [ ] MCP server responding (200 OK)
- [ ] All 17 tools registered
- [ ] Database schema matches Prisma
- [ ] Seed data complete (96 questions, 16 templates)
- [ ] Legacy tools redirect correctly
- [ ] E2E tests: 10/10 passing
- [ ] No errors in logs

### 6.3 Success Criteria (Final Validation)

**Must Pass**:
- ✅ All 17 tools callable via MCP
- ✅ Data migrated successfully (0 errors)
- ✅ E2E tests: 10/10 passing
- ✅ Token efficiency: 88-92% reduction measured
- ✅ MCP latency: P95 <500ms
- ✅ Backward compatibility: Legacy tools redirect

**Optional (Nice-to-Have)**:
- ✅ UI dashboard showing onboarding progress
- ✅ Real-time SSE updates
- ✅ Prometheus metrics exported

---

## 7. Next Steps After Validation

### Sprint 10 (Cleanup)
- [ ] Remove `response` field from schema
- [ ] Remove legacy tool redirects
- [ ] Update all documentation
- [ ] Optimize performance (caching, indexes)

### Sprint 11 (Enhancements)
- [ ] UI dashboard for onboarding progress
- [ ] Real-time SSE progress updates
- [ ] Agent analytics (token usage trends)
- [ ] Workflow templates UI editor

---

## Summary

This migration and testing strategy ensures:
1. **Safe Migration**: Backward-compatible with rollback plan
2. **Test Reliability**: 10/10 E2E pass rate via isolation fixes
3. **Performance**: 88-92% token reduction, <500ms latency
4. **Observability**: Comprehensive benchmarks and monitoring

**Ready to deploy?** Follow [Implementation Plan](./04-implementation-plan.md) Week 1-3.
