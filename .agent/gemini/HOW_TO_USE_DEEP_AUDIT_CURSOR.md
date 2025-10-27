# How to Run Deep Workflow Audit with Cursor AI - v3.0

**Version**: 3.0 (Post-Persistence Implementation)
**Date**: 2025-10-27
**Purpose**: Step-by-step guide for running comprehensive agent workflow audit in Cursor

---

## 🎯 What This Audit Checks

This is a **COMPREHENSIVE** audit covering:

1. ✅ **NEW**: 3-Tier Persistence Strategy (9 files)
2. ✅ **NEW**: Auto-Save Enhancement (6 files updated)
3. ✅ Memory Bank System (5 files) - Re-audit
4. ✅ TDD Workflow - Re-audit
5. ✅ Dependency Mapping - Re-audit
6. ✅ Skills Auto-Loading Keywords
7. ✅ Sub-Agent Workflow Integration
8. ✅ **NEW**: Code Pattern Validation (docs vs actual code)
9. ✅ **NEW**: Config Files Validation (.claude/, .agent/)
10. ✅ **NEW**: Development Plan Alignment (STATUS.md ↔ DEVELOPMENT_PLAN.md)

**Files Audited**: 106 files total

- .agent/: 44 files
- .claude/: 26 files
- docs/: 11 files
- Root: 25 files

**Expected Duration**: 10-15 minutes (audit + report generation)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Open Cursor AI

1. Open your project in Cursor AI editor
2. Open Cursor chat panel (Ctrl+L or Cmd+L on Mac)
3. Make sure all recent changes are committed (audit works on committed files)

### Step 2: Give Cursor the Audit Prompt

**Copy and paste this EXACT prompt into Cursor chat:**

```
Read the file at .agent/gemini/deep-workflow-audit-cursor-v3.md

Then perform a comprehensive deep workflow audit using those instructions.

This is a v3.0 audit covering:
1. NEW: 3-Tier Persistence Strategy (files, checkpoints, strategic knowledge)
2. NEW: Auto-Save Enhancement (proactive save at 160K tokens)
3. Memory Bank System (5 files) - Re-audit
4. TDD Workflow - Re-audit
5. Dependency Mapping - Re-audit
6. Skills Auto-Loading Keywords
7. Sub-Agent Workflow Integration
8. NEW: Code Pattern Validation (docs vs actual code)
9. NEW: Config Files Validation (.claude/, .agent/)
10. NEW: Development Plan Alignment (STATUS.md ↔ DEVELOPMENT_PLAN.md)

Audit ALL 106 files listed in Part 11 of the audit prompt, including:
- .agent/ folder (44 files) - especially persistence files
- .claude/ folder (26 files) - agents, skills, configs
- docs/ folder (11 files) - DEVELOPMENT_PLAN.md, ARCHITECTURE.md, etc.
- Root-level MD files (25 files) - STATUS.md, CLAUDE.md, etc.

Provide output in the EXACT format from Part 12, including:
- Overall readiness score (0-100%) with weighted calculation
- Breakdown by all 10 categories
- Top 20 copy-paste ready fixes with file paths + line numbers
- Gap classification (CRITICAL/MAJOR/MINOR)
- Comparison with v2.0 baseline (64% before Memory Bank + TDD)

Be thorough and critical - we want to find ALL gaps, not inflate scores.

Use the grading guidelines from Part 13:
- 100% = Perfect, zero gaps
- 90-99% = Excellent, minor improvements only
- 70-89% = Good, needs improvements
- 50-69% = Fair, significant gaps
- <50% = Poor, critical gaps

Start the deep workflow audit now.
```

### Step 3: Wait for Results

Cursor will:

1. Analyze all 106 files (8-12 minutes)
2. Generate comprehensive report (3-5 minutes)
3. Return findings in exact format

**Total time**: 10-15 minutes

---

## 📊 What the Audit Report Will Include

### 1. Executive Summary

```markdown
**Overall Automation Readiness**: X% (0-100%)
**Status**: ✅ Production Ready / ⚠️ Needs Improvements / ❌ Critical Gaps
**Comparison with v2.0**: +Y% improvement from 64% baseline
**Summary**: [Brief overview]
```

### 2. Category Breakdown (All 10 Categories)

Each category scored individually:

- 3-Tier Persistence Strategy
- Auto-Save Enhancement
- Memory Bank System
- TDD Workflow
- Dependency Mapping
- Skills Auto-Loading Keywords
- Sub-Agent Workflow Integration
- Code Pattern Validation
- Config Files Validation
- Development Plan Alignment

**Example**:

```markdown
### 1. 3-Tier Persistence Strategy

**Score**: 95% | **Status**: ✅

**Files Checked**: 9/9 exist
**Findings**: All persistence files complete
**Gaps**: 1 MINOR - session template missing example timestamp
```

### 3. Gap Classification

```markdown
**CRITICAL Gaps**: N (blocks automation completely)
**MAJOR Gaps**: N (reduces automation effectiveness)
**MINOR Gaps**: N (reduces efficiency)
```

### 4. Top 20 Copy-Paste Ready Fixes

Each fix includes:

- ✅ Severity (CRITICAL/MAJOR/MINOR)
- ✅ Category
- ✅ Exact file path
- ✅ Line number or section
- ✅ Current content (exact)
- ✅ Replacement content (exact)
- ✅ Why explanation

**Example**:

```markdown
### Fix #1: Add missing keyword in STATUS.md

**Severity**: MAJOR
**Category**: Skills Auto-Loading
**File**: STATUS.md
**Line**: 89

**Current**:
Day 4: Create comment system UI

**Replace With**:
Day 4: Create comment system UI with **Client Components** (CommentList, CommentForm) and **Prisma queries**

**Why**: Missing keywords prevent auto-loading of component-patterns and database-patterns skills
```

### 5. Verification Checklist

After applying fixes:

- [ ] All CRITICAL gaps resolved
- [ ] All MAJOR gaps addressed
- [ ] Config files valid (no JSON errors)
- [ ] Git status matches docs
- [ ] Files referenced exist

### 6. Recommendations

Prioritized action items:

- **Immediate**: Must do before continuing (CRITICAL gaps)
- **High Priority**: Do this week (MAJOR gaps)
- **Nice to Have**: Future improvements (MINOR gaps)

---

## 📈 Expected Results (Score Predictions)

### Based on Recent Work

**v2.0 Baseline** (before Memory Bank + TDD):

- Overall: 64%
- Issues: Missing memory bank, TDD optional, no dependencies

**v3.0 Target** (after Persistence + Auto-Save):

- Overall: 90-95%
- Improvements: Full persistence system, auto-save, code validation

### Score Interpretation

| Score   | Status                   | Meaning                                |
| ------- | ------------------------ | -------------------------------------- |
| 95-100% | ✅ **Exceptional**       | Production ready, zero gaps            |
| 90-94%  | ✅ **Excellent**         | Production ready, minor improvements   |
| 80-89%  | ⚠️ **Good**              | Mostly ready, some improvements needed |
| 70-79%  | ⚠️ **Fair**              | Needs work before production           |
| 60-69%  | ⚠️ **Needs Improvement** | Significant gaps found                 |
| <60%    | ❌ **Poor**              | Critical gaps block automation         |

### What Improved Since v2.0

**New in v3.0**:

1. ✅ 3-Tier Persistence Strategy (9 new files)
2. ✅ Auto-Save Enhancement (6 files updated)
3. ✅ Code Pattern Validation (docs vs actual code)
4. ✅ Config Files Validation (.claude/, .agent/)
5. ✅ Development Plan Alignment checks

**Re-audited from v2.0**:

1. ✅ Memory Bank System (should be complete now)
2. ✅ TDD Workflow (should say "for ALL tasks")
3. ✅ Dependency Mapping (Phase 3+ tasks)

---

## 🔧 What to Do with Results

### If Score is 90%+ (Production Ready) ✅

**Great!** Workflow is production ready.

**Action Items**:

1. ✅ Apply any MINOR fixes (optional improvements)
2. ✅ Save audit report to `.agent/gemini/deep-workflow-audit-[YYYYMMDD]-cursor-v3.md`
3. ✅ Continue with current work (Phase 3 Day 4 or next task)
4. ✅ Celebrate! 🎉

**No re-audit needed**.

---

### If Score is 70-89% (Needs Improvements) ⚠️

**Some gaps found** - fix before continuing.

**Action Items**:

1. **Apply Top 10 Fixes First** (15-20 minutes)
   - Focus on CRITICAL and MAJOR gaps
   - Use copy-paste ready fixes from report
   - Verify each fix before moving to next

2. **Update Documentation** (5-10 minutes)
   - Commit fixes to git
   - Update STATUS.md if needed

3. **Re-Run Audit** (Optional - 10 minutes)
   - Verify improvements
   - Confirm score increased
   - Check all CRITICAL gaps resolved

**Timeline**: 30-40 minutes total

---

### If Score is <70% (Critical Gaps) ❌

**Major issues found** - must fix before automation will work.

**Action Items**:

1. **STOP Current Work** ⚠️
   - Do NOT continue Phase 3 Day 4 or other tasks
   - Fix documentation first

2. **Apply ALL CRITICAL Fixes** (30-45 minutes)
   - Focus only on CRITICAL gaps
   - Apply fixes exactly as shown
   - Verify each fix

3. **Review Implementation** (15-20 minutes)
   - Check if persistence files were created correctly
   - Verify auto-save docs added to all 6 files
   - Ensure git commits match documentation

4. **Re-Run Audit** (Required - 10-15 minutes)
   - Confirm all CRITICAL gaps resolved
   - Verify score improved to 70%+
   - Apply remaining MAJOR fixes

**Timeline**: 1-1.5 hours total

---

## 🐛 Troubleshooting

### Problem: Cursor Can't Find Files

**Error**: "File not found: .agent/gemini/deep-workflow-audit-cursor-v3.md"

**Solution**:

```bash
# Verify audit prompt exists
ls -la .agent/gemini/deep-workflow-audit-cursor-v3.md

# If missing, check git status
git status

# File should be committed
git log --oneline -1
# Should show: docs(audit): Create deep workflow audit v3.0 prompt
```

If file missing:

1. Create it manually from this guide
2. Commit to git
3. Re-run Cursor audit

---

### Problem: Cursor Gives Generic Response

**Error**: Cursor provides vague feedback without scores or specifics

**Solutions**:

**Option 1: Paste Prompt Directly**

1. Open `.agent/gemini/deep-workflow-audit-cursor-v3.md`
2. Copy ENTIRE contents (~800 lines)
3. Paste into Cursor chat
4. Add: "Now perform this audit and give me the report in the exact format specified."

**Option 2: Be More Specific**

```
Focus on these priority areas first:
1. 3-Tier Persistence Strategy (9 files in .agent/)
2. Auto-Save Enhancement (6 files updated)
3. Code Pattern Validation (docs vs actual code)

Provide scores (0-100%) for each category.
Provide top 20 copy-paste ready fixes with file paths.
Use the exact output format from Part 12 of the audit prompt.
```

**Option 3: Re-Start Cursor**

- Close and reopen Cursor
- Start new chat session
- Try again with original prompt

---

### Problem: Cursor Takes Too Long (>20 minutes)

**Error**: Audit runs for 20+ minutes without results

**Root Cause**: Analyzing 106 files is time-consuming for large context

**Solutions**:

**Option 1: Wait Patiently** (Recommended)

- Cursor is analyzing properly
- 106 files take time
- Let it finish (up to 25 minutes acceptable)

**Option 2: Quick Audit** (If Urgent)

```
Focus on the NEW features only (quicker audit):
1. 3-Tier Persistence Strategy (9 files)
2. Auto-Save Enhancement (6 files)
3. Code Pattern Validation (check 5 files only)

Give me quick findings for these 3 categories only.
Provide top 10 fixes (not 20).
```

**Option 3: Use Gemini Instead**

- Gemini has 1M context window (faster for large audits)
- Follow GEMINI.md workflow
- Use same audit prompt

---

### Problem: Cursor Score Seems Inflated

**Error**: Cursor gives 95%+ but you see obvious gaps

**Root Cause**: Cursor may not be checking files thoroughly

**Solutions**:

**Option 1: Manual Spot Check**

```bash
# Check if persistence files exist
ls -la .agent/workflows/persistence-rules.md
ls -la .agent/task/templates/*.md
ls -la .agent/testing/persistence-*.md

# Check if auto-save documented
grep "Auto-Save" .agent/workflows/persistence-rules.md
grep "160K" CLAUDE.md

# Check test scenario 13
grep "Scenario 13" .agent/testing/persistence-test-scenarios.md
```

**Option 2: Ask Cursor to Re-Check**

```
Your score of 95% seems high. Please re-check these specific items:

1. Does .agent/workflows/persistence-rules.md have "Automatic Pre-Compaction Save" section?
2. Does CLAUDE.md mention auto-save at 160K tokens?
3. Does .agent/testing/persistence-test-scenarios.md have Scenario 13?
4. Does STATUS.md current phase match DEVELOPMENT_PLAN.md?
5. Do actual API routes use Zod validation as documented?

Re-score based on these specific checks.
```

**Option 3: Request Evidence**

```
For each category you scored 90%+, provide:
- Which files you checked (list file paths)
- What you found (quote exact text)
- Why you gave that score

This ensures accuracy.
```

---

### Problem: Can't Understand Some Fixes

**Error**: Fix #X is unclear or seems wrong

**Solution**: Ask Cursor for Clarification

```
Can you explain Fix #X in more detail?

Specifically:
- What is the current issue?
- Why does this fix solve it?
- Are there any side effects?
- Should I make any related changes?
```

---

## 📝 After Applying Fixes

### Step 1: Verify Fixes Work

**Run these checks**:

```bash
# 1. Verify persistence files exist
ls -la .agent/workflows/persistence-rules.md
ls -la .agent/task/templates/current-session-template.md
ls -la .agent/task/templates/current-todos-template.md

# 2. Verify auto-save documented in all 6 files
grep -l "Auto-Save\|auto-save" \
  .agent/workflows/persistence-rules.md \
  CLAUDE.md \
  .agent/WORKFLOW_PROMPTS.md \
  .agent/testing/persistence-test-scenarios.md \
  .agent/testing/persistence-validation-checklist.md \
  .agent/examples/persistence-examples.md

# Should show all 6 files

# 3. Verify Scenario 13 exists
grep "Scenario 13" .agent/testing/persistence-test-scenarios.md

# 4. Verify STATUS.md matches DEVELOPMENT_PLAN.md
grep "Current Phase" STATUS.md
grep "CURRENT STATUS" docs/DEVELOPMENT_PLAN.md
# Should match

# 5. Verify config valid JSON
cat .claude/settings.local.json | jq .
# Should not error
```

**All checks pass?** ✅ Ready to commit

---

### Step 2: Commit Changes

```bash
# Add all changes
git add .

# Create comprehensive commit message
git commit -m "docs(audit): Apply deep workflow audit v3.0 fixes

Applied top 20 fixes from Cursor AI deep workflow audit v3.0:

CRITICAL Fixes (N):
1. [Fix #1 summary]
2. [Fix #2 summary]

MAJOR Fixes (N):
1. [Fix #X summary]
2. [Fix #Y summary]

MINOR Fixes (N):
1. [Fix #Z summary]

Automation readiness improved:
- Before: 64% (v2.0 baseline)
- After: [new score]%
- Improvement: +[difference]%

Category improvements:
- 3-Tier Persistence: [score]%
- Auto-Save Enhancement: [score]%
- Memory Bank System: [score]%
- TDD Workflow: [score]%
- Dependency Mapping: [score]%
- Skills Auto-Loading: [score]%
- Sub-Agent Workflow: [score]%
- Code Pattern Validation: [score]%
- Config Files Validation: [score]%
- Development Plan Alignment: [score]%

Files audited: 106 total
- .agent/: 44 files
- .claude/: 26 files
- docs/: 11 files
- Root: 25 files

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Step 3: Save Audit Report

```bash
# Save report with timestamp
# Copy Cursor's entire response
# Paste into file:
.agent/gemini/deep-workflow-audit-[YYYYMMDD]-cursor-v3.md

# Example:
.agent/gemini/deep-workflow-audit-20251027-cursor-v3.md
```

---

### Step 4: Optional Re-Audit (If Score < 90%)

To verify improvements:

```
Read .agent/gemini/deep-workflow-audit-cursor-v3.md again

Perform a quick re-audit focusing ONLY on the areas I just fixed:
- [List categories that had CRITICAL/MAJOR gaps]

Compare the new scores with the previous scores.
Confirm all CRITICAL gaps are now resolved.
Provide updated overall score.

Format: Brief report with before/after comparison.
```

**Expected**:

- Before: X%
- After: Y%
- Change: +Z%

If score improved to 90%+: ✅ Done!
If score still <90%: Apply remaining fixes and re-audit again.

---

## 📊 Success Criteria

**The audit was successful if you got:**

1. ✅ Overall readiness score (0-100%)
2. ✅ Breakdown by all 10 categories
3. ✅ Top 20 copy-paste ready fixes
4. ✅ File paths + line numbers for each fix
5. ✅ Gap classification (CRITICAL/MAJOR/MINOR)
6. ✅ Comparison with v2.0 baseline (64%)
7. ✅ Followed exact output format from audit prompt Part 12
8. ✅ Checked all 106 files listed in Part 11

**The audit failed if you got:**

1. ❌ No overall score
2. ❌ Generic feedback without specifics
3. ❌ Missing category breakdowns
4. ❌ No file paths or line numbers
5. ❌ Didn't check persistence files (Parts 1-2)
6. ❌ Didn't follow output format

---

## 🎯 Quick Reference

**Audit Prompt File**: `.agent/gemini/deep-workflow-audit-cursor-v3.md`
**Results Save Location**: `.agent/gemini/deep-workflow-audit-[YYYYMMDD]-cursor-v3.md`
**Previous Score (v2.0)**: 64% (before Memory Bank + TDD)
**Target Score (v3.0)**: 90-95% (after Persistence + Auto-Save)
**Files Audited**: 106 total
**Duration**: 10-15 minutes
**Re-Audit**: Only if score < 90%

---

## 📚 Related Documentation

**Audit System**:

- [deep-workflow-audit-cursor-v3.md](deep-workflow-audit-cursor-v3.md) - Audit prompt
- [documentation-audit-prompt-cursor-v2.md](documentation-audit-prompt-cursor-v2.md) - Previous audit (v2.0)
- [HOW_TO_USE_CURSOR_AUDIT.md](HOW_TO_USE_CURSOR_AUDIT.md) - v2.0 usage guide

**Persistence System**:

- [.agent/workflows/persistence-rules.md](../workflows/persistence-rules.md) - 3-tier strategy
- [.agent/testing/persistence-test-scenarios.md](../testing/persistence-test-scenarios.md) - Test scenarios
- [.agent/testing/persistence-validation-checklist.md](../testing/persistence-validation-checklist.md) - Validation

**Integration**:

- [CLAUDE.md](../../CLAUDE.md) - Main integration guide
- [STATUS.md](../../STATUS.md) - Current project status
- [DEVELOPMENT_PLAN.md](../../docs/DEVELOPMENT_PLAN.md) - Development plan

---

## 💡 Pro Tips

### Tip #1: Run Audit Before Major Milestones

**Best times to audit**:

- ✅ Before starting new major phase
- ✅ After completing significant features
- ✅ Before merging to master
- ✅ Weekly (maintenance check)

### Tip #2: Track Scores Over Time

**Create score tracker**:

```markdown
# Audit Score History

| Date       | Version | Score | Improvements                        |
| ---------- | ------- | ----- | ----------------------------------- |
| 2025-10-26 | v2.0    | 64%   | Baseline (before Memory Bank + TDD) |
| 2025-10-27 | v3.0    | X%    | Added Persistence + Auto-Save       |
| [Future]   | v3.1    | Y%    | Applied audit fixes                 |
```

**Goal**: Consistent 90%+ scores

### Tip #3: Focus on CRITICAL Gaps First

**Priority order**:

1. **CRITICAL** - Blocks automation completely
2. **MAJOR** - Reduces automation effectiveness
3. **MINOR** - Reduces efficiency

**Apply fixes in this order** - don't skip CRITICAL to fix MINOR.

### Tip #4: Use Audit as Learning Tool

**Recurring gaps = process problem**:

- If same gap appears multiple times → create SOP
- If category always scores low → needs workflow improvement
- If code patterns diverge → need better examples

**Example**:

- Audit finds "keywords missing" 10 times
- Solution: Create SOP for "How to write task descriptions with keywords"
- Save to `.agent/sops/writing-task-descriptions.md`

### Tip #5: Don't Over-Optimize

**90%+ is production ready** - don't spend hours chasing 100%.

**Time allocation**:

- CRITICAL gaps: Fix immediately (1-2 hours)
- MAJOR gaps: Fix this week (2-4 hours)
- MINOR gaps: Fix when convenient (1-2 hours)
- 100% perfection: Not worth the time

---

## 🔄 Maintenance Schedule

### Weekly Quick Check (5 minutes)

```bash
# Run every Monday
# Check key files are current

# 1. Active context current?
grep "Current focus" .agent/active-context.md
# Should mention this week's work

# 2. Progress metrics updated?
grep "Metrics" .agent/progress.md
# Should show recent progress

# 3. STATUS.md current?
grep "Last Updated" STATUS.md
# Should be within last 7 days

# 4. Git status clean?
git status
# Should match STATUS.md documentation
```

**If any checks fail** → Update file or run full audit.

---

### Monthly Deep Audit (1 hour)

**First Monday of each month**:

1. Run full v3.0 audit (15 minutes)
2. Review score trend (5 minutes)
3. Apply top 10 fixes (30 minutes)
4. Re-audit to verify (10 minutes)
5. Document lessons learned (10 minutes)

**Goal**: Maintain 90%+ automation readiness.

---

### After Major Changes (As Needed)

**Trigger full audit when**:

- New phase started (e.g., Phase 4)
- New workflow added (e.g., deployment workflow)
- Major refactor (e.g., switching state management)
- Team member onboarding (verify docs are current)

---

## 🚀 You're Ready!

**Next steps**:

1. ✅ Copy Step 2 prompt into Cursor
2. ✅ Wait 10-15 minutes for audit
3. ✅ Review findings
4. ✅ Apply top 20 fixes
5. ✅ Commit changes
6. ✅ Save audit report
7. ✅ Continue development!

**Questions?** Check troubleshooting section above.

**Good luck!** 🎉
