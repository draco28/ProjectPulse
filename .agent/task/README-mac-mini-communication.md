# Windows ↔ Mac Mini Communication Protocol

**Version**: 1.0
**Last Updated**: 2025-11-08

---

## 🎯 Purpose

Enable efficient communication between Windows Claude Code and Mac mini Claude Code instances using Git as the transport mechanism.

---

## 📋 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Windows Machine                                         │
│                                                         │
│  Claude Code (Windows)                                  │
│         │                                               │
│         │ 1. Writes instructions to file                │
│         │ 2. Commits to Git                             │
│         │ 3. Pushes to remote                           │
│         ▼                                               │
│  .agent/task/mac-mini-instructions.md                   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ GitHub
                          │ (git push/pull)
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Mac Mini                                                │
│                                                         │
│  Claude Code (Mac mini)                                 │
│         │                                               │
│         │ 1. Pulls from Git                             │
│         │ 2. Reads instructions file                    │
│         │ 3. Executes steps                             │
│         │ 4. Updates file with results                  │
│         │ 5. Commits and pushes                         │
│         ▼                                               │
│  .agent/task/mac-mini-instructions.md                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📄 Communication File

**Location**: `.agent/task/mac-mini-instructions.md`

**Format**:

```markdown
# Mac Mini Instructions from Windows Claude Code

**Last Updated**: [timestamp]
**Status**: PENDING EXECUTION | COMPLETED | FAILED
**Commit**: [commit-hash]

---

## 🎯 TASK: [Task Title]

### Context
[Background information for the task]

### Instructions
[Step-by-step instructions]

### Success Criteria
[What defines completion]

---

## ✅ COMPLETED - [timestamp] (updated by Mac mini)

**Results**:
[Results of execution]

**Issues Encountered**:
[Any problems or errors]
```

---

## 🔄 Workflow

### For Windows Claude Code

**When you need Mac mini to do something:**

1. **Write instructions** to `.agent/task/mac-mini-instructions.md`
2. **Commit with message** that includes instruction type:
   ```bash
   git add .agent/task/mac-mini-instructions.md
   git commit -m "task: [instruction type] for Mac mini"
   git push origin feature/sprint-1-foundation
   ```
3. **Tell user**: "I've committed instructions for Mac mini. On Mac mini, say: 'pull git and execute mac-mini-instructions'"

### For Mac Mini Claude Code

**When user says "pull git and work as instructed" or similar:**

1. **Pull latest changes:**
   ```bash
   cd ~/projects/AI_HUB
   git pull origin feature/sprint-1-foundation
   ```

2. **Read instructions:**
   ```bash
   cat .agent/task/mac-mini-instructions.md
   ```

3. **Execute the instructions** step by step

4. **Update file with results** (mark COMPLETED, add results)

5. **Commit and push:**
   ```bash
   git add .agent/task/mac-mini-instructions.md
   git commit -m "chore: Mac mini task complete - [task name]"
   git push origin feature/sprint-1-foundation
   ```

6. **Tell user**: "Task complete. Windows can pull to see results."

### For User (Manual Bridge)

**On Windows:**
```
You: "Pull git and check mac mini results"
Windows Claude Code: [pulls and reads results]
```

**On Mac mini:**
```
You: "Pull git and work as instructed"
Mac mini Claude Code: [pulls, reads instructions, executes, reports]
```

---

## ✅ Benefits

1. **No Copy-Paste**: Eliminates tedious manual copying between machines
2. **Versioned**: All instructions and results tracked in Git
3. **Asynchronous**: Can work at different times
4. **Reproducible**: Instructions preserved for future reference
5. **Simple**: Uses existing Git workflow
6. **No External Dependencies**: No Slack, webhooks, or additional tools

---

## 📚 Example Usage

### Example 1: Rebuild MCP Server

**Windows commits:**
```markdown
## TASK: Rebuild MCP Server

### Instructions
1. git pull origin feature/sprint-1-foundation
2. docker-compose -f docker-compose.cloud.yml restart mcp-server
3. docker-compose -f docker-compose.cloud.yml logs -f mcp-server
4. Verify 0 TypeScript errors
```

**Mac mini executes and updates:**
```markdown
## ✅ COMPLETED

**Results**:
- Git pull: SUCCESS (commit 7e4f433)
- Container restart: SUCCESS
- TypeScript build: 0 errors ✅
- MCP server status: RUNNING ✅
```

**Windows pulls and sees results**

---

### Example 2: Run Database Migration

**Windows commits:**
```markdown
## TASK: Run new Prisma migration

### Instructions
1. git pull (has new migration file)
2. docker exec projectpulse-nextjs-cloud sh -c "cd apps/web && pnpm prisma migrate deploy"
3. Verify migration applied
4. Show table list
```

**Mac mini executes and reports**

---

### Example 3: Get Logs

**Windows commits:**
```markdown
## TASK: Get Next.js error logs

### Instructions
1. docker-compose -f docker-compose.cloud.yml logs --tail=100 nextjs
2. Look for errors
3. Copy relevant logs to this file
```

**Mac mini executes and pastes logs**

---

## 🚨 Error Handling

**If Mac mini encounters errors:**

1. **Mark status as FAILED**
2. **Include error logs** in the results section
3. **Commit and push** so Windows can see

**Example:**
```markdown
## ❌ FAILED - 2025-11-08 17:30

**Results**:
- Git pull: SUCCESS
- Container restart: FAILED

**Error Logs**:
```
Error: Cannot connect to Docker daemon
```

**Next Steps Needed**:
- Check Docker Desktop is running
- Restart Docker Desktop
```

Windows Claude Code can then:
- Provide troubleshooting instructions
- Update the file with next steps
- Mac mini pulls and retries

---

## 🎯 Integration with Session Protocol

This communication system integrates seamlessly with the MANDATORY_SESSION_PROTOCOL:

- **Step 1** (Initialization): Read instructions file if exists
- **Step 2** (Plan Creation): Can include "delegate to Mac mini" steps
- **Step 4** (Checkpoints): Update instructions file at checkpoints
- **Step 5** (Post-Completion): Final instructions for Mac mini if needed

---

## 💡 Future Enhancements

**Possible improvements:**

1. **Multiple instruction files** for parallel tasks
2. **Priority levels** (urgent, normal, low)
3. **Scheduled tasks** (run at specific times)
4. **Automated pulls** (Mac mini polls every N minutes)
5. **Status dashboard** (single file showing all pending/completed tasks)

---

**Created**: 2025-11-08
**Status**: ACTIVE
**Next Review**: After 10 uses (gather feedback for improvements)
