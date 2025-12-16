# Documentation Audit Prompt for Cursor AI - v2.0 (Post-Option B)

**Date**: 2025-10-26
**Purpose**: Comprehensive audit of ProjectPulse documentation for workflow automation compatibility after implementing Memory Bank + TDD + Dependency Mapping (Option B)
**Auditor**: Cursor AI (GPT-4 or Claude)

---

## Instructions for Cursor AI

You are auditing the ProjectPulse project documentation to ensure it fully supports automated workflow with Claude Code. This audit checks the **NEW Memory Bank system, TDD workflow, and Dependency Mapping** implemented in Option B.

**Your Task:**

1. Review all documentation files listed in Part 6
2. Check for automation gaps based on criteria in Parts 1-5
3. Score automation readiness (0-100%)
4. Identify CRITICAL gaps (blocks automation) vs MINOR gaps (reduces efficiency)
5. Provide copy-paste ready fixes for top 10 gaps
6. Output findings in format specified in Part 7

---

## Part 1: Memory Bank System (NEW)

### What Changed in Option B

The project now uses a **Memory Bank System** - 5 specialized context files replacing scattered documentation:

**Core Files** (.agent/):

1. **project-brief.md** - WHAT we're building and WHY (~2,400 tokens)
2. **system-patterns.md** - HOW we build (~3,200 tokens)
3. **tech-context.md** - Technical stack (~2,800 tokens)
4. **active-context.md** - Current focus (~2,600 tokens)
5. **progress.md** - Progress tracking (~3,000 tokens)

### Automation Requirements

**Each Memory Bank file MUST:**

- Have clear section headings
- Use consistent markdown formatting
- Include inline keywords that trigger skills/sub-agents
- Reference related files with links
- Be self-contained (readable without other files)

**Keywords to Check For:**

**In system-patterns.md:**

- "Server Components", "Client Components"
- "Prisma query", "select/include"
- "API endpoint", "Zod validation"
- "React component", "useState", "useEffect"
- "Jest", "React Testing Library", "Playwright"
- "TDD", "test-driven development"

**In project-brief.md:**

- Specific feature names (issues, knowledge base, wiki)
- Technology names (Next.js, PostgreSQL, Prisma)
- Quality metrics (test coverage, performance)

**In active-context.md:**

- Current phase name (e.g., "Phase 3 Day 4")
- Task descriptions with skill-triggering keywords
- Blocker descriptions with specific technologies

**In progress.md:**

- Completed vs remaining metrics
- Quality gate results (TypeScript errors, tests passing)
- Velocity metrics (hours spent, tasks completed)

### Critical Checks

✅ **PASS Criteria:**

- All 5 memory bank files exist
- Each file has clear purpose statement at top
- Files contain skill-triggering keywords
- Files link to related documentation
- active-context.md updated for current phase
- progress.md has latest metrics

❌ **FAIL Criteria:**

- Memory bank files missing or empty
- Files lack keywords (generic descriptions)
- No cross-references between files
- active-context.md outdated
- progress.md has stale metrics

---

## Part 2: TDD Workflow (NEW)

### What Changed in Option B

**Test-Driven Development (TDD) now applies to ALL tasks** (not just complex ones).

**TDD Workflow:**

1. 🔴 RED: Write failing test first
2. 🟢 GREEN: Write minimal code to pass
3. 🔵 REFACTOR: Improve code quality
4. Repeat for edge cases

### Automation Requirements

**testing-patterns skill MUST include:**

- TDD section with 3-step workflow
- "For ALL tasks" explicit statement
- TDD examples for API endpoints
- TDD examples for React components
- Benefits explanation
- TDD checklist

**DEVELOPMENT_PLAN.md tasks SHOULD mention:**

- Writing tests first
- Test file paths
- Testing tools (Jest, RTL, Playwright)

**STATUS.md SHOULD mention:**

- Test coverage metrics
- Test passing status
- TDD compliance

### Critical Checks

✅ **PASS Criteria:**

- testing-patterns.md has TDD section
- TDD marked as "for ALL tasks"
- Multiple TDD examples provided
- TDD workflow (RED → GREEN → REFACTOR) documented
- Tasks mention tests/testing in descriptions

❌ **FAIL Criteria:**

- No TDD section in testing-patterns.md
- TDD optional or "for complex tasks only"
- No TDD examples
- Tasks don't mention testing

---

## Part 3: Dependency Mapping (NEW)

### What Changed in Option B

**All tasks in DEVELOPMENT_PLAN.md now include explicit "Dependencies" sections** to prevent implementation failures.

**Example:**

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
```

### Automation Requirements

**Every task MUST have:**

- "Dependencies:" section BEFORE "Tasks:" section
- List of prerequisites (models, APIs, files, mockups)
- Clear completion criteria for dependencies
- Specific file/model names (not generic)

**Dependency Types to Check For:**

- Database models (Prisma schema)
- API endpoints (routes, Server Actions)
- Previous tasks/phases complete
- Mockup files available
- Helper utilities/patterns established
- Environment configuration

### Critical Checks

✅ **PASS Criteria:**

- All Phase 3+ tasks have "Dependencies:" section
- Dependencies list 3+ specific items
- Dependencies mention specific models/files
- Dependencies include both data and code
- Dependencies verifiable (can check if exists)

❌ **FAIL Criteria:**

- Tasks missing "Dependencies:" section
- Generic dependencies ("everything ready")
- Unverifiable dependencies ("UI looks good")
- No mention of required models/APIs

---

## Part 4: Skills System

### Skills Catalog (7 Skills)

**Location**: `.claude/skills/projectpulse/`

1. **component-patterns** (220 tokens)
   - Triggers: "React component", "Server Component", "Client Component", "useState", "useEffect"

2. **database-patterns** (200 tokens)
   - Triggers: "Prisma query", "database", "select", "include", "findMany", "create"

3. **api-patterns** (220 tokens)
   - Triggers: "API endpoint", "route handler", "Server Action", "Zod validation"

4. **testing-patterns** (320 tokens - **UPDATED**)
   - Triggers: "test", "TDD", "test-driven", "Jest", "Playwright", "React Testing Library"
   - **NEW**: TDD section for ALL tasks

5. **git-workflow** (180 tokens)
   - Triggers: "git", "branch", "commit", "merge", "pull request"

6. **port-config** (150 tokens)
   - Triggers: "port 3002", "port configuration", "dev server"

7. **database-connection** (150 tokens)
   - Triggers: "connection error", "Prisma client", "database pool"

### Automation Requirements

**For skill auto-loading to work:**

**STATUS.md MUST contain** (in current phase description):

- At least 3-5 skill-triggering keywords per task
- Technology names (React, Prisma, Next.js)
- Component types (Server Component, API endpoint)
- Testing tools (Jest, Playwright)

**DEVELOPMENT_PLAN.md MUST contain** (in phase tasks):

- Specific implementation details with keywords
- File paths with extensions (.tsx, .ts, .spec.ts)
- Database operations (Prisma query, create, findMany)
- Testing requirements (Playwright E2E, React Testing Library)

**Skill frontmatter MUST have:**

- `triggers:` array with lowercase keywords
- `description:` explaining when to use
- `token_estimate:` accurate token count

### Critical Checks

✅ **PASS Criteria:**

- All 7 skills exist in .claude/skills/projectpulse/
- Each skill has valid YAML frontmatter
- testing-patterns.md includes TDD section (320 tokens)
- STATUS.md current phase has 5+ skill triggers
- DEVELOPMENT_PLAN.md tasks have 5+ skill triggers per day

❌ **FAIL Criteria:**

- Skills missing or empty
- Invalid frontmatter (no triggers)
- testing-patterns.md lacks TDD (still 240 tokens)
- Tasks have generic descriptions (no keywords)
- "Skills: None" or "Skills: TBD" anywhere

---

## Part 5: Sub-Agent & Expert Invocation

### Sub-Agents (4 Total)

**Location**: `.claude/agents/`

1. **explore-codebase**
   - **When**: "Find all X", "Scan repo for Y", "Search codebase"
   - **Returns**: 2-5K token summary of findings

2. **analyze-architecture**
   - **When**: "How does X work?", "Trace data flow", "Understand system"
   - **Returns**: 2-5K token architectural insights

3. **synthesize-docs**
   - **When**: After feature completion, "Generate SOP"
   - **Returns**: SOP file in .agent/sops/, updates skills

4. **map-system**
   - **When**: "Update system docs", "Refresh API catalog"
   - **Returns**: Updated .agent/system/ docs

### Experts (3 Total)

1. **next-js-expert** - App Router, Server Actions decisions
2. **prisma-expert** - Schema design, query optimization
3. **react-expert** - Component architecture, hooks patterns

### Automation Requirements

**For sub-agent auto-invocation:**

**Tasks SHOULD include** (in descriptions):

- "Research needed:" or "Explore:" indicators
- Phrases: "find existing patterns", "trace data flow", "understand how X works"
- Architecture questions: "How does search work?", "Analyze authentication flow"

**Tasks SHOULD mention** (for experts):

- Architecture decisions: "component architecture", "schema design"
- Technology-specific: "App Router vs Pages Router", "Server Actions vs API routes"
- Optimization: "query optimization", "performance tuning"

### Critical Checks

✅ **PASS Criteria:**

- All 4 sub-agents documented in .claude/agents/
- Tasks mention "Research needed" or "Explore"
- Complex tasks indicate architecture decisions needed
- STATUS.md/DEVELOPMENT_PLAN.md reference sub-agents

❌ **FAIL Criteria:**

- Sub-agents not documented
- Tasks have no research indicators
- No mention of architecture decisions
- No guidance on when to invoke

---

## Part 6: Files to Review

**Review EVERY file below for automation compatibility:**

### Core Documentation (MUST REVIEW)

1. **STATUS.md**
   - Current phase description with skill-triggering keywords
   - Recent changes with specific technologies
   - Next steps with implementation details
   - Quality metrics (tests, TypeScript, coverage)

2. **docs/DEVELOPMENT_PLAN.md**
   - All Phase 3+ tasks have "Dependencies:" sections
   - Task descriptions include 5+ skill triggers
   - File paths with extensions (.tsx, .ts, route.ts)
   - Testing requirements explicit (Playwright E2E, Jest)
   - API endpoints specified (GET /api/issues)
   - Prisma queries mentioned (findMany, create, include)

3. **CLAUDE.md**
   - Memory Bank System section exists
   - Documents all 5 memory bank files
   - "When to Read Which File" quick reference
   - Finding Information section updated

4. **.agent/README.md**
   - Memory Bank System section at top
   - Documents all 5 files with read-when guidance
   - Quick Lookup reference table
   - Points to memory bank files (not old structure)

5. **.agent/WORKFLOW_PROMPTS.md**
   - TDD workflow section (for ALL tasks)
   - Dependency Mapping section with examples
   - TDD automatic behavior documented
   - Dependency verification workflow

### Memory Bank Files (MUST REVIEW - NEW)

6. **.agent/project-brief.md**
   - Core requirements clear
   - User personas defined
   - Success criteria measurable
   - Current status accurate
   - Keywords for features (issues, knowledge, wiki)

7. **.agent/system-patterns.md**
   - Architecture patterns complete (Server/Client Components)
   - Database patterns with Prisma examples
   - API patterns with Zod validation
   - Styling patterns (Tailwind, neumorphic)
   - Testing patterns with TDD
   - Keywords: "Server Components", "Prisma query", "API endpoint"

8. **.agent/tech-context.md**
   - Full tech stack documented
   - Dependencies with versions
   - Environment setup complete
   - Constraints and limitations clear
   - Troubleshooting section exists

9. **.agent/active-context.md**
   - Current phase accurate (Phase 3 Day 4 or current)
   - Recent changes documented
   - Remaining tasks clear
   - Blockers specified
   - Keywords for current work

10. **.agent/progress.md**
    - Metrics up to date
    - What's done vs left clear
    - Velocity tracked
    - Quality gates documented
    - Lessons learned captured

### Skills (MUST REVIEW)

11. **.claude/skills/projectpulse/testing-patterns.md**
    - **CRITICAL**: TDD section exists and complete
    - "For ALL tasks" statement present
    - TDD workflow (RED → GREEN → REFACTOR)
    - TDD examples for API and components
    - Token estimate: 320 tokens (was 240)

12. **.claude/skills/projectpulse/component-patterns.md**
13. **.claude/skills/projectpulse/database-patterns.md**
14. **.claude/skills/projectpulse/api-patterns.md**

### System Docs (REVIEW IF CHANGED)

15. **.agent/system/database-schema.md**
16. **.agent/system/api-catalog.md**
17. **.agent/system/component-patterns.md**

### SOPs (REVIEW IF NEW)

18. **.agent/sops/port-troubleshooting.md**
19. **.agent/sops/git-workflow.md**
20. **.agent/sops/adding-api-endpoint.md** (if exists)

---

## Part 7: Audit Methodology

### Step-by-Step Process

**Step 1: Memory Bank Audit (NEW)**

For each memory bank file (.agent/\*.md):

1. Check file exists and has content
2. Check purpose statement at top
3. Count skill-triggering keywords (target: 10+ per file)
4. Verify cross-references to related files
5. Check if active-context.md matches current phase
6. Check if progress.md has latest metrics

**Score:**

- All 5 files complete with 10+ keywords each: +20%
- 4 files or missing keywords: +10%
- 3 or fewer files: +0% (CRITICAL GAP)

**Step 2: TDD Audit (NEW)**

For testing-patterns.md:

1. Check TDD section exists (search for "Test-Driven Development" or "TDD")
2. Verify "For ALL tasks" statement (not "for complex tasks")
3. Count TDD examples (target: 2+)
4. Check TDD workflow documented (RED → GREEN → REFACTOR)
5. Verify token estimate updated (320 tokens, not 240)

For DEVELOPMENT_PLAN.md:

1. Check task descriptions mention tests
2. Verify test file paths specified
3. Check testing tools mentioned (Jest, Playwright, RTL)

**Score:**

- TDD section complete + tasks mention tests: +20%
- TDD section exists but incomplete: +10%
- No TDD section or "optional": +0% (CRITICAL GAP)

**Step 3: Dependency Mapping Audit (NEW)**

For DEVELOPMENT_PLAN.md Phase 3+ tasks:

1. Check each task has "Dependencies:" section
2. Verify 3+ specific dependencies listed
3. Check dependencies are verifiable (specific models/files)
4. Verify dependencies come BEFORE tasks section

**Score:**

- All tasks have 3+ specific dependencies: +20%
- Most tasks have dependencies: +10%
- Missing or generic dependencies: +0% (CRITICAL GAP)

**Step 4: Skills Audit**

For each skill file:

1. Check YAML frontmatter valid
2. Count trigger keywords (target: 5+)
3. Check description explains when to use
4. Verify token estimate reasonable

For STATUS.md/DEVELOPMENT_PLAN.md:

1. Count skill-triggering keywords in current phase
2. Check for specific technology names
3. Verify implementation details present

**Score:**

- 5+ keywords per task, all 7 skills present: +20%
- 3-4 keywords per task: +10%
- Generic descriptions: +0% (CRITICAL GAP)

**Step 5: Sub-Agent Invocation Audit**

For task descriptions:

1. Check for research indicators ("Research needed:", "Explore:")
2. Check for architecture decision indicators
3. Verify complex tasks mention sub-agents

**Score:**

- Clear invocation indicators: +10%
- Implicit indicators: +5%
- No indicators: +0% (MINOR GAP)

**Step 6: Cross-Reference Audit**

Check documentation links:

1. CLAUDE.md links to memory bank files
2. .agent/README.md links to memory bank
3. Memory bank files link to related docs
4. Skills reference SOPs/system docs

**Score:**

- All links valid and complete: +10%
- Some broken links: +5%
- Many broken links: +0% (MINOR GAP)

---

## Part 8: Output Format

**Provide output in this EXACT format:**

````markdown
# Documentation Audit Report - v2.0 (Post-Option B)

**Date**: 2025-10-26
**Auditor**: Cursor AI (GPT-4/Claude)
**Audit Duration**: [X minutes]

---

## Executive Summary

**Overall Automation Readiness**: [X]%

**Breakdown:**

- Memory Bank System: [X]% (NEW)
- TDD Workflow: [X]% (NEW)
- Dependency Mapping: [X]% (NEW)
- Skills Auto-Loading: [X]%
- Sub-Agent Invocation: [X]%
- Cross-References: [X]%

**Status**: [PRODUCTION READY / NEEDS IMPROVEMENTS / CRITICAL GAPS]

**Critical Gaps Found**: [X]
**Minor Gaps Found**: [X]

---

## Part 1: Memory Bank System Audit (NEW)

### Files Status

| File               | Exists | Purpose Clear | Keywords | Cross-Refs | Score |
| ------------------ | ------ | ------------- | -------- | ---------- | ----- |
| project-brief.md   | ✅/❌  | ✅/❌         | X/10+    | ✅/❌      | X%    |
| system-patterns.md | ✅/❌  | ✅/❌         | X/10+    | ✅/❌      | X%    |
| tech-context.md    | ✅/❌  | ✅/❌         | X/10+    | ✅/❌      | X%    |
| active-context.md  | ✅/❌  | ✅/❌         | X/10+    | ✅/❌      | X%    |
| progress.md        | ✅/❌  | ✅/❌         | X/10+    | ✅/❌      | X%    |

### Findings

**CRITICAL Gaps:**

1. [If any file missing or empty]
2. [If active-context.md doesn't match current phase]
3. [If system-patterns.md lacks TDD keywords]

**MINOR Gaps:**

1. [If fewer than 10 keywords in any file]
2. [If cross-references incomplete]

**Recommendations:**

1. [Specific fix for each gap]

---

## Part 2: TDD Workflow Audit (NEW)

### testing-patterns.md Status

- TDD Section Exists: ✅/❌
- "For ALL tasks" statement: ✅/❌
- TDD Workflow (RED → GREEN → REFACTOR): ✅/❌
- TDD Examples (API): ✅/❌
- TDD Examples (Component): ✅/❌
- Token Estimate: [X tokens] (should be 320)

**Score**: [X]%

### Task Descriptions

- Tasks mention tests: ✅/❌
- Test file paths specified: ✅/❌
- Testing tools mentioned: ✅/❌

### Findings

**CRITICAL Gaps:**

1. [If no TDD section or marked "optional"]
2. [If testing-patterns.md still 240 tokens]

**MINOR Gaps:**

1. [If examples incomplete]
2. [If tasks don't mention testing]

**Recommendations:**

1. [Specific fixes needed]

---

## Part 3: Dependency Mapping Audit (NEW)

### DEVELOPMENT_PLAN.md Task Dependencies

| Task     | Has Dependencies | Count | Specific | Verifiable | Score |
| -------- | ---------------- | ----- | -------- | ---------- | ----- |
| Day 3    | ✅/❌            | X     | ✅/❌    | ✅/❌      | X%    |
| Day 4    | ✅/❌            | X     | ✅/❌    | ✅/❌      | X%    |
| Days 5-6 | ✅/❌            | X     | ✅/❌    | ✅/❌      | X%    |

### Findings

**CRITICAL Gaps:**

1. [Tasks missing "Dependencies:" section]
2. [Dependencies too generic ("everything ready")]

**MINOR Gaps:**

1. [Fewer than 3 dependencies per task]
2. [Some dependencies not verifiable]

**Recommendations:**

1. [Add specific dependencies for each gap]

---

## Part 4: Skills Auto-Loading Audit

### Skills Status

| Skill               | Exists | Frontmatter | Triggers | Description | Token Est | Score |
| ------------------- | ------ | ----------- | -------- | ----------- | --------- | ----- |
| testing-patterns    | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |
| component-patterns  | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |
| database-patterns   | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |
| api-patterns        | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |
| git-workflow        | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |
| port-config         | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |
| database-connection | ✅/❌  | ✅/❌       | X/5+     | ✅/❌       | X         | X%    |

### Keyword Analysis

**STATUS.md Current Phase:**

- Skill-triggering keywords found: [X]
- Technology names: [list]
- Implementation details: ✅/❌

**DEVELOPMENT_PLAN.md Phase 3:**

- Keywords per task: [X average]
- Specific file paths: ✅/❌
- Database operations: ✅/❌
- Testing requirements: ✅/❌

### Findings

**CRITICAL Gaps:**

1. [If any skill missing or invalid]
2. [If "Skills: None" found anywhere]
3. [If testing-patterns.md lacks TDD]

**MINOR Gaps:**

1. [If fewer than 5 keywords per task]
2. [If generic task descriptions]

**Recommendations:**

1. [Specific keyword additions needed]

---

## Part 5: Sub-Agent Invocation Audit

### Invocation Indicators Found

**In STATUS.md:**

- Research indicators: [count]
- Architecture decisions: [count]
- Sub-agent mentions: ✅/❌

**In DEVELOPMENT_PLAN.md:**

- "Research needed:" [count]
- "Explore:" [count]
- Explicit sub-agent calls: [count]

### Findings

**MINOR Gaps:**

1. [If no research indicators]
2. [If no architecture decision indicators]

**Recommendations:**

1. [Add research indicators where needed]

---

## Part 6: Cross-Reference Audit

### Links Validation

**CLAUDE.md:**

- Links to memory bank files: [X/5] ✅
- Links valid: ✅/❌

**.agent/README.md:**

- Links to memory bank: [X/5] ✅
- Quick reference table: ✅/❌

**Memory Bank Files:**

- Cross-references: [X total]
- Broken links: [X]

### Findings

**MINOR Gaps:**

1. [List any broken links]
2. [List missing cross-references]

---

## Part 7: Top 10 Copy-Paste Ready Fixes

### Fix #1: [Most Critical Gap]

**File**: [path]
**Line**: [line number or section]
**Current**:

```markdown
[current text]
```
````

**Replace With**:

```markdown
[corrected text with keywords]
```

**Impact**: [Why this matters for automation]

---

[Repeat for fixes #2-#10]

---

## Part 8: Comparison with Previous Audit

**Previous Audit Date**: [if applicable]
**Previous Score**: [X]%
**Current Score**: [X]%
**Change**: [+/- X]%

**What Improved:**

1. [List improvements]

**What Regressed:**

1. [List any regressions]

**New Gaps Introduced:**

1. [List if Option B created new issues]

---

## Part 9: Final Recommendations

### Immediate Actions (CRITICAL)

1. [Highest priority fix]
2. [Second priority fix]
3. [Third priority fix]

### Short-Term Improvements (MINOR)

1. [Enhancement #1]
2. [Enhancement #2]
3. [Enhancement #3]

### Long-Term Enhancements

1. [Future improvement #1]
2. [Future improvement #2]

---

## Appendix A: Keyword Density Analysis

**Top 10 Most Important Keywords:**

1. [keyword] - Found [X] times across [Y] files
2. [keyword] - Found [X] times across [Y] files
   [... continue for top 10]

**Missing Keywords** (should appear but don't):

1. [keyword] - Should be in [file]
2. [keyword] - Should be in [file]

---

## Appendix B: File Completeness Matrix

| File                | Size   | Keywords | Links | Last Updated | Completeness |
| ------------------- | ------ | -------- | ----- | ------------ | ------------ |
| STATUS.md           | [X KB] | [X]      | [X]   | [date]       | [X]%         |
| DEVELOPMENT_PLAN.md | [X KB] | [X]      | [X]   | [date]       | [X]%         |

[... all reviewed files]

---

## Appendix C: Automation Readiness Criteria

**Production Ready** (90%+):

- All CRITICAL gaps resolved
- All memory bank files complete
- TDD documented for ALL tasks
- All tasks have dependencies
- 5+ keywords per task

**Needs Improvements** (70-89%):

- Some CRITICAL gaps remain
- Memory bank incomplete
- TDD optional or missing examples
- Some tasks lack dependencies
- 3-4 keywords per task

**Critical Gaps** (<70%):

- Multiple CRITICAL gaps
- Memory bank missing files
- No TDD documentation
- No dependency mapping
- Generic task descriptions

**Current Status**: [Which category]

---

**End of Audit Report**

````

---

## Part 9: Additional Context for Cursor AI

### What's NEW in Option B (Just Implemented)

**1. Memory Bank System** - 5 files created TODAY:
- .agent/project-brief.md
- .agent/system-patterns.md
- .agent/tech-context.md
- .agent/active-context.md
- .agent/progress.md

**Check these files exist and are complete!**

**2. TDD for ALL Tasks** - Updated TODAY:
- .claude/skills/projectpulse/testing-patterns.md
  * Should have TDD section at top
  * Should say "For ALL tasks" not "for complex tasks"
  * Should have token_estimate: 320 (not 240)

**3. Dependency Mapping** - Added TODAY:
- docs/DEVELOPMENT_PLAN.md
  * All Phase 3 tasks should have "Dependencies:" sections
  * Check Day 3, Day 4, Days 5-6

### What to Compare Against

**Before Option B** (if you find references):
- Old skill token estimates (testing-patterns was 240)
- "Skills: None" in STATUS.md or DEVELOPMENT_PLAN.md
- No TDD section in testing-patterns.md
- No "Dependencies:" sections in tasks
- No memory bank files (.agent/ had different structure)

**After Option B** (current - should be this):
- testing-patterns: 320 tokens with TDD
- Explicit skills listed in STATUS.md/DEVELOPMENT_PLAN.md
- TDD section for ALL tasks
- "Dependencies:" in every Phase 3+ task
- 5 memory bank files in .agent/

### Known Good Examples

**Good Dependency Section:**
```markdown
**Day 4: Issue Detail Page**

Dependencies:
- Day 3 complete (Issues List page exists with navigation)
- Prisma schema with IssueComment, IssueHistory, IssueAttachment models
- Database seeded with related records
- Issue detail mockup file (waiting from user)
- Server Actions pattern established
- Zod validation utilities available
````

**Good Task Description with Keywords:**

```markdown
1. Transform Issue Detail page layout as **Server Component** with **Prisma queries** (relations: comments, attachments, history)
2. Create comment system UI with **Client Components** (CommentList, CommentForm) and optimistic updates
3. Implement status change controls with **Server Actions** and **Zod validation**
4. **Playwright E2E test** for complete workflow: open issue → add comment → change status
5. **Research**: `explore-codebase` to find existing comment patterns
```

**Good TDD Section Header:**

```markdown
## ⚠️ CRITICAL: Test-Driven Development for ALL Tasks

**ALWAYS follow TDD workflow for EVERY implementation task:**

### TDD Workflow (3 Steps)

1. 🔴 RED: Write failing test first
2. 🟢 GREEN: Write minimal code to pass test
3. 🔵 REFACTOR: Improve code quality
```

---

## Part 10: Success Criteria

**The audit is successful if:**

1. ✅ You identify ALL gaps (both CRITICAL and MINOR)
2. ✅ You provide accurate readiness score (0-100%)
3. ✅ You give copy-paste ready fixes for top 10 gaps
4. ✅ You verify Option B implementation completeness
5. ✅ You check memory bank files exist and are complete
6. ✅ You confirm TDD documented for ALL tasks (not optional)
7. ✅ You verify all Phase 3+ tasks have dependencies
8. ✅ You provide specific line numbers/sections for fixes

**The audit fails if:**

1. ❌ You give generic feedback without specifics
2. ❌ You don't check the NEW memory bank files
3. ❌ You don't verify TDD is "for ALL tasks"
4. ❌ You miss checking dependencies in tasks
5. ❌ You don't provide copy-paste ready fixes
6. ❌ You inflate the readiness score

---

## How to Run This Audit in Cursor AI

**Step 1**: Open Cursor AI in your project root

**Step 2**: Copy this ENTIRE file content

**Step 3**: Paste into Cursor AI chat with this prompt:

```
Please perform a comprehensive documentation audit using the instructions above.

Review ALL files listed in Part 6, especially the NEW memory bank files and updated testing-patterns.md.

Check for:
1. Memory Bank System completeness (5 files)
2. TDD workflow documentation (for ALL tasks)
3. Dependency Mapping (all Phase 3+ tasks)
4. Skills auto-loading keywords
5. Sub-agent invocation indicators

Provide output in EXACT format from Part 8, including:
- Overall readiness score (0-100%)
- Top 10 copy-paste ready fixes
- Comparison with previous audit (if applicable)

Be thorough and critical - we want to find ALL gaps, not inflate scores.
```

**Step 4**: Wait for Cursor to analyze all files (~2-5 minutes)

**Step 5**: Save Cursor's output to: `.agent/gemini/documentation-audit-20251026-cursor-v2.md`

**Step 6**: Review findings and apply fixes

---

**End of Audit Prompt**

**File Location**: Save this prompt at `.agent/gemini/documentation-audit-prompt-cursor-v2.md`
**Version**: 2.0 (Post-Option B)
**Last Updated**: 2025-10-26
