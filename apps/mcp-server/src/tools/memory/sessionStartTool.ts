/**
 * MCP Tool: projectpulse_memory_sessionStart
 * Sprint 9: Memory Bank System
 * 
 * Load all 5 memory banks for session start
 * Target: ≤10K tokens total
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
});

type SessionStartInput = z.infer<typeof schema>;

export const memorySessionStartTool: ToolDefinition = {
  name: 'projectpulse_memory_sessionStart',
  description: 'Load all 5 memory banks (PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS) for session start. Target: ≤10K tokens total.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to load memory banks for',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Loading session start memory banks', {
        projectId: validated.projectId,
      });
      
      const response = await context.httpClient.get(
        `/api/memory/session-start?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Session start memory banks loaded', {
        projectId: validated.projectId,
        totalTokens: response.totalTokens,
        bankCount: response.banks?.length || 0,
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
      context.logger.error('Failed to load session start memory banks', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to load session start memory banks',
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
