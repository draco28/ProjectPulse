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
  /** Global sprint number of the current sprint (across all phases) */
  currentGlobalSprintNumber?: number;
  onCompletedSprintClick: (sprint: SprintOverview) => void;
}

/**
 * Determine the card variant based on sprint status and global sprint number.
 * Uses globalSprintNumber for cross-phase current sprint identification.
 */
function getSprintVariant(
  sprint: SprintOverview,
  currentGlobalSprintNumber?: number
): SprintCardVariant {
  if (sprint.status === 'COMPLETED') return 'completed';
  // Use globalSprintNumber for consistent current sprint across all phases
  if (currentGlobalSprintNumber && sprint.globalSprintNumber === currentGlobalSprintNumber) {
    return 'current';
  }
  // Fallback: if no global current sprint is set, use IN_PROGRESS status
  if (!currentGlobalSprintNumber && sprint.status === 'IN_PROGRESS') {
    return 'current';
  }
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
  currentGlobalSprintNumber,
  onCompletedSprintClick,
}: SprintGridProps) {
  const router = useRouter();

  const handleSprintClick = (sprint: SprintOverview, variant: SprintCardVariant) => {
    if (variant === 'completed') {
      // Open drawer for completed sprints
      onCompletedSprintClick(sprint);
    } else {
      // Navigate to kanban for current/planned sprints using global sprint number
      router.push(`/roadmap/sprint/${sprint.globalSprintNumber}?project=${projectId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sprints.map((sprint) => {
        const variant = getSprintVariant(sprint, currentGlobalSprintNumber);

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
