/**
 * Wiki Events API Route
 *
 * POST /api/wiki/[slug]/events - Record wiki page event (view, feedback)
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const eventSchema = z.object({
  type: z.enum(['VIEW', 'FEEDBACK_POSITIVE', 'FEEDBACK_NEGATIVE']),
  durationMs: z.number().int().min(0).optional(),
  actor: z.string().min(1).max(100).optional(),
  actorType: z.enum(['human', 'agent', 'system']).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    const validated = eventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Authenticate and get authorized projectId FIRST (Ticket #132: per-project path uniqueness)
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('project')
      ? parseInt(searchParams.get('project')!, 10)
      : undefined;
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const slugPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;
    const page = await prisma.wikiPage.findFirst({
      where: { path: slugPath, projectId },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.wikiPageEvent.create({
        data: {
          wikiPageId: page.id,
          type: validated.data.type,
          actor: validated.data.actor ?? null,
          durationMs: validated.data.durationMs ?? null,
          metadata: validated.data.metadata ?? undefined,
        },
      });

      if (validated.data.type === 'VIEW') {
        await tx.wikiPage.update({
          where: { id: page.id },
          data: {
            views: { increment: 1 },
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to record wiki event'
    );
    return NextResponse.json({ error: 'Failed to record wiki event' }, { status: 500 });
  }
}
