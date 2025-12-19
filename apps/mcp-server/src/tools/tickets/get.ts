/**
 * MCP Tool: Ticket Get (Sprint 14)
 *
 * Get full ticket details by ID including customFields, description, comments
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  buildErrorPayload,
  ticketIdSchema,
} from './common.js';

interface TicketLabel {
  id: number;
  name: string;
  color: string;
}

interface TicketComment {
  id: number;
  content: string;
  author: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketAttachment {
  id: number;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

interface TicketLinkedFile {
  id: number;
  filePath: string;
  lineNumber: number | null;
  createdAt: string;
}

interface TicketLinkedCommit {
  id: number;
  commitHash: string;
  commitMessage: string;
  commitDate: string;
  createdAt: string;
}

interface FullTicketResponse {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  kind: string;
  source: string;
  status: string;
  priority: string;
  module: string | null;
  assignee: string | null;
  assigneeType: string | null;
  assigneeId: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  // Relations
  labels: TicketLabel[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  linkedFiles: TicketLinkedFile[];
  linkedCommits: TicketLinkedCommit[];
  scheduledWeek: {
    id: string;
    title: string;
    sprint: {
      id: string;
      title: string;
      phase: { id: string; title: string };
    };
  } | null;
  project: { id: number; name: string };
  // Hierarchy (Sprint 13)
  parentTicket: { id: number; title: string; kind: string; status: string } | null;
  childTickets: Array<{ id: number; title: string; kind: string; status: string }>;
  // Traceability (Sprint 13)
  epicRef: string | null;
  backlogRefs: string[];
  sprintNumber: number | null;
}

const getTicketSchema = z.object({
  ticketId: ticketIdSchema,
});

type GetTicketInput = z.infer<typeof getTicketSchema>;

async function handler(input: GetTicketInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  try {
    const response = await httpClient.get<ApiResponse<FullTicketResponse>>(
      `/api/tickets/${input.ticketId}`
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to get ticket',
        response.error?.code
      );
    }

    const ticket = response.data;

    logger.info('[ticket.get] Ticket fetched', {
      ticketId: input.ticketId,
      hasCustomFields: !!ticket.customFields,
      hasImplementationContext: !!(ticket.customFields as Record<string, unknown>)?._implementationContext,
      commentsCount: ticket.comments?.length ?? 0,
    });

    // Return full ticket data (no summarization - that's the point of this tool)
    return JSON.stringify({
      status: 'success',
      data: {
        id: ticket.id,
        projectId: ticket.projectId,
        title: ticket.title,
        description: ticket.description,
        kind: ticket.kind,
        source: ticket.source,
        status: ticket.status,
        priority: ticket.priority,
        module: ticket.module,
        assignee: ticket.assignee,
        assigneeType: ticket.assigneeType,
        assigneeId: ticket.assigneeId,
        customFields: ticket.customFields,  // Full customFields including _implementationContext!
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        closedAt: ticket.closedAt,
        // Relations
        labels: ticket.labels?.map((l) => ({ id: l.id, name: l.name, color: l.color })) ?? [],
        comments: ticket.comments ?? [],
        attachments: ticket.attachments ?? [],
        linkedFiles: ticket.linkedFiles ?? [],
        linkedCommits: ticket.linkedCommits ?? [],
        scheduledWeek: ticket.scheduledWeek,
        project: ticket.project,
        // Hierarchy
        parentTicket: ticket.parentTicket,
        childTickets: ticket.childTickets ?? [],
        // Traceability
        epicRef: ticket.epicRef,
        backlogRefs: ticket.backlogRefs ?? [],
        sprintNumber: ticket.sprintNumber,
      },
    }, null, 2);
  } catch (error) {
    logger.error('[ticket.get] Unexpected error', { error, ticketId: input.ticketId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketGetTool: ToolDefinition = {
  name: 'projectpulse_ticket_get',
  description: `[QUERY] Get full ticket details by ID including customFields and implementation context.

When to Use:
- Resuming work on a ticket from a previous session
- Reading implementation context from customFields._implementationContext
- Getting full description, comments, and attachments
- Understanding ticket history and linked resources

Returns: Complete ticket with ALL fields including:
- Full description (up to 50k chars)
- customFields with _implementationContext (implementation blueprint, files to modify, etc.)
- All comments
- Attachments and linked files
- Parent/child hierarchy
- Traceability data (epicRef, backlogRefs, sprintNumber)

AGENT WORKFLOW:
1. Search for ticket with ticket_search (returns summaries)
2. Get full details with this tool (returns everything)
3. Read _implementationContext.implementationBlueprint
4. Continue work based on the plan

Related:
\u2192 projectpulse_ticket_search - Find tickets by filters (summaries only)
\u2192 projectpulse_ticket_getHierarchy - Get parent/child relationships
\u2192 projectpulse_ticket_update - Modify ticket after reading`,
  schema: getTicketSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: {
        type: 'number',
        description: 'ID of the ticket to retrieve',
      },
    },
    required: ['ticketId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getTicketSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
