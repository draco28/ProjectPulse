/**
 * Progress Update Validation Schemas
 * 
 * Zod schemas for validating progress update requests
 * Used by API routes and MCP tools
 */

import { z } from 'zod';

/**
 * Entity type enum (maps to Prisma models)
 * Plural form for REST API routes
 * Sprint 12: Removed sessions and tasks - now 4-level hierarchy
 */
export const EntityTypeSchema = z.enum([
  'days',
  'weeks',
  'sprints',
  'phases'
]);

/**
 * Progress update request body
 */
export const UpdateProgressSchema = z.object({
  progress: z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;

/**
 * Map plural entity types (API) to singular (Prisma)
 * Sprint 12: Updated for 4-level hierarchy
 */
export const entityTypeMap = {
  'days': 'day',
  'weeks': 'week',
  'sprints': 'sprint',
  'phases': 'phase',
} as const;
