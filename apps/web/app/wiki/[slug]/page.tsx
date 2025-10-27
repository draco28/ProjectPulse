import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/ui/FloatingBackground';
import { WikiSidebar } from '@/components/wiki/WikiSidebar';
import { WikiContent } from '@/components/wiki/WikiContent';

interface PageProps {
  params: {
    slug: string;
  };
}

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

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
    if (match) {
      const level = match[1].length; // Number of # characters
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      headings.push({ id, text, level });
    }
  }

  return headings;
}

async function getWikiPage(slug: string) {
  // Find page by path (slug is the path)
  const page = await prisma.wikiPage.findUnique({
    where: { path: `/${slug}` }, // Assuming slug maps to path
    select: {
      id: true,
      title: true,
      content: true,
      path: true,
      createdAt: true,
      updatedAt: true,
      // Related pages via outgoing links
      outgoingLinks: {
        select: {
          targetPage: {
            select: {
              id: true,
              title: true,
              path: true,
            },
          },
        },
        take: 5, // Limit to 5 related pages
      },
    },
  });

  if (!page) {
    return null;
  }

  // Extract TOC from markdown (server-side)
  const tocItems = extractHeadings(page.content);

  // Flatten related pages
  const relatedPages = page.outgoingLinks.map((link) => link.targetPage);

  return {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    tocItems,
    relatedPages,
  };
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

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 gap-4 overflow-hidden p-4">
          {/* Wiki Sidebar (TOC + Related Articles) */}
          <WikiSidebar
            tocItems={page.tocItems}
            relatedPages={page.relatedPages}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Header */}
              <header className="neu-raised smooth-transition rounded-3xl px-8 py-6">
                <h1 className="mb-2 text-4xl font-bold text-white">
                  {page.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate">
                  <span>
                    <i className="fas fa-clock mr-2"></i>
                    Last updated:{' '}
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                  <span>
                    <i className="fas fa-link mr-2"></i>
                    {page.path}
                  </span>
                </div>
              </header>

              {/* Wiki Content with Markdown Rendering */}
              <WikiContent
                content={page.content}
                tocItems={page.tocItems}
              />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
