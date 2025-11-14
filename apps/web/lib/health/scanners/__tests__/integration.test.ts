/**
 * Integration tests for Health Scanners
 * Tests real scanner execution on actual codebase
 *
 * Run with: pnpm test integration
 */

import { SemgrepScanner } from '../semgrep';
import { ESLintScanner } from '../eslint';
import { FindingCategory, ScannerType } from '@prisma/client';
import * as path from 'path';

// Skip these tests in CI or when SKIP_INTEGRATION is set
const shouldSkip = process.env.CI === 'true' || process.env.SKIP_INTEGRATION === 'true';
const describeIntegration = shouldSkip ? describe.skip : describe;

describeIntegration('Integration Tests', () => {
  // Increase timeout for real scans (Semgrep can take 3-5 minutes)
  jest.setTimeout(300000); // 5 minutes

  const projectRoot = path.resolve(__dirname, '../../../..');

  describe('SemgrepScanner Integration', () => {
    it('should execute real Semgrep scan on ProjectPulse codebase', async () => {
      const scanner = new SemgrepScanner();

      // Execute scan on the project root (apps/web)
      const scanPath = projectRoot;
      console.log(`\n🔍 Running Semgrep scan on: ${scanPath}`);

      const result = await scanner.scan(scanPath, {
        ruleConfig: 'auto',
        exclude: [
          'node_modules/**',
          'dist/**',
          'build/**',
          '.next/**',
          'coverage/**',
          '*.min.js',
        ],
        timeout: 120000, // 2 minutes
      });

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.category).toBe(FindingCategory.SECURITY);
      expect(Array.isArray(result.findings)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFindings).toBe(result.findings.length);

      // Log results
      console.log(`\n✅ Semgrep scan complete:`);
      console.log(`   Total findings: ${result.summary.totalFindings}`);
      console.log(`   By severity:`, result.summary.bySeverity);

      // Verify findings have required fields
      if (result.findings.length > 0) {
        const firstFinding = result.findings[0];
        expect(firstFinding.ruleId).toBeDefined();
        expect(firstFinding.severity).toBeDefined();
        expect(firstFinding.message).toBeDefined();
        expect(firstFinding.filePath).toBeDefined();

        console.log(`\n📋 Sample finding:`);
        console.log(`   Rule: ${firstFinding.ruleId}`);
        console.log(`   Severity: ${firstFinding.severity}`);
        console.log(`   File: ${firstFinding.filePath}:${firstFinding.lineNumber || '?'}`);
        console.log(`   Message: ${firstFinding.message.substring(0, 100)}...`);
      }
    });

    it('should handle exclude patterns correctly', async () => {
      const scanner = new SemgrepScanner();
      const scanPath = projectRoot;

      // Scan with aggressive exclusions
      const result = await scanner.scan(scanPath, {
        ruleConfig: 'auto',
        exclude: [
          'node_modules/**',
          '**/*.test.ts',
          '**/__tests__/**',
          'dist/**',
          '.next/**',
        ],
        timeout: 120000,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);

      // Verify no findings in excluded directories
      const testFindings = result.findings.filter(f =>
        f.filePath.includes('__tests__') || f.filePath.includes('.test.ts')
      );
      expect(testFindings.length).toBe(0);

      console.log(`\n✅ Exclude patterns working: ${result.findings.length} findings (no test files)`);
    });
  });

  describe('ESLintScanner Integration', () => {
    it('should execute real ESLint scan on ProjectPulse codebase', async () => {
      const scanner = new ESLintScanner();

      // Execute scan on the project root (apps/web)
      const scanPath = projectRoot;
      console.log(`\n🔍 Running ESLint scan on: ${scanPath}`);

      const result = await scanner.scan(scanPath, {
        extensions: ['.ts', '.tsx'], // TypeScript only (no .js/.jsx files in this project)
        // ESLint uses .eslintignore for exclusions
      });

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.category).toBe(FindingCategory.CODE_QUALITY);
      expect(Array.isArray(result.findings)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFindings).toBe(result.findings.length);

      // Log results
      console.log(`\n✅ ESLint scan complete:`);
      console.log(`   Total findings: ${result.summary.totalFindings}`);
      console.log(`   By severity:`, result.summary.bySeverity);

      // Verify findings have required fields
      if (result.findings.length > 0) {
        const firstFinding = result.findings[0];
        expect(firstFinding.ruleId).toBeDefined();
        expect(firstFinding.ruleId).toContain('eslint.');
        expect(firstFinding.severity).toBeDefined();
        expect(firstFinding.message).toBeDefined();
        expect(firstFinding.filePath).toBeDefined();

        console.log(`\n📋 Sample finding:`);
        console.log(`   Rule: ${firstFinding.ruleId}`);
        console.log(`   Severity: ${firstFinding.severity}`);
        console.log(`   File: ${firstFinding.filePath}:${firstFinding.lineNumber || '?'}`);
        console.log(`   Message: ${firstFinding.message.substring(0, 100)}...`);

        // Verify code snippet if available
        if (firstFinding.codeSnippet) {
          console.log(`   Code snippet available: ${firstFinding.codeSnippet.split('\n').length} lines`);
        }
      }
    });

    it('should filter out parse errors (null ruleId)', async () => {
      const scanner = new ESLintScanner();
      const scanPath = projectRoot;

      const result = await scanner.scan(scanPath);

      // Verify no findings with null ruleId
      const parseErrors = result.findings.filter(f => !f.ruleId || f.ruleId === 'eslint.null');
      expect(parseErrors.length).toBe(0);

      console.log(`\n✅ Parse error filtering: ${result.findings.length} valid findings (no parse errors)`);
    });
  });

  describe('Scanner Performance', () => {
    it('should complete Semgrep scan within timeout', async () => {
      const scanner = new SemgrepScanner();
      const scanPath = projectRoot;

      const startTime = Date.now();
      await scanner.scan(scanPath, { timeout: 120000 });
      const duration = Date.now() - startTime;

      console.log(`\n⏱️  Semgrep scan duration: ${(duration / 1000).toFixed(2)}s`);
      expect(duration).toBeLessThan(120000);
    });

    it('should complete ESLint scan within reasonable time', async () => {
      const scanner = new ESLintScanner();
      const scanPath = projectRoot;

      const startTime = Date.now();
      await scanner.scan(scanPath);
      const duration = Date.now() - startTime;

      console.log(`\n⏱️  ESLint scan duration: ${(duration / 1000).toFixed(2)}s`);
      expect(duration).toBeLessThan(60000); // 1 minute
    });
  });
});
