import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * POST /api/workflows/run
 * Start a new workflow run
 *
 * Body:
 * - templateId: number
 * - projectId?: number (optional)
 * - initialContext?: Record<string, any> (optional)
 *
 * @returns {runId, status, currentStep, nextStepName}
 */

const startWorkflowSchema = z.object({
  templateId: z.number().int().positive(),
  projectId: z.number().int().positive().optional(),
  initialContext: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    const validation = startWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: `Invalid request: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { templateId, projectId, initialContext } = validation.data;

    // Fetch template
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        {
          data: null,
          error: `Workflow template with ID ${templateId} not found`,
        },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        {
          data: null,
          error: `Workflow template "${template.name}" is inactive`,
        },
        { status: 400 }
      );
    }

    // Verify project exists if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return NextResponse.json(
          {
            data: null,
            error: `Project with ID ${projectId} not found`,
          },
          { status: 404 }
        );
      }
    }

    // Get steps from template
    const steps = Array.isArray(template.steps) ? template.steps : [];
    if (steps.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: `Workflow template "${template.name}" has no steps defined`,
        },
        { status: 400 }
      );
    }

    // Create workflow run
    const workflowRun = await prisma.workflowRun.create({
      data: {
        templateId,
        projectId,
        status: 'pending',
        currentStep: 1,
        context: initialContext || {},
      },
    });

    // Create step records
    await Promise.all(
      steps.map((step) => {
        const typedStep = step as { stepNumber: number; name: string };
        return prisma.workflowStep.create({
          data: {
            runId: workflowRun.id,
            stepNumber: typedStep.stepNumber,
            name: typedStep.name,
            status: 'pending',
          },
        });
      })
    );

    // Get first step name
    const firstStep = steps[0] as { name?: string } | undefined;

    return NextResponse.json({
      data: {
        runId: workflowRun.id,
        status: 'pending',
        currentStep: 1,
        nextStepName: firstStep?.name || 'Unknown',
      },
      error: null,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Error starting workflow run'
    );
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to start workflow run',
      },
      { status: 500 }
    );
  }
}
