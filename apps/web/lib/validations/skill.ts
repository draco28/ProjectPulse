/**
 * Skill Validation Schemas
 *
 * Sprint 6 - US-097: Validate skill frontmatter format
 * Created: 2025-11-13
 *
 * Zod schemas for validating skill creation, updates, and YAML frontmatter parsing.
 * Used in conjunction with gray-matter for markdown import/export (US-101, US-102).
 */

import { z } from 'zod';
import {
  SKILL_CONSTRAINTS,
  SKILL_CATEGORIES,
  isBuiltInCategory,
  isValidSlug,
} from '../skills/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Validations:Skill' });

// ============================================================================
// BASE SCHEMAS (Reusable field validators)
// ============================================================================

/**
 * Slug validation
 *
 * Rules:
 * - Lowercase, alphanumeric + hyphens only (kebab-case)
 * - 1-100 characters
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 *
 * @example
 * ```typescript
 * slugSchema.parse('nextjs-server-components'); // ✅
 * slugSchema.parse('Next.js Components'); // ❌ (uppercase, spaces, dots)
 * ```
 */
const slugSchema = z
  .string()
  .min(SKILL_CONSTRAINTS.SLUG_MIN_LENGTH, 'Slug must be at least 1 character')
  .max(SKILL_CONSTRAINTS.SLUG_MAX_LENGTH, 'Slug must be at most 100 characters')
  .regex(
    SKILL_CONSTRAINTS.SLUG_PATTERN,
    'Slug must be kebab-case (lowercase, alphanumeric, hyphens only)'
  )
  .refine(
    (slug) => isValidSlug(slug),
    'Invalid slug format (use kebab-case: lowercase, hyphens only)'
  );

/**
 * Title validation
 */
const titleSchema = z
  .string()
  .min(SKILL_CONSTRAINTS.TITLE_MIN_LENGTH, 'Title must be at least 1 character')
  .max(SKILL_CONSTRAINTS.TITLE_MAX_LENGTH, 'Title must be at most 200 characters')
  .trim();

/**
 * Category validation (extensible - allows custom categories)
 *
 * Built-in categories:
 * - framework
 * - testing
 * - workflow
 * - troubleshooting
 *
 * Custom categories are allowed (extensible per Prisma Expert recommendation).
 */
const categorySchema = z
  .string()
  .min(SKILL_CONSTRAINTS.CATEGORY_MIN_LENGTH, 'Category must be at least 1 character')
  .max(SKILL_CONSTRAINTS.CATEGORY_MAX_LENGTH, 'Category must be at most 50 characters')
  .trim()
  .refine(
    (cat) => {
      // Allow any string, but warn if not built-in
      if (!isBuiltInCategory(cat)) {
        log.warn(
          { category: cat, builtInCategories: Object.values(SKILL_CATEGORIES) },
          'Custom category detected'
        );
      }
      return true;
    },
    { message: 'Invalid category format' }
  );

/**
 * Content validation (markdown body)
 */
const contentSchema = z
  .string()
  .min(SKILL_CONSTRAINTS.CONTENT_MIN_LENGTH, 'Content must be at least 10 characters')
  .max(SKILL_CONSTRAINTS.CONTENT_MAX_LENGTH, 'Content must be at most 50,000 characters')
  .trim();

/**
 * Description validation (optional short summary)
 */
const descriptionSchema = z
  .string()
  .max(SKILL_CONSTRAINTS.DESCRIPTION_MAX_LENGTH, 'Description must be at most 500 characters')
  .trim()
  .optional();

/**
 * Tags array validation
 */
const tagsSchema = z
  .array(
    z.string().min(SKILL_CONSTRAINTS.TAG_MIN_LENGTH).max(SKILL_CONSTRAINTS.TAG_MAX_LENGTH).trim()
  )
  .min(SKILL_CONSTRAINTS.TAGS_MIN_ITEMS)
  .max(SKILL_CONSTRAINTS.TAGS_MAX_ITEMS, 'Maximum 20 tags allowed')
  .default([]);

/**
 * Frameworks array validation
 */
const frameworksSchema = z
  .array(
    z
      .string()
      .min(SKILL_CONSTRAINTS.FRAMEWORK_MIN_LENGTH)
      .max(SKILL_CONSTRAINTS.FRAMEWORK_MAX_LENGTH)
      .trim()
  )
  .min(SKILL_CONSTRAINTS.FRAMEWORKS_MIN_ITEMS)
  .max(SKILL_CONSTRAINTS.FRAMEWORKS_MAX_ITEMS, 'Maximum 10 frameworks allowed')
  .default([]);

// ============================================================================
// CREATE SKILL SCHEMA (US-095)
// ============================================================================

/**
 * Schema for creating a new skill (POST /api/skills)
 *
 * **Required fields**:
 * - projectId: Integer (multi-tenancy scoping)
 * - slug: String (kebab-case, unique per project)
 * - title: String (1-200 chars)
 * - content: String (markdown, 10-50000 chars)
 * - category: String (built-in or custom)
 *
 * **Optional fields**:
 * - description: String (short summary, max 500 chars)
 * - tags: String[] (0-20 items, for search)
 * - frameworks: String[] (0-10 items, for filtering)
 *
 * @example
 * ```typescript
 * const input = {
 *   projectId: 1,
 *   slug: 'nextjs-server-components',
 *   title: 'Next.js Server Components',
 *   content: '# Overview\nServer Components allow you to...',
 *   category: 'framework',
 *   description: 'Patterns for using React Server Components',
 *   tags: ['nextjs', 'react', 'server-components'],
 *   frameworks: ['Next.js 14', 'React 18'],
 * };
 *
 * const validated = createSkillSchema.parse(input);
 * ```
 */
export const createSkillSchema = z.object({
  projectId: z.number().int().positive('Project ID must be a positive integer'),
  slug: slugSchema,
  title: titleSchema,
  content: contentSchema,
  category: categorySchema,
  description: descriptionSchema,
  tags: tagsSchema,
  frameworks: frameworksSchema,
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;

// ============================================================================
// UPDATE SKILL SCHEMA (US-099)
// ============================================================================

/**
 * Schema for updating an existing skill (PATCH /api/skills/[slug])
 *
 * All fields are optional (partial update support).
 * slug cannot be updated (use DELETE + POST to change slug).
 *
 * @example
 * ```typescript
 * // Update only content and tags
 * const update = {
 *   content: '# Updated content...',
 *   tags: ['nextjs', 'react', 'performance'],
 * };
 *
 * const validated = updateSkillSchema.parse(update);
 * ```
 */
export const updateSkillSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    category: categorySchema.optional(),
    description: descriptionSchema.optional(),
    tags: tagsSchema.optional(),
    frameworks: frameworksSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update');

export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

// ============================================================================
// FRONTMATTER SCHEMA (US-102: Import from Markdown)
// ============================================================================

/**
 * Schema for validating YAML frontmatter from imported markdown files
 *
 * This schema is used with gray-matter to parse skill markdown files:
 *
 * ```markdown
 * ---
 * title: Next.js Server Components
 * slug: nextjs-server-components
 * category: framework
 * description: Patterns for using React Server Components
 * tags: [nextjs, react, server-components]
 * frameworks: [Next.js 14, React 18]
 * ---
 *
 * # Content here...
 * ```
 *
 * **Process**:
 * 1. gray-matter parses YAML frontmatter → JavaScript object
 * 2. skillFrontmatterSchema validates parsed object
 * 3. Combine frontmatter + markdown content → createSkillSchema
 * 4. Insert into database
 *
 * @example
 * ```typescript
 * import matter from 'gray-matter';
 *
 * const markdown = `---
 * title: My Skill
 * slug: my-skill
 * category: framework
 * tags: [react, hooks]
 * ---
 * # Content...`;
 *
 * const { data: frontmatter, content } = matter(markdown);
 * const validated = skillFrontmatterSchema.parse(frontmatter);
 * ```
 */
export const skillFrontmatterSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  category: categorySchema,
  description: descriptionSchema,
  tags: tagsSchema,
  frameworks: frameworksSchema,
});

export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;

// ============================================================================
// SEARCH FILTERS SCHEMA (US-093)
// ============================================================================

/**
 * Schema for skill search query parameters
 *
 * @example
 * ```typescript
 * // Search: GET /api/skills/search?query=react&tags=hooks,performance&category=framework
 * const params = {
 *   query: 'react',
 *   tags: ['hooks', 'performance'],
 *   category: 'framework',
 *   frameworks: ['Next.js'],
 *   limit: 10,
 * };
 *
 * const validated = skillSearchSchema.parse(params);
 * ```
 */
export const skillSearchSchema = z.object({
  // Full-text search query (title, description, tags)
  query: z.string().min(1).max(200).trim().optional(),

  // Exact filters
  category: categorySchema.optional(),
  tags: z.array(z.string().trim()).max(10).optional(), // Filter by tags (AND logic)
  frameworks: z.array(z.string().trim()).max(5).optional(), // Filter by frameworks (AND logic)

  // Pagination
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0),

  // Sorting
  sortBy: z
    .enum(['title', 'usageCount', 'lastLoadedAt', 'createdAt', 'updatedAt'])
    .default('title'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SkillSearchInput = z.infer<typeof skillSearchSchema>;

// ============================================================================
// IMPORT BATCH SCHEMA (US-102)
// ============================================================================

/**
 * Schema for batch import from markdown files
 *
 * @example
 * ```typescript
 * const batch = {
 *   projectId: 1,
 *   files: [
 *     { filename: 'nextjs-ssr.md', content: '---\ntitle: SSR...' },
 *     { filename: 'react-hooks.md', content: '---\ntitle: Hooks...' },
 *   ],
 *   overwriteExisting: false,
 * };
 *
 * const validated = skillImportBatchSchema.parse(batch);
 * ```
 */
export const skillImportBatchSchema = z.object({
  projectId: z.number().int().positive(),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(255).regex(/\.md$/, 'File must be a .md file'),
        content: z.string().min(10), // YAML frontmatter + markdown content
      })
    )
    .min(1, 'At least one file required')
    .max(
      SKILL_CONSTRAINTS.IMPORT_MAX_FILES,
      `Maximum ${SKILL_CONSTRAINTS.IMPORT_MAX_FILES} files per batch`
    ),
  overwriteExisting: z.boolean().default(false), // Skip duplicate slugs by default
});

export type SkillImportBatchInput = z.infer<typeof skillImportBatchSchema>;

// ============================================================================
// EXPORT FILTERS SCHEMA (US-101)
// ============================================================================

/**
 * Schema for skill export query parameters
 *
 * @example
 * ```typescript
 * // Export: GET /api/skills/export?category=framework&slugs=nextjs-ssr,react-hooks
 * const params = {
 *   projectId: 1,
 *   slugs: ['nextjs-ssr', 'react-hooks'],
 *   category: 'framework',
 * };
 *
 * const validated = skillExportSchema.parse(params);
 * ```
 */
export const skillExportSchema = z.object({
  projectId: z.number().int().positive(),

  // Filters (export all if none specified)
  slugs: z.array(slugSchema).max(100).optional(), // Export specific skills
  category: categorySchema.optional(),
  tags: z.array(z.string().trim()).max(10).optional(),
  frameworks: z.array(z.string().trim()).max(5).optional(),

  // Date range
  since: z.string().datetime().optional(), // Export skills created/updated after this date

  // Limit (prevent massive exports)
  limit: z.number().int().min(1).max(SKILL_CONSTRAINTS.EXPORT_MAX_SKILLS).optional(),
});

export type SkillExportInput = z.infer<typeof skillExportSchema>;

// ============================================================================
// LINK SKILL TO KNOWLEDGE SCHEMA (US-104)
// ============================================================================

/**
 * Schema for linking a skill to a knowledge item
 *
 * @example
 * ```typescript
 * const link = {
 *   projectId: 1,
 *   skillSlug: 'nextjs-ssr',
 *   knowledgeItemId: 42,
 * };
 *
 * const validated = skillKnowledgeLinkSchema.parse(link);
 * ```
 */
export const skillKnowledgeLinkSchema = z.object({
  projectId: z.number().int().positive(),
  skillSlug: slugSchema,
  knowledgeItemId: z.number().int().positive(),
});

export type SkillKnowledgeLinkInput = z.infer<typeof skillKnowledgeLinkSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate slug format without full schema (for quick checks)
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  try {
    slugSchema.parse(slug);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message };
    }
    return { valid: false, error: 'Invalid slug format' };
  }
}

/**
 * Sanitize skill input (trim whitespace, normalize arrays)
 */
export function sanitizeSkillInput(input: Partial<CreateSkillInput>): Partial<CreateSkillInput> {
  return {
    ...input,
    title: input.title?.trim(),
    content: input.content?.trim(),
    category: input.category?.trim(),
    description: input.description?.trim(),
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) || [],
    frameworks: input.frameworks?.map((fw) => fw.trim()).filter(Boolean) || [],
  };
}
