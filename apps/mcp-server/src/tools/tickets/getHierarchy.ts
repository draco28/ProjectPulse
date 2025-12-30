/**
 * MCP Tool: Ticket Get Hierarchy (Sprint 13, Sprint 17)
 *
 * Get complete hierarchy context for a ticket (parent + children + siblings)
 * Sprint 17: Added dual-input support (ticketId OR ticketNumber+projectId)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  buildErrorPayload,
  ticketNumberSchema,
  projectIdSchema,
  resolveProjectId,
} from './common.js';

interface TicketLabel {
  id: number;
  name: string;
  color: string;
}

interface TicketSummary {
  id: number;
  ticketNumber: number;  // Sprint 17
  title: string;
  kind: string;
  status: string;
}

interface HierarchyResponse {
  ticket: {
    id: number;
    ticketNumber: number;  // Sprint 17
    title: string;
    description: string | null;
    kind: string;
    status: string;
    priority: string;
    assignee: string | null;
    epicRef: string | null;
    backlogRefs: string[];
    sprintNumber: number | null;
    createdAt: string;
    updatedAt: string;
    labels: TicketLabel[];
    project: { id: number; name: string };
  };
  hierarchy: {
    parent: {
      id: number;
      ticketNumber: number;  // Sprint 17
      title: string;
      kind: string;
      status: string;
      priority: string;
      epicRef: string | null;
      sprintNumber: number | null;
      totalChildren: number;
    } | null;
    children: TicketSummary[];
    childrenCount: number;
    childrenStatusCounts: Record<string, number>;
    siblings: TicketSummary[];
    siblingsCount: number;
  };
  isRoot: boolean;
  isLeaf: boolean;
  canHaveChildren: boolean;
  canHaveParent: boolean;
}

// Sprint 17: Dual-input schema - accept either ticketId OR ticketNumber
// Sprint 18: projectId now auto-fills from auth context when omitted
const getHierarchySchema = z.object({
  ticketId: z.number().int().positive().optional(),      // Global ID (existing)
  ticketNumber: ticketNumberSchema.optional(),           // Project-scoped (NEW)
  projectId: projectIdSchema.optional(),                 // Auto-fills from auth context
}).refine(
  (data) => data.ticketId || data.ticketNumber,
  { message: 'Either ticketId OR ticketNumber required' }
);

type GetHierarchyInput = z.infer<typeof getHierarchySchema>;

async function handler(input: GetHierarchyInput, context: ToolContext): Promise<string> {
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

  // Sprint 17: Resolve ticketId if ticketNumber was provided
  let resolvedTicketId = input.ticketId;
  if (!resolvedTicketId && input.ticketNumber && resolvedProjectId) {
    const lookupResponse = await httpClient.get<ApiResponse<{ id: number }>>(
      `/api/tickets/by-number/${resolvedProjectId}/${input.ticketNumber}`
    );
    if (!lookupResponse.data) {
      return buildErrorPayload(
        `Ticket #${input.ticketNumber} not found in project ${resolvedProjectId}`,
        'NOT_FOUND'
      );
    }
    resolvedTicketId = lookupResponse.data.id;
  }

  try {
    const response = await httpClient.get<ApiResponse<HierarchyResponse>>(
      `/api/tickets/${resolvedTicketId}/hierarchy`
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to get hierarchy',
        response.error?.code
      );
    }

    const data = response.data;

    const identifier = input.ticketId
      ? { ticketId: input.ticketId }
      : { ticketNumber: input.ticketNumber, projectId: resolvedProjectId };
    logger.info('[ticket.getHierarchy] Hierarchy fetched', {
      ...identifier,
      hasParent: !!data.hierarchy.parent,
      childrenCount: data.hierarchy.childrenCount,
    });

    return JSON.stringify({
      ticket: {
        // Sprint 17: ticketNumber first
        ticketNumber: data.ticket.ticketNumber,
        id: data.ticket.id,
        title: data.ticket.title,
        kind: data.ticket.kind,
        status: data.ticket.status,
        priority: data.ticket.priority,
        assignee: data.ticket.assignee,
        epicRef: data.ticket.epicRef,
        backlogRefs: data.ticket.backlogRefs,
        sprintNumber: data.ticket.sprintNumber,
        labels: data.ticket.labels?.map((l) => l.name) ?? [],
        project: data.ticket.project,
      },
      hierarchy: {
        parent: data.hierarchy.parent ? {
          // Sprint 17: ticketNumber first
          ticketNumber: data.hierarchy.parent.ticketNumber,
          id: data.hierarchy.parent.id,
          title: data.hierarchy.parent.title,
          kind: data.hierarchy.parent.kind,
          status: data.hierarchy.parent.status,
          sprintNumber: data.hierarchy.parent.sprintNumber,
          totalChildren: data.hierarchy.parent.totalChildren,
        } : null,
        children: data.hierarchy.children.map((c) => ({
          // Sprint 17: ticketNumber first
          ticketNumber: c.ticketNumber,
          id: c.id,
          title: c.title,
          kind: c.kind,
          status: c.status,
        })),
        childrenCount: data.hierarchy.childrenCount,
        childrenStatusCounts: data.hierarchy.childrenStatusCounts,
        siblings: data.hierarchy.siblings.map((s) => ({
          // Sprint 17: ticketNumber first
          ticketNumber: s.ticketNumber,
          id: s.id,
          title: s.title,
          kind: s.kind,
          status: s.status,
        })),
        siblingsCount: data.hierarchy.siblingsCount,
      },
      isRoot: data.isRoot,
      isLeaf: data.isLeaf,
      canHaveChildren: data.canHaveChildren,
      canHaveParent: data.canHaveParent,
    }, null, 2);
  } catch (error) {
    const identifier = input.ticketId
      ? { ticketId: input.ticketId }
      : { ticketNumber: input.ticketNumber, projectId: resolvedProjectId };
    logger.error('[ticket.getHierarchy] Unexpected error', { error, ...identifier });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketGetHierarchyTool: ToolDefinition = {
  name: 'projectpulse_ticket_getHierarchy',
  description: `[QUERY] Get complete hierarchy context for a ticket.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Ticket #5"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)

Returns all hierarchy information in a single call:
- The ticket itself with full details (includes ticketNumber)
- Parent ticket (if this is a child task)
- Children (if this is a feature with tasks)
- Siblings (other tasks under same parent)
- Status counts for children (progress tracking)

Use this for understanding a ticket's place in the hierarchy before making changes.

AGENT WORKFLOW:
1. Get hierarchy of your assigned ticket
2. See parent feature context
3. See sibling tasks for coordination
4. Check childrenStatusCounts to see progress

Helper fields:
- isRoot: true if no parent
- isLeaf: true if no children
- canHaveChildren: true if kind=feature
- canHaveParent: true if kind=task/issue/bug/tech_debt

Related:
→ projectpulse_ticket_getChildren - Paginated children list
→ projectpulse_ticket_search - Find tickets by filters
→ projectpulse_ticket_update - Update parentTicketId`,
  schema: getHierarchySchema,
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
    required: [],  // Validation uses refine()
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getHierarchySchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
