/**
 * Sessions List Page
 *
 * Sprint 14: Agent work sessions for multi-instance Claude Code
 * Shows all sessions (Active, Paused, Completed) with filtering
 */

import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { SessionsPageClient } from '@/components/sessions/SessionsPageClient';
import { SessionListCard } from '@/components/sessions/SessionListCard';
import { Pagination } from '@/components/tickets/Pagination';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';

export const metadata: Metadata = {
  title: 'Sessions | ProjectPulse',
  description: 'Track and manage agent work sessions',
};

interface SearchParams {
  status?: string;
  page?: string;
  project?: string;
}

type WhereClause = {
  projectId: number;
  status?: { in: string[] } | string;
};

async function getSessions(projectId: number, searchParams: SearchParams) {
  const statusFilter = searchParams.status || null;
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 10;

  // Build where clause
  const where: WhereClause = { projectId };

  if (statusFilter && ['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [sessions, totalCount] = await Promise.all([
    prisma.agentSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        completedAt: true,
        plan: true,
        progress: true,
        todos: true,
        activeTicketIds: true,
      },
    }),
    prisma.agentSession.count({ where }),
  ]);

  return {
    sessions,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / perPage),
    perPage,
  };
}

async function getSessionCounts(projectId: number) {
  const [active, paused, completed] = await Promise.all([
    prisma.agentSession.count({
      where: { projectId, status: 'IN_PROGRESS' },
    }),
    prisma.agentSession.count({
      where: { projectId, status: 'PAUSED' },
    }),
    prisma.agentSession.count({
      where: { projectId, status: 'COMPLETED' },
    }),
  ]);

  return { active, paused, completed };
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;

  const { project, projectId } = await getActiveProjectForUser(user.id, params.project);

  const [{ sessions, totalCount, currentPage, totalPages, perPage }, counts] = await Promise.all([
    getSessions(projectId, params),
    getSessionCounts(projectId),
  ]);

  // Transform sessions for display
  const displaySessions = sessions.map((session) => {
    const todos = Array.isArray(session.todos)
      ? (session.todos as Array<{ content: string; status: string }>)
      : [];
    const todosCompleted = todos.filter((t) => t.status === 'completed').length;
    const todosTotal = todos.length;

    return {
      id: session.id,
      name: session.name,
      status: session.status as 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED',
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() || null,
      plan: session.plan,
      progress: session.progress,
      todosCompleted,
      todosTotal,
      activeTicketIds: session.activeTicketIds,
    };
  });

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
                className="inline-flex items-center gap-2 text-sm text-coral transition-colors hover:text-coral-light"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Agent Sessions</h2>
                <p className="text-sm text-slate">
                  {project.name} - Track Claude Code work sessions across multiple instances
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {counts.active > 0 && (
                  <span className="flex items-center gap-1 text-green-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                    {counts.active} active
                  </span>
                )}
                {counts.paused > 0 && (
                  <span className="text-yellow-400">{counts.paused} paused</span>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Filters Sidebar */}
            <SessionsPageClient counts={counts} projectId={projectId} />

            {/* Sessions List */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto">
              {/* Sessions */}
              <div className="space-y-4">
                {displaySessions.length === 0 ? (
                  <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                    <p className="text-lg font-semibold text-white">No sessions found</p>
                    <p className="text-sm text-slate">
                      {params.status
                        ? 'Try adjusting your filter'
                        : 'Sessions will appear here when Claude Code starts working'}
                    </p>
                    <p className="mt-4 text-xs text-slate">
                      Use <code className="rounded bg-white/10 px-1 py-0.5">projectpulse_agent_session_start</code>{' '}
                      in Claude Code to begin a session
                    </p>
                  </div>
                ) : (
                  displaySessions.map((session) => (
                    <SessionListCard key={session.id} session={session} projectId={projectId} />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  showing={sessions.length}
                  perPage={perPage}
                  itemLabel="sessions"
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
