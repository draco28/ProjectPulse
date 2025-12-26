'use client';

/**
 * SprintGrid - Responsive grid layout for sprint cards
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Arranges sprint cards in a 4-column grid with the current sprint
 * spanning 2 columns for visual emphasis.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { useRouter } from 'next/navigation';
import type { SprintOverview } from '@/types/kanban';
import type { SprintCardVariant } from '@/types/phase-timeline';
import { SprintCard } from './SprintCard';

interface SprintGridProps {
  projectId: number;
  sprints: SprintOverview[];
  currentSprintNumber: number;
  onCompletedSprintClick: (sprint: SprintOverview) => void;
}

/**
 * Determine the card variant based on sprint status.
 */
function getSprintVariant(
  sprint: SprintOverview,
  currentSprintNumber: number
): SprintCardVariant {
  if (sprint.status === 'COMPLETED') return 'completed';
  if (sprint.sprintNumber === currentSprintNumber) return 'current';
  return 'planned';
}

/**
 * SprintGrid component that renders sprint cards in a responsive grid.
 *
 * Layout:
 * - 4-column grid on desktop (lg+)
 * - 2-column grid on tablet (md)
 * - 1-column on mobile
 * - Current sprint spans 2 columns for emphasis
 */
export function SprintGrid({
  projectId,
  sprints,
  currentSprintNumber,
  onCompletedSprintClick,
}: SprintGridProps) {
  const router = useRouter();

  const handleSprintClick = (sprint: SprintOverview, variant: SprintCardVariant) => {
    if (variant === 'completed') {
      // Open drawer for completed sprints
      onCompletedSprintClick(sprint);
    } else {
      // Navigate to kanban for current/planned sprints (with project context)
      router.push(`/roadmap/sprint/${sprint.sprintNumber}?project=${projectId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sprints.map((sprint) => {
        const variant = getSprintVariant(sprint, currentSprintNumber);

        return (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            variant={variant}
            showMiniKanban={variant === 'current'}
            onClick={() => handleSprintClick(sprint, variant)}
          />
        );
      })}
    </div>
  );
}
