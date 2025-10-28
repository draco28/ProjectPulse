# Cascade Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** 2025-10-28

---

## Common Issues & Solutions

### 🔴 Git Workflow Issues

#### Issue: No Branch Created Before Plan

**Symptom:** Cascade starts creating plan without creating a feature branch

**Cause:** Step 1.5 (branch creation) skipped

**Solution:**

```
"STOP. You violated Step 1.5 protocol.
Create a feature branch RIGHT NOW before proceeding.
Branch format: api/[name], ui/[name], or feature/[name]
Example: git checkout -b feature/issue-filtering
Provide Step 1.5 confirmation."
```

**Prevention:** Always enforce "NO plan without branch" rule

---

#### Issue: Working on Master Branch

**Symptom:** Commits being made directly to master

**Cause:** Forgot to create feature branch

**Solution:**

```
"STOP. You're working on master branch.
Create feature branch from current state:
git checkout -b feature/[name]
All uncommitted changes will move to new branch.
Provide Step 1.5 confirmation."
```

**Prevention:** Check branch at Step 1: `git branch --show-current`

---

#### Issue: Code Committed Before Documentation

**Symptom:** Code commit appears before documentation commit

**Cause:** Step 5 commit order violated

**Solution:**

```
"STOP. You violated Step 5 commit order.
Commit order MUST be:
1. Documentation FIRST (docs/, STATUS.md, COMPLETION_*.md)
2. Code SECOND (apps/, packages/, prisma/)
Reset and recommit in correct order."
```

**Prevention:** Enforce "docs first, code second" rule

---

#### Issue: Merged Without Quality Gates

**Symptom:** Branch merged to master without running tests

**Cause:** Step 6 quality gates skipped

**Solution:**

```
"STOP. You violated Step 6 protocol.
Run ALL quality gates before merging:
1. pnpm lint (must pass)
2. pnpm type-check (must pass)
3. pnpm build (must pass)
4. pnpm test (must pass, 80%+ coverage)
Only merge after ALL gates pass."
```

**Prevention:** Always run quality gates before merge

---

### 🔴 Protocol Issues

#### Issue: Missing Step Confirmations

**Symptom:** Cascade doesn't provide "✅ STEP X COMPLETE" messages

**Cause:** Protocol not enforced or session starter not used

**Solution:**

1. Stop current work
2. Say: "You skipped Step X. Follow the mandatory protocol NOW."
3. Use session starter template from `.cascade/templates/session-starter.md`

**Prevention:** Always start sessions with the protocol template

---

#### Issue: Plan Not Saved

**Symptom:** No confirmation for Step 2, no current-plan.md file

**Cause:** Cascade proceeded to implementation without saving plan

**Solution:**

```
"STOP. You violated Step 2 protocol.
Save the plan to .agent/task/current-plan.md RIGHT NOW.
Create .agent/task/current-todos.md with checkboxes.
Provide Step 2 confirmation."
```

**Prevention:** Enforce "NO code until plan is saved" rule

---

### 🔴 Memory & Context Issues

#### Issue: Memories Not Retrieving

**Symptom:** Cascade doesn't know Golden Rules or agent templates

**Cause:** Memories not created or search not working

**Solution:**

1. Test retrieval: "What are the Golden Rules?"
2. If fails, check: Are 30 memories created? (See CASCADE_MEMORIES.md)
3. Re-create missing memories using create_memory tool

**Validation:**

```
Search for "Golden Rule" → Should retrieve 8 rules
Search for "Agent Template" → Should retrieve 12 templates
Search for "Protocol Step" → Should retrieve 4 steps
```

---

#### Issue: Context Lost After Restart

**Symptom:** Cascade doesn't remember previous session

**Cause:** Session file not read on restart

**Solution:**

1. Find last session: `.agent/task/current-session-[latest].md`
2. Say: "Read .agent/task/current-session-[timestamp].md and resume"
3. Cascade should load context and continue

**Prevention:** Always create session files (Step 1 protocol)

---

### 🔴 Skills & Loading Issues

#### Issue: Skills Not Auto-Loading

**Symptom:** Cascade doesn't apply patterns despite keywords

**Cause:** Keyword detection not triggering or Skills Index missing

**Solution:**

1. Manual load: "Load api-patterns skill"
2. Check Skills Index memory exists
3. Verify keyword mapping in memory

**Keywords that should trigger:**

- "API/endpoint" → api-patterns
- "test/testing" → testing-patterns
- "Component/UI" → component-patterns
- "Database/Prisma" → database-patterns

---

#### Issue: Skill File Not Found

**Symptom:** Error when trying to load skill

**Cause:** Skill file doesn't exist or path incorrect

**Solution:**

1. Check file exists: `.claude/skills/moksha-devhub/[skill-name].md`
2. Verify path in Skills Index memory
3. If missing, skill may not be created yet

**Available Skills:** See `.claude/SKILLS_INDEX.md`

---

### 🔴 Agent Template Issues

#### Issue: Agent Invocation Fails

**Symptom:** "Consult react-expert" doesn't work

**Cause:** Agent template memory not found or prompt incorrect

**Solution:**

1. Check memory exists: Search for "Agent Template: react-expert"
2. Use exact invocation: "Consult react-expert about [topic]"
3. Verify agent template memory created (CASCADE_MEMORIES.md)

**Correct Format:**

```
"Consult react-expert about component architecture"
"Consult next-js-expert about Server/Client decisions"
"Consult prisma-expert about database schema"
```

---

#### Issue: Agent Output Low Quality

**Symptom:** Agent recommendations not helpful

**Cause:** Insufficient context or wrong agent for task

**Solution:**

1. Provide more context in request
2. Use correct agent:
   - react-expert: Component architecture
   - next-js-expert: Server/Client, routing
   - prisma-expert: Database, queries
   - devhub-architect: System design
3. Check agent template memory has detailed expertise

---

### 🔴 File & Session Issues

#### Issue: Session File Not Created

**Symptom:** No file in `.agent/task/current-session-*.md`

**Cause:** Step 1 protocol not followed

**Solution:**

1. Manually create: Say "Create .agent/task/current-session-[YYYYMMDD-HHMM].md"
2. Restart with session starter template
3. Verify Cascade has write permissions to .agent/task/

---

#### Issue: Checkpoint Not Saved

**Symptom:** No checkpoint confirmation at 15K tokens

**Cause:** Token threshold not reached or checkpoint skipped

**Solution:**

1. Check current token usage
2. If >15K, say: "Create checkpoint NOW"
3. Verify current-session-\*.md updated

**Manual Checkpoint:**

```
"Update .agent/task/current-session-[timestamp].md with progress.
Update .agent/task/current-todos.md with completed tasks.
Provide checkpoint confirmation."
```

---

### 🔴 MCP Issues

#### Issue: context7 Not Working

**Symptom:** Can't fetch library documentation

**Cause:** MCP not available or library not found

**Solution:**

1. Test: "Resolve library ID for Next.js"
2. If fails, check MCP available in Windsurf settings
3. Try alternative library name

---

#### Issue: Memory MCP Not Working

**Symptom:** Can't create or retrieve memories

**Cause:** MCP server not running

**Solution:**

1. Check Windsurf MCP settings
2. Restart Windsurf IDE
3. Verify memory MCP enabled

---

### 🔴 Token Usage Issues

#### Issue: Token Usage Too High

**Symptom:** Using >100K tokens for simple tasks

**Cause:** Loading too much context or full files

**Solution:**

1. Use memory summaries instead of full file reads
2. Load skills on-demand only (not preemptively)
3. Implement checkpoints to track usage
4. Use agent consultations in isolated files

**Target Token Usage:**

- Simple task: <6K tokens
- Medium task: <15K tokens
- Complex task: <30K tokens

---

#### Issue: No Token Tracking

**Symptom:** Don't know current token usage

**Cause:** Session file not tracking tokens

**Solution:**

1. Check current-session-\*.md file
2. Add token tracking section
3. Update at each checkpoint

---

### 🔴 TDD Workflow Issues

#### Issue: Cascade Skips Tests

**Symptom:** Implements code without writing tests first

**Cause:** TDD workflow not enforced

**Solution:**

```
"STOP. You violated R-TEST-001 Golden Rule.
Follow TDD workflow:
1. 🔴 RED: Write failing test FIRST
2. 🟢 GREEN: Implement minimal code
3. 🔵 REFACTOR: Improve quality
Start over with the test."
```

---

#### Issue: Tests Not Running

**Symptom:** Test files created but not executed

**Cause:** Test command not run or configuration issue

**Solution:**

1. Run: `pnpm test`
2. Check Jest configuration
3. Verify test file naming (_.test.ts or _.spec.ts)

---

## Error Messages

### "Access to .windsurfrules is prohibited"

**Meaning:** Can't modify .windsurfrules file  
**Solution:** Manually update file or accept current configuration

### "Memory not found"

**Meaning:** Requested memory doesn't exist  
**Solution:** Create memory using CASCADE_MEMORIES.md definitions

### "Skill file not found"

**Meaning:** Skill file missing  
**Solution:** Check path or create skill file

### "Agent template not available"

**Meaning:** Agent memory not created  
**Solution:** Create agent template memory

---

## Validation Checklist

Run this checklist to verify Cascade is working correctly:

### Foundation

- [ ] .windsurfrules file exists and updated
- [ ] 30 memories created (check with search)
- [ ] Templates directory exists (.cascade/templates/)
- [ ] Session starter template available

### Protocol

- [ ] Step 1 confirmation appears
- [ ] Step 2 confirmation appears
- [ ] Step 3 confirmation appears
- [ ] Checkpoint confirmations at 15K intervals
- [ ] Step 5 confirmation appears

### Memories

- [ ] Search "Golden Rule" returns 8 results
- [ ] Search "Agent Template" returns 12 results
- [ ] Search "Protocol Step" returns 4 results
- [ ] Search "project context" returns 5 results

### Skills

- [ ] Skills Index memory exists
- [ ] api-patterns loads on "API" keyword
- [ ] testing-patterns loads on "test" keyword
- [ ] Skills auto-load correctly

### Agents

- [ ] react-expert invocation works
- [ ] next-js-expert invocation works
- [ ] prisma-expert invocation works
- [ ] Agent outputs saved to .agent/task/

### Files

- [ ] Session files created in .agent/task/
- [ ] current-plan.md created
- [ ] current-todos.md created
- [ ] Agent consultation files created

### MCPs

- [ ] context7 can fetch library docs
- [ ] memory MCP working (memories accessible)
- [ ] sequential-thinking available
- [ ] puppeteer available

---

## Getting Help

### Documentation

1. **Quick Start:** QUICK_START.md
2. **Daily Workflow:** CASCADE_WORKFLOW_GUIDE.md
3. **Templates:** CASCADE_TEMPLATES.md
4. **Integration Plan:** CASCADE_INTEGRATION_PLAN.md

### Testing

1. Run validation checklist above
2. Test each component individually
3. Compare with Claude Code workflow

### Recovery

1. Read last session file
2. Resume from checkpoint
3. Re-create missing files

---

**If issues persist, check CASCADE_INTEGRATION_PLAN.md for architecture details or review CLAUDE.md for original workflow.**
