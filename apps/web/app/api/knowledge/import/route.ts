import { NextRequest, NextResponse } from 'next/server';
import matter from 'gray-matter';
import { createKnowledgeItem, KnowledgeCreationError } from '@/lib/knowledge/create';

/**
 * POST /api/knowledge/import
 *
 * Import knowledge items from markdown files with YAML frontmatter
 *
 * Request body:
 * {
 *   "files": [
 *     {
 *       "filename": "docker-setup.md",
 *       "content": "---\ntitle: Docker Setup\ncategory: DevOps\ntags: [docker, setup]\n---\n# Docker Setup\n..."
 *     }
 *   ],
 *   "generateEmbeddings": true // default: true
 * }
 *
 * Frontmatter format (YAML):
 * ---
 * title: Knowledge Item Title
 * category: Category Name
 * tags: [tag1, tag2, tag3]
 * ---
 * # Content in Markdown
 *
 * Response:
 * - 201: Import successful
 * - 400: Validation error (invalid frontmatter, missing fields)
 * - 413: Too many files (max 50)
 * - 500: Import error
 *
 * US-088: Import knowledge from markdown
 *
 * @example
 * ```bash
 * POST /api/knowledge/import
 * Content-Type: application/json
 *
 * {
 *   "files": [
 *     {
 *       "filename": "prisma-setup.md",
 *       "content": "---\ntitle: Prisma Setup Guide\ncategory: Backend\ntags: [prisma, database]\n---\n# Prisma Setup..."
 *     }
 *   ]
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Parse projectId from query params (multi-tenancy requirement)
    const searchParams = request.nextUrl.searchParams;
    const projectId = parseInt(searchParams.get('projectId') || '0', 10);

    if (!projectId || projectId < 1) {
      return NextResponse.json(
        {
          error: 'Valid projectId is required',
          details: 'Provide projectId as query parameter',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Expected JSON object with "files" array',
        },
        { status: 400 }
      );
    }

    const { files, generateEmbeddings = true } = body;

    // Validate files array
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid files parameter',
          details: 'files must be non-empty array',
        },
        { status: 400 }
      );
    }

    // Check batch size limit
    if (files.length > 50) {
      return NextResponse.json(
        {
          error: 'Too many files',
          details: 'Maximum 50 files per batch import',
        },
        { status: 413 }
      );
    }

    // Process each file
    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Validate file structure
        if (!file || typeof file !== 'object') {
          errors.push({
            index: i,
            filename: file?.filename || `file_${i}`,
            error: 'Invalid file object',
            details: 'Each file must have filename and content',
          });
          continue;
        }

        const { filename, content } = file;

        if (!filename || typeof filename !== 'string') {
          errors.push({
            index: i,
            filename: filename || `file_${i}`,
            error: 'Invalid filename',
            details: 'filename must be non-empty string',
          });
          continue;
        }

        if (!content || typeof content !== 'string') {
          errors.push({
            index: i,
            filename,
            error: 'Invalid content',
            details: 'content must be non-empty string',
          });
          continue;
        }

        // Parse frontmatter with gray-matter
        let parsed;
        try {
          parsed = matter(content);
        } catch (parseError) {
          errors.push({
            index: i,
            filename,
            error: 'Frontmatter parsing failed',
            details: parseError instanceof Error ? parseError.message : 'Invalid YAML format',
          });
          continue;
        }

        const { data: frontmatter, content: markdownContent } = parsed;

        // Validate required frontmatter fields
        if (!frontmatter.title || typeof frontmatter.title !== 'string') {
          errors.push({
            index: i,
            filename,
            error: 'Missing or invalid title in frontmatter',
            details: 'title must be non-empty string',
          });
          continue;
        }

        if (!frontmatter.category || typeof frontmatter.category !== 'string') {
          errors.push({
            index: i,
            filename,
            error: 'Missing or invalid category in frontmatter',
            details: 'category must be non-empty string',
          });
          continue;
        }

        // Validate tags (optional, but must be array if present)
        const tags = frontmatter.tags || [];
        if (!Array.isArray(tags)) {
          errors.push({
            index: i,
            filename,
            error: 'Invalid tags in frontmatter',
            details: 'tags must be array of strings',
          });
          continue;
        }

        // Validate tag items are strings
        if (tags.some((tag: any) => typeof tag !== 'string')) {
          errors.push({
            index: i,
            filename,
            error: 'Invalid tags in frontmatter',
            details: 'All tags must be strings',
          });
          continue;
        }

        // Create knowledge item with auto-embedding (include projectId for multi-tenancy)
        const result = await createKnowledgeItem({
          projectId,
          title: frontmatter.title,
          content: markdownContent.trim(),
          category: frontmatter.category,
          tags,
        });

        results.push({
          index: i,
          filename,
          id: result.id,
          title: result.title,
          category: result.category,
          tags: result.tags,
          embeddingProvider: result.embeddingProvider,
          embeddingDuration: result.embeddingDuration,
        });
      } catch (error) {
        // Handle creation errors
        if (error instanceof KnowledgeCreationError) {
          errors.push({
            index: i,
            filename: file?.filename || `file_${i}`,
            error: 'Creation failed',
            details: error.message,
            code: error.code,
          });
        } else {
          errors.push({
            index: i,
            filename: file?.filename || `file_${i}`,
            error: 'Unexpected error',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Return results and errors
    const statusCode = results.length > 0 ? 201 : 400;
    const response: any = {
      summary: {
        total: files.length,
        succeeded: results.length,
        failed: errors.length,
      },
    };

    if (results.length > 0) {
      response.imported = results;
    }

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response, { status: statusCode });
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

    console.error('[POST /api/knowledge/import] Import failed:', error);
    return NextResponse.json(
      {
        error: 'Import failed',
        code: 'IMPORT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
