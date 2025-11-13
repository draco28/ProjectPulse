/**
 * MCP HTTP Route Handler
 *
 * Sprint 5.5 - MCP Server Infrastructure
 * Created: 2025-11-12
 *
 * Handles JSON-RPC 2.0 requests for MCP (Model Context Protocol) tools via HTTP transport.
 * Enables AI coding agents (Claude Code, Cursor AI, Codex) to connect to ProjectPulse.
 *
 * Request flow:
 * 1. Client sends JSON-RPC request via POST /api/mcp
 * 2. Extract/validate session ID from Mcp-Session-Id header
 * 3. Parse JSON-RPC 2.0 request body
 * 4. Create StreamableHTTPServerTransport for this request
 * 5. Connect transport to singleton MCP server
 * 6. Execute tool/method via server
 * 7. Return JSON-RPC 2.0 response
 *
 * Architecture:
 * - HTTP Transport: Streamable HTTP (2025-03-26 spec)
 * - Session Management: UUID v4 with 1-hour TTL
 * - Server Pattern: Singleton MCPServer, per-request transport
 * - Target Users: Developers using AI coding agents on local network
 *
 * @see apps/web/.agent/task/sprint-5.5-mcp-server-plan.md
 * @see .agent/task/nextjs-mcp-http-route-20251112-1420.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPServer } from '@/lib/mcp/server';
import {
  validateSession,
  generateSessionId,
} from '@/lib/mcp/session-manager';
import { MCPError, JSONRPC_ERROR_CODES, isMCPError } from '@/lib/mcp/types';
import {
  knowledgeSearchHandler,
  knowledgeCreateHandler,
  knowledgeRelatedHandler,
  knowledgeGetMetricsHandler,
} from '@/lib/mcp/handlers/knowledge-handler';
import {
  listKnowledgeResources,
  readKnowledgeResource,
} from '@/lib/mcp/resources/knowledge-resource';

/**
 * POST /api/mcp
 *
 * Handle JSON-RPC 2.0 requests for MCP tools.
 *
 * Headers:
 * - Mcp-Session-Id: UUID v4 session identifier (optional on first request)
 * - Content-Type: application/json
 *
 * Request body (JSON-RPC 2.0):
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "method": "tools/call",
 *   "params": {
 *     "name": "knowledge.search",
 *     "arguments": { "query": "PostgreSQL indexing" }
 *   }
 * }
 *
 * Response (JSON-RPC 2.0 success):
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "result": { "results": [...], "count": 5 }
 * }
 *
 * Response (JSON-RPC 2.0 error):
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "error": {
 *     "code": -32601,
 *     "message": "Method not found",
 *     "data": { ... }
 *   }
 * }
 *
 * @param request - Next.js request object
 * @returns JSON-RPC 2.0 response
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Step 1: Extract or generate session ID
    const sessionIdHeader = request.headers.get('Mcp-Session-Id');
    const sessionId = sessionIdHeader || generateSessionId();

    console.log(
      `[POST /api/mcp] ${sessionIdHeader ? 'Reusing' : 'Creating'} session: ${sessionId}`
    );

    // Step 2: Validate session (create if new, check expiration if existing)
    const session = await validateSession(sessionId);

    // Step 3: Parse JSON-RPC request
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[POST /api/mcp] JSON parse error:', parseError);

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: JSONRPC_ERROR_CODES.PARSE_ERROR,
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Step 4: Validate JSON-RPC 2.0 format
    if (
      !body ||
      typeof body !== 'object' ||
      !('jsonrpc' in body) ||
      body.jsonrpc !== '2.0'
    ) {
      console.warn('[POST /api/mcp] Invalid JSON-RPC version:', body);

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: (body as { id?: unknown })?.id || null,
          error: {
            code: JSONRPC_ERROR_CODES.INVALID_REQUEST,
            message: 'Invalid JSON-RPC request (must have jsonrpc: "2.0")',
          },
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!('method' in body) || typeof body.method !== 'string') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: (body as { id?: unknown })?.id || null,
          error: {
            code: JSONRPC_ERROR_CODES.INVALID_REQUEST,
            message: 'Invalid JSON-RPC request (missing or invalid "method")',
          },
        },
        { status: 400 }
      );
    }

    // Extract request components
    const jsonrpcRequest = body as {
      jsonrpc: '2.0';
      id: string | number | null;
      method: string;
      params?: Record<string, unknown>;
    };

    console.log(
      `[POST /api/mcp] Method: ${jsonrpcRequest.method}, ID: ${jsonrpcRequest.id}`
    );

    // Step 5: Get singleton MCP server
    const mcpServer = getMCPServer();

    // Step 6: Route request based on method
    let result: unknown;

    if (jsonrpcRequest.method === 'tools/call') {
      // Tool invocation
      const { name, arguments: args } = (jsonrpcRequest.params || {}) as {
        name?: string;
        arguments?: unknown;
      };

      if (!name) {
        throw new MCPError(
          'Missing tool name in params',
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }

      // Route to appropriate tool handler
      switch (name) {
        case 'knowledge.search':
          result = await knowledgeSearchHandler(args);
          break;
        case 'knowledge.create':
          result = await knowledgeCreateHandler(args);
          break;
        case 'knowledge.related':
          result = await knowledgeRelatedHandler(args);
          break;
        case 'knowledge.getMetrics':
          result = await knowledgeGetMetricsHandler(args);
          break;
        default:
          throw new MCPError(
            `Unknown tool: ${name}`,
            JSONRPC_ERROR_CODES.METHOD_NOT_FOUND,
            404,
            { availableTools: ['knowledge.search', 'knowledge.create', 'knowledge.related', 'knowledge.getMetrics'] }
          );
      }
    } else if (jsonrpcRequest.method === 'tools/list') {
      // List available tools
      result = {
        tools: [
          {
            name: 'knowledge.search',
            description:
              'Search knowledge base using hybrid (semantic + full-text) search',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query (1-1000 chars)' },
                mode: {
                  type: 'string',
                  enum: ['semantic', 'fulltext', 'hybrid'],
                  default: 'hybrid',
                },
                limit: { type: 'number', minimum: 1, maximum: 50, default: 5 },
                category: { type: 'string' },
              },
              required: ['query'],
            },
          },
          {
            name: 'knowledge.create',
            description: 'Create knowledge item with automatic embeddings',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
                content: { type: 'string', minLength: 10, maxLength: 50000 },
                category: { type: 'string', minLength: 1, maxLength: 50 },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
              },
              required: ['title', 'content', 'category'],
            },
          },
          {
            name: 'knowledge.related',
            description: 'Find related items via graph traversal (1-2 hops)',
            inputSchema: {
              type: 'object',
              properties: {
                itemId: { type: 'number' },
                maxDepth: { type: 'number', enum: [1, 2], default: 2 },
                limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
                minStrength: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
              },
              required: ['itemId'],
            },
          },
          {
            name: 'knowledge.getMetrics',
            description: 'Get query performance metrics summary (latency, query counts, mode distribution)',
            inputSchema: {
              type: 'object',
              properties: {
                days: { type: 'number', minimum: 1, maximum: 90, default: 7 },
              },
            },
          },
        ],
      };
    } else if (jsonrpcRequest.method === 'resources/list') {
      // List available resources
      result = await listKnowledgeResources();
    } else if (jsonrpcRequest.method === 'resources/read') {
      // Read specific resource
      const { uri } = (jsonrpcRequest.params || {}) as { uri?: string };

      if (!uri) {
        throw new MCPError(
          'Missing resource URI in params',
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }

      result = await readKnowledgeResource(uri);
    } else {
      throw new MCPError(
        `Unsupported method: ${jsonrpcRequest.method}`,
        JSONRPC_ERROR_CODES.METHOD_NOT_FOUND,
        404,
        { supportedMethods: ['tools/list', 'tools/call', 'resources/list', 'resources/read'] }
      );
    }

    const response = {
      jsonrpc: '2.0' as const,
      id: jsonrpcRequest.id,
      result,
    };

    // Step 7: Return JSON-RPC response
    const duration = Date.now() - startTime;

    console.log(
      `[POST /api/mcp] Success (${duration}ms) - Session: ${sessionId}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Mcp-Session-Id': sessionId,
        'X-Response-Time': `${duration}ms`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[POST /api/mcp] Error (${duration}ms):`, error);

    // Handle MCP-specific errors
    if (isMCPError(error)) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: error.code,
            message: error.message,
            data: error.data,
          },
        },
        { status: error.statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: JSONRPC_ERROR_CODES.INTERNAL_ERROR,
          message:
            error instanceof Error ? error.message : 'Internal server error',
          data:
            process.env.NODE_ENV === 'development'
              ? { stack: error instanceof Error ? error.stack : undefined }
              : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp (Phase 2 - SSE streaming)
 *
 * Server-Sent Events endpoint for MCP notifications and progress updates.
 * Used for long-running operations (embeddings, bulk operations).
 *
 * Headers:
 * - Mcp-Session-Id: Required - session identifier
 *
 * Response: text/event-stream
 *
 * Note: Defer to Phase 2 (not needed for Sprint 5.5 MVP)
 */
export async function GET(request: NextRequest) {
  console.log('[GET /api/mcp] SSE streaming not yet implemented (Phase 2)');

  return NextResponse.json(
    {
      error: 'SSE streaming not yet implemented',
      message: 'Use POST /api/mcp for JSON-RPC requests',
      session: request.headers.get('Mcp-Session-Id'),
      phase: 'Phase 2 - planned for future sprint',
    },
    { status: 501 } // Not Implemented
  );
}

/**
 * OPTIONS /api/mcp (CORS preflight)
 *
 * Handle CORS preflight requests for cross-origin MCP clients.
 *
 * Note: For MVP on local network (192.168.1.15), CORS is permissive.
 * For cloud deployment, restrict to specific origins.
 */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // MVP: Allow all origins on local network
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Mcp-Session-Id, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
