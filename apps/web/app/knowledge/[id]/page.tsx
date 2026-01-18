import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import { ArrowLeft, Calendar, Clock, Tag, Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    project?: string;
  }>;
}

export const dynamic = 'force-dynamic';

async function getKnowledgeItem(id: number, projectId: number) {
  const item = await prisma.knowledgeItem.findFirst({
    where: {
      id,
      projectId, // Multi-tenancy: ensure item belongs to user's project
      archivedAt: null, // Don't show archived items
    },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return item;
}

export default async function KnowledgeDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(resolvedSearchParams.project);

  const id = parseInt(resolvedParams.id, 10);
  if (isNaN(id) || id < 1) {
    notFound();
  }

  const item = await getKnowledgeItem(id, projectId);
  if (!item) {
    notFound();
  }

  const createdAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  const updatedAgo = formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true });

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Back Navigation */}
          <Link
            href={`/knowledge?project=${projectId}`}
            className="neu-raised smooth-transition flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-slate hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Knowledge Base</span>
          </Link>

          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="mb-3 text-3xl font-bold text-white">{item.title}</h1>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate">
                  {item.category && (
                    <span className="flex items-center gap-1.5">
                      <Folder className="h-4 w-4 text-coral" />
                      {item.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Created {createdAgo}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Updated {updatedAgo}
                  </span>
                </div>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Tag className="h-4 w-4 text-slate" />
                    {item.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/knowledge?project=${projectId}&tag=${encodeURIComponent(tag)}`}
                        className="neu-pressed rounded-full px-3 py-1 text-xs font-semibold text-coral hover:text-white"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="neu-raised smooth-transition flex-1 overflow-auto rounded-3xl p-8">
            <article className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 mt-8 text-2xl font-bold text-white first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 text-xl font-bold text-white">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 text-lg font-semibold text-white">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-slate">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 list-disc space-y-1 pl-6 text-slate">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 list-decimal space-y-1 pl-6 text-slate">{children}</ol>
                  ),
                  li: ({ children }) => <li className="text-slate">{children}</li>,
                  code: ({ className, children }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="rounded bg-dark-lighter px-1.5 py-0.5 font-mono text-sm text-coral">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block overflow-x-auto rounded-xl bg-dark-lighter p-4 font-mono text-sm text-slate">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="mb-4 overflow-x-auto rounded-xl bg-dark-lighter p-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="mb-4 border-l-4 border-coral pl-4 italic text-slate">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-coral hover:underline"
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {item.content}
              </ReactMarkdown>
            </article>
          </main>
        </div>
      </div>
    </ProjectLayoutWrapper>
  );
}
