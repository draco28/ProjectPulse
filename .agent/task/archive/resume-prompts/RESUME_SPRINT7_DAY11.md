# Sprint 7 Day 11 Resume Prompt - Health Score Calculation

**Created:** 2025-11-14 01:15
**Phase:** Sprint 7 Week 2 - Health Monitoring (Day 11)
**Story Points:** 5 points (US-119: Health Score Calculation)

---

## Quick Context

**Sprint 7 Progress: 24/30 points (80% complete)**

✅ **Week 1 (Days 1-7):** Wiki Auto-Generation COMPLETE (13 points)
✅ **Week 2 Day 8-9:** Scanner Foundation COMPLETE (8 points)
✅ **Week 2 Day 10:** Accessibility Scanners COMPLETE (3 points) ← Just finished!

**Current Status:**
- 4 scanners implemented and tested: SEMGREP, ESLINT, AXECORE, LIGHTHOUSE
- 52 total unit tests passing (25 scanner foundation + 27 accessibility)
- All TypeScript errors fixed
- Manual testing verified on Mac mini ✅

---

## Day 10 Completion Summary

**What Was Delivered:**

1. **axe-core Scanner** (197 LOC)
   - Playwright + AxeBuilder integration
   - 4-level severity mapping (critical→CRITICAL, serious→HIGH, moderate→MEDIUM, minor→LOW)
   - Browser context management (fixed in final commit)
   - 12/12 unit tests passing
   - **Manual test:** Found 1 real violation (heading-order) ✅

2. **Lighthouse Scanner** (210 LOC)
   - Node.js API integration (not CLI)
   - Chrome launcher automation
   - All failures → MEDIUM severity
   - 15/15 unit tests passing

3. **Infrastructure**
   - Scanner registry: 4 scanners total
   - Dependencies: @axe-core/playwright@4.11.0, lighthouse@11.7.1
   - Playwright browsers installed on Mac mini
   - TypeScript: 0 errors

**Commits:**
- `17a85fc`: feat(health): Add axe-core and Lighthouse accessibility scanners (Day 10)
- `5e11be4`: fix(health): Use browser context in axe-core scanner

---

## Day 11: Health Score Calculation (5 points)

**Objective:** Calculate weighted health scores from all 4 scanners

### Implementation Requirements

**US-119: Health Score Calculation**

**1. Score Formula (Weighted)**
```typescript
healthScore = (
  (securityScore * 0.40) +    // 40% weight (Semgrep findings)
  (qualityScore * 0.30) +      // 30% weight (ESLint findings)
  (a11yScore * 0.20) +         // 20% weight (axe-core + Lighthouse findings)
  (debtScore * 0.10)           // 10% weight (future: code complexity)
) * 100
```

**2. Category Scores (0-1 scale)**
- Calculate per category: `1 - (weightedFindings / maxPossibleFindings)`
- Weight findings by severity:
  - CRITICAL: 10 points
  - HIGH: 5 points
  - MEDIUM: 2 points
  - LOW: 1 point

**3. Grade Assignment**
- A: 90-100 (Excellent)
- B: 80-89 (Good)
- C: 70-79 (Fair)
- D: 60-69 (Poor)
- F: 0-59 (Critical)

**4. Database Schema (Already exists)**
```prisma
model HealthScore {
  id        Int      @id @default(autoincrement())
  projectId Int

  // Overall score
  score     Float    // 0-100
  grade     String   // A, B, C, D, F

  // Category scores
  securityScore      Float // 0-100
  qualityScore       Float // 0-100
  accessibilityScore Float // 0-100
  debtScore          Float // 0-100

  // Metadata
  totalFindings      Int
  criticalFindings   Int
  highFindings       Int
  mediumFindings     Int
  lowFindings        Int

  createdAt DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([createdAt])
}
```

### Files to Create

**1. Score Calculator** (`lib/health/scoring/calculator.ts`)
- `calculateHealthScore(findings: HealthFinding[]) → HealthScoreData`
- Category score calculation
- Weighted formula implementation
- Grade assignment logic

**2. Types** (`lib/health/scoring/types.ts`)
- `HealthScoreData` interface
- `CategoryScore` interface
- `ScoreWeights` configuration

**3. Tests** (`lib/health/scoring/__tests__/calculator.test.ts`)
- Score calculation with mixed findings
- Category score calculation
- Grade assignment
- Edge cases (zero findings, all critical, etc.)

**4. Integration** (`lib/health/scoring/index.ts`)
- Export all scoring functions
- Convenience functions for common operations

### Implementation Steps

1. **Create types.ts** (scoring interfaces and configuration)
2. **Create calculator.ts** (core scoring logic)
3. **Create calculator.test.ts** (comprehensive tests)
4. **Run tests** (verify all passing)
5. **TypeScript check** (0 errors)
6. **Manual test** (calculate score from real scan results)

### Success Criteria

- ✅ Score calculator implements weighted formula correctly
- ✅ All 4 category scores calculated (security, quality, a11y, debt)
- ✅ Grade assignment works (A-F based on score)
- ✅ Handles edge cases (zero findings, all critical, etc.)
- ✅ 10+ comprehensive unit tests passing
- ✅ TypeScript 0 errors
- ✅ Manual test with real scan data produces reasonable scores

---

## Technical Context

**Key Files to Reference:**
1. `apps/web/prisma/schema.prisma` - HealthScore model (lines 1100-1130)
2. `apps/web/lib/health/scanners/types.ts` - FindingData, FindingSeverity
3. `.agent/task/current-session-20251114-2345.md` - Day 10 session notes

**Scanner Summary (for score calculation):**
- SEMGREP → FindingCategory.SECURITY (40% weight)
- ESLINT → FindingCategory.CODE_QUALITY (30% weight)
- AXECORE → FindingCategory.ACCESSIBILITY (20% weight)
- LIGHTHOUSE → FindingCategory.PERFORMANCE (20% weight, accessibility subset)

**Database Connection:**
```typescript
// Query all findings for a project
const findings = await prisma.healthFinding.findMany({
  where: { projectId },
  orderBy: { createdAt: 'desc' },
});

// Calculate score
const scoreData = calculateHealthScore(findings);

// Save score
await prisma.healthScore.create({
  data: {
    projectId,
    ...scoreData,
  },
});
```

---

## Estimated Effort

**Total:** 5 story points (~6-8 hours)

**Breakdown:**
- Types definition: 0.5h
- Calculator implementation: 2h
- Test suite: 2h
- Integration + manual testing: 1h
- Documentation: 0.5h

---

## Ready to Start?

Copy-paste this entire prompt at the start of your new chat session. I'll initialize the session following the mandatory protocol and begin Day 11 implementation.

**Note:** If resuming on Mac mini, ensure:
- ✅ Dev server running: `http://localhost:3000/api/health`
- ✅ Database connected: Mac mini PostgreSQL
- ✅ Working directory: `/Users/draco/projects/AI_HUB/apps/web`
