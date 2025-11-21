/**
 * Issues List Page
 *
 * Displays all issues with filtering, search, and sorting
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html
 */

import { Metadata } from 'next';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { IssuesPageClient } from '@/components/issues/IssuesPageClient';
import { SearchSortBar } from '@/components/issues/SearchSortBar';
import { IssueListCard } from '@/components/issues/IssueListCard';
import { Pagination } from '@/components/issues/Pagination';
import { prisma } from '@/lib/prisma';
import { getFilterOptions } from '@/lib/filters';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';

export const metadata: Metadata = {
  title: 'Issues | ProjectPulse',
  description: 'Track and manage project issues',
};

interface SearchParams {
  status?: string;
  priority?: string;
  module?: string;
  search?: string;
  sort?: string;
  page?: string;
  project?: string;
  [key: string]: string | undefined;
}

type WhereClause = {
  projectId: number;
  status?: { in: string[] };
  priority?: { in: string[] };
  module?: { in: string[] };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
};

async function getIssues(projectId: number, searchParams: SearchParams) {
  // Parse filters from URL
  const statusFilter = searchParams.status?.split(',').filter(Boolean) || [];
  const priorityFilter = searchParams.priority?.split(',').filter(Boolean) || [];
  const moduleFilter = searchParams.module?.split(',').filter(Boolean) || [];
  const searchTerm = searchParams.search || '';
  const sortBy = searchParams.sort || 'newest';
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 10;

  // Build where clause with projectId
  const where: WhereClause = { projectId };

  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  }

  if (priorityFilter.length > 0) {
    where.priority = { in: priorityFilter };
  }

  if (moduleFilter.length > 0) {
    where.module = { in: moduleFilter };
  }

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
    ];
  }

  // Build orderBy clause
  let orderBy:
    | { createdAt: 'desc' | 'asc' }
    | { updatedAt: 'desc' | 'asc' }
    | { priority: 'desc' | 'asc' };

  switch (sortBy) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'priority':
      // Custom priority order: critical > high > medium > low
      orderBy = { priority: 'desc' };
      break;
    case 'updated':
      orderBy = { updatedAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  // Fetch issues
  const [issues, totalCount] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        comments: {
          select: { id: true },
        },
        attachments: {
          select: { id: true },
        },
      },
      orderBy,
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.issue.count({ where }),
  ]);

  return {
    issues,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / perPage),
    perPage,
  };
}

async function getFilterCounts(projectId: number) {
  // Get counts for each filter option scoped to project
  const [statusCounts, priorityCounts, moduleCounts] = await Promise.all([
    prisma.issue.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    }),
    prisma.issue.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: true,
    }),
    prisma.issue.groupBy({
      by: ['module'],
      where: { projectId },
      _count: true,
    }),
  ]);

  return {
    status: Object.fromEntries(
      statusCounts.map((s: { status: string; _count: number }) => [s.status, s._count])
    ),
    priority: Object.fromEntries(
      priorityCounts.map((p: { priority: string; _count: number }) => [p.priority, p._count])
    ),
    module: Object.fromEntries(
      moduleCounts
        .filter((m: { module: string | null; _count: number }) => m.module)
        .map((m: { module: string | null; _count: number }) => [m.module!, m._count])
    ),
  };
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  
  const { project, projectId } = await getActiveProjectForUser(user.id, params.project);

  const [{ issues, totalCount, currentPage, totalPages, perPage }, filterCounts, filterOptions] =
    await Promise.all([getIssues(projectId, params), getFilterCounts(projectId), getFilterOptions()]);

  return (
    <>
      <FloatingBackground />

      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar projectId={projectId} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="mb-4">
              <Link
                href={`/dashboard?project=${projectId}`}
                className="inline-flex items-center gap-2 text-sm text-coral hover:text-coral-light transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Issues</h2>
                <p className="text-sm text-slate">{project.name} - Track and manage project issues</p>
              </div>
              <button
                className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                aria-label="Create new issue"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>New Issue</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Filters Sidebar (Desktop) + FAB + Mobile Drawer */}
            <IssuesPageClient options={filterOptions} counts={filterCounts} searchParams={params} />

            {/* Issues List */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto">
              {/* Search & Sort */}
              <SearchSortBar searchParams={params} />

              {/* Issues */}
              <div className="space-y-3">
                {issues.length === 0 ? (
                  <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                    <p className="text-lg font-semibold text-white">No issues found</p>
                    <p className="text-sm text-slate">Try adjusting your filters or search term</p>
                  </div>
                ) : (
                  issues.map((issue) => (
                    <IssueListCard
                      key={issue.id}
                      issue={{
                        id: issue.id.toString(),
                        title: issue.title,
                        description: issue.description || '',
                        priority: issue.priority as 'critical' | 'high' | 'medium' | 'low',
                        module: issue.module || 'Unknown',
                        status: issue.status as 'open' | 'in-progress' | 'closed',
                        assignee: issue.assignee || 'Unassigned',
                        createdAt: issue.createdAt,
                        commentsCount: issue.comments.length,
                        attachmentsCount: issue.attachments.length,
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
                  showing={issues.length}
                  perPage={perPage}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
