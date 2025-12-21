/**
 * Skills [slug] API Route Handler
 *
 * Sprint 6 - Phase 3: Skills API & MCP Tools
 * US-092: Load full skill content on-demand
 * US-099: Update skill content
 * US-100: Delete skills
 * US-103: Track skill usage frequency
 *
 * This endpoint provides on-demand loading of full skill content with usage tracking.
 * Token efficiency: ~180-230 tokens per skill (vs ~2,500 tokens for all skills).
 *
 * Security: Requires authentication (user session OR agent token)
 *
 * Created: 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSkillSchema } from '@/lib/validations/skill';
import { skillsCache } from '@/lib/skills/cache';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

/**
 * GET /api/skills/[slug]
 *
 * Load a single skill with full content field.
 * Automatically increments usageCount and updates lastLoadedAt (US-103).
 *
 * Query params:
 * - projectId: number (required) - Project ID for multi-tenancy scoping
 * - incrementUsage: boolean (optional) - Track usage (default: true)
 *
 * Response (200):
 * {
 *   "data": {
 *     "id": 1,
 *     "slug": "nextjs-server-components",
 *     "title": "Next.js Server Components",
 *     "content": "# Overview\n\nServer Components allow you to...",
 *     "category": "framework",
 *     "description": "Patterns for using React Server Components",
 *     "tags": ["nextjs", "react", "server-components"],
 *     "frameworks": ["Next.js 14", "React 18"],
 *     "usageCount": 6,
 *     "lastLoadedAt": "2025-11-13T15:00:00.000Z",
 *     "createdAt": "2025-11-13T10:00:00.000Z",
 *     "updatedAt": "2025-11-13T15:00:00.000Z"
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (404): { "error": "Skill not found", "code": "SKILL_NOT_FOUND" }
 * Response (500): { "error": "Failed to load skill" }
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate projectId (required)
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

    const requestedProjectId = parseInt(projectIdParam, 10);
    if (isNaN(requestedProjectId) || requestedProjectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Extract incrementUsage param (default: true)
    const incrementUsageParam = searchParams.get('incrementUsage');
    const incrementUsage = incrementUsageParam !== 'false'; // Default true

    // US-094: Check cache first (auto-unload after 5 minutes)
    const cached = skillsCache.get(projectId, slug);
    if (cached) {
      console.log(`[GET /api/skills/${slug}] Cache hit (id: ${cached.id})`);

      // Still increment usage even for cached hits
      if (incrementUsage) {
        // Fire-and-forget database update (don't wait)
        prisma.skill
          .update({
            where: { id: cached.id },
            data: {
              usageCount: { increment: 1 },
              lastLoadedAt: new Date(),
            },
          })
          .catch((err) => console.error(`[GET /api/skills/${slug}] Failed to update usage:`, err));

        // Update cached value
        cached.usageCount += 1;
        cached.lastLoadedAt = new Date();
      }

      return NextResponse.json({ data: cached });
    }

    // Cache miss: fetch from database
    const skill = await prisma.skill.findFirst({
      where: {
        projectId,
        slug,
      },
    });

    if (!skill) {
      return NextResponse.json(
        {
          error: `Skill with slug "${slug}" not found in project ${projectId}`,
          code: 'SKILL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // US-103: Track usage (increment usageCount, update lastLoadedAt)
    if (incrementUsage) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          usageCount: {
            increment: 1,
          },
          lastLoadedAt: new Date(),
        },
      });

      // Update in-memory values for response
      skill.usageCount += 1;
      skill.lastLoadedAt = new Date();
    }

    // US-094: Store in cache (auto-unload after 5 minutes)
    skillsCache.set(projectId, slug, skill);

    console.log(
      `[GET /api/skills/${slug}] Loaded skill from DB and cached (id: ${skill.id}, usage: ${skill.usageCount})`
    );

    return NextResponse.json({
      data: skill,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error(`[GET /api/skills/[slug]] Failed to load skill:`, error);
    return NextResponse.json(
      {
        error: 'Failed to load skill',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/skills/[slug]
 *
 * Update an existing skill (partial update).
 * slug cannot be changed (use DELETE + POST to change slug).
 *
 * Query params:
 * - projectId: number (required) - Project ID for multi-tenancy scoping
 *
 * Request body (all fields optional):
 * {
 *   "title": "Updated Title",
 *   "content": "# Updated content...",
 *   "category": "testing",
 *   "description": "Updated description",
 *   "tags": ["react", "hooks", "performance"],
 *   "frameworks": ["React 18"]
 * }
 *
 * Response (200):
 * {
 *   "data": {
 *     "id": 1,
 *     "slug": "nextjs-server-components",
 *     "title": "Updated Title",
 *     "content": "# Updated content...",
 *     // ... other fields
 *     "updatedAt": "2025-11-13T16:00:00.000Z"
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (404): { "error": "Skill not found", "code": "SKILL_NOT_FOUND" }
 * Response (500): { "error": "Failed to update skill" }
 */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate projectId (required)
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

    const requestedProjectId = parseInt(projectIdParam, 10);
    if (isNaN(requestedProjectId) || requestedProjectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Parse and validate request body
    const body = await request.json();
    const validation = updateSkillSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Check if skill exists
    const existing = await prisma.skill.findFirst({
      where: {
        projectId,
        slug,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: `Skill with slug "${slug}" not found in project ${projectId}`,
          code: 'SKILL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update skill
    const updated = await prisma.skill.update({
      where: { id: existing.id },
      data: validation.data,
    });

    // US-094: Invalidate cache after update
    skillsCache.invalidate(projectId, slug);

    console.log(
      `[PATCH /api/skills/${slug}] Updated skill (id: ${updated.id}) and invalidated cache`
    );

    return NextResponse.json({
      data: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

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

    console.error(`[PATCH /api/skills/[slug]] Failed to update skill:`, error);
    return NextResponse.json(
      {
        error: 'Failed to update skill',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills/[slug]
 *
 * Delete a skill (cascade deletes skill-knowledge links).
 *
 * Query params:
 * - projectId: number (required) - Project ID for multi-tenancy scoping
 *
 * Response (200):
 * {
 *   "data": {
 *     "deleted": true,
 *     "slug": "nextjs-server-components",
 *     "id": 1
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (404): { "error": "Skill not found", "code": "SKILL_NOT_FOUND" }
 * Response (500): { "error": "Failed to delete skill" }
 */
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate projectId (required)
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

    const requestedProjectId = parseInt(projectIdParam, 10);
    if (isNaN(requestedProjectId) || requestedProjectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Find skill
    const skill = await prisma.skill.findFirst({
      where: {
        projectId,
        slug,
      },
      select: { id: true, slug: true },
    });

    if (!skill) {
      return NextResponse.json(
        {
          error: `Skill with slug "${slug}" not found in project ${projectId}`,
          code: 'SKILL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Delete skill (cascade deletes skill-knowledge links)
    await prisma.skill.delete({
      where: { id: skill.id },
    });

    // US-094: Invalidate cache after deletion
    skillsCache.invalidate(projectId, slug);

    console.log(
      `[DELETE /api/skills/${slug}] Deleted skill (id: ${skill.id}) and invalidated cache`
    );

    return NextResponse.json({
      data: {
        deleted: true,
        slug: skill.slug,
        id: skill.id,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error(`[DELETE /api/skills/[slug]] Failed to delete skill:`, error);
    return NextResponse.json(
      {
        error: 'Failed to delete skill',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
