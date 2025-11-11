import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function aggregateWikiAnalytics() {
  console.log('📊 Aggregating wiki analytics (rolling 7-day window)...');

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      WITH stats AS (
        SELECT
          "wikiPageId",
          COUNT(*) FILTER (WHERE type = 'VIEW') AS view_count,
          COUNT(DISTINCT COALESCE(actor, CONCAT('anon-', "wikiPageId"::text))) FILTER (WHERE type = 'VIEW') AS unique_visitors,
          AVG(NULLIF("durationMs", 0)) FILTER (WHERE type = 'VIEW') AS avg_read_time,
          COUNT(*) FILTER (WHERE type = 'FEEDBACK_POSITIVE') AS positive_votes,
          COUNT(*) FILTER (WHERE type = 'FEEDBACK_NEGATIVE') AS negative_votes,
          COUNT(*) FILTER (WHERE type = 'VIEW') * 0.7 + COUNT(*) FILTER (WHERE type = 'FEEDBACK_POSITIVE') * 0.3 AS popularity,
          NULLIF(
          COUNT(*) FILTER (WHERE type = 'VIEW' AND "createdAt" >= NOW() - INTERVAL '24 hours')::float /
            NULLIF(COUNT(*) FILTER (WHERE type = 'VIEW' AND "createdAt" < NOW() - INTERVAL '24 hours' AND "createdAt" >= NOW() - INTERVAL '48 hours'), 0),
            0
          ) AS trend
        FROM "WikiPageEvent"
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY "wikiPageId"
      )
      INSERT INTO "WikiPageAnalytics" (
        "wikiPageId",
        "viewCount",
        "uniqueVisitors",
        "avgReadTimeMs",
        "positiveVotes",
        "negativeVotes",
        "popularity",
        "trend",
        "refreshedAt"
      )
      SELECT
        stats."wikiPageId",
        stats.view_count,
        stats.unique_visitors,
        COALESCE(stats.avg_read_time, 0),
        stats.positive_votes,
        stats.negative_votes,
        stats.popularity,
        COALESCE(stats.trend, 1),
        NOW()
      FROM stats
      ON CONFLICT ("wikiPageId") DO UPDATE
        SET
          "viewCount" = EXCLUDED."viewCount",
          "uniqueVisitors" = EXCLUDED."uniqueVisitors",
          "avgReadTimeMs" = EXCLUDED."avgReadTimeMs",
          "positiveVotes" = EXCLUDED."positiveVotes",
          "negativeVotes" = EXCLUDED."negativeVotes",
          "popularity" = EXCLUDED."popularity",
          "trend" = EXCLUDED."trend",
          "refreshedAt" = EXCLUDED."refreshedAt";
    `);

    // Clean up events older than 30 days to keep the table lean
    const deleted = await tx.wikiPageEvent.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log(`🧹 Pruned ${deleted.count} events older than 30 days`);
  });

  const analyticsCount = await prisma.wikiPageAnalytics.count();
  console.log(`✅ Aggregated analytics for ${analyticsCount} wiki page(s)`);
}

aggregateWikiAnalytics()
  .catch((error) => {
    console.error('Failed to aggregate wiki analytics', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
