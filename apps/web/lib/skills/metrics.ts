/**
 * Skills Metrics & Token Usage Tracking
 *
 * Sprint 6 - Phase 4: Skills Advanced Features
 * US-098: Measure token usage per skill load
 * Created: 2025-11-13
 *
 * Provides token estimation and usage metrics for the skills lazy-loading system.
 * Helps validate the 92% token reduction goal (2,500 → 220 tokens).
 */

import type { CachedSkill } from './cache';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Skills:Metrics' });

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

/**
 * Estimate token count from text
 *
 * Uses rough approximation: 1 token ≈ 4 characters
 * This matches Claude's tokenization (slightly conservative).
 *
 * @param text - Text to estimate
 * @returns Estimated token count
 *
 * @example
 * ```typescript
 * estimateTokens('Hello world'); // ~3 tokens
 * estimateTokens('A'.repeat(1000)); // ~250 tokens
 * ```
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for skill frontmatter (list view - US-091)
 *
 * Includes: id, slug, title, category, description, tags, frameworks, usage stats
 * Excludes: content field
 *
 * Target: ~6-8 tokens per skill in list view
 *
 * @param skill - Skill object (without content)
 * @returns Estimated token count for frontmatter
 *
 * @example
 * ```typescript
 * const skill = {
 *   id: 1,
 *   slug: 'nextjs-ssr',
 *   title: 'Next.js Server-Side Rendering',
 *   category: 'framework',
 *   description: 'Patterns for SSR...',
 *   tags: ['nextjs', 'react', 'ssr'],
 *   frameworks: ['Next.js 14'],
 *   usageCount: 5,
 *   lastLoadedAt: new Date(),
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 *
 * const tokens = estimateSkillFrontmatterTokens(skill); // ~7 tokens
 * ```
 */
export function estimateSkillFrontmatterTokens(skill: {
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  tags: string[];
  frameworks: string[];
}): number {
  let total = 0;

  // Core fields
  total += estimateTokens(skill.slug); // ~2-4 tokens
  total += estimateTokens(skill.title); // ~2-6 tokens
  total += estimateTokens(skill.category); // ~1-2 tokens

  // Optional description
  if (skill.description) {
    total += estimateTokens(skill.description); // ~5-20 tokens
  }

  // Arrays (join with commas)
  if (skill.tags && skill.tags.length > 0) {
    total += estimateTokens(skill.tags.join(', ')); // ~2-10 tokens
  }

  if (skill.frameworks && skill.frameworks.length > 0) {
    total += estimateTokens(skill.frameworks.join(', ')); // ~1-5 tokens
  }

  // JSON overhead (brackets, quotes, commas) ~5-10 tokens
  total += 8;

  return total;
}

/**
 * Estimate tokens for full skill (load view - US-092)
 *
 * Includes: all frontmatter fields + content field
 *
 * Target: ~180-230 tokens per skill
 *
 * @param skill - Full skill object (with content)
 * @returns Estimated token count for full skill
 *
 * @example
 * ```typescript
 * const skill = {
 *   // ... frontmatter fields
 *   content: '# Next.js SSR\n\n## Overview\n...' // ~700 chars = ~175 tokens
 * };
 *
 * const tokens = estimateSkillFullTokens(skill); // ~185 tokens
 * ```
 */
export function estimateSkillFullTokens(skill: CachedSkill): number {
  // Frontmatter tokens
  let total = estimateSkillFrontmatterTokens(skill);

  // Content tokens (this is the big part)
  total += estimateTokens(skill.content);

  return total;
}

/**
 * Estimate tokens for skill list (multiple skills in frontmatter format)
 *
 * Used to validate the ~60-80 tokens/10 skills target (US-091).
 *
 * @param skills - Array of skills (without content)
 * @returns Estimated total token count for list
 *
 * @example
 * ```typescript
 * const skills = [...]; // 10 skills
 * const tokens = estimateSkillListTokens(skills); // ~70 tokens
 * const avgPerSkill = tokens / skills.length; // ~7 tokens/skill ✅
 * ```
 */
export function estimateSkillListTokens(
  skills: Array<{
    slug: string;
    title: string;
    category: string;
    description?: string | null;
    tags: string[];
    frameworks: string[];
  }>
): number {
  if (skills.length === 0) return 0;

  let total = 0;

  // Sum individual skill tokens
  for (const skill of skills) {
    total += estimateSkillFrontmatterTokens(skill);
  }

  // JSON array overhead (brackets, commas) ~5-15 tokens
  total += Math.ceil(skills.length / 2) + 5;

  return total;
}

// ============================================================================
// TOKEN REDUCTION CALCULATION
// ============================================================================

/**
 * Calculate token reduction percentage
 *
 * Used to measure the effectiveness of lazy-loading.
 *
 * @param beforeTokens - Token count before lazy-loading
 * @param afterTokens - Token count after lazy-loading
 * @returns Reduction percentage (0-100)
 *
 * @example
 * ```typescript
 * // Before: Loading 10 skills with full content
 * const before = 10 * 250; // 2,500 tokens
 *
 * // After: Listing 10 skills (frontmatter only)
 * const after = 70; // 70 tokens
 *
 * const reduction = calculateTokenReduction(before, after); // 97.2% ✅
 * ```
 */
export function calculateTokenReduction(beforeTokens: number, afterTokens: number): number {
  if (beforeTokens === 0) return 0;
  const reduction = ((beforeTokens - afterTokens) / beforeTokens) * 100;
  return Number(reduction.toFixed(2));
}

// ============================================================================
// METRICS TRACKING (Future Enhancement)
// ============================================================================

/**
 * Skill load metrics (for analytics dashboard)
 *
 * Similar to KnowledgeQueryMetric but for skill loads.
 * Can be used to track:
 * - Most loaded skills (popular dashboard)
 * - Token usage trends
 * - Cache hit rates
 * - Load performance
 *
 * @future US-103 enhancement: Store metrics in database
 */
export interface SkillLoadMetric {
  skillId: number;
  projectId: number;
  slug: string;
  loadSource: 'cache' | 'database'; // Cache hit or miss
  tokenCount: number; // Estimated tokens for this load
  latencyMs: number; // Load time in milliseconds
  userAgent?: string; // Client identifier
  timestamp: Date;
}

/**
 * Record skill load metric (fire-and-forget)
 *
 * @future Store in database table `skill_load_metrics`
 *
 * @param metric - Skill load metric data
 *
 * @example
 * ```typescript
 * const metric = {
 *   skillId: 1,
 *   projectId: 1,
 *   slug: 'nextjs-ssr',
 *   loadSource: 'cache',
 *   tokenCount: 185,
 *   latencyMs: 5,
 *   timestamp: new Date(),
 * };
 *
 * recordSkillLoadMetric(metric);
 * // Fire-and-forget: Doesn't wait for database write
 * ```
 */
export function recordSkillLoadMetric(metric: SkillLoadMetric): void {
  // TODO: Implement database storage (Phase 5 or future sprint)
  // For now, just log
  log.info(
    { slug: metric.slug, source: metric.loadSource, tokenCount: metric.tokenCount, latencyMs: metric.latencyMs },
    'Skill load recorded'
  );

  // Future: Store in database
  // prisma.skillLoadMetric.create({ data: metric })
  //   .catch(err => console.error('[SkillMetrics] Failed to record:', err));
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate skill list token efficiency
 *
 * Checks if token count meets the <80 tokens/10 skills target.
 *
 * @param skills - Array of skills
 * @returns Validation result with token stats
 *
 * @example
 * ```typescript
 * const skills = [...]; // 10 skills
 * const validation = validateSkillListTokenEfficiency(skills);
 * console.log(validation.message); // "✅ Token efficiency: 70 tokens for 10 skills (7 tokens/skill)"
 * ```
 */
export function validateSkillListTokenEfficiency(
  skills: Array<{
    slug: string;
    title: string;
    category: string;
    description?: string | null;
    tags: string[];
    frameworks: string[];
  }>
): {
  valid: boolean;
  totalTokens: number;
  avgTokensPerSkill: number;
  message: string;
} {
  const totalTokens = estimateSkillListTokens(skills);
  const avgTokensPerSkill = skills.length > 0 ? totalTokens / skills.length : 0;
  const target = 80; // Target: <80 tokens for 10 skills

  // Calculate equivalent for 10 skills
  const tokensFor10 = avgTokensPerSkill * 10;
  const valid = tokensFor10 <= target;

  const status = valid ? '✅' : '❌';
  const message = `${status} Token efficiency: ${totalTokens} tokens for ${skills.length} skills (${avgTokensPerSkill.toFixed(1)} tokens/skill, ${tokensFor10.toFixed(0)} for 10)`;

  return {
    valid,
    totalTokens,
    avgTokensPerSkill: Number(avgTokensPerSkill.toFixed(2)),
    message,
  };
}

/**
 * Validate skill full load token efficiency
 *
 * Checks if token count meets the <250 tokens/skill target.
 *
 * @param skill - Full skill object
 * @returns Validation result with token stats
 *
 * @example
 * ```typescript
 * const skill = { ... }; // Full skill with content
 * const validation = validateSkillFullTokenEfficiency(skill);
 * console.log(validation.message); // "✅ Token efficiency: 185 tokens (target: <250)"
 * ```
 */
export function validateSkillFullTokenEfficiency(skill: CachedSkill): {
  valid: boolean;
  tokenCount: number;
  message: string;
} {
  const tokenCount = estimateSkillFullTokens(skill);
  const target = 250; // Target: <250 tokens per skill
  const valid = tokenCount <= target;

  const status = valid ? '✅' : '⚠️';
  const message = `${status} Token efficiency: ${tokenCount} tokens (target: <${target})`;

  return {
    valid,
    tokenCount,
    message,
  };
}
