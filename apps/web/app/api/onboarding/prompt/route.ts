import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPromptSchema, type GetPromptResponse } from '@/lib/validations/onboarding';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/onboarding/prompt
 *
 * Retrieve onboarding prompt template for a specific session
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID
 * - sessionNumber: number (optional) - 1, 2, or 3. If omitted, returns next incomplete session
 *
 * Response:
 * - 200: Prompt template with pre-filled variables from prior sessions
 * - 400: Validation error (invalid projectId or sessionNumber)
 * - 404: Project not found or all sessions complete
 * - 500: Server error
 *
 * @see US-030: onboarding.getPrompt MCP tool
 * @see FR-030: MCP Tool onboarding.getPrompt()
 */
export const dynamic = 'force-dynamic'; // No caching for session state

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      projectId: searchParams.get('projectId'),
      sessionNumber: searchParams.get('sessionNumber'),
    };

    const validation = getPromptSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { projectId, sessionNumber: requestedSession } = validation.data;

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Determine which session to return
    let targetSessionNumber: number;

    if (requestedSession !== undefined) {
      // Explicit session number provided
      targetSessionNumber = requestedSession;
    } else {
      // Compute next incomplete session
      const sessions = await prisma.onboardingSession.findMany({
        where: { projectId },
        orderBy: { sessionNumber: 'asc' },
      });

      const completedSessions = sessions.filter((s: { status: string }) => s.status === 'complete');
      const nextSession = completedSessions.length + 1;

      if (nextSession > 3) {
        return NextResponse.json({ error: 'All onboarding sessions complete' }, { status: 404 });
      }

      targetSessionNumber = nextSession;
    }

    // Fetch active template for target session
    const template = await prisma.onboardingTemplate.findUnique({
      where: {
        sessionNumber_isActive: {
          sessionNumber: targetSessionNumber,
          isActive: true,
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: `No active template found for session ${targetSessionNumber}` },
        { status: 404 }
      );
    }

    // Fetch prior session responses to prefill variables
    const priorSessions = await prisma.onboardingSession.findMany({
      where: {
        projectId,
        sessionNumber: { lt: targetSessionNumber },
        status: 'complete',
      },
      orderBy: { sessionNumber: 'asc' },
    });

    // Merge all prior session responses into resolved variables
    const resolvedVariables: Record<string, string> = {};
    for (const session of priorSessions) {
      if (session.response && typeof session.response === 'object') {
        Object.assign(resolvedVariables, session.response);
      }
    }

    // Extract expected variables from template metadata
    const variables = template.variables as { expectedVariables?: string[] };
    const expectedVariables = variables.expectedVariables || [];

    const response: GetPromptResponse = {
      sessionNumber: targetSessionNumber as 1 | 2 | 3,
      sessionName: template.name,
      promptTemplate: template.promptTemplate,
      expectedVariables,
      resolvedVariables,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch onboarding prompt'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch onboarding prompt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
