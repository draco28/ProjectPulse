import { z } from 'zod';
import type { ToolDefinition } from './types.js';

/**
 * MCP Tool: projectpulse.wiki.create
 *
 * Creates a new wiki page in ProjectPulse.
 *
 * @see US-020: wiki.create MCP tool (3 points)
 * @see POST /api/wiki endpoint
 */

const inputSchema = z.object({
  title: z.string().min(3).max(100).describe('Wiki page title'),
  path: z
    .string()
    .min(3)
    .max(100)
    .describe('URL path for the wiki page (auto-generated if not provided)'),
  content: z.string().min(10).max(50000).describe('Wiki page content in Markdown'),
  category: z
    .enum(['getting-started', 'guides', 'reference', 'troubleshooting'])
    .describe('Wiki page category'),
  excerpt: z.string().max(200).optional().describe('Brief description (optional, max 200 chars)'),
  parentPath: z.string().optional().describe('Parent page path for hierarchy (optional)'),
});

type WikiCreateInput = z.infer<typeof inputSchema>;

type WikiCreateResponse = {
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

export const wikiCreateTool: ToolDefinition = {
  name: 'projectpulse_wiki_create',
  description:
    'Create a new wiki page in ProjectPulse. Wiki pages are documentation pages organized by category (getting-started, guides, reference, troubleshooting). Use this to create onboarding guides, technical references, or troubleshooting documentation.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Wiki page title (3-100 characters)',
      },
      path: {
        type: 'string',
        description:
          'URL path for the wiki page (lowercase, hyphens, no spaces). Example: "getting-started-guide"',
      },
      content: {
        type: 'string',
        description: 'Wiki page content in Markdown format (10-50000 characters)',
      },
      category: {
        type: 'string',
        enum: ['getting-started', 'guides', 'reference', 'troubleshooting'],
        description: 'Category for organizing wiki pages',
      },
      excerpt: {
        type: 'string',
        description: 'Brief description shown in wiki list (optional, max 200 characters)',
      },
      parentPath: {
        type: 'string',
        description: 'Parent page path for creating hierarchical documentation (optional)',
      },
    },
    required: ['title', 'path', 'content', 'category'],
  },
  execute: async (params, context) => {
    const { title, path, content, category, excerpt, parentPath } = params as WikiCreateInput;

    try {
      const data = await context.httpClient.post<WikiCreateResponse>('/api/wiki', {
        title,
        path,
        content,
        category,
        excerpt: excerpt || null,
        parentPath: parentPath || null,
      });

      const summary = `✅ Wiki page created successfully

Title: ${data.title}
Path: /wiki/${data.path}
Category: ${data.category}
Version: ${data.version}
Created: ${new Date(data.createdAt).toLocaleString()}

Content preview: ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`;

      context.logger.info('Wiki page created', {
        id: data.id,
        title: data.title,
        path: data.path,
        category: data.category,
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

      context.logger.error('Failed to create wiki page', {
        error: errorMessage,
        title,
        path,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create wiki page: ${errorMessage}${errorDetails}`,
          },
        ],
        isError: true,
      };
    }
  },
};
