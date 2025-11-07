#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { createHttpClient } from './httpClient.js';
import { registerTools } from './tools/index.js';

const logger = createLogger(config.logLevel);
const httpClient = createHttpClient(config, logger);

const server = new Server(
  {
    name: 'projectpulse-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

registerTools(server, { config, logger, httpClient });

const transport = new StdioServerTransport();

const shutdown = async (signal: string, code = 0) => {
  logger.warn(`Received ${signal}, shutting down MCP server`);
  await transport.close();
  process.exit(code);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

const main = async () => {
  logger.info('Starting ProjectPulse MCP server', { apiBaseUrl: config.apiBaseUrl });
  await server.connect(transport);
  logger.info('ProjectPulse MCP server ready (stdio transport)');
};

main().catch((error) => {
  logger.error('Fatal MCP server error', { error: error instanceof Error ? error.message : error });
  process.exit(1);
});

export { loadConfig } from './config.js';
