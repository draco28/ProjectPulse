/**
 * Ticket Hierarchy Validation Helpers
 *
 * Sprint 13: Two-level ticket hierarchy (Feature → Task/Issue/Bug)
 *
 * Rules:
 * - Only kind=feature can have children
 * - Only kind=task|issue|bug|tech_debt can have a parent
 * - kind=epic cannot be a parent (use epicRef for soft reference instead)
 * - kind=scanner_finding cannot have a parent
 * - Parent must be in the same project
 * - No circular references allowed
 */

import type { PrismaClient } from '@prisma/client';

// Ticket kinds that can have children (act as parents)
export const PARENT_CAPABLE_KINDS = ['feature'] as const;
export type ParentCapableKind = (typeof PARENT_CAPABLE_KINDS)[number];

// Ticket kinds that can have a parent (act as children)
export const CHILD_CAPABLE_KINDS = ['task', 'issue', 'bug', 'tech_debt'] as const;
export type ChildCapableKind = (typeof CHILD_CAPABLE_KINDS)[number];

// All valid ticket kinds for reference
export const ALL_TICKET_KINDS = [
  'feature',
  'task',
  'epic',
  'issue',
  'bug',
  'scanner_finding',
  'tech_debt',
] as const;
export type TicketKind = (typeof ALL_TICKET_KINDS)[number];

/**
 * Check if a ticket kind can have children
 */
export function canHaveChildren(kind: string): kind is ParentCapableKind {
  return PARENT_CAPABLE_KINDS.includes(kind as ParentCapableKind);
}

/**
 * Check if a ticket kind can have a parent
 */
export function canHaveParent(kind: string): kind is ChildCapableKind {
  return CHILD_CAPABLE_KINDS.includes(kind as ChildCapableKind);
}

/**
 * Error thrown when ticket hierarchy validation fails
 */
export class TicketHierarchyError extends Error {
  constructor(
    message: string,
    public code:
      | 'PARENT_MUST_BE_FEATURE'
      | 'CHILD_KIND_RESTRICTED'
      | 'EPIC_CANNOT_BE_PARENT'
      | 'SAME_PROJECT_REQUIRED'
      | 'NO_CIRCULAR_REFERENCE'
      | 'NO_SELF_PARENT'
      | 'PARENT_NOT_FOUND'
  ) {
    super(message);
    this.name = 'TicketHierarchyError';
  }
}

/**
 * Validate that a parent ticket exists and can have children
 *
 * @param prisma - Prisma client
 * @param parentTicketId - ID of the proposed parent ticket
 * @param childProjectId - Project ID of the child ticket
 * @param childKind - Kind of the child ticket
 * @throws TicketHierarchyError if validation fails
 */
export async function validateParentTicket(
  prisma: PrismaClient,
  parentTicketId: number,
  childProjectId: number,
  childKind: string
): Promise<void> {
  // Check if child kind allows having a parent
  if (!canHaveParent(childKind)) {
    throw new TicketHierarchyError(
      `Tickets of kind '${childKind}' cannot have a parent. Only ${CHILD_CAPABLE_KINDS.join(', ')} can have parents.`,
      'CHILD_KIND_RESTRICTED'
    );
  }

  // Fetch the parent ticket
  const parent = await prisma.ticket.findUnique({
    where: { id: parentTicketId },
    select: { id: true, projectId: true, kind: true, title: true },
  });

  if (!parent) {
    throw new TicketHierarchyError(
      `Parent ticket with ID ${parentTicketId} not found.`,
      'PARENT_NOT_FOUND'
    );
  }

  // Same project check
  if (parent.projectId !== childProjectId) {
    throw new TicketHierarchyError(
      `Parent ticket must be in the same project. Parent is in project ${parent.projectId}, child is in project ${childProjectId}.`,
      'SAME_PROJECT_REQUIRED'
    );
  }

  // Check if parent kind can have children
  if (!canHaveChildren(parent.kind)) {
    if (parent.kind === 'epic') {
      throw new TicketHierarchyError(
        `Epic tickets cannot be parents. Use the 'epicRef' field to reference epics instead.`,
        'EPIC_CANNOT_BE_PARENT'
      );
    }
    throw new TicketHierarchyError(
      `Ticket of kind '${parent.kind}' cannot have children. Only ${PARENT_CAPABLE_KINDS.join(', ')} tickets can have children.`,
      'PARENT_MUST_BE_FEATURE'
    );
  }
}

/**
 * Check if setting a new parent would create a circular reference
 *
 * A circular reference occurs when:
 * - A ticket is set as its own parent (self-reference)
 * - A ticket's ancestor becomes its child (A → B → C → A)
 *
 * @param prisma - Prisma client
 * @param ticketId - ID of the ticket being updated
 * @param newParentId - ID of the proposed new parent
 * @returns true if a circular reference would be created
 */
export async function checkCircularReference(
  prisma: PrismaClient,
  ticketId: number,
  newParentId: number
): Promise<boolean> {
  // Self-reference check
  if (ticketId === newParentId) {
    return true;
  }

  // Walk up the ancestor chain from the proposed parent
  let currentId: number | null = newParentId;
  const visited = new Set<number>();
  const maxDepth = 100; // Safety limit to prevent infinite loops
  let depth = 0;

  while (currentId !== null && depth < maxDepth) {
    // If we've visited this node before, there's already a cycle in the data
    if (visited.has(currentId)) {
      return true;
    }

    // If the current ancestor is the ticket we're updating, setting
    // newParentId as parent would create a cycle
    if (currentId === ticketId) {
      return true;
    }

    visited.add(currentId);

    // Get the parent of the current ticket
    const ticketResult: { parentTicketId: number | null } | null = await prisma.ticket.findUnique({
      where: { id: currentId },
      select: { parentTicketId: true },
    });

    currentId = ticketResult?.parentTicketId ?? null;
    depth++;
  }

  return false;
}

/**
 * Validate and set parent for a ticket
 *
 * This is a convenience function that performs all necessary validations
 * before allowing a parent to be set.
 *
 * @param prisma - Prisma client
 * @param ticketId - ID of the ticket being updated (null if creating new)
 * @param parentTicketId - ID of the proposed parent ticket
 * @param childProjectId - Project ID of the child ticket
 * @param childKind - Kind of the child ticket
 * @throws TicketHierarchyError if validation fails
 */
export async function validateAndSetParent(
  prisma: PrismaClient,
  ticketId: number | null,
  parentTicketId: number,
  childProjectId: number,
  childKind: string
): Promise<void> {
  // Validate the parent ticket
  await validateParentTicket(prisma, parentTicketId, childProjectId, childKind);

  // If updating an existing ticket, check for circular references
  if (ticketId !== null) {
    const wouldCreateCycle = await checkCircularReference(prisma, ticketId, parentTicketId);
    if (wouldCreateCycle) {
      throw new TicketHierarchyError(
        `Cannot set parent: would create a circular reference.`,
        'NO_CIRCULAR_REFERENCE'
      );
    }
  }
}

/**
 * Get hierarchy context for a ticket (parent + children summary)
 *
 * @param prisma - Prisma client
 * @param ticketId - ID of the ticket
 * @returns Hierarchy context object
 */
export async function getHierarchyContext(
  prisma: PrismaClient,
  ticketId: number
): Promise<{
  parent: { id: number; title: string; kind: string; status: string } | null;
  childrenCount: number;
  children: Array<{ id: number; title: string; kind: string; status: string }>;
}> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      parentTicket: {
        select: { id: true, title: true, kind: true, status: true },
      },
      childTickets: {
        select: { id: true, title: true, kind: true, status: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return {
    parent: ticket?.parentTicket ?? null,
    childrenCount: ticket?.childTickets?.length ?? 0,
    children: ticket?.childTickets ?? [],
  };
}
