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

import { hybridSearch, semanticSearch, fullTextSearch, SearchError } from '@/lib/knowledge/search';
import { createKnowledgeItem, KnowledgeCreationError } from '@/lib/knowledge/create';
import {
  findRelatedKnowledgeItems,
  GraphError,
  type GraphTraversalOptions,
} from '@/lib/knowledge/graph';
import { getMetricsSummary } from '@/lib/knowledge/metrics';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import matter from 'gray-matter';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'MCP:KnowledgeHandler' });

/**
 * Tool input schema for knowledge.search
 *
 * Matches searchKnowledgeSchema from lib/validations/knowledge.ts
 */
export interface KnowledgeSearchInput {
  projectId: number; // required for multi-tenancy
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
  projectId: number; // required for multi-tenancy
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
  projectId: number; // required for multi-tenancy
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
export async function knowledgeSearchHandler(input: unknown): Promise<KnowledgeSearchOutput> {
  const startTime = Date.now();

  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
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
      throw new MCPError('Invalid limit: must be 1-50', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    // Validate projectId
    const projectId = params.projectId;
    if (!projectId || typeof projectId !== 'number' || projectId < 1) {
      throw new MCPError(
        'Missing or invalid required field: projectId (positive integer)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Execute search
    const searchOptions = { projectId, limit, category: params.category };
    let results;
    switch (mode) {
      case 'semantic':
        results = await semanticSearch(params.query, searchOptions);
        break;
      case 'fulltext':
        results = await fullTextSearch(params.query, searchOptions);
        break;
      case 'hybrid':
      default:
        results = await hybridSearch(params.query, searchOptions);
        break;
    }

    const duration = Date.now() - startTime;

    // Format results with excerpts
    const formattedResults = results.map((result) => ({
      id: result.id,
      title: result.title,
      excerpt: result.content.slice(0, 200) + (result.content.length > 200 ? '...' : ''),
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
      throw new MCPError(error.message, JSONRPC_ERROR_CODES.INTERNAL_ERROR, error.statusCode, {
        originalCode: error.code,
      });
    }

    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.search');
    throw new MCPError(
      'Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
export async function knowledgeCreateHandler(input: unknown): Promise<KnowledgeCreateOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as KnowledgeCreateInput;

    // Validate projectId
    if (!params.projectId || typeof params.projectId !== 'number' || params.projectId < 1) {
      throw new MCPError(
        'Missing or invalid required field: projectId (positive integer)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

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
      projectId: params.projectId,
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
      throw new MCPError(error.message, JSONRPC_ERROR_CODES.INTERNAL_ERROR, error.statusCode, {
        originalCode: error.code,
      });
    }

    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.create');
    throw new MCPError(
      'Creation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
export async function knowledgeRelatedHandler(input: unknown): Promise<KnowledgeRelatedOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as KnowledgeRelatedInput;

    // Validate projectId
    if (!params.projectId || typeof params.projectId !== 'number' || params.projectId < 1) {
      throw new MCPError(
        'Missing or invalid required field: projectId (positive integer)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

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
      throw new MCPError('Invalid limit: must be 1-50', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
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
      projectId: params.projectId,
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
      excerpt: item.content.slice(0, 200) + (item.content.length > 200 ? '...' : ''),
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
      throw new MCPError(error.message, JSONRPC_ERROR_CODES.INTERNAL_ERROR, error.statusCode, {
        originalCode: error.code,
      });
    }

    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.related');
    throw new MCPError(
      'Graph traversal failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Tool input schema for knowledge.export
 */
export interface KnowledgeExportInput {
  includeEmbeddings?: boolean; // default: false
  includeRelationships?: boolean; // default: true
  category?: string;
  tags?: string[]; // Array of tags to filter by
  since?: string; // ISO 8601 date
  limit?: number; // 1-10000
}

/**
 * Exported knowledge item format
 */
interface KnowledgeExportItem {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  embedding?: number[];
}

/**
 * Exported relationship format (matches Prisma select output)
 */
interface KnowledgeRelationshipExport {
  id: number;
  fromId: number;
  toId: number;
  relationType: string;
  weight: Prisma.Decimal;
  createdAt: Date;
}

/**
 * Tool output for knowledge.export
 */
export interface KnowledgeExportOutput {
  metadata: {
    exportedAt: string;
    version: string;
    itemCount: number;
    relationshipCount: number;
    includesEmbeddings: boolean;
    includesRelationships: boolean;
    filters: {
      category: string | null;
      tags: string | null;
      since: string | null;
    };
  };
  items: KnowledgeExportItem[];
  relationships: KnowledgeRelationshipExport[];
}

/**
 * Tool input schema for knowledge.import
 */
export interface KnowledgeImportInput {
  projectId: number;
  files: Array<{
    filename: string;
    content: string; // Markdown with YAML frontmatter
  }>;
  generateEmbeddings?: boolean; // default: true
}

/**
 * Tool output for knowledge.import
 */
export interface KnowledgeImportOutput {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  imported?: Array<{
    index: number;
    filename: string;
    id: number;
    title: string;
    category: string;
    tags: string[];
    embeddingProvider: string;
    embeddingDuration: number;
  }>;
  errors?: Array<{
    index: number;
    filename: string;
    error: string;
    details: string;
    code?: string;
  }>;
}

/**
 * Tool input schema for knowledge.archive
 */
export interface KnowledgeArchiveInput {
  itemId: number;
  unarchive?: boolean; // true = unarchive, false/undefined = archive
}

/**
 * Tool output for knowledge.archive
 */
export interface KnowledgeArchiveOutput {
  id: number;
  title: string;
  category: string;
  archivedAt: string | null;
  action: 'archived' | 'unarchived';
}

/**
 * Tool input schema for knowledge.getMetrics
 */
export interface KnowledgeGetMetricsInput {
  days?: number; // 1-90, default: 7
}

/**
 * Tool output for knowledge.getMetrics
 */
export interface KnowledgeGetMetricsOutput {
  period: {
    days: number;
    since: Date;
  };
  totalQueries: number;
  avgLatencyMs: number;
  latencyP95: {
    semantic: number | null;
    fulltext: number | null;
    hybrid: number | null;
  };
  modeDistribution: Record<string, number>;
}

/**
 * MCP Tool Handler: knowledge.getMetrics
 *
 * Get query performance metrics summary for the knowledge base.
 * Returns latency percentiles, query counts, and mode distribution.
 *
 * US-086: Measure query performance
 *
 * @param input - Metrics query parameters
 * @returns Metrics summary
 * @throws MCPError on validation or query errors
 *
 * @example
 * ```typescript
 * // Get last 7 days metrics
 * const metrics = await knowledgeGetMetricsHandler({});
 *
 * // Get last 30 days metrics
 * const metrics = await knowledgeGetMetricsHandler({ days: 30 });
 * ```
 */
export async function knowledgeGetMetricsHandler(
  input: unknown
): Promise<KnowledgeGetMetricsOutput> {
  try {
    // Validate input (optional parameter)
    const params = (input || {}) as KnowledgeGetMetricsInput;

    // Validate days parameter if provided
    const days = params.days || 7;
    if (typeof days !== 'number' || days < 1 || days > 90) {
      throw new MCPError(
        'Invalid days parameter: must be number between 1 and 90',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Get metrics summary
    const summary = await getMetricsSummary(days);

    return summary;
  } catch (error) {
    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.getMetrics');
    throw new MCPError(
      'Failed to retrieve metrics: ' + (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * MCP Tool Handler: knowledge.export
 *
 * Export knowledge graph to JSON format with optional filtering.
 * Includes items, relationships, and optionally embeddings.
 *
 * US-087: Export knowledge graph
 *
 * @param input - Export filter parameters
 * @returns Export data with metadata
 * @throws MCPError on validation or export errors
 *
 * @example
 * ```typescript
 * // Export all items without embeddings
 * const data = await knowledgeExportHandler({});
 *
 * // Export with embeddings and specific category
 * const data = await knowledgeExportHandler({
 *   includeEmbeddings: true,
 *   category: "DevOps",
 *   limit: 100
 * });
 * ```
 */
export async function knowledgeExportHandler(input: unknown): Promise<KnowledgeExportOutput> {
  try {
    // Validate input (all parameters optional)
    const params = (input || {}) as KnowledgeExportInput;

    // Validate limit if provided
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 10000) {
        throw new MCPError(
          'Invalid limit parameter: must be number between 1 and 10000',
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }
    }

    // Validate since date if provided
    if (params.since !== undefined) {
      const since = new Date(params.since);
      if (isNaN(since.getTime())) {
        throw new MCPError(
          'Invalid since parameter: must be valid ISO 8601 date',
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400
        );
      }
    }

    // Build where clause
    const where: Prisma.KnowledgeItemWhereInput = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.tags && params.tags.length > 0) {
      where.tags = { hasSome: params.tags };
    }

    if (params.since) {
      where.createdAt = { gte: new Date(params.since) };
    }

    // Fetch knowledge items
    const items = await prisma.knowledgeItem.findMany({
      where,
      take: params.limit,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
        // Conditionally include embeddings
        ...(params.includeEmbeddings && { embedding: true }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch relationships if requested (default true)
    const includeRelationships = params.includeRelationships !== false;
    let relationships: KnowledgeRelationshipExport[] = [];

    if (includeRelationships && items.length > 0) {
      const itemIds = items.map((item) => item.id);
      relationships = await prisma.knowledgeRelationship.findMany({
        where: {
          OR: [{ fromId: { in: itemIds } }, { toId: { in: itemIds } }],
        },
        select: {
          id: true,
          fromId: true,
          toId: true,
          relationType: true,
          weight: true,
          createdAt: true,
        },
      });
    }

    // Format items for export
    const formattedItems = items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      archivedAt: item.archivedAt?.toISOString() || null,
      // Convert embedding buffer to array if included
      ...(params.includeEmbeddings && item.embedding
        ? {
            embedding: Array.from(item.embedding as unknown as ArrayLike<number>),
          }
        : {}),
    }));

    // Build export output
    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        itemCount: items.length,
        relationshipCount: relationships.length,
        includesEmbeddings: params.includeEmbeddings || false,
        includesRelationships: includeRelationships,
        filters: {
          category: params.category || null,
          tags: params.tags ? params.tags.join(',') : null,
          since: params.since || null,
        },
      },
      items: formattedItems,
      relationships,
    };
  } catch (error) {
    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.export');
    throw new MCPError(
      'Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * MCP Tool Handler: knowledge.import
 *
 * Import knowledge items from markdown files with YAML frontmatter.
 * Supports batch import (up to 50 files) with automatic embedding generation.
 *
 * US-088: Import knowledge from markdown
 *
 * @param input - Import parameters with file array
 * @returns Import summary with successes and errors
 * @throws MCPError on validation errors
 *
 * @example
 * ```typescript
 * const result = await knowledgeImportHandler({
 *   files: [
 *     {
 *       filename: "docker-setup.md",
 *       content: "---\ntitle: Docker Setup\ncategory: DevOps\ntags: [docker]\n---\n# Content..."
 *     }
 *   ]
 * });
 * ```
 */
export async function knowledgeImportHandler(input: unknown): Promise<KnowledgeImportOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as KnowledgeImportInput;

    // Validate projectId
    if (typeof params.projectId !== 'number' || params.projectId <= 0) {
      throw new MCPError(
        'Invalid or missing projectId: must be positive integer',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Validate files array
    if (!Array.isArray(params.files) || params.files.length === 0) {
      throw new MCPError(
        'Invalid or missing files parameter: must be non-empty array',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Check batch size limit
    if (params.files.length > 50) {
      throw new MCPError(
        'Too many files: maximum 50 per batch import',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        413
      );
    }

    // Process each file
    const results: NonNullable<KnowledgeImportOutput['imported']> = [];
    const errors: NonNullable<KnowledgeImportOutput['errors']> = [];

    for (let i = 0; i < params.files.length; i++) {
      const file = params.files[i] as { filename?: string; content?: string } | undefined;

      try {
        // Validate file structure
        if (!file || typeof file !== 'object') {
          errors.push({
            index: i,
            filename: `file_${i}`,
            error: 'Invalid file object',
            details: 'Each file must have filename and content',
          });
          continue;
        }

        const { filename, content } = file;

        if (!filename || typeof filename !== 'string') {
          errors.push({
            index: i,
            filename: filename || `file_${i}`,
            error: 'Invalid filename',
            details: 'filename must be non-empty string',
          });
          continue;
        }

        if (!content || typeof content !== 'string') {
          errors.push({
            index: i,
            filename,
            error: 'Invalid content',
            details: 'content must be non-empty string',
          });
          continue;
        }

        // Parse frontmatter with gray-matter
        let parsed;
        try {
          parsed = matter(content);
        } catch (parseError) {
          errors.push({
            index: i,
            filename,
            error: 'Frontmatter parsing failed',
            details: parseError instanceof Error ? parseError.message : 'Invalid YAML format',
          });
          continue;
        }

        const { data: frontmatter, content: markdownContent } = parsed;

        // Validate required frontmatter fields
        if (!frontmatter.title || typeof frontmatter.title !== 'string') {
          errors.push({
            index: i,
            filename,
            error: 'Missing or invalid title in frontmatter',
            details: 'title must be non-empty string',
          });
          continue;
        }

        if (!frontmatter.category || typeof frontmatter.category !== 'string') {
          errors.push({
            index: i,
            filename,
            error: 'Missing or invalid category in frontmatter',
            details: 'category must be non-empty string',
          });
          continue;
        }

        // Validate tags (optional, but must be array if present)
        const tags = frontmatter.tags || [];
        if (!Array.isArray(tags)) {
          errors.push({
            index: i,
            filename,
            error: 'Invalid tags in frontmatter',
            details: 'tags must be array of strings',
          });
          continue;
        }

        // Validate tag items are strings
        if (tags.some((tag: unknown) => typeof tag !== 'string')) {
          errors.push({
            index: i,
            filename,
            error: 'Invalid tags in frontmatter',
            details: 'All tags must be strings',
          });
          continue;
        }

        // Create knowledge item with auto-embedding
        const result = await createKnowledgeItem({
          projectId: params.projectId,
          title: frontmatter.title,
          content: markdownContent.trim(),
          category: frontmatter.category,
          tags,
        });

        results.push({
          index: i,
          filename,
          id: result.id,
          title: result.title,
          category: result.category,
          tags: result.tags,
          embeddingProvider: result.embeddingProvider,
          embeddingDuration: result.embeddingDuration,
        });
      } catch (error) {
        // Handle creation errors
        if (error instanceof KnowledgeCreationError) {
          errors.push({
            index: i,
            filename: file?.filename || `file_${i}`,
            error: 'Creation failed',
            details: error.message,
            code: error.code,
          });
        } else {
          errors.push({
            index: i,
            filename: file?.filename || `file_${i}`,
            error: 'Unexpected error',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Build response
    const response: KnowledgeImportOutput = {
      summary: {
        total: params.files.length,
        succeeded: results.length,
        failed: errors.length,
      },
    };

    if (results.length > 0) {
      response.imported = results;
    }

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  } catch (error) {
    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.import');
    throw new MCPError(
      'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * MCP Tool Handler: knowledge.archive
 *
 * Archive or unarchive a knowledge item (soft delete/restore).
 * Archived items are hidden from search by default.
 *
 * US-090: Archive obsolete knowledge items
 *
 * @param input - Archive parameters with itemId
 * @returns Archive result
 * @throws MCPError on validation or archive errors
 *
 * @example
 * ```typescript
 * // Archive an item
 * const result = await knowledgeArchiveHandler({ itemId: 42 });
 *
 * // Unarchive an item
 * const result = await knowledgeArchiveHandler({ itemId: 42, unarchive: true });
 * ```
 */
export async function knowledgeArchiveHandler(input: unknown): Promise<KnowledgeArchiveOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input: expected object', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }

    const params = input as KnowledgeArchiveInput;

    // Validate required fields
    if (typeof params.itemId !== 'number') {
      throw new MCPError(
        'Missing or invalid required field: itemId (number)',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    const unarchive = params.unarchive === true;

    // Check if item exists
    const existingItem = await prisma.knowledgeItem.findUnique({
      where: { id: params.itemId },
      select: { id: true, title: true, category: true, archivedAt: true },
    });

    if (!existingItem) {
      throw new MCPError(
        `Knowledge item ${params.itemId} not found`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        404
      );
    }

    // Check archive state
    if (!unarchive && existingItem.archivedAt) {
      throw new MCPError(
        `Item ${params.itemId} is already archived`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { archivedAt: existingItem.archivedAt.toISOString() }
      );
    }

    if (unarchive && !existingItem.archivedAt) {
      throw new MCPError(
        `Item ${params.itemId} is not archived`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400
      );
    }

    // Archive or unarchive
    const updatedItem = await prisma.knowledgeItem.update({
      where: { id: params.itemId },
      data: {
        archivedAt: unarchive ? null : new Date(),
      },
      select: {
        id: true,
        title: true,
        category: true,
        archivedAt: true,
      },
    });

    return {
      id: updatedItem.id,
      title: updatedItem.title,
      category: updatedItem.category,
      archivedAt: updatedItem.archivedAt?.toISOString() || null,
      action: unarchive ? 'unarchived' : 'archived',
    };
  } catch (error) {
    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in knowledge.archive');
    throw new MCPError(
      'Archive operation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
