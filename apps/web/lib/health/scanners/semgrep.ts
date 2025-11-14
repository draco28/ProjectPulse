/**
 * Semgrep security scanner implementation
 * Sprint 7 Day 8-9 - Health Scanner Foundation (Task 21)
 *
 * Executes Semgrep CLI to detect security vulnerabilities in code.
 * Maps Semgrep findings to HealthFinding records with SECURITY category.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { FindingCategory, FindingSeverity, ScannerType } from '@prisma/client';
import type {
  Scanner,
  ScanResult,
  ScanOptions,
  FindingData,
  SeverityMapper,
} from './types';
import { createSummary, ScannerError, ScannerNotFoundError, ScannerTimeoutError } from './types';

const execAsync = promisify(exec);

/**
 * Semgrep severity levels (from Semgrep JSON output)
 */
type SemgrepSeverity = 'ERROR' | 'WARNING' | 'INFO';

/**
 * Semgrep finding structure (from --json output)
 */
interface SemgrepFinding {
  check_id: string;           // Rule ID (e.g., "javascript.lang.security.audit.xss")
  path: string;               // File path
  start: {
    line: number;             // Starting line number
    col: number;              // Starting column
  };
  end: {
    line: number;             // Ending line number
    col: number;              // Ending column
  };
  extra: {
    message: string;          // Finding description
    severity: SemgrepSeverity; // Severity level
    lines?: string;           // Code snippet
    metadata?: {
      category?: string;
      cwe?: string[];
      owasp?: string[];
    };
  };
}

/**
 * Semgrep JSON output structure
 */
interface SemgrepOutput {
  results: SemgrepFinding[];
  errors: Array<{
    message: string;
    path?: string;
  }>;
  paths?: {
    scanned: string[];
  };
}

/**
 * Semgrep scanner configuration
 */
export interface SemgrepOptions extends ScanOptions {
  /** Semgrep configuration: 'auto' | 'p/security-audit' | custom ruleset path */
  ruleConfig?: string;

  /** Whether to use Semgrep Pro features (requires auth) */
  usePro?: boolean;
}

/**
 * Maps Semgrep severity to our standard FindingSeverity enum
 */
const mapSeverity: SeverityMapper<SemgrepSeverity> = (semgrepSeverity) => {
  switch (semgrepSeverity) {
    case 'ERROR':
      return FindingSeverity.CRITICAL;
    case 'WARNING':
      return FindingSeverity.HIGH;
    case 'INFO':
      return FindingSeverity.MEDIUM;
    default:
      return FindingSeverity.LOW;
  }
};

/**
 * Semgrep security scanner implementation
 */
export class SemgrepScanner implements Scanner {
  private readonly scannerType = ScannerType.SEMGREP;
  private readonly category = FindingCategory.SECURITY;

  /**
   * Execute Semgrep scan on the given project path
   */
  async scan(projectPath: string, options?: SemgrepOptions): Promise<ScanResult> {
    const timeout = options?.timeout ?? 120000; // Default: 2 minutes
    const ruleConfig = options?.ruleConfig ?? 'auto'; // Default: auto-detect rules

    try {
      // Build Semgrep command
      const command = this.buildCommand(projectPath, ruleConfig, options);

      // Execute Semgrep with timeout
      const { stdout, stderr } = await this.executeWithTimeout(command, timeout);

      // Parse JSON output
      const output = this.parseOutput(stdout);

      // Convert Semgrep findings to our format
      const findings = this.convertFindings(output.results);

      // Create summary
      const summary = createSummary(findings);

      // Return scan result
      // Note: scannerId will be set by the caller after inserting HealthScanner record
      return {
        scannerId: -1, // Placeholder - caller must set this
        category: this.category,
        findings,
        summary,
      };
    } catch (error) {
      if (error instanceof ScannerError) {
        throw error;
      }

      // Check if Semgrep is not installed
      if ((error as Error).message.includes('command not found')) {
        throw new ScannerNotFoundError(this.scannerType, 'semgrep');
      }

      // Wrap other errors
      throw new ScannerError(
        `Semgrep scan failed: ${(error as Error).message}`,
        this.scannerType,
        error as Error
      );
    }
  }

  /**
   * Build Semgrep CLI command
   */
  private buildCommand(projectPath: string, ruleConfig: string, options?: SemgrepOptions): string {
    const parts = [
      'semgrep',
      '--config', ruleConfig,
      '--json',                    // JSON output for parsing
      '--quiet',                   // Suppress progress messages
      '--no-git-ignore',          // Scan all files (we'll filter with exclude patterns)
    ];

    // Add exclude patterns
    const exclude = options?.exclude ?? [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.min.js',
      '*.bundle.js',
    ];

    exclude.forEach((pattern) => {
      parts.push('--exclude', pattern);
    });

    // Add project path
    parts.push(projectPath);

    return parts.join(' ');
  }

  /**
   * Execute command with timeout
   */
  private async executeWithTimeout(
    command: string,
    timeout: number
  ): Promise<{ stdout: string; stderr: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await execAsync(command, {
        signal: controller.signal,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      });
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new ScannerTimeoutError(this.scannerType, timeout);
      }

      throw error;
    }
  }

  /**
   * Parse Semgrep JSON output
   */
  private parseOutput(stdout: string): SemgrepOutput {
    try {
      return JSON.parse(stdout) as SemgrepOutput;
    } catch (error) {
      throw new ScannerError(
        `Failed to parse Semgrep JSON output: ${(error as Error).message}`,
        this.scannerType,
        error as Error
      );
    }
  }

  /**
   * Convert Semgrep findings to our FindingData format
   */
  private convertFindings(semgrepFindings: SemgrepFinding[]): FindingData[] {
    return semgrepFindings.map((finding) => ({
      ruleId: `semgrep.${finding.check_id}`,
      severity: mapSeverity(finding.extra.severity),
      message: finding.extra.message,
      filePath: finding.path,
      lineNumber: finding.start.line,
      codeSnippet: finding.extra.lines?.trim() ?? undefined,
    }));
  }
}

/**
 * Factory function to create Semgrep scanner instance
 */
export function createSemgrepScanner(): Scanner {
  return new SemgrepScanner();
}
