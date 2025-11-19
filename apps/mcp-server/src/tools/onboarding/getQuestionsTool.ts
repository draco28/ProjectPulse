/**
 * MCP Tool: projectpulse.onboarding.getQuestions
 * 
 * Sprint 8.6 Phase 1 - Session 1 Questions Tool
 * 
 * Get onboarding questions for a specific phase (1-10)
 * Part of 3-session onboarding system
 * 
 * Use Case: Agent fetches questions to ask user during Session 1
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const getQuestionsSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  phase: z.number()
    .int('Phase must be an integer')
    .min(1, 'Phase must be between 1-10')
    .max(10, 'Phase must be between 1-10')
});

type GetQuestionsInput = z.infer<typeof getQuestionsSchema>;

export const getQuestionsTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getQuestions',
  description: 'Get onboarding questions for a specific phase (1-10). Part of Session 1: Strategic Planning with 10 phases of questions.',
  schema: getQuestionsSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      phase: {
        type: 'number',
        description: 'Phase number (1-10): 1=Product Manager, 2=Strategic Planning, 3=UX/UI, 4=Architecture, 5=DevOps, 6=Backend, 7=Frontend, 8=QA, 9=Production, 10=Security'
      }
    },
    required: ['projectId', 'phase']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = getQuestionsSchema.parse(params);
    
    try {
      context.logger.info('Fetching onboarding questions', {
        projectId: validated.projectId,
        phase: validated.phase
      });
      
      const response = await context.httpClient.get(
        `/api/onboarding/questions?projectId=${validated.projectId}&phase=${validated.phase}`
      ) as any;
      
      context.logger.info('Questions fetched', {
        projectId: validated.projectId,
        phase: validated.phase,
        phaseName: response.phaseName,
        totalQuestions: response.totalQuestions
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to fetch questions', {
        error: errorMessage
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch questions',
              message: errorMessage
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
