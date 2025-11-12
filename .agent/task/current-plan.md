# Sprint 3 Implementation Plan — Workflow Orchestration System (US-032..US-050, 48 points)

Session: 2025-11-12 13:38 IST
Scope: Build end-user workflow orchestration backed by database + MCP tools, tied to Project

## Objectives
- Database models: WorkflowTemplate, WorkflowRun, WorkflowStep (linked to Project)
- Seed 12 templates: Feature Implementation, Bug Fix, Refactoring, Documentation Update, Test Coverage Improvement, Database Migration, Sprint Planning, Sprint Review, Progress Checkpoint, Wiki Page Creation, Knowledge Search, Onboarding New Project
- MCP tools (7): workflow.list, workflow.start, workflow.executeStep, workflow.getStatus, workflow.pause, workflow.resume, workflow.complete
- API endpoints (4):
  - GET /api/workflows
  - POST /api/workflows/run
  - GET /api/workflows/run/:id
  - POST /api/workflows/run/:id/step
- State machine: pending → running → completed/failed/paused with validations
- Checkpoints: integrate sprint.checkpoint.create on pause/resume
- Web UI (minimal): /workflows page to list templates and active runs (monitor-only)

## Architecture Decisions
- JSONB for variable context and step results (WorkflowRun.context, WorkflowStep.result)
- Templates are data (WorkflowTemplate.steps JSON) with pre/post conditions
- Indexes for status/templateId/projectId on runs and runId/status on steps
- All MCP tools call Next.js API (R-MCP-001); no direct DB from MCP server

## Phased Implementation

### Phase A (Day 1-2): Prisma schema + migration
1. Add WorkflowTemplate, WorkflowRun, WorkflowStep models with relations to Project
2. Create indexes: runs(templateId,status), runs(projectId,status), steps(runId,status), unique(runId,stepNumber)
3. Generate migration locally; deploy on Mac mini
4. Prisma Client regenerate and type-check

### Phase B (Day 3-5): Seed 12 workflow templates
5. Author JSON step definitions with names, descriptions, mcpTool, preconditions, postconditions
6. Insert via seed.ts using upsert patterns
7. Validate structure with a lightweight unit test (schema guard)

### Phase C (Day 6-7): State machine + validations
8. Implement transition helpers in API layer (pending→running, etc.) with guards
9. Pre/post condition validator (declarative rules)

### Phase D (Day 8-10): MCP tools (7 tools)
10. Implement and register workflow.list, start, executeStep, getStatus, pause, resume, complete
11. Add unit tests (handler-level, mocked HTTP)

### Phase E (Day 11-12): API endpoints
12. Implement GET /api/workflows, POST /api/workflows/run
13. Implement GET /api/workflows/run/:id, POST /api/workflows/run/:id/step
14. Zod validation + error handling, P95 <500ms target

### Phase F (Day 13): Integration tests
15. E2E: Feature Implementation, Bug Fix, Sprint Planning
16. Checkpoint recovery: pause → resume after context reset

### Phase G (Day 14): Documentation + minimal UI
17. Update .agent/system/api-catalog.md (4 endpoints)
18. Update .agent/system/mcp-tools-guide.md (7 tools)
19. Create .agent/system/workflow-templates.md summary
20. Add minimal /workflows page to monitor templates and active runs

## Success Criteria (Step 4.5 Verification)
- [ ] 12 workflow templates seeded in DB
- [ ] MCP tools operational (list/start/executeStep/getStatus/pause/resume/complete)
- [ ] API endpoints return correct payloads; P95 <500ms
- [ ] Workflow state machine enforces ordering and failure semantics
- [ ] Checkpoint pause/resume integrates sprint.checkpoint.create
- [ ] 3 E2E workflows pass + checkpoint recovery passes
- [ ] TypeScript errors: 0; ESLint: 0 warnings

## Evidence to Capture (Verification Gate)
- Files exist (schema, routes, tools)
- pnpm type-check, pnpm lint outputs
- curl for endpoints (200 OK + response bodies)
- DB counts: templates, runs, steps
- Test results summary (unit + integration)

## Risks & Mitigations
- Workflow variability → JSONB; declarative validation to avoid schema churn
- Long-running steps → explicit pause/resume; checkpointing
- Token budget → template-driven execution; small payloads and select patterns

## Checkpoints (Step 4)
- 15K: Schema + migration ready
- 30K: Templates seeded; tool stubs in place
- 45K: API endpoints implemented
- 60K: Integration tests passing locally
- 75K: Mac mini verification complete
- 90K: Documentation + evidence recorded
