# MCP Quick Start Guide

**Version**: 2.0.0 (Sprint 8.7)  
**Updated**: 2025-11-20  
**Architecture**: Stateful HTTP Streaming

---

## Overview

This guide shows you how to connect your AI coding agent (Claude Code, Windsurf, Cascade) to the ProjectPulse MCP server using the **stateful HTTP streaming transport**.

### What You'll Get

- **40+ Tools**: Onboarding, wiki, issues, workflows, roadmap, sprint management
- **Stateful Sessions**: No "Server not initialized" errors
- **Single Endpoint**: Clean, simple configuration
- **Multi-Client Support**: Works with all MCP-compliant clients

---

## Prerequisites

1. **ProjectPulse MCP Server** running at `http://192.168.1.15:3001`
2. **AI Coding Agent** installed:
   - [Claude Code](https://claude.ai/code) (recommended)
   - [Windsurf](https://www.codeium.com/windsurf) 
   - [Cascade](https://cascade.ai/)

---

## Authentication

**IMPORTANT:** Before connecting your agent, you must generate a project-scoped bearer token.

### Generate Your Token

1. **Navigate to Project Settings:**
   - Open ProjectPulse: `http://192.168.1.15:3000`
   - Log in and go to `/app` (user dashboard)
   - Click on your project
   - Click "Settings" tab (or go to `/projects/[id]/settings`)

2. **Create Token:**
   - Find the **"Agent Tokens"** section
   - Click **"Generate New Token"**
   - Enter a descriptive name (e.g., "Claude Code - MacBook Pro")
   - Set expiry days (recommended: 30-90 days)
   - Click **"Generate"**
   - **CRITICAL:** Copy the token immediately (shown only once!)

3. **Store Securely:**
   - Save token in password manager
   - Never commit to git
   - Treat like a password

**For detailed setup instructions, troubleshooting, and security best practices, see:**
👉 **[Complete Authentication Setup Guide](guides/mcp-authentication-setup.md)**

### Quick Security Checklist

- ✅ Use descriptive token names (e.g., "Claude Code - MacBook Pro")
- ✅ Set expiration dates (30-90 days recommended)
- ✅ Copy token immediately (one-time display)
- ✅ Store in password manager (never in git)
- ✅ Revoke unused tokens regularly
- ❌ Never share tokens between agents/devices
- ❌ Never commit tokens to version control

---

## Quick Setup

**Note:** The configuration examples below show placeholder tokens. Replace with your actual token from the Authentication step above.

### Option 1: Claude Code (Recommended)

**Step 1: Add MCP Server with Bearer Token**

Edit `~/.claude.json` to add the MCP server configuration:

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer <your_token_here>"
      }
    }
  }
}
```

**IMPORTANT:** Also add to project-scoped config in the same file:

```json
{
  "projects": {
    "/your/project/path": {
      "mcpServers": {
        "projectpulse": {
          "type": "http",
          "url": "http://192.168.1.15:3001/mcp",
          "headers": {
            "Authorization": "Bearer <your_token_here>"
          }
        }
      }
    }
  }
}
```

Replace `<your_token_here>` with the token you generated in the Authentication section.

**Step 2: Restart Claude Code**

Fully quit Claude Code (Cmd+Q on Mac) and reopen.

**Step 3: Verify Connection**

```bash
claude mcp list
```

You should see:
```
projectpulse-mcp (http://192.168.1.15:3001/mcp) - Connected ✓
```

**Step 3: Test Tools**

In Claude Code, type:
```
List all available MCP tools
```

Claude will call the `tools/list` method and show you all 40+ tools.

**Step 4: Use a Tool**

```
Get onboarding questions for my project
```

Claude will call `onboarding.getQuestions` tool.

---

### Option 2: Windsurf

**Step 1: Open MCP Settings**

1. Open Windsurf
2. Go to Settings → MCP Servers
3. Click "Add Server"

**Step 2: Configure Server with Bearer Token**

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "projectpulse": {
      "disabled": false,
      "serverUrl": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer <your_token_here>"
      }
    }
  }
}
```

Replace `<your_token_here>` with the token you generated in the Authentication section.

**Step 3: Save and Connect**

Click "Save" → "Connect"

**Step 4: Verify**

You should see "Connected ✓" next to the server name.

**Step 5: Use Tools**

In Windsurf chat:
```
Search wiki for "database schema"
```

Windsurf will call `wiki.search` tool.

---

### Option 3: Cascade

**Step 1: Configure MCP Server**

Edit your Cascade config file (location varies by OS):
- **macOS**: `~/.cascade/mcp.json`
- **Linux**: `~/.config/cascade/mcp.json`
- **Windows**: `%APPDATA%\Cascade\mcp.json`

Add:
```json
{
  "mcpServers": {
    "projectpulse": {
      "transport": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer <your_token_here>"
      }
    }
  }
}
```

Replace `<your_token_here>` with the token you generated in the Authentication section.

**Step 2: Restart Cascade**

Fully quit and reopen Cascade.

**Step 3: Verify**

Run Cascade's MCP diagnostics:
```bash
cascade mcp status
```

**Step 4: Use Tools**

In Cascade chat:
```
Create a new issue titled "Add dark mode"
```

Cascade will call `issue.create` tool.

---

## Available Tools

### Onboarding (8 tools)
- `onboarding.getQuestions` - Get questionnaire for project setup
- `onboarding.saveAnswers` - Store user responses
- `onboarding.getExecutiveSummaryPrompt` - Get AI prompt for summary
- `onboarding.storeExecutiveSummary` - Save generated summary
- `onboarding.getDocumentPrompts` - Get prompts for documentation
- `onboarding.storeDocument` - Save generated documents
- `onboarding.listDocuments` - List all documents
- `onboarding.bootstrap` - Create project structure from templates

### Wiki (5 tools)
- `wiki.create` - Create wiki page
- `wiki.search` - Search wiki content
- `wiki.update` - Update wiki page
- `wiki.generate` - AI-generate wiki content
- `wiki.analyticsTopPages` - Get most viewed pages

### Issues (6 tools)
- `issue.create` - Create new issue
- `issue.bulkCreate` - Create multiple issues
- `issue.update` - Update issue
- `issue.search` - Search issues
- `issue.addComment` - Add comment to issue
- `issue.setStatus` - Change issue status

### Workflows (7 tools)
- `workflow.list` - List all workflows
- `workflow.start` - Start workflow execution
- `workflow.executeStep` - Execute single workflow step
- `workflow.getStatus` - Get workflow status
- `workflow.pause` - Pause workflow
- `workflow.resume` - Resume workflow
- `workflow.complete` - Mark workflow complete

### Roadmap (3 tools)
- `roadmap.materialize` - Generate roadmap from plan
- `roadmap.getCurrentPosition` - Get current progress
- `roadmap.getPhaseProgress` - Get phase completion stats

### Sprint Management (7 tools)
- `sprint.phaseCreate` - Create sprint phase
- `sprint.taskCreate` - Create sprint task
- `sprint.sessionCreate` - Create development session
- `sprint.checkpointCreate` - Create checkpoint
- `sprint.getCurrentTask` - Get active task
- `sprint.updateProgress` - Update progress
- `sprint.queryHierarchy` - Query sprint structure

### Health Check (1 tool)
- `health.check` - Server health status

---

## Troubleshooting

### Error: "Connection refused"

**Cause**: MCP server not running or wrong URL

**Solution**:
```bash
# Check if server is running
curl http://192.168.1.15:3001/health

# Should return:
# {"status":"healthy","version":"0.1.0","transport":"http",...}
```

If server is down:
```bash
cd /Users/draco/projects/AI_HUB
docker-compose -f docker-compose.cloud.yml up -d mcp-server
```

---

### Error: "Server not initialized"

**Cause**: This error **should not happen** with stateful HTTP streaming. If you see it, it indicates a bug.

**Solution**:
1. Check server logs:
   ```bash
   docker logs ai_hub-mcp-server-1
   ```

2. Look for "MCP session initialized" messages
3. If not appearing, restart MCP server

---

### Error: "HTTP 406 Not Acceptable" (FIXED)

**Issue**: Claude Code and Factory Droid HTTP clients don't send the required `Accept: application/json, text/event-stream` header.

**Server Fix**: ✅ **AUTOMATICALLY FIXED** as of Sprint 8.7 Phase 4

ProjectPulse MCP server now includes middleware that transparently adds the missing header for client compatibility.

**Status**: 
- ✅ Claude Code HTTP transport works
- ✅ Factory Droid HTTP transport should work (untested)
- ✅ All MCP-compliant clients continue to work
- ✅ No user action required

**Technical Details**:
The server detects when clients send incomplete Accept headers and automatically adds `text/event-stream`. This is logged at DEBUG level if you want to verify:

```bash
# Enable debug logging
export LOG_LEVEL=debug
node dist/index-http.js
# Look for: "Added text/event-stream to Accept header"
```

---

### Error: "Tool not found"

**Cause**: Typo in tool name or outdated tool list

**Solution**:
1. List all tools:
   ```
   In your agent: "List all MCP tools"
   ```

2. Copy exact tool name from list

3. Tool names are case-sensitive:
   - ✅ `onboarding.getQuestions`
   - ❌ `onboarding.getquestions`

---

### Performance Issues

**Symptom**: Tools take >5 seconds to respond

**Solutions**:

1. **Check network latency**:
   ```bash
   ping 192.168.1.15
   # Should be <10ms on local network
   ```

2. **Check server CPU/memory**:
   ```bash
   docker stats ai_hub-mcp-server-1
   # CPU should be <50%, memory <512MB
   ```

3. **Check Next.js API (backend)**:
   ```bash
   curl http://192.168.1.15:3000/api/health
   # Should respond in <100ms
   ```

---

### Client-Specific Issues

#### Claude Code: "MCP server crashed"

**Solution**:
```bash
# Check Claude logs
tail -f ~/.claude/logs/mcp.log

# Restart Claude Code completely (Cmd+Q, then reopen)
```

#### Windsurf: "Transport error"

**Solution**:
1. Check Windsurf MCP settings → Delete server
2. Re-add with exact URL: `http://192.168.1.15:3001/mcp`
3. Ensure "Transport" is set to "HTTP" (not "SSE" or "WebSocket")

#### Cascade: "No tools available"

**Solution**:
```bash
# Verify config file syntax
cat ~/.cascade/mcp.json | jq .
# Should output valid JSON

# Restart Cascade completely
killall Cascade && cascade
```

---

## Migration from Old Setup

### If You Were Using SSE Transport

**Old config (Claude Code)**:
```bash
# This no longer works ❌
claude mcp add projectpulse-mcp http://192.168.1.15:3001/mcp
# (without --transport http flag)
```

**New config**:
```bash
# Remove old server
claude mcp remove projectpulse-mcp

# Add with HTTP transport flag
claude mcp add --transport http projectpulse-mcp http://192.168.1.15:3001/mcp
```

### If You Were Using `/api/mcp` Route

**Old URL**: `http://192.168.1.15:3000/api/mcp` (Next.js route)  
**New URL**: `http://192.168.1.15:3001/mcp` (standalone server)

**Update your config**:
- Claude Code: `claude mcp remove` → `claude mcp add` with new URL
- Windsurf: Delete old server → Add new server with new URL
- Cascade: Edit `mcp.json` → Change URL from `:3000/api/mcp` to `:3001/mcp`

---

## Advanced Configuration

### Custom Port

If your MCP server runs on a different port:

```bash
# Example: port 8080
claude mcp add --transport http projectpulse-mcp http://192.168.1.15:8080/mcp
```

### Multiple Environments

Connect to dev and prod servers:

```bash
claude mcp add --transport http projectpulse-dev http://192.168.1.15:3001/mcp
claude mcp add --transport http projectpulse-prod http://projectpulse.com/mcp
```

In chat, specify which server:
```
Using projectpulse-dev, get onboarding questions
```

### Logging

Enable verbose logging for debugging:

**Claude Code**:
```bash
export CLAUDE_MCP_LOG_LEVEL=debug
claude
```

**Windsurf**: Settings → MCP → Enable "Debug Mode"

**Cascade**: Edit `~/.cascade/config.json`:
```json
{
  "mcp": {
    "logLevel": "debug"
  }
}
```

---

## Testing Your Setup

### Basic Health Check

```bash
curl http://192.168.1.15:3001/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "transport": "http",
  "description": "Stateful HTTP Streaming (MCP Streamable HTTP)",
  "toolCount": 40,
  "endpoint": "/mcp"
}
```

### Tool List Check

```bash
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0"}
    }
  }'
```

**Expected**: JSON response with server info

### Tool Invocation Check

```bash
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

**Expected**: JSON response with 40+ tools

---

## Next Steps

1. **Explore Tools**: Ask your agent to list and explain each tool
2. **Try Workflows**: Use onboarding tools to set up a new project
3. **Automate Tasks**: Use workflow tools for repetitive operations
4. **Build Integrations**: Combine multiple tools in agent conversations

---

## Support

### Documentation
- [MCP Architecture](./MCP_ARCHITECTURE.md) - Technical details
- [Tool Reference](./MCP_API_REFERENCE.md) - All tool schemas

### Logs
- **MCP Server**: `docker logs ai_hub-mcp-server-1`
- **Next.js Backend**: `docker logs ai_hub-web-1`
- **Client**: Check agent-specific log locations (see Troubleshooting section)

### Common Scenarios

**"How do I onboard a new project?"**
```
1. Agent: "Get onboarding questions"
2. Agent: "Save my answers: [your responses]"
3. Agent: "Generate executive summary"
4. Agent: "Generate documentation prompts"
5. Agent: "Bootstrap project structure"
```

**"How do I create multiple issues at once?"**
```
Agent: "Bulk create issues with titles: 'Setup CI/CD', 'Add tests', 'Write docs'"
```

**"How do I track sprint progress?"**
```
Agent: "Get current sprint position and phase progress"
```

---

**Sprint 8.7 Complete** ✅  
Architecture: Stateful HTTP Streaming  
Endpoints: Single POST `/mcp`  
Compatible: Claude Code, Windsurf, Cascade, all MCP clients
