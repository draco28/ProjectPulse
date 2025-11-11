import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { submitResponseSchema, type SubmitResponseResponse } from '@/lib/validations/onboarding';

/**
 * POST /api/onboarding/responses
 *
 * Submit user/agent responses for a specific onboarding session
 *
 * Request Body:
 * - projectId: number (required) - Project ID
 * - sessionNumber: number (required) - 1, 2, or 3
 * - data: Record<string, any> (required) - Session response data (JSONB)
 *
 * Response:
 * - 200/201: Session response saved, returns status + next session
 * - 400: Validation error (invalid request body)
 * - 404: Project not found
 * - 500: Server error
 *
 * @see US-031: onboarding.submitResponse MCP tool
 * @see FR-031: MCP Tool onboarding.submitResponse()
 */
export const dynamic = 'force-dynamic'; // No caching for session mutations

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = submitResponseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { projectId, sessionNumber, data } = validation.data;

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Upsert onboarding session
    const now = new Date();
    const session = await db.onboardingSession.upsert({
      where: {
        projectId_sessionNumber: {
          projectId,
          sessionNumber,
        },
      },
      update: {
        response: data,
        status: 'complete',
        completedAt: now,
        updatedAt: now,
      },
      create: {
        projectId,
        sessionNumber,
        response: data,
        status: 'complete',
        startedAt: now,
        completedAt: now,
      },
    });

    // Compute next session
    let nextSession: number | null = null;
    if (sessionNumber < 3) {
      // Check if next session already exists
      const existingNextSession = await db.onboardingSession.findUnique({
        where: {
          projectId_sessionNumber: {
            projectId,
            sessionNumber: sessionNumber + 1,
          },
        },
      });

      // Only suggest next session if it doesn't exist or isn't complete
      if (!existingNextSession || existingNextSession.status !== 'complete') {
        nextSession = sessionNumber + 1;
      }
    }

    const response: SubmitResponseResponse = {
      sessionNumber: session.sessionNumber as 1 | 2 | 3,
      status: session.status as 'pending' | 'in_progress' | 'complete',
      nextSession: nextSession as 2 | 3 | null,
    };

    const isNewSession = session.createdAt.getTime() === session.updatedAt.getTime();
    const statusCode = isNewSession ? 201 : 200;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('[POST /api/onboarding/responses] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit onboarding response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
