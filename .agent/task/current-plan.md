# Implementation Plan: Sprint 7 Day 11 - Health Score Calculation

**Session**: 2025-11-14
**Sprint**: 7 (Week 2, Day 11)
**Story Points**: 5
**Estimated Duration**: 6 hours

---

## Overview

Implement weighted health score calculation system that processes findings from all 4 scanners (ESLint, Type Coverage, axe-core, Lighthouse) and produces:
- Overall health score (0-100)
- Category scores (security, quality, accessibility, technical-debt)
- Letter grade (A-F)
- Finding statistics (total, by severity, by category)

---

## Architecture

### File Structure

```
apps/web/lib/health/scoring/
├── types.ts              # Scoring interfaces (NEW)
├── calculator.ts         # Core calculation logic (NEW)
├── index.ts              # Exports (NEW)
└── __tests__/
    └── calculator.test.ts # Unit tests (NEW)
```

### Key Components

**1. types.ts** (80 lines):
- `CategoryScores` interface (4 category scores)
- `HealthScoreData` interface (overall score + categories + grade)
- `ScoreWeights` interface (category weights: 40% security, 30% quality, 20% a11y, 10% debt)
- `SeverityPoints` interface (CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1)
- `FindingStatistics` interface (total, by severity, by category)

**2. calculator.ts** (200 lines):
- `calculateCategoryScore(findings, maxPenalty)` - Calculate score for one category
- `calculateHealthScore(findings)` - Main entry point, returns HealthScoreData
- `assignGrade(score)` - Convert score to letter grade (A-F)
- `calculateFindingStatistics(findings)` - Count findings by severity/category
- Weighted formula: `score = 100 - (security_penalty * 0.4 + quality_penalty * 0.3 + a11y_penalty * 0.2 + debt_penalty * 0.1)`

**3. calculator.test.ts** (400 lines):
- Test: Zero findings → score=100, grade=A
- Test: All critical findings → score=0-10, grade=F
- Test: Mixed severity → correct weighted calculation
- Test: Grade boundaries (90+=A, 80-89=B, 70-79=C, 60-69=D, <60=F)
- Test: Real-world scenario (mix of all scanners)
- Test: Category-specific penalties
- Test: Finding statistics accuracy
- Test: Edge cases (null findings, empty arrays, negative scores clamped to 0)

---

## Implementation Steps

### Step 1: Create types.ts (30 min, 80 lines) ✅

**Status**: Complete (206 lines)

**Dependencies**:
- Import FindingCategory, FindingSeverity from scanner types

**Interfaces to define**:
```typescript
export interface CategoryScores {
  security: number;
  quality: number;
  accessibility: number;
  technicalDebt: number;
}

export interface HealthScoreData {
  overallScore: number;
  categoryScores: CategoryScores;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  findingStatistics: FindingStatistics;
}

export interface ScoreWeights {
  security: number;    // 0.4
  quality: number;     // 0.3
  accessibility: number; // 0.2
  technicalDebt: number; // 0.1
}

export interface SeverityPoints {
  CRITICAL: number;  // 10
  HIGH: number;      // 5
  MEDIUM: number;    // 2
  LOW: number;       // 1
}

export interface FindingStatistics {
  total: number;
  bySeverity: Record<FindingSeverity, number>;
  byCategory: Record<FindingCategory, number>;
}
```

**Success Criteria**:
- ✅ All interfaces exported
- ✅ JSDoc comments for each interface
- ✅ TypeScript compiles with 0 errors

**Completed**: All interfaces defined with JSDoc comments, TypeScript 0 errors

---

### Step 2: Create calculator.ts (2h, 200 lines) ✅

**Status**: Complete (288 lines)

**Dependencies**:
- Import types from ./types
- Import FindingCategory, FindingSeverity from scanner types

**Constants**:
```typescript
const SEVERITY_POINTS: SeverityPoints = {
  CRITICAL: 10,
  HIGH: 5,
  MEDIUM: 2,
  LOW: 1,
};

const CATEGORY_WEIGHTS: ScoreWeights = {
  security: 0.4,
  quality: 0.3,
  accessibility: 0.2,
  technicalDebt: 0.1,
};

const MAX_PENALTY_PER_CATEGORY = 100;
```

**Functions**:

1. `calculateCategoryScore(findings, maxPenalty)`:
   - Sum severity points for findings in category
   - Calculate penalty: `min(sum, maxPenalty)`
   - Return score: `100 - penalty`

2. `calculateHealthScore(findings)`:
   - Calculate category scores for all 4 categories
   - Apply weighted formula
   - Assign grade
   - Calculate statistics
   - Return HealthScoreData

3. `assignGrade(score)`:
   - 90-100 → A
   - 80-89 → B
   - 70-79 → C
   - 60-69 → D
   - <60 → F

4. `calculateFindingStatistics(findings)`:
   - Count total findings
   - Count by severity (CRITICAL, HIGH, MEDIUM, LOW)
   - Count by category (security, quality, accessibility, technicalDebt)

**Success Criteria**:
- ✅ All functions exported
- ✅ JSDoc comments with examples
- ✅ TypeScript compiles with 0 errors
- ✅ Edge cases handled (empty findings, negative scores clamped to 0)

**Completed**: All functions implemented with weighted formula, TypeScript 0 errors

---

### Step 3: Create calculator.test.ts (2h, 400 lines) ✅

**Status**: Complete (545 lines, 22 tests)

**Test Cases** (10+ tests):

1. **Zero findings scenario**:
   ```typescript
   const findings = [];
   const result = calculateHealthScore(findings);
   expect(result.overallScore).toBe(100);
   expect(result.grade).toBe('A');
   ```

2. **All critical findings scenario**:
   ```typescript
   const findings = [
     { category: 'security', severity: 'CRITICAL', ... },
     { category: 'quality', severity: 'CRITICAL', ... },
     // 10+ critical findings
   ];
   const result = calculateHealthScore(findings);
   expect(result.overallScore).toBeLessThan(20);
   expect(result.grade).toBe('F');
   ```

3. **Mixed severity scenario**:
   ```typescript
   const findings = [
     { severity: 'HIGH', ... },
     { severity: 'MEDIUM', ... },
     { severity: 'LOW', ... },
   ];
   // Verify weighted calculation is correct
   ```

4. **Grade boundary tests**:
   - Score 90 → A
   - Score 89 → B
   - Score 80 → B
   - Score 79 → C
   - Score 60 → D
   - Score 59 → F

5. **Real-world scenario**:
   - Mix of all 4 categories
   - Mix of all 4 severities
   - Verify category scores are reasonable
   - Verify overall score matches expected range

6. **Category-specific penalties**:
   - 10 security findings → security score drops significantly
   - 10 quality findings → quality score drops significantly
   - Verify weights are applied correctly

7. **Finding statistics accuracy**:
   - Verify total count
   - Verify severity counts
   - Verify category counts

8. **Edge cases**:
   - Null findings array → handle gracefully
   - Empty findings array → score 100
   - Negative score calculation → clamp to 0

**Success Criteria**:
- ✅ 10+ comprehensive tests
- ✅ All tests passing
- ✅ Edge cases covered
- ✅ Real-world scenario tested

**Completed**: 22 tests written, all passing (0.565s), 100% coverage

---

### Step 4: Create index.ts (15 min, 10 lines) ✅

**Status**: Complete (51 lines)

**Exports**:
```typescript
export * from './types';
export * from './calculator';
```

**Success Criteria**:
- ✅ All exports working
- ✅ TypeScript compiles with 0 errors

**Completed**: All exports working, TypeScript 0 errors

---

### Step 5: Run Unit Tests (15 min) ✅

**Status**: Complete (22/22 tests passing)

**Command**:
```bash
cd apps/web
pnpm test lib/health/scoring/__tests__/calculator.test.ts
```

**Success Criteria**:
- ✅ All 10+ tests passing
- ✅ 0 test failures
- ✅ Coverage > 90%

**Completed**: 22/22 tests passing, 100% coverage, 0.565s runtime

---

### Step 6: TypeScript Check (15 min) ✅

**Status**: Complete (0 errors)

**Command**:
```bash
cd apps/web
pnpm type-check
```

**Success Criteria**:
- ✅ 0 TypeScript errors
- ✅ Strict mode enabled
- ✅ All types correctly inferred

**Completed**: 0 TypeScript errors, strict mode enabled

---

### Step 7: Manual Integration Test (30 min) ✅

**Status**: Complete (4/4 scenarios passed)

**Test with real scan data**:
- Use fixtures from Day 8-9 scanner tests
- Run calculation with mixed findings
- Verify output is reasonable

**Expected Results**:
- Score: 70-90 (typical healthy codebase)
- Grade: B or C
- Category scores: All > 60
- Statistics: Accurate counts

**Success Criteria**:
- ✅ Real data produces reasonable scores
- ✅ No runtime errors
- ✅ Output matches expected format

**Completed**: All 4 scenarios passed (Semgrep, ESLint, Combined, Perfect), exact score matches

---

## Implementation Complete ✅

**All 7 steps completed successfully**

**Summary**:
- ✅ types.ts (206 lines) - All scoring interfaces
- ✅ calculator.ts (288 lines) - Core calculation logic with weighted formula
- ✅ calculator.test.ts (545 lines) - 22 comprehensive unit tests
- ✅ index.ts (51 lines) - Clean export interface
- ✅ All 22/22 unit tests passing (0.565s)
- ✅ TypeScript check: 0 errors
- ✅ Manual integration test: 4/4 scenarios passed

**Total**: 1,239 lines of production-ready code

---

## Dependencies

**Scanner Types** (already exist):
- `FindingCategory`: 'security' | 'quality' | 'accessibility' | 'technical-debt'
- `FindingSeverity`: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
- Finding interface with category, severity, message, source, etc.

**Prisma Model** (already exists):
- `HealthScore` model in schema.prisma (lines 1100-1130)
- Fields: overallScore, categoryScores (JSON), grade, etc.

---

## Success Criteria Summary

**Code Quality**:
- ✅ TypeScript: 0 errors (strict mode)
- ✅ All functions have JSDoc comments
- ✅ All exports have types
- ✅ Edge cases handled gracefully

**Testing**:
- ✅ 10+ comprehensive unit tests
- ✅ All tests passing
- ✅ Coverage > 90%
- ✅ Real-world scenario tested

**Functionality**:
- ✅ Weighted formula implemented correctly
- ✅ Severity weights applied correctly (CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1)
- ✅ Category scores calculated for all 4 categories
- ✅ Grade assignment works (A-F)
- ✅ Finding statistics accurate

**Integration**:
- ✅ Real scan data produces reasonable scores
- ✅ Output format matches Prisma model
- ✅ No runtime errors

---

## Risk Assessment

**Low Risk**:
- Simple calculation logic
- Well-defined interfaces
- Comprehensive tests

**Medium Risk**:
- Edge case handling (empty findings, extreme values)
- Grade boundary accuracy

**Mitigation**:
- Extensive unit tests for edge cases
- Manual integration test with real data
- Code review for calculation logic

---

## Time Estimates

| Task | Estimated Time | Complexity |
|------|----------------|------------|
| types.ts | 30 min | Low |
| calculator.ts | 2h | Medium |
| calculator.test.ts | 2h | Medium |
| index.ts | 15 min | Low |
| Run tests | 15 min | Low |
| TypeScript check | 15 min | Low |
| Integration test | 30 min | Medium |
| **TOTAL** | **6 hours** | **Medium** |

---

## Next Steps (After Completion)

1. Update `.agent/progress.md` - Mark Day 11 complete
2. Update `docs/13-Project-Plan.md` - Mark Sprint 7 Day 11 complete
3. Git commit: "feat(health): Add weighted health score calculation system (Day 11)"
4. Prepare for Day 12: Health Score API endpoint (GET /api/projects/:id/health/score)

---

**Created**: 2025-11-14
**Last Updated**: 2025-11-14
