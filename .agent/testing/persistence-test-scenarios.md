# Persistence Test Scenarios

**Purpose**: Test scenarios to validate the 3-tier persistence strategy works correctly.

**Last Updated**: 2025-10-27

---

## 🎯 Test Objectives

**Verify that**:

1. Context files are created and updated correctly
2. Sub-agents read context before starting work
3. Sub-agents save reports to files
4. Parent agent integrates sub-agent findings
5. Work can be recovered after context compaction
6. Work can be resumed after session interruption

---

## 📑 Quick Navigation

**Test Scenarios**:

1. [Scenario 1: Normal Session Workflow](#scenario-1-normal-session-workflow)
2. [Scenario 2: Sub-Agent Invocation (Research)](#scenario-2-sub-agent-invocation-research)
3. [Scenario 3: Sub-Agent Invocation (Expert)](#scenario-3-sub-agent-invocation-expert)
4. [Scenario 4: Context Compaction Recovery](#scenario-4-context-compaction-recovery)
5. [Scenario 5: Session Interruption Recovery](#scenario-5-session-interruption-recovery)
6. [Scenario 6: Multiple Sub-Agent Reports](#scenario-6-multiple-sub-agent-reports)
7. [Scenario 7: Checkpoint Creation](#scenario-7-checkpoint-creation)
8. [Scenario 8: Memory MCP Strategic Usage](#scenario-8-memory-mcp-strategic-usage)
9. [Scenario 9: Todos File Sync with TodoWrite](#scenario-9-todos-file-sync-with-todowrite)
10. [Scenario 10: Documentation Agent (synthesize-docs)](#scenario-10-documentation-agent-synthesize-docs)
11. [Scenario 11: System Mapping Agent (map-system)](#scenario-11-system-mapping-agent-map-system)
12. [Scenario 12: Full Phase Completion](#scenario-12-full-phase-completion)
13. [Scenario 13: Auto-Save Before Context Compaction](#scenario-13-auto-save-before-context-compaction)

---

## 🧪 Test Scenarios

### Scenario 1: Normal Session Workflow

**Purpose**: Verify basic file creation and updates during a normal session

**Steps**:

1. Start new session
2. Create `current-session-[timestamp].md`
3. Create `current-todos.md` with initial todos
4. Complete 2-3 tasks
5. Update session file after each task
6. Update todos file after each task completion

**Expected Results**:

- [x] Session file created with correct timestamp format
- [x] Session file contains phase info from STATUS.md
- [x] Todos file created with all phase tasks
- [x] Session file updated after each major step
- [x] Todos file shows correct completion status
- [x] Progress percentage calculated correctly

**Files to Check**:

- `.agent/task/current-session-[timestamp].md` exists
- `.agent/task/current-todos.md` exists
- Both files have correct structure per templates

---

### Scenario 2: Sub-Agent Invocation (Research)

**Purpose**: Verify sub-agent reads context, creates report, parent integrates findings

**Steps**:

1. Create session file with current phase context
2. Invoke `explore-codebase` or `analyze-architecture` sub-agent
3. Verify sub-agent reads `current-session.md` first
4. Verify sub-agent creates report file
5. Verify sub-agent does NOT update `current-session.md`
6. Parent agent reads sub-agent report
7. Parent agent updates `current-session.md` with key insights

**Expected Results**:

- [x] Sub-agent report file created: `.agent/task/[agent]-[topic]-[timestamp].md`
- [x] Sub-agent return message mentions file path
- [x] Sub-agent return message tells parent to update session file
- [x] current-session.md NOT modified by sub-agent
- [x] Parent agent reads report file
- [x] Parent agent updates current-session.md with summary
- [x] Session file shows: "Sub-agent complete, read report at [path]"

**Files to Check**:

- `.agent/task/explore-[topic]-[timestamp].md` or `.agent/task/architecture-[topic]-[timestamp].md`
- `.agent/task/current-session-[timestamp].md` (updated by parent only)

---

### Scenario 3: Sub-Agent Invocation (Expert)

**Purpose**: Verify expert agent (prisma/react/next-js) workflow

**Steps**:

1. Create session file with design requirements
2. Invoke expert agent (prisma-expert, react-expert, or next-js-expert)
3. Verify expert reads context files
4. Verify expert creates design plan file
5. Verify expert does NOT update current-session.md
6. Parent reads design plan
7. Parent implements based on plan
8. Parent updates session file with implementation notes

**Expected Results**:

- [x] Expert plan file created: `.agent/task/[expert]-[topic]-[timestamp].md`
- [x] Plan includes detailed design with code examples
- [x] Expert return message provides file path
- [x] current-session.md NOT modified by expert
- [x] Parent reads plan file before implementing
- [x] Parent updates session file: "Read [expert] plan, implementing..."
- [x] Implementation follows plan recommendations

**Files to Check**:

- `.agent/task/prisma-[topic]-[timestamp].md` or similar
- `.agent/task/current-session-[timestamp].md` (parent updates only)

---

### Scenario 4: Context Compaction Recovery

**Purpose**: Verify work can be recovered after context compaction

**Simulation Steps**:

1. Complete 3-4 tasks in a session
2. Update session file and todos after each task
3. Simulate context compaction (close Claude, wait, reopen)
4. Follow recovery workflow:
   - Read STATUS.md for last checkpoint
   - Find latest session file
   - Read current-todos.md
5. Resume work from in-progress task

**Expected Results**:

- [x] STATUS.md shows "Last Task Completed" with date
- [x] Latest session file found using timestamp
- [x] Session file contains all progress up to compaction
- [x] current-todos.md shows correct task statuses
- [x] In-progress task clearly identified
- [x] Can resume work immediately without information loss

**Files to Check**:

- `STATUS.md` (Last Task Completed field)
- `.agent/task/current-session-[latest].md`
- `.agent/task/current-todos.md`

---

### Scenario 5: Session Interruption Recovery

**Purpose**: Verify work can be resumed after unexpected session end

**Simulation Steps**:

1. Start session, complete 2 tasks
2. Update files appropriately
3. Simulate interruption (close Claude without finishing phase)
4. Reopen Claude next day
5. Follow recovery workflow
6. Continue from where left off

**Expected Results**:

- [x] All work from previous session persisted in files
- [x] No information loss from interruption
- [x] Recovery workflow takes < 2 minutes
- [x] Can identify exact point where work stopped
- [x] Can continue seamlessly
- [x] New session file created for new session
- [x] Old session file archived (optional)

**Files to Check**:

- Previous session file intact
- current-todos.md preserved
- New session file references previous session

---

### Scenario 6: Multiple Sub-Agent Reports

**Purpose**: Verify multiple sub-agent reports are managed correctly

**Steps**:

1. Start phase requiring multiple sub-agents
2. Invoke 3 different sub-agents sequentially
3. Each creates its own report file
4. Parent reads each report
5. Parent integrates all findings into session file
6. Verify reports don't conflict or overwrite each other

**Expected Results**:

- [x] 3 separate report files created with unique names
- [x] Each report uses correct timestamp
- [x] No file overwrites or conflicts
- [x] Parent session file references all 3 reports
- [x] Session file shows timeline of sub-agent invocations
- [x] All reports remain accessible for reference

**Files to Check**:

- `.agent/task/explore-[topic]-[timestamp].md`
- `.agent/task/architecture-[topic]-[timestamp].md`
- `.agent/task/prisma-[topic]-[timestamp].md`
- `.agent/task/current-session-[timestamp].md` (references all 3)

---

### Scenario 7: Checkpoint Creation

**Purpose**: Verify checkpoint updates work correctly

**Steps**:

1. Complete a major milestone (e.g., phase or day completion)
2. Update STATUS.md with checkpoint
3. Update session file noting checkpoint
4. Archive old session files (optional)

**Expected Results**:

- [x] STATUS.md updated with "Last Task Completed"
- [x] STATUS.md updated with "Last Checkpoint" date
- [x] Session file notes checkpoint creation
- [x] Checkpoint provides recovery point
- [x] Old sessions archived to keep .agent/task/ clean

**Files to Check**:

- `STATUS.md` (checkpoint fields)
- `.agent/task/current-session-[timestamp].md`
- `.agent/task/archive/` (old sessions moved here)

---

### Scenario 8: Memory MCP Strategic Usage

**Purpose**: Verify Memory MCP used correctly (strategic knowledge only)

**Steps**:

1. Complete a phase
2. Capture strategic knowledge to Memory MCP:
   - Architectural decisions
   - Patterns established
   - Lessons learned
3. Verify task progress NOT saved to Memory MCP
4. Verify files used for all progress tracking

**Expected Results**:

- [x] Memory MCP contains only strategic knowledge
- [x] Memory MCP does NOT contain task progress
- [x] Memory MCP does NOT contain session state
- [x] Memory MCP entities have proper observations and dates
- [x] Memory MCP relations connect related concepts
- [x] Files contain all progress and session information

**Memory MCP Check**:

```typescript
// Query Memory MCP
mcp__memory__read_graph();

// Verify entities are strategic (not task progress)
// Examples of GOOD entities:
// - "API Error Handling Pattern"
// - "Port Configuration Gotcha"
// - "Form Architecture Decision"

// Examples of BAD entities (should be in files):
// - "Current Task"
// - "Today's Progress"
// - "Session State"
```

---

### Scenario 9: Todos File Sync with TodoWrite

**Purpose**: Verify TodoWrite UI and current-todos.md stay synchronized

**Steps**:

1. Update TodoWrite in UI
2. Immediately update current-todos.md file
3. Verify both show same information
4. Simulate context compaction
5. Verify current-todos.md persists while TodoWrite lost
6. Recreate TodoWrite from current-todos.md

**Expected Results**:

- [x] Both TodoWrite and file show same tasks
- [x] Both show same completion status
- [x] Both show same progress percentage
- [x] After compaction, file survives
- [x] TodoWrite can be recreated from file
- [x] No information loss

**Files to Check**:

- `.agent/task/current-todos.md`
- TodoWrite UI (compare against file)

---

### Scenario 10: Documentation Agent (synthesize-docs)

**Purpose**: Verify synthesize-docs agent workflow

**Steps**:

1. Complete feature implementation
2. Invoke synthesize-docs sub-agent
3. Verify agent reads session file to understand what was done
4. Verify agent creates SOP in `.agent/sops/`
5. Verify agent does NOT update current-session.md
6. Parent notes SOP creation in session file

**Expected Results**:

- [x] synthesize-docs reads current-session.md first
- [x] SOP file created in `.agent/sops/[topic].md`
- [x] SOP documents procedure for repeatable task
- [x] current-session.md NOT modified by sub-agent
- [x] Parent updates session file: "SOP created at [path]"

**Files to Check**:

- `.agent/sops/[topic].md` (new SOP)
- `.agent/task/current-session-[timestamp].md` (parent notes SOP)

---

### Scenario 11: System Mapping Agent (map-system)

**Purpose**: Verify map-system agent workflow

**Steps**:

1. Make system changes (e.g., add Prisma models, API endpoints)
2. Invoke map-system sub-agent
3. Verify agent scans system
4. Verify agent updates `.agent/system/` docs
5. Verify agent does NOT update current-session.md
6. Parent notes system docs update in session file

**Expected Results**:

- [x] map-system scans relevant system areas
- [x] System docs updated: `.agent/system/database-schema.md` or `.agent/system/api-catalog.md`
- [x] current-session.md NOT modified by sub-agent
- [x] Parent updates session file: "System docs updated"

**Files to Check**:

- `.agent/system/database-schema.md` or similar
- `.agent/task/current-session-[timestamp].md`

---

### Scenario 12: Full Phase Completion

**Purpose**: End-to-end test of complete phase workflow

**Steps**:

1. Start new phase
2. Create session file and todos
3. Complete 5-8 tasks
4. Invoke 2-3 sub-agents
5. Update files throughout
6. Complete phase
7. Update STATUS.md checkpoint
8. Capture strategic knowledge to Memory MCP
9. Archive session files

**Expected Results**:

- [x] All tasks completed and tracked in todos file
- [x] Session file documents complete timeline
- [x] All sub-agent reports saved
- [x] STATUS.md updated with phase completion
- [x] Strategic knowledge captured in Memory MCP
- [x] Session files archived
- [x] Ready to start next phase

**Files to Check**:

- `.agent/task/current-todos.md` (100% complete)
- `.agent/task/current-session-[timestamp].md`
- All sub-agent reports in `.agent/task/`
- `STATUS.md` (checkpoint)
- `.agent/task/archive/` (old sessions)

---

### Scenario 13: Auto-Save Before Context Compaction

**Purpose**: Verify automatic save triggers at 80% context threshold (160K tokens)

**Simulation Steps**:

1. Start session with normal work
2. Monitor token usage progression
3. Simulate reaching 160K tokens (80% threshold)
4. Verify auto-save triggers automatically
5. Verify one-time trigger (no re-trigger)
6. Verify all files updated (session, todos, STATUS.md)
7. Verify brief notification shown
8. Continue work after auto-save
9. Simulate reaching 180K tokens
10. Verify no re-trigger of auto-save
11. Test manual compaction after auto-save
12. Verify recovery works with auto-saved state

**Expected Results**:

- [x] Auto-save triggers exactly at 160K tokens
- [x] Brief notification: "💾 Auto-save at 160K tokens (80%)..."
- [x] Session file updated with latest progress
- [x] Session file includes metadata: "**Auto-Save**: Triggered at 160K tokens (YYYY-MM-DD HH:MM)"
- [x] Todos file updated with task statuses and percentages
- [x] STATUS.md updated with "Last Task Completed" and "Last Checkpoint"
- [x] Confirmation shown: "✅ Progress saved. Manual compaction recommended."
- [x] Auto-save triggers ONLY ONCE per session
- [x] No re-trigger when passing 170K, 180K, etc.
- [x] Token cost ~450 tokens total
- [x] 40K token buffer remains after save
- [x] Manual compaction works correctly
- [x] Recovery after compaction uses auto-saved state

**Files to Check**:

- `.agent/task/current-session-[timestamp].md` (has auto-save metadata)
- `.agent/task/current-todos.md` (updated at 160K)
- `STATUS.md` (checkpoint updated at 160K)
- Token usage warnings in console

**Test Commands**:

```bash
# Check session file has auto-save metadata
grep "Auto-Save" .agent/task/current-session-*.md

# Verify STATUS.md checkpoint updated
grep "Last Checkpoint" STATUS.md

# Check todos file recent update time
ls -l .agent/task/current-todos.md
```

**Failure Detection**:

```bash
# Auto-save NOT triggered at 160K
# Token usage: 165K/200K - No auto-save message seen

# Auto-save triggered multiple times
# Token usage: 170K/200K - Second auto-save message (WRONG!)

# Files not updated
git diff .agent/task/current-session-*.md
# Should show auto-save metadata addition
```

**Success Criteria**:

- Auto-save triggers at exactly 160K tokens (±1K tolerance)
- Triggers one time only per session
- All 3 files updated (session, todos, STATUS.md)
- Silent operation with only brief notification
- Token cost ~450 tokens
- Manual compaction recommended in message
- User can safely continue or compact

---

## 🔍 Validation Points

### File Structure Checks

**Session Files**:

- [ ] Filename uses `YYYYMMDD-HHMM` format
- [ ] Contains "Progress This Session" section
- [ ] Contains "Sub-Agent Reports" section
- [ ] Contains "Next Steps" section
- [ ] Timestamps in `HH:MM` format

**Todos Files**:

- [ ] Contains "Completed", "In Progress", "Pending" sections
- [ ] Shows progress percentage
- [ ] Shows estimated remaining time
- [ ] Shows last milestone
- [ ] Task completion timestamps included

**Sub-Agent Reports**:

- [ ] Filename includes agent type and topic
- [ ] Uses correct timestamp format
- [ ] Contains detailed analysis/plan/documentation
- [ ] Includes recommendations for parent agent

### Workflow Checks

**Sub-Agent Behavior**:

- [ ] Reads context files BEFORE starting work
- [ ] Does NOT update current-session.md
- [ ] Saves output to own report file
- [ ] Returns file path in message
- [ ] Tells parent to update session file

**Parent Agent Behavior**:

- [ ] Creates/updates session file
- [ ] Updates todos file
- [ ] Reads sub-agent reports
- [ ] Integrates findings into session file
- [ ] Updates STATUS.md at checkpoints

### Recovery Checks

**After Context Compaction**:

- [ ] Can find latest session file
- [ ] Can identify in-progress task
- [ ] Can resume work immediately
- [ ] No information loss

**After Session Interruption**:

- [ ] All progress persisted in files
- [ ] Can recover next day
- [ ] Recovery takes < 2 minutes

---

## 🚨 Failure Modes to Test

### Failure Mode 1: Sub-Agent Updates Session File

**Symptom**: Sub-agent modifies `current-session.md`

**Detection**: Check git diff after sub-agent invocation

```bash
git diff .agent/task/current-session-*.md
# Should show NO changes from sub-agent
```

**Fix**: Update sub-agent prompt to clarify parent owns session file

---

### Failure Mode 2: Files Not Created

**Symptom**: Session or todos file missing

**Detection**: Check file existence

```bash
ls .agent/task/current-session-*.md
ls .agent/task/current-todos.md
```

**Fix**: Follow session start procedure from templates

---

### Failure Mode 3: Sub-Agent Report Not Found

**Symptom**: Parent can't find sub-agent report file

**Detection**: Parent agent error reading report

**Fix**: Verify sub-agent saved file with correct timestamp format

---

### Failure Mode 4: TodoWrite Sync Lost

**Symptom**: current-todos.md and TodoWrite UI show different information

**Detection**: Manual comparison

**Fix**: Update one based on the other (prioritize file if conflict)

---

### Failure Mode 5: Recovery Workflow Confusion

**Symptom**: Can't determine where to resume after interruption

**Detection**: Unclear "last completed task" or multiple in-progress tasks

**Fix**:

- Check STATUS.md for last checkpoint
- Find latest session file
- Look for "🔄 IN PROGRESS" in todos file
- Follow most recent task

---

## 📊 Test Metrics

**Track these metrics during testing**:

| Metric                                | Target | Actual |
| ------------------------------------- | ------ | ------ |
| Session file creation success         | 100%   |        |
| Todos file creation success           | 100%   |        |
| Sub-agent context file reads          | 100%   |        |
| Sub-agent report file creation        | 100%   |        |
| Sub-agents NOT updating session file  | 100%   |        |
| Parent integrating sub-agent findings | 100%   |        |
| Recovery success after compaction     | 100%   |        |
| Recovery success after interruption   | 100%   |        |
| Information loss events               | 0      |        |
| File sync issues                      | 0      |        |

---

## 📝 Test Execution Log Template

```markdown
# Test Execution: [Scenario Name]

**Date**: [YYYY-MM-DD]
**Tester**: [Name or Agent]
**Result**: [PASS/FAIL]

## Steps Executed

1. [Step 1] - [Result]
2. [Step 2] - [Result]
3. [Step 3] - [Result]

## Files Created/Modified

- [File path] - [Status]
- [File path] - [Status]

## Issues Encountered

- [Issue description]
- [Fix applied]

## Notes

[Any additional observations]
```

---

## 🎯 Success Criteria

**The persistence system is working correctly when**:

1. ✅ Every session creates a session file
2. ✅ Every phase creates a todos file
3. ✅ Every sub-agent reads context files first
4. ✅ Every sub-agent saves report to file
5. ✅ No sub-agent modifies current-session.md
6. ✅ Parent agent updates session file after reading sub-agent reports
7. ✅ Work can be recovered 100% after context compaction
8. ✅ Work can be resumed 100% after session interruption
9. ✅ No information is ever lost
10. ✅ Files and TodoWrite stay synchronized

---

## 📚 Related Documentation

- [.agent/testing/persistence-validation-checklist.md](.agent/testing/persistence-validation-checklist.md) - Validation checklist
- [.agent/workflows/persistence-rules.md](.agent/workflows/persistence-rules.md) - Persistence rules
- [.agent/task/README.md](.agent/task/README.md) - Task context system
- [CLAUDE.md](../../CLAUDE.md) - Integration guide

---

**Remember**: These tests validate that NO work is EVER lost!
