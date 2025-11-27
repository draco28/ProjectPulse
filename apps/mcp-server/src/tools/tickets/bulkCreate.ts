import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  baseTicketFields,
  buildErrorPayload,
  buildSuccessPayload,
  ticketInputProperties,
  summarizeTicket,
} from './common.js';

interface TicketBulkResponse {
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

const bulkTicketSchema = baseTicketFields.omit({ projectId: true }).extend({
  reference: z.string().max(64).optional(),
});

const bulkCreateSchema = z.object({
  projectId: z.number().int().positive().optional(),
  tickets: z.array(bulkTicketSchema).min(1).max(50),
});

type TicketBulkCreateInput = z.infer<typeof bulkCreateSchema>;

async function handler(input: TicketBulkCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  try {
    const response = await httpClient.post<ApiResponse<TicketBulkResponse>>(
      '/api/tickets/bulk',
      input
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Bulk ticket creation failed',
        response.error?.code
      );
    }

    const successResults = response.data.results.filter((r) => r.success);

    logger.info('[ticket.bulkCreate] Bulk insert completed', {
      created: response.data.created,
    });

    // Return flat structure (tests expect created/failed/tickets at root level)
    return JSON.stringify({
      created: response.data.created,
      failed: response.data.failed,
      total: response.data.total,
      tickets: successResults.map((r) => r.ticket),
    }, null, 2);
  } catch (error) {
    logger.error('[ticket.bulkCreate] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketBulkCreateTool: ToolDefinition = {
  name: 'projectpulse_ticket_bulkCreate',
  description:
    'Bulk create 1-50 tickets in a single atomic transaction (used for scanner findings or checklist imports). Auto-tagging and context metadata supported.',
  schema: bulkCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: ticketInputProperties.projectId,
      tickets: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            ...ticketInputProperties,
            reference: {
              type: 'string',
              description: 'Optional reference or correlation identifier',
            },
          },
          required: ['title', 'kind', 'source'],
        },
      },
    },
    required: ['tickets'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = bulkCreateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
