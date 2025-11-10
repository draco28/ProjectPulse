# MCP Server Setup - Mac Mini (Claude Code CLI)

**Status**: ✅ CONFIGURED
**Date**: 2025-11-10
**Device**: Mac Mini (192.168.1.15)
**Claude Version**: Claude Code CLI

## Configured MCP Servers

### 1. **Sequential Thinking**
- **Package**: `@modelcontextprotocol/server-sequential-thinking`
- **Purpose**: Complex reasoning and step-by-step problem solving
- **Status**: ✅ Connected
- **Tools Available**:
  - Complex problem-solving workflows
  - Step-by-step reasoning traces

### 2. **Filesystem**
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Purpose**: Efficient file operations and bulk editing
- **Status**: ✅ Connected
- **Root Path**: `/Users/draco/projects/AI_HUB`
- **Tools Available**:
  - Advanced file operations
  - Bulk file editing

### 3. **Memory**
- **Package**: `@modelcontextprotocol/server-memory`
- **Purpose**: Long-term knowledge retention and pattern memory
- **Status**: ✅ Connected
- **Tools Available**:
  - Knowledge graph operations
  - Persistent memory across sessions

### 4. **Playwright**
- **Package**: `@playwright/mcp` (Official Microsoft package)
- **Purpose**: Browser automation and E2E testing
- **Status**: ✅ Connected
- **Tools Available**:
  - Browser automation with accessibility tree
  - Screenshot capture
  - JavaScript execution in browser

## Configuration Method

**IMPORTANT**: Claude Code CLI uses a different configuration method than Claude Desktop.

### For Claude Code CLI (Current Setup)

Configuration is stored in `~/.claude.json` (project-specific) and managed via CLI commands:

```bash
# Add MCP servers
claude mcp add --transport stdio sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
claude mcp add --transport stdio filesystem -- npx -y @modelcontextprotocol/server-filesystem /Users/draco/projects/AI_HUB
claude mcp add --transport stdio memory -- npx -y @modelcontextprotocol/server-memory
claude mcp add --transport stdio playwright -- npx -y @playwright/mcp

# List configured MCPs
claude mcp list

# Check specific MCP
claude mcp get <server-name>
```

### For Claude Desktop (Not Currently Used)

If you were using Claude Desktop, the configuration would be in `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/draco/projects/AI_HUB"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    }
  }
}
```

## How to Use These MCPs

### Sequential Thinking
Use when tackling complex problems that require step-by-step reasoning:
```
"I need to debug why the search API returns inconsistent results. Use sequential thinking to trace the data flow."
```

### Filesystem
Use for efficient bulk file operations:
```
"Update all API route handlers to follow the new error pattern (3+ files)"
```

### Memory
Use to save architectural decisions and patterns for future reference:
```
"Save the authentication flow pattern we just implemented to memory"
```

### Playwright
Use for E2E testing and browser automation:
```
"Create an E2E test for the user registration flow"
```

## Testing the Setup

To verify all MCPs are working:

```bash
# Test in Claude Code - just start a new session
# MCPs will initialize automatically when needed
```

## Comparison with Windows Setup

| Feature | Windows | Mac Mini |
|---------|---------|----------|
| Sequential Thinking | ✅ Yes | ✅ Yes |
| Filesystem | ✅ Yes | ✅ Yes |
| Memory | ✅ Yes | ✅ Yes |
| Playwright | ✅ Yes | ✅ Yes |
| Primary Role | Code Editing & Git | Server + Database |

## Notes

- All MCPs use npx to download and run on-demand
- No persistent package installation needed
- Configuration is global (applies to all projects)
- MCPs initialize automatically when needed in Claude Code sessions
- Filesystem MCP is restricted to `/Users/draco/projects/AI_HUB` for security

---

**Next Steps**: Start working with Claude Code on the AI_HUB project. MCPs will be available automatically!
