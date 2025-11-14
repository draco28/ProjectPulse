/**
 * MCP Health Tools Handler
 *
 * Sprint 7 Day 12 - Health MCP Tools (US-120)
 * Created: 2025-11-14
 *
 * Provides MCP tool handlers for health monitoring operations:
 * - health.runScan - Execute scanners, store findings, calculate scores
 * - health.getScore - Retrieve latest health scores with trend analysis
 * - health.getHistory - Analyze historical score trends with metrics
 *
 * These handlers integrate the health scanning system (Days 8-10) and score
 * calculation system (Day 11) with the MCP server for AI agent access.
 *
 * Architecture:
 * - Scanner execution via SCANNER_REGISTRY (lib/health/scanners)
 * - Score calculation via calculateHealthScore (lib/health/scoring)
 * - Database operations via Prisma (HealthScanner, HealthFinding, HealthScore)
 * - Error handling with MCPError for JSON-RPC 2.0 responses
 *
 * @see apps/web/lib/health/scanners - Scanner implementations
 * @see apps/web/lib/health/scoring - Score calculation
 * @see apps/web/prisma/schema.prisma - Health models (lines 1070-1165)
 */

import { prisma } from '@/lib/prisma';
import { getScanner, type Scanner } from '@/lib/health/scanners';
import { calculateHealthScore } from '@/lib/health/scoring';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';
import { ScannerType, FindingCategory, FindingSeverity } from '@prisma/client';

// ============================================================================
// Tool 1: health.runScan
// ============================================================================

/**
 * Tool input schema for health.runScan
 *
 * Executes specified scanners on a project and calculates health scores.
 */
export interface HealthRunScanInput {
  /** Project ID to scan */
  projectId: number;

  /** Scanner types to execute (1+ required) */
  scannerTypes: ScannerType[];

  /** Absolute path to project directory */
  projectPath: string;

  /** Optional scanner configuration */
  options?: {
    /** File patterns to include (glob patterns) */
    include?: string[];

    /** File patterns to exclude (glob patterns) */
    exclude?: string[];
  };
}

/**
 * Tool output for health.runScan
 *
 * Returns execution summary with finding counts and health score.
 */
export interface HealthRunScanOutput {
  /** Project ID that was scanned */
  projectId: number;

  /** Summary of scanner executions */
  scannersRun: Array<{
    /** Scanner type executed */
    type: ScannerType;

    /** Total findings detected (or error if scanner failed) */
    totalFindings?: number;

    /** Breakdown by severity */
    bySeverity?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };

    /** Error message if scanner failed */
    error?: string;
  }>;

  /** Calculated health score after scan */
  healthScore: {
    overallScore: number;
    securityScore: number;
    qualityScore: number;
    performanceScore: number;
    accessibilityScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };

  /** Total execution duration in milliseconds */
  duration: number;
}

/**
 * MCP Tool Handler: health.runScan
 *
 * Execute health scanners, store findings, and calculate health scores.
 *
 * Process flow:
 * 1. Validate input (projectId, scannerTypes, projectPath)
 * 2. Verify project exists in database
 * 3. Execute each scanner:
 *    - Create/update HealthScanner record
 *    - Run scanner.scan()
 *    - Batch insert findings to HealthFinding table
 *    - Handle partial failures (continue with other scanners)
 * 4. Calculate overall health score from all findings
 * 5. Save score to HealthScore table
 * 6. Return execution summary
 *
 * @param input - Scan parameters
 * @returns Scan results with health score
 * @throws MCPError on validation or execution errors
 *
 * @example
 * ```typescript
 * const result = await healthRunScanHandler({
 *   projectId: 4,
 *   scannerTypes: ['SEMGREP', 'ESLINT'],
 *   projectPath: '/Users/draco/projects/AI_HUB/apps/web',
 *   options: {
 *     exclude: ['node_modules/**', '.next/**']
 *   }
 * });
 * // Returns: { projectId: 4, scannersRun: [...], healthScore: {...}, duration: 87500 }
 * ```
 */
export async function healthRunScanHandler(
  input: unknown
): Promise<HealthRunScanOutput> {
  const startTime = Date.now();

  try {
    // Validate input object
    if (!input || typeof input !== 'object') {
      throw new MCPError(
        'Invalid input: expected object',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const params = input as HealthRunScanInput;

    // Validate projectId
    if (
      typeof params.projectId !== 'number' ||
      !Number.isInteger(params.projectId) ||
      params.projectId <= 0
    ) {
      throw new MCPError(
        'Invalid projectId: must be a positive integer',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate scannerTypes
    if (!Array.isArray(params.scannerTypes) || params.scannerTypes.length === 0) {
      throw new MCPError(
        'Invalid scannerTypes: must be a non-empty array',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate each scanner type is valid enum value
    const validScannerTypes = Object.values(ScannerType);
    for (const type of params.scannerTypes) {
      if (!validScannerTypes.includes(type)) {
        throw new MCPError(
          `Invalid scanner type: ${type}. Valid types: ${validScannerTypes.join(', ')}`,
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }
    }

    // Validate projectPath
    if (typeof params.projectPath !== 'string' || params.projectPath.trim() === '') {
      throw new MCPError(
        'Invalid projectPath: must be a non-empty string',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new MCPError(
        `Project not found: ${params.projectId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Execute scanners
    const scanResults: HealthRunScanOutput['scannersRun'] = [];

    for (const scannerType of params.scannerTypes) {
      try {
        // Create or update HealthScanner record
        const healthScanner = await prisma.healthScanner.upsert({
          where: {
            projectId_type: {
              projectId: params.projectId,
              type: scannerType,
            },
          },
          update: {
            lastRun: new Date(),
          },
          create: {
            projectId: params.projectId,
            type: scannerType,
            name: `${scannerType} Scanner`,
          },
        });

        // Get scanner instance
        const scanner = await getScanner(scannerType);

        // Execute scan
        const scanResult = await scanner.scan(params.projectPath, {
          include: params.options?.include,
          exclude: params.options?.exclude,
        });

        // Map findings to database format
        const findingsData = scanResult.findings.map((finding) => ({
          scannerId: healthScanner.id,
          category: scanResult.category,
          severity: finding.severity,
          ruleId: finding.ruleId,
          message: finding.message,
          filePath: finding.filePath,
          lineNumber: finding.lineNumber,
          codeSnippet: finding.codeSnippet,
          scanDate: new Date(),
        }));

        // Batch insert findings
        if (findingsData.length > 0) {
          await prisma.healthFinding.createMany({
            data: findingsData,
          });
        }

        // Add to results
        scanResults.push({
          type: scannerType,
          totalFindings: scanResult.summary.totalFindings,
          bySeverity: scanResult.summary.bySeverity,
        });
      } catch (error) {
        // Log error and continue with other scanners (partial success)
        console.error(`[health.runScan] Scanner ${scannerType} failed:`, error);
        scanResults.push({
          type: scannerType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate health score from all findings (excluding false positives)
    const allFindings = await prisma.healthFinding.findMany({
      where: {
        scanner: { projectId: params.projectId },
        falsePositive: false,
      },
      select: {
        ruleId: true,
        severity: true,
        message: true,
        filePath: true,
        lineNumber: true,
        codeSnippet: true,
        category: true,
      },
    });

    // Map to FindingData format expected by calculator
    const findingsForCalculation = allFindings.map((f) => ({
      ruleId: f.ruleId,
      severity: f.severity,
      message: f.message,
      filePath: f.filePath,
      lineNumber: f.lineNumber,
      codeSnippet: f.codeSnippet ?? undefined,
    }));

    const scoreData = calculateHealthScore(findingsForCalculation);

    // Save health score (round to integers for database)
    await prisma.healthScore.create({
      data: {
        projectId: params.projectId,
        overallScore: Math.round(scoreData.score),
        securityScore: Math.round(scoreData.securityScore),
        qualityScore: Math.round(scoreData.qualityScore),
        performanceScore: Math.round(scoreData.debtScore), // Map debt → performance
        accessibilityScore: Math.round(scoreData.accessibilityScore),
        calculatedAt: new Date(),
      },
    });

    const duration = Date.now() - startTime;

    return {
      projectId: params.projectId,
      scannersRun: scanResults,
      healthScore: {
        overallScore: Math.round(scoreData.score * 10) / 10, // 1 decimal place for display
        securityScore: Math.round(scoreData.securityScore * 10) / 10,
        qualityScore: Math.round(scoreData.qualityScore * 10) / 10,
        performanceScore: Math.round(scoreData.debtScore * 10) / 10,
        accessibilityScore: Math.round(scoreData.accessibilityScore * 10) / 10,
        grade: scoreData.grade,
      },
      duration,
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;
    console.error('[health.runScan] Error:', error);
    throw new MCPError(
      `Scan execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// Tool 2: health.getScore
// ============================================================================

/**
 * Tool input schema for health.getScore
 *
 * Retrieves latest health scores with optional trend analysis.
 */
export interface HealthGetScoreInput {
  /** Project ID to get scores for */
  projectId: number;

  /** Number of scores to return (1-10, default: 1) */
  limit?: number;
}

/**
 * Tool output for health.getScore
 *
 * Returns latest scores with trend information if limit > 1.
 */
export interface HealthGetScoreOutput {
  /** Project ID */
  projectId: number;

  /** Latest score(s) in chronological order (oldest → newest) */
  scores: Array<{
    id: number;
    overallScore: number;
    securityScore: number;
    qualityScore: number;
    performanceScore: number;
    accessibilityScore: number;
    calculatedAt: string; // ISO 8601
  }>;

  /** Trend analysis (only if limit > 1) */
  trend?: {
    direction: 'improving' | 'declining' | 'stable';
    change: number; // Overall score change (newest - oldest)
    period: string; // Description of time period
  };
}

/**
 * MCP Tool Handler: health.getScore
 *
 * Retrieve latest health scores with optional trend analysis.
 *
 * Process flow:
 * 1. Validate input (projectId, limit)
 * 2. Verify project exists
 * 3. Query latest N scores from HealthScore table
 * 4. If limit > 1, calculate trend (change and direction)
 * 5. Return scores in chronological order
 *
 * @param input - Query parameters
 * @returns Latest scores with optional trend
 * @throws MCPError on validation or execution errors
 *
 * @example
 * ```typescript
 * const result = await healthGetScoreHandler({
 *   projectId: 4,
 *   limit: 3
 * });
 * // Returns: { projectId: 4, scores: [...], trend: { direction: 'improving', change: 5, ... } }
 * ```
 */
export async function healthGetScoreHandler(
  input: unknown
): Promise<HealthGetScoreOutput> {
  try {
    // Validate input object
    if (!input || typeof input !== 'object') {
      throw new MCPError(
        'Invalid input: expected object',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const params = input as HealthGetScoreInput;

    // Validate projectId
    if (
      typeof params.projectId !== 'number' ||
      !Number.isInteger(params.projectId) ||
      params.projectId <= 0
    ) {
      throw new MCPError(
        'Invalid projectId: must be a positive integer',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate limit
    const limit = params.limit ?? 1;
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      throw new MCPError(
        'Invalid limit: must be an integer between 1 and 10',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true },
    });

    if (!project) {
      throw new MCPError(
        `Project not found: ${params.projectId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Query latest scores
    const scores = await prisma.healthScore.findMany({
      where: { projectId: params.projectId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        overallScore: true,
        securityScore: true,
        qualityScore: true,
        performanceScore: true,
        accessibilityScore: true,
        calculatedAt: true,
      },
    });

    if (scores.length === 0) {
      throw new MCPError(
        `No health scores found for project ${params.projectId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Reverse to chronological order (oldest → newest)
    scores.reverse();

    // Calculate trend if multiple scores
    let trend:
      | {
          direction: 'improving' | 'declining' | 'stable';
          change: number;
          period: string;
        }
      | undefined;

    if (scores.length > 1) {
      const oldest = scores[0]!; // Safe: length > 1 guarantees first element exists
      const newest = scores[scores.length - 1]!; // Safe: length > 1 guarantees last element exists
      const change = newest.overallScore - oldest.overallScore;

      trend = {
        direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
        change: Math.round(change),
        period: `${scores.length} scores`,
      };
    }

    return {
      projectId: params.projectId,
      scores: scores.map((s) => ({
        id: s.id,
        overallScore: s.overallScore,
        securityScore: s.securityScore,
        qualityScore: s.qualityScore,
        performanceScore: s.performanceScore,
        accessibilityScore: s.accessibilityScore,
        calculatedAt: s.calculatedAt.toISOString(),
      })),
      trend,
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;
    console.error('[health.getScore] Error:', error);
    throw new MCPError(
      `Failed to retrieve health scores: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// Tool 3: health.getHistory
// ============================================================================

/**
 * Tool input schema for health.getHistory
 *
 * Analyzes historical health score trends over time.
 */
export interface HealthGetHistoryInput {
  /** Project ID to analyze */
  projectId: number;

  /** Number of days of history to retrieve (1-90, default: 7) */
  days?: number;

  /** Category to analyze (default: 'overall') */
  category?: 'overall' | 'security' | 'quality' | 'performance' | 'accessibility';
}

/**
 * Tool output for health.getHistory
 *
 * Returns time-series data with trend metrics.
 */
export interface HealthGetHistoryOutput {
  /** Project ID */
  projectId: number;

  /** Category analyzed */
  category: string;

  /** Time period analyzed */
  period: {
    days: number;
    from: string; // ISO 8601
    to: string; // ISO 8601
  };

  /** Historical scores in chronological order */
  history: Array<{
    date: string; // ISO 8601
    score: number;
  }>;

  /** Trend metrics */
  trend: {
    average: number; // Mean score
    min: number; // Minimum score
    max: number; // Maximum score
    slope: number; // Linear regression slope
    direction: 'improving' | 'declining' | 'stable';
  };
}

/**
 * MCP Tool Handler: health.getHistory
 *
 * Analyze historical health score trends with time-series data and metrics.
 *
 * Process flow:
 * 1. Validate input (projectId, days, category)
 * 2. Verify project exists
 * 3. Calculate date threshold (now - days)
 * 4. Query scores within time window
 * 5. Extract scores for requested category
 * 6. Calculate trend metrics:
 *    - Average (mean)
 *    - Min/max
 *    - Slope (linear regression)
 *    - Direction (improving/declining/stable based on slope)
 * 7. Return time-series history with metrics
 *
 * @param input - History query parameters
 * @returns Time-series data with trend analytics
 * @throws MCPError on validation or execution errors
 *
 * @example
 * ```typescript
 * const result = await healthGetHistoryHandler({
 *   projectId: 4,
 *   days: 30,
 *   category: 'security'
 * });
 * // Returns: { projectId: 4, category: 'security', period: {...}, history: [...], trend: {...} }
 * ```
 */
export async function healthGetHistoryHandler(
  input: unknown
): Promise<HealthGetHistoryOutput> {
  try {
    // Validate input object
    if (!input || typeof input !== 'object') {
      throw new MCPError(
        'Invalid input: expected object',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const params = input as HealthGetHistoryInput;

    // Validate projectId
    if (
      typeof params.projectId !== 'number' ||
      !Number.isInteger(params.projectId) ||
      params.projectId <= 0
    ) {
      throw new MCPError(
        'Invalid projectId: must be a positive integer',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate days
    const days = params.days ?? 7;
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      throw new MCPError(
        'Invalid days: must be an integer between 1 and 90',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate category
    const category = params.category ?? 'overall';
    const validCategories = ['overall', 'security', 'quality', 'performance', 'accessibility'];
    if (!validCategories.includes(category)) {
      throw new MCPError(
        `Invalid category: must be one of ${validCategories.join(', ')}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true },
    });

    if (!project) {
      throw new MCPError(
        `Project not found: ${params.projectId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Calculate date threshold
    const threshold = new Date(Date.now() - days * 86400000); // 86400000 ms = 1 day

    // Query historical scores
    const historyRecords = await prisma.healthScore.findMany({
      where: {
        projectId: params.projectId,
        calculatedAt: { gte: threshold },
      },
      select: {
        calculatedAt: true,
        overallScore: true,
        securityScore: true,
        qualityScore: true,
        performanceScore: true,
        accessibilityScore: true,
      },
      orderBy: { calculatedAt: 'asc' },
    });

    if (historyRecords.length === 0) {
      throw new MCPError(
        `No health scores found for project ${params.projectId} in the last ${days} days`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Extract scores for requested category
    const scores = historyRecords.map((record) => {
      switch (category) {
        case 'security':
          return record.securityScore;
        case 'quality':
          return record.qualityScore;
        case 'performance':
          return record.performanceScore;
        case 'accessibility':
          return record.accessibilityScore;
        default:
          return record.overallScore;
      }
    });

    // Calculate trend metrics
    const n = scores.length;
    const average = scores.reduce((sum, score) => sum + score, 0) / n;
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    // Linear regression: slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = scores[i]!; // Safe: loop bounded by scores.length
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    const direction =
      Math.abs(slope) < 0.1 ? 'stable' : slope > 0 ? 'improving' : 'declining';

    // Format history
    const history = historyRecords.map((record, index) => ({
      date: record.calculatedAt.toISOString(),
      score: scores[index]!, // Safe: scores array built from historyRecords, same length
    }));

    return {
      projectId: params.projectId,
      category,
      period: {
        days,
        from: threshold.toISOString(),
        to: new Date().toISOString(),
      },
      history,
      trend: {
        average: Math.round(average * 10) / 10,
        min,
        max,
        slope: Math.round(slope * 100) / 100,
        direction,
      },
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;
    console.error('[health.getHistory] Error:', error);
    throw new MCPError(
      `Failed to retrieve health history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
