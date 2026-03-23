import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitResponseSchema, type SubmitResponseResponse } from '@/lib/validations/onboarding';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Type definitions for session response data
interface DocumentGenerated {
  filename: string;
  content: string;
  wordCount?: number;
  category?: string;
  tags?: string[];
}

interface ResponseData {
  projectPlanContent?: string;
  projectPlanWordCount?: number;
  documentsGenerated?: DocumentGenerated[];
  projectContextJson?: Record<string, unknown>;
}

interface ParsedPhase {
  sprints: unknown[];
}

interface ParsedRoadmap {
  phases: ParsedPhase[];
}

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
  const log = createRequestLogger(getRequestId(request));
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

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Upsert onboarding session
    const now = new Date();
    const session = await prisma.onboardingSession.upsert({
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

    // Sprint 8.5: Session 2 Document Creation
    if (sessionNumber === 2) {
      try {
        log.info({ session: 2 }, 'Creating Document records from response');

        // Check if response contains any document data
        const responseData = data as ResponseData;

        // Create 13-Project-Plan.md document (critical for Session 3)
        // Extract from response.projectPlanContent OR response.documentsGenerated OR response.projectContextJson
        if (
          responseData.projectPlanContent ||
          responseData.documentsGenerated ||
          responseData.projectContextJson
        ) {
          // Create 13-Project-Plan.md (Session 3 dependency)
          await prisma.document.create({
            data: {
              onboardingSessionId: session.id,
              filename: '13-Project-Plan.md',
              content:
                responseData.projectPlanContent ||
                '# Project Implementation Plan\n\n[Generated from Session 2]',
              wordCount: responseData.projectPlanWordCount || 0,
              category: 'planning',
              tags: ['roadmap', 'planning', 'session-2'],
            },
          });

          log.info({ session: 2 }, 'Created 13-Project-Plan.md document');

          // Optional: Create other documents if provided
          if (responseData.documentsGenerated && Array.isArray(responseData.documentsGenerated)) {
            for (const doc of responseData.documentsGenerated) {
              // Skip 13-Project-Plan.md (already created)
              if (doc.filename === '13-Project-Plan.md') continue;

              await prisma.document.create({
                data: {
                  onboardingSessionId: session.id,
                  filename: doc.filename,
                  content: doc.content,
                  wordCount: doc.wordCount || 0,
                  category: doc.category || 'planning',
                  tags: doc.tags || [],
                },
              });
            }

            log.info(
              { session: 2, count: responseData.documentsGenerated.length },
              'Documents created'
            );
          }
        }
      } catch (docError) {
        log.error(
          { session: 2, error: docError instanceof Error ? docError.message : String(docError) },
          'Document creation failed'
        );
        // Non-blocking: Continue even if document creation fails
        // Session 3 will use fallback logic
      }
    }

    // Sprint 8.5 Phase 1: Roadmap Materialization after Session 3
    if (sessionNumber === 3) {
      try {
        // Import from shared package (Sprint 8.5 Phase 1 - Architectural Fix)
        const { parseProjectPlan, materializeRoadmap } = await import(
          '@projectpulse/roadmap-tools'
        );

        // Find 13-Project-Plan.md document
        const projectPlanDoc = await prisma.document.findFirst({
          where: {
            onboardingSession: {
              projectId,
              sessionNumber: 2, // Session 2 creates documents
            },
            filename: {
              contains: '13-Project-Plan',
            },
          },
        });

        if (projectPlanDoc) {
          log.info({ session: 3 }, 'Found 13-Project-Plan.md, starting materialization');

          // Parse markdown to extract roadmap structure
          const parsedRoadmap = (await parseProjectPlan(projectPlanDoc.id)) as ParsedRoadmap;
          log.info(
            {
              session: 3,
              phases: parsedRoadmap.phases.length,
              sprints: parsedRoadmap.phases.reduce(
                (sum: number, p: ParsedPhase) => sum + p.sprints.length,
                0
              ),
            },
            'Parsed roadmap'
          );

          // Create Roadmap record with phases JSON
          const roadmap = await prisma.roadmap.create({
            data: {
              projectId,
              phases: parsedRoadmap as unknown as import('@prisma/client').Prisma.InputJsonValue, // JSONB field - cast for Prisma
            },
          });
          log.info({ session: 3, roadmapId: roadmap.id }, 'Created Roadmap record');

          // Materialize JSON → Phase/Sprint/Week/Day records
          const materializationResult = await materializeRoadmap(roadmap.id);
          log.info(
            { session: 3, counts: materializationResult.counts },
            'Materialization complete'
          );

          // Update session response with roadmap data
          await prisma.onboardingSession.update({
            where: { id: session.id },
            data: {
              response: {
                ...data,
                roadmapId: roadmap.id,
                materialization: materializationResult.counts,
              },
            },
          });

          // Sprint 12: DevelopmentSession model removed
          // Agent sessions are now created on-demand via MCP tools
          log.info({ session: 3 }, 'Roadmap materialization complete - ready for agent sessions');
        } else {
          log.warn({ session: 3 }, '13-Project-Plan.md not found, skipping materialization');
        }
      } catch (error) {
        // Log error but don't fail the request
        log.error(
          { session: 3, error: error instanceof Error ? error.message : String(error) },
          'Materialization failed'
        );
        log.warn({ session: 3 }, 'Continuing without roadmap materialization');
      }
    }

    // Compute next session
    let nextSession: number | null = null;
    if (sessionNumber < 3) {
      // Check if next session already exists
      const existingNextSession = await prisma.onboardingSession.findUnique({
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
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to submit onboarding response'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to submit onboarding response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
