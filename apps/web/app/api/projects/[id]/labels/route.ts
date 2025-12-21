/**
 * Project Labels API (Sprint 11.7 - Labels Feature)
 *
 * Manage labels within a project.
 * - GET: List all labels for a project (any authenticated user with project access)
 * - POST: Create a new label (owner only)
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 * - Uses requireProjectAccess for defense-in-depth
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError, authErrorResponse } from '@/lib/auth/validateRequest';
import { CreateLabelSchema } from '@/lib/validations/label';

/**
 * GET /api/projects/[id]/labels
 *
 * List all labels for a project with ticket counts.
 * Query params:
 *   - search: Filter by name (partial match)
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, projectId);

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    // Build query with validated filters
    const where: { projectId: number; name?: { contains: string; mode: 'insensitive' } } = {
      projectId,
    };

    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    // Fetch labels with ticket counts
    const labels = await prisma.label.findMany({
      where,
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    // Transform to flatten _count
    const formattedLabels = labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt,
      ticketCount: label._count.tickets,
    }));

    return NextResponse.json({ labels: formattedLabels }, { status: 200 });
  } catch (error: unknown) {
    // Handle auth errors with proper status codes
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('GET /api/projects/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/labels
 *
 * Create a new label for a project.
 *
 * Auth: User session OR Agent token (project-scoped)
 * Note: requireProjectAccess already enforces owner-only for users
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // SECURITY: Validate authentication AND project access (owner-only for users)
    await requireProjectAccess(request, projectId);

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = CreateLabelSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, color } = validationResult.data;

    // Check for duplicate name within project (unique constraint)
    const existing = await prisma.label.findUnique({
      where: {
        projectId_name: { projectId, name },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Label "${name}" already exists in this project` },
        { status: 409 }
      );
    }

    // Create label
    const label = await prisma.label.create({
      data: {
        name,
        color: color ?? '#6b7280',
        projectId,
      },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        _count: {
          select: { tickets: true },
        },
      },
    });

    // Format response
    const formattedLabel = {
      id: label.id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt,
      ticketCount: label._count.tickets,
    };

    return NextResponse.json({ label: formattedLabel }, { status: 201 });
  } catch (error: unknown) {
    // Handle auth errors with proper status codes
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('POST /api/projects/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
