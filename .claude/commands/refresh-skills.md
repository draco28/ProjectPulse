---
description: Detect pattern drift and refresh skills to match current codebase patterns
---

# refresh-skills Command

You are tasked with detecting pattern drift in skills and refreshing them to match current codebase patterns.

## Command Format

`/refresh-skills [skill-name]` or `/refresh-skills all`

## What is Pattern Drift?

**Pattern Drift** occurs when:

- Codebase patterns evolve (new conventions adopted)
- Skills become outdated (no longer match current code)
- New libraries/frameworks introduced (patterns change)
- Best practices update (old patterns deprecated)

**Example**:

```
Skill says: "Use fetch() for API calls"
Codebase now uses: "axios for all API calls"
→ Pattern drift: 100% of files use axios, skill mentions fetch
```

## Actions

### /refresh-skills all

**When**: Monthly maintenance or after major refactoring
**What to do**:

1. **Scan All Skills**

   ```
   For each skill in .claude/skills/moksha-devhub/:
   - Read skill file
   - Identify patterns described
   - Note conventions mentioned
   ```

2. **Analyze Current Codebase**
   - Invoke explore-codebase sub-agent for each skill topic
   - Sub-agent scans 10-15 recent files related to topic
   - Sub-agent identifies current patterns
   - Sub-agent calculates pattern frequency

3. **Compare Patterns**

   ```
   For each pattern in skill:
   - Check if still used in codebase
   - Calculate drift percentage
   - Identify new patterns not in skill
   ```

4. **Detect Drift**

   ```
   High drift (>30%): Skill significantly outdated
   Medium drift (10-30%): Some patterns changed
   Low drift (<10%): Skill still accurate
   No drift (0%): Skill matches perfectly
   ```

5. **Generate Report**

   ```markdown
   # Skill Refresh Report

   ## Skills with High Drift (>30%)

   ### api-patterns.skill.md

   **Drift**: 45%
   **Issues**:

   - Mentions `fetch()` but 100% of code uses `axios`
   - Missing: Error interceptors pattern (in 80% of files)
   - Outdated: Response format changed

   **Recommendation**: Refresh skill

   ## Skills with Medium Drift (10-30%)

   ### component-patterns.skill.md

   **Drift**: 15%
   **Issues**:

   - Missing: New `useOptimistic` hook usage

   **Recommendation**: Minor update

   ## Skills with Low/No Drift (<10%)

   ### database-patterns.skill.md

   **Drift**: 3%
   **Status**: ✅ Current

   ### git-workflow.skill.md

   **Drift**: 0%
   **Status**: ✅ Perfect match
   ```

6. **Prompt User**

   ```
   Found 2 skills with high drift and 1 with medium drift.

   Would you like me to:
   1. Update api-patterns skill (high drift: 45%)
   2. Update component-patterns skill (medium drift: 15%)
   3. Skip and review manually
   4. Show detailed drift analysis
   ```

7. **Update Skills (If Approved)**
   - Invoke synthesize-docs in skill mode for each outdated skill
   - Generate new skill file based on current patterns
   - Show diff of changes
   - Save updated skill file
   - Update last_updated date in frontmatter
   - Update token count if changed

8. **Finalize**
   - Save refresh report to `.agent/metrics/skill-refresh-[timestamp].md`
   - Update skill index if needed
   - Commit changes with message: `docs(skills): refresh [N] skills after drift detection`

### /refresh-skills [skill-name]

**When**: After refactoring specific area of codebase
**What to do**:

1. **Read Target Skill**

   ```
   File: .claude/skills/moksha-devhub/[skill-name].md
   Extract: Current patterns, conventions, examples
   ```

2. **Analyze Current Patterns**
   - Invoke explore-codebase sub-agent for skill topic
   - Sub-agent identifies current patterns in codebase
   - Compare to skill content

3. **Calculate Drift**

   ```
   Pattern match percentage:
   - Skill pattern 1: Found in 8/10 files (80% match)
   - Skill pattern 2: Found in 2/10 files (20% match) ⚠️
   - New pattern: Found in 9/10 files (not in skill) ⚠️

   Overall drift: 40% (significant)
   ```

4. **Show Analysis**

   ```
   Skill: api-patterns
   Drift: 40% (High)

   Current patterns in skill:
   ✅ Zod validation (found in 9/10 files)
   ⚠️  fetch() usage (found in 0/10 files - OUTDATED)
   ✅ Error handling (found in 8/10 files)

   Missing from skill:
   ⚠️  axios with interceptors (found in 10/10 files - NEW)
   ⚠️  Rate limiting (found in 7/10 files - NEW)

   Recommendation: REFRESH (high drift)
   ```

5. **Prompt User**

   ```
   Drift detected in api-patterns skill (40%).

   Would you like me to refresh this skill? (y/n)
   ```

6. **Update Skill (If Approved)**
   - Invoke synthesize-docs in skill mode
   - Generate refreshed skill file
   - Show diff of changes
   - Save updated skill
   - Update last_updated date

7. **Report**

   ```
   ✅ Refreshed: api-patterns.skill.md

   Changes:
   - Removed: fetch() pattern (no longer used)
   - Added: axios with interceptors pattern
   - Added: Rate limiting pattern
   - Updated: Token count (220 → 245 tokens)

   Saved: .claude/skills/moksha-devhub/api-patterns.skill.md
   ```

## Pattern Drift Detection Algorithm

### Step 1: Extract Patterns from Skill

```markdown
Read skill file → Identify key patterns mentioned

Example from api-patterns.skill.md:

1. "Use fetch() for API calls"
2. "Validate with Zod schemas"
3. "Return NextResponse.json()"
```

### Step 2: Scan Codebase

```markdown
Invoke explore-codebase →
"Scan all API route files (app/api/\*\*/route.ts) and identify:

- API call patterns
- Validation approaches
- Response formats"
```

### Step 3: Calculate Pattern Frequency

```markdown
Pattern: "Use fetch() for API calls"
Files scanned: 10 API routes
Files using fetch(): 0 (0%)
Files using axios: 10 (100%)
→ Drift: Pattern not found, different pattern used
```

### Step 4: Compute Drift Percentage

```markdown
Total patterns in skill: 5
Patterns still accurate: 3 (60%)
Patterns outdated: 2 (40%)
New patterns missing: 2

Drift Score: 40% (outdated patterns + missing patterns / total patterns)
```

### Step 5: Classify Drift Level

```markdown
Drift >= 30%: High (refresh recommended)
Drift >= 10%: Medium (update suggested)
Drift < 10%: Low (monitor)
Drift = 0%: None (perfect match)
```

## Drift Thresholds

| Drift % | Level    | Action                 | Color  |
| ------- | -------- | ---------------------- | ------ |
| 0%      | None     | ✅ No action           | Green  |
| 1-9%    | Low      | 📊 Monitor             | Blue   |
| 10-29%  | Medium   | 🔄 Suggest update      | Yellow |
| 30%+    | High     | ⚠️ Refresh recommended | Orange |
| 50%+    | Critical | 🚨 Urgent refresh      | Red    |

## Examples

### Example 1: Zero Drift

```
/refresh-skills git-workflow

Analyzing git-workflow skill...
- Scanned 15 git operations
- All patterns match skill
- No new patterns found

Result: ✅ 0% drift (perfect match)
Action: None needed
```

### Example 2: Medium Drift

```
/refresh-skills component-patterns

Analyzing component-patterns skill...
- Scanned 12 components
- 10/12 use Server Components (83%) ✅
- 8/12 use "use client" directive (67%) ✅
- 3/12 use useOptimistic hook (25%) ⚠️ Missing from skill
- Skill mentions useState, all files use it ✅

Result: 📊 15% drift (medium)
Missing: useOptimistic hook pattern

Suggestion: Add useOptimistic hook pattern to skill
Update skill? (y/n)
```

### Example 3: High Drift

```
/refresh-skills api-patterns

Analyzing api-patterns skill...
- Scanned 10 API routes
- 0/10 use fetch() ❌ Skill mentions this
- 10/10 use axios ⚠️ Skill doesn't mention this
- 10/10 use interceptors ⚠️ Skill doesn't mention this
- 9/10 use Zod ✅
- 7/10 use rate limiting ⚠️ Skill doesn't mention this

Result: ⚠️ 40% drift (high)
Critical issues:
- fetch() pattern outdated (0% usage)
- Missing axios pattern (100% usage)
- Missing interceptors (100% usage)
- Missing rate limiting (70% usage)

Recommendation: REFRESH SKILL
Update skill? (y/n)
```

## Sub-Agent Integration

### Invoking explore-codebase for Drift Detection

**Prompt Template**:

```
Analyze current patterns in [topic] for skill drift detection.

Skill file: .claude/skills/moksha-devhub/[skill-name].md

Current patterns in skill:
1. [Pattern 1 description]
2. [Pattern 2 description]
3. [Pattern 3 description]

Your task:
1. Scan 10-15 recent files related to [topic]
2. For each skill pattern, check if still used
3. Calculate usage frequency (X/10 files)
4. Identify new patterns not in skill
5. Return pattern analysis report

Output format:
- Pattern match percentages
- New patterns discovered
- Outdated patterns
- Drift score calculation
```

## Response Format

Always respond with:

1. **Analysis Summary**: Brief overview of drift detected
2. **Drift Details**: Per-skill or per-pattern breakdown
3. **Recommendations**: What to update and why
4. **Action Prompt**: Ask user for approval
5. **Execution**: If approved, refresh skills
6. **Report**: Save drift analysis to .agent/metrics/

Example:

```
✅ Skill Refresh Analysis Complete

## Summary
- 7 skills analyzed
- 2 skills with high drift (>30%)
- 1 skill with medium drift (10-30%)
- 4 skills current (<10% drift)

## High Drift Skills

### api-patterns (40% drift)
Issues:
- fetch() outdated (0% usage)
- Missing axios pattern (100% usage)

### database-patterns (35% drift)
Issues:
- Missing new transaction patterns

## Recommendations
1. Refresh api-patterns skill (critical)
2. Refresh database-patterns skill (important)
3. Minor update to component-patterns (optional)

Proceed with refreshing 2 skills? (y/n)
```

## Integration with Workflow

**When to use**:

- After major refactoring
- Monthly maintenance
- Before onboarding new developers
- When patterns feel outdated
- After tech stack updates

**Workflow**:

```
1. Complete refactoring work
2. Run: /refresh-skills all
3. Review drift report
4. Approve skill updates
5. Commit updated skills
6. Continue development
```

## Rules

### Always Follow

1. **Scan sufficient files** (minimum 10 per topic)
2. **Calculate objective metrics** (percentages, not opinions)
3. **Show before/after** diffs for transparency
4. **Get approval** before updating skills
5. **Document changes** in commit message
6. **Save drift reports** for historical tracking

### Never Do

1. Don't update skills without scanning codebase
2. Don't refresh skills with <10% drift automatically
3. Don't overwrite skills without showing diff
4. Don't skip user approval for updates
5. Don't forget to update last_updated date

## Future Enhancements

### Phase 6+

1. **Scheduled Refresh**: Weekly/monthly automatic drift checks
2. **Git Hook Integration**: Check drift on pre-commit
3. **Confidence Scores**: ML-based pattern matching confidence
4. **Rollback Support**: Revert skill to previous version
5. **A/B Testing**: Compare skill versions for effectiveness

---

**Remember**: Skills are living documentation. Keeping them current ensures continued token optimization and accurate guidance.
