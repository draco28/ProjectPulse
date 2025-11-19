# ProjectPulse MCP Server

**Version**: 0.1.0
**Transport**: Dual (stdio + HTTP)
**Protocol**: Model Context Protocol (MCP) v2024-11-05

---

## Overview

The ProjectPulse MCP server bridges AI agents (like Claude Code) to the ProjectPulse Next.js API, providing 35+ tools for project management, task tracking, wiki management, and more.

### Architecture

**Dual Transport Design:**
- **stdio transport** (`index.ts`) - For local Claude Code integration (default)
- **HTTP transport** (`index-http.ts`) - For Docker deployment and remote agents

Both entry points share the same MCP Server instance and tool registrations, ensuring 100% feature parity.

---

## Quick Start

### Local Development (stdio)

```bash
# From repository root
cd apps/mcp-server

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run with stdio transport (default)
pnpm start

# Or run with development watch mode
pnpm dev
```

### Docker Deployment (HTTP)

```bash
# From repository root
docker compose -f docker-compose.cloud.yml up -d mcp-server

# Check health
curl http://192.168.1.15:3001/health

# Check logs
docker logs projectpulse-mcp-cloud
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECTPULSE_API_URL` | `http://localhost:3000` | Next.js API base URL |
| `MCP_PORT` | `3001` | HTTP server port (HTTP transport only) |
| `MCP_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `NODE_ENV` | `development` | Node environment |

**Example `.env`:**
```bash
PROJECTPULSE_API_URL=http://nextjs:3000
MCP_PORT=3001
MCP_LOG_LEVEL=info
NODE_ENV=production
```

---

## Transport Modes

### Stdio Transport (index.ts)

**Use Case:** Local development with Claude Code
**Entry Point:** `src/index.ts`
**How it works:**
- Reads JSON-RPC messages from stdin
- Writes responses to stdout
- Exits when stdin closes
- Perfect for local CLI integration

**Start:**
```bash
pnpm start           # Production (node dist/index.js)
pnpm dev             # Development (tsx src/index.ts)
```

**Claude Code Integration:**
Configure in `.claude/config.json`:
```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["/path/to/AI_HUB/apps/mcp-server/dist/index.js"],
      "env": {
        "PROJECTPULSE_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### HTTP Transport (index-http.ts)

**Use Case:** Docker deployment, remote agents, production
**Entry Point:** `src/index-http.ts`
**How it works:**
- Runs Express.js HTTP server on port 3001
- Accepts JSON-RPC POST requests at `/mcp`
- Uses Streamable HTTP transport (MCP SDK v1.20.2)
- Session management with UUIDs
- Health check endpoint at `/health`

**Start:**
```bash
pnpm start:http      # Production (node dist/index-http.js)
pnpm dev:http        # Development (tsx src/index-http.ts)
```

**Endpoints:**

- **GET /health** - Health check
  ```bash
  curl http://localhost:3001/health
  # Response: {"status":"healthy","version":"0.1.0","transport":"streamable-http","toolCount":35}
  ```

- **POST /mcp** - MCP JSON-RPC endpoint
  ```bash
  curl -X POST http://localhost:3001/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}'
  ```

---

## Tools Available

**35+ tools across categories:**

- **Project Management:** Create/update projects, phases, sprints
- **Task Management:** Create/update tasks, track progress
- **Wiki & Knowledge Base:** Create/search wiki pages
- **Onboarding System:** Multi-session onboarding workflows
- **Hierarchy Queries:** Navigate project structure

**List all tools:**
```bash
# Via HTTP (requires initialize first)
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

---

## Testing

### Test Stdio Transport

```bash
cd apps/mcp-server
pnpm build
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}' | pnpm start
```

### Test HTTP Transport Locally

**1. Start server:**
```bash
pnpm start:http
# Should see: ProjectPulse MCP server started (Streamable HTTP) {"port":3001,...}
```

**2. Test health endpoint:**
```bash
curl http://localhost:3001/health
# Expected: {"status":"healthy",...}
```

**3. Test initialize:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'
```

### Test Docker Deployment

**1. Deploy:**
```bash
docker compose -f docker-compose.cloud.yml up -d mcp-server
```

**2. Wait for health:**
```bash
docker ps --filter "name=projectpulse-mcp-cloud"
# Wait for status: Up X minutes (healthy)
```

**3. Test from host:**
```bash
curl http://192.168.1.15:3001/health
```

**4. Check logs:**
```bash
docker logs projectpulse-mcp-cloud | tail -50
# Should see: [mcp-server] [INFO] ProjectPulse MCP server started (Streamable HTTP)
```

---

## Troubleshooting

### Issue: Container Restarts in Loop

**Symptom:** Docker container constantly restarting
**Cause:** stdio transport exits when stdin closes (default Docker behavior)
**Solution:** Ensure Docker uses `dist/index-http.js` (HTTP transport)

```yaml
# docker-compose.cloud.yml
command: sh -c "... && node dist/index-http.js"  # ✓ Correct
command: sh -c "... && node dist/index.js"       # ✗ Wrong (stdio)
```

### Issue: Health Check Fails

**Symptom:** Docker shows `(unhealthy)` status
**Cause:** wget/curl not available in slim image
**Solution:** Use node-based health check

```yaml
healthcheck:
  test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))\""]
```

### Issue: TypeScript Build Fails in Docker

**Symptom:** `tsc: not found` error
**Cause:** `NODE_ENV=production` skips devDependencies (including TypeScript)
**Solution:** Use `--prod=false` flag

```yaml
command: sh -c "pnpm install --prod=false && ... && pnpm build && node dist/index-http.js"
```

### Issue: "Server not initialized" Error

**Symptom:** MCP requests return "Bad Request: Server not initialized"
**Cause:** StreamableHTTPServerTransport is stateless - each request creates new transport
**Solution:** This is expected behavior for HTTP transport. For stateful sessions, consider using WebSocket transport (future enhancement).

### Issue: Missing Dependencies

**Symptom:** `Cannot find module 'express'` or `Cannot find module 'zod'`
**Cause:** Docker volume staleness or incomplete install
**Solution:** Remove volume and rebuild

```bash
docker stop projectpulse-mcp-cloud
docker rm projectpulse-mcp-cloud
docker volume rm ai_hub_mcp_node_modules
docker compose -f docker-compose.cloud.yml up -d mcp-server
```

---

## Architecture Details

### Shared Server Instance

Both transports use the same MCP Server instance:

```typescript
const server = new Server(
  { name: 'projectpulse-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

registerTools(server, { config, logger, httpClient });
```

### HTTP Transport Implementation

```typescript
// Create transport per request
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  onsessioninitialized: async (sessionId) => {
    logger.info('MCP session initialized', { sessionId });
  },
  onsessionclosed: async (sessionId) => {
    logger.info('MCP session closed', { sessionId });
  },
});

// Connect and handle request
await server.connect(transport);
await transport.handleRequest(req, res, req.body);

// Cleanup
await transport.close();
```

### Tool Registration

All tools are registered in `src/tools/index.ts`:

```typescript
const loadTools = (): ToolDefinition[] => [
  // Task management
  getTasksTool,
  createTaskTool,
  updateTaskTool,

  // Wiki
  createWikiPageTool,
  searchWikiTool,

  // Hierarchy
  getHierarchyQueryTool,

  // ... 35+ tools total
];
```

---

## Performance

**Startup Time:**
- Stdio: <1 second (already built)
- HTTP: ~2 seconds (includes Express setup)

**Docker Startup:**
- Cold start: ~90 seconds (pnpm install + build)
- Warm start: ~10 seconds (cached dependencies)

**Memory Usage:**
- Stdio: ~50MB base
- HTTP: ~80MB base (includes Express)

**Request Latency:**
- Health check: <10ms
- Tool invocation: 50-200ms (depends on API)

---

## Development

### Adding New Tools

1. Create tool file in `src/tools/{category}/{toolName}Tool.ts`
2. Implement ToolDefinition interface
3. Register in `src/tools/index.ts`
4. Rebuild: `pnpm build`
5. Test with both transports

### Debugging

**Enable debug logging:**
```bash
MCP_LOG_LEVEL=debug pnpm start:http
```

**Watch mode:**
```bash
pnpm dev:http  # Auto-rebuilds on file changes
```

**Inspect HTTP requests:**
```bash
docker logs -f projectpulse-mcp-cloud | grep -E "(INFO|ERROR)"
```

---

## Security

**Current Status:** No authentication (development only)

**Future Enhancements:**
- OAuth 2.0 client credentials flow
- API key authentication
- Rate limiting
- Request validation

**Placeholder in code:**
```typescript
// TODO: Implement auth middleware
// app.use(authMiddleware);
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run stdio transport in watch mode |
| `pnpm dev:http` | Run HTTP transport in watch mode |
| `pnpm build` | Build TypeScript to dist/ |
| `pnpm start` | Run stdio transport (production) |
| `pnpm start:http` | Run HTTP transport (production) |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript type checking (no emit) |
| `pnpm test` | Run unit tests |

---

## Version History

### v0.1.0 (2025-11-19)
- ✅ Dual transport architecture (stdio + HTTP)
- ✅ 35+ tools registered
- ✅ Docker deployment with health checks
- ✅ Session lifecycle management
- ✅ Comprehensive logging
- ✅ Fixed OpenSSL compatibility (Debian Bullseye)
- ✅ Fixed pnpm store mismatch in Docker

---

## Support

**Documentation:** See `.agent/sops/` for SOPs
**MCP Spec:** https://modelcontextprotocol.io
**MCP SDK:** https://github.com/modelcontextprotocol/typescript-sdk

---

**Built with:**
- MCP SDK v1.20.2
- Express.js v5.1.0
- TypeScript v5.4.2
- Node.js v20 (Bullseye Slim)
