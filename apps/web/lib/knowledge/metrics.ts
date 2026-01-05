/**
 * Knowledge Query Performance Metrics
 *
 * Tracks query latency, result counts, and token usage for knowledge base searches.
 * Used for performance monitoring and optimization.
 *
 * US-086: Measure query performance
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Knowledge:Metrics' });

export type QueryMode = 'semantic' | 'fulltext' | 'hybrid';

export interface QueryMetricData {
  query: string;
  queryMode: QueryMode;
  latencyMs: number;
  resultCount: number;
  tokenUsage?: number;
  category?: string;
  userAgent?: string;
}

/**
 * Record a knowledge query metric (async, fire-and-forget)
 *
 * This function runs asynchronously and does not block the API response.
 * Errors are logged but do not affect the search operation.
 *
 * @param data - Query metric data to record
 */
export async function recordQueryMetric(data: QueryMetricData): Promise<void> {
  try {
    await prisma.knowledgeQueryMetric.create({
      data: {
        query: data.query,
        queryMode: data.queryMode,
        latencyMs: data.latencyMs,
        resultCount: data.resultCount,
        tokenUsage: data.tokenUsage,
        category: data.category,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw (metrics shouldn't break search)
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to record query metric');
  }
}

/**
 * Estimate token usage for knowledge search results
 *
 * Uses rough estimation: total_chars / 4
 * Includes titles, excerpts, and metadata
 *
 * @param results - Search results array
 * @returns Estimated token count
 */
export function estimateTokenUsage(results: any[]): number {
  const totalChars = results.reduce((sum, result) => {
    return (
      sum +
      (result.title?.length || 0) +
      (result.excerpt?.length || result.content?.length || 0) +
      (result.category?.length || 0) +
      (result.tags?.join(',')?.length || 0)
    );
  }, 0);

  // Rough token estimation (OpenAI uses ~4 chars per token)
  return Math.ceil(totalChars / 4);
}

/**
 * Calculate percentile latency from metrics
 *
 * @param queryMode - Filter by query mode (optional)
 * @param percentile - Percentile to calculate (50, 95, 99)
 * @param days - Number of days to look back (default: 7)
 * @returns Latency in milliseconds at the specified percentile
 */
export async function getLatencyPercentile(
  queryMode?: QueryMode,
  percentile: number = 95,
  days: number = 7
): Promise<number | null> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: { gte: since },
    };

    if (queryMode) {
      where.queryMode = queryMode;
    }

    const metrics = await prisma.knowledgeQueryMetric.findMany({
      where,
      select: { latencyMs: true },
      orderBy: { latencyMs: 'asc' },
    });

    if (metrics.length === 0) {
      return null;
    }

    const index = Math.ceil((percentile / 100) * metrics.length) - 1;
    return metrics[index]?.latencyMs ?? null;
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to calculate percentile');
    return null;
  }
}

/**
 * Get query metrics summary for dashboard
 *
 * @param days - Number of days to look back (default: 7)
 * @returns Metrics summary object
 */
export async function getMetricsSummary(days: number = 7) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalQueries, avgLatency, p95Semantic, p95Fulltext, p95Hybrid, modeDistribution] =
      await Promise.all([
        // Total query count
        prisma.knowledgeQueryMetric.count({
          where: { createdAt: { gte: since } },
        }),

        // Average latency
        prisma.knowledgeQueryMetric.aggregate({
          where: { createdAt: { gte: since } },
          _avg: { latencyMs: true },
        }),

        // P95 latencies by mode
        getLatencyPercentile('semantic', 95, days),
        getLatencyPercentile('fulltext', 95, days),
        getLatencyPercentile('hybrid', 95, days),

        // Query mode distribution
        prisma.knowledgeQueryMetric.groupBy({
          by: ['queryMode'],
          where: { createdAt: { gte: since } },
          _count: true,
        }),
      ]);

    return {
      period: { days, since },
      totalQueries,
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
      latencyP95: {
        semantic: p95Semantic,
        fulltext: p95Fulltext,
        hybrid: p95Hybrid,
      },
      modeDistribution: modeDistribution.reduce(
        (acc, item) => {
          acc[item.queryMode] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to get metrics summary');
    throw error;
  }
}
