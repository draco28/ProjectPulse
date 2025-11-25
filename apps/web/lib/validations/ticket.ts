/**
 * Ticket Validation Schemas (Sprint 10)
 *
 * Zod schemas for validating ticket-related API requests
 * Tickets are the unified WorkItem model - Issues are a subtype (kind='issue')
 *
 * Ticket kinds: feature, task, epic, issue, bug, scanner_finding, tech_debt
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 50000;
const MAX_ASSIGNEE_LENGTH = 120;
const MAX_MODULE_LENGTH = 80;
const MAX_FILEPATH_LENGTH = 2048;
const MAX_SNIPPET_LENGTH = 5000;

// ============================================================================
// ENUMS (as Zod schemas for runtime validation)
// ============================================================================

/**
 * Ticket kinds - the type of work item
 */
export const TicketKindSchema = z.enum([
  'feature',        // Planned feature work (linked to Tasks in roadmap)
  'task',           // Sub-task of a feature
  'epic',           // Large work spanning multiple sprints
  'issue',          // Bug/problem found during development
  'bug',            // Alias for issue (user preference)
  'scanner_finding', // Automated security/quality finding
  'tech_debt',      // Technical debt item
]);

export type TicketKind = z.infer<typeof TicketKindSchema>;

/**
 * Ticket source - how the ticket was created
 */
export const TicketSourceSchema = z.enum([
  'manual',      // Created by human via UI
  'onboarding',  // Created during project onboarding
  'scanner',     // Created by security/quality scanner
  'agent',       // Created by AI agent
]);

export type TicketSource = z.infer<typeof TicketSourceSchema>;

/**
 * Assignee type - who can be assigned to a ticket
 */
export const AssigneeTypeSchema = z.enum([
  'human',         // Human user
  'agent_persona', // AI agent persona
]);

export type AssigneeType = z.infer<typeof AssigneeTypeSchema>;

// Issue-like kinds (for backwards compatibility filters)
export const ISSUE_LIKE_KINDS: TicketKind[] = ['issue', 'bug', 'scanner_finding'];

// ============================================================================
// COMMON HELPERS
// ============================================================================

export const LinkedFileSchema = z.object({
  filePath: z
    .string()
    .min(1, 'File path is required')
    .max(MAX_FILEPATH_LENGTH, 'File path is too long'),
  lineNumber: z.number().int().positive().max(1_000_000).optional(),
  snippet: z.string().max(MAX_SNIPPET_LENGTH, 'Snippet cannot exceed 5,000 characters').optional(),
});

export type TicketFileContextInput = z.infer<typeof LinkedFileSchema>;

export const TicketContextSchema = z.object({
  files: z.array(LinkedFileSchema).max(25, 'Maximum of 25 file references allowed').optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TicketContextInput = z.infer<typeof TicketContextSchema>;

// ============================================================================
// BASE SCHEMA
// ============================================================================

const TicketBaseSchema = z.object({
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
  context: TicketContextSchema.optional(),
  
  // Sprint 10: New ticket-specific fields
  kind: TicketKindSchema.default('issue'),
  source: TicketSourceSchema.default('manual'),
  assigneeType: AssigneeTypeSchema.optional(),
  assigneeId: z.string().optional(),
  linkedTaskId: z.string().optional(), // Link to Task in roadmap hierarchy
});

export const TicketIdParamSchema = z.object({
  id: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/, 'ID must be numeric')
  ]).transform((value) => Number(value)),
});

// ============================================================================
// COMMENT VALIDATION
// ============================================================================

/**
 * Schema for creating a new comment on a ticket
 */
export const TicketCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment cannot exceed 10,000 characters')
    .trim(),
  author: z.string().optional(),
});

export type TicketCommentInput = z.infer<typeof TicketCommentSchema>;

// ============================================================================
// STATUS UPDATE VALIDATION
// ============================================================================

/**
 * Schema for updating ticket status
 */
export const TicketStatusUpdateSchema = z.object({
  status: z.string().min(1, 'Status is required').max(32, 'Status must be 32 characters or fewer'),
});

export type TicketStatusUpdate = z.infer<typeof TicketStatusUpdateSchema>;

// ============================================================================
// TICKET CREATION
// ============================================================================

/**
 * Schema for creating a new ticket
 */
export const CreateTicketSchema = TicketBaseSchema.extend({
  projectId: z.number().int().positive().optional(), // Optional - defaults to first project
});

export type CreateTicket = z.infer<typeof CreateTicketSchema>;

// ============================================================================
// TICKET UPDATE
// ============================================================================

/**
 * Schema for updating an existing ticket
 * All fields optional (partial update)
 */
export const UpdateTicketSchema = TicketBaseSchema.partial().extend({
  labelIds: z.array(z.number().int().positive()).optional(),
});

export type UpdateTicket = z.infer<typeof UpdateTicketSchema>;

// ============================================================================
// BULK CREATION
// ============================================================================

export const BulkTicketItemSchema = TicketBaseSchema.extend({
  reference: z.string().max(64).optional(), // External reference ID
});

export const TicketBulkCreateSchema = z.object({
  projectId: z.number().int().positive().optional(),
  tickets: z.array(BulkTicketItemSchema).min(1, 'At least one ticket is required').max(50, 'Max 50 tickets'),
});

export type BulkTicketCreateInput = z.infer<typeof TicketBulkCreateSchema>;

// ============================================================================
// FILTER & QUERY VALIDATION
// ============================================================================

export const TicketFilterSchema = z.object({
  projectId: z.number().int().positive().optional(),
  
  // Sprint 10: Kind filter (new)
  kind: z.array(TicketKindSchema).optional(),
  
  status: z.array(z.string().min(1)).optional(),
  priority: z.array(z.string().min(1)).optional(),
  module: z.array(z.string().min(1)).optional(),
  assignee: z.array(z.string().min(1)).optional(),
  search: z.string().max(200).optional(),
  tags: z.array(z.string().min(1)).optional(),
  
  // Sprint 10: Additional filters
  assigneeType: AssigneeTypeSchema.optional(),
  linkedTaskId: z.string().optional(),
  source: z.array(TicketSourceSchema).optional(),
  
  // Date filters
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  
  // Pagination & sorting
  includeRelations: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'kind']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export type TicketFilters = z.infer<typeof TicketFilterSchema>;

// ============================================================================
// ATTACHMENT VALIDATION
// ============================================================================

export const TicketAttachmentUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  mimetype: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Invalid MIME type'),
  size: z.number().int().positive().max(50 * 1024 * 1024, 'File size cannot exceed 50MB'),
});

export type TicketAttachmentUpload = z.infer<typeof TicketAttachmentUploadSchema>;

// ============================================================================
// LABEL MANAGEMENT
// ============================================================================

export const TicketLabelUpdateSchema = z.object({
  labelIds: z.array(z.number().int().positive()).min(1, 'At least one label ID required'),
  action: z.enum(['add', 'remove']),
});

export type TicketLabelUpdate = z.infer<typeof TicketLabelUpdateSchema>;

// ============================================================================
// BACKWARDS COMPATIBILITY - Issue aliases
// ============================================================================

// Re-export Issue-compatible types for backwards compatibility
export type IssueFilters = TicketFilters;
export type CreateIssue = CreateTicket;
export type UpdateIssue = UpdateTicket;
export type CommentInput = TicketCommentInput;
export type StatusUpdate = TicketStatusUpdate;

// Schemas that wrap Ticket schemas with kind filter
export const IssueFilterSchema = TicketFilterSchema.transform((data) => ({
  ...data,
  kind: data.kind ?? ISSUE_LIKE_KINDS,
}));

export const CreateIssueSchema = CreateTicketSchema.transform((data) => ({
  ...data,
  kind: data.kind ?? 'issue',
}));
