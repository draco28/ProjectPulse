/**
 * Issue Validation Schemas
 *
 * Zod schemas for validating issue-related API requests
 * Used in API routes for runtime validation and type safety
 */

import { z } from 'zod';

// ============================================================================ //
// COMMON HELPERS                                                               //
// ============================================================================ //

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 50000;
const MAX_ASSIGNEE_LENGTH = 120;
const MAX_MODULE_LENGTH = 80;
const MAX_FILEPATH_LENGTH = 2048;
const MAX_SNIPPET_LENGTH = 5000;

export const LinkedFileSchema = z.object({
  filePath: z
    .string()
    .min(1, 'File path is required')
    .max(MAX_FILEPATH_LENGTH, 'File path is too long'),
  lineNumber: z.number().int().positive().max(1_000_000).optional(),
  snippet: z.string().max(MAX_SNIPPET_LENGTH, 'Snippet cannot exceed 5,000 characters').optional(),
});

export type IssueFileContextInput = z.infer<typeof LinkedFileSchema>;

export const IssueContextSchema = z.object({
  files: z.array(LinkedFileSchema).max(25, 'Maximum of 25 file references allowed').optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type IssueContextInput = z.infer<typeof IssueContextSchema>;

const IssueBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(MAX_TITLE_LENGTH, 'Title is too long').trim(),
  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH, 'Description cannot exceed 50,000 characters')
    .optional(),
  status: z
    .string()
    .min(1, 'Status is required when provided')
    .max(32, 'Status must be 32 characters or fewer')
    .optional(),
  priority: z
    .string()
    .min(1, 'Priority is required when provided')
    .max(32, 'Priority must be 32 characters or fewer')
    .optional(),
  module: z.string().max(MAX_MODULE_LENGTH, 'Module name too long').optional(),
  assignee: z.string().max(MAX_ASSIGNEE_LENGTH, 'Assignee name too long').optional(),
  labelIds: z.array(z.number().int().positive()).max(25).optional(),
  customFields: z.record(z.unknown()).optional(),
  context: IssueContextSchema.optional(),
});

export const IssueIdParamSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/, 'ID must be numeric')]).transform(
    (value) => Number(value)
  ),
});

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
  status: z.string().min(1, 'Status is required').max(32, 'Status must be 32 characters or fewer'),
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
export const CreateIssueSchema = IssueBaseSchema.extend({
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
export const UpdateIssueSchema = IssueBaseSchema.partial().extend({
  labelIds: z.array(z.number().int().positive()).optional(),
});

/**
 * Inferred TypeScript type from UpdateIssueSchema
 */
export type UpdateIssue = z.infer<typeof UpdateIssueSchema>;

// ============================================================================
// BULK CREATION VALIDATION
// ============================================================================

export const BulkIssueItemSchema = IssueBaseSchema.extend({
  reference: z.string().max(64).optional(),
});

export const IssueBulkCreateSchema = z.object({
  projectId: z.number().int().positive(),
  issues: z.array(BulkIssueItemSchema).min(1, 'At least one issue is required').max(50, 'Max 50 issues'),
});

export type BulkIssueCreateInput = z.infer<typeof IssueBulkCreateSchema>;

// ============================================================================
// FILTER & QUERY VALIDATION
// ============================================================================

export const IssueFilterSchema = z.object({
  projectId: z.number().int().positive().optional(),
  status: z.array(z.string().min(1)).optional(),
  priority: z.array(z.string().min(1)).optional(),
  module: z.array(z.string().min(1)).optional(),
  assignee: z.array(z.string().min(1)).optional(),
  search: z.string().max(200).optional(),
  tags: z.array(z.string().min(1)).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  includeRelations: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'priority'])
    .default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export type IssueFilters = z.infer<typeof IssueFilterSchema>;
