# MCP Tools Troubleshooting Guide

## Status Check

✓ Configuration file: `C:\Users\prave\.claude.json` exists
✓ AI_HUB project configured (both `F:\` and `f:\` paths)
✓ 8 MCP servers configured
✓ Docker MCP server built

---

## Step-by-Step Activation

### 1. Close VS Code PROPERLY

**IMPORTANT:** You must FULLY CLOSE VS Code, not just reload!

**Windows:**

- Click File → Exit (or Alt+F4)
- OR Right-click VS Code in taskbar → Close window
- Make sure VS Code is NOT running in the background

**Verify closed:**

- Open Task Manager (Ctrl+Shift+Esc)
- Check "Processes" tab
- Ensure no "Code.exe" or "Visual Studio Code" process is running

### 2. Reopen VS Code

- Start VS Code fresh
- Open Folder → Select `F:\Web_Projects\AI_HUB`
- Wait for extensions to load (check bottom status bar)

### 3. Check MCP Status

**Method 1: Ask Claude**

```
You: "What MCP tools are available?"
```

**Method 2: Check Status Bar**

- Look at bottom left of VS Code
- Should show MCP server status icons

**Method 3: Command Palette**

- Press `Ctrl+Shift+P`
- Type "MCP"
- Look for MCP-related commands

### 4. Verify Workspace Path

The MCP configuration is path-specific. Check what path VS Code is using:

1. Press `Ctrl+Shift+P`
2. Type: "Preferences: Open Workspace Settings (JSON)"
3. Check if the file opens (if yes, you're in a workspace)
4. OR check File → Preferences → Settings → check title bar for path

The path shown should match one of:

- `F:\Web_Projects\AI_HUB`
- `f:\Web_Projects\AI_HUB`

---

## Common Issues

### Issue 1: VS Code Not Fully Closed

**Symptoms:** MCP servers don't appear after "reload"

**Solution:**

- Don't use "Reload Window" (Ctrl+R)
- Don't use "Reload Developer Window"
- Must fully EXIT VS Code (Alt+F4)
- Check Task Manager to confirm

### Issue 2: Wrong Workspace Path

**Symptoms:** MCP tools work in other project, not AI_HUB

**Solution:**

1. Check current folder in VS Code title bar
2. Ensure it shows `AI_HUB` not just subfolder
3. Close VS Code
4. Open entire `F:\Web_Projects\AI_HUB` folder (not subfolder)

### Issue 3: Docker Container Not Running

**Symptoms:** postgres MCP fails to connect

**Solution:**

```bash
# Check if containers are running
docker ps

# If not, start them
docker-compose up -d

# Verify database
docker exec -it moksha-db psql -U moksha -d moksha_devhub
```

### Issue 4: Node/NPM Issues

**Symptoms:** MCP servers fail to start

**Solution:**

```bash
# Check Node version
node --version

# Should be v18+ or v20+
# If old, update Node.js

# Test npx
npx --version
```

### Issue 5: Extension Not Loaded

**Symptoms:** Claude Code extension not showing

**Solution:**

1. Press `Ctrl+Shift+X` (Extensions)
2. Search "Claude Code"
3. Ensure it's installed and enabled
4. Check for updates
5. Reload VS Code after update

---

## Verification Commands

Once MCP tools are connected, test each one:

```bash
# Test 1: List available tools
You: "What MCP tools are available?"

# Test 2: PostgreSQL
You: "Show me all tables in the database"

# Test 3: Docker
You: "Show Docker container status"

# Test 4: Filesystem
You: "List files in the apps directory"

# Test 5: Git
You: "What's the git status?"

# Test 6: Memory
You: "Store this fact: AI_HUB project uses Next.js 14"

# Test 7: Sequential Thinking
You: "Help me think through the architecture of hybrid search"

# Test 8: Playwright
You: "Check if Playwright is configured"
```

---

## If Still Not Working

### Check Configuration Manually

Run this in PowerShell or Command Prompt:

```bash
python -c "import json; data = json.load(open(r'C:\Users\prave\.claude.json', encoding='utf-8')); print('AI_HUB paths found:'); [print(f'  {k}') for k in data['projects'].keys() if 'AI_HUB' in k]; ai_hub = data['projects'].get(r'F:\Web_Projects\AI_HUB', {}); print(f'\nMCP Servers: {len(ai_hub.get(\"mcpServers\", {}))}'); [print(f'  - {s}') for s in ai_hub.get('mcpServers', {}).keys()]"
```

Expected output:

```
AI_HUB paths found:
  F:\Web_Projects\AI_HUB
  f:\Web_Projects\AI_HUB

MCP Servers: 8
  - byterover-mcp
  - memory
  - filesystem
  - sequential-thinking
  - git
  - playwright
  - postgres
  - docker-devhub
```

### Check VS Code Extension

1. Press `Ctrl+Shift+X`
2. Search: "Claude Code"
3. Check version (should be latest)
4. Check if enabled
5. Try: Disable → Reload → Enable → Reload

### Check File Permissions

Ensure `.claude.json` is readable:

```bash
python -c "import os; path = r'C:\Users\prave\.claude.json'; print(f'Exists: {os.path.exists(path)}'); print(f'Readable: {os.access(path, os.R_OK)}'); print(f'Size: {os.path.getsize(path)} bytes')"
```

### Last Resort: Recreate Configuration

If nothing works, the configuration might be corrupted:

```bash
# Backup current config
copy "C:\Users\prave\.claude.json" "C:\Users\prave\.claude.json.backup"

# Then manually edit C:\Users\prave\.claude.json
# Find the AI_HUB project section and verify it matches:
```

```json
"F:\\Web_Projects\\AI_HUB": {
  "allowedTools": [],
  "history": [],
  "mcpContextUris": [],
  "mcpServers": {
    "byterover-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@byterover/mcp"],
      "env": {}
    },
    // ... rest of servers ...
  }
}
```

---

## Debug Information to Provide

If still not working, provide:

1. **VS Code version:**
   - Help → About

2. **Claude Code extension version:**
   - Ctrl+Shift+X → Search "Claude Code" → Check version

3. **Current workspace path:**
   - Check VS Code title bar or footer

4. **Configuration check output:**

   ```bash
   python -c "import json; data = json.load(open(r'C:\Users\prave\.claude.json', encoding='utf-8')); print([k for k in data['projects'].keys() if 'AI_HUB' in k])"
   ```

5. **Extension output:**
   - View → Output
   - Select "Claude Code" from dropdown
   - Check for errors

---

## Expected Behavior

When MCP tools are connected:

1. **Status bar** shows MCP indicators
2. **Asking about MCP tools** returns list of 8 servers
3. **Using MCP commands** (like "show tables") works
4. **Extension output** shows server connections

If none of these work, MCP tools are NOT connected.

---

**Last Updated:** January 23, 2025
**Configuration Status:** Verified Correct
**Next Step:** Fully close and reopen VS Code
