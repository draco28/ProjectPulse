# MCP Server Launch & Testing SOP

**Version**: 1.0  
**Created**: 2025-11-07  
**Purpose**: Standard Operating Procedure for launching, testing, and troubleshooting the ProjectPulse MCP server

---

## Overview

The ProjectPulse MCP server is a Model Context Protocol (MCP) server that bridges Claude Code tools to the Next.js API via stdio transport. This SOP covers setup, testing, and integration with Claude Desktop/Claude Code.

**Key Architecture**:
- **Transport**: stdio (Standard Input/Output)
- **Protocol**: MCP 2024-11-05 specification
- **Communication**: JSON-RPC 2.0 messages
- **Integration**: Next.js API via httpClient

---

## Prerequisites

### System Requirements

- **Node.js**: v20+ (for `node:test` and `node:assert/strict`)
- **npm/pnpm**: npm 10+ or pnpm 8+
- **TypeScript**: 5.4+ (installed as dev dependency)
- **Operating System**: Windows, macOS, or Linux

### Repository Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd AI_HUB
npm install  # or pnpm install

# Verify MCP server workspace
cd apps/mcp-server
ls src/  # Should see: index.ts, config.ts, logger.ts, tools/
```

---

## Building the MCP Server

### Step 1: Build TypeScript

```bash
cd apps/mcp-server
npm run build
```

**What this does**:
- Compiles TypeScript (`src/`) to JavaScript (`dist/`)
- Generates type declarations (`.d.ts` files)
- Creates source maps for debugging

**Expected output**:
```
> @devhub/mcp-server@0.1.0 build
> tsc -p tsconfig.build.json
```

**Verify build**:
```bash
ls dist/
# Should see: index.js, config.js, logger.js, httpClient.js, tools/
```

### Step 2: Verify Build Artifacts

```bash
# Check entry point exists
ls dist/index.js

# Verify it's executable (Unix/Mac)
chmod +x dist/index.js

# Quick syntax check
node -c dist/index.js
```

---

## Running the MCP Server

### Local Testing (Direct Invocation)

**Start server directly**:
```bash
cd apps/mcp-server
node dist/index.js
```

**Expected behavior**:
- Server writes logs to **stderr** (not stdout)
- Server listens for JSON-RPC messages on **stdin**
- Server sends JSON-RPC responses to **stdout**

**Sample logs (stderr)**:
```
[mcp-server] [INFO] Tools registered {"count":1}
[mcp-server] [INFO] Starting ProjectPulse MCP server {"apiBaseUrl":"http://localhost:3000"}
[mcp-server] [INFO] ProjectPulse MCP server ready (stdio transport)
```

**To test manually**:
```bash
# In one terminal, start the server
node dist/index.js

# In another terminal (or same), send JSON-RPC initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
```

### Automated Smoke Test

**Run the automated test**:
```bash
cd apps/mcp-server
node tests/smoke-test.js
```

**Expected output** (without Next.js):
```
✅ SMOKE TEST PASSED (Protocol Level)
   - MCP server starts successfully
   - JSON-RPC initialize handshake works
   - Tool registration works
   - Tool invocation works (returned error because API not available)
```

**Expected output** (with Next.js running):
```
✅ SMOKE TEST PASSED (Full Integration)
   - MCP server operational
   - Next.js API integration verified
   - Health check returns valid JSON
```

### Using MCP Inspector (Visual Testing)

**Start MCP Inspector**:
```bash
cd apps/mcp-server
npx @modelcontextprotocol/inspector node dist/index.js
```

**What this does**:
- Launches web UI at http://localhost:6274
- Acts as MCP client proxy
- Provides visual interface for testing tools

**In the Inspector UI**:
1. Navigate to **"Tools"** tab
2. Find `projectpulse.health_check` tool
3. Click **"Execute"** or **"Test"**
4. View JSON response in the output panel

**Security Note**: Inspector binds to `localhost:6274` by default. CVE-2025-49596 addresses RCE vulnerability - ensure latest version.

---

## Configuring Claude Desktop

### Step 1: Locate MCP Settings File

**File location**:
- **macOS/Linux**: `~/.claude/mcp_settings.json`
- **Windows**: `%USERPROFILE%\.claude\mcp_settings.json`

### Step 2: Add ProjectPulse MCP Server

Edit `mcp_settings.json`:

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": [
        "F:/Web_Projects/AI_HUB/apps/mcp-server/dist/index.js"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important**:
- Use **absolute path** to `dist/index.js`
- Replace `F:/Web_Projects/AI_HUB` with your actual project path
- Ensure Next.js is running on port 3000 (or update `API_BASE_URL`)

### Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. Verify MCP server appears in settings/connections

### Step 4: Test Integration

In Claude Desktop chat:
```
Can you call the projectpulse.health_check tool?
```

**Expected response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "version": "1.0.0",
  "server": "projectpulse-mcp"
}
```

---

## Configuring Claude Code (VSCode Extension)

### Step 1: Locate MCP Settings File

**File location**:
- **macOS/Linux**: `~/.config/Code/User/globalStorage/anthropics.claude-code/mcp_settings.json`
- **Windows**: `%APPDATA%\Code\User\globalStorage\anthropics.claude-code\mcp_settings.json`

### Step 2: Add ProjectPulse MCP Server

Same configuration as Claude Desktop (see above).

### Step 3: Reload VSCode

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run: **"Developer: Reload Window"**
3. Verify MCP server in Claude Code settings

---

## Environment Variables

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3000` | Next.js API base URL |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `development` | Environment (`development`, `production`, `test`) |

### Setting Environment Variables

**In mcp_settings.json**:
```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

**In shell (for local testing)**:
```bash
# Unix/Mac
export API_BASE_URL=http://localhost:3000
export LOG_LEVEL=debug
node dist/index.js

# Windows
set API_BASE_URL=http://localhost:3000
set LOG_LEVEL=debug
node dist/index.js
```

---

## Troubleshooting

### Issue: "Cannot find module '@modelcontextprotocol/sdk'"

**Cause**: Dependencies not installed

**Solution**:
```bash
cd apps/mcp-server
npm install
npm run build
```

### Issue: "Build not found" when running smoke test

**Cause**: TypeScript not compiled

**Solution**:
```bash
cd apps/mcp-server
npm run build
```

### Issue: "fetch failed" when calling health_check tool

**Cause**: Next.js API not running

**Solution**:
```bash
# Terminal 1: Start Next.js
cd apps/web
npm run dev

# Terminal 2: Verify API is accessible
curl http://localhost:3000/api/health
```

### Issue: MCP server not appearing in Claude Desktop

**Possible causes**:
1. **Incorrect path** - Use absolute path in `mcp_settings.json`
2. **Build missing** - Run `npm run build`
3. **Claude not restarted** - Quit and relaunch Claude Desktop
4. **JSON syntax error** - Validate `mcp_settings.json` syntax

**Debug steps**:
```bash
# Verify dist/index.js exists
ls apps/mcp-server/dist/index.js

# Test server starts manually
node apps/mcp-server/dist/index.js

# Check Claude logs (macOS/Linux)
tail -f ~/.claude/logs/mcp-server-projectpulse.log
```

### Issue: Server logs not visible

**Expected behavior**: Logs go to **stderr**, not stdout

**View logs**:
```bash
# Redirect stderr to file
node dist/index.js 2> server.log

# In another terminal
tail -f server.log
```

### Issue: JSON-RPC parse errors

**Common mistakes**:
- Writing non-JSON to stdout (use stderr for logs)
- Missing newline after JSON message
- Malformed JSON syntax

**Debug**:
```bash
# Test with known-good message
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js 2>/dev/null
```

---

## Development Workflow

### Adding New Tools

1. Create tool file in `src/tools/`
2. Define Zod schema for input validation
3. Implement tool handler function
4. Register tool in `src/tools/index.ts`
5. Build and test

**Example**:
```typescript
// src/tools/myTool.ts
import { z } from 'zod';

export const myToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});

export type MyToolInput = z.infer<typeof myToolSchema>;

export async function myToolHandler(input: MyToolInput) {
  // Implementation
  return { result: 'success' };
}
```

### Testing New Tools

**Option 1: Automated test**:
```bash
node tests/smoke-test.js
```

**Option 2: MCP Inspector**:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

**Option 3: Claude Desktop**:
- Rebuild: `npm run build`
- Restart Claude Desktop
- Test tool invocation in chat

### Debugging

**Enable debug logging**:
```bash
LOG_LEVEL=debug node dist/index.js
```

**Inspect JSON-RPC messages**:
```bash
# Use MCP Inspector for visual debugging
npx @modelcontextprotocol/inspector node dist/index.js
```

**Check Next.js API integration**:
```bash
# Test API endpoint directly
curl http://localhost:3000/api/health

# Check server logs for HTTP errors
LOG_LEVEL=debug node dist/index.js
```

---

## Quality Gates

### Before Committing

```bash
# Run all quality checks
cd apps/mcp-server
npm run lint        # ESLint
npm run type-check  # TypeScript
npm run test        # Unit tests
npm run build       # Build check

# Run smoke test
node tests/smoke-test.js
```

### Before Releasing

```bash
# Full integration test
cd apps/web
npm run dev &

cd apps/mcp-server
npm run build
node tests/smoke-test.js

# Verify all tools work
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## References

### MCP Documentation

- **Official Spec**: https://modelcontextprotocol.io
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Inspector**: https://github.com/modelcontextprotocol/inspector

### Internal Documentation

- **API Catalog**: [.agent/system/api-catalog.md](../system/api-catalog.md)
- **MCP Tools Guide**: [.agent/system/mcp-tools-guide.md](../system/mcp-tools-guide.md)
- **Tech Context**: [.agent/tech-context.md](../tech-context.md)

### Security

- **CVE-2025-49596**: RCE vulnerability in MCP Inspector (patched in latest version)
- Always use `localhost` binding for Inspector
- Never expose stdio server to network (use HTTP with auth if needed)

---

## Quick Reference

### Common Commands

```bash
# Build
npm run build

# Dev mode (watch)
npm run dev

# Test
node tests/smoke-test.js

# Lint
npm run lint

# Type check
npm run type-check

# Start server
node dist/index.js

# Inspector UI
npx @modelcontextprotocol/inspector node dist/index.js
```

### File Locations

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry point |
| `src/config.ts` | Configuration loader |
| `src/logger.ts` | Logging utility |
| `src/httpClient.ts` | Next.js API client |
| `src/tools/index.ts` | Tool registry |
| `src/tools/healthCheck.ts` | Health check tool |
| `dist/` | Build output |
| `tests/smoke-test.js` | Automated test |

---

**Last Updated**: 2025-11-07  
**Maintainer**: ProjectPulse Team  
**Status**: Active
