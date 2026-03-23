/**
 * Sprint Kanban Board Page - Sprint 15 Phase D
 *
 * Server Component that resolves sprintNumber to sprintId
 * and renders the SprintKanbanBoard client component.
 *
 * Route: /roadmap/sprint/[sprintNumber]
 *
 * @example
 * /roadmap/sprint/1 → Sprint 1 kanban board
 * /roadmap/sprint/3 → Sprint 3 kanban board
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SprintKanbanClient from './SprintKanbanClient';

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  params: Promise<{
    sprintNumber: string;
  }>;
  searchParams: Promise<{
    project?: string;
  }>;
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sprintNumber } = await params;
  const num = parseInt(sprintNumber, 10);

  if (isNaN(num)) {
    return { title: 'Sprint Not Found - ProjectPulse' };
  }

  return {
    title: `Sprint ${num} - Kanban Board - ProjectPulse`,
    description: `Kanban board view for Sprint ${num}`,
  };
}

// ============================================================================
// Data Fetching
// ============================================================================

/**
 * Get sprint by its global sprint number within a specific project.
 *
 * The URL uses globalSprintNumber (sequential across all phases: 1, 2, 3, 4, 5...),
 * but the database stores sprintNumber (sequential within each phase: 1, 2, 3...).
 *
 * This function:
 * 1. Fetches all sprints for the project ordered by phase and sprint number
 * 2. Calculates global position for each
 * 3. Returns the sprint matching the requested global position
 *
 * @param globalSprintNumber - The global sprint number from the URL
 * @param projectId - The project ID to scope the query (prevents cross-project pollution)
 */
async function getSprintByGlobalNumber(globalSprintNumber: number, projectId?: number) {
  // Build where clause with project filter
  const whereClause: { phase?: { roadmap: { projectId: number } } } = {};

  if (projectId) {
    whereClause.phase = {
      roadmap: {
        projectId: projectId,
      },
    };
  }

  // Get all sprints for the project ordered by phase start date and sprint number
  const sprints = await prisma.sprint.findMany({
    where: whereClause,
    select: {
      id: true,
      sprintNumber: true,
      title: true,
      status: true,
      progress: true,
      phase: {
        select: {
          id: true,
          title: true,
          startDate: true,
          roadmap: {
            select: {
              projectId: true,
            },
          },
        },
      },
    },
    orderBy: [{ phase: { startDate: 'asc' } }, { sprintNumber: 'asc' }],
  });

  // Calculate global sprint number and find the matching sprint
  let globalCounter = 0;
  for (const sprint of sprints) {
    globalCounter++;
    if (globalCounter === globalSprintNumber) {
      return sprint;
    }
  }

  return null;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function SprintKanbanPage({ params, searchParams }: PageProps) {
  const { sprintNumber } = await params;
  const { project } = await searchParams;
  const num = parseInt(sprintNumber, 10);
  const projectIdFromUrl = project ? parseInt(project, 10) : undefined;

  // Validate sprint number
  if (isNaN(num) || num < 1) {
    notFound();
  }

  // Fetch sprint data using global sprint number and project filter
  // This prevents cross-project pollution where Sprint 1 from Project 7
  // could be returned when user navigated from Project 6
  const sprint = await getSprintByGlobalNumber(num, projectIdFromUrl);

  if (!sprint) {
    notFound();
  }

  // Use projectId from sprint's roadmap (authoritative source)
  // This should match projectIdFromUrl after our fix
  const projectId = sprint.phase?.roadmap?.projectId ?? projectIdFromUrl;

  // Render client component with sprint data
  return (
    <SprintKanbanClient
      sprintId={sprint.id}
      projectId={projectId}
      initialSprint={{
        id: sprint.id,
        sprintNumber: sprint.sprintNumber,
        title: sprint.title,
        status: sprint.status,
        progress: sprint.progress,
        phase: {
          id: sprint.phase?.id ?? '',
          title: sprint.phase?.title ?? 'Unknown Phase',
        },
      }}
    />
  );
}
