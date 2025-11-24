/**
 * Knowledge Archive MCP Tool
 * Sprint 9 Phase 3: Proxy to PATCH /api/knowledge/[id]/archive
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for ownership verification'),
  itemId: z.number().int().positive().describe('Knowledge item ID to archive'),
  unarchive: z.boolean().default(false).describe('Unarchive instead of archive'),
});

type ArchiveInput = z.infer<typeof inputSchema>;

export const knowledgeArchiveTool: ToolDefinition = {
  name: 'projectpulse_knowledge_archive',
  description: 'Archive or unarchive a knowledge item (soft delete). Archived items are hidden from search.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for ownership verification' },
      itemId: { type: 'number', description: 'Knowledge item ID to archive' },
      unarchive: { type: 'boolean', description: 'Unarchive instead of archive' },
    },
    required: ['projectId', 'itemId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Archiving knowledge item', {
      projectId: validated.projectId,
      itemId: validated.itemId,
      unarchive: validated.unarchive,
    });

    try {
      const url = `/api/knowledge/${validated.itemId}/archive?projectId=${validated.projectId}`;
      const response = validated.unarchive
        ? await context.httpClient.delete(url) as any
        : await context.httpClient.patch(url) as any;

      context.logger.info('Knowledge archive operation completed', {
        itemId: validated.itemId,
        unarchive: validated.unarchive,
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
      context.logger.error('Knowledge archive operation failed', {
        error: errorMessage,
        projectId: validated.projectId,
        itemId: validated.itemId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Knowledge archive operation failed',
              message: errorMessage,
              projectId: validated.projectId,
              itemId: validated.itemId,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
