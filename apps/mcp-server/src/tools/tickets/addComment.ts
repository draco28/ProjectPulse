import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketComment,
  buildErrorPayload,
  buildSuccessPayload,
  ticketIdSchema,
} from './common.js';

const ticketAddCommentSchema = z.object({
  ticketId: ticketIdSchema,
  content: z.string().min(1).max(10000),
  author: z.string().max(120).optional(),
});

type TicketAddCommentInput = z.infer<typeof ticketAddCommentSchema>;

async function handler(input: TicketAddCommentInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { ticketId, ...payload } = input;

  try {
    const response = await httpClient.post<ApiResponse<TicketComment>>(
      `/api/tickets/${ticketId}/comments`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to add comment',
        response.error?.code
      );
    }

    logger.info('[ticket.addComment] Comment added', { ticketId });
    // Return comment data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify({
      id: response.data.id,
      author: response.data.author,
      content: response.data.content,
      createdAt: response.data.createdAt,
      preview: response.data.content.slice(0, 160),
    }, null, 2);
  } catch (error) {
    logger.error('[ticket.addComment] Unexpected error', { error, ticketId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketAddCommentTool: ToolDefinition = {
  name: 'projectpulse_ticket_addComment',
  description: 'Add a progress note or clarification comment to an existing ticket.',
  schema: ticketAddCommentSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: { type: 'number', description: 'Ticket identifier' },
      content: { type: 'string', description: 'Comment body (supports Markdown)' },
      author: {
        type: 'string',
        description: 'Optional author override (defaults to Anonymous)',
      },
    },
    required: ['ticketId', 'content'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketAddCommentSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
