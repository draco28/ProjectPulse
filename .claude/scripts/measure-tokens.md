# Token Measurement Guide

**Purpose**: Measure token usage across different optimization strategies
**Created**: 2025-10-26
**For**: ProjectPulse Skills System

---

## Overview

This guide documents how to measure token consumption at different stages:

1. **Baseline** - No optimizations
2. **With Skills** - Current skills system
3. **With All Enhancements** - Full system (skills + context files + sub-agents)

---

## Measurement Points

### Session Start Tokens

**What to measure**: Initial context loaded when session begins

**Baseline (No Optimization)**:

```
Files to Load:
- CLAUDE.md (full version): ~3,000 tokens
- STATUS.md: ~500 tokens
- DEVELOPMENT_PLAN.md: ~1,000 tokens
- .agent/README.md: ~2,000 tokens
- .agent/system/api-catalog.md: ~2,400 tokens
- .agent/system/database-schema.md: ~2,800 tokens
- .agent/system/component-patterns.md: ~3,500 tokens
- .agent/sops/git-workflow.md: ~3,200 tokens
- .agent/sops/port-troubleshooting.md: ~3,262 tokens

Total: ~21,662 tokens at session start
```

**With Skills**:

```
Files to Load:
- CLAUDE.md (optimized): ~3,000 tokens
- STATUS.md: ~500 tokens
- DEVELOPMENT_PLAN.md: ~1,000 tokens
- .agent/README.md (lean index): ~1,000 tokens
- .claude/skills/ frontmatter only: ~140 tokens (7 skills × 20 tokens)

Total: ~5,640 tokens at session start
Savings: ~16,022 tokens (74% reduction)
```

### Per-Task Tokens

**What to measure**: Token usage for completing a single task

**Baseline (No Optimization)**:

```
Task: "Create POST /api/issues endpoint"

Context before task:
- All docs loaded: 21,662 tokens

During task:
- Read api-catalog.md (already in context): 0 additional
- Read database-schema.md (already in context): 0 additional
- All previous context remains: 21,662 tokens

After task:
- All docs still in context: 21,662 tokens
- Context never shrinks

Total for task: 21,662 tokens (constant)
```

**With Skills**:

```
Task: "Create POST /api/issues endpoint"

Context before task:
- CLAUDE.md + session files: 4,500 tokens
- Skill frontmatter: 140 tokens
- Total: 4,640 tokens

During task:
- Load api-patterns skill (full): +220 tokens
- Load database-patterns skill (full): +200 tokens
- Total: 5,060 tokens

After task:
- Unload skill content
- Retain frontmatter only: back to 4,640 tokens

Total for task: 5,060 tokens peak
Savings per task: 16,602 tokens (76% reduction)
```

### Multi-Task Session Tokens

**What to measure**: Cumulative token usage across 10 tasks

**Baseline (No Optimization)**:

```
Session Start: 21,662 tokens

Task 1: 21,662 tokens (constant)
Task 2: 21,662 tokens (constant)
Task 3: 21,662 tokens (constant)
...
Task 10: 21,662 tokens (constant)

Cumulative: 21,662 × 10 = 216,620 tokens
```

**With Skills**:

```
Session Start: 4,640 tokens

Task 1 (API): Load api-patterns (220) = 4,860 → Unload → 4,640
Task 2 (UI): Load component-patterns (280) = 4,920 → Unload → 4,640
Task 3 (DB): Load database-patterns (200) = 4,840 → Unload → 4,640
Task 4 (API): Load api-patterns (220) = 4,860 → Unload → 4,640
Task 5 (Git): Load git-workflow (180) = 4,820 → Unload → 4,640
Task 6 (Port): Load port-config (150) = 4,790 → Unload → 4,640
Task 7 (API+UI): Load 2 skills (500) = 5,140 → Unload → 4,640
Task 8 (DB): Load database-patterns (200) = 4,840 → Unload → 4,640
Task 9 (Test): Load testing-patterns (240) = 4,880 → Unload → 4,640
Task 10 (API): Load api-patterns (220) = 4,860 → Unload → 4,640

Peak per task: 4,640 + avg 230 = ~4,870 tokens
Cumulative: 4,870 × 10 = ~48,700 tokens

Savings: 167,920 tokens (77% reduction)
```

---

## How to Measure

### Method 1: Claude Code UI Token Counter

**Location**: Check Claude Code status bar (bottom right)
**Shows**: Current token usage / 200K limit

**Steps**:

1. Start new session
2. Note starting token count
3. Complete a task
4. Note ending token count
5. Calculate difference

**Example**:

```
Session start: 5,640 / 200,000
After API task: 5,860 / 200,000
Tokens used for task: 5,860 - 5,640 = 220 tokens
```

### Method 2: Manual Estimation

**Tool**: Use online token counter (e.g., OpenAI Tokenizer)
**URL**: https://platform.openai.com/tokenizer

**Steps**:

1. Copy file content
2. Paste into tokenizer
3. Note token count
4. Repeat for all files
5. Sum totals

**Example**:

```
CLAUDE.md: Paste content → 3,024 tokens
STATUS.md: Paste content → 487 tokens
Skills frontmatter: Paste all 7 → 142 tokens
Total: 3,653 tokens
```

### Method 3: Automated Script (Future)

**File**: `.claude/scripts/count-tokens.js`

```javascript
// Future implementation
// Automatically counts tokens in all session files
// Provides breakdown by category
// Tracks over time
```

---

## Test Scenarios

### Scenario 1: Session Start Comparison

**Objective**: Measure token difference at session start

**Baseline Test**:

```
1. Start session WITHOUT skills system
2. Load all documentation:
   - Read CLAUDE.md
   - Read STATUS.md
   - Read DEVELOPMENT_PLAN.md
   - Read .agent/README.md
   - Read all .agent/system/ docs
   - Read relevant .agent/sops/ docs
3. Note total tokens
4. Expected: ~21,000+ tokens
```

**Skills Test**:

```
1. Start session WITH skills system
2. Load optimized documentation:
   - Read CLAUDE.md (optimized)
   - Read STATUS.md
   - Read DEVELOPMENT_PLAN.md
   - Load skill frontmatter only
3. Note total tokens
4. Expected: ~5,600 tokens
5. Calculate savings: (21,000 - 5,600) / 21,000 = 73% reduction
```

### Scenario 2: Single Task Comparison

**Objective**: Measure token usage for one complete task

**Baseline Test**:

```
Task: "Create POST /api/issues endpoint with Zod validation"

1. Session start: 21,000 tokens
2. Complete task (all docs in context)
3. Session end: 21,000 tokens (unchanged)
4. Tokens for task: 21,000 tokens
```

**Skills Test**:

```
Task: "Create POST /api/issues endpoint with Zod validation"

1. Session start: 5,600 tokens
2. Load api-patterns skill: +220 tokens = 5,820
3. Complete task
4. Unload skill: back to 5,600 tokens
5. Tokens for task: 5,820 tokens peak
6. Savings: (21,000 - 5,820) / 21,000 = 72% reduction
```

### Scenario 3: 10-Task Session

**Objective**: Measure cumulative token usage across multiple tasks

**Task List**:

1. Create POST /api/issues endpoint (API)
2. Create IssueList component (UI)
3. Write Prisma query for issues (DB)
4. Add GET /api/issues/:id endpoint (API)
5. Create new git branch (Git)
6. Fix dev server port issue (Troubleshooting)
7. Create issue form with validation (API + UI)
8. Optimize database query (DB)
9. Write API endpoint tests (Testing)
10. Create PATCH /api/issues/:id endpoint (API)

**Baseline Test**:

```
Session start: 21,000 tokens
After 10 tasks: 21,000 tokens (constant)
Cumulative: 210,000 tokens
```

**Skills Test**:

```
Session start: 5,600 tokens

Task 1 (API): 5,820 → 5,600
Task 2 (UI): 5,880 → 5,600
Task 3 (DB): 5,800 → 5,600
Task 4 (API): 5,820 → 5,600
Task 5 (Git): 5,780 → 5,600
Task 6 (Port): 5,750 → 5,600
Task 7 (API+UI): 6,100 → 5,600
Task 8 (DB): 5,800 → 5,600
Task 9 (Test): 5,840 → 5,600
Task 10 (API): 5,820 → 5,600

Average peak: 5,841 tokens
Cumulative: 58,410 tokens
Savings: (210,000 - 58,410) / 210,000 = 72% reduction
```

---

## Recording Results

### Template: Session Measurement

```markdown
## Session: [Date] - [Description]

### Configuration

- Optimization Level: [Baseline / Skills / Full]
- Tasks Completed: [Number]
- Session Duration: [Time]

### Token Measurements

#### Session Start

- Initial context: [X] tokens
- Breakdown:
  - CLAUDE.md: [X] tokens
  - Status files: [X] tokens
  - Skills/Docs: [X] tokens

#### Per Task

| Task | Description | Tokens Peak | Tokens After |
| ---- | ----------- | ----------- | ------------ |
| 1    | [Task name] | [X]         | [X]          |
| 2    | [Task name] | [X]         | [X]          |
| ...  |             |             |              |

#### Summary

- Total tokens used: [X]
- Average per task: [X]
- Peak usage: [X]
- Baseline comparison: [X]% reduction
```

### Example Result

```markdown
## Session: 2025-10-26 - API Development

### Configuration

- Optimization Level: Skills
- Tasks Completed: 5
- Session Duration: 2 hours

### Token Measurements

#### Session Start

- Initial context: 5,640 tokens
- Breakdown:
  - CLAUDE.md: 3,000 tokens
  - Status files: 2,500 tokens
  - Skills frontmatter: 140 tokens

#### Per Task

| Task | Description         | Tokens Peak | Tokens After |
| ---- | ------------------- | ----------- | ------------ |
| 1    | POST /api/issues    | 5,860       | 5,640        |
| 2    | GET /api/issues     | 5,860       | 5,640        |
| 3    | IssueList component | 5,920       | 5,640        |
| 4    | Prisma query        | 5,840       | 5,640        |
| 5    | API tests           | 5,880       | 5,640        |

#### Summary

- Total tokens used: 29,360 tokens
- Average per task: 5,872 tokens
- Peak usage: 5,920 tokens
- Baseline comparison: 73% reduction (vs 105,000 baseline)
```

---

## Key Metrics to Track

### 1. Session Start Reduction

```
Metric: (Baseline Start - Skills Start) / Baseline Start × 100%
Target: >70% reduction
Current: 74% reduction (21,662 → 5,640 tokens)
```

### 2. Per-Task Reduction

```
Metric: (Baseline Task - Skills Task) / Baseline Task × 100%
Target: >70% reduction
Current: 76% reduction (21,662 → 5,060 tokens)
```

### 3. Session Capacity

```
Metric: Number of tasks before 200K context limit
Baseline: ~9 tasks (9 × 21,662 ≈ 195,000)
Skills: ~34 tasks (34 × 5,870 ≈ 200,000)
Improvement: 3.8x more tasks per session
```

### 4. Token Stability

```
Metric: Variance in token usage across tasks
Baseline: 0% variance (always 21,662)
Skills: 4-8% variance (5,640 ± 300 tokens)
```

---

## Validation Checklist

After implementing optimizations, verify:

- [ ] Session start tokens < 6,000 (vs ~22,000 baseline)
- [ ] Per-task tokens < 6,500 (vs ~22,000 baseline)
- [ ] 10-task session < 60,000 tokens (vs ~220,000 baseline)
- [ ] Skills auto-load correctly based on keywords
- [ ] Skills unload after use (return to baseline)
- [ ] Can complete 30+ tasks before context fills
- [ ] Token usage documented in session logs

---

## Continuous Monitoring

### Monthly Review

- Measure token usage for typical sessions
- Compare to baseline metrics
- Identify optimization opportunities
- Update skills if patterns change

### Quarterly Audit

- Full token audit across all files
- Identify token creep (docs growing)
- Optimize high-token files
- Update this measurement guide

---

## Future Enhancements

### Phase 6+

1. **Automated Token Tracking**: Script to measure real-time
2. **Token Dashboard**: Visual display of token usage trends
3. **Anomaly Detection**: Alert when token usage spikes
4. **Predictive Analytics**: Forecast context limit based on task velocity
5. **Token Profiling**: Per-skill usage statistics

---

**Last Updated**: 2025-10-26
**Next Review**: After Phase 6 testing
