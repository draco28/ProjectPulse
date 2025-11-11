import { Metadata } from 'next';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { TopPagesCard } from '@/components/wiki/analytics/TopPagesCard';
import { TrendingTagsCard } from '@/components/wiki/analytics/TrendingTagsCard';
import { FeedbackFunnelCard } from '@/components/wiki/analytics/FeedbackFunnelCard';
import { ViewTimelineCard } from '@/components/wiki/analytics/ViewTimelineCard';
import {
  fetchTopWikiPages,
  fetchTrendingWikiTags,
  fetchWikiFeedbackSummary,
  fetchWikiViewTimeline,
} from '@/lib/wikiAnalytics';

export const metadata: Metadata = {
  title: 'Wiki Analytics | ProjectPulse',
  description: 'Insights for wiki engagement, trending content, and feedback health.',
};

export default async function WikiAnalyticsPage() {
  const [topPages, trendingTags, feedback, timeline] = await Promise.all([
    fetchTopWikiPages(),
    fetchTrendingWikiTags(),
    fetchWikiFeedbackSummary(),
    fetchWikiViewTimeline(),
  ]);

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col gap-6 overflow-auto p-6">
          <header className="neu-raised rounded-3xl px-6 py-5">
            <h1 className="text-3xl font-bold text-white">Wiki Analytics</h1>
            <p className="text-sm text-slate">
              View performance, trending topics, and feedback quality across the knowledge base.
            </p>
          </header>

          <section className="grid gap-6 lg:grid-cols-3">
            <TopPagesCard pages={topPages} />
            <TrendingTagsCard tags={trendingTags} />
            <FeedbackFunnelCard feedback={feedback} />
          </section>

          <section className="grid gap-6">
            <ViewTimelineCard data={timeline} />
          </section>
        </main>
      </div>
    </>
  );
}
