/**
 * Roadmap Materialization Tool - Sprint 8.5 Phase 1
 *
 * Converts Roadmap.phases JSON → normalized Phase/Sprint/Week/Day database records
 *
 * Algorithm:
 * 1. Read Roadmap.phases JSONB from database
 * 2. Transaction: Create Phase → Sprint → Week → Day records
 * 3. Return created IDs for verification
 *
 * Critical: Week.sprintId (NOT Week.phaseId) - 5-level hierarchy
 */

import { PrismaClient } from '@prisma/client';
import type { ParsedRoadmap } from './parseProjectPlan';

const prisma = new PrismaClient();

/**
 * Helper: Parse duration string to number
 * @example "6 weeks" → 6, "2 weeks" → 2
 */
function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*weeks?/i);
  if (!match) {
    console.warn(`Could not parse duration: ${duration}, defaulting to 1`);
    return 1;
  }
  return parseInt(match[1], 10);
}

/**
 * Helper: Parse week range to array of week numbers
 * @example "Weeks 1-2" → [1, 2], "Weeks 3-5" → [3, 4, 5]
 */
function parseWeekRange(weeks: string): number[] {
  const match = weeks.match(/Weeks?\s*(\d+)-(\d+)/i);
  if (!match) {
    console.warn(`Could not parse week range: ${weeks}, defaulting to [1]`);
    return [1];
  }

  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  const range: number[] = [];

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return range;
}

/**
 * Materialization result
 */
export interface MaterializationResult {
  success: boolean;
  message: string;
  phaseIds: string[];
  sprintIds: string[];
  weekIds: string[];
  dayIds: string[];
  counts: {
    phases: number;
    sprints: number;
    weeks: number;
    days: number;
  };
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
  const parsedRoadmap = roadmap.phases as ParsedRoadmap;
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
          description: `Phase ${phaseOrder}`, // Could extract from name
          status: 'PENDING',
          progress: 0,
          duration: parseDuration(phaseData.duration),
          order: phaseOrder,
          // startDate/endDate calculated based on duration
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
            status: 'PENDING',
            progress: 0,
            duration: parseDuration(sprintData.duration),
            storyPoints: sprintData.storyPoints,
            order: sprintOrder,
          },
        });

        sprintIds.push(sprint.id);

        // Create Week records for this sprint
        // CRITICAL: Week.sprintId (NOT Week.phaseId) - 5-level hierarchy
        const weekRange = parseWeekRange(sprintData.weeks);

        for (const weekNum of weekRange) {
          const week = await tx.week.create({
            data: {
              sprintId: sprint.id, // ✅ CRITICAL: sprintId not phaseId
              title: `Week ${weekNum}`,
              description: `Week ${weekNum} of ${sprint.title}`,
              status: 'PENDING',
              progress: 0,
              weekNumber: weekNum,
            },
          });

          weekIds.push(week.id);

          // Create Day records (5 days per week: Mon-Fri)
          const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

          for (let dayOrder = 0; dayOrder < daysOfWeek.length; dayOrder++) {
            const dayName = daysOfWeek[dayOrder];

            const day = await tx.day.create({
              data: {
                weekId: week.id,
                title: dayName,
                description: `${dayName} of Week ${weekNum}`,
                status: 'PENDING',
                progress: 0,
                order: dayOrder + 1,
              },
            });

            dayIds.push(day.id);
          }
        }
      }
    }

    // Update Roadmap with first phase/sprint IDs
    if (phaseIds.length > 0 && sprintIds.length > 0) {
      await tx.roadmap.update({
        where: { id: roadmap.id },
        data: {
          currentPhaseId: phaseIds[0],
          currentSprintId: sprintIds[0],
        },
      });
    }
  });

  // 3. Return materialization result
  return {
    success: true,
    message: `Materialized roadmap ${roadmapId}`,
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

// ============================================================================
// MCP TOOL DEFINITION
// ============================================================================

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types';

const materializeRoadmapSchema = z.object({
  roadmapId: z.string().min(1, 'Roadmap ID is required'),
});

type MaterializeRoadmapInput = z.infer<typeof materializeRoadmapSchema>;

/**
 * MCP Tool: projectpulse.roadmap.materialize
 *
 * Converts Roadmap.phases JSON → Phase/Sprint/Week/Day records
 */
export const materializeRoadmapTool: ToolDefinition = {
  name: 'projectpulse.roadmap.materialize',
  description: 'Materialize roadmap from JSON to database tables (Phase/Sprint/Week/Day hierarchy)',
  schema: materializeRoadmapSchema,
  inputSchema: {
    type: 'object',
    properties: {
      roadmapId: {
        type: 'string',
        description: 'Roadmap ID to materialize',
      },
    },
    required: ['roadmapId'],
  },

  async execute(params: MaterializeRoadmapInput, context: ToolContext) {
    try {
      context.logger.info('Materializing roadmap', { roadmapId: params.roadmapId });
      
      const result = await materializeRoadmap(params.roadmapId);

      context.logger.info('Roadmap materialized successfully', {
        roadmapId: params.roadmapId,
        counts: result.counts,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Materialization failed', {
        roadmapId: params.roadmapId,
        error: errorMessage,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Materialization failed: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
