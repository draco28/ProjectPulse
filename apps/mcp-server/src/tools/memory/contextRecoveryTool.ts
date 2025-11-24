/**
 * MCP Tool: projectpulse_memory_contextRecovery
 * Sprint 9: Memory Bank System
 * 
 * Load ACTIVE_CONTEXT + PROGRESS for fast session resume
 * Target: ≤6K tokens total
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
});

type ContextRecoveryInput = z.infer<typeof schema>;

export const memoryContextRecoveryTool: ToolDefinition = {
  name: 'projectpulse_memory_contextRecovery',
  description: 'Load ACTIVE_CONTEXT + PROGRESS memory banks for fast session resume. Target: ≤6K tokens total.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to recover context for',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Recovering memory bank context', {
        projectId: validated.projectId,
      });
      
      const response = await context.httpClient.get(
        `/api/memory/context-recovery?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Memory bank context recovered', {
        projectId: validated.projectId,
        totalTokens: response.totalTokens,
        bankCount: response.activeBanks?.length || 0,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to recover memory bank context', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to recover memory bank context',
              message: errorMessage,
              projectId: validated.projectId,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
