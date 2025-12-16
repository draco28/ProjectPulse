/**
 * Knowledge Related MCP Tool
 * Sprint 9 Phase 3: Find related knowledge items via graph traversal
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { getContextStatus, getKnowledgeTip } from '../../utils/contextHints.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  itemId: z.number().int().positive().describe('Source knowledge item ID'),
  maxDepth: z.number().int().min(1).max(2).default(2).describe('Max relationship hops (1 or 2)'),
  limit: z.number().int().min(1).max(50).default(10).describe('Max results to return'),
  minStrength: z.number().min(0).max(1).default(0.5).describe('Minimum relationship strength'),
});

type RelatedInput = z.infer<typeof inputSchema>;

export const knowledgeRelatedTool: ToolDefinition = {
  name: 'projectpulse_knowledge_related',
  description: `[QUERY] Find related knowledge items via graph traversal.

When to Use:
- After finding a relevant knowledge item, discover related content
- Exploring topic clusters and connected concepts
- Building context before starting complex work

Graph Depth: 1 hop (direct) or 2 hops (extended relationships)

Input: itemId from projectpulse_knowledge_search results

Returns: Connected knowledge items with relationship strengths

minStrength: Filter by relationship quality (0-1, default 0.5)`,
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
      itemId: { type: 'number', description: 'Source knowledge item ID' },
      maxDepth: { type: 'number', description: 'Max relationship hops (1 or 2)' },
      limit: { type: 'number', description: 'Max results to return' },
      minStrength: { type: 'number', description: 'Minimum relationship strength (0-1)' },
    },
    required: ['projectId', 'itemId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Finding related knowledge items', {
      projectId: validated.projectId,
      itemId: validated.itemId,
      maxDepth: validated.maxDepth,
    });

    try {
      const queryParams = new URLSearchParams({
        projectId: validated.projectId.toString(),
        itemId: validated.itemId.toString(),
        maxDepth: validated.maxDepth.toString(),
        limit: validated.limit.toString(),
        minStrength: validated.minStrength.toString(),
      });

      const response = await context.httpClient.get(
        `/api/knowledge/related?${queryParams.toString()}`
      ) as any;

      context.logger.info('Related knowledge items found', {
        projectId: validated.projectId,
        count: response.count || 0,
      });

      // Phase 3: Add context hints
      const contextStatus = await getContextStatus(validated.projectId, context.httpClient);
      const responseWithHints = {
        ...response,
        _context: {
          sessionActive: contextStatus.sessionActive,
          sessionName: contextStatus.sessionName,
          hint: contextStatus.hint || getKnowledgeTip(),
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseWithHints, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Finding related knowledge items failed', {
        error: errorMessage,
        projectId: validated.projectId,
        itemId: validated.itemId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Finding related knowledge items failed',
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
