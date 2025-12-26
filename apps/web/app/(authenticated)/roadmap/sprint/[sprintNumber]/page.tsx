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

async function getSprintByNumber(sprintNumber: number) {
  // Find the first sprint matching this number
  // In a multi-project system, you'd also filter by projectId
  const sprint = await prisma.sprint.findFirst({
    where: { sprintNumber },
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
          roadmap: {
            select: {
              projectId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sprint;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function SprintKanbanPage({ params }: PageProps) {
  const { sprintNumber } = await params;
  const num = parseInt(sprintNumber, 10);

  // Validate sprint number
  if (isNaN(num) || num < 1) {
    notFound();
  }

  // Fetch sprint data
  const sprint = await getSprintByNumber(num);

  if (!sprint) {
    notFound();
  }

  // Render client component with sprint data
  return (
    <SprintKanbanClient
      sprintId={sprint.id}
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
