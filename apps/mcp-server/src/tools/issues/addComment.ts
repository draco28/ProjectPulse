/**
 * Issue AddComment Adapter - Backwards Compatibility
 *
 * Maps legacy issue_addComment to ticket_addComment (passthrough).
 * Uses issueId parameter mapped to ticketId.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { ApiResponse, TicketComment, buildErrorPayload, ticketIdSchema } from '../tickets/common.js';

const issueAddCommentSchema = z.object({
  issueId: ticketIdSchema,
  content: z.string().min(1).max(10000),
  author: z.string().max(120).optional(),
});

type IssueAddCommentInput = z.infer<typeof issueAddCommentSchema>;

async function handler(input: IssueAddCommentInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { issueId, ...payload } = input;

  try {
    const response = await httpClient.post<ApiResponse<TicketComment>>(
      `/api/tickets/${issueId}/comments`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to add comment',
        response.error?.code
      );
    }

    logger.info('[issue.addComment] Comment added (via ticket adapter)', { issueId });
    return JSON.stringify({
      id: response.data.id,
      content: response.data.content,
      author: response.data.author,
      createdAt: response.data.createdAt,
      ticketId: response.data.ticketId,
    }, null, 2);
  } catch (error) {
    logger.error('[issue.addComment] Unexpected error', { error, issueId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueAddCommentTool: ToolDefinition = {
  name: 'projectpulse_issue_addComment',
  description:
    '[LEGACY] Add comment to issue. Maps to ticket_addComment. Use projectpulse_ticket_addComment for new integrations.',
  schema: issueAddCommentSchema,
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'number', description: 'Issue identifier (maps to ticketId)' },
      content: { type: 'string', description: 'Comment body (supports Markdown)' },
      author: { type: 'string', description: 'Optional author override' },
    },
    required: ['issueId', 'content'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueAddCommentSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
