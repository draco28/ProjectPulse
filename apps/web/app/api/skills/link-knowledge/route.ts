/**
 * Skills-Knowledge Linking API Route Handler
 *
 * Sprint 6 - Phase 6: Skills Integration
 * US-104: Link skills to knowledge items
 *
 * Manages many-to-many relationships between skills and knowledge items.
 * Enables bi-directional linking for cross-referencing patterns and documentation.
 *
 * Created: 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * POST /api/skills/link-knowledge
 *
 * Create a link between a skill and a knowledge item.
 * Idempotent: Returns success if link already exists.
 *
 * Request body:
 * {
 *   "projectId": 1,
 *   "skillSlug": "nextjs-ssr",
 *   "knowledgeItemId": 42
 * }
 *
 * Response (201):
 * {
 *   "data": {
 *     "id": 1,
 *     "skillId": 5,
 *     "skillSlug": "nextjs-ssr",
 *     "knowledgeItemId": 42,
 *     "createdAt": "2025-11-13T16:00:00.000Z"
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (404): { "error": "Skill or knowledge item not found" }
 * Response (500): { "error": "Failed to create link" }
 */
export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || typeof body.projectId !== 'number') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId is required and must be a number' }],
        },
        { status: 400 }
      );
    }

    if (!body.skillSlug || typeof body.skillSlug !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'skillSlug', message: 'skillSlug is required and must be a string' }],
        },
        { status: 400 }
      );
    }

    if (!body.knowledgeItemId || typeof body.knowledgeItemId !== 'number') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            {
              field: 'knowledgeItemId',
              message: 'knowledgeItemId is required and must be a number',
            },
          ],
        },
        { status: 400 }
      );
    }

    const { projectId, skillSlug, knowledgeItemId } = body;

    // Find skill
    const skill = await prisma.skill.findFirst({
      where: {
        projectId,
        slug: skillSlug,
      },
      select: { id: true, slug: true },
    });

    if (!skill) {
      return NextResponse.json(
        {
          error: `Skill with slug "${skillSlug}" not found in project ${projectId}`,
          code: 'SKILL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Find knowledge item
    const knowledgeItem = await prisma.knowledgeItem.findUnique({
      where: { id: knowledgeItemId },
      select: { id: true },
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        {
          error: `Knowledge item with id ${knowledgeItemId} not found`,
          code: 'KNOWLEDGE_ITEM_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if link already exists (idempotent)
    const existingLink = await prisma.skillKnowledgeLink.findFirst({
      where: {
        skillIdRef: skill.id,
        knowledgeIdRef: knowledgeItemId,
      },
    });

    if (existingLink) {
      log.debug({ skillSlug, knowledgeItemId }, 'Skill-knowledge link already exists');

      return NextResponse.json(
        {
          data: {
            id: existingLink.id,
            skillId: skill.id,
            skillSlug: skill.slug,
            knowledgeItemId,
            createdAt: existingLink.createdAt,
          },
        },
        { status: 200 } // Success (idempotent)
      );
    }

    // Create link
    const link = await prisma.skillKnowledgeLink.create({
      data: {
        skillIdRef: skill.id,
        knowledgeIdRef: knowledgeItemId,
      },
    });

    log.info({ skillSlug, knowledgeItemId, linkId: link.id }, 'Created skill-knowledge link');

    return NextResponse.json(
      {
        data: {
          id: link.id,
          skillId: skill.id,
          skillSlug: skill.slug,
          knowledgeItemId,
          createdAt: link.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to create skill-knowledge link'
    );

    return NextResponse.json(
      {
        error: 'Failed to create link',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills/link-knowledge
 *
 * Remove a link between a skill and a knowledge item.
 * Idempotent: Returns success if link doesn't exist.
 *
 * Query params:
 * - projectId: number (required)
 * - skillSlug: string (required)
 * - knowledgeItemId: number (required)
 *
 * Response (200):
 * {
 *   "data": {
 *     "deleted": true,
 *     "skillSlug": "nextjs-ssr",
 *     "knowledgeItemId": 42
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (404): { "error": "Skill not found" }
 * Response (500): { "error": "Failed to delete link" }
 */
export async function DELETE(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate parameters
    const projectIdParam = searchParams.get('projectId');
    if (!projectIdParam) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId is required' }],
        },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdParam, 10);
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    const skillSlug = searchParams.get('skillSlug');
    if (!skillSlug) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'skillSlug', message: 'skillSlug is required' }],
        },
        { status: 400 }
      );
    }

    const knowledgeItemIdParam = searchParams.get('knowledgeItemId');
    if (!knowledgeItemIdParam) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'knowledgeItemId', message: 'knowledgeItemId is required' }],
        },
        { status: 400 }
      );
    }

    const knowledgeItemId = parseInt(knowledgeItemIdParam, 10);
    if (isNaN(knowledgeItemId) || knowledgeItemId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            { field: 'knowledgeItemId', message: 'knowledgeItemId must be a positive integer' },
          ],
        },
        { status: 400 }
      );
    }

    // Find skill
    const skill = await prisma.skill.findFirst({
      where: {
        projectId,
        slug: skillSlug,
      },
      select: { id: true },
    });

    if (!skill) {
      return NextResponse.json(
        {
          error: `Skill with slug "${skillSlug}" not found in project ${projectId}`,
          code: 'SKILL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Delete link (idempotent: succeeds even if link doesn't exist)
    await prisma.skillKnowledgeLink.deleteMany({
      where: {
        skillIdRef: skill.id,
        knowledgeIdRef: knowledgeItemId,
      },
    });

    log.info({ skillSlug, knowledgeItemId }, 'Deleted skill-knowledge link');

    return NextResponse.json({
      data: {
        deleted: true,
        skillSlug,
        knowledgeItemId,
      },
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to delete skill-knowledge link'
    );

    return NextResponse.json(
      {
        error: 'Failed to delete link',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
