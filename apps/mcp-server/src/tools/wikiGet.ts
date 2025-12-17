import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

/**
 * MCP Tool: projectpulse_wiki_get
 *
 * Retrieve a wiki page's full content by path.
 * Use this after wiki_search to find pages, then get their full content.
 *
 * @see GET /api/wiki/[slug] endpoint
 */

const inputSchema = z.object({
  path: z.string().min(1).max(500).describe(
    'Wiki page path (e.g., "/contextai/docs/04-project-plan" or "getting-started")'
  ),
});

type WikiGetInput = z.infer<typeof inputSchema>;

type WikiPageResponse = {
  data: {
    page: {
      id: string;
      title: string;
      content: string;
      path: string;
      category: string;
      createdAt: string;
      updatedAt: string;
    };
    relatedPages: Array<{
      id: string;
      title: string;
      path: string;
      category: string;
    }>;
  };
};

export const wikiGetTool: ToolDefinition = {
  name: 'projectpulse_wiki_get',
  description: `Retrieve a wiki page's full content by path.

Use this tool AFTER using wiki_search to find a page. The search returns paths - pass that path to this tool to get the full content.

Common use cases:
- Reading onboarding documents (04-Project-Plan.md, etc.) after Session 2
- Retrieving reference documentation
- Reading project plans and specifications

Example paths:
- "/contextai/docs/04-project-plan" (onboarding document)
- "/getting-started" (general wiki page)
- "/guides/api-reference" (documentation)`,

  schema: inputSchema,

  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Wiki page path from search results or known path',
      },
    },
    required: ['path'],
  },

  async execute(params: unknown, context: ToolContext) {
    const { path } = inputSchema.parse(params) as WikiGetInput;

    try {
      // Normalize path - remove leading slash for URL construction
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

      // Call GET /api/wiki/[slug]
      const data = await context.httpClient.get<WikiPageResponse>(
        `/api/wiki/${encodeURIComponent(normalizedPath)}`
      );

      const { page, relatedPages } = data.data;

      // Format response with full content
      const relatedList = relatedPages.length > 0
        ? `\n\n**Related Pages:**\n${relatedPages.map(p => `- ${p.title} (${p.path})`).join('\n')}`
        : '';

      const response = `# ${page.title}

**Path:** ${page.path}
**Category:** ${page.category}
**Updated:** ${new Date(page.updatedAt).toLocaleDateString()}

---

${page.content}${relatedList}`;

      context.logger.info('Wiki page retrieved', {
        path: page.path,
        title: page.title,
        contentLength: page.content.length,
      });

      return {
        content: [{ type: 'text', text: response }],
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const is404 = errorMessage.includes('404') || errorMessage.includes('not found');

      context.logger.error('Failed to retrieve wiki page', {
        error: errorMessage,
        path,
      });

      if (is404) {
        return {
          content: [{
            type: 'text',
            text: `❌ Wiki page not found at path: "${path}"

💡 Tips:
- Use projectpulse_wiki_search to find the correct path first
- Onboarding docs are at: /{project-slug}/docs/{document-name}
- Check if Session 2 completed (documents sync to wiki on completion)`,
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: `❌ Failed to retrieve wiki page: ${errorMessage}`,
        }],
        isError: true,
      };
    }
  },
};
