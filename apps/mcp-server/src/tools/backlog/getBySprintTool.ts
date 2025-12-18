/**
 * Backlog Get By Sprint MCP Tool
 * Sprint 14: Get backlog items for a sprint with traceability data
 *
 * Returns structured data ready for ticket creation workflow.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID'),
  sprintNumber: z.number().int().positive().describe('Sprint number to filter by'),
});

type GetBySprintInput = z.infer<typeof inputSchema>;

export const backlogGetBySprintTool: ToolDefinition = {
  name: 'projectpulse_backlog_getBySprint',
  description: `[QUERY] Get backlog items for a specific sprint with traceability data.

When to Use:
- When starting work on a sprint and need to create tickets
- When reviewing what features/stories are assigned to a sprint
- When checking traceability data (epicRef, frTraces) for ticket creation

Returns:
- items: Array of backlog items with itemId, title, epicRef, frTraces, nfrTraces, sprintNumber
- totalCount: Number of items in the sprint

Workflow:
1. Run projectpulse_traceability_validate_documents() first to populate backlog items
2. Use this tool to get sprint-specific items
3. Create tickets using projectpulse_ticket_create() with traceability fields

Related:
→ projectpulse_backlog_list - List all backlog items across all sprints
→ projectpulse_ticket_create - Create ticket with traceability from backlog item
→ projectpulse_wiki_search - Get full details for implementation`,
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID' },
      sprintNumber: { type: 'number', description: 'Sprint number to filter by' },
    },
    required: ['projectId', 'sprintNumber'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);

    context.logger.info('Getting backlog items by sprint', {
      projectId: validated.projectId,
      sprintNumber: validated.sprintNumber,
    });

    try {
      const queryParams = new URLSearchParams({
        projectId: validated.projectId.toString(),
        sprintNumber: validated.sprintNumber.toString(),
      });

      const response = await context.httpClient.get(
        `/api/backlog?${queryParams.toString()}`
      ) as any;

      const itemCount = response.data?.totalCount || 0;
      context.logger.info('Backlog items retrieved', {
        projectId: validated.projectId,
        sprintNumber: validated.sprintNumber,
        itemCount,
      });

      // Add helpful hint for ticket creation
      const hint = itemCount > 0
        ? `Found ${itemCount} items for Sprint ${validated.sprintNumber}. Use projectpulse_ticket_create() with the epicRef and frTraces from each item.`
        : `No items found for Sprint ${validated.sprintNumber}. Run projectpulse_traceability_validate_documents() to populate backlog items.`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...response,
              _hint: hint,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to get backlog items by sprint', {
        error: errorMessage,
        projectId: validated.projectId,
        sprintNumber: validated.sprintNumber,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get backlog items',
              message: errorMessage,
              projectId: validated.projectId,
              sprintNumber: validated.sprintNumber,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
