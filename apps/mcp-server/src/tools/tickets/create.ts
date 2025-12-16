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

const ticketCreateSchema = baseTicketFields.extend({
  title: baseTicketFields.shape.title,
  kind: baseTicketFields.shape.kind,
  source: baseTicketFields.shape.source,
});

type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

async function handler(input: TicketCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  try {
    const response = await httpClient.post<ApiResponse<TicketRecord>>('/api/tickets', input);

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to create ticket',
        response.error?.code
      );
    }

    logger.info('[ticket.create] Ticket created', {
      id: response.data.id,
      kind: response.data.kind,
      source: response.data.source,
    });
    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    logger.error('[ticket.create] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketCreateTool: ToolDefinition = {
  name: 'projectpulse_ticket_create',
  description: `[ACTION] Create a new ticket in ProjectPulse.

Kinds: feature, task, epic, issue, bug, scanner_finding, tech_debt
Sources: manual, scanner, agent, onboarding
Priorities: low, medium, high, critical

RECOMMENDED: Search existing tickets first with projectpulse_ticket_search
to avoid duplicates.

Supports: Auto-tagging context (files + metadata) for intelligent labeling

If tracking work: Consider projectpulse_agent_session_start to link
this ticket to your work session.`,
  schema: ticketCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ...ticketInputProperties,
    },
    required: ['title', 'kind', 'source'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketCreateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return {
      content: [{ type: 'text', text: result }],
    };
  },
};
