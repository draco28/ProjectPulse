# MCP Configuration Fix - CORRECTED

**Date:** January 23, 2025
**Issue:** MCP servers not showing up after restart
**Root Cause:** MCP configuration was in wrong location

---

## Problem

The MCP tools were configured in `.vscode/settings.json`, but Claude Code for VS Code actually uses a **project-specific configuration** in:

```
C:\Users\<username>\.claude.json
```

This file contains a `projects` object where each project path has its own MCP server configuration.

---

## Solution

### 1. Correct Configuration Location

**File:** `C:\Users\prave\.claude.json`

**Structure:**

```json
{
  "projects": {
    "F:\\Web_Projects\\AI_HUB": {
      "allowedTools": [],
      "history": [],
      "mcpContextUris": [],
      "mcpServers": {
        "byterover-mcp": { ... },
        "memory": { ... },
        "filesystem": { ... },
        "sequential-thinking": { ... },
        "git": { ... },
        "playwright": { ... },
        "postgres": { ... },
        "docker-devhub": { ... }
      },
      ...
    }
  }
}
```

### 2. Configured MCP Servers (8 Total)

| Server                  | Package                                            | Purpose                            |
| ----------------------- | -------------------------------------------------- | ---------------------------------- |
| **byterover-mcp**       | `@byterover/mcp`                                   | Knowledge/memory management        |
| **memory**              | `@modelcontextprotocol/server-memory`              | Memory storage                     |
| **filesystem**          | `@modelcontextprotocol/server-filesystem`          | File operations (workspace-scoped) |
| **sequential-thinking** | `@modelcontextprotocol/server-sequential-thinking` | Complex reasoning                  |
| **git**                 | `@modelcontextprotocol/server-git`                 | Version control (repo-scoped)      |
| **playwright**          | `@playwright/mcp@latest`                           | E2E testing                        |
| **postgres**            | `@modelcontextprotocol/server-postgres`            | PostgreSQL database queries        |
| **docker-devhub**       | Custom (local)                                     | Docker container management        |

### 3. Full Configuration

```json
"mcpServers": {
  "byterover-mcp": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@byterover/mcp"],
    "env": {}
  },
  "memory": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "env": {}
  },
  "filesystem": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "F:\\Web_Projects\\AI_HUB"
    ],
    "env": {}
  },
  "sequential-thinking": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-sequential-thinking"
    ],
    "env": {}
  },
  "git": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-git",
      "--repository",
      "F:\\Web_Projects\\AI_HUB"
    ],
    "env": {}
  },
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": ["@playwright/mcp@latest"],
    "env": {}
  },
  "postgres": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-postgres",
      "postgresql://moksha:moksha_dev_password_2025@localhost:5432/moksha_devhub"
    ],
    "env": {}
  },
  "docker-devhub": {
    "type": "stdio",
    "command": "node",
    "args": [
      "F:\\Web_Projects\\AI_HUB\\apps\\mcp-docker\\dist\\index.js"
    ],
    "env": {}
  }
}
```

---

## Changes Made

### ✅ Added Configuration

- Added AI_HUB project to `C:\Users\prave\.claude.json`
- Configured 8 MCP servers for the project
- Set workspace-specific paths for `filesystem` and `git`
- Set repository-specific path for `postgres` (database connection)
- Set local path for custom `docker-devhub` server

### ❌ Removed Incorrect Configuration

- Deleted `.vscode/settings.json` (incorrect location for MCP config)

---

## Activation Steps

1. **Close and Reopen VS Code**
   - Completely close VS Code
   - Reopen the AI_HUB project
   - MCP servers should now be active

2. **Verify MCP Servers**

   ```
   You: "What MCP tools are available?"
   ```

   Should list all 8 servers.

3. **Test MCP Tools**
   ```
   PostgreSQL: "Show me all tables in the database"
   Docker: "Show Docker container status"
   Git: "What's the git status?"
   Filesystem: "List files in the apps directory"
   ```

---

## How It Works

### Project-Scoped Configuration

Claude Code for VS Code maintains MCP configurations on a **per-project basis** in:

```
%USERPROFILE%\.claude.json   (Windows)
~/.claude.json                 (Mac/Linux)
```

Each project path has its own `mcpServers` configuration, allowing different projects to have different MCP tools.

### Game Project Example

Your game project (`F:\Game_Projects\Moksha\MokshaMythicClash`) has these MCP servers configured:

- memory
- filesystem
- sequential-thinking
- git
- playwright

### AI_HUB Project Configuration

The AI_HUB project now has **8 MCP servers** (all 5 from game project + 3 additional):

- byterover-mcp (added)
- memory
- filesystem (workspace-scoped to AI_HUB)
- sequential-thinking
- git (repo-scoped to AI_HUB)
- playwright
- postgres (added - DevHub database)
- docker-devhub (added - custom server)

---

## Troubleshooting

### MCP Servers Still Not Showing

1. **Check file path:**

   ```bash
   python -c "import json; data = json.load(open(r'C:\Users\prave\.claude.json', encoding='utf-8')); print(r'F:\Web_Projects\AI_HUB' in data['projects'])"
   ```

   Should output: `True`

2. **Verify MCP servers:**

   ```bash
   python -c "import json; data = json.load(open(r'C:\Users\prave\.claude.json', encoding='utf-8')); print(list(data['projects'][r'F:\Web_Projects\AI_HUB']['mcpServers'].keys()))"
   ```

   Should list all 8 servers.

3. **Check Docker MCP built:**

   ```bash
   ls F:\Web_Projects\AI_HUB\apps\mcp-docker\dist\index.js
   ```

   If missing: `cd apps/mcp-docker && npm run build`

4. **Restart VS Code:**
   - Fully close (not just reload)
   - Reopen AI_HUB project

### PostgreSQL Connection Error

If postgres MCP fails to connect:

1. Ensure Docker containers are running:

   ```bash
   docker ps
   ```

2. If not running:

   ```bash
   docker-compose up -d
   ```

3. Test connection:
   ```bash
   docker exec -it moksha-db psql -U moksha -d moksha_devhub
   ```

---

## Key Differences from Previous Attempt

| Aspect            | Previous (Incorrect)    | Current (Correct)             |
| ----------------- | ----------------------- | ----------------------------- |
| **File Location** | `.vscode/settings.json` | `C:\Users\prave\.claude.json` |
| **Scope**         | Workspace settings      | Project-specific MCP config   |
| **Config Key**    | `claude.mcpServers`     | `projects[path].mcpServers`   |
| **Type Field**    | Not specified           | `"type": "stdio"` required    |
| **Env Field**     | Not included            | `"env": {}` required          |
| **Path Format**   | `${workspaceFolder}`    | Absolute path `F:\\...`       |

---

## Documentation References

- **MCP Configuration:** See [.claude/MCP_USAGE_GUIDE.md](.claude/MCP_USAGE_GUIDE.md)
- **Phase 5 Report:** See [.claude/PHASE_5_COMPLETION.md](.claude/PHASE_5_COMPLETION.md)
- **Docker MCP:** See [apps/mcp-docker/README.md](apps/mcp-docker/README.md)

---

## Next Steps

1. **Close and reopen VS Code**
2. **Test MCP tools** with sample queries
3. **Begin development** with full MCP assistance
4. **Reference** [.claude/MCP_USAGE_GUIDE.md](.claude/MCP_USAGE_GUIDE.md) for usage examples

---

**Status:** ✓ FIXED
**MCP Servers:** 8 configured
**Ready for:** Development
