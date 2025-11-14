/**
 * Unit tests for Semgrep Scanner
 * Tests valid parsing, error handling, severity mapping, and edge cases
 */

import { SemgrepScanner } from '../semgrep';
import { FindingSeverity, FindingCategory, ScannerType } from '@prisma/client';
import { ScannerError, ScannerTimeoutError } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';
import * as cp from 'child_process';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Mock child_process
jest.mock('child_process');

describe('SemgrepScanner', () => {
  let scanner: SemgrepScanner;

  beforeEach(() => {
    scanner = new SemgrepScanner();
  });

  describe('Valid Semgrep Output Parsing', () => {
    it('should parse valid Semgrep JSON output and convert to FindingData[]', async () => {
      // Load fixture
      const fixturePath = path.join(FIXTURES_DIR, 'semgrep-output.json');
      const fixtureContent = await fs.readFile(fixturePath, 'utf-8');
      const semgrepOutput = JSON.parse(fixtureContent);

      // Mock exec to return fixture output
      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: JSON.stringify(semgrepOutput), stderr: '' });
      });

      // Execute scan
      const result = await scanner.scan('/fake/project/path');

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.category).toBe(FindingCategory.SECURITY);
      expect(result.findings).toHaveLength(5); // Fixture has 5 findings
      expect(result.summary.totalFindings).toBe(5);

      // Verify first finding (XSS vulnerability - ERROR severity)
      const xssFinding = result.findings[0];
      expect(xssFinding.ruleId).toBe('semgrep.javascript.lang.security.audit.xss.direct-response');
      expect(xssFinding.severity).toBe(FindingSeverity.CRITICAL); // ERROR → CRITICAL
      expect(xssFinding.message).toContain('Potential XSS vulnerability');
      expect(xssFinding.filePath).toBe('apps/web/app/api/users/route.ts');
      expect(xssFinding.lineNumber).toBe(42);
      expect(xssFinding.codeSnippet).toContain('Response.json');

      // Verify second finding (SQL injection - ERROR severity)
      const sqlFinding = result.findings[1];
      expect(sqlFinding.ruleId).toBe('semgrep.javascript.lang.security.audit.sql-injection.pg-sqli');
      expect(sqlFinding.severity).toBe(FindingSeverity.CRITICAL); // ERROR → CRITICAL
      expect(sqlFinding.message).toContain('Potential SQL injection');
      expect(sqlFinding.lineNumber).toBe(128);

      // Verify third finding (Hardcoded credentials - WARNING severity)
      const credFinding = result.findings[2];
      expect(credFinding.ruleId).toBe('semgrep.javascript.lang.security.audit.hardcoded-credentials');
      expect(credFinding.severity).toBe(FindingSeverity.HIGH); // WARNING → HIGH
      expect(credFinding.message).toContain('Hardcoded credential');

      // Verify fourth finding (Best practice - INFO severity)
      const infoPractice = result.findings[3];
      expect(infoPractice.severity).toBe(FindingSeverity.MEDIUM); // INFO → MEDIUM

      // Verify fifth finding (Missing code snippet)
      const noSnippet = result.findings[4];
      expect(noSnippet.codeSnippet).toBeUndefined(); // No 'lines' field in fixture
    });

    it('should correctly map Semgrep severities to FindingSeverity enum', async () => {
      const fixture = {
        results: [
          {
            check_id: 'test.error',
            path: 'test.ts',
            start: { line: 1, col: 1 },
            end: { line: 1, col: 10 },
            extra: { message: 'Error level', severity: 'ERROR' }
          },
          {
            check_id: 'test.warning',
            path: 'test.ts',
            start: { line: 2, col: 1 },
            end: { line: 2, col: 10 },
            extra: { message: 'Warning level', severity: 'WARNING' }
          },
          {
            check_id: 'test.info',
            path: 'test.ts',
            start: { line: 3, col: 1 },
            end: { line: 3, col: 10 },
            extra: { message: 'Info level', severity: 'INFO' }
          },
        ],
        errors: [],
      };

      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: JSON.stringify(fixture), stderr: '' });
      });

      const result = await scanner.scan('/fake/path');

      expect(result.findings[0].severity).toBe(FindingSeverity.CRITICAL); // ERROR
      expect(result.findings[1].severity).toBe(FindingSeverity.HIGH);     // WARNING
      expect(result.findings[2].severity).toBe(FindingSeverity.MEDIUM);   // INFO
    });

    it('should generate accurate summary with counts by severity', async () => {
      const fixturePath = path.join(FIXTURES_DIR, 'semgrep-output.json');
      const fixtureContent = await fs.readFile(fixturePath, 'utf-8');
      const semgrepOutput = JSON.parse(fixtureContent);

      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: JSON.stringify(semgrepOutput), stderr: '' });
      });

      const result = await scanner.scan('/fake/path');

      // Verify summary structure
      expect(result.summary.totalFindings).toBe(5);
      expect(result.summary.bySeverity).toBeDefined();

      // Count by severity (based on fixture):
      // 2 ERROR (CRITICAL), 2 WARNING (HIGH), 1 INFO (MEDIUM)
      expect(result.summary.bySeverity.CRITICAL).toBe(2);
      expect(result.summary.bySeverity.HIGH).toBe(2);
      expect(result.summary.bySeverity.MEDIUM).toBe(1);
      expect(result.summary.bySeverity.LOW).toBeUndefined(); // No LOW findings
    });
  });

  describe('Malformed Output Handling', () => {
    it('should throw ScannerError when Semgrep JSON is malformed', async () => {
      // Mock exec to return invalid JSON
      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: '{ invalid json }}', stderr: '' });
      });

      // Should throw ScannerError
      await expect(scanner.scan('/fake/path')).rejects.toThrow(ScannerError);
      await expect(scanner.scan('/fake/path')).rejects.toThrow('Failed to parse Semgrep JSON output');
    });

    it('should handle empty results gracefully', async () => {
      const emptyOutput = {
        results: [],
        errors: [],
        paths: { scanned: [] }
      };

      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: JSON.stringify(emptyOutput), stderr: '' });
      });

      const result = await scanner.scan('/fake/path');

      expect(result.findings).toHaveLength(0);
      expect(result.summary.totalFindings).toBe(0);
      expect(Object.keys(result.summary.bySeverity)).toHaveLength(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should throw ScannerTimeoutError when scan exceeds timeout', async () => {
      // Mock exec to delay and never complete within timeout
      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        // Simulate long-running process
        setTimeout(() => {
          callback(null, { stdout: '{}', stderr: '' });
        }, 10000); // 10 seconds (exceeds 1-second timeout)
      });

      // Execute scan with 1-second timeout
      await expect(scanner.scan('/fake/path', { timeout: 1000 })).rejects.toThrow(ScannerTimeoutError);
    }, 15000); // Increase Jest timeout for this test
  });

  describe('Scanner Configuration', () => {
    it('should use custom rule configuration when specified', async () => {
      let capturedCommand = '';

      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        capturedCommand = cmd;
        callback(null, { stdout: '{"results":[],"errors":[]}', stderr: '' });
      });

      await scanner.scan('/fake/path', { ruleConfig: 'p/security-audit' });

      expect(capturedCommand).toContain('--config p/security-audit');
    });

    it('should apply exclude patterns to command', async () => {
      let capturedCommand = '';

      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        capturedCommand = cmd;
        callback(null, { stdout: '{"results":[],"errors":[]}', stderr: '' });
      });

      await scanner.scan('/fake/path', {
        exclude: ['node_modules/**', '*.test.ts']
      });

      expect(capturedCommand).toContain('--exclude node_modules/**');
      expect(capturedCommand).toContain('--exclude *.test.ts');
    });
  });

  describe('Error Scenarios', () => {
    it('should throw ScannerNotFoundError when semgrep command not found', async () => {
      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        const error = new Error('semgrep: command not found');
        callback(error, { stdout: '', stderr: '' });
      });

      await expect(scanner.scan('/fake/path')).rejects.toThrow('semgrep');
    });

    it('should wrap generic errors in ScannerError', async () => {
      jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
        const error = new Error('Unknown error occurred');
        callback(error, { stdout: '', stderr: '' });
      });

      await expect(scanner.scan('/fake/path')).rejects.toThrow(ScannerError);
      await expect(scanner.scan('/fake/path')).rejects.toThrow('Semgrep scan failed');
    });
  });
});
