/**
 * Semgrep security scanner implementation
 * Sprint 7 Day 8-9 - Health Scanner Foundation (Task 21)
 *
 * Executes Semgrep CLI to detect security vulnerabilities in code.
 * Maps Semgrep findings to HealthFinding records with SECURITY category.
 */

import { spawn } from 'child_process';
import { FindingCategory, FindingSeverity, ScannerType } from '@prisma/client';
import type {
  Scanner,
  ScanResult,
  ScanOptions,
  FindingData,
  SeverityMapper,
} from './types';
import { createSummary, ScannerError, ScannerNotFoundError, ScannerTimeoutError } from './types';

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
      // Build Semgrep command args
      const args = this.buildCommandArgs(projectPath, ruleConfig, options);

      // Execute Semgrep with timeout
      const stdout = await this.executeWithTimeout(args, timeout);

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
      if ((error as Error).message.includes('command not found') || (error as Error).message.includes('ENOENT')) {
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
   * Build Semgrep CLI command arguments
   */
  private buildCommandArgs(projectPath: string, ruleConfig: string, options?: SemgrepOptions): string[] {
    const args = [
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
      args.push('--exclude', pattern);
    });

    // Add project path
    args.push(projectPath);

    return args;
  }

  /**
   * Execute Semgrep with spawn and timeout
   */
  private async executeWithTimeout(
    args: string[],
    timeout: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('semgrep', args, {
        stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout/stderr captured
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Setup timeout
      const timeoutId = setTimeout(() => {
        process.kill();
        reject(new ScannerTimeoutError(this.scannerType, timeout));
      }, timeout);

      // Handle process completion
      process.on('close', (code) => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Semgrep exited with code ${code}: ${stderr}`));
        }
      });

      // Handle process errors (e.g., command not found)
      process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
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
