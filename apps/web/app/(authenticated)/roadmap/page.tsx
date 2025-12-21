/**
 * Roadmap Page - Standalone Roadmap UI
 *
 * Sprint 12: Updated for 4-level hierarchy:
 * Roadmap → Phase → Sprint → Week → Day
 *
 * Features:
 * - Server Component data fetching (nested includes)
 * - Toggle between Tree and Timeline views
 * - 4-level collapsible tree UI with neumorphic design
 * - Horizontal Gantt-style timeline visualization
 * - Current position indicator with coral accents
 * - Progress visualization
 * - Color-coded status badges
 *
 * @see US-073: Development Roadmap Visualization
 * @see .agent/task/roadmap-ui/ROADMAP-TIMELINE-DESIGN.md
 */

import { Suspense } from 'react';
import { Map } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';
import { FilterableRoadmapView } from '@/components/roadmap/FilterableRoadmapView';
import { CurrentPositionBanner } from '@/components/roadmap/CurrentPositionBanner';
import { EmptyRoadmapState } from '@/components/roadmap/EmptyRoadmapState';

/**
 * Fetch roadmap with complete 4-level hierarchy
 * Sprint 12: Task model removed - Days are now leaf nodes
 * Uses nested includes to load entire tree in one query
 */
async function getRoadmap(projectId: number) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { projectId },
    include: {
      phases_rel: {
        include: {
          sprints: {
            include: {
              weeks: {
                include: {
                  days: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      status: true,
                      progress: true,
                      startDate: true,
                      endDate: true,
                      weekId: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                  // Sprint 12: Tickets scheduled to weeks
                  scheduledTickets: {
                    select: {
                      id: true,
                      title: true,
                      status: true,
                      priority: true,
                      estimatedDays: true,
                      scheduledDays: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { startDate: 'asc' },
      },
    },
  });

  return roadmap;
}

/**
 * Roadmap Page Component
 */
export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;

  const { project, projectId } = await getActiveProjectForUser(user.id, params.project);

  const roadmap = await getRoadmap(projectId);

  if (!roadmap) {
    return <EmptyRoadmapState projectId={projectId} />;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="icon-coral flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl">
            <Map className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Development Roadmap</h1>
        </div>
        <p className="ml-[68px] text-sm text-slate">
          4-level hierarchy: Phase → Sprint → Week → Day
        </p>
      </div>

      {/* Current Position Banner */}
      <CurrentPositionBanner roadmap={roadmap} />

      {/* Roadmap View (Tree or Timeline) */}
      <Suspense
        fallback={
          <div className="neu-raised animate-pulse rounded-3xl p-6">
            <div className="mb-4 h-8 w-1/3 rounded-xl bg-dark-pressed"></div>
            <div className="mb-3 h-32 rounded-xl bg-dark-pressed"></div>
            <div className="mb-3 h-32 rounded-xl bg-dark-pressed"></div>
            <div className="h-32 rounded-xl bg-dark-pressed"></div>
          </div>
        }
      >
        <FilterableRoadmapView roadmap={roadmap} />
      </Suspense>
    </>
  );
}
