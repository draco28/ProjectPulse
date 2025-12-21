/**
 * API Route: PATCH /api/:entity/:id
 *
 * Generic entity update for roadmap hierarchy items
 * Supports: phases, sprints, weeks, days, tasks
 *
 * Updates: title, description, status
 * For progress updates, use PUT /api/:entity/:id/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Valid entity types (Task model removed in Sprint 12 redesign)
const EntityTypeSchema = z.enum(['phases', 'sprints', 'weeks', 'days']);

// Status values
const StatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']);

// Update request body
const UpdateEntitySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: StatusSchema.optional(),
});

// Map plural to Prisma model names (Task removed in Sprint 12)
const entityModelMap = {
  phases: 'phase',
  sprints: 'sprint',
  weeks: 'week',
  days: 'day',
} as const;

type RouteParams = {
  entity: string;
  id: string;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const resolvedParams = await params;

    // Validate entity type
    const entityResult = EntityTypeSchema.safeParse(resolvedParams.entity);
    if (!entityResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid entity type. Must be one of: ${EntityTypeSchema.options.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    const entity = entityResult.data;
    const entityId = resolvedParams.id;

    // Validate ID format (cuid)
    if (!entityId || entityId.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid entity ID format' },
        },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validated = UpdateEntitySchema.parse(body);

    // Check if any fields to update
    if (!validated.title && !validated.description && !validated.status) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.status !== undefined) updateData.status = validated.status;

    // Get Prisma model name
    const modelName = entityModelMap[entity];

    // Perform update using dynamic model access
    const updatedEntity = await (prisma[modelName] as any).update({
      where: { id: entityId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        entity: {
          id: updatedEntity.id,
          title: updatedEntity.title,
          description: updatedEntity.description,
          status: updatedEntity.status,
          progress: updatedEntity.progress,
          updatedAt: updatedEntity.updatedAt,
        },
      },
    });
  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        },
        { status: 400 }
      );
    }

    // Prisma not found
    if (
      error?.constructor?.name === 'PrismaClientKnownRequestError' &&
      (error as any).code === 'P2025'
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entity not found' } },
        { status: 404 }
      );
    }

    console.error('[PATCH /api/:entity/:id] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Update failed' } },
      { status: 500 }
    );
  }
}
