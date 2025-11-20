import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const skillSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([])
});

const schema = z.object({
  projectId: z.number().int().positive(),
  skills: z.array(skillSchema).min(1).max(10)
});

type CreateSkillBatchInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const createSkillBatchTool: ToolDefinition = {
  name: 'projectpulse_batch_createSkills',
  description: 'Bulk create 1-10 skills for Session 3 bootstrap. Agent generates skills from tech stack and project needs, tool creates them atomically. Enables partial retries if specific skills fail.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to create skills for'
      },
      skills: {
        type: 'array',
        description: 'Array of 1-10 skills to create',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['slug', 'title', 'content', 'category'],
          properties: {
            slug: {
              type: 'string',
              description: 'URL-safe slug (e.g., "react-hooks-debugging")'
            },
            title: {
              type: 'string',
              description: 'Skill title (e.g., "React Hooks Debugging")'
            },
            content: {
              type: 'string',
              description: 'Full skill content in markdown format'
            },
            category: {
              type: 'string',
              description: 'Category (framework, testing, workflow, troubleshooting, etc.)'
            },
            description: {
              type: 'string',
              description: 'Short summary (1-2 sentences)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords for search (e.g., ["react", "hooks", "performance"])'
            },
            frameworks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Related frameworks/tools (e.g., ["Next.js", "React"])'
            }
          }
        }
      }
    },
    required: ['projectId', 'skills']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as CreateSkillBatchInput;
    const { projectId, skills } = input;
    
    context.logger.info('Creating skill batch', {
      projectId,
      count: skills.length
    });
    
    try {
      const result = await context.httpClient.post(
        '/api/batch/skills',
        { projectId, skills }
      ) as any;
      
      context.logger.info('Skill batch created', {
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
      context.logger.error('Failed to create skill batch', {
        error: errorMessage,
        projectId,
        count: skills.length
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create skill batch',
              message: errorMessage,
              projectId
            }, null, 2)
          }
        ]
      };
    }
  }
};
