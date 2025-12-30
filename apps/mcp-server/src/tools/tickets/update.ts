import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketRecord,
  baseTicketFields,
  buildErrorPayload,
  ticketInputProperties,
  summarizeTicket,
  ticketNumberSchema,
  projectIdSchema,
} from './common.js';

// Sprint 17: Dual-input schema - accept either ticketId OR (ticketNumber + projectId)
const ticketUpdateSchema = baseTicketFields
  .omit({ projectId: true })
  .partial() // All fields optional for updates
  .extend({
    ticketId: z.number().int().positive().optional(),         // Global ID (existing)
    ticketNumber: ticketNumberSchema.optional(),              // Project-scoped (NEW)
    projectId: projectIdSchema.optional(),                    // Required with ticketNumber
  })
  .refine(
    (data) => data.ticketId || (data.ticketNumber && data.projectId),
    { message: 'Either ticketId OR (ticketNumber + projectId) required' }
  )
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.kind !== undefined ||
      data.source !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.module !== undefined ||
      data.assignee !== undefined ||
      data.assigneeType !== undefined ||
      data.assigneeId !== undefined ||
      data.linkedTaskId !== undefined ||
      data.labelIds !== undefined ||
      data.customFields !== undefined ||
      data.context !== undefined ||
      // Sprint 13: Hierarchy and traceability fields
      data.parentTicketId !== undefined ||
      data.epicRef !== undefined ||
      data.backlogRefs !== undefined ||
      data.sprintNumber !== undefined ||
      // Sprint 15: Kanban ordering
      data.displayOrder !== undefined,
    {
      message: 'Provide at least one field to update',
      path: [],
    }
  );

type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

async function handler(input: TicketUpdateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  // Sprint 17: Extract identifier fields, rest is payload
  const { ticketId, ticketNumber, projectId, ...payload } = input;

  try {
    // Sprint 17: Resolve ticketId if ticketNumber was provided
    let resolvedTicketId = ticketId;
    if (!resolvedTicketId && ticketNumber && projectId) {
      // Look up the ticket by project-scoped number first
      const lookupResponse = await httpClient.get<ApiResponse<{ id: number }>>(
        `/api/tickets/by-number/${projectId}/${ticketNumber}`
      );
      if (!lookupResponse.data) {
        return buildErrorPayload(
          `Ticket #${ticketNumber} not found in project ${projectId}`,
          'NOT_FOUND'
        );
      }
      resolvedTicketId = lookupResponse.data.id;
    }

    const response = await httpClient.patch<ApiResponse<TicketRecord>>(
      `/api/tickets/${resolvedTicketId}`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to update ticket',
        response.error?.code
      );
    }

    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId };
    logger.info('[ticket.update] Ticket updated', { id: resolvedTicketId, ...identifier });
    // Return ticket data directly (tests expect flat structure without status/data wrapper)
    return JSON.stringify(summarizeTicket(response.data), null, 2);
  } catch (error) {
    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId };
    logger.error('[ticket.update] Unexpected error', { error, ...identifier });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketUpdateTool: ToolDefinition = {
  name: 'projectpulse_ticket_update',
  description: `Update an existing ticket (kind, source, status, priority, module, assignee, labels, custom fields, or context metadata). Does not change comments; use ticket.addComment for notes.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Ticket #5"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)

HIERARCHY (Sprint 13):
- Set parentTicketId to link ticket under a feature
- Set parentTicketId to null to unlink from parent
- Circular references are prevented automatically
- Only task/issue/bug/tech_debt can have parents`,
  schema: ticketUpdateSchema,
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
        description: 'Project ID (required when using ticketNumber)',
      },
      title: ticketInputProperties.title,
      description: ticketInputProperties.description,
      kind: ticketInputProperties.kind,
      source: ticketInputProperties.source,
      status: ticketInputProperties.status,
      priority: ticketInputProperties.priority,
      module: ticketInputProperties.module,
      assignee: ticketInputProperties.assignee,
      assigneeType: ticketInputProperties.assigneeType,
      assigneeId: ticketInputProperties.assigneeId,
      linkedTaskId: ticketInputProperties.linkedTaskId,
      labelIds: ticketInputProperties.labelIds,
      customFields: ticketInputProperties.customFields,
      context: ticketInputProperties.context,
      // Sprint 13: Hierarchy and traceability fields
      parentTicketId: ticketInputProperties.parentTicketId,
      epicRef: ticketInputProperties.epicRef,
      backlogRefs: ticketInputProperties.backlogRefs,
      sprintNumber: ticketInputProperties.sprintNumber,
      // Sprint 15: Kanban ordering
      displayOrder: ticketInputProperties.displayOrder,
    },
    required: [],  // No single field required - validation uses refine() for either/or
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketUpdateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
