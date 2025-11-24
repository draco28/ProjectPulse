/**
 * Knowledge Search MCP Tool
 * Sprint 9 Phase 3: Proxy to /api/knowledge/search
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  query: z.string().min(1).max(1000).describe('Search query text'),
  mode: z.enum(['semantic', 'fulltext', 'hybrid']).default('hybrid').describe('Search mode'),
  limit: z.number().int().min(1).max(50).default(5).describe('Max results to return'),
  category: z.string().max(50).optional().describe('Optional category filter'),
});

type SearchInput = z.infer<typeof inputSchema>;

export const knowledgeSearchTool: ToolDefinition = {
  name: 'projectpulse_knowledge_search',
  description: 'Search knowledge base using semantic, full-text, or hybrid search. Returns array of knowledge items with scores and excerpts.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
      query: { type: 'string', description: 'Search query text' },
      mode: { type: 'string', enum: ['semantic', 'fulltext', 'hybrid'], description: 'Search mode' },
      limit: { type: 'number', description: 'Max results to return' },
      category: { type: 'string', description: 'Optional category filter' },
    },
    required: ['projectId', 'query'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Searching knowledge base', {
      projectId: validated.projectId,
      query: validated.query,
      mode: validated.mode,
    });

    try {
      const queryParams = new URLSearchParams({
        projectId: validated.projectId.toString(),
        query: validated.query,
        mode: validated.mode,
        limit: validated.limit.toString(),
      });
      
      if (validated.category) {
        queryParams.append('category', validated.category);
      }

      const response = await context.httpClient.get(
        `/api/knowledge/search?${queryParams.toString()}`
      ) as any;

      context.logger.info('Knowledge search completed', {
        resultCount: response.data?.count || 0,
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
      context.logger.error('Knowledge search failed', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Knowledge search failed',
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
