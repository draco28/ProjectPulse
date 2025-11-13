/**
 * Knowledge Item Deduplication Utilities
 *
 * Detects duplicate knowledge items using:
 * 1. Exact title match (case-insensitive)
 * 2. Semantic similarity >0.95 (using pgvector cosine similarity)
 *
 * US-089: Detect duplicate knowledge items
 */

import { prisma } from '@/lib/prisma';

export interface DuplicateCandidate {
  id: number;
  title: string;
  category: string;
  tags: string[];
  similarity: number; // 0-1 (semantic) or 1.0 (exact title match)
  matchType: 'title_exact' | 'semantic_high';
  createdAt: Date;
}

export interface DeduplicationOptions {
  title: string;
  embedding?: number[]; // 768-dim vector from embedding service
  category?: string; // Optional category filter
  similarityThreshold?: number; // Default: 0.95
  limit?: number; // Max duplicates to return (default: 5)
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  candidates: DuplicateCandidate[];
  suggestion: string | null;
}

/**
 * Find potential duplicate knowledge items
 *
 * @param options - Deduplication search options
 * @returns Deduplication result with candidates
 */
export async function findDuplicates(
  options: DeduplicationOptions
): Promise<DeduplicationResult> {
  const {
    title,
    embedding,
    category,
    similarityThreshold = 0.95,
    limit = 5,
  } = options;

  const candidates: DuplicateCandidate[] = [];

  // Strategy 1: Exact title match (case-insensitive)
  const exactMatches = await prisma.knowledgeItem.findMany({
    where: {
      title: {
        equals: title,
        mode: 'insensitive',
      },
      // Optionally filter by category
      ...(category && { category }),
      // Exclude archived items
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
      createdAt: true,
    },
    take: limit,
  });

  // Add exact matches with similarity = 1.0
  for (const match of exactMatches) {
    candidates.push({
      ...match,
      similarity: 1.0,
      matchType: 'title_exact',
    });
  }

  // Strategy 2: Semantic similarity (if embedding provided)
  if (embedding && embedding.length === 768) {
    try {
      // Use pgvector cosine similarity (<=> operator)
      // Note: Raw SQL required for vector operations
      const embeddingStr = `[${embedding.join(',')}]`;
      const excludedIds = candidates.map(c => c.id);

      // Build WHERE clause parts
      const whereClauses: string[] = ['archived_at IS NULL'];
      if (excludedIds.length > 0) {
        whereClauses.push(`id NOT IN (${excludedIds.join(',')})`);
      }
      if (category) {
        whereClauses.push(`category = '${category.replace(/'/g, "''")}'`); // Escape single quotes
      }
      whereClauses.push(`1 - (embedding <=> '${embeddingStr}'::vector) >= ${similarityThreshold}`);

      const whereClause = whereClauses.join(' AND ');

      const semanticMatches = await prisma.$queryRawUnsafe<
        Array<{
          id: number;
          title: string;
          category: string;
          tags: string[];
          similarity: number;
          created_at: Date;
        }>
      >(`
        SELECT
          id,
          title,
          category,
          tags,
          1 - (embedding <=> '${embeddingStr}'::vector) AS similarity,
          created_at
        FROM knowledge_items
        WHERE ${whereClause}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `);

      // Add semantic matches
      for (const match of semanticMatches) {
        candidates.push({
          id: match.id,
          title: match.title,
          category: match.category,
          tags: match.tags,
          similarity: Number(match.similarity),
          matchType: 'semantic_high',
          createdAt: match.created_at,
        });
      }
    } catch (error) {
      console.error('[findDuplicates] Semantic search failed:', error);
      // Continue with exact matches only
    }
  }

  // Sort candidates by similarity DESC
  candidates.sort((a, b) => b.similarity - a.similarity);

  // Limit results
  const topCandidates = candidates.slice(0, limit);

  // Generate suggestion
  let suggestion: string | null = null;
  if (topCandidates.length > 0) {
    const topMatch = topCandidates[0];
    if (topMatch.similarity >= 0.98) {
      suggestion = `Very similar to existing item "${topMatch.title}" (${(topMatch.similarity * 100).toFixed(1)}% match). Consider updating instead.`;
    } else if (topMatch.similarity >= 0.95) {
      suggestion = `Similar to existing item "${topMatch.title}" (${(topMatch.similarity * 100).toFixed(1)}% match). Review before creating.`;
    }
  }

  return {
    isDuplicate: topCandidates.length > 0 && topCandidates[0].similarity >= 0.98,
    candidates: topCandidates,
    suggestion,
  };
}

/**
 * Custom error for duplicate detection
 */
export class DuplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public duplicates?: DuplicateCandidate[]
  ) {
    super(message);
    this.name = 'DuplicationError';
  }
}
