/**
 * Wiki Analytics API Route
 *
 * GET /api/wiki/analytics/top - Get top wiki pages analytics
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTopWikiPages,
  fetchTrendingWikiTags,
  fetchWikiFeedbackSummary,
  fetchWikiViewTimeline,
} from '@/lib/wikiAnalytics';
import { requireAuth, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Authenticate request (analytics are global, not project-specific)
    await requireAuth(request);

    const [topPages, trendingTags, feedback, timeline] = await Promise.all([
      fetchTopWikiPages(),
      fetchTrendingWikiTags(),
      fetchWikiFeedbackSummary(),
      fetchWikiViewTimeline(),
    ]);

    return NextResponse.json({
      topPages,
      trendingTags,
      feedback,
      timeline,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load wiki analytics summary'
    );
    return NextResponse.json({ error: 'Failed to load analytics summary' }, { status: 500 });
  }
}
