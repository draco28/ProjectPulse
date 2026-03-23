/**
 * Sessions Page - Sprint 15 Phase F Redesign
 *
 * Server component that fetches initial counts, then renders
 * the client-side redesigned sessions page.
 *
 * Features:
 * - Active session lanes with ticket pipelines
 * - Paused/completed session cards
 * - Real-time duration timers
 * - Token usage display
 * - History drawer with search
 * - Unassigned tickets section
 */

import { Metadata } from 'next';
import 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { SessionsPageRedesigned } from '@/components/sessions/SessionsPageRedesigned';
import { prisma } from '@/lib/prisma';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import type { SessionCounts } from '@/types/sessions';

export const metadata: Metadata = {
  title: 'Sessions | ProjectPulse',
  description: 'Track and manage agent work sessions',
};

interface SearchParams {
  project?: string;
}

/**
 * Fetch initial session counts for SSR
 */
async function getSessionCounts(projectId: number): Promise<SessionCounts> {
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
  const params = await searchParams;

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(params.project);

  // Fetch initial counts for SSR
  const initialCounts = await getSessionCounts(projectId);

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <FloatingBackground />

      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 px-6 pb-4 pt-6">
            <Link
              href={`/dashboard?project=${projectId}`}
              className="mb-4 inline-flex items-center gap-2 text-sm text-coral transition-colors hover:text-coral-light"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </header>

          {/* Sessions Content */}
          <main className="flex-1 overflow-auto">
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
                </div>
              }
            >
              <SessionsPageRedesigned
                projectId={projectId}
                projectName={project.name}
                initialCounts={initialCounts}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </ProjectLayoutWrapper>
  );
}
