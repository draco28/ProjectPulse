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
import { ProjectLayoutWrapper } from '@/components/layout';
import { withProjectAuth } from '@/lib/project';
import { parseContributors, parseTags } from '@/lib/validations/wiki';
import NextLink from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    project?: string;
    [key: string]: string | undefined;
  }>;
}

// Force dynamic rendering since we need auth on every request
export const dynamic = 'force-dynamic';

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
    Guides: 'BookOpen',
    'API Documentation': 'Code',
    Reference: 'FileText',
    Troubleshooting: 'Wrench',
  };
  return iconMap[category] || 'FileText';
}

async function getWikiPage(slug: string, projectId: number) {
  // Optimized: Single query with include for analytics + parallel prev/next
  // Ticket #132: Changed findUnique to findFirst for per-project path uniqueness
  const page = await prisma.wikiPage.findFirst({
    where: { path: `/${slug}`, projectId }, // Ensure project isolation
    select: {
      id: true,
      projectId: true, // Need projectId for Sidebar
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
      // Include analytics in single query (1-to-1 relation)
      analytics: {
        select: {
          viewCount: true,
          uniqueVisitors: true,
          avgReadTimeMs: true,
          positiveVotes: true,
          negativeVotes: true,
          popularity: true,
          refreshedAt: true,
        },
      },
    },
  });

  if (!page) {
    return null;
  }

  // Extract TOC from markdown (server-side)
  const tocItems = extractHeadings(page.content);

  // Get prev/next pages in same category (ordered by ID since orderIndex doesn't exist)
  const [prevPage, nextPage] = await Promise.all([
    prisma.wikiPage.findFirst({
      where: {
        category: page.category,
        projectId,
        id: { lt: page.id },
      },
      orderBy: { id: 'desc' },
      select: { title: true, path: true },
    }),
    prisma.wikiPage.findFirst({
      where: {
        category: page.category,
        projectId,
        id: { gt: page.id },
      },
      orderBy: { id: 'asc' },
      select: { title: true, path: true },
    }),
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
    analytics: page.analytics
      ? {
          viewCount: page.analytics.viewCount,
          uniqueVisitors: page.analytics.uniqueVisitors,
          avgReadTimeMs: page.analytics.avgReadTimeMs,
          positiveVotes: page.analytics.positiveVotes,
          negativeVotes: page.analytics.negativeVotes,
          popularity: page.analytics.popularity,
          refreshedAt: page.analytics.refreshedAt.toISOString(),
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

async function getCategoryStats(projectId: number): Promise<Category[]> {
  const stats = await prisma.wikiPage.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { category: { not: null }, projectId },
  });

  return stats.map((stat) => ({
    name: stat.category!,
    slug: stat.category!.toLowerCase().replace(/\s+/g, '-'),
    count: stat._count.id,
    icon: getCategoryIcon(stat.category!),
  }));
}

// Generate static params for ISR
// Returns empty array during Docker build when database is unavailable
export async function generateStaticParams() {
  try {
    const pages = await prisma.wikiPage.findMany({
      select: { path: true },
      take: 50, // Limit for build time
    });

    return pages.map((page) => ({
      slug: page.path.replace(/^\//, '').split('/'), // Remove leading slash and split segments
    }));
  } catch {
    // Database not available during build time (Docker)
    return [];
  }
}

export default async function WikiPage({ params, searchParams }: PageProps) {
  const [resolvedParams, queryParams] = await Promise.all([params, searchParams]);

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(queryParams.project);

  // Handle nested slugs (e.g., ['my-project', 'getting-started'])
  const slugArray = resolvedParams.slug;
  const slugPath = Array.isArray(slugArray) ? slugArray.join('/') : slugArray;

  const page = await getWikiPage(slugPath, projectId);

  if (!page) {
    notFound();
  }

  const [categories, revisions] = await Promise.all([
    getCategoryStats(projectId),
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
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <WikiViewTracker slug={normalizedSlug} />
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        {/* Inject projectId from the wiki page record to ensure Sidebar highlights correctly */}
        <Sidebar projectId={projectId} />

        <div className="content-wrapper flex flex-1 gap-4 overflow-hidden p-4">
          {/* Left Sidebar: Quick Navigation */}
          <QuickNavigation
            categories={categories}
            currentCategory={
              page.category ? page.category.toLowerCase().replace(/\s+/g, '-') : undefined
            }
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="text-sm">
                <ol className="flex items-center gap-2 text-slate">
                  <li>
                    <NextLink
                      // Pass project ID in query param when navigating back to list
                      href={`/wiki?project=${projectId}`}
                      className="smooth-transition hover:text-white"
                    >
                      Wiki
                    </NextLink>
                  </li>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  <li aria-current="page" className="font-semibold text-white">
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
                projectId={projectId}
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
              <WikiFooterNav
                prevPage={page.prevPage}
                nextPage={page.nextPage}
                projectId={projectId}
              />
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
    </ProjectLayoutWrapper>
  );
}
