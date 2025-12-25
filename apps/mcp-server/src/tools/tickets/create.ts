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

// Extended response type that includes _suggestions from Sprint 15 auto-population
interface TicketCreateResponse extends TicketRecord {
  _suggestions?: {
    backlogRefsAutoPopulated: boolean;
    message: string;
  };
}

async function handler(input: TicketCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  try {
    const response = await httpClient.post<ApiResponse<TicketCreateResponse>>('/api/tickets', input);

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to create ticket',
        response.error?.code
      );
    }

    // Sprint 15: Extract _suggestions before summarizing (it's response-level, not persisted)
    const { _suggestions, ...ticketData } = response.data;

    logger.info('[ticket.create] Ticket created', {
      id: response.data.id,
      kind: response.data.kind,
      source: response.data.source,
      backlogRefsAutoPopulated: _suggestions?.backlogRefsAutoPopulated ?? false,
    });

    // Build response with summarized ticket + any suggestions
    const result = {
      ...summarizeTicket(ticketData),
      // Sprint 15: Include auto-population hints for agent awareness
      ..._suggestions && { _suggestions },
    };

    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(result, null, 2);
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

HIERARCHY (Sprint 13):
- Only 'feature' tickets can have children
- Only 'task', 'issue', 'bug', 'tech_debt' can have a parent
- Use parentTicketId to create child tickets under a feature
- Use epicRef for soft epic references (NOT parent-child)
- Use sprintNumber to organize work by sprint

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
