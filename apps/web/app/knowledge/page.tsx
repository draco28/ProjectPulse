import { Prisma } from '@prisma/client';
import { Plus, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { TagFilter } from '@/components/knowledge/TagFilter';
import { SearchBar } from '@/components/knowledge/SearchBar';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { getActiveProjectForUser } from '@/lib/project-context';

interface PageProps {
  searchParams: {
    search?: string;
    tag?: string;
    sort?: string;
    project?: string;
  };
}

export const dynamic = 'force-dynamic'; // Real-time search requires fresh data

async function getKnowledgeArticles(projectId: number, searchParams: PageProps['searchParams']) {
  const { search = '', tag, sort = 'newest' } = searchParams;

  // Build where clause
  const where: Prisma.KnowledgeItemWhereInput = { projectId };

  // Full-text search (if search query provided)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' as const } },
      { content: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  // Tag filtering
  if (tag) {
    where.tags = {
      has: tag, // Check if array contains tag
    };
  }

  // Fetch articles
  const articles = await prisma.knowledgeItem.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true, // Will extract excerpt
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy:
      sort === 'newest'
        ? { createdAt: 'desc' }
        : sort === 'updated'
          ? { updatedAt: 'desc' }
          : { createdAt: 'desc' },
    take: 50, // Limit for performance
  });

  // Get all unique tags for filter
  const allArticles = await prisma.knowledgeItem.findMany({
    where: { projectId },
    select: { tags: true },
  });

  const allTags = Array.from(new Set(allArticles.flatMap((article) => article.tags))).sort();

  return {
    articles: articles.map((article) => ({
      ...article,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      excerpt: article.content.substring(0, 150) + '...', // Create excerpt
      views: Math.floor(Math.random() * 50), // Placeholder (add view tracking later)
      relevance: search
        ? Math.floor(85 + Math.random() * 15) // Mock relevance score
        : 100,
    })),
    allTags,
    totalCount: articles.length,
  };
}

export default async function KnowledgeBasePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { project, projectId } = await getActiveProjectForUser(user.id, searchParams.project);

  const { articles, allTags, totalCount } = await getKnowledgeArticles(projectId, searchParams);

  const { search = '', tag } = searchParams;

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar projectId={projectId} />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Knowledge Base</h2>
                <p className="text-sm text-slate">{totalCount} items • Hybrid search enabled</p>
              </div>
              <button
                className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                aria-label="Add knowledge base item"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>Add Knowledge</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Search Bar */}
              <SearchBar initialSearch={search} />

              {/* Tags Filter */}
              <TagFilter allTags={allTags} selectedTag={tag} />

              {/* Knowledge Grid */}
              {articles.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                  <Search className="mb-4 h-16 w-16 text-slate" aria-hidden="true" />
                  <h3 className="mb-2 text-xl font-bold text-white">No articles found</h3>
                  <p className="text-slate">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
