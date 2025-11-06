# Verification Checklist Template

**Date:** [YYYY-MM-DD]
**Session:** [current-session-YYYYMMDD-HHMM]
**Phase/Task:** [Phase name or task description]

---

## Purpose

This checklist ensures all plan requirements are verified with concrete evidence before marking work as complete (Step 4.5 of Mandatory Session Protocol).

---

## Success Criteria from Plan

**Source:** `.agent/task/current-plan.md` - [Section name]

List all requirements from the plan's success criteria:

- [ ] Requirement 1: [Description]
- [ ] Requirement 2: [Description]
- [ ] Requirement 3: [Description]
- [ ] Requirement 4: [Description]
- [ ] [Add more as needed...]

---

## Verification Results

### Requirement 1: [Description]

**Evidence Type:** [ ] Database query / [ ] File check / [ ] Test run / [ ] Manual demo / [ ] Integration test

**Command/Query:**

```bash
# Or sql, curl, etc.
[Command or query used to verify]
```

**Expected Result:**

```
[What should happen/exist]
```

**Actual Result:**

```
[What actually happened/exists]
```

**Status:** [ ] ✅ PASS / [ ] ❌ FAIL

**Notes:** [Any additional context or findings]

---

### Requirement 2: [Description]

**Evidence Type:** [ ] Database query / [ ] File check / [ ] Test run / [ ] Manual demo / [ ] Integration test

**Command/Query:**

```bash
[Command or query used to verify]
```

**Expected Result:**

```
[What should happen/exist]
```

**Actual Result:**

```
[What actually happened/exists]
```

**Status:** [ ] ✅ PASS / [ ] ❌ FAIL

**Notes:** [Any additional context or findings]

---

### Requirement 3: [Description]

**Evidence Type:** [ ] Database query / [ ] File check / [ ] Test run / [ ] Manual demo / [ ] Integration test

**Command/Query:**

```bash
[Command or query used to verify]
```

**Expected Result:**

```
[What should happen/exist]
```

**Actual Result:**

```
[What actually happened/exists]
```

**Status:** [ ] ✅ PASS / [ ] ❌ FAIL

**Notes:** [Any additional context or findings]

---

**[Repeat above template for each requirement]**

---

## Overall Verification Status

**Total Requirements:** [X]
**Requirements Passed:** [Y]
**Requirements Failed:** [Z]
**Pass Rate:** [Y/X * 100]%

### Summary

- ✅ **PASSED:** [List passed requirements]
- ❌ **FAILED:** [List failed requirements]
- ⏸️ **BLOCKED:** [List blocked requirements, if any]

---

## Decision

### If ALL Requirements Pass (100% pass rate)

✅ **VERIFICATION COMPLETE**

All requirements verified with evidence. Ready to proceed to Step 5 (Post-Completion).

**Confirmation:**

```
✅ STEP 4.5 COMPLETE: All [X] requirements verified with evidence

Verification summary:
- Requirement 1: ✅ PASS - [brief evidence]
- Requirement 2: ✅ PASS - [brief evidence]
- Requirement 3: ✅ PASS - [brief evidence]

Evidence documented in: .agent/task/current-session-[timestamp].md
All requirements met. Proceeding to Step 5.
```

---

### If ANY Requirement Fails (<100% pass rate)

❌ **VERIFICATION FAILED**

Work is **NOT COMPLETE**. Apply fail-fast rule:

**Required Actions:**

1. [ ] Mark work as **IN PROGRESS** (not complete)
2. [ ] Update `.agent/task/current-plan.md` with remaining items
3. [ ] Update `.agent/task/current-todos.md` with new tasks for failed requirements
4. [ ] **DO NOT proceed to Step 5**
5. [ ] Address all failed requirements
6. [ ] Re-run Step 4.5 verification when ready

**Failed Requirements to Address:**

- [ ] [Requirement X]: [What needs to be done]
- [ ] [Requirement Y]: [What needs to be done]

**Estimated Additional Work:**

- Time: [X hours/minutes]
- Tokens: [Estimated token usage]

---

## Common Evidence Examples

### Database Work

```sql
-- Verify record counts
SELECT COUNT(*) FROM table_name;

-- Verify data structure
SELECT * FROM table_name LIMIT 5;

-- Verify relationships
SELECT
  parent.name,
  COUNT(child.id) as child_count
FROM parent
LEFT JOIN child ON parent.id = child.parent_id
GROUP BY parent.id;

-- Verify query performance
EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;
```

### File Work

```bash
# Verify file exists
ls path/to/file.ts

# Show file content
head -n 20 path/to/file.ts
cat path/to/file.ts

# Verify file count in directory
ls path/to/directory | wc -l

# Verify file size
wc -l path/to/file.ts
```

### Test Work

```bash
# Run specific tests
pnpm test -- pattern

# TypeScript type check
pnpm type-check

# Linting
pnpm lint

# Build check
pnpm build

# All quality gates
pnpm type-check && pnpm lint && pnpm build && pnpm test
```

### Integration Work

```bash
# Test API endpoint
curl http://localhost:3000/api/endpoint

# Test with data
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'

# Verify app starts
pnpm dev
# Check http://localhost:3000 in browser

# Verify database connection
pnpm prisma db push --skip-generate
```

---

## Tips for Effective Verification

### 1. Be Specific

❌ **Bad:** "Database works"
✅ **Good:** "SELECT COUNT(\*) FROM users; returns 15 records as expected"

### 2. Show Actual Output

❌ **Bad:** "Tests pass"
✅ **Good:**

```
pnpm test
✓ src/components/Button.test.tsx (3)
  ✓ renders correctly (2ms)
  ✓ handles click events (1ms)
  ✓ applies correct styles (1ms)

Test Files  1 passed (1)
Tests  3 passed (3)
```

### 3. Verify Edge Cases

Don't just test the happy path:

- Empty states (0 records, empty arrays)
- Error conditions (invalid input, missing data)
- Boundary conditions (max/min values, limits)
- Performance (query speed, render time)

### 4. Use Quantitative Evidence

❌ **Bad:** "Fast enough"
✅ **Good:** "Query executes in 45ms (target: <100ms)"

### 5. Document Assumptions

If verification makes assumptions, document them:

- "Assuming dev database is seeded with test data"
- "Requires app running on port 3000"
- "Expects PostgreSQL version 14+"

---

## Usage Instructions

1. **Copy this template** when starting Step 4.5 verification
2. **Fill in all sections** with actual commands and results
3. **Save to session file** (`.agent/task/current-session-[timestamp].md`)
4. **Make decision** based on pass/fail status
5. **Provide confirmation** or address failures

---

**Template Version:** 1.0
**Created:** 2025-11-06
**Part of:** Mandatory Session Protocol v2.0 (Step 4.5)
