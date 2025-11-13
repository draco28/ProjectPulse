/**
 * MCP Skills Tool Handlers
 *
 * Sprint 6 - Phase 3: Skills API & MCP Tools
 * Created: 2025-11-13
 *
 * Implements MCP (Model Context Protocol) tools for Skills lazy-loading system.
 * Enables AI coding agents to list, load, search, and manage skills with token efficiency.
 *
 * **Tool Summary**:
 * 1. skill.list (US-091) - List skills with frontmatter only (~60-80 tokens/10 skills)
 * 2. skill.load (US-092) - Load full skill content on-demand (~180-230 tokens)
 * 3. skill.search (US-093) - Search skills by keywords/tags
 * 4. skill.update (US-099) - Update skill content
 * 5. skill.delete (US-100) - Delete skill
 * 6. skill.export (US-101) - Export skills to markdown
 * 7. skill.import (US-102) - Import skills from markdown
 * 8. skill.linkKnowledge (US-104) - Link skill to knowledge item
 *
 * @see /app/api/skills/* - REST API endpoints
 * @see /lib/validations/skill.ts - Zod validation schemas
 */

import { z } from 'zod';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * skill.list input schema
 */
const skillListInputSchema = z.object({
  projectId: z.number().int().positive(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  frameworks: z.array(z.string()).max(5).optional(),
  sortBy: z.enum(['title', 'usageCount', 'lastLoadedAt', 'createdAt', 'updatedAt']).default('title'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

/**
 * skill.load input schema
 */
const skillLoadInputSchema = z.object({
  projectId: z.number().int().positive(),
  slug: z.string().min(1).max(100),
  incrementUsage: z.boolean().default(true), // Track usage (US-103)
});

/**
 * skill.search input schema
 */
const skillSearchInputSchema = z.object({
  projectId: z.number().int().positive(),
  query: z.string().min(1).max(200),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  frameworks: z.array(z.string()).max(5).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

/**
 * skill.update input schema
 */
const skillUpdateInputSchema = z.object({
  projectId: z.number().int().positive(),
  slug: z.string().min(1).max(100),
  updates: z
    .object({
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(10).max(50000).optional(),
      category: z.string().min(1).max(50).optional(),
      description: z.string().max(500).optional(),
      tags: z.array(z.string()).max(20).optional(),
      frameworks: z.array(z.string()).max(10).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided'),
});

/**
 * skill.delete input schema
 */
const skillDeleteInputSchema = z.object({
  projectId: z.number().int().positive(),
  slug: z.string().min(1).max(100),
});

/**
 * skill.export input schema
 */
const skillExportInputSchema = z.object({
  projectId: z.number().int().positive(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  frameworks: z.array(z.string()).max(5).optional(),
});

/**
 * skill.import input schema
 */
const skillImportInputSchema = z.object({
  projectId: z.number().int().positive(),
  files: z.array(
    z.object({
      filename: z.string(),
      content: z.string(),
    })
  ).min(1).max(50),
  overwriteExisting: z.boolean().default(false),
});

/**
 * skill.linkKnowledge input schema
 */
const skillLinkKnowledgeInputSchema = z.object({
  projectId: z.number().int().positive(),
  skillSlug: z.string().min(1).max(100),
  knowledgeItemId: z.number().int().positive(),
  action: z.enum(['link', 'unlink']).default('link'),
});

// ============================================================================
// TOOL HANDLERS
// ============================================================================

/**
 * skill.list - List skills with frontmatter only (US-091)
 *
 * Lists all skills for a project excluding content field.
 * Token efficiency: ~60-80 tokens for 10 skills (92% reduction).
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   category?: 'framework',
 *   tags?: ['react', 'hooks'],
 *   frameworks?: ['Next.js'],
 *   sortBy?: 'usageCount',
 *   sortOrder?: 'desc',
 *   page?: 1,
 *   limit?: 10
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   skills: [
 *     {
 *       id: 1,
 *       slug: 'nextjs-server-components',
 *       title: 'Next.js Server Components',
 *       category: 'framework',
 *       description: 'Patterns for using...',
 *       tags: ['nextjs', 'react'],
 *       frameworks: ['Next.js 14'],
 *       usageCount: 5,
 *       lastLoadedAt: '2025-11-13T14:30:00.000Z',
 *       createdAt: '2025-11-13T10:00:00.000Z',
 *       updatedAt: '2025-11-13T14:30:00.000Z'
 *     }
 *   ],
 *   pagination: {
 *     page: 1,
 *     limit: 10,
 *     total: 42,
 *     totalPages: 5,
 *     hasMore: true
 *   }
 * }
 * ```
 *
 * @throws MCPError if validation fails or API call fails
 */
export async function skillListHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillListInputSchema.parse(input);

    // Build query params
    const params = new URLSearchParams({
      projectId: validated.projectId.toString(),
      page: validated.page.toString(),
      limit: validated.limit.toString(),
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
    });

    if (validated.category) {
      params.append('category', validated.category);
    }

    if (validated.tags && validated.tags.length > 0) {
      params.append('tags', validated.tags.join(','));
    }

    if (validated.frameworks && validated.frameworks.length > 0) {
      params.append('frameworks', validated.frameworks.join(','));
    }

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to list skills',
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to list skills: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.load - Load full skill content on-demand (US-092)
 *
 * Loads a single skill with full content field.
 * Token efficiency: ~180-230 tokens per skill.
 * Automatically increments usageCount and updates lastLoadedAt (US-103).
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   slug: 'nextjs-server-components',
 *   incrementUsage?: true // Track usage (default: true)
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   id: 1,
 *   slug: 'nextjs-server-components',
 *   title: 'Next.js Server Components',
 *   content: '# Overview\n\nServer Components allow you to...',
 *   category: 'framework',
 *   description: 'Patterns for using...',
 *   tags: ['nextjs', 'react', 'server-components'],
 *   frameworks: ['Next.js 14', 'React 18'],
 *   usageCount: 6, // Incremented
 *   lastLoadedAt: '2025-11-13T15:00:00.000Z', // Updated
 *   createdAt: '2025-11-13T10:00:00.000Z',
 *   updatedAt: '2025-11-13T15:00:00.000Z'
 * }
 * ```
 *
 * @throws MCPError if validation fails, skill not found, or API call fails
 */
export async function skillLoadHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillLoadInputSchema.parse(input);

    // Build query params
    const params = new URLSearchParams({
      projectId: validated.projectId.toString(),
      incrementUsage: validated.incrementUsage.toString(),
    });

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills/${validated.slug}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to load skill',
        error.code === 'SKILL_NOT_FOUND' ? JSONRPC_ERROR_CODES.METHOD_NOT_FOUND : JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to load skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.search - Search skills by keywords/tags (US-093)
 *
 * Full-text search across title, description, tags, and frameworks.
 * Returns frontmatter only (excludes content field).
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   query: 'react hooks',
 *   category?: 'framework',
 *   tags?: ['performance'],
 *   frameworks?: ['Next.js'],
 *   limit?: 10
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   results: [
 *     {
 *       id: 1,
 *       slug: 'react-custom-hooks',
 *       title: 'React Custom Hooks',
 *       category: 'framework',
 *       description: 'Patterns for creating...',
 *       tags: ['react', 'hooks', 'performance'],
 *       frameworks: ['React 18'],
 *       usageCount: 10,
 *       relevance: 0.95 // Search relevance score
 *     }
 *   ],
 *   count: 1,
 *   query: 'react hooks'
 * }
 * ```
 *
 * @throws MCPError if validation fails or API call fails
 */
export async function skillSearchHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillSearchInputSchema.parse(input);

    // Build query params
    const params = new URLSearchParams({
      projectId: validated.projectId.toString(),
      query: validated.query,
      limit: validated.limit.toString(),
    });

    if (validated.category) {
      params.append('category', validated.category);
    }

    if (validated.tags && validated.tags.length > 0) {
      params.append('tags', validated.tags.join(','));
    }

    if (validated.frameworks && validated.frameworks.length > 0) {
      params.append('frameworks', validated.frameworks.join(','));
    }

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to search skills',
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to search skills: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.update - Update skill content (US-099)
 *
 * Partial update of skill fields.
 * Invalidates cache automatically after update.
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   slug: 'nextjs-server-components',
 *   updates: {
 *     content: '# Updated content...',
 *     tags: ['nextjs', 'react', 'performance']
 *   }
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   id: 1,
 *   slug: 'nextjs-server-components',
 *   title: 'Next.js Server Components',
 *   content: '# Updated content...',
 *   // ... other fields
 *   updatedAt: '2025-11-13T16:00:00.000Z' // Updated timestamp
 * }
 * ```
 *
 * @throws MCPError if validation fails, skill not found, or API call fails
 */
export async function skillUpdateHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillUpdateInputSchema.parse(input);

    // Build query params
    const params = new URLSearchParams({
      projectId: validated.projectId.toString(),
    });

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills/${validated.slug}?${params.toString()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validated.updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to update skill',
        error.code === 'SKILL_NOT_FOUND'
          ? JSONRPC_ERROR_CODES.METHOD_NOT_FOUND
          : JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to update skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.delete - Delete skill (US-100)
 *
 * Permanently deletes skill and all associated links.
 * Cascade deletes skill-knowledge links.
 * Invalidates cache automatically after deletion.
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   slug: 'nextjs-server-components'
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   deleted: true,
 *   slug: 'nextjs-server-components',
 *   id: 1
 * }
 * ```
 *
 * @throws MCPError if validation fails, skill not found, or API call fails
 */
export async function skillDeleteHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillDeleteInputSchema.parse(input);

    // Build query params
    const params = new URLSearchParams({
      projectId: validated.projectId.toString(),
    });

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills/${validated.slug}?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to delete skill',
        error.code === 'SKILL_NOT_FOUND'
          ? JSONRPC_ERROR_CODES.METHOD_NOT_FOUND
          : JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to delete skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.export - Export skills to markdown ZIP (US-101)
 *
 * Exports skills as markdown files with YAML frontmatter in a ZIP archive.
 * Returns base64-encoded ZIP for easy transport.
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   category?: 'framework',
 *   tags?: ['react'],
 *   frameworks?: ['Next.js']
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   filename: 'skills-export-2025-11-13.zip',
 *   size: 15420, // bytes
 *   count: 5, // number of skills exported
 *   format: 'application/zip',
 *   data: 'UEsDBBQAAAAIABZ...' // base64-encoded ZIP
 * }
 * ```
 *
 * @throws MCPError if validation fails or API call fails
 */
export async function skillExportHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillExportInputSchema.parse(input);

    // Build query params
    const params = new URLSearchParams({
      projectId: validated.projectId.toString(),
    });

    if (validated.category) {
      params.append('category', validated.category);
    }

    if (validated.tags && validated.tags.length > 0) {
      params.append('tags', validated.tags.join(','));
    }

    if (validated.frameworks && validated.frameworks.length > 0) {
      params.append('frameworks', validated.frameworks.join(','));
    }

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to export skills',
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    // Get ZIP as ArrayBuffer
    const zipBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(zipBuffer).toString('base64');

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `skills-export-${new Date().toISOString().split('T')[0]}.zip`;

    return {
      filename,
      size: zipBuffer.byteLength,
      count: validated.tags?.length || validated.frameworks?.length ? undefined : undefined, // Unknown without parsing
      format: 'application/zip',
      data: base64Data,
    };
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to export skills: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.import - Import skills from markdown files (US-102)
 *
 * Batch imports skills from markdown files with YAML frontmatter.
 * Supports up to 50 files per batch with per-file error handling.
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   files: [
 *     {
 *       filename: 'nextjs-ssr.md',
 *       content: '---\ntitle: Next.js SSR\nslug: nextjs-ssr\n...\n---\n\n# Content...'
 *     }
 *   ],
 *   overwriteExisting: false
 * }
 * ```
 *
 * **Output**:
 * ```typescript
 * {
 *   imported: [
 *     { filename: 'nextjs-ssr.md', slug: 'nextjs-ssr', id: 1 }
 *   ],
 *   skipped: [
 *     { filename: 'react-hooks.md', reason: 'Slug already exists', existingId: 2 }
 *   ],
 *   errors: [
 *     { filename: 'invalid.md', error: 'Frontmatter validation failed', details: [...] }
 *   ],
 *   summary: {
 *     total: 3,
 *     imported: 1,
 *     skipped: 1,
 *     errors: 1
 *   }
 * }
 * ```
 *
 * @throws MCPError if validation fails or API call fails
 */
export async function skillImportHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillImportInputSchema.parse(input);

    // Call internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: validated.projectId,
        files: validated.files,
        overwriteExisting: validated.overwriteExisting,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MCPError(
        error.error || 'Failed to import skills',
        JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        response.status,
        error
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to import skills: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * skill.linkKnowledge - Link/unlink skill to knowledge item (US-104)
 *
 * Creates or removes many-to-many relationship between skill and knowledge item.
 * Idempotent: succeeds even if link already exists/doesn't exist.
 *
 * **Input**:
 * ```typescript
 * {
 *   projectId: 1,
 *   skillSlug: 'nextjs-ssr',
 *   knowledgeItemId: 42,
 *   action: 'link' // or 'unlink'
 * }
 * ```
 *
 * **Output (link)**:
 * ```typescript
 * {
 *   id: 1,
 *   skillId: 5,
 *   skillSlug: 'nextjs-ssr',
 *   knowledgeItemId: 42,
 *   createdAt: '2025-11-13T16:00:00.000Z'
 * }
 * ```
 *
 * **Output (unlink)**:
 * ```typescript
 * {
 *   deleted: true,
 *   skillSlug: 'nextjs-ssr',
 *   knowledgeItemId: 42
 * }
 * ```
 *
 * @throws MCPError if validation fails, entities not found, or API call fails
 */
export async function skillLinkKnowledgeHandler(input: unknown) {
  try {
    // Validate input
    const validated = skillLinkKnowledgeInputSchema.parse(input);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (validated.action === 'link') {
      // Create link
      const response = await fetch(`${baseUrl}/api/skills/link-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: validated.projectId,
          skillSlug: validated.skillSlug,
          knowledgeItemId: validated.knowledgeItemId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new MCPError(
          error.error || 'Failed to link skill to knowledge item',
          error.code === 'SKILL_NOT_FOUND' || error.code === 'KNOWLEDGE_ITEM_NOT_FOUND'
            ? JSONRPC_ERROR_CODES.METHOD_NOT_FOUND
            : JSONRPC_ERROR_CODES.INTERNAL_ERROR,
          response.status,
          error
        );
      }

      const result = await response.json();
      return result.data;
    } else {
      // Remove link
      const params = new URLSearchParams({
        projectId: validated.projectId.toString(),
        skillSlug: validated.skillSlug,
        knowledgeItemId: validated.knowledgeItemId.toString(),
      });

      const response = await fetch(`${baseUrl}/api/skills/link-knowledge?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new MCPError(
          error.error || 'Failed to unlink skill from knowledge item',
          error.code === 'SKILL_NOT_FOUND'
            ? JSONRPC_ERROR_CODES.METHOD_NOT_FOUND
            : JSONRPC_ERROR_CODES.INTERNAL_ERROR,
          response.status,
          error
        );
      }

      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new MCPError(
        'Invalid input parameters',
        JSONRPC_ERROR_CODES.INVALID_PARAMS,
        400,
        { errors: error.errors }
      );
    }

    throw new MCPError(
      `Failed to link/unlink skill and knowledge item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SkillListInput = z.infer<typeof skillListInputSchema>;
export type SkillLoadInput = z.infer<typeof skillLoadInputSchema>;
export type SkillSearchInput = z.infer<typeof skillSearchInputSchema>;
export type SkillUpdateInput = z.infer<typeof skillUpdateInputSchema>;
export type SkillDeleteInput = z.infer<typeof skillDeleteInputSchema>;
export type SkillExportInput = z.infer<typeof skillExportInputSchema>;
export type SkillImportInput = z.infer<typeof skillImportInputSchema>;
export type SkillLinkKnowledgeInput = z.infer<typeof skillLinkKnowledgeInputSchema>;
