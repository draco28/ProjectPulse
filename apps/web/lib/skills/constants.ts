/**
 * Skill System Constants
 *
 * Sprint 6 - US-096: Categorize skills
 * Created: 2025-11-13
 *
 * Defines skill categories, constraints, and configuration for lazy-loading system.
 * Categories are extensible String constants (not enums) per Prisma Expert recommendation.
 */

// ============================================================================
// SKILL CATEGORIES (US-096)
// ============================================================================

/**
 * Core skill categories (extensible - can add custom categories)
 *
 * **Built-in categories**:
 * - `framework`: Framework-specific patterns (Next.js, React, Prisma, etc.)
 * - `testing`: Testing strategies, patterns, and utilities
 * - `workflow`: Development workflows, SOPs, and processes
 * - `troubleshooting`: Debugging guides, error solutions, and fixes
 *
 * **Extensibility**:
 * End users can create custom categories by simply using a new category string.
 * No migration required - database uses String type.
 *
 * @example
 * ```typescript
 * // Use built-in category
 * const skill = { category: SKILL_CATEGORIES.FRAMEWORK };
 *
 * // Use custom category (extensible)
 * const customSkill = { category: 'deployment' };
 * ```
 */
export const SKILL_CATEGORIES = {
  FRAMEWORK: 'framework',
  TESTING: 'testing',
  WORKFLOW: 'workflow',
  TROUBLESHOOTING: 'troubleshooting',
} as const;

/**
 * Array of built-in category values (for validation suggestions)
 */
export const BUILT_IN_CATEGORIES = Object.values(SKILL_CATEGORIES);

/**
 * Category metadata (for UI display and filtering)
 */
export const CATEGORY_METADATA = {
  [SKILL_CATEGORIES.FRAMEWORK]: {
    label: 'Framework',
    description: 'Framework-specific patterns and conventions',
    icon: '🛠️',
    color: 'blue',
  },
  [SKILL_CATEGORIES.TESTING]: {
    label: 'Testing',
    description: 'Testing strategies, patterns, and utilities',
    icon: '✅',
    color: 'green',
  },
  [SKILL_CATEGORIES.WORKFLOW]: {
    label: 'Workflow',
    description: 'Development workflows, SOPs, and processes',
    icon: '🔄',
    color: 'purple',
  },
  [SKILL_CATEGORIES.TROUBLESHOOTING]: {
    label: 'Troubleshooting',
    description: 'Debugging guides, error solutions, and fixes',
    icon: '🔧',
    color: 'red',
  },
} as const;

// ============================================================================
// SKILL CONSTRAINTS & LIMITS
// ============================================================================

/**
 * Skill content and metadata constraints (aligned with Prisma schema)
 */
export const SKILL_CONSTRAINTS = {
  // Title and slug
  SLUG_MIN_LENGTH: 1,
  SLUG_MAX_LENGTH: 100,
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,

  // Content
  CONTENT_MIN_LENGTH: 10, // At least 10 characters (not empty)
  CONTENT_MAX_LENGTH: 50000, // ~12,500 tokens (generous for complex skills)

  // Metadata
  CATEGORY_MIN_LENGTH: 1,
  CATEGORY_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500, // Short summary

  // Arrays
  TAGS_MIN_ITEMS: 0,
  TAGS_MAX_ITEMS: 20, // Same as knowledge items
  TAG_MIN_LENGTH: 1,
  TAG_MAX_LENGTH: 50,

  FRAMEWORKS_MIN_ITEMS: 0,
  FRAMEWORKS_MAX_ITEMS: 10, // Typically 1-3 frameworks per skill
  FRAMEWORK_MIN_LENGTH: 1,
  FRAMEWORK_MAX_LENGTH: 50,

  // Batch operations
  IMPORT_MAX_FILES: 50, // Max files per batch import
  EXPORT_MAX_SKILLS: 1000, // Max skills per export

  // Slug pattern (URL-safe)
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // kebab-case only
} as const;

// ============================================================================
// TOKEN EFFICIENCY TARGETS (Sprint 6 Goals)
// ============================================================================

/**
 * Token usage targets for lazy-loading system (92% reduction goal)
 *
 * **Before lazy-loading**:
 * - Loading 10 skills with full content: ~2,500 tokens
 *
 * **After lazy-loading** (US-091, US-092):
 * - List 10 skills (frontmatter only): ~60-80 tokens
 * - Load 1 full skill: ~180-230 tokens
 * - Total for selective loading: ~240-310 tokens (90-92% reduction) ✅
 */
export const TOKEN_TARGETS = {
  // List view (frontmatter only - US-091)
  LIST_10_SKILLS_MAX_TOKENS: 80, // ~60-80 tokens for 10 skills
  LIST_1_SKILL_AVG_TOKENS: 7, // Average per skill in list (title, category, tags, description)

  // Load view (full content - US-092)
  LOAD_1_SKILL_MAX_TOKENS: 250, // ~180-230 tokens for full skill
  LOAD_CONTENT_AVG_TOKENS: 180, // Average content size

  // Reduction target
  REDUCTION_TARGET_PERCENT: 92, // 92% reduction from 2,500 → 220 tokens
} as const;

// ============================================================================
// LRU CACHE CONFIGURATION (US-094)
// ============================================================================

/**
 * LRU cache settings for auto-unload functionality
 *
 * Skills are cached after loading and automatically evicted after TTL expires.
 * This reduces database queries while maintaining token efficiency.
 *
 * **Migration path**:
 * - Phase 1: In-memory Map-based cache (current)
 * - Phase 2: Redis cache for multi-instance deployments (future)
 */
export const CACHE_CONFIG = {
  // Auto-unload TTL (US-094)
  TTL_SECONDS: 300, // 5 minutes
  TTL_MS: 300000, // 5 minutes in milliseconds

  // Cache size limits
  MAX_ENTRIES: 100, // Max skills in cache (prevent memory bloat)
  MAX_ENTRY_SIZE_KB: 100, // Max size per cached skill (~25K tokens)

  // Cleanup interval
  CLEANUP_INTERVAL_MS: 60000, // Check for expired entries every 1 minute
} as const;

// ============================================================================
// POPULAR SKILLS CONFIGURATION (US-103)
// ============================================================================

/**
 * Configuration for popular skills dashboard (usage tracking)
 */
export const POPULAR_CONFIG = {
  // Top N skills to show
  TOP_SKILLS_COUNT: 10,

  // Time window for popularity calculation
  RECENT_DAYS: 30, // Skills loaded in last 30 days

  // Minimum usage threshold
  MIN_USAGE_COUNT: 2, // Must be loaded at least twice to appear
} as const;

// ============================================================================
// EXPORT/IMPORT FORMATS (US-101, US-102)
// ============================================================================

/**
 * Markdown frontmatter format for skill export/import
 *
 * @example
 * ```markdown
 * ---
 * title: Next.js Server Components
 * slug: nextjs-server-components
 * category: framework
 * description: Patterns for using React Server Components in Next.js 14+
 * tags: [nextjs, react, server-components]
 * frameworks: [Next.js 14, React 18]
 * ---
 *
 * # Next.js Server Components
 *
 * ## Overview
 * Server Components allow you to...
 * ```
 */
export const FRONTMATTER_FIELDS = [
  'title',
  'slug',
  'category',
  'description',
  'tags',
  'frameworks',
] as const;

/**
 * Required frontmatter fields (validation)
 */
export const REQUIRED_FRONTMATTER_FIELDS = ['title', 'slug', 'category'] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a category is a built-in category
 */
export function isBuiltInCategory(category: string): boolean {
  return (BUILT_IN_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Validate slug format (kebab-case, lowercase, alphanumeric + hyphens)
 *
 * @example
 * ```typescript
 * isValidSlug('nextjs-server-components'); // true
 * isValidSlug('Next.js Server Components'); // false (spaces, uppercase, dots)
 * isValidSlug('nextjs_server_components'); // false (underscore)
 * ```
 */
export function isValidSlug(slug: string): boolean {
  return SKILL_CONSTRAINTS.SLUG_PATTERN.test(slug);
}

/**
 * Generate slug from title (kebab-case conversion)
 *
 * @example
 * ```typescript
 * generateSlugFromTitle('Next.js Server Components'); // 'nextjs-server-components'
 * generateSlugFromTitle('API Testing with Playwright'); // 'api-testing-with-playwright'
 * ```
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get category metadata (with fallback for custom categories)
 */
export function getCategoryMetadata(category: string) {
  return (
    CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA] || {
      label: category.charAt(0).toUpperCase() + category.slice(1),
      description: `Custom category: ${category}`,
      icon: '📦',
      color: 'gray',
    }
  );
}
