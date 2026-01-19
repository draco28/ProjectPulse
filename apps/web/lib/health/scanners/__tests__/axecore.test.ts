/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Unit tests for axe-core accessibility scanner
 * Sprint 7 Day 10 - Accessibility Scanners (Task 28)
 */

import { chromium, type Browser } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { FindingCategory, FindingSeverity } from '@prisma/client';
import { AxeCoreScanner } from '../axecore';
import { ScannerError, ScannerTimeoutError } from '../types';
import axeCoreFixture from './fixtures/axecore-results.json';

// Mock Playwright
jest.mock('@playwright/test', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

// Mock AxeBuilder
jest.mock('@axe-core/playwright', () => ({
  AxeBuilder: jest.fn(),
}));

describe('AxeCoreScanner', () => {
  let scanner: AxeCoreScanner;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;
  let mockAxeBuilder: jest.Mocked<any>;

  beforeEach(() => {
    scanner = new AxeCoreScanner();

    // Setup mocks
    mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAxeBuilder = {
      withTags: jest.fn().mockReturnThis(),
      analyze: jest.fn().mockResolvedValue(axeCoreFixture),
    };

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (AxeBuilder as jest.Mock).mockImplementation(() => mockAxeBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scan()', () => {
    it('should parse valid axe-core violations into FindingData', async () => {
      const result = await scanner.scan('/test/project');

      // Verify scan result structure
      expect(result.scannerId).toBe(-1); // Placeholder
      expect(result.category).toBe(FindingCategory.ACCESSIBILITY);
      expect(result.findings).toHaveLength(10); // 10 violations in fixture

      // Verify first finding (color-contrast)
      const firstFinding = result.findings[0];
      expect(firstFinding.ruleId).toBe('axe.color-contrast');
      expect(firstFinding.severity).toBe(FindingSeverity.HIGH); // serious → HIGH
      expect(firstFinding.message).toContain('Elements must have sufficient color contrast');
      expect(firstFinding.message).toContain('2 elements affected'); // 2 nodes
      expect(firstFinding.filePath).toBe('http://localhost:3000'); // Default baseUrl
      expect(firstFinding.lineNumber).toBeNull(); // Page-level finding
      expect(firstFinding.codeSnippet).toBe('<button class="btn-primary">Click me</button>');
    });

    it('should map axe-core impact levels to FindingSeverity correctly', async () => {
      const result = await scanner.scan('/test/project');

      const severityMap = result.findings.reduce(
        (map, finding) => {
          map[finding.ruleId] = finding.severity;
          return map;
        },
        {} as Record<string, FindingSeverity>
      );

      // Critical impact → CRITICAL severity
      expect(severityMap['axe.label']).toBe(FindingSeverity.CRITICAL);
      expect(severityMap['axe.aria-required-attr']).toBe(FindingSeverity.CRITICAL);
      expect(severityMap['axe.image-alt']).toBe(FindingSeverity.CRITICAL);
      expect(severityMap['axe.button-name']).toBe(FindingSeverity.CRITICAL);

      // Serious impact → HIGH severity
      expect(severityMap['axe.color-contrast']).toBe(FindingSeverity.HIGH);
      expect(severityMap['axe.link-name']).toBe(FindingSeverity.HIGH);

      // Moderate impact → MEDIUM severity
      expect(severityMap['axe.heading-order']).toBe(FindingSeverity.MEDIUM);
      expect(severityMap['axe.landmark-one-main']).toBe(FindingSeverity.MEDIUM);
      expect(severityMap['axe.region']).toBe(FindingSeverity.MEDIUM);

      // Minor impact → LOW severity
      expect(severityMap['axe.meta-viewport']).toBe(FindingSeverity.LOW);
    });

    it('should aggregate multiple nodes into single finding with count', async () => {
      const result = await scanner.scan('/test/project');

      // color-contrast violation has 2 nodes
      const colorContrastFinding = result.findings.find((f) => f.ruleId === 'axe.color-contrast');
      expect(colorContrastFinding).toBeDefined();
      expect(colorContrastFinding!.message).toContain('2 elements affected');

      // label violation has 1 node
      const labelFinding = result.findings.find((f) => f.ruleId === 'axe.label');
      expect(labelFinding).toBeDefined();
      expect(labelFinding!.message).toContain('1 element affected');
    });

    it('should calculate summary with correct severity counts', async () => {
      const result = await scanner.scan('/test/project');

      expect(result.summary).toEqual({
        totalFindings: 10,
        bySeverity: {
          critical: 4, // label, aria-required-attr, image-alt, button-name
          high: 2, // color-contrast, link-name
          medium: 3, // heading-order, landmark-one-main, region
          low: 1, // meta-viewport
        },
      });
    });

    it('should handle empty violations array gracefully', async () => {
      // Mock empty results
      mockAxeBuilder.analyze.mockResolvedValueOnce({ violations: [] });

      const result = await scanner.scan('/test/project');

      expect(result.findings).toHaveLength(0);
      expect(result.summary.totalFindings).toBe(0);
      expect(result.summary.bySeverity).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    });

    it('should use custom baseUrl when provided', async () => {
      await scanner.scan('/test/project', {
        baseUrl: 'http://192.168.1.15:3000',
      });

      expect(mockPage.goto).toHaveBeenCalledWith(
        'http://192.168.1.15:3000',
        expect.objectContaining({ waitUntil: 'load' })
      );
    });

    it('should apply WCAG level configuration', async () => {
      await scanner.scan('/test/project', {
        wcagLevel: 'AAA',
      });

      expect(mockAxeBuilder.withTags).toHaveBeenCalledWith(['wcagaaa', 'best-practice']);
    });

    it('should throw ScannerTimeoutError when page navigation times out', async () => {
      // Mock timeout
      mockPage.goto.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 70000)));

      await expect(scanner.scan('/test/project', { timeout: 1000 })).rejects.toThrow(
        ScannerTimeoutError
      );
    });

    it('should throw ScannerError when browser fails to launch', async () => {
      (chromium.launch as jest.Mock).mockRejectedValue(new Error('Browser launch failed'));

      await expect(scanner.scan('/test/project')).rejects.toThrow(ScannerError);
      await expect(scanner.scan('/test/project')).rejects.toThrow('axe-core scan failed');
    });

    it('should always close browser even if scan fails', async () => {
      mockAxeBuilder.analyze.mockRejectedValueOnce(new Error('Analysis failed'));

      await expect(scanner.scan('/test/project')).rejects.toThrow();

      // Browser should still be closed
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should truncate long code snippets to 500 characters', async () => {
      // Mock violation with very long HTML
      const longHtml = '<div class="container">' + 'a'.repeat(1000) + '</div>';
      mockAxeBuilder.analyze.mockResolvedValueOnce({
        violations: [
          {
            id: 'test-rule',
            impact: 'serious',
            help: 'Test rule',
            nodes: [{ html: longHtml, target: ['div'], failureSummary: 'Test' }],
          },
        ],
      });

      const result = await scanner.scan('/test/project');

      expect(result.findings[0].codeSnippet).toBeDefined();
      expect(result.findings[0].codeSnippet!.length).toBeLessThanOrEqual(500);
    });
  });

  describe('createAxeCoreScanner()', () => {
    it('should create AxeCoreScanner instance', () => {
      const { createAxeCoreScanner } = require('../axecore');
      const instance = createAxeCoreScanner();

      expect(instance).toBeInstanceOf(AxeCoreScanner);
    });
  });
});
