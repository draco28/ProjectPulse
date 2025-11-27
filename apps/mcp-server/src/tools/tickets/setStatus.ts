import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  buildErrorPayload,
  buildSuccessPayload,
  ticketIdSchema,
  summarizeTicket,
} from './common.js';

const ticketSetStatusSchema = z.object({
  ticketId: ticketIdSchema,
  status: z.string().min(1, 'Status is required'),
});

type TicketSetStatusInput = z.infer<typeof ticketSetStatusSchema>;

async function handler(input: TicketSetStatusInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { ticketId, status } = input;

  try {
    const response = await httpClient.patch<ApiResponse<TicketRecord>>(
      `/api/tickets/${ticketId}/status`,
      { status }
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to update status',
        response.error?.code
      );
    }

    logger.info('[ticket.setStatus] Status updated', { ticketId, status });
    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    logger.error('[ticket.setStatus] Unexpected error', { error, ticketId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketSetStatusTool: ToolDefinition = {
  name: 'projectpulse_ticket_setStatus',
  description:
    'Update ticket workflow status (open, in_progress, blocked, completed, cancelled). Sets closedAt timestamp when status=completed.',
  schema: ticketSetStatusSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: { type: 'number', description: 'Ticket identifier' },
      status: { type: 'string', description: 'New status value' },
    },
    required: ['ticketId', 'status'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketSetStatusSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
