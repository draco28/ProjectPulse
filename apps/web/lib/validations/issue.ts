/**
 * Issue Validation Schemas
 *
 * Zod schemas for validating issue-related API requests
 * Used in API routes for runtime validation and type safety
 */

import { z } from 'zod';

// ============================================================================
// COMMENT VALIDATION
// ============================================================================

/**
 * Schema for creating a new comment on an issue
 *
 * Validation rules:
 * - content: Required, 1-10000 characters
 * - author: Optional string (defaults to 'Anonymous' in API route)
 */
export const CommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment cannot exceed 10,000 characters')
    .trim(),
  author: z.string().optional(),
});

/**
 * Inferred TypeScript type from CommentSchema
 * Use this for type-safe comment creation
 */
export type CommentInput = z.infer<typeof CommentSchema>;

// ============================================================================
// STATUS UPDATE VALIDATION
// ============================================================================

/**
 * Schema for updating issue status
 *
 * Validation rules:
 * - status: Must be one of: 'open', 'in_progress', 'closed'
 *
 * Note: When status changes to 'closed', the API route will set closedAt timestamp
 */
export const StatusUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed'], {
    errorMap: () => ({
      message: 'Status must be one of: open, in_progress, closed',
    }),
  }),
});

/**
 * Inferred TypeScript type from StatusUpdateSchema
 */
export type StatusUpdate = z.infer<typeof StatusUpdateSchema>;

// ============================================================================
// ATTACHMENT VALIDATION (Future)
// ============================================================================

/**
 * Schema for uploading file attachments to an issue
 *
 * Validation rules:
 * - filename: Required, 1-255 characters
 * - mimetype: Required, valid MIME type format
 * - size: Required, max 50MB (50 * 1024 * 1024 bytes)
 *
 * Note: File upload implementation pending
 */
export const AttachmentUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  mimetype: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Invalid MIME type'),
  size: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024, 'File size cannot exceed 50MB'),
});

/**
 * Inferred TypeScript type from AttachmentUploadSchema
 */
export type AttachmentUpload = z.infer<typeof AttachmentUploadSchema>;

// ============================================================================
// LABEL MANAGEMENT VALIDATION (Future)
// ============================================================================

/**
 * Schema for adding/removing labels from an issue
 *
 * Validation rules:
 * - labelIds: Array of label IDs (integers)
 * - action: Either 'add' or 'remove'
 */
export const LabelUpdateSchema = z.object({
  labelIds: z.array(z.number().int().positive()).min(1, 'At least one label ID required'),
  action: z.enum(['add', 'remove']),
});

/**
 * Inferred TypeScript type from LabelUpdateSchema
 */
export type LabelUpdate = z.infer<typeof LabelUpdateSchema>;

// ============================================================================
// ISSUE CREATION/UPDATE VALIDATION (Future)
// ============================================================================

/**
 * Schema for creating a new issue
 *
 * Validation rules:
 * - title: Required, 1-200 characters
 * - description: Optional, max 50000 characters
 * - priority: Optional, defaults to 'medium'
 * - module: Optional
 * - assignee: Optional
 */
export const CreateIssueSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z.string().max(50000, 'Description cannot exceed 50,000 characters').optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  module: z.string().optional(),
  assignee: z.string().optional(),
  projectId: z.number().int().positive(),
});

/**
 * Inferred TypeScript type from CreateIssueSchema
 */
export type CreateIssue = z.infer<typeof CreateIssueSchema>;

/**
 * Schema for updating an existing issue
 * All fields optional (partial update)
 */
export const UpdateIssueSchema = CreateIssueSchema.partial().omit({ projectId: true });

/**
 * Inferred TypeScript type from UpdateIssueSchema
 */
export type UpdateIssue = z.infer<typeof UpdateIssueSchema>;
