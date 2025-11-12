#!/usr/bin/env node
/**
 * ProjectPulse MCP Server - Streamable HTTP Transport
 *
 * Production deployment endpoint for cloud-hosted MCP server
 * Replaces stdio transport with HTTP POST for remote client connections
 *
 * Specification: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamablehttp.js';
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
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

registerTools(server, { config, logger, httpClient });

const app = express();
const PORT = process.env.MCP_PORT || 3001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '0.1.0' });
});

// MCP Streamable HTTP endpoint
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    endpoint: '/mcp',
  });

  try {
    await server.connect(transport);

    // Handle the streamable HTTP request/response
    await transport.handleRequest(req, res);
  } catch (error) {
    logger.error('MCP request failed', {
      error: error instanceof Error ? error.message : error
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'MCP request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// OAuth/API key validation middleware (add before /mcp endpoint in production)
app.use('/mcp', (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // TODO: Validate API key against database
  // const isValid = await validateApiKey(apiKey);
  // if (!isValid) return res.status(403).json({ error: 'Invalid API key' });

  next();
});

app.listen(PORT, () => {
  logger.info('ProjectPulse MCP server (Streamable HTTP) listening', {
    port: PORT,
    endpoint: `http://localhost:${PORT}/mcp`,
    apiBaseUrl: config.apiBaseUrl
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal}, shutting down HTTP MCP server`);
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
