/**
 * Knowledge Graph Traversal Services
 *
 * Provides graph-based navigation and relationship discovery for knowledge items.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RelatedKnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relationshipType: string; // 'prerequisite', 'related', 'extends', 'depends-on', 'implements', 'references'
  strength: number; // 0-1, relationship strength
  path: string[]; // Relationship path (e.g., ['node1', 'node2', 'target'])
  depth: number; // How many hops away (1 or 2)
}

export interface GraphTraversalOptions {
  projectId: number; // Project scope (required for multi-tenancy)
  maxDepth?: number; // 1 or 2 hops (default: 2)
  limit?: number; // Max results per depth level (default: 10)
  minStrength?: number; // Minimum relationship strength 0-1 (default: 0.5)
  relationshipTypes?: string[]; // Filter by relationship types (default: all)
  includePath?: boolean; // Include relationship paths in response (default: false)
}

export class GraphError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

/**
 * Find related knowledge items via graph traversal (1-2 hops)
 *
 * Algorithm:
 * 1. Find direct relationships (1-hop) from source item
 * 2. If maxDepth=2, find indirect relationships (2-hop) from 1-hop results
 * 3. Score relationships by strength and depth (1-hop weighted higher than 2-hop)
 * 4. Deduplicate and sort by combined score
 * 5. Return top-K results with metadata
 *
 * @param itemId - Source knowledge item ID
 * @param options - Traversal configuration
 * @returns Array of related knowledge items with relationship metadata
 * @throws GraphError if traversal fails
 *
 * @example
 * ```typescript
 * // Find directly related items
 * const related1hop = await findRelatedKnowledgeItems(5, { maxDepth: 1, limit: 5 });
 *
 * // Find items up to 2 hops away
 * const related2hop = await findRelatedKnowledgeItems(5, { maxDepth: 2, limit: 10 });
 *
 * // Filter by relationship type
 * const prerequisites = await findRelatedKnowledgeItems(5, {
 *   relationshipTypes: ['prerequisite'],
 *   minStrength: 0.8
 * });
 * ```
 */
export async function findRelatedKnowledgeItems(
  itemId: number,
  options: GraphTraversalOptions
): Promise<RelatedKnowledgeItem[]> {
  const {
    projectId,
    maxDepth = 2,
    limit = 10,
    minStrength = 0.5,
    relationshipTypes,
    includePath = false,
  } = options;

  // Validate projectId
  if (!projectId || projectId < 1) {
    throw new GraphError('Valid projectId is required', 'INVALID_PROJECT_ID', 400);
  }

  // Validate input
  if (maxDepth < 1 || maxDepth > 2) {
    throw new GraphError(
      'maxDepth must be 1 or 2',
      'INVALID_DEPTH',
      400
    );
  }

  if (limit < 1 || limit > 50) {
    throw new GraphError(
      'limit must be between 1 and 50',
      'INVALID_LIMIT',
      400
    );
  }

  if (minStrength < 0 || minStrength > 1) {
    throw new GraphError(
      'minStrength must be between 0 and 1',
      'INVALID_STRENGTH',
      400
    );
  }

  try {
    // Check if source item exists and belongs to project
    const sourceItem = await prisma.knowledgeItem.findFirst({
      where: { id: itemId, projectId },
      select: { id: true, title: true },
    });

    if (!sourceItem) {
      throw new GraphError(
        `Knowledge item with ID ${itemId} not found`,
        'ITEM_NOT_FOUND',
        404
      );
    }

    // Build relationship type filter (using correct Prisma column name: relationType)
    const typeFilter = relationshipTypes && relationshipTypes.length > 0
      ? `AND "relationType" = ANY(ARRAY[${relationshipTypes.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}])`
      : '';

    // ========================================
    // STEP 1: Find 1-hop relationships
    // ========================================
    // NOTE: Using Prisma column names (fromId, toId, relationType, weight) not snake_case
    const oneHopSql = `
      WITH direct_relations AS (
        SELECT
          kr."toId" AS related_id,
          kr."relationType" AS relationship_type,
          kr."weight"::float AS strength,
          1 AS depth
        FROM knowledge_relationships kr
        WHERE kr."fromId" = ${itemId}
          AND kr."weight" >= ${minStrength}
          ${typeFilter}

        UNION

        SELECT
          kr."fromId" AS related_id,
          kr."relationType" AS relationship_type,
          kr."weight"::float AS strength,
          1 AS depth
        FROM knowledge_relationships kr
        WHERE kr."toId" = ${itemId}
          AND kr."weight" >= ${minStrength}
          ${typeFilter}
      )
      SELECT
        ki.id,
        ki.title,
        ki.content,
        ki.category,
        ki.tags,
        dr.relationship_type,
        dr.strength,
        dr.depth
      FROM direct_relations dr
      JOIN knowledge_items ki ON ki.id = dr.related_id
      WHERE ki."projectId" = ${projectId}
        AND ki."archivedAt" IS NULL
      ORDER BY dr.strength DESC, ki.id
      LIMIT ${limit}
    `;

    const oneHopResults = await prisma.$queryRawUnsafe<Array<{
      id: number;
      title: string;
      content: string;
      category: string;
      tags: string[];
      relationship_type: string;
      strength: number;
      depth: number;
    }>>(oneHopSql);

    // If maxDepth=1, return only 1-hop results
    if (maxDepth === 1) {
      return oneHopResults.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        relationshipType: result.relationship_type,
        strength: result.strength,
        path: includePath ? [sourceItem.title, result.title] : [],
        depth: 1,
      }));
    }

    // ========================================
    // STEP 2: Find 2-hop relationships
    // ========================================
    const oneHopIds = oneHopResults.map(r => r.id);
    if (oneHopIds.length === 0) {
      // No 1-hop connections, return empty
      return [];
    }

    // NOTE: Using Prisma column names (fromId, toId, relationType, weight) not snake_case
    const twoHopSql = `
      WITH two_hop_relations AS (
        SELECT
          kr."toId" AS related_id,
          kr."relationType" AS relationship_type,
          kr."weight"::float AS strength,
          kr."fromId" AS intermediate_id,
          2 AS depth
        FROM knowledge_relationships kr
        WHERE kr."fromId" = ANY(ARRAY[${oneHopIds.join(', ')}])
          AND kr."toId" != ${itemId}
          AND kr."toId" != ALL(ARRAY[${oneHopIds.join(', ')}])
          AND kr."weight" >= ${minStrength * 0.8}
          ${typeFilter}

        UNION

        SELECT
          kr."fromId" AS related_id,
          kr."relationType" AS relationship_type,
          kr."weight"::float AS strength,
          kr."toId" AS intermediate_id,
          2 AS depth
        FROM knowledge_relationships kr
        WHERE kr."toId" = ANY(ARRAY[${oneHopIds.join(', ')}])
          AND kr."fromId" != ${itemId}
          AND kr."fromId" != ALL(ARRAY[${oneHopIds.join(', ')}])
          AND kr."weight" >= ${minStrength * 0.8}
          ${typeFilter}
      )
      SELECT
        ki.id,
        ki.title,
        ki.content,
        ki.category,
        ki.tags,
        thr.relationship_type,
        thr.strength,
        thr.intermediate_id,
        thr.depth
      FROM two_hop_relations thr
      JOIN knowledge_items ki ON ki.id = thr.related_id
      WHERE ki."projectId" = ${projectId}
        AND ki."archivedAt" IS NULL
      ORDER BY thr.strength DESC, ki.id
      LIMIT ${limit}
    `;

    const twoHopResults = await prisma.$queryRawUnsafe<Array<{
      id: number;
      title: string;
      content: string;
      category: string;
      tags: string[];
      relationship_type: string;
      strength: number;
      intermediate_id: number;
      depth: number;
    }>>(twoHopSql);

    // ========================================
    // STEP 3: Combine and deduplicate results
    // ========================================
    const allResults = new Map<number, RelatedKnowledgeItem>();

    // Add 1-hop results (higher priority)
    for (const result of oneHopResults) {
      allResults.set(result.id, {
        id: result.id,
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        relationshipType: result.relationship_type,
        strength: result.strength,
        path: includePath ? [sourceItem.title, result.title] : [],
        depth: 1,
      });
    }

    // Add 2-hop results (if not already in map)
    if (includePath) {
      // Need to fetch intermediate titles for path
      const intermediateIds = [...new Set(twoHopResults.map(r => r.intermediate_id))];
      const intermediates = await prisma.knowledgeItem.findMany({
        where: { id: { in: intermediateIds }, projectId },
        select: { id: true, title: true },
      });
      const intermediateMap = new Map(intermediates.map(i => [i.id, i.title]));

      for (const result of twoHopResults) {
        if (!allResults.has(result.id)) {
          const intermediateTitle = intermediateMap.get(result.intermediate_id) || 'Unknown';
          allResults.set(result.id, {
            id: result.id,
            title: result.title,
            content: result.content,
            category: result.category,
            tags: result.tags,
            relationshipType: result.relationship_type,
            strength: result.strength * 0.8, // Reduce strength for 2-hop (indirect)
            path: [sourceItem.title, intermediateTitle, result.title],
            depth: 2,
          });
        }
      }
    } else {
      for (const result of twoHopResults) {
        if (!allResults.has(result.id)) {
          allResults.set(result.id, {
            id: result.id,
            title: result.title,
            content: result.content,
            category: result.category,
            tags: result.tags,
            relationshipType: result.relationship_type,
            strength: result.strength * 0.8, // Reduce strength for 2-hop (indirect)
            path: [],
            depth: 2,
          });
        }
      }
    }

    // Sort by strength (already partially sorted by depth preference via insertion order)
    const sortedResults = Array.from(allResults.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);

    return sortedResults;
  } catch (error) {
    // Re-throw GraphError instances
    if (error instanceof GraphError) {
      throw error;
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      throw new GraphError(
        `Database error during graph traversal: ${error.message}`,
        'DATABASE_ERROR',
        500,
        error
      );
    }

    // Generic error
    throw new GraphError(
      `Graph traversal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'TRAVERSAL_FAILED',
      500,
      error
    );
  }
}

/**
 * Get relationship statistics for a knowledge item
 *
 * Returns counts of relationships by type and depth.
 *
 * @param itemId - Knowledge item ID
 * @returns Relationship statistics
 */
export async function getRelationshipStats(itemId: number): Promise<{
  totalRelationships: number;
  byType: Record<string, number>;
  outgoing: number;
  incoming: number;
}> {
  try {
    // NOTE: Using Prisma column names (fromId, toId, relationType) not snake_case
    const sqlQuery = `
      SELECT
        "relationType" AS type,
        'outgoing' AS direction,
        COUNT(*) AS count
      FROM knowledge_relationships
      WHERE "fromId" = ${itemId}
      GROUP BY "relationType"

      UNION ALL

      SELECT
        "relationType" AS type,
        'incoming' AS direction,
        COUNT(*) AS count
      FROM knowledge_relationships
      WHERE "toId" = ${itemId}
      GROUP BY "relationType"
    `;

    const stats = await prisma.$queryRawUnsafe<Array<{
      type: string;
      direction: 'outgoing' | 'incoming';
      count: bigint;
    }>>(sqlQuery);

    const byType: Record<string, number> = {};
    let outgoing = 0;
    let incoming = 0;

    for (const stat of stats) {
      const count = Number(stat.count);
      byType[stat.type] = (byType[stat.type] || 0) + count;
      if (stat.direction === 'outgoing') {
        outgoing += count;
      } else {
        incoming += count;
      }
    }

    return {
      totalRelationships: outgoing + incoming,
      byType,
      outgoing,
      incoming,
    };
  } catch (error) {
    throw new GraphError(
      `Failed to get relationship stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'STATS_FAILED',
      500,
      error
    );
  }
}
