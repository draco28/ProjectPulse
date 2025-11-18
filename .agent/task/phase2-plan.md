# Sprint 8.5 Phase 2: Blueprint MCP Tool

**Phase**: Sprint 8.5 Phase 2 of 4
**Story Points**: 2 points
**Duration**: 0.5 days (~4 hours)
**Status**: IN PROGRESS
**Session**: 20251118-2130
**Started**: 2025-11-18 21:30 PST

---

## Executive Summary

### Goal
Enable agents to query Session 3 blueprint data via MCP (NO UI component).

### Why Critical
- Agents need to recall their onboarding configuration (tech stack, roadmap, budget)
- Session 3 stores data but NO read access exists
- Onboarding workflow is write-only without retrieval

---

## Implementation Tasks

### Part A: MCP Tool Implementation (3 hours)

**Task A.1**: Blueprint Get Tool (1.5 hours)
- File: `apps/mcp-server/src/tools/onboarding/getBlueprintTool.ts`
- Query OnboardingSession where sessionNumber = 3
- Parse response.projectContextJson
- Error handling: 404 if not found

**Task A.2**: API Route (1 hour)
- File: `apps/web/app/api/onboarding/blueprint/route.ts`
- GET endpoint with projectId validation
- Return JSON with proper error codes

**Task A.3**: Registration (30 min)
- File: `apps/mcp-server/src/index.ts`
- Import and register getBlueprintTool

### Part B: Testing (1 hour)

**Task B.1**: MCP Integration Tests (1 hour)
- File: `apps/mcp-server/src/tools/__tests__/getBlueprintTool.test.ts`
- 3-4 tests: happy path, 404, structure validation, missing response

---

## Success Criteria
- [ ] MCP tool implemented
- [ ] Tool registered
- [ ] API endpoint implemented
- [ ] 3-4 tests passing
- [ ] Tool callable from Claude Code
- [ ] Returns correct structure
- [ ] NO UI components created

---

**Next**: Task A.1 - Blueprint Get Tool implementation
