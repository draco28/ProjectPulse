import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketComment,
  buildErrorPayload,
  ticketNumberSchema,
  projectIdSchema,
  resolveProjectId,
} from './common.js';

// Sprint 17: Dual-input schema - accept either ticketId OR ticketNumber
// Sprint 18: projectId now auto-fills from auth context when omitted
const ticketAddCommentSchema = z.object({
  ticketId: z.number().int().positive().optional(),      // Global ID (existing)
  ticketNumber: ticketNumberSchema.optional(),           // Project-scoped (NEW)
  projectId: projectIdSchema.optional(),                 // Auto-fills from auth context
  content: z.string().min(1).max(10000),
  author: z.string().max(120).optional(),
}).refine(
  (data) => data.ticketId || data.ticketNumber,
  { message: 'Either ticketId OR ticketNumber required' }
);

type TicketAddCommentInput = z.infer<typeof ticketAddCommentSchema>;

async function handler(input: TicketAddCommentInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { ticketId, ticketNumber, projectId, ...payload } = input;

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

    const response = await httpClient.post<ApiResponse<TicketComment>>(
      `/api/tickets/${resolvedTicketId}/comments`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to add comment',
        response.error?.code
      );
    }

    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId: resolvedProjectId };
    logger.info('[ticket.addComment] Comment added', { id: resolvedTicketId, ...identifier });
    // Return comment data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify({
      id: response.data.id,
      author: response.data.author,
      content: response.data.content,
      createdAt: response.data.createdAt,
      preview: response.data.content.slice(0, 160),
    }, null, 2);
  } catch (error) {
    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId: resolvedProjectId };
    logger.error('[ticket.addComment] Unexpected error', { error, ...identifier });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketAddCommentTool: ToolDefinition = {
  name: 'projectpulse_ticket_addComment',
  description: `Add a progress note or clarification comment to an existing ticket.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Ticket #5"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)`,
  schema: ticketAddCommentSchema,
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
      content: { type: 'string', description: 'Comment body (supports Markdown)' },
      author: {
        type: 'string',
        description: 'Optional author override (defaults to Anonymous)',
      },
    },
    required: ['content'],  // Only content is always required
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketAddCommentSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
