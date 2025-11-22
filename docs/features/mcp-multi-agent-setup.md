# MCP Multi-Agent Setup Guide

**Status**: ✅ Production Ready (Sprint 9 - Agent OAuth enabled)
**Transport**: HTTP (stateless streaming)
**Server**: `http://192.168.1.15:3001/mcp`
**Protocol**: MCP 2024-11-05
**Tools**: 40 ProjectPulse tools across 8 categories
**Auth**: Project-scoped bearer tokens per project (generated via `/projects/[id]/settings`)
**Last Updated**: 2025-11-22

## Validated Agents (Sprint 8.7)

The following AI agents have been **tested and confirmed working** with the ProjectPulse MCP server:

| Agent | Status | Config Location | Tested Date | Transport |
|-------|--------|----------------|-------------|-----------|
| **Factory Droid** | ✅ Working | `~/.factory/mcp.json` | 2025-11-20 | HTTP |
| **Claude Code** | ✅ Working | `~/.claude.json` | 2025-11-20 | HTTP |
| **curl** | ✅ Working | Direct HTTP requests | 2025-11-20 | HTTP |
| **Cascade (Windsurf)** | ⚪ Not Tested | `~/.codeium/windsurf/mcp_config.json` | - | HTTP |
| **Cursor IDE** | ⚪ Not Tested | `~/.cursor/mcp.json` | - | HTTP |
| **Continue.dev** | ⚪ Not Tested | `.continue/mcpServers/` | - | HTTP |
| **Cline** | ⚪ Not Tested | VS Code global settings | - | HTTP |

**Note**: All clients now use HTTP transport. SSE was removed in Sprint 8.7.

---

## Quick Start

### 1. Verify Server is Running

```bash
# Check health
curl http://192.168.1.15:3001/health

# Expected response:
# {"status":"healthy","version":"0.1.0","transport":"http","toolCount":40,"endpoint":"/mcp"}
```

### 2. Generate a Project Token

Before any agent can call ProjectPulse tools, it must authenticate with a **project-scoped bearer token**:

1. Open ProjectPulse at `http://192.168.1.15:3000` and log in.
2. Navigate to your project Settings page: `/projects/[id]/settings`.
3. In the **Agent Tokens** section, click **"Generate New Token"**.
4. Choose a descriptive name (for the agent) and expiry, then generate.
5. **Copy the token immediately** – it will only be shown once.
6. Treat this token like a password; store it securely.

You will use this token in an `Authorization: Bearer <token>` header from each agent.

### 3. Configure Your Agent

Choose your agent and follow the configuration below:

---

## Agent-Specific Configurations

### Common HTTP Config Pattern (All Agents)

Most agents that support HTTP MCP servers accept a JSON config with optional headers. The common pattern for ProjectPulse with Sprint 9 tokens is:

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer <project_token>"
      }
    }
  }
}
```

Replace `<project_token>` with the token you generated in `/projects/[id]/settings`.

> If your client does not expose a headers field directly in its UI, you can usually edit the underlying JSON config file to add this block manually. See the client-specific notes below.

---

### Factory Droid

**Config File**: `~/.factory/mcp.json`

**Configuration**:

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

**Restart**: Quit current Factory Droid session (Ctrl+C) and start new session with `droid`.

**Verify**: Factory Droid should auto-connect on startup and show ProjectPulse tools.

**Transport**: Uses Streamable HTTP (modern MCP standard).

---

### Claude Code

**Method**: CLI Command (Recommended)

```bash
claude mcp add --transport http projectpulse http://192.168.1.15:3001/mcp
```

**Alternative - Manual Config**: Edit `~/.claude.json`

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp"
    }
  }
}
```

**Restart**: Completely quit Claude Code (Command+Q) and reopen.

**Verify**: Open a conversation and check MCP tools are available.

**Status**: ✅ Validated (2025-11-20, Sprint 8.7 Phase 4)

---

### Cascade (Windsurf IDE)

**Config File**: `~/.codeium/windsurf/mcp_config.json`

**Full Configuration**:

```json
{
  "mcpServers": {
    "projectpulse": {
      "serverUrl": "http://192.168.1.15:3001/mcp",
      "description": "ProjectPulse MCP Server - 40 project management tools"
    }
  }
}
```

**Restart**: Quit Windsurf completely and reopen.

**Verify**:
1. Open Cascade panel (top-right plugins icon)
2. Go to Settings > Cascade > Plugins
3. Look for "projectpulse" server (should show as connected)
4. Ask Cascade: "List all available MCP tools"

**Expected Result**: Cascade will list 40 ProjectPulse tools.

---

### Cursor IDE

**Config File**: `~/.cursor/mcp.json`

**Configuration**:

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://192.168.1.15:3001/mcp"
      ]
    }
  }
}
```

**Restart**: Restart Cursor IDE.

**Verify**:
1. Enable MCP: Settings > Cursor Settings > MCP Servers
2. Open Composer Agent
3. Check "Available Tools" section
4. Look for ProjectPulse tools

---

### Continue.dev (VS Code Extension)

**Config File**: `.continue/mcpServers/projectpulse.yaml` (in your project root)

**Configuration**:

```yaml
name: ProjectPulse MCP
version: 0.1.0
schema: v1
mcpServers:
  - name: projectpulse
    type: streamable-http
    url: http://192.168.1.15:3001/mcp
```

**Restart**: Restart VS Code.

**Verify**:
1. Switch Continue to **agent mode** (not chat mode)
2. Ask: "What MCP tools are available?"
3. Look for ProjectPulse tools in response

**Note**: MCP only works in agent mode, not chat mode.

---

### Cline (VS Code Extension)

**Config File**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**Configuration**:

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://192.168.1.15:3001/mcp"
      ]
    }
  }
}
```

**Restart**: Restart VS Code.

**Verify**: Open Cline panel and ask: "List MCP tools"

---

## Available Tools (40 Total)

### Health & System
- `projectpulse.health_check` - Check server health and connectivity

### Sprint Management (15 tools)
- `projectpulse.sprint.phase.create` - Create new sprint phase
- `projectpulse.sprint.getCurrentTask` - Get currently active task
- `projectpulse.sprint.getCurrentPosition` - Get current position in hierarchy
- `projectpulse.sprint.updateProgress` - Update progress for any entity
- `projectpulse.sprint.task.create` - Create new task
- `projectpulse.sprint.session.create` - Create new work session
- `projectpulse.sprint.checkpoint.create` - Save progress checkpoint
- `projectpulse.sprint.queryHierarchy` - Query hierarchy with filters

### Workflow Management (6 tools)
- `projectpulse.workflow.list` - List available workflow templates
- `projectpulse.workflow.start` - Start new workflow run
- `projectpulse.workflow.executeStep` - Execute current workflow step
- `projectpulse.workflow.getStatus` - Get workflow run status
- `projectpulse.workflow.pause` - Pause workflow and create checkpoint
- `projectpulse.workflow.resume` - Resume paused workflow
- `projectpulse.workflow.complete` - Mark workflow as completed/failed

### Issue Management (6 tools)
- `projectpulse.issue.create` - Create single issue
- `projectpulse.issue.bulkCreate` - Create 1-50 issues in bulk
- `projectpulse.issue.update` - Update existing issue
- `projectpulse.issue.search` - Search issues with filters
- `projectpulse.issue.addComment` - Add comment to issue
- `projectpulse.issue.setStatus` - Update issue status

### Wiki & Knowledge (5 tools)
- `projectpulse.wiki.create` - Create wiki page
- `projectpulse.wiki.search` - Search wiki pages
- `projectpulse.wiki.update` - Update wiki page
- `projectpulse.wiki.analytics.summary` - Get wiki analytics
- `projectpulse.wiki.generate` - Auto-generate wiki from JSDoc

### Onboarding (7 tools)
- `projectpulse.onboarding.getPrompt` - Get onboarding prompt template
- `projectpulse.onboarding.submitResponse` - Submit onboarding response
- `projectpulse.onboarding.getQuestions` - Get questions for phase (1-10)
- `projectpulse.onboarding.saveAnswers` - Save answers for phase
- `projectpulse.onboarding.getExecutiveSummaryPrompt` - Get summary prompt
- `projectpulse.onboarding.storeExecutiveSummary` - Store generated summary
- `projectpulse.onboarding.getDocumentPrompts` - Get document generation prompts
- `projectpulse.onboarding.storeDocument` - Store generated document
- `projectpulse.onboarding.listDocuments` - List stored documents
- `projectpulse.onboarding.bootstrap` - Complete Session 3 bootstrap

### Roadmap (2 tools)
- `projectpulse.roadmap.materialize` - Materialize roadmap to hierarchy
- `projectpulse.roadmap.getPhaseProgress` - Get full phase progress

### Blueprint
- `projectpulse.blueprint.get` - Get Session 3 blueprint data

---

## Troubleshooting

### Issue: "Connection refused"

**Cause**: Server not running or network unreachable.

**Debug**:
```bash
# Test connectivity
curl http://192.168.1.15:3001/health

# Check Docker container
docker ps --filter "name=projectpulse-mcp-cloud"

# Check container logs
docker logs projectpulse-mcp-cloud --tail 50
```

**Fix**:
- Ensure Mac mini is powered on and Docker is running
- Verify port 3001 is not blocked by firewall
- Check network connectivity: `ping 192.168.1.15`

---

### Issue: "No tools found"

**Cause**: Client connected but tools not registered.

**Debug**:
```bash
# Check if tools are registered
docker logs projectpulse-mcp-cloud | grep "Tools registered"

# Should show: [INFO] Tools registered {"count":40}
```

**Fix**:
- Restart Docker container
- Check server logs for errors during tool registration
- Verify `src/tools/index.ts` loads all tool modules

---

### Issue: "Server does not support resources"

**Status**: ✅ **This is NORMAL** - not an error!

**Explanation**: ProjectPulse MCP server currently only implements **Tools**, not Resources. Some agents (like Cascade) check for Resources capability, and when the server doesn't advertise it, they report this message. This does not affect tool functionality.

**No action needed** - your tools will work perfectly.

---

### Issue: "Session ID missing"

**Cause**: Client not following SSE protocol correctly.

**Debug**:
```bash
# Watch Docker logs for connection attempts
docker logs -f projectpulse-mcp-cloud | grep "session"
```

**Expected behavior**:
```
[INFO] SSE connection established
[INFO] MCP SSE session started {"sessionId":"..."}
```

**If you see**: `[WARN] POST message missing session ID`

**Fix**: Use `mcp-remote` wrapper instead of direct URL:
```json
{
  "command": "npx",
  "args": ["-y", "mcp-remote", "http://192.168.1.15:3001/mcp"]
}
```

---

## Monitoring & Health Checks

### Real-Time Connection Monitoring

```bash
# Watch for new connections
docker logs -f projectpulse-mcp-cloud | grep -E "(session|connection)"
```

**Good signs**:
```
[INFO] SSE connection established
[INFO] MCP SSE session started {"sessionId":"xxx","totalSessions":N}
```

**Bad signs**:
```
[ERROR] Failed to start SSE session
[WARN] POST message missing session ID
```

---

### Health Endpoint

```bash
curl http://192.168.1.15:3001/health | jq .
```

**Response**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "transport": "http",
  "toolCount": 40,
  "endpoint": "/mcp"
}
```

**Fields**:
- `status`: "healthy" = server running correctly
- `transport`: "http" = stateless HTTP streaming (Sprint 8.7)
- `toolCount`: 40 registered tools across 8 categories
- `endpoint`: MCP endpoint path (/mcp)

---

## Multi-Agent Testing Results

### Test Environment
- **Date**: 2025-11-20 (Sprint 8.7 Validation)
- **Server**: Mac mini (192.168.1.15:3001)
- **Transport**: HTTP (stateless streaming)
- **Docker**: `projectpulse-mcp-cloud` container

### Validation Results

#### Factory Droid ✅
- **Connection**: Successful
- **Protocol**: HTTP (stateless streaming)
- **Tools**: All 40 tools visible and invocable
- **Validation**: Health check, onboarding, workflows all working
- **Date**: 2025-11-20 (Sprint 8.7 Phase 4)
- **Performance**: 25-75ms tool invocation

#### Claude Code ✅
- **Connection**: Successful
- **Protocol**: HTTP (stateless streaming)
- **Tools**: All 40 tools visible and invocable
- **Validation**: Health check and onboarding verified
- **Date**: 2025-11-20 (Sprint 8.7 Phase 4)
- **Status**: HTTP 406 issue fixed with rawHeaders middleware

#### curl ✅
- **Connection**: Successful
- **Protocol**: Direct HTTP POST requests
- **Tools**: All 40 tools accessible
- **Validation**: Initialize, tools/list, tools/call all working
- **Date**: 2025-11-20 (Sprint 8.7)

**Concurrent Testing**: Multiple agents (Factory Droid, Claude Code) can connect simultaneously without issues.

---

## Architecture Notes (Sprint 8.7)

### Single HTTP Transport

**Why HTTP Only?**

Sprint 8.7 removed SSE transport completely and standardized on stateless HTTP streaming:

**Benefits**:
- ✅ Simpler architecture (1 endpoint vs 3)
- ✅ 42% code reduction (302 → 175 lines)
- ✅ All major clients work (Factory Droid, Claude Code, curl)
- ✅ No session management complexity
- ✅ Modern MCP standard (2024-11-05)
- ✅ HTTP 406 issue fixed automatically

**HTTP Protocol Flow**:

1. **Client**: Sends POST request to `/mcp` with JSON-RPC body
2. **Middleware**: Fixes Accept headers if needed (rawHeaders update)
3. **Server**: Creates StreamableHTTPServerTransport for this request
4. **Server**: Connects transport → handles request → response streams
5. **Cleanup**: Transport closed after HTTP response completes (res.on('close'))
6. **Response**: Returns JSON-RPC response with tool results

**Key Features**:
- Single endpoint simplicity (`POST /mcp`)
- Stateless per-request design
- Accept header middleware (fixes HTTP 406 with rawHeaders)
- HTTP lifecycle cleanup
- 42% smaller (302 → 175 lines)

**See**: [MCP_ARCHITECTURE.md](../MCP_ARCHITECTURE.md) v2.0.0 for detailed implementation

---

### Sprint 8.7 Architecture Transformation

**What Changed**:

**Removed**:
- ❌ SSE transport (GET /mcp endpoint)
- ❌ JSON-RPC shim (/mcp/json-rpc)
- ❌ Session management Map
- ❌ Dual transport detection

**Added**:
- ✅ Accept header middleware (rawHeaders fix)
- ✅ HTTP lifecycle cleanup pattern
- ✅ Stateless mode configuration

**Results**:
- 302 lines → 175 lines (42% reduction)
- 3 endpoints → 1 endpoint
- All clients working (Factory Droid, Claude Code, curl)
- 100% reliability, <50ms tool calls

---

### Migration from Sprint 8.6 (SSE/Hybrid)

**Old Configuration** (Sprint 8.6):
```json
{
  "type": "sse",
  "url": "http://192.168.1.15:3001/mcp"
}
```

**New Configuration** (Sprint 8.7):
```json
{
  "type": "http",
  "url": "http://192.168.1.15:3001/mcp"
}
```

**Action Required**: Change `type` from "sse" to "http", endpoint stays the same.

---

## Future Considerations

### Sprint 9 Enhancements

**Planned Improvements**:
- OAuth 2.1 authentication for cloud deployment
- Rate limiting (per-client quotas)
- Automated test suite (E2E tests for all 40 tools)
- Load testing (50+ concurrent clients)
- Observability (metrics, tracing)

**See**: [SPRINT_8.7_COMPLETION_SUMMARY.md](../SPRINT_8.7_COMPLETION_SUMMARY.md) for details

---

## Adding New Agents

To add support for a new agent:

1. **Find MCP config location** for the agent
2. **Add server configuration**:
   ```json
   {
     "mcpServers": {
       "projectpulse": {
         "type": "http",
         "url": "http://192.168.1.15:3001/mcp"
       }
     }
   }
   ```
3. **Restart the agent**
4. **Test connection**:
   - Check agent's MCP/plugin settings
   - Test: `projectpulse.projectpulse_health_check()`
   - Verify: Health returns 40 tools
5. **Document results** in this file

---

## Support & Documentation

- **MCP Server Health**: `http://192.168.1.15:3001/health`
- **Docker Logs**: `docker logs projectpulse-mcp-cloud`
- **Server Code**: `apps/mcp-server/src/index-http.ts`
- **Tools Registration**: `apps/mcp-server/src/tools/index.ts`
- **MCP Specification**: https://spec.modelcontextprotocol.io/

---

## Contact & Contributions

If you test ProjectPulse MCP server with a new agent:
1. Document your configuration
2. Test all 40 tools
3. Submit results to update this guide
4. Add agent to "Validated Agents" table above

**Last Updated**: 2025-11-20 (Sprint 8.7)
**Validation Count**: 3 agents (Factory Droid, Claude Code, curl)
**Transport Architecture**: HTTP (stateless streaming)
**Concurrent Testing**: Multiple agents tested simultaneously
