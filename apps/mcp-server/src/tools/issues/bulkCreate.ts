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

interface IssueBulkResponse {
  created: number;
  failed: number;
  durationMs: number;
  issues: IssueRecord[];
}

const bulkIssueSchema = baseIssueFields.omit({ projectId: true }).extend({
  reference: z.string().max(64).optional(),
});

const bulkCreateSchema = z.object({
  projectId: z.number().int().positive().optional(),
  issues: z.array(bulkIssueSchema).min(1).max(50),
});

type IssueBulkCreateInput = z.infer<typeof bulkCreateSchema>;

async function handler(input: IssueBulkCreateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  try {
    const response = await httpClient.post<ApiResponse<IssueBulkResponse>>('/api/issues/bulk', input);

    if (!response.data) {
      return buildErrorPayload(response.error?.message ?? 'Bulk issue creation failed', response.error?.code);
    }

    logger.info('[issue.bulkCreate] Bulk insert completed', {
      created: response.data.created,
      durationMs: response.data.durationMs,
    });

    return buildSuccessPayload({
      summary: {
        created: response.data.created,
        failed: response.data.failed,
        durationMs: response.data.durationMs,
      },
      issues: response.data.issues.map(summarizeIssue),
    });
  } catch (error) {
    logger.error('[issue.bulkCreate] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueBulkCreateTool: ToolDefinition = {
  name: 'projectpulse.issue.bulkCreate',
  description:
    'Bulk create 1-50 issues in a single request (used for scanner findings or checklist imports). Auto-tagging and context metadata supported.',
  schema: bulkCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: issueInputProperties.projectId,
      issues: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            ...issueInputProperties,
            reference: {
              type: 'string',
              description: 'Optional reference or correlation identifier',
            },
          },
          required: ['title'],
        },
      },
    },
    required: ['issues'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = bulkCreateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
