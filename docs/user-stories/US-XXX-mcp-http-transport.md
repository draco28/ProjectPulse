# User Story: MCP HTTP Transport Implementation

**Story ID**: US-XXX (to be assigned in Sprint 8)
**Epic**: EPIC-008 (Integration & Deployment)
**Sprint**: Sprint 8 - Integration & Polish (Week 15-16)
**Story Points**: 8 points (~10 hours)
**Priority**: Should Have (P1) - Required for cloud deployment

---

## Story

**As a** ProjectPulse user (developer with AI agent)
**I want** my AI agent to connect to ProjectPulse via HTTPS (no local installation)
**So that** I can use ProjectPulse as a cloud service without installing MCP locally

---

## Acceptance Criteria

### Technical Requirements

1. **Streamable HTTP Transport**
   - [ ] Implement Streamable HTTP server using `@modelcontextprotocol/sdk/server/streamablehttp.js`
   - [ ] Single POST endpoint at `/mcp` for bidirectional messaging
   - [ ] Replace stdio transport for production deployment
   - [ ] Maintain backward compatibility with stdio for development

2. **Authentication**
   - [ ] API key authentication via `Authorization: Bearer <token>` header
   - [ ] Validate API keys against User table or dedicated ApiKey table
   - [ ] Return 401 for missing keys, 403 for invalid keys
   - [ ] Rate limiting per API key (100 req/min initially)

3. **Connection Management**
   - [ ] Support `resumptionToken` for reconnection after network drops
   - [ ] Stateless design (horizontal scaling ready)
   - [ ] Session state stored in database, not memory
   - [ ] Health check endpoint at `/mcp/health`

4. **Deployment Configuration**
   - [ ] Update docker-compose.cloud.yml with HTTP transport
   - [ ] Expose port 3001 for MCP server
   - [ ] Environment variables: `MCP_PORT`, `MCP_BASE_URL`
   - [ ] Healthcheck configured with 30s interval

5. **Documentation**
   - [ ] User guide: How to configure AI agent with ProjectPulse HTTP endpoint
   - [ ] API key generation UI (or CLI command)
   - [ ] Example MCP client configuration JSON
   - [ ] Security best practices documentation

### Non-Functional Requirements

- **Performance**: MCP tool execution P95 <1s (same as stdio)
- **Security**: HTTPS required for production (TLS 1.3+)
- **Scalability**: Support 100+ concurrent agent connections
- **Monitoring**: Log all MCP requests with request ID and user ID

---

## Tasks

### Development (8 hours)

1. **Implement HTTP Transport** (3 hours)
   - [ ] Create `apps/mcp-server/src/index-http.ts`
   - [ ] Add `express` and `@types/express` dependencies
   - [ ] Implement `/mcp` POST endpoint with StreamableHTTPServerTransport
   - [ ] Add `/health` endpoint for monitoring
   - [ ] Test with MCP client (Inspector or custom script)

2. **Authentication System** (2 hours)
   - [ ] Create ApiKey Prisma model (or extend User model)
   - [ ] Implement API key validation middleware
   - [ ] Add rate limiting with `express-rate-limit`
   - [ ] Add request logging with user context

3. **Docker Configuration** (1 hour)
   - [ ] Update docker-compose.cloud.yml with HTTP command
   - [ ] Expose port 3001
   - [ ] Configure healthcheck
   - [ ] Test container startup and health endpoint

4. **Documentation** (1 hour)
   - [ ] Write user guide: "Connecting AI Agents to ProjectPulse"
   - [ ] Example MCP configuration for Claude Code
   - [ ] API key generation instructions
   - [ ] Update .agent/system/mcp-tools-guide.md with HTTP info

5. **Testing** (1 hour)
   - [ ] Manual test with MCP Inspector
   - [ ] Automated test: HTTP endpoint returns valid MCP responses
   - [ ] Load test: 50 concurrent connections
   - [ ] Security test: Invalid API key rejected

---

## Technical Design

### Architecture

```
AI Agent (Claude Code/Cursor)
         ↓
   HTTPS (TLS 1.3)
         ↓
   POST https://api.projectpulse.com/mcp
         ↓
   MCP Server (Streamable HTTP, port 3001)
         ↓
   Next.js API (port 3000)
         ↓
   PostgreSQL Database
```

### API Key Schema

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  key         String   @unique // bcrypt hashed
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String   // "Claude Code - MacBook Pro"
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  expiresAt   DateTime?

  @@index([userId])
  @@index([key])
}
```

### MCP Client Configuration (User Side)

```json
{
  "mcpServers": {
    "projectpulse": {
      "url": "https://api.projectpulse.com/mcp",
      "headers": {
        "Authorization": "Bearer pp_abc123..."
      },
      "transport": "streamablehttp"
    }
  }
}
```

---

## Dependencies

### Prerequisites (Must be complete)
- All 18 MCP tools implemented (Sprint 1-7)
- Next.js API fully operational
- User authentication system (if not already built)

### Blocks
- None (independent infrastructure enhancement)

### Related Stories
- US-XXX: User API key management UI (optional, can use CLI)
- US-XXX: MCP request analytics dashboard (optional)

---

## Testing Strategy

### Unit Tests
- [ ] API key validation logic
- [ ] Rate limiter configuration
- [ ] Health endpoint response

### Integration Tests
- [ ] Full MCP tool invocation via HTTP
- [ ] Connection resumption with `resumptionToken`
- [ ] Concurrent connection handling (10+ agents)

### Load Tests
- [ ] 50 concurrent agents, each invoking 10 tools
- [ ] Target: P95 <1s per tool execution

### Security Tests
- [ ] Missing API key → 401
- [ ] Invalid API key → 403
- [ ] Rate limit exceeded → 429
- [ ] HTTPS enforcement (reject HTTP in production)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Streamable HTTP SDK complexity** | Medium | High | Allocate 1-hour spike to study SDK examples before implementation |
| **Performance degradation vs stdio** | Low | Medium | Benchmark HTTP vs stdio early; optimize if P95 >1s |
| **API key leakage** | Low | High | Use bcrypt hashing; document rotation best practices |
| **Scaling issues (100+ connections)** | Medium | Medium | Design stateless from start; session state in DB not memory |

---

## Success Metrics

- **Performance**: MCP tool execution P95 ≤1s (parity with stdio)
- **Adoption**: ≥80% of users use HTTP transport within 1 month of launch
- **Reliability**: 99.9% uptime for MCP endpoint
- **Security**: Zero API key compromises in first 3 months

---

## Out of Scope

- OAuth 2.1 with PKCE (defer to post-MVP unless time permits)
- WebSocket transport (Streamable HTTP is sufficient)
- MCP Inspector hosted UI (users use local Inspector)
- Multi-tenancy (defer to post-MVP)

---

## Notes

- **Specification**: MCP specification version 2025-03-26 (SSE deprecated, Streamable HTTP is current standard)
- **Industry Alignment**: 73% of companies prefer cloud MCP deployments (per 2025 survey)
- **Backward Compatibility**: Keep stdio transport for local development (`pnpm --filter mcp-server dev`)

---

**Created**: 2025-11-12
**Author**: Project Management
**Reviewed**: Pending
**Status**: Draft (to be added to Sprint 8 backlog)
