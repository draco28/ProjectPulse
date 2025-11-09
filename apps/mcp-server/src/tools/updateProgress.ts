/**
 * MCP Tool: sprint.updateProgress
 *
 * Update entity progress with automatic parent roll-up propagation
 *
 * Features:
 * - Updates any entity type (session, task, day, week, phase)
 * - Automatic propagation to all parent entities
 * - Returns summary of all affected entities
 *
 * Example:
 * - Update Session to 100% → Task, Day, Week, Phase all recalculate
 * - Update Task to 50% → Day, Week, Phase all recalculate
 */

import { z } from 'zod';
import { ToolDefinition, ToolContext } from './types';

/**
 * Input schema for sprint.updateProgress
 */
const UpdateProgressSchema = z.object({
  entityType: z.enum(['session', 'task', 'day', 'week', 'phase'], {
    description: 'Type of entity to update (session, task, day, week, or phase)',
  }),
  entityId: z.string().cuid().describe('ID of the entity to update (CUID format)'),
  progress: z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100')
    .describe('Progress value (0-100)'),
});

type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;

/**
 * Tool definition for sprint.updateProgress
 */
export const updateProgressTool: ToolDefinition = {
  name: 'sprint.updateProgress',
  description: 'Update entity progress with automatic parent roll-up propagation. When you update a session to 100%, its parent task, day, week, and phase all recalculate automatically.',
  schema: UpdateProgressSchema,
  inputSchema: {
    type: 'object',
    properties: {
      entityType: {
        type: 'string',
        enum: ['session', 'task', 'day', 'week', 'phase'],
        description: 'Type of entity to update (session, task, day, week, or phase)',
      },
      entityId: {
        type: 'string',
        description: 'ID of the entity to update (CUID format)',
      },
      progress: {
        type: 'number',
        description: 'Progress value (0-100)',
        minimum: 0,
        maximum: 100,
      },
    },
    required: ['entityType', 'entityId', 'progress'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const args = params as UpdateProgressInput;
    const { entityType, entityId, progress } = args;

    // Map entity type to plural form for API route
    const entityTypePlural = `${entityType}s`;

    // Call API route: PUT /api/:entity/:id/progress
    const response: any = await context.httpClient.put(
      `/api/${entityTypePlural}/${entityId}/progress`,
      { progress }
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update progress');
    }

    const { entity, propagation } = response.data;

    // Format response for agent
    const affectedEntities = [entity, ...propagation.updated];
    const summary = affectedEntities
      .map((e: any) => `${e.type} (${e.progress}%)`)
      .join(' → ');

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Progress updated successfully. Propagation: ${summary}`,
          data: {
            updated: entity,
            propagated: propagation.updated,
            totalAffected: propagation.totalAffected + 1, // +1 for the entity itself
          },
        }, null, 2),
      }],
    };
  },
};
