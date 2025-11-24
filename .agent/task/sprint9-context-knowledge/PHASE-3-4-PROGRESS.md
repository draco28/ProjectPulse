# Sprint 9 Phase 3+4 Implementation Progress

**Date**: 2025-11-24  
**Token Usage**: ~149K / 200K  
**Status**: IN PROGRESS

---

## Completed

### Phase 3.1 - Knowledge Service Layer (PARTIAL)

✅ **apps/web/lib/knowledge/search.ts** - Project scoping added
- ✅ `SemanticSearchOptions` interface: added `projectId: number` (required)
- ✅ `semanticSearch()`: added projectId validation and filtering (`WHERE "projectId" = ${projectId} AND "archivedAt" IS NULL`)
- ✅ `fullTextSearch()`: added projectId validation and filtering
- ✅ `hybridSearch()`: added projectId validation (delegates to semantic+fulltext which now filter)

✅ **apps/web/lib/knowledge/graph.ts** - Project scoping added (PARTIAL)
- ✅ `GraphTraversalOptions` interface: added `projectId: number` (required)
- ✅ `findRelatedKnowledgeItems()`: added projectId validation
- ⚠️ **TODO**: Add projectId filtering to SQL queries (lines 119-189+)
  - Need to verify source item belongs to projectId
  - Need to add `AND ki."projectId" = ${projectId}` to JOIN clauses

---

## Remaining Work

### Phase 3.1 - Knowledge Service Layer (FINISH)

**apps/web/lib/knowledge/graph.ts** - Complete projectId filtering
- [ ] Update source item check (line 119) to verify projectId ownership
- [ ] Update 1-hop SQL query (line 140-177) to filter by projectId on JOIN
- [ ] Update 2-hop SQL query (if exists) to filter by projectId

**apps/web/lib/knowledge/create.ts** - Verify projectId requirement
- [ ] Check if `createKnowledgeItem()` already requires projectId
- [ ] If not, add projectId parameter and validation

### Phase 3.2 - Knowledge API Routes (Project Scoping)

**All routes need to:**
1. Extract `projectId` from query params or request body (required parameter)
2. Pass `projectId` to service functions
3. Add validation/error handling for missing projectId

**Files to update:**
- [ ] `apps/web/app/api/knowledge/search/route.ts`
  - Extract `projectId` from query
  - Pass to `semanticSearch/fullTextSearch/hybridSearch`
- [ ] `apps/web/app/api/knowledge/route.ts` (GET + POST)
  - GET: Filter by `projectId`
  - POST: Pass `projectId` to `createKnowledgeItem()`
- [ ] `apps/web/app/api/knowledge/export/route.ts`
  - Filter export by `projectId`
- [ ] `apps/web/app/api/knowledge/import/route.ts`
  - Associate imported items with `projectId`
- [ ] `apps/web/app/api/knowledge/[id]/archive/route.ts`
  - Verify item belongs to `projectId` before archiving
- [ ] `apps/web/app/api/knowledge/metrics/route.ts`
  - Filter metrics by `projectId`

### Phase 3.3 - Create Knowledge MCP Proxy Tools

**Create 7 MCP tools in `apps/mcp-server/src/tools/knowledge/`:**

Each tool:
- Requires `projectId: number` in input schema
- Makes HTTP call to corresponding API route
- Passes `projectId` as query param or body
- Follows existing MCP tool patterns (error handling, validation)

**Tools to create:**
- [ ] `searchTool.ts` → `GET /api/knowledge/search?projectId=X&query=...`
- [ ] `createTool.ts` → `POST /api/knowledge` (body includes projectId)
- [ ] `relatedTool.ts` → Create `/api/knowledge/related` route if needed, or call graph service
- [ ] `exportTool.ts` → `GET /api/knowledge/export?projectId=X`
- [ ] `importTool.ts` → `POST /api/knowledge/import` (body includes projectId)
- [ ] `archiveTool.ts` → `PATCH /api/knowledge/[id]/archive` (verify projectId)
- [ ] `metricsTool.ts` → `GET /api/knowledge/metrics?projectId=X`

**Register tools:**
- [ ] Update `apps/mcp-server/src/tools/index.ts`
  - Import all 7 Knowledge tools
  - Add to `loadTools()` array

### Phase 4 - Knowledge Base UI Alignment

**Review current UI:**
- [ ] Read `apps/web/app/knowledge/page.tsx`
- [ ] Read `apps/web/components/knowledge/*.tsx`
- [ ] Identify "Add Knowledge" buttons or edit affordances

**Minimal updates:**
- [ ] Add inline help text: "Knowledge items are created and managed by AI agents"
- [ ] If "Add Knowledge" exists: Remove or make MCP-compatible
- [ ] Ensure search UI passes `projectId` (extract from session/auth context)
- [ ] Verify search mode toggles match MCP tool modes

### Phase 5 - Build & Documentation

- [ ] Run `pnpm type-check` (fix any errors)
- [ ] Run `pnpm lint` (fix any errors)
- [ ] Build MCP server: `cd apps/mcp-server && pnpm build`
- [ ] Update `SPRINT9-STATUS.md` with Phase 3+4 completion
- [ ] Update `SPRINT9-TESTING-AND-VALIDATION.md` with implementation notes
- [ ] Commit Phase 3+4 implementation

---

## Risks & Notes

### Breaking Changes
- All existing Knowledge API calls now require `projectId`
- UI components must extract `projectId` from session/auth context
- Any tests calling Knowledge APIs will need to pass `projectId`

### Data Isolation
- CRITICAL: Every Knowledge query must filter by `projectId`
- Graph traversal must not leak data across projects
- Archive/export operations must verify ownership

### Token Budget
- Current: ~149K / 200K used
- Remaining work estimate: ~30-40K tokens
- Risk: May need to continue in new session if approaching limit

---

## Next Steps

**Option A: Continue Now**
- Finish graph.ts SQL updates (~5K tokens)
- Update 6 API routes (~10K tokens)
- Create 7 MCP tools (~15K tokens)
- Review/update UI (~5K tokens)
- Total: ~35K tokens → Would reach ~184K

**Option B: Commit Partial Progress, Continue in New Session**
- Commit service layer updates (search.ts + partial graph.ts)
- Document remaining work
- Continue in fresh session with full token budget

**Recommendation**: Given token usage, Option B (commit partial, continue fresh) is safer for complex work like MCP tool creation.
