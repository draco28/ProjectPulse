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

    // Sprint 8.5 Phase 1: Roadmap Materialization after Session 3
    if (sessionNumber === 3) {
      try {
        // Dynamic import to avoid circular dependencies
        // @ts-ignore - Cross-package import from monorepo, types available at runtime
        const { parseProjectPlan } = await import('../../../../mcp-server/src/tools/roadmap/parseProjectPlan.js');
        // @ts-ignore - Cross-package import from monorepo, types available at runtime
        const { materializeRoadmap } = await import('../../../../mcp-server/src/tools/roadmap/materializeTool.js');

        // Find 13-Project-Plan.md document
        const projectPlanDoc = await db.document.findFirst({
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
          console.log('[Session 3] Found 13-Project-Plan.md, starting materialization');

          // Parse markdown to extract roadmap structure
          const parsedRoadmap = await parseProjectPlan(projectPlanDoc.id);
          console.log('[Session 3] Parsed roadmap:', {
            phases: parsedRoadmap.phases.length,
            sprints: parsedRoadmap.phases.reduce((sum: number, p: any) => sum + p.sprints.length, 0),
          });

          // Create Roadmap record with phases JSON
          const roadmap = await db.roadmap.create({
            data: {
              projectId,
              phases: parsedRoadmap, // JSONB field
            },
          });
          console.log('[Session 3] Created Roadmap record:', roadmap.id);

          // Materialize JSON → Phase/Sprint/Week/Day records
          const materializationResult = await materializeRoadmap(roadmap.id);
          console.log('[Session 3] Materialization complete:', materializationResult.counts);

          // Update session response with roadmap data
          await db.onboardingSession.update({
            where: { id: session.id },
            data: {
              response: {
                ...data,
                roadmapId: roadmap.id,
                materialization: materializationResult.counts,
              },
            },
          });

          // Step 8: Create initial DevelopmentSession (onboarding summary)
          try {
            console.log('[Session 3] Creating initial DevelopmentSession');

            // Extract phases from materialization for goals
            const firstPhase = parsedRoadmap.phases[0];
            const goals = firstPhase?.sprints?.[0]?.goals || [
              'Complete Session 1-3 onboarding',
              'Review generated documentation',
              'Begin Phase 1 development',
            ];

            // Create onboarding summary plan
            const onboardingSummary = `
# Onboarding Complete

## Session 1: Executive Summary
- Answered strategic questions
- Defined project vision and goals
- Established success criteria

## Session 2: Documentation Generation
- Created 13+ industry-grade documents
- Generated project plan: ${parsedRoadmap.phases.length} phases
- Established development roadmap

## Session 3: ProjectPulse Configuration
- Materialized roadmap: ${materializationResult.counts.phases} phases, ${materializationResult.counts.sprints} sprints, ${materializationResult.counts.weeks} weeks, ${materializationResult.counts.days} days
- Database records created
- Ready for development tracking

## Next Steps
1. Review roadmap at /roadmap
2. Agent starts ${firstPhase?.name || 'Phase 1'}
3. Track progress via CurrentWorkModal
            `.trim();

            // Extract todos from first sprint
            const firstSprint = firstPhase?.sprints?.[0];
            const todos = firstSprint?.weeks?.[0]?.days?.slice(0, 5).map((day: any) => ({
              content: day.focus || day.name,
              status: 'pending',
              priority: 'medium',
            })) || [
              { content: 'Review generated documentation', status: 'pending', priority: 'high' },
              { content: 'Verify roadmap structure', status: 'pending', priority: 'high' },
              { content: 'Begin first development phase', status: 'pending', priority: 'medium' },
            ];

            // Create DevelopmentSession record
            const devSession = await db.developmentSession.create({
              data: {
                projectId,
                phase: 'Session 3: Onboarding Complete',
                goals,
                plan: onboardingSummary,
                todos,
                progress: `Onboarding completed successfully at ${now.toISOString()}`,
                status: 'COMPLETED',
                completedAt: now,
              },
            });

            console.log('[Session 3] DevelopmentSession created:', devSession.id);

            // Update session response with devSession reference
            await db.onboardingSession.update({
              where: { id: session.id },
              data: {
                response: {
                  ...data,
                  roadmapId: roadmap.id,
                  materialization: materializationResult.counts,
                  developmentSessionId: devSession.id, // Link to session
                },
              },
            });
          } catch (error) {
            // Log error but don't fail the request
            console.error('[Session 3] DevelopmentSession creation failed:', error);
            console.error('[Session 3] Continuing without development session');
          }
        } else {
          console.warn('[Session 3] 13-Project-Plan.md not found, skipping materialization');
        }
      } catch (error) {
        // Log error but don't fail the request
        console.error('[Session 3] Materialization failed:', error);
        console.error('[Session 3] Continuing without roadmap materialization');
      }
    }

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
