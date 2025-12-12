/**
 * Hierarchy Tree Query Helpers
 *
 * Sprint 12: Updated for 4-level hierarchy:
 * Phase → Sprint → Week → Day
 *
 * Task and Session models removed - tickets now schedule directly to Weeks
 *
 * @see apps/web/prisma/schema.prisma for model definitions
 */

import { prisma } from '@/lib/db';
import type { Phase, Sprint, Week, Day } from '@prisma/client';

/**
 * Full tree type with all nested relations
 */
export type PhaseWithFullTree = Phase & {
  sprints: (Sprint & {
    weeks: (Week & {
      days: Day[];
    })[];
  })[];
};

/**
 * Get full tree (Phase with all nested children)
 * Use for: Tree visualization, full context loading, integrity checks
 *
 * @param phaseId - Root Phase ID
 * @returns Phase with all nested relations (Sprint → Week → Day)
 *
 * @example
 * const tree = await getFullTree('phase1');
 * console.log(tree.sprints[0].weeks[0].days.length);
 */
export async function getFullTree(phaseId: string): Promise<PhaseWithFullTree | null> {
  return prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      sprints: {
        orderBy: { startDate: 'asc' },
        include: {
          weeks: {
            orderBy: { startDate: 'asc' },
            include: {
              days: {
                orderBy: { startDate: 'asc' },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Get children by parent ID (generic, type-safe)
 *
 * @param parentId - Parent entity ID
 * @param level - Parent level (determines child type)
 * @returns Array of children
 *
 * @example
 * // Get all Sprints under Phase 1
 * const sprints = await getChildren('phase1', 'phase');
 *
 * // Get all Days under Week 1
 * const days = await getChildren('week1', 'week');
 */
export async function getChildren<T extends 'phase' | 'sprint' | 'week'>(
  parentId: string,
  level: T
): Promise<ChildType<T>[]> {
  switch (level) {
    case 'phase':
      return (await prisma.sprint.findMany({
        where: { phaseId: parentId },
        orderBy: { startDate: 'asc' },
      })) as ChildType<T>[];
    case 'sprint':
      return (await prisma.week.findMany({
        where: { sprintId: parentId },
        orderBy: { startDate: 'asc' },
      })) as ChildType<T>[];
    case 'week':
      return (await prisma.day.findMany({
        where: { weekId: parentId },
        orderBy: { startDate: 'asc' },
      })) as ChildType<T>[];
    default:
      throw new Error(`Invalid level: ${level}`);
  }
}

/**
 * Get parent by child ID (generic, type-safe)
 *
 * @param childId - Child entity ID
 * @param level - Child level (determines parent type)
 * @returns Parent entity or null
 *
 * @example
 * // Get parent Sprint of Week 3
 * const sprint = await getParent('week3', 'week');
 *
 * // Get parent Week of Day 5
 * const week = await getParent('day5', 'day');
 */
export async function getParent<T extends 'sprint' | 'week' | 'day'>(
  childId: string,
  level: T
): Promise<ParentType<T> | null> {
  switch (level) {
    case 'sprint': {
      const sprint = await prisma.sprint.findUnique({
        where: { id: childId },
        include: { phase: true },
      });
      return (sprint?.phase ?? null) as ParentType<T>;
    }
    case 'week': {
      const week = await prisma.week.findUnique({
        where: { id: childId },
        include: { sprint: true },
      });
      return (week?.sprint ?? null) as ParentType<T>;
    }
    case 'day': {
      const day = await prisma.day.findUnique({
        where: { id: childId },
        include: { week: true },
      });
      return (day?.week ?? null) as ParentType<T>;
    }
    default:
      throw new Error(`Invalid level: ${level}`);
  }
}

/**
 * Get all descendants (recursive traversal)
 * Use for: Bulk operations, cascade actions, reporting
 *
 * @param entityId - Starting entity ID
 * @param entityType - Starting entity type
 * @returns Array of all descendant IDs
 *
 * @example
 * // Get all descendant IDs under Sprint 1 (Weeks + Days)
 * const descendantIds = await getAllDescendants('sprint1', 'sprint');
 */
export async function getAllDescendants(
  entityId: string,
  entityType: 'phase' | 'sprint' | 'week' | 'day'
): Promise<string[]> {
  const descendants: string[] = [];

  switch (entityType) {
    case 'phase': {
      const sprints = await prisma.sprint.findMany({
        where: { phaseId: entityId },
        select: { id: true },
      });
      descendants.push(...sprints.map((s) => s.id));
      for (const sprint of sprints) {
        descendants.push(...(await getAllDescendants(sprint.id, 'sprint')));
      }
      break;
    }
    case 'sprint': {
      const weeks = await prisma.week.findMany({
        where: { sprintId: entityId },
        select: { id: true },
      });
      descendants.push(...weeks.map((w) => w.id));
      for (const week of weeks) {
        descendants.push(...(await getAllDescendants(week.id, 'week')));
      }
      break;
    }
    case 'week': {
      const days = await prisma.day.findMany({
        where: { weekId: entityId },
        select: { id: true },
      });
      descendants.push(...days.map((d) => d.id));
      break;
    }
    case 'day': {
      // Days are leaf nodes, no descendants
      break;
    }
  }

  return descendants;
}

/**
 * Get current work for a project
 * Sprint 12: Returns scheduled tickets instead of tasks
 *
 * @param projectId - Project ID
 * @returns Scheduled tickets with week context, or empty array
 *
 * @example
 * const scheduledWork = await getCurrentWork(1);
 */
export async function getCurrentWork(projectId: number) {
  return prisma.ticket.findMany({
    where: {
      projectId,
      scheduledWeekId: { not: null },
      status: { notIn: ['closed', 'resolved'] },
    },
    include: {
      scheduledWeek: {
        include: {
          sprint: {
            include: {
              phase: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
}

/**
 * Type helpers for generic functions
 */
type ChildType<T> = T extends 'phase'
  ? Sprint
  : T extends 'sprint'
    ? Week
    : T extends 'week'
      ? Day
      : never;

type ParentType<T> = T extends 'sprint'
  ? Phase
  : T extends 'week'
    ? Sprint
    : T extends 'day'
      ? Week
      : never;
