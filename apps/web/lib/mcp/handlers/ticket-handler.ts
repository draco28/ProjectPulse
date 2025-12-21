/**
 * MCP Ticket Tools Handler
 *
 * Sprint 10 - Ticket System (Week 2)
 * Created: 2025-11-26
 *
 * Provides MCP tool handlers for ticket (unified work item) operations:
 * - ticket.create - Create a new ticket (feature, task, epic, issue, bug, etc.)
 * - ticket.bulkCreate - Bulk create tickets (up to 50)
 * - ticket.update - Update ticket fields
 * - ticket.search - Search tickets with filters
 * - ticket.addComment - Add comment to ticket
 * - ticket.setStatus - Update ticket status
 *
 * Architecture:
 * - Tool handlers are registered with MCP server
 * - Each handler validates input, calls Prisma, formats output
 * - Errors are caught and converted to MCPError for JSON-RPC responses
 *
 * @see apps/web/app/api/tickets/route.ts - REST API
 * @see apps/web/lib/validations/ticket.ts - Zod schemas
 */

import { prisma } from '@/lib/prisma';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';
import { Prisma } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

// Sprint 11.7: Implementation Context types for MCP
export interface ImplementationContextInput {
  phaseSprintRef?: {
    phaseId?: string;
    sprintId?: string;
    weekId?: string;
    displayName?: string;
  };
  filesToModify?: Array<{
    path: string;
    reason?: string;
    estimatedChanges?: 'minor' | 'moderate' | 'major';
  }>;
  filesToCreate?: Array<{
    path: string;
    purpose?: string;
    template?: string;
  }>;
  schemaChanges?: {
    required: boolean;
    migrationName?: string;
    models?: string[];
    description?: string;
  };
  implementationBlueprint?: string;
}

export interface TicketCreateInput {
  projectId?: number;
  title: string;
  description?: string;
  kind?: 'feature' | 'task' | 'epic' | 'issue' | 'bug' | 'scanner_finding' | 'tech_debt';
  source?: 'manual' | 'onboarding' | 'scanner' | 'agent';
  status?: string;
  priority?: string;
  module?: string;
  assignee?: string;
  assigneeType?: 'human' | 'agent_persona';
  assigneeId?: string; // String ID (User ID or AgentPersona ID)
  linkedTaskId?: string;
  labelIds?: number[];
  customFields?: Record<string, unknown>;
  // Sprint 11.7: Milestone and Due Date
  dueDate?: string; // ISO datetime string
  milestoneId?: number;
  // Sprint 11.7: Implementation Context
  implementationContext?: ImplementationContextInput;
}

export interface TicketCreateOutput {
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
  customFields: Record<string, unknown> | null;
  createdAt: string;
  // Sprint 11.7: Milestone and Due Date
  dueDate: string | null;
  milestone: { id: number; name: string } | null;
}

export interface TicketBulkCreateInput {
  projectId?: number;
  tickets: Array<Omit<TicketCreateInput, 'projectId'>>;
}

export interface TicketBulkCreateOutput {
  created: number;
  tickets: TicketCreateOutput[];
}

export interface TicketUpdateInput {
  ticketId: number;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  module?: string;
  assignee?: string;
  assigneeType?: 'human' | 'agent_persona';
  assigneeId?: string; // String ID (User ID or AgentPersona ID)
  linkedTaskId?: string;
  labelIds?: number[];
  customFields?: Record<string, unknown>;
  // Sprint 11.7: Milestone and Due Date
  dueDate?: string | null; // ISO datetime string, null to clear
  milestoneId?: number | null; // null to unassign milestone
  // Sprint 11.7: Implementation Context (null to remove)
  implementationContext?: ImplementationContextInput | null;
}

export interface TicketUpdateOutput {
  id: number;
  title: string;
  description: string | null;
  kind: string;
  status: string;
  priority: string;
  module: string | null;
  assignee: string | null;
  updatedAt: string;
  // Sprint 11.7: Milestone and Due Date
  dueDate: string | null;
  milestone: { id: number; name: string } | null;
}

export interface TicketSearchInput {
  projectId?: number;
  search?: string;
  kind?: string[];
  status?: string[];
  priority?: string[];
  module?: string[];
  assignee?: string[];
  tags?: string[];
  createdFrom?: string;
  createdTo?: string;
  // Sprint 11.7: Milestone and Due Date filters
  milestoneId?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean; // Filter for overdue tickets only
  // Sprint 11.7: Implementation Context filters
  hasImplementationContext?: boolean; // Filter tickets with/without context
  requiresSchemaChanges?: boolean; // Filter tickets requiring DB migration
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate';
  sortDirection?: 'asc' | 'desc';
}

export interface TicketSearchOutput {
  tickets: Array<{
    id: number;
    title: string;
    description: string | null;
    kind: string;
    status: string;
    priority: string;
    module: string | null;
    assignee: string | null;
    createdAt: string;
    updatedAt: string;
    // Sprint 11.7: Milestone and Due Date
    dueDate: string | null;
    milestone: { id: number; name: string } | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TicketAddCommentInput {
  ticketId: number;
  content: string;
  author?: string;
}

export interface TicketAddCommentOutput {
  id: number;
  ticketId: number;
  content: string;
  author: string;
  createdAt: string;
}

export interface TicketSetStatusInput {
  ticketId: number;
  status: string;
}

export interface TicketSetStatusOutput {
  id: number;
  status: string;
  closedAt: string | null;
  updatedAt: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Resolve and validate project ID
 *
 * Sprint 11.7: Removed unsafe fallback to first project.
 * MCP handlers now REQUIRE explicit projectId to prevent cross-project data access.
 */
async function resolveProjectId(projectId?: number): Promise<number> {
  if (!projectId) {
    throw new MCPError(
      'projectId is required. Specify the project to work with.',
      JSONRPC_ERROR_CODES.INVALID_PARAMS,
      400
    );
  }

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new MCPError(`Project ${projectId} not found`, JSONRPC_ERROR_CODES.INVALID_PARAMS, 404);
  }

  return projectId;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * ticket.create - Create a new ticket
 */
export async function ticketCreateHandler(input: unknown): Promise<TicketCreateOutput> {
  try {
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as TicketCreateInput;

    // Validate required fields
    if (!params.title || typeof params.title !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: title (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (params.title.length < 1 || params.title.length > 200) {
      throw new MCPError(
        'Invalid title length: must be 1-200 characters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Resolve project ID
    const projectId = await resolveProjectId(params.projectId);

    // Sprint 11.7: Merge implementation context into customFields
    const customFieldsPayload: Record<string, unknown> = {
      ...(params.customFields ?? {}),
    };
    if (params.implementationContext) {
      customFieldsPayload._implementationContext = {
        ...params.implementationContext,
        filesToModify: params.implementationContext.filesToModify ?? [],
        filesToCreate: params.implementationContext.filesToCreate ?? [],
      };
    }

    // Build create data
    const createData: Prisma.TicketCreateInput = {
      project: { connect: { id: projectId } },
      title: params.title,
      description: params.description || null,
      kind: params.kind || 'issue',
      source: params.source || 'manual',
      status: params.status || 'open',
      priority: params.priority || 'medium',
      module: params.module || null,
      assignee: params.assignee || null,
      assigneeType: params.assigneeType || null,
      assigneeId: params.assigneeId || null,
      customFields:
        Object.keys(customFieldsPayload).length > 0
          ? (customFieldsPayload as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      // Sprint 11.7: Milestone and Due Date
      dueDate: params.dueDate ? new Date(params.dueDate) : null,
    };

    // Sprint 12: linkedTask removed - tickets now schedule via scheduledWeekId

    // Sprint 11.7: Link to milestone if provided
    if (params.milestoneId) {
      // Validate milestone exists and belongs to same project
      const milestone = await prisma.milestone.findFirst({
        where: { id: params.milestoneId, projectId },
      });
      if (!milestone) {
        throw new MCPError(
          `Milestone ${params.milestoneId} not found in project ${projectId}`,
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          404
        );
      }
      createData.milestone = { connect: { id: params.milestoneId } };
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: createData,
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        kind: true,
        source: true,
        status: true,
        priority: true,
        module: true,
        assignee: true,
        customFields: true,
        createdAt: true,
        // Sprint 11.7: Include milestone and dueDate
        dueDate: true,
        milestone: {
          select: { id: true, name: true },
        },
      },
    });

    // Connect labels if provided
    if (params.labelIds && params.labelIds.length > 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          labels: {
            connect: params.labelIds.map((id) => ({ id })),
          },
        },
      });
    }

    return {
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
      customFields: ticket.customFields as Record<string, unknown> | null,
      createdAt: ticket.createdAt.toISOString(),
      // Sprint 11.7: Milestone and Due Date
      dueDate: ticket.dueDate?.toISOString() || null,
      milestone: ticket.milestone ? { id: ticket.milestone.id, name: ticket.milestone.name } : null,
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;

    throw new MCPError(
      error instanceof Error ? error.message : 'Failed to create ticket',
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * ticket.bulkCreate - Bulk create tickets (up to 50)
 */
export async function ticketBulkCreateHandler(input: unknown): Promise<TicketBulkCreateOutput> {
  try {
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as TicketBulkCreateInput;

    if (!Array.isArray(params.tickets) || params.tickets.length === 0) {
      throw new MCPError(
        'Missing or invalid required field: tickets (non-empty array)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (params.tickets.length > 50) {
      throw new MCPError(
        'Too many tickets: maximum 50 per request',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Resolve project ID
    const projectId = await resolveProjectId(params.projectId);

    // Create tickets in transaction
    // Note: bulkCreate doesn't support milestone linking (use single create for that)
    const createdTickets = await prisma.$transaction(
      params.tickets.map((ticket) =>
        prisma.ticket.create({
          data: {
            project: { connect: { id: projectId } },
            title: ticket.title,
            description: ticket.description || null,
            kind: ticket.kind || 'issue',
            source: ticket.source || 'manual',
            status: ticket.status || 'open',
            priority: ticket.priority || 'medium',
            module: ticket.module || null,
            assignee: ticket.assignee || null,
            customFields: (ticket.customFields as Prisma.InputJsonValue) || Prisma.JsonNull,
            // Sprint 11.7: Support dueDate in bulk create
            dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null,
          },
          select: {
            id: true,
            projectId: true,
            title: true,
            description: true,
            kind: true,
            source: true,
            status: true,
            priority: true,
            module: true,
            assignee: true,
            customFields: true,
            createdAt: true,
            // Sprint 11.7: Include dueDate and milestone
            dueDate: true,
            milestone: {
              select: { id: true, name: true },
            },
          },
        })
      )
    );

    return {
      created: createdTickets.length,
      tickets: createdTickets.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description,
        kind: t.kind,
        source: t.source,
        status: t.status,
        priority: t.priority,
        module: t.module,
        assignee: t.assignee,
        customFields: t.customFields as Record<string, unknown> | null,
        createdAt: t.createdAt.toISOString(),
        // Sprint 11.7: Include dueDate and milestone
        dueDate: t.dueDate?.toISOString() || null,
        milestone: t.milestone ? { id: t.milestone.id, name: t.milestone.name } : null,
      })),
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;

    throw new MCPError(
      error instanceof Error ? error.message : 'Failed to bulk create tickets',
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * ticket.update - Update ticket fields
 */
export async function ticketUpdateHandler(input: unknown): Promise<TicketUpdateOutput> {
  try {
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as TicketUpdateInput;

    if (typeof params.ticketId !== 'number') {
      throw new MCPError(
        'Missing or invalid required field: ticketId (number)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Check ticket exists and fetch customFields for context merging
    const existing = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      select: { id: true, projectId: true, customFields: true },
    });

    if (!existing) {
      throw new MCPError(
        `Ticket not found: ${params.ticketId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Build update data
    const updateData: Prisma.TicketUpdateInput = {};

    if (params.title !== undefined) updateData.title = params.title;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.status !== undefined) updateData.status = params.status;
    if (params.priority !== undefined) updateData.priority = params.priority;
    if (params.module !== undefined) updateData.module = params.module;
    if (params.assignee !== undefined) updateData.assignee = params.assignee;
    if (params.assigneeType !== undefined) updateData.assigneeType = params.assigneeType;
    if (params.assigneeId !== undefined) updateData.assigneeId = params.assigneeId;

    // Sprint 11.7: Handle customFields and implementationContext
    if (params.customFields !== undefined || params.implementationContext !== undefined) {
      const existingFields = (existing.customFields as Record<string, unknown>) ?? {};
      let newCustomFields = { ...existingFields };

      // Merge direct customFields updates
      if (params.customFields !== undefined) {
        newCustomFields = { ...newCustomFields, ...params.customFields };
      }

      // Handle implementationContext specially
      if (params.implementationContext !== undefined) {
        if (params.implementationContext === null) {
          // Explicitly remove implementation context
          delete newCustomFields._implementationContext;
        } else {
          newCustomFields._implementationContext = {
            ...params.implementationContext,
            filesToModify: params.implementationContext.filesToModify ?? [],
            filesToCreate: params.implementationContext.filesToCreate ?? [],
          };
        }
      }

      updateData.customFields = newCustomFields as Prisma.InputJsonValue;
    }

    // Sprint 11.7: Handle dueDate
    if (params.dueDate !== undefined) {
      updateData.dueDate = params.dueDate ? new Date(params.dueDate) : null;
    }

    // Sprint 11.7: Handle milestone
    if (params.milestoneId !== undefined) {
      if (params.milestoneId) {
        // Validate milestone exists and belongs to same project (use existing.projectId)
        const milestone = await prisma.milestone.findFirst({
          where: { id: params.milestoneId, projectId: existing.projectId },
        });
        if (!milestone) {
          throw new MCPError(
            `Milestone ${params.milestoneId} not found in ticket's project`,
            JSONRPC_ERROR_CODES.INVALID_PARAMS,
            404
          );
        }
        updateData.milestone = { connect: { id: params.milestoneId } };
      } else {
        updateData.milestone = { disconnect: true };
      }
    }

    // Sprint 12: linkedTask removed - tickets now schedule via scheduledWeekId

    // Handle labels
    if (params.labelIds !== undefined) {
      updateData.labels = {
        set: params.labelIds.map((id) => ({ id })),
      };
    }

    // Update ticket
    const ticket = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        status: true,
        priority: true,
        module: true,
        assignee: true,
        updatedAt: true,
        // Sprint 11.7: Include milestone and dueDate
        dueDate: true,
        milestone: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      kind: ticket.kind,
      status: ticket.status,
      priority: ticket.priority,
      module: ticket.module,
      assignee: ticket.assignee,
      updatedAt: ticket.updatedAt.toISOString(),
      // Sprint 11.7: Milestone and Due Date
      dueDate: ticket.dueDate?.toISOString() || null,
      milestone: ticket.milestone ? { id: ticket.milestone.id, name: ticket.milestone.name } : null,
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;

    throw new MCPError(
      error instanceof Error ? error.message : 'Failed to update ticket',
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * ticket.search - Search tickets with filters
 */
export async function ticketSearchHandler(input: unknown): Promise<TicketSearchOutput> {
  try {
    const params = (input || {}) as TicketSearchInput;

    // Sprint 11.7: SECURITY FIX - Require projectId to prevent cross-project data access
    const projectId = await resolveProjectId(params.projectId);

    // Build where clause with mandatory projectId filter
    const where: Prisma.TicketWhereInput = {
      projectId, // Sprint 11.7: Always filter by project
    };

    // Text search
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filter by kind
    if (params.kind && params.kind.length > 0) {
      where.kind = { in: params.kind };
    }

    // Filter by status
    if (params.status && params.status.length > 0) {
      where.status = { in: params.status };
    }

    // Filter by priority
    if (params.priority && params.priority.length > 0) {
      where.priority = { in: params.priority };
    }

    // Filter by module
    if (params.module && params.module.length > 0) {
      where.module = { in: params.module };
    }

    // Filter by assignee
    if (params.assignee && params.assignee.length > 0) {
      where.assignee = { in: params.assignee };
    }

    // Filter by tags (labels)
    if (params.tags && params.tags.length > 0) {
      where.labels = {
        some: {
          name: { in: params.tags },
        },
      };
    }

    // Date filters
    if (params.createdFrom) {
      where.createdAt = { gte: new Date(params.createdFrom) };
    }

    if (params.createdTo) {
      where.createdAt = {
        ...((where.createdAt as Prisma.DateTimeFilter) || {}),
        lte: new Date(params.createdTo),
      };
    }

    // Sprint 11.7: Milestone filter
    if (params.milestoneId) {
      where.milestoneId = params.milestoneId;
    }

    // Sprint 11.7: Due date filters
    if (params.dueDateFrom || params.dueDateTo) {
      where.dueDate = {
        ...(params.dueDateFrom ? { gte: new Date(params.dueDateFrom) } : {}),
        ...(params.dueDateTo ? { lte: new Date(params.dueDateTo) } : {}),
      };
    }

    // Sprint 11.7: Overdue filter (dueDate < now AND not closed)
    if (params.overdue === true) {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'closed' };
    }

    // Sprint 11.7: Implementation Context filters (JSONB path queries)
    if (params.hasImplementationContext !== undefined) {
      if (params.hasImplementationContext) {
        // Filter tickets that HAVE implementation context
        where.customFields = {
          path: ['_implementationContext'],
          not: Prisma.JsonNull,
        };
      } else {
        // Filter tickets WITHOUT implementation context
        // This is tricky with JSONB - we check if the key doesn't exist or is null
        where.OR = [
          ...(where.OR || []),
          { customFields: { equals: Prisma.JsonNull } },
          { customFields: { path: ['_implementationContext'], equals: Prisma.JsonNull } },
        ];
      }
    }

    if (params.requiresSchemaChanges === true) {
      // Filter tickets where schemaChanges.required is true
      where.customFields = {
        ...((where.customFields as Prisma.JsonFilter) || {}),
        path: ['_implementationContext', 'schemaChanges', 'required'],
        equals: true,
      };
    }

    // Pagination
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    // Sorting
    const sortBy = params.sortBy || 'createdAt';
    const sortDirection = params.sortDirection || 'desc';
    let orderBy: Prisma.TicketOrderByWithRelationInput;

    // Sprint 11.7: Handle dueDate sorting with nulls
    if (sortBy === 'dueDate') {
      orderBy = {
        dueDate: { sort: sortDirection, nulls: sortDirection === 'asc' ? 'last' : 'first' },
      };
    } else {
      orderBy = { [sortBy]: sortDirection };
    }

    // Execute query
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          description: true,
          kind: true,
          status: true,
          priority: true,
          module: true,
          assignee: true,
          createdAt: true,
          updatedAt: true,
          // Sprint 11.7: Include milestone and dueDate
          dueDate: true,
          milestone: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        kind: t.kind,
        status: t.status,
        priority: t.priority,
        module: t.module,
        assignee: t.assignee,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        // Sprint 11.7: Milestone and Due Date
        dueDate: t.dueDate?.toISOString() || null,
        milestone: t.milestone ? { id: t.milestone.id, name: t.milestone.name } : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;

    throw new MCPError(
      error instanceof Error ? error.message : 'Failed to search tickets',
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * ticket.addComment - Add comment to ticket
 */
export async function ticketAddCommentHandler(input: unknown): Promise<TicketAddCommentOutput> {
  try {
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as TicketAddCommentInput;

    if (typeof params.ticketId !== 'number') {
      throw new MCPError(
        'Missing or invalid required field: ticketId (number)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (!params.content || typeof params.content !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: content (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Check ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      select: { id: true },
    });

    if (!ticket) {
      throw new MCPError(
        `Ticket not found: ${params.ticketId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Create comment
    const comment = await prisma.ticketComment.create({
      data: {
        ticket: { connect: { id: params.ticketId } },
        content: params.content,
        author: params.author || 'Anonymous',
      },
      select: {
        id: true,
        ticketId: true,
        content: true,
        author: true,
        createdAt: true,
      },
    });

    return {
      id: comment.id,
      ticketId: comment.ticketId,
      content: comment.content,
      author: comment.author || 'Anonymous',
      createdAt: comment.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;

    throw new MCPError(
      error instanceof Error ? error.message : 'Failed to add comment',
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * ticket.setStatus - Update ticket status
 */
export async function ticketSetStatusHandler(input: unknown): Promise<TicketSetStatusOutput> {
  try {
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as TicketSetStatusInput;

    if (typeof params.ticketId !== 'number') {
      throw new MCPError(
        'Missing or invalid required field: ticketId (number)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (!params.status || typeof params.status !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: status (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Check ticket exists
    const existing = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new MCPError(
        `Ticket not found: ${params.ticketId}`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Determine if closing
    const closedStatuses = ['closed', 'resolved', 'done', 'completed', 'cancelled'];
    const isClosing =
      closedStatuses.includes(params.status.toLowerCase()) &&
      !closedStatuses.includes(existing.status.toLowerCase());
    const isReopening =
      !closedStatuses.includes(params.status.toLowerCase()) &&
      closedStatuses.includes(existing.status.toLowerCase());

    // Update status
    const ticket = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: {
        status: params.status,
        closedAt: isClosing ? new Date() : isReopening ? null : undefined,
      },
      select: {
        id: true,
        status: true,
        closedAt: true,
        updatedAt: true,
      },
    });

    return {
      id: ticket.id,
      status: ticket.status,
      closedAt: ticket.closedAt?.toISOString() || null,
      updatedAt: ticket.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;

    throw new MCPError(
      error instanceof Error ? error.message : 'Failed to set status',
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// Issue Compatibility Handlers (Adapters)
// ============================================================================

/**
 * issue.create - Create issue (adapter for ticket.create with kind='issue')
 */
export async function issueCreateHandler(input: unknown): Promise<TicketCreateOutput> {
  const params = (input || {}) as TicketCreateInput;
  return ticketCreateHandler({
    ...params,
    kind: params.kind || 'issue',
  });
}

/**
 * issue.bulkCreate - Bulk create issues (adapter for ticket.bulkCreate)
 */
export async function issueBulkCreateHandler(input: unknown): Promise<TicketBulkCreateOutput> {
  const params = (input || {}) as TicketBulkCreateInput;
  return ticketBulkCreateHandler({
    ...params,
    tickets: (params.tickets || []).map((t) => ({
      ...t,
      kind: t.kind || 'issue',
    })),
  });
}

/**
 * issue.update - Update issue (adapter for ticket.update)
 */
export async function issueUpdateHandler(input: unknown): Promise<TicketUpdateOutput> {
  const params = (input || {}) as TicketUpdateInput & { issueId?: number };
  return ticketUpdateHandler({
    ...params,
    ticketId: params.ticketId || params.issueId || 0,
  });
}

/**
 * issue.search - Search issues (adapter for ticket.search with kind filter)
 */
export async function issueSearchHandler(input: unknown): Promise<TicketSearchOutput> {
  const params = (input || {}) as TicketSearchInput;
  return ticketSearchHandler({
    ...params,
    kind: params.kind || ['issue', 'bug', 'scanner_finding'],
  });
}

/**
 * issue.addComment - Add comment to issue (adapter for ticket.addComment)
 */
export async function issueAddCommentHandler(input: unknown): Promise<TicketAddCommentOutput> {
  const params = (input || {}) as TicketAddCommentInput & { issueId?: number };
  return ticketAddCommentHandler({
    ...params,
    ticketId: params.ticketId || params.issueId || 0,
  });
}

/**
 * issue.setStatus - Set issue status (adapter for ticket.setStatus)
 */
export async function issueSetStatusHandler(input: unknown): Promise<TicketSetStatusOutput> {
  const params = (input || {}) as TicketSetStatusInput & { issueId?: number };
  return ticketSetStatusHandler({
    ...params,
    ticketId: params.ticketId || params.issueId || 0,
  });
}
