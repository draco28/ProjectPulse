/**
 * MCP Tool Specifications for Knowledge Base
 *
 * These tool definitions will be registered with the MCP server (Sprint 6+).
 * For now, they serve as specifications and can be tested via API routes directly.
 *
 * @see https://modelcontextprotocol.io/docs/concepts/tools
 */

import { hybridSearch, semanticSearch, fullTextSearch } from '../knowledge/search';
import { createKnowledgeItem } from '../knowledge/create';
import { findRelatedKnowledgeItems } from '../knowledge/graph';
import type { SearchKnowledgeInput } from '../validations/knowledge';

/**
 * MCP Tool: knowledge.search
 *
 * Search the knowledge base using hybrid (semantic + full-text) search.
 * Returns relevant knowledge items with scores and optional related items.
 *
 * Input Schema:
 * - query: string (required) - Search query in natural language
 * - mode: 'semantic' | 'fulltext' | 'hybrid' (default: 'hybrid')
 * - limit: number (default: 5, max: 50)
 * - category: string (optional) - Filter by category
 * - includeRelated: boolean (default: false) - Include graph-based related items
 *
 * Output Schema:
 * - results: Array of knowledge items with scores
 * - count: number - Total results returned
 * - mode: string - Search mode used
 * - duration: number - Search duration in ms
 *
 * @example
 * ```json
 * // Tool invocation
 * {
 *   "name": "knowledge.search",
 *   "arguments": {
 *     "query": "PostgreSQL indexing strategies",
 *     "mode": "hybrid",
 *     "limit": 5,
 *     "includeRelated": true
 *   }
 * }
 *
 * // Tool response
 * {
 *   "results": [
 *     {
 *       "id": 14,
 *       "title": "PostgreSQL Indexing Strategies",
 *       "excerpt": "Choose index types based on use case...",
 *       "score": 0.89,
 *       "matchType": "hybrid",
 *       "relatedItems": [...]
 *     }
 *   ],
 *   "count": 1,
 *   "mode": "hybrid",
 *   "duration": 45
 * }
 * ```
 */
export async function knowledgeSearchTool(input: SearchKnowledgeInput) {
  const { projectId, query, mode = 'hybrid', limit = 5, category, includeRelated = false } = input;

  const startTime = Date.now();
  let results;

  const searchOptions = { projectId, limit, category, includeRelated };

  switch (mode) {
    case 'semantic':
      results = await semanticSearch(query, searchOptions);
      break;
    case 'fulltext':
      results = await fullTextSearch(query, searchOptions);
      break;
    case 'hybrid':
    default:
      results = await hybridSearch(query, searchOptions);
      break;
  }

  const duration = Date.now() - startTime;

  // Format results for MCP response
  const formattedResults = results.map(result => ({
    id: result.id,
    title: result.title,
    excerpt: result.content.slice(0, 200) + (result.content.length > 200 ? '...' : ''),
    category: result.category,
    tags: result.tags,
    score: result.score,
    matchType: result.matchType,
    relatedItems: result.relatedItems?.map(related => ({
      id: related.id,
      title: related.title,
      relationshipType: related.relationshipType,
      strength: related.strength,
      depth: related.depth,
    })),
  }));

  return {
    results: formattedResults,
    count: results.length,
    mode,
    duration,
  };
}

/**
 * MCP Tool: knowledge.create
 *
 * Create a new knowledge item with automatic embedding generation.
 * Embeddings are generated using Ollama (primary) or OpenAI (fallback).
 *
 * Input Schema:
 * - title: string (required, 1-200 chars)
 * - content: string (required, 10-50000 chars)
 * - category: string (required, 1-50 chars)
 * - tags: string[] (optional, max 20)
 *
 * Output Schema:
 * - id: number - Created item ID
 * - title: string
 * - content: string
 * - category: string
 * - tags: string[]
 * - embeddingProvider: 'ollama' | 'openai'
 * - embeddingDuration: number - Generation time in ms
 *
 * @example
 * ```json
 * // Tool invocation
 * {
 *   "name": "knowledge.create",
 *   "arguments": {
 *     "title": "React Server Components Best Practices",
 *     "content": "Server Components in Next.js 14 should be used for...",
 *     "category": "Architecture",
 *     "tags": ["react", "next.js", "server-components"]
 *   }
 * }
 *
 * // Tool response
 * {
 *   "id": 17,
 *   "title": "React Server Components Best Practices",
 *   "content": "Server Components in Next.js 14 should be used for...",
 *   "category": "Architecture",
 *   "tags": ["react", "next.js", "server-components"],
 *   "embeddingProvider": "ollama",
 *   "embeddingDuration": 127
 * }
 * ```
 */
export async function knowledgeCreateTool(input: {
  projectId: number;
  title: string;
  content: string;
  category: string;
  tags?: string[];
}) {
  const result = await createKnowledgeItem({
    projectId: input.projectId,
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags || [],
  });

  return {
    id: result.id,
    title: result.title,
    content: result.content,
    category: result.category,
    tags: result.tags,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    embeddingProvider: result.embeddingProvider,
    embeddingDuration: result.embeddingDuration,
  };
}

/**
 * MCP Tool: knowledge.related
 *
 * Find related knowledge items via graph traversal (1-2 hops).
 * Uses the knowledge graph relationships to discover connected items.
 *
 * Input Schema:
 * - itemId: number (required) - Source knowledge item ID
 * - maxDepth: number (1 or 2, default: 2)
 * - limit: number (default: 10, max: 50)
 * - minStrength: number (0-1, default: 0.6)
 * - relationshipTypes: string[] (optional) - Filter by types
 *
 * Output Schema:
 * - related: Array of related knowledge items
 * - count: number - Total results returned
 * - sourceId: number - Source item ID
 *
 * @example
 * ```json
 * // Tool invocation
 * {
 *   "name": "knowledge.related",
 *   "arguments": {
 *     "itemId": 5,
 *     "maxDepth": 2,
 *     "limit": 10,
 *     "minStrength": 0.6
 *   }
 * }
 *
 * // Tool response
 * {
 *   "related": [
 *     {
 *       "id": 14,
 *       "title": "PostgreSQL Indexing Strategies",
 *       "relationshipType": "related",
 *       "strength": 0.9,
 *       "depth": 1
 *     }
 *   ],
 *   "count": 1,
 *   "sourceId": 5
 * }
 * ```
 */
export async function knowledgeRelatedTool(input: {
  projectId: number;
  itemId: number;
  maxDepth?: number;
  limit?: number;
  minStrength?: number;
  relationshipTypes?: string[];
}) {
  const { projectId, itemId, maxDepth = 2, limit = 10, minStrength = 0.6, relationshipTypes } = input;

  const results = await findRelatedKnowledgeItems(itemId, {
    projectId,
    maxDepth,
    limit,
    minStrength,
    relationshipTypes,
    includePath: true,
  });

  const formattedResults = results.map(result => ({
    id: result.id,
    title: result.title,
    excerpt: result.content.slice(0, 150) + (result.content.length > 150 ? '...' : ''),
    category: result.category,
    tags: result.tags,
    relationshipType: result.relationshipType,
    strength: result.strength,
    depth: result.depth,
    path: result.path,
  }));

  return {
    related: formattedResults,
    count: results.length,
    sourceId: itemId,
  };
}

/**
 * MCP Tool Registry
 *
 * This will be used to register tools with the MCP server in Sprint 6+.
 */
export const knowledgeTools = {
  'knowledge.search': {
    name: 'knowledge.search',
    description: 'Search the knowledge base using hybrid (semantic + full-text) search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query in natural language',
        },
        mode: {
          type: 'string',
          enum: ['semantic', 'fulltext', 'hybrid'],
          default: 'hybrid',
          description: 'Search mode',
        },
        limit: {
          type: 'number',
          default: 5,
          minimum: 1,
          maximum: 50,
          description: 'Maximum number of results',
        },
        category: {
          type: 'string',
          description: 'Filter by category (optional)',
        },
        includeRelated: {
          type: 'boolean',
          default: false,
          description: 'Include graph-based related items',
        },
      },
      required: ['query'],
    },
    handler: knowledgeSearchTool,
  },
  'knowledge.create': {
    name: 'knowledge.create',
    description: 'Create a new knowledge item with automatic embedding generation',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Knowledge item title',
        },
        content: {
          type: 'string',
          minLength: 10,
          maxLength: 50000,
          description: 'Knowledge item content (supports Markdown)',
        },
        category: {
          type: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Category (e.g., Architecture, Database, Testing)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 20,
          description: 'Tags for categorization',
        },
      },
      required: ['title', 'content', 'category'],
    },
    handler: knowledgeCreateTool,
  },
  'knowledge.related': {
    name: 'knowledge.related',
    description: 'Find related knowledge items via graph traversal (1-2 hops)',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'number',
          description: 'Source knowledge item ID',
        },
        maxDepth: {
          type: 'number',
          enum: [1, 2],
          default: 2,
          description: 'Maximum traversal depth (1 or 2 hops)',
        },
        limit: {
          type: 'number',
          default: 10,
          minimum: 1,
          maximum: 50,
          description: 'Maximum number of results',
        },
        minStrength: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.6,
          description: 'Minimum relationship strength (0-1)',
        },
        relationshipTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['prerequisite', 'related', 'extends', 'depends-on', 'implements', 'references'],
          },
          description: 'Filter by relationship types',
        },
      },
      required: ['itemId'],
    },
    handler: knowledgeRelatedTool,
  },
};
