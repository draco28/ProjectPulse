/**
 * Wiki List Page
 *
 * Displays all wiki pages with category filtering, search, and sorting
 * Pattern: Similar to issues page but with ISR (documentation changes infrequently)
 */

import { Metadata } from 'next';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import 'next/navigation';
import { Prisma } from '@prisma/client';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { WikiListClient } from '@/components/wiki/WikiListClient';
import { WikiSearchBar } from '@/components/wiki/WikiSearchBar';
import { WikiCard } from '@/components/wiki/WikiCard';
import { Pagination } from '@/components/tickets/Pagination';
import { prisma } from '@/lib/prisma';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';

// Sprint 14: Use force-dynamic instead of ISR to support pagination
// ISR caches page 1 for 1 hour, breaking pagination (Ticket #21)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Wiki | ProjectPulse',
  description: 'Browse documentation, guides, and references',
};

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
  project?: string;
  [key: string]: string | undefined;
}

type WhereClause = {
  projectId: number;
  category?: { in: string[] };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
  }>;
};

type WikiListResult = {
  id: number;
  title: string;
  excerpt: string;
  category: string | null;
  path: string;
  updatedAt: Date;
  highlight?: string | null;
  stats?: {
    views: number;
    helpfulRatio: number | null;
    popularity: number | null;
  };
};

async function getWikiPages(projectId: number, searchParams: SearchParams) {
  // Parse filters from URL
  const categoryFilter = searchParams.category?.split(',').filter(Boolean) || [];
  const searchTerm = searchParams.search || '';
  const sortBy = searchParams.sort || 'newest';
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 10;

  // Build where clause with projectId
  const where: WhereClause = { projectId };

  // Category filter (OR logic for multiple categories)
  if (categoryFilter.length > 0) {
    where.category = { in: categoryFilter };
  }

  // Search filter (searches title AND content)
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { content: { contains: searchTerm, mode: 'insensitive' as const } },
    ];
  }

  // Build orderBy clause
  let orderBy: { createdAt: 'desc' | 'asc' } | { updatedAt: 'desc' | 'asc' } | { title: 'asc' };

  switch (sortBy) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'title':
      orderBy = { title: 'asc' };
      break;
    case 'updated':
      orderBy = { updatedAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const offset = (page - 1) * perPage;

  if (searchTerm) {
    const tsQuery = Prisma.sql`plainto_tsquery('english', ${searchTerm})`;
    const categoryCondition =
      categoryFilter.length > 0
        ? Prisma.sql`AND "category" = ANY(${categoryFilter})`
        : Prisma.sql``;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          path: string;
          category: string | null;
          excerpt: string | null;
          createdAt: Date;
          updatedAt: Date;
          highlight: string | null;
          rank: number;
        }>
      >(
        Prisma.sql`
          SELECT
            "id",
            "title",
            "path",
            "category",
            "excerpt",
            "createdAt",
            "updatedAt",
            ts_headline(
              'english',
              "content",
              ${tsQuery},
              'MaxFragments=2, MinWords=5, MaxWords=20, StartSel=**, StopSel=**'
            ) AS highlight,
            ts_rank_cd("content_tsv", ${tsQuery}) AS rank
          FROM "WikiPage"
          WHERE "projectId" = ${projectId}
            AND "content_tsv" @@ ${tsQuery}
          ${categoryCondition}
          ORDER BY rank DESC, "updatedAt" DESC
          LIMIT ${perPage} OFFSET ${offset};
        `
      ),
      prisma.$queryRaw<Array<{ count: number }>>(
        Prisma.sql`
          SELECT COUNT(*)::int AS count
          FROM "WikiPage"
          WHERE "projectId" = ${projectId}
            AND "content_tsv" @@ ${tsQuery}
          ${categoryCondition};
        `
      ),
    ]);

    const totalCount = countRows[0]?.count ?? 0;

    const analytics = rows.length
      ? await prisma.wikiPageAnalytics.findMany({
          where: { wikiPageId: { in: rows.map((row) => row.id) } },
          select: {
            wikiPageId: true,
            viewCount: true,
            positiveVotes: true,
            negativeVotes: true,
            popularity: true,
          },
        })
      : [];
    const analyticsMap = new Map(analytics.map((entry) => [entry.wikiPageId, entry]));

    const pages: WikiListResult[] = rows.map((row) => {
      const stats = analyticsMap.get(row.id);
      const totalVotes = (stats?.positiveVotes ?? 0) + (stats?.negativeVotes ?? 0);
      const helpfulRatio = totalVotes
        ? Math.round(((stats?.positiveVotes ?? 0) / totalVotes) * 100)
        : null;

      return {
        id: row.id,
        title: row.title,
        excerpt: row.highlight ?? row.excerpt ?? '',
        category: row.category,
        path: row.path,
        updatedAt: row.updatedAt,
        highlight: row.highlight,
        stats: stats
          ? {
              views: stats.viewCount,
              helpfulRatio,
              popularity: stats.popularity,
            }
          : undefined,
      };
    });

    return {
      pages,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / perPage),
      perPage,
    };
  }

  // Fetch pages + total count in parallel when no search term
  const [pages, totalCount] = await Promise.all([
    prisma.wikiPage.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        path: true,
        updatedAt: true,
      },
      orderBy,
      take: perPage,
      skip: offset,
    }),
    prisma.wikiPage.count({ where }),
  ]);

  const analytics = await prisma.wikiPageAnalytics.findMany({
    where: { wikiPageId: { in: pages.map((page) => page.id) } },
    select: {
      wikiPageId: true,
      viewCount: true,
      positiveVotes: true,
      negativeVotes: true,
      popularity: true,
    },
  });
  const analyticsMap = new Map(analytics.map((entry) => [entry.wikiPageId, entry]));

  const mapped: WikiListResult[] = pages.map((page) => {
    const stats = analyticsMap.get(page.id);
    const totalVotes = (stats?.positiveVotes ?? 0) + (stats?.negativeVotes ?? 0);
    const helpfulRatio = totalVotes
      ? Math.round(((stats?.positiveVotes ?? 0) / totalVotes) * 100)
      : null;
    return {
      id: page.id,
      title: page.title,
      excerpt: `${page.content.slice(0, 200)}...`,
      category: page.category,
      path: page.path,
      updatedAt: page.updatedAt,
      stats: stats
        ? {
            views: stats.viewCount,
            helpfulRatio,
            popularity: stats.popularity,
          }
        : undefined,
    };
  });

  return {
    pages: mapped,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / perPage),
    perPage,
  };
}

async function getCategoryStats(projectId: number) {
  const categoryCounts = await prisma.wikiPage.groupBy({
    by: ['category'],
    _count: true,
    where: {
      projectId,
      category: { not: null },
    },
  });

  return Object.fromEntries(
    categoryCounts.filter((c) => c.category).map((c) => [c.category!, c._count])
  );
}

export default async function WikiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  
  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(params.project);

  const [{ pages, totalCount, currentPage, totalPages, perPage }, categoryStats] =
    await Promise.all([getWikiPages(projectId, params), getCategoryStats(projectId)]);

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <FloatingBackground />

      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="mb-4">
              <Link
                href={`/dashboard?project=${projectId}`}
                className="inline-flex items-center gap-2 text-sm text-coral transition-colors hover:text-coral-light"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Wiki</h2>
                <p className="text-sm text-slate">
                  {project.name} - Documentation, guides, and references
                </p>
              </div>
              <button
                className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                aria-label="Create new wiki page"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>New Page</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Filters Sidebar (Desktop) + FAB + Mobile Drawer */}
            <WikiListClient categoryStats={categoryStats} searchParams={params} />

            {/* Wiki List */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto">
              {/* Search & Sort */}
              <WikiSearchBar searchParams={params} />

              {/* Wiki Pages */}
              <div className="space-y-3">
                {pages.length === 0 ? (
                  <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                    <p className="text-lg font-semibold text-white">No wiki pages found</p>
                    <p className="text-sm text-slate">
                      {params.search || params.category
                        ? 'Try adjusting your filters or search term'
                        : 'Create your first wiki page to get started'}
                    </p>
                  </div>
                ) : (
                  pages.map((page) => (
                    <WikiCard
                      key={page.id}
                      page={{
                        id: page.id.toString(),
                        title: page.title,
                        excerpt: page.excerpt,
                        highlight: page.highlight || undefined,
                        category: page.category || 'Uncategorized',
                        path: page.path,
                        updatedAt: page.updatedAt,
                      }}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  showing={pages.length}
                  perPage={perPage}
                  itemLabel="pages"
                  projectId={projectId}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </ProjectLayoutWrapper>
  );
}
