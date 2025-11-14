/**
 * Health MCP Tools Handler Tests
 *
 * Sprint 7 Day 12 - Health MCP Tools (US-120)
 * Created: 2025-11-14
 *
 * Comprehensive unit and integration tests for health MCP tool handlers:
 * - health.runScan - Scanner execution + score calculation
 * - health.getScore - Latest scores retrieval + trend analysis
 * - health.getHistory - Historical trend analysis with linear regression
 *
 * Test Coverage:
 * - Input validation (required fields, type checking, enum validation)
 * - Edge cases (empty results, single score, boundary values)
 * - Error handling (INVALID_PARAMS, NOT_FOUND, INTERNAL_ERROR)
 * - Integration workflows (end-to-end scanner execution)
 * - Trend calculation (direction, slope, averages)
 */

import {
  healthRunScanHandler,
  healthGetScoreHandler,
  healthGetHistoryHandler,
} from '../health-handler';
import { MCPError, JSONRPC_ERROR_CODES } from '../../types';
import { ScannerType, FindingCategory, FindingSeverity } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    healthScanner: {
      upsert: jest.fn(),
    },
    healthFinding: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    healthScore: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Get reference to mocked prisma
import { prisma as prismaMock } from '@/lib/prisma';

// Mock scanner registry
jest.mock('@/lib/health/scanners', () => ({
  getScanner: jest.fn((type: ScannerType) => ({
    scan: jest.fn().mockResolvedValue({
      scannerId: 1,
      category: FindingCategory.SECURITY,
      findings: [
        {
          ruleId: 'test-rule-1',
          severity: FindingSeverity.HIGH,
          message: 'Test finding',
          filePath: '/test/file.ts',
          lineNumber: 10,
          codeSnippet: 'const x = 1;',
        },
      ],
      summary: {
        totalFindings: 1,
        bySeverity: { critical: 0, high: 1, medium: 0, low: 0 },
      },
    }),
  })),
}));

// Mock score calculator
jest.mock('@/lib/health/scoring', () => ({
  calculateHealthScore: jest.fn(() => ({
    score: 85.5,
    grade: 'B',
    securityScore: 80.2,
    qualityScore: 88.3,
    accessibilityScore: 90.1,
    debtScore: 85.7,
    totalFindings: 10,
    criticalFindings: 2,
    highFindings: 3,
    mediumFindings: 4,
    lowFindings: 1,
  })),
}));

// ============================================================================
// health.runScan Tests
// ============================================================================

describe('healthRunScanHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject non-object input', async () => {
      await expect(healthRunScanHandler(null)).rejects.toThrow(MCPError);
      await expect(healthRunScanHandler(null)).rejects.toMatchObject({
        code: JSONRPC_ERROR_CODES.INVALID_PARAMS,
        statusCode: 400,
      });
    });

    it('should reject invalid projectId (non-integer)', async () => {
      await expect(
        healthRunScanHandler({
          projectId: 'not-a-number',
          scannerTypes: ['SEMGREP'],
          projectPath: '/path/to/project',
        })
      ).rejects.toThrow('Invalid projectId');
    });

    it('should reject invalid projectId (negative)', async () => {
      await expect(
        healthRunScanHandler({
          projectId: -1,
          scannerTypes: ['SEMGREP'],
          projectPath: '/path/to/project',
        })
      ).rejects.toThrow('Invalid projectId');
    });

    it('should reject empty scannerTypes array', async () => {
      await expect(
        healthRunScanHandler({
          projectId: 1,
          scannerTypes: [],
          projectPath: '/path/to/project',
        })
      ).rejects.toThrow('Invalid scannerTypes');
    });

    it('should reject invalid scanner type enum', async () => {
      await expect(
        healthRunScanHandler({
          projectId: 1,
          scannerTypes: ['INVALID_SCANNER'],
          projectPath: '/path/to/project',
        })
      ).rejects.toThrow('Invalid scanner type');
    });

    it('should reject invalid projectPath (empty string)', async () => {
      await expect(
        healthRunScanHandler({
          projectId: 1,
          scannerTypes: ['SEMGREP'],
          projectPath: '   ',
        })
      ).rejects.toThrow('Invalid projectPath');
    });
  });

  describe('Project Existence Validation', () => {
    it('should reject nonexistent project', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        healthRunScanHandler({
          projectId: 999,
          scannerTypes: ['SEMGREP'],
          projectPath: '/path/to/project',
        })
      ).rejects.toThrow('Project not found: 999');
    });
  });

  describe('Scanner Execution', () => {
    it('should execute scanner and store findings', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
      } as any);

      prismaMock.healthScanner.upsert.mockResolvedValue({
        id: 1,
        projectId: 1,
        type: ScannerType.SEMGREP,
        name: 'SEMGREP Scanner',
      } as any);

      prismaMock.healthFinding.createMany.mockResolvedValue({ count: 1 });
      prismaMock.healthFinding.findMany.mockResolvedValue([]);
      prismaMock.healthScore.create.mockResolvedValue({} as any);

      const result = await healthRunScanHandler({
        projectId: 1,
        scannerTypes: [ScannerType.SEMGREP],
        projectPath: '/path/to/project',
      });

      expect(result).toMatchObject({
        projectId: 1,
        scannersRun: [
          {
            type: ScannerType.SEMGREP,
            totalFindings: 1,
            bySeverity: { critical: 0, high: 1, medium: 0, low: 0 },
          },
        ],
        healthScore: {
          grade: 'B',
        },
      });

      expect(result.duration).toBeGreaterThan(0);
      expect(prismaMock.healthFinding.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            scannerId: 1,
            category: FindingCategory.SECURITY,
            severity: FindingSeverity.HIGH,
          }),
        ]),
      });
    });

    it('should handle partial scanner failures gracefully', async () => {
      const { getScanner } = require('@/lib/health/scanners');

      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
      } as any);

      prismaMock.healthScanner.upsert.mockResolvedValue({
        id: 1,
        projectId: 1,
        type: ScannerType.SEMGREP,
      } as any);

      // First scanner succeeds, second fails
      getScanner
        .mockReturnValueOnce({
          scan: jest.fn().mockResolvedValue({
            scannerId: 1,
            category: FindingCategory.SECURITY,
            findings: [],
            summary: { totalFindings: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } },
          }),
        })
        .mockReturnValueOnce({
          scan: jest.fn().mockRejectedValue(new Error('Scanner timeout')),
        });

      prismaMock.healthFinding.findMany.mockResolvedValue([]);
      prismaMock.healthScore.create.mockResolvedValue({} as any);

      const result = await healthRunScanHandler({
        projectId: 1,
        scannerTypes: [ScannerType.SEMGREP, ScannerType.ESLINT],
        projectPath: '/path/to/project',
      });

      expect(result.scannersRun).toHaveLength(2);
      expect(result.scannersRun[0]).not.toHaveProperty('error');
      expect(result.scannersRun[1]).toHaveProperty('error');
      expect(result.scannersRun[1].error).toContain('Scanner timeout');
    });

    it('should batch insert findings correctly', async () => {
      const { getScanner } = require('@/lib/health/scanners');

      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
      } as any);

      prismaMock.healthScanner.upsert.mockResolvedValue({
        id: 1,
        projectId: 1,
      } as any);

      getScanner.mockReturnValue({
        scan: jest.fn().mockResolvedValue({
          scannerId: 1,
          category: FindingCategory.SECURITY,
          findings: [
            {
              ruleId: 'rule-1',
              severity: FindingSeverity.CRITICAL,
              message: 'Finding 1',
              filePath: '/file1.ts',
              lineNumber: 10,
            },
            {
              ruleId: 'rule-2',
              severity: FindingSeverity.HIGH,
              message: 'Finding 2',
              filePath: '/file2.ts',
              lineNumber: 20,
            },
          ],
          summary: {
            totalFindings: 2,
            bySeverity: { critical: 1, high: 1, medium: 0, low: 0 },
          },
        }),
      });

      prismaMock.healthFinding.createMany.mockResolvedValue({ count: 2 });
      prismaMock.healthFinding.findMany.mockResolvedValue([]);
      prismaMock.healthScore.create.mockResolvedValue({} as any);

      await healthRunScanHandler({
        projectId: 1,
        scannerTypes: [ScannerType.SEMGREP],
        projectPath: '/path/to/project',
      });

      expect(prismaMock.healthFinding.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ ruleId: 'rule-1', severity: FindingSeverity.CRITICAL }),
          expect.objectContaining({ ruleId: 'rule-2', severity: FindingSeverity.HIGH }),
        ]),
      });
    });
  });

  describe('Score Calculation', () => {
    it('should exclude false positives from score calculation', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
      } as any);

      prismaMock.healthScanner.upsert.mockResolvedValue({
        id: 1,
        projectId: 1,
      } as any);

      prismaMock.healthFinding.createMany.mockResolvedValue({ count: 1 });
      prismaMock.healthFinding.findMany.mockResolvedValue([
        {
          ruleId: 'rule-1',
          severity: FindingSeverity.HIGH,
          message: 'Test',
          filePath: '/test.ts',
          lineNumber: 10,
          codeSnippet: null,
          category: FindingCategory.SECURITY,
        },
      ] as any);

      prismaMock.healthScore.create.mockResolvedValue({} as any);

      await healthRunScanHandler({
        projectId: 1,
        scannerTypes: [ScannerType.SEMGREP],
        projectPath: '/path/to/project',
      });

      expect(prismaMock.healthFinding.findMany).toHaveBeenCalledWith({
        where: {
          scanner: { projectId: 1 },
          falsePositive: false,
        },
        select: expect.any(Object),
      });
    });

    it('should round scores to integers for database storage', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
      } as any);

      prismaMock.healthScanner.upsert.mockResolvedValue({
        id: 1,
        projectId: 1,
      } as any);

      prismaMock.healthFinding.createMany.mockResolvedValue({ count: 1 });
      prismaMock.healthFinding.findMany.mockResolvedValue([]);
      prismaMock.healthScore.create.mockResolvedValue({} as any);

      await healthRunScanHandler({
        projectId: 1,
        scannerTypes: [ScannerType.SEMGREP],
        projectPath: '/path/to/project',
      });

      expect(prismaMock.healthScore.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          overallScore: 86, // Math.round(85.5)
          securityScore: 80, // Math.round(80.2)
          qualityScore: 88, // Math.round(88.3)
        }),
      });
    });
  });
});

// ============================================================================
// health.getScore Tests
// ============================================================================

describe('healthGetScoreHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject non-object input', async () => {
      await expect(healthGetScoreHandler(null)).rejects.toThrow(MCPError);
      await expect(healthGetScoreHandler(null)).rejects.toMatchObject({
        code: JSONRPC_ERROR_CODES.INVALID_PARAMS,
      });
    });

    it('should reject invalid projectId', async () => {
      await expect(
        healthGetScoreHandler({ projectId: 'invalid' })
      ).rejects.toThrow('Invalid projectId');
    });

    it('should reject invalid limit (out of range)', async () => {
      await expect(
        healthGetScoreHandler({ projectId: 1, limit: 0 })
      ).rejects.toThrow('Invalid limit');

      await expect(
        healthGetScoreHandler({ projectId: 1, limit: 11 })
      ).rejects.toThrow('Invalid limit');
    });

    it('should use default limit of 1', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          id: 1,
          overallScore: 85,
          securityScore: 80,
          qualityScore: 88,
          performanceScore: 90,
          accessibilityScore: 87,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetScoreHandler({ projectId: 1 });

      expect(prismaMock.healthScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );
      expect(result.scores).toHaveLength(1);
    });
  });

  describe('Score Retrieval', () => {
    it('should return single score without trend', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          id: 1,
          overallScore: 85,
          securityScore: 80,
          qualityScore: 88,
          performanceScore: 90,
          accessibilityScore: 87,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetScoreHandler({
        projectId: 1,
        limit: 1,
      });

      expect(result).toMatchObject({
        projectId: 1,
        scores: [
          {
            id: 1,
            overallScore: 85,
            calculatedAt: '2025-11-14T10:00:00.000Z',
          },
        ],
      });
      expect(result.trend).toBeUndefined();
    });

    it('should return multiple scores in chronological order', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          id: 3,
          overallScore: 90,
          calculatedAt: new Date('2025-11-14T12:00:00Z'),
        },
        {
          id: 2,
          overallScore: 85,
          calculatedAt: new Date('2025-11-14T11:00:00Z'),
        },
        {
          id: 1,
          overallScore: 80,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetScoreHandler({
        projectId: 1,
        limit: 3,
      });

      // Should be reversed to chronological order (oldest → newest)
      expect(result.scores[0].id).toBe(1);
      expect(result.scores[1].id).toBe(2);
      expect(result.scores[2].id).toBe(3);
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate improving trend', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          id: 2,
          overallScore: 90,
          calculatedAt: new Date('2025-11-14T11:00:00Z'),
        },
        {
          id: 1,
          overallScore: 80,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetScoreHandler({
        projectId: 1,
        limit: 2,
      });

      expect(result.trend).toEqual({
        direction: 'improving',
        change: 10, // 90 - 80
        period: '2 scores',
      });
    });

    it('should calculate declining trend', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          id: 2,
          overallScore: 70,
          calculatedAt: new Date('2025-11-14T11:00:00Z'),
        },
        {
          id: 1,
          overallScore: 85,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetScoreHandler({
        projectId: 1,
        limit: 2,
      });

      expect(result.trend).toEqual({
        direction: 'declining',
        change: -15, // 70 - 85
        period: '2 scores',
      });
    });

    it('should calculate stable trend for small changes', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          id: 2,
          overallScore: 82,
          calculatedAt: new Date('2025-11-14T11:00:00Z'),
        },
        {
          id: 1,
          overallScore: 80,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetScoreHandler({
        projectId: 1,
        limit: 2,
      });

      expect(result.trend).toEqual({
        direction: 'stable',
        change: 2, // 82 - 80 (< 2.0 threshold)
        period: '2 scores',
      });
    });
  });

  describe('Error Handling', () => {
    it('should reject nonexistent project', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        healthGetScoreHandler({ projectId: 999 })
      ).rejects.toThrow('Project not found: 999');
    });

    it('should reject when no scores found', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([]);

      await expect(
        healthGetScoreHandler({ projectId: 1 })
      ).rejects.toThrow('No health scores found for project 1');
    });
  });
});

// ============================================================================
// health.getHistory Tests
// ============================================================================

describe('healthGetHistoryHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject non-object input', async () => {
      await expect(healthGetHistoryHandler(null)).rejects.toThrow(MCPError);
      await expect(healthGetHistoryHandler(null)).rejects.toMatchObject({
        code: JSONRPC_ERROR_CODES.INVALID_PARAMS,
      });
    });

    it('should reject invalid projectId', async () => {
      await expect(
        healthGetHistoryHandler({ projectId: 'invalid' })
      ).rejects.toThrow('Invalid projectId');
    });

    it('should reject invalid days (out of range)', async () => {
      await expect(
        healthGetHistoryHandler({ projectId: 1, days: 0 })
      ).rejects.toThrow('Invalid days');

      await expect(
        healthGetHistoryHandler({ projectId: 1, days: 91 })
      ).rejects.toThrow('Invalid days');
    });

    it('should reject invalid category', async () => {
      await expect(
        healthGetHistoryHandler({ projectId: 1, category: 'invalid' as any })
      ).rejects.toThrow('Invalid category');
    });

    it('should use default values (days: 7, category: overall)', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          overallScore: 85,
          securityScore: 80,
          qualityScore: 88,
          performanceScore: 90,
          accessibilityScore: 87,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
      ] as any);

      const result = await healthGetHistoryHandler({ projectId: 1 });

      expect(result.category).toBe('overall');
      expect(result.period.days).toBe(7);
    });
  });

  describe('Historical Data Retrieval', () => {
    it('should retrieve scores within time window', async () => {
      const now = Date.now();
      const threeDaysAgo = new Date(now - 3 * 86400000);

      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          overallScore: 85,
          calculatedAt: new Date(now - 1 * 86400000),
        },
        {
          overallScore: 83,
          calculatedAt: new Date(now - 2 * 86400000),
        },
      ] as any);

      const result = await healthGetHistoryHandler({
        projectId: 1,
        days: 3,
      });

      expect(prismaMock.healthScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            calculatedAt: { gte: expect.any(Date) },
          }),
        })
      );
    });

    it('should extract correct category scores', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        {
          overallScore: 85,
          securityScore: 80,
          qualityScore: 88,
          performanceScore: 90,
          accessibilityScore: 87,
          calculatedAt: new Date('2025-11-14T10:00:00Z'),
        },
        {
          overallScore: 83,
          securityScore: 78,
          qualityScore: 86,
          performanceScore: 88,
          accessibilityScore: 85,
          calculatedAt: new Date('2025-11-14T11:00:00Z'),
        },
      ] as any);

      const result = await healthGetHistoryHandler({
        projectId: 1,
        category: 'security',
      });

      expect(result.history).toEqual([
        { date: '2025-11-14T10:00:00.000Z', score: 80 },
        { date: '2025-11-14T11:00:00.000Z', score: 78 },
      ]);
    });
  });

  describe('Trend Metrics Calculation', () => {
    it('should calculate correct average, min, max', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        { overallScore: 80, calculatedAt: new Date() },
        { overallScore: 85, calculatedAt: new Date() },
        { overallScore: 90, calculatedAt: new Date() },
      ] as any);

      const result = await healthGetHistoryHandler({ projectId: 1 });

      expect(result.trend).toMatchObject({
        average: 85, // (80 + 85 + 90) / 3 = 85
        min: 80,
        max: 90,
      });
    });

    it('should calculate linear regression slope correctly', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        { overallScore: 80, calculatedAt: new Date('2025-11-14T10:00:00Z') },
        { overallScore: 85, calculatedAt: new Date('2025-11-14T11:00:00Z') },
        { overallScore: 90, calculatedAt: new Date('2025-11-14T12:00:00Z') },
      ] as any);

      const result = await healthGetHistoryHandler({ projectId: 1 });

      // Perfect linear trend: slope should be 5 (increase of 5 per time unit)
      expect(result.trend.slope).toBe(5);
      expect(result.trend.direction).toBe('improving');
    });

    it('should detect improving trend (positive slope)', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        { overallScore: 75, calculatedAt: new Date() },
        { overallScore: 80, calculatedAt: new Date() },
        { overallScore: 85, calculatedAt: new Date() },
      ] as any);

      const result = await healthGetHistoryHandler({ projectId: 1 });

      expect(result.trend.direction).toBe('improving');
      expect(result.trend.slope).toBeGreaterThan(0);
    });

    it('should detect declining trend (negative slope)', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        { overallScore: 90, calculatedAt: new Date() },
        { overallScore: 85, calculatedAt: new Date() },
        { overallScore: 80, calculatedAt: new Date() },
      ] as any);

      const result = await healthGetHistoryHandler({ projectId: 1 });

      expect(result.trend.direction).toBe('declining');
      expect(result.trend.slope).toBeLessThan(0);
    });

    it('should detect stable trend (slope near zero)', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([
        { overallScore: 85, calculatedAt: new Date() },
        { overallScore: 85, calculatedAt: new Date() },
        { overallScore: 85, calculatedAt: new Date() },
      ] as any);

      const result = await healthGetHistoryHandler({ projectId: 1 });

      expect(result.trend.direction).toBe('stable');
      expect(Math.abs(result.trend.slope)).toBeLessThan(0.1);
    });
  });

  describe('Error Handling', () => {
    it('should reject nonexistent project', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        healthGetHistoryHandler({ projectId: 999 })
      ).rejects.toThrow('Project not found: 999');
    });

    it('should reject when no history found in time window', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.healthScore.findMany.mockResolvedValue([]);

      await expect(
        healthGetHistoryHandler({ projectId: 1, days: 7 })
      ).rejects.toThrow('No health scores found for project 1 in the last 7 days');
    });
  });
});
