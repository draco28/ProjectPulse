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

export interface TicketLabel {
  id: number;
  name: string;
  color: string;
}

export interface TicketLinkedFile {
  id: number;
  filePath: string;
  lineNumber: number | null;
}

export interface TicketRecord {
  id: number;
  projectId: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  kind: string; // NEW: 7 ticket kinds
  source: string; // NEW: 4 source types
  module?: string | null;
  assignee?: string | null;
  assigneeType?: string | null; // NEW: human or agent_persona
  assigneeId?: string | null; // NEW: User ID or AgentPersona ID
  linkedTaskId?: string | null; // Deprecated (Sprint 12) - use scheduledWeekId
  customFields?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null; // NEW: Timestamp when closed
  labels: TicketLabel[];
  linkedFiles: TicketLinkedFile[];
  // Sprint 13: Hierarchy fields
  parentTicketId?: number | null;
  parentTicket?: { id: number; title: string; kind: string; status: string } | null;
  childTickets?: Array<{ id: number; title: string; kind: string; status: string }>;
  _count?: { childTickets: number };
  // Sprint 13: Traceability fields
  epicRef?: string | null;
  backlogRefs?: string[];
  sprintNumber?: number | null;
}

export interface TicketListResponse {
  tickets: TicketRecord[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: Record<string, unknown>;
}

export interface TicketComment {
  id: number;
  content: string;
  author: string | null;
  createdAt: string;
  ticketId: number;
}

// Zod schemas
export const ticketKindSchema = z.enum([
  'feature',
  'task',
  'epic',
  'issue',
  'bug',
  'scanner_finding',
  'tech_debt',
]);

export const ticketSourceSchema = z.enum(['manual', 'scanner', 'agent', 'onboarding']);

export const ticketFileSchema = z.object({
  filePath: z.string().min(1, 'filePath is required'),
  lineNumber: z.number().int().positive().optional(),
  snippet: z.string().max(5000).optional(),
});

export const ticketContextSchema = z.object({
  files: z.array(ticketFileSchema).max(25).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const baseTicketFields = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(50000).optional(),
  kind: ticketKindSchema,
  source: ticketSourceSchema,
  status: z.string().optional(),
  priority: z.string().optional(),
  module: z.string().optional(),
  assignee: z.string().optional(),
  assigneeType: z.string().optional(),
  assigneeId: z.string().optional(),
  linkedTaskId: z.string().optional(), // Deprecated (Sprint 12)
  projectId: z.number().int().positive().optional(),
  labelIds: z.array(z.number().int().positive()).max(25).optional(),
  customFields: z.record(z.unknown()).optional(),
  context: ticketContextSchema.optional(),
  // Sprint 13: Hierarchy fields
  parentTicketId: z.number().int().positive().optional().nullable(),
  // Sprint 13: Traceability fields
  epicRef: z.string().max(200).optional().nullable(),
  backlogRefs: z.array(z.string().max(50)).max(50).optional(),
  sprintNumber: z.number().int().min(1).max(999).optional().nullable(),
});

export const ticketIdSchema = z
  .union([z.number().int().positive(), z.string().regex(/^\d+$/)])
  .transform((value) => Number(value));

// JSON Schema properties for MCP tool descriptions
export const ticketInputProperties = {
  title: {
    type: 'string',
    description: 'Short summary (1-200 characters)',
  },
  description: {
    type: 'string',
    description: 'Detailed description (optional, up to 50k chars)',
  },
  kind: {
    type: 'string',
    enum: ['feature', 'task', 'epic', 'issue', 'bug', 'scanner_finding', 'tech_debt'],
    description:
      'Ticket type: feature (new capability), task (work item), epic (large feature), issue (problem), bug (defect), scanner_finding (security/quality scan result), tech_debt (refactoring needed)',
  },
  source: {
    type: 'string',
    enum: ['manual', 'scanner', 'agent', 'onboarding'],
    description:
      'Ticket source: manual (human created), scanner (automated tool), agent (AI agent), onboarding (from project setup)',
  },
  status: {
    type: 'string',
    description: 'Status value (e.g., open, in_progress, blocked, completed, cancelled)',
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
  assigneeType: {
    type: 'string',
    description: 'Assignee type (human or agent_persona)',
  },
  assigneeId: {
    type: 'string',
    description: 'Assignee ID (User ID or AgentPersona ID)',
  },
  linkedTaskId: {
    type: 'string',
    description: 'DEPRECATED (Sprint 12): Sprint hierarchy task link - use scheduledWeekId instead',
  },
  projectId: {
    type: 'number',
    description: 'Project identifier (defaults to first project if omitted)',
  },
  // Sprint 13: Hierarchy fields
  parentTicketId: {
    type: 'number',
    description: 'Parent ticket ID (only for task/issue/bug/tech_debt kinds - parent must be a feature)',
  },
  // Sprint 13: Traceability fields
  epicRef: {
    type: 'string',
    description: 'Soft reference to epic (e.g., "Epic 1: User Management") - NOT a parent-child relationship',
  },
  backlogRefs: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of backlog references for traceability (e.g., ["FR-001", "FR-002", "NFR-003"])',
  },
  sprintNumber: {
    type: 'number',
    description: 'Sprint number for filtering (1, 2, 3, ...). Agents use this to find work for a specific sprint.',
  },
  labelIds: {
    type: 'array',
    items: { type: 'number' },
    description: 'Existing label IDs to attach',
  },
  customFields: {
    type: 'object',
    additionalProperties: true,
    description: 'Arbitrary custom fields stored on the ticket',
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

// Helper functions
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

export const summarizeTicket = (ticket: Partial<TicketRecord>) => ({
  id: ticket.id,
  projectId: ticket.projectId,
  title: ticket.title,
  description: ticket.description ?? null,
  kind: ticket.kind,
  source: ticket.source,
  status: ticket.status,
  priority: ticket.priority,
  module: ticket.module ?? null,
  assignee: ticket.assignee ?? null,
  assigneeType: ticket.assigneeType ?? null,
  customFields: ticket.customFields ?? null,
  labels: ticket.labels?.map((label) => label.name) ?? [],
  files: ticket.linkedFiles?.map((file) =>
    file.lineNumber ? `${file.filePath}:${file.lineNumber}` : file.filePath
  ) ?? [],
  linkedTaskId: ticket.linkedTaskId ?? null,
  closedAt: ticket.closedAt ?? null,
  updatedAt: ticket.updatedAt,
  createdAt: ticket.createdAt,
  // Sprint 13: Hierarchy fields
  parentTicketId: ticket.parentTicketId ?? null,
  parentTicket: ticket.parentTicket ?? null,
  childrenCount: ticket._count?.childTickets ?? ticket.childTickets?.length ?? 0,
  // Sprint 13: Traceability fields
  epicRef: ticket.epicRef ?? null,
  backlogRefs: ticket.backlogRefs ?? [],
  sprintNumber: ticket.sprintNumber ?? null,
});
