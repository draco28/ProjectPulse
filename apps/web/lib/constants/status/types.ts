/**
 * Status System - Shared Types
 *
 * Generic types and utilities for the modular status system.
 * Each domain (ticket, sprint, session) implements these interfaces.
 *
 * @example
 * ```typescript
 * import { createStatusSystem, type StatusMeta } from './types';
 *
 * const STATUSES = { OPEN: 'open', CLOSED: 'closed' } as const;
 * type Status = (typeof STATUSES)[keyof typeof STATUSES];
 *
 * const META: Record<Status, StatusMeta> = { ... };
 * export const StatusSystem = createStatusSystem(STATUSES, META, 'open');
 * ```
 */

/**
 * Metadata for a status value (label, order, styling).
 * Used by UI components to render status badges, filters, etc.
 */
export interface StatusMeta {
  /** Display label (e.g., "In Progress") */
  label: string;
  /** Sort order (0 = first) */
  order: number;
  /** Tailwind color classes for styling */
  colorClass: string;
  /** Optional lucide icon name */
  icon?: string;
}

/**
 * Return type for createStatusSystem factory.
 * Provides type-safe utilities for working with status values.
 */
export interface StatusSystem<T extends string> {
  /** The original status constants object */
  statuses: Record<string, T>;
  /** Array of all valid status values */
  values: T[];
  /** Metadata for each status */
  meta: Record<T, StatusMeta>;
  /** Default status for new entities */
  default: T;
  /** Statuses that indicate completion */
  completed: T[];
  /** Type guard to check if a value is a valid status */
  isValid: (value: unknown) => value is T;
  /** Get display label for a status */
  getLabel: (status: T) => string;
  /** Get sort order for a status */
  getOrder: (status: T) => number;
  /** Get Tailwind color class for a status */
  getColorClass: (status: T) => string;
  /** Check if a status indicates completion */
  isCompleted: (status: T) => boolean;
}

/**
 * Factory function to create a type-safe status system.
 *
 * Creates a StatusSystem with utilities for validation, display, and logic.
 * All status domains (ticket, sprint, session) use this factory.
 *
 * @param statuses - Object with UPPER_CASE keys and lowercase values
 * @param meta - Metadata for each status value
 * @param defaultStatus - Default status for new entities
 * @param completedStatuses - Statuses that indicate completion (default: [])
 * @returns StatusSystem with type-safe utilities
 *
 * @example
 * ```typescript
 * export const TicketStatusSystem = createStatusSystem(
 *   TICKET_STATUSES,
 *   TICKET_STATUS_META,
 *   TICKET_STATUSES.BACKLOG,
 *   [TICKET_STATUSES.DONE]
 * );
 * ```
 */
export function createStatusSystem<T extends string>(
  statuses: Record<string, T>,
  meta: Record<T, StatusMeta>,
  defaultStatus: T,
  completedStatuses: T[] = []
): StatusSystem<T> {
  const values = Object.values(statuses) as T[];

  return {
    statuses,
    values,
    meta,
    default: defaultStatus,
    completed: completedStatuses,
    isValid: (value: unknown): value is T =>
      typeof value === 'string' && values.includes(value as T),
    getLabel: (status: T) => meta[status]?.label ?? status,
    getOrder: (status: T) => meta[status]?.order ?? 0,
    getColorClass: (status: T) => meta[status]?.colorClass ?? '',
    isCompleted: (status: T) => completedStatuses.includes(status),
  };
}
