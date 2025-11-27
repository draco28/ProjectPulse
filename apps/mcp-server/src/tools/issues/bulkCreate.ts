/**
 * Issue BulkCreate Adapter - Backwards Compatibility
 *
 * Maps legacy issue_bulkCreate to ticket_bulkCreate with kind=issue default.
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

const issueItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(50000).optional(),
  kind: legacyKindSchema.optional(),
  source: ticketSourceSchema.optional().default('agent'),
  status: z.string().optional(),
  priority: z.string().optional(),
  module: z.string().optional(),
  assignee: z.string().optional(),
  labelIds: z.array(z.number().int().positive()).max(25).optional(),
  customFields: z.record(z.unknown()).optional(),
  context: ticketContextSchema.optional(),
  reference: z.string().optional(),
});

const issueBulkCreateSchema = z.object({
  projectId: z.number().int().positive().optional(),
  issues: z.array(issueItemSchema).min(1).max(50),
});

type IssueBulkCreateInput = z.infer<typeof issueBulkCreateSchema>;

interface BulkCreateResponse {
  created: number;
  failed: number;
  total: number;
  results: Array<{
    success: boolean;
    ticket?: { id: number; title: string; kind: string; reference?: string };
    error?: string;
    reference?: string;
  }>;
}

async function handler(input: IssueBulkCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  // Map issues to tickets with kind defaulting to 'issue'
  const tickets = input.issues.map((issue) => ({
    ...issue,
    kind: issue.kind ?? 'issue',
    source: issue.source ?? 'agent',
  }));

  try {
    const response = await httpClient.post<ApiResponse<BulkCreateResponse>>('/api/tickets/bulk', {
      projectId: input.projectId,
      tickets,
    });

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Bulk create failed',
        response.error?.code
      );
    }

    const successResults = response.data.results.filter((r) => r.success);
    const errorResults = response.data.results.filter((r) => !r.success);

    logger.info('[issue.bulkCreate] Issues created (via ticket adapter)', {
      count: successResults.length,
      errors: errorResults.length,
    });

    return JSON.stringify({
      created: successResults.map((r) => r.ticket),
      errors: errorResults.map((r, i) => ({
        index: i,
        error: r.error,
        reference: r.reference,
      })),
      summary: {
        total: input.issues.length,
        succeeded: response.data.created,
        failed: response.data.failed,
      },
    }, null, 2);
  } catch (error) {
    logger.error('[issue.bulkCreate] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueBulkCreateTool: ToolDefinition = {
  name: 'projectpulse_issue_bulkCreate',
  description:
    '[LEGACY] Bulk create issues. Maps to ticket_bulkCreate with kind=issue default. Use projectpulse_ticket_bulkCreate for new integrations.',
  schema: issueBulkCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project identifier' },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            kind: { type: 'string', enum: ['issue', 'bug', 'scanner_finding'] },
            source: { type: 'string', enum: ['manual', 'scanner', 'agent', 'onboarding'] },
            status: { type: 'string' },
            priority: { type: 'string' },
            module: { type: 'string' },
            assignee: { type: 'string' },
            reference: { type: 'string' },
          },
          required: ['title'],
        },
        minItems: 1,
        maxItems: 50,
      },
    },
    required: ['issues'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueBulkCreateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
