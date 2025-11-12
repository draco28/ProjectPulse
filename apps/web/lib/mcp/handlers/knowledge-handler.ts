/**
 * MCP Knowledge Tools Handler
 *
 * Sprint 5.5 - MCP Server Infrastructure (Day 2)
 * Created: 2025-11-13
 *
 * Provides MCP tool handlers for knowledge base operations:
 * - knowledge.search - Hybrid search across knowledge items
 * - knowledge.create - Create new knowledge items with embeddings
 * - knowledge.related - Find related items via graph traversal
 *
 * These handlers wrap the existing backend services and adapt them
 * for MCP tool invocation format (JSON-RPC 2.0).
 *
 * Architecture:
 * - Tool handlers are registered with MCP server
 * - Each handler validates input, calls backend service, formats output
 * - Errors are caught and converted to MCPError for JSON-RPC responses
 *
 * @see apps/web/app/api/knowledge/search/route.ts - Search API
 * @see apps/web/app/api/knowledge/route.ts - Create API
 * @see apps/web/lib/knowledge/graph.ts - Graph traversal
 */

import {
  hybridSearch,
  semanticSearch,
  fullTextSearch,
  SearchError,
} from '@/lib/knowledge/search';
import {
  createKnowledgeItem,
  KnowledgeCreationError,
} from '@/lib/knowledge/create';
import {
  findRelatedKnowledgeItems,
  GraphError,
  type GraphTraversalOptions,
} from '@/lib/knowledge/graph';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';

/**
 * Tool input schema for knowledge.search
 *
 * Matches searchKnowledgeSchema from lib/validations/knowledge.ts
 */
export interface KnowledgeSearchInput {
  query: string; // 1-1000 chars
  mode?: 'semantic' | 'fulltext' | 'hybrid'; // default: 'hybrid'
  limit?: number; // 1-50, default: 5
  category?: string; // optional category filter
}

/**
 * Tool output for knowledge.search
 */
export interface KnowledgeSearchOutput {
  results: Array<{
    id: number;
    title: string;
    excerpt: string; // First 200 chars of content
    category: string;
    tags: string[];
    score: number; // Relevance score 0-1
    matchType: 'semantic' | 'fulltext' | 'hybrid';
  }>;
  query: string;
  mode: string;
  count: number;
  duration: number; // ms
}

/**
 * Tool input schema for knowledge.create
 *
 * Matches createKnowledgeItemSchema from lib/validations/knowledge.ts
 */
export interface KnowledgeCreateInput {
  title: string; // 1-200 chars
  content: string; // 10-50000 chars
  category: string; // 1-50 chars
  tags?: string[]; // 0-20 items
}

/**
 * Tool output for knowledge.create
 */
export interface KnowledgeCreateOutput {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string; // ISO 8601
  embeddingProvider: string; // 'ollama' | 'openai'
  embeddingDuration: number; // ms
}

/**
 * Tool input schema for knowledge.related
 */
export interface KnowledgeRelatedInput {
  itemId: number; // Knowledge item ID
  maxDepth?: number; // 1 or 2 hops, default: 2
  limit?: number; // 1-50, default: 10
  minStrength?: number; // 0-1, default: 0.5
  relationshipTypes?: string[]; // Filter by types (optional)
}

/**
 * Tool output for knowledge.related
 */
export interface KnowledgeRelatedOutput {
  itemId: number;
  related: Array<{
    id: number;
    title: string;
    excerpt: string; // First 200 chars
    category: string;
    tags: string[];
    relationshipType: string;
    strength: number; // 0-1
    depth: number; // 1 or 2
  }>;
  count: number;
  maxDepth: number;
}

/**
 * MCP Tool Handler: knowledge.search
 *
 * Search knowledge base using hybrid (semantic + full-text) search.
 *
 * @param input - Search parameters
 * @returns Search results with scores
 * @throws MCPError on validation or execution errors
 *
 * @example
 * ```typescript
 * const results = await knowledgeSearchHandler({
 *   query: "PostgreSQL indexing",
 *   mode: "hybrid",
 *   limit: 5
 * });
 * ```
 */
export async function knowledgeSearchHandler(
  input: unknown
): Promise<KnowledgeSearchOutput> {
  const startTime = Date.now();

  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError(
        'Invalid input: expected object',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const params = input as KnowledgeSearchInput;

    // Validate required fields
    if (!params.query || typeof params.query !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: query (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (params.query.length < 1 || params.query.length > 1000) {
      throw new MCPError(
        'Invalid query length: must be 1-1000 characters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate optional fields
    const mode = params.mode || 'hybrid';
    if (!['semantic', 'fulltext', 'hybrid'].includes(mode)) {
      throw new MCPError(
        'Invalid mode: must be "semantic", "fulltext", or "hybrid"',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const limit = params.limit || 5;
    if (limit < 1 || limit > 50) {
      throw new MCPError(
        'Invalid limit: must be 1-50',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Execute search
    let results;
    switch (mode) {
      case 'semantic':
        results = await semanticSearch(params.query, {
          limit,
          category: params.category,
        });
        break;
      case 'fulltext':
        results = await fullTextSearch(params.query, {
          limit,
          category: params.category,
        });
        break;
      case 'hybrid':
      default:
        results = await hybridSearch(params.query, {
          limit,
          category: params.category,
        });
        break;
    }

    const duration = Date.now() - startTime;

    // Format results with excerpts
    const formattedResults = results.map((result) => ({
      id: result.id,
      title: result.title,
      excerpt:
        result.content.slice(0, 200) +
        (result.content.length > 200 ? '...' : ''),
      category: result.category,
      tags: result.tags,
      score: result.score,
      matchType: result.matchType,
    }));

    return {
      results: formattedResults,
      query: params.query,
      mode,
      count: results.length,
      duration,
    };
  } catch (error) {
    // Handle known search errors
    if (error instanceof SearchError) {
      throw new MCPError(
        error.message,
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        error.statusCode,
        { originalCode: error.code }
      );
    }

    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error('[knowledge.search] Unexpected error:', error);
    throw new MCPError(
      'Search failed: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * MCP Tool Handler: knowledge.create
 *
 * Create a new knowledge item with automatic embedding generation.
 *
 * @param input - Knowledge item data
 * @returns Created item with metadata
 * @throws MCPError on validation or creation errors
 *
 * @example
 * ```typescript
 * const item = await knowledgeCreateHandler({
 *   title: "PostgreSQL Indexing Best Practices",
 *   content: "...",
 *   category: "Database",
 *   tags: ["postgresql", "performance"]
 * });
 * ```
 */
export async function knowledgeCreateHandler(
  input: unknown
): Promise<KnowledgeCreateOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError(
        'Invalid input: expected object',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const params = input as KnowledgeCreateInput;

    // Validate required fields
    if (!params.title || typeof params.title !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: title (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (params.title.length < 1 || params.title.length > 200) {
      throw new MCPError(
        'Invalid title length: must be 1-200 characters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (!params.content || typeof params.content !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: content (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (params.content.length < 10 || params.content.length > 50000) {
      throw new MCPError(
        'Invalid content length: must be 10-50000 characters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (!params.category || typeof params.category !== 'string') {
      throw new MCPError(
        'Missing or invalid required field: category (string)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    if (params.category.length < 1 || params.category.length > 50) {
      throw new MCPError(
        'Invalid category length: must be 1-50 characters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate tags (optional)
    if (params.tags) {
      if (!Array.isArray(params.tags)) {
        throw new MCPError(
          'Invalid tags: must be array of strings',
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }

      if (params.tags.length > 20) {
        throw new MCPError(
          'Too many tags: maximum 20 allowed',
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }
    }

    // Create knowledge item
    const result = await createKnowledgeItem({
      title: params.title,
      content: params.content,
      category: params.category,
      tags: params.tags || [],
    });

    return {
      id: result.id,
      title: result.title,
      content: result.content,
      category: result.category,
      tags: result.tags,
      createdAt: result.createdAt.toISOString(),
      embeddingProvider: result.embeddingProvider,
      embeddingDuration: result.embeddingDuration,
    };
  } catch (error) {
    // Handle known creation errors
    if (error instanceof KnowledgeCreationError) {
      throw new MCPError(
        error.message,
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        error.statusCode,
        { originalCode: error.code }
      );
    }

    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error('[knowledge.create] Unexpected error:', error);
    throw new MCPError(
      'Creation failed: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * MCP Tool Handler: knowledge.related
 *
 * Find related knowledge items via graph traversal (1-2 hops).
 *
 * @param input - Graph traversal parameters
 * @returns Related items with relationship metadata
 * @throws MCPError on validation or traversal errors
 *
 * @example
 * ```typescript
 * const related = await knowledgeRelatedHandler({
 *   itemId: 42,
 *   maxDepth: 2,
 *   limit: 10,
 *   minStrength: 0.5
 * });
 * ```
 */
export async function knowledgeRelatedHandler(
  input: unknown
): Promise<KnowledgeRelatedOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError(
        'Invalid input: expected object',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const params = input as KnowledgeRelatedInput;

    // Validate required fields
    if (typeof params.itemId !== 'number') {
      throw new MCPError(
        'Missing or invalid required field: itemId (number)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate optional fields
    const maxDepth = params.maxDepth || 2;
    if (maxDepth < 1 || maxDepth > 2) {
      throw new MCPError(
        'Invalid maxDepth: must be 1 or 2',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const limit = params.limit || 10;
    if (limit < 1 || limit > 50) {
      throw new MCPError(
        'Invalid limit: must be 1-50',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const minStrength = params.minStrength || 0.5;
    if (minStrength < 0 || minStrength > 1) {
      throw new MCPError(
        'Invalid minStrength: must be 0-1',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Build traversal options
    const options: GraphTraversalOptions = {
      maxDepth,
      limit,
      minStrength,
      relationshipTypes: params.relationshipTypes,
      includePath: false, // Don't include paths in MCP response (too verbose)
    };

    // Execute graph traversal
    const results = await findRelatedKnowledgeItems(params.itemId, options);

    // Format results with excerpts
    const formattedResults = results.map((item) => ({
      id: item.id,
      title: item.title,
      excerpt:
        item.content.slice(0, 200) +
        (item.content.length > 200 ? '...' : ''),
      category: item.category,
      tags: item.tags,
      relationshipType: item.relationshipType,
      strength: item.strength,
      depth: item.depth,
    }));

    return {
      itemId: params.itemId,
      related: formattedResults,
      count: results.length,
      maxDepth,
    };
  } catch (error) {
    // Handle known graph errors
    if (error instanceof GraphError) {
      throw new MCPError(
        error.message,
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        error.statusCode,
        { originalCode: error.code }
      );
    }

    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error('[knowledge.related] Unexpected error:', error);
    throw new MCPError(
      'Graph traversal failed: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
