/**
 * Skills Deduplication Utilities
 *
 * Sprint 6 - Phase 6: Skills Integration
 * US-105: Detect duplicate skills
 * Created: 2025-11-13
 *
 * Detects duplicate skills using:
 * 1. Exact slug collision within project (primary check)
 * 2. Exact title match (case-insensitive)
 *
 * Unlike knowledge items, skills don't have semantic embeddings,
 * so we rely on slug/title matching for duplicate detection.
 */

import { prisma } from '@/lib/prisma';

export interface SkillDuplicateCandidate {
  id: number;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  frameworks: string[];
  matchType: 'slug_exact' | 'title_exact';
  createdAt: Date;
}

export interface SkillDeduplicationOptions {
  projectId: number;
  slug: string;
  title: string;
  category?: string; // Optional category filter
  limit?: number; // Max duplicates to return (default: 5)
}

export interface SkillDeduplicationResult {
  isDuplicate: boolean;
  candidates: SkillDuplicateCandidate[];
  suggestion: string | null;
}

/**
 * Find potential duplicate skills
 *
 * Strategy:
 * 1. **Slug collision** (primary): Check if slug already exists in project
 *    - @@unique([projectId, slug]) constraint prevents this at database level
 *    - This check catches attempts to create duplicate slugs
 * 2. **Title match** (secondary): Check for skills with identical titles
 *    - Case-insensitive comparison
 *    - May indicate different slugs for same concept
 *
 * @param options - Deduplication search options
 * @returns Deduplication result with candidates
 *
 * @example
 * ```typescript
 * const result = await findSkillDuplicates({
 *   projectId: 1,
 *   slug: 'nextjs-ssr',
 *   title: 'Next.js Server-Side Rendering',
 *   category: 'framework',
 *   limit: 5,
 * });
 *
 * if (result.isDuplicate) {
 *   console.log(result.suggestion);
 *   // "Skill with slug 'nextjs-ssr' already exists. Choose a different slug."
 * }
 * ```
 */
export async function findSkillDuplicates(
  options: SkillDeduplicationOptions
): Promise<SkillDeduplicationResult> {
  const { projectId, slug, title, category, limit = 5 } = options;

  const candidates: SkillDuplicateCandidate[] = [];

  // Strategy 1: Exact slug match within project (primary check)
  const slugMatches = await prisma.skill.findMany({
    where: {
      projectId,
      slug: {
        equals: slug,
        mode: 'insensitive', // Case-insensitive (though slugs should always be lowercase)
      },
      // Optionally filter by category
      ...(category && { category }),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      tags: true,
      frameworks: true,
      createdAt: true,
    },
    take: limit,
  });

  // Add slug matches
  for (const match of slugMatches) {
    candidates.push({
      ...match,
      matchType: 'slug_exact',
    });
  }

  // Strategy 2: Exact title match (case-insensitive) within project
  // Only check if no slug matches found (to avoid duplicates in results)
  if (candidates.length === 0) {
    const titleMatches = await prisma.skill.findMany({
      where: {
        projectId,
        title: {
          equals: title,
          mode: 'insensitive',
        },
        // Optionally filter by category
        ...(category && { category }),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        tags: true,
        frameworks: true,
        createdAt: true,
      },
      take: limit,
    });

    // Add title matches
    for (const match of titleMatches) {
      candidates.push({
        ...match,
        matchType: 'title_exact',
      });
    }
  }

  // Limit results
  const topCandidates = candidates.slice(0, limit);

  // Generate suggestion
  let suggestion: string | null = null;
  if (topCandidates.length > 0) {
    const topMatch = topCandidates[0];

    if (topMatch.matchType === 'slug_exact') {
      suggestion = `Skill with slug "${topMatch.slug}" already exists in this project. Choose a different slug or use the existing skill (id: ${topMatch.id}).`;
    } else if (topMatch.matchType === 'title_exact') {
      suggestion = `Skill with title "${topMatch.title}" already exists (slug: "${topMatch.slug}"). This may be a duplicate. Review before creating.`;
    }
  }

  // isDuplicate = true if slug collision detected (slug is primary key)
  const isDuplicate = topCandidates.length > 0 && topCandidates[0].matchType === 'slug_exact';

  return {
    isDuplicate,
    candidates: topCandidates,
    suggestion,
  };
}

/**
 * Custom error for skill duplicate detection
 */
export class SkillDuplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public duplicates?: SkillDuplicateCandidate[]
  ) {
    super(message);
    this.name = 'SkillDuplicationError';
  }
}
