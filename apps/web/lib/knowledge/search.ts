/**
 * Knowledge Search Services
 *
 * Provides semantic, full-text, and hybrid search capabilities for knowledge items.
 */

import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../embeddings';
import { findRelatedKnowledgeItems, type RelatedKnowledgeItem } from './graph';

const prisma = new PrismaClient();

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  score: number; // 0-1, higher is better
  matchType: 'semantic' | 'fulltext' | 'hybrid';
  relatedItems?: RelatedKnowledgeItem[]; // Optional graph-based related items
}

export interface SemanticSearchOptions {
  projectId: number; // Project scope (required for multi-tenancy)
  limit?: number; // Max results to return (default: 5)
  threshold?: number; // Minimum similarity score 0-1 (default: 0.7)
  category?: string; // Optional category filter
  includeRelated?: boolean; // Include graph-based related items (default: false)
}

export class SearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

/**
 * Semantic search using pgvector cosine similarity
 *
 * Process:
 * 1. Generate embedding for query text (768 dimensions via Ollama/OpenAI)
 * 2. Calculate cosine similarity against all embeddings in database
 * 3. Return top-K results above threshold
 *
 * @param query - Search query text
 * @param options - Search configuration
 * @returns Array of search results sorted by relevance
 * @throws SearchError if search fails
 *
 * @example
 * ```typescript
 * const results = await semanticSearch('PostgreSQL indexing strategies', {
 *   limit: 5,
 *   threshold: 0.7,
 *   category: 'Database'
 * });
 * console.log(`Found ${results.length} relevant items`);
 * ```
 */
export async function semanticSearch(
  query: string,
  options: SemanticSearchOptions
): Promise<SearchResult[]> {
  const { projectId, limit = 5, threshold = 0.7, category } = options;

  // Validate projectId
  if (!projectId || projectId < 1) {
    throw new SearchError('Valid projectId is required', 'INVALID_PROJECT_ID', 400);
  }

  // Validate input
  if (!query || query.trim().length === 0) {
    throw new SearchError('Query cannot be empty', 'INVALID_QUERY', 400);
  }

  if (limit < 1 || limit > 50) {
    throw new SearchError('Limit must be between 1 and 50', 'INVALID_LIMIT', 400);
  }

  if (threshold < 0 || threshold > 1) {
    throw new SearchError('Threshold must be between 0 and 1', 'INVALID_THRESHOLD', 400);
  }

  try {
    // Generate query embedding (same 768 dimensions as stored embeddings)
    const embeddingResult = await generateEmbedding(query);
    const queryVector = `[${embeddingResult.embedding.join(',')}]`;

    // Build SQL query with optional category filter
    // pgvector uses <=> operator for cosine distance (0 = identical, 2 = opposite)
    // We convert to similarity: 1 - (distance / 2)
    let sqlQuery = `
      SELECT
        id,
        title,
        content,
        category,
        tags,
        (embedding <=> '${queryVector}'::vector(768)) AS distance
      FROM knowledge_items
      WHERE "projectId" = ${projectId}
        AND "archivedAt" IS NULL
    `;

    if (category) {
      sqlQuery += ` AND category = '${category.replace(/'/g, "''")}'`; // Escape single quotes
    }

    sqlQuery += `
      ORDER BY embedding <=> '${queryVector}'::vector(768)
      LIMIT ${limit * 2}
    `;

    const results = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        title: string;
        content: string;
        category: string;
        tags: string[];
        distance: number;
      }>
    >(sqlQuery);

    // Convert distance to similarity score and filter by threshold
    // Similarity = 1 - (distance / 2)
    // Distance range: [0, 2] → Similarity range: [0, 1]
    const scoredResults: SearchResult[] = results
      .map((result) => ({
        id: result.id,
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        score: 1 - result.distance / 2,
        matchType: 'semantic' as const,
      }))
      .filter((result) => result.score >= threshold)
      .slice(0, limit); // Apply limit after filtering

    return scoredResults;
  } catch (error) {
    // Handle embedding generation errors
    if (error instanceof Error && error.name.includes('Embedding')) {
      throw new SearchError(
        `Failed to generate query embedding: ${error.message}`,
        'EMBEDDING_FAILED',
        503,
        error
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      throw new SearchError(
        `Database error during semantic search: ${error.message}`,
        'DATABASE_ERROR',
        500,
        error
      );
    }

    // Re-throw SearchError instances
    if (error instanceof SearchError) {
      throw error;
    }

    // Generic error
    throw new SearchError(
      `Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SEARCH_FAILED',
      500,
      error
    );
  }
}

/**
 * Full-text search using PostgreSQL tsvector and ts_rank_cd
 *
 * Process:
 * 1. Parse query into tsquery (supports AND, OR, NOT, phrase search)
 * 2. Match against tsvector index (auto-generated from title + content)
 * 3. Rank results using ts_rank_cd with weighted fields
 * 4. Return top-K results
 *
 * @param query - Search query (supports operators: & | ! "phrase")
 * @param options - Search configuration
 * @returns Array of search results sorted by relevance
 * @throws SearchError if search fails
 *
 * @example
 * ```typescript
 * // Simple query
 * const results1 = await fullTextSearch('PostgreSQL indexing');
 *
 * // Boolean query with operators
 * const results2 = await fullTextSearch('PostgreSQL & (index | btree)');
 *
 * // Phrase search
 * const results3 = await fullTextSearch('"full text search"');
 * ```
 */
export async function fullTextSearch(
  query: string,
  options: SemanticSearchOptions
): Promise<SearchResult[]> {
  const {
    projectId,
    limit = 5,
    threshold = 0.1, // Lower threshold for full-text (different scale)
    category,
  } = options;

  // Validate projectId
  if (!projectId || projectId < 1) {
    throw new SearchError('Valid projectId is required', 'INVALID_PROJECT_ID', 400);
  }

  // Validate input
  if (!query || query.trim().length === 0) {
    throw new SearchError('Query cannot be empty', 'INVALID_QUERY', 400);
  }

  if (limit < 1 || limit > 50) {
    throw new SearchError('Limit must be between 1 and 50', 'INVALID_LIMIT', 400);
  }

  try {
    // Build SQL query with optional category filter
    // Use ts_rank_cd for ranking (considers word frequency and document length)
    // Weights: {D-weight, C-weight, B-weight, A-weight} = {0.1, 0.2, 0.4, 1.0}
    // A = title (highest), B = content, C = tags, D = category (lowest)
    let sqlQuery = `
      SELECT
        id,
        title,
        content,
        category,
        tags,
        ts_rank_cd(
          "contentTsvector",
          plainto_tsquery('english', '${query.replace(/'/g, "''")}'),
          32
        ) AS rank
      FROM knowledge_items
      WHERE "projectId" = ${projectId}
        AND "archivedAt" IS NULL
        AND "contentTsvector" @@ plainto_tsquery('english', '${query.replace(/'/g, "''")}')
    `;

    if (category) {
      sqlQuery += ` AND category = '${category.replace(/'/g, "''")}'`;
    }

    sqlQuery += `
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    const results = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        title: string;
        content: string;
        category: string;
        tags: string[];
        rank: number;
      }>
    >(sqlQuery);

    // Convert rank to 0-1 similarity score
    // ts_rank_cd returns values typically in range [0, 1] but can exceed 1
    // We'll normalize to [0, 1] and filter by threshold
    const maxRank = results.length > 0 ? Math.max(...results.map((r) => r.rank)) : 1;

    const scoredResults: SearchResult[] = results
      .map((result) => ({
        id: result.id,
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        score: maxRank > 0 ? result.rank / maxRank : 0,
        matchType: 'fulltext' as const,
      }))
      .filter((result) => result.score >= threshold);

    return scoredResults;
  } catch (error) {
    // Handle database errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      throw new SearchError(
        `Database error during full-text search: ${error.message}`,
        'DATABASE_ERROR',
        500,
        error
      );
    }

    // Re-throw SearchError instances
    if (error instanceof SearchError) {
      throw error;
    }

    // Generic error
    throw new SearchError(
      `Full-text search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SEARCH_FAILED',
      500,
      error
    );
  }
}

/**
 * Hybrid search combining semantic and full-text search
 *
 * Algorithm:
 * 1. Run semantic search (pgvector) in parallel with full-text search (tsvector)
 * 2. Merge results with weighted scoring: 0.7 × semantic + 0.3 × fulltext
 * 3. Deduplicate by ID, keeping highest combined score
 * 4. Sort by combined score descending
 * 5. Return top-K results
 *
 * @param query - Search query text
 * @param options - Search configuration
 * @returns Array of search results sorted by combined relevance
 * @throws SearchError if search fails
 *
 * @example
 * ```typescript
 * const results = await hybridSearch('PostgreSQL performance optimization', {
 *   limit: 10,
 *   category: 'Database'
 * });
 * // Returns items matching semantically OR via full-text, ranked by combined score
 * ```
 */
export async function hybridSearch(
  query: string,
  options: SemanticSearchOptions
): Promise<SearchResult[]> {
  const { projectId, limit = 5, includeRelated = false } = options;

  // Validate projectId
  if (!projectId || projectId < 1) {
    throw new SearchError('Valid projectId is required', 'INVALID_PROJECT_ID', 400);
  }

  try {
    // Run both searches in parallel with higher limits to get more candidates
    const [semanticResults, fulltextResults] = await Promise.all([
      semanticSearch(query, {
        ...options,
        limit: limit * 2,
        threshold: 0.5,
        includeRelated: false,
      }), // Lower threshold for merging
      fullTextSearch(query, {
        ...options,
        limit: limit * 2,
        threshold: 0.05,
        includeRelated: false,
      }),
    ]);

    // Merge results with weighted scoring
    const SEMANTIC_WEIGHT = 0.7;
    const FULLTEXT_WEIGHT = 0.3;

    // Create a map to track combined scores by ID
    const scoreMap = new Map<
      number,
      {
        result: SearchResult;
        semanticScore: number;
        fulltextScore: number;
      }
    >();

    // Add semantic results
    for (const result of semanticResults) {
      scoreMap.set(result.id, {
        result: { ...result, matchType: 'hybrid' as const },
        semanticScore: result.score,
        fulltextScore: 0,
      });
    }

    // Add/merge full-text results
    for (const result of fulltextResults) {
      const existing = scoreMap.get(result.id);
      if (existing) {
        // Item found in both searches - update fulltext score
        existing.fulltextScore = result.score;
      } else {
        // Item only in full-text results
        scoreMap.set(result.id, {
          result: { ...result, matchType: 'hybrid' as const },
          semanticScore: 0,
          fulltextScore: result.score,
        });
      }
    }

    // Calculate combined scores and sort
    const hybridResults = Array.from(scoreMap.values())
      .map(({ result, semanticScore, fulltextScore }) => ({
        ...result,
        score: semanticScore * SEMANTIC_WEIGHT + fulltextScore * FULLTEXT_WEIGHT,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Optionally add graph-based related items for each result
    if (includeRelated && hybridResults.length > 0) {
      // Fetch related items for top result only (to avoid excessive queries)
      const topResult = hybridResults[0];
      if (topResult) {
        try {
          const relatedItems = await findRelatedKnowledgeItems(topResult.id, {
            projectId,
            maxDepth: 2,
            limit: 5,
            minStrength: 0.6,
          });
          topResult.relatedItems = relatedItems;
        } catch (error) {
          // Log error but don't fail the search
          console.warn(`Failed to fetch related items for ${topResult.id}:`, error);
        }
      }
    }

    return hybridResults;
  } catch (error) {
    // Re-throw SearchError instances
    if (error instanceof SearchError) {
      throw error;
    }

    // Generic error
    throw new SearchError(
      `Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SEARCH_FAILED',
      500,
      error
    );
  }
}
