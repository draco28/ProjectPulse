/**
 * Project Milestones API (Sprint 11.7)
 *
 * Manage milestones within a project.
 * - GET: List all milestones for a project
 * - POST: Create a new milestone
 *
 * Security (Sprint 10 Standards):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 * - Uses requireProjectAccess for defense-in-depth
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError, authErrorResponse } from '@/lib/auth/validateRequest';

// Validation schema for creating a milestone
const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(2000).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  status: z.enum(['active', 'completed', 'cancelled']).optional().default('active'),
});

/**
 * GET /api/projects/[id]/milestones
 *
 * List all milestones for a project.
 * Query params:
 *   - status: Filter by status (active, completed, cancelled)
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate authentication AND project access
    // - User sessions: verified owner
    // - Agent tokens: enforced project scope
    await requireProjectAccess(request, projectId);

    // Parse query params
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    // Build query with validated filters
    const where: { projectId: number; status?: string } = { projectId };
    if (statusFilter && ['active', 'completed', 'cancelled'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    // Fetch milestones with ticket counts
    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: [
        { targetDate: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ milestones }, { status: 200 });
  } catch (error: unknown) {
    // Handle auth errors with proper status codes
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('GET /api/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/milestones
 *
 * Create a new milestone for a project.
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, projectId);

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validationResult = createMilestoneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, targetDate, status } = validationResult.data;

    // Check for duplicate name within project (unique constraint)
    const existing = await prisma.milestone.findUnique({
      where: {
        projectId_name: { projectId, name },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Milestone "${name}" already exists in this project` },
        { status: 409 }
      );
    }

    // Create milestone
    const milestone = await prisma.milestone.create({
      data: {
        name,
        description: description ?? null,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status ?? 'active',
        projectId,
      },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error: unknown) {
    // Handle auth errors with proper status codes
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('POST /api/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
