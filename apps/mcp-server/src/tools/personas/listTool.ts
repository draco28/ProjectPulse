/**
 * Persona List MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * Lists all agent personas for a project.
 * Returns metadata only (no systemPrompt) for token efficiency.
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { addResourceTipToMarkdown } from '../../utils/contextHints.js';

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
  description: `[RESOURCE] List available agent personas (metadata only, no systemPrompt).

When to Use:
- Discovering what expert roles are available for the project
- Finding a persona matching your current task's domain
- Filtering by active status (isActive=true for deployable personas)

Token Efficient: Returns name, slug, description, expertise only

Next: Use projectpulse_persona_get with slug to load full systemPrompt on-demand.`,
  
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
      
      // Phase 3: Add resource tip
      const baseMarkdown = `# Available Personas (${response.count})\n\n${formatted || '_No personas found._'}\n\n---\n_Use \`persona.get\` to load full details including systemPrompt._`;
      const markdownWithHint = addResourceTipToMarkdown(baseMarkdown, 'personas');

      return {
        content: [
          {
            type: 'text',
            text: markdownWithHint,
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
