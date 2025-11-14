# Current Todos: Sprint 7 Day 11 - Health Score Calculation

**Session**: 2025-11-14
**Sprint**: 7 (Week 2, Day 11)
**Story Points**: 5
**Progress**: 7/7 tasks (100%)

---

## Task List

### 1. Create types.ts - Scoring Interfaces
**Status**: [x] Complete
**Estimated Time**: 30 min
**Lines of Code**: ~80
**Priority**: P0 (blocking)

**Details**:
- Create `apps/web/lib/health/scoring/types.ts`
- Define `CategoryScores` interface (4 category scores)
- Define `HealthScoreData` interface (overall score + categories + grade + statistics)
- Define `ScoreWeights` interface (category weights: 40% security, 30% quality, 20% a11y, 10% debt)
- Define `SeverityPoints` interface (CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1)
- Define `FindingStatistics` interface (total, by severity, by category)
- Add JSDoc comments for all interfaces
- Import FindingCategory, FindingSeverity from scanner types

**Success Criteria**:
- ✅ All interfaces exported
- ✅ JSDoc comments complete
- ✅ TypeScript compiles with 0 errors

---

### 2. Create calculator.ts - Core Calculation Logic
**Status**: [x] Complete
**Estimated Time**: 2h
**Lines of Code**: ~200
**Priority**: P0 (blocking)

**Details**:
- Create `apps/web/lib/health/scoring/calculator.ts`
- Implement `calculateCategoryScore(findings, maxPenalty)` - Calculate score for one category
- Implement `calculateHealthScore(findings)` - Main entry point, returns HealthScoreData
- Implement `assignGrade(score)` - Convert score to letter grade (A-F)
- Implement `calculateFindingStatistics(findings)` - Count findings by severity/category
- Define constants: SEVERITY_POINTS, CATEGORY_WEIGHTS, MAX_PENALTY_PER_CATEGORY
- Apply weighted formula: `score = 100 - (security_penalty * 0.4 + quality_penalty * 0.3 + a11y_penalty * 0.2 + debt_penalty * 0.1)`
- Handle edge cases (empty findings, negative scores clamped to 0)
- Add JSDoc comments with examples for all functions

**Success Criteria**:
- ✅ All functions exported
- ✅ JSDoc comments with examples
- ✅ TypeScript compiles with 0 errors
- ✅ Edge cases handled gracefully

---

### 3. Create calculator.test.ts - Comprehensive Unit Tests
**Status**: [x] Complete
**Estimated Time**: 2h
**Lines of Code**: ~400
**Priority**: P0 (blocking)

**Details**:
- Create `apps/web/lib/health/scoring/__tests__/calculator.test.ts`
- Test: Zero findings → score=100, grade=A
- Test: All critical findings → score=0-10, grade=F
- Test: Mixed severity → correct weighted calculation
- Test: Grade boundaries (90+=A, 80-89=B, 70-79=C, 60-69=D, <60=F)
- Test: Real-world scenario (mix of all scanners)
- Test: Category-specific penalties (security, quality, a11y, debt)
- Test: Finding statistics accuracy (total, by severity, by category)
- Test: Edge cases (null findings, empty arrays, negative scores)
- Minimum 10+ comprehensive tests
- Use fixtures from Day 8-9 scanner tests

**Success Criteria**:
- ✅ 10+ comprehensive tests written
- ✅ All tests passing
- ✅ Edge cases covered
- ✅ Real-world scenario tested
- ✅ Coverage > 90%

---

### 4. Create index.ts - Export All Scoring Functions
**Status**: [x] Complete
**Estimated Time**: 15 min
**Lines of Code**: ~10
**Priority**: P1

**Details**:
- Create `apps/web/lib/health/scoring/index.ts`
- Export all from `./types`
- Export all from `./calculator`
- Verify all exports working

**Success Criteria**:
- ✅ All exports working
- ✅ TypeScript compiles with 0 errors

---

### 5. Run Unit Tests - Verify All Passing
**Status**: [x] Complete
**Estimated Time**: 15 min
**Priority**: P0

**Details**:
- Run: `cd apps/web && pnpm test lib/health/scoring/__tests__/calculator.test.ts`
- Verify all 10+ tests passing
- Check coverage > 90%
- Fix any failing tests

**Success Criteria**:
- ✅ All 10+ tests passing
- ✅ 0 test failures
- ✅ Coverage > 90%

---

### 6. TypeScript Check - Verify 0 Errors
**Status**: [x] Complete
**Estimated Time**: 15 min
**Priority**: P0

**Details**:
- Run: `cd apps/web && pnpm type-check`
- Verify 0 TypeScript errors
- Verify strict mode enabled
- Fix any type errors

**Success Criteria**:
- ✅ 0 TypeScript errors
- ✅ Strict mode enabled
- ✅ All types correctly inferred

---

### 7. Manual Integration Test - Test with Real Scan Data
**Status**: [x] Complete
**Estimated Time**: 30 min
**Priority**: P1

**Details**:
- Use fixtures from Day 8-9 scanner tests
- Create test script to run calculation with mixed findings
- Verify output is reasonable (score 70-90, grade B/C, category scores > 60)
- Verify no runtime errors
- Verify output format matches Prisma model

**Success Criteria**:
- ✅ Real data produces reasonable scores
- ✅ No runtime errors
- ✅ Output matches expected format
- ✅ Statistics are accurate

---

## Progress Summary

**Total Tasks**: 7
**Completed**: 7
**In Progress**: 0
**Pending**: 0

**Progress**: 7/7 tasks (100%)

**Estimated Total Time**: 6 hours
**Story Points**: 5

---

## Protocol Steps

- [x] STEP 1: Session initialized
- [x] STEP 2: Plan saved (current-plan.md, current-todos.md)
- [x] STEP 3: Expert consultation (not needed - straightforward calculation logic)
- [x] STEP 4: Implementation + Checkpoints
- [ ] STEP 5: Post-completion workflow (in progress)

---

## Dependencies

**Scanner Types** (already exist):
- FindingCategory: 'security' | 'quality' | 'accessibility' | 'technical-debt'
- FindingSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
- Finding interface with category, severity, message, source, etc.

**Prisma Model** (already exists):
- HealthScore model in schema.prisma (lines 1100-1130)
- Fields: overallScore, categoryScores (JSON), grade, etc.

---

## Blocking Issues

None currently.

---

## Notes

- Weighted formula: 40% security, 30% quality, 20% accessibility, 10% technical debt
- Severity points: CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1
- Grade scale: 90+=A, 80-89=B, 70-79=C, 60-69=D, <60=F
- Real scan data should produce scores in 70-90 range for healthy codebase

---

**Created**: 2025-11-14
**Last Updated**: 2025-11-14
