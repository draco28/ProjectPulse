import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  buildErrorPayload,
  summarizeTicket,
  ticketNumberSchema,
  projectIdSchema,
  resolveProjectId,
} from './common.js';

// Sprint 17: Dual-input schema - accept either ticketId OR ticketNumber
// Sprint 18: projectId now auto-fills from auth context when omitted
const ticketSetStatusSchema = z.object({
  ticketId: z.number().int().positive().optional(),      // Global ID (existing)
  ticketNumber: ticketNumberSchema.optional(),           // Project-scoped (NEW)
  projectId: projectIdSchema.optional(),                 // Auto-fills from auth context
  status: z.string().min(1, 'Status is required'),
}).refine(
  (data) => data.ticketId || data.ticketNumber,
  { message: 'Either ticketId OR ticketNumber required' }
);

type TicketSetStatusInput = z.infer<typeof ticketSetStatusSchema>;

async function handler(input: TicketSetStatusInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { ticketId, ticketNumber, projectId, status } = input;

  // Sprint 18: Auto-fill projectId from authenticated context
  const resolvedProjectId = resolveProjectId(projectId, context.projectId);

  // Validate we have projectId when using ticketNumber
  if (ticketNumber && !ticketId && !resolvedProjectId) {
    return buildErrorPayload(
      'projectId required when using ticketNumber (not available from auth context)',
      'MISSING_PROJECT_ID'
    );
  }

  try {
    // Sprint 17: Resolve ticketId if ticketNumber was provided
    let resolvedTicketId = ticketId;
    if (!resolvedTicketId && ticketNumber && resolvedProjectId) {
      const lookupResponse = await httpClient.get<ApiResponse<{ id: number }>>(
        `/api/tickets/by-number/${resolvedProjectId}/${ticketNumber}`
      );
      if (!lookupResponse.data) {
        return buildErrorPayload(
          `Ticket #${ticketNumber} not found in project ${resolvedProjectId}`,
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

    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId: resolvedProjectId };
    logger.info('[ticket.setStatus] Status updated', { id: resolvedTicketId, status, ...identifier });
    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId: resolvedProjectId };
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
        description: 'Project ID (auto-fills from auth context when omitted)',
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
