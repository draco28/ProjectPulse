import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  baseTicketFields,
  buildErrorPayload,
  buildSuccessPayload,
  ticketIdSchema,
  ticketInputProperties,
  summarizeTicket,
} from './common.js';

const ticketUpdateSchema = baseTicketFields
  .omit({ projectId: true })
  .partial() // All fields optional for updates
  .extend({
    ticketId: ticketIdSchema, // Required
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.kind !== undefined ||
      data.source !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.module !== undefined ||
      data.assignee !== undefined ||
      data.assigneeType !== undefined ||
      data.assigneeId !== undefined ||
      data.linkedTaskId !== undefined ||
      data.labelIds !== undefined ||
      data.customFields !== undefined ||
      data.context !== undefined ||
      // Sprint 13: Hierarchy and traceability fields
      data.parentTicketId !== undefined ||
      data.epicRef !== undefined ||
      data.backlogRefs !== undefined ||
      data.sprintNumber !== undefined ||
      // Sprint 15: Kanban ordering
      data.displayOrder !== undefined,
    {
      message: 'Provide at least one field to update',
      path: [],
    }
  );

type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

async function handler(input: TicketUpdateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  const { ticketId, ...payload } = input;

  try {
    const response = await httpClient.patch<ApiResponse<TicketRecord>>(
      `/api/tickets/${ticketId}`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to update ticket',
        response.error?.code
      );
    }

    logger.info('[ticket.update] Ticket updated', { id: ticketId });
    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    logger.error('[ticket.update] Unexpected error', { error, ticketId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketUpdateTool: ToolDefinition = {
  name: 'projectpulse_ticket_update',
  description: `Update an existing ticket (kind, source, status, priority, module, assignee, labels, custom fields, or context metadata). Does not change comments; use ticket.addComment for notes.

HIERARCHY (Sprint 13):
- Set parentTicketId to link ticket under a feature
- Set parentTicketId to null to unlink from parent
- Circular references are prevented automatically
- Only task/issue/bug/tech_debt can have parents`,
  schema: ticketUpdateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: {
        type: 'number',
        description: 'Numeric ticket identifier',
      },
      title: ticketInputProperties.title,
      description: ticketInputProperties.description,
      kind: ticketInputProperties.kind,
      source: ticketInputProperties.source,
      status: ticketInputProperties.status,
      priority: ticketInputProperties.priority,
      module: ticketInputProperties.module,
      assignee: ticketInputProperties.assignee,
      assigneeType: ticketInputProperties.assigneeType,
      assigneeId: ticketInputProperties.assigneeId,
      linkedTaskId: ticketInputProperties.linkedTaskId,
      labelIds: ticketInputProperties.labelIds,
      customFields: ticketInputProperties.customFields,
      context: ticketInputProperties.context,
      // Sprint 13: Hierarchy and traceability fields
      parentTicketId: ticketInputProperties.parentTicketId,
      epicRef: ticketInputProperties.epicRef,
      backlogRefs: ticketInputProperties.backlogRefs,
      sprintNumber: ticketInputProperties.sprintNumber,
      // Sprint 15: Kanban ordering
      displayOrder: ticketInputProperties.displayOrder,
    },
    required: ['ticketId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketUpdateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
