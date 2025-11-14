import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateWikiPageSchema } from '@/lib/validations/wiki';
import { resolveCrossLinks, createPageLinks, deletePageLinks } from '@/lib/wiki/cross-linking';
import { commitWikiUpdate } from '@/lib/wiki/git-integration';

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
  try {
    const slug = params.slug;

    // Normalize slug to match database path format
    const path = slug.startsWith('/') ? slug : `/${slug}`;

    // Fetch the wiki page
    const page = await prisma.wikiPage.findUnique({
      where: { path },
      select: {
        id: true,
        title: true,
        content: true,
        path: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        // Related pages via outgoing links
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
    console.error('Failed to fetch wiki page:', error);
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
  try {
    const slugPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;
    const body = await request.json();
    const validation = updateWikiPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      changelog,
      updatedBy,
      updatedByType,
      parentPath,
      ...partialUpdate
    } = validation.data;

    const hasPageFieldUpdates = Object.values(partialUpdate).some((value) => value !== undefined);
    const hasParentUpdate = typeof parentPath !== 'undefined';

    if (!hasPageFieldUpdates && !hasParentUpdate) {
      throw 'NO_FIELDS';
    }

    const actorName =
      updatedBy ||
      request.headers.get('x-projectpulse-actor') ||
      DEFAULT_ACTOR_NAME;
    const actorType =
      updatedByType ||
      (request.headers.get('x-projectpulse-actor-type') as 'human' | 'agent' | 'system' | null) ||
      DEFAULT_ACTOR_TYPE;

    const updatedPage = await prisma.$transaction(async (tx) => {
      const existing = await tx.wikiPage.findUnique({
        where: { path: slugPath },
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
          const parentPage = await tx.wikiPage.findUnique({
            where: { path: normalizedParentPath },
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
        crossLinkResult = await resolveCrossLinks(partialUpdate.content, slugPath);

        // Log warnings
        if (crossLinkResult.unresolvedLinks.length > 0) {
          console.warn(
            `[Wiki Update] Unresolved cross-links in ${slugPath}:`,
            crossLinkResult.unresolvedLinks.map((l) => l.slug).join(', ')
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

    // Commit to git (US-109: Git Integration)
    try {
      const gitResult = commitWikiUpdate({
        title: updatedPage.title,
        path: updatedPage.path,
        content: updatedPage.content,
        category: updatedPage.category || 'uncategorized',
        excerpt: updatedPage.excerpt || undefined,
      });

      console.log(`[Wiki Update] Git commit: ${gitResult.commitSha} - ${gitResult.message}`);
    } catch (gitError) {
      // Log git errors but don't fail the API request
      console.error('[Wiki Update] Git commit failed:', gitError);
    }

    revalidatePath('/wiki');
    revalidatePath(`/wiki/${params.slug}`);

    return NextResponse.json({ data: updatedPage });
  } catch (error) {
    if (typeof error === 'string') {
      return mapUpdateError(error as WikiUpdateError);
    }

    console.error('Failed to update wiki page:', error);
    return NextResponse.json({ error: 'Failed to update wiki page' }, { status: 500 });
  }
}
