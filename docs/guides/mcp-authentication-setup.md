# MCP Authentication Setup Guide

**Last Updated:** 2025-11-22
**Sprint:** 9
**Audience:** End users setting up AI agents

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Generating Your First Token](#generating-your-first-token)
4. [Configuring Your Agent](#configuring-your-agent)
5. [Testing Your Setup](#testing-your-setup)
6. [Token Management](#token-management)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Introduction

### What are Bearer Tokens?

Bearer tokens are opaque credentials used to authenticate AI agents with the ProjectPulse MCP server. Each token is:

- **Project-scoped:** Only works for a single project
- **Time-limited:** Optional expiration dates (30-90 days recommended)
- **Revocable:** Can be invalidated at any time
- **One-way hashed:** Plaintext never stored in database (bcrypt)

### Why Authentication?

ProjectPulse uses bearer token authentication to:

1. **Prevent unauthorized access** to project data
2. **Track agent usage** (last used timestamps)
3. **Enable multi-tenancy** (multiple projects per instance)
4. **Support token rotation** (security best practice)

### Security Model

```
Agent (Claude Code, etc.)
  ↓ HTTP Request with Authorization: Bearer <token>
MCP Server (port 3001)
  ↓ POST /api/agent-auth/validate { token }
Web App (port 3000)
  ↓ bcrypt.compare(token, tokenHash)
Database (ProjectToken table)
  ↓ Return { projectId, tokenId, name }
MCP Server
  ↓ Attach agentAuth to request
Tool Execution
```

**Key Points:**
- Plaintext token only shown ONCE during generation
- Token hash stored in database (bcrypt)
- Validation happens on every MCP request
- Invalid/expired/revoked tokens return 401 Unauthorized

---

## Prerequisites

Before generating a token, ensure you have:

- ✅ **ProjectPulse instance running** at `http://192.168.1.15:3000`
- ✅ **User account** (logged in)
- ✅ **Project created** (or know project ID)
- ✅ **Agent installed** (Claude Code, Factory Droid, Windsurf, etc.)

**Not set up yet?**
- See [Onboarding User Guide](onboarding-user-guide.md) for complete project setup
- See [MCP Quick Start](../MCP_QUICK_START_v2.md) for agent installation

---

## Generating Your First Token

### Step 1: Navigate to Project Settings

1. Open ProjectPulse: `http://192.168.1.15:3000`
2. Log in with your credentials
3. Click **"Go to Dashboard"** (or navigate to `/app`)
4. Click on your project card
5. Click **"Settings"** tab (or navigate to `/projects/[id]/settings`)

**URL Format:** `/projects/1/settings` (replace `1` with your project ID)

### Step 2: Open Token Generation Modal

In the **Agent Tokens** section:

1. Locate the "Agent Tokens" card (first section on page)
2. Click **"Generate New Token"** button (coral-colored, top-right)
3. Modal will appear with token generation form

### Step 3: Fill Token Details

**Token Name** (required):
- Use descriptive name identifying agent and device
- Examples:
  - ✅ "Claude Code - MacBook Pro"
  - ✅ "Factory Droid - Dev Laptop"
  - ✅ "Windsurf - Work Desktop"
  - ❌ "Token 1" (too generic)
  - ❌ "My Token" (not descriptive)

**Expiry Days** (optional, default 30):
- Recommended: 30-90 days
- Never expires: Leave blank or set to 0
- Security best practice: Use expiration dates

### Step 4: Generate and Copy Token

1. Click **"Generate"** button
2. **CRITICAL:** Token plaintext displayed ONCE in success modal
3. **Immediately copy** token using:
   - "Copy to Clipboard" button (HTTPS)
   - Manual selection + Cmd+C (HTTP fallback)
4. **Store token securely** (see Security Best Practices)

**⚠️ WARNING:** Token will NEVER be shown again after closing modal. If lost, you must generate a new token.

### Step 5: Verify Token Created

After closing modal:

1. Token appears in "Active Tokens" table
2. Verify name and creation date
3. Note expiration date (if set)

---

## Configuring Your Agent

### Claude Code

**Method 1: Global Configuration** (Recommended)

Edit `~/.claude.json`:

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer a53219c75dfcbe1daef678941e552db3dcb0769081ebfc8ce35efebf25c63aed"
      }
    }
  }
}
```

**Method 2: Project-Specific Configuration**

Also update the project-scoped config in `~/.claude.json`:

```json
{
  "projects": {
    "/Users/yourname/projects/AI_HUB": {
      "mcpServers": {
        "projectpulse": {
          "type": "http",
          "url": "http://192.168.1.15:3001/mcp",
          "headers": {
            "Authorization": "Bearer a53219c75dfcbe1daef678941e552db3dcb0769081ebfc8ce35efebf25c63aed"
          }
        }
      }
    }
  }
}
```

**Important:** Replace the token above with your actual token.

**Restart:** Quit Claude Code completely (Cmd+Q) and reopen.

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "projectpulse": {
      "disabled": false,
      "serverUrl": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer a53219c75dfcbe1daef678941e552db3dcb0769081ebfc8ce35efebf25c63aed"
      }
    }
  }
}
```

**Restart:** Exit current session (Ctrl+C) and reopen Windsurf.

### Generic HTTP Client Pattern

All MCP-compliant clients support HTTP transport with custom headers:

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

**Key Requirements:**
- Header name MUST be `Authorization`
- Value MUST start with `Bearer ` (note space)
- Token MUST be complete (no truncation)

**For other agents:**
- See [Multi-Agent Setup Guide](../features/mcp-multi-agent-setup.md)

---

## Testing Your Setup

### Step 1: Health Check

```bash
curl http://192.168.1.15:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "transport": "http",
  "toolCount": 40,
  "endpoint": "/mcp"
}
```

**If this fails:** MCP server is not running. Check Docker:
```bash
docker ps --filter "name=projectpulse-mcp-cloud"
```

### Step 2: MCP Initialize Request

```bash
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
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

**Expected:** JSON response with server capabilities (no 401 error).

### Step 3: Tool List Verification

```bash
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

**Expected:** JSON response with 40 tools.

### Step 4: Agent Invocation

In your agent (Claude Code, etc.):

```
List all available MCP tools
```

**Expected:** Agent calls `tools/list` and shows 40 ProjectPulse tools.

**If you see 401 errors:** See Troubleshooting section.

---

## Token Management

### Viewing Active Tokens

Navigate to `/projects/[id]/settings` and scroll to "Agent Tokens" section.

**Active Tokens Table:**
| Name | Created | Expires | Last Used | Actions |
|------|---------|---------|-----------|---------|
| Claude Code - MacBook Pro | Nov 22, 2025 | Dec 22, 2025 | Nov 22, 2025 | [Revoke] |
| Factory Droid - Dev Laptop | Nov 20, 2025 | Never | Nov 21, 2025 | [Revoke] |

**Columns:**
- **Name:** Descriptive label you provided
- **Created:** Generation timestamp
- **Expires:** Expiration date (or "Never")
- **Last Used:** Last successful MCP request (or "Never")
- **Actions:** Revoke button

### Monitoring Usage

**Last Used Column:** Updates automatically when agent makes authenticated MCP request.

**Use Cases:**
- Identify inactive tokens (revoke if not used in 30+ days)
- Verify agent is connecting successfully (timestamp updates)
- Detect token misuse (unexpected usage patterns)

### Revoking Tokens

**When to Revoke:**
- Token compromised or leaked
- Agent no longer in use
- Device lost or stolen
- Token not used in 30+ days
- Replacing with rotated token

**How to Revoke:**
1. Navigate to `/projects/[id]/settings`
2. Find token in "Active Tokens" table
3. Click trash icon (Revoke button)
4. Confirm revocation in popup
5. Token moved to "Revoked Tokens" (collapsed section)

**Effect:** Token IMMEDIATELY invalid. Agent will receive 401 errors on next request.

### Token Rotation Strategy

**Recommended:** Rotate tokens every 90 days (security best practice).

**Rotation Workflow:**
1. Generate new token (new name: "Claude Code - MacBook Pro v2")
2. Update agent configuration with new token
3. Test agent connection (verify working)
4. Revoke old token
5. Schedule next rotation in 90 days

**Automation:** Set calendar reminder for rotation.

---

## Security Best Practices

### 1. Use Descriptive Names

✅ **Good:**
- "Claude Code - MacBook Pro Dev"
- "Factory Droid - Home Office Desktop"
- "Windsurf - Work Laptop 2024"

❌ **Bad:**
- "Token 1"
- "My Token"
- "Test"

**Why:** Makes it easy to identify and revoke specific tokens.

### 2. Set Expiration Dates

✅ **Recommended:** 30-90 days

❌ **Avoid:** Never expires (unless absolutely necessary)

**Why:** Limits exposure window if token leaked.

### 3. Store Tokens in Password Manager

✅ **Use:**
- 1Password
- LastPass
- Bitwarden
- macOS Keychain (secure notes)

❌ **Never:**
- Plain text files
- Git repositories
- Unencrypted cloud storage
- Email

**Entry Format:**
```
Title: ProjectPulse MCP Token - Claude Code MacBook Pro
Username: project-1-claude-code
Password: a53219c75dfcbe1daef678941e552db3dcb0769081ebfc8ce35efebf25c63aed
URL: http://192.168.1.15:3001/mcp
Notes:
- Created: 2025-11-22
- Expires: 2025-12-22
- Rotate on: 2026-02-22
```

### 4. Revoke Unused Tokens

**Monthly Review:**
1. Check "Last Used" column
2. Revoke tokens not used in 30+ days
3. Investigate unexpected usage

### 5. One Token Per Agent/Device

❌ **Never:** Share tokens across multiple agents

✅ **Always:** Generate unique token for each:
- Agent type (Claude Code, Factory Droid)
- Device (MacBook, Desktop, Laptop)
- Environment (Dev, Staging)

**Why:** Enables granular revocation (lost device, decommissioned agent).

### 6. Monitor "Last Used" Column

**Weekly Check:**
- Verify expected agents are connecting
- Detect unauthorized usage
- Identify stale tokens

### 7. Rotate Tokens Periodically

**Schedule:** Every 90 days (calendar reminder)

**Process:**
1. Generate new token
2. Update agent config
3. Test connection
4. Revoke old token

### 8. Never Commit Tokens to Git

**Git Configuration:**

Add to `.gitignore`:
```
# MCP Tokens
.claude.json
.factory/mcp.json
mcp-token.txt
**/mcp-config*.json
```

**Pre-Commit Hook:**
```bash
# Check for token patterns
if git diff --cached | grep -i "bearer ey"; then
  echo "ERROR: Potential token in commit!"
  exit 1
fi
```

### 9. Secure Agent Configuration Files

**File Permissions:**
```bash
chmod 600 ~/.claude.json
chmod 600 ~/.codeium/windsurf/mcp_config.json
```

**Ownership:**
```bash
chown $USER:$USER ~/.claude.json
```

---

## Troubleshooting

### 401 Unauthorized Errors

**Symptoms:**
- Agent cannot connect to MCP server
- MCP requests fail with JSON-RPC error code -32001
- Error message: "Unauthorized: Invalid or expired token"

**Causes & Solutions:**

#### 1. Missing Authorization Header

**Cause:** Agent config missing `headers` section.

**Check:**
```json
// ❌ Wrong
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp"
    }
  }
}

// ✅ Correct
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

**Fix:** Add `headers` section with Authorization.

#### 2. Invalid Token Format

**Cause:** Missing "Bearer " prefix or token truncated.

**Check:**
```bash
# Test with curl
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Authorization: Bearer <your_token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

**Common Mistakes:**
- ❌ `"Authorization": "<token>"` (missing "Bearer ")
- ❌ `"Authorization": "bearer <token>"` (lowercase "bearer")
- ❌ `"Authorization": "Bearer  <token>"` (extra space)
- ✅ `"Authorization": "Bearer <token>"` (correct)

#### 3. Token Expired

**Cause:** Token expiration date passed.

**Check:** Navigate to `/projects/[id]/settings` and verify "Expires" column.

**Fix:**
1. Generate new token
2. Update agent config
3. Revoke old token

#### 4. Token Revoked

**Cause:** Token was manually revoked.

**Check:** Look for token in "Revoked Tokens" section (collapsed).

**Fix:** Generate new token.

#### 5. Wrong Project Token

**Cause:** Using token from different project.

**Check:** Verify `projectId` in Settings URL matches your project.

**Fix:** Generate token for correct project.

#### 6. Project-Scoped Config Missing Headers

**Cause:** Global config has headers but project-scoped config doesn't.

**Claude Code Specific:** For Claude Code, you need headers in BOTH the global `mcpServers` section AND the project-scoped `projects[path].mcpServers` section of `~/.claude.json`.

**Fix:** Ensure both configs have the Authorization header.

### Connection Refused Errors

**Symptoms:**
- Agent cannot reach MCP server
- Error: "ECONNREFUSED" or "Connection refused"

**Causes & Solutions:**

#### 1. MCP Server Not Running

**Check:**
```bash
curl http://192.168.1.15:3001/health
```

**Expected:** JSON response with "status": "healthy"

**If fails:**
```bash
# Check Docker container
docker ps --filter "name=projectpulse-mcp-cloud"

# Restart if needed
docker restart projectpulse-mcp-cloud

# Check logs
docker logs projectpulse-mcp-cloud --tail 50
```

#### 2. Wrong URL

**Common Mistakes:**
- ❌ `http://192.168.1.15:3000/mcp` (port 3000 = web app, not MCP)
- ❌ `http://192.168.1.15:3001` (missing /mcp path)
- ❌ `https://192.168.1.15:3001/mcp` (HTTPS instead of HTTP)
- ✅ `http://192.168.1.15:3001/mcp` (correct)

#### 3. Network Issues

**Check:**
```bash
ping 192.168.1.15
# Should have <10ms latency on local network
```

**If fails:** Verify Mac mini is on and connected to network.

### Configuration Issues

#### Agent Not Loading Tools

**Symptoms:**
- Agent starts successfully
- No MCP tools appear in tool list
- No errors shown

**Causes:**
1. **Config file location wrong**
   - Check agent-specific config path (see Multi-Agent Setup)
2. **JSON syntax error**
   - Validate JSON: `cat ~/.claude.json | jq .`
3. **Agent not restarted**
   - Fully quit agent (Cmd+Q) and reopen

#### Tools List Empty

**Symptoms:**
- Agent connects successfully
- `tools/list` returns empty array or error

**Check:**
```bash
# Verify tools registered
docker logs projectpulse-mcp-cloud | grep "Tools registered"
# Should show: [INFO] Tools registered {"count":40}
```

**Fix:**
```bash
docker restart projectpulse-mcp-cloud
```

### Token Copying Issues

#### Clipboard Failed (HTTP Context)

**Symptoms:**
- "Copy to Clipboard" button fails
- Navigator.clipboard not available

**Cause:** HTTP context (not HTTPS) blocks clipboard API.

**Solution:** Fallback automatically triggered:
1. TextArea created
2. Token selected
3. execCommand('copy') executed
4. Manual copy if fallback fails

**Alternative:** Manually select and copy token from modal.

---

## FAQ

### Q: Can I reuse the same token for multiple agents?

**A:** Technically yes, but NOT recommended. Generate unique tokens per agent/device for:
- Granular revocation (lost device)
- Usage tracking (which agent made requests)
- Security best practice (limit blast radius)

### Q: What happens if I lose a token?

**A:** Generate a new token. Old token cannot be recovered (plaintext never stored).

Workflow:
1. Generate new token
2. Update agent config
3. Revoke old token (if it still exists)

### Q: How do I rotate tokens?

**A:** See "Token Rotation Strategy" in Token Management section.

Summary:
1. Generate new token (new name)
2. Update agent config
3. Test connection
4. Revoke old token

### Q: Can tokens be used from different machines?

**A:** Yes, tokens work from any machine with network access to MCP server. However, generate unique tokens per machine for security.

### Q: Do tokens expire automatically?

**A:** Yes, if you set an expiration date during generation. Otherwise, tokens never expire (manual revocation required).

### Q: What's the token format?

**A:** Opaque string (bcrypt hash). Format is implementation detail and may change.

### Q: Can I see token plaintext after generation?

**A:** NO. Token plaintext shown ONLY ONCE during generation. If lost, generate new token.

### Q: How are tokens validated?

**A:** Every MCP request includes `Authorization: Bearer <token>` header. MCP server calls web app `/api/agent-auth/validate` endpoint, which uses bcrypt to compare token with stored hash.

### Q: Can I use API keys instead of bearer tokens?

**A:** No. ProjectPulse uses bearer token authentication exclusively for MCP access.

---

## Additional Resources

- [MCP Quick Start Guide](../MCP_QUICK_START_v2.md) - Quick agent setup
- [Multi-Agent Setup](../features/mcp-multi-agent-setup.md) - Validated agent configurations
- [MCP Architecture](../MCP_ARCHITECTURE.md) - Technical implementation details

---

**Last Updated:** 2025-11-22
**Sprint:** 9
**Status:** Production Ready
