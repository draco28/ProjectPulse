/**
 * Roadmap Materialization
 *
 * Sprint 15: Simplified to 2-level hierarchy (Phase → Sprint)
 * Week/Day creation removed - Kanban board uses Ticket.sprintId instead
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { ParsedRoadmap, MaterializationResult } from './types.js';

const prisma = new PrismaClient();

/**
 * Materialize Roadmap: Convert phases JSON → normalized database tables
 *
 * Sprint 15: Creates 2-level hierarchy:
 * - Roadmap (existing)
 *   → Phase (created)
 *     → Sprint (created, with continuous sprintNumber)
 *
 * Tickets link to Sprints via sprintId FK for Kanban board.
 *
 * @param roadmapId - Roadmap.id to materialize
 * @returns Materialization result with created IDs
 * @throws Error if roadmap not found or transaction fails
 */
export async function materializeRoadmap(roadmapId: string): Promise<MaterializationResult> {
  console.log('[materializeRoadmap] Starting materialization for roadmap:', roadmapId);

  // 1. Fetch Roadmap with phases JSON
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: {
      id: true,
      projectId: true,
      phases: true,
    },
  });

  console.log('[materializeRoadmap] Roadmap found:', !!roadmap);

  if (!roadmap) {
    throw new Error(`Roadmap not found: ${roadmapId}`);
  }

  console.log('[materializeRoadmap] Phases JSON type:', typeof roadmap.phases);
  console.log('[materializeRoadmap] Phases JSON structure:', JSON.stringify(roadmap.phases, null, 2).slice(0, 500));

  if (!roadmap.phases) {
    throw new Error(`Roadmap ${roadmapId} has no phases JSON`);
  }

  // Parse phases JSON (stored as JSONB in database)
  const parsedRoadmap = roadmap.phases as unknown as ParsedRoadmap;
  const phases = parsedRoadmap.phases;

  console.log('[materializeRoadmap] Parsed phases array:', Array.isArray(phases) ? `Array(${phases.length})` : typeof phases);

  if (!Array.isArray(phases) || phases.length === 0) {
    console.error('[materializeRoadmap] Invalid phases structure:', {
      isArray: Array.isArray(phases),
      length: phases?.length,
      keys: typeof phases === 'object' && phases ? Object.keys(phases) : 'N/A'
    });
    throw new Error(`Invalid phases structure in roadmap ${roadmapId}. Expected { phases: [...] }, got: ${JSON.stringify(Object.keys(roadmap.phases as object))}`);
  }

  // Track created IDs
  const phaseIds: string[] = [];
  const sprintIds: string[] = [];

  // 2. Transaction: Create Phase → Sprint records
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let phaseOrder = 0;
    // Sprint counter OUTSIDE phase loop for continuous numbering across all phases
    let globalSprintOrder = 0;

    for (const phaseData of phases) {
      phaseOrder++;

      // Create Phase record
      // Hard fallback to ensure title is never undefined
      const phaseTitle = phaseData.title || phaseData.name || `Phase ${phaseOrder}`;

      // Sprint 15: First phase starts as IN_PROGRESS
      const isFirstPhase = phaseOrder === 1;

      const phase = await tx.phase.create({
        data: {
          roadmapId: roadmap.id,
          title: phaseTitle,
          description: `Phase ${phaseOrder}`,
          status: isFirstPhase ? 'IN_PROGRESS' as const : 'NOT_STARTED' as const,
          progress: 0,
          startDate: new Date(),
          endDate: null,
        },
      });

      phaseIds.push(phase.id);

      // Create Sprint records for this phase
      // Note: globalSprintOrder is declared OUTSIDE phase loop for continuous numbering
      for (const sprintData of phaseData.sprints) {
        globalSprintOrder++;

        // Sprint 15: First sprint (globally) starts as IN_PROGRESS
        const isFirstSprint = globalSprintOrder === 1;

        const sprint = await tx.sprint.create({
          data: {
            phaseId: phase.id,
            sprintNumber: globalSprintOrder, // Sprint 15: Continuous across phases
            title: sprintData.name,
            description: sprintData.goals.join('\n'),
            status: isFirstSprint ? 'IN_PROGRESS' as const : 'NOT_STARTED' as const,
            progress: 0,
            startDate: new Date(),
            endDate: null,
          },
        });

        sprintIds.push(sprint.id);
        // Sprint 15: Week/Day creation removed - Kanban uses Ticket.sprintId
      }
    }

    // Update Roadmap with first phase/sprint names
    if (phaseIds.length > 0 && phases.length > 0) {
      await tx.roadmap.update({
        where: { id: roadmap.id },
        data: {
          currentPhase: phases[0]?.name ?? null,
          currentSprint: phases[0]?.sprints[0]?.name ?? null,
        },
      });
    }
  });

  // 3. Return materialization result
  return {
    success: true,
    message: `Materialized roadmap ${roadmapId}: ${phaseIds.length} phases, ${sprintIds.length} sprints`,
    phaseIds,
    sprintIds,
    counts: {
      phases: phaseIds.length,
      sprints: sprintIds.length,
    },
  };
}
