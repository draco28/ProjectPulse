#!/usr/bin/env node
/**
 * ProjectPulse MCP Server - SSE Transport
 *
 * Production deployment endpoint for cloud-hosted MCP server.
 * Implements MCP SSE (Server-Sent Events) transport specification.
 * Compatible with Claude Code's SSE MCP client.
 *
 * Specification: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { createHttpClient } from './httpClient.js';
import { registerTools } from './tools/index.js';

const logger = createLogger(config.logLevel);
const httpClient = createHttpClient(config, logger);

// Create MCP Server instance (shared across all connections)
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

// Register all tools ONCE (shared across all HTTP sessions)
registerTools(server, { config, logger, httpClient });

// Session management: Map of session ID -> transport
const sessions = new Map<string, SSEServerTransport>();

// Create Express app
const app = express();
const PORT = config.mcpPort;

// Middleware: Parse JSON bodies (CRITICAL - must be before routes)
app.use(express.json());

// Health check endpoint (for Docker health checks)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    transport: 'sse',
    toolCount: 35,
    activeSessions: sessions.size,
  });
});

// MCP SSE endpoint - GET establishes SSE stream
app.get('/mcp', async (_req, res) => {
  logger.info('SSE connection established');

  // Create transport with POST endpoint for client messages
  const transport = new SSEServerTransport('/mcp', res, {
    // DNS rebinding protection (optional)
    enableDnsRebindingProtection: false,
  });

  try {
    // Connect server to this transport (connect() automatically calls start())
    await server.connect(transport);

    // Store session for POST message routing
    sessions.set(transport.sessionId, transport);
    logger.info('MCP SSE session started', {
      sessionId: transport.sessionId,
      totalSessions: sessions.size
    });

    // Clean up on close
    transport.onclose = () => {
      sessions.delete(transport.sessionId);
      logger.info('MCP SSE session closed', {
        sessionId: transport.sessionId,
        remainingSessions: sessions.size
      });
    };

    transport.onerror = (error) => {
      logger.error('MCP SSE transport error', {
        sessionId: transport.sessionId,
        error: error.message
      });
      sessions.delete(transport.sessionId);
    };

  } catch (error) {
    logger.error('Failed to start SSE session', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to start SSE session',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// MCP SSE endpoint - POST receives client messages
// The SSE client sends the session ID as a query parameter (?sessionId=xxx)
app.post('/mcp', async (req, res) => {
  try {
    // Extract session ID from URL query parameter (sent by SSE client)
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      logger.warn('POST message missing session ID', {
        query: req.query,
        url: req.url
      });
      return res.status(400).json({ error: 'Missing sessionId query parameter' });
    }

    // Find the transport for this session
    const transport = sessions.get(sessionId);

    if (!transport) {
      logger.warn('POST message for unknown session', { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }

    // Handle the message
    await transport.handlePostMessage(req, res, req.body);

  } catch (error) {
    logger.error('Failed to handle POST message', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to handle message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  logger.info('ProjectPulse MCP server started (SSE)', {
    port: PORT,
    endpoint: `http://localhost:${PORT}/mcp`,
    healthCheck: `http://localhost:${PORT}/health`,
    apiBaseUrl: config.apiBaseUrl,
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal}, shutting down HTTP MCP server`);
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
