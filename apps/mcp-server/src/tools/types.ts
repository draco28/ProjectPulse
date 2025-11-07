import type { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AppConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { HttpClient } from '../httpClient.js';

export interface ToolContext {
  config: AppConfig;
  logger: Logger;
  httpClient: HttpClient;
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  inputSchema: Record<string, unknown>;
  execute: (params: unknown, context: ToolContext) => Promise<CallToolResult>;
}
