/**
 * MCP Tool: onboarding.submitResponse
 *
 * Purpose: Submit user/agent responses for a specific onboarding session
 *
 * Use Case: Agent invokes after collecting user answers for a session
 *
 * Pattern: Zod schema → HTTP POST → Upsert session response → Return next session
 *
 * @see US-031: onboarding.submitResponse MCP tool
 * @see FR-031: MCP Tool onboarding.submitResponse()
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const submitResponseSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),

  sessionNumber: z.number()
    .int('Session number must be an integer')
    .min(1, 'Session number must be between 1 and 3')
    .max(3, 'Session number must be between 1 and 3'),

  data: z.record(z.string(), z.any())
    .describe('Session response data as key-value pairs'),
});

type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// API Response Types
interface SubmitResponseResponse {
  sessionNumber: number;
  status: string;
  nextSession: number | null;
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Handler for onboarding.submitResponse tool
 *
 * Flow:
 * 1. Build request body (projectId, sessionNumber, data)
 * 2. Call POST /api/onboarding/responses
 * 3. Format response with status + next session indicator
 */
async function handler(
  input: SubmitResponseInput,
  context: ToolContext
): Promise<string> {
  try {
    // 1. Build API request
    const requestBody = {
      projectId: input.projectId,
      sessionNumber: input.sessionNumber,
      data: input.data,
    };

    // 2. Call Next.js API
    const response = await context.httpClient.post<SubmitResponseResponse>(
      '/api/onboarding/responses',
      requestBody
    );

    // 3. Format response for MCP
    const { sessionNumber, status, nextSession } = response;

    const variablesSummary = Object.keys(input.data).map((key) => ({
      variable: key,
      valuePreview: String(input.data[key]).substring(0, 50) + (String(input.data[key]).length > 50 ? '...' : ''),
    }));

    return JSON.stringify({
      message: `Session ${sessionNumber} response saved successfully`,
      session: {
        number: sessionNumber,
        status,
        variableCount: Object.keys(input.data).length,
        variables: variablesSummary,
      },
      next: nextSession
        ? {
            sessionNumber: nextSession,
            action: `Call onboarding.getPrompt() with sessionNumber=${nextSession} to continue`,
          }
        : {
            message: 'All onboarding sessions complete!',
            action: 'User can now use ProjectPulse features',
          },
      nextSteps: nextSession
        ? [
            `Session ${sessionNumber} complete`,
            `Proceed to Session ${nextSession}`,
            `Call onboarding.getPrompt(projectId=${input.projectId}, sessionNumber=${nextSession})`,
          ]
        : [
            'Onboarding complete!',
            'User project is ready',
            'Agent can now create issues, wiki pages, and knowledge items',
          ],
    }, null, 2);
  } catch (error: any) {
    // Error handling
    return JSON.stringify({
      error: 'Failed to submit onboarding response',
      details: error.response?.data?.error || error.message || 'Unknown error',
      suggestion:
        error.response?.status === 404
          ? 'Project may not exist. Verify projectId is correct.'
          : 'Verify API is running and request body is valid JSON',
    }, null, 2);
  }
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const onboardingSubmitResponseTool: ToolDefinition = {
  name: 'projectpulse.onboarding.submitResponse',
  description:
    'Submit user/agent responses for a specific onboarding session. Updates session status to "complete" and returns next session number (2, 3, or null if all complete).',
  schema: submitResponseSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (integer, positive)',
      },
      sessionNumber: {
        type: 'number',
        description: 'Session number (1, 2, or 3)',
      },
      data: {
        type: 'object',
        description:
          'Session response data as key-value pairs (e.g., {"project_name": "MyApp", "tech_stack": "React, Node.js"})',
      },
    },
    required: ['projectId', 'sessionNumber', 'data'],
  },
  execute: async (params, context) => {
    const input = params as SubmitResponseInput;
    const result = await handler(input, context);

    context.logger.info('Onboarding response submitted', {
      projectId: input.projectId,
      sessionNumber: input.sessionNumber,
      variableCount: Object.keys(input.data).length,
    });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  },
};
