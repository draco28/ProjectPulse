/**
 * Wiki Generation API Route
 *
 * POST /api/wiki/generate - Generate wiki pages from JSDoc comments
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 *
 * @see US-107: JSDoc Auto-Generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJSDocFromProject } from '@/lib/wiki/parsers/jsdoc';
import { generateMarkdown, generateSlug, generateExcerpt } from '@/lib/wiki/generators/markdown';
import { generateWikiSchema } from '@/lib/validations/wiki';
import { resolveCrossLinks, createPageLinks, deletePageLinks } from '@/lib/wiki/cross-linking';
import type { ParsedDocumentation } from '@/lib/wiki/parsers/jsdoc';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * Response type for wiki generation
 */
interface WikiGenerationResponse {
  success: boolean;
  pagesCreated: number;
  pagesUpdated: number;
  pagesSkipped: number;
  pages: Array<{
    id: number;
    title: string;
    path: string;
    sourceFile: string;
  }>;
  errors?: Array<{
    file: string;
    error: string;
  }>;
}

/**
 * POST /api/wiki/generate
 *
 * Generates wiki pages from JSDoc comments in source files
 *
 * @body {GenerateWikiInput} - Generation configuration
 * @returns {WikiGenerationResponse} - Generation results
 */
export async function POST(request: NextRequest): Promise<NextResponse<WikiGenerationResponse>> {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();

    // Authenticate and validate project access
    const requestedProjectId = body.projectId ? parseInt(body.projectId, 10) : undefined;
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Validate request body
    const validation = generateWikiSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          pagesCreated: 0,
          pagesUpdated: 0,
          pagesSkipped: 0,
          pages: [],
          errors: validation.error.errors.map((err) => ({
            file: 'validation',
            error: `${err.path.join('.')}: ${err.message}`,
          })),
        },
        { status: 400 }
      );
    }

    const { projectPath, filePatterns, category, overwriteExisting } = validation.data;

    // Parse JSDoc from project
    const docs = await parseJSDocFromProject(projectPath, {
      include: filePatterns,
      exclude: ['node_modules/**', 'dist/**', '.next/**', 'build/**'],
    });

    if (docs.length === 0) {
      return NextResponse.json({
        success: true,
        pagesCreated: 0,
        pagesUpdated: 0,
        pagesSkipped: 0,
        pages: [],
      });
    }

    // Process each documentation file
    const results = await Promise.allSettled(
      docs.map((doc) => processDocumentation(doc, category, overwriteExisting, projectId))
    );

    // Aggregate results
    let pagesCreated = 0;
    let pagesUpdated = 0;
    let pagesSkipped = 0;
    const pages: WikiGenerationResponse['pages'] = [];
    const errors: WikiGenerationResponse['errors'] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { status, page } = result.value;

        if (status === 'created') {
          pagesCreated++;
          pages.push(page);
        } else if (status === 'updated') {
          pagesUpdated++;
          pages.push(page);
        } else if (status === 'skipped') {
          pagesSkipped++;
        }
      } else {
        errors.push({
          file: 'unknown',
          error: result.reason?.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      pagesCreated,
      pagesUpdated,
      pagesSkipped,
      pages,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          pagesCreated: 0,
          pagesUpdated: 0,
          pagesSkipped: 0,
          pages: [],
          errors: [{ file: 'auth', error: error.message }],
        },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Wiki generation error');

    return NextResponse.json(
      {
        success: false,
        pagesCreated: 0,
        pagesUpdated: 0,
        pagesSkipped: 0,
        pages: [],
        errors: [
          {
            file: 'server',
            error: error instanceof Error ? error.message : 'Internal server error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Process a single documentation file
 */
async function processDocumentation(
  doc: ParsedDocumentation,
  category: string,
  overwriteExisting: boolean,
  projectId: number
): Promise<{
  status: 'created' | 'updated' | 'skipped';
  page: {
    id: number;
    title: string;
    path: string;
    sourceFile: string;
  };
}> {
  // Generate markdown content
  const markdown = generateMarkdown(doc);
  const excerpt = generateExcerpt(markdown);
  const slug = generateSlug(doc.filePath);
  const title = doc.fileName.replace(/\.(ts|tsx|js|jsx)$/, '');

  // Resolve cross-links in markdown content (US-108)
  const crossLinkResult = await resolveCrossLinks(markdown, slug, projectId);

  // Note: Warnings for unresolved links and circular references are handled at module level
  // since this is a helper function without direct request context

  // Use processed content with resolved cross-links
  const processedContent = crossLinkResult.content;

  // Check if page already exists for this project
  const existing = await prisma.wikiPage.findFirst({
    where: { path: slug, projectId },
  });

  if (existing) {
    if (!overwriteExisting) {
      return {
        status: 'skipped',
        page: {
          id: existing.id,
          title: existing.title,
          path: existing.path,
          sourceFile: doc.filePath,
        },
      };
    }

    // Update existing page
    const updated = await prisma.wikiPage.update({
      where: { id: existing.id },
      data: {
        content: processedContent,
        excerpt,
        updatedAt: new Date(),
        revisions: { increment: 1 },
        lastEditedBy: 'system',
        lastEditedAt: new Date(),
        autoGenerated: true,
        sourceFiles: [doc.filePath],
      },
    });

    // Update PageLink relationships
    // 1. Delete old links
    await deletePageLinks(updated.id);

    // 2. Create new links
    const targetPageIds = crossLinkResult.resolvedLinks.map((link) => link.wikiPageId);
    if (targetPageIds.length > 0) {
      await createPageLinks(updated.id, targetPageIds, 'reference');
    }

    return {
      status: 'updated',
      page: {
        id: updated.id,
        title: updated.title,
        path: updated.path,
        sourceFile: doc.filePath,
      },
    };
  }

  // Create new page
  const created = await prisma.wikiPage.create({
    data: {
      title,
      content: processedContent,
      excerpt,
      category,
      path: slug,
      lastEditedBy: 'system',
      lastEditedAt: new Date(),
      autoGenerated: true,
      sourceFiles: [doc.filePath],
      projectId,
    },
  });

  // Create PageLink relationships for new page
  const targetPageIds = crossLinkResult.resolvedLinks.map((link) => link.wikiPageId);
  if (targetPageIds.length > 0) {
    await createPageLinks(created.id, targetPageIds, 'reference');
  }

  return {
    status: 'created',
    page: {
      id: created.id,
      title: created.title,
      path: created.path,
      sourceFile: doc.filePath,
    },
  };
}
