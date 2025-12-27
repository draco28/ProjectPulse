/**
 * Progress Update Validation Schemas
 *
 * Zod schemas for validating progress update requests
 * Used by API routes and MCP tools
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 */

import { z } from 'zod';

/**
 * Entity type enum (maps to Prisma models)
 * Plural form for REST API routes
 * Sprint 15: Week/Day removed - now 2-level hierarchy (Ticket #80)
 */
export const EntityTypeSchema = z.enum(['sprints', 'phases']);

/**
 * Progress update request body
 */
export const UpdateProgressSchema = z.object({
  progress: z
    .number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;

/**
 * Map plural entity types (API) to singular (Prisma)
 * Sprint 15: Week/Day removed (Ticket #80)
 */
export const entityTypeMap = {
  sprints: 'sprint',
  phases: 'phase',
} as const;
