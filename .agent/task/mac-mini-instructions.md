# Mac Mini Instructions from Windows Claude Code

**Last Updated**: 2025-11-08 17:00
**Status**: PENDING EXECUTION
**Commit**: 7e4f433

---

## 🎯 TASK: Rebuild MCP Server with Config Fix

### Context

Windows Claude Code has fixed the TypeScript compilation errors in the MCP server. The fix changes `config.PROJECTPULSE_API_URL` to `config.apiBaseUrl` in 3 tool files.

**Files Changed**:
- `apps/mcp-server/src/tools/sprintUpdateProgress.ts` (line 108)
- `apps/mcp-server/src/tools/sprintTaskCreate.ts` (line 91)
- `apps/mcp-server/src/tools/sprintSessionCreate.ts` (line 96)

---

## 📋 Instructions

Execute these steps in order:

### Step 1: Pull Latest Changes

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
```

**Expected**: Should pull commit `7e4f433` with message "fix: correct config property in MCP tools"

### Step 2: Restart MCP Server Container

```bash
docker-compose -f docker-compose.cloud.yml restart mcp-server
```

**Wait Time**: 2-3 minutes for pnpm install + build

### Step 3: Watch Build Logs

```bash
docker-compose -f docker-compose.cloud.yml logs -f mcp-server
```

**Look For**:
- ✅ `pnpm install` completes
- ✅ `pnpm build` runs
- ✅ TypeScript compilation: 0 errors
- ✅ `dist/` directory created
- ✅ MCP server starts successfully

Press `Ctrl+C` to stop watching logs.

### Step 4: Verify All Containers Running

```bash
docker-compose -f docker-compose.cloud.yml ps
```

**Expected**: All 3 containers (postgres, nextjs, mcp-server) showing "Up" status

### Step 5: Report Results

**Update this file with results:**

Mark this instruction as COMPLETED and add results:

```markdown
## ✅ COMPLETED - 2025-11-08 [TIME]

**Results**:
- Git pull: SUCCESS / FAILED (reason)
- Container restart: SUCCESS / FAILED (reason)
- TypeScript build: 0 errors / X errors (list them)
- MCP server status: RUNNING / FAILED (reason)

**Logs (if errors)**:
[Paste relevant error logs here]
```

Then commit this file:
```bash
git add .agent/task/mac-mini-instructions.md
git commit -m "chore: Mac mini rebuild complete"
git push origin feature/sprint-1-foundation
```

---

## 🎯 Success Criteria

- ✅ Git pull successful
- ✅ MCP server container restarted
- ✅ TypeScript compilation: 0 errors
- ✅ MCP server running
- ✅ All 3 containers up
- ✅ Results committed to Git

---

## 💡 Communication Protocol

**How this works**:

1. **Windows → Mac**: Windows Claude Code commits instructions to this file
2. **Mac mini reads**: Mac mini Claude Code pulls repo and reads this file
3. **Mac mini executes**: Follows instructions step by step
4. **Mac mini reports**: Updates this file with results and commits back
5. **Windows reads**: Windows Claude Code pulls and reads results

**Benefits**:
- ✅ No copy-paste between machines
- ✅ Versioned and trackable in Git
- ✅ Instructions and results preserved
- ✅ Simple workflow: "pull git and work as instructed"

---

**Awaiting Execution** - Mac mini Claude Code should pull this file and execute the steps above.
