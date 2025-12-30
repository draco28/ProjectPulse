import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  buildErrorPayload,
  summarizeTicket,
  ticketNumberSchema,
  projectIdSchema,
} from './common.js';

// Sprint 17: Dual-input schema - accept either ticketId OR (ticketNumber + projectId)
const ticketSetStatusSchema = z.object({
  ticketId: z.number().int().positive().optional(),      // Global ID (existing)
  ticketNumber: ticketNumberSchema.optional(),           // Project-scoped (NEW)
  projectId: projectIdSchema.optional(),                 // Required with ticketNumber
  status: z.string().min(1, 'Status is required'),
}).refine(
  (data) => data.ticketId || (data.ticketNumber && data.projectId),
  { message: 'Either ticketId OR (ticketNumber + projectId) required' }
);

type TicketSetStatusInput = z.infer<typeof ticketSetStatusSchema>;

async function handler(input: TicketSetStatusInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { ticketId, ticketNumber, projectId, status } = input;

  try {
    // Sprint 17: Resolve ticketId if ticketNumber was provided
    let resolvedTicketId = ticketId;
    if (!resolvedTicketId && ticketNumber && projectId) {
      const lookupResponse = await httpClient.get<ApiResponse<{ id: number }>>(
        `/api/tickets/by-number/${projectId}/${ticketNumber}`
      );
      if (!lookupResponse.data) {
        return buildErrorPayload(
          `Ticket #${ticketNumber} not found in project ${projectId}`,
          'NOT_FOUND'
        );
      }
      resolvedTicketId = lookupResponse.data.id;
    }

    const response = await httpClient.patch<ApiResponse<TicketRecord>>(
      `/api/tickets/${resolvedTicketId}/status`,
      { status }
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to update status',
        response.error?.code
      );
    }

    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId };
    logger.info('[ticket.setStatus] Status updated', { id: resolvedTicketId, status, ...identifier });
    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId };
    logger.error('[ticket.setStatus] Unexpected error', { error, ...identifier });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketSetStatusTool: ToolDefinition = {
  name: 'projectpulse_ticket_setStatus',
  description: `Update ticket workflow status (open, in_progress, blocked, completed, cancelled). Sets closedAt timestamp when status=completed.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Ticket #5"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)`,
  schema: ticketSetStatusSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: {
        type: 'number',
        description: 'Global ticket ID (use if you have it from API responses)',
      },
      ticketNumber: {
        type: 'number',
        description: 'Project-scoped ticket number (use for user-referenced tickets like "#5")',
      },
      projectId: {
        type: 'number',
        description: 'Project ID (required when using ticketNumber)',
      },
      status: { type: 'string', description: 'New status value' },
    },
    required: ['status'],  // Only status is always required
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketSetStatusSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
