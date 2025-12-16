/**
 * Knowledge Search MCP Tool
 * Sprint 9 Phase 3: Proxy to /api/knowledge/search
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { getContextStatus, getKnowledgeTip } from '../../utils/contextHints.js';

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
  description: `[QUERY] Search knowledge base for patterns, decisions, and procedures.

When to Use:
- Before implementing unfamiliar features (find prior art)
- When researching existing patterns or architectural decisions
- When checking for previous solutions to similar problems

Search Modes:
- semantic: Meaning-based search (best for concepts)
- fulltext: Exact keyword matching (best for specific terms)
- hybrid: Combined approach (default, recommended)

Returns: Knowledge items with relevance scores and excerpts

Related:
→ projectpulse_knowledge_related - Find connected items via graph
→ projectpulse_skill_list - If looking for coding patterns specifically`,
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
