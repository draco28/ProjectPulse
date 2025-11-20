import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const sopSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().min(1),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).default([])
});

const schema = z.object({
  projectId: z.number().int().positive(),
  sops: z.array(sopSchema).min(1).max(10)
});

type CreateSOPBatchInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const createSOPBatchTool: ToolDefinition = {
  name: 'projectpulse_batch_createSOPs',
  description: 'Bulk create 1-10 SOPs (Standard Operating Procedures) for Session 3 bootstrap. Agent generates SOPs from project workflows, tool creates them atomically. Enables partial retries if specific SOPs fail.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to create SOPs for'
      },
      sops: {
        type: 'array',
        description: 'Array of 1-10 SOPs to create',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title', 'slug', 'description', 'content', 'category'],
          properties: {
            title: {
              type: 'string',
              description: 'SOP title (e.g., "Git Workflow Guidelines")'
            },
            slug: {
              type: 'string',
              description: 'URL-safe slug (e.g., "git-workflow-guidelines")'
            },
            description: {
              type: 'string',
              description: 'Short summary (1-2 sentences)'
            },
            content: {
              type: 'string',
              description: 'Full SOP content in markdown format'
            },
            category: {
              type: 'string',
              description: 'Category (Development, Testing, Deployment, etc.)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords for search (e.g., ["git", "workflow", "branching"])'
            }
          }
        }
      }
    },
    required: ['projectId', 'sops']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as CreateSOPBatchInput;
    const { projectId, sops } = input;
    
    context.logger.info('Creating SOP batch', {
      projectId,
      count: sops.length
    });
    
    try {
      const result = await context.httpClient.post(
        '/api/batch/sops',
        { projectId, sops }
      ) as any;
      
      context.logger.info('SOP batch created', {
        projectId,
        created: result.created,
        duplicates: result.duplicates?.length || 0
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
      context.logger.error('Failed to create SOP batch', {
        error: errorMessage,
        projectId,
        count: sops.length
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create SOP batch',
              message: errorMessage,
              projectId
            }, null, 2)
          }
        ]
      };
    }
  }
};
