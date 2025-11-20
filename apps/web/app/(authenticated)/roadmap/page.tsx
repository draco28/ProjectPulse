/**
 * Roadmap Page - Sprint 8.5
 *
 * Displays 5-level development roadmap hierarchy:
 * Roadmap → Phase → Sprint → Week → Day → Task
 *
 * Features:
 * - Server Component data fetching (nested includes)
 * - 5-level collapsible tree UI with neumorphic design
 * - Current position indicator with coral accents
 * - Progress visualization
 * - Color-coded status badges
 *
 * @see US-073: Development Roadmap Visualization
 */

import { Suspense } from 'react';
import { Map, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser, getAuthorizedProject } from '@/lib/auth-server';
import { FilterableRoadmapTree } from '@/components/roadmap/FilterableRoadmapTree';
import { CurrentPositionBanner } from '@/components/roadmap/CurrentPositionBanner';
import { EmptyRoadmapState } from '@/components/roadmap/EmptyRoadmapState';

/**
 * Fetch roadmap with complete 5-level hierarchy
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
                      tasks: {
                        select: {
                          id: true,
                          title: true,
                          description: true,
                          status: true,
                          progress: true,
                          sessions: {
                            select: {
                              id: true,
                            },
                          },
                        },
                      },
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
  
  // Get projectId from query or first owned project
  const projectIdParam = params.project ? parseInt(params.project, 10) : undefined;
  const project = await getAuthorizedProject(projectIdParam, user.id);
  
  if (!project) redirect('/app');

  const roadmap = await getRoadmap(project.id);

  if (!roadmap) {
    return <EmptyRoadmapState />;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="icon-coral flex h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0">
            <Map className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Development Roadmap</h1>
        </div>
        <p className="text-slate text-sm ml-[68px]">
          5-level hierarchy: Phase → Sprint → Week → Day → Task
        </p>
      </div>

      {/* Current Position Banner */}
      <CurrentPositionBanner roadmap={roadmap} />

      {/* Roadmap Tree with Filters */}
      <Suspense
        fallback={
          <div className="neu-raised rounded-3xl p-6 animate-pulse">
            <div className="h-8 bg-dark-pressed rounded-xl mb-4 w-1/3"></div>
            <div className="h-32 bg-dark-pressed rounded-xl mb-3"></div>
            <div className="h-32 bg-dark-pressed rounded-xl mb-3"></div>
            <div className="h-32 bg-dark-pressed rounded-xl"></div>
          </div>
        }
      >
        <FilterableRoadmapTree roadmap={roadmap} />
      </Suspense>
    </>
  );
}
