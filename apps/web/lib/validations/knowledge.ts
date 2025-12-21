/**
 * Zod validation schemas for knowledge endpoints
 */

import { z } from 'zod';

/**
 * Schema for creating a knowledge item
 */
export const createKnowledgeItemSchema = z.object({
  projectId: z.coerce.number().int().positive('Project ID must be a positive integer'),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),

  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be 50,000 characters or less')
    .trim(),

  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be 50 characters or less')
    .trim(),

  tags: z.array(z.string().trim()).min(0).max(20, 'Maximum 20 tags allowed').default([]),
});

export type CreateKnowledgeItemInput = z.infer<typeof createKnowledgeItemSchema>;

/**
 * Schema for searching knowledge items
 */
export const searchKnowledgeSchema = z.object({
  projectId: z.coerce.number().int().positive('Project ID must be a positive integer'),

  query: z
    .string()
    .min(1, 'Search query is required')
    .max(1000, 'Query must be 1,000 characters or less')
    .trim(),

  mode: z.enum(['semantic', 'fulltext', 'hybrid']).default('hybrid'),

  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must be 50 or less')
    .default(5),

  includeRelated: z.coerce.boolean().default(false),

  category: z.string().max(50).optional(),
});

export type SearchKnowledgeInput = z.infer<typeof searchKnowledgeSchema>;

/**
 * Schema for updating a knowledge item
 */
export const updateKnowledgeItemSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or less')
      .trim()
      .optional(),

    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .max(50000, 'Content must be 50,000 characters or less')
      .trim()
      .optional(),

    category: z
      .string()
      .min(1, 'Category is required')
      .max(50, 'Category must be 50 characters or less')
      .trim()
      .optional(),

    tags: z.array(z.string().trim()).min(0).max(20, 'Maximum 20 tags allowed').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateKnowledgeItemInput = z.infer<typeof updateKnowledgeItemSchema>;
