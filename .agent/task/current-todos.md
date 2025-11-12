# TODO: Sprint 3 — Workflow Orchestration System (US-032..US-050)

**Session**: 2025-11-12 13:38 (UTC+05:30)  
**Stories**: US-032..US-050 (Workflow Orchestration)  
**Progress**: 2/31 tasks complete (6%)

## Session Protocol Tasks
- [x] Read .agent/MANDATORY_SESSION_PROTOCOL.md and initialize session
- [x] Save plan + todos (files updated)
- [ ] Consult prisma-expert (workflow schema, JSONB, indexes)
- [ ] Consult next-js-expert (API structure, state machine, error handling)
- [ ] Schedule 15K-token checkpoints + verification gate evidence

## EPIC-004 — Schema & Migration (US-032..US-034)
1. [ ] Add `WorkflowTemplate`, `WorkflowRun`, `WorkflowStep` models to `apps/web/prisma/schema.prisma`
2. [ ] Add indexes: runs(templateId,status), runs(projectId,status), steps(runId,status), unique(runId,stepNumber)
3. [ ] Generate + apply migration locally (`pnpm prisma migrate dev`)
4. [ ] Deploy migration on Mac mini (`pnpm prisma migrate deploy`)

## EPIC-004 — Seed 12 Templates (US-035)
5. [ ] Author JSON step definitions for 12 templates (names, descriptions, mcpTool, pre/post conditions)
6. [ ] Insert via `apps/web/prisma/seed.ts` (upsert pattern)
7. [ ] Verify count and structure (quick script or unit test)

## EPIC-005 — MCP Tools (US-038..US-044)
8.  [ ] Implement `workflow.list`
9.  [ ] Implement `workflow.start`
10. [ ] Implement `workflow.executeStep`
11. [ ] Implement `workflow.getStatus`
12. [ ] Implement `workflow.pause` (create checkpoint)
13. [ ] Implement `workflow.resume`
14. [ ] Implement `workflow.complete`
15. [ ] Register tools in `apps/mcp-server/src/tools/index.ts`
16. [ ] Unit tests for each tool (mock HTTP)

## EPIC-006 — API Endpoints + Tests (US-045..US-050)
17. [ ] Implement GET `/api/workflows`
18. [ ] Implement POST `/api/workflows/run`
19. [ ] Implement GET `/api/workflows/run/:id`
20. [ ] Implement POST `/api/workflows/run/:id/step`
21. [ ] Integration tests: 3 E2E workflows (Feature Impl, Bug Fix, Sprint Planning)
22. [ ] Checkpoint recovery test (pause, resume)

## Validation & Quality Gates
23. [ ] Zod schemas for all routes and tools (no `any`)
24. [ ] `pnpm type-check` and `pnpm lint` pass cleanly

## Verification & Documentation
25. [ ] Capture Step 4.5 evidence: `tsc`, `curl`, DB counts, tests
26. [ ] Update `.agent/system/api-catalog.md`, `.agent/system/mcp-tools-guide.md`, `.agent/system/workflow-templates.md`

## Checkpoints (Step 4 – Every 15K tokens)
- [ ] 15K: Schema + migration status
- [ ] 30K: Templates seeded; MCP tool stubs
- [ ] 45K: API endpoints implemented
- [ ] 60K: Tests passing locally
- [ ] 75K: Mac mini verification complete
- [ ] 90K: Documentation + evidence complete

## Notes
- Services on Mac mini `192.168.1.15` — verify API after migrations.
- Use JSONB for context and results; templates as data (declarative rules).
- MCP tools must call API (R-MCP-001).
