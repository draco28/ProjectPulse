import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Type definitions for blueprint response
interface BlueprintResponse {
  projectContextJson?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * GET /api/onboarding/blueprint
 *
 * Retrieve Session 3 blueprint data (project-context.json from onboarding)
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID
 *
 * Response:
 * - 200: Project context JSON with metadata, techStack, phases, timeline, budget
 * - 400: Validation error (invalid or missing projectId)
 * - 404: Project not found or Session 3 not completed
 * - 500: Server error
 *
 * @see Sprint 8.5 Phase 2: Blueprint MCP Tool
 */
export const dynamic = 'force-dynamic'; // No caching for session state

// Validation schema
const getBlueprintSchema = z.object({
  projectId: z.string().regex(/^\d+$/, 'Project ID must be a number').transform(Number),
});

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      projectId: searchParams.get('projectId'),
    };

    const validation = getBlueprintSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.error.format(),
          message: 'projectId query parameter required and must be a positive integer',
        },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Query OnboardingSession for Session 3 (Bootstrap)
    const session = await prisma.onboardingSession.findFirst({
      where: {
        projectId,
        sessionNumber: 3, // Session 3 = Bootstrap
        status: 'complete',
      },
      orderBy: { completedAt: 'desc' }, // Get most recent if multiple
      select: {
        id: true,
        sessionNumber: true,
        status: true,
        response: true,
        completedAt: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          error: 'Session 3 blueprint not found',
          message:
            'Session 3 (Bootstrap) has not been completed for this project. Complete onboarding first by running Sessions 1, 2, and 3.',
          troubleshooting: [
            'Verify project exists in database',
            'Check if Session 3 was completed (status = "complete")',
            'Run onboarding Sessions 1-3 via MCP tools',
          ],
        },
        { status: 404 }
      );
    }

    if (!session.response) {
      return NextResponse.json(
        {
          error: 'Session 3 response is empty',
          message:
            'Session 3 exists but response field is null. This may indicate an incomplete onboarding.',
          troubleshooting: [
            'Re-run Session 3 via onboarding.submitResponse()',
            'Verify Session 2 populated project-context.json',
            'Check database for response JSONB field corruption',
          ],
        },
        { status: 404 }
      );
    }

    // Parse response (should contain projectContextJson)
    const blueprint = session.response as BlueprintResponse;

    // Return project-context.json (defensive parsing)
    const projectContext = blueprint.projectContextJson || blueprint;

    return NextResponse.json(projectContext, { status: 200 });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Blueprint API error'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
