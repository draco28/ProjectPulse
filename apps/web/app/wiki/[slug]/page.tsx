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
import NextLink from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string;
}

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

  // Safely convert JSON fields
  const contributors = Array.isArray(page.contributors)
    ? (page.contributors as unknown[]).filter(item =>
        item && typeof item === 'object' && 'name' in item && 'editCount' in item
      ) as Contributor[]
    : [];
  const tags = Array.isArray(page.tags)
    ? (page.tags as unknown[]).filter(item => typeof item === 'string') as string[]
    : [];

  return {
    ...page,
    contributors,
    tags,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    tocItems,
    prevPage: prevPage || undefined,
    nextPage: nextPage || undefined,
  };
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
  const [page, categories] = await Promise.all([
    getWikiPage(params.slug),
    getCategoryStats()
  ]);

  if (!page) {
    notFound();
  }

  return (
    <>
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
                views={page.views}
                path={page.path}
                readingTime={page.readingTime || undefined}
              />

              {/* Wiki Content with Markdown Rendering */}
              <WikiContent content={page.content} tocItems={page.tocItems} />

              {/* Footer Navigation */}
              <WikiFooterNav prevPage={page.prevPage} nextPage={page.nextPage} />
            </div>
          </main>

          {/* Right Sidebar: Contributors + Stats + Feedback */}
          <WikiContributors
            contributors={page.contributors}
            views={page.views}
            revisions={page.revisions}
            pageId={page.id}
          />
        </div>
      </div>
    </>
  );
}