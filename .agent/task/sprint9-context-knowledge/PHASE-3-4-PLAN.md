# Sprint 9 Phase 3+4 Implementation Plan

**Date**: 2025-11-24  
**Objective**: Implement Knowledge MCP Integration + UI Alignment in one go

---

## Phase 3: Knowledge MCP Integration

### 3.1 Update Knowledge Service Layer (Project Scoping)

**Files to modify:**
- `apps/web/lib/knowledge/search.ts`
  - Add `projectId` parameter to `semanticSearch()`, `fullTextSearch()`, `hybridSearch()`
  - Add `WHERE projectId = ?` to all SQL queries
- `apps/web/lib/knowledge/graph.ts`
  - Add `projectId` parameter to `findRelatedKnowledgeItems()`
  - Filter by projectId in graph traversal
- `apps/web/lib/knowledge/create.ts`
  - Ensure `createKnowledgeItem()` requires `projectId`
  - Add to validation schema if missing

**Exit criteria:**
- All service functions accept and use `projectId`
- No cross-project data leakage possible

### 3.2 Update Knowledge API Routes (Project Scoping)

**Files to modify:**
- `apps/web/app/api/knowledge/search/route.ts`
  - Extract `projectId` from query params (required)
  - Pass to search functions
- `apps/web/app/api/knowledge/route.ts` (GET + POST)
  - GET: Extract `projectId` from query, filter by it
  - POST: Extract `projectId` from body, pass to `createKnowledgeItem()`
- `apps/web/app/api/knowledge/export/route.ts`
  - Filter export by `projectId`
- `apps/web/app/api/knowledge/import/route.ts`
  - Associate imported items with `projectId`
- `apps/web/app/api/knowledge/[id]/archive/route.ts`
  - Verify `projectId` ownership before archiving
- `apps/web/app/api/knowledge/metrics/route.ts`
  - Filter metrics by `projectId`

**Exit criteria:**
- All routes validate `projectId` input
- All Prisma queries include `where: { projectId }`

### 3.3 Create Knowledge MCP Proxy Tools

**Files to create:**
- `apps/mcp-server/src/tools/knowledge/searchTool.ts`
- `apps/mcp-server/src/tools/knowledge/createTool.ts`
- `apps/mcp-server/src/tools/knowledge/relatedTool.ts`
- `apps/mcp-server/src/tools/knowledge/exportTool.ts`
- `apps/mcp-server/src/tools/knowledge/importTool.ts`
- `apps/mcp-server/src/tools/knowledge/archiveTool.ts`
- `apps/mcp-server/src/tools/knowledge/metricsTool.ts`

**Tool specifications:**
- Each tool schema includes `projectId: number` (required)
- Tools call HTTP `GET/POST` to corresponding `/api/knowledge/*` routes
- Error handling mirrors existing MCP tool patterns
- Input validation via Zod schemas

**Files to modify:**
- `apps/mcp-server/src/tools/index.ts` - Register all 7 tools

**Exit criteria:**
- All 7 Knowledge MCP tools created
- Tools registered and discoverable
- MCP server builds successfully

---

## Phase 4: Knowledge Base UI Alignment

### 4.1 Review Current UI

**Files to inspect:**
- `apps/web/app/knowledge/page.tsx` - Main Knowledge page
- `apps/web/components/knowledge/` - All components

**Questions:**
- Is there an "Add Knowledge" button?
- Are there edit affordances?
- Does UI copy explain agent-managed behavior?

### 4.2 Minimal UI Updates

**Likely changes:**
- Add inline help text: "Knowledge items are created and managed by AI agents"
- If "Add Knowledge" exists: Either remove it or make it call MCP-compatible flow
- Ensure search mode toggles match MCP tool modes (hybrid/semantic/fulltext)
- Add `projectId` filtering to UI queries (use from session/auth context)

**Files to modify (TBD based on review):**
- `apps/web/app/knowledge/page.tsx`
- `apps/web/components/knowledge/SearchBar.tsx` (if exists)
- `apps/web/components/knowledge/ArticleCard.tsx` (if exists)

**Exit criteria:**
- UI accurately represents agent-only write semantics
- No misleading edit CTAs
- Search modes align with MCP capabilities

---

## Implementation Order

1. ✅ Phase 3.1 - Update service layer (project scoping)
2. ✅ Phase 3.2 - Update API routes (project scoping)
3. ✅ Phase 3.3 - Create MCP tools + register
4. ✅ Phase 4 - Review + update UI
5. ✅ Build + verify TypeScript
6. ✅ Update Sprint 9 status docs
7. ✅ Commit Phase 3+4 implementation

---

## Token Budget Estimate

- Service layer updates: ~5K tokens
- API route updates: ~8K tokens
- MCP tool creation: ~12K tokens (7 tools × ~1.7K each)
- UI review + updates: ~3K tokens
- Documentation: ~2K tokens

**Total estimate**: ~30K tokens

---

## Risk Mitigation

- **Breaking changes**: Existing Knowledge APIs will require `projectId`, which could break current UI usage
  - Mitigation: Extract `projectId` from session/auth context in UI components
- **Data leakage**: Must ensure ALL queries filter by `projectId`
  - Mitigation: Review every Prisma query in Knowledge files
- **MCP tool registration**: Could conflict with existing tool names
  - Mitigation: Use `knowledge.*` prefix as specified

---

## Testing (Phase 5)

Deferred to Phase 5 per user request. Will test:
- Project scoping (no cross-project data leakage)
- MCP tool end-to-end (call tool → API → DB)
- UI behavior (correct projectId filtering)
- Performance (P95 < 200ms, <1.5K tokens/query)
