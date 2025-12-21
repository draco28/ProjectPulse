/**
 * Lighthouse accessibility scanner implementation
 * Sprint 7 Day 10 - Accessibility Scanners (Task 27)
 *
 * Uses Lighthouse Node.js API to run accessibility audits on web pages.
 * Maps Lighthouse audit failures to HealthFinding records with PERFORMANCE category.
 *
 * Note: Using PERFORMANCE category as Lighthouse provides both performance and
 * accessibility metrics. The accessibility audits are a subset of Lighthouse's capabilities.
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { FindingCategory, FindingSeverity, ScannerType } from '@prisma/client';
import type {
  Scanner,
  ScanResult,
  ScanOptions,
  FindingData,
} from './types';
import { createSummary, ScannerError, ScannerTimeoutError } from './types';

/**
 * Lighthouse audit structure (from lhr.audits)
 */
interface LighthouseAudit {
  id: string;                    // Audit ID (e.g., "aria-required-attr")
  title: string;                 // Human-readable title
  description: string;           // Detailed description
  score: number | null;          // Score 0-1 (null if not applicable)
  scoreDisplayMode: string;      // How to display score: 'binary' | 'numeric' | 'manual' | 'notApplicable'
  details?: {                    // Optional details about failing elements
    items?: Array<{
      node?: {
        selector?: string;
        snippet?: string;
      };
    }>;
  };
}

/**
 * Lighthouse scanner configuration
 */
export interface LighthouseOptions extends ScanOptions {
  /** Base URL to scan (default: http://localhost:3000) */
  baseUrl?: string;

  /** Form factor: mobile or desktop (default: desktop) */
  formFactor?: 'mobile' | 'desktop';

  /** Additional pages to scan (relative paths) */
  pages?: string[];
}

/**
 * Lighthouse accessibility scanner implementation
 */
export class LighthouseScanner implements Scanner {
  private readonly scannerType = ScannerType.LIGHTHOUSE;
  private readonly category = FindingCategory.PERFORMANCE;  // Lighthouse provides both performance + a11y

  /**
   * Execute Lighthouse scan on the given project's web pages
   */
  async scan(projectPath: string, options?: LighthouseOptions): Promise<ScanResult> {
    const timeout = options?.timeout ?? 120000; // Default: 2 minutes
    const baseUrl = options?.baseUrl ?? 'http://localhost:3000';
    const formFactor = options?.formFactor ?? 'desktop';

    try {
      // Scan base URL (and additional pages if specified)
      const pagesToScan = [baseUrl, ...(options?.pages?.map(p => `${baseUrl}${p}`) ?? [])];
      const allFindings: FindingData[] = [];

      for (const url of pagesToScan) {
        const findings = await this.scanPage(url, formFactor, timeout);
        allFindings.push(...findings);
      }

      // Create summary
      const summary = createSummary(allFindings);

      // Return scan result
      // Note: scannerId will be set by the caller after inserting HealthScanner record
      return {
        scannerId: -1, // Placeholder - caller must set this
        category: this.category,
        findings: allFindings,
        summary,
      };
    } catch (error) {
      if (error instanceof ScannerError) {
        throw error;
      }

      // Wrap other errors
      throw new ScannerError(
        `Lighthouse scan failed: ${(error as Error).message}`,
        this.scannerType,
        error as Error
      );
    }
  }

  /**
   * Scan a single page with Lighthouse
   */
  private async scanPage(
    url: string,
    formFactor: 'mobile' | 'desktop',
    timeout: number
  ): Promise<FindingData[]> {
    let chrome: chromeLauncher.LaunchedChrome | undefined;

    try {
      // Launch Chrome
      chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
      });

      // Configure Lighthouse
      const config = {
        extends: 'lighthouse:default',
        settings: {
          onlyCategories: ['accessibility'], // Only run accessibility audits
          formFactor: formFactor,
          screenEmulation: {
            mobile: formFactor === 'mobile',
            width: formFactor === 'mobile' ? 375 : 1350,
            height: formFactor === 'mobile' ? 667 : 940,
            deviceScaleFactor: formFactor === 'mobile' ? 2 : 1,
          },
        },
      };

      // Run Lighthouse with timeout
      const lighthousePromise = lighthouse(url, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
      }, config as any);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ScannerTimeoutError(this.scannerType, timeout)), timeout)
      );

      const result = await Promise.race([lighthousePromise, timeoutPromise]) as any;

      if (!result || !result.lhr) {
        throw new Error('Lighthouse returned no results');
      }

      // Extract accessibility audits
      const accessibilityAudits = this.filterAccessibilityAudits(result.lhr.audits as Record<string, LighthouseAudit>);

      // Convert to FindingData
      return this.convertAudits(accessibilityAudits, url);
    } finally {
      // Always kill Chrome
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  /**
   * Filter audits to include only failing accessibility audits
   */
  private filterAccessibilityAudits(audits: Record<string, LighthouseAudit>): LighthouseAudit[] {
    const filtered: LighthouseAudit[] = [];

    Object.entries(audits).forEach(([key, audit]) => {
      // Include audits that:
      // 1. Have a score (not null)
      // 2. Failed (score < 1.0)
      // 3. Are binary or numeric (not manual or notApplicable)
      if (
        audit.score !== null &&
        audit.score < 1.0 &&
        (audit.scoreDisplayMode === 'binary' || audit.scoreDisplayMode === 'numeric')
      ) {
        filtered.push(audit);
      }
    });

    return filtered;
  }

  /**
   * Convert Lighthouse audits to our FindingData format
   */
  private convertAudits(audits: LighthouseAudit[], url: string): FindingData[] {
    return audits.map((audit) => {
      // Extract code snippet from details if available
      let codeSnippet: string | undefined;
      if (audit.details?.items && audit.details.items.length > 0) {
        const firstItem = audit.details.items[0];
        if (firstItem && firstItem.node?.snippet) {
          codeSnippet = firstItem.node.snippet.substring(0, 200); // Truncate to 200 chars
        }
      }

      // If no snippet from details, use truncated description
      if (!codeSnippet) {
        codeSnippet = audit.description.substring(0, 200);
      }

      return {
        ruleId: `lighthouse.${audit.id}`,
        severity: FindingSeverity.MEDIUM,  // All Lighthouse failures → MEDIUM
        message: audit.title,
        filePath: url,                     // URL is the "file" for page-level findings
        lineNumber: null,                  // Page-level finding (no line number)
        codeSnippet: codeSnippet?.trim(),
      };
    });
  }
}

/**
 * Factory function to create Lighthouse scanner instance
 */
export function createLighthouseScanner(): Scanner {
  return new LighthouseScanner();
}
