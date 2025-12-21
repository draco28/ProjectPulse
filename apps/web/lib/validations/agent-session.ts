/**
 * Agent Session Validation Schemas
 *
 * Sprint 12: New AgentSession model for tracking agent work
 * Validates API requests for agent session CRUD operations
 */

import { z } from 'zod';

/**
 * Todo item schema for session todos array
 */
export const TodoItemSchema = z.object({
  content: z.string().min(1, 'Todo content is required'),
  status: z.enum(['pending', 'in_progress', 'completed']),
  ticketId: z.number().int().positive().nullable().optional(),
});

export type TodoItem = z.infer<typeof TodoItemSchema>;

/**
 * Create agent session request
 */
export const CreateAgentSessionSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  name: z.string().min(1).max(255).optional(),
  plan: z.string().max(10000).optional(),
  todos: z.array(TodoItemSchema).max(100).optional(),
  progress: z.string().max(10000).optional(),
  activeTicketIds: z.array(z.number().int().positive()).max(50).optional(),
});

export type CreateAgentSessionInput = z.infer<typeof CreateAgentSessionSchema>;

/**
 * Update agent session request
 */
export const UpdateAgentSessionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  plan: z.string().max(10000).optional(),
  todos: z.array(TodoItemSchema).max(100).optional(),
  progress: z.string().max(10000).optional(),
  activeTicketIds: z.array(z.number().int().positive()).max(50).optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'PAUSED']).optional(),
});

export type UpdateAgentSessionInput = z.infer<typeof UpdateAgentSessionSchema>;

/**
 * Query params for listing agent sessions
 * Note: Using nullable() because searchParams.get() returns null for missing params
 */
export const ListAgentSessionsQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  status: z
    .enum(['IN_PROGRESS', 'COMPLETED', 'PAUSED'])
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .nullable()
    .optional()
    .transform((v) => v ?? 20),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
});

export type ListAgentSessionsQuery = z.infer<typeof ListAgentSessionsQuerySchema>;

/**
 * End session request (optional completion notes)
 */
export const EndAgentSessionSchema = z.object({
  progress: z.string().max(10000).optional(), // Final progress notes
});

export type EndAgentSessionInput = z.infer<typeof EndAgentSessionSchema>;
