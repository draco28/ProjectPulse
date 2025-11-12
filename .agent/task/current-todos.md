# TODO — Sprint 4: Issues Backend Integration

Session: $(date '+%Y-%m-%d %H:%M %Z')
Progress: 0/18 tasks complete (0%)

## Phase A: Scaffolding & Validation (3)
1. [x] Create Zod schemas (create/update/bulk/filters/comment/status)
2. [x] Add shared types (apps/web/lib/types/issues.ts)
3. [x] Seed default auto-tagging rules in Setting

## Phase B: CRUD Endpoints (5)
4. [x] POST /api/issues (create)
5. [x] GET /api/issues (filters + pagination)
6. [x] GET /api/issues/[id] (detail)
7. [x] PATCH /api/issues/[id] (update)
8. [x] DELETE /api/issues/[id]

## Phase C: Bulk + Auto-Tagging (3)
9.  [x] POST /api/issues/bulk (createMany + transaction)
10. [x] Auto-tagging util reading Setting (issues.rules)
11. [x] Accuracy unit tests (sample paths ≥80%)

## Phase D: MCP Tools (4)
12. [x] issue.create
13. [x] issue.bulkCreate
14. [x] issue.update
15. [x] issue.search

## Phase E: Tests + Verification (3)
16. [ ] API tests; type-check; lint; build
17. [ ] Performance test: 15 issues <2s
18. [ ] Docs: api-catalog.md + mcp-tools-guide.md updates
