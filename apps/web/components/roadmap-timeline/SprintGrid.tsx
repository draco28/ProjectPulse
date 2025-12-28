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

import type { SprintOverview } from '@/types/kanban';
import { useProject } from '@/lib/project';
import type { SprintCardVariant } from '@/types/phase-timeline';
import { SprintCard } from './SprintCard';

interface SprintGridProps {
  projectId: number;
  sprints: SprintOverview[];
  /** Global sprint number of the current sprint (across all phases) */
  currentGlobalSprintNumber?: number;
  /** Callback when a sprint drawer should open (completed or planned sprints) */
  onSprintDrawerOpen: (sprint: SprintOverview, variant: 'completed' | 'planned') => void;
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
  projectId: _projectId,
  sprints,
  currentGlobalSprintNumber,
  onSprintDrawerOpen,
}: SprintGridProps) {
  const { navigateTo } = useProject();

  const handleSprintClick = (sprint: SprintOverview, variant: SprintCardVariant) => {
    if (variant === 'current') {
      // Only current sprint navigates directly to kanban (it shows mini-kanban inline)
      navigateTo(`/roadmap/sprint/${sprint.globalSprintNumber}`);
    } else {
      // Both completed and planned sprints open the drawer
      onSprintDrawerOpen(sprint, variant);
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
