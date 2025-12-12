/**
 * Roadmap Type Definitions - Sprint 12
 *
 * Shared types for roadmap-related components
 * These types match the actual Prisma query selections in roadmap page
 *
 * Sprint 12: Updated for 4-level hierarchy (Task model removed)
 */

import type { Roadmap, Phase, Sprint, Week, Day, Ticket } from '@prisma/client';

/**
 * Scheduled ticket type for week view
 */
export type ScheduledTicket = Pick<
  Ticket,
  'id' | 'title' | 'status' | 'priority' | 'estimatedDays' | 'scheduledDays'
>;

/**
 * Day type with all required fields (as selected in getRoadmap query)
 * Sprint 12: Tasks removed - days are now leaf nodes
 */
export type RoadmapDay = Pick<
  Day,
  'id' | 'title' | 'description' | 'status' | 'progress' | 'startDate' | 'endDate' | 'weekId' | 'createdAt' | 'updatedAt'
>;

/**
 * Week type with days relation and scheduled tickets
 */
export type RoadmapWeek = Week & {
  days: RoadmapDay[];
  scheduledTickets?: ScheduledTicket[];
};

/**
 * Sprint type with weeks relation
 */
export type RoadmapSprint = Sprint & {
  weeks: RoadmapWeek[];
};

/**
 * Phase type with sprints relation
 */
export type RoadmapPhase = Phase & {
  sprints: RoadmapSprint[];
};

/**
 * Complete roadmap with nested 4-level hierarchy
 */
export type RoadmapWithRelations = Roadmap & {
  phases_rel: RoadmapPhase[];
};
