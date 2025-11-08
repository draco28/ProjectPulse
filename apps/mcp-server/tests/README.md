# MCP Server Testing

This directory contains automated tests for the ProjectPulse MCP server.

## Smoke Test

**Purpose**: Verify MCP server protocol compliance and basic functionality.

### Files

- **`smoke-test.js`** - Automated Node.js test that verifies:
  - MCP server starts successfully
  - JSON-RPC initialize handshake works
  - Tool registration works
  - Tool invocation protocol works
  - (Optional) Full integration with Next.js API

- **`smoke-test.sh`** - Manual testing guide using MCP Inspector

### Running the Smoke Test

**Quick Test (Protocol Level)**:
```bash
cd apps/mcp-server
npm run build
node tests/smoke-test.js
```

**Expected Output** (without Next.js running):
```
✅ SMOKE TEST PASSED (Protocol Level)
   - MCP server starts successfully
   - JSON-RPC initialize handshake works
   - Tool registration works
   - Tool invocation works (returned error because API not available)
```

**Full Integration Test** (with Next.js running):
```bash
# Terminal 1: Start Next.js
cd apps/web
npm run dev

# Terminal 2: Run smoke test
cd apps/mcp-server
node tests/smoke-test.js
```

**Expected Output** (with Next.js running):
```
✅ SMOKE TEST PASSED (Full Integration)
   - MCP server operational
   - Next.js API integration verified
   - Health check returns valid JSON
```

### Using MCP Inspector (Manual Testing)

**Start the MCP Inspector UI**:
```bash
cd apps/mcp-server
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web UI at **http://localhost:6274** where you can:

1. View registered tools (should see `projectpulse.health_check`)
2. Manually invoke tools
3. Inspect JSON-RPC messages
4. View server logs

**Security Note**: MCP Inspector binds to localhost only by default. CVE-2025-49596 addresses RCE vulnerability - ensure you're using the latest version.

## Test Results Archive

**Latest Smoke Test** (2025-11-07):
- ✅ Protocol compliance verified
- ✅ JSON-RPC communication working
- ✅ Tool registration successful
- ✅ Error handling working (fetch failed when API not available)

**Key Findings**:
- Server logs correctly go to stderr (not stdout)
- JSON-RPC responses correctly go to stdout
- Tool invocation returns proper error response when API unavailable
- Protocol handshake follows MCP 2024-11-05 specification

## Next Steps

Future tests to add:
- Unit tests for individual tool implementations
- Integration tests with mock Next.js API
- Performance tests (tool invocation latency)
- Error handling tests (malformed requests, invalid arguments)

See [Day 6-7 Tool Plan](.agent/task/day-6-7-tool-plan.md) for upcoming tool implementations.
