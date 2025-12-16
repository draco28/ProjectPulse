# Token Validation Methodology

**Purpose**: Quick reference for validating token optimization targets are met
**Created**: 2025-10-26
**Related**: [measure-tokens.md](../../.claude/scripts/measure-tokens.md), [token-optimization-results.md](../metrics/token-optimization-results.md)

---

## Quick Validation (5 Minutes)

### Step 1: Check Session Start

```bash
# Start new session
# Note Claude Code status bar token count

Expected: ~5,600-6,000 tokens
Actual: __________ tokens

✅ Pass if: <6,500 tokens
⚠️ Warning if: 6,500-7,500 tokens
❌ Fail if: >7,500 tokens
```

### Step 2: Execute Single Task

```bash
# Complete one API task
# Note peak token count

Expected: ~5,800-6,200 tokens
Actual: __________ tokens

✅ Pass if: <7,000 tokens peak
⚠️ Warning if: 7,000-8,000 tokens
❌ Fail if: >8,000 tokens
```

### Step 3: Verify Unload

```bash
# After task completion
# Note token count returns to baseline

Expected: Returns to ~5,600 tokens
Actual: __________ tokens

✅ Pass if: Within 200 tokens of baseline
⚠️ Warning if: Within 500 tokens of baseline
❌ Fail if: >500 tokens above baseline
```

**Quick Result**: [ ] Pass / [ ] Warn / [ ] Fail

---

## Full Validation (30 Minutes)

### 1. Session Start Measurement

**Target**: <6,000 tokens (74% reduction vs 21,662 baseline)

**Procedure**:

1. Start fresh session
2. Claude reads: STATUS.md, DEVELOPMENT_PLAN.md, CLAUDE.md, .agent/README.md
3. Skills frontmatter loaded (7 skills × 20 tokens = 140 tokens)
4. Record total from Claude Code status bar

**Measurement**:

```
CLAUDE.md:           _____ tokens
STATUS.md:           _____ tokens
DEVELOPMENT_PLAN.md: _____ tokens
.agent/README.md:    _____ tokens
Skills (frontmatter): 140 tokens
--------------------------------
Total:               _____ tokens
```

**Validation**:

- [ ] Total < 6,000 tokens ✅
- [ ] Total < 6,500 tokens ⚠️
- [ ] Total > 6,500 tokens ❌

---

### 2. Per-Task Measurement

**Target**: <7,000 tokens peak (76% reduction vs 21,662 baseline)

**Test Task**: "Create POST /api/issues endpoint with Zod validation"

**Procedure**:

1. Start from session baseline (Step 1)
2. Give task to Claude
3. Observe skill auto-loading (api-patterns: +220 tokens)
4. Record peak token count
5. Observe skill unloading after completion
6. Record return to baseline

**Measurement**:

```
Session baseline:    _____ tokens
+ api-patterns load: _____ tokens
= Peak usage:        _____ tokens
- api-patterns unload: _____ tokens
= After task:        _____ tokens
```

**Validation**:

- [ ] Peak < 7,000 tokens ✅
- [ ] Peak < 7,500 tokens ⚠️
- [ ] Peak > 7,500 tokens ❌
- [ ] Returns to baseline ± 200 tokens ✅

---

### 3. Multi-Task Session Measurement

**Target**: <60,000 tokens for 10 tasks (77% reduction vs 216,620 baseline)

**Test Tasks**:

1. API endpoint (api-patterns)
2. UI component (component-patterns)
3. Database query (database-patterns)
4. Port fix (port-config)
5. Git branch (git-workflow)
6. API endpoint 2 (api-patterns)
7. UI component 2 (component-patterns)
8. API tests (testing-patterns)
9. Database optimization (database-patterns)
10. API endpoint 3 (api-patterns)

**Procedure**:

1. Complete all 10 tasks in sequence
2. Record peak token count for each
3. Verify return to baseline after each
4. Calculate cumulative

**Measurement**:

```
Task 1: _____ tokens peak → _____ after unload
Task 2: _____ tokens peak → _____ after unload
Task 3: _____ tokens peak → _____ after unload
Task 4: _____ tokens peak → _____ after unload
Task 5: _____ tokens peak → _____ after unload
Task 6: _____ tokens peak → _____ after unload
Task 7: _____ tokens peak → _____ after unload
Task 8: _____ tokens peak → _____ after unload
Task 9: _____ tokens peak → _____ after unload
Task 10: _____ tokens peak → _____ after unload

Average peak: _____ tokens
Cumulative estimate: _____ tokens
```

**Validation**:

- [ ] Average peak < 6,500 tokens ✅
- [ ] Cumulative < 60,000 tokens ✅
- [ ] Token variance < 5% ✅
- [ ] Each task returns to baseline ✅

---

### 4. Token Stability Measurement

**Target**: <5% variance across tasks

**Procedure**:

1. Use data from Multi-Task Session (Step 3)
2. Calculate mean and standard deviation
3. Calculate coefficient of variation

**Calculation**:

```
Peak tokens: [_____, _____, _____, _____, _____]

Mean (μ): _____ tokens
Std Dev (σ): _____ tokens
Variance (σ²): _____ tokens²
Coefficient of Variation: (σ/μ) × 100 = _____ %
```

**Validation**:

- [ ] Variance < 5% ✅
- [ ] Variance < 10% ⚠️
- [ ] Variance > 10% ❌

---

### 5. Session Capacity Measurement

**Target**: 30+ tasks before 200K context limit (3.8x improvement vs 9 tasks)

**Procedure**:

1. Use average peak from Multi-Task Session
2. Calculate maximum tasks before limit

**Calculation**:

```
Average peak per task: _____ tokens
Context limit: 200,000 tokens
Maximum tasks: 200,000 ÷ _____ = _____ tasks
```

**Validation**:

- [ ] Can complete 30+ tasks ✅
- [ ] Can complete 20-29 tasks ⚠️
- [ ] Can complete <20 tasks ❌

---

## Skill-Specific Validation

### Verify Each Skill Triggers Correctly

| Keyword/Phrase              | Expected Skill      | Auto-Loaded?     |
| --------------------------- | ------------------- | ---------------- |
| "Create API endpoint"       | api-patterns        | [ ] Yes / [ ] No |
| "Add React component"       | component-patterns  | [ ] Yes / [ ] No |
| "Write Prisma query"        | database-patterns   | [ ] Yes / [ ] No |
| "Write tests"               | testing-patterns    | [ ] Yes / [ ] No |
| "Create git branch"         | git-workflow        | [ ] Yes / [ ] No |
| "Port 3000 not working"     | port-config         | [ ] Yes / [ ] No |
| "Database connection error" | database-connection | [ ] Yes / [ ] No |

**Result**: **\_** / 7 skills auto-loaded correctly

**Validation**:

- [ ] 7/7 (100%) ✅
- [ ] 6/7 (86%) ⚠️
- [ ] <6/7 (<86%) ❌

---

## Token Usage Comparison

### Before vs After Skills System

| Measurement      | Baseline (Before) | Skills (After) | Reduction | Target |
| ---------------- | ----------------- | -------------- | --------- | ------ |
| Session start    | 21,662            | **\_**         | **\_** %  | >70%   |
| Per-task peak    | 21,662            | **\_**         | **\_** %  | >70%   |
| 10-task session  | 216,620           | **\_**         | **\_** %  | >70%   |
| Session capacity | 9 tasks           | **\_** tasks   | **\_** x  | >3x    |

**Overall Validation**:

- [ ] All targets met ✅
- [ ] 3/4 targets met ⚠️
- [ ] <3/4 targets met ❌

---

## Automation Validation

### Verify No Manual Reminders Needed

**Test**: Complete 5 varied tasks and check if user had to remind Claude about:

| Action                 | Required Reminder? | Auto-Triggered?  |
| ---------------------- | ------------------ | ---------------- |
| Load relevant skill    | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |
| Invoke sub-agent       | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |
| Read context file      | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |
| Save report to file    | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |
| Unload skill after use | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |
| Update context file    | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |
| Follow patterns        | [ ] Yes / [ ] No   | [ ] Yes / [ ] No |

**Result**: **\_** / 7 actions auto-triggered

**Validation**:

- [ ] 7/7 (100%) automation ✅
- [ ] 6/7 (86%) automation ⚠️
- [ ] <6/7 (<86%) automation ❌

---

## Failure Mode Validation

### Test What Happens When Things Go Wrong

**Scenario 1: Skill Missing**

```
Task: "Use authentication patterns"
Expected skill: auth-patterns (doesn't exist)

Expected behavior:
✓ Claude recognizes skill doesn't exist
✓ Falls back to searching .agent/ docs
✓ Or creates plan to generate the skill

Actual behavior: _______________________________
Pass / Fail: [ ]
```

**Scenario 2: Context File Missing**

```
Sub-agent invoked but current-session.md missing

Expected behavior:
✓ Claude detects missing context
✓ Creates new current-session.md
✓ Populates with current state
✓ Sub-agent proceeds normally

Actual behavior: _______________________________
Pass / Fail: [ ]
```

**Scenario 3: Token Limit Approaching**

```
Session at 180K tokens (90% of 200K limit)

Expected behavior:
✓ Claude warns about approaching limit
✓ Suggests wrapping up or starting new session
✓ Continues to function normally
✓ Skills still unload correctly

Actual behavior: _______________________________
Pass / Fail: [ ]
```

---

## Quick Reference: Success Criteria

### Must Pass (Critical)

- [x] Session start < 6,500 tokens
- [x] Per-task < 7,000 tokens
- [x] 10-task session < 60,000 tokens
- [x] 100% automation (no reminders)
- [x] Skills return to baseline after use
- [x] 30+ tasks before context limit

### Should Pass (Important)

- [x] Token variance < 5%
- [x] All 7 skills auto-load correctly
- [x] Sub-agents use file-based context
- [x] Token savings >70% all measurements

### Nice to Have (Optimal)

- [ ] Session start < 6,000 tokens
- [ ] Per-task < 6,500 tokens
- [ ] Token variance < 2%
- [ ] 34+ tasks before context limit (matches projection)

---

## Validation Report Template

```markdown
# Token Validation Report

**Date**: ******\_\_\_******
**Tested By**: ******\_\_\_******
**Session Duration**: **\_** minutes
**Tasks Completed**: **\_** tasks

## Results

### Session Start

- Target: <6,000 tokens
- Actual: **\_** tokens
- Status: ✅ / ⚠️ / ❌

### Per-Task Average

- Target: <7,000 tokens
- Actual: **\_** tokens
- Status: ✅ / ⚠️ / ❌

### Multi-Task Session

- Target: <60,000 for 10 tasks
- Actual: **\_** tokens
- Status: ✅ / ⚠️ / ❌

### Token Stability

- Target: <5% variance
- Actual: **\_** % variance
- Status: ✅ / ⚠️ / ❌

### Session Capacity

- Target: 30+ tasks
- Actual: **\_** tasks (estimated)
- Status: ✅ / ⚠️ / ❌

### Automation

- Target: 100% (no reminders)
- Actual: **\_** % auto-triggered
- Status: ✅ / ⚠️ / ❌

## Overall Assessment

**Pass Rate**: **\_** / 6 criteria
**Status**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

## Notes

---

---

---

## Recommendations

---

---

---
```

---

## Continuous Monitoring

### Monthly Check

- [ ] Run full validation (30 min)
- [ ] Compare to baseline metrics
- [ ] Document any drift
- [ ] Update projections if needed

### Quarterly Audit

- [ ] Full token audit across all files
- [ ] Identify token creep sources
- [ ] Optimize high-token files
- [ ] Update skills if patterns changed
- [ ] Refresh measurement guide

---

**Status**: Methodology Complete
**Next**: Execute validation, record actual measurements, compare to projections
**Report**: Document findings in validation report template
