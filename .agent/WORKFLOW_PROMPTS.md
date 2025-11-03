# Workflow Prompts Guide

**Version**: 1.0
**Last Updated**: 2025-10-26
**Purpose**: Document all prompts needed for daily workflow, optional features, and maintenance

---

## Quick Reference

### Your Daily Workflow (90% of Time)

```
You: "Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase"
Claude: [Does everything automatically]
```

**That's it!** Everything else is automatic.

### When You Need More

| Scenario            | Prompt                                                                                        | Frequency                           |
| ------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| Start session       | `Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase` | Daily                               |
| Continue work       | `Continue`                                                                                    | As needed                           |
| Troubleshooting     | (See keywords below)                                                                          | Rare                                |
| Generate SOP        | `/update-doc after-feature`                                                                   | After major features (optional)     |
| Generate skill      | `/update-doc skill [topic]`                                                                   | When new patterns emerge (optional) |
| Check pattern drift | `/refresh-skills`                                                                             | Monthly                             |

---

## 1. Daily Workflow (Minimal - Your Current Process)

### Session Start

**Your Prompt:**

```
Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase
```

**What Happens Automatically:**

1. ✅ I read STATUS.md to identify current phase
2. ✅ I read docs/13-Project-Plan.md (roadmap) and docs/12-Backlog.md (stories) to understand scope
3. ✅ I create `.agent/task/current-session-[timestamp].md`
4. ✅ I load skill frontmatter (7 skills × 20 tokens = 140 tokens)
5. ✅ I auto-detect required skills based on phase keywords:
   - "API endpoint" → loads `api-patterns` skill
   - "database schema" → loads `database-patterns` skill
   - "React component" → loads `component-patterns` skill
   - "port 3000" → loads `port-config` skill
   - etc.
6. ✅ I start implementation following patterns

**Token Usage**: ~5,800 tokens (vs 21,662 baseline = 74% reduction)

**No additional prompts needed!**

---

### During Work (Continuation)

**Your Prompts:**

```
Continue
```

or

```
Continue with next task
```

**What Happens Automatically:**

1. ✅ I check current-session.md for context
2. ✅ I continue from where I left off
3. ✅ I auto-load any new skills needed
4. ✅ I invoke sub-agents if research needed
5. ✅ I invoke expert agents if deep expertise needed
6. ✅ I update current-session.md after each step

**Token Usage**: Stays lean (~5,800 - 6,200 tokens peak)

**No additional prompts needed!**

---

### After Feature Implementation

**Minimal (Automatic):**

```
[No prompt needed - I commit automatically]
```

**What Happens Automatically:**

1. ✅ I run tests if they exist
2. ✅ I commit with conventional commit message
3. ✅ I update current-session.md with completion notes

**Token Usage**: ~6,000 tokens

**No additional prompts needed!**

---

## 2. Test-Driven Development (TDD) - ALL Tasks

**CRITICAL**: TDD workflow applies to **ALL implementation tasks** (not just complex ones).

### TDD Workflow (Automatic)

When you say: "Implement X feature"

**I automatically follow TDD:**

1. **🔴 RED Phase** - Write failing test first

   ```
   You: "Implement POST /api/issues endpoint"
   Me: "Starting TDD workflow...

       Step 1: Writing failing test first..."
       [Creates __tests__/api/issues.test.ts]
       [Runs test: FAILS ✗]
   ```

2. **🟢 GREEN Phase** - Write minimal code to pass

   ```
   Me: "Step 2: Implementing minimal code..."
       [Creates app/api/issues/route.ts]
       [Runs test: PASSES ✓]
   ```

3. **🔵 REFACTOR Phase** - Improve code quality
   ```
   Me: "Step 3: Refactoring for quality..."
       [Extracts validation schema]
       [Improves error handling]
       [Runs test: STILL PASSES ✓]
   ```

**Repeat for edge cases and error handling.**

### Why TDD for ALL Tasks

1. **Prevents bugs**: Catches issues before code review
2. **Better design**: Forces clean API design
3. **Confidence**: Refactor freely with test safety net
4. **Documentation**: Tests serve as executable docs
5. **Dependency clarity**: Tests reveal missing dependencies early

### TDD Examples

**API Endpoint:**

```typescript
// Test first (🔴 RED)
expect(response.status).toBe(201);
expect(data.title).toBe('Test Issue');

// Then implement (🟢 GREEN)
export async function POST(request) {
  const issue = await prisma.issue.create(...);
  return NextResponse.json({ data: issue }, { status: 201 });
}

// Then refactor (🔵 REFACTOR)
// - Extract validation
// - Add error handling
// - Optimize query
```

**React Component:**

```typescript
// Test first (🔴 RED)
render(<IssueCard issue={mockIssue} />);
expect(screen.getByText('Test Issue')).toBeInTheDocument();

// Then implement (🟢 GREEN)
export function IssueCard({ issue }) {
  return <div>{issue.title}</div>;
}

// Then refactor (🔵 REFACTOR)
// - Add neumorphic styling
// - Improve accessibility
// - Extract sub-components
```

**See**: [.claude/skills/projectpulse/testing-patterns.md](.claude/skills/projectpulse/testing-patterns.md) for full examples

---

## 2.5: Progress Persistence (Automatic)

**This is 100% automatic - no prompts needed!**

### What I Track Automatically

**Every major step (Tier 1)**:

- Update `current-session.md` with what I just did
- Update `current-todos.md` with task status
- Token cost: ~200 tokens

**Every milestone (Tier 2)**:

- Update STATUS.md with checkpoint
- Commit to git
- Token cost: ~500 tokens

**Every phase (Tier 3)**:

- Optional Memory MCP with insights
- Token cost: ~1000 tokens

### Automatic Pre-Compaction Save (NEW)

**When token usage ≥ 160K (80% of 200K limit)**:

**I automatically**:

1. **Check threshold** after each tool use
   - Monitor token usage from system warnings
   - Compare against 160K threshold
   - Check if auto-save already triggered this session

2. **Trigger auto-save** (one-time per session):

   ```
   IF token_usage >= 160000 AND auto_save_triggered == false:
       trigger_auto_save()
       set auto_save_triggered = true
   ```

3. **Execute save sequence**:
   - Brief notification: "💾 Auto-save at 160K tokens (80%)..."
   - Update `current-session-[timestamp].md` with latest progress
   - Update `current-todos.md` with task completion status
   - Update `STATUS.md` with checkpoint (Last Task Completed, Last Checkpoint date)
   - Add metadata to session file: "**Auto-Save**: Triggered at 160K tokens (YYYY-MM-DD HH:MM)"
   - Confirmation: "✅ Progress saved. Manual compaction recommended."

4. **Token cost**: ~450 tokens total

**Why this helps**:

- Saves progress before auto-compaction (typically ~200K)
- Leaves 40K token buffer for manual action
- User can review and decide: manually compact OR start new session
- All progress safely persisted

**What you'll see**:

```
💾 Auto-save at 160K tokens (80%)... ✅ Progress saved. Manual compaction recommended.
```

**After auto-save**:

- You should review progress
- Manually trigger context compaction OR
- Start new session for next major task
- Avoid continuing past 180K (auto-compaction risk)

### If You Need to Resume

**After context compaction**:

```
You: "Read current-session file and continue"
Me: [Reads latest session + todos]
    [Continues from last in-progress task]
```

**After closing Claude**:

```
You: "Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue"
Me: [Reads STATUS.md checkpoint]
    [Reads current-session file]
    [Reads current-todos.md]
    [Resumes from exactly where we left off]
```

**Token cost for recovery**: ~1,500 tokens (vs losing all progress!)

### Why This Matters

**Problem we solved**:

- Long sessions hit context limits → progress lost
- Session interrupted → forget what was in progress
- TodoWrite list lost on compaction → don't know what's left

**Solution**:

- **Tier 1**: Real-time files survive compaction
- **Tier 2**: STATUS.md checkpoints survive interruptions
- **Tier 3**: Memory MCP captures long-term knowledge

**Result**: Never lose progress, ever! ✅

**See**: [CLAUDE.md](../CLAUDE.md#3-tier-persistence-strategy-automatic) for complete workflow

---

## 3. Dependency Mapping (Automatic)

**Tasks in docs/13-Project-Plan.md and docs/12-Backlog.md include dependency mapping.**

### What Dependency Mapping Prevents

❌ **Without Dependencies:**

```
Task: Implement comment system
Problem: Issue model doesn't exist yet → fails
```

✅ **With Dependencies:**

```
Task: Implement comment system
Dependencies:
  - Issue model created
  - IssueComment model in schema
  - Database seeded with comments
Result: Implementation succeeds!
```

### How I Use Dependencies

**When you say:** "Implement X feature"

**I automatically:**

1. Check dependencies in docs/13-Project-Plan.md and docs/12-Backlog.md
2. Verify all dependencies exist
3. Warn if dependency missing:

   ```
   Me: "⚠️ Dependency check failed:
       - IssueComment model not in Prisma schema

       Options:
       1. Create IssueComment model first
       2. Proceed without comments (limited functionality)

       Which would you like?"
   ```

### Dependency Examples

**From docs/13-Project-Plan.md:**

```markdown
**Day 4: Issue Detail Page**

Dependencies:

- Day 3 complete (Issues List page exists)
- Prisma schema with IssueComment model
- Database seeded with comment records
- Issue detail mockup provided
- Server Actions pattern established
- Zod validation utilities available

Tasks:

1. Transform Issue Detail page...
2. Create comment system...
```

**I check each dependency before starting implementation.**

---

## 4. Optional Enhancements (Power User Features)

These are **optional** - only use if you want extra documentation or pattern capture.

### Generate SOP from Implementation

**When:** After completing a major feature with new patterns

**Prompt:**

```
/update-doc after-feature
```

**What Happens:**

1. Invokes `synthesize-docs` sub-agent
2. Reviews implementation files
3. Extracts procedures and patterns
4. Creates SOP in `.agent/sops/[topic].md`
5. Updates `.agent/README.md` index

**Result:** Comprehensive SOP (2,000-3,000 tokens) saved for future reference

**Example:**

```
You: "/update-doc after-feature"
Claude: [Analyzes your webhook implementation]
        [Creates .agent/sops/webhook-integration.md]
        [3,200 tokens saved - SOP ready for future use]
```

**Use Case:** When you implement something complex that you'll do again later

---

### Generate Skill from Patterns

**When:** After implementing 3-5 similar features with consistent patterns

**Prompt:**

```
/update-doc skill [topic]
```

**What Happens:**

1. Invokes `explore-codebase` to detect patterns
2. Analyzes 5-10 recent implementations of [topic]
3. Extracts 3-5 consistent patterns
4. Invokes `synthesize-docs` to create skill
5. Saves skill to `.claude/skills/projectpulse/[topic].md` (50-280 tokens)
6. Updates skill index

**Result:** Token-efficient skill (90-95% smaller than SOP)

**Example:**

```
You: "/update-doc skill webhook-validation"
Claude: [Scans 7 webhook endpoints]
        [Identifies validation patterns]
        [Creates skill: 220 tokens vs 3,000 in full docs = 93% savings]
        [Skill auto-loads in future webhook tasks]
```

**Use Case:** When you notice you're doing the same thing repeatedly and want it automated

---

### Force Sub-Agent Invocation

**When:** You want research before implementation (rare)

**Prompts:**

**Explore Codebase:**

```
Scan the codebase for [pattern/feature] before we start
```

**Analyze Architecture:**

```
Trace how [feature] works across the codebase before we implement
```

**Get Expert Opinion:**

```
Consult the prisma-expert about this schema design before we start
```

**What Happens:**

- I invoke the appropriate sub-agent/expert
- Sub-agent creates detailed report
- I read report and proceed with implementation

**Use Case:** When you want thorough research before touching code (rare - I usually do this automatically when complexity is high)

---

## 3. Maintenance Prompts (Periodic)

### Monthly Pattern Drift Check

**When:** First of each month, or when patterns seem outdated

**Prompt:**

```
/refresh-skills
```

or

```
/refresh-skills all
```

**What Happens:**

1. Scans codebase for current patterns
2. Compares to each skill
3. Calculates drift percentage:
   - <10%: Low (monitor)
   - 10-29%: Medium (update suggested)
   - 30%+: High (refresh recommended)
4. Shows drift report
5. Prompts for approval before updating

**Example Output:**

```
Skill Drift Report:
✅ api-patterns: 3% drift (low - no action needed)
⚠️ database-patterns: 15% drift (medium - update suggested)
🚨 component-patterns: 35% drift (high - refresh recommended)

Update component-patterns? (y/n)
```

**Frequency:** Monthly, or when you notice patterns changed

---

### Quarterly System Audit

**When:** Every 3 months

**Prompt:**

```
Run a full system audit - check token usage, skill coverage, and documentation quality
```

**What Happens:**

1. Measures current token usage vs baseline
2. Checks skill coverage of common patterns
3. Identifies gaps or outdated documentation
4. Recommends updates

**Frequency:** Quarterly

---

## 4. Troubleshooting Prompts (Rare)

### When Skills Don't Auto-Load

**Symptom:** You notice I'm not following established patterns

**Prompt:**

```
Load the [skill-name] skill before continuing
```

**Example:**

```
You: "Load the api-patterns skill before continuing"
Claude: [Loads api-patterns skill: +220 tokens]
        [Now following API patterns]
```

**Why This Happens:** Keyword matching missed, or skill trigger needs updating

**Fix:** Use prompt above, then later run `/refresh-skills [skill-name]` to update triggers

---

### When Sub-Agent Doesn't Trigger

**Symptom:** I start implementing without researching first (rare)

**Prompt:**

```
Before implementing, use [sub-agent] to analyze this first
```

**Examples:**

```
Before implementing, use explore-codebase to find existing patterns
```

```
Before implementing, use analyze-architecture to trace the data flow
```

```
Before implementing, use prisma-expert to design the schema
```

**Why This Happens:** Task complexity under-estimated, or keywords didn't trigger

**Fix:** Use prompt above to force invocation

---

### When Context Lost After Compaction

**Symptom:** Conversation reaches token limit, context lost

**Prompt:**

```
Read .agent/task/current-session-[timestamp].md to restore context
```

**What Happens:**

- I read the session context file
- I review sub-agent reports
- I continue from where we left off

**Why This Happens:** Natural conversation compaction at ~200K tokens

**Fix:** Context file workflow prevents total loss - just re-read the file

---

### When Port Issue Returns

**Symptom:** Port 3000 shows default Next.js page

**Keywords That Auto-Load `port-config` skill:**

- "port 3000"
- "port 3002"
- "localhost not working"
- "default next page"

**Manual Prompt (if auto-load fails):**

```
Fix the port configuration issue
```

**What Happens:**

- I auto-load `port-config` skill (150 tokens)
- I follow quick fix procedure
- If that fails, I read full `.agent/sops/port-troubleshooting.md`

---

### When Database Connection Fails

**Symptom:** Prisma errors, ECONNREFUSED

**Keywords That Auto-Load `database-connection` skill:**

- "prisma error"
- "database connection"
- "ECONNREFUSED"
- "can't connect to database"

**Manual Prompt (if auto-load fails):**

```
Fix the database connection issue
```

**What Happens:**

- I auto-load `database-connection` skill (180 tokens)
- I follow quick fix procedure
- If that fails, I investigate further

---

## 5. Advanced Scenarios

### Gemini Integration (Deep Analysis)

**When:** Analysis requires >100K tokens (entire codebase review)

**Prompt:**

```
I need to analyze the entire codebase for [purpose]. Should we use Gemini?
```

**What I'll Say:**

```
This needs Gemini's 1M context window.
Run: analyze-with-gemini '[purpose]'
Then tell me to read the results!
```

**Your Next Step:**

```bash
# In terminal
analyze-with-gemini 'Find all tech debt and suggest refactoring'

# After completion
```

```
You: "Read the Gemini analysis file"
Claude: [Reads .agent/gemini/analysis-[timestamp].md]
        [Implements fixes based on recommendations]
```

**Use Case:** System-wide migrations, full codebase audits, major refactoring

**See:** [SIMPLE_GEMINI_WORKFLOW.md](../SIMPLE_GEMINI_WORKFLOW.md)

---

### PR Creation

**When:** Feature complete, ready for review

**Prompt:**

```
Create a pull request for this feature
```

**What Happens Automatically:**

1. ✅ I check git status and branch
2. ✅ I review all commits in branch
3. ✅ I analyze changes vs main branch
4. ✅ I create PR with:
   - Summary of changes
   - Test plan
   - Breaking changes (if any)
5. ✅ I return PR URL

**No special prompt needed!**

---

### Multi-Phase Sessions

**When:** Working on multiple phases in one session

**Your Prompt (after completing Phase 3):**

```
Continue to Phase 4
```

or

```
Move to next phase
```

**What Happens Automatically:**

1. ✅ I mark Phase 3 complete in current-session.md
2. ✅ I read Phase 4 requirements from docs/13-Project-Plan.md and docs/12-Backlog.md
3. ✅ I unload Phase 3 skills (if no longer needed)
4. ✅ I load Phase 4 skills
5. ✅ I start Phase 4 implementation

**Token Usage:** Skills unload/reload keeps context lean

---

## 6. Keyword-Based Auto-Loading

### How It Works

I automatically load skills based on keywords in:

- Phase description in docs/13-Project-Plan.md and docs/12-Backlog.md
- Your prompts
- Current task context

### Skill Triggers Reference

**api-patterns** (220 tokens)

- Triggers: "API endpoint", "route handler", "request validation", "API response"
- Loads: Zod validation, error handling, response formatting

**component-patterns** (280 tokens)

- Triggers: "React component", "UI component", "form component", "client component"
- Loads: shadcn/ui, composition, Server vs Client Components

**database-patterns** (200 tokens)

- Triggers: "database query", "Prisma", "schema", "migration", "SQL"
- Loads: Query optimization, relations, transactions

**testing-patterns** (240 tokens)

- Triggers: "test", "unit test", "E2E test", "integration test"
- Loads: Jest, React Testing Library, Playwright patterns

**git-workflow** (180 tokens)

- Triggers: "commit", "branch", "merge", "PR", "pull request"
- Loads: Conventional commits, branch naming, workflow

**port-config** (150 tokens)

- Triggers: "port 3000", "port 3002", "localhost not working"
- Loads: Port troubleshooting quick fix

**database-connection** (180 tokens)

- Triggers: "prisma error", "database connection", "ECONNREFUSED"
- Loads: Connection troubleshooting quick fix

**Total Frontmatter**: 7 skills × 20 tokens = 140 tokens (always loaded)
**Full Content**: Loaded only when skill invoked

---

## 7. Token Budget Awareness

### When to Worry About Tokens

**Session Token Counter:**

- Green (<100K): ✅ Plenty of room, continue normally
- Yellow (100-150K): ⚠️ Monitor, but still good
- Orange (150-180K): 🟧 Approaching limit, consider wrapping up soon
- Red (>180K): 🔴 Near limit, finish current task and start new session

**I'll automatically warn you when approaching limit:**

```
⚠️ Token usage: 165K/200K (82.5%)
Consider finishing this task and starting a new session.
```

### Session Capacity

**With Skills System:**

- Session start: ~5,640 tokens (2.8% of budget)
- After 10 tasks: ~58,700 tokens (29.4% of budget)
- After 20 tasks: ~117,400 tokens (58.7% of budget)
- After 30 tasks: ~176,100 tokens (88.1% of budget)
- **Maximum: ~34 tasks before hitting 200K limit**

**Without Skills (Old System):**

- Session start: ~21,662 tokens (10.8% of budget)
- After 5 tasks: ~108,310 tokens (54% of budget)
- After 9 tasks: ~194,958 tokens (97.5% of budget)
- **Maximum: ~9 tasks before hitting 200K limit**

**You have 3.8x more capacity with the skills system!**

---

## 8. Common Workflows

### Scenario: New API Endpoint

**Your Prompt:**

```
Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase
```

**Automatic Flow:**

1. Read STATUS.md: Phase = "Implement POST /api/issues endpoint"
2. Read docs/13-Project-Plan.md and docs/12-Backlog.md: Requirements, acceptance criteria
3. Create `.agent/task/current-session-[timestamp].md`
4. Detect keywords: "API endpoint" → Load `api-patterns` skill (+220 tokens)
5. Follow skill patterns:
   - Zod validation schema
   - Error handling
   - Response formatting
6. Implement endpoint
7. Run tests
8. Commit with conventional message
9. Update current-session.md

**Your Input:** 1 prompt at start
**My Actions:** 9 automatic steps
**Token Usage:** ~6,060 tokens peak → 5,640 after (skill unloads)

---

### Scenario: Troubleshooting Port Issue

**Your Prompt:**

```
Port 3000 is showing the default Next.js page, not my app
```

**Automatic Flow:**

1. Detect keywords: "port 3000", "default Next.js page"
2. Auto-load `port-config` skill (+150 tokens)
3. Follow quick fix:
   - Check dev server port
   - Remove PORT from .env.local
   - Kill node processes
   - Restart dev server
4. Verify resolution
5. If not fixed: Read `.agent/sops/port-troubleshooting.md` (full guide)

**Your Input:** 1 prompt describing issue
**My Actions:** 4-5 automatic steps
**Token Usage:** ~5,790 tokens peak → 5,640 after

---

### Scenario: Complex Schema Design

**Your Prompt:**

```
Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase
```

**Automatic Flow:**

1. Read STATUS.md: Phase = "Design database schema for issue tracking"
2. Detect complexity: "database schema", "relations", "design"
3. Invoke `prisma-expert` specialized agent (runs in isolated context)
4. Expert reads current-session.md
5. Expert analyzes requirements
6. Expert creates detailed schema design
7. Expert saves to `.agent/task/prisma-design-20251026-1445.md`
8. I read expert's design
9. I implement schema following design
10. I create migration
11. I update current-session.md

**Your Input:** 1 prompt at start
**My Actions:** 11 automatic steps
**Token Usage in Main Thread:** ~5,800 tokens (expert works in separate context)

---

### Scenario: After Feature Completion (Optional SOP)

**Your Prompt:**

```
/update-doc after-feature
```

**Automatic Flow:**

1. Invoke `synthesize-docs` sub-agent
2. Sub-agent reads current-session.md
3. Sub-agent reviews implementation files
4. Sub-agent extracts procedures:
   - Steps taken
   - Patterns followed
   - Decisions made
   - Common pitfalls
5. Sub-agent creates SOP in `.agent/sops/[topic].md` (~3,000 tokens)
6. Sub-agent updates `.agent/README.md` index
7. Sub-agent returns: "SOP created: .agent/sops/issue-management.md"

**Your Input:** 1 optional prompt after completion
**My Actions:** 7 automatic steps
**Result:** Comprehensive SOP for future reference

---

## 9. Anti-Patterns (What NOT to Do)

### ❌ Don't Manually List Tasks

**Bad:**

```
Today we need to:
1. Create the API endpoint
2. Add validation
3. Write tests
4. Update documentation
```

**Good:**

```
Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase
```

**Why:** STATUS.md and docs/13-Project-Plan.md and docs/12-Backlog.md already contain all tasks. No need to repeat!

---

### ❌ Don't Manually Specify Skills

**Bad:**

```
Load api-patterns, database-patterns, and testing-patterns skills before we start
```

**Good:**

```
Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase
```

**Why:** I auto-detect and load skills based on keywords. Manual loading wastes your time!

---

### ❌ Don't Request Sub-Agent Reports in Chat

**Bad:**

```
Give me a summary of what analyze-architecture found
```

**Good:**

```
[Let me save report to file automatically]
You: "Continue"
```

**Why:** I automatically save reports to `.agent/task/` files. You can read them anytime, and they persist across compaction!

---

### ❌ Don't Manually Create Context Files

**Bad:**

```
Create a context file documenting where we are
```

**Good:**

```
[I create current-session-[timestamp].md automatically at session start]
```

**Why:** This is 100% automatic. Creating manually duplicates work!

---

### ❌ Don't Batch Commits

**Bad:**

```
Wait, don't commit yet, let's do a few more things first
```

**Good:**

```
[Let me commit after each logical unit of work]
```

**Why:** Smaller, focused commits are easier to review and revert if needed. I follow conventional commits automatically!

---

## 10. Pro Tips

### Tip 1: Trust the Automation

The system is designed to handle 90% of workflow automatically. Your minimal prompt is sufficient!

**What's automatic:**

- ✅ Session context creation
- ✅ Skill loading based on keywords
- ✅ Sub-agent invocation when needed
- ✅ Expert invocation for complex design
- ✅ Pattern following from skills
- ✅ Committing with proper messages

**Just start with:** `Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase`

---

### Tip 2: Use Optional Features Sparingly

**Optional prompts are for special cases:**

- `/update-doc after-feature` - Only after major features you'll repeat
- `/update-doc skill [topic]` - Only after 3-5 similar implementations
- `/refresh-skills` - Only monthly, or when patterns clearly changed

**Don't over-use!** The system works best when you let automation handle routine work.

---

### Tip 3: Let Skills Unload

After a task completes, skills auto-unload. This keeps context lean for the entire session.

**Don't worry if you see:**

```
✅ Task complete
✅ api-patterns skill unloaded
Token usage: 5,640 (back to baseline)
```

**This is good!** The skill will auto-load again when needed.

---

### Tip 4: Context Files Survive Compaction

When conversation reaches 200K tokens, Claude Code will compact it. **Your context persists** because:

1. Session context in `.agent/task/current-session-[timestamp].md`
2. Sub-agent reports in `.agent/task/[report]-[timestamp].md`
3. Skills reload automatically based on keywords

**After compaction, just say:**

```
Read .agent/task/current-session-[timestamp].md and continue
```

---

### Tip 5: Monitor Token Counter

Claude Code shows token usage in status bar:

- Watch it during long sessions
- If approaching 180K, consider wrapping up
- Start new session for fresh context

**With skills system:** You can do 30+ tasks before hitting limit!

---

## 11. Summary

### Your Workflow (90% of Time)

**Session Start:**

```
Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase
```

**During Work:**

```
Continue
```

**That's it!** Everything else is automatic.

---

### Optional Features

**Generate SOP after major feature:**

```
/update-doc after-feature
```

**Generate skill after 3-5 similar implementations:**

```
/update-doc skill [topic]
```

**Check pattern drift monthly:**

```
/refresh-skills
```

---

### Troubleshooting (Rare)

**Force skill load:**

```
Load the [skill-name] skill before continuing
```

**Force sub-agent:**

```
Before implementing, use [sub-agent] to analyze this first
```

**Restore context after compaction:**

```
Read .agent/task/current-session-[timestamp].md and continue
```

---

### Success Metrics

**Your Workflow Gives You:**

- 74-83% token reduction
- 3.8x session capacity (34 vs 9 tasks)
- 100% automation (no manual reminders)
- Context persistence across compaction
- Pattern consistency across implementations

**All from one starting prompt!** 🚀

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Integration guide
- [WORKFLOW_ENHANCEMENT_SUMMARY.md](WORKFLOW_ENHANCEMENT_SUMMARY.md) - System architecture
- [SIMPLE_GEMINI_WORKFLOW.md](../SIMPLE_GEMINI_WORKFLOW.md) - Gemini integration
- [.claude/skills/projectpulse/README.md](../.claude/skills/projectpulse/README.md) - Skills catalog

---

**The Bottom Line:**

Your workflow is ready. Just say **"Read STATUS.md, docs/13-Project-Plan.md, docs/12-Backlog.md and continue with current phase"** and let the system handle the rest!
