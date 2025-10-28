# Cascade Templates for Moksha DevHub

**Purpose:** Session starter templates and agent invocation patterns

---

## Template 1: Session Starter (Copy-Paste Every Session)

**File:** `.cascade/templates/session-starter.md`

```markdown
MANDATORY PROTOCOL - Cascade Edition

Current phase: [copy from STATUS.md - e.g., "Week 1.5 Phase 3 Day 5 - Knowledge Base Page"]
Requirements: [copy from DEVELOPMENT_PLAN.md - e.g., "Implement Knowledge Base page with search, filters, categories"]

ENFORCE ALL 5 STEPS:
✅ Step 1: Initialize session

- Read STATUS.md + DEVELOPMENT_PLAN.md
- Create .agent/task/current-session-[YYYYMMDD-HHMM].md
- Load relevant .agent/ context files
- CONFIRM: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

✅ Step 2: Save plan BEFORE code

- Create implementation plan
- Get my approval
- IMMEDIATELY save to .agent/task/current-plan.md
- Create .agent/task/current-todos.md
- CONFIRM: "✅ STEP 2 COMPLETE: Plan saved"

✅ Step 3: Consult experts

- Use agent templates from memory for decisions
- react-expert for components
- next-js-expert for Server/Client decisions
- prisma-expert for database
- CONFIRM: "✅ STEP 3 COMPLETE: Consulted [expert]"

✅ Step 4: Checkpoints every 15K tokens

- Update .agent/task/current-session.md
- Update .agent/task/current-todos.md
- CONFIRM: "✅ CHECKPOINT at [X]K tokens: Progress saved"

✅ Step 5: Post-completion workflow

- Create COMPLETION\_[PHASE].md
- Update STATUS.md + DEVELOPMENT_PLAN.md
- Commit docs first, code second
- CONFIRM: "✅ STEP 5 COMPLETE: All documentation updated"

IF YOU SKIP ANY STEP, I WILL STOP YOU.

Proceed with [phase name].
```

**Usage:**

1. Copy this template at start of every session
2. Fill in current phase and requirements
3. Paste into Cascade
4. Watch for all 5 confirmations

---

## Template 2: Agent Invocation Patterns

### Pattern A: React Expert (Component Architecture)

**When to use:** Component design, hooks, performance optimization

**Invocation prompt:**

```markdown
### INVOKING REACT EXPERT

Context: [describe current task]
Question: [specific question about component architecture]

React Expert Instructions:

1. Retrieve "Agent Template: react-expert" from memory
2. Read .agent/task/current-session-[latest].md for context
3. Analyze requirements:
   - Component composition needs
   - State management approach
   - Custom hooks required
   - Performance considerations
   - TypeScript type patterns
4. Design optimal architecture with code examples
5. Save implementation plan to .agent/task/react-[topic]-[YYYYMMDD-HHMM].md
6. Return confirmation:
   "✅ STEP 3 COMPLETE: Consulted react-expert for [topic]
   Key recommendations: [1-2 sentences]
   Full plan: .agent/task/react-[topic]-[timestamp].md"

Proceed.
```

**Example usage:**

```
User: "I need component architecture for the Knowledge Base search feature."

Cascade: [Applies react-expert template]
1. Retrieves agent template memory
2. Reads current session context
3. Designs: SearchContext + useSearch hook + SearchBar + SearchResults components
4. Saves to .agent/task/react-knowledge-search-20251028-1430.md
5. Returns: "✅ Consulted react-expert for knowledge search..."
```

### Pattern B: Next.js Expert (Server/Client Decisions)

**When to use:** Page architecture, data fetching, routing decisions

**Invocation prompt:**

```markdown
### INVOKING NEXT.JS EXPERT

Context: [describe feature/page]
Question: [specific architecture question]

Next.js Expert Instructions:

1. Retrieve "Agent Template: next-js-expert" from memory
2. Read .agent/task/current-session-[latest].md
3. Analyze:
   - Server vs Client Component decisions
   - Data fetching strategy (Server Components, API routes, Server Actions)
   - Caching and revalidation needs
   - File structure and routing
4. Design Next.js 14 App Router architecture
5. Save plan to .agent/task/nextjs-[topic]-[YYYYMMDD-HHMM].md
6. Return confirmation with recommendations

Proceed.
```

### Pattern C: Prisma Expert (Database Design)

**When to use:** Schema design, query optimization, migrations

**Invocation prompt:**

```markdown
### INVOKING PRISMA EXPERT

Context: [describe data requirements]
Question: [specific database question]

Prisma Expert Instructions:

1. Retrieve "Agent Template: prisma-expert" from memory
2. Read .agent/task/current-session-[latest].md
3. Read current schema: prisma/schema.prisma
4. Design:
   - Prisma models with relations
   - Index recommendations
   - Query optimization patterns
   - Migration strategy
5. Save to .agent/task/prisma-[topic]-[YYYYMMDD-HHMM].md
6. Return confirmation with schema recommendations

Proceed.
```

### Pattern D: Explore Codebase (Research)

**When to use:** Find patterns, scan repository

**Invocation prompt:**

```markdown
### INVOKING EXPLORE-CODEBASE AGENT

Task: [what to find - e.g., "Find all authentication patterns"]

Instructions:

1. Retrieve "Agent Template: explore-codebase" from memory
2. Use grep_search to scan codebase for [keywords]
3. Read relevant files
4. Summarize findings:
   - Patterns found
   - Locations
   - Recommendations
5. Save to .agent/task/explore-[topic]-[YYYYMMDD-HHMM].md
6. Return summary (not full details - keep main context clean)

Proceed.
```

### Pattern E: Analyze Architecture (Flow Tracing)

**When to use:** Understand how features work, trace data flows

**Invocation prompt:**

```markdown
### INVOKING ANALYZE-ARCHITECTURE AGENT

Task: [what to analyze - e.g., "How does search work?"]

Instructions:

1. Retrieve "Agent Template: analyze-architecture" from memory
2. Trace data flow:
   - User action → Component → API → Database
   - Or: Database → API → Server Component → Client Component
3. Read multiple files to understand full flow
4. Create flow diagram (text format)
5. Save analysis to .agent/task/architecture-[topic]-[YYYYMMDD-HHMM].md
6. Return high-level summary

Proceed.
```

---

## Template 3: TDD Workflow Pattern

**Mandatory for all implementation tasks**

```markdown
### TDD WORKFLOW FOR: [Feature Name]

Implementing: [specific feature/endpoint/component]

Following Test-Driven Development:

## 🔴 RED PHASE: Write Failing Test

1. Create test file: [test file path]
2. Write test case for happy path
3. Run test: npm test [test file]
4. Verify: Test FAILS ✗ (as expected)

## 🟢 GREEN PHASE: Make It Pass

1. Implement minimal code to pass test
2. Run test: npm test [test file]
3. Verify: Test PASSES ✓

## 🔵 REFACTOR PHASE: Improve Quality

1. Improve code quality (extract, simplify, optimize)
2. Run test again: npm test [test file]
3. Verify: Test STILL PASSES ✓

## 📝 REPEAT FOR EDGE CASES

- [ ] Error handling test → implement
- [ ] Validation test → implement
- [ ] Edge case 1 → implement
- [ ] Edge case 2 → implement

All tests must pass before marking complete.
```

---

## Template 4: Checkpoint Update Pattern

**Use at 15K, 30K, 45K, 60K, 75K, 90K tokens**

```markdown
## CHECKPOINT at [X]K tokens

### Progress Since Last Checkpoint:

- [Task 1 completed]
- [Task 2 completed]
- [Current task in progress]

### Updated Files:

1. .agent/task/current-session-20251028-1430.md
   - Added progress notes
   - Token count: [X]K/200K
2. .agent/task/current-todos.md
   - Marked [N] tasks complete
   - Updated progress: [X]% → [Y]%

### Current Status:

- Tasks complete: [X]/[Y] ([Z]%)
- Next task: [Task name]
- Next checkpoint: [X+15]K tokens

✅ CHECKPOINT COMPLETE: Progress saved
```

---

## Template 5: Completion Document Pattern

**Use after phase completion (Step 5)**

````markdown
# COMPLETION: [Phase Name]

**Date:** [YYYY-MM-DD]  
**Phase:** [e.g., "Week 1.5 Phase 3 Day 5 - Knowledge Base Page"]  
**Duration:** [hours]  
**Status:** ✅ Complete

---

## What Was Done

### Deliverables:

- [Feature 1]: [Description]
- [Feature 2]: [Description]
- [Feature 3]: [Description]

### Files Created:

1. [file path] - [description]
2. [file path] - [description]
3. [file path] - [description]

### Files Modified:

1. [file path] - [changes]
2. [file path] - [changes]

---

## Technical Implementation

### Architecture Decisions:

- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

### Expert Consultations:

- ✅ react-expert: [Summary of recommendations]
- ✅ next-js-expert: [Summary of recommendations]
- ✅ prisma-expert: [Summary of recommendations]

### Patterns Used:

- [Pattern 1]: [From which skill]
- [Pattern 2]: [From which skill]

---

## Quality Gates

### Build:

- ✅ TypeScript: 0 errors
- ✅ Lint: 0 warnings
- ✅ Build: Success

### Testing:

- ✅ Unit tests: [X]/[X] passing
- ✅ Component tests: [X]/[X] passing
- ✅ E2E tests: [X]/[X] passing
- ✅ Coverage: [X]% (target: 80%+)

### Code Quality:

- ✅ No `any` types
- ✅ All functions typed
- ✅ Props interfaces defined
- ✅ Zod validation implemented

---

## Documentation Updates

- ✅ STATUS.md: Updated current phase
- ✅ DEVELOPMENT_PLAN.md: Marked phase complete
- ✅ .agent/active-context.md: Updated with next phase
- ✅ .agent/progress.md: Added metrics

---

## Git Commits

**Documentation commit:**

```bash
git add .agent/ STATUS.md docs/DEVELOPMENT_PLAN.md COMPLETION_*.md
git commit -m "docs: Update documentation after [phase]"
# Commit hash: [hash]
```
````

**Code commit:**

```bash
git add [code files]
git commit -m "feat: [feature description]

🤖 Generated with Cascade (Windsurf IDE)

- Implemented [feature 1]
- Added [feature 2]
- Tests: [X]% coverage

Refs: [issue numbers if any]"
# Commit hash: [hash]
```

---

## Lessons Learned

### What Worked Well:

- [Insight 1]
- [Insight 2]

### Challenges:

- [Challenge 1]: [How resolved]
- [Challenge 2]: [How resolved]

### Optimizations:

- [Optimization 1]
- [Optimization 2]

---

## Next Steps

**Next Phase:** [Phase name]  
**Estimated Duration:** [hours]  
**Blockers:** [List any blockers, or "None"]

---

**Completion confirmed** ✅

````

---

## Template 6: Quick Commands Reference

**Save this as quick reference**

```markdown
## Cascade Quick Commands for Moksha DevHub

### Session Management:
"Start session for Phase X Day Y" → Initializes with protocol
"Continue" → Resumes from last checkpoint
"Checkpoint" → Force checkpoint update
"Complete phase" → Runs Step 5 completion workflow

### Agent Invocation:
"Consult react-expert about [topic]" → Invokes react expert
"Consult next-js-expert about [topic]" → Invokes Next.js expert
"Consult prisma-expert about [topic]" → Invokes Prisma expert
"Find all [pattern] in codebase" → Invokes explore-codebase
"Analyze how [feature] works" → Invokes analyze-architecture

### Workflow Commands:
"Implement [feature] with TDD" → TDD workflow
"Review [code] for quality" → Auditor patterns
"Generate SOP for [topic]" → Synthesize-docs agent
"Update system docs" → Map-system agent

### Skill Loading:
"Load api-patterns skill" → Reads API skill
"Load testing-patterns skill" → Reads testing skill
Skills auto-load based on keywords in phase description

### Documentation:
"Update STATUS.md" → Updates project status
"Create COMPLETION doc" → Creates completion document
"Update progress metrics" → Updates .agent/progress.md
````

---

## Usage Guidelines

### When to use each template:

1. **Session Starter:** Every session start (mandatory)
2. **Agent Invocation:** When needing specialized expertise
3. **TDD Workflow:** Every implementation task
4. **Checkpoint:** Every 15K tokens automatically
5. **Completion Document:** After phase completion
6. **Quick Commands:** Daily reference

### Template Locations:

Save templates in: `.cascade/templates/`

- session-starter.md
- agent-react-expert.md
- agent-nextjs-expert.md
- agent-prisma-expert.md
- tdd-workflow.md
- checkpoint-pattern.md
- completion-document.md
- quick-commands.md

### Customization:

- Replace [placeholders] with actual values
- Adjust timestamps to YYYYMMDD-HHMM format
- Update phase names to match STATUS.md
- Modify confirmations to match current step

---

## Next Steps

1. Create `.cascade/templates/` directory
2. Save all templates as individual markdown files
3. Test session starter template
4. Validate agent invocation patterns
5. Proceed to Phase 2 of integration plan
