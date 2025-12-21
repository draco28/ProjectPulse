/**
 * Shared types for health monitoring scanners
 * Sprint 7 Day 8-9 - Health Scanner Foundation
 *
 * This module provides common interfaces and types used by all scanner implementations
 * (Semgrep, ESLint, Lighthouse, axe-core).
 */

import { FindingCategory, FindingSeverity, FindingStatus, ScannerType } from '@prisma/client';

/**
 * Raw finding data from scanner output (before database insertion)
 */
export interface FindingData {
  /** Scanner-specific rule ID (e.g., "semgrep.sql-injection", "eslint.no-unused-vars") */
  ruleId: string;

  /** Severity level mapped to our standard scale */
  severity: FindingSeverity;

  /** Human-readable finding description */
  message: string;

  /** Absolute or relative file path where finding was detected */
  filePath: string;

  /** Line number in the file (nullable for page-level findings like Lighthouse) */
  lineNumber: number | null;

  /** Optional code snippet showing the problematic code (max 5000 chars) */
  codeSnippet?: string;
}

/**
 * Scanner execution result with findings and summary
 */
export interface ScanResult {
  /** ID of the HealthScanner record that ran this scan */
  scannerId: number;

  /** Category of findings (determines which scanner ran) */
  category: FindingCategory;

  /** Array of findings detected during scan */
  findings: FindingData[];

  /** Summary statistics for dashboard display */
  summary: {
    /** Total number of findings detected */
    totalFindings: number;

    /** Breakdown by severity level */
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

/**
 * Scanner interface - all scanners must implement this
 */
export interface Scanner {
  /**
   * Execute scanner on the given project path
   *
   * @param projectPath - Absolute path to the project root directory
   * @param options - Scanner-specific configuration options
   * @returns Promise resolving to scan results
   * @throws Error if scanner execution fails
   */
  scan(projectPath: string, options?: ScanOptions): Promise<ScanResult>;
}

/**
 * Scanner configuration options
 */
export interface ScanOptions {
  /** File patterns to include (glob patterns) */
  include?: string[];

  /** File patterns to exclude (glob patterns) */
  exclude?: string[];

  /** Scanner-specific configuration (e.g., ESLint config path, Semgrep rules) */
  config?: Record<string, unknown>;

  /** Maximum execution time in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
}

/**
 * Scanner metadata for registration and display
 */
export interface ScannerMetadata {
  /** Scanner type enum value */
  type: ScannerType;

  /** Display name for UI */
  name: string;

  /** Short description of what this scanner detects */
  description: string;

  /** Finding category this scanner produces */
  category: FindingCategory;

  /** Whether this scanner is enabled by default */
  enabledByDefault: boolean;
}

/**
 * Severity mapping helper - converts scanner-specific severity to our standard scale
 */
export type SeverityMapper<T> = (scannerSeverity: T) => FindingSeverity;

/**
 * Common scanner error types
 */
export class ScannerError extends Error {
  public scannerType: ScannerType;
  public override cause?: Error;

  constructor(message: string, scannerType: ScannerType, cause?: Error) {
    super(message);
    this.name = 'ScannerError';
    this.scannerType = scannerType;
    this.cause = cause;
  }
}

export class ScannerTimeoutError extends ScannerError {
  constructor(scannerType: ScannerType, timeout: number) {
    super(`Scanner ${scannerType} exceeded timeout of ${timeout}ms`, scannerType);
    this.name = 'ScannerTimeoutError';
  }
}

export class ScannerNotFoundError extends ScannerError {
  constructor(scannerType: ScannerType, binaryPath?: string) {
    super(`Scanner ${scannerType} not found${binaryPath ? ` at ${binaryPath}` : ''}`, scannerType);
    this.name = 'ScannerNotFoundError';
  }
}

/**
 * Utility function to create summary from findings array
 */
export function createSummary(findings: FindingData[]): ScanResult['summary'] {
  const bySeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  findings.forEach((finding) => {
    const severity = finding.severity.toLowerCase() as keyof typeof bySeverity;
    bySeverity[severity]++;
  });

  return {
    totalFindings: findings.length,
    bySeverity,
  };
}

/**
 * Utility function to validate finding data
 */
export function validateFinding(finding: FindingData): boolean {
  if (!finding.ruleId || typeof finding.ruleId !== 'string') {
    return false;
  }

  if (!finding.severity || !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(finding.severity)) {
    return false;
  }

  if (!finding.message || typeof finding.message !== 'string') {
    return false;
  }

  if (!finding.filePath || typeof finding.filePath !== 'string') {
    return false;
  }

  if (finding.lineNumber !== null && typeof finding.lineNumber !== 'number') {
    return false;
  }

  return true;
}
