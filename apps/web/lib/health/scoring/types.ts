/**
 * Health Score Calculation Types
 * Sprint 7 Day 11 - US-119: Health Score Calculation
 *
 * This module provides type definitions for the health score calculation system,
 * including category scores, severity weights, and overall health score data.
 */

import { FindingCategory, FindingSeverity } from '@prisma/client';

/**
 * Category-specific scores (0-100 scale)
 *
 * Each category score represents the health of a specific aspect of the codebase:
 * - security: Based on Semgrep findings (SECURITY category)
 * - quality: Based on ESLint findings (CODE_QUALITY category)
 * - accessibility: Based on axe-core + Lighthouse findings (ACCESSIBILITY category)
 * - debt: Based on code complexity metrics (PERFORMANCE category - future)
 */
export interface CategoryScores {
  /** Security score (0-100) - Based on Semgrep findings */
  security: number;

  /** Code quality score (0-100) - Based on ESLint findings */
  quality: number;

  /** Accessibility score (0-100) - Based on axe-core + Lighthouse findings */
  accessibility: number;

  /** Technical debt score (0-100) - Based on complexity metrics */
  debt: number;
}

/**
 * Breakdown of findings by severity level
 */
export interface SeverityBreakdown {
  /** Number of CRITICAL severity findings */
  critical: number;

  /** Number of HIGH severity findings */
  high: number;

  /** Number of MEDIUM severity findings */
  medium: number;

  /** Number of LOW severity findings */
  low: number;
}

/**
 * Complete health score data structure
 *
 * This matches the HealthScore Prisma model and is returned by calculateHealthScore().
 * Can be directly inserted into the database.
 */
export interface HealthScoreData {
  /** Overall health score (0-100) - Weighted average of category scores */
  score: number;

  /** Letter grade (A, B, C, D, F) based on overall score */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  /** Individual category scores (0-100 each) */
  securityScore: number;
  qualityScore: number;
  accessibilityScore: number;
  debtScore: number;

  /** Total number of findings across all categories */
  totalFindings: number;

  /** Breakdown of findings by severity level */
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
}

/**
 * Category weights for overall health score calculation
 *
 * These weights determine how much each category contributes to the overall score.
 * Total must sum to 1.0.
 */
export interface ScoreWeights {
  /** Security weight (40% - highest priority) */
  security: number;

  /** Code quality weight (30%) */
  quality: number;

  /** Accessibility weight (20%) */
  accessibility: number;

  /** Technical debt weight (10% - lowest priority) */
  debt: number;
}

/**
 * Default category weights (40/30/20/10)
 *
 * Security has the highest weight because vulnerabilities pose the greatest risk.
 * Technical debt has the lowest weight as it's primarily a maintenance concern.
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  security: 0.4, // 40% - Critical for security posture
  quality: 0.3, // 30% - Important for maintainability
  accessibility: 0.2, // 20% - Important for inclusivity
  debt: 0.1, // 10% - Long-term concern
};

/**
 * Severity points for weighted finding calculation
 *
 * Each severity level has a point value that determines its impact on the health score.
 * Higher severity = more points = lower health score.
 */
export interface SeverityPoints {
  /** CRITICAL severity point value */
  CRITICAL: number;

  /** HIGH severity point value */
  HIGH: number;

  /** MEDIUM severity point value */
  MEDIUM: number;

  /** LOW severity point value */
  LOW: number;
}

/**
 * Default severity point values
 *
 * These values determine how much each severity level impacts the health score:
 * - CRITICAL: 10 points (most severe)
 * - HIGH: 5 points (half of critical)
 * - MEDIUM: 2 points (minor issues)
 * - LOW: 1 point (minimal impact)
 */
export const DEFAULT_SEVERITY_POINTS: SeverityPoints = {
  CRITICAL: 10,
  HIGH: 5,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Maximum possible points per category
 *
 * Used as the denominator when calculating category scores.
 * This value represents a "reasonable worst case" to avoid division by zero
 * and provide a stable scoring baseline.
 *
 * Example: If a project has 100 CRITICAL findings (1000 points),
 * the category score would be: 1 - (1000 / 500) = -1.0 (clamped to 0.0)
 */
export const MAX_POINTS_PER_CATEGORY = 500;

/**
 * Grade thresholds for letter grade assignment
 */
export interface GradeThresholds {
  /** Minimum score for A grade (Excellent) */
  A: number;

  /** Minimum score for B grade (Good) */
  B: number;

  /** Minimum score for C grade (Fair) */
  C: number;

  /** Minimum score for D grade (Poor) */
  D: number;

  /** Minimum score for F grade (Critical) - anything below D */
  F: number;
}

/**
 * Default grade thresholds
 *
 * Grading scale:
 * - A: 90-100 (Excellent - minimal issues)
 * - B: 80-89 (Good - some issues, but manageable)
 * - C: 70-79 (Fair - notable issues, attention needed)
 * - D: 60-69 (Poor - significant issues, immediate action recommended)
 * - F: 0-59 (Critical - severe issues, urgent action required)
 */
export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0,
};

/**
 * Mapping of FindingCategory to category score field name
 */
export const CATEGORY_TO_SCORE_FIELD: Record<FindingCategory, keyof CategoryScores> = {
  SECURITY: 'security',
  CODE_QUALITY: 'quality',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'debt', // Performance findings map to technical debt score
};
