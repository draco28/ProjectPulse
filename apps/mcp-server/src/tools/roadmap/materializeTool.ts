/**
 * Roadmap Materialization Tool - Sprint 8.5 Phase 1
 * 
 * MCP tool wrapper for shared materializeRoadmap function
 */

import { materializeRoadmap } from '@projectpulse/roadmap-tools';
import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

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
