/**
 * Wiki Revert API Route
 *
 * POST /api/wiki/[slug]/revert - Revert wiki page to previous version
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';

const DEFAULT_ACTOR_NAME = 'Unknown Editor';
const DEFAULT_ACTOR_TYPE: 'human' | 'agent' | 'system' = 'human';

const revertSchema = z.object({
  version: z.number().int().min(1, 'Version is required'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
  updatedBy: z.string().min(1).max(100).optional(),
  updatedByType: z.enum(['human', 'agent', 'system']).optional(),
});

type RevertError = 'NOT_FOUND' | 'REVISION_NOT_FOUND';

function mapRevertError(code: RevertError) {
  switch (code) {
    case 'REVISION_NOT_FOUND':
      return NextResponse.json(
        { error: 'Revision not found', message: 'Unable to locate the requested version.' },
        { status: 404 }
      );
    case 'NOT_FOUND':
    default:
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const validation = revertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { version, reason, updatedBy, updatedByType } = validation.data;
    const actorName =
      updatedBy || request.headers.get('x-projectpulse-actor') || DEFAULT_ACTOR_NAME;
    const actorType =
      updatedByType ||
      (request.headers.get('x-projectpulse-actor-type') as 'human' | 'agent' | 'system' | null) ||
      DEFAULT_ACTOR_TYPE;

    const slugPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;

    const revertedPage = await prisma.$transaction(async (tx) => {
      const page = await tx.wikiPage.findUnique({
        where: { path: slugPath },
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true,
          version: true,
          projectId: true,
        },
      });

      if (!page) {
        throw 'NOT_FOUND';
      }

      // Authenticate and validate project access
      await requireProjectAccess(request, page.projectId);

      const revision = await tx.wikiRevision.findUnique({
        where: {
          wikiPageId_version: {
            wikiPageId: page.id,
            version,
          },
        },
        select: {
          title: true,
          content: true,
          excerpt: true,
        },
      });

      if (!revision) {
        throw 'REVISION_NOT_FOUND';
      }

      await tx.wikiRevision.create({
        data: {
          wikiPageId: page.id,
          version: page.version,
          title: page.title,
          excerpt: page.excerpt,
          content: page.content,
          diffSummary: reason ? `Reverted to v${version}: ${reason}` : `Reverted to v${version}`,
          createdBy: actorName,
          createdByType: actorType,
        },
      });

      await tx.wikiPageEvent.create({
        data: {
          wikiPageId: page.id,
          type: 'REVISION',
          actor: actorName,
          metadata: {
            action: 'REVERT',
            targetVersion: version,
            reason: reason ?? null,
          } as Prisma.InputJsonObject,
        },
      });

      return tx.wikiPage.update({
        where: { id: page.id },
        data: {
          title: revision.title,
          content: revision.content,
          excerpt: revision.excerpt,
          lastEditedBy: actorName,
          lastEditedAt: new Date(),
          version: { increment: 1 },
          revisions: { increment: 1 },
        },
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
    });

    revalidatePath('/wiki');
    revalidatePath(`/wiki/${params.slug}`);

    return NextResponse.json({ data: revertedPage });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (typeof error === 'string') {
      return mapRevertError(error as RevertError);
    }

    console.error('Failed to revert wiki page:', error);
    return NextResponse.json({ error: 'Failed to revert wiki page' }, { status: 500 });
  }
}
