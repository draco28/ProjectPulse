/**
 * MCP Log Cleanup Job
 * Sprint 11.5: Maintain log table size and generate daily aggregates
 *
 * Features:
 * - Deletes MCPToolLog entries older than 30 days
 * - Generates MCPToolAggregate for yesterday if not exists
 *
 * Run via: POST /api/admin/mcp/cleanup or scheduled cron
 */

import { prisma } from '@/lib/prisma';

export interface CleanupResult {
  deletedLogs: number;
  aggregatesCreated: number;
  errors: string[];
}

export async function runMCPLogCleanup(): Promise<CleanupResult> {
  const errors: string[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate yesterday's date range (UTC)
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() + 1);

  // 1. Generate aggregates for yesterday
  let aggregatesCreated = 0;

  try {
    // Group by projectId + toolName for yesterday's logs
    const aggregateData = await prisma.mCPToolLog.groupBy({
      by: ['projectId', 'toolName'],
      where: {
        createdAt: {
          gte: yesterday,
          lt: yesterdayEnd,
        },
      },
      _count: { id: true },
      _avg: { duration: true },
      _min: { duration: true },
      _max: { duration: true },
    });

    // Get error counts separately
    const errorCounts = await prisma.mCPToolLog.groupBy({
      by: ['projectId', 'toolName'],
      where: {
        createdAt: { gte: yesterday, lt: yesterdayEnd },
        success: false,
      },
      _count: { id: true },
    });

    // Build error map for easy lookup
    const errorMap = new Map(
      errorCounts.map((e) => [`${e.projectId}-${e.toolName}`, e._count.id])
    );

    // Create aggregates using upsert (idempotent)
    for (const agg of aggregateData) {
      const key = `${agg.projectId}-${agg.toolName}`;
      const errorCount = errorMap.get(key) || 0;

      try {
        await prisma.mCPToolAggregate.upsert({
          where: {
            date_projectId_toolName: {
              date: yesterday,
              projectId: agg.projectId,
              toolName: agg.toolName,
            },
          },
          create: {
            date: yesterday,
            projectId: agg.projectId,
            toolName: agg.toolName,
            callCount: agg._count.id,
            errorCount,
            avgDuration: Math.round(agg._avg.duration || 0),
            minDuration: agg._min.duration || 0,
            maxDuration: agg._max.duration || 0,
          },
          update: {}, // Don't overwrite if exists (idempotent)
        });
        aggregatesCreated++;
      } catch (err) {
        errors.push(
          `Failed to create aggregate for ${agg.projectId}/${agg.toolName}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (err) {
    errors.push(
      `Failed to generate aggregates: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // 2. Delete old logs (older than 30 days)
  let deletedLogs = 0;

  try {
    // Use deleteMany with batching to avoid timeout on large tables
    // Delete in chunks of 10000 to avoid long locks
    let deleted = 0;
    const batchSize = 10000;
    const maxIterations = 100; // Safety limit

    for (let i = 0; i < maxIterations; i++) {
      const result = await prisma.$executeRaw`
        DELETE FROM mcp_tool_logs
        WHERE id IN (
          SELECT id FROM mcp_tool_logs
          WHERE "createdAt" < ${thirtyDaysAgo}
          LIMIT ${batchSize}
        )
      `;

      deleted += result;

      // If we deleted less than batch size, we're done
      if (result < batchSize) {
        break;
      }
    }

    deletedLogs = deleted;
  } catch (err) {
    errors.push(
      `Failed to delete old logs: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return {
    deletedLogs,
    aggregatesCreated,
    errors,
  };
}
