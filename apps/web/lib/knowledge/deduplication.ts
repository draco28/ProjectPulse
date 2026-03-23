/**
 * Knowledge Item Deduplication Utilities
 *
 * Detects duplicate knowledge items using:
 * 1. Exact title match (case-insensitive)
 * 2. Semantic similarity >0.95 (using pgvector cosine similarity)
 *
 * US-089: Detect duplicate knowledge items
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Knowledge:Deduplication' });

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
  projectId: number; // Required for multi-tenancy scoping
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
export async function findDuplicates(options: DeduplicationOptions): Promise<DeduplicationResult> {
  const { projectId, title, embedding, category, similarityThreshold = 0.95, limit = 5 } = options;

  const candidates: DuplicateCandidate[] = [];

  // Strategy 1: Exact title match (case-insensitive)
  const exactMatches = await prisma.knowledgeItem.findMany({
    where: {
      projectId, // Multi-tenancy: scope to project
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
      // Vector literal is safe - comes from our embedding service, not user input
      const embeddingStr = `[${embedding.join(',')}]`;
      const excludedIds = candidates.map((c) => c.id);

      // SECURITY FIX: Build WHERE clause with Prisma.sql for parameterized values
      // excludedIds are from our DB query (safe), category is user input (parameterized)
      const excludeFilter =
        excludedIds.length > 0
          ? Prisma.sql`AND id NOT IN (${Prisma.join(excludedIds)})`
          : Prisma.empty;
      const categoryFilter = category ? Prisma.sql`AND category = ${category}` : Prisma.empty;

      // SECURITY FIX: Converted from $queryRawUnsafe to $queryRaw with parameterized values
      const semanticMatches = await prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          category: string;
          tags: string[];
          similarity: number;
          createdAt: Date;
        }>
      >`
        SELECT
          id,
          title,
          category,
          tags,
          1 - (embedding <=> ${embeddingStr}::vector) AS similarity,
          "createdAt"
        FROM knowledge_items
        WHERE "projectId" = ${projectId}
          AND "archivedAt" IS NULL
          ${excludeFilter}
          ${categoryFilter}
          AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${similarityThreshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;

      // Add semantic matches
      for (const match of semanticMatches) {
        candidates.push({
          id: match.id,
          title: match.title,
          category: match.category,
          tags: match.tags,
          similarity: Number(match.similarity),
          matchType: 'semantic_high',
          createdAt: match.createdAt,
        });
      }
    } catch (error) {
      log.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Semantic search failed'
      );
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
    const topMatch = topCandidates[0]!;
    if (topMatch.similarity >= 0.98) {
      suggestion = `Very similar to existing item "${topMatch.title}" (${(topMatch.similarity * 100).toFixed(1)}% match). Consider updating instead.`;
    } else if (topMatch.similarity >= 0.95) {
      suggestion = `Similar to existing item "${topMatch.title}" (${(topMatch.similarity * 100).toFixed(1)}% match). Review before creating.`;
    }
  }

  return {
    isDuplicate: topCandidates.length > 0 && (topCandidates[0]?.similarity ?? 0) >= 0.98,
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
