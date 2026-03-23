/**
 * Progress Calculator Service - Sprint 15 Phase B
 *
 * Calculates and cascades progress through the hierarchy:
 * - Parent ticket progress (from child tickets)
 * - Sprint progress (from tickets via sprintId FK)
 * - Phase progress (from sprints)
 *
 * Progress is count-based: (done / total) * 100
 *
 * @example
 * ```typescript
 * import { calculateAndCascadeProgress } from '@/lib/tickets/progress-calculator';
 *
 * // After changing a ticket's status:
 * const result = await calculateAndCascadeProgress(prisma, ticketId);
 * // result.sprintProgress = 75, result.phaseProgress = 50, etc.
 * ```
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import { TICKET_STATUSES } from '@/lib/constants/status';
import { findNextSprint } from '@/lib/sprints/resolution';

/**
 * Result of progress calculation and cascade.
 */
export interface ProgressCascadeResult {
  ticketId: number;
  parentTicketId?: number | null;
  parentProgress?: number;
  sprintId?: string | null;
  sprintProgress?: number;
  phaseId?: string | null;
  phaseProgress?: number;
  autoCompletedSprint?: boolean;
  /** Sprint 15: Auto-activated next sprint when current completed */
  autoActivatedNextSprint?: boolean;
  nextSprintId?: string | null;
  /** Sprint 15: Auto-activated next phase when current phase's last sprint completed */
  autoActivatedNextPhase?: boolean;
  nextPhaseId?: string | null;
}

/**
 * Progress summary for a sprint.
 */
export interface SprintProgressSummary {
  sprintId: string;
  total: number;
  done: number;
  inProgress: number;
  progress: number;
}

/**
 * Check if a status is considered "completed" for progress calculation.
 */
export function isCompletedStatus(status: string): boolean {
  return status === TICKET_STATUSES.DONE;
}

/**
 * Calculate progress as a percentage (0-100).
 * Returns 0 if total is 0 to avoid division by zero.
 */
function calculatePercentage(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/**
 * Calculate parent ticket progress from child tickets.
 *
 * Progress = (completed children / total children) * 100
 *
 * @param prisma - Prisma client or transaction client
 * @param parentTicketId - Parent ticket ID
 * @returns Progress percentage (0-100)
 */
export async function calculateParentProgress(
  prisma: PrismaClient | Prisma.TransactionClient,
  parentTicketId: number
): Promise<number> {
  const children = await prisma.ticket.findMany({
    where: { parentTicketId },
    select: { status: true },
  });

  if (children.length === 0) return 0;

  const completedCount = children.filter((c) => isCompletedStatus(c.status)).length;
  return calculatePercentage(completedCount, children.length);
}

/**
 * Calculate sprint progress from tickets (using sprintId FK).
 *
 * Progress = (done tickets / total tickets) * 100
 *
 * @param prisma - Prisma client or transaction client
 * @param sprintId - Sprint ID
 * @returns Progress summary with counts and percentage
 */
export async function calculateSprintProgress(
  prisma: PrismaClient | Prisma.TransactionClient,
  sprintId: string
): Promise<SprintProgressSummary> {
  const tickets = await prisma.ticket.findMany({
    where: { sprintId },
    select: { status: true },
  });

  const total = tickets.length;
  const done = tickets.filter((t) => isCompletedStatus(t.status)).length;
  const inProgress = tickets.filter((t) => t.status === TICKET_STATUSES.IN_PROGRESS).length;
  const progress = calculatePercentage(done, total);

  return {
    sprintId,
    total,
    done,
    inProgress,
    progress,
  };
}

/**
 * Calculate phase progress from sprints.
 *
 * Progress = average of sprint progresses
 *
 * @param prisma - Prisma client or transaction client
 * @param phaseId - Phase ID
 * @returns Progress percentage (0-100)
 */
export async function calculatePhaseProgress(
  prisma: PrismaClient | Prisma.TransactionClient,
  phaseId: string
): Promise<number> {
  const sprints = await prisma.sprint.findMany({
    where: { phaseId },
    select: { progress: true },
  });

  if (sprints.length === 0) return 0;

  const totalProgress = sprints.reduce((sum, s) => sum + s.progress, 0);
  return Math.round(totalProgress / sprints.length);
}

/**
 * Update sprint progress in database and optionally auto-complete.
 *
 * @param prisma - Prisma client or transaction client
 * @param sprintId - Sprint ID
 * @param progress - New progress value (0-100)
 * @returns Whether sprint was auto-completed
 */
async function updateSprintProgress(
  prisma: PrismaClient | Prisma.TransactionClient,
  sprintId: string,
  progress: number
): Promise<boolean> {
  const autoComplete = progress === 100;

  await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      progress,
      // Auto-complete sprint when 100%
      ...(autoComplete && { status: 'COMPLETED' }),
    },
  });

  return autoComplete;
}

/**
 * Update phase progress in database.
 *
 * @param prisma - Prisma client or transaction client
 * @param phaseId - Phase ID
 * @param progress - New progress value (0-100)
 */
async function updatePhaseProgress(
  prisma: PrismaClient | Prisma.TransactionClient,
  phaseId: string,
  progress: number
): Promise<void> {
  await prisma.phase.update({
    where: { id: phaseId },
    data: {
      progress,
      // Auto-complete phase when 100%
      ...(progress === 100 && { status: 'COMPLETED' }),
    },
  });
}

/**
 * Sprint 15: Activate next sprint when current sprint completes.
 *
 * Uses findNextSprint helper to find next sprint by global ordering.
 * This correctly handles phase boundaries and gaps in sprint numbers.
 * If next sprint is in a different phase, also activates that phase.
 *
 * Ticket #91: Fixed to use deterministic ordering instead of sprintNumber + 1
 *
 * @param prisma - Transaction client
 * @param currentSprintId - Sprint that just completed
 * @returns Info about activated sprint/phase, or null if no next sprint
 */
async function activateNextSprint(
  prisma: Prisma.TransactionClient,
  currentSprintId: string
): Promise<{ nextSprintId: string; nextPhaseId?: string } | null> {
  // Get current sprint's phase for comparison
  const currentSprint = await prisma.sprint.findUnique({
    where: { id: currentSprintId },
    select: { phaseId: true },
  });

  if (!currentSprint) {
    return null;
  }

  // Ticket #91: Use helper with deterministic ordering (global numbering)
  // This correctly finds next sprint by sprintNumber > current, ordered by sprintNumber ASC
  const nextSprintRef = await findNextSprint(prisma, currentSprintId);

  if (!nextSprintRef) {
    return null; // No more sprints - roadmap complete!
  }

  // Activate next sprint
  await prisma.sprint.update({
    where: { id: nextSprintRef.id },
    data: { status: 'IN_PROGRESS' },
  });

  let nextPhaseId: string | undefined;

  // If next sprint is in a different phase, activate that phase too
  if (nextSprintRef.phaseId !== currentSprint.phaseId) {
    await prisma.phase.update({
      where: { id: nextSprintRef.phaseId },
      data: { status: 'IN_PROGRESS' },
    });
    nextPhaseId = nextSprintRef.phaseId;
  }

  return {
    nextSprintId: nextSprintRef.id,
    nextPhaseId,
  };
}

/**
 * Calculate and cascade progress after a ticket status change.
 *
 * This function:
 * 1. Fetches the ticket to get hierarchy context
 * 2. Updates parent ticket progress (if has parent)
 * 3. Updates sprint progress (if has sprintId)
 * 4. Updates phase progress (if sprint has phase)
 *
 * All updates happen in a transaction for consistency.
 *
 * @param prisma - Prisma client
 * @param ticketId - Ticket that was changed
 * @returns Progress cascade result with updated values
 */
export async function calculateAndCascadeProgress(
  prisma: PrismaClient,
  ticketId: number
): Promise<ProgressCascadeResult> {
  // Fetch ticket with hierarchy context
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      status: true,
      parentTicketId: true,
      sprintId: true,
      sprint: {
        select: {
          id: true,
          phaseId: true,
        },
      },
    },
  });

  if (!ticket) {
    return { ticketId };
  }

  const result: ProgressCascadeResult = {
    ticketId,
    parentTicketId: ticket.parentTicketId,
    sprintId: ticket.sprintId,
    phaseId: ticket.sprint?.phaseId,
  };

  // Use transaction for consistency
  await prisma.$transaction(async (tx) => {
    // 1. Update parent ticket progress
    if (ticket.parentTicketId) {
      result.parentProgress = await calculateParentProgress(tx, ticket.parentTicketId);
      // Note: We don't store progress on parent ticket model,
      // it's calculated on-demand for display
    }

    // 2. Update sprint progress
    if (ticket.sprintId) {
      const sprintSummary = await calculateSprintProgress(tx, ticket.sprintId);
      result.sprintProgress = sprintSummary.progress;
      result.autoCompletedSprint = await updateSprintProgress(
        tx,
        ticket.sprintId,
        sprintSummary.progress
      );

      // Sprint 15: Auto-activate next sprint when current completes
      if (result.autoCompletedSprint) {
        const nextActivation = await activateNextSprint(tx, ticket.sprintId);
        if (nextActivation) {
          result.autoActivatedNextSprint = true;
          result.nextSprintId = nextActivation.nextSprintId;
          if (nextActivation.nextPhaseId) {
            result.autoActivatedNextPhase = true;
            result.nextPhaseId = nextActivation.nextPhaseId;
          }
        }
      }

      // 3. Update phase progress (if sprint has phase)
      if (ticket.sprint?.phaseId) {
        result.phaseProgress = await calculatePhaseProgress(tx, ticket.sprint.phaseId);
        await updatePhaseProgress(tx, ticket.sprint.phaseId, result.phaseProgress);
      }
    }
  });

  return result;
}

/**
 * Recalculate progress for an entire sprint (useful for bulk operations).
 *
 * @param prisma - Prisma client
 * @param sprintId - Sprint ID to recalculate
 * @returns Updated sprint progress
 */
export async function recalculateSprintProgress(
  prisma: PrismaClient,
  sprintId: string
): Promise<SprintProgressSummary> {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { phaseId: true },
  });

  const summary = await calculateSprintProgress(prisma, sprintId);

  await prisma.$transaction(async (tx) => {
    await updateSprintProgress(tx, sprintId, summary.progress);

    if (sprint?.phaseId) {
      const phaseProgress = await calculatePhaseProgress(tx, sprint.phaseId);
      await updatePhaseProgress(tx, sprint.phaseId, phaseProgress);
    }
  });

  return summary;
}

/**
 * Get progress statistics for a sprint (read-only, no updates).
 *
 * @param prisma - Prisma client
 * @param sprintId - Sprint ID
 * @returns Progress statistics with column counts
 */
export async function getSprintProgressStats(
  prisma: PrismaClient | Prisma.TransactionClient,
  sprintId: string
): Promise<{
  total: number;
  backlog: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  progress: number;
}> {
  const tickets = await prisma.ticket.findMany({
    where: { sprintId },
    select: { status: true },
  });

  const total = tickets.length;
  const backlog = tickets.filter((t) => t.status === TICKET_STATUSES.BACKLOG).length;
  const todo = tickets.filter((t) => t.status === TICKET_STATUSES.TODO).length;
  const inProgress = tickets.filter((t) => t.status === TICKET_STATUSES.IN_PROGRESS).length;
  const inReview = tickets.filter((t) => t.status === TICKET_STATUSES.IN_REVIEW).length;
  const done = tickets.filter((t) => t.status === TICKET_STATUSES.DONE).length;
  const progress = calculatePercentage(done, total);

  return {
    total,
    backlog,
    todo,
    inProgress,
    inReview,
    done,
    progress,
  };
}
