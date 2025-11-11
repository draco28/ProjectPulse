import { NextResponse } from 'next/server';
import {
  fetchTopWikiPages,
  fetchTrendingWikiTags,
  fetchWikiFeedbackSummary,
  fetchWikiViewTimeline,
} from '@/lib/wikiAnalytics';

export async function GET() {
  try {
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
    console.error('Failed to load wiki analytics summary', error);
    return NextResponse.json({ error: 'Failed to load analytics summary' }, { status: 500 });
  }
}
