/**
 * Skill List MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * Lists all skills for a project.
 * Returns metadata only (no content) for token efficiency.
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
  category: z.string().optional().describe('Filter by category (framework, testing, workflow, troubleshooting, etc.)'),
  tags: z.string().optional().describe('Filter by tags (comma-separated)'),
  frameworks: z.string().optional().describe('Filter by frameworks (comma-separated)'),
  limit: z.number().int().min(1).max(50).default(20).describe('Max results to return'),
});

type ListSkillsInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const skillListTool: ToolDefinition = {
  name: 'projectpulse_skill_list',
  description: `[RESOURCE] List available skills (metadata only, no content).

When to Use:
- During planning to discover coding patterns and procedures
- When filtering by category (framework, testing, workflow, troubleshooting)
- When filtering by framework (react, next.js, prisma, typescript)

Token Efficient: Returns slug, title, description only (~100 tokens per skill)

Filters: category, tags (comma-separated), frameworks (comma-separated)

Next: Use projectpulse_skill_get with slug to load full content on-demand.`,
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID for multi-tenancy',
      },
      category: {
        type: 'string',
        description: 'Filter by category (framework, testing, workflow, troubleshooting, etc.)',
      },
      tags: {
        type: 'string',
        description: 'Filter by tags (comma-separated)',
      },
      frameworks: {
        type: 'string',
        description: 'Filter by frameworks (comma-separated)',
      },
      limit: {
        type: 'number',
        description: 'Max results to return (default: 20, max: 50)',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as ListSkillsInput;
    const { projectId, category, tags, frameworks, limit } = input;
    
    context.logger.info('Listing skills', { projectId, category, tags, frameworks, limit });
    
    try {
      const queryParams = new URLSearchParams({
        projectId: projectId.toString(),
        limit: limit.toString(),
      });
      
      if (category) queryParams.append('category', category);
      if (tags) queryParams.append('tags', tags);
      if (frameworks) queryParams.append('frameworks', frameworks);
      
      const response = await context.httpClient.get(
        `/api/skills?${queryParams.toString()}`
      ) as any;
      
      const skills = response.data?.skills || [];
      const pagination = response.data?.pagination;
      
      context.logger.info('Skills listed', {
        projectId,
        count: skills.length,
        total: pagination?.total,
      });
      
      // Group skills by category for readability
      const byCategory: Record<string, any[]> = {};
      for (const skill of skills) {
        const cat = skill.category || 'uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(skill);
      }
      
      // Format for agent readability
      const sections = Object.entries(byCategory).map(([cat, catSkills]) => {
        const skillLines = catSkills.map((s: any) => 
          `  - **${s.title}** (\`${s.slug}\`)\n    ${s.description || 'No description'}\n    Tags: ${s.tags?.join(', ') || 'none'}`
        ).join('\n');
        return `### ${cat}\n\n${skillLines}`;
      }).join('\n\n');
      
      const paginationInfo = pagination 
        ? `\n\n---\n_Showing ${skills.length} of ${pagination.total} skills (page ${pagination.page}/${pagination.totalPages})_`
        : '';
      
      // Phase 3: Add resource tip
      const baseMarkdown = `# Available Skills (${skills.length})\n\n${sections || '_No skills found._'}${paginationInfo}\n\n_Use \`skill.get\` to load full content on-demand._`;
      const markdownWithHint = addResourceTipToMarkdown(baseMarkdown, 'skills');

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
      context.logger.error('Failed to list skills', {
        error: errorMessage,
        projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list skills',
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
