/**
 * MCP Tool: projectpulse_onboarding_getDocBatchPrompt
 * 
 * Sprint 9 Refactor: NEW TOOL (replaces getDocumentPrompts)
 * 
 * Get prompts for a batch of 4-5 documents (waterfall generation)
 * Session 2 has 4 batches total: Planning, Architecture, Implementation, Operations
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  batch: z.number()
    .int('Batch must be an integer')
    .min(1, 'Batch must be between 1-4')
    .max(4, 'Batch must be between 1-4')
});

type GetDocBatchPromptInput = z.infer<typeof schema>;

export const getDocBatchPromptTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getDocBatchPrompt',
  description: 'Get prompts for a batch of 4-5 documents (waterfall generation). Session 2 has 4 batches: 1=Planning, 2=Architecture, 3=Implementation, 4=Operations. Agent generates each doc with THEIR AI, then calls storeBatch.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      batch: {
        type: 'number',
        description: 'Batch number (1-4): 1=Planning (PRD, SRS, Backlog, Project Plan), 2=Architecture (Architecture, Data Model, API Spec), 3=Implementation (UI/UX, Security, Testing), 4=Operations (Deployment, Observability, Performance, Team Onboarding, Maintenance)'
      }
    },
    required: ['projectId', 'batch']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Fetching doc batch prompt', {
        projectId: validated.projectId,
        batch: validated.batch
      });
      
      // Call API route which will:
      // 1. Fetch OnboardingSession with projectContextJson
      // 2. Fetch OnboardingPromptTemplate for this batch
      // 3. Inject executiveSummary + projectContextJson into prompt
      // 4. Return batch-specific doc prompts with dependencies
      const response = await context.httpClient.get(
        `/api/onboarding/doc-batch?projectId=${validated.projectId}&batch=${validated.batch}`
      ) as any;
      
      context.logger.info('Doc batch prompt fetched', {
        projectId: validated.projectId,
        batch: response.batchNumber,
        documentCount: response.documents?.length,
        estimatedTotalTokens: response.estimatedTotalTokens
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
      context.logger.error('Failed to fetch doc batch prompt', {
        error: errorMessage,
        projectId: validated.projectId,
        batch: validated.batch
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch doc batch prompt',
              message: errorMessage,
              projectId: validated.projectId,
              batch: validated.batch,
              hint: 'Ensure Session 1 is complete (executive summary stored)'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
