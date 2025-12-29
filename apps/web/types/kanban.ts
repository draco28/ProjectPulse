/**
 * Kanban Board Type Definitions - Sprint 15 Phase B
 *
 * Types for the kanban board API and UI components.
 * These types support the 5-column kanban workflow:
 * backlog → todo → in-progress → in-review → done
 *
 * @see lib/constants/status/ticket.ts for status constants
 * @see lib/validations/kanban.ts for Zod schemas
 */

import type { TicketStatus } from '@/lib/constants/status';

/**
 * Ticket representation in the kanban board.
 * Minimal fields needed for kanban card display and drag-drop.
 */
export interface KanbanTicket {
  id: number;
  title: string;
  status: TicketStatus;
  priority: string;
  kind: string;
  displayOrder: number;

  // Hierarchy context
  parentTicketId: number | null;
  parentTicket?: {
    id: number;
    title: string;
    status: TicketStatus;
  } | null;

  // Child ticket summary (for features)
  childTickets?: Array<{
    id: number;
    status: TicketStatus;
    title: string;
    kind: string;
    priority: string;
  }>;
  childProgress?: number; // 0-100, calculated from children

  // Assignment
  assignee?: string | null;
  assigneeType?: string | null;

  // Sprint 16: Session linkage
  linkedSessionId?: string | null;

  // Traceability
  epicRef?: string | null;
  sprintNumber?: number | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Ghost card representing a ticket that appears in a column
 * where it doesn't actually reside.
 *
 * Used for visual continuity when parent/children are in different columns:
 * - If a parent is in "todo" but has children in "in-progress",
 *   a ghost card appears in "in-progress" to show the connection.
 */
export interface GhostCard {
  /** The actual ticket ID this ghost represents */
  ticketId: number;
  title: string;
  kind: string;

  /** The column where the real ticket lives */
  actualStatus: TicketStatus;

  /** The column where this ghost appears */
  ghostInStatus: TicketStatus;

  /** Whether this is a ghost for a parent or child ticket */
  ghostType: 'parent' | 'child';

  /** ID of the related ticket (parent if ghostType=child, child if ghostType=parent) */
  relatedTicketId: number;
}

/**
 * Statistics for a kanban column (status).
 */
export interface ColumnStats {
  status: TicketStatus;
  count: number;
  label: string;
  colorClass: string;
}

/**
 * Board-level statistics.
 */
export interface BoardStats {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  progress: number; // 0-100 percentage
  columns: ColumnStats[];
}

/**
 * Sprint context for the kanban board header.
 */
export interface SprintContext {
  id: string;
  sprintNumber: number;
  title: string;
  status: string;
  progress: number;
  phase: {
    id: string;
    title: string;
  };
}

/**
 * Complete kanban board response from GET /api/sprints/[sprintId]/kanban.
 */
export interface KanbanBoardResponse {
  sprint: SprintContext;
  columns: Record<TicketStatus, KanbanTicket[]>;
  ghosts: GhostCard[];
  stats: BoardStats;
}

/**
 * Request to move a ticket to a different column/position.
 * Used by PATCH /api/tickets/[id]/move.
 */
export interface MoveTicketRequest {
  /** New status (column) for the ticket */
  status: TicketStatus;

  /** New position within the column (0-indexed) */
  displayOrder: number;
}

/**
 * Response from move ticket endpoint.
 */
export interface MoveTicketResponse {
  success: boolean;
  ticket: KanbanTicket;

  /** Updated progress values after status change */
  progressUpdates?: {
    ticketId: number;
    parentProgress?: number;
    sprintProgress?: number;
    phaseProgress?: number;
  };
}

/**
 * Single move operation for bulk reorder.
 */
export interface BulkMoveItem {
  ticketId: number;
  status: TicketStatus;
  displayOrder: number;
}

/**
 * Request to reorder multiple tickets at once.
 * Used by PATCH /api/tickets/reorder for optimistic UI.
 */
export interface BulkReorderRequest {
  moves: BulkMoveItem[];
}

/**
 * Response from bulk reorder endpoint.
 */
export interface BulkReorderResponse {
  success: boolean;
  updated: number;
  tickets: Array<{
    id: number;
    status: TicketStatus;
    displayOrder: number;
  }>;
}

/**
 * Sprint summary for roadmap overview.
 * Extended in Sprint 15 Phase E for Phase Timeline view.
 */
export interface SprintOverview {
  id: string;
  sprintNumber: number;
  /** Global sprint number across all phases (1, 2, 3, ... n) */
  globalSprintNumber: number;
  title: string;
  status: string;
  progress: number;

  /** Date range for the sprint (ISO strings) */
  startDate?: string;
  endDate?: string;

  ticketCounts: {
    total: number;
    done: number;
    inProgress: number;
    inReview: number;
    backlog: number;
    todo: number;
  };
}

/**
 * Phase summary with nested sprints for roadmap overview.
 * Extended in Sprint 15 Phase E for Phase Timeline view.
 */
export interface PhaseOverview {
  id: string;
  title: string;
  status: string;
  progress: number;

  /** Date range for the phase (ISO strings) */
  startDate?: string;
  endDate?: string;

  sprints: SprintOverview[];
}

/**
 * Complete roadmap overview response.
 * Extended in Sprint 15 Phase E for Phase Timeline view.
 */
export interface RoadmapOverviewResponse {
  projectId: number;
  roadmapId: string;
  title: string;
  phases: PhaseOverview[];

  /** ID of the current/active phase for default selection */
  currentPhaseId?: string;

  /** Global sprint number of the current sprint (for cross-phase navigation) */
  currentGlobalSprintNumber?: number;

  stats: {
    totalPhases: number;
    totalSprints: number;
    totalTickets: number;
    completedTickets: number;
    inProgressTickets: number;
    inReviewTickets: number;
    overallProgress: number;
  };
}
