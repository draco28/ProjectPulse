/**
 * MCP Tool: onboarding.getPrompt
 *
 * Purpose: Retrieve onboarding prompt template for a specific session
 *
 * Use Case: Agent invokes when user starts onboarding or needs next session prompt
 *
 * Pattern: Zod schema → HTTP GET → Return prompt template with pre-filled variables
 *
 * @see US-030: onboarding.getPrompt MCP tool
 * @see FR-030: MCP Tool onboarding.getPrompt()
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const getPromptSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),

  sessionNumber: z.number()
    .int('Session number must be an integer')
    .min(1, 'Session number must be between 1 and 3')
    .max(3, 'Session number must be between 1 and 3')
    .optional(),
});

type GetPromptInput = z.infer<typeof getPromptSchema>;

// API Response Types
interface GetPromptResponse {
  sessionNumber: number;
  sessionName: string;
  promptTemplate: string;
  expectedVariables: string[];
  resolvedVariables: Record<string, string>;
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Handler for onboarding.getPrompt tool
 *
 * Flow:
 * 1. Build query parameters (projectId, optional sessionNumber)
 * 2. Call GET /api/onboarding/prompt
 * 3. Format response with prompt + pre-filled variables
 */
async function handler(
  input: GetPromptInput,
  context: ToolContext
): Promise<string> {
  try {
    // 1. Build query string
    const params = new URLSearchParams({
      projectId: input.projectId.toString(),
    });

    if (input.sessionNumber !== undefined) {
      params.append('sessionNumber', input.sessionNumber.toString());
    }

    // 2. Call Next.js API
    const url = `/api/onboarding/prompt?${params.toString()}`;
    const response = await context.httpClient.get<GetPromptResponse>(url);

    // 3. Format response for MCP
    const { sessionNumber, sessionName, promptTemplate, expectedVariables, resolvedVariables } = response;

    // Build variable substitution info
    const variableInfo = expectedVariables.map((varName) => ({
      variable: varName,
      value: resolvedVariables[varName] || '[Not yet provided]',
      source: resolvedVariables[varName] ? 'Previous session' : 'Awaiting input',
    }));

    return JSON.stringify({
      message: `Retrieved ${sessionName} prompt (Session ${sessionNumber}/3)`,
      session: {
        number: sessionNumber,
        name: sessionName,
      },
      prompt: promptTemplate,
      variables: {
        expected: expectedVariables,
        resolved: resolvedVariables,
        details: variableInfo,
      },
      nextSteps: [
        `Guide user through questions in prompt`,
        `Collect responses and call onboarding.submitResponse()`,
        sessionNumber < 3
          ? `After completion, proceed to Session ${sessionNumber + 1}`
          : 'This is the final session',
      ],
    }, null, 2);
  } catch (error: any) {
    // Error handling
    return JSON.stringify({
      error: 'Failed to fetch onboarding prompt',
      details: error.response?.data?.error || error.message || 'Unknown error',
      suggestion:
        error.response?.status === 404
          ? 'Project may not exist or all sessions are complete. Check projectId.'
          : 'Verify API is running and projectId is valid',
    }, null, 2);
  }
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const onboardingGetPromptTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getPrompt',
  description:
    'Retrieve onboarding prompt template for a specific session. If sessionNumber is omitted, returns next incomplete session. Pre-fills variables from prior sessions.',
  schema: getPromptSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (integer, positive)',
      },
      sessionNumber: {
        type: 'number',
        description: 'Session number (1, 2, or 3). Optional - if omitted, returns next incomplete session.',
      },
    },
    required: ['projectId'],
  },
  execute: async (params, context) => {
    const input = params as GetPromptInput;
    const result = await handler(input, context);

    context.logger.info('Onboarding prompt retrieved', {
      projectId: input.projectId,
      sessionNumber: input.sessionNumber || 'auto',
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
