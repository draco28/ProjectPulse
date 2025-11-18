/**
 * Roadmap Materialization
 *
 * Converts Roadmap.phases JSON → normalized Phase/Sprint/Week/Day database records
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { ParsedRoadmap, MaterializationResult } from './types.js';

const prisma = new PrismaClient();

/**
 * Helper: Parse duration string to number of weeks
 */
function parseDuration(duration: string | undefined): number {
  if (!duration) return 1;
  const match = duration.match(/(\d+)\s*weeks?/i);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Helper: Parse week range to array of week numbers
 * @example "Weeks 1-2" → [1, 2]
 */
function parseWeekRange(weeks: string | undefined): number[] {
  if (!weeks) return [1];
  
  const match = weeks.match(/Weeks?\s*(\d+)-(\d+)/i);
  if (!match) return [1];

  const start = parseInt(match[1] ?? '1', 10);
  const end = parseInt(match[2] ?? String(start), 10);
  const range: number[] = [];

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return range;
}

/**
 * Materialize Roadmap: Convert phases JSON → normalized database tables
 *
 * Creates 5-level hierarchy:
 * - Roadmap (existing)
 *   → Phase (created)
 *     → Sprint (created)
 *       → Week (created, linked to Sprint NOT Phase)
 *         → Day (created, 5 per week Mon-Fri)
 *
 * @param roadmapId - Roadmap.id to materialize
 * @returns Materialization result with created IDs
 * @throws Error if roadmap not found or transaction fails
 */
export async function materializeRoadmap(roadmapId: string): Promise<MaterializationResult> {
  // 1. Fetch Roadmap with phases JSON
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: {
      id: true,
      projectId: true,
      phases: true,
    },
  });

  if (!roadmap) {
    throw new Error(`Roadmap not found: ${roadmapId}`);
  }

  if (!roadmap.phases) {
    throw new Error(`Roadmap ${roadmapId} has no phases JSON`);
  }

  // Parse phases JSON (stored as JSONB in database)
  const parsedRoadmap = roadmap.phases as unknown as ParsedRoadmap;
  const phases = parsedRoadmap.phases;

  if (!Array.isArray(phases) || phases.length === 0) {
    throw new Error(`Invalid phases structure in roadmap ${roadmapId}`);
  }

  // Track created IDs
  const phaseIds: string[] = [];
  const sprintIds: string[] = [];
  const weekIds: string[] = [];
  const dayIds: string[] = [];

  // 2. Transaction: Create Phase → Sprint → Week → Day records
  await prisma.$transaction(async (tx) => {
    let phaseOrder = 0;

    for (const phaseData of phases) {
      phaseOrder++;

      // Create Phase record
      const phase = await tx.phase.create({
        data: {
          roadmapId: roadmap.id,
          title: phaseData.name,
          description: `Phase ${phaseOrder}`,
          status: 'NOT_STARTED' as const,
          progress: 0,
          startDate: new Date(),
          endDate: null,
        },
      });

      phaseIds.push(phase.id);

      // Create Sprint records for this phase
      let sprintOrder = 0;
      for (const sprintData of phaseData.sprints) {
        sprintOrder++;

        const sprint = await tx.sprint.create({
          data: {
            phaseId: phase.id,
            title: sprintData.name,
            description: sprintData.goals.join('\n'),
            status: 'NOT_STARTED' as const,
            progress: 0,
            startDate: new Date(),
            endDate: null,
          },
        });

        sprintIds.push(sprint.id);

        // Create Week records for this sprint
        // CRITICAL: Week.sprintId (NOT Week.phaseId) - 5-level hierarchy
        const weekRange = parseWeekRange(sprintData.weeks);

        for (const weekNum of weekRange) {
          const week = await tx.week.create({
            data: {
              phaseId: phase.id, // Legacy field (required until migration)
              sprintId: sprint.id, // NEW parent (Sprint 8.5)
              title: `Week ${weekNum}`,
              description: `Week ${weekNum} of ${sprint.title}`,
              status: 'NOT_STARTED' as const,
              progress: 0,
              startDate: new Date(),
              endDate: null,
            },
          });

          weekIds.push(week.id);

          // Create Day records (5 days per week: Mon-Fri)
          const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

          for (let dayOrder = 0; dayOrder < daysOfWeek.length; dayOrder++) {
            const dayName = daysOfWeek[dayOrder] ?? 'Monday';

            const day = await tx.day.create({
              data: {
                weekId: week.id,
                title: dayName,
                description: `${dayName} of Week ${weekNum}`,
                status: 'NOT_STARTED' as const,
                progress: 0,
                startDate: new Date(),
                endDate: null,
              },
            });

            dayIds.push(day.id);
          }
        }
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
    message: `Materialized roadmap ${roadmapId}: ${phaseIds.length} phases, ${sprintIds.length} sprints, ${weekIds.length} weeks, ${dayIds.length} days`,
    phaseIds,
    sprintIds,
    weekIds,
    dayIds,
    counts: {
      phases: phaseIds.length,
      sprints: sprintIds.length,
      weeks: weekIds.length,
      days: dayIds.length,
    },
  };
}
