/**
 * Skills Import API Route Handler
 *
 * Sprint 6 - Phase 5: Skills Import/Export
 * US-102: Import skills from markdown files
 *
 * Imports skills from markdown files with YAML frontmatter.
 * Supports batch import up to 50 files.
 *
 * Created: 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import matter from 'gray-matter';
import { skillFrontmatterSchema } from '@/lib/validations/skill';
import { SKILL_CONSTRAINTS } from '@/lib/skills/constants';

/**
 * POST /api/skills/import
 *
 * Import skills from markdown files with YAML frontmatter.
 * Supports batch import up to 50 files with per-file error handling.
 *
 * Request body:
 * {
 *   "projectId": 1,
 *   "files": [
 *     {
 *       "filename": "nextjs-ssr.md",
 *       "content": "---\ntitle: Next.js SSR\nslug: nextjs-ssr\n...\n---\n\n# Content..."
 *     }
 *   ],
 *   "overwriteExisting": false // Skip duplicate slugs by default
 * }
 *
 * Response (200):
 * {
 *   "data": {
 *     "imported": [
 *       {
 *         "filename": "nextjs-ssr.md",
 *         "slug": "nextjs-ssr",
 *         "id": 1
 *       }
 *     ],
 *     "skipped": [
 *       {
 *         "filename": "react-hooks.md",
 *         "reason": "Slug already exists",
 *         "existingId": 2
 *       }
 *     ],
 *     "errors": [
 *       {
 *         "filename": "invalid.md",
 *         "error": "Validation failed",
 *         "details": [...]
 *       }
 *     ],
 *     "summary": {
 *       "total": 3,
 *       "imported": 1,
 *       "skipped": 1,
 *       "errors": 1
 *     }
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (500): { "error": "Failed to import skills" }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request structure
    if (!body.projectId || typeof body.projectId !== 'number') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId is required and must be a number' }],
        },
        { status: 400 }
      );
    }

    if (!body.files || !Array.isArray(body.files)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'files', message: 'files is required and must be an array' }],
        },
        { status: 400 }
      );
    }

    if (body.files.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'files', message: 'At least one file is required' }],
        },
        { status: 400 }
      );
    }

    if (body.files.length > SKILL_CONSTRAINTS.IMPORT_MAX_FILES) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            {
              field: 'files',
              message: `Maximum ${SKILL_CONSTRAINTS.IMPORT_MAX_FILES} files per batch`,
            },
          ],
        },
        { status: 400 }
      );
    }

    const projectId = body.projectId;
    const overwriteExisting = body.overwriteExisting === true;

    console.log(
      `[POST /api/skills/import] Importing ${body.files.length} files for project ${projectId} (overwrite: ${overwriteExisting})`
    );

    // Process files
    const imported: Array<{ filename: string; slug: string; id: number }> = [];
    const skipped: Array<{ filename: string; reason: string; existingId?: number }> = [];
    const errors: Array<{ filename: string; error: string; details?: any }> = [];

    for (const file of body.files) {
      const { filename, content } = file;

      // Validate file structure
      if (!filename || typeof filename !== 'string') {
        errors.push({
          filename: filename || 'unknown',
          error: 'Invalid file structure',
          details: 'filename is required and must be a string',
        });
        continue;
      }

      if (!content || typeof content !== 'string') {
        errors.push({
          filename,
          error: 'Invalid file structure',
          details: 'content is required and must be a string',
        });
        continue;
      }

      // Validate filename (must be .md)
      if (!filename.endsWith('.md')) {
        errors.push({
          filename,
          error: 'Invalid filename',
          details: 'File must be a .md markdown file',
        });
        continue;
      }

      try {
        // Parse YAML frontmatter
        const parsed = matter(content);
        const { data: frontmatter, content: markdownContent } = parsed;

        // Validate frontmatter
        const frontmatterValidation = skillFrontmatterSchema.safeParse(frontmatter);

        if (!frontmatterValidation.success) {
          errors.push({
            filename,
            error: 'Frontmatter validation failed',
            details: frontmatterValidation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
          continue;
        }

        const { slug, title, category, description, tags, frameworks } = frontmatterValidation.data;

        // Check for existing slug
        const existing = await prisma.skill.findFirst({
          where: {
            projectId,
            slug,
          },
          select: { id: true },
        });

        if (existing && !overwriteExisting) {
          skipped.push({
            filename,
            reason: `Skill with slug "${slug}" already exists`,
            existingId: existing.id,
          });
          continue;
        }

        // Create or update skill
        if (existing && overwriteExisting) {
          // Update existing skill
          const updated = await prisma.skill.update({
            where: { id: existing.id },
            data: {
              title,
              content: markdownContent.trim(),
              category,
              description,
              tags,
              frameworks,
            },
          });

          imported.push({
            filename,
            slug: updated.slug,
            id: updated.id,
          });

          console.log(`[POST /api/skills/import] Updated skill: ${slug} (id: ${updated.id})`);
        } else {
          // Create new skill
          const created = await prisma.skill.create({
            data: {
              projectId,
              slug,
              title,
              content: markdownContent.trim(),
              category,
              description,
              tags,
              frameworks,
              usageCount: 0,
            },
          });

          imported.push({
            filename,
            slug: created.slug,
            id: created.id,
          });

          console.log(`[POST /api/skills/import] Created skill: ${slug} (id: ${created.id})`);
        }
      } catch (error) {
        console.error(`[POST /api/skills/import] Error processing ${filename}:`, error);

        errors.push({
          filename,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    // Generate summary
    const summary = {
      total: body.files.length,
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
    };

    console.log(
      `[POST /api/skills/import] Summary: ${summary.imported} imported, ${summary.skipped} skipped, ${summary.errors} errors`
    );

    return NextResponse.json({
      data: {
        imported,
        skipped,
        errors,
        summary,
      },
    });
  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/skills/import] Failed to import skills:', error);

    return NextResponse.json(
      {
        error: 'Failed to import skills',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
