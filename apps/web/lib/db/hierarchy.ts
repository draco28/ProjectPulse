/**
 * Hierarchy Tree Query Helpers
 *
 * Utilities for traversing 5-level hierarchy:
 * Phase → Week → Day → Task → Session
 *
 * Optimized with Prisma's type-safe queries and proper indexing
 *
 * @see apps/web/prisma/schema.prisma for model definitions
 */

import { prisma } from '@/lib/db';
import type { Phase, Week, Day, Task, Session } from '@prisma/client';

/**
 * Full tree type with all nested relations
 */
export type PhaseWithFullTree = Phase & {
  weeks: (Week & {
    days: (Day & {
      tasks: (Task & {
        sessions: Session[];
      })[];
    })[];
  })[];
};

/**
 * Get full tree (Phase with all nested children)
 * Use for: Tree visualization, full context loading, integrity checks
 *
 * @param phaseId - Root Phase ID
 * @returns Phase with all nested relations (Week → Day → Task → Session)
 *
 * @example
 * const tree = await getFullTree('phase1');
 * console.log(tree.weeks[0].days[0].tasks[0].sessions.length);
 */
export async function getFullTree(phaseId: string): Promise<PhaseWithFullTree | null> {
  return prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      weeks: {
        orderBy: { startDate: 'asc' },
        include: {
          days: {
            orderBy: { startDate: 'asc' },
            include: {
              tasks: {
                orderBy: { startDate: 'asc' },
                include: {
                  sessions: {
                    orderBy: { startDate: 'asc' },
                  },
                },
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
 * // Get all Days under Week 1
 * const days = await getChildren('week1', 'week');
 *
 * // Get all Sessions under Task 1
 * const sessions = await getChildren('task1', 'task');
 */
export async function getChildren<T extends 'phase' | 'week' | 'day' | 'task'>(
  parentId: string,
  level: T
): Promise<ChildType<T>[]> {
  switch (level) {
    case 'phase':
      return (await prisma.week.findMany({
        where: { phaseId: parentId },
        orderBy: { startDate: 'asc' },
      })) as ChildType<T>[];
    case 'week':
      return (await prisma.day.findMany({
        where: { weekId: parentId },
        orderBy: { startDate: 'asc' },
      })) as ChildType<T>[];
    case 'day':
      return (await prisma.task.findMany({
        where: { dayId: parentId },
        orderBy: { startDate: 'asc' },
      })) as ChildType<T>[];
    case 'task':
      return (await prisma.session.findMany({
        where: { taskId: parentId },
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
 * // Get parent Week of Day 3
 * const week = await getParent('day3', 'day');
 *
 * // Get parent Task of Session 5
 * const task = await getParent('session5', 'session');
 */
export async function getParent<T extends 'week' | 'day' | 'task' | 'session'>(
  childId: string,
  level: T
): Promise<ParentType<T> | null> {
  switch (level) {
    case 'week': {
      const week = await prisma.week.findUnique({
        where: { id: childId },
        include: { phase: true },
      });
      return (week?.phase ?? null) as ParentType<T>;
    }
    case 'day': {
      const day = await prisma.day.findUnique({
        where: { id: childId },
        include: { week: true },
      });
      return (day?.week ?? null) as ParentType<T>;
    }
    case 'task': {
      const task = await prisma.task.findUnique({
        where: { id: childId },
        include: { day: true },
      });
      return (task?.day ?? null) as ParentType<T>;
    }
    case 'session': {
      const session = await prisma.session.findUnique({
        where: { id: childId },
        include: { task: true },
      });
      return (session?.task ?? null) as ParentType<T>;
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
 * // Get all descendant IDs under Week 1 (Days + Tasks + Sessions)
 * const descendantIds = await getAllDescendants('week1', 'week');
 */
export async function getAllDescendants(
  entityId: string,
  entityType: 'phase' | 'week' | 'day' | 'task' | 'session'
): Promise<string[]> {
  const descendants: string[] = [];

  switch (entityType) {
    case 'phase': {
      const weeks = await prisma.week.findMany({
        where: { phaseId: entityId },
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
      for (const day of days) {
        descendants.push(...(await getAllDescendants(day.id, 'day')));
      }
      break;
    }
    case 'day': {
      const tasks = await prisma.task.findMany({
        where: { dayId: entityId },
        select: { id: true },
      });
      descendants.push(...tasks.map((t) => t.id));
      for (const task of tasks) {
        descendants.push(...(await getAllDescendants(task.id, 'task')));
      }
      break;
    }
    case 'task': {
      const sessions = await prisma.session.findMany({
        where: { taskId: entityId },
        select: { id: true },
      });
      descendants.push(...sessions.map((s) => s.id));
      break;
    }
    case 'session': {
      // Sessions are leaf nodes, no descendants
      break;
    }
  }

  return descendants;
}

/**
 * Get current active task (first IN_PROGRESS task in tree)
 * Use for: Agent context, workflow tracking, status displays
 *
 * @param phaseId - Root Phase ID
 * @returns Active Task with parent context, or null
 *
 * @example
 * const activeTask = await getCurrentTask('phase1');
 * console.log(`Working on: ${activeTask?.day.week.phase.title} / ${activeTask?.day.title} / ${activeTask?.title}`);
 */
export async function getCurrentTask(phaseId: string) {
  return prisma.task.findFirst({
    where: {
      status: 'IN_PROGRESS',
      day: {
        week: {
          phaseId,
        },
      },
    },
    include: {
      day: {
        include: {
          week: {
            include: {
              phase: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { startDate: 'desc' },
        take: 5, // Most recent 5 sessions
      },
    },
    orderBy: { startDate: 'asc' }, // Earliest IN_PROGRESS task
  });
}

/**
 * Type helpers for generic functions
 */
type ChildType<T> = T extends 'phase'
  ? Week
  : T extends 'week'
    ? Day
    : T extends 'day'
      ? Task
      : T extends 'task'
        ? Session
        : never;

type ParentType<T> = T extends 'week'
  ? Phase
  : T extends 'day'
    ? Week
    : T extends 'task'
      ? Day
      : T extends 'session'
        ? Task
        : never;
