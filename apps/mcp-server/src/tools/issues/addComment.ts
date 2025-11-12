import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  IssueComment,
  buildErrorPayload,
  buildSuccessPayload,
  issueIdSchema,
} from './common.js';

const issueAddCommentSchema = z.object({
  issueId: issueIdSchema,
  content: z.string().min(1).max(10000),
  author: z.string().max(120).optional(),
});

type IssueAddCommentInput = z.infer<typeof issueAddCommentSchema>;

async function handler(input: IssueAddCommentInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { issueId, ...payload } = input;

  try {
    const response = await httpClient.post<ApiResponse<IssueComment>>(
      `/api/issues/${issueId}/comments`,
      payload
    );

    if (!response.data) {
      return buildErrorPayload(response.error?.message ?? 'Failed to add comment', response.error?.code);
    }

    logger.info('[issue.addComment] Comment added', { issueId });
    return buildSuccessPayload({
      comment: {
        id: response.data.id,
        author: response.data.author,
        createdAt: response.data.createdAt,
        preview: response.data.content.slice(0, 160),
      },
    });
  } catch (error) {
    logger.error('[issue.addComment] Unexpected error', { error, issueId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueAddCommentTool: ToolDefinition = {
  name: 'projectpulse.issue.addComment',
  description: 'Add a progress note or clarification comment to an existing issue.',
  schema: issueAddCommentSchema,
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'number', description: 'Issue identifier' },
      content: { type: 'string', description: 'Comment body (supports Markdown)' },
      author: { type: 'string', description: 'Optional author override (defaults to Anonymous)' },
    },
    required: ['issueId', 'content'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueAddCommentSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
