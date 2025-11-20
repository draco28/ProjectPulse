import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  sessionId: z.number().int().positive(),
  validationReport: z.object({
    gaps: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
    overallScore: z.number().min(0).max(1).optional(),
    recommendations: z.array(z.string()).optional(),
    summary: z.string().optional()
  }).passthrough().optional() // Allow custom fields
});

type CompleteSessionInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const completeSessionTool: ToolDefinition = {
  name: 'projectpulse_observability_completeSession',
  description: 'Mark an onboarding session as completed with optional validation report. Stores gaps, warnings, overall quality score, and recommendations. Enables quality tracking and continuous improvement of onboarding.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'number',
        description: 'OnboardingSession ID to mark as completed'
      },
      validationReport: {
        type: 'object',
        description: 'Optional validation report with quality assessment',
        properties: {
          gaps: {
            type: 'array',
            items: { type: 'string' },
            description: 'Identified gaps in documentation or requirements'
          },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            description: 'Warnings encountered during session'
          },
          overallScore: {
            type: 'number',
            description: 'Overall quality score (0-1, where 1 is perfect)'
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Recommendations for improvement'
          },
          summary: {
            type: 'string',
            description: 'Summary of session completion'
          }
        }
      }
    },
    required: ['sessionId']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as CompleteSessionInput;
    const { sessionId, validationReport } = input;
    
    context.logger.info('Completing onboarding session', {
      sessionId,
      hasValidationReport: !!validationReport
    });
    
    try {
      const result = await context.httpClient.post(
        '/api/observability/complete-session',
        { sessionId, validationReport }
      ) as any;
      
      context.logger.info('Onboarding session completed', {
        sessionId,
        sessionNumber: result.sessionNumber,
        status: result.status
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
      context.logger.error('Failed to complete onboarding session', {
        error: errorMessage,
        sessionId
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to complete onboarding session',
              message: errorMessage,
              sessionId
            }, null, 2)
          }
        ]
      };
    }
  }
};
