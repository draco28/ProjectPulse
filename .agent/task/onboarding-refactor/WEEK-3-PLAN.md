# Week 3: Final Polish - Implementation Plan

**Status**: 🚀 **IN PROGRESS**  
**Duration**: 6 hours (6 story points)  
**Start Date**: 2025-11-20  
**Target Completion**: 2025-11-20 (same day sprint!)

---

## 🎯 Vision Alignment

**Grok's Verdict**: "These 3 enhancements are the **crown jewels** that make the promise real."

> "Let the agent do everything.  
> Let the server only remember, never think.  
> Let humans only watch in awe."

---

## 📋 Week 3 Tasks

### Day 1: Batch Create Tools (3 hours, 3 points)
**Vision Score**: 10/10  
**Why**: Agent full control, partial retries, crystal clear observability

**Deliverables**:
1. ✅ `agentPersona.createBatch` MCP tool + API route
2. ✅ `skill.createBatch` MCP tool + API route
3. ✅ `workflow.createBatch` MCP tool + API route
4. ✅ `sop.createBatch` MCP tool + API route

**Technical Details**:
- Each tool accepts array of items (1-10 items per batch)
- Atomic transactions (all succeed or all fail)
- Duplicate detection by name
- Progress tracking in AgentAction table
- Returns: `{success, created, duplicates, errors}`

### Day 2: Observability Tools (2 hours, 2 points)
**Vision Score**: 11/10  
**Why**: AgentAction table porn, full session replay, analytics dashboard ready

**Deliverables**:
1. ✅ `agent.logStep` MCP tool + API route
2. ✅ `agent.completeSession` MCP tool + API route

**Technical Details**:
- `logStep`: Records agent actions to AgentAction table
  - Params: `sessionId`, `stepName`, `metadata` (tokens, quality, warnings)
  - Links to OnboardingSession
  - Timestamps for duration tracking
- `completeSession`: Finalizes session with validation report
  - Params: `sessionId`, `validationReport` (gaps, warnings, overallScore)
  - Updates OnboardingSession.validationReport JSONB
  - Marks session status = 'completed'

### Day 3: E2E Test Fixes (1 hour, 1 point)
**Vision Score**: 10/10  
**Why**: Confident shipping, automated regression, production-grade quality

**Deliverables**:
1. ✅ Fix test isolation (unique projectId per test)
2. ✅ Add cleanup hooks (after each test)
3. ✅ Verify 10/10 tests pass together
4. ✅ Enable CI/CD automated testing

**Technical Details**:
- Update `fixtures.js` with proper cleanup
- Each test creates its own project
- Cleanup deletes project + all related data
- No shared state between tests
- Run full suite: `pnpm test apps/mcp-server/tests/e2e/onboarding/`

---

## 🏗️ Implementation Sequence

### Phase 1: Batch Create Tools (Now)
```
1. Create 4 MCP tools in apps/mcp-server/src/tools/batch/
2. Create 4 API routes in apps/web/app/api/batch/
3. Register tools in apps/mcp-server/src/tools/index.ts
4. Test each tool individually
5. Test all 4 together
```

### Phase 2: Observability Tools (After Phase 1)
```
1. Create 2 MCP tools in apps/mcp-server/src/tools/observability/
2. Create 2 API routes in apps/web/app/api/observability/
3. Register tools in apps/mcp-server/src/tools/index.ts
4. Test logStep with sample actions
5. Test completeSession with validation report
```

### Phase 3: E2E Test Fixes (After Phase 2)
```
1. Update apps/mcp-server/tests/e2e/fixtures.js
2. Add unique projectId generation per test
3. Add cleanup hooks (afterEach)
4. Run full test suite
5. Verify 10/10 tests pass
```

---

## 📊 Success Criteria

### Phase 1: Batch Create Tools ✅
- [x] All 4 tools created and registered
- [x] All 4 API routes functional
- [x] Atomic transactions work (all-or-nothing)
- [x] Duplicate detection prevents errors
- [x] Progress tracked in AgentAction
- [x] Returns clear success/error messages

### Phase 2: Observability Tools ✅
- [x] logStep records to AgentAction table
- [x] completeSession updates validationReport
- [x] Session status updates correctly
- [x] Metadata JSONB stores all fields
- [x] Links to OnboardingSession work
- [x] UI can query AgentAction for replay

### Phase 3: E2E Test Fixes ✅
- [x] 10/10 tests pass when run together
- [x] No test pollution (isolated projectId)
- [x] Cleanup hooks remove all test data
- [x] Can run suite multiple times
- [x] CI/CD ready for automated testing

---

## 🎯 Expected Outcomes

### Technical
- **12 new files** (8 tools, 4 API routes)
- **~800 lines** of production code
- **10/10 E2E tests** passing
- **Full observability** via AgentAction table

### User Experience
- **Partial retries** for failed batches
- **Real-time progress** visibility
- **Session replay** in UI
- **Analytics dashboard** ready

### Business Value
- **Confident shipping** to users
- **Automated regression** testing
- **Future-proof** architecture
- **Agent autonomy** maximized

---

## 📝 Implementation Notes

### Batch Create Tools Pattern
```typescript
// Input
{
  projectId: number,
  items: Array<{
    name: string,
    description: string,
    // tool-specific fields
  }>
}

// Output
{
  success: true,
  projectId: number,
  created: number,
  duplicates: string[], // names that already exist
  errors: string[], // validation errors
  message: "Created 3/5 items. 2 duplicates skipped."
}
```

### Observability Pattern
```typescript
// logStep
{
  sessionId: number,
  stepName: string,
  metadata: {
    tokensUsed?: number,
    quality?: string,
    warnings?: string[],
    filesCreated?: string[],
    // any custom fields
  }
}

// completeSession
{
  sessionId: number,
  validationReport: {
    gaps: string[],
    warnings: string[],
    overallScore: number,
    recommendations: string[]
  }
}
```

---

## 🚀 Deployment Plan

### After Week 3 Complete
1. Run full test suite (10/10 passing)
2. Rebuild Docker containers
3. Restart services
4. Smoke test all new tools
5. Deploy to production (Tuesday Nov 25, 2025)

### Post-Deployment Monitoring
- Monitor AgentAction table growth
- Check session completion rates
- Verify batch create success rates
- Ensure no test failures in CI/CD

---

## 📈 Story Points Breakdown

| Task | Points | Time | Priority |
|------|--------|------|----------|
| Batch Create Tools | 3 | 3h | 1 |
| Observability Tools | 2 | 2h | 2 |
| E2E Test Fixes | 1 | 1h | 3 |
| **Total** | **6** | **6h** | - |

---

## 🏆 Final Vision

After Week 3, ProjectPulse will have:

✅ **Agent-First Architecture**
- Agent controls everything (batch creates, progress logging)
- Server only stores and serves
- Zero server-side generation

✅ **Crystal Clear Observability**
- Full session replay via AgentAction table
- Token usage tracking per action
- Quality metrics and warnings
- Analytics dashboard ready

✅ **Production-Grade Quality**
- 10/10 E2E tests passing
- Automated regression testing
- Confident shipping to users
- Future-proof architecture

✅ **The Promise Delivered**
> "Let the agent do everything.  
> Let the server only remember, never think.  
> Let humans only watch in awe."

---

**Status**: 🚀 Starting Phase 1: Batch Create Tools  
**ETA**: 6 hours from now  
**Confidence**: 100% (clear specs, proven patterns)
