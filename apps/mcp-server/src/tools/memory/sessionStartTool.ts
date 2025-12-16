/**
 * MCP Tool: projectpulse_memory_sessionStart
 * Sprint 9: Memory Bank System
 *
 * ⚠️ DEPRECATED: Use projectpulse_context_load instead
 *
 * Load all 5 memory banks for session start
 * Target: ≤10K tokens total
 *
 * Migration: projectpulse_context_load provides same data PLUS:
 * - Active session state (todos, progress)
 * - Available resources metadata
 * - Self-guiding workflow hints
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
  description: `⚠️ DEPRECATED - Use projectpulse_context_load instead.

Load all 5 memory banks for session start. Target: ≤10K tokens.

MIGRATION: projectpulse_context_load provides the same data PLUS:
- Active session state (todos, progress)
- Available resources metadata (personas, skills, SOPs)
- Self-guiding workflow hints

This tool is kept for backward compatibility only.`,
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
      
      // Add deprecation warning to response
      const responseWithDeprecation = {
        ...response,
        _deprecation: {
          warning: '⚠️ This tool is deprecated',
          useInstead: 'projectpulse_context_load',
          reason: 'Enhanced version with session state and workflow hints',
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseWithDeprecation, null, 2),
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
