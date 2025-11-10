import { z } from 'zod';
import type { ToolDefinition } from './types.js';

/**
 * MCP Tool: projectpulse.wiki.update
 *
 * Update an existing wiki page in ProjectPulse.
 *
 * @see US-022: wiki.update MCP tool (2 points)
 * @see PATCH /api/wiki/[slug] endpoint
 */

const inputSchema = z.object({
  path: z.string().min(3).max(100).describe('Wiki page path to update'),
  title: z.string().min(3).max(100).optional().describe('New title (optional)'),
  content: z.string().min(10).max(50000).optional().describe('New content in Markdown (optional)'),
  category: z
    .enum(['getting-started', 'guides', 'reference', 'troubleshooting'])
    .optional()
    .describe('New category (optional)'),
  excerpt: z.string().max(200).optional().describe('New excerpt (optional)'),
  parentPath: z.string().optional().describe('New parent path (optional)'),
});

type WikiUpdateInput = z.infer<typeof inputSchema>;

type WikiUpdateResponse = {
  id: number;
  title: string;
  path: string;
  content: string;
  category: string;
  excerpt: string | null;
  parentPath: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export const wikiUpdateTool: ToolDefinition = {
  name: 'projectpulse.wiki.update',
  description:
    'Update an existing wiki page in ProjectPulse. Supports partial updates - only provide fields you want to change. The path field identifies the page to update and cannot be changed (see TD-001 for future slug refactor).',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Wiki page path to update (required, identifies the page)',
      },
      title: {
        type: 'string',
        description: 'New title (optional, 3-100 characters)',
      },
      content: {
        type: 'string',
        description: 'New content in Markdown format (optional, 10-50000 characters)',
      },
      category: {
        type: 'string',
        enum: ['getting-started', 'guides', 'reference', 'troubleshooting'],
        description: 'New category (optional)',
      },
      excerpt: {
        type: 'string',
        description: 'New excerpt (optional, max 200 characters)',
      },
      parentPath: {
        type: 'string',
        description: 'New parent page path for hierarchy (optional)',
      },
    },
    required: ['path'],
  },
  execute: async (params, context) => {
    const { path, title, content, category, excerpt, parentPath } = params as WikiUpdateInput;

    // Build update payload (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (parentPath !== undefined) updateData.parentPath = parentPath;

    try {
      // Normalize path for API call (add leading slash if missing)
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;

      const data = await context.httpClient.patch<WikiUpdateResponse>(
        `/api/wiki${normalizedPath}`,
        updateData
      );

      const updatedFields = Object.keys(updateData).join(', ');
      const summary = `✅ Wiki page updated successfully

Title: ${data.title}
Path: /wiki/${data.path}
Category: ${data.category}
Version: ${data.version} (incremented)
Updated: ${new Date(data.updatedAt).toLocaleString()}

Fields updated: ${updatedFields}

Content preview: ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`;

      context.logger.info('Wiki page updated', {
        id: data.id,
        path: data.path,
        version: data.version,
        fieldsUpdated: updatedFields,
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
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const errorDetails = error.response?.data?.details
        ? `\n\nValidation errors:\n${JSON.stringify(error.response.data.details, null, 2)}`
        : '';

      context.logger.error('Failed to update wiki page', {
        error: errorMessage,
        path,
        fieldsAttempted: Object.keys(updateData).join(', '),
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to update wiki page: ${errorMessage}${errorDetails}

Note: If the page was not found, verify the path is correct. The path should match the URL path (e.g., "getting-started" for /wiki/getting-started).`,
          },
        ],
        isError: true,
      };
    }
  },
};
