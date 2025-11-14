/**
 * Health Score Calculation System
 * Sprint 7 Day 11 - US-119: Health Score Calculation
 *
 * This module provides a complete health score calculation system for processing
 * findings from all scanners (Semgrep, ESLint, axe-core, Lighthouse) and producing
 * an overall health score with category breakdown and letter grade.
 *
 * @example
 * ```typescript
 * import { calculateHealthScore } from '@/lib/health/scoring';
 *
 * const findings = await prisma.healthFinding.findMany({
 *   where: { scannerId: scanner.id },
 * });
 *
 * const scoreData = calculateHealthScore(findings);
 * // Returns: { score: 85.5, grade: 'B', securityScore: 80, ... }
 *
 * await prisma.healthScore.create({
 *   data: {
 *     projectId,
 *     ...scoreData,
 *   },
 * });
 * ```
 */

// Export all types
export type {
  CategoryScores,
  HealthScoreData,
  ScoreWeights,
  SeverityPoints,
  SeverityBreakdown,
  GradeThresholds,
} from './types';

// Export constants
export {
  DEFAULT_SCORE_WEIGHTS,
  DEFAULT_SEVERITY_POINTS,
  DEFAULT_GRADE_THRESHOLDS,
  MAX_POINTS_PER_CATEGORY,
  CATEGORY_TO_SCORE_FIELD,
} from './types';

// Export calculator functions
export {
  calculateHealthScore,
  calculateCategoryScore,
  assignGrade,
} from './calculator';
