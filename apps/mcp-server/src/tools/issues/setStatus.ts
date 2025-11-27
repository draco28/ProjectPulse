/**
 * Issue SetStatus Adapter - Backwards Compatibility
 *
 * Maps legacy issue_setStatus to ticket_setStatus (passthrough).
 * Uses issueId parameter mapped to ticketId.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  buildErrorPayload,
  summarizeTicket,
  ticketIdSchema,
} from '../tickets/common.js';

const issueSetStatusSchema = z.object({
  issueId: ticketIdSchema,
  status: z.string().min(1, 'Status is required'),
});

type IssueSetStatusInput = z.infer<typeof issueSetStatusSchema>;

async function handler(input: IssueSetStatusInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { issueId, status } = input;

  try {
    const response = await httpClient.patch<ApiResponse<TicketRecord>>(
      `/api/tickets/${issueId}/status`,
      { status }
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to update status',
        response.error?.code
      );
    }

    logger.info('[issue.setStatus] Status updated (via ticket adapter)', { issueId, status });
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    logger.error('[issue.setStatus] Unexpected error', { error, issueId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueSetStatusTool: ToolDefinition = {
  name: 'projectpulse_issue_setStatus',
  description:
    '[LEGACY] Update issue status. Maps to ticket_setStatus. Use projectpulse_ticket_setStatus for new integrations.',
  schema: issueSetStatusSchema,
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'number', description: 'Issue identifier (maps to ticketId)' },
      status: { type: 'string', description: 'New status value' },
    },
    required: ['issueId', 'status'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueSetStatusSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
