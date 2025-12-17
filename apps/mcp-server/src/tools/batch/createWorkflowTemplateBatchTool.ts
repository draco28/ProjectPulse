import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { getOnboardingSyncHint } from '../../utils/contextHints.js';

//=============================================================================
// SCHEMA
//=============================================================================

const workflowTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().min(1),
  steps: z.array(z.object({
    name: z.string(),
    description: z.string(),
    action: z.string(),
    dependencies: z.array(z.string()).optional()
  })).min(1),
  isActive: z.boolean().default(true)
});

const schema = z.object({
  projectId: z.number().int().positive(),
  workflows: z.array(workflowTemplateSchema).min(1).max(10)
});

type CreateWorkflowTemplateBatchInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const createWorkflowTemplateBatchTool: ToolDefinition = {
  name: 'projectpulse_batch_createWorkflowTemplates',
  description: 'Bulk create 1-10 workflow templates for Session 3 bootstrap. Agent generates workflows from project plan, tool creates them atomically. Enables partial retries if specific workflows fail.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to create workflow templates for'
      },
      workflows: {
        type: 'array',
        description: 'Array of 1-10 workflow templates to create',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['name', 'description', 'category', 'steps'],
          properties: {
            name: {
              type: 'string',
              description: 'Workflow name (e.g., "Feature Development Workflow")'
            },
            description: {
              type: 'string',
              description: 'Workflow description'
            },
            category: {
              type: 'string',
              description: 'Category (development, project-management, knowledge)'
            },
            steps: {
              type: 'array',
              description: 'Array of workflow steps',
              minItems: 1,
              items: {
                type: 'object',
                required: ['name', 'description', 'action'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Step name'
                  },
                  description: {
                    type: 'string',
                    description: 'Step description'
                  },
                  action: {
                    type: 'string',
                    description: 'Action to perform'
                  },
                  dependencies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Step dependencies (optional)'
                  }
                }
              }
            },
            isActive: {
              type: 'boolean',
              description: 'Whether workflow is active (default: true)'
            }
          }
        }
      }
    },
    required: ['projectId', 'workflows']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as CreateWorkflowTemplateBatchInput;
    const { projectId, workflows } = input;
    
    context.logger.info('Creating workflow template batch', {
      projectId,
      count: workflows.length
    });
    
    try {
      const result = await context.httpClient.post(
        '/api/batch/workflow-templates',
        { projectId, workflows }
      ) as any;
      
      context.logger.info('Workflow template batch created', {
        projectId,
        created: result.created,
        duplicates: result.duplicates?.length || 0
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...result,
              _onboardingHint: getOnboardingSyncHint()
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to create workflow template batch', {
        error: errorMessage,
        projectId,
        count: workflows.length
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create workflow template batch',
              message: errorMessage,
              projectId
            }, null, 2)
          }
        ]
      };
    }
  }
};
