# ProjectPulse MCP Server - Documentation Guide

**Last Updated**: 2025-11-20 (Sprint 8.7)  
**Status**: ✅ Production Ready  
**Server**: `http://192.168.1.15:3001/mcp`  
**Protocol**: MCP 2024-11-05  
**Transport**: HTTP (stateless streaming)  
**Tools**: 40 tools across 8 categories

---

## Quick Start

### 1. Server Status Check

```bash
curl http://192.168.1.15:3001/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "transport": "http",
  "toolCount": 40,
  "endpoint": "/mcp"
}
```

---

### 2. Choose Your Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[MCP_QUICK_START_v2.md](./MCP_QUICK_START_v2.md)** | Complete setup guide | First-time setup for any client |
| **[MCP_ARCHITECTURE.md](./MCP_ARCHITECTURE.md)** | Technical architecture (v2.0.0) | Understanding server internals |
| **[features/mcp-tools-guide.md](./features/mcp-tools-guide.md)** | Complete tool catalog | Finding specific tools and usage |
| **[features/mcp-multi-agent-setup.md](./features/mcp-multi-agent-setup.md)** | Multi-agent configuration | Configuring multiple clients |
| **[SPRINT_8.7_COMPLETION_SUMMARY.md](./SPRINT_8.7_COMPLETION_SUMMARY.md)** | Sprint 8.7 changes | Understanding recent architecture changes |

---

### 3. Configuration by Client

#### Factory Droid

**Config File**: `~/.factory/mcp.json`

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "disabled": false
    }
  }
}
```

**Status**: ✅ Validated (2025-11-20)

---

#### Claude Code

**Method**: CLI Command

```bash
claude mcp add --transport http projectpulse http://192.168.1.15:3001/mcp
```

**Verification**:
```bash
claude mcp list | grep projectpulse
```

**Status**: ✅ Validated (2025-11-20)

---

#### Windsurf / Cascade

**Config File**: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["-e", "
        const http = require('http');
        const data = JSON.stringify(process.stdin.read());
        const req = http.request({
          hostname: '192.168.1.15',
          port: 3001,
          path: '/mcp',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        }, (res) => {
          res.pipe(process.stdout);
        });
        req.write(data);
        req.end();
      "]
    }
  }
}
```

**Status**: ⚪ Not yet tested

---

## Available Tools (40 Total)

### By Category

- **Onboarding** (10 tools): Session management, questions, document generation, bootstrap
- **Wiki** (5 tools): Create, search, update, generate from code, analytics
- **Issues** (6 tools): Create, bulk create, update, search, add comments, set status
- **Workflows** (7 tools): List templates, start, execute steps, get status, pause, resume, complete
- **Roadmap** (2 tools): Materialize project plan, get phase progress
- **Sprint Management** (8 tools): Phase/task/session creation, checkpoint, current task, progress updates, queries, current position
- **Blueprint** (1 tool): Get onboarding blueprint data
- **Health** (1 tool): Health check with backend status

**See**: [features/mcp-tools-guide.md](./features/mcp-tools-guide.md) for complete tool reference with usage examples.

---

## Architecture Summary

### Sprint 8.7 Transformation

**Before Sprint 8.7**:
- 3 endpoints (SSE, HTTP, JSON-RPC shim)
- 302 lines of complex routing
- Hybrid transport architecture
- Session management bugs
- Empty HTTP response issues
- HTTP 406 errors with major clients

**After Sprint 8.7**:
- 1 endpoint (POST /mcp)
- 175 lines of clean code
- Stateless HTTP streaming only
- No session management needed
- All responses working correctly
- HTTP 406 fixed with rawHeaders middleware

**Key Changes**:
- ✅ Removed SSE transport completely
- ✅ Removed JSON-RPC shim endpoint
- ✅ Fixed HTTP 406 with Accept header middleware
- ✅ 42% code reduction
- ✅ 100% reliability
- ✅ Validated with Factory Droid, Claude Code, curl

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Tool invocation | <100ms | 25-75ms ✅ |
| Tools/list query | <50ms | ~40ms ✅ |
| Health check | <20ms | ~10ms ✅ |
| Success rate | 100% | 100% ✅ |
| HTTP 406 errors | 0 | 0 ✅ |

---

## Troubleshooting

### Connection Refused

**Symptom**: `curl: (7) Failed to connect`

**Check**:
```bash
curl http://192.168.1.15:3001/health
```

**Fix**: Ensure MCP server is running on Mac mini

---

### HTTP 406 Not Acceptable

**Status**: ✅ **FIXED** in Sprint 8.7 Phase 4

**What Was Wrong**: Clients (Claude Code, Factory Droid) weren't sending required `Accept: application/json, text/event-stream` header

**How It's Fixed**: Server middleware automatically adds missing header transparently

**Action Required**: None - fixed automatically by server

---

### Tool Not Found

**Symptom**: `{"error":{"code":-32601,"message":"Unknown tool"}}`

**Check Available Tools**:
```bash
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Verify**: Tool name matches exactly (case-sensitive, with prefix `projectpulse_`)

---

### Backend API Errors (404, 500)

**Symptom**: Tool returns API error (not MCP protocol error)

**Explanation**: MCP protocol is working, but backend Next.js API may not be running

**Check Backend**:
```bash
curl http://192.168.1.15:3000/api/health
```

**Expected**: `{"status":"healthy","database":"connected"}`

**Fix**: Start Next.js backend if needed for full functionality

---

## What's Different from Old Setup?

If you're migrating from Sprint 8.5/8.6 documentation:

| Aspect | Old (Sprint 8.5-8.6) | New (Sprint 8.7) |
|--------|---------------------|------------------|
| **Server URL** | `http://192.168.1.15:3000/api/mcp` | `http://192.168.1.15:3001/mcp` |
| **Port** | 3000 (Next.js) | 3001 (Standalone) |
| **Transport** | SSE + HTTP hybrid | HTTP only |
| **Endpoint** | Multiple (SSE, HTTP, JSON-RPC) | Single (POST /mcp) |
| **Session Management** | Manual tracking | None (stateless) |
| **Tool Count** | ~21-35 tools | 40 tools |
| **HTTP 406 Issue** | ❌ Blocking clients | ✅ Fixed automatically |

**Action Required**: Update your client configuration to use port 3001 and `/mcp` endpoint.

---

## Validated Clients

| Client | Status | Config | Tested Date |
|--------|--------|--------|-------------|
| **Factory Droid** | ✅ Working | `~/.factory/mcp.json` | 2025-11-20 |
| **Claude Code** | ✅ Working | CLI command | 2025-11-20 |
| **curl** | ✅ Working | Direct HTTP | 2025-11-20 |
| **Windsurf** | ⚪ Not tested | MCP config | - |
| **Cascade** | ⚪ Not tested | MCP config | - |

---

## References

### Core Documentation
- **Setup Guide**: [MCP_QUICK_START_v2.md](./MCP_QUICK_START_v2.md)
- **Architecture**: [MCP_ARCHITECTURE.md](./MCP_ARCHITECTURE.md) (v2.0.0)
- **Tools Catalog**: [features/mcp-tools-guide.md](./features/mcp-tools-guide.md)
- **Multi-Agent Setup**: [features/mcp-multi-agent-setup.md](./features/mcp-multi-agent-setup.md)

### Sprint Documentation
- **Sprint 8.7 Summary**: [SPRINT_8.7_COMPLETION_SUMMARY.md](./SPRINT_8.7_COMPLETION_SUMMARY.md)
- **Archived Docs**: [archive/mcp-deprecated/README.md](./archive/mcp-deprecated/README.md)

### External Resources
- **MCP Specification**: https://modelcontextprotocol.io/
- **MCP SDK**: https://github.com/modelcontextprotocol/sdk

---

## Support

**Issues**: Create issue in project repository  
**Questions**: Reference this documentation first  
**Updates**: Check Sprint completion summaries for changes

---

**Document Status**: ✅ Entry point for all MCP documentation  
**Last Validated**: 2025-11-20 with Factory Droid and Claude Code  
**Next Review**: Sprint 9
