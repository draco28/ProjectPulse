import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  IssueRecord,
  baseIssueFields,
  buildErrorPayload,
  buildSuccessPayload,
  issueInputProperties,
  summarizeIssue,
} from './common.js';

const issueCreateSchema = baseIssueFields.extend({
  title: baseIssueFields.shape.title,
});

type IssueCreateInput = z.infer<typeof issueCreateSchema>;

async function handler(input: IssueCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  try {
    const response = await httpClient.post<ApiResponse<IssueRecord>>('/api/issues', input);

    if (!response.data) {
      return buildErrorPayload(response.error?.message ?? 'Failed to create issue', response.error?.code);
    }

    logger.info('[issue.create] Issue created', { id: response.data.id });
    return buildSuccessPayload({ issue: summarizeIssue(response.data) });
  } catch (error) {
    logger.error('[issue.create] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueCreateTool: ToolDefinition = {
  name: 'projectpulse_issue_create',
  description:
    'Create a single issue with optional auto-tagging context (files + metadata). Use for ad-hoc bugs or feature requests discovered by the agent.',
  schema: issueCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ...issueInputProperties,
    },
    required: ['title'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueCreateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return {
      content: [{ type: 'text', text: result }],
    };
  },
};
