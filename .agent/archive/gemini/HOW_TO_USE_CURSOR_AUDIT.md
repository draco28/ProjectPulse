# How to Run Documentation Audit with Cursor AI

**Version**: 2.0 (Post-Option B)
**Date**: 2025-10-26

---

## Quick Start (3 Steps)

### Step 1: Open Cursor AI

1. Open your project in Cursor AI editor
2. Open Cursor chat panel (Ctrl+L or Cmd+L)

### Step 2: Give Cursor the Audit Prompt

**Copy and paste this into Cursor chat:**

```
Read the file at .agent/gemini/documentation-audit-prompt-cursor-v2.md

Then perform a comprehensive documentation audit using those instructions.

Review ALL files listed in Part 6, especially:
- The NEW memory bank files (5 files in .agent/)
- Updated testing-patterns.md (should have TDD section)
- DEVELOPMENT_PLAN.md (should have Dependencies sections)

Check for:
1. Memory Bank System completeness (5 files)
2. TDD workflow documentation (for ALL tasks, not optional)
3. Dependency Mapping (all Phase 3+ tasks have Dependencies)
4. Skills auto-loading keywords (5+ per task)
5. Sub-agent invocation indicators

Provide output in the EXACT format from Part 8 of the audit prompt, including:
- Overall readiness score (0-100%)
- Breakdown by category (Memory Bank, TDD, Dependencies, etc.)
- Top 10 copy-paste ready fixes with file paths and line numbers
- Comparison with previous audit (readiness went from 64% to ?%)

Be thorough and critical - we want to find ALL gaps, not inflate scores.

Start the audit now.
```

### Step 3: Save Results

When Cursor completes the audit:

1. Copy Cursor's entire response
2. Save to: `.agent/gemini/documentation-audit-20251026-cursor-v2.md`
3. Review findings
4. Apply top 10 fixes

---

## What Cursor Will Check

### NEW in Option B (Just Implemented)

**1. Memory Bank System** - 5 files:

- ✅ .agent/project-brief.md exists and complete
- ✅ .agent/system-patterns.md exists and complete
- ✅ .agent/tech-context.md exists and complete
- ✅ .agent/active-context.md exists and matches current phase
- ✅ .agent/progress.md exists and has latest metrics

**2. TDD for ALL Tasks**:

- ✅ testing-patterns.md has TDD section
- ✅ Says "For ALL tasks" (not "for complex tasks")
- ✅ Has TDD examples (API + Component)
- ✅ Token estimate: 320 (not 240)
- ✅ TDD workflow documented (RED → GREEN → REFACTOR)

**3. Dependency Mapping**:

- ✅ All Phase 3 tasks have "Dependencies:" section
- ✅ Day 3: Has 5+ specific dependencies
- ✅ Day 4: Has 6+ specific dependencies
- ✅ Days 5-6: Each page has dependencies listed
- ✅ Dependencies verifiable (specific models/files)

### What Improved Since Last Audit

**Last Audit** (Cursor/GPT - October 26, AM):

- Score: 64% readiness
- 5 CRITICAL gaps found
- 10 files reviewed

**Expected This Audit** (Cursor - October 26, PM):

- Score: 85-95% readiness (target)
- 0-2 CRITICAL gaps expected
- 20+ files reviewed (including new memory bank)

**Improvements Made**:

1. Created 5 memory bank files
2. Added TDD section to testing-patterns.md
3. Added dependencies to all Phase 3 tasks
4. Updated CLAUDE.md with memory bank docs
5. Updated .agent/README.md with memory bank
6. Updated WORKFLOW_PROMPTS.md with TDD + dependencies

---

## Expected Output Format

Cursor should return a report like this:

````markdown
# Documentation Audit Report - v2.0 (Post-Option B)

**Overall Automation Readiness**: 87%

**Breakdown:**

- Memory Bank System: 90% ✅
- TDD Workflow: 95% ✅
- Dependency Mapping: 85% ✅
- Skills Auto-Loading: 80% ⚠️
- Sub-Agent Invocation: 75% ⚠️
- Cross-References: 90% ✅

**Status**: NEEDS MINOR IMPROVEMENTS

**Critical Gaps Found**: 1
**Minor Gaps Found**: 4

---

## Top 10 Copy-Paste Ready Fixes

### Fix #1: Add missing keyword in STATUS.md

**File**: STATUS.md
**Line**: 89
**Current**:

```markdown
Create comment system UI
```
````

**Replace With**:

```markdown
Create comment system UI with **Client Components** (CommentList, CommentForm) and **Prisma queries**
```

[... fixes 2-10]

````

---

## What to Do with Results

### If Score is 90%+ (Production Ready)

✅ **Great!** No major issues found.

**Action Items:**
1. Review minor gaps (if any)
2. Apply optional enhancements
3. Continue with current work (Phase 3 Day 4)

### If Score is 70-89% (Needs Improvements)

⚠️ **Some gaps found** - fix before continuing.

**Action Items:**
1. Apply top 10 fixes immediately
2. Re-run audit to verify improvements
3. Update relevant documentation

### If Score is <70% (Critical Gaps)

❌ **Major issues** - must fix before automation will work.

**Action Items:**
1. Apply ALL CRITICAL fixes immediately
2. Review Option B implementation
3. Check if files were created correctly
4. Re-run audit to verify

---

## Troubleshooting

### Cursor Can't Find Files

**Problem**: Cursor says files don't exist

**Solution**:
```bash
# Verify files exist
ls -la .agent/*.md
ls -la .claude/skills/projectpulse/*.md
````

If missing, Option B wasn't committed. Check:

```bash
git log --oneline -1
# Should show: feat(workflow): Implement Option B - Memory Bank + TDD...
```

### Cursor Gives Generic Response

**Problem**: Cursor doesn't follow the format

**Solution**: Paste the audit prompt file content directly into chat instead of asking Cursor to read it.

**Copy from**: `.agent/gemini/documentation-audit-prompt-cursor-v2.md`
**Paste into**: Cursor chat
**Then add**: "Now perform this audit and give me the report."

### Cursor Takes Too Long

**Problem**: Audit runs for 10+ minutes

**Solution**: Cursor is analyzing properly! Large audits take time. Be patient.

If it exceeds 15 minutes, stop and restart with:

```
Focus on the top 5 most critical gaps only. Give me quick findings.
```

---

## Tips for Best Results

### Before Running Audit

1. ✅ Commit all changes (audit works on committed files)
2. ✅ Make sure Option B is committed (check git log)
3. ✅ Close unnecessary files in Cursor (speeds up analysis)

### During Audit

1. ⏳ Don't interrupt Cursor (let it finish completely)
2. 📝 Take notes on major findings as they appear
3. 🔍 Ask follow-up questions if unclear

### After Audit

1. 📋 Save results to .agent/gemini/ folder
2. ✅ Apply fixes in priority order (CRITICAL first)
3. 🔄 Re-run audit after fixes to verify improvement

---

## Expected Timeline

- **Cursor Analysis**: 2-5 minutes
- **Review Results**: 5-10 minutes
- **Apply Top 10 Fixes**: 15-30 minutes
- **Re-run Verification**: 2-3 minutes

**Total Time**: ~30-45 minutes

---

## Success Criteria

**You'll know the audit was successful if:**

1. ✅ You get a specific readiness score (0-100%)
2. ✅ You get category breakdown (Memory Bank, TDD, Dependencies, etc.)
3. ✅ You get copy-paste ready fixes with file paths
4. ✅ Cursor checked all 20+ files listed in Part 6
5. ✅ Cursor verified the NEW memory bank files exist
6. ✅ Cursor confirmed TDD is "for ALL tasks"
7. ✅ Cursor checked dependency sections in all tasks

**The audit failed if:**

1. ❌ Generic feedback without specifics
2. ❌ No readiness score provided
3. ❌ Didn't check memory bank files
4. ❌ Didn't mention TDD or dependencies
5. ❌ No file paths or line numbers in fixes

---

## After Applying Fixes

### Commit Your Changes

```bash
# After applying top 10 fixes
git add .
git commit -m "docs(audit): Apply documentation audit fixes

Applied top 10 fixes from Cursor AI audit v2.0:
1. [Fix #1 summary]
2. [Fix #2 summary]
...

Automation readiness improved from 64% to [new score]%

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Re-Run Audit (Optional)

To verify improvements:

```
Read .agent/gemini/documentation-audit-prompt-cursor-v2.md again

Perform a quick re-audit focusing only on the areas I just fixed.

Compare the new score with the previous score and confirm improvements.
```

---

## Quick Reference

**Audit Prompt File**: `.agent/gemini/documentation-audit-prompt-cursor-v2.md`
**Results Save Location**: `.agent/gemini/documentation-audit-20251026-cursor-v2.md`
**Previous Audit Score**: 64% (before Option B)
**Target Score**: 85-95% (after Option B)
**Time Required**: 30-45 minutes total

---

**Ready to audit? Copy the prompt from Step 2 and paste into Cursor!**
