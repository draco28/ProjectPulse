import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { WikiHeader } from '@/components/wiki/WikiHeader';
import { QuickNavigation } from '@/components/wiki/QuickNavigation';
import { WikiContent } from '@/components/wiki/WikiContent';
import { WikiContributors } from '@/components/wiki/WikiContributors';
import { WikiFooterNav } from '@/components/wiki/WikiFooterNav';
import { WikiRevisionTimeline } from '@/components/wiki/WikiRevisionTimeline';
import { WikiViewTracker } from '@/components/wiki/WikiViewTracker';
import { parseContributors, parseTags, type Contributor } from '@/lib/validations/wiki';
import NextLink from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

interface Category {
  name: string;
  icon: string;
  count: number;
  slug: string;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Server-side TOC extraction from markdown
function extractHeadings(markdown: string): TOCItem[] {
  const headings: TOCItem[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match || !match[1] || !match[2]) continue; // Skip lines that aren't headings

    const level = match[1].length; // Number of # characters
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({ id, text, level });
  }

  return headings;
}

// Helper function to get category icon
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Getting Started': 'Rocket',
    'Guides': 'BookOpen',
    'API Documentation': 'Code',
    'Reference': 'FileText',
    'Troubleshooting': 'Wrench'
  };
  return iconMap[category] || 'FileText';
}

async function getWikiPage(slug: string) {
  // Find page by path (slug is the path)
  const page = await prisma.wikiPage.findUnique({
    where: { path: `/${slug}` },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      category: true,
      path: true,
      views: true,
      revisions: true,
      contributors: true,
      readingTime: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      lastEditedBy: true,
      lastEditedAt: true,
      version: true,
    },
  });

  if (!page) {
    return null;
  }

  const analytics = await prisma.wikiPageAnalytics.findUnique({
    where: { wikiPageId: page.id },
    select: {
      viewCount: true,
      uniqueVisitors: true,
      avgReadTimeMs: true,
      positiveVotes: true,
      negativeVotes: true,
      popularity: true,
      refreshedAt: true,
    },
  });

  // Extract TOC from markdown (server-side)
  const tocItems = extractHeadings(page.content);

  // Get prev/next pages in same category (ordered by ID since orderIndex doesn't exist)
  const [prevPage, nextPage] = await Promise.all([
    prisma.wikiPage.findFirst({
      where: {
        category: page.category,
        id: { lt: page.id }
      },
      orderBy: { id: 'desc' },
      select: { title: true, path: true }
    }),
    prisma.wikiPage.findFirst({
      where: {
        category: page.category,
        id: { gt: page.id }
      },
      orderBy: { id: 'asc' },
      select: { title: true, path: true }
    })
  ]);

  // Safely parse and validate JSON fields using Zod
  const contributors = parseContributors(page.contributors);
  const tags = parseTags(page.tags);

  return {
    ...page,
    contributors,
    tags,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    lastEditedAt: page.lastEditedAt?.toISOString() ?? null,
    analytics: analytics
      ? {
          viewCount: analytics.viewCount,
          uniqueVisitors: analytics.uniqueVisitors,
          avgReadTimeMs: analytics.avgReadTimeMs,
          positiveVotes: analytics.positiveVotes,
          negativeVotes: analytics.negativeVotes,
          popularity: analytics.popularity,
          refreshedAt: analytics.refreshedAt.toISOString(),
        }
      : null,
    tocItems,
    prevPage: prevPage || undefined,
    nextPage: nextPage || undefined,
  };
}

async function getRecentRevisions(pageId: number, limit = 10) {
  const revisions = await prisma.wikiRevision.findMany({
    where: { wikiPageId: pageId },
    orderBy: { version: 'desc' },
    take: limit,
    select: {
      version: true,
      createdAt: true,
      createdBy: true,
      createdByType: true,
      diffSummary: true,
    },
  });

  return revisions.map((revision) => ({
    version: revision.version,
    createdAt: revision.createdAt.toISOString(),
    createdBy: revision.createdBy,
    createdByType: revision.createdByType,
    diffSummary: revision.diffSummary ?? null,
  }));
}

async function getCategoryStats(): Promise<Category[]> {
  const stats = await prisma.wikiPage.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { category: { not: null } }
  });

  return stats.map(stat => ({
    name: stat.category!,
    slug: stat.category!.toLowerCase().replace(/\s+/g, '-'),
    count: stat._count.id,
    icon: getCategoryIcon(stat.category!)
  }));
}

// Generate static params for ISR
export async function generateStaticParams() {
  const pages = await prisma.wikiPage.findMany({
    select: { path: true },
    take: 50, // Limit for build time
  });

  return pages.map((page) => ({
    slug: page.path.replace(/^\//, ''), // Remove leading slash
  }));
}

export default async function WikiPage({ params }: PageProps) {
  const page = await getWikiPage(params.slug);

  if (!page) {
    notFound();
  }

  const [categories, revisions] = await Promise.all([
    getCategoryStats(),
    getRecentRevisions(page.id),
  ]);
  const normalizedSlug = page.path.replace(/^\//, '');
  const helpfulTotal = (page.analytics?.positiveVotes ?? 0) + (page.analytics?.negativeVotes ?? 0);
  const helpfulRatio = helpfulTotal
    ? Math.round(((page.analytics?.positiveVotes ?? 0) / helpfulTotal) * 100)
    : null;
  const pageStats = {
    views: page.analytics?.viewCount ?? page.views,
    revisions: page.revisions,
    uniqueVisitors: page.analytics?.uniqueVisitors ?? null,
    helpfulRatio,
    avgReadTimeMs: page.analytics?.avgReadTimeMs ?? null,
  };

  return (
    <>
      <WikiViewTracker slug={normalizedSlug} />
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 gap-4 overflow-hidden p-4">
          {/* Left Sidebar: Quick Navigation */}
          <QuickNavigation
            categories={categories}
            currentCategory={page.category ? page.category.toLowerCase().replace(/\s+/g, '-') : undefined}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="text-sm">
                <ol className="flex items-center gap-2 text-slate">
                  <li>
                    <NextLink
                      href="/wiki"
                      className="hover:text-white smooth-transition"
                    >
                      Wiki
                    </NextLink>
                  </li>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  <li aria-current="page" className="text-white font-semibold">
                    {page.title}
                  </li>
                </ol>
              </nav>

              {/* Enhanced Wiki Header */}
              <WikiHeader
                title={page.title}
                description={page.excerpt || undefined}
                category={page.category || 'Uncategorized'}
                tags={page.tags}
                contributors={page.contributors}
                updatedAt={page.updatedAt}
                lastEditedBy={page.lastEditedBy}
                lastEditedAt={page.lastEditedAt}
                version={page.version}
                revisionsCount={page.revisions}
                views={page.views}
                path={page.path}
                readingTime={page.readingTime || undefined}
                helpfulRatio={helpfulRatio}
                uniqueVisitors={page.analytics?.uniqueVisitors}
                popularity={page.analytics?.popularity}
              />

              {/* Wiki Content with Markdown Rendering */}
              <WikiContent content={page.content} tocItems={page.tocItems} />

              {/* Revision Timeline */}
              <WikiRevisionTimeline
                slug={normalizedSlug}
                revisions={revisions}
                currentVersion={page.version}
              />

              {/* Footer Navigation */}
              <WikiFooterNav prevPage={page.prevPage} nextPage={page.nextPage} />
            </div>
          </main>

          {/* Right Sidebar: Contributors + Stats + Feedback */}
          <WikiContributors
            contributors={page.contributors}
            stats={pageStats}
            pageId={page.id}
            slug={normalizedSlug}
          />
        </div>
      </div>
    </>
  );
}
