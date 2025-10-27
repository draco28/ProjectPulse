# Persistence Rules for All Agents

**Purpose**: Ensure NO work is ever lost due to context compaction or session interruption.

**Last Updated**: 2025-10-27

**Quick Start Links:**

- **Templates**: `.agent/task/templates/` (current-session-template.md, current-todos-template.md)
- **Examples**: `.agent/examples/persistence-examples.md`
- **Test Scenarios**: `.agent/testing/persistence-test-scenarios.md`
- **Validation**: `.agent/testing/persistence-validation-checklist.md`

---

## 🎯 Core Principle

**Every agent (parent and sub-agents) must:**

1. Read context files BEFORE starting work
2. Create/save their own reports/outputs to files
3. **NOT** update `current-session.md` (only parent agent does this)
4. Return file paths in their final message

---

## ⚠️ Automatic Pre-Compaction Save

**NEW: Proactive save when approaching context limit**

### Trigger Conditions

**When token usage reaches 160K (80% of 200K limit):**

- Auto-save triggers ONCE per session
- Updates session file, todos file, AND STATUS.md
- Silent operation with brief notification
- Prevents information loss before auto-compaction

### Token Usage Monitoring

| Usage    | Status       | Action                           |
| -------- | ------------ | -------------------------------- |
| < 140K   | ✅ Safe      | Normal updates (every 15-30 min) |
| 140-160K | ⚠️ Warning   | Approaching threshold            |
| ≥ 160K   | 🚨 AUTO-SAVE | Trigger automatic save           |
| > 180K   | 🔴 Danger    | Manual compaction recommended    |

### Auto-Save Sequence

When 160K threshold reached:

1. **Brief notification**:

   ```
   💾 Auto-save at 160K tokens (80%)...
   ```

2. **Update session file** (`.agent/task/current-session-[timestamp].md`):
   - Add latest progress entry
   - Mark current in-progress task
   - Add auto-save metadata:
     ```markdown
     **Auto-Save**: Triggered at 160K tokens (YYYY-MM-DD HH:MM)
     ```

3. **Update todos file** (`.agent/task/current-todos.md`):
   - Update completion percentages
   - Mark completed tasks
   - Update progress statistics

4. **Update STATUS.md checkpoint**:
   - Update "Last Task Completed" field
   - Update "Last Checkpoint" with current date

5. **Set session flag** (prevents re-trigger):
   - Internal flag: `auto_save_triggered = true`
   - Note: Conceptual per-session flag; prevents duplicate triggers within one session
   - Only triggers once per session

6. **Brief confirmation**:
   ```
   ✅ Progress saved. Manual compaction recommended.
   ```

### Why This Matters

**Problem**: Auto-compaction at ~200K can interrupt work unexpectedly

**Solution**: Save at 160K (80%), leaving 40K token buffer:

- User can review progress
- User can manually trigger compaction
- User can decide to continue or start new session
- All progress safely persisted

### Token Cost

- Session file update: ~150 tokens
- Todos file update: ~100 tokens
- STATUS.md update: ~200 tokens
- **Total**: ~450 tokens
- **Buffer after save**: 40K tokens (20% remaining)

### One-Time Per Session

Auto-save triggers **only once** when threshold first crossed:

```
Session start: 0 tokens
... work continues ...
150K tokens: ✅ Safe, normal operation
160K tokens: 🚨 AUTO-SAVE TRIGGERED
... auto-save completes ...
170K tokens: ✅ No re-trigger (flag set)
180K tokens: ✅ No re-trigger, but danger zone
```

**After auto-save**:

- User should manually compact context
- Or start new session for next major task
- Continuing past 180K risks auto-compaction

### Example Auto-Save Message

```markdown
💾 Auto-save at 160K tokens (80%)...

_Updates current-session-20251027-1430.md_
_Updates current-todos.md_
_Updates STATUS.md_

✅ Progress saved. Manual compaction recommended.
```

---

## 📋 Context Files All Agents Must Read

### Before Starting ANY Work

**1. `.agent/task/current-session-[latest].md`** (REQUIRED)

- Current phase and goals
- What's been done already
- What's in progress
- What needs to be done

**2. `.agent/task/current-todos.md`** (if exists)

- Task completion status
- In-progress tasks
- Pending tasks
- Overall progress percentage

**Finding latest session**: Use `ls .agent/task/` and sort by timestamp (YYYYMMDD-HHMM format)

---

## 🔧 Agent-Specific Output Locations

### Research Agents

**explore-codebase**: `.agent/task/explore-[topic]-[timestamp].md`
**analyze-architecture**: `.agent/task/architecture-[topic]-[timestamp].md`

### Expert Agents

**prisma-expert**: `.agent/task/prisma-[topic]-[timestamp].md`
**react-expert**: `.agent/task/react-[topic]-[timestamp].md`
**next-js-expert**: `.agent/task/nextjs-[topic]-[timestamp].md`

### Documentation Agents

**synthesize-docs**: `.agent/sops/[topic].md` or `.agent/task/plan-[topic]-[timestamp].md`
**map-system**: `.agent/system/[system-area].md`

---

## 🚫 Critical Rule: DO NOT Update current-session.md

**Sub-agents must NEVER update `current-session.md`**

❌ **WRONG** (sub-agent):

```markdown
2. **Update context file** `.agent/task/current-session.md`
   - Add my findings
   - Note completion
```

✅ **CORRECT** (sub-agent):

```markdown
2. **Do NOT update current-session.md** (parent agent does this)

3. **Return message**:
   "Report saved to .agent/task/[agent]-[topic]-[timestamp].md

   Parent agent should read that file and update current-session.md with key insights."
```

**Why?**

- Parent agent tracks the full session context
- Sub-agents work in isolated threads
- Parent agent integrates sub-agent findings into session timeline
- Prevents conflicting updates and maintains single source of truth

---

## 📊 Timestamp Format

**ALWAYS use**: `YYYYMMDD-HHMM`

Examples:

- `20251026-1430` ✅
- `2025-10-26-14-30` ❌
- `20251026` ❌
- `current` ❌

---

## 🔄 Parent Agent Workflow

**Parent agent (main Claude thread) manages session context:**

### Session Start

```markdown
1. Create `.agent/task/current-session-20251026-1430.md`
2. Document phase, goals, requirements from STATUS.md
3. Create/update `.agent/task/current-todos.md`
```

### When Invoking Sub-Agent

```markdown
1. Tell sub-agent: "Read .agent/task/current-session-20251026-1430.md first"
2. Wait for sub-agent report
3. Read sub-agent's report file
4. Update current-session.md with key insights from report
5. Continue implementation
```

### After Task Completion

```markdown
1. Update current-session.md with what was completed
2. Update current-todos.md with task status changes
3. Update STATUS.md at checkpoints
```

### Session End

```markdown
1. Archive session file to `.agent/task/archive/` (optional)
2. current-todos.md persists for next session
```

---

## 💾 Recovery Workflow

**If context compacts or session interrupted:**

### Step 1: Read STATUS.md

```markdown
**Last Task Completed**: Issues List page (2025-10-26)
**Last Checkpoint**: 2025-10-26
```

### Step 2: Find Latest Session File

```bash
ls .agent/task/
# Look for current-session-20251026-HHMM.md (highest timestamp)
```

### Step 3: Read Current Todos

```bash
cat .agent/task/current-todos.md
# Shows exactly what's completed, in progress, pending
```

### Step 4: Resume

```markdown
- Read in-progress task from current-todos.md
- Continue from where left off
- Update session file as work continues
```

---

## 📝 Return Message Templates

### Research Agents (explore, analyze-architecture)

```markdown
[Agent Type] complete. Report saved to .agent/task/[agent]-[topic]-[timestamp].md

Parent agent should read that file and update current-session.md with key insights.

Key insights: [1-2 sentence summary]
```

### Expert Agents (prisma, react, next-js)

```markdown
[Agent Type] plan complete. Report saved to .agent/task/[agent]-[topic]-[timestamp].md

Parent agent should read that file and update current-session.md with key recommendations.

Key recommendations: [1-2 sentence summary]
```

### Documentation Agents (synthesize-docs)

```markdown
Documentation created and saved to [file path]

Parent agent should read that file and update current-session.md noting the documentation is complete.

Type: [SOP/Plan/Troubleshooting Guide]
Summary: [1-2 sentence description]
```

### System Mapping Agent (map-system)

```markdown
System documentation updated: [file path]

Parent agent should read that file and update current-session.md noting the system mapping is complete.

Changes detected: [brief summary]
Documentation is current as of [timestamp]
```

---

## 🎯 Success Criteria

**✅ Working correctly when:**

- Sub-agents read context files before starting
- Sub-agents save their output to files
- Sub-agents do NOT update current-session.md
- Parent agent reads sub-agent reports
- Parent agent updates current-session.md with integrated insights
- All work is recoverable from files alone (no information only in messages)

**❌ Problems to fix:**

- Sub-agent starts work without reading context files
- Sub-agent tries to update current-session.md
- Sub-agent returns insights only in message (not in file)
- Parent agent doesn't update current-session.md after reading sub-agent report
- Work progress only exists in conversation (lost on compaction)

---

## 💡 Token Efficiency

### File Operations

- Create file: ~100 tokens
- Update file: ~200 tokens
- Read file: ~50 tokens + content size

### Total per Task

- Sub-agent reads context: ~100 tokens
- Sub-agent saves report: ~100 tokens
- Parent reads report: ~100 tokens
- Parent updates session: ~200 tokens
- **Total: ~500 tokens per task** (vs losing all progress!)

### Memory MCP Comparison

- Memory MCP operation: ~1000 tokens
- File operations: ~500 tokens
- **Savings: 50%** + files are human-readable

---

## 📚 Related Documentation

- [.agent/task/README.md](.agent/task/README.md) - Task context file system
- [.agent/task/templates/](.agent/task/templates/) - File templates
- [CLAUDE.md](../CLAUDE.md) - Main workflow integration
- [.agent/WORKFLOW_PROMPTS.md](.agent/WORKFLOW_PROMPTS.md) - Detailed workflows

---

## 🔍 Quick Checks

**Before starting work:**

- [ ] Did I read current-session-[latest].md?
- [ ] Did I read current-todos.md (if exists)?
- [ ] Do I understand the current phase and goals?

**After completing work:**

- [ ] Did I save my output to a file?
- [ ] Did I use correct timestamp format (YYYYMMDD-HHMM)?
- [ ] Did I return the file path in my message?
- [ ] Am I a sub-agent? If yes: Did I skip updating current-session.md?
- [ ] Am I the parent agent? If yes: Did I update current-session.md with insights?

---

**Remember**: Files survive context compaction. Messages don't. Save everything that matters!
