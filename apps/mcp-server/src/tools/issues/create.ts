/**
 * Issue Create Adapter - Backwards Compatibility
 *
 * Maps legacy issue_create to ticket_create with kind restrictions:
 * - Default kind: 'issue'
 * - Allowed kinds: issue, bug, scanner_finding (legacy issue types)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  ticketSourceSchema,
  ticketContextSchema,
  buildErrorPayload,
  summarizeTicket,
} from '../tickets/common.js';

const legacyKindSchema = z.enum(['issue', 'bug', 'scanner_finding']).default('issue');

const issueCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(50000).optional(),
  kind: legacyKindSchema.optional(),
  source: ticketSourceSchema.optional().default('agent'),
  status: z.string().optional(),
  priority: z.string().optional(),
  module: z.string().optional(),
  assignee: z.string().optional(),
  projectId: z.number().int().positive().optional(),
  labelIds: z.array(z.number().int().positive()).max(25).optional(),
  customFields: z.record(z.unknown()).optional(),
  context: ticketContextSchema.optional(),
});

type IssueCreateInput = z.infer<typeof issueCreateSchema>;

async function handler(input: IssueCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  // Map to ticket with kind defaulting to 'issue'
  const ticketPayload = {
    ...input,
    kind: input.kind ?? 'issue',
    source: input.source ?? 'agent',
  };

  try {
    const response = await httpClient.post<ApiResponse<TicketRecord>>('/api/tickets', ticketPayload);

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to create issue',
        response.error?.code
      );
    }

    logger.info('[issue.create] Issue created (via ticket adapter)', {
      id: response.data.id,
      kind: response.data.kind,
    });

    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    logger.error('[issue.create] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueCreateTool: ToolDefinition = {
  name: 'projectpulse_issue_create',
  description:
    '[LEGACY] Create an issue. Maps to ticket_create with kind=issue|bug|scanner_finding. Use projectpulse_ticket_create for new integrations.',
  schema: issueCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short summary (1-200 characters)' },
      description: { type: 'string', description: 'Detailed description' },
      kind: {
        type: 'string',
        enum: ['issue', 'bug', 'scanner_finding'],
        description: 'Issue type (defaults to issue)',
      },
      source: { type: 'string', enum: ['manual', 'scanner', 'agent', 'onboarding'] },
      status: { type: 'string' },
      priority: { type: 'string' },
      module: { type: 'string' },
      assignee: { type: 'string' },
      projectId: { type: 'number' },
      labelIds: { type: 'array', items: { type: 'number' } },
      customFields: { type: 'object', additionalProperties: true },
      context: { type: 'object' },
    },
    required: ['title'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueCreateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
