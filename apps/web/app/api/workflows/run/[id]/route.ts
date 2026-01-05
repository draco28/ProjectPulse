import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/workflows/run/:id
 * Get workflow run status and details
 *
 * @param params.id - Workflow run ID
 * @returns {run: {id, templateName, status, currentStep, totalSteps, completedSteps, context}}
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const runId = parseInt(params.id, 10);

    if (isNaN(runId)) {
      return NextResponse.json(
        {
          data: null,
          error: 'Invalid workflow run ID',
        },
        { status: 400 }
      );
    }

    const workflowRun = await prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        template: {
          select: {
            name: true,
            steps: true,
          },
        },
        steps: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    });

    if (!workflowRun) {
      return NextResponse.json(
        {
          data: null,
          error: `Workflow run with ID ${runId} not found`,
        },
        { status: 404 }
      );
    }

    const templateSteps = Array.isArray(workflowRun.template.steps)
      ? workflowRun.template.steps
      : [];
    const totalSteps = templateSteps.length;
    const completedSteps = workflowRun.steps.filter((s) => s.status === 'completed').length;

    return NextResponse.json({
      data: {
        run: {
          id: workflowRun.id,
          templateName: workflowRun.template.name,
          status: workflowRun.status,
          currentStep: workflowRun.currentStep,
          totalSteps,
          completedSteps,
          context: workflowRun.context,
          startedAt: workflowRun.startedAt,
          completedAt: workflowRun.completedAt,
          pausedAt: workflowRun.pausedAt,
          steps: workflowRun.steps.map((s) => ({
            stepNumber: s.stepNumber,
            name: s.name,
            status: s.status,
            startedAt: s.startedAt,
            completedAt: s.completedAt,
            error: s.error,
          })),
        },
      },
      error: null,
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching workflow run');
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to fetch workflow run',
      },
      { status: 500 }
    );
  }
}
