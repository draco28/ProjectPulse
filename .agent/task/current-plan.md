# Sprint 4 Implementation Plan — Issues Backend Integration (US-051..US-066, 42 points)

Session: $(date '+%Y-%m-%d %H:%M %Z')
Scope: Connect existing Issues UI to database via API + MCP tools; add bulk + auto-tagging + context injection

## Objectives
- API Routes: Issue CRUD, Bulk create, Status update, Comments, Filtered list/search
- Auto-tagging: Config-driven module/label mapping from file paths
- Context Injection: LinkedFile (file:line) + optional code snippets via Attachment
- MCP Tools (agents): issue.create, issue.bulkCreate, issue.update, issue.search, issue.addComment, issue.setStatus, issue.linkTask
- Validation & Security: Zod schemas, parameterized Prisma, no raw string SQL
- Performance: Bulk create 15 issues in <2s (P95)
- Quality Gates: 0 TS errors; lint clean; tests ≥80% for new code

## Architecture Decisions
- Server Components first; use API routes for client interactions
- Endpoints under app/api/issues with RESTful structure:
  - POST/GET /api/issues
  - GET/PATCH/DELETE /api/issues/[id]
  - POST /api/issues/bulk
  - POST /api/issues/[id]/comments (exists)
  - PATCH /api/issues/[id]/status (exists)
- Zod validation schemas shared via a types module (no `any`)
- Auto-tagging rules stored in Setting (category: "issues.rules") to satisfy R-DATA-001
- Prisma createMany for bulk; wrap operations in transaction for integrity
- Filters: status, priority, module, assignee, date range; indexed columns already present

## Phased Implementation

### Phase A: Scaffolding & Validation
1. Define Zod schemas: IssueCreate, IssueUpdate, IssueBulkCreate, IssueFilters, CommentCreate, StatusUpdate
2. Add shared types in apps/web/lib/types/issues.ts
3. Seed default auto-tagging rules in Setting (category: "issues.rules")

### Phase B: CRUD Endpoints
4. Implement POST /api/issues (create)
5. Implement GET /api/issues (filtered list + pagination)
6. Implement GET /api/issues/[id] (detail with relations)
7. Implement PATCH /api/issues/[id] (update) with whitelist fields
8. Implement DELETE /api/issues/[id]

### Phase C: Bulk + Auto-Tagging
9. Implement POST /api/issues/bulk (createMany + transactional labels/links)
10. Implement autoTagging util (path→module/labels) reading from Setting
11. Add basic accuracy unit tests with sample paths (≥80% target on sample set)

### Phase D: MCP Tools
12. Implement MCP tool handlers calling the API (no direct DB)
13. Register tools; add handler-level tests (mock HTTP client)

### Phase E: Tests + Verification
14. API tests (unit/integration) for endpoints and validation
15. Performance test: 15-issue bulk latency <2s (local)
16. Type-check, lint, build; update api-catalog.md and mcp-tools-guide.md

## Success Criteria (Step 4.5 Verification)
- [ ] Endpoints return correct payloads; Zod validation enforced
- [ ] Bulk create latency <2s for 15 issues (measured)
- [ ] Auto-tagging rules achieve ≥80% accuracy on sample inputs
- [ ] MCP tools functional and call API only (R-MCP-001)
- [ ] Tests ≥80% for new backend code; TS 0 errors; lint clean

## Evidence to Capture
- File existence and key snippets (ls/head)
- pnpm type-check, pnpm lint outputs
- curl/API test outputs
- Timing results for bulk operation (local measurement)
- Test results summary

## Risks & Mitigations
- Bulk performance → use createMany + minimal includes; prefetch labels; transaction
- Tagging accuracy → config-driven rules in Setting; allow easy updates
- Validation drift → centralize Zod schemas; reuse across endpoints/tools

## Checkpoints (Step 4)
- 15K: Plan approved; schemas and scaffolds in place
- 30K: CRUD endpoints implemented
- 45K: Bulk + auto-tagging implemented
- 60K: MCP tools implemented; tests passing
- 75K: Performance verified; docs updated
- 90K: Verification Gate evidence captured
