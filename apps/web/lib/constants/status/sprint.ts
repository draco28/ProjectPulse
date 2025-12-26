/**
 * Sprint/Phase Status Constants
 *
 * SINGLE SOURCE OF TRUTH for roadmap sprint status values.
 * Used by roadmap page, sprint cards, and phase timeline.
 *
 * @example
 * ```typescript
 * import { SPRINT_STATUSES, SprintStatusSystem, type SprintStatus } from '@/lib/constants/status';
 *
 * // Use constants
 * if (sprint.status === SPRINT_STATUSES.CURRENT) { ... }
 *
 * // Use system utilities
 * const label = SprintStatusSystem.getLabel(sprint.status);
 * ```
 */

import { createStatusSystem, type StatusMeta } from './types';

/**
 * Sprint status values as const for type inference.
 * Used for roadmap display (not to be confused with ticket status).
 */
export const SPRINT_STATUSES = {
  PLANNED: 'planned',
  CURRENT: 'current',
  COMPLETE: 'complete',
} as const;

/**
 * TypeScript type for sprint status values.
 * Derived from SPRINT_STATUSES const object.
 */
export type SprintStatus = (typeof SPRINT_STATUSES)[keyof typeof SPRINT_STATUSES];

/**
 * Metadata for each sprint status.
 * Used for UI rendering (labels, colors, sort order).
 */
const SPRINT_STATUS_META: Record<SprintStatus, StatusMeta> = {
  [SPRINT_STATUSES.PLANNED]: {
    label: 'Planned',
    order: 0,
    colorClass: 'bg-slate-500/20 text-slate-400',
  },
  [SPRINT_STATUSES.CURRENT]: {
    label: 'Current',
    order: 1,
    colorClass: 'bg-coral-500/20 text-coral-400',
  },
  [SPRINT_STATUSES.COMPLETE]: {
    label: 'Complete',
    order: 2,
    colorClass: 'bg-green-500/20 text-green-400',
  },
};

/**
 * Complete sprint status system with utilities.
 * Use this for validation, display labels, and completion checks.
 */
export const SprintStatusSystem = createStatusSystem(
  SPRINT_STATUSES,
  SPRINT_STATUS_META,
  SPRINT_STATUSES.PLANNED,
  [SPRINT_STATUSES.COMPLETE]
);

// Convenience exports for common use cases
export const SPRINT_STATUS_VALUES = SprintStatusSystem.values;
export const DEFAULT_SPRINT_STATUS = SprintStatusSystem.default;
export const isValidSprintStatus = SprintStatusSystem.isValid;
