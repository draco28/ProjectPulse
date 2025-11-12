# Active Context

**Last Updated**: 2025-11-12
**Current Focus**: Sprint 5.5 - MCP Server Infrastructure (PLANNED)
**Recent Completion**: Sprint 5 - Knowledge Graph Foundation (✅ COMPLETE)

---

## Current State

### What Just Completed (Sprint 5)

**Sprint 5: Knowledge Graph Foundation** ✅ 100% COMPLETE (21/21 points)

**Delivered**:
- Hybrid search system (semantic + full-text + graph traversal)
- nomic-embed-text 768d embeddings with Ollama/OpenAI fallback
- Production-grade APIs: POST /api/knowledge, GET /api/knowledge/search
- 2-hop graph traversal with relationship discovery
- MCP tool specifications (knowledge.search, knowledge.create, knowledge.related)

**Performance**:
- Search latency: 45-122ms (target: <200ms) ✅
- Embedding generation: 77-836ms (target: <2s) ✅
- All quality gates passed (TypeScript 0 errors, tests passing)

**Files Created**: 11 new files (embeddings, search, graph, MCP tools)
**Database**: 15 seeded knowledge items with 768d embeddings

### Critical Discovery

**Sprint 1 Gap Identified**: MCP server infrastructure was never built (Sprint 1 closed at 96%, missing 2 points). This **blocks the 90% use case** - AI agents cannot access ProjectPulse without MCP server.

**Impact**:
- ✅ We have: Backend APIs, database, MCP tool specifications
- ❌ We're missing: MCP server to expose tools to agents
- 🚫 Blocking: End users' AI agents cannot connect via MCP config

### What's Next (Sprint 5.5)

**Sprint 5.5: MCP Server Infrastructure** ⏳ PLANNED (21 points estimated)

**Goal**: Build HTTP transport MCP server so end users' AI agents can connect to ProjectPulse

**Scope**:
1. HTTP MCP server at `http://192.168.1.15:3000/api/mcp`
2. Tool registry that loads from lib/mcp-tools/
3. Tool invocation handlers (connect to backend APIs)
4. Resource system for context injection
5. Integration testing with Claude Desktop
6. End user documentation (setup guide)

**Architecture**:
- HTTP transport (Streamable HTTP 2025-03-26 spec)
- No auth for local network (OAuth 2.1 for cloud later)
- Integrates into existing Next.js 14 App Router
- End users add to their claude_desktop_config.json

**Plan Location**: `.agent/task/sprint-5.5-mcp-server-plan.md` (35KB, 1,177 lines)

---

## Recent Changes & Commits

### Sprint 5 Changes (NOT YET COMMITTED)

**New Files** (11):
1. `lib/embeddings/ollama.ts` - Ollama embedding client
2. `lib/embeddings/openai.ts` - OpenAI fallback
3. `lib/embeddings/index.ts` - Unified service
4. `lib/validations/knowledge.ts` - Zod schemas
5. `lib/knowledge/create.ts` - Creation service
6. `lib/knowledge/search.ts` - Search services
7. `lib/knowledge/graph.ts` - Graph traversal
8. `app/api/knowledge/route.ts` - Knowledge API
9. `app/api/knowledge/search/route.ts` - Search API
10. `lib/mcp-tools/knowledge-tools.ts` - MCP tool specs
11. `prisma/seed-knowledge.ts` - Knowledge seeding

**Modified Files** (3):
1. `prisma/schema.prisma` - vector(768) update
2. `prisma/seed.ts` - Deprecated old knowledge code
3. `lib/embeddings/test-unified.ts` - Updated tests

**Database Changes**:
- Altered knowledge_items.embedding to vector(768)
- Recreated HNSW index
- Seeded 15 items with 768d embeddings

**Documentation**:
- `.agent/task/sprint-5-completion-summary.md` - Complete Sprint 5 summary
- `.agent/task/sprint-5.5-mcp-server-plan.md` - Sprint 5.5 implementation plan
- `.agent/progress.md` - Updated with Sprint 5 completion
- `.agent/active-context.md` - Updated (this file)

---

## Remaining Tasks

### Immediate (Step 5 Completion)
- [x] Update .agent/progress.md ✅
- [x] Update .agent/active-context.md ✅ (this file)
- [ ] Update docs/13-Project-Plan.md
- [ ] Commit Sprint 5 code
- [ ] Commit Sprint 5 documentation

### Next Sprint (Sprint 5.5)
- [ ] Review Sprint 5.5 plan
- [ ] Begin MCP server implementation
- [ ] Day 1: Foundation + HTTP transport
- [ ] Day 2: HTTP transport + knowledge tools
- [ ] Day 3: Knowledge tools + resources
- [ ] Day 4: Integration testing with Claude Desktop
- [ ] Day 5: Documentation

---

## Current Work Focus

**Status**: Completing Sprint 5 Step 5 (commit and document)
**Next**: Begin Sprint 5.5 MCP Server Infrastructure
**Blockers**: None - all prerequisites complete

---

## Key Decisions Made

### Sprint 5 Decisions

1. **Embedding Model**: Switched from all-minilm (384d) to nomic-embed-text (768d) for better semantic understanding
2. **Search Weights**: 0.7 semantic + 0.3 fulltext provides good balance in practice
3. **Docker Networking**: Use `host.docker.internal` for Ollama access from Docker containers
4. **Graph Strength Decay**: 2-hop connections get 0.8x strength multiplier

### Sprint 5.5 Decisions (from plan)

1. **Transport**: HTTP (not stdio) because it's a network service
2. **Integration**: Add MCP routes to existing Next.js app (not standalone server)
3. **Auth**: None for local network (OAuth 2.1 for cloud deployment later)
4. **Protocol**: Streamable HTTP (2025-03-26 spec) for cost-efficiency

---

## Technical Context

### Stack
- Next.js 14 App Router
- PostgreSQL with pgvector
- Prisma ORM
- TypeScript (strict mode)
- Ollama (nomic-embed-text 768d)
- OpenAI (text-embedding-3-large fallback)

### Deployment
- Mac mini local network: 192.168.1.15:3000
- Future: Cloud (Railway/Vercel) with OAuth 2.1

### MCP Status
- ✅ Tool specifications: Created
- ❌ MCP server: Not built (Sprint 5.5 planned)
- ❌ End user access: Blocked until Sprint 5.5

---

## Architecture Clarifications

### Vision Alignment (Confirmed 2025-11-12)

**Primary Use Case (90%)**: AI agents accessing via MCP
- End users' Claude/GPT agents connect to ProjectPulse via MCP config
- Agents perform CRUD operations (search knowledge, create issues, track tasks)
- **The agent IS the interface**, not a helper

**Secondary Use Case (10%)**: Human admin via web UI
- Web UI for setup, bulk operations, manual management
- Fallback when agents can't help

**Architecture**:
```
End User's Claude Desktop
    ↓ MCP Config (claude_desktop_config.json)
    ↓ HTTP Transport
ProjectPulse MCP Server (192.168.1.15:3000/api/mcp)
    ↓
Backend APIs (Knowledge, Issues, Tasks)
    ↓
PostgreSQL Database
```

---

## Notes & Observations

1. **MCP Server Gap Critical**: Without Sprint 5.5, the 90% use case (AI agents) is completely blocked. This should have been caught earlier - Sprint 1 was 96% complete but missed the core MCP server.

2. **Sprint 5 Success**: Despite the MCP server gap, Sprint 5 delivered excellent backend infrastructure. All APIs work, search is fast, embeddings are high-quality.

3. **Architecture Alignment**: Now confirmed that ProjectPulse is MCP-first (90% agents, 10% humans). Sprint 5.5 plan reflects this with HTTP transport for network access.

4. **Performance Targets**: All Sprint 5 targets met or exceeded. Search is fast (<200ms), embeddings are acceptable (<2s), quality gates passed.

5. **Next Session Priority**: Sprint 5.5 must be completed before Sprint 6. The MCP server is the foundation that enables all future agent interactions.

---

**This file contains what's actively being worked on RIGHT NOW. Update after every significant change.**

Last reviewed: 2025-11-12
Next review: Sprint 5.5 implementation start
