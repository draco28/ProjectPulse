/**
 * MCP Tool: projectpulse_memory_contextRecovery
 * Sprint 9: Memory Bank System
 *
 * ⚠️ DEPRECATED: Use projectpulse_context_load with banksToLoad: 'active-only'
 *
 * Load ACTIVE_CONTEXT + PROGRESS for fast session resume
 * Target: ≤6K tokens total
 *
 * Migration: projectpulse_context_load({ banksToLoad: 'active-only' }) provides
 * same banks PLUS active session state and workflow hints.
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
  description: `⚠️ DEPRECATED - Use projectpulse_context_load with banksToLoad: 'active-only'.

Load ACTIVE_CONTEXT + PROGRESS for fast session resume. Target: ≤6K tokens.

MIGRATION: projectpulse_context_load({ banksToLoad: 'active-only' }) provides
the same banks PLUS active session state and workflow hints.

This tool is kept for backward compatibility only.`,
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
      
      // Add deprecation warning to response
      const responseWithDeprecation = {
        ...response,
        _deprecation: {
          warning: '⚠️ This tool is deprecated',
          useInstead: "projectpulse_context_load with banksToLoad: 'active-only'",
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
