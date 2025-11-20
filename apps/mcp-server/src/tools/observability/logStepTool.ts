import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  sessionId: z.number().int().positive(),
  stepName: z.string().min(1).max(200),
  metadata: z.object({
    tokensUsed: z.number().optional(),
    quality: z.string().optional(),
    warnings: z.array(z.string()).optional(),
    filesCreated: z.array(z.string()).optional(),
    filesModified: z.array(z.string()).optional(),
    errors: z.array(z.string()).optional()
  }).passthrough().optional() // Allow custom fields
});

type LogStepInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const logStepTool: ToolDefinition = {
  name: 'projectpulse_observability_logStep',
  description: 'Log an agent action/step to OnboardingSession metrics for observability. Creates audit trail of agent actions, token usage, quality, and warnings. Enables session replay, analytics dashboard, and debugging.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'number',
        description: 'OnboardingSession ID to log step for'
      },
      stepName: {
        type: 'string',
        description: 'Name of the step/action (e.g., "Generated PRD.md", "Parsed Project Plan")'
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata about the step',
        properties: {
          tokensUsed: {
            type: 'number',
            description: 'Tokens used for this step'
          },
          quality: {
            type: 'string',
            description: 'Quality assessment (e.g., "high", "medium", "low")'
          },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            description: 'Warnings encountered during this step'
          },
          filesCreated: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files created during this step'
          },
          filesModified: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files modified during this step'
          },
          errors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Errors encountered (non-fatal)'
          }
        }
      }
    },
    required: ['sessionId', 'stepName']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as LogStepInput;
    const { sessionId, stepName, metadata } = input;
    
    context.logger.info('Logging agent step', {
      sessionId,
      stepName
    });
    
    try {
      const result = await context.httpClient.post(
        '/api/observability/log-step',
        { sessionId, stepName, metadata }
      ) as any;
      
      context.logger.info('Agent step logged', {
        sessionId,
        stepName,
        totalSteps: result.totalSteps
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to log agent step', {
        error: errorMessage,
        sessionId,
        stepName
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to log agent step',
              message: errorMessage,
              sessionId,
              stepName
            }, null, 2)
          }
        ]
      };
    }
  }
};
