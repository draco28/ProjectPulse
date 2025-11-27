/**
 * Persona List MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * Lists all agent personas for a project.
 * Returns metadata only (no systemPrompt) for token efficiency.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  isActive: z.boolean().optional().describe('Filter by active status'),
});

type ListPersonasInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const personaListTool: ToolDefinition = {
  name: 'projectpulse_persona_list',
  description: 'List all agent personas for a project. Returns metadata only (no systemPrompt). Use persona.get to load full details including systemPrompt.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID for multi-tenancy',
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by active status (optional)',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as ListPersonasInput;
    const { projectId, isActive } = input;
    
    context.logger.info('Listing personas', { projectId, isActive });
    
    try {
      const queryParams = new URLSearchParams({
        projectId: projectId.toString(),
      });
      
      if (isActive !== undefined) {
        queryParams.append('isActive', isActive.toString());
      }
      
      const response = await context.httpClient.get(
        `/api/personas?${queryParams.toString()}`
      ) as any;
      
      context.logger.info('Personas listed', {
        projectId,
        count: response.count,
      });
      
      // Format for agent readability
      const personas = response.personas || [];
      const formatted = personas.map((p: any) => 
        `• **${p.name}** (\`${p.slug}\`) ${p.icon || ''}\n  ${p.description || 'No description'}\n  Expertise: ${p.expertise?.join(', ') || 'General'}\n  Active: ${p.isActive ? '✅' : '❌'}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `# Available Personas (${response.count})\n\n${formatted || '_No personas found._'}\n\n---\n_Use \`persona.get\` to load full details including systemPrompt._`,
          },
        ],
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to list personas', {
        error: errorMessage,
        projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list personas',
              message: errorMessage,
              projectId,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
