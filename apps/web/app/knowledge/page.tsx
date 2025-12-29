import { Suspense } from 'react';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { TagFilter } from '@/components/knowledge/TagFilter';
import { SearchBar } from '@/components/knowledge/SearchBar';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';

interface PageProps {
  searchParams: {
    search?: string;
    tag?: string;
    sort?: string;
    project?: string;
  };
}

interface MemoryBankView {
  type: string;
  summaryTokens: number | null;
  updatedAt: string;
  preview: string;
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

async function getProjectMemoryBanks(projectId: number): Promise<MemoryBankView[]> {
  const banks = await prisma.memoryBank.findMany({
    where: { projectId },
    orderBy: { type: 'asc' },
    select: {
      type: true,
      summaryTokens: true,
      updatedAt: true,
      content: true,
    },
  });

  return banks.map((bank) => ({
    type: String(bank.type),
    summaryTokens: bank.summaryTokens,
    updatedAt: bank.updatedAt.toISOString(),
    preview: bank.content.length > 240 ? `${bank.content.substring(0, 240)}...` : bank.content,
  }));
}

export default async function KnowledgeBasePage({ searchParams }: PageProps) {
  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(searchParams.project);

  const { articles, allTags, totalCount } = await getKnowledgeArticles(projectId, searchParams);

  const memoryBanks = await getProjectMemoryBanks(projectId);

  const { search = '', tag } = searchParams;

  const hasSearch = search.trim().length > 0;

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Knowledge Base</h2>
                <p className="text-sm text-slate">
                  {totalCount} items • Hybrid search enabled • Agent-managed repository
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs italic text-slate/70">
                  💡 Knowledge items are created and updated by AI agents via MCP tools
                </p>
                <button
                  className="neu-raised smooth-transition flex cursor-not-allowed items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-slate opacity-50"
                  aria-label="Add knowledge base item (agent-only)"
                  disabled
                  title="Knowledge items are managed by AI agents. Use MCP tools: projectpulse_knowledge_create"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  <span>Agent-Only</span>
                </button>
              </div>
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
              {articles.length > 0 || (!hasSearch && memoryBanks.length > 0) ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Pinned Memory Bank cards (visible only when not searching) */}
                  {!hasSearch &&
                    memoryBanks.map((bank) => (
                      <Link
                        key={bank.type}
                        href={`/memory-banks/${encodeURIComponent(bank.type)}?project=${projectId}`}
                        className="block"
                      >
                        <div className="knowledge-card neu-raised smooth-transition hover:shadow-neumorphic-hover rounded-3xl p-6">
                          <div className="mb-4 flex items-start justify-between">
                            <div className="icon-coral flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
                              <span className="text-xs font-semibold text-white">MB</span>
                            </div>
                            <span className="neu-pressed flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold text-coral">
                              ~{bank.summaryTokens ?? 0} tokens
                            </span>
                          </div>

                          <h3 className="mb-2 text-lg font-bold text-white">
                            Memory Bank: {bank.type}
                          </h3>

                          <p className="mb-4 text-sm leading-relaxed text-slate">
                            {bank.preview || 'This memory bank is currently empty.'}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate">
                            <span>Updated {new Date(bank.updatedAt).toLocaleString()}</span>
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                              Memory Bank
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}

                  {/* Regular Knowledge article cards - Suspense required for useSearchParams */}
                  <Suspense
                    fallback={<div className="neu-raised h-48 animate-pulse rounded-3xl p-6" />}
                  >
                    {articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </Suspense>
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
    </ProjectLayoutWrapper>
  );
}
