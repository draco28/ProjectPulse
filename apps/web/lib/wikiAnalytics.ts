import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function fetchTopWikiPages(limit = 6) {
  const analytics = await prisma.wikiPageAnalytics.findMany({
    include: {
      wikiPage: {
        select: {
          title: true,
          path: true,
          category: true,
        },
      },
    },
    orderBy: {
      viewCount: 'desc',
    },
    take: limit,
  });

  return analytics.map((entry) => ({
    id: entry.wikiPageId,
    title: entry.wikiPage.title,
    path: entry.wikiPage.path.replace(/^\//, ''),
    category: entry.wikiPage.category ?? 'Uncategorized',
    views: entry.viewCount,
    popularity: entry.popularity,
    trend: entry.trend,
    updatedAt: entry.refreshedAt.toISOString(),
  }));
}

export async function fetchTrendingWikiTags(limit = 8) {
  const pages = await prisma.wikiPage.findMany({
    select: { tags: true },
    where: { tags: { isEmpty: false } },
  });

  const counts = new Map<string, number>();
  pages.forEach((page) => {
    page.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export async function fetchWikiFeedbackSummary() {
  const aggregate = await prisma.wikiPageAnalytics.aggregate({
    _sum: {
      positiveVotes: true,
      negativeVotes: true,
      viewCount: true,
    },
  });

  const positive = aggregate._sum.positiveVotes ?? 0;
  const negative = aggregate._sum.negativeVotes ?? 0;
  const total = positive + negative;

  return {
    positive,
    negative,
    ratio: total ? Math.round((positive / total) * 100) : 0,
    totalViews: aggregate._sum.viewCount ?? 0,
  };
}

export async function fetchWikiViewTimeline(days = 7): Promise<Array<{ label: string; count: number }>> {
  const rows = await prisma.$queryRaw<
    Array<{ day: Date | null; count: number }>
  >(Prisma.sql`
    SELECT
      DATE("createdAt") AS day,
      COUNT(*) AS count
    FROM "WikiPageEvent"
    WHERE type = 'VIEW'
      AND "createdAt" >= NOW() - INTERVAL '${days} days'
    GROUP BY day
    ORDER BY day ASC
  `);

  const result: Array<{ label: string; count: number }> = [];
  for (const row of rows) {
    const day = row.day;
    if (day) {
      result.push({
        label: day.toISOString().split('T')[0] as string,
        count: row.count,
      });
    }
  }
  return result;
}
