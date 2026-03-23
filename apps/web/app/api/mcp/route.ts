/**
 * MCP HTTP Route Handler
 *
 * Sprint 5.5 - MCP Server Infrastructure
 * Sprint 17 / Phase 1 - Authentication required (Ticket #129)
 * Created: 2025-11-12
 *
 * Handles JSON-RPC 2.0 requests for MCP (Model Context Protocol) tools via HTTP transport.
 * Enables AI coding agents (Claude Code, Cursor AI, Codex) to connect to ProjectPulse.
 *
 * Request flow:
 * 1. Client sends JSON-RPC request via POST /api/mcp with Authorization header
 * 2. Validate authentication (Bearer token or session)
 * 3. Extract/validate session ID from Mcp-Session-Id header
 * 4. Parse JSON-RPC 2.0 request body
 * 5. Execute tool/method via server
 * 6. Return JSON-RPC 2.0 response
 *
 * Architecture:
 * - HTTP Transport: Streamable HTTP (2025-03-26 spec)
 * - Session Management: UUID v4 with 1-hour TTL
 * - Server Pattern: Singleton MCPServer, per-request transport
 * - Security: Requires Bearer token or session authentication
 * - Target Users: Developers using AI coding agents on local network
 *
 * @see apps/web/.agent/task/sprint-5.5-mcp-server-plan.md
 * @see .agent/task/nextjs-mcp-http-route-20251112-1420.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPServer } from '@/lib/mcp/server';
import { validateSession, generateSessionId } from '@/lib/mcp/session-manager';
import { MCPError, JSONRPC_ERROR_CODES, isMCPError } from '@/lib/mcp/types';
import { getAuthContext } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import {
  knowledgeSearchHandler,
  knowledgeCreateHandler,
  knowledgeRelatedHandler,
  knowledgeGetMetricsHandler,
  knowledgeExportHandler,
  knowledgeImportHandler,
  knowledgeArchiveHandler,
} from '@/lib/mcp/handlers/knowledge-handler';
import {
  skillListHandler,
  skillLoadHandler,
  skillSearchHandler,
  skillUpdateHandler,
  skillDeleteHandler,
  skillExportHandler,
  skillImportHandler,
  skillLinkKnowledgeHandler,
} from '@/lib/mcp/handlers/skill-handler';
import {
  healthRunScanHandler,
  healthGetScoreHandler,
  healthGetHistoryHandler,
} from '@/lib/mcp/handlers/health-handler';
import {
  ticketCreateHandler,
  ticketBulkCreateHandler,
  ticketUpdateHandler,
  ticketSearchHandler,
  ticketAddCommentHandler,
  ticketSetStatusHandler,
  issueCreateHandler,
  issueBulkCreateHandler,
  issueUpdateHandler,
  issueSearchHandler,
  issueAddCommentHandler,
  issueSetStatusHandler,
} from '@/lib/mcp/handlers/ticket-handler';
import {
  listKnowledgeResources,
  readKnowledgeResource,
} from '@/lib/mcp/resources/knowledge-resource';

// =============================================================================
// CORS Configuration (Ticket #125 - Production Security)
// =============================================================================

/**
 * Parse ALLOWED_ORIGINS environment variable
 * Format: comma-separated list of full origins (e.g., "https://example.com,http://localhost:3000")
 */
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) || [];
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Check if the request origin is allowed for CORS (Ticket #125)
 *
 * Rules:
 * - Development mode: All origins allowed
 * - No Origin header (CLI tools): Always allowed (CORS is browser-only)
 * - Production with configured origins: Only matching origins allowed
 * - Production without configured origins: All browser requests denied (safe default)
 *
 * @param origin - The Origin header value (null if not present)
 * @returns true if the origin should be allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  // Development mode: allow all origins for local testing
  if (!IS_PRODUCTION) {
    return true;
  }

  // No Origin header (CLI tools like Claude Code, curl): always allow
  // CORS is a browser security mechanism, not applicable to CLI tools
  if (!origin) {
    return true;
  }

  // Production without configured origins: deny all browser requests (safe default)
  if (ALLOWED_ORIGINS.length === 0) {
    return false;
  }

  // Check against allowed list
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get CORS headers based on request origin (Ticket #125)
 *
 * Returns appropriate CORS headers or empty object if origin denied.
 * When origin is denied, browser will block the request (no headers = block).
 *
 * @param origin - The Origin header value (null if not present)
 * @returns Record of CORS headers or empty object
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!isOriginAllowed(origin)) {
    return {}; // No CORS headers = browser will block
  }

  // In production with specific origin: reflect that origin back (not '*')
  // In development or no origin: use '*' for convenience
  const allowOrigin = IS_PRODUCTION && origin ? origin : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Authorization',
    // CRITICAL: Expose session ID header for client access (Ticket #60)
    'Access-Control-Expose-Headers': 'Mcp-Session-Id, Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// =============================================================================
// Route Handlers
// =============================================================================

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
  const log = createRequestLogger(getRequestId(request));
  const startTime = Date.now();

  try {
    // Step 0: Authentication required (Sprint 17 / Ticket #129)
    const auth = await getAuthContext(request);
    if (auth.type === 'none') {
      log.warn('Authentication required - no valid token or session');
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000, // Server error
            message: 'Authentication required. Provide a Bearer token or valid session.',
          },
        },
        { status: 401 }
      );
    }

    log.info(
      { authType: auth.type, projectId: auth.type === 'agent' ? auth.projectId : undefined },
      'Authenticated'
    );

    // Step 1: Extract or generate session ID
    const sessionIdHeader = request.headers.get('Mcp-Session-Id');
    const sessionId = sessionIdHeader || generateSessionId();

    log.debug(
      { sessionId, isNew: !sessionIdHeader },
      sessionIdHeader ? 'Reusing session' : 'Creating session'
    );

    // Step 2: Validate session (create if new, check expiration if existing)
    await validateSession(sessionId);

    // Step 3: Parse JSON-RPC request
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      log.warn(
        { error: parseError instanceof Error ? parseError.message : String(parseError) },
        'JSON parse error'
      );

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
    if (!body || typeof body !== 'object' || !('jsonrpc' in body) || body.jsonrpc !== '2.0') {
      log.warn('Invalid JSON-RPC version');

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

    log.info({ method: jsonrpcRequest.method, id: jsonrpcRequest.id }, 'Processing MCP request');

    // Step 5: Get singleton MCP server (ensures initialization)
    getMCPServer();

    // Step 6: Route request based on method
    let result: unknown;

    if (jsonrpcRequest.method === 'tools/call') {
      // Tool invocation
      const { name, arguments: args } = (jsonrpcRequest.params || {}) as {
        name?: string;
        arguments?: unknown;
      };

      if (!name) {
        throw new MCPError('Missing tool name in params', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
      }

      // Route to appropriate tool handler
      // Helper to wrap result in MCP content format for tests
      const wrapMCPContent = (data: unknown) => ({
        content: [{ type: 'text', text: JSON.stringify(data) }],
      });

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
        case 'knowledge.export':
          result = await knowledgeExportHandler(args);
          break;
        case 'knowledge.import':
          result = await knowledgeImportHandler(args);
          break;
        case 'knowledge.archive':
          result = await knowledgeArchiveHandler(args);
          break;
        case 'skill.list':
          result = await skillListHandler(args);
          break;
        case 'skill.load':
          result = await skillLoadHandler(args);
          break;
        case 'skill.search':
          result = await skillSearchHandler(args);
          break;
        case 'skill.update':
          result = await skillUpdateHandler(args);
          break;
        case 'skill.delete':
          result = await skillDeleteHandler(args);
          break;
        case 'skill.export':
          result = await skillExportHandler(args);
          break;
        case 'skill.import':
          result = await skillImportHandler(args);
          break;
        case 'skill.linkKnowledge':
          result = await skillLinkKnowledgeHandler(args);
          break;
        case 'health.runScan':
          result = await healthRunScanHandler(args);
          break;
        case 'health.getScore':
          result = await healthGetScoreHandler(args);
          break;
        case 'health.getHistory':
          result = await healthGetHistoryHandler(args);
          break;
        // Ticket tools (Sprint 10) - both dot notation and projectpulse_ prefix
        case 'ticket.create':
        case 'projectpulse_ticket_create':
          result = wrapMCPContent(await ticketCreateHandler(args));
          break;
        case 'ticket.bulkCreate':
        case 'projectpulse_ticket_bulkCreate':
          result = wrapMCPContent(await ticketBulkCreateHandler(args));
          break;
        case 'ticket.update':
        case 'projectpulse_ticket_update':
          result = wrapMCPContent(await ticketUpdateHandler(args));
          break;
        case 'ticket.search':
        case 'projectpulse_ticket_search':
          result = wrapMCPContent(await ticketSearchHandler(args));
          break;
        case 'ticket.addComment':
        case 'projectpulse_ticket_addComment':
          result = wrapMCPContent(await ticketAddCommentHandler(args));
          break;
        case 'ticket.setStatus':
        case 'projectpulse_ticket_setStatus':
          result = wrapMCPContent(await ticketSetStatusHandler(args));
          break;
        // Issue compatibility tools (adapters) - both dot notation and projectpulse_ prefix
        case 'issue.create':
        case 'projectpulse_issue_create':
          result = wrapMCPContent(await issueCreateHandler(args));
          break;
        case 'issue.bulkCreate':
        case 'projectpulse_issue_bulkCreate':
          result = wrapMCPContent(await issueBulkCreateHandler(args));
          break;
        case 'issue.update':
        case 'projectpulse_issue_update':
          result = wrapMCPContent(await issueUpdateHandler(args));
          break;
        case 'issue.search':
        case 'projectpulse_issue_search':
          result = wrapMCPContent(await issueSearchHandler(args));
          break;
        case 'issue.addComment':
        case 'projectpulse_issue_addComment':
          result = wrapMCPContent(await issueAddCommentHandler(args));
          break;
        case 'issue.setStatus':
        case 'projectpulse_issue_setStatus':
          result = wrapMCPContent(await issueSetStatusHandler(args));
          break;
        default:
          throw new MCPError(`Unknown tool: ${name}`, JSONRPC_ERROR_CODES.METHOD_NOT_FOUND, 404, {
            availableTools: [
              'knowledge.search',
              'knowledge.create',
              'knowledge.related',
              'knowledge.getMetrics',
              'knowledge.export',
              'knowledge.import',
              'knowledge.archive',
              'skill.list',
              'skill.load',
              'skill.search',
              'skill.update',
              'skill.delete',
              'skill.export',
              'skill.import',
              'skill.linkKnowledge',
              'health.runScan',
              'health.getScore',
              'health.getHistory',
              'ticket.create',
              'ticket.bulkCreate',
              'ticket.update',
              'ticket.search',
              'ticket.addComment',
              'ticket.setStatus',
              'projectpulse_ticket_create',
              'projectpulse_ticket_bulkCreate',
              'projectpulse_ticket_update',
              'projectpulse_ticket_search',
              'projectpulse_ticket_addComment',
              'projectpulse_ticket_setStatus',
              'issue.create',
              'issue.bulkCreate',
              'issue.update',
              'issue.search',
              'issue.addComment',
              'issue.setStatus',
              'projectpulse_issue_create',
              'projectpulse_issue_bulkCreate',
              'projectpulse_issue_update',
              'projectpulse_issue_search',
              'projectpulse_issue_addComment',
              'projectpulse_issue_setStatus',
            ],
          });
      }
    } else if (jsonrpcRequest.method === 'tools/list') {
      // List available tools
      result = {
        tools: [
          {
            name: 'knowledge.search',
            description: 'Search knowledge base using hybrid (semantic + full-text) search',
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
            description:
              'Get query performance metrics summary (latency, query counts, mode distribution)',
            inputSchema: {
              type: 'object',
              properties: {
                days: { type: 'number', minimum: 1, maximum: 90, default: 7 },
              },
            },
          },
          {
            name: 'knowledge.export',
            description:
              'Export knowledge graph to JSON (items, relationships, optional embeddings)',
            inputSchema: {
              type: 'object',
              properties: {
                includeEmbeddings: { type: 'boolean', default: false },
                includeRelationships: { type: 'boolean', default: true },
                category: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                since: { type: 'string', description: 'ISO 8601 date' },
                limit: { type: 'number', minimum: 1, maximum: 10000 },
              },
            },
          },
          {
            name: 'knowledge.import',
            description:
              'Import knowledge items from markdown files with YAML frontmatter (batch up to 50)',
            inputSchema: {
              type: 'object',
              properties: {
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string' },
                      content: { type: 'string', description: 'Markdown with YAML frontmatter' },
                    },
                    required: ['filename', 'content'],
                  },
                  minItems: 1,
                  maxItems: 50,
                },
                generateEmbeddings: { type: 'boolean', default: true },
              },
              required: ['files'],
            },
          },
          {
            name: 'knowledge.archive',
            description: 'Archive or unarchive a knowledge item (soft delete/restore)',
            inputSchema: {
              type: 'object',
              properties: {
                itemId: { type: 'number' },
                unarchive: { type: 'boolean', default: false },
              },
              required: ['itemId'],
            },
          },
          {
            name: 'skill.list',
            description:
              'List skills with frontmatter only (excludes content for token efficiency)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                category: {
                  type: 'string',
                  enum: ['framework', 'testing', 'workflow', 'troubleshooting', 'custom'],
                },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
                frameworks: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                sortBy: {
                  type: 'string',
                  enum: ['title', 'usageCount', 'lastLoadedAt', 'createdAt', 'updatedAt'],
                  default: 'title',
                },
                sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
                page: { type: 'number', minimum: 1, default: 1 },
                limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'skill.load',
            description: 'Load full skill content on-demand (includes content field)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                slug: { type: 'string', minLength: 1, maxLength: 100 },
                incrementUsage: {
                  type: 'boolean',
                  default: true,
                  description: 'Track usage count',
                },
              },
              required: ['projectId', 'slug'],
            },
          },
          {
            name: 'skill.search',
            description: 'Search skills by keywords, tags, or frameworks (full-text search)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                query: { type: 'string', minLength: 1, maxLength: 200 },
                category: {
                  type: 'string',
                  enum: ['framework', 'testing', 'workflow', 'troubleshooting', 'custom'],
                },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
                frameworks: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
              },
              required: ['projectId', 'query'],
            },
          },
          {
            name: 'skill.update',
            description: 'Update skill content (partial update supported)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                slug: { type: 'string', minLength: 1, maxLength: 100 },
                updates: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', minLength: 1, maxLength: 200 },
                    content: { type: 'string', minLength: 10, maxLength: 50000 },
                    category: { type: 'string', minLength: 1, maxLength: 50 },
                    description: { type: 'string', maxLength: 500 },
                    tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
                    frameworks: { type: 'array', items: { type: 'string' }, maxItems: 10 },
                  },
                },
              },
              required: ['projectId', 'slug', 'updates'],
            },
          },
          {
            name: 'skill.delete',
            description: 'Delete skill permanently (cascades to skill-knowledge links)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                slug: { type: 'string', minLength: 1, maxLength: 100 },
              },
              required: ['projectId', 'slug'],
            },
          },
          {
            name: 'skill.export',
            description: 'Export skills to markdown ZIP archive (YAML frontmatter format)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                category: {
                  type: 'string',
                  enum: ['framework', 'testing', 'workflow', 'troubleshooting', 'custom'],
                },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
                frameworks: { type: 'array', items: { type: 'string' }, maxItems: 5 },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'skill.import',
            description: 'Import skills from markdown files with YAML frontmatter (batch up to 50)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string', description: 'Must end with .md' },
                      content: { type: 'string', description: 'Markdown with YAML frontmatter' },
                    },
                    required: ['filename', 'content'],
                  },
                  minItems: 1,
                  maxItems: 50,
                },
                overwriteExisting: { type: 'boolean', default: false },
              },
              required: ['projectId', 'files'],
            },
          },
          {
            name: 'skill.linkKnowledge',
            description: 'Link or unlink skill to/from knowledge item (many-to-many relationship)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
                skillSlug: { type: 'string', minLength: 1, maxLength: 100 },
                knowledgeItemId: { type: 'number' },
                action: { type: 'string', enum: ['link', 'unlink'], default: 'link' },
              },
              required: ['projectId', 'skillSlug', 'knowledgeItemId'],
            },
          },
          {
            name: 'health.runScan',
            description: 'Execute health scanners, store findings, and calculate health scores',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID to scan' },
                scannerTypes: {
                  type: 'array',
                  items: { type: 'string', enum: ['SEMGREP', 'ESLINT', 'AXECORE', 'LIGHTHOUSE'] },
                  minItems: 1,
                  description: 'Scanner types to execute (1+ required)',
                },
                projectPath: { type: 'string', description: 'Absolute path to project directory' },
                options: {
                  type: 'object',
                  properties: {
                    include: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'File patterns to include (glob)',
                    },
                    exclude: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'File patterns to exclude (glob)',
                    },
                  },
                },
              },
              required: ['projectId', 'scannerTypes', 'projectPath'],
            },
          },
          {
            name: 'health.getScore',
            description: 'Retrieve latest health scores with optional trend analysis',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID to get scores for' },
                limit: {
                  type: 'number',
                  minimum: 1,
                  maximum: 10,
                  default: 1,
                  description: 'Number of scores to return',
                },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'health.getHistory',
            description: 'Analyze historical health score trends with time-series data and metrics',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number', description: 'Project ID to analyze' },
                days: {
                  type: 'number',
                  minimum: 1,
                  maximum: 90,
                  default: 7,
                  description: 'Days of history to retrieve',
                },
                category: {
                  type: 'string',
                  enum: ['overall', 'security', 'quality', 'performance', 'accessibility'],
                  default: 'overall',
                  description: 'Category to analyze',
                },
              },
              required: ['projectId'],
            },
          },
          // Ticket tools (Sprint 10)
          {
            name: 'ticket.create',
            description:
              'Create a new ticket (feature, task, epic, issue, bug, tech_debt, scanner_finding)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'number',
                  description: 'Project ID (defaults to first project)',
                },
                title: { type: 'string', minLength: 1, maxLength: 200 },
                description: { type: 'string', maxLength: 50000 },
                kind: {
                  type: 'string',
                  enum: ['feature', 'task', 'epic', 'issue', 'bug', 'scanner_finding', 'tech_debt'],
                  default: 'issue',
                },
                source: {
                  type: 'string',
                  enum: ['manual', 'onboarding', 'scanner', 'agent'],
                  default: 'manual',
                },
                status: { type: 'string', default: 'open' },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  default: 'medium',
                },
                module: { type: 'string' },
                assignee: { type: 'string' },
                assigneeType: { type: 'string', enum: ['human', 'agent_persona'] },
                assigneeId: { type: 'number' },
                linkedTaskId: { type: 'string', description: 'UUID of sprint task to link' },
                labelIds: { type: 'array', items: { type: 'number' } },
              },
              required: ['title'],
            },
          },
          {
            name: 'ticket.bulkCreate',
            description: 'Bulk create tickets (up to 50)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                tickets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', minLength: 1, maxLength: 200 },
                      description: { type: 'string' },
                      kind: {
                        type: 'string',
                        enum: [
                          'feature',
                          'task',
                          'epic',
                          'issue',
                          'bug',
                          'scanner_finding',
                          'tech_debt',
                        ],
                      },
                      status: { type: 'string' },
                      priority: { type: 'string' },
                      module: { type: 'string' },
                      assignee: { type: 'string' },
                    },
                    required: ['title'],
                  },
                  minItems: 1,
                  maxItems: 50,
                },
              },
              required: ['tickets'],
            },
          },
          {
            name: 'ticket.update',
            description: 'Update ticket fields',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'number' },
                title: { type: 'string', minLength: 1, maxLength: 200 },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                module: { type: 'string' },
                assignee: { type: 'string' },
                assigneeType: { type: 'string', enum: ['human', 'agent_persona'] },
                assigneeId: { type: 'number' },
                linkedTaskId: { type: 'string' },
                labelIds: { type: 'array', items: { type: 'number' } },
              },
              required: ['ticketId'],
            },
          },
          {
            name: 'ticket.search',
            description: 'Search tickets with filters',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                search: { type: 'string', description: 'Text search in title/description' },
                kind: { type: 'array', items: { type: 'string' } },
                status: { type: 'array', items: { type: 'string' } },
                priority: { type: 'array', items: { type: 'string' } },
                module: { type: 'array', items: { type: 'string' } },
                assignee: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } },
                createdFrom: { type: 'string', description: 'ISO 8601 date' },
                createdTo: { type: 'string', description: 'ISO 8601 date' },
                page: { type: 'number', minimum: 1, default: 1 },
                pageSize: { type: 'number', minimum: 1, maximum: 100, default: 20 },
                sortBy: {
                  type: 'string',
                  enum: ['createdAt', 'updatedAt', 'priority'],
                  default: 'createdAt',
                },
                sortDirection: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
              },
            },
          },
          {
            name: 'ticket.addComment',
            description: 'Add comment to ticket',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'number' },
                content: { type: 'string', minLength: 1 },
                author: { type: 'string', default: 'Anonymous' },
              },
              required: ['ticketId', 'content'],
            },
          },
          {
            name: 'ticket.setStatus',
            description: 'Update ticket status (auto-sets closedAt for closed statuses)',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'number' },
                status: { type: 'string' },
              },
              required: ['ticketId', 'status'],
            },
          },
          // Issue compatibility tools (adapters - backwards compatible)
          {
            name: 'issue.create',
            description: 'Create issue (adapter for ticket.create with kind=issue)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                title: { type: 'string', minLength: 1, maxLength: 200 },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                module: { type: 'string' },
                assignee: { type: 'string' },
              },
              required: ['title'],
            },
          },
          {
            name: 'issue.bulkCreate',
            description: 'Bulk create issues (adapter for ticket.bulkCreate)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                issues: { type: 'array', items: { type: 'object' }, minItems: 1, maxItems: 50 },
              },
              required: ['issues'],
            },
          },
          {
            name: 'issue.update',
            description: 'Update issue (adapter for ticket.update)',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                module: { type: 'string' },
                assignee: { type: 'string' },
              },
              required: ['issueId'],
            },
          },
          {
            name: 'issue.search',
            description:
              'Search issues (adapter for ticket.search with kind=[issue,bug,scanner_finding])',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                search: { type: 'string' },
                status: { type: 'array', items: { type: 'string' } },
                priority: { type: 'array', items: { type: 'string' } },
                page: { type: 'number' },
                pageSize: { type: 'number' },
              },
            },
          },
          {
            name: 'issue.addComment',
            description: 'Add comment to issue (adapter for ticket.addComment)',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'number' },
                content: { type: 'string' },
                author: { type: 'string' },
              },
              required: ['issueId', 'content'],
            },
          },
          {
            name: 'issue.setStatus',
            description: 'Set issue status (adapter for ticket.setStatus)',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'number' },
                status: { type: 'string' },
              },
              required: ['issueId', 'status'],
            },
          },
          // projectpulse_ prefixed aliases (for MCP agent compatibility)
          {
            name: 'projectpulse_ticket_create',
            description:
              'Create a new ticket (feature, task, epic, issue, bug, tech_debt, scanner_finding)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'number',
                  description: 'Project ID (defaults to first project)',
                },
                title: { type: 'string', minLength: 1, maxLength: 200 },
                description: { type: 'string', maxLength: 50000 },
                kind: {
                  type: 'string',
                  enum: ['feature', 'task', 'epic', 'issue', 'bug', 'scanner_finding', 'tech_debt'],
                  default: 'issue',
                },
                source: {
                  type: 'string',
                  enum: ['manual', 'onboarding', 'scanner', 'agent'],
                  default: 'manual',
                },
                status: { type: 'string', default: 'open' },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  default: 'medium',
                },
                module: { type: 'string' },
                assignee: { type: 'string' },
              },
              required: ['title'],
            },
          },
          {
            name: 'projectpulse_ticket_bulkCreate',
            description: 'Bulk create tickets (up to 50)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                tickets: { type: 'array', items: { type: 'object' }, minItems: 1, maxItems: 50 },
              },
              required: ['tickets'],
            },
          },
          {
            name: 'projectpulse_ticket_update',
            description: 'Update ticket fields',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                module: { type: 'string' },
                assignee: { type: 'string' },
              },
              required: ['ticketId'],
            },
          },
          {
            name: 'projectpulse_ticket_search',
            description: 'Search tickets with filters',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                search: { type: 'string' },
                kind: { type: 'array', items: { type: 'string' } },
                status: { type: 'array', items: { type: 'string' } },
                priority: { type: 'array', items: { type: 'string' } },
                page: { type: 'number' },
                pageSize: { type: 'number' },
              },
            },
          },
          {
            name: 'projectpulse_ticket_addComment',
            description: 'Add comment to ticket',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'number' },
                content: { type: 'string' },
                author: { type: 'string' },
              },
              required: ['ticketId', 'content'],
            },
          },
          {
            name: 'projectpulse_ticket_setStatus',
            description: 'Update ticket status',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'number' },
                status: { type: 'string' },
              },
              required: ['ticketId', 'status'],
            },
          },
          {
            name: 'projectpulse_issue_create',
            description: 'Create issue (adapter for ticket.create with kind=issue)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                module: { type: 'string' },
                assignee: { type: 'string' },
              },
              required: ['title'],
            },
          },
          {
            name: 'projectpulse_issue_bulkCreate',
            description: 'Bulk create issues (adapter)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                issues: { type: 'array', items: { type: 'object' }, minItems: 1, maxItems: 50 },
              },
              required: ['issues'],
            },
          },
          {
            name: 'projectpulse_issue_update',
            description: 'Update issue (adapter)',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
              },
              required: ['issueId'],
            },
          },
          {
            name: 'projectpulse_issue_search',
            description: 'Search issues (adapter with kind=[issue,bug,scanner_finding])',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'number' },
                search: { type: 'string' },
                status: { type: 'array', items: { type: 'string' } },
                priority: { type: 'array', items: { type: 'string' } },
                page: { type: 'number' },
                pageSize: { type: 'number' },
              },
            },
          },
          {
            name: 'projectpulse_issue_addComment',
            description: 'Add comment to issue (adapter)',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'number' },
                content: { type: 'string' },
                author: { type: 'string' },
              },
              required: ['issueId', 'content'],
            },
          },
          {
            name: 'projectpulse_issue_setStatus',
            description: 'Set issue status (adapter)',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'number' },
                status: { type: 'string' },
              },
              required: ['issueId', 'status'],
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

    log.info({ durationMs: duration, sessionId }, 'MCP request completed');

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
    log.error(
      { error: error instanceof Error ? error.message : String(error), durationMs: duration },
      'MCP request failed'
    );

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
          message: error instanceof Error ? error.message : 'Internal server error',
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
  const log = createRequestLogger(getRequestId(request));
  log.debug('SSE streaming not yet implemented (Phase 2)');

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
 * Ticket #125: Restrict CORS to configured origins in production.
 * - Development: All origins allowed
 * - Production: Only ALLOWED_ORIGINS env var origins allowed
 * - No origin header (CLI tools): Always allowed
 */
export async function OPTIONS(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // If origin not allowed in production, return 403 Forbidden
  if (Object.keys(corsHeaders).length === 0) {
    log.warn({ origin }, 'CORS denied');
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
