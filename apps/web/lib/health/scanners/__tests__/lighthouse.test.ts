/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Unit tests for Lighthouse accessibility scanner
 * Sprint 7 Day 10 - Accessibility Scanners (Task 29)
 */

import { FindingCategory, FindingSeverity } from '@prisma/client';
import { LighthouseScanner } from '../lighthouse';
import { ScannerError, ScannerTimeoutError } from '../types';
import lighthouseFixture from './fixtures/lighthouse-output.json';

// Manual mocks to avoid ESM issues with lighthouse
let mockLighthouseResult: any = lighthouseFixture;
let mockChromeLaunch: jest.Mock;
let mockChromeKill: jest.Mock;

// Mock lighthouse module
jest.mock('lighthouse', () => {
  return jest.fn(() => Promise.resolve(mockLighthouseResult));
});

// Mock chrome-launcher module
jest.mock('chrome-launcher', () => ({
  launch: (...args: any[]) => mockChromeLaunch(...args),
}));

// Import mocked modules after jest.mock()
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

describe('LighthouseScanner', () => {
  let scanner: LighthouseScanner;

  beforeEach(() => {
    scanner = new LighthouseScanner();

    // Reset mock state
    mockLighthouseResult = lighthouseFixture;
    mockChromeKill = jest.fn().mockResolvedValue(undefined);

    // Setup Chrome launcher mock
    mockChromeLaunch = jest.fn().mockResolvedValue({
      port: 9222,
      kill: mockChromeKill,
    });

    // Reset lighthouse mock to default behavior
    (lighthouse as unknown as jest.Mock).mockClear();
    (lighthouse as unknown as jest.Mock).mockResolvedValue(mockLighthouseResult);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scan()', () => {
    it('should parse valid Lighthouse audits into FindingData', async () => {
      const result = await scanner.scan('/test/project');

      // Verify scan result structure
      expect(result.scannerId).toBe(-1); // Placeholder
      expect(result.category).toBe(FindingCategory.PERFORMANCE); // Lighthouse provides perf + a11y
      expect(result.findings).toHaveLength(8); // 8 failing audits in fixture

      // Verify first finding (aria-required-attr, score: 0)
      const firstFinding = result.findings[0];
      expect(firstFinding.ruleId).toBe('lighthouse.aria-required-attr');
      expect(firstFinding.severity).toBe(FindingSeverity.MEDIUM); // All → MEDIUM
      expect(firstFinding.message).toBe('[aria-*] attributes do not match their roles');
      expect(firstFinding.filePath).toBe('http://localhost:3000'); // Default baseUrl
      expect(firstFinding.lineNumber).toBeNull(); // Page-level finding
      expect(firstFinding.codeSnippet).toContain('<div role="combobox"');
    });

    it('should filter audits to include only failures (score < 1.0)', async () => {
      const result = await scanner.scan('/test/project');

      // Check that all findings have failing scores
      const foundRuleIds = result.findings.map(f => f.ruleId.replace('lighthouse.', ''));

      // Should include failing audits
      expect(foundRuleIds).toContain('aria-required-attr'); // score: 0
      expect(foundRuleIds).toContain('image-alt'); // score: 0.5
      expect(foundRuleIds).toContain('button-name'); // score: 0
      expect(foundRuleIds).toContain('color-contrast'); // score: 0.8
      expect(foundRuleIds).toContain('link-name'); // score: 0.67
      expect(foundRuleIds).toContain('meta-viewport'); // score: 0.5
      expect(foundRuleIds).toContain('label'); // score: 0.33
      expect(foundRuleIds).toContain('heading-order'); // score: 0

      // Should NOT include passing audits
      expect(foundRuleIds).not.toContain('document-title'); // score: 1
      expect(foundRuleIds).not.toContain('html-has-lang'); // score: 1

      // Should NOT include manual or notApplicable audits
      expect(foundRuleIds).not.toContain('bypass'); // scoreDisplayMode: manual
      expect(foundRuleIds).not.toContain('accesskeys'); // scoreDisplayMode: notApplicable
    });

    it('should map all Lighthouse failures to MEDIUM severity', async () => {
      const result = await scanner.scan('/test/project');

      // All findings should be MEDIUM severity
      result.findings.forEach((finding) => {
        expect(finding.severity).toBe(FindingSeverity.MEDIUM);
      });
    });

    it('should extract code snippet from audit details when available', async () => {
      const result = await scanner.scan('/test/project');

      // aria-required-attr has snippet in details
      const ariaFinding = result.findings.find(f => f.ruleId === 'lighthouse.aria-required-attr');
      expect(ariaFinding?.codeSnippet).toBe('<div role="combobox" tabindex="0">Select...</div>');

      // image-alt has snippet in details
      const imageFinding = result.findings.find(f => f.ruleId === 'lighthouse.image-alt');
      expect(imageFinding?.codeSnippet).toBe('<img src="/logo.png" class="logo">');

      // button-name has snippet in details
      const buttonFinding = result.findings.find(f => f.ruleId === 'lighthouse.button-name');
      expect(buttonFinding?.codeSnippet).toBe('<button class="icon-button"><svg>...</svg></button>');
    });

    it('should use audit description as snippet when no details available', async () => {
      const result = await scanner.scan('/test/project');

      // color-contrast has no details.items
      const contrastFinding = result.findings.find(f => f.ruleId === 'lighthouse.color-contrast');
      expect(contrastFinding?.codeSnippet).toContain('Low-contrast text is difficult');
      expect(contrastFinding?.codeSnippet!.length).toBeLessThanOrEqual(200); // Truncated
    });

    it('should calculate summary with correct severity counts', async () => {
      const result = await scanner.scan('/test/project');

      // All Lighthouse failures are MEDIUM
      expect(result.summary).toEqual({
        totalFindings: 8,
        bySeverity: {
          critical: 0,
          high: 0,
          medium: 8, // All failures
          low: 0,
        },
      });
    });

    it('should use custom baseUrl when provided', async () => {
      await scanner.scan('/test/project', {
        baseUrl: 'http://192.168.1.15:3000',
      });

      expect(lighthouse).toHaveBeenCalledWith(
        'http://192.168.1.15:3000',
        expect.objectContaining({ port: 9222 }),
        expect.any(Object)
      );
    });

    it('should configure form factor for mobile or desktop', async () => {
      await scanner.scan('/test/project', {
        formFactor: 'mobile',
      });

      expect(lighthouse).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          settings: expect.objectContaining({
            formFactor: 'mobile',
            screenEmulation: expect.objectContaining({
              mobile: true,
              width: 375,
              height: 667,
            }),
          }),
        })
      );
    });

    it('should throw ScannerTimeoutError when Lighthouse exceeds timeout', async () => {
      // Mock long-running Lighthouse
      (lighthouse as unknown as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 150000))
      );

      await expect(
        scanner.scan('/test/project', { timeout: 1000 })
      ).rejects.toThrow(ScannerTimeoutError);
    });

    it('should throw ScannerError when Chrome fails to launch', async () => {
      mockChromeLaunch.mockRejectedValue(new Error('Chrome launch failed'));

      await expect(scanner.scan('/test/project')).rejects.toThrow(ScannerError);
    });

    it('should throw ScannerError when Lighthouse returns no results', async () => {
      (lighthouse as unknown as jest.Mock).mockResolvedValue(undefined);

      await expect(scanner.scan('/test/project')).rejects.toThrow(ScannerError);
    });

    it('should always kill Chrome even if scan fails', async () => {
      (lighthouse as unknown as jest.Mock).mockRejectedValue(new Error('Lighthouse failed'));

      await expect(scanner.scan('/test/project')).rejects.toThrow();

      // Chrome should still be killed
      expect(mockChromeKill).toHaveBeenCalled();
    });

    it('should handle empty failing audits gracefully', async () => {
      // Mock Lighthouse with all passing audits
      (lighthouse as unknown as jest.Mock).mockResolvedValue({
        lhr: {
          audits: {
            'passing-audit': {
              id: 'passing-audit',
              title: 'Passing audit',
              description: 'All good',
              score: 1.0,
              scoreDisplayMode: 'binary',
            },
          },
        },
      });

      const result = await scanner.scan('/test/project');

      expect(result.findings).toHaveLength(0);
      expect(result.summary.totalFindings).toBe(0);
      expect(result.summary.bySeverity.medium).toBe(0);
    });

    it('should truncate code snippets to 200 characters', async () => {
      // Mock audit with very long description
      const longDescription = 'Very long description. ' + 'Lorem ipsum dolor sit amet. '.repeat(20);
      (lighthouse as unknown as jest.Mock).mockResolvedValue({
        lhr: {
          audits: {
            'test-audit': {
              id: 'test-audit',
              title: 'Test audit',
              description: longDescription,
              score: 0,
              scoreDisplayMode: 'binary',
            },
          },
        },
      });

      const result = await scanner.scan('/test/project');

      expect(result.findings[0].codeSnippet).toBeDefined();
      expect(result.findings[0].codeSnippet!.length).toBeLessThanOrEqual(200);
    });
  });

  describe('createLighthouseScanner()', () => {
    it('should create LighthouseScanner instance', () => {
      const { createLighthouseScanner } = require('../lighthouse');
      const instance = createLighthouseScanner();

      expect(instance).toBeInstanceOf(LighthouseScanner);
    });
  });
});
