/**
 * Persona Get MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * Gets full persona details including systemPrompt, skills, tools, and rules.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  id: z.number().int().positive().optional().describe('Persona ID (use either id or slug)'),
  slug: z.string().optional().describe('Persona slug (use either id or slug)'),
}).refine(data => data.id || data.slug, {
  message: 'Either id or slug is required',
});

type GetPersonaInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const personaGetTool: ToolDefinition = {
  name: 'projectpulse_persona_get',
  description: 'Get full details of a specific persona including systemPrompt, skills, tools, and rules. Use this to adopt an expert role.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID for multi-tenancy',
      },
      id: {
        type: 'number',
        description: 'Persona ID (use either id or slug)',
      },
      slug: {
        type: 'string',
        description: 'Persona slug (use either id or slug)',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as GetPersonaInput;
    const { projectId, id, slug } = input;
    
    context.logger.info('Getting persona', { projectId, id, slug });
    
    try {
      // Determine endpoint
      const endpoint = id 
        ? `/api/personas/${id}?projectId=${projectId}`
        : `/api/personas/by-slug/${slug}?projectId=${projectId}`;
      
      const persona = await context.httpClient.get(endpoint) as any;
      
      context.logger.info('Persona retrieved', {
        projectId,
        id: persona.id,
        name: persona.name,
      });
      
      // Format for agent readability
      const skillsList = persona.skills?.length > 0 
        ? persona.skills.map((s: string) => `- \`${s}\``).join('\n')
        : '_None defined_';
      
      const toolsList = persona.tools?.length > 0
        ? persona.tools.map((t: string) => `- \`${t}\``).join('\n')
        : '_None defined_';
      
      const rulesList = persona.rules?.length > 0
        ? persona.rules.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')
        : '_None defined_';
      
      const expertiseList = persona.expertise?.length > 0
        ? persona.expertise.join(', ')
        : 'General';
      
      return {
        content: [
          {
            type: 'text',
            text: `# ${persona.name} ${persona.icon || ''}\n\n` +
              `**Slug**: \`${persona.slug}\`\n` +
              `**Active**: ${persona.isActive ? '✅ Yes' : '❌ No'}\n` +
              `**Built-in**: ${persona.isBuiltIn ? 'Yes' : 'No'}\n` +
              `**Expertise**: ${expertiseList}\n\n` +
              `## Description\n\n${persona.description || '_No description_'}\n\n` +
              `## Personality\n\n${persona.personality || '_No personality defined_'}\n\n` +
              `## System Prompt\n\n\`\`\`\n${persona.systemPrompt}\n\`\`\`\n\n` +
              `## Skills\n\n${skillsList}\n\n` +
              `## MCP Tools\n\n${toolsList}\n\n` +
              `## Rules\n\n${rulesList}`,
          },
        ],
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to get persona', {
        error: errorMessage,
        projectId,
        id,
        slug,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get persona',
              message: errorMessage,
              projectId,
              id,
              slug,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
