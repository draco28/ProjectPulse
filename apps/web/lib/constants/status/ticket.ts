/**
 * Ticket/Kanban Status Constants
 *
 * SINGLE SOURCE OF TRUTH for all ticket status values.
 * Used by tickets, kanban board, and progress calculations.
 *
 * @example
 * ```typescript
 * import { TICKET_STATUSES, TicketStatusSystem, type TicketStatus } from '@/lib/constants/status';
 *
 * // Use constants
 * if (ticket.status === TICKET_STATUSES.DONE) { ... }
 *
 * // Use system utilities
 * const label = TicketStatusSystem.getLabel(ticket.status);
 * const isComplete = TicketStatusSystem.isCompleted(ticket.status);
 * ```
 */

import { createStatusSystem, type StatusMeta } from './types';

/**
 * Ticket status values as const for type inference.
 * Keys are UPPER_CASE, values are lowercase with hyphens.
 */
export const TICKET_STATUSES = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  IN_REVIEW: 'in-review',
  DONE: 'done',
} as const;

/**
 * TypeScript type for ticket status values.
 * Derived from TICKET_STATUSES const object.
 */
export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

/**
 * Metadata for each ticket status.
 * Used for UI rendering (labels, colors, sort order).
 */
const TICKET_STATUS_META: Record<TicketStatus, StatusMeta> = {
  [TICKET_STATUSES.BACKLOG]: {
    label: 'Backlog',
    order: 0,
    colorClass: 'bg-gray-500/20 text-gray-400',
  },
  [TICKET_STATUSES.TODO]: {
    label: 'To Do',
    order: 1,
    colorClass: 'bg-slate-500/20 text-slate-300',
  },
  [TICKET_STATUSES.IN_PROGRESS]: {
    label: 'In Progress',
    order: 2,
    colorClass: 'bg-yellow-500/20 text-yellow-400',
  },
  [TICKET_STATUSES.IN_REVIEW]: {
    label: 'In Review',
    order: 3,
    colorClass: 'bg-purple-500/20 text-purple-400',
  },
  [TICKET_STATUSES.DONE]: {
    label: 'Done',
    order: 4,
    colorClass: 'bg-green-500/20 text-green-400',
  },
};

/**
 * Complete ticket status system with utilities.
 * Use this for validation, display labels, and completion checks.
 */
export const TicketStatusSystem = createStatusSystem(
  TICKET_STATUSES,
  TICKET_STATUS_META,
  TICKET_STATUSES.BACKLOG,
  [TICKET_STATUSES.DONE]
);

// Convenience exports for common use cases
export const TICKET_STATUS_VALUES = TicketStatusSystem.values;
export const DEFAULT_TICKET_STATUS = TicketStatusSystem.default;
export const COMPLETED_TICKET_STATUSES = TicketStatusSystem.completed;
export const isValidTicketStatus = TicketStatusSystem.isValid;
