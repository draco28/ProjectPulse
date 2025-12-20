/**
 * Tickets List Page
 *
 * Sprint 10: Unified ticket system for all work items
 * Displays all tickets (features, tasks, epics, issues, bugs, etc.) with filtering
 */

import { Metadata } from 'next';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { TicketsPageClient } from '@/components/tickets/TicketsPageClient';
import { SearchSortBar } from '@/components/tickets/SearchSortBar';
import { TicketListCard } from '@/components/tickets/TicketListCard';
import { Pagination } from '@/components/tickets/Pagination';
import { prisma } from '@/lib/prisma';
import { getFilterOptions, getFilterCounts as getFilterCountsFromLib } from '@/lib/filters';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';

export const metadata: Metadata = {
  title: 'Tickets | ProjectPulse',
  description: 'Track and manage all work items - features, tasks, epics, issues, and bugs',
};

interface SearchParams {
  status?: string;
  priority?: string;
  module?: string;
  kind?: string;
  label?: string; // Sprint 11.7: Label IDs (comma-separated)
  search?: string;
  sort?: string;
  page?: string;
  project?: string;
  [key: string]: string | undefined;
}

type WhereClause = {
  projectId: number;
  kind?: { in: string[] };
  status?: { in: string[] };
  priority?: { in: string[] };
  module?: { in: string[] };
  labels?: { some: { id: { in: number[] } } }; // Sprint 11.7: Label filter
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
};

async function getTickets(projectId: number, searchParams: SearchParams) {
  // Parse filters from URL
  const kindFilter = searchParams.kind?.split(',').filter(Boolean) || [];
  const statusFilter = searchParams.status?.split(',').filter(Boolean) || [];
  const priorityFilter = searchParams.priority?.split(',').filter(Boolean) || [];
  const moduleFilter = searchParams.module?.split(',').filter(Boolean) || [];
  // Sprint 11.7: Parse label filter (IDs as strings, convert to numbers)
  const labelFilter = searchParams.label?.split(',').filter(Boolean).map(Number) || [];
  const searchTerm = searchParams.search || '';
  const sortBy = searchParams.sort || 'newest';
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 10;

  // Build where clause with projectId
  const where: WhereClause = { projectId };

  // Filter by kind (all kinds by default)
  if (kindFilter.length > 0) {
    where.kind = { in: kindFilter };
  }

  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  }

  if (priorityFilter.length > 0) {
    where.priority = { in: priorityFilter };
  }

  if (moduleFilter.length > 0) {
    where.module = { in: moduleFilter };
  }

  // Sprint 11.7: Filter by labels
  if (labelFilter.length > 0) {
    where.labels = { some: { id: { in: labelFilter } } };
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
      orderBy = { priority: 'desc' };
      break;
    case 'updated':
      orderBy = { updatedAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [tickets, totalCount] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        comments: {
          select: { id: true },
        },
        attachments: {
          select: { id: true },
        },
        // Sprint 11.7: Include labels for display
        labels: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy,
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / perPage),
    perPage,
  };
}


// Kind labels for display
const kindLabels: Record<string, string> = {
  feature: 'Feature',
  task: 'Task',
  epic: 'Epic',
  issue: 'Issue',
  bug: 'Bug',
  scanner_finding: 'Scanner Finding',
  tech_debt: 'Tech Debt',
};

// Kind badge colors
const kindColors: Record<string, string> = {
  feature: 'bg-blue-500/20 text-blue-400',
  task: 'bg-green-500/20 text-green-400',
  epic: 'bg-purple-500/20 text-purple-400',
  issue: 'bg-yellow-500/20 text-yellow-400',
  bug: 'bg-red-500/20 text-red-400',
  scanner_finding: 'bg-orange-500/20 text-orange-400',
  tech_debt: 'bg-gray-500/20 text-gray-400',
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  
  const { project, projectId } = await getActiveProjectForUser(user.id, params.project);

  // Sprint 11.7: Use library's getFilterCounts (includes label counts) and pass projectId for project-scoped labels
  const [{ tickets, totalCount, currentPage, totalPages, perPage }, filterCounts, filterOptions] =
    await Promise.all([getTickets(projectId, params), getFilterCountsFromLib(projectId), getFilterOptions(projectId)]);

  // Extend filter options with kind filter
  const extendedFilterOptions = {
    ...filterOptions,
    kinds: ['feature', 'task', 'epic', 'issue', 'bug', 'scanner_finding', 'tech_debt'],
  };

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
                <h2 className="mb-1 text-3xl font-bold text-white">Tickets</h2>
                <p className="text-sm text-slate">
                  {project.name} - All work items: features, tasks, epics, issues, and bugs
                </p>
              </div>
              <Link
                href={`/tickets/create?project=${projectId}`}
                className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg hover:opacity-90"
                aria-label="Create new ticket"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>New Ticket</span>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Filters Sidebar (Desktop) + FAB + Mobile Drawer */}
            <TicketsPageClient options={extendedFilterOptions} counts={filterCounts} searchParams={params} />

            {/* Tickets List */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto">
              {/* Search & Sort */}
              <SearchSortBar searchParams={params} />

              {/* Tickets */}
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                    <p className="text-lg font-semibold text-white">No tickets found</p>
                    <p className="text-sm text-slate">Try adjusting your filters or search term</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="relative">
                      {/* Kind Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${kindColors[ticket.kind] || 'bg-gray-500/20 text-gray-400'}`}>
                          {kindLabels[ticket.kind] || ticket.kind}
                        </span>
                      </div>
                      <TicketListCard
                        projectId={projectId}
                        ticket={{
                          id: ticket.id.toString(),
                          title: ticket.title,
                          description: ticket.description || '',
                          priority: ticket.priority as 'critical' | 'high' | 'medium' | 'low',
                          module: ticket.module || '',
                          status: ticket.status as 'open' | 'in-progress' | 'closed',
                          assignee: ticket.assignee || 'Unassigned',
                          createdAt: ticket.createdAt,
                          commentsCount: ticket.comments.length,
                          attachmentsCount: ticket.attachments.length,
                          // Sprint 11.7: Include labels for display
                          labels: ticket.labels,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  showing={tickets.length}
                  perPage={perPage}
                  itemLabel="tickets"
                  projectId={projectId}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
