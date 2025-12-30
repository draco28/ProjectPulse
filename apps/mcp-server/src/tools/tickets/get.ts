/**
 * MCP Tool: Ticket Get (Sprint 14, Sprint 17)
 *
 * Get full ticket details by ID including customFields, description, comments
 *
 * Sprint 17: Added dual-input support (ticketId OR ticketNumber+projectId)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  buildErrorPayload,
  projectIdSchema,
  resolveProjectId,
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
  ticketNumber: number;  // Sprint 17: Project-scoped number for display
  displayId: string;     // Sprint 17: Computed display ID (ticketNumber or parentNum.position)
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

// Sprint 17: Dual-input schema - accept either ticketId OR ticketNumber
// Sprint 18: projectId now auto-fills from auth context when omitted
const getTicketSchema = z.object({
  ticketId: z.number().int().positive().optional(),      // Global ID (existing)
  ticketNumber: z.number().int().positive().optional(),  // Project-scoped (NEW)
  projectId: projectIdSchema.optional(),                 // Auto-fills from auth context
}).refine(
  (data) => data.ticketId || data.ticketNumber,
  { message: 'Either ticketId OR ticketNumber required' }
);

type GetTicketInput = z.infer<typeof getTicketSchema>;

async function handler(input: GetTicketInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  // Sprint 18: Auto-fill projectId from authenticated context
  const resolvedProjectId = resolveProjectId(input.projectId, context.projectId);

  // Validate we have projectId when using ticketNumber
  if (input.ticketNumber && !input.ticketId && !resolvedProjectId) {
    return buildErrorPayload(
      'projectId required when using ticketNumber (not available from auth context)',
      'MISSING_PROJECT_ID'
    );
  }

  try {
    // Sprint 17: Choose API endpoint based on input type
    let endpoint: string;
    if (input.ticketId) {
      endpoint = `/api/tickets/${input.ticketId}`;
    } else {
      // Use ticketNumber + resolved projectId lookup
      endpoint = `/api/tickets/by-number/${resolvedProjectId}/${input.ticketNumber}`;
    }

    const response = await httpClient.get<ApiResponse<FullTicketResponse>>(endpoint);

    if (!response.data) {
      const identifier = input.ticketId
        ? `ID ${input.ticketId}`
        : `#${input.ticketNumber} in project ${resolvedProjectId}`;
      return buildErrorPayload(
        response.error?.message ?? `Failed to get ticket ${identifier}`,
        response.error?.code
      );
    }

    const ticket = response.data;

    logger.info('[ticket.get] Ticket fetched', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      usedTicketNumber: !input.ticketId,
      hasCustomFields: !!ticket.customFields,
      hasImplementationContext: !!(ticket.customFields as Record<string, unknown>)?._implementationContext,
      commentsCount: ticket.comments?.length ?? 0,
    });

    // Return full ticket data directly (consistent with ticket_create - flat structure)
    // Sprint 17: ticketNumber and displayId are now PRIMARY identifiers for user display
    return JSON.stringify({
      // Sprint 17: Project-scoped identifiers FIRST (what users see)
      ticketNumber: ticket.ticketNumber,
      displayId: ticket.displayId,
      // Global ID (for API calls and FK references)
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
    }, null, 2);
  } catch (error) {
    const identifier = input.ticketId
      ? { ticketId: input.ticketId }
      : { ticketNumber: input.ticketNumber, projectId: resolvedProjectId };
    logger.error('[ticket.get] Unexpected error', { error, ...identifier });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketGetTool: ToolDefinition = {
  name: 'projectpulse_ticket_get',
  description: `[QUERY] Get full ticket details by ID including customFields and implementation context.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Ticket #5"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)
- Response shows both - prefer ticketNumber for user display

When to Use:
- Resuming work on a ticket from a previous session
- Reading implementation context from customFields._implementationContext
- Getting full description, comments, and attachments
- Understanding ticket history and linked resources

Returns: Complete ticket with ALL fields including:
- ticketNumber (project-scoped, what users see: #5)
- displayId (for hierarchy: "5.1", "5.2" for children)
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
→ projectpulse_ticket_search - Find tickets by filters (summaries only)
→ projectpulse_ticket_getHierarchy - Get parent/child relationships
→ projectpulse_ticket_update - Modify ticket after reading`,
  schema: getTicketSchema,
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
        description: 'Project ID (auto-fills from auth context when omitted)',
      },
    },
    required: [],  // No single field required - validation uses refine()
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getTicketSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
