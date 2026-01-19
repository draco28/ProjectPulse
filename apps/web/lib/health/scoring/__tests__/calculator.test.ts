/**
 * Health Score Calculator Tests
 * Sprint 7 Day 11 - US-119: Health Score Calculation
 *
 * Comprehensive test suite for the health score calculation system.
 * Covers edge cases, grade boundaries, category weights, and real-world scenarios.
 */

import { FindingSeverity } from '@prisma/client';
import type { FindingData } from '../../scanners/types';
import { calculateHealthScore, assignGrade } from '../calculator';

/**
 * Helper: Create a test finding
 */
function createFinding(
  ruleId: string,
  severity: FindingSeverity,
  filePath: string = 'test.ts',
  lineNumber: number | null = 1
): FindingData {
  return {
    ruleId,
    severity,
    message: `Test finding: ${ruleId}`,
    filePath,
    lineNumber,
  };
}

describe('Health Score Calculator', () => {
  describe('assignGrade', () => {
    it('should assign A grade for scores >= 90', () => {
      expect(assignGrade(100)).toBe('A');
      expect(assignGrade(95)).toBe('A');
      expect(assignGrade(90)).toBe('A');
    });

    it('should assign B grade for scores 80-89', () => {
      expect(assignGrade(89.99)).toBe('B');
      expect(assignGrade(85)).toBe('B');
      expect(assignGrade(80)).toBe('B');
    });

    it('should assign C grade for scores 70-79', () => {
      expect(assignGrade(79.99)).toBe('C');
      expect(assignGrade(75)).toBe('C');
      expect(assignGrade(70)).toBe('C');
    });

    it('should assign D grade for scores 60-69', () => {
      expect(assignGrade(69.99)).toBe('D');
      expect(assignGrade(65)).toBe('D');
      expect(assignGrade(60)).toBe('D');
    });

    it('should assign F grade for scores < 60', () => {
      expect(assignGrade(59.99)).toBe('F');
      expect(assignGrade(50)).toBe('F');
      expect(assignGrade(0)).toBe('F');
    });

    it('should handle exact grade boundaries correctly', () => {
      // Test exact boundaries
      expect(assignGrade(90.0)).toBe('A'); // A starts at 90
      expect(assignGrade(89.9)).toBe('B'); // B is < 90
      expect(assignGrade(80.0)).toBe('B'); // B starts at 80
      expect(assignGrade(79.9)).toBe('C'); // C is < 80
      expect(assignGrade(70.0)).toBe('C'); // C starts at 70
      expect(assignGrade(69.9)).toBe('D'); // D is < 70
      expect(assignGrade(60.0)).toBe('D'); // D starts at 60
      expect(assignGrade(59.9)).toBe('F'); // F is < 60
    });
  });

  describe('calculateHealthScore', () => {
    describe('Edge Cases', () => {
      it('should return perfect score (100, grade A) for zero findings', () => {
        const findings: FindingData[] = [];
        const result = calculateHealthScore(findings);

        expect(result.score).toBe(100);
        expect(result.grade).toBe('A');
        expect(result.securityScore).toBe(100);
        expect(result.qualityScore).toBe(100);
        expect(result.accessibilityScore).toBe(100);
        expect(result.debtScore).toBe(100);
        expect(result.totalFindings).toBe(0);
        expect(result.criticalFindings).toBe(0);
        expect(result.highFindings).toBe(0);
        expect(result.mediumFindings).toBe(0);
        expect(result.lowFindings).toBe(0);
      });

      it('should handle all CRITICAL findings correctly', () => {
        // Create 50 CRITICAL findings (50 * 10 = 500 points = MAX_POINTS_PER_CATEGORY)
        // This should result in score = 0 for that category
        const findings: FindingData[] = Array.from({ length: 50 }, (_, i) =>
          createFinding(`semgrep.critical-${i}`, FindingSeverity.CRITICAL)
        );

        const result = calculateHealthScore(findings);

        // Security category should be 0 (500 points = max)
        expect(result.securityScore).toBe(0);
        // Other categories should be perfect (no findings)
        expect(result.qualityScore).toBe(100);
        expect(result.accessibilityScore).toBe(100);
        expect(result.debtScore).toBe(100);

        // Overall score: (0 * 0.40 + 100 * 0.30 + 100 * 0.20 + 100 * 0.10) = 60
        expect(result.score).toBe(60);
        expect(result.grade).toBe('D'); // 60 is exactly D grade

        expect(result.totalFindings).toBe(50);
        expect(result.criticalFindings).toBe(50);
        expect(result.highFindings).toBe(0);
        expect(result.mediumFindings).toBe(0);
        expect(result.lowFindings).toBe(0);
      });

      it('should handle only LOW severity findings (minimal impact)', () => {
        // Create 100 LOW findings (100 * 1 = 100 points out of 500 max)
        // Score should be 1 - (100 / 500) = 0.8 = 80% per category
        const findings: FindingData[] = Array.from({ length: 100 }, (_, i) =>
          createFinding(`eslint.low-${i}`, FindingSeverity.LOW)
        );

        const result = calculateHealthScore(findings);

        // All LOW findings go to quality (eslint prefix)
        expect(result.qualityScore).toBe(80); // 1 - (100/500) = 0.8 = 80
        expect(result.securityScore).toBe(100);
        expect(result.accessibilityScore).toBe(100);
        expect(result.debtScore).toBe(100);

        // Overall: (100 * 0.40 + 80 * 0.30 + 100 * 0.20 + 100 * 0.10) = 94
        expect(result.score).toBe(94);
        expect(result.grade).toBe('A');

        expect(result.totalFindings).toBe(100);
        expect(result.lowFindings).toBe(100);
      });
    });

    describe('Single Category Findings', () => {
      it('should calculate security category score correctly', () => {
        const findings: FindingData[] = [
          createFinding('semgrep.sql-injection', FindingSeverity.CRITICAL), // 10 points
          createFinding('semgrep.xss', FindingSeverity.HIGH), // 5 points
          createFinding('semgrep.weak-crypto', FindingSeverity.MEDIUM), // 2 points
          createFinding('semgrep.info-leak', FindingSeverity.LOW), // 1 point
        ];
        // Total: 18 points out of 500 max
        // Security score: 1 - (18 / 500) = 0.964 = 96.4%

        const result = calculateHealthScore(findings);

        expect(result.securityScore).toBe(96.4);
        expect(result.qualityScore).toBe(100); // No quality findings
        expect(result.accessibilityScore).toBe(100); // No a11y findings
        expect(result.debtScore).toBe(100); // No debt findings

        // Overall: (96.4 * 0.40 + 100 * 0.30 + 100 * 0.20 + 100 * 0.10) = 98.56
        expect(result.score).toBe(98.56);
        expect(result.grade).toBe('A');

        expect(result.totalFindings).toBe(4);
        expect(result.criticalFindings).toBe(1);
        expect(result.highFindings).toBe(1);
        expect(result.mediumFindings).toBe(1);
        expect(result.lowFindings).toBe(1);
      });

      it('should calculate code quality category score correctly', () => {
        const findings: FindingData[] = [
          createFinding('eslint.no-unused-vars', FindingSeverity.MEDIUM), // 2 points
          createFinding('eslint.no-console', FindingSeverity.LOW), // 1 point
          createFinding('eslint.complexity', FindingSeverity.HIGH), // 5 points
        ];
        // Total: 8 points out of 500 max
        // Quality score: 1 - (8 / 500) = 0.984 = 98.4%

        const result = calculateHealthScore(findings);

        expect(result.qualityScore).toBe(98.4);
        expect(result.securityScore).toBe(100);
        expect(result.accessibilityScore).toBe(100);
        expect(result.debtScore).toBe(100);

        // Overall: (100 * 0.40 + 98.4 * 0.30 + 100 * 0.20 + 100 * 0.10) = 99.52
        expect(result.score).toBe(99.52);
        expect(result.grade).toBe('A');
      });

      it('should calculate accessibility category score correctly', () => {
        const findings: FindingData[] = [
          createFinding('axe.color-contrast', FindingSeverity.CRITICAL), // 10 points
          createFinding('lighthouse.aria-labels', FindingSeverity.MEDIUM), // 2 points
        ];
        // Total: 12 points out of 500 max
        // A11y score: 1 - (12 / 500) = 0.976 = 97.6%

        const result = calculateHealthScore(findings);

        expect(result.accessibilityScore).toBe(97.6);
        expect(result.securityScore).toBe(100);
        expect(result.qualityScore).toBe(100);
        expect(result.debtScore).toBe(100);

        // Overall: (100 * 0.40 + 100 * 0.30 + 97.6 * 0.20 + 100 * 0.10) = 99.52
        expect(result.score).toBe(99.52);
        expect(result.grade).toBe('A');
      });
    });

    describe('Multiple Categories Mixed', () => {
      it('should calculate score with findings across all categories', () => {
        const findings: FindingData[] = [
          // Security (Semgrep) - 15 points total
          createFinding('semgrep.sql-injection', FindingSeverity.CRITICAL), // 10
          createFinding('semgrep.xss', FindingSeverity.HIGH), // 5

          // Quality (ESLint) - 7 points total
          createFinding('eslint.complexity', FindingSeverity.HIGH), // 5
          createFinding('eslint.no-unused-vars', FindingSeverity.MEDIUM), // 2

          // Accessibility - 12 points total
          createFinding('axe.color-contrast', FindingSeverity.CRITICAL), // 10
          createFinding('lighthouse.aria', FindingSeverity.MEDIUM), // 2
        ];

        const result = calculateHealthScore(findings);

        // Security: 1 - (15 / 500) = 0.97 = 97%
        expect(result.securityScore).toBe(97);
        // Quality: 1 - (7 / 500) = 0.986 = 98.6%
        expect(result.qualityScore).toBe(98.6);
        // Accessibility: 1 - (12 / 500) = 0.976 = 97.6%
        expect(result.accessibilityScore).toBe(97.6);
        // Debt: no findings = 100%
        expect(result.debtScore).toBe(100);

        // Overall: (97 * 0.40 + 98.6 * 0.30 + 97.6 * 0.20 + 100 * 0.10)
        //        = 38.8 + 29.58 + 19.52 + 10
        //        = 97.9
        expect(result.score).toBe(97.9);
        expect(result.grade).toBe('A');

        expect(result.totalFindings).toBe(6);
        expect(result.criticalFindings).toBe(2);
        expect(result.highFindings).toBe(2);
        expect(result.mediumFindings).toBe(2);
        expect(result.lowFindings).toBe(0);
      });
    });

    describe('Category Weight Verification', () => {
      it('should apply 40% weight to security category', () => {
        // Create findings to make security score = 0, all others = 100
        const findings: FindingData[] = Array.from({ length: 50 }, (_, i) =>
          createFinding(`semgrep.vuln-${i}`, FindingSeverity.CRITICAL)
        );

        const result = calculateHealthScore(findings);

        expect(result.securityScore).toBe(0);
        expect(result.qualityScore).toBe(100);
        expect(result.accessibilityScore).toBe(100);
        expect(result.debtScore).toBe(100);

        // Overall: (0 * 0.40 + 100 * 0.30 + 100 * 0.20 + 100 * 0.10)
        //        = 0 + 30 + 20 + 10
        //        = 60
        expect(result.score).toBe(60);
        expect(result.grade).toBe('D');
      });

      it('should apply 30% weight to quality category', () => {
        // Create findings to make quality score = 0, all others = 100
        const findings: FindingData[] = Array.from({ length: 50 }, (_, i) =>
          createFinding(`eslint.error-${i}`, FindingSeverity.CRITICAL)
        );

        const result = calculateHealthScore(findings);

        expect(result.securityScore).toBe(100);
        expect(result.qualityScore).toBe(0);
        expect(result.accessibilityScore).toBe(100);
        expect(result.debtScore).toBe(100);

        // Overall: (100 * 0.40 + 0 * 0.30 + 100 * 0.20 + 100 * 0.10)
        //        = 40 + 0 + 20 + 10
        //        = 70
        expect(result.score).toBe(70);
        expect(result.grade).toBe('C');
      });

      it('should apply 20% weight to accessibility category', () => {
        // Create findings to make a11y score = 0, all others = 100
        const findings: FindingData[] = Array.from({ length: 50 }, (_, i) =>
          createFinding(`axe.violation-${i}`, FindingSeverity.CRITICAL)
        );

        const result = calculateHealthScore(findings);

        expect(result.securityScore).toBe(100);
        expect(result.qualityScore).toBe(100);
        expect(result.accessibilityScore).toBe(0);
        expect(result.debtScore).toBe(100);

        // Overall: (100 * 0.40 + 100 * 0.30 + 0 * 0.20 + 100 * 0.10)
        //        = 40 + 30 + 0 + 10
        //        = 80
        expect(result.score).toBe(80);
        expect(result.grade).toBe('B');
      });
    });

    describe('Severity Weight Verification', () => {
      it('should apply correct severity weights (CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1)', () => {
        const findings: FindingData[] = [
          createFinding('semgrep.critical', FindingSeverity.CRITICAL),
          createFinding('semgrep.high', FindingSeverity.HIGH),
          createFinding('semgrep.medium', FindingSeverity.MEDIUM),
          createFinding('semgrep.low', FindingSeverity.LOW),
        ];
        // Total points: 10 + 5 + 2 + 1 = 18

        const result = calculateHealthScore(findings);

        // Security score: 1 - (18 / 500) = 0.964 = 96.4%
        expect(result.securityScore).toBe(96.4);

        expect(result.criticalFindings).toBe(1);
        expect(result.highFindings).toBe(1);
        expect(result.mediumFindings).toBe(1);
        expect(result.lowFindings).toBe(1);
      });

      it('should weight CRITICAL 10x more than LOW', () => {
        const oneCritical: FindingData[] = [
          createFinding('semgrep.critical', FindingSeverity.CRITICAL),
        ];
        const tenLow: FindingData[] = Array.from({ length: 10 }, (_, i) =>
          createFinding(`semgrep.low-${i}`, FindingSeverity.LOW)
        );

        const resultCritical = calculateHealthScore(oneCritical);
        const resultLow = calculateHealthScore(tenLow);

        // 1 CRITICAL = 10 points, 10 LOW = 10 points
        // Both should have same impact
        expect(resultCritical.securityScore).toBe(resultLow.securityScore);
        expect(resultCritical.score).toBe(resultLow.score);
      });

      it('should weight CRITICAL 2x more than HIGH', () => {
        const oneCritical: FindingData[] = [
          createFinding('semgrep.critical', FindingSeverity.CRITICAL),
        ];
        const twoHigh: FindingData[] = [
          createFinding('semgrep.high-1', FindingSeverity.HIGH),
          createFinding('semgrep.high-2', FindingSeverity.HIGH),
        ];

        const resultCritical = calculateHealthScore(oneCritical);
        const resultHigh = calculateHealthScore(twoHigh);

        // 1 CRITICAL = 10 points, 2 HIGH = 10 points
        // Both should have same impact
        expect(resultCritical.securityScore).toBe(resultHigh.securityScore);
        expect(resultCritical.score).toBe(resultHigh.score);
      });
    });

    describe('Real-World Scenario (Day 8-9 Scanner Results)', () => {
      it('should calculate score for typical Semgrep scan results', () => {
        // Day 8-9 integration test: 44 Semgrep findings
        // - 9 critical, 14 high, 21 medium, 0 low
        // Points: (9 * 10) + (14 * 5) + (21 * 2) + (0 * 1)
        //       = 90 + 70 + 42 + 0
        //       = 202 points

        const findings: FindingData[] = [
          ...Array.from({ length: 9 }, (_, i) =>
            createFinding(`semgrep.critical-${i}`, FindingSeverity.CRITICAL)
          ),
          ...Array.from({ length: 14 }, (_, i) =>
            createFinding(`semgrep.high-${i}`, FindingSeverity.HIGH)
          ),
          ...Array.from({ length: 21 }, (_, i) =>
            createFinding(`semgrep.medium-${i}`, FindingSeverity.MEDIUM)
          ),
        ];

        const result = calculateHealthScore(findings);

        // Security score: 1 - (202 / 500) = 0.596 = 59.6%
        expect(result.securityScore).toBe(59.6);

        // Overall: (59.6 * 0.40 + 100 * 0.30 + 100 * 0.20 + 100 * 0.10)
        //        = 23.84 + 30 + 20 + 10
        //        = 83.84
        expect(result.score).toBe(83.84);
        expect(result.grade).toBe('B');

        expect(result.totalFindings).toBe(44);
        expect(result.criticalFindings).toBe(9);
        expect(result.highFindings).toBe(14);
        expect(result.mediumFindings).toBe(21);
        expect(result.lowFindings).toBe(0);
      });

      it('should calculate score for typical ESLint scan results', () => {
        // Day 8-9 integration test: 218 ESLint findings
        // - 0 critical, 12 high, 206 medium, 0 low
        // Points: (0 * 10) + (12 * 5) + (206 * 2) + (0 * 1)
        //       = 0 + 60 + 412 + 0
        //       = 472 points

        const findings: FindingData[] = [
          ...Array.from({ length: 12 }, (_, i) =>
            createFinding(`eslint.high-${i}`, FindingSeverity.HIGH)
          ),
          ...Array.from({ length: 206 }, (_, i) =>
            createFinding(`eslint.medium-${i}`, FindingSeverity.MEDIUM)
          ),
        ];

        const result = calculateHealthScore(findings);

        // Quality score: 1 - (472 / 500) = 0.056 = 5.6%
        expect(result.qualityScore).toBe(5.6);

        // Overall: (100 * 0.40 + 5.6 * 0.30 + 100 * 0.20 + 100 * 0.10)
        //        = 40 + 1.68 + 20 + 10
        //        = 71.68
        expect(result.score).toBe(71.68);
        expect(result.grade).toBe('C');

        expect(result.totalFindings).toBe(218);
        expect(result.criticalFindings).toBe(0);
        expect(result.highFindings).toBe(12);
        expect(result.mediumFindings).toBe(206);
        expect(result.lowFindings).toBe(0);
      });

      it('should calculate combined score for Semgrep + ESLint + axe-core', () => {
        // Realistic full scan:
        // - Semgrep: 44 findings (202 points)
        // - ESLint: 218 findings (472 points)
        // - axe-core: 5 findings (2 CRITICAL, 3 MEDIUM = 26 points)

        const findings: FindingData[] = [
          // Semgrep (security)
          ...Array.from({ length: 9 }, (_, i) =>
            createFinding(`semgrep.critical-${i}`, FindingSeverity.CRITICAL)
          ),
          ...Array.from({ length: 14 }, (_, i) =>
            createFinding(`semgrep.high-${i}`, FindingSeverity.HIGH)
          ),
          ...Array.from({ length: 21 }, (_, i) =>
            createFinding(`semgrep.medium-${i}`, FindingSeverity.MEDIUM)
          ),

          // ESLint (quality)
          ...Array.from({ length: 12 }, (_, i) =>
            createFinding(`eslint.high-${i}`, FindingSeverity.HIGH)
          ),
          ...Array.from({ length: 206 }, (_, i) =>
            createFinding(`eslint.medium-${i}`, FindingSeverity.MEDIUM)
          ),

          // axe-core (accessibility)
          ...Array.from({ length: 2 }, (_, i) =>
            createFinding(`axe.critical-${i}`, FindingSeverity.CRITICAL)
          ),
          ...Array.from({ length: 3 }, (_, i) =>
            createFinding(`axe.medium-${i}`, FindingSeverity.MEDIUM)
          ),
        ];

        const result = calculateHealthScore(findings);

        // Security: 1 - (202 / 500) = 59.6%
        expect(result.securityScore).toBe(59.6);
        // Quality: 1 - (472 / 500) = 5.6%
        expect(result.qualityScore).toBe(5.6);
        // A11y: 1 - (26 / 500) = 94.8%
        expect(result.accessibilityScore).toBe(94.8);
        // Debt: 100% (no findings)
        expect(result.debtScore).toBe(100);

        // Overall: (59.6 * 0.40 + 5.6 * 0.30 + 94.8 * 0.20 + 100 * 0.10)
        //        = 23.84 + 1.68 + 18.96 + 10
        //        = 54.48
        expect(result.score).toBe(54.48);
        expect(result.grade).toBe('F'); // < 60 = F

        expect(result.totalFindings).toBe(267);
        expect(result.criticalFindings).toBe(11);
        expect(result.highFindings).toBe(26);
        expect(result.mediumFindings).toBe(230);
        expect(result.lowFindings).toBe(0);
      });
    });
  });
});
