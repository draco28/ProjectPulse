/**
 * ESLint code quality scanner implementation
 * Sprint 7 Day 8-9 - Health Scanner Foundation (Task 22)
 *
 * Uses ESLint Node.js API to detect code quality issues.
 * Maps ESLint findings to HealthFinding records with CODE_QUALITY category.
 */

// @ts-ignore - eslint types not properly exported
import { ESLint } from 'eslint';
import { FindingCategory, FindingSeverity, ScannerType } from '@prisma/client';
import type {
  Scanner,
  ScanResult,
  ScanOptions,
  FindingData,
  SeverityMapper,
} from './types';
import { createSummary, ScannerError } from './types';

/**
 * ESLint severity levels (from ESLint API)
 * 0 = off, 1 = warn, 2 = error
 */
type ESLintSeverity = 0 | 1 | 2;

/**
 * ESLint message structure (from ESLint API results)
 */
interface ESLintMessage {
  ruleId: string | null;      // Rule ID (e.g., "no-unused-vars")
  severity: ESLintSeverity;   // 0 = off, 1 = warn, 2 = error
  message: string;            // Finding description
  line: number;               // Line number
  column: number;             // Column number
  nodeType?: string;          // AST node type
  source?: string;            // Code snippet (if available)
}

/**
 * ESLint result structure (from ESLint API)
 */
interface ESLintResult {
  filePath: string;           // Absolute file path
  messages: ESLintMessage[];  // Array of findings
  errorCount: number;         // Number of errors
  warningCount: number;       // Number of warnings
  fixableErrorCount: number;
  fixableWarningCount: number;
  source?: string;            // Full file source
}

/**
 * ESLint scanner configuration
 */
export interface ESLintOptions extends ScanOptions {
  /** Path to ESLint configuration file (default: auto-discover) */
  configPath?: string;

  /** Whether to use .eslintignore (default: true) */
  useEslintIgnore?: boolean;

  /** File extensions to lint (default: ['.js', '.jsx', '.ts', '.tsx']) */
  extensions?: string[];
}

/**
 * Maps ESLint severity to our standard FindingSeverity enum
 */
const mapSeverity: SeverityMapper<ESLintSeverity> = (eslintSeverity) => {
  switch (eslintSeverity) {
    case 2:
      return FindingSeverity.HIGH;    // Error = HIGH
    case 1:
      return FindingSeverity.MEDIUM;  // Warning = MEDIUM
    case 0:
    default:
      return FindingSeverity.LOW;     // Off/unknown = LOW
  }
};

/**
 * ESLint code quality scanner implementation
 */
export class ESLintScanner implements Scanner {
  private readonly scannerType = ScannerType.ESLINT;
  private readonly category = FindingCategory.CODE_QUALITY;

  /**
   * Execute ESLint scan on the given project path
   */
  async scan(projectPath: string, options?: ESLintOptions): Promise<ScanResult> {
    try {
      // Create ESLint instance with configuration
      const eslint = await this.createESLintInstance(projectPath, options);

      // Determine file patterns to lint
      const patterns = this.buildFilePatterns(projectPath, options);

      // Execute ESLint
      const results = await eslint.lintFiles(patterns);

      // Convert ESLint results to our format
      const findings = this.convertFindings(results);

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
      throw new ScannerError(
        `ESLint scan failed: ${(error as Error).message}`,
        this.scannerType,
        error as Error
      );
    }
  }

  /**
   * Create ESLint instance with configuration
   */
  private async createESLintInstance(
    projectPath: string,
    options?: ESLintOptions
  ): Promise<ESLint> {
    const eslintConfig: ESLint.Options = {
      cwd: projectPath,
      useEslintrc: true,               // Use .eslintrc.json if present
      ignore: options?.useEslintIgnore ?? true,
      extensions: options?.extensions ?? ['.ts', '.tsx'], // TypeScript only by default
    };

    // Override config file if specified
    if (options?.configPath) {
      eslintConfig.overrideConfigFile = options.configPath;
    }

    // Note: ESLint exclude patterns are handled via .eslintignore or
    // by filtering the file list before linting (not via ignorePatterns option)

    return new ESLint(eslintConfig);
  }

  /**
   * Build file patterns to lint
   */
  private buildFilePatterns(projectPath: string, options?: ESLintOptions): string[] {
    // Use custom patterns if specified
    if (options?.include && options.include.length > 0) {
      return options.include.map((pattern) => {
        // Ensure pattern includes projectPath
        return pattern.startsWith('/') ? pattern : `${projectPath}/${pattern}`;
      });
    }

    // Default patterns (TypeScript only for this project)
    // Only scan files that exist to avoid ESLint "No files matching" errors
    const defaultPatterns = [
      `${projectPath}/**/*.ts`,
      `${projectPath}/**/*.tsx`,
    ];

    return defaultPatterns;
  }

  /**
   * Convert ESLint results to our FindingData format
   */
  private convertFindings(eslintResults: ESLintResult[]): FindingData[] {
    const findings: FindingData[] = [];

    eslintResults.forEach((result) => {
      result.messages.forEach((message) => {
        // Skip messages without ruleId (these are parse errors)
        if (!message.ruleId) {
          return;
        }

        // Extract code snippet if available
        const codeSnippet = this.extractCodeSnippet(
          result.source,
          message.line,
          message.column
        );

        findings.push({
          ruleId: `eslint.${message.ruleId}`,
          severity: mapSeverity(message.severity),
          message: message.message,
          filePath: result.filePath,
          lineNumber: message.line,
          codeSnippet,
        });
      });
    });

    return findings;
  }

  /**
   * Extract code snippet from source code
   * Returns 3 lines: line before, problem line, line after
   */
  private extractCodeSnippet(
    source: string | undefined,
    line: number,
    column: number
  ): string | undefined {
    if (!source) {
      return undefined;
    }

    const lines = source.split('\n');
    const contextLines: string[] = [];

    // Add line before (if exists)
    if (line > 1 && lines[line - 2] !== undefined) {
      contextLines.push(lines[line - 2] || '');
    }

    // Add problem line with marker
    if (lines[line - 1] !== undefined) {
      contextLines.push(lines[line - 1] || '');
      // Add marker showing where the issue is
      contextLines.push(' '.repeat(column - 1) + '^');
    }

    // Add line after (if exists)
    if (line < lines.length && lines[line] !== undefined) {
      contextLines.push(lines[line] || '');
    }

    return contextLines.join('\n').trim() || undefined;
  }
}

/**
 * Factory function to create ESLint scanner instance
 */
export function createESLintScanner(): Scanner {
  return new ESLintScanner();
}
