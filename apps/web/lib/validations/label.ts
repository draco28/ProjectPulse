/**
 * Label Validation Schemas (Sprint 11.7 - Labels Feature)
 *
 * Zod schemas for validating label-related API requests.
 * Labels are project-scoped and can be assigned to multiple tickets.
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_NAME_LENGTH = 50;

// Predefined color palette for labels (GitHub/Linear style)
export const LABEL_COLORS = [
  '#b60205', '#d93f0b', '#fbca04', '#0e8a16', '#006b75',
  '#1d76db', '#0052cc', '#5319e7', '#e99695', '#f9d0c4',
  '#fef2c0', '#c2e0c6', '#bfdadc', '#c5def5', '#bfd4f2',
  '#d4c5f9', '#f5f5f5', '#6b7280',
] as const;

// ============================================================================
// LABEL SCHEMAS
// ============================================================================

/**
 * Schema for creating a new label
 */
export const CreateLabelSchema = z.object({
  name: z
    .string()
    .min(1, 'Label name is required')
    .max(MAX_NAME_LENGTH, `Label name cannot exceed ${MAX_NAME_LENGTH} characters`)
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color (e.g., #ff5500)')
    .default('#6b7280'),
});

export type CreateLabel = z.infer<typeof CreateLabelSchema>;

/**
 * Schema for updating an existing label (partial)
 */
export const UpdateLabelSchema = CreateLabelSchema.partial();

export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;

/**
 * Schema for label ID parameter
 */
export const LabelIdParamSchema = z.object({
  labelId: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/, 'Label ID must be numeric'),
  ]).transform((value) => Number(value)),
});

// ============================================================================
// TICKET-LABEL MANAGEMENT
// ============================================================================

/**
 * Schema for managing labels on a ticket
 * Supports add, remove, or set operations
 */
export const TicketLabelManageSchema = z.object({
  labelIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one label ID is required')
    .max(25, 'Maximum 25 labels per operation'),
  action: z.enum(['add', 'remove', 'set']),
});

export type TicketLabelManage = z.infer<typeof TicketLabelManageSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing labels with optional filters
 */
export const LabelQuerySchema = z.object({
  search: z.string().max(100).optional(),
  includeTicketCount: z.boolean().optional().default(true),
});

export type LabelQuery = z.infer<typeof LabelQuerySchema>;
