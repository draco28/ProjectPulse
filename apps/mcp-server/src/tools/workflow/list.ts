import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

/**
 * MCP Tool: projectpulse.workflow.list
 *
 * List available workflow templates with optional filtering.
 *
 * @see US-038: workflow.list MCP tool (3 points)
 * @see GET /api/workflows endpoint
 */

const inputSchema = z.object({
  category: z
    .enum(['development', 'project-management', 'knowledge'])
    .optional()
    .describe('Filter by category (optional)'),
  isActive: z.boolean().optional().default(true).describe('Filter by active status (default: true)'),
});

type WorkflowListInput = z.infer<typeof inputSchema>;

type WorkflowListResponse = {
  templates: Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    stepCount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export const workflowListTool: ToolDefinition = {
  name: 'projectpulse.workflow.list',
  description:
    'List available workflow templates in ProjectPulse. Optionally filter by category (development, project-management, knowledge) or active status. Use this to discover available workflows before starting a new workflow run.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['development', 'project-management', 'knowledge'],
        description: 'Filter by category (optional)',
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by active status (default: true)',
        default: true,
      },
    },
    required: [],
  },
  execute: async (params, context) => {
    const { category, isActive = true } = params as WorkflowListInput;

    try {
      // Build query params for GET /api/workflows
      const queryParams = new URLSearchParams({
        isActive: isActive.toString(),
      });

      if (category) {
        queryParams.append('category', category);
      }

      const response = await context.httpClient.get<{ data: WorkflowListResponse; error: null | string }>(
        `/api/workflows?${queryParams.toString()}`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const { templates } = response.data;

      if (templates.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📋 No workflow templates found${category ? ` for category: ${category}` : ''}`,
            },
          ],
        };
      }

      // Group by category
      const grouped: Record<string, typeof templates> = {};
      templates.forEach((t) => {
        if (!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category]!.push(t);
      });

      const sections = Object.entries(grouped)
        .map(([cat, temps]) => {
          const list = temps
            .map(
              (t) =>
                `  • **${t.name}** (ID: ${t.id}, ${t.stepCount} steps)
    ${t.description}`
            )
            .join('\n\n');
          return `**${cat.toUpperCase()}** (${temps.length} template${temps.length !== 1 ? 's' : ''}):\n${list}`;
        })
        .join('\n\n');

      const summary = `📋 Found ${templates.length} workflow template${templates.length !== 1 ? 's' : ''}${category ? ` in category: ${category}` : ''}

${sections}

💡 **Next steps**: Use \`workflow.start\` with a templateId to begin a workflow run.`;

      context.logger.info('Workflow templates listed', {
        category,
        isActive,
        count: templates.length,
      });

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';

      context.logger.error('Failed to list workflow templates', {
        error: errorMessage,
        category,
        isActive,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to list workflow templates: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
