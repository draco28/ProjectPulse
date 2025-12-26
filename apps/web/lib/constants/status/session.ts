/**
 * Agent Session Status Constants
 *
 * SINGLE SOURCE OF TRUTH for agent session status values.
 * Used by agent sessions page and session management.
 *
 * @example
 * ```typescript
 * import { SESSION_STATUSES, SessionStatusSystem, type SessionStatus } from '@/lib/constants/status';
 *
 * // Use constants
 * if (session.status === SESSION_STATUSES.ACTIVE) { ... }
 *
 * // Use system utilities
 * const label = SessionStatusSystem.getLabel(session.status);
 * const icon = SessionStatusSystem.meta[session.status].icon;
 * ```
 */

import { createStatusSystem, type StatusMeta } from './types';

/**
 * Session status values as const for type inference.
 * Used for agent session tracking and display.
 */
export const SESSION_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const;

/**
 * TypeScript type for session status values.
 * Derived from SESSION_STATUSES const object.
 */
export type SessionStatus = (typeof SESSION_STATUSES)[keyof typeof SESSION_STATUSES];

/**
 * Metadata for each session status.
 * Includes icons for visual representation.
 */
const SESSION_STATUS_META: Record<SessionStatus, StatusMeta> = {
  [SESSION_STATUSES.ACTIVE]: {
    label: 'Active',
    order: 0,
    colorClass: 'bg-green-500/20 text-green-400',
    icon: 'play',
  },
  [SESSION_STATUSES.PAUSED]: {
    label: 'Paused',
    order: 1,
    colorClass: 'bg-yellow-500/20 text-yellow-400',
    icon: 'pause',
  },
  [SESSION_STATUSES.COMPLETED]: {
    label: 'Completed',
    order: 2,
    colorClass: 'bg-blue-500/20 text-blue-400',
    icon: 'check',
  },
};

/**
 * Complete session status system with utilities.
 * Use this for validation, display labels, and completion checks.
 */
export const SessionStatusSystem = createStatusSystem(
  SESSION_STATUSES,
  SESSION_STATUS_META,
  SESSION_STATUSES.ACTIVE,
  [SESSION_STATUSES.COMPLETED]
);

// Convenience exports for common use cases
export const SESSION_STATUS_VALUES = SessionStatusSystem.values;
export const DEFAULT_SESSION_STATUS = SessionStatusSystem.default;
export const isValidSessionStatus = SessionStatusSystem.isValid;
