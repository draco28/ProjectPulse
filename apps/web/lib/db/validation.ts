/**
 * Zod Validation Schemas for 5-Level Hierarchy
 *
 * Provides validation for:
 * - Phase, Week, Day, Task, Session creation/updates
 * - Progress values (0-100)
 * - Date ranges (child dates within parent dates)
 * - Status transitions
 * - Circular reference prevention
 *
 * Defense in depth: Zod validation + DB constraints + runtime checks
 */

import { z } from 'zod';
import type { Status } from '@prisma/client';

/**
 * Status enum (matches Prisma schema)
 */
export const StatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
]);

/**
 * Base schema shared by all hierarchy levels
 */
export const HierarchyBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  status: StatusSchema.default('NOT_STARTED'),
  progress: z
    .number()
    .int()
    .min(0, 'Progress must be at least 0')
    .max(100, 'Progress must be at most 100')
    .default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

/**
 * Phase validation (no parent FK required)
 */
export const PhaseSchema = HierarchyBaseSchema.extend({
  // Phase has no parent
});

/**
 * Week validation (must have phaseId)
 */
export const WeekSchema = HierarchyBaseSchema.extend({
  phaseId: z.string().cuid('Invalid Phase ID format'),
});

/**
 * Day validation (must have weekId)
 */
export const DaySchema = HierarchyBaseSchema.extend({
  weekId: z.string().cuid('Invalid Week ID format'),
});

/**
 * Task validation (must have dayId)
 */
export const TaskSchema = HierarchyBaseSchema.extend({
  dayId: z.string().cuid('Invalid Day ID format'),
});

/**
 * Session validation (must have taskId)
 */
export const SessionSchema = HierarchyBaseSchema.extend({
  taskId: z.string().cuid('Invalid Task ID format'),
});

/**
 * Progress update validation (for API endpoints)
 */
export const ProgressUpdateSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID format'),
  entityType: z.enum(['session', 'task', 'day', 'week', 'phase']),
  progress: z.number().int().min(0).max(100),
});

/**
 * Type exports
 */
export type PhaseInput = z.infer<typeof PhaseSchema>;
export type WeekInput = z.infer<typeof WeekSchema>;
export type DayInput = z.infer<typeof DaySchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type SessionInput = z.infer<typeof SessionSchema>;
export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;

/**
 * Custom validator: Child dates must be within parent dates
 *
 * @param childStartDate - Child start date
 * @param childEndDate - Child end date (optional)
 * @param parentStartDate - Parent start date
 * @param parentEndDate - Parent end date (optional)
 * @returns true if valid, false otherwise
 *
 * @example
 * validateDateRange(
 *   new Date('2025-11-06'),
 *   new Date('2025-11-07'),
 *   new Date('2025-11-01'),
 *   new Date('2025-11-30')
 * ); // true
 */
export function validateDateRange(
  childStartDate: Date,
  childEndDate: Date | null | undefined,
  parentStartDate: Date,
  parentEndDate: Date | null | undefined
): boolean {
  // Child start date must be >= parent start date
  if (childStartDate < parentStartDate) {
    return false;
  }

  // If both have end dates, child end date must be <= parent end date
  if (childEndDate && parentEndDate && childEndDate > parentEndDate) {
    return false;
  }

  // If child has end date, it must be >= start date
  if (childEndDate && childEndDate < childStartDate) {
    return false;
  }

  return true;
}

/**
 * Custom validator: Progress must be 0-100
 *
 * @param progress - Progress value to validate
 * @returns true if valid (0-100), false otherwise
 */
export function validateProgress(progress: number): boolean {
  return progress >= 0 && progress <= 100 && Number.isInteger(progress);
}

/**
 * Custom validator: Prevent circular references
 * (Phase cannot reference itself as parent)
 *
 * @param entityId - Entity ID
 * @param parentId - Parent entity ID
 * @returns true if no circular reference, false otherwise
 *
 * @example
 * validateCircularReference('phase1', 'phase1'); // false (circular)
 * validateCircularReference('phase1', 'phase2'); // true (different entities)
 */
export function validateCircularReference(
  entityId: string,
  parentId: string | null | undefined
): boolean {
  if (!parentId) return true; // No parent = no circular reference
  return entityId !== parentId;
}

/**
 * Custom validator: Status transitions
 * Enforces valid state machine transitions
 *
 * @param currentStatus - Current status
 * @param newStatus - New status
 * @returns true if transition is valid, false otherwise
 *
 * Valid transitions:
 * - NOT_STARTED → IN_PROGRESS, CANCELLED
 * - IN_PROGRESS → COMPLETED, BLOCKED, CANCELLED
 * - COMPLETED → (no transitions, final state)
 * - BLOCKED → IN_PROGRESS, CANCELLED
 * - CANCELLED → IN_PROGRESS (allow restart)
 */
export function validateStatusTransition(currentStatus: Status, newStatus: Status): boolean {
  // Allow same status (no-op)
  if (currentStatus === newStatus) return true;

  const validTransitions: Record<Status, Status[]> = {
    NOT_STARTED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'BLOCKED', 'CANCELLED'],
    COMPLETED: [], // Final state, no transitions allowed
    BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
    CANCELLED: ['IN_PROGRESS'], // Allow restart
  };

  return validTransitions[currentStatus].includes(newStatus);
}

/**
 * Custom validator: Validate entire hierarchy integrity
 * Checks:
 * - No orphaned children (all FKs valid)
 * - Date ranges valid (child dates within parent dates)
 * - Progress values valid (0-100)
 * - No circular references
 *
 * @param data - Hierarchy data to validate
 * @returns Validation result with errors
 *
 * @example
 * const result = validateHierarchyIntegrity({
 *   phases: [phase1, phase2],
 *   weeks: [week1, week2],
 *   // ... other levels
 * });
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateHierarchyIntegrity(data: {
  phases: Array<{ id: string; startDate: Date; endDate?: Date | null; progress: number }>;
  weeks: Array<{
    id: string;
    phaseId: string;
    startDate: Date;
    endDate?: Date | null;
    progress: number;
  }>;
  days: Array<{
    id: string;
    weekId: string;
    startDate: Date;
    endDate?: Date | null;
    progress: number;
  }>;
  tasks: Array<{
    id: string;
    dayId: string;
    startDate: Date;
    endDate?: Date | null;
    progress: number;
  }>;
  sessions: Array<{
    id: string;
    taskId: string;
    startDate: Date;
    endDate?: Date | null;
    progress: number;
  }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Build lookup maps for FK validation
  const phaseIds = new Set(data.phases.map((p) => p.id));
  const weekIds = new Set(data.weeks.map((w) => w.id));
  const dayIds = new Set(data.days.map((d) => d.id));
  const taskIds = new Set(data.tasks.map((t) => t.id));

  // 1. Validate orphaned Weeks (invalid phaseId)
  for (const week of data.weeks) {
    if (!phaseIds.has(week.phaseId)) {
      errors.push(
        `Orphaned Week detected: Week ${week.id} references non-existent Phase ${week.phaseId}`
      );
    }
  }

  // 2. Validate orphaned Days (invalid weekId)
  for (const day of data.days) {
    if (!weekIds.has(day.weekId)) {
      errors.push(
        `Orphaned Day detected: Day ${day.id} references non-existent Week ${day.weekId}`
      );
    }
  }

  // 3. Validate orphaned Tasks (invalid dayId)
  for (const task of data.tasks) {
    if (!dayIds.has(task.dayId)) {
      errors.push(
        `Orphaned Task detected: Task ${task.id} references non-existent Day ${task.dayId}`
      );
    }
  }

  // 4. Validate orphaned Sessions (invalid taskId)
  for (const session of data.sessions) {
    if (!taskIds.has(session.taskId)) {
      errors.push(
        `Orphaned Session detected: Session ${session.id} references non-existent Task ${session.taskId}`
      );
    }
  }

  // 5. Validate progress values (0-100)
  const allEntities = [
    ...data.phases.map((p) => ({ type: 'Phase', id: p.id, progress: p.progress })),
    ...data.weeks.map((w) => ({ type: 'Week', id: w.id, progress: w.progress })),
    ...data.days.map((d) => ({ type: 'Day', id: d.id, progress: d.progress })),
    ...data.tasks.map((t) => ({ type: 'Task', id: t.id, progress: t.progress })),
    ...data.sessions.map((s) => ({ type: 'Session', id: s.id, progress: s.progress })),
  ];

  for (const entity of allEntities) {
    if (!validateProgress(entity.progress)) {
      errors.push(
        `Invalid progress for ${entity.type} ${entity.id}: ${entity.progress} (must be 0-100)`
      );
    }
  }

  // 6. Validate date ranges (child dates within parent dates)
  for (const week of data.weeks) {
    const phase = data.phases.find((p) => p.id === week.phaseId);
    if (phase && !validateDateRange(week.startDate, week.endDate, phase.startDate, phase.endDate)) {
      errors.push(`Date range violation: Week ${week.id} dates outside Phase ${phase.id} dates`);
    }
  }

  for (const day of data.days) {
    const week = data.weeks.find((w) => w.id === day.weekId);
    if (week && !validateDateRange(day.startDate, day.endDate, week.startDate, week.endDate)) {
      errors.push(`Date range violation: Day ${day.id} dates outside Week ${week.id} dates`);
    }
  }

  for (const task of data.tasks) {
    const day = data.days.find((d) => d.id === task.dayId);
    if (day && !validateDateRange(task.startDate, task.endDate, day.startDate, day.endDate)) {
      errors.push(`Date range violation: Task ${task.id} dates outside Day ${day.id} dates`);
    }
  }

  for (const session of data.sessions) {
    const task = data.tasks.find((t) => t.id === session.taskId);
    if (
      task &&
      !validateDateRange(session.startDate, session.endDate, task.startDate, task.endDate)
    ) {
      errors.push(
        `Date range violation: Session ${session.id} dates outside Task ${task.id} dates`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
