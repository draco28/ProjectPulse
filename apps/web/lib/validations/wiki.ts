import { z } from 'zod';

// Wiki page categories
export const wikiCategories = [
  'getting-started',
  'guides',
  'reference',
  'troubleshooting',
] as const;

export type WikiCategory = (typeof wikiCategories)[number];

/**
 * Validation schema for creating a new wiki page
 *
 * @see US-018: Wiki Editor UI
 * @see POST /api/wiki
 */
export const createWikiPageSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),

  path: z
    .string()
    .min(3, 'Path must be at least 3 characters')
    .max(100, 'Path must be less than 100 characters')
    .regex(
      /^[\/]?[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Path must be lowercase letters, numbers, and hyphens only'
    )
    .trim(),
    // Note: Path normalization (remove leading slash) happens in API route

  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),

  category: z.enum(wikiCategories, {
    errorMap: () => ({ message: 'Invalid category' }),
  }),

  excerpt: z
    .string()
    .max(200, 'Excerpt must be less than 200 characters')
    .optional(),

  parentPath: z.string().optional(),
});

/**
 * Validation schema for updating an existing wiki page
 * All fields are optional except slug (used to identify the page)
 *
 * @see US-018: Wiki Editor UI
 * @see PATCH /api/wiki/[slug]
 */
export const updateWikiPageSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .optional(),

  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters')
    .optional(),

  category: z
    .enum(wikiCategories, {
      errorMap: () => ({ message: 'Invalid category' }),
    })
    .optional(),

  excerpt: z
    .string()
    .max(200, 'Excerpt must be less than 200 characters')
    .optional(),

  parentPath: z.string().optional(),

  // Note: slug cannot be changed after creation to maintain stable URLs
});

/**
 * Validation schema for wiki search
 *
 * @see US-021: wiki.search MCP tool
 * @see POST /api/wiki/search
 */
export const wikiSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters')
    .trim(),

  category: z.enum(wikiCategories).optional(),

  limit: z.number().int().min(1).max(50).default(10),

  offset: z.number().int().min(0).default(0),
});

/**
 * Validation schema for path uniqueness check
 * Used for async validation in the editor form
 *
 * @see GET /api/wiki/validate-path
 */
export const validatePathSchema = z.object({
  path: z
    .string()
    .min(3, 'Path must be at least 3 characters')
    .regex(
      /^[\/]?[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Path must be lowercase letters, numbers, and hyphens only'
    )
    .trim(),
    // Note: Path normalization happens in API route

  excludeId: z.string().optional(), // Exclude current page ID when editing
});

// TypeScript types inferred from Zod schemas
export type CreateWikiPageInput = z.infer<typeof createWikiPageSchema>;
export type UpdateWikiPageInput = z.infer<typeof updateWikiPageSchema>;
export type WikiSearchInput = z.infer<typeof wikiSearchSchema>;
export type ValidatePathInput = z.infer<typeof validatePathSchema>;

/**
 * Helper function to normalize path (remove leading slash)
 * Used in API routes to ensure consistent DB storage
 *
 * @param path - The wiki page path (may or may not have leading slash)
 * @returns Path without leading slash
 */
export function normalizePath(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

/**
 * Helper function to generate path from title
 * Used for auto-path generation in the editor
 * Note: Returns path WITHOUT leading slash (normalized)
 *
 * @param title - The wiki page title
 * @returns A URL-safe path (no leading slash)
 *
 * @example
 * generatePath('Getting Started with Next.js') // 'getting-started-with-nextjs'
 */
export function generatePath(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
