/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Semgrep Scanner
 * Tests valid parsing, error handling, severity mapping, and edge cases
 */

import { SemgrepScanner } from '../semgrep';
import { FindingCategory, FindingSeverity } from '@prisma/client';
import { ScannerError, ScannerTimeoutError } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// Helper to create mock spawn process
function createMockSpawn(stdout: string, stderr: string = '', exitCode: number = 0) {
  const mockProcess = new EventEmitter() as any;
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  mockProcess.kill = jest.fn();

  // Simulate async process execution
  process.nextTick(() => {
    mockProcess.stdout.emit('data', Buffer.from(stdout));
    if (stderr) {
      mockProcess.stderr.emit('data', Buffer.from(stderr));
    }
    mockProcess.emit('close', exitCode);
  });

  return mockProcess;
}

describe('SemgrepScanner', () => {
  let scanner: SemgrepScanner;
  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

  beforeEach(() => {
    scanner = new SemgrepScanner();
    jest.clearAllMocks();
  });

  describe('Valid Semgrep Output Parsing', () => {
    it('should parse valid Semgrep JSON output and convert to FindingData[]', async () => {
      // Load fixture
      const fixturePath = path.join(FIXTURES_DIR, 'semgrep-output.json');
      const fixtureContent = await fs.readFile(fixturePath, 'utf-8');

      // Mock spawn to return fixture output
      mockSpawn.mockReturnValue(createMockSpawn(fixtureContent));

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
      expect(sqlFinding.ruleId).toBe(
        'semgrep.javascript.lang.security.audit.sql-injection.pg-sqli'
      );
      expect(sqlFinding.severity).toBe(FindingSeverity.CRITICAL); // ERROR → CRITICAL
      expect(sqlFinding.message).toContain('Potential SQL injection');
      expect(sqlFinding.lineNumber).toBe(128);

      // Verify third finding (Hardcoded credentials - WARNING severity)
      const credFinding = result.findings[2];
      expect(credFinding.ruleId).toBe(
        'semgrep.javascript.lang.security.audit.hardcoded-credentials'
      );
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
            extra: { message: 'Error level', severity: 'ERROR' },
          },
          {
            check_id: 'test.warning',
            path: 'test.ts',
            start: { line: 2, col: 1 },
            end: { line: 2, col: 10 },
            extra: { message: 'Warning level', severity: 'WARNING' },
          },
          {
            check_id: 'test.info',
            path: 'test.ts',
            start: { line: 3, col: 1 },
            end: { line: 3, col: 10 },
            extra: { message: 'Info level', severity: 'INFO' },
          },
        ],
        errors: [],
      };

      mockSpawn.mockReturnValue(createMockSpawn(JSON.stringify(fixture)));

      const result = await scanner.scan('/fake/path');

      expect(result.findings[0].severity).toBe(FindingSeverity.CRITICAL); // ERROR
      expect(result.findings[1].severity).toBe(FindingSeverity.HIGH); // WARNING
      expect(result.findings[2].severity).toBe(FindingSeverity.MEDIUM); // INFO
    });

    it('should generate accurate summary with counts by severity', async () => {
      const fixturePath = path.join(FIXTURES_DIR, 'semgrep-output.json');
      const fixtureContent = await fs.readFile(fixturePath, 'utf-8');

      mockSpawn.mockReturnValue(createMockSpawn(fixtureContent));

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
      // Mock spawn to return invalid JSON
      mockSpawn.mockReturnValue(createMockSpawn('{ invalid json }}'));

      // Should throw ScannerError
      await expect(scanner.scan('/fake/path')).rejects.toThrow(ScannerError);
      await expect(scanner.scan('/fake/path')).rejects.toThrow(
        'Failed to parse Semgrep JSON output'
      );
    });

    it('should handle empty results gracefully', async () => {
      const emptyOutput = {
        results: [],
        errors: [],
        paths: { scanned: [] },
      };

      mockSpawn.mockReturnValue(createMockSpawn(JSON.stringify(emptyOutput)));

      const result = await scanner.scan('/fake/path');

      expect(result.findings).toHaveLength(0);
      expect(result.summary.totalFindings).toBe(0);
      expect(Object.keys(result.summary.bySeverity)).toHaveLength(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should throw ScannerTimeoutError when scan exceeds timeout', async () => {
      // Mock spawn with delayed process that never completes
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();

      // Don't emit 'close' event - simulates timeout
      mockSpawn.mockReturnValue(mockProcess);

      // Execute scan with 100ms timeout
      await expect(scanner.scan('/fake/path', { timeout: 100 })).rejects.toThrow(
        ScannerTimeoutError
      );
    }, 5000);
  });

  describe('Scanner Configuration', () => {
    it('should use custom rule configuration when specified', async () => {
      let capturedArgs: string[] = [];

      mockSpawn.mockImplementationOnce((cmd, args) => {
        capturedArgs = args as string[];
        return createMockSpawn('{"results":[],"errors":[]}') as any;
      });

      await scanner.scan('/fake/path', { ruleConfig: 'p/security-audit' });

      expect(capturedArgs).toContain('--config');
      expect(capturedArgs).toContain('p/security-audit');
    });

    it('should apply exclude patterns to command', async () => {
      let capturedArgs: string[] = [];

      mockSpawn.mockImplementationOnce((cmd, args) => {
        capturedArgs = args as string[];
        return createMockSpawn('{"results":[],"errors":[]}') as any;
      });

      await scanner.scan('/fake/path', {
        exclude: ['node_modules/**', '*.test.ts'],
      });

      expect(capturedArgs).toContain('--exclude');
      expect(capturedArgs).toContain('node_modules/**');
      expect(capturedArgs).toContain('*.test.ts');
    });
  });

  describe('Error Scenarios', () => {
    it('should throw ScannerNotFoundError when semgrep command not found', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();

      process.nextTick(() => {
        const error = new Error('spawn semgrep ENOENT') as any;
        error.code = 'ENOENT';
        mockProcess.emit('error', error);
      });

      mockSpawn.mockReturnValue(mockProcess);

      await expect(scanner.scan('/fake/path')).rejects.toThrow('semgrep');
    });

    it('should wrap generic errors in ScannerError', async () => {
      mockSpawn.mockReturnValue(createMockSpawn('', 'Unknown error occurred', 1));

      await expect(scanner.scan('/fake/path')).rejects.toThrow(ScannerError);
      await expect(scanner.scan('/fake/path')).rejects.toThrow('Semgrep scan failed');
    });
  });
});
