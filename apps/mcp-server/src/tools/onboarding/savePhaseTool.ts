/**
 * MCP Tool: projectpulse_onboarding_savePhase
 * 
 * Sprint 9 Refactor: Renamed from saveAnswersTool
 * 
 * Save answers for a phase and merge into OnboardingSession.planningAnswers
 * Updates projectContextJson and tracks progress
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
    .max(10, 'Phase must be between 1-10'),
  answers: z.record(z.union([
    z.string(),
    z.number(),
    z.array(z.string())
  ]))
});

type SavePhaseInput = z.infer<typeof schema>;

export const savePhaseTool: ToolDefinition = {
  name: 'projectpulse_onboarding_savePhase',
  description: 'Save phase answers to OnboardingSession.planningAnswers and merge to projectContextJson. Tracks progress (10% per phase).',
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
        description: 'Phase number (1-10)'
      },
      answers: {
        type: 'object',
        description: 'Answers keyed by question ID (e.g., {"phase1_q1": "answer", "phase1_q2": "answer"})',
        additionalProperties: true
      }
    },
    required: ['projectId', 'phase', 'answers']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Saving phase answers', {
        projectId: validated.projectId,
        phase: validated.phase,
        answerCount: Object.keys(validated.answers).length
      });
      
      // Call API route which will:
      // 1. Get or create OnboardingSession (sessionNumber: 1)
      // 2. Merge answers into planningAnswers JSONB field
      // 3. Update projectContextJson with merged context
      // 4. Update metrics (phasesComplete, tokensUsed)
      // 5. Return progress info
      const response = await context.httpClient.post(
        '/api/onboarding/phase',
        {
          projectId: validated.projectId,
          phase: validated.phase,
          answers: validated.answers
        }
      ) as any;
      
      context.logger.info('Phase answers saved', {
        projectId: validated.projectId,
        phase: validated.phase,
        phasesComplete: response.phasesComplete,
        progress: response.progress,
        nextPhase: response.nextPhase
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
      context.logger.error('Failed to save phase answers', {
        error: errorMessage,
        projectId: validated.projectId,
        phase: validated.phase
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to save phase answers',
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
