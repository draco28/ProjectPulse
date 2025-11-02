# Cascade Daily Workflow Guide

**Purpose:** How to use Cascade for ProjectPulse development

---

## Daily Workflow (90% of Your Work)

### Morning: Start Session

**Step 1:** Open Windsurf IDE

**Step 2:** Copy-paste session starter:

```
MANDATORY PROTOCOL - Cascade Edition

Current phase: Week 1.5 Phase 3 Day 5 - Knowledge Base Page
Requirements: Implement Knowledge Base page with search, filters, categories

ENFORCE ALL 5 STEPS:
✅ Step 1: Initialize session
✅ Step 2: Save plan BEFORE code
✅ Step 3: Consult experts
✅ Step 4: Checkpoints every 15K tokens
✅ Step 5: Post-completion workflow

IF YOU SKIP ANY STEP, I WILL STOP YOU.

Proceed with Knowledge Base implementation.
```

**Step 3:** Watch for confirmation:

```
✅ STEP 1 COMPLETE: Session initialized at 2025-10-28-1430

Created: .agent/task/current-session-20251028-1430.md
Current phase: Week 1.5 Phase 3 Day 5
Goals: Implement Knowledge Base page with search + filters
Token budget: 6234/200000
```

**What Cascade does automatically:**

- Reads STATUS.md + DEVELOPMENT_PLAN.md
- Creates session file
- Loads relevant memories (Golden Rules, Active Context)
- Loads relevant skills (based on keywords)

---

### During Work: Implementation

**You:** "Implement POST /api/knowledge endpoint"

**Cascade automatically:**

1. Loads skill: api-patterns (detects keyword "API")
2. Loads skill: testing-patterns (TDD mandatory)
3. Follows TDD workflow:
   - 🔴 RED: Writes failing test first
   - 🟢 GREEN: Implements minimal code
   - 🔵 REFACTOR: Improves quality
4. Updates .agent/task/current-todos.md
5. Checkpoints at 15K tokens

**You just say:** "Continue" when needed

---

### Need Expert Advice

**You:** "Need component architecture for search feature"

**Cascade automatically:**

1. Detects keyword "component"
2. Loads memory: "Agent Template: react-expert"
3. Reads .agent/task/current-session.md for context
4. Designs component architecture
5. Saves to .agent/task/react-search-20251028-1445.md
6. Returns: "✅ STEP 3 COMPLETE: Consulted react-expert for search"

**You see:** Confirmation + plan file path

---

### Evening: Complete Phase

**You:** "Complete this phase"

**Cascade automatically:**

1. Runs tests
2. Creates COMPLETION_Phase3_Day5.md
3. Updates STATUS.md (Last Completed section)
4. Updates DEVELOPMENT_PLAN.md (mark phase complete)
5. Commits documentation first
6. Commits code second
7. Returns: "✅ STEP 5 COMPLETE: All documentation updated"

**You verify:** Both commits pushed successfully

---

## Advanced Usage

### Scenario 1: Complex Architecture Decision

**You:** "I need to decide between Server Actions and API routes for issue creation"

**Cascade:**

```
Invoking next-js-expert for this architectural decision...

Reading context: .agent/task/current-session-20251028-1430.md
Analyzing: Server Actions vs API routes for issue creation

Recommendation: Use Server Actions for issue creation because:
1. Tighter integration with Server Components
2. Automatic revalidation handling
3. Progressive enhancement support
4. Simpler error handling

Implementation plan saved to:
.agent/task/nextjs-issue-creation-20251028-1450.md

✅ STEP 3 COMPLETE: Consulted next-js-expert for issue creation architecture
```

### Scenario 2: Database Schema Design

**You:** "Design schema for knowledge base with full-text search"

**Cascade:**

```
Invoking prisma-expert for database schema design...

Reading context: .agent/task/current-session-20251028-1430.md
Reading schema: prisma/schema.prisma

Schema design:
- KnowledgeItem model with tsvector for full-text search
- Relations: KnowledgeItem → Category, KnowledgeItem → Tags
- Indexes: tsvector index, category index
- Migration strategy: Add columns incrementally

Full schema saved to:
.agent/task/prisma-knowledge-schema-20251028-1455.md

✅ STEP 3 COMPLETE: Consulted prisma-expert for knowledge schema
```

### Scenario 3: Performance Optimization

**You:** "The issue list is rendering slowly with 100+ issues"

**Cascade:**

```
Invoking react-expert for performance optimization...

Reading context: Current IssueList component implementation
Analyzing: Render performance bottleneck

Recommendations:
1. Use React.memo for IssueCard component
2. Implement virtual scrolling (react-window)
3. Optimize re-renders with useCallback
4. Lazy load issue details

Implementation plan saved to:
.agent/task/react-issue-list-optimization-20251028-1500.md

✅ STEP 3 COMPLETE: Consulted react-expert for issue list performance
```

---

## Checkpoint System

### Automatic Checkpoints

Cascade automatically checkpoints at:

- 15K tokens
- 30K tokens
- 45K tokens
- 60K tokens
- 75K tokens
- 90K tokens

**What happens:**

```
✅ CHECKPOINT at 30K tokens: Progress saved

Completed since last checkpoint:
- POST /api/knowledge endpoint with Zod validation
- Unit tests for knowledge endpoint (100% coverage)
- GET /api/knowledge with pagination

Current progress: 8/20 tasks complete (40%)
Updated: current-session.md, current-todos.md
Next checkpoint: 45K tokens
```

### Manual Checkpoint

**You:** "Checkpoint" (force checkpoint anytime)

**Cascade:** Updates files and confirms

---

## Session Recovery

### Scenario: Session Interrupted

**You close IDE mid-work, reopen next day**

**You:** "Continue from where we left off"

**Cascade:**

```
Reading latest session: .agent/task/current-session-20251028-1430.md
Reading todos: .agent/task/current-todos.md
Reading phase context from memory...

Resuming from: Implementing GET /api/knowledge endpoint (40% complete)

Last completed:
- POST endpoint with Zod validation
- Unit tests (100% coverage)

Next tasks:
- GET endpoint with pagination
- Full-text search integration
- Category filtering

Continuing implementation...
```

**No context loss!**

---

## Error Handling

### Scenario 1: Skipped Protocol Step

**You:** "Implement the feature" (without starting session)

**Cascade:**

```
❌ PROTOCOL VIOLATION: Step 1 not completed

You must initialize session first:
1. Read STATUS.md + DEVELOPMENT_PLAN.md
2. Create .agent/task/current-session-[timestamp].md
3. Confirm: "✅ STEP 1 COMPLETE"

Please start with session initialization.
```

**You:** Call out the violation, enforce protocol

### Scenario 2: Missing Plan Save

**You:** Notice no "✅ STEP 2 COMPLETE" confirmation

**You:** "You skipped Step 2. Save the plan to current-plan.md RIGHT NOW."

**Cascade:**

```
Apologies. Saving plan immediately...

Created: .agent/task/current-plan.md
Created: .agent/task/current-todos.md

✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md
```

### Scenario 3: No Expert Consultation

**You:** "You made architecture decisions without consulting experts"

**You:** "Invoke next-js-expert for this decision NOW"

**Cascade:**

```
Invoking next-js-expert as required by protocol...

[Performs consultation]

✅ STEP 3 COMPLETE: Consulted next-js-expert for [topic]
```

---

## Skill Auto-Loading

### How It Works

Cascade detects keywords in your request and automatically loads skills:

**Example 1:** "Implement POST /api/issues"

**Detected keywords:** "API", "endpoint"  
**Loaded skills:**

- .claude/skills/projectpulse/api-patterns.md
- .claude/skills/projectpulse/testing-patterns.md (TDD mandatory)

**Example 2:** "Create IssueCard component"

**Detected keywords:** "component", "Card"  
**Loaded skills:**

- .claude/skills/projectpulse/component-patterns.md
- .claude/skills/projectpulse/testing-patterns.md

**Example 3:** "Fix port 3000 configuration"

**Detected keywords:** "port", "3000"  
**Loaded skills:**

- .claude/skills/projectpulse/port-config.md

### Manual Skill Loading

**You:** "Load api-patterns skill"

**Cascade:** Reads .claude/skills/projectpulse/api-patterns.md

---

## Token Optimization

### How Cascade Saves Tokens

**Without optimization (Claude Code old way):**

- Load full CLAUDE.md: 10K tokens
- Load full agent files: 15K tokens
- Load full skills: 25K tokens
- **Total:** 50K tokens baseline

**With optimization (Cascade way):**

- Load .windsurfrules: 1K tokens
- Retrieve relevant memories: 2K tokens
- Load only needed skill frontmatter: 200 tokens
- Read full skill only if needed: 3K tokens
- **Total:** 6K tokens

**Savings: 88%!**

### Token Budget Tracking

Cascade shows token usage in checkpoints:

```
Token budget: 32,450/200,000 (16% used)
Next checkpoint: 45K tokens
Warning threshold: 150K tokens (75%)
```

---

## Quality Gates

### Before Marking Complete

Cascade automatically checks:

```
Running quality gates...

✅ TypeScript: 0 errors
✅ Lint: 0 warnings
✅ Build: Success
✅ Tests: 45/45 passing (coverage: 87%)
✅ No `any` types
✅ All functions typed
✅ Zod validation present

All quality gates passed ✅
Ready for completion workflow.
```

---

## MCP Integration

### Available MCPs in Cascade

**1. context7 - Library Documentation**

**You:** "Show me Next.js Server Actions documentation"

**Cascade:**

```
Fetching from context7 MCP...
[Returns latest Next.js 14 Server Actions docs]
```

**2. memory - Knowledge Graph**

**You:** "Remember this: We use neumorphic design with Coral theme"

**Cascade:**

```
Creating memory in knowledge graph...
Memory created: "Design System: Neumorphic Coral Theme"
```

**3. puppeteer - Browser Automation**

**You:** "Run E2E test for issue creation"

**Cascade:**

```
Launching puppeteer...
[Runs browser automation test]
✅ E2E test passed: Issue creation flow
```

**4. sequential-thinking - Complex Reasoning**

**You:** "Break down the search architecture decision"

**Cascade:**

```
Using sequential-thinking MCP for multi-step analysis...

Thought 1/5: Analyzing search requirements...
Thought 2/5: Comparing full-text vs semantic search...
Thought 3/5: Evaluating hybrid approach...
Thought 4/5: Considering performance implications...
Thought 5/5: Final recommendation...

Recommendation: Hybrid search (pg_trgm + pgvector)
```

---

## Troubleshooting

### Issue: Cascade doesn't follow protocol

**Solution:** Check .windsurfrules file loaded

```
Restart Windsurf IDE
Verify .windsurfrules exists in project root
Test: "What are the Golden Rules?" (should retrieve from memory)
```

### Issue: Memory retrieval failing

**Solution:** Verify memories created

```
Test: create_memory with simple test memory
Test: Search for "Golden Rule"
If fails: Recreate memories (see CASCADE_MEMORIES.md)
```

### Issue: Skills not auto-loading

**Solution:** Check Skills Index memory

```
Test: "Load api-patterns skill"
Verify: .claude/skills/projectpulse/api-patterns.md exists
Update: Skills Index memory if needed
```

### Issue: Session file not created

**Solution:** Enforce Step 1 protocol

```
Stop work immediately
User: "You skipped Step 1. Initialize session NOW."
Cascade must create .agent/task/current-session-[timestamp].md
```

---

## Quick Reference Card

**Print and keep handy:**

```
DAILY COMMANDS:
├─ "Start session for Phase X Day Y" → Initialize
├─ "Continue" → Resume work
├─ "Checkpoint" → Force save
├─ "Complete phase" → Run completion workflow
│
EXPERT CONSULTATION:
├─ "Consult react-expert about [topic]"
├─ "Consult next-js-expert about [topic]"
├─ "Consult prisma-expert about [topic]"
│
WORKFLOW:
├─ "Implement [feature] with TDD"
├─ "Review [code] for quality"
├─ "Find all [pattern] in codebase"
├─ "Analyze how [feature] works"
│
PROTOCOL ENFORCEMENT:
├─ Missing Step 1? → "Initialize session NOW"
├─ Missing Step 2? → "Save plan NOW"
├─ Missing Step 3? → "Consult expert NOW"
├─ Missing checkpoint? → "Update progress NOW"
│
QUALITY CHECKS:
├─ "Run all quality gates"
├─ "Check test coverage"
├─ "Verify TypeScript strict"
│
TOKEN BUDGET:
├─ Current: Check in checkpoints
├─ Warning: 150K tokens (75%)
├─ Danger: 180K tokens (90%)
```

---

## Best Practices

### DO:

✅ Use session starter template every session  
✅ Watch for all 5 protocol confirmations  
✅ Call out missing confirmations immediately  
✅ Use expert consultation for all decisions  
✅ Trust TDD workflow (Red → Green → Refactor)  
✅ Keep session files updated  
✅ Commit documentation before code

### DON'T:

❌ Skip protocol steps  
❌ Ignore missing confirmations  
❌ Make architecture decisions without experts  
❌ Skip tests  
❌ Let token usage exceed 150K without checkpoints  
❌ Commit code before documentation  
❌ Use `any` types

---

## Success Metrics

**Your workflow is working when:**

- ✅ All 5 protocol steps confirmed every session
- ✅ Token usage <10K per task (vs 25K+ baseline)
- ✅ Expert consultations automatic
- ✅ TDD workflow followed religiously
- ✅ Quality gates passing before completion
- ✅ Session recovery works after interruption
- ✅ No information loss at checkpoints
- ✅ Documentation always up-to-date

---

## Next Steps

1. **Practice:** Run one complete session with protocol
2. **Validate:** Check all 5 confirmations appear
3. **Test:** Interrupt session, resume successfully
4. **Measure:** Compare token usage to baseline
5. **Refine:** Adjust templates based on experience

---

**You're ready to use Cascade for ProjectPulse development!** 🚀
