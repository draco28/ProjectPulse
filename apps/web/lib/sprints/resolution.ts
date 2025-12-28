/**
 * Sprint Resolution Utilities
 *
 * Provides deterministic sprint resolution with global numbering.
 * All sprint queries use consistent ordering to ensure same input = same output.
 *
 * Design Decision: sprintNumber is globally unique per roadmap (1, 2, 3... 13),
 * not per-phase. This simplifies queries and aligns with roadmap materialization.
 *
 * @see Ticket #91 - "Auto-resolution of sprintNumber picks wrong sprint"
 * @see docs/UNIFIED-PROJECT-ROUTING.md for project-scoping patterns
 */

import type { PrismaClient, Prisma } from '@prisma/client';

// Type alias for Prisma transaction client
type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Standard ordering for sprint queries.
 *
 * Orders by phase.startDate first, then sprintNumber, then id (tiebreaker).
 * This handles both global and per-phase numbering schemes correctly:
 * - Global numbering: sprintNumber is unique, phase order is redundant but harmless
 * - Per-phase numbering: phase order ensures Phase 1 Sprint 1 < Phase 2 Sprint 1
 */
export const SPRINT_ORDER_BY: Prisma.SprintOrderByWithRelationInput[] = [
  { phase: { startDate: 'asc' } },
  { sprintNumber: 'asc' },
  { id: 'asc' }, // Tiebreaker for safety
];

/**
 * Resolve sprintId from sprintNumber with deterministic ordering.
 *
 * This function ensures that the same sprintNumber always resolves to
 * the same sprint, regardless of database insertion order or internal
 * PostgreSQL row ordering.
 *
 * @param prisma - Prisma client or transaction client
 * @param projectId - Project ID for scoping (ensures multi-tenancy isolation)
 * @param sprintNumber - Global sprint number to resolve (1-indexed)
 * @returns Sprint ID (cuid) or null if not found
 *
 * @example
 * ```typescript
 * const sprintId = await resolveSprintByNumber(prisma, 6, 1);
 * // Returns: "cmjhi41nl00062wethglvcyn4" (Sprint 1 of project 6)
 * ```
 */
export async function resolveSprintByNumber(
  prisma: PrismaClient | PrismaTransactionClient,
  projectId: number,
  sprintNumber: number
): Promise<string | null> {
  const sprint = await prisma.sprint.findFirst({
    where: {
      sprintNumber,
      phase: { roadmap: { projectId } },
    },
    orderBy: SPRINT_ORDER_BY,
    select: { id: true },
  });

  return sprint?.id ?? null;
}

/**
 * Find the next sprint in sequence after the given sprint.
 *
 * Uses ordered traversal by sprintNumber (globally unique) rather than
 * incrementing sprintNumber by 1. This correctly handles:
 * - Phase boundaries (Sprint 3 in Phase 1 → Sprint 4 in Phase 2)
 * - Gaps in sprint numbers (if any exist)
 * - End of roadmap detection
 *
 * @param prisma - Prisma client or transaction client
 * @param currentSprintId - Current sprint ID (cuid)
 * @returns Next sprint reference or null if at end of roadmap
 *
 * @example
 * ```typescript
 * const next = await findNextSprint(prisma, "cmjhi41nl00062wethglvcyn4");
 * // Returns: { id: "cmjhi41nl00072wethglvcyn5", phaseId: "cmjhi41nl00012wethglvcyn1" }
 * ```
 */
export async function findNextSprint(
  prisma: PrismaClient | PrismaTransactionClient,
  currentSprintId: string
): Promise<{ id: string; phaseId: string } | null> {
  // First, get current sprint's context
  const current = await prisma.sprint.findUnique({
    where: { id: currentSprintId },
    select: {
      sprintNumber: true,
      phase: { select: { roadmapId: true } },
    },
  });

  if (!current?.phase?.roadmapId) {
    return null;
  }

  // Find the sprint with the next higher sprintNumber in the same roadmap
  const nextSprint = await prisma.sprint.findFirst({
    where: {
      phase: { roadmapId: current.phase.roadmapId },
      sprintNumber: { gt: current.sprintNumber },
    },
    orderBy: SPRINT_ORDER_BY,
    select: { id: true, phaseId: true },
  });

  return nextSprint;
}

/**
 * Get all sprints for a project in order.
 *
 * Useful for displaying sprint selection dropdowns or
 * building sprint navigation UI.
 *
 * @param prisma - Prisma client or transaction client
 * @param projectId - Project ID for scoping
 * @returns Array of sprints with basic info, ordered by sprintNumber
 */
export async function getOrderedSprints(
  prisma: PrismaClient | PrismaTransactionClient,
  projectId: number
): Promise<Array<{ id: string; sprintNumber: number; title: string; phaseId: string }>> {
  const sprints = await prisma.sprint.findMany({
    where: {
      phase: { roadmap: { projectId } },
    },
    orderBy: SPRINT_ORDER_BY,
    select: {
      id: true,
      sprintNumber: true,
      title: true,
      phaseId: true,
    },
  });

  return sprints;
}
