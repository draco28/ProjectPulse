# Sprint 8: MCP HTTP Transport Implementation Plan

**Created**: 2025-11-12
**Sprint**: Sprint 8 - Integration & Polish (Week 15-16)
**Epic**: EPIC-009 - Production Infrastructure & Deployment
**Story**: US-126 (8 points) + US-127 (3 points) + US-128 (2 points) = 13 points total

---

## Decision Summary

**Question**: When should we implement Streamable HTTP transport for MCP server?
**Answer**: Sprint 8 - Integration & Polish (Week 15-16)
**Rationale**: Makes ProjectPulse "truly cloud-ready" at MVP launch

---

## Why Sprint 8?

### ✅ Perfect Timing
- All 18 MCP tools implemented by Sprint 7
- Sprint 8 focus: Integration testing + production readiness
- HTTP transport is infrastructure enhancement, not feature work
- Natural fit with other deployment concerns (monitoring, security, scaling)

### ✅ Industry Alignment
- **73% of companies** prefer cloud-based MCP deployments (2025 survey)
- **SSE deprecated** March 2025 → Streamable HTTP is current standard
- Products like ref.tools and Notion AI use cloud MCP servers
- Competitive positioning requires cloud-native deployment

### ✅ User Experience
- **Zero local installation** required for end users
- Just configure: `url` + `apiKey` in AI agent settings
- No "install MCP locally" friction in onboarding
- Professional cloud service experience

---

## Current Architecture (Sprint 1-7)

```
User's Machine:
  ┌──────────────┐
  │ AI Agent     │
  │ (Claude Code)│
  └──────┬───────┘
         │
         ↓ stdio (local process)
  ┌──────────────┐
  │ MCP Server   │
  │ (local npm)  │
  └──────┬───────┘
         │
         ↓ HTTP requests
      Cloud API
  ┌──────────────────────┐
  │ Next.js (port 3000)  │
  │ PostgreSQL (port 5432)│
  └──────────────────────┘
```

**Issues**:
- ❌ Users must install MCP server locally (`npm install projectpulse-mcp`)
- ❌ Not truly "cloud-native"
- ❌ Deployment friction for non-technical users

---

## Target Architecture (After Sprint 8)

```
User's AI Agent
  ┌──────────────┐
  │ Claude Code  │
  │ or Cursor    │
  └──────┬───────┘
         │
         ↓ HTTPS (Streamable HTTP transport)
         │ Authorization: Bearer <api_key>
         │
    ProjectPulse Cloud
  ┌──────────────────────────────┐
  │ MCP Server (port 3001)       │
  │   ↓                          │
  │ Next.js API (port 3000)      │
  │   ↓                          │
  │ PostgreSQL (port 5432)       │
  └──────────────────────────────┘
```

**Benefits**:
- ✅ Zero local installation required
- ✅ True cloud-native SaaS experience
- ✅ Horizontal scaling ready (stateless design)
- ✅ Professional enterprise deployment

---

## Implementation Plan (Sprint 8)

### User Stories Added

| Story ID | Description | Points | Priority | Dependencies |
|----------|-------------|--------|----------|--------------|
| **US-126** | Implement Streamable HTTP transport for MCP server | 8 | Should (P1) | All MCP tools (Sprint 1-7) |
| **US-127** | API key generation and management system | 3 | Should (P1) | US-126 |
| **US-128** | Health monitoring and observability | 2 | Could (P2) | US-126 |

**Total**: 13 points out of 48-point Sprint 8 capacity (~27% of sprint)

### Technical Components

**1. Streamable HTTP Server** (`index-http.ts` - 8 hours)
- Express.js server on port 3001
- POST endpoint at `/mcp` for bidirectional messaging
- Connection resumption with `resumptionToken`
- Health check endpoint at `/mcp/health`

**2. Authentication System** (3 hours)
- API key validation middleware
- Rate limiting (100 req/min per key)
- Bcrypt hashing for stored keys
- Request logging with user context

**3. Docker Configuration** (1 hour)
- Update `docker-compose.cloud.yml`
- Expose port 3001
- Configure healthcheck (30s interval)
- Environment variables: `MCP_PORT`, `NODE_ENV=production`

**4. Documentation** (1 hour)
- User guide: "Connecting AI Agents to ProjectPulse"
- MCP client configuration examples
- API key generation instructions
- Security best practices

### Acceptance Criteria

**Performance**:
- [ ] MCP tool execution P95 ≤1s (parity with stdio)
- [ ] Support 100+ concurrent agent connections
- [ ] Health endpoint responds <100ms

**Security**:
- [ ] API key authentication working (401 for missing, 403 for invalid)
- [ ] Rate limiting enforced (429 after 100 req/min)
- [ ] HTTPS required in production (TLS 1.3+)

**Functionality**:
- [ ] All 18 MCP tools work via HTTP transport
- [ ] Connection resumption after network drop
- [ ] Stateless design (session state in database, not memory)

**Documentation**:
- [ ] User configuration guide complete
- [ ] Example MCP client JSON provided
- [ ] API key generation documented

---

## MCP Specification (March 2025)

### Streamable HTTP Transport

**Specification Version**: 2025-03-26 (current)
**Previous**: SSE transport deprecated March 2025

**Key Features**:
- **Single endpoint**: POST to `/mcp` for bidirectional messaging
- **Connection resumption**: `resumptionToken` for reconnection
- **OAuth 2.1 ready**: Token-based authentication with PKCE
- **Stateless**: Horizontal scaling support
- **Industry standard**: Replacing SSE across all MCP implementations

**Benefits over stdio**:
- Network-accessible (not just local process)
- Multiple concurrent clients supported
- Survives network interruptions
- Production-grade security model

---

## User Configuration (After Sprint 8)

End users will configure their AI agents like this:

```json
{
  "mcpServers": {
    "projectpulse": {
      "url": "https://api.projectpulse.com/mcp",
      "headers": {
        "Authorization": "Bearer pp_abc123xyz..."
      },
      "transport": "streamablehttp"
    }
  }
}
```

**Steps**:
1. Sign up at projectpulse.com
2. Generate API key in dashboard (or CLI)
3. Copy configuration JSON
4. Paste into AI agent settings (e.g., `~/.config/claude-code/mcp.json`)
5. Start using ProjectPulse via AI agent!

**No local installation needed!** 🎉

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Streamable HTTP SDK complexity** | Medium | High | 1-hour spike to study SDK examples before implementation |
| **Performance degradation vs stdio** | Low | Medium | Benchmark early; optimize if P95 >1s |
| **API key security** | Low | High | Bcrypt hashing; rotation documentation |
| **Scaling issues (100+ connections)** | Medium | Medium | Stateless design from start; DB for session state |
| **Sprint 8 capacity overflow** | Low | Medium | Only 13/48 points; can defer US-128 if needed |

---

## Success Metrics

**Adoption**:
- ≥80% of users prefer HTTP transport within 1 month of launch
- <5 minutes average onboarding time (sign up → first tool call)

**Performance**:
- MCP tool execution P95 ≤1s (parity with stdio)
- 99.9% uptime for MCP endpoint

**Security**:
- Zero API key compromises in first 3 months
- <1% rate limit violations

---

## Out of Scope (Post-MVP)

- **OAuth 2.1 with PKCE**: Defer unless time permits (API keys sufficient for MVP)
- **WebSocket transport**: Streamable HTTP is sufficient
- **Multi-tenancy**: Defer to post-MVP
- **MCP Inspector hosted UI**: Users use local Inspector

---

## Timeline

**Sprint 8 Schedule** (Week 15-16):

| Day | Activity | Hours |
|-----|----------|-------|
| **Day 1-2** | Integration testing (other Sprint 8 work) | - |
| **Day 3** | US-126: Implement HTTP transport (8 hours) | 8 |
| **Day 4** | US-127: API key system (3 hours) | 3 |
| **Day 5** | Documentation + testing (1 hour) | 1 |
| **Day 6-10** | Bug fixes + remaining Sprint 8 work | - |

**Total Sprint 8**: 48 points, ~60 hours capacity
**HTTP Transport**: 13 points, ~12 hours effort (20% of sprint)

---

## Dependencies Check

**Prerequisites** (all complete by Sprint 7):
- ✅ All 18 MCP tools implemented (Sprint 1-7)
- ✅ Next.js API fully operational
- ✅ PostgreSQL database configured
- ✅ Docker Compose setup working

**Blocks**: None - independent infrastructure enhancement

---

## Deliverables

**Code**:
1. `apps/mcp-server/src/index-http.ts` - HTTP transport server
2. `apps/mcp-server/src/middleware/auth.ts` - API key validation
3. Prisma schema update: `ApiKey` model
4. Docker Compose configuration update
5. Health check endpoint implementation

**Documentation**:
1. User guide: "Connecting AI Agents to ProjectPulse"
2. API key management documentation
3. MCP client configuration examples
4. Updated `.agent/system/mcp-tools-guide.md`

**Tests**:
1. HTTP transport integration tests
2. API key validation tests
3. Rate limiting tests
4. Load test (50 concurrent connections)

---

## Post-Sprint 8 Status

**MVP Completion**:
- ✅ All features complete (Sprint 1-7)
- ✅ Integration tested (Sprint 8)
- ✅ Production infrastructure ready (Sprint 8)
- ✅ **Cloud-native deployment** (Sprint 8 - HTTP transport)

**Production Deployment Readiness**:
```
✅ Next.js API → Ready
✅ PostgreSQL → Ready
✅ MCP Server (HTTP) → Ready (Sprint 8)
✅ Authentication → Ready (API keys, Sprint 8)
✅ Monitoring → Ready (health checks, Sprint 8)
✅ Documentation → Ready (user guides, Sprint 8)
```

**Launch Checklist**:
- [ ] Deploy to cloud platform (Vercel/Railway/AWS)
- [ ] Configure DNS (api.projectpulse.com)
- [ ] Set up TLS certificates (Let's Encrypt)
- [ ] Enable monitoring/alerting
- [ ] Launch marketing site
- [ ] Publish user documentation

---

**Status**: ✅ Committed to feature/sprint-4-issue-management branch
**Next Review**: Sprint 8 planning (Week 15)

---

## References

- **User Story**: [docs/user-stories/US-XXX-mcp-http-transport.md](../../docs/user-stories/US-XXX-mcp-http-transport.md)
- **Epic**: EPIC-009 in [docs/12-Backlog.md](../../docs/12-Backlog.md)
- **Implementation**: [apps/mcp-server/src/index-http.ts](../../apps/mcp-server/src/index-http.ts)
- **MCP Spec**: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
- **Industry Research**: 73% prefer cloud MCP deployments (2025 survey)
