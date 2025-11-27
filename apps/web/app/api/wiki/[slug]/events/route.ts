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
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';

const eventSchema = z.object({
  type: z.enum(['VIEW', 'FEEDBACK_POSITIVE', 'FEEDBACK_NEGATIVE']),
  durationMs: z.number().int().min(0).optional(),
  actor: z.string().min(1).max(100).optional(),
  actorType: z.enum(['human', 'agent', 'system']).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const validated = eventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slugPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;
    const page = await prisma.wikiPage.findUnique({
      where: { path: slugPath },
      select: { id: true, projectId: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    // Authenticate and validate project access
    await requireProjectAccess(request, page.projectId);

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
    
    console.error('Failed to record wiki event', error);
    return NextResponse.json({ error: 'Failed to record wiki event' }, { status: 500 });
  }
}
