/**
 * Backlog List MCP Tool
 * Sprint 14: List all backlog items with optional filtering
 *
 * Returns all backlog items grouped by sprint for overview.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID'),
  epicRef: z.string().optional().describe('Filter by epic reference (partial match)'),
});

type ListInput = z.infer<typeof inputSchema>;

export const backlogListTool: ToolDefinition = {
  name: 'projectpulse_backlog_list',
  description: `[QUERY] List all backlog items with optional filtering.

When to Use:
- When viewing all features/stories in the product backlog
- When checking sprint distribution of backlog items
- When filtering by epic to see related features

Returns:
- items: All backlog items
- sprintGroups: Items grouped by sprint number
- unassigned: Items not assigned to any sprint
- totalCount: Total number of items

Workflow:
1. Run projectpulse_traceability_validate_documents() first to populate backlog items
2. Use this tool to get overview of all items
3. Use projectpulse_backlog_getBySprint() for sprint-specific work

Related:
→ projectpulse_backlog_getBySprint - Get items for a specific sprint
→ projectpulse_traceability_validate_documents - Populate backlog items from docs`,
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID' },
      epicRef: { type: 'string', description: 'Filter by epic reference (partial match)' },
    },
    required: ['projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);

    context.logger.info('Listing backlog items', {
      projectId: validated.projectId,
      epicRef: validated.epicRef,
    });

    try {
      const queryParams = new URLSearchParams({
        projectId: validated.projectId.toString(),
      });

      if (validated.epicRef) {
        queryParams.append('epicRef', validated.epicRef);
      }

      const response = await context.httpClient.get(
        `/api/backlog?${queryParams.toString()}`
      ) as any;

      const itemCount = response.data?.totalCount || 0;
      const sprintCount = Object.keys(response.data?.sprintGroups || {}).length;

      context.logger.info('Backlog items listed', {
        projectId: validated.projectId,
        itemCount,
        sprintCount,
      });

      // Add summary
      const summary = itemCount > 0
        ? `Found ${itemCount} backlog items across ${sprintCount} sprints.`
        : 'No backlog items found. Run projectpulse_traceability_validate_documents() to populate.';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...response,
              _summary: summary,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to list backlog items', {
        error: errorMessage,
        projectId: validated.projectId,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list backlog items',
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
