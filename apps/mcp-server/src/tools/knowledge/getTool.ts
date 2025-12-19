/**
 * Knowledge Get MCP Tool
 * Sprint 14: Proxy to GET /api/knowledge/[id]
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for ownership verification'),
  itemId: z.number().int().positive().describe('Knowledge item ID to retrieve'),
});

type GetInput = z.infer<typeof inputSchema>;

export const knowledgeGetTool: ToolDefinition = {
  name: 'projectpulse_knowledge_get',
  description: `[QUERY] Get full knowledge item content by ID.

When to Use:
- After finding item via projectpulse_knowledge_search
- When you need full content, not just excerpt
- To read procedures, workflows, or documentation

Input: projectId + itemId (from search results)

Returns: Full knowledge item with complete content (title, content, category, tags, dates)

Related:
→ projectpulse_knowledge_search - Find items first
→ projectpulse_knowledge_related - Find connected items`,
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for ownership verification' },
      itemId: { type: 'number', description: 'Knowledge item ID to retrieve' },
    },
    required: ['projectId', 'itemId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);

    context.logger.info('Retrieving knowledge item', {
      projectId: validated.projectId,
      itemId: validated.itemId,
    });

    try {
      const url = `/api/knowledge/${validated.itemId}?projectId=${validated.projectId}`;
      const response = await context.httpClient.get(url) as any;

      context.logger.info('Knowledge item retrieved', {
        itemId: validated.itemId,
        title: response.data?.title,
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
      context.logger.error('Knowledge get failed', {
        error: errorMessage,
        projectId: validated.projectId,
        itemId: validated.itemId,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Knowledge item retrieval failed',
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
