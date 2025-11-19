/**
 * MCP Tool: projectpulse.onboarding.saveAnswers
 * 
 * Sprint 8.6 Phase 1 - Session 1 Answers Tool
 * 
 * Save user answers for a specific phase
 * Tracks progress across 10 phases (Session 1)
 * 
 * Use Case: Agent saves user responses and tracks completion status
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const saveAnswersSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  phase: z.number()
    .int('Phase must be an integer')
    .min(1, 'Phase must be between 1-10')
    .max(10, 'Phase must be between 1-10'),
  answers: z.record(z.string(), z.any())
    .refine((data) => Object.keys(data).length > 0, {
      message: 'answers must contain at least one answer'
    })
});

type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;

export const saveAnswersTool: ToolDefinition = {
  name: 'projectpulse.onboarding.saveAnswers',
  description: 'Save user answers for a specific phase (1-10). Tracks progress across Session 1: Strategic Planning. Returns next phase number and readiness for executive summary generation.',
  schema: saveAnswersSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      phase: {
        type: 'number',
        description: 'Phase number (1-10)'
      },
      answers: {
        type: 'object',
        description: 'Answer data keyed by question ID (e.g., {"phase1_q1": "answer text", "phase1_q2": "answer text"})',
        additionalProperties: true
      }
    },
    required: ['projectId', 'phase', 'answers']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = saveAnswersSchema.parse(params);
    
    try {
      context.logger.info('Saving onboarding answers', {
        projectId: validated.projectId,
        phase: validated.phase,
        answersCount: Object.keys(validated.answers).length
      });
      
      const response = await context.httpClient.post('/api/onboarding/answers', {
        projectId: validated.projectId,
        phase: validated.phase,
        answers: validated.answers
      }) as any;
      
      context.logger.info('Answers saved', {
        projectId: validated.projectId,
        phase: validated.phase,
        completedPhases: response.completedPhases,
        nextPhase: response.nextPhase,
        readyForExecutiveSummary: response.readyForExecutiveSummary
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
      context.logger.error('Failed to save answers', {
        error: errorMessage
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to save answers',
              message: errorMessage
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
