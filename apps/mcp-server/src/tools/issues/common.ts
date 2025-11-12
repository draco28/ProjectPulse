import { z } from 'zod';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface IssueLabel {
  id: number;
  name: string;
  color: string;
}

export interface IssueLinkedFile {
  id: number;
  filePath: string;
  lineNumber: number | null;
}

export interface IssueRecord {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  module?: string | null;
  assignee?: string | null;
  customFields?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  labels: IssueLabel[];
  linkedFiles: IssueLinkedFile[];
}

export interface IssueListResponse {
  issues: IssueRecord[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: Record<string, unknown>;
}

export interface IssueComment {
  id: number;
  content: string;
  author: string | null;
  createdAt: string;
  issueId: number;
}

export const issueFileSchema = z.object({
  filePath: z.string().min(1, 'filePath is required'),
  lineNumber: z.number().int().positive().optional(),
  snippet: z.string().max(5000).optional(),
});

export const issueContextSchema = z.object({
  files: z.array(issueFileSchema).max(25).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const baseIssueFields = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(50000).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  module: z.string().optional(),
  assignee: z.string().optional(),
  projectId: z.number().int().positive().optional(),
  labelIds: z.array(z.number().int().positive()).max(25).optional(),
  customFields: z.record(z.unknown()).optional(),
  context: issueContextSchema.optional(),
});

export const issueIdSchema = z
  .union([z.number().int().positive(), z.string().regex(/^\d+$/)])
  .transform((value) => Number(value));

export const issueInputProperties = {
  title: {
    type: 'string',
    description: 'Short summary (1-200 characters)',
  },
  description: {
    type: 'string',
    description: 'Detailed description (optional, up to 50k chars)',
  },
  status: {
    type: 'string',
    description: 'Status value (e.g., open, in_progress, closed)',
  },
  priority: {
    type: 'string',
    description: 'Priority value (e.g., critical, high, medium, low)',
  },
  module: {
    type: 'string',
    description: 'Module tag (UI, API, Database, etc.)',
  },
  assignee: {
    type: 'string',
    description: 'Optional assignee name',
  },
  projectId: {
    type: 'number',
    description: 'Project identifier (defaults to first project if omitted)',
  },
  labelIds: {
    type: 'array',
    items: { type: 'number' },
    description: 'Existing label IDs to attach',
  },
  customFields: {
    type: 'object',
    additionalProperties: true,
    description: 'Arbitrary custom fields stored on the issue',
  },
  context: {
    type: 'object',
    properties: {
      metadata: {
        type: 'object',
        additionalProperties: true,
      },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filePath: { type: 'string' },
            lineNumber: { type: 'number' },
            snippet: { type: 'string' },
          },
          required: ['filePath'],
        },
      },
    },
  },
};

export const buildSuccessPayload = (data: unknown) =>
  JSON.stringify(
    {
      status: 'success',
      data,
    },
    null,
    2
  );

export const buildErrorPayload = (message: string, code = 'ERROR', details?: unknown) =>
  JSON.stringify(
    {
      status: 'error',
      error: {
        code,
        message,
        details,
      },
    },
    null,
    2
  );

export const summarizeIssue = (issue: IssueRecord) => ({
  id: issue.id,
  title: issue.title,
  status: issue.status,
  priority: issue.priority,
  module: issue.module ?? null,
  assignee: issue.assignee ?? null,
  labels: issue.labels.map((label) => label.name),
  files: issue.linkedFiles.map((file) =>
    file.lineNumber ? `${file.filePath}:${file.lineNumber}` : file.filePath
  ),
  updatedAt: issue.updatedAt,
});
