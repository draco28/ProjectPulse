/**
 * MCP Tool: projectpulse_onboarding_getPhasedQuestions
 * 
 * Sprint 9 Refactor: Renamed from getQuestionsTool
 * 
 * Get questions for a specific phase (1-10) of Session 1: Strategic Planning
 * Returns questions from database + guidance from OnboardingPromptTemplate
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  phase: z.number()
    .int('Phase must be an integer')
    .min(1, 'Phase must be between 1-10')
    .max(10, 'Phase must be between 1-10')
});

type GetPhasedQuestionsInput = z.infer<typeof schema>;

export const getPhasedQuestionsTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getPhasedQuestions',
  description: 'Get questions for a specific phase (1-10) of Session 1: Strategic Planning. Returns questions from database with agent guidance from prompt templates.',
  schema,
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
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Fetching phased questions', {
        projectId: validated.projectId,
        phase: validated.phase
      });
      
      // Call API route which will:
      // 1. Fetch questions from OnboardingQuestion table
      // 2. Fetch guidance from OnboardingPromptTemplate
      // 3. Return combined response
      const response = await context.httpClient.get(
        `/api/onboarding/questions?projectId=${validated.projectId}&phase=${validated.phase}`
      ) as any;
      
      context.logger.info('Phased questions fetched', {
        projectId: validated.projectId,
        phase: validated.phase,
        phaseName: response.phaseName,
        totalQuestions: response.totalQuestions,
        estimatedTokens: response.estimatedTokens
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
      context.logger.error('Failed to fetch phased questions', {
        error: errorMessage,
        projectId: validated.projectId,
        phase: validated.phase
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch phased questions',
              message: errorMessage,
              projectId: validated.projectId,
              phase: validated.phase
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
