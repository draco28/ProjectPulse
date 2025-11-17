/**
 * Hierarchy Query Validation Schemas
 *
 * Validates query parameters for GET /api/hierarchy/query endpoint.
 * Supports filtering by status and progress (minimal US-007 implementation).
 *
 * Note: Date range filtering deferred to Sprint 2 for full US-007 completion.
 */

import { z } from 'zod';

/**
 * Entity level enum (which hierarchy level to query)
 * Sprint 8.5: Added 'sprint' for 5-level hierarchy (Phase → Sprint → Week → Day → Task)
 */
export const EntityLevelSchema = z.enum(['phase', 'sprint', 'week', 'day', 'task', 'session']);

/**
 * Status filter schema (matches Prisma Status enum)
 */
export const StatusFilterSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
]);

/**
 * Query parameters schema for hierarchy filtering
 *
 * Minimal implementation (2 story points):
 * - level: Required - which entity type to query
 * - status: Optional - filter by status (supports multiple via array)
 * - progressMin: Optional - minimum progress threshold (0-100)
 * - progressMax: Optional - maximum progress threshold (0-100)
 * - page: Optional - pagination (default 1)
 * - limit: Optional - results per page (default 20, max 100)
 */
export const HierarchyQuerySchema = z.object({
  // Required: entity level
  level: EntityLevelSchema,

  // Optional: status filter (can pass multiple)
  status: z.array(StatusFilterSchema).optional(),

  // Optional: progress range
  progressMin: z.coerce.number().int().min(0).max(100).optional(),
  progressMax: z.coerce.number().int().min(0).max(100).optional(),

  // Optional: pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  (data) => {
    // If both progressMin and progressMax provided, min must be <= max
    if (data.progressMin !== undefined && data.progressMax !== undefined) {
      return data.progressMin <= data.progressMax;
    }
    return true;
  },
  {
    message: 'progressMin must be less than or equal to progressMax',
    path: ['progressMin'],
  }
);

export type HierarchyQueryInput = z.infer<typeof HierarchyQuerySchema>;
export type EntityLevel = z.infer<typeof EntityLevelSchema>;
