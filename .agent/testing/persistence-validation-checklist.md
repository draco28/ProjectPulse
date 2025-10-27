# Persistence Validation Checklist

**Purpose**: Quick checklist to validate persistence strategy is working correctly.

**Last Updated**: 2025-10-27

---

## 📋 Quick Validation Checklist

Use this checklist **at the end of each session** to verify persistence is working.

---

## ✅ Session Start Validation

**Every session should:**

### File Creation

- [ ] Created `current-session-[YYYYMMDD-HHMM].md` from template
- [ ] Filled in phase from STATUS.md
- [ ] Filled in session start time
- [ ] Created/verified `current-todos.md` exists

### File Content

- [ ] Session file contains correct phase name
- [ ] Session file contains current goals
- [ ] Todos file shows all phase tasks
- [ ] Todos file shows correct completion percentages

**Time**: 2 minutes

---

## ✅ During Session Validation

**After completing each major step:**

### File Updates

- [ ] Updated `current-session.md` with what was done
- [ ] Added timestamp to session update (HH:MM format)
- [ ] Updated `current-todos.md` if task completed
- [ ] TodoWrite UI matches current-todos.md file

### Sub-Agent Checks (if sub-agent invoked)

- [ ] Verified sub-agent read context files first
- [ ] Sub-agent report file created in `.agent/task/`
- [ ] Sub-agent used correct timestamp format (YYYYMMDD-HHMM)
- [ ] Sub-agent did NOT update current-session.md
- [ ] Read sub-agent report file
- [ ] Updated current-session.md with key insights from report

**Frequency**: Every 15-30 minutes or after major step

---

## ✅ Checkpoint Validation

**At significant milestones (phase completion, day end):**

### Checkpoint Files

- [ ] Updated STATUS.md "Last Task Completed" field
- [ ] Updated STATUS.md "Last Checkpoint" date
- [ ] Session file notes checkpoint creation
- [ ] All pending tasks in current-todos.md are valid

### Optional Maintenance

- [ ] Archived old session files to `.agent/task/archive/`
- [ ] Kept only last 5 sub-agent reports per type
- [ ] Verified disk space not filling up

**Frequency**: Phase completion or daily

---

## ✅ Memory MCP Validation

**At phase completion (strategic knowledge capture):**

### Memory MCP Content Check

- [ ] Memory MCP contains ONLY strategic knowledge
- [ ] Memory MCP does NOT contain task progress
- [ ] Memory MCP does NOT contain session state
- [ ] All entities have proper observations
- [ ] All entities include dates
- [ ] Relations link related concepts

### Example Query to Validate

```typescript
// Should show strategic knowledge only
mcp__memory__read_graph();

// GOOD entities: "API Pattern", "Design Decision", "Gotcha"
// BAD entities: "Current Task", "Today's Work", "Session State"
```

**Frequency**: Phase completion only (~weekly)

---

## ✅ Sub-Agent Workflow Validation

**When invoking any sub-agent:**

### Before Invocation

- [ ] Current session file up to date
- [ ] Current todos file up to date
- [ ] Context files contain necessary info for sub-agent

### Sub-Agent Execution

- [ ] Told sub-agent to read context files first
- [ ] Sub-agent confirmed reading context
- [ ] Sub-agent created report file
- [ ] Sub-agent provided file path in return message

### After Sub-Agent Returns

- [ ] Located sub-agent report file
- [ ] Read report file contents
- [ ] Updated current-session.md with summary
- [ ] Continued implementation based on report

**Frequency**: Each sub-agent invocation

---

## ✅ Recovery Workflow Validation

**Test recovery periodically (weekly recommended):**

### Simulate Context Compaction

1. [ ] Note current in-progress task
2. [ ] Close Claude Code
3. [ ] Reopen Claude Code
4. [ ] Read STATUS.md
5. [ ] Find latest session file
6. [ ] Read current-todos.md
7. [ ] Identify in-progress task correctly
8. [ ] Can resume work immediately
9. [ ] No information lost

### Simulate Session Interruption

1. [ ] Note current in-progress task
2. [ ] Close Claude Code (end session)
3. [ ] Reopen next day (new session)
4. [ ] Follow recovery workflow
5. [ ] Verify all progress persisted
6. [ ] Can resume work immediately
7. [ ] No information lost

**Frequency**: Weekly or before major work

---

## ✅ Auto-Save Validation (NEW)

**Verify automatic pre-compaction save feature:**

### Threshold Monitoring

**Check token usage awareness:**

- [ ] I monitor token usage after each tool use
- [ ] I can see system warnings: "Token usage: X/200000"
- [ ] I know when approaching 160K threshold

### Auto-Save Trigger Test

**Simulate high token usage (optional weekly test):**

1. [ ] Note current token usage
2. [ ] Work until approaching 160K tokens
3. [ ] Watch for auto-save trigger at ≥ 160K
4. [ ] Verify brief notification: "💾 Auto-save at 160K tokens (80%)..."
5. [ ] Verify confirmation: "✅ Progress saved. Manual compaction recommended."

### File Updates Verification

**After auto-save triggers, verify:**

- [ ] `current-session-[timestamp].md` updated:

  ```bash
  grep "Auto-Save" .agent/task/current-session-*.md
  # Should show: "**Auto-Save**: Triggered at 160K tokens (YYYY-MM-DD HH:MM)"
  ```

- [ ] `current-todos.md` updated:

  ```bash
  ls -l .agent/task/current-todos.md
  # Check modification time is recent (within last few minutes)
  ```

- [ ] `STATUS.md` updated:
  ```bash
  grep "Last Checkpoint" STATUS.md
  # Should show today's date
  ```

### One-Time Trigger Verification

**Verify no re-trigger:**

- [ ] Auto-save triggered at 160K
- [ ] Continued work past 160K
- [ ] No second auto-save trigger at 170K
- [ ] No third auto-save trigger at 180K
- [ ] Session flag prevents multiple triggers

### Token Cost Check

**After auto-save:**

- [ ] Token usage increased by ~450 tokens
- [ ] Remaining buffer ≥ 35K tokens
- [ ] Total cost acceptable

### Manual Compaction Flow

**After auto-save triggers:**

- [ ] Progress files all up to date
- [ ] Can manually trigger context compaction
- [ ] Recovery from compaction works correctly
- [ ] Uses auto-saved state

**See also**: `.agent/examples/persistence-examples.md` → Example 8 for auto-save timeline.

### What to Look For

**✅ Working correctly when:**

```
Token usage: 159K/200K → No auto-save yet
Token usage: 160K/200K → 💾 Auto-save at 160K tokens (80%)...
                        ✅ Progress saved. Manual compaction recommended.
Token usage: 165K/200K → No re-trigger (already saved)
Token usage: 175K/200K → No re-trigger (flag set)
```

**❌ Problems to fix:**

```
Token usage: 165K/200K → No auto-save message (MISSED TRIGGER)
Token usage: 170K/200K → Second auto-save message (RE-TRIGGERED!)
Token usage: 162K/200K → Auto-save but files not updated (INCOMPLETE)
```

**Frequency**: Test when naturally approaching 160K, or weekly simulation

---

## ✅ File Health Check

**Check file system health weekly:**

### File Count

```bash
# Unix/Mac
ls -1 .agent/task/current-session-*.md | wc -l
# Should be < 10 (archive old ones)

# Windows PowerShell
(Get-ChildItem .agent/task/current-session-*.md).Count
# Should be < 10
```

### Disk Usage

```bash
# Unix/Mac
du -sh .agent/task/
# Should be < 10 MB

# Windows PowerShell
(Get-ChildItem .agent/task -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
# Should be < 10
```

### Sub-Agent Reports

- [ ] Kept last 5 reports per agent type
- [ ] Archived older reports
- [ ] No orphaned report files

**Frequency**: Weekly

---

## 🚨 Red Flags Checklist

**Stop and fix immediately if you see:**

### Critical Issues

- [ ] ❌ Session file missing or not created
- [ ] ❌ Todos file missing
- [ ] ❌ Sub-agent modified current-session.md
- [ ] ❌ Sub-agent didn't create report file
- [ ] ❌ Sub-agent didn't read context files
- [ ] ❌ Can't find latest session file
- [ ] ❌ Can't identify in-progress task after recovery
- [ ] ❌ Information lost after context compaction
- [ ] ❌ TodoWrite and current-todos.md out of sync

### Warning Signs

- [ ] ⚠️ Session file not updated in 60+ minutes
- [ ] ⚠️ Todos file progress not updated
- [ ] ⚠️ More than 10 session files in .agent/task/
- [ ] ⚠️ More than 20 sub-agent reports total
- [ ] ⚠️ .agent/task/ directory > 10 MB
- [ ] ⚠️ Memory MCP contains task progress (should be in files)

---

## 🔧 Quick Fix Reference

### If Session File Missing

```bash
# Create from template
cp .agent/task/templates/current-session-template.md .agent/task/current-session-$(date +"%Y%m%d-%H%M").md
# Fill in details manually
```

### If Todos File Missing

```bash
# Create from template
cp .agent/task/templates/current-todos-template.md .agent/task/current-todos.md
# Fill in current phase todos manually
```

### If Sub-Agent Report Missing

```bash
# Check sub-agent output for file path
# Verify timestamp format (YYYYMMDD-HHMM)
# Create manually if needed with content from conversation
```

### If TodoWrite Out of Sync

```markdown
# Update current-todos.md to match TodoWrite UI

# Or vice versa (prioritize file if conflict)
```

### If Too Many Session Files

```bash
# Unix/Mac: Archive all but last 3
ls -t .agent/task/current-session-*.md | tail -n +4 | xargs -I {} mv {} .agent/task/archive/

# Windows: Archive all but last 3
Get-ChildItem .agent/task/current-session-*.md | Sort-Object LastWriteTime -Descending | Select-Object -Skip 3 | Move-Item -Destination .agent/task/archive/
```

---

## 📊 Validation Metrics Dashboard

**Track these weekly:**

| Metric                          | Last Week | This Week | Target |
| ------------------------------- | --------- | --------- | ------ |
| Sessions with proper files      |           |           | 100%   |
| Sub-agents reading context      |           |           | 100%   |
| Sub-agents NOT updating session |           |           | 100%   |
| Recovery success rate           |           |           | 100%   |
| Information loss events         |           |           | 0      |
| File sync issues                |           |           | 0      |
| Disk space used (MB)            |           |           | < 10   |
| Active session files            |           |           | < 10   |

---

## ✅ Weekly Deep Validation

**Perform once per week:**

### 1. File Structure Audit

- [ ] All session files use correct naming (YYYYMMDD-HHMM)
- [ ] All sub-agent reports use correct naming
- [ ] Templates directory intact
- [ ] Archive directory exists
- [ ] No duplicate or corrupt files

### 2. Content Audit

- [ ] Pick 3 random session files, verify structure
- [ ] Pick 3 random sub-agent reports, verify structure
- [ ] Verify current-todos.md has correct format
- [ ] Verify STATUS.md has checkpoint fields

### 3. Integration Audit

- [ ] Test recovery workflow (simulate compaction)
- [ ] Verify sub-agent can read context
- [ ] Verify parent can read sub-agent reports
- [ ] Verify Memory MCP contains only strategic knowledge

### 4. Performance Check

- [ ] File operations fast (< 1 second)
- [ ] Finding latest session fast (< 2 seconds)
- [ ] Recovery workflow fast (< 2 minutes)
- [ ] No performance degradation over time

**Time**: 15-20 minutes

---

## 🎯 Pass/Fail Criteria

### Must Pass (100%)

- [x] Session file created every session
- [x] Todos file exists and updated
- [x] Sub-agents read context before starting
- [x] Sub-agents save reports to files
- [x] Sub-agents DON'T update session file
- [x] Parent updates session file after reading reports
- [x] Recovery works after context compaction
- [x] Recovery works after session interruption
- [x] Zero information loss

### Should Pass (>95%)

- [ ] Files updated every 30 minutes
- [ ] TodoWrite synced with current-todos.md
- [ ] Checkpoints created at milestones
- [ ] Old files archived regularly
- [ ] Disk space managed well

---

## 📝 Validation Report Template

```markdown
# Persistence Validation Report

**Date**: [YYYY-MM-DD]
**Validator**: [Name or Agent]

## Session Validation

- Session files created: [X/X] ✅/❌
- Todos files updated: [X/X] ✅/❌
- Updates frequent: ✅/❌

## Sub-Agent Validation

- Context reads: [X/X] ✅/❌
- Reports created: [X/X] ✅/❌
- No session updates: [X/X] ✅/❌

## Recovery Validation

- Compaction recovery: ✅/❌
- Interruption recovery: ✅/❌
- Information loss: None/[details] ✅/❌

## File Health

- Session file count: [N] (< 10) ✅/❌
- Disk usage: [X] MB (< 10) ✅/❌
- Reports archived: ✅/❌

## Issues Found

1. [Issue description]
   - Severity: Critical/Warning/Info
   - Fix: [What was done]

2. [Issue description]
   - Severity: Critical/Warning/Info
   - Fix: [What was done]

## Overall Status

✅ PASS - All critical checks passed
❌ FAIL - Critical issues found
⚠️ PARTIAL - Warnings found but not critical

## Recommendations

- [Recommendation 1]
- [Recommendation 2]
```

---

## 🔄 Continuous Validation

**Make validation automatic:**

### Daily Checks (2 minutes)

1. Session file created today? ✅/❌
2. Todos file updated today? ✅/❌
3. Any sub-agents invoked correctly? ✅/❌

### Weekly Checks (15 minutes)

1. Run full deep validation
2. Clean up old files
3. Update validation metrics
4. Document any issues found

### Monthly Checks (30 minutes)

1. Review all validation reports
2. Identify trends or recurring issues
3. Update persistence rules if needed
4. Update templates if needed

---

## 📚 Related Documentation

- [.agent/testing/persistence-test-scenarios.md](.agent/testing/persistence-test-scenarios.md) - Detailed test scenarios
- [.agent/workflows/persistence-rules.md](.agent/workflows/persistence-rules.md) - Persistence rules
- [.agent/scripts/session-management.md](.agent/scripts/session-management.md) - Helper scripts
- [.agent/task/README.md](.agent/task/README.md) - Task context system
- [CLAUDE.md](../../CLAUDE.md) - Integration guide

---

## 💡 Pro Tips

1. **Validate Early, Validate Often**: Don't wait until context compaction to discover files aren't being created.

2. **Automate Where Possible**: Use shell aliases (see session-management.md) to make checks faster.

3. **Fix Issues Immediately**: Don't let bad practices accumulate - fix issues as soon as validation fails.

4. **Document New Issues**: If you find a new failure mode, add it to the test scenarios document.

5. **Review Weekly**: Set a recurring reminder to run the weekly deep validation.

---

**Remember**: This checklist is your safety net. Use it regularly!
