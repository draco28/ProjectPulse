/**
 * Kanban Validation Schemas - Sprint 15 Phase B
 *
 * Zod schemas for validating kanban-related API requests.
 * Provides runtime validation and TypeScript type inference.
 *
 * @see types/kanban.ts for TypeScript interfaces
 * @see lib/constants/status/ticket.ts for status constants
 */

import { z } from 'zod';
import { TICKET_STATUS_VALUES, type TicketStatus } from '@/lib/constants/status';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_MOVES_PER_REQUEST = 100; // Reasonable limit for bulk operations

// ============================================================================
// STATUS SCHEMA
// ============================================================================

/**
 * Valid ticket status values for kanban columns.
 * Uses the status constants as the source of truth.
 */
export const KanbanStatusSchema = z.enum(TICKET_STATUS_VALUES as [string, ...string[]]) as z.ZodType<TicketStatus>;

// ============================================================================
// MOVE TICKET SCHEMAS
// ============================================================================

/**
 * Schema for moving a single ticket to a new column/position.
 * Used by PATCH /api/tickets/[id]/move
 */
export const MoveTicketSchema = z.object({
  /**
   * Target status (kanban column) for the ticket.
   * Must be one of: backlog, todo, in-progress, in-review, done
   */
  status: KanbanStatusSchema,

  /**
   * Target position within the column (0-indexed).
   * 0 = top of column, higher values = lower in column.
   * If greater than column length, ticket is placed at bottom.
   */
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order cannot be negative')
    .max(10000, 'Display order cannot exceed 10,000'),
});

export type MoveTicketInput = z.infer<typeof MoveTicketSchema>;

/**
 * Schema for a single move operation in bulk reorder.
 */
export const BulkMoveItemSchema = z.object({
  ticketId: z
    .number()
    .int('Ticket ID must be an integer')
    .positive('Ticket ID must be positive'),
  status: KanbanStatusSchema,
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order cannot be negative')
    .max(10000, 'Display order cannot exceed 10,000'),
});

export type BulkMoveItemInput = z.infer<typeof BulkMoveItemSchema>;

/**
 * Schema for bulk reorder request.
 * Used by PATCH /api/tickets/reorder
 */
export const BulkReorderSchema = z.object({
  moves: z
    .array(BulkMoveItemSchema)
    .min(1, 'At least one move is required')
    .max(MAX_MOVES_PER_REQUEST, `Cannot exceed ${MAX_MOVES_PER_REQUEST} moves per request`),
});

export type BulkReorderInput = z.infer<typeof BulkReorderSchema>;

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Schema for kanban board query parameters.
 * Used by GET /api/sprints/[sprintId]/kanban
 */
export const KanbanBoardQuerySchema = z.object({
  /**
   * Include ghost cards for parent/child relationships.
   * Defaults to true for full kanban experience.
   */
  includeGhosts: z
    .string()
    .transform((val) => val === 'true')
    .default('true')
    .optional(),

  /**
   * Filter by ticket kind (feature, task, bug, etc.)
   */
  kind: z
    .string()
    .optional(),

  /**
   * Filter by assignee
   */
  assignee: z
    .string()
    .optional(),
});

export type KanbanBoardQueryInput = z.infer<typeof KanbanBoardQuerySchema>;

/**
 * Schema for sprint ID parameter (cuid format).
 */
export const SprintIdParamSchema = z.object({
  sprintId: z.string().min(1, 'Sprint ID is required'),
});

export type SprintIdParamInput = z.infer<typeof SprintIdParamSchema>;

// ============================================================================
// ROADMAP OVERVIEW SCHEMAS
// ============================================================================

/**
 * Schema for roadmap overview query parameters.
 * Used by GET /api/roadmap/overview
 */
export const RoadmapOverviewQuerySchema = z.object({
  /**
   * Project ID (required for multi-tenancy)
   */
  projectId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Project ID must be a positive integer'),

  /**
   * Include ticket counts per sprint.
   * Defaults to true for dashboard views.
   */
  includeCounts: z
    .string()
    .transform((val) => val === 'true')
    .default('true')
    .optional(),
});

export type RoadmapOverviewQueryInput = z.infer<typeof RoadmapOverviewQuerySchema>;

// ============================================================================
// PROGRESS UPDATE SCHEMAS
// ============================================================================

/**
 * Schema for progress cascade response.
 * Returned after status changes that affect progress.
 */
export const ProgressCascadeSchema = z.object({
  ticketId: z.number().int().positive(),
  previousStatus: KanbanStatusSchema.optional(),
  newStatus: KanbanStatusSchema.optional(),
  parentProgress: z.number().min(0).max(100).optional(),
  sprintProgress: z.number().min(0).max(100).optional(),
  phaseProgress: z.number().min(0).max(100).optional(),
});

export type ProgressCascadeOutput = z.infer<typeof ProgressCascadeSchema>;
