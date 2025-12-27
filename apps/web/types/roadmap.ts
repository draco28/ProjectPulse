/**
 * Roadmap Type Definitions
 *
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 * Shared types for roadmap-related components
 * These types match the actual Prisma query selections in roadmap page
 */

import type { Roadmap, Phase, Sprint, Ticket } from '@prisma/client';

/**
 * Scheduled ticket type for sprint view
 * Sprint 15: Tickets now link directly to Sprint (Ticket #80)
 */
export type ScheduledTicket = Pick<
  Ticket,
  'id' | 'title' | 'status' | 'priority' | 'kind' | 'estimatedDays'
>;

/**
 * Sprint type with tickets relation
 * Sprint 15: Week/Day removed (Ticket #80)
 */
export type RoadmapSprint = Sprint & {
  tickets?: ScheduledTicket[];
};

/**
 * Phase type with sprints relation
 */
export type RoadmapPhase = Phase & {
  sprints: RoadmapSprint[];
};

/**
 * Complete roadmap with nested 2-level hierarchy
 * Sprint 15: Week/Day removed (Ticket #80)
 */
export type RoadmapWithRelations = Roadmap & {
  phases_rel: RoadmapPhase[];
};

// ============================================================================
// DEPRECATED TYPES (kept for backward compatibility during migration)
// ============================================================================

/**
 * @deprecated Sprint 15: Day model removed (Ticket #80)
 */
export type RoadmapDay = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress: number;
  startDate?: Date | null;
  endDate?: Date | null;
  weekId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * @deprecated Sprint 15: Week model removed (Ticket #80)
 */
export type RoadmapWeek = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress: number;
  startDate?: Date | null;
  endDate?: Date | null;
  sprintId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  days?: RoadmapDay[];
  scheduledTickets?: ScheduledTicket[];
};
