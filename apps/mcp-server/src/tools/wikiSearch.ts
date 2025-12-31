import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { resolveProjectId } from './tickets/common.js';

/**
 * MCP Tool: projectpulse.wiki.search
 *
 * Search wiki pages by query string and optional category filter.
 *
 * Sprint 18: Auto-injects projectId from auth context when omitted.
 *
 * @see US-021: wiki.search MCP tool (3 points)
 * @see GET /api/wiki endpoint (with query params)
 */

const inputSchema = z.object({
  query: z.string().min(1).max(200).describe('Search query (searches title and content)'),
  category: z
    .enum(['getting-started', 'guides', 'reference', 'troubleshooting'])
    .optional()
    .describe('Filter by category (optional)'),
  limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of results (default: 10)'),
  offset: z.number().int().min(0).default(0).describe('Offset for pagination (default: 0)'),
  projectId: z.number().int().positive().optional().describe('Project ID (auto-fills from auth context when omitted)'),
});

type WikiSearchInput = z.infer<typeof inputSchema>;

type WikiSearchResponse = {
  pages: Array<{
    id: number;
    title: string;
    path: string;
    category: string;
    excerpt: string | null;
    createdAt: string;
    updatedAt: string;
    highlight?: string | null;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export const wikiSearchTool: ToolDefinition = {
  name: 'projectpulse_wiki_search',
  description:
    'Search wiki pages in ProjectPulse by query string. Searches both title and content. Optionally filter by category. Use this to find existing documentation, check if a topic is already covered, or discover related wiki pages. IMPORTANT: Use the returned "Path" value directly with wiki_get (e.g., wiki_get({ path: "/contextai/docs/04-project-plan" })).',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (searches both title and content fields)',
      },
      category: {
        type: 'string',
        enum: ['getting-started', 'guides', 'reference', 'troubleshooting'],
        description: 'Filter results by category (optional)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (1-50, default: 10)',
        default: 10,
      },
      offset: {
        type: 'number',
        description: 'Offset for pagination (default: 0)',
        default: 0,
      },
      projectId: {
        type: 'number',
        description: 'Project ID (auto-fills from auth context when omitted)',
      },
    },
    required: ['query'],
  },
  execute: async (params, context) => {
    const { query, category, limit = 10, offset = 0, projectId: inputProjectId } = params as WikiSearchInput;

    // Sprint 18: Auto-inject projectId from auth context
    const projectId = resolveProjectId(inputProjectId, context.projectId);

    if (!projectId) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ projectId required (not available from auth context)

💡 This usually means the agent token doesn't have a project associated.
   Provide projectId explicitly or check your auth configuration.`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Build query params for GET /api/wiki
      const queryParams = new URLSearchParams({
        search: query,
        limit: limit.toString(),
        offset: offset.toString(),
        project: projectId.toString(),
      });

      if (category) {
        queryParams.append('category', category);
      }

      const data = await context.httpClient.get<WikiSearchResponse>(`/api/wiki?${queryParams.toString()}`);

      if (data.pages.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 No wiki pages found for query: "${query}"${category ? ` (category: ${category})` : ''}`,
            },
          ],
        };
      }

      const resultsList = data.pages
        .map((page, index) => {
          const excerpt = page.highlight || page.excerpt || 'No excerpt available';
          // Use raw database path - this is what wiki_get expects
          return `${offset + index + 1}. **${page.title}**
Path: ${page.path}
Category: ${page.category}
Excerpt: ${excerpt}
Updated: ${new Date(page.updatedAt).toLocaleDateString()}`;
        })
        .join('\n\n');

      const summary = `🔍 Found ${data.pagination.total} wiki page(s) for query: "${query}"${category ? ` (category: ${category})` : ''}

Showing results ${offset + 1}-${Math.min(offset + limit, data.pagination.total)} of ${data.pagination.total}${data.pagination.hasMore ? ' (more available)' : ''}

${resultsList}`;

      context.logger.info('Wiki search completed', {
        projectId,
        query,
        category,
        resultsCount: data.pages.length,
        total: data.pagination.total,
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

      context.logger.error('Failed to search wiki pages', {
        error: errorMessage,
        projectId,
        query,
        category,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to search wiki pages: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
