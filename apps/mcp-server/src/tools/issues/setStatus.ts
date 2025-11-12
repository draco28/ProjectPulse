import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  IssueRecord,
  buildErrorPayload,
  buildSuccessPayload,
  issueIdSchema,
  summarizeIssue,
} from './common.js';

const issueSetStatusSchema = z.object({
  issueId: issueIdSchema,
  status: z.string().min(1, 'Status is required'),
});

type IssueSetStatusInput = z.infer<typeof issueSetStatusSchema>;

async function handler(input: IssueSetStatusInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { issueId, status } = input;

  try {
    const response = await httpClient.patch<ApiResponse<IssueRecord>>(
      `/api/issues/${issueId}/status`,
      { status }
    );

    if (!response.data) {
      return buildErrorPayload(response.error?.message ?? 'Failed to update status', response.error?.code);
    }

    logger.info('[issue.setStatus] Status updated', { issueId, status });
    return buildSuccessPayload({ issue: summarizeIssue(response.data) });
  } catch (error) {
    logger.error('[issue.setStatus] Unexpected error', { error, issueId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueSetStatusTool: ToolDefinition = {
  name: 'projectpulse.issue.setStatus',
  description: 'Update the workflow status of an issue (open, in_progress, blocked, closed, etc.).',
  schema: issueSetStatusSchema,
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'number', description: 'Issue identifier' },
      status: { type: 'string', description: 'New status value' },
    },
    required: ['issueId', 'status'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueSetStatusSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
