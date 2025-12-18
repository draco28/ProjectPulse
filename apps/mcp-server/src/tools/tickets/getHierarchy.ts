/**
 * MCP Tool: Ticket Get Hierarchy (Sprint 13)
 *
 * Get complete hierarchy context for a ticket (parent + children + siblings)
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

interface TicketSummary {
  id: number;
  title: string;
  kind: string;
  status: string;
}

interface HierarchyResponse {
  ticket: {
    id: number;
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

const getHierarchySchema = z.object({
  ticketId: ticketIdSchema,
});

type GetHierarchyInput = z.infer<typeof getHierarchySchema>;

async function handler(input: GetHierarchyInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  try {
    const response = await httpClient.get<ApiResponse<HierarchyResponse>>(
      `/api/tickets/${input.ticketId}/hierarchy`
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to get hierarchy',
        response.error?.code
      );
    }

    const data = response.data;

    logger.info('[ticket.getHierarchy] Hierarchy fetched', {
      ticketId: input.ticketId,
      hasParent: !!data.hierarchy.parent,
      childrenCount: data.hierarchy.childrenCount,
    });

    return JSON.stringify({
      ticket: {
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
          id: data.hierarchy.parent.id,
          title: data.hierarchy.parent.title,
          kind: data.hierarchy.parent.kind,
          status: data.hierarchy.parent.status,
          sprintNumber: data.hierarchy.parent.sprintNumber,
          totalChildren: data.hierarchy.parent.totalChildren,
        } : null,
        children: data.hierarchy.children.map((c) => ({
          id: c.id,
          title: c.title,
          kind: c.kind,
          status: c.status,
        })),
        childrenCount: data.hierarchy.childrenCount,
        childrenStatusCounts: data.hierarchy.childrenStatusCounts,
        siblings: data.hierarchy.siblings.map((s) => ({
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
    logger.error('[ticket.getHierarchy] Unexpected error', { error, ticketId: input.ticketId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketGetHierarchyTool: ToolDefinition = {
  name: 'projectpulse_ticket_getHierarchy',
  description: `[QUERY] Get complete hierarchy context for a ticket.

Returns all hierarchy information in a single call:
- The ticket itself with full details
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
        description: 'ID of the ticket to get hierarchy for',
      },
    },
    required: ['ticketId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getHierarchySchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
