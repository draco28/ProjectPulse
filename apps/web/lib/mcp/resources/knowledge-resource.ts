/**
 * MCP Knowledge Resources Handler
 *
 * Sprint 5.5 - MCP Server Infrastructure (Day 3)
 * Created: 2025-11-13
 *
 * Provides MCP resource handlers for knowledge base context injection:
 * - resources/list - List available knowledge resources
 * - resources/read - Read specific knowledge item by URI
 *
 * Resources enable AI agents to fetch context before making decisions.
 * Unlike tools (which perform actions), resources provide read-only access
 * to project knowledge via addressable URIs.
 *
 * URI Scheme:
 * - knowledge://item/{id} - Specific knowledge item by ID
 * - knowledge://category/{category} - Items in category (future)
 * - knowledge://recent - Recent knowledge items (future)
 *
 * Architecture:
 * - Resource handlers use Prisma directly (no backend API wrapper needed)
 * - Lightweight read operations optimized for context injection
 * - Errors converted to MCPError for JSON-RPC responses
 *
 * @see apps/web/app/api/mcp/route.ts - Route handler
 * @see apps/web/lib/knowledge/search.ts - Search service
 */

import { PrismaClient } from '@prisma/client';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'MCP:KnowledgeResource' });

const prisma = new PrismaClient();

/**
 * Resource metadata for resources/list response
 */
export interface ResourceMetadata {
  uri: string; // Resource URI (e.g., "knowledge://item/123")
  name: string; // Human-readable name
  description: string; // What this resource provides
  mimeType?: string; // Content type (default: text/plain)
}

/**
 * Resource content for resources/read response
 */
export interface ResourceContent {
  uri: string; // Resource URI
  mimeType: string; // Content type
  text?: string; // Text content (if mimeType is text/*)
  blob?: string; // Base64-encoded binary (if mimeType is not text/*)
}

/**
 * MCP Resource Handler: resources/list
 *
 * List available knowledge resources for context injection.
 *
 * Returns:
 * - Recent knowledge items (last 10)
 * - Available categories
 * - Individual item URIs
 *
 * @returns Array of resource metadata
 * @throws MCPError on database errors
 *
 * @example
 * ```typescript
 * const resources = await listKnowledgeResources();
 * // Returns: [
 * //   { uri: "knowledge://item/1", name: "PostgreSQL Indexing", ... },
 * //   { uri: "knowledge://item/2", name: "React Hooks Guide", ... },
 * //   ...
 * // ]
 * ```
 */
export async function listKnowledgeResources(): Promise<ResourceMetadata[]> {
  try {
    // Fetch recent knowledge items (last 20 for context discovery)
    const recentItems = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Fetch all categories (for category-based resource discovery)
    const categories = await prisma.knowledgeItem.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    // Build resource list
    const resources: ResourceMetadata[] = [];

    // Add individual item resources
    for (const item of recentItems) {
      resources.push({
        uri: `knowledge://item/${item.id}`,
        name: item.title,
        description: `Knowledge item: ${item.title} (${item.category})`,
        mimeType: 'text/markdown',
      });
    }

    // Add category summary resources (future enhancement)
    // for (const cat of categories) {
    //   resources.push({
    //     uri: `knowledge://category/${encodeURIComponent(cat.category)}`,
    //     name: `${cat.category} (${cat._count.category} items)`,
    //     description: `All knowledge items in ${cat.category} category`,
    //     mimeType: 'application/json',
    //   });
    // }

    return resources;
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Database error listing resources');
    throw new MCPError(
      'Failed to list knowledge resources: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500,
      { operation: 'list_resources' }
    );
  }
}

/**
 * MCP Resource Handler: resources/read
 *
 * Read a specific knowledge resource by URI.
 *
 * Supported URIs:
 * - knowledge://item/{id} - Read knowledge item by ID
 *
 * @param uri - Resource URI to read
 * @returns Resource content
 * @throws MCPError on invalid URI or not found
 *
 * @example
 * ```typescript
 * const content = await readKnowledgeResource('knowledge://item/123');
 * // Returns: {
 * //   uri: 'knowledge://item/123',
 * //   mimeType: 'text/markdown',
 * //   text: '# PostgreSQL Indexing\n\n...'
 * // }
 * ```
 */
export async function readKnowledgeResource(uri: string): Promise<ResourceContent> {
  try {
    // Parse URI
    if (!uri.startsWith('knowledge://')) {
      throw new MCPError(
        `Invalid URI scheme: must start with 'knowledge://'`,
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { uri }
      );
    }

    const path = uri.replace('knowledge://', '');
    const parts = path.split('/');

    // Route based on URI structure
    if (parts[0] === 'item' && parts[1]) {
      // knowledge://item/{id}
      const itemId = parseInt(parts[1], 10);

      if (isNaN(itemId)) {
        throw new MCPError(
          `Invalid item ID: must be a number`,
          JSONRPC_ERROR_CODES.INVALID_PARAMS,
          400,
          { uri, itemId: parts[1] }
        );
      }

      return await readKnowledgeItem(uri, itemId);
    }

    // Unsupported URI pattern
    throw new MCPError(
      `Unsupported resource URI: ${uri}`,
      JSONRPC_ERROR_CODES.INVALID_PARAMS,
      400,
      {
        uri,
        supportedPatterns: ['knowledge://item/{id}'],
      }
    );
  } catch (error) {
    // Re-throw MCPError as-is
    if (error instanceof MCPError) {
      throw error;
    }

    // Wrap unexpected errors
    log.error({ uri, error: error instanceof Error ? error.message : String(error) }, 'Unexpected error reading resource');
    throw new MCPError(
      'Failed to read resource: ' + (error instanceof Error ? error.message : 'Unknown error'),
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500,
      { uri, operation: 'read_resource' }
    );
  }
}

/**
 * Read a specific knowledge item by ID
 *
 * @param uri - Original resource URI
 * @param itemId - Knowledge item ID
 * @returns Resource content with item details
 * @throws MCPError if item not found
 */
async function readKnowledgeItem(uri: string, itemId: number): Promise<ResourceContent> {
  const item = await prisma.knowledgeItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      // Fetch graph relationships for context
      relationsFrom: {
        select: {
          toId: true,
          relationType: true,
          weight: true,
          toKnowledge: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        take: 10, // Limit to avoid excessive context
      },
      relationsTo: {
        select: {
          fromId: true,
          relationType: true,
          weight: true,
          fromKnowledge: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        take: 10,
      },
    },
  });

  if (!item) {
    throw new MCPError(
      `Knowledge item not found: ID ${itemId}`,
      JSONRPC_ERROR_CODES.INVALID_PARAMS,
      404,
      { uri, itemId }
    );
  }

  // Format as Markdown for rich context injection
  const markdown = formatKnowledgeItemAsMarkdown(item);

  return {
    uri,
    mimeType: 'text/markdown',
    text: markdown,
  };
}

/**
 * Format knowledge item as Markdown for agent consumption
 *
 * @param item - Knowledge item with relationships
 * @returns Markdown-formatted text
 */
function formatKnowledgeItemAsMarkdown(item: {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  relationsFrom: Array<{
    toId: number;
    relationType: string;
    weight: number | { toNumber: () => number }; // Prisma Decimal type
    toKnowledge: { id: number; title: string };
  }>;
  relationsTo: Array<{
    fromId: number;
    relationType: string;
    weight: number | { toNumber: () => number }; // Prisma Decimal type
    fromKnowledge: { id: number; title: string };
  }>;
}): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${item.title}`);
  lines.push('');
  lines.push(`**Category:** ${item.category}`);
  lines.push(`**Tags:** ${item.tags.join(', ')}`);
  lines.push(`**ID:** ${item.id}`);
  lines.push(`**Created:** ${item.createdAt.toISOString()}`);
  lines.push(`**Updated:** ${item.updatedAt.toISOString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Main content
  lines.push(item.content);
  lines.push('');

  // Graph relationships (if any)
  if (item.relationsFrom.length > 0 || item.relationsTo.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Related Knowledge');
    lines.push('');

    if (item.relationsFrom.length > 0) {
      lines.push('**Links to:**');
      lines.push('');
      for (const rel of item.relationsFrom) {
        lines.push(
          `- [${rel.toKnowledge.title}](knowledge://item/${rel.toId}) (${rel.relationType}, weight: ${Number(rel.weight).toFixed(2)})`
        );
      }
      lines.push('');
    }

    if (item.relationsTo.length > 0) {
      lines.push('**Linked from:**');
      lines.push('');
      for (const rel of item.relationsTo) {
        lines.push(
          `- [${rel.fromKnowledge.title}](knowledge://item/${rel.fromId}) (${rel.relationType}, weight: ${Number(rel.weight).toFixed(2)})`
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
