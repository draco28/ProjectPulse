import { z } from 'zod';
import type { ToolDefinition } from './types.js';

const inputSchema = z.object({
  verbose: z.boolean().optional().default(false),
});

type HealthCheckInput = z.infer<typeof inputSchema>;

type HealthResponse = {
  status: string;
  timestamp: string;
};

export const healthCheckTool: ToolDefinition = {
  name: 'projectpulse_health_check',
  description: 'Ping the ProjectPulse Next.js API /api/health endpoint to verify connectivity.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      verbose: {
        type: 'boolean',
        description: 'Include the raw API payload in the response.',
      },
    },
  },
  execute: async (params, context) => {
    const { verbose } = params as HealthCheckInput;
    const data = await context.httpClient.get<HealthResponse>('/api/health');
    const summary = `Status: ${data.status} • Timestamp: ${data.timestamp}`;
    const body = verbose ? `${summary}\n\nPayload:\n${JSON.stringify(data, null, 2)}` : summary;

    context.logger.info('Health check completed', {
      status: data.status,
      timestamp: data.timestamp,
    });

    return {
      content: [
        {
          type: 'text',
          text: body,
        },
      ],
    };
  },
};
