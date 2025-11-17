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
import { Map } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { FilterableRoadmapTree } from '@/components/roadmap/FilterableRoadmapTree';
import { CurrentPositionBanner } from '@/components/roadmap/CurrentPositionBanner';

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
                      status: true,
                      progress: true,
                      startDate: true,
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
 * Roadmap Page - Server Component
 */
export default async function RoadmapPage() {
  // TODO: Get projectId from session/auth
  const projectId = 1; // Hardcoded for MVP

  const roadmap = await getRoadmap(projectId);

  if (!roadmap) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center max-w-2xl mx-auto">
        <div className="icon-coral flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-4">
          <Map className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">No Roadmap Found</h1>
        <p className="text-slate">
          This project doesn't have a roadmap yet. Complete the onboarding process to generate one.
        </p>
      </div>
    );
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
