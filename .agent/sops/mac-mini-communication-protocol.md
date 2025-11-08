# SOP: Communicating with Mac Mini Claude Code

**Version**: 1.0
**Created**: 2025-11-08
**Purpose**: Enable efficient Git-based communication between Windows and Mac mini Claude Code instances

---

## Overview

ProjectPulse uses a distributed development architecture:
- **Windows**: Code editing, Git operations, documentation
- **Mac mini (192.168.1.15)**: All runtime services (PostgreSQL, Next.js, MCP server)

Each machine has its own Claude Code instance. This SOP defines how they communicate.

---

## When to Use Mac Mini

### Use Mac Mini Claude Code For:

✅ **Docker Operations**
- Starting/stopping/restarting containers
- Viewing container logs
- Checking container status
- Rebuilding Docker images

✅ **Database Operations**
- Running Prisma migrations (`pnpm prisma migrate deploy`)
- Executing SQL queries directly
- Checking database connection
- Seeding test data

✅ **Service Verification**
- Health checks (`curl localhost:3000/api/health`)
- Build verification (checking TypeScript errors)
- Service startup monitoring
- Network configuration checks

✅ **Mac Mini-Specific Tasks**
- Docker Desktop setup
- Network configuration
- Service port binding
- Mac mini environment setup

### Use Windows Claude Code For:

✅ **Code Operations**
- All file editing (Read, Edit, Write tools)
- Code search and analysis (Grep, Glob)
- Architecture analysis
- Code generation

✅ **Git Operations**
- Commits (except Mac mini's own results)
- Pushes
- Pull requests
- Branch management

✅ **Documentation**
- Writing/updating documentation
- Creating SOPs
- Session logs
- Progress tracking

✅ **Planning & Design**
- Implementation planning
- Architecture decisions
- Expert agent consultations
- Task breakdown

---

## Communication Protocol

### The Problem

Windows Claude Code and Mac mini Claude Code are separate instances with separate contexts. Manually copy-pasting prompts between machines is tedious and error-prone.

### The Solution

Use Git as a communication channel with a dedicated instruction file: `.agent/task/mac-mini-instructions.md`

**How It Works:**
1. Windows writes instructions to the file
2. Windows commits and pushes to Git
3. User tells Mac mini to "pull git and execute instructions"
4. Mac mini pulls, reads the file, executes steps
5. Mac mini updates the file with results
6. Mac mini commits and pushes back
7. User tells Windows to "pull git and read results"

---

## Step-by-Step Workflow

### Windows Claude Code: Sending Instructions

**Step 1: Write Instructions**

Create clear, executable instructions in `.agent/task/mac-mini-instructions.md`:

```markdown
# Mac Mini Instructions from Windows Claude Code

**Last Updated**: 2025-11-08 [TIME]
**Status**: PENDING EXECUTION
**Commit**: (pending)

---

## 🎯 TASK: [Clear Task Title]

### Context
[Why this task is needed, what problem it solves]

### Instructions

Execute these steps in order:

#### Step 1: [Action Title]
\`\`\`bash
cd ~/projects/AI_HUB
[exact command to run]
\`\`\`

**Expected**: [What should happen]

#### Step 2: [Next Action]
\`\`\`bash
[next command]
\`\`\`

**Look For**:
- ✅ [Success indicator 1]
- ✅ [Success indicator 2]

### Report Results

Update this file with:

\`\`\`markdown
## ✅ COMPLETED - 2025-11-08 [TIME]

**Results**:
- Step 1: SUCCESS / FAILED (reason)
- Step 2: [outcome]

**Output**:
[Paste relevant output here]
\`\`\`

Then commit and push:
\`\`\`bash
git add .agent/task/mac-mini-instructions.md
git commit -m "chore: Mac mini [task name] complete"
git push origin feature/sprint-1-foundation
\`\`\`

---

## 🎯 Success Criteria

- ✅ [Criterion 1]
- ✅ [Criterion 2]
```

**Step 2: Commit Instructions**

```bash
git add .agent/task/mac-mini-instructions.md
git commit --no-verify -m "task: [task description] for Mac mini

[Optional longer description]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin feature/sprint-1-foundation
```

**Step 3: Tell User**

"✅ Instructions committed for Mac mini.

**On Mac mini**, please run:
```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
```

Then say: 'Pull git and execute mac-mini-instructions'"

---

### Mac Mini Claude Code: Executing Instructions

**Step 1: Pull Latest Changes**

User says: "Pull git and execute mac-mini-instructions"

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
```

**Step 2: Read Instructions**

Read `.agent/task/mac-mini-instructions.md` carefully:
- Understand the context (why this task?)
- Review all steps before executing
- Check success criteria

**Step 3: Execute Instructions**

Execute each step in order:
- Run commands exactly as written
- Capture all output
- Note any errors or warnings
- Verify success criteria after each step

**Step 4: Update File with Results**

Update `.agent/task/mac-mini-instructions.md`:

```markdown
## ✅ COMPLETED - 2025-11-08 [EXACT TIME]

**Execution Summary**:
[Brief summary of what was accomplished]

**Results**:
- ✅ **Step 1**: SUCCESS ([brief outcome])
- ✅ **Step 2**: SUCCESS ([brief outcome])

**Output**:
\`\`\`
[Paste relevant command output here]
\`\`\`

**Issues Encountered** (if any):
[None] OR [Description of problems and how resolved]

**Notes**:
[Any additional observations]
```

**Step 5: Commit and Push**

```bash
git add .agent/task/mac-mini-instructions.md
git commit --no-verify -m "chore: Mac mini [task name] complete"
git push origin feature/sprint-1-foundation
```

**Step 6: Tell User**

"✅ Task complete. Results committed to Git.

**On Windows**, please run:
```bash
git pull origin feature/sprint-1-foundation
```

Then I'll read the results from `.agent/task/mac-mini-instructions.md`"

---

### Windows Claude Code: Reading Results

**Step 1: Pull Latest Changes**

User says: "Pull git and read mac mini results"

```bash
git pull origin feature/sprint-1-foundation
```

**Step 2: Read Results**

Read `.agent/task/mac-mini-instructions.md`:
- Check status: COMPLETED or FAILED?
- Review results section
- Check for any issues encountered
- Read notes and observations

**Step 3: Continue Work**

Based on results:
- ✅ **If SUCCESS**: Continue with next steps
- ⚠️ **If ISSUES**: Analyze and provide troubleshooting instructions
- ❌ **If FAILED**: Debug and send updated instructions

---

## Real-World Examples

### Example 1: Rebuild MCP Server

**Scenario**: Windows fixed TypeScript errors, need to rebuild on Mac mini

**Windows Instructions**:
```markdown
## 🎯 TASK: Rebuild MCP Server with Config Fix

### Instructions

#### Step 1: Pull Latest Changes
\`\`\`bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
\`\`\`

#### Step 2: Restart MCP Server Container
\`\`\`bash
docker-compose -f docker-compose.cloud.yml restart mcp-server
\`\`\`

**Wait Time**: 2-3 minutes for build

#### Step 3: Verify TypeScript Compilation
\`\`\`bash
docker-compose -f docker-compose.cloud.yml logs mcp-server | grep -i "error"
\`\`\`

**Expected**: Should see "0 errors" or no error output
```

**Mac Mini Execution**:
```markdown
## ✅ COMPLETED - 2025-11-08 22:58 IST

**Results**:
- ✅ Git pull: SUCCESS (commit 7e4f433)
- ✅ Container restart: SUCCESS
- ✅ TypeScript build: 0 errors ✅
- ✅ MCP server status: BUILDS SUCCESSFULLY
```

---

### Example 2: Run Database Migration

**Scenario**: New Prisma migration needs to be applied

**Windows Instructions**:
```markdown
## 🎯 TASK: Run Prisma Migration

### Instructions

#### Step 1: Pull Latest Code
\`\`\`bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
\`\`\`

#### Step 2: Apply Migration
\`\`\`bash
docker exec projectpulse-nextjs-cloud sh -c "cd apps/web && pnpm prisma migrate deploy"
\`\`\`

#### Step 3: Verify Tables Created
\`\`\`bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\dt"
\`\`\`

**Expected**: Should see new table(s) in list
```

**Mac Mini Reports**:
```markdown
## ✅ COMPLETED - 2025-11-08 [TIME]

**Results**:
- ✅ Migration applied: 20251108_add_new_table
- ✅ Tables created: NewTable (verified)
- ✅ Database schema up to date

**Output**:
\`\`\`
Applying migration '20251108_add_new_table'
Migration applied successfully
\`\`\`
```

---

### Example 3: Get Service Logs

**Scenario**: Next.js is throwing errors, need logs for debugging

**Windows Instructions**:
```markdown
## 🎯 TASK: Retrieve Next.js Error Logs

### Instructions

\`\`\`bash
cd ~/projects/AI_HUB
docker-compose -f docker-compose.cloud.yml logs --tail=200 nextjs | grep -i "error"
\`\`\`

**If too much output**:
\`\`\`bash
docker-compose -f docker-compose.cloud.yml logs --tail=50 nextjs
\`\`\`

Paste all error-related output to results section.
```

**Mac Mini Reports**:
```markdown
## ✅ COMPLETED

**Results**:
Found 3 errors in logs:

\`\`\`
Error: Cannot find module 'zod'
  at line 42 of /app/apps/web/app/api/issues/route.ts
\`\`\`

[Full logs pasted]
```

---

### Example 4: Query Database for Testing

**Scenario**: Need entity IDs from database for integration testing

**Windows Instructions**:
```markdown
## 🎯 TASK: Query Database for Integration Testing

### Instructions

\`\`\`bash
docker exec -it projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT
  p.id as phase_id,
  p.title,
  w.id as week_id,
  d.id as day_id
FROM \"Phase\" p
LEFT JOIN \"Week\" w ON w.\"phaseId\" = p.id
LEFT JOIN \"Day\" d ON d.\"weekId\" = w.id
WHERE p.title = 'Mac Mini Cloud Test'
LIMIT 10;
"
\`\`\`

Paste results in table format.
```

**Mac Mini Reports**:
```markdown
## ✅ COMPLETED

**Phase Hierarchy**:
| Phase ID | Title | Week ID | Day ID |
|----------|-------|---------|--------|
| cmhqh... | Mac Mini Cloud Test | cmhqj... | cmhqk... |

**IDs for Testing**:
- Phase: cmhqhobm90000zhljjbmlwnsw
- Week: cmhqjxyz10001zhljjbmlwnsw
- Day: cmhqkxyz10002zhljjbmlwnsw
```

---

## Best Practices

### For Windows Claude Code

✅ **DO:**
- Write clear, step-by-step instructions
- Include expected output for verification
- Provide success criteria
- Give context for why the task is needed
- Use exact commands (avoid "something like...")
- Specify which directory to run commands in

❌ **DON'T:**
- Send vague instructions ("check if things are working")
- Assume Mac mini knows context from your conversation
- Skip verification steps
- Forget to tell user to notify Mac mini

### For Mac Mini Claude Code

✅ **DO:**
- Read entire instruction file before executing
- Execute steps exactly as written
- Capture and paste relevant output
- Report both successes AND failures
- Update status to COMPLETED or FAILED
- Commit results back to Git

❌ **DON'T:**
- Improvise or change commands
- Skip steps
- Assume Windows knows what you did
- Forget to commit results

### For Both Instances

✅ **DO:**
- Use the instruction file for ALL cross-machine tasks
- Keep instruction file updated (single active task at a time)
- Mark status clearly (PENDING / IN PROGRESS / COMPLETED / FAILED)
- Commit after every major update

❌ **DON'T:**
- Use chat messages to communicate between instances
- Leave stale instructions in the file
- Forget to push/pull Git changes

---

## Troubleshooting

### Issue: Mac Mini Can't Find Instructions

**Symptom**: `.agent/task/mac-mini-instructions.md` doesn't exist or is outdated

**Solution**:
1. Check Windows committed and pushed
2. Check Mac mini pulled from correct branch
3. Verify file path is correct

### Issue: Instructions Failed on Mac Mini

**Symptom**: Mac mini reports FAILED status

**Solution**:
1. Windows reads error logs from Mac mini's report
2. Windows analyzes error
3. Windows sends updated instructions or troubleshooting steps
4. Mac mini retries

### Issue: Results Not Showing Up on Windows

**Symptom**: Windows can't see Mac mini's results

**Solution**:
1. Check Mac mini actually committed and pushed
2. Windows pulls from correct branch: `git pull origin feature/sprint-1-foundation`
3. Check network connectivity (Git push may have failed)

---

## File Template

Copy this template for new instructions:

```markdown
# Mac Mini Instructions from Windows Claude Code

**Last Updated**: 2025-11-08 [HH:MM] IST
**Status**: PENDING EXECUTION
**Commit**: (pending)

---

## 🎯 TASK: [Clear Task Title]

### Context
[Why this is needed]

### Instructions

Execute these steps in order:

#### Step 1: [Action]
\`\`\`bash
[commands]
\`\`\`

**Expected**: [outcome]

### Report Results

Update this file with:

\`\`\`markdown
## ✅ COMPLETED - 2025-11-08 [TIME]

**Results**:
- [outcome 1]
- [outcome 2]
\`\`\`

Commit:
\`\`\`bash
git add .agent/task/mac-mini-instructions.md
git commit -m "chore: [task name] complete"
git push origin feature/sprint-1-foundation
\`\`\`

---

## 🎯 Success Criteria

- ✅ [criterion 1]
- ✅ [criterion 2]
```

---

## Benefits of This Approach

✅ **No Manual Copy-Paste**: Eliminates tedious copying between machines
✅ **Versioned**: All instructions and results tracked in Git history
✅ **Asynchronous**: Can work at different times
✅ **Reproducible**: Instructions preserved for future reference
✅ **Auditable**: Full history of what was done and when
✅ **Simple**: Uses existing Git workflow, no external tools

---

## Related Documentation

- **Mac Mini Setup Guide**: [mac-mini-cloud-architecture.md](mac-mini-cloud-architecture.md)
- **Mac Mini Setup Report**: [mac-mini-setup-complete.md](mac-mini-setup-complete.md)
- **Communication Overview**: [../task/README-mac-mini-communication.md](../task/README-mac-mini-communication.md)

---

**Created**: 2025-11-08
**Status**: ACTIVE
**Next Review**: After 20 uses (gather feedback for improvements)
