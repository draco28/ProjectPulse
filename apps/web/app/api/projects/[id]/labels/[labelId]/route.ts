/**
 * Single Label API (Sprint 11.7 - Labels Feature)
 *
 * Manage a single label within a project.
 * - GET: Get a label by ID
 * - PUT: Update a label (owner only)
 * - DELETE: Delete a label (owner only)
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 * - Uses requireProjectAccess for defense-in-depth
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError, authErrorResponse } from '@/lib/auth/validateRequest';
import { UpdateLabelSchema } from '@/lib/validations/label';

type RouteParams = { params: Promise<{ id: string; labelId: string }> };

/**
 * GET /api/projects/[id]/labels/[labelId]
 *
 * Get a single label by ID.
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id, labelId } = await params;
    const projectId = parseInt(id, 10);
    const parsedLabelId = parseInt(labelId, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (isNaN(parsedLabelId)) {
      return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 });
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, projectId);

    // Fetch label
    const label = await prisma.label.findFirst({
      where: {
        id: parsedLabelId,
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

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    // Format response
    const formattedLabel = {
      id: label.id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt,
      ticketCount: label._count.tickets,
    };

    return NextResponse.json({ label: formattedLabel }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('GET /api/projects/[id]/labels/[labelId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]/labels/[labelId]
 *
 * Update a label's name or color.
 *
 * Auth: User session OR Agent token (project-scoped)
 * Note: requireProjectAccess enforces owner-only for users
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id, labelId } = await params;
    const projectId = parseInt(id, 10);
    const parsedLabelId = parseInt(labelId, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (isNaN(parsedLabelId)) {
      return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 });
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

    const validationResult = UpdateLabelSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check label exists and belongs to project
    const existingLabel = await prisma.label.findFirst({
      where: {
        id: parsedLabelId,
        projectId,
      },
    });

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== existingLabel.name) {
      const duplicateName = await prisma.label.findFirst({
        where: {
          projectId,
          name: updateData.name,
          id: { not: parsedLabelId },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: `Label "${updateData.name}" already exists in this project` },
          { status: 409 }
        );
      }
    }

    // Update label
    const label = await prisma.label.update({
      where: { id: parsedLabelId },
      data: updateData,
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

    return NextResponse.json({ label: formattedLabel }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('PUT /api/projects/[id]/labels/[labelId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/labels/[labelId]
 *
 * Delete a label. This will remove the label from all tickets.
 *
 * Auth: User session OR Agent token (project-scoped)
 * Note: requireProjectAccess enforces owner-only for users
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id, labelId } = await params;
    const projectId = parseInt(id, 10);
    const parsedLabelId = parseInt(labelId, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (isNaN(parsedLabelId)) {
      return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 });
    }

    // SECURITY: Validate authentication AND project access (owner-only for users)
    await requireProjectAccess(request, projectId);

    // Check label exists and belongs to project
    const existingLabel = await prisma.label.findFirst({
      where: {
        id: parsedLabelId,
        projectId,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    // Delete label (many-to-many relations will be automatically cleaned up)
    await prisma.label.delete({
      where: { id: parsedLabelId },
    });

    return NextResponse.json(
      {
        message: `Label "${existingLabel.name}" deleted successfully`,
        affectedTickets: existingLabel._count.tickets,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('DELETE /api/projects/[id]/labels/[labelId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
