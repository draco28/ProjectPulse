# Sprint 5.5: MCP Server Infrastructure - Implementation Plan

**Reference**: `apps/web/.agent/task/sprint-5.5-mcp-server-plan.md` (35KB, 1,177 lines - COMPREHENSIVE PLAN EXISTS!)
**Created**: 2025-11-12 22:40
**Sprint**: 5.5 (Critical Gap Resolution)
**Story Points**: 21 points
**Duration**: 3-5 days
**Status**: APPROVED

---

## Executive Summary

**Problem**: Sprint 1 MCP server infrastructure never built (96% completion, missing 2 points). This blocks the 90% use case - end users' AI coding agents (Claude Code, Cursor AI, Codex) cannot connect to ProjectPulse.

**Solution**: Build HTTP transport MCP server using @modelcontextprotocol/sdk with Next.js 14 App Router integration.

**Target Users**: Developers using AI coding agents to manage their development projects via ProjectPulse.

---

## 5-Day Implementation Plan

### Day 1: Foundation + HTTP Transport (6 tasks)
1. Install @modelcontextprotocol/sdk dependency
2. Create lib/mcp/server.ts (MCP server singleton with capabilities)
3. Create lib/mcp/types.ts (TypeScript type definitions)
4. Create app/api/mcp/route.ts (POST/GET HTTP handlers)
5. Implement session management (Mcp-Session-Id header handling)
6. Write unit tests for server initialization

**Exit Criteria**: POST /api/mcp returns 200 for initialize, session ID generated and returned

### Day 2: Knowledge Tools Integration (4 tasks)
7. Create lib/mcp/handlers/knowledge-handler.ts
8. Register knowledge.search, knowledge.create, knowledge.related tools with MCP server
9. Connect handlers to backend APIs (argument mapping + response formatting)
10. Test knowledge tools with curl (all 3 tools returning expected results)

**Exit Criteria**: All 3 knowledge tools invoke backend APIs correctly and return formatted responses

### Day 3: Resources + Additional Tools (3 tasks)
11. Create lib/mcp/resources/knowledge-resource.ts
12. Implement resources/list and resources/read handlers (URI format: knowledge://item/{id})
13. Integrate additional tools (issues, workflows if tool specs exist)

**Exit Criteria**: Resources accessible via MCP, additional tools registered (if applicable)

### Day 4: Integration Testing with Claude Code (3 tasks)
14. Create claude_code_config.json example configuration
15. Test integration with Claude Code (tool discovery, knowledge.search, knowledge.create)
16. Validate error handling and edge cases (invalid requests, backend failures)

**Exit Criteria**: All tools functional from Claude Code, errors handled gracefully

### Day 5: Documentation + Quality Gates (3 tasks)
17. Create docs/MCP_SETUP_GUIDE.md (end user setup with config examples)
18. Update API documentation (MCP_ARCHITECTURE.md, MCP_API_REFERENCE.md)
19. Run quality gates (TypeScript 0 errors, all tests passing, build succeeds)

**Exit Criteria**: Documentation complete and tested, all quality gates pass

### Protocol Step 5: Post-Completion (2 tasks)
20. Update memory banks (.agent/active-context.md, .agent/progress.md) and docs/13-Project-Plan.md
21. Commit Sprint 5.5 code and documentation (docs first, then code)

---

## Success Criteria

- [ ] Claude Code can connect via MCP config (http://192.168.1.15:3000/api/mcp)
- [ ] All knowledge tools functional (search, create, related)
- [ ] Resources provide useful context to agents (knowledge items accessible)
- [ ] Integration tests passing with Claude Code (E2E workflows)
- [ ] Setup documentation complete for coding agents (tested and validated)
- [ ] TypeScript: 0 errors (strict mode)
- [ ] Performance: Tool calls <200ms (target)

---

## Architecture

```
Developer's Claude Code (or Cursor AI, Codex)
    ↓ claude_code_config.json
    ↓ HTTP Transport (Streamable HTTP 2025-03-26 spec)
ProjectPulse MCP Server (192.168.1.15:3000/api/mcp)
    ↓ Tool Registry (loads from lib/mcp-tools/)
    ↓ Tool Handlers (lib/mcp/handlers/)
    ↓ Resource System (lib/mcp/resources/)
Backend APIs (POST /api/knowledge, GET /api/knowledge/search, etc.)
    ↓
PostgreSQL + pgvector (knowledge_items with 768d embeddings)
```

---

## Files to Create

**Code (Core)**:
- `lib/mcp/server.ts` - MCP server singleton instance
- `lib/mcp/types.ts` - TypeScript type definitions
- `app/api/mcp/route.ts` - HTTP route handler (POST/GET)
- `lib/mcp/handlers/knowledge-handler.ts` - Knowledge tool handlers
- `lib/mcp/resources/knowledge-resource.ts` - Knowledge resource handlers

**Documentation**:
- `docs/MCP_SETUP_GUIDE.md` - End user setup guide
- `docs/MCP_ARCHITECTURE.md` - Developer architecture docs
- `docs/MCP_API_REFERENCE.md` - Tool and resource reference

**Config Examples**:
- `claude_code_config.json` - Example configuration for users

---

## Technical Decisions (from comprehensive plan)

1. **Transport**: HTTP (Streamable HTTP 2025-03-26 spec) - not stdio because it's a network service
2. **Integration**: Add MCP routes to existing Next.js app (not standalone server)
3. **Auth**: None for local network (OAuth 2.1 for cloud deployment later)
4. **Protocol**: Streamable HTTP for cost-efficiency and network compatibility
5. **Target**: Claude Code (MVP), Cursor AI and Codex (future)
6. **SDK**: @modelcontextprotocol/sdk (official MCP SDK)

---

## Key Risks & Mitigations (from comprehensive plan)

**Risk 1**: HTTP transport implementation complexity
- **Mitigation**: Streamable HTTP spec well-documented, follow examples

**Risk 2**: Claude Code integration issues
- **Mitigation**: Test early (Day 4), iterate based on feedback

**Risk 3**: Tool handler argument mapping errors
- **Mitigation**: Use existing tool specs (lib/mcp-tools/knowledge-tools.ts), validate with Zod

---

## Dependencies

**What We Have** (from Sprint 5):
- ✅ Backend APIs (POST /api/knowledge, GET /api/knowledge/search)
- ✅ MCP tool specifications (lib/mcp-tools/knowledge-tools.ts)
- ✅ Database with 768d embeddings (knowledge_items table)
- ✅ Hybrid search (semantic + full-text + graph traversal)

**What We Need**:
- ❌ @modelcontextprotocol/sdk package
- ❌ MCP server infrastructure
- ❌ HTTP transport layer
- ❌ Tool invocation handlers

---

## Testing Strategy

**Unit Tests**:
- Server initialization (mcpServer instance created)
- Session management (ID generation, validation)
- Tool handlers (argument mapping, response formatting)

**Integration Tests**:
- HTTP endpoint (POST /api/mcp returns 200 for initialize)
- Tool invocation (all 3 knowledge tools work end-to-end)
- Resource access (resources/list and resources/read)

**E2E Tests with Claude Code**:
- Tool discovery (Claude lists 3 knowledge tools)
- knowledge.search from Claude Code
- knowledge.create from Claude Code
- Resource access from Claude Code

---

## Expert Consultations (Protocol Step 3)

**Required**:
- `next-js-expert` - HTTP route architecture for app/api/mcp/route.ts

**Optional** (if time permits):
- `react-expert` - Not applicable (backend-focused sprint)
- `prisma-expert` - Not needed (database already complete from Sprint 5)

---

**For detailed specifications, technical details, and code examples, see**:
`apps/web/.agent/task/sprint-5.5-mcp-server-plan.md` (35KB, 1,177 lines)

**User Stories**: US-5.5-01 to US-5.5-06 (5 points each, defined in comprehensive plan)

---

**Next Steps**: Consult next-js-expert (Protocol Step 3), then begin Day 1 implementation

Last updated: 2025-11-12 22:40 IST
