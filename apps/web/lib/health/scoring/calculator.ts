/**
 * Health Score Calculator
 * Sprint 7 Day 11 - US-119: Health Score Calculation
 *
 * This module implements the weighted health score calculation algorithm.
 * It processes findings from all scanners (Semgrep, ESLint, axe-core, Lighthouse)
 * and produces an overall health score with category breakdown and letter grade.
 *
 * Formula:
 * healthScore = (securityScore * 0.40 + qualityScore * 0.30 + a11yScore * 0.20 + debtScore * 0.10) * 100
 *
 * Category scores are calculated as:
 * categoryScore = 1 - (weightedFindings / maxPossiblePoints)
 *
 * where weightedFindings = sum(finding.severity * severityPoints)
 */

import { FindingCategory, FindingSeverity } from '@prisma/client';
import type { FindingData } from '../scanners/types';
import {
  type HealthScoreData,
  type CategoryScores,
  type SeverityBreakdown,
  type ScoreWeights,
  type SeverityPoints,
  DEFAULT_SCORE_WEIGHTS,
  DEFAULT_SEVERITY_POINTS,
  DEFAULT_GRADE_THRESHOLDS,
  MAX_POINTS_PER_CATEGORY,
  CATEGORY_TO_SCORE_FIELD,
} from './types';

/**
 * Calculate health score for a single category
 *
 * @param findings - All findings (will be filtered by category internally)
 * @param category - The category to calculate score for
 * @param severityPoints - Point values for each severity level
 * @param maxPossible - Maximum possible points for this category (denominator)
 * @returns Category score on 0-1 scale (1.0 = perfect, 0.0 = worst)
 *
 * @example
 * ```typescript
 * // Calculate security score
 * const securityScore = calculateCategoryScore(
 *   findings,
 *   FindingCategory.SECURITY,
 *   DEFAULT_SEVERITY_POINTS,
 *   MAX_POINTS_PER_CATEGORY
 * );
 * // Returns: 0.85 (85% health)
 * ```
 */
export function calculateCategoryScore(
  findings: FindingData[],
  category: FindingCategory,
  severityPoints: SeverityPoints = DEFAULT_SEVERITY_POINTS,
  maxPossible: number = MAX_POINTS_PER_CATEGORY
): number {
  // Filter findings for this category
  const categoryFindings = findings.filter((f) => {
    // Map finding category to our category system
    // Note: FindingData doesn't have category field, so we need to infer from scanner type
    // For now, we'll assume findings are pre-filtered or have a category property
    // This will be refined when integrating with database
    return true; // Placeholder - will be implemented with scanner metadata
  });

  // Calculate weighted points for this category
  let totalPoints = 0;
  for (const finding of categoryFindings) {
    const points = severityPoints[finding.severity];
    totalPoints += points;
  }

  // Calculate score: 1 - (totalPoints / maxPossible)
  // Clamp to [0, 1] range
  const rawScore = 1 - totalPoints / maxPossible;
  return Math.max(0, Math.min(1, rawScore));
}

/**
 * Calculate health score from all findings across all categories
 *
 * @param allFindings - Complete array of findings from all scanners
 * @param weights - Category weights for overall score calculation
 * @param severityPoints - Point values for each severity level
 * @returns Complete health score data structure ready for database insertion
 *
 * @example
 * ```typescript
 * const findings: FindingData[] = [
 *   { ruleId: 'sql-injection', severity: 'CRITICAL', message: '...', filePath: '...', lineNumber: 10 },
 *   { ruleId: 'no-unused-vars', severity: 'MEDIUM', message: '...', filePath: '...', lineNumber: 20 },
 * ];
 *
 * const scoreData = calculateHealthScore(findings);
 * // Returns: {
 * //   score: 87.5,
 * //   grade: 'B',
 * //   securityScore: 80,
 * //   qualityScore: 95,
 * //   accessibilityScore: 100,
 * //   debtScore: 100,
 * //   totalFindings: 2,
 * //   criticalFindings: 1,
 * //   highFindings: 0,
 * //   mediumFindings: 1,
 * //   lowFindings: 0,
 * // }
 * ```
 */
export function calculateHealthScore(
  allFindings: FindingData[],
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
  severityPoints: SeverityPoints = DEFAULT_SEVERITY_POINTS
): HealthScoreData {
  // Separate findings by category
  // Note: This is a simplified version. In production, we'll use scanner metadata
  // to determine category from the scanner type that produced each finding.
  const findingsByCategory = separateFindingsByCategory(allFindings);

  // Calculate individual category scores (0-1 scale)
  const categoryScores: CategoryScores = {
    security: calculateCategoryScoreForFindings(findingsByCategory.security, severityPoints),
    quality: calculateCategoryScoreForFindings(findingsByCategory.quality, severityPoints),
    accessibility: calculateCategoryScoreForFindings(
      findingsByCategory.accessibility,
      severityPoints
    ),
    debt: calculateCategoryScoreForFindings(findingsByCategory.debt, severityPoints),
  };

  // Calculate overall score using weighted formula
  // Formula: (security * 0.40 + quality * 0.30 + a11y * 0.20 + debt * 0.10) * 100
  const overallScore =
    (categoryScores.security * weights.security +
      categoryScores.quality * weights.quality +
      categoryScores.accessibility * weights.accessibility +
      categoryScores.debt * weights.debt) *
    100;

  // Assign letter grade based on overall score
  const grade = assignGrade(overallScore);

  // Count findings by severity
  const severityBreakdown = countFindingsBySeverity(allFindings);

  // Return complete health score data
  return {
    score: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
    grade,
    securityScore: Math.round(categoryScores.security * 100 * 100) / 100,
    qualityScore: Math.round(categoryScores.quality * 100 * 100) / 100,
    accessibilityScore: Math.round(categoryScores.accessibility * 100 * 100) / 100,
    debtScore: Math.round(categoryScores.debt * 100 * 100) / 100,
    totalFindings: allFindings.length,
    criticalFindings: severityBreakdown.critical,
    highFindings: severityBreakdown.high,
    mediumFindings: severityBreakdown.medium,
    lowFindings: severityBreakdown.low,
  };
}

/**
 * Assign letter grade based on overall health score
 *
 * Grading scale:
 * - A: 90-100 (Excellent)
 * - B: 80-89 (Good)
 * - C: 70-79 (Fair)
 * - D: 60-69 (Poor)
 * - F: 0-59 (Critical)
 *
 * @param score - Overall health score (0-100)
 * @returns Letter grade (A, B, C, D, or F)
 *
 * @example
 * ```typescript
 * assignGrade(95);  // 'A'
 * assignGrade(85);  // 'B'
 * assignGrade(75);  // 'C'
 * assignGrade(65);  // 'D'
 * assignGrade(55);  // 'F'
 * ```
 */
export function assignGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  const thresholds = DEFAULT_GRADE_THRESHOLDS;

  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  if (score >= thresholds.D) return 'D';
  return 'F';
}

/**
 * Helper: Calculate category score for a specific set of findings
 *
 * @param findings - Findings for this category only
 * @param severityPoints - Point values for each severity level
 * @returns Category score on 0-1 scale
 */
function calculateCategoryScoreForFindings(
  findings: FindingData[],
  severityPoints: SeverityPoints
): number {
  // If no findings, return perfect score (1.0)
  if (findings.length === 0) {
    return 1.0;
  }

  // Calculate weighted points
  let totalPoints = 0;
  for (const finding of findings) {
    const points = severityPoints[finding.severity];
    totalPoints += points;
  }

  // Calculate score: 1 - (totalPoints / maxPossible)
  // Clamp to [0, 1] range
  const rawScore = 1 - totalPoints / MAX_POINTS_PER_CATEGORY;
  return Math.max(0, Math.min(1, rawScore));
}

/**
 * Helper: Separate findings by category
 *
 * NOTE: This is a temporary implementation. In production, we'll:
 * 1. Query HealthFinding table with scannerId
 * 2. Join with HealthScanner to get scanner type
 * 3. Map scanner type to category:
 *    - SEMGREP → SECURITY
 *    - ESLINT → CODE_QUALITY
 *    - AXECORE → ACCESSIBILITY
 *    - LIGHTHOUSE → ACCESSIBILITY (or PERFORMANCE for debt)
 *
 * For now, we'll implement a placeholder that can be tested.
 *
 * @param findings - All findings
 * @returns Findings separated by category
 */
function separateFindingsByCategory(findings: FindingData[]): {
  security: FindingData[];
  quality: FindingData[];
  accessibility: FindingData[];
  debt: FindingData[];
} {
  const result = {
    security: [] as FindingData[],
    quality: [] as FindingData[],
    accessibility: [] as FindingData[],
    debt: [] as FindingData[],
  };

  // Temporary categorization based on ruleId prefix
  // This will be replaced with scanner metadata lookup in production
  for (const finding of findings) {
    if (finding.ruleId.startsWith('semgrep.') || finding.ruleId.includes('security')) {
      result.security.push(finding);
    } else if (finding.ruleId.startsWith('eslint.') || finding.ruleId.includes('quality')) {
      result.quality.push(finding);
    } else if (
      finding.ruleId.startsWith('axe.') ||
      finding.ruleId.startsWith('lighthouse.') ||
      finding.ruleId.includes('a11y')
    ) {
      result.accessibility.push(finding);
    } else {
      // Default to quality for unknown findings
      result.quality.push(finding);
    }
  }

  return result;
}

/**
 * Helper: Count findings by severity level
 *
 * @param findings - All findings
 * @returns Breakdown of finding counts by severity
 */
function countFindingsBySeverity(findings: FindingData[]): SeverityBreakdown {
  const breakdown: SeverityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of findings) {
    const severity = finding.severity.toLowerCase() as keyof SeverityBreakdown;
    breakdown[severity]++;
  }

  return breakdown;
}
