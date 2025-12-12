/**
 * Individual Milestone API (Sprint 11.7)
 *
 * Manage a specific milestone.
 * - GET: Get milestone details
 * - PUT: Update milestone
 * - DELETE: Delete milestone
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

// Validation schema for updating a milestone
const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

/**
 * GET /api/projects/[id]/milestones/[milestoneId]
 *
 * Get a specific milestone with its tickets.
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    const projectId = parseInt(id, 10);
    const milestoneIdNum = parseInt(milestoneId, 10);

    if (isNaN(projectId) || isNaN(milestoneIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project ID or milestone ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, projectId);

    // Fetch milestone with tickets
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneIdNum,
        projectId, // SECURITY: Enforce project scope
      },
      include: {
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            kind: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit for performance
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ milestone }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('GET /api/projects/[id]/milestones/[milestoneId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/milestones/[milestoneId]
 *
 * Update a milestone.
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    const projectId = parseInt(id, 10);
    const milestoneIdNum = parseInt(milestoneId, 10);

    if (isNaN(projectId) || isNaN(milestoneIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project ID or milestone ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, projectId);

    // Verify milestone exists and belongs to project
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneIdNum,
        projectId, // SECURITY: Enforce project scope
      },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

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

    const validationResult = updateMilestoneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Check for name conflict if name is being updated
    if (updates.name && updates.name !== existingMilestone.name) {
      const duplicate = await prisma.milestone.findUnique({
        where: {
          projectId_name: { projectId, name: updates.name },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: `Milestone "${updates.name}" already exists in this project` },
          { status: 409 }
        );
      }
    }

    // Build update data, handling null explicitly for targetDate/description
    const updateData: {
      name?: string;
      description?: string | null;
      targetDate?: Date | null;
      status?: string;
    } = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.targetDate !== undefined) {
      updateData.targetDate = updates.targetDate ? new Date(updates.targetDate) : null;
    }

    // Update milestone
    const milestone = await prisma.milestone.update({
      where: { id: milestoneIdNum },
      data: updateData,
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    return NextResponse.json({ milestone }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('PUT /api/projects/[id]/milestones/[milestoneId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/milestones/[milestoneId]
 *
 * Delete a milestone. Tickets linked to this milestone will have
 * their milestoneId set to null (ON DELETE SET NULL).
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    const projectId = parseInt(id, 10);
    const milestoneIdNum = parseInt(milestoneId, 10);

    if (isNaN(projectId) || isNaN(milestoneIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project ID or milestone ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, projectId);

    // Verify milestone exists and belongs to project
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneIdNum,
        projectId, // SECURITY: Enforce project scope
      },
      include: {
        _count: { select: { tickets: true } },
      },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Delete milestone (tickets will have milestoneId set to null via FK constraint)
    await prisma.milestone.delete({
      where: { id: milestoneIdNum },
    });

    return NextResponse.json(
      {
        message: 'Milestone deleted successfully',
        ticketsUnlinked: existingMilestone._count.tickets,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('DELETE /api/projects/[id]/milestones/[milestoneId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
