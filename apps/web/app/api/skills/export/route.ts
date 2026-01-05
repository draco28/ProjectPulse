/**
 * Skills Export API Route Handler
 *
 * Sprint 6 - Phase 5: Skills Import/Export
 * US-101: Export skills to markdown files
 *
 * Exports skills as markdown files with YAML frontmatter.
 * Returns ZIP archive for easy download and version control.
 *
 * Created: 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import archiver from 'archiver';
import type { Prisma } from '@prisma/client';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/skills/export
 *
 * Export skills to markdown files with YAML frontmatter.
 * Returns a ZIP archive containing all exported skills.
 *
 * Query params:
 * - projectId: number (required) - Project ID for multi-tenancy scoping
 * - slugs: string[] (optional) - Export specific skills (comma-separated)
 * - category: string (optional) - Filter by category
 * - tags: string[] (optional) - Filter by tags (comma-separated, AND logic)
 * - frameworks: string[] (optional) - Filter by frameworks (comma-separated, AND logic)
 * - since: string (optional) - Export skills created/updated after this date (ISO 8601)
 * - limit: number (optional) - Max skills to export (1-1000, default: all)
 *
 * Response (200): application/zip
 * - Content-Disposition: attachment; filename="skills-export-YYYY-MM-DD.zip"
 * - Contains markdown files: slug.md (e.g., nextjs-ssr.md)
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (404): { "error": "No skills found matching criteria" }
 * Response (500): { "error": "Failed to export skills" }
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate projectId (required)
    const projectIdParam = searchParams.get('projectId');
    if (!projectIdParam) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId is required' }],
        },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdParam, 10);
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    // Extract optional filters
    const slugsParam = searchParams.get('slugs');
    const slugs = slugsParam ? slugsParam.split(',').map((s) => s.trim()) : undefined;

    const category = searchParams.get('category') || undefined;

    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : undefined;

    const frameworksParam = searchParams.get('frameworks');
    const frameworks = frameworksParam
      ? frameworksParam.split(',').map((f) => f.trim())
      : undefined;

    const since = searchParams.get('since') || undefined;
    const limit = parseInt(searchParams.get('limit') || '0', 10);

    // Build where clause
    const where: Prisma.SkillWhereInput = {
      projectId,
    };

    if (slugs && slugs.length > 0) {
      where.slug = { in: slugs };
    }

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasEvery: tags };
    }

    if (frameworks && frameworks.length > 0) {
      where.frameworks = { hasEvery: frameworks };
    }

    if (since) {
      // Parse ISO 8601 date
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: [{ field: 'since', message: 'Invalid date format (use ISO 8601)' }],
          },
          { status: 400 }
        );
      }

      where.OR = [{ createdAt: { gte: sinceDate } }, { updatedAt: { gte: sinceDate } }];
    }

    // Fetch skills
    const skills = await prisma.skill.findMany({
      where,
      take: limit > 0 && limit <= 1000 ? limit : undefined,
      orderBy: [{ category: 'asc' }, { slug: 'asc' }],
    });

    if (skills.length === 0) {
      return NextResponse.json(
        {
          error: 'No skills found matching criteria',
          code: 'NO_SKILLS_FOUND',
        },
        { status: 404 }
      );
    }

    log.info({ count: skills.length, projectId }, 'Exporting skills');

    // Create ZIP archive in memory
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Collect chunks
    const chunks: Buffer[] = [];
    archive.on('data', (chunk) => chunks.push(chunk));

    // Handle errors
    let archiveError: Error | null = null;
    archive.on('error', (err) => {
      archiveError = err;
      log.error({ error: err instanceof Error ? err.message : String(err) }, 'Skills export archive error');
    });

    // Convert skills to markdown files
    for (const skill of skills) {
      const markdown = skillToMarkdown(skill);
      const filename = `${skill.slug}.md`;

      archive.append(markdown, { name: filename });
    }

    // Finalize archive
    await archive.finalize();

    // Check for errors
    if (archiveError) {
      throw archiveError;
    }

    // Wait for all chunks
    await new Promise((resolve) => {
      archive.on('end', resolve);
    });

    // Combine chunks into single buffer
    const zipBuffer = Buffer.concat(chunks);

    // Generate filename
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `skills-export-${date}.zip`;

    log.info({ filename, bytes: zipBuffer.length, fileCount: skills.length }, 'Created skills export archive');

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to export skills');
    return NextResponse.json(
      {
        error: 'Failed to export skills',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * Convert skill object to markdown with YAML frontmatter
 *
 * Format:
 * ```markdown
 * ---
 * title: Next.js Server Components
 * slug: nextjs-server-components
 * category: framework
 * description: Patterns for using React Server Components...
 * tags:
 *   - nextjs
 *   - react
 *   - server-components
 * frameworks:
 *   - Next.js 14
 *   - React 18
 * ---
 *
 * # Content here...
 * ```
 *
 * @param skill - Skill object from database
 * @returns Markdown string with YAML frontmatter
 */
function skillToMarkdown(skill: {
  slug: string;
  title: string;
  content: string;
  category: string;
  description: string | null;
  tags: string[];
  frameworks: string[];
}): string {
  const lines: string[] = [];

  // YAML frontmatter
  lines.push('---');
  lines.push(`title: ${skill.title}`);
  lines.push(`slug: ${skill.slug}`);
  lines.push(`category: ${skill.category}`);

  if (skill.description) {
    lines.push(`description: ${skill.description}`);
  }

  // Tags (YAML array)
  if (skill.tags && skill.tags.length > 0) {
    lines.push('tags:');
    for (const tag of skill.tags) {
      lines.push(`  - ${tag}`);
    }
  }

  // Frameworks (YAML array)
  if (skill.frameworks && skill.frameworks.length > 0) {
    lines.push('frameworks:');
    for (const framework of skill.frameworks) {
      lines.push(`  - ${framework}`);
    }
  }

  lines.push('---');
  lines.push(''); // Blank line after frontmatter

  // Content
  lines.push(skill.content);

  return lines.join('\n');
}
