/**
 * Hierarchy Tree Query Helpers
 *
 * Sprint 15: Updated for 2-level hierarchy:
 * Phase → Sprint
 *
 * Week and Day models removed (Ticket #80)
 * Tickets now link directly to Sprint via sprintId FK for Kanban board
 *
 * @see apps/web/prisma/schema.prisma for model definitions
 */

import { prisma } from '@/lib/db';
import type { Phase, Sprint } from '@prisma/client';

/**
 * Full tree type with nested Sprint relations
 */
export type PhaseWithFullTree = Phase & {
  sprints: Sprint[];
};

/**
 * Get full tree (Phase with all Sprints)
 * Use for: Tree visualization, full context loading, integrity checks
 *
 * @param phaseId - Root Phase ID
 * @returns Phase with all nested Sprints
 *
 * @example
 * const tree = await getFullTree('phase1');
 * console.log(tree.sprints.length);
 */
export async function getFullTree(phaseId: string): Promise<PhaseWithFullTree | null> {
  return prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      sprints: {
        orderBy: { startDate: 'asc' },
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
 */
export async function getChildren<T extends 'phase'>(
  parentId: string,
  level: T
): Promise<Sprint[]> {
  if (level === 'phase') {
    return prisma.sprint.findMany({
      where: { phaseId: parentId },
      orderBy: { startDate: 'asc' },
    });
  }
  throw new Error(`Invalid level: ${level}`);
}

/**
 * Get parent by child ID (generic, type-safe)
 *
 * @param childId - Child entity ID
 * @param level - Child level (determines parent type)
 * @returns Parent entity or null
 *
 * @example
 * // Get parent Phase of Sprint 1
 * const phase = await getParent('sprint1', 'sprint');
 */
export async function getParent<T extends 'sprint'>(
  childId: string,
  level: T
): Promise<Phase | null> {
  if (level === 'sprint') {
    const sprint = await prisma.sprint.findUnique({
      where: { id: childId },
      include: { phase: true },
    });
    return sprint?.phase ?? null;
  }
  throw new Error(`Invalid level: ${level}`);
}

/**
 * Get all descendants (recursive traversal)
 * Use for: Bulk operations, cascade actions, reporting
 *
 * Sprint 15: Simplified to Phase → Sprint only
 *
 * @param entityId - Starting entity ID
 * @param entityType - Starting entity type
 * @returns Array of all descendant IDs
 *
 * @example
 * // Get all Sprint IDs under Phase 1
 * const descendantIds = await getAllDescendants('phase1', 'phase');
 */
export async function getAllDescendants(
  entityId: string,
  entityType: 'phase' | 'sprint'
): Promise<string[]> {
  const descendants: string[] = [];

  if (entityType === 'phase') {
    const sprints = await prisma.sprint.findMany({
      where: { phaseId: entityId },
      select: { id: true },
    });
    descendants.push(...sprints.map((s) => s.id));
  }
  // Sprint is now a leaf node (no children)

  return descendants;
}

/**
 * Get current work for a project
 * Sprint 15: Returns tickets assigned to IN_PROGRESS sprints
 *
 * @param projectId - Project ID
 * @returns Tickets from active sprints, or empty array
 *
 * @example
 * const currentWork = await getCurrentWork(1);
 */
export async function getCurrentWork(projectId: number) {
  // Find active sprint for this project
  const activeSprint = await prisma.sprint.findFirst({
    where: {
      phase: {
        roadmap: { projectId },
      },
      status: 'IN_PROGRESS',
    },
    select: { id: true },
  });

  if (!activeSprint) {
    return [];
  }

  return prisma.ticket.findMany({
    where: {
      projectId,
      sprintId: activeSprint.id,
      status: { notIn: ['done', 'closed'] },
    },
    include: {
      sprint: {
        include: {
          phase: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
}
