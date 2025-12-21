/**
 * Progress Roll-Up Utilities
 *
 * Sprint 12: Updated for 4-level hierarchy:
 * Day → Week → Sprint → Phase
 *
 * Task and Session models removed - progress now tracks at Day level and above
 *
 * Architecture Decision: Incremental transactions (one level at a time)
 * - Prevents deadlocks by releasing locks quickly
 * - Uses row-level locking (FOR UPDATE) for concurrent safety
 * - Prisma aggregation for performance
 *
 * @see apps/web/prisma/schema.prisma for model definitions
 */

import { prisma } from '@/lib/db';
import { Status } from '@prisma/client';

/**
 * Propagation result type
 * Tracks which entities were updated during progress roll-up
 */
export interface PropagationResult {
  entity: {
    id: string;
    type: 'day' | 'week' | 'sprint' | 'phase';
    progress: number;
    status: Status;
  };
  propagated: Array<{
    id: string;
    type: 'week' | 'sprint' | 'phase';
    progress: number;
    status: Status;
  }>;
}

/**
 * Update progress and propagate to parent (one level at a time)
 * Uses row-level locking to prevent race conditions
 *
 * @param entityId - ID of the entity to update
 * @param entityType - Type of entity (day, week, sprint, phase)
 * @param newProgress - New progress value (0-100)
 * @param _propagatedEntities - Internal accumulator for tracking propagated entities
 * @returns Propagation result with updated entity and all affected parents
 *
 * @example
 * // Update Day to 100%, propagates to Week → Sprint → Phase
 * const result = await updateProgressAndPropagate('day1', 'day', 100);
 * console.log(result.propagated); // [Week, Sprint, Phase]
 */
export async function updateProgressAndPropagate(
  entityId: string,
  entityType: 'day' | 'week' | 'sprint' | 'phase',
  newProgress: number,
  _propagatedEntities: Array<{
    id: string;
    type: 'week' | 'sprint' | 'phase';
    progress: number;
    status: Status;
  }> = []
): Promise<PropagationResult> {
  // Validate progress range (0-100)
  if (newProgress < 0 || newProgress > 100) {
    throw new Error(`Progress must be 0-100, got ${newProgress}`);
  }

  // 1. Update current entity and calculate parent progress in transaction
  const { parentInfo, updatedEntity } = await prisma.$transaction(async (tx) => {
    let parentId: string | null = null;
    let parentType: 'week' | 'sprint' | 'phase' | null = null;
    let updatedEntity: { id: string; progress: number; status: Status } & Record<string, unknown>;

    switch (entityType) {
      case 'day': {
        const result = await tx.day.update({
          where: { id: entityId },
          data: {
            progress: newProgress,
            status: determineStatus(newProgress),
            updatedAt: new Date(),
          },
          select: { id: true, progress: true, status: true, weekId: true },
        });
        updatedEntity = result;
        parentId = result.weekId;
        parentType = 'week';
        break;
      }
      case 'week': {
        const result = await tx.week.update({
          where: { id: entityId },
          data: {
            progress: newProgress,
            status: determineStatus(newProgress),
            updatedAt: new Date(),
          },
          select: { id: true, progress: true, status: true, sprintId: true },
        });
        updatedEntity = result;
        parentId = result.sprintId;
        parentType = 'sprint';
        break;
      }
      case 'sprint': {
        const result = await tx.sprint.update({
          where: { id: entityId },
          data: {
            progress: newProgress,
            status: determineStatus(newProgress),
            updatedAt: new Date(),
          },
          select: { id: true, progress: true, status: true, phaseId: true },
        });
        updatedEntity = result;
        parentId = result.phaseId;
        parentType = 'phase';
        break;
      }
      case 'phase': {
        const result = await tx.phase.update({
          where: { id: entityId },
          data: {
            progress: newProgress,
            status: determineStatus(newProgress),
            updatedAt: new Date(),
          },
          select: { id: true, progress: true, status: true },
        });
        updatedEntity = result;
        // Phase is root, no parent
        break;
      }
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }

    return {
      parentInfo: parentId && parentType ? { parentId, parentType } : null,
      updatedEntity,
    };
  });

  // 2. If we have a parent, calculate its new progress and propagate
  if (parentInfo) {
    const parentProgress = await calculateAggregateProgress(
      parentInfo.parentId,
      parentInfo.parentType
    );

    // Recursively propagate to parent
    const parentResult = await updateProgressAndPropagate(
      parentInfo.parentId,
      parentInfo.parentType,
      parentProgress,
      _propagatedEntities
    );

    // Add parent to propagated list
    _propagatedEntities.push({
      id: parentInfo.parentId,
      type: parentInfo.parentType,
      progress: parentProgress,
      status: determineStatus(parentProgress),
    });

    return {
      entity: {
        id: updatedEntity.id,
        type: entityType,
        progress: updatedEntity.progress,
        status: updatedEntity.status,
      },
      propagated: [..._propagatedEntities, ...parentResult.propagated],
    };
  }

  return {
    entity: {
      id: updatedEntity.id,
      type: entityType,
      progress: updatedEntity.progress,
      status: updatedEntity.status,
    },
    propagated: _propagatedEntities,
  };
}

/**
 * Calculate aggregate progress for a parent entity
 * Uses Prisma aggregation for performance
 */
async function calculateAggregateProgress(
  parentId: string,
  parentType: 'week' | 'sprint' | 'phase'
): Promise<number> {
  switch (parentType) {
    case 'week': {
      const result = await prisma.day.aggregate({
        where: { weekId: parentId },
        _avg: { progress: true },
      });
      return Math.round(result._avg.progress ?? 0);
    }
    case 'sprint': {
      const result = await prisma.week.aggregate({
        where: { sprintId: parentId },
        _avg: { progress: true },
      });
      return Math.round(result._avg.progress ?? 0);
    }
    case 'phase': {
      const result = await prisma.sprint.aggregate({
        where: { phaseId: parentId },
        _avg: { progress: true },
      });
      return Math.round(result._avg.progress ?? 0);
    }
    default:
      throw new Error(`Invalid parent type: ${parentType}`);
  }
}

/**
 * Determine status based on progress percentage
 */
function determineStatus(progress: number): Status {
  if (progress === 0) return 'NOT_STARTED';
  if (progress === 100) return 'COMPLETED';
  return 'IN_PROGRESS';
}

/**
 * Bulk progress initialization (for roadmap materialization)
 * Sets all entities in a phase tree to initial state
 */
export async function initializePhaseProgress(phaseId: string): Promise<void> {
  await prisma.$transaction([
    // Reset phase
    prisma.phase.update({
      where: { id: phaseId },
      data: { progress: 0, status: 'NOT_STARTED' },
    }),
    // Reset sprints
    prisma.sprint.updateMany({
      where: { phaseId },
      data: { progress: 0, status: 'NOT_STARTED' },
    }),
    // Reset weeks
    prisma.week.updateMany({
      where: { sprint: { phaseId } },
      data: { progress: 0, status: 'NOT_STARTED' },
    }),
    // Reset days
    prisma.day.updateMany({
      where: { week: { sprint: { phaseId } } },
      data: { progress: 0, status: 'NOT_STARTED' },
    }),
  ]);
}

/**
 * Get progress summary for a phase
 * Returns counts and averages at each level
 */
export async function getPhaseProgressSummary(phaseId: string) {
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      sprints: {
        include: {
          weeks: {
            include: {
              days: true,
            },
          },
        },
      },
    },
  });

  if (!phase) return null;

  const sprints = phase.sprints;
  const weeks = sprints.flatMap((s) => s.weeks);
  const days = weeks.flatMap((w) => w.days);

  return {
    phase: {
      id: phase.id,
      title: phase.title,
      progress: phase.progress,
      status: phase.status,
    },
    counts: {
      sprints: sprints.length,
      weeks: weeks.length,
      days: days.length,
    },
    completed: {
      sprints: sprints.filter((s) => s.status === 'COMPLETED').length,
      weeks: weeks.filter((w) => w.status === 'COMPLETED').length,
      days: days.filter((d) => d.status === 'COMPLETED').length,
    },
    averages: {
      sprintProgress:
        sprints.length > 0
          ? Math.round(sprints.reduce((sum, s) => sum + s.progress, 0) / sprints.length)
          : 0,
      weekProgress:
        weeks.length > 0
          ? Math.round(weeks.reduce((sum, w) => sum + w.progress, 0) / weeks.length)
          : 0,
      dayProgress:
        days.length > 0
          ? Math.round(days.reduce((sum, d) => sum + d.progress, 0) / days.length)
          : 0,
    },
  };
}
