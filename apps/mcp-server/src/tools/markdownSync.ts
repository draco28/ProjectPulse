import { z } from 'zod';
import type { ToolDefinition } from './types.js';

const inputSchema = z.object({
  category: z
    .enum(['tracking', 'industry_doc', 'memory_bank'])
    .optional()
    .describe('Filter by category. Syncs all categories if omitted.'),
  force: z
    .boolean()
    .optional()
    .default(false)
    .describe('Force sync even if content hash matches'),
});

type MarkdownSyncInput = z.infer<typeof inputSchema>;

type SyncResponse = {
  success: boolean;
  syncedCount: number;
  skippedCount: number;
  errorCount: number;
  duration: number;
  files: Array<{
    slug: string;
    path: string;
    status: string;
    message?: string;
    duration: number;
  }>;
};

export const markdownSyncTool: ToolDefinition = {
  name: 'projectpulse.markdown.sync',
  description:
    'Sync markdown files from database to filesystem. Generates STATUS.md and other auto-generated documentation from current project state.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category (tracking, industry_doc, memory_bank). Syncs all if omitted.',
        enum: ['tracking', 'industry_doc', 'memory_bank'],
      },
      force: {
        type: 'boolean',
        description: 'Force sync even if content hash matches (default: false)',
        default: false,
      },
    },
  },
  execute: async (params, context) => {
    const { category, force } = params as MarkdownSyncInput;

    context.logger.info('Markdown sync requested', { category, force });

    try {
      // Call API endpoint
      const data = await context.httpClient.post<SyncResponse>('/api/markdown/sync', {
        category,
        force,
      });

      // Format response
      const summary =
        `✅ Markdown sync complete\n\n` +
        `Synced: ${data.syncedCount} file(s)\n` +
        `Skipped: ${data.skippedCount} file(s) (unchanged)\n` +
        `Errors: ${data.errorCount} file(s)\n` +
        `Duration: ${data.duration}ms`;

      let fileList = '';
      if (data.files && data.files.length > 0) {
        fileList = '\n\nFiles:\n' + data.files
          .map((f) => {
            const icon = f.status === 'synced' ? '✓' : f.status === 'skipped' ? '○' : '✗';
            return `  ${icon} ${f.path} (${f.duration}ms)`;
          })
          .join('\n');
      }

      const body = summary + fileList;

      context.logger.info('Markdown sync completed', {
        syncedCount: data.syncedCount,
        skippedCount: data.skippedCount,
        errorCount: data.errorCount,
        duration: data.duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: body,
          },
        ],
      };
    } catch (error) {
      context.logger.error('Markdown sync failed', { error });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Markdown sync failed:\n${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
