# Active Context

**Last Updated**: 2025-11-14
**Current Focus**: Sprint 7 Planning (Tasks & Sessions MVP)
**Recent Completion**: Sprint 6 - Skills System (✅ COMPLETE) + Documentation Refactoring (✅ COMPLETE)

---

## Current State

### What Just Completed

**Sprint 6: Skills System + Knowledge Graph** ✅ 100% COMPLETE (51/51 points)

**Delivered**:
- Skills lazy-loading system (92% token reduction: frontmatter ~70 tokens, full content ~250 tokens)
- LRU cache with 5-minute TTL and automatic cleanup
- Knowledge metrics, export, import, deduplication, archival
- 15 MCP tools total (7 knowledge + 8 skills)
- Multi-tenancy support (projectId scoping)
- Duplicate detection (semantic similarity >0.95 for knowledge, slug collision for skills)

**Documentation Refactoring** ✅ 100% COMPLETE (Nov 13-14)

**Delivered**:
- Eliminated 101 doc-coding references across 18 documents (6 phases)
- Clarified cloud SaaS vision (database as single source of truth)
- Separated internal tooling (`.agent/`) from product features
- Aligned all documentation with database-first architecture
- Updated: PRD, SRS, Architecture, Data Model, OpenAPI, Testing, Infrastructure, Observability, Security, MCP docs

**Key Insight**: `.agent/` folder is OUR internal dogfooding tool, NOT an end-user product feature. End users get clean repositories with everything in ProjectPulse database.

### What's Next (Sprint 7)

**Status**: Sprint 6 complete, documentation refactored, memory banks updated, ready for Sprint 7

**Sprint 7: Tasks & Sessions MVP** (21 points)
- Task/Session entities with checkpoint recovery
- Real-time progress tracking
- Context snapshots for session resumption
- MCP tools: task.create, session.start, session.checkpoint
- UI: Tasks view integrated into Development Cycle page

---

## Recent Changes & Commits

### Documentation Refactoring (Nov 13-14) ✅ COMMITTED

**Commits**:
- `6204966` - Merge feature/sprint-7-wiki-health: Complete documentation refactoring
- `4d568c9` - docs: Complete documentation refactoring - 100% doc-coding artifacts eliminated
- `00298bc` - docs: refactor mcp-tools-guide for cloud SaaS vision (Phase 6b)
- `4e79fd7` - docs: refactor MIGRATION_GUIDE for cloud SaaS vision (Phase 6a)
- `7ca33ff` - refactor: Align Security & Compliance spec with cloud SaaS vision (Phase 5b)

**Files Modified** (18 documents):
- PRD, SRS, Architecture, Data Model, OpenAPI
- Testing & QA, Infrastructure, Observability, Security & Compliance
- MCP docs (Architecture, Quick Start, API Reference, Tools Guide)
- Project Plan, Backlog, README

**Memory Banks Updated** (Nov 14):
- `.agent/project-brief.md` - Version 2.0.0 (Cloud SaaS Vision)
- `.agent/system-patterns.md` - Added architecture principles
- `.agent/tech-context.md` - Current sprint status (Sprint 7 next)
- `.agent/active-context.md` - This file (Sprint 6 complete, Sprint 7 next)

---

## Remaining Tasks

### Sprint 7 Planning (CURRENT)
- [x] Documentation refactoring complete ✅
- [x] Memory banks updated ✅
- [ ] Review Sprint 7 requirements (docs/13-Project-Plan.md)
- [ ] Read Sprint 7 user stories (docs/12-Backlog.md)
- [ ] Design Task/Session entities with checkpoint recovery
- [ ] Create Sprint 7 implementation plan
- [ ] Get user approval
- [ ] Begin Sprint 7 implementation

---

## Current Work Focus

**Status**: Sprint 7 planning (Tasks & Sessions MVP)
**Next**: Design database schema for Task/Session entities
**Blockers**: None - All previous sprints complete, documentation aligned

---

## Key Decisions Made

### Documentation Refactoring (Nov 13-14)

1. **Cloud SaaS Vision**: Database as single source of truth (no local files for end users) ✅
2. **Internal vs Product**: `.agent/` folder is OUR dogfooding tool, NOT product feature ✅
3. **Repository Cleanliness**: End users get pristine repos (no markdown, no tracking files) ✅
4. **Architecture Alignment**: All 18 docs now consistent with database-first approach ✅

### Sprint 1-6 Technical Decisions (Reference)

1. **MCP Transport**: HTTP JSON-RPC (not stdio) - network service architecture ✅
2. **Session Storage**: In-memory Map for MVP (migrate to Redis for production)
3. **Skills Cache**: LRU with 5-minute TTL, 100 max entries ✅
4. **Knowledge Search**: Hybrid (0.7 semantic + 0.3 fulltext) with 2-hop graph ✅
5. **Embeddings**: Ollama nomic-embed-text (768d) with OpenAI fallback ✅

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
- ✅ Tool specifications: Created (Sprint 5)
- ✅ MCP server: Built and functional (Sprint 5.5)
- ✅ End user access: Enabled via HTTP transport
- ⏳ End-to-end testing: Planned (requires Mac mini Claude Code setup)

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

1. **Sprint 5.5 Success**: MCP server gap from Sprint 1 is now closed. End users can access ProjectPulse via AI agents using HTTP transport. 2,008 lines of production code, 1,431 lines of documentation.

2. **Performance Excellence**: All targets exceeded - session validation (1-2ms), tool invocation (20-35ms), resource read (8-15ms). Fast enough for real-time agent interactions.

3. **Documentation Strategy**: Created complete docs (MCP_QUICK_START.md, MCP_ARCHITECTURE.md, MCP_API_REFERENCE.md) before end-to-end testing. This enables self-service setup for end users.

4. **Quality Gates**: TypeScript 0 errors ✅, all tools curl-validated ✅. Build failure due to missing DATABASE_URL (environmental, not code quality).

5. **Next Steps**: Sprint 5.5 complete (21/21 points). Ready for Sprint 6 (Issue Management Backend). MCP server enables agent-first use case.

---

**This file contains what's actively being worked on RIGHT NOW. Update after every significant change.**

Last reviewed: 2025-11-13
Next review: Sprint 6 implementation start
