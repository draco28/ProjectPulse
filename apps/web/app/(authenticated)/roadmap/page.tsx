/**
 * Roadmap Page - Phase Timeline View
 *
 * Sprint 15 Phase E: Replaced 4-level tree view with Phase Timeline.
 *
 * New UI Structure:
 * - Phase selector dropdown for switching phases
 * - Sprint grid showing completed/current/planned sprints
 * - Mini-kanban preview for current sprint
 * - Side drawer for completed sprint history
 *
 * Navigation:
 * - /roadmap → Phase Timeline (this page)
 * - /roadmap/sprint/[n] → Sprint Kanban board (Phase D)
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 * @see Ticket #74: Phase E - Phase Timeline UI Updates
 */

import { Map } from 'lucide-react';
import { cookies } from 'next/headers';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import { PhaseTimelineClient } from '@/components/roadmap-timeline';
import { EmptyRoadmapState } from '@/components/roadmap/EmptyRoadmapState';
import type { RoadmapOverviewResponse } from '@/types/kanban';

/**
 * Fetch roadmap overview from API.
 * Returns phase/sprint summary data optimized for Phase Timeline view.
 *
 * CRITICAL: Must forward cookies for server-side auth to work.
 * Server-side fetch doesn't automatically include cookies.
 */
async function getRoadmapOverview(projectId: number): Promise<RoadmapOverviewResponse | null> {
  try {
    // Get cookies from incoming request to forward to internal API
    // CRITICAL: cookies().toString() returns "[object Object]", not the cookie string!
    // Must use getAll() and manually format as "name=value; name2=value2"
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join('; ');

    // Internal API call - use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/roadmap/overview?projectId=${projectId}`, {
      cache: 'no-store', // Always fresh data for roadmap
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[getRoadmapOverview] 404 - No roadmap exists');
        return null; // No roadmap exists
      }
      const errorText = await response.text();
      console.error('[getRoadmapOverview] Failed:', response.status, errorText);
      return null;
    }

    // API returns { success, data } - extract the data property
    const result = await response.json();
    console.log(
      '[getRoadmapOverview] Response success:',
      result.success,
      'hasData:',
      !!result.data
    );
    if (!result.success || !result.data) {
      console.error('[getRoadmapOverview] Invalid response:', result);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching roadmap overview:', error);
    return null;
  }
}

/**
 * Roadmap Page - Server Component
 */
export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(params.project);

  // Fetch roadmap overview
  const overview = await getRoadmapOverview(projectId);

  // Empty state - no roadmap exists
  if (!overview) {
    return (
      <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
        <EmptyRoadmapState projectId={projectId} />
      </ProjectLayoutWrapper>
    );
  }

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      {/* Page Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="icon-coral flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl">
            <Map className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Development Roadmap</h1>
        </div>
        <p className="ml-[68px] text-sm text-slate">
          Phase Timeline • Click sprints to view kanban board
        </p>
      </div>

      {/* Phase Timeline Client */}
      <PhaseTimelineClient projectId={projectId} initialData={overview} />
    </ProjectLayoutWrapper>
  );
}
