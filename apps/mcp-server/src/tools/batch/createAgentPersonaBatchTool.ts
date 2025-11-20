import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const agentPersonaSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  systemPrompt: z.string().min(10),
  skills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  icon: z.string().optional(),
  expertise: z.array(z.string()).default([]),
  personality: z.string().optional(),
  isActive: z.boolean().default(true),
  isBuiltIn: z.boolean().default(false)
});

const schema = z.object({
  projectId: z.number().int().positive(),
  personas: z.array(agentPersonaSchema).min(1).max(10)
});

type CreateAgentPersonaBatchInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const createAgentPersonaBatchTool: ToolDefinition = {
  name: 'projectpulse_batch_createAgentPersonas',
  description: 'Bulk create 1-10 agent personas for Session 3 bootstrap. Agent generates personas from tech stack, tool creates them atomically. Enables partial retries if specific personas fail.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to create personas for'
      },
      personas: {
        type: 'array',
        description: 'Array of 1-10 agent personas to create',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['name', 'slug', 'systemPrompt'],
          properties: {
            name: {
              type: 'string',
              description: 'Persona name (e.g., "React Expert")'
            },
            slug: {
              type: 'string',
              description: 'URL-safe slug (e.g., "react-expert")'
            },
            description: {
              type: 'string',
              description: 'Short description of persona capabilities'
            },
            systemPrompt: {
              type: 'string',
              description: 'System prompt defining persona behavior and expertise'
            },
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skill slugs this persona can load'
            },
            tools: {
              type: 'array',
              items: { type: 'string' },
              description: 'MCP tool names this persona can use'
            },
            rules: {
              type: 'array',
              items: { type: 'string' },
              description: 'Guidelines and rules for this persona'
            },
            icon: {
              type: 'string',
              description: 'Emoji or icon name'
            },
            expertise: {
              type: 'array',
              items: { type: 'string' },
              description: 'Areas of expertise'
            },
            personality: {
              type: 'string',
              description: 'Personality traits and communication style'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether persona is active (default: true)'
            },
            isBuiltIn: {
              type: 'boolean',
              description: 'Whether this is a built-in persona (default: false)'
            }
          }
        }
      }
    },
    required: ['projectId', 'personas']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as CreateAgentPersonaBatchInput;
    const { projectId, personas } = input;
    
    context.logger.info('Creating agent persona batch', {
      projectId,
      count: personas.length
    });
    
    try {
      const result = await context.httpClient.post(
        '/api/batch/agent-personas',
        { projectId, personas }
      ) as any;
      
      context.logger.info('Agent persona batch created', {
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
      context.logger.error('Failed to create agent persona batch', {
        error: errorMessage,
        projectId,
        count: personas.length
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create agent persona batch',
              message: errorMessage,
              projectId
            }, null, 2)
          }
        ]
      };
    }
  }
};
