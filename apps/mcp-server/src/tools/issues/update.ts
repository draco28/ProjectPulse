/**
 * Issue Update Adapter - Backwards Compatibility
 *
 * Maps legacy issue_update to ticket_update (passthrough).
 * Uses issueId parameter mapped to ticketId.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  ticketContextSchema,
  buildErrorPayload,
  summarizeTicket,
  ticketIdSchema,
} from '../tickets/common.js';

const issueUpdateSchema = z.object({
  issueId: ticketIdSchema,
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(50000).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  module: z.string().optional(),
  assignee: z.string().optional(),
  labelIds: z.array(z.number().int().positive()).max(25).optional(),
  customFields: z.record(z.unknown()).optional(),
  context: ticketContextSchema.optional(),
});

type IssueUpdateInput = z.infer<typeof issueUpdateSchema>;

async function handler(input: IssueUpdateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { issueId, ...payload } = input;

  try {
    const response = await httpClient.patch<ApiResponse<TicketRecord>>(
      `/api/tickets/${issueId}`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to update issue',
        response.error?.code
      );
    }

    logger.info('[issue.update] Issue updated (via ticket adapter)', { id: issueId });
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    logger.error('[issue.update] Unexpected error', { error, issueId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueUpdateTool: ToolDefinition = {
  name: 'projectpulse_issue_update',
  description:
    '[LEGACY] Update an issue. Maps to ticket_update. Use projectpulse_ticket_update for new integrations.',
  schema: issueUpdateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'number', description: 'Issue identifier (maps to ticketId)' },
      title: { type: 'string' },
      description: { type: 'string' },
      status: { type: 'string' },
      priority: { type: 'string' },
      module: { type: 'string' },
      assignee: { type: 'string' },
      labelIds: { type: 'array', items: { type: 'number' } },
      customFields: { type: 'object', additionalProperties: true },
      context: { type: 'object' },
    },
    required: ['issueId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueUpdateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
