/**
 * MCP Tool: projectpulse_memory_patternLookup
 * Sprint 9: Memory Bank System
 * 
 * Query a specific memory bank by type
 * Target: ≤1K tokens per lookup
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  bankType: z.enum([
    'PROJECT_BRIEF',
    'SYSTEM_PATTERNS',
    'TECH_CONTEXT',
    'ACTIVE_CONTEXT',
    'PROGRESS',
  ]),
});

type PatternLookupInput = z.infer<typeof schema>;

export const memoryPatternLookupTool: ToolDefinition = {
  name: 'projectpulse_memory_patternLookup',
  description: 'Query a specific memory bank by type (PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS). Target: ≤1K tokens per lookup.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to query memory bank for',
      },
      bankType: {
        type: 'string',
        enum: ['PROJECT_BRIEF', 'SYSTEM_PATTERNS', 'TECH_CONTEXT', 'ACTIVE_CONTEXT', 'PROGRESS'],
        description: 'Memory bank type to retrieve',
      },
    },
    required: ['projectId', 'bankType'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Looking up memory bank pattern', {
        projectId: validated.projectId,
        bankType: validated.bankType,
      });
      
      const response = await context.httpClient.get(
        `/api/memory/pattern-lookup?projectId=${validated.projectId}&bankType=${validated.bankType}`
      ) as any;
      
      context.logger.info('Memory bank pattern retrieved', {
        projectId: validated.projectId,
        bankType: validated.bankType,
        tokens: response.tokens,
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
      context.logger.error('Failed to lookup memory bank pattern', {
        error: errorMessage,
        projectId: validated.projectId,
        bankType: validated.bankType,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to lookup memory bank pattern',
              message: errorMessage,
              projectId: validated.projectId,
              bankType: validated.bankType,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
