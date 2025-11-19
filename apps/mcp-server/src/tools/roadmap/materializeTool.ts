/**
 * Roadmap Materialization MCP Tool
 *
 * Sprint 8.5 Phase 1 Part A - Task A.3
 * Created: 2025-11-18
 *
 * Materializes Roadmap.phases JSON → normalized Phase/Sprint/Week/Day/Task records
 * Enables Phase 4 tools (getCurrentPosition, getPhaseProgress) to query hierarchical data
 */

import { z } from 'zod';
import { materializeRoadmap } from '@projectpulse/roadmap-tools';
import type { MaterializationResult } from '@projectpulse/roadmap-tools';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MCP Tool: projectpulse.roadmap.materialize
 *
 * Purpose: Convert Roadmap.phases JSON to database records
 *
 * Flow:
 * 1. Validate roadmapId exists and belongs to projectId (security)
 * 2. Call materializeRoadmap() from shared package
 * 3. Return summary: {phases: 3, sprints: 9, weeks: 36, days: 180}
 *
 * Called by:
 * - Session 3 onboarding (bootstrapTool) - automatic after Roadmap creation
 * - Manual materialization if needed
 */
const materializeRoadmapSchema = z.object({
  roadmapId: z.string().describe('Roadmap ID to materialize (UUID)'),
  projectId: z.number().int().positive().describe('Project ID for security validation'),
});

export const materializeRoadmapTool = {
  name: 'projectpulse.roadmap.materialize',
  description:
    'Materialize Roadmap JSON to Phase/Sprint/Week/Day records. Creates 5-level hierarchy for roadmap navigation and progress tracking.',

  schema: materializeRoadmapSchema,
  inputSchema: {
    type: 'object' as const,
    properties: {
      roadmapId: {
        type: 'string' as const,
        description: 'Roadmap ID to materialize (UUID)',
      },
      projectId: {
        type: 'number' as const,
        description: 'Project ID for security validation',
      },
    },
    required: ['roadmapId', 'projectId'],
  },

  async execute(params: unknown) {
    const { roadmapId, projectId } = materializeRoadmapSchema.parse(params);
    try {
      // 1. Security: Validate roadmapId belongs to projectId
      const roadmap = await prisma.roadmap.findUnique({
        where: { id: roadmapId },
        select: {
          id: true,
          projectId: true,
          phases: true,
        },
      });

      if (!roadmap) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Roadmap not found',
                  message: `Roadmap ${roadmapId} does not exist`,
                  roadmapId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (roadmap.projectId !== projectId) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Security violation',
                  message: `Roadmap ${roadmapId} does not belong to project ${projectId}`,
                  roadmapId,
                  projectId,
                  actualProjectId: roadmap.projectId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // 2. Call shared package materialization function
      // This creates Phase/Sprint/Week/Day records in a transaction
      const result: MaterializationResult = await materializeRoadmap(roadmapId);

      // 3. Return success with detailed counts
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: result.message,
                roadmapId,
                projectId,
                materialization: {
                  phases: result.counts.phases,
                  sprints: result.counts.sprints,
                  weeks: result.counts.weeks,
                  days: result.counts.days,
                  total: result.counts.phases + result.counts.sprints + result.counts.weeks + result.counts.days,
                },
                ids: {
                  phases: result.phaseIds,
                  sprints: result.sprintIds,
                  weeks: result.weekIds,
                  days: result.dayIds,
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      // Handle any errors during materialization
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'Materialization failed',
                message: errorMessage,
                roadmapId,
                projectId,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  },
};
