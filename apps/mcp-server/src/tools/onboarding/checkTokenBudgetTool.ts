/**
 * MCP Tool: projectpulse_onboarding_checkTokenBudget
 * 
 * Sprint 9 Refactor: NEW TOOL
 * 
 * Check if estimated token usage is within 200K session limit
 * Prevents token overflow by validating before large operations
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  estimatedTokens: z.number()
    .int('Estimated tokens must be an integer')
    .positive('Estimated tokens must be positive')
});

type CheckTokenBudgetInput = z.infer<typeof schema>;

export const checkTokenBudgetTool: ToolDefinition = {
  name: 'projectpulse_onboarding_checkTokenBudget',
  description: 'Check if estimated token usage is within 200K session limit. Call before generating large content (doc batches, summary). Returns safe:boolean and remaining tokens.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      estimatedTokens: {
        type: 'number',
        description: 'Estimated tokens for next operation (e.g., 5000 for a phase, 40000 for a doc batch)'
      }
    },
    required: ['projectId', 'estimatedTokens']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Checking token budget', {
        projectId: validated.projectId,
        estimatedTokens: validated.estimatedTokens
      });
      
      // Call API route which will:
      // 1. Find active OnboardingSession for this project
      // 2. Get current tokensUsed from metrics JSONB
      // 3. Calculate: totalEstimated = tokensUsed + estimatedTokens
      // 4. Check: safe = (totalEstimated < 200000)
      // 5. Return budget status with recommendation
      const response = await context.httpClient.post(
        '/api/onboarding/token-budget',
        {
          projectId: validated.projectId,
          estimatedTokens: validated.estimatedTokens
        }
      ) as any;
      
      context.logger.info('Token budget check complete', {
        projectId: validated.projectId,
        safe: response.safe,
        tokensUsed: response.tokensUsed,
        remaining: response.remaining,
        budgetLimit: response.budgetLimit
      });
      
      // Log warning if approaching limit
      if (!response.safe) {
        context.logger.warn('Token budget exceeded!', {
          projectId: validated.projectId,
          totalEstimated: response.totalEstimated,
          budgetLimit: response.budgetLimit,
          recommendation: response.recommendation
        });
      } else if (response.remaining < 50000) {
        context.logger.warn('Approaching token budget limit', {
          projectId: validated.projectId,
          remaining: response.remaining
        });
      }
      
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
      context.logger.error('Failed to check token budget', {
        error: errorMessage,
        projectId: validated.projectId
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to check token budget',
              message: errorMessage,
              projectId: validated.projectId,
              // Fallback: assume safe if check fails
              safe: true,
              fallback: true
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
