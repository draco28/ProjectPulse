import { z } from 'zod';

/**
 * Validation schemas for Onboarding System (Sprint 2 Week 4)
 *
 * @see US-026 to US-031 (Onboarding System)
 * @see FR-026 to FR-031 (Functional Requirements)
 */

// Session numbers: 1 (Executive Summary), 2 (Industry Docs), 3 (AI Workflow)
export const sessionNumbers = [1, 2, 3] as const;
export type SessionNumber = (typeof sessionNumbers)[number];

// Session status enum matching Prisma schema
export const sessionStatuses = ['pending', 'in_progress', 'complete'] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

/**
 * Validation schema for GET /api/onboarding/prompt
 *
 * Query parameters for retrieving onboarding prompt template
 *
 * @see US-030: onboarding.getPrompt MCP tool
 * @see FR-030: MCP Tool onboarding.getPrompt()
 */
export const getPromptSchema = z.object({
  projectId: z.coerce.number().int().positive('Project ID must be a positive integer'),
  sessionNumber: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val !== 'null' ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1 && val <= 3), {
      message: 'Session number must be between 1 and 3',
    }),
});

export type GetPromptInput = z.infer<typeof getPromptSchema>;

/**
 * Response type for GET /api/onboarding/prompt
 */
export interface GetPromptResponse {
  sessionNumber: SessionNumber;
  sessionName: string;
  promptTemplate: string;
  expectedVariables: string[];
  resolvedVariables: Record<string, string>; // Pre-filled from prior sessions
}

/**
 * Validation schema for POST /api/onboarding/responses
 *
 * Submit user/agent responses for a specific onboarding session
 *
 * @see US-031: onboarding.submitResponse MCP tool
 * @see FR-031: MCP Tool onboarding.submitResponse()
 */
export const submitResponseSchema = z.object({
  projectId: z.number().int().positive('Project ID must be a positive integer'),
  sessionNumber: z
    .number()
    .int()
    .min(1, 'Session number must be between 1 and 3')
    .max(3, 'Session number must be between 1 and 3'),
  data: z.record(z.string(), z.any()), // Flexible JSONB data structure
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

/**
 * Response type for POST /api/onboarding/responses
 */
export interface SubmitResponseResponse {
  sessionNumber: SessionNumber;
  status: SessionStatus;
  nextSession: SessionNumber | null; // 2, 3, or null (all complete)
}

/**
 * Type for onboarding template variables (from database)
 */
export interface TemplateVariables {
  expectedVariables: string[];
  [key: string]: any; // Additional metadata
}
