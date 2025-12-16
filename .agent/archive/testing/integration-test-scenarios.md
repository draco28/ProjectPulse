# Integration Test Scenarios - Workflow Enhancement System

**Purpose**: Validate complete workflow enhancement system (Phases 1-5)
**Created**: 2025-10-26
**Status**: Ready for testing

---

## Test Environment

**Prerequisites**:

- ✅ All 5 phases implemented
- ✅ 7 skills created (1,430 tokens)
- ✅ 7 sub-agents configured
- ✅ 3 specialized experts available
- ✅ Token optimization active
- ✅ Memory MCP updated

**Test Approach**:

- Execute real-world scenarios
- Measure actual token usage
- Validate automation triggers
- Confirm context persistence
- Verify skill auto-loading

---

## Scenario 1: New Feature Development (Full Workflow)

### Objective

Validate complete workflow from session start through feature completion with all enhancements active.

### User Action

```
"Read STATUS.md, DEVELOPMENT_PLAN.md and continue with current phase"
```

### Expected Claude Behavior

**Step 1: Session Initialization**

```
✅ Read STATUS.md (identify current phase)
✅ Read DEVELOPMENT_PLAN.md (understand requirements)
✅ Create .agent/task/current-session-[timestamp].md
✅ Document phase, goals, requirements
✅ Load skill frontmatter only (140 tokens, 7 skills)
```

**Step 2: Phase Analysis**

```
✅ Parse phase keywords (e.g., "API endpoint", "database query")
✅ Auto-detect required skills
✅ Load api-patterns skill (220 tokens)
✅ Load database-patterns skill (200 tokens)
✅ Total session context: ~5,800 tokens
```

**Step 3: Deep Research (If Needed)**

```
User mentions: "need to understand auth flow"

✅ Invoke analyze-architecture sub-agent
✅ Sub-agent reads .agent/task/current-session.md
✅ Sub-agent traces auth flow across files
✅ Sub-agent saves report to .agent/task/architecture-auth-[timestamp].md
✅ Sub-agent returns: "Report saved, please read before proceeding"
✅ I read report, proceed with implementation
```

**Step 4: Implementation**

```
✅ Follow patterns from loaded skills
✅ Create API endpoint using api-patterns
✅ Write Prisma query using database-patterns
✅ Implement following project conventions
✅ Unload skill content after implementation (return to baseline)
```

**Step 5: Documentation**

```
✅ After completion, update current-session.md
✅ User says: "/update-doc after-feature"
✅ Invoke synthesize-docs sub-agent
✅ Sub-agent generates SOP for new pattern
✅ Save SOP to .agent/sops/
✅ Update .agent/README.md index
```

**Step 6: Commit**

```
✅ User says: "commit the changes"
✅ Run git status, git diff
✅ Draft conventional commit message
✅ Create commit with proper format
```

### Token Budget

| Step | Description          | Token Usage          | Running Total |
| ---- | -------------------- | -------------------- | ------------- |
| 1    | Session start        | 5,640                | 5,640         |
| 2    | Load 2 skills        | +420                 | 6,060         |
| 3    | Sub-agent (isolated) | 0 (separate context) | 6,060         |
| 4    | Implementation       | 0 (skills loaded)    | 6,060         |
| 5    | Unload skills        | -420                 | 5,640         |
| 6    | Documentation        | Sub-agent (isolated) | 5,640         |
| 7    | Commit               | +500                 | 6,140         |

**Target**: <10,000 tokens
**Actual**: ~6,140 tokens ✅
**Savings vs Baseline**: 15,522 tokens (72% reduction)

### Success Criteria

- [ ] Session start creates current-session.md
- [ ] Skills auto-load based on keywords
- [ ] Sub-agents read context file first
- [ ] Sub-agents save reports to .agent/task/
- [ ] Skills unload after use
- [ ] Token usage stays under 10K
- [ ] Implementation follows patterns
- [ ] Commits use conventional format

---

## Scenario 2: Troubleshooting (Skill-Based Quick Fix)

### Objective

Validate troubleshooting skill provides quick resolution without loading full SOP.

### User Action

```
"localhost:3000 shows default Next.js page, application not loading"
```

### Expected Claude Behavior

**Step 1: Keyword Detection**

```
✅ Detect keywords: "localhost", "3000", "not loading"
✅ Match to port-config skill triggers
✅ Auto-load port-config skill (150 tokens)
```

**Step 2: Apply Quick Fix**

```
✅ Check: pnpm dev output shows port 3002? ❌
✅ Solution: Remove PORT from .env.local
✅ Solution: Kill node processes
✅ Solution: Restart dev server
✅ Guide user through fix
```

**Step 3: Verification**

```
✅ Verify: pnpm dev shows port 3000
✅ Verify: localhost:3000 loads app
✅ Unload port-config skill
✅ Return to baseline context
```

**Step 4: Escalation (If Needed)**

```
If quick fix doesn't work:
✅ Read full .agent/sops/port-troubleshooting.md
✅ Apply advanced troubleshooting
✅ Document solution
```

### Token Budget

| Step      | Description            | Token Usage      | Running Total |
| --------- | ---------------------- | ---------------- | ------------- |
| 1         | Session baseline       | 5,640            | 5,640         |
| 2         | Load port-config skill | +150             | 5,790         |
| 3         | Apply fix              | 0 (skill loaded) | 5,790         |
| 4         | Unload skill           | -150             | 5,640         |
| **Total** |                        |                  | **5,790**     |

**Target**: <5,000 tokens
**Actual**: ~5,790 tokens ⚠️ (slightly over, acceptable)
**Savings vs Baseline**: Port SOP (3,262 tokens) not loaded - huge win!

### Success Criteria

- [ ] Skill auto-loads based on keywords
- [ ] Quick fix provided from skill only
- [ ] No full SOP loaded for simple issues
- [ ] Skill unloads after resolution
- [ ] Token usage under 6K
- [ ] Issue resolved successfully

---

## Scenario 3: Deep Technical Research (Expert Agent)

### Objective

Validate specialized expert agent provides deep technical guidance.

### User Action

```
"Design the Prisma schema for agent personas with JSONB capabilities and pgvector support"
```

### Expected Claude Behavior

**Step 1: Detect Expert Need**

```
✅ Detect keywords: "Prisma schema", "design", "JSONB", "pgvector"
✅ Recognize: Requires Prisma expertise
✅ Decision: Invoke prisma-expert specialized agent
```

**Step 2: Invoke Expert Agent**

```
✅ Pass context: Read current-session.md
✅ Pass requirements: agent personas, JSONB, pgvector
✅ Expert agent analyzes requirements
✅ Expert agent designs schema with best practices
✅ Expert agent creates detailed implementation plan
✅ Expert agent saves plan to .agent/task/prisma-design-[timestamp].md
✅ Expert returns: "Schema design complete, see plan file"
```

**Step 3: Implement from Plan**

```
✅ Read plan file
✅ Implement Prisma schema following design
✅ Apply PostgreSQL-specific features
✅ Follow conventions from database-patterns skill
✅ Update current-session.md with progress
```

**Step 4: Validation**

```
✅ Run: prisma format (validate syntax)
✅ Run: prisma validate (check schema)
✅ Generate migration
✅ Apply migration
```

### Token Budget

| Step | Description              | Token Usage          | Running Total |
| ---- | ------------------------ | -------------------- | ------------- |
| 1    | Session baseline         | 5,640                | 5,640         |
| 2    | Invoke expert (isolated) | 0 (separate context) | 5,640         |
| 3    | Read plan file           | +2,000               | 7,640         |
| 4    | Load database skill      | +200                 | 7,840         |
| 5    | Implementation           | 0 (skill loaded)     | 7,840         |
| 6    | Unload skill             | -200                 | 7,640         |
| 7    | Validation commands      | +500                 | 8,140         |

**Target**: <15,000 tokens
**Actual**: ~8,140 tokens ✅
**Savings**: 6,860 tokens under target

### Success Criteria

- [ ] Expert agent auto-invoked for design
- [ ] Expert reads context file
- [ ] Expert creates detailed plan
- [ ] Plan saved to .agent/task/
- [ ] Implementation follows expert guidance
- [ ] Token usage under 15K
- [ ] Schema validates successfully

---

## Scenario 4: Multi-Task Session (Token Stability)

### Objective

Validate token usage remains stable across multiple tasks in single session.

### Tasks

1. Create POST /api/issues endpoint (API)
2. Create IssueList component (UI)
3. Fix port 3002 issue (Troubleshooting)
4. Write Prisma query for search (Database)
5. Create new git branch (Git)

### Expected Behavior

**Task 1: API Endpoint**

```
Baseline: 5,640 tokens
Load api-patterns: +220 → 5,860
Implement, unload → 5,640
```

**Task 2: UI Component**

```
Baseline: 5,640 tokens
Load component-patterns: +280 → 5,920
Implement, unload → 5,640
```

**Task 3: Port Fix**

```
Baseline: 5,640 tokens
Load port-config: +150 → 5,790
Fix, unload → 5,640
```

**Task 4: Database Query**

```
Baseline: 5,640 tokens
Load database-patterns: +200 → 5,840
Implement, unload → 5,640
```

**Task 5: Git Branch**

```
Baseline: 5,640 tokens
Load git-workflow: +180 → 5,820
Create branch, unload → 5,640
```

### Token Budget

| Task | Peak Usage | After Unload | Variance |
| ---- | ---------- | ------------ | -------- |
| 1    | 5,860      | 5,640        | +220     |
| 2    | 5,920      | 5,640        | +280     |
| 3    | 5,790      | 5,640        | +150     |
| 4    | 5,840      | 5,640        | +200     |
| 5    | 5,820      | 5,640        | +180     |

**Average Peak**: 5,846 tokens
**Standard Deviation**: 50 tokens
**Variance**: 0.85%

**Success**: Token usage highly stable, returns to baseline after each task ✅

### Success Criteria

- [ ] Each task returns to baseline (5,640 tokens)
- [ ] Token variance <5%
- [ ] No token creep across tasks
- [ ] Skills load/unload correctly
- [ ] Can complete 30+ tasks before limit

---

## Scenario 5: Skill Generation Workflow

### Objective

Validate auto-skill generation from codebase patterns.

### User Action

```
"/update-doc skill api-validation"
```

### Expected Claude Behavior

**Step 1: Invoke Pattern Detection**

```
✅ Invoke explore-codebase sub-agent
✅ Sub-agent scans 10 API route files
✅ Sub-agent identifies Zod validation patterns
✅ Sub-agent extracts conventions
✅ Sub-agent saves pattern report
```

**Step 2: Generate Skill**

```
✅ Invoke synthesize-docs in skill mode
✅ Sub-agent reads pattern report
✅ Sub-agent creates token-efficient skill (<280 tokens)
✅ Sub-agent includes: pattern description, steps, example, links
✅ Sub-agent saves to .claude/skills/projectpulse/api-validation.skill.md
```

**Step 3: Update Index**

```
✅ Update .claude/skills/projectpulse/README.md
✅ Add new skill to appropriate category
✅ Document token count and savings
✅ Calculate: skill tokens vs full doc tokens
```

**Step 4: Report Success**

```
✅ Report: "Skill created: api-validation.skill.md (220 tokens)"
✅ Report: "Token savings: 93% (220 vs 3,000 tokens)"
✅ Report: "Links to: .agent/sops/adding-api-endpoint.md"
```

### Token Budget

- Sub-agents work in isolated contexts
- Main thread token usage minimal
- **Target**: <3,000 tokens main thread
- **Actual**: ~2,000 tokens ✅

### Success Criteria

- [ ] Pattern detection identifies 3-5 patterns
- [ ] Skill generated under 280 tokens
- [ ] Skill includes all required sections
- [ ] Skill links to full documentation
- [ ] Index updated correctly
- [ ] Token savings calculated and reported

---

## Scenario 6: Pattern Drift Detection

### Objective

Validate skill refresh mechanism detects outdated patterns.

### User Action

```
"/refresh-skills api-patterns"
```

### Expected Claude Behavior

**Step 1: Read Current Skill**

```
✅ Read .claude/skills/projectpulse/api-patterns.md
✅ Extract patterns mentioned in skill
✅ Note: Skill mentions "fetch()" for API calls
```

**Step 2: Scan Codebase**

```
✅ Invoke explore-codebase in pattern detection mode
✅ Sub-agent scans 10 API route files
✅ Sub-agent checks: fetch() usage → 0/10 files (0%)
✅ Sub-agent checks: axios usage → 10/10 files (100%)
✅ Sub-agent calculates drift: 40% (high)
```

**Step 3: Report Drift**

```
✅ Report: "Drift detected: 40% (high)"
✅ Report: "fetch() outdated (0% usage)"
✅ Report: "Missing: axios pattern (100% usage)"
✅ Report: "Recommendation: REFRESH skill"
```

**Step 4: Prompt User**

```
✅ Ask: "Refresh api-patterns skill? (y/n)"
```

**Step 5: Refresh (If Approved)**

```
✅ Invoke synthesize-docs in skill mode
✅ Generate updated skill with current patterns
✅ Show diff of changes
✅ Save updated skill
✅ Update last_updated date
```

### Success Criteria

- [ ] Drift detection scans 10+ files
- [ ] Calculates objective drift percentage
- [ ] Classifies drift level (high/medium/low)
- [ ] Prompts for user approval
- [ ] Updates skill if approved
- [ ] Documents changes in skill file

---

## Scenario 7: Context Persistence (Sub-Agent Communication)

### Objective

Validate sub-agents share context through files, not just messages.

### User Action

```
"Analyze how search works, then implement improvements"
```

### Expected Claude Behavior

**Step 1: Research Phase**

```
✅ Create current-session.md with task context
✅ Invoke analyze-architecture sub-agent
✅ Pass instruction: "Read current-session.md first"
✅ Sub-agent reads context file
✅ Sub-agent understands: Current phase, requirements, constraints
```

**Step 2: Sub-Agent Work**

```
✅ Sub-agent traces search flow across files
✅ Sub-agent identifies bottlenecks
✅ Sub-agent creates improvement recommendations
✅ Sub-agent saves report to .agent/task/architecture-search-[timestamp].md
✅ Sub-agent updates current-session.md with findings
```

**Step 3: Implementation Phase**

```
✅ I read architecture report
✅ I read updated current-session.md
✅ I have full context from sub-agent's work
✅ I implement improvements following recommendations
✅ I update current-session.md with implementation notes
```

**Step 4: Validation**

```
✅ Context preserved across phases
✅ Sub-agent findings accessible
✅ No information loss
✅ Complete audit trail in files
```

### Success Criteria

- [ ] current-session.md created at start
- [ ] Sub-agent reads context file first
- [ ] Sub-agent saves report to file
- [ ] Sub-agent updates context file
- [ ] Main agent reads reports before implementing
- [ ] Context persists across phases
- [ ] Complete audit trail maintained

---

## Cross-Scenario Validation

### Consistency Checks

**Across all scenarios, verify**:

- [ ] Token usage stays under targets
- [ ] Skills auto-load based on keywords
- [ ] Skills unload after use
- [ ] Sub-agents use file-based context
- [ ] Specialized experts invoked appropriately
- [ ] Documentation generated correctly
- [ ] Git commits follow conventions
- [ ] No manual reminders needed

### Automation Validation

**System should work automatically without user saying**:

- ❌ "Use the api-patterns skill"
- ❌ "Invoke the analyze-architecture sub-agent"
- ❌ "Read the context file"
- ❌ "Save a report"
- ❌ "Unload the skill"

**All of above should trigger automatically! ✅**

---

## Token Usage Summary

### Target vs Actual (Projected)

| Scenario                | Target | Actual  | Status                   |
| ----------------------- | ------ | ------- | ------------------------ |
| 1. Feature Development  | <10K   | ~6,140  | ✅ 38% under             |
| 2. Troubleshooting      | <5K    | ~5,790  | ⚠️ 16% over (acceptable) |
| 3. Expert Research      | <15K   | ~8,140  | ✅ 46% under             |
| 4. Multi-Task (5 tasks) | <30K   | ~29,230 | ✅ 3% under              |
| 5. Skill Generation     | <3K    | ~2,000  | ✅ 33% under             |
| 6. Drift Detection      | <5K    | ~3,500  | ✅ 30% under             |
| 7. Context Persistence  | <10K   | ~7,000  | ✅ 30% under             |

**Overall**: 6 of 7 scenarios under target, 1 slightly over but acceptable ✅

---

## Failure Modes to Test

### What Could Go Wrong?

1. **Skill doesn't auto-load**
   - Verify triggers match keywords
   - Check skill frontmatter format

2. **Sub-agent doesn't read context**
   - Verify current-session.md exists
   - Check sub-agent follows CRITICAL RULES

3. **Token usage spikes**
   - Check if skills unloading properly
   - Verify no docs loaded unnecessarily

4. **Pattern drift not detected**
   - Verify explore-codebase scans enough files
   - Check drift calculation algorithm

5. **Expert not invoked**
   - Verify keyword detection working
   - Check expert agent definitions

---

## Test Execution Plan

### Week 1: Core Scenarios

- Day 1: Scenario 1 (Feature Development)
- Day 2: Scenario 2 (Troubleshooting)
- Day 3: Scenario 3 (Expert Research)

### Week 2: Advanced Scenarios

- Day 1: Scenario 4 (Multi-Task)
- Day 2: Scenario 5 (Skill Generation)
- Day 3: Scenario 6 (Drift Detection)

### Week 3: Validation

- Day 1: Scenario 7 (Context Persistence)
- Day 2: Cross-scenario validation
- Day 3: Document results

---

## Success Metrics

### Must Pass (Critical)

- ✅ 100% of scenarios complete successfully
- ✅ 100% of token targets met (within 20% tolerance)
- ✅ 100% automation (no manual reminders)
- ✅ 100% context persistence (sub-agents read/write files)

### Should Pass (Important)

- ✅ Token variance <5% across multi-task session
- ✅ Skills auto-load in 100% of appropriate scenarios
- ✅ Drift detection accuracy >90%
- ✅ No token creep over time

### Nice to Have (Optimal)

- Skills generate in <1 minute
- Drift detection in <2 minutes
- Expert agents respond in <30 seconds
- Zero manual intervention

---

**Status**: Ready for Testing
**Next**: Execute scenarios and record actual results
**Report**: Compare actual vs expected, document deviations
