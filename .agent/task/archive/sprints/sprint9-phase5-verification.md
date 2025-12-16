# Sprint 9 Phase 5: Testing & Validation Evidence

**Date:** 2025-11-24 to 2025-11-25
**Status:** ✅ COMPLETE

## 1. MCP Server Health Verification ✅

```bash
curl http://192.168.1.15:3000/api/health
# Response: {"status":"healthy","database":"connected","seed":{"ready":true}}
```

## 2. Knowledge Items Created via MCP ✅

Created 9 knowledge items for Project 3 (IDs 2-10):

| ID | Title | Category | Embedding |
|----|-------|----------|-----------|
| 2 | Next.js App Router Data Fetching Patterns | pattern | Ollama 211ms |
| 3 | React Server Components vs Client Components | architecture | Ollama 96ms |
| 4 | Prisma Query Optimization Techniques | pattern | Ollama 70ms |
| 5 | Docker Container Debugging Guide | troubleshooting | Ollama 90ms |
| 6 | Next.js API Route Handler Patterns | pattern | Ollama 474ms |
| 7 | Database Schema Design for Multi-Tenancy | architecture | Ollama 103ms |
| 8 | Playwright E2E Testing Patterns | implementation | Ollama 95ms |
| 9 | TypeScript Utility Types for React | implementation | Ollama 89ms |
| 10 | Git Workflow Best Practices | workflow | Ollama 80ms |

## 3. MCP Knowledge Tools E2E Test Results

| Tool | Status | Notes |
|------|--------|-------|
| `knowledge_create` | ✅ PASS | 9 items created with Ollama embeddings (70-474ms) |
| `knowledge_search` | ⚠️ PARTIAL | Semantic search works; fulltext had empty tsvector (FIXED) |
| `knowledge_metrics` | ✅ PASS | Returns query stats correctly |
| `knowledge_export` | ✅ PASS | Exports all items (multi-tenancy bug FIXED) |
| `knowledge_archive` | ✅ PASS | Archive/unarchive both work correctly |
| `knowledge_related` | ✅ FIXED | Column name mismatch fixed (fromId/toId) |
| `knowledge_import` | ✅ FIXED | Parameter mismatch fixed (items→frontmatter) |

## 4. Multi-Tenancy Validation ✅

### Before Fix (Critical Bug)
- Export Project 1: Returned ALL 9 items from Project 3 (DATA LEAK!)

### After Fix
- Export Project 1: 0 items ✅
- Export Project 3: 9 items ✅
- Search Project 1: 0 results ✅
- Search Project 3: 9 results ✅

## 5. Bugs Found and Fixed

### Bug 1: Export Multi-Tenancy Violation (CRITICAL)
- **File:** `apps/web/app/api/knowledge/export/route.ts`
- **Issue:** No projectId filter - exposed all items across projects
- **Fix:** Added mandatory projectId validation and WHERE clause

### Bug 2: Graph Traversal Column Names
- **File:** `apps/web/lib/knowledge/graph.ts`
- **Issue:** SQL used snake_case (`to_knowledge_id`) instead of Prisma camelCase (`toId`)
- **Fix:** Updated all SQL to use correct column names: `fromId`, `toId`, `relationType`, `weight`

### Bug 3: Import Parameter Mismatch
- **File:** `apps/mcp-server/src/tools/knowledge/importTool.ts`
- **Issue:** MCP sent `items` array, API expected `files` with frontmatter
- **Fix:** MCP tool now converts items to markdown+YAML frontmatter format

### Bug 4: Empty Fulltext Tsvector
- **File:** `apps/web/lib/knowledge/create.ts`
- **Issue:** Inserted `to_tsvector('english', '')` - empty search index
- **Fix:** Now populates with weighted title (A) + content (B) for proper fulltext search

### Bug 5: Deduplication Missing ProjectId
- **File:** `apps/web/lib/knowledge/deduplication.ts`
- **Issue:** Interface lacked projectId, queries not scoped
- **Fix:** Added projectId to interface and all queries

## 6. Performance Metrics

From `knowledge_metrics` tool:
- Total queries (7 days): 4
- Average latency: 73ms
- P95 semantic search: 135ms
- P95 fulltext search: 71ms

## 7. Pre-existing Issues (Not Fixed This Session)

- `apps/web/lib/wiki/system-templates.ts:265` - Unnecessary escape character (lint error)
- Multiple TypeScript strict mode issues in onboarding routes (possibly undefined)
- Conditional spread type errors in export route

## 8. Files Modified

### Web App
- `apps/web/app/api/knowledge/export/route.ts` - Added projectId filter
- `apps/web/app/api/knowledge/import/route.ts` - Added projectId support
- `apps/web/lib/knowledge/graph.ts` - Fixed column names
- `apps/web/lib/knowledge/create.ts` - Fixed tsvector population
- `apps/web/lib/knowledge/deduplication.ts` - Added projectId scoping
- `apps/web/middleware.ts` - Added MCP API paths to bypass auth

### MCP Server
- `apps/mcp-server/src/tools/knowledge/importTool.ts` - Format conversion

## 9. Bug Fix: Knowledge Card Navigation Hydration Mismatch

**Issue**: Clicking knowledge cards redirected to dashboard. Console showed:
```
Warning: Prop `href` did not match. Server: "/knowledge/10?project=3" Client: "/knowledge/10"
```

**Root Cause**: `ArticleCard` component wrapped in `React.memo` received `projectId` as prop from Server Component. During hydration, memo caused client to use stale/different prop values.

**Fix Applied**:
1. **Removed React.memo** - Avoided hydration issues with URL-derived state
2. **Added useSearchParams()** - Read project from URL directly (consistent with TagFilter/SearchBar pattern)
3. **Removed projectId prop** - Single source of truth from URL
4. **Added Suspense boundary** - Required for useSearchParams hook

**Files Modified**:
- `apps/web/components/knowledge/ArticleCard.tsx` - useSearchParams, removed memo
- `apps/web/app/knowledge/page.tsx` - Suspense boundary, removed prop

## 10. Completion Status

- [x] Run type check (pre-existing errors only, changes compile clean)
- [x] Deploy to Docker (live via volume mount)
- [x] MCP tools re-verified in production (2025-11-25)
  - knowledge_search: ✅ Semantic search working (Docker guide, score 0.837)
  - knowledge_export: ✅ Multi-tenancy verified (9 items Project 3 only)
  - knowledge_related: ✅ Graph traversal API working (27ms response)
- [x] Update progress.md and active-context.md
- [x] Commit all changes with proper message

**Phase 5 Status**: ✅ COMPLETE (2025-11-25)
