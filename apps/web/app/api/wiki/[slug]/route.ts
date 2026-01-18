/**
 * Wiki Detail API Route
 *
 * GET /api/wiki/[slug] - Get wiki page by slug
 * PATCH /api/wiki/[slug] - Update wiki page
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateWikiPageSchema } from '@/lib/validations/wiki';
import { resolveCrossLinks, createPageLinks, deletePageLinks } from '@/lib/wiki/cross-linking';
import {
  getAuthorizedProjectId,
  requireProjectAccess,
  AuthError,
} from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/wiki/:slug
 *
 * Fetch a wiki page by its path/slug
 * Returns page content, metadata, and related pages
 *
 * Path params:
 * - slug: The wiki page path (e.g., 'getting-started')
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const slug = params.slug;

    // Normalize slug to match database path format
    const path = slug.startsWith('/') ? slug : `/${slug}`;

    // Get projectId from query params or auth context (Sprint 18 pattern)
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('project')
      ? parseInt(searchParams.get('project')!, 10)
      : undefined;

    // Authenticate and get authorized projectId FIRST
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Fetch the wiki page - filter by projectId at query time for security
    const page = await prisma.wikiPage.findFirst({
      where: { path, projectId },
      select: {
        id: true,
        title: true,
        content: true,
        path: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        // Related pages via outgoing links (same project only)
        outgoingLinks: {
          select: {
            targetPage: {
              select: {
                id: true,
                title: true,
                path: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    // Extract related pages from outgoing links
    const relatedPages = page.outgoingLinks.map((link) => link.targetPage);

    // Return page with related pages
    return NextResponse.json({
      data: {
        page: {
          id: page.id,
          title: page.title,
          content: page.content,
          path: page.path,
          category: page.category,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        },
        relatedPages,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch wiki page');
    return NextResponse.json({ error: 'Failed to fetch wiki page' }, { status: 500 });
  }
}

const DEFAULT_ACTOR_NAME = 'Unknown Editor';
const DEFAULT_ACTOR_TYPE: 'human' | 'agent' | 'system' = 'human';

type WikiUpdateError = 'NOT_FOUND' | 'PARENT_NOT_FOUND' | 'PARENT_SELF' | 'NO_FIELDS';

function mapUpdateError(error: WikiUpdateError) {
  switch (error) {
    case 'NOT_FOUND':
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    case 'PARENT_NOT_FOUND':
      return NextResponse.json(
        { error: 'Parent page not found', message: 'The provided parentPath does not exist.' },
        { status: 400 }
      );
    case 'PARENT_SELF':
      return NextResponse.json(
        { error: 'Invalid parent', message: 'A page cannot be its own parent.' },
        { status: 400 }
      );
    case 'NO_FIELDS':
    default:
      return NextResponse.json(
        { error: 'No updates provided', message: 'Provide at least one field to update.' },
        { status: 400 }
      );
  }
}

/**
 * PATCH /api/wiki/:slug
 *
 * Updates a wiki page, creates a WikiRevision snapshot, and logs a WikiPageEvent.
 */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const slugPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;

    // Get projectId from query params or auth context BEFORE transaction (Sprint 18 pattern)
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('project')
      ? parseInt(searchParams.get('project')!, 10)
      : undefined;
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const body = await request.json();
    const validation = updateWikiPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { changelog, updatedBy, updatedByType, parentPath, ...partialUpdate } = validation.data;

    const hasPageFieldUpdates = Object.values(partialUpdate).some((value) => value !== undefined);
    const hasParentUpdate = typeof parentPath !== 'undefined';

    if (!hasPageFieldUpdates && !hasParentUpdate) {
      throw 'NO_FIELDS';
    }

    const actorName =
      updatedBy || request.headers.get('x-projectpulse-actor') || DEFAULT_ACTOR_NAME;
    const actorType =
      updatedByType ||
      (request.headers.get('x-projectpulse-actor-type') as 'human' | 'agent' | 'system' | null) ||
      DEFAULT_ACTOR_TYPE;

    const updatedPage = await prisma.$transaction(async (tx) => {
      // Filter by both path AND projectId at query time for security
      const existing = await tx.wikiPage.findFirst({
        where: { path: slugPath, projectId },
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true,
          version: true,
          revisions: true,
          parentId: true,
          category: true,
          tags: true,
          projectId: true,
        },
      });

      if (!existing) {
        throw 'NOT_FOUND';
      }

      const parentUpdate: Prisma.WikiPageUpdateInput = {};
      if (hasParentUpdate) {
        if (!parentPath) {
          parentUpdate.parent = { disconnect: true };
        } else {
          const normalizedParentPath = parentPath.startsWith('/') ? parentPath : `/${parentPath}`;
          const parentPage = await tx.wikiPage.findFirst({
            where: { path: normalizedParentPath, projectId },
            select: { id: true },
          });

          if (!parentPage) {
            throw 'PARENT_NOT_FOUND';
          }

          if (parentPage.id === existing.id) {
            throw 'PARENT_SELF';
          }

          parentUpdate.parent = { connect: { id: parentPage.id } };
        }
      }

      await tx.wikiRevision.create({
        data: {
          wikiPageId: existing.id,
          version: existing.version,
          title: existing.title,
          excerpt: existing.excerpt,
          content: existing.content,
          diffSummary: changelog ?? null,
          createdBy: actorName,
          createdByType: actorType,
        },
      });

      await tx.wikiPageEvent.create({
        data: {
          wikiPageId: existing.id,
          type: 'REVISION',
          actor: actorName,
          metadata: {
            changelog: changelog ?? null,
            updatedByType: actorType,
            previousVersion: existing.version,
          } as Prisma.InputJsonObject,
        },
      });

      const updateData: Prisma.WikiPageUpdateInput = {
        lastEditedBy: actorName,
        lastEditedAt: new Date(),
        version: { increment: 1 },
        revisions: { increment: 1 },
        ...parentUpdate,
      };

      if (partialUpdate.title !== undefined) updateData.title = partialUpdate.title;
      if (partialUpdate.category !== undefined) updateData.category = partialUpdate.category;
      if (partialUpdate.excerpt !== undefined) updateData.excerpt = partialUpdate.excerpt;

      // Resolve cross-links if content is being updated (US-108)
      let crossLinkResult: Awaited<ReturnType<typeof resolveCrossLinks>> | null = null;
      if (partialUpdate.content !== undefined) {
        crossLinkResult = await resolveCrossLinks(partialUpdate.content, slugPath, projectId);

        // Log warnings
        if (crossLinkResult.unresolvedLinks.length > 0) {
          log.warn(
            { slugPath, unresolvedLinks: crossLinkResult.unresolvedLinks.map((l) => l.slug) },
            'Unresolved cross-links in wiki page update'
          );
        }

        updateData.content = crossLinkResult.content;
      }

      const page = await tx.wikiPage.update({
        where: { id: existing.id },
        data: updateData,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          excerpt: true,
          path: true,
          version: true,
          updatedAt: true,
        },
      });

      // Update PageLink relationships if content changed
      if (crossLinkResult) {
        // Delete old links
        await deletePageLinks(page.id);

        // Create new links
        const targetPageIds = crossLinkResult.resolvedLinks.map((link) => link.wikiPageId);
        if (targetPageIds.length > 0) {
          await createPageLinks(page.id, targetPageIds, 'reference');
        }
      }

      return page;
    });

    revalidatePath('/wiki');
    revalidatePath(`/wiki/${params.slug}`);

    return NextResponse.json({ data: updatedPage });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (typeof error === 'string') {
      return mapUpdateError(error as WikiUpdateError);
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to update wiki page');
    return NextResponse.json({ error: 'Failed to update wiki page' }, { status: 500 });
  }
}
