/**
 * Roadmap Type Definitions - Sprint 8.5
 *
 * Shared types for roadmap-related components
 * These types match the actual Prisma query selections in roadmap page
 */

import type { Roadmap, Phase, Sprint, Week, Day, Task } from '@prisma/client';

/**
 * Task type with selected fields and sessions
 */
export type RoadmapTask = Pick<
  Task,
  'id' | 'title' | 'description' | 'status' | 'progress'
> & {
  sessions: Array<{ id: string }>;
};

/**
 * Day type with all required fields (as selected in getRoadmap query)
 */
export type RoadmapDay = Pick<
  Day,
  'id' | 'title' | 'description' | 'status' | 'progress' | 'startDate' | 'endDate' | 'weekId' | 'createdAt' | 'updatedAt'
> & {
  tasks: RoadmapTask[];
};

/**
 * Week type with days relation
 */
export type RoadmapWeek = Week & {
  days: RoadmapDay[];
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
 * Complete roadmap with nested 5-level hierarchy
 */
export type RoadmapWithRelations = Roadmap & {
  phases_rel: RoadmapPhase[];
};
