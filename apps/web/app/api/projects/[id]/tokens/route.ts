/**
 * Project Tokens API (Sprint 9: Agent OAuth)
 *
 * Manage agent bearer tokens for a specific project.
 * - GET: List all tokens (without hashes)
 * - POST: Generate a new token
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth-server';
import { generateProjectToken, listProjectTokens } from '@/lib/agent-tokens';

const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, 'Token name is required')
    .max(50, 'Name too long')
    .trim(),
  expiresInDays: z
    .number()
    .int()
    .positive()
    .max(365, 'Expiry cannot exceed 365 days')
    .optional()
    .default(30),
});

/**
 * GET /api/projects/[id]/tokens
 *
 * List all agent tokens for a project (owner only).
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // List tokens
    const tokens = await listProjectTokens(projectId);

    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('GET /api/projects/[id]/tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/tokens
 *
 * Generate a new agent token for a project (owner only).
 * Returns plaintext token ONLY ONCE.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createTokenSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, expiresInDays } = validationResult.data;

    // Generate token
    const result = await generateProjectToken(projectId, name, expiresInDays);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('POST /api/projects/[id]/tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
