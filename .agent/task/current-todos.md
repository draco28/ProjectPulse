# Current Todos - E2E Test Infrastructure Improvements

**Sprint**: 8.7 Phase 2+
**Created**: 2025-11-19
**Status**: In Progress

## Phase 2: Fix Mock Data Format (Quick Win) ✅ COMPLETE

- [x] Update `generateMockProjectPlan()` in fixtures.ts with correct format
- [x] Fix parseProjectPlan() regex bug (`##` → `###` to match real docs)
- [x] Run Session 2 tests to regenerate documents
- [x] Test Session 3 bootstrap with new format
- [x] Verify format fix (tests pass individually, fail together due to Phase 1 pollution)
- [x] Rebuild packages (roadmap-tools, mcp-server) and containers

**Estimated**: 1-2 hours
**Actual**: ~2 hours
**Status**: ✅ COMPLETE (2025-11-20)

**Key Changes**:
- `packages/roadmap-tools/src/parseProjectPlan.ts`: Fixed phase regex from `^##` to `^###`
- `apps/mcp-server/tests/e2e/setup/fixtures.ts`: Updated mock to use `### Phase A/B/C` format

**Note**: Tests now pass individually but fail when run together due to test pollution (Phase 1 will fix)

## Phase 1: Test Isolation & Cleanup ✅ COMPLETE (with notes)

- [x] Add `generateUniqueProjectId()` function to fixtures.ts
- [x] Add `createTestProject()` function to fixtures.ts
- [x] Add `cleanupProjectData()` function to fixtures.ts
- [x] Fix PrismaClient import (static instead of async)
- [x] Fix Prisma model names (WorkflowTemplate, not Workflow)
- [x] Add comprehensive roadmap hierarchy cleanup
- [x] Add beforeEach hooks to all test files
- [x] Add afterEach hooks to all test files
- [x] Run complete test suite and verify isolation working

**Estimated**: 3-4 hours
**Actual**: ~4.5 hours
**Status**: ✅ COMPLETE (2025-11-20)

**Test Results**: 7/10 passing (up from 6/10)
- Session 1: 2/3 passing ✅
- Session 2: 2/3 passing (1 expected failure due to Session 1 dependency)
- Session 3: 3/4 passing (1 expected failure due to Session 1+2 dependency)

**Key Achievements**:
- ✅ Test isolation working - each test uses unique project ID
- ✅ Cleanup function working - no more "cannot read deleteMany" errors
- ✅ All validation tests passing (7 tests)
- ✅ Session 1 complete workflow passing

**Known Limitations**:
- Session 2 "Generate 15 documents" test requires Session 1 completion
- Session 3 "Bootstrap" test requires Session 1+2 completion
- These tests were designed for sequential execution on same project
- For true independence, would need mock data or API changes to handle missing sessions

**Files Modified**:
- `apps/mcp-server/tests/e2e/setup/fixtures.ts`: Added createTestProject(), fixed cleanupProjectData()
- `apps/mcp-server/tests/e2e/onboarding/session1-strategic-planning.test.ts`: Added hooks + project creation
- `apps/mcp-server/tests/e2e/onboarding/session2-document-generation.test.ts`: Added hooks + project creation
- `apps/mcp-server/tests/e2e/onboarding/session3-bootstrap.test.ts`: Added hooks + project creation

## Phase 3: Performance Benchmarking

- [ ] Create tests/e2e/benchmarks/ directory
- [ ] Create transport-comparison.test.ts
- [ ] Implement 4 benchmark scenarios (Small, Medium, Large, Very Large)
- [ ] Run benchmarks for SSE transport
- [ ] Run benchmarks for HTTP stream transport
- [ ] Document results in benchmarks/README.md
- [ ] Add recommendation section

**Estimated**: 2-3 hours
**Status**: Pending (validates transport performance)

## Phase 4: Documentation Updates

- [ ] Update tests/e2e/README.md with transport selection guide
- [ ] Add Known Issues section to README
- [ ] Add Troubleshooting section to README
- [ ] Update E2E_TEST_RESULTS_SUMMARY.md with latest results
- [ ] Mark MCP_SSE_LARGE_RESPONSE_BUG.md as RESOLVED
- [ ] Review and polish all documentation

**Estimated**: 1-2 hours
**Status**: Pending (final documentation)

---

## Progress Summary

**Total Tasks**: 32 (expanded during implementation)
**Completed**: 15 (Phase 2 + Phase 1)
**In Progress**: 0
**Pending**: 17

**Estimated Total Time**: 7-11 hours
**Actual Time So Far**: ~6.5 hours (Phase 2: 2h, Phase 1: 4.5h)

---

## Notes

- **Recommended order**: Phase 2 � Phase 1 � Phase 3 � Phase 4
- **Critical path**: Phase 2 (quick win) � Phase 1 (reliability)
- **Context preserved**: Plan saved to current-plan.md for recovery
