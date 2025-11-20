#!/usr/bin/env node
/**
 * Test: Stateless HTTP (no sessionIdGenerator)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { createHttpClient } from './httpClient.js';
import { registerTools } from './tools/index.js';

const logger = createLogger(config.logLevel);
const httpClient = createHttpClient(config, logger);

const server = new Server(
  {
    name: 'projectpulse-mcp',
    version: '0.1.0-stateless-test',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

registerTools(server, { config, logger, httpClient });

const app = express();
const PORT = 3002; // Different port for testing

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0-stateless-test',
    transport: 'http-stateless',
  });
});

// STATELESS pattern - no sessionIdGenerator
app.post('/mcp', async (req, res) => {
  logger.info('Handling STATELESS HTTP MCP request', {
    method: req.body?.method,
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // STATELESS
    enableJsonResponse: true,
    enableDnsRebindingProtection: false,
  });

  res.on('close', () => {
    transport.close();
    logger.debug('Stateless HTTP transport closed');
  });

  res.on('error', (error) => {
    logger.error('HTTP response error', { error: error.message });
    transport.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    logger.debug('Stateless HTTP request handled');
  } catch (error) {
    logger.error('Failed to handle stateless HTTP request', {
      error: error instanceof Error ? error.message : error,
    });

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: req.body?.id || null,
      });
    }
  }
});

app.listen(PORT, () => {
  logger.info('ProjectPulse MCP server started (STATELESS TEST)', {
    port: PORT,
    endpoint: `http://localhost:${PORT}/mcp`,
  });
});
