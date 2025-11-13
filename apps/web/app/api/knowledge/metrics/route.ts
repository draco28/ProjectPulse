import { NextRequest, NextResponse } from 'next/server';
import { getMetricsSummary } from '@/lib/knowledge/metrics';

/**
 * GET /api/knowledge/metrics
 *
 * Get knowledge query performance metrics summary
 *
 * Query params:
 * - days: Number of days to look back (default: 7, max: 90)
 *
 * Response:
 * - 200: Metrics summary with latency percentiles, query counts, mode distribution
 * - 400: Invalid days parameter
 * - 500: Server error
 *
 * US-086: Measure query performance
 *
 * @example
 * ```bash
 * # Get last 7 days metrics
 * GET /api/knowledge/metrics
 *
 * # Get last 30 days metrics
 * GET /api/knowledge/metrics?days=30
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');

    // Validate days parameter
    let days = 7; // default
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 90) {
        return NextResponse.json(
          {
            error: 'Invalid days parameter',
            details: 'days must be between 1 and 90',
          },
          { status: 400 }
        );
      }
      days = parsed;
    }

    // Get metrics summary
    const summary = await getMetricsSummary(days);

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    console.error('[GET /api/knowledge/metrics] Failed to get metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        code: 'METRICS_ERROR',
      },
      { status: 500 }
    );
  }
}
