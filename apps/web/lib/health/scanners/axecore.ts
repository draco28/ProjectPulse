/**
 * axe-core accessibility scanner implementation
 * Sprint 7 Day 10 - Accessibility Scanners (Task 26)
 *
 * Uses Playwright + axe-core to detect accessibility violations in web pages.
 * Maps axe-core findings to HealthFinding records with ACCESSIBILITY category.
 */

import { chromium, type Browser } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { FindingCategory, FindingSeverity, ScannerType } from '@prisma/client';
import type { Scanner, ScanResult, ScanOptions, FindingData, SeverityMapper } from './types';
import { createSummary, ScannerError, ScannerTimeoutError } from './types';

/**
 * axe-core impact levels (from axe-core JSON output)
 */
type AxeImpact = 'minor' | 'moderate' | 'serious' | 'critical';

/**
 * axe-core violation node structure
 */
interface AxeNode {
  html: string; // HTML element that failed
  target: string[]; // CSS selector array
  failureSummary?: string; // Detailed failure explanation
}

/**
 * axe-core violation structure (from axe-core results)
 */
interface AxeViolation {
  id: string; // Rule ID (e.g., "color-contrast", "label")
  impact: AxeImpact; // Severity level
  help: string; // Human-readable description
  helpUrl: string; // Documentation URL
  description?: string; // Additional context
  nodes: AxeNode[]; // Elements that failed
}

/**
 * axe-core scanner configuration
 */
export interface AxeCoreOptions extends ScanOptions {
  /** Base URL to scan (default: http://localhost:3000) */
  baseUrl?: string;

  /** WCAG level to test against (default: AA) */
  wcagLevel?: 'A' | 'AA' | 'AAA';

  /** Additional pages to scan (relative paths) */
  pages?: string[];
}

/**
 * Maps axe-core impact to our standard FindingSeverity enum
 */
const mapImpact: SeverityMapper<AxeImpact> = (axeImpact) => {
  switch (axeImpact) {
    case 'critical':
      return FindingSeverity.CRITICAL;
    case 'serious':
      return FindingSeverity.HIGH;
    case 'moderate':
      return FindingSeverity.MEDIUM;
    case 'minor':
      return FindingSeverity.LOW;
    default:
      return FindingSeverity.LOW;
  }
};

/**
 * axe-core accessibility scanner implementation
 */
export class AxeCoreScanner implements Scanner {
  private readonly scannerType = ScannerType.AXECORE;
  private readonly category = FindingCategory.ACCESSIBILITY;

  /**
   * Execute axe-core scan on the given project's web pages
   */
  async scan(projectPath: string, options?: AxeCoreOptions): Promise<ScanResult> {
    const timeout = options?.timeout ?? 60000; // Default: 60 seconds
    const baseUrl = options?.baseUrl ?? 'http://localhost:3000';
    const wcagLevel = options?.wcagLevel ?? 'AA';

    let browser: Browser | null = null;

    try {
      // Launch browser
      browser = await chromium.launch({ headless: true });

      // Scan base URL (and additional pages if specified)
      const pagesToScan = [baseUrl, ...(options?.pages?.map((p) => `${baseUrl}${p}`) ?? [])];
      const allViolations: AxeViolation[] = [];

      for (const url of pagesToScan) {
        const violations = await this.scanPage(browser, url, wcagLevel, timeout);
        allViolations.push(...violations);
      }

      // Convert violations to our FindingData format
      const findings = this.convertFindings(allViolations, baseUrl);

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

      // Wrap other errors
      throw new ScannerError(
        `axe-core scan failed: ${(error as Error).message}`,
        this.scannerType,
        error as Error
      );
    } finally {
      // Always close browser
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Scan a single page with axe-core
   */
  private async scanPage(
    browser: Browser,
    url: string,
    wcagLevel: 'A' | 'AA' | 'AAA',
    timeout: number
  ): Promise<AxeViolation[]> {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to URL with timeout
      const navigationPromise = page.goto(url, { waitUntil: 'load', timeout });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ScannerTimeoutError(this.scannerType, timeout)), timeout)
      );

      await Promise.race([navigationPromise, timeoutPromise]);

      // Run axe-core analysis
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion needed due to Playwright version mismatch
      const axeBuilder = new AxeBuilder({ page: page as any }).withTags([
        `wcag${wcagLevel.toLowerCase()}`,
        'best-practice',
      ]);

      const results = await axeBuilder.analyze();

      return (results.violations || []) as AxeViolation[];
    } finally {
      // Always close context (which closes page)
      await context.close();
    }
  }

  /**
   * Convert axe-core violations to our FindingData format
   */
  private convertFindings(violations: AxeViolation[], baseUrl: string): FindingData[] {
    const findings: FindingData[] = [];

    violations.forEach((violation) => {
      // Create one finding per violation (aggregate all nodes)
      const affectedElements = violation.nodes.length;
      const firstNode = violation.nodes[0];

      findings.push({
        ruleId: `axe.${violation.id}`,
        severity: mapImpact(violation.impact),
        message: `${violation.help} (${affectedElements} element${affectedElements > 1 ? 's' : ''} affected)`,
        filePath: baseUrl, // URL is the "file" for page-level findings
        lineNumber: null, // Page-level finding (no line number)
        codeSnippet: firstNode?.html?.trim()?.substring(0, 500) ?? undefined, // First violation instance (max 500 chars)
      });
    });

    return findings;
  }
}

/**
 * Factory function to create axe-core scanner instance
 */
export function createAxeCoreScanner(): Scanner {
  return new AxeCoreScanner();
}
