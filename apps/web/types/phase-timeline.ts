/**
 * Phase Timeline Type Definitions - Sprint 15 Phase E
 *
 * Types specific to the Phase Timeline view that replaces the old
 * tree-based roadmap UI. This view shows sprints in a grid layout
 * with the current sprint expanded to show a mini-kanban preview.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import type { PhaseOverview, SprintOverview, RoadmapOverviewResponse } from './kanban';

/**
 * Sprint card display variant determines styling and click behavior.
 *
 * - completed: Compact card with checkmark, lower opacity, opens drawer
 * - current: Expanded card (col-span-2), coral border, mini-kanban preview
 * - planned: Compact card, shows planned features, navigates to kanban
 */
export type SprintCardVariant = 'completed' | 'current' | 'planned';

/**
 * Determines the variant based on sprint status and global sprint number.
 * Uses globalSprintNumber for consistent current sprint identification across phases.
 */
export function getSprintVariant(
  sprint: SprintOverview,
  currentGlobalSprintNumber?: number
): SprintCardVariant {
  if (sprint.status === 'COMPLETED') return 'completed';
  // Use globalSprintNumber for cross-phase current sprint identification
  if (currentGlobalSprintNumber && sprint.globalSprintNumber === currentGlobalSprintNumber) {
    return 'current';
  }
  // Fallback to status-based detection if no global number provided
  if (!currentGlobalSprintNumber && sprint.status === 'IN_PROGRESS') {
    return 'current';
  }
  return 'planned';
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

/**
 * Props for PhaseTimelineClient - the main client component.
 */
export interface PhaseTimelineClientProps {
  projectId: number;
  initialData: RoadmapOverviewResponse;
}

/**
 * Props for PhaseSelector dropdown.
 */
export interface PhaseSelectorProps {
  phases: PhaseOverview[];
  selectedPhaseId: string;
  onPhaseChange: (phaseId: string) => void;
}

/**
 * Props for PhaseProgressBar.
 */
export interface PhaseProgressBarProps {
  phase: PhaseOverview;
  /** Global sprint number of the current sprint (across all phases) */
  currentGlobalSprintNumber?: number;
}

/**
 * Props for SprintGrid layout.
 */
export interface SprintGridProps {
  projectId: number;
  sprints: SprintOverview[];
  /** Global sprint number of the current sprint (across all phases) */
  currentGlobalSprintNumber?: number;
  onSprintClick: (sprint: SprintOverview, variant: SprintCardVariant) => void;
}

/**
 * Props for SprintCard.
 */
export interface SprintCardProps {
  sprint: SprintOverview;
  variant: SprintCardVariant;
  onClick: () => void;
  /** Only for current sprint - enables mini-kanban preview */
  showMiniKanban?: boolean;
}

/**
 * Props for MiniKanbanPreview.
 */
export interface MiniKanbanPreviewProps {
  sprintId: string;
}

/**
 * Props for NextPhasePreview.
 */
export interface NextPhasePreviewProps {
  phase: PhaseOverview;
  onSprintClick?: (sprintNumber: number) => void;
}

/**
 * Props for PhaseStatsBar.
 */
export interface PhaseStatsBarProps {
  stats: {
    totalTickets: number;
    completedTickets: number;
    inProgressTickets: number;
    inReviewTickets: number;
    avgDaysPerTicket?: number;
    ticketsPerDay?: number;
  };
}

/**
 * Props for SprintHistoryDrawer.
 * Now supports both completed and planned sprint variants.
 */
export interface SprintHistoryDrawerProps {
  projectId: number;
  sprint: SprintOverview | null;
  /** Variant determines drawer styling: 'completed' or 'planned' */
  variant: 'completed' | 'planned';
  isOpen: boolean;
  onClose: () => void;
  onViewFullBoard?: (sprintNumber: number) => void;
}

// ---------------------------------------------------------------------------
// Data Types
// ---------------------------------------------------------------------------

/**
 * Summary data for a completed sprint shown in the history drawer.
 */
export interface SprintSummary {
  id: string;
  sprintNumber: number;
  title: string;
  dateRange: string;
  durationDays: number;

  ticketCounts: {
    total: number;
    done: number;
    features: number;
    bugs: number;
    tasks: number;
  };

  /** Top completed features for the summary */
  completedFeatures: Array<{
    id: number;
    title: string;
  }>;

  /** Tickets completed per week */
  velocity: number;
}

/**
 * Mini kanban column data for the preview.
 */
export interface MiniKanbanColumn {
  status: string;
  label: string;
  count: number;
  colorClass: string;
  tickets: Array<{
    id: number;
    title: string;
    kind: string;
    assignee?: string | null;
  }>;
}
