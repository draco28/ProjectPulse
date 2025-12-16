/**
 * Knowledge Metrics MCP Tool
 * Sprint 9 Phase 3: Proxy to GET /api/knowledge/metrics
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { getContextStatus, getKnowledgeTip } from '../../utils/contextHints.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  startDate: z.string().optional().describe('Start date for metrics (ISO 8601)'),
  endDate: z.string().optional().describe('End date for metrics (ISO 8601)'),
});

type MetricsInput = z.infer<typeof inputSchema>;

export const knowledgeMetricsTool: ToolDefinition = {
  name: 'projectpulse_knowledge_metrics',
  description: `[QUERY] Get knowledge base usage metrics and statistics.

When to Use:
- Checking knowledge base health and coverage
- Identifying popular queries and trending topics
- Analyzing search performance over time

Filters: startDate/endDate (ISO 8601) for time-based analysis

Returns: Search stats, popular queries, item counts by category`,
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
      startDate: { type: 'string', description: 'Start date for metrics (ISO 8601)' },
      endDate: { type: 'string', description: 'End date for metrics (ISO 8601)' },
    },
    required: ['projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Fetching knowledge metrics', {
      projectId: validated.projectId,
    });

    try {
      const queryParams = new URLSearchParams({
        projectId: validated.projectId.toString(),
      });
      
      if (validated.startDate) {
        queryParams.append('startDate', validated.startDate);
      }
      if (validated.endDate) {
        queryParams.append('endDate', validated.endDate);
      }

      const response = await context.httpClient.get(
        `/api/knowledge/metrics?${queryParams.toString()}`
      ) as any;

      context.logger.info('Knowledge metrics retrieved', {
        projectId: validated.projectId,
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
      context.logger.error('Knowledge metrics fetch failed', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Knowledge metrics fetch failed',
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
