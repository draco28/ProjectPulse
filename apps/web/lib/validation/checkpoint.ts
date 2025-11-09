/**
 * Checkpoint Validation Schemas
 *
 * Zod schemas for checkpoint creation and validation.
 * Checkpoints track agent progress every 15K tokens for context recovery.
 *
 * @module lib/validation/checkpoint
 */

import { z } from 'zod';

/**
 * SessionContext Schema
 *
 * Flexible structure for storing session context snapshots.
 * All fields are optional to allow partial context storage.
 * Uses .strict() to reject unknown properties.
 */
export const SessionContextSchema = z.object({
  // Hierarchy context
  taskId: z.string().cuid().optional(),
  taskTitle: z.string().max(200).optional(),
  dayId: z.string().cuid().optional(),
  dayTitle: z.string().max(100).optional(),

  // Progress context
  completionPercentage: z.number().min(0).max(100).optional(),
  checkpointCount: z.number().int().min(0).optional(),

  // Code context
  filesModified: z.array(z.string()).optional(),
  filesCreated: z.array(z.string()).optional(),
  endpointsImplemented: z.array(z.string()).optional(),

  // Recovery context
  uncommittedChanges: z.boolean().optional(),
  currentBranch: z.string().optional(),
  tokenBudgetRemaining: z.number().int().min(0).optional(),
}).strict(); // Reject unknown properties

export type SessionContext = z.infer<typeof SessionContextSchema>;

/**
 * Create Checkpoint Request Schema
 *
 * Validates checkpoint creation requests.
 * - sessionId: Must be valid CUID
 * - notes: 1-5000 characters
 * - tokenUsage: 0-200,000 (200K token limit)
 * - sessionContext: Optional context snapshot
 */
export const CreateCheckpointSchema = z.object({
  sessionId: z.string().cuid({ message: 'Invalid session ID format' }),
  notes: z.string()
    .min(1, 'Notes cannot be empty')
    .max(5000, 'Notes must be at most 5000 characters'),
  tokenUsage: z.number()
    .int('Token usage must be an integer')
    .min(0, 'Token usage cannot be negative')
    .max(200000, 'Token usage exceeds maximum (200K)'),
  sessionContext: SessionContextSchema.optional(),
});

export type CreateCheckpointInput = z.infer<typeof CreateCheckpointSchema>;

/**
 * Checkpoint Response Schema
 *
 * Represents a complete checkpoint record returned from the API.
 * Includes all fields stored in the database.
 */
export const CheckpointSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  notes: z.string(),
  tokenUsage: z.number().int(),
  sessionContext: SessionContextSchema.nullable(),
  checkpointNumber: z.number().int(),
  createdAt: z.date(),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
