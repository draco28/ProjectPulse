import { z } from 'zod';
import type { ToolDefinition } from './types.js';

/**
 * MCP Tool: projectpulse.wiki.generate
 *
 * Auto-generates wiki pages from JSDoc/docstring comments in source code.
 * Scans project files, extracts documentation comments, and creates database-backed wiki pages.
 *
 * @see US-107: Auto-Generate Wiki from JSDoc/Docstrings (8 points)
 * @see POST /api/wiki/generate endpoint
 */

const inputSchema = z.object({
  projectPath: z
    .string()
    .min(1)
    .max(500)
    .describe(
      'Absolute path to the project directory to scan for JSDoc comments. Example: "/Users/draco/projects/my-app"'
    ),
  filePatterns: z
    .array(z.string())
    .optional()
    .describe(
      'Glob patterns for files to scan (optional). Defaults to ["**/*.{ts,tsx,js,jsx}"]. Example: ["src/**/*.ts", "lib/**/*.js"]'
    ),
  category: z
    .enum(['getting-started', 'guides', 'reference', 'troubleshooting'])
    .default('reference')
    .describe('Category for generated wiki pages. Defaults to "reference"'),
  overwriteExisting: z
    .boolean()
    .default(false)
    .describe(
      'Whether to overwrite existing wiki pages with the same path. Defaults to false (skip existing pages)'
    ),
});

type WikiGenerateInput = z.infer<typeof inputSchema>;

type WikiGenerateResponse = {
  success: boolean;
  pagesCreated: number;
  pagesUpdated: number;
  pagesSkipped: number;
  pages: Array<{
    id: number;
    title: string;
    path: string;
    sourceFile: string;
  }>;
  errors?: Array<{
    file: string;
    error: string;
  }>;
};

export const wikiGenerateTool: ToolDefinition = {
  name: 'projectpulse_wiki_generate',
  description:
    'Auto-generate wiki pages from JSDoc/docstring comments in source code. Scans TypeScript, JavaScript, or Python files for documentation comments, extracts function/class descriptions, parameters, return types, and examples, then creates wiki pages in the database. Supports cross-linking via @see tags. Use this to keep API documentation synchronized with code.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description:
          'Absolute path to the project directory to scan. Example: "/Users/draco/projects/my-app"',
      },
      filePatterns: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional glob patterns for files to scan. Defaults to ["**/*.{ts,tsx,js,jsx}"]. Example: ["src/**/*.ts", "lib/**/*.js"]',
      },
      category: {
        type: 'string',
        enum: ['getting-started', 'guides', 'reference', 'troubleshooting'],
        description: 'Category for generated wiki pages. Defaults to "reference"',
      },
      overwriteExisting: {
        type: 'boolean',
        description:
          'Whether to overwrite existing wiki pages. Defaults to false (skip existing pages)',
      },
    },
    required: ['projectPath'],
  },
  execute: async (params, context) => {
    const { projectPath, filePatterns, category, overwriteExisting } =
      params as WikiGenerateInput;

    try {
      const requestBody: any = {
        projectPath,
        category,
        overwriteExisting,
      };

      if (filePatterns && filePatterns.length > 0) {
        requestBody.filePatterns = filePatterns;
      }

      const data = await context.httpClient.post<WikiGenerateResponse>(
        '/api/wiki/generate',
        requestBody
      );

      const { success, pagesCreated, pagesUpdated, pagesSkipped, pages, errors } = data;

      let summary = `✅ Wiki generation complete\n\n`;

      summary += `📊 Results:\n`;
      summary += `  - Pages created: ${pagesCreated}\n`;
      summary += `  - Pages updated: ${pagesUpdated}\n`;
      summary += `  - Pages skipped: ${pagesSkipped}\n`;
      summary += `  - Total processed: ${pages.length}\n\n`;

      if (pages.length > 0) {
        summary += `📄 Generated pages:\n`;
        pages.slice(0, 10).forEach((page) => {
          summary += `  - ${page.title} (/wiki${page.path})\n`;
          summary += `    Source: ${page.sourceFile}\n`;
        });

        if (pages.length > 10) {
          summary += `  ... and ${pages.length - 10} more pages\n`;
        }
      }

      if (errors && errors.length > 0) {
        summary += `\n⚠️ Errors encountered:\n`;
        errors.forEach((error) => {
          summary += `  - ${error.file}: ${error.error}\n`;
        });
      }

      context.logger.info('Wiki pages generated', {
        projectPath,
        pagesCreated,
        pagesUpdated,
        pagesSkipped,
        totalPages: pages.length,
        hasErrors: errors && errors.length > 0,
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
      const errorDetails = error.response?.data?.errors
        ? `\n\nValidation errors:\n${JSON.stringify(error.response.data.errors, null, 2)}`
        : '';

      context.logger.error('Failed to generate wiki pages', {
        error: errorMessage,
        projectPath,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to generate wiki pages: ${errorMessage}${errorDetails}`,
          },
        ],
        isError: true,
      };
    }
  },
};
