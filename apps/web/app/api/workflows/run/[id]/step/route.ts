import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * POST /api/workflows/run/:id/step
 * Execute the next step in a workflow run
 *
 * Body:
 * - stepResult?: Record<string, any> (result from completed step)
 *
 * @returns {stepNumber, stepName, status, nextStep, workflowStatus}
 */

const executeStepSchema = z.object({
  stepResult: z.record(z.any()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const validation = executeStepSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: `Invalid request: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { stepResult } = validation.data;

    // Fetch workflow run
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

    // Validate workflow state
    if (workflowRun.status === 'completed') {
      return NextResponse.json(
        {
          data: null,
          error: 'Workflow run is already completed',
        },
        { status: 400 }
      );
    }

    if (workflowRun.status === 'failed') {
      return NextResponse.json(
        {
          data: null,
          error: 'Workflow run has failed',
        },
        { status: 400 }
      );
    }

    if (workflowRun.status === 'paused') {
      return NextResponse.json(
        {
          data: null,
          error: 'Workflow run is paused. Use workflow.resume to continue',
        },
        { status: 400 }
      );
    }

    const currentStepNumber = workflowRun.currentStep;
    const currentStep = workflowRun.steps.find(
      (s) => s.stepNumber === currentStepNumber
    );

    if (!currentStep) {
      return NextResponse.json(
        {
          data: null,
          error: `Current step ${currentStepNumber} not found`,
        },
        { status: 500 }
      );
    }

    // Update current step as completed
    await prisma.workflowStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'completed',
        result: stepResult || {},
        completedAt: new Date(),
        startedAt: currentStep.startedAt || new Date(),
      },
    });

    const templateSteps = Array.isArray(workflowRun.template.steps)
      ? workflowRun.template.steps
      : [];
    const totalSteps = templateSteps.length;

    // Check if workflow is complete
    if (currentStepNumber >= totalSteps) {
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        data: {
          stepNumber: currentStepNumber,
          stepName: currentStep.name,
          status: 'completed',
          nextStep: null,
          workflowStatus: 'completed',
        },
        error: null,
      });
    }

    // Move to next step
    const nextStepNumber = currentStepNumber + 1;
    const nextTemplateStep = templateSteps[nextStepNumber - 1] as any;
    const nextStep = workflowRun.steps.find((s) => s.stepNumber === nextStepNumber);

    if (!nextStep) {
      return NextResponse.json(
        {
          data: null,
          error: `Next step ${nextStepNumber} not found`,
        },
        { status: 500 }
      );
    }

    // Update workflow run to next step
    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        currentStep: nextStepNumber,
        status: 'running',
      },
    });

    // Mark next step as running
    await prisma.workflowStep.update({
      where: { id: nextStep.id },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: {
        stepNumber: currentStepNumber,
        stepName: currentStep.name,
        status: 'completed',
        nextStep: {
          stepNumber: nextStepNumber,
          name: nextStep.name,
          description: nextTemplateStep?.description || '',
        },
        workflowStatus: 'running',
      },
      error: null,
    });
  } catch (error) {
    console.error('Error executing workflow step:', error);
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to execute workflow step',
      },
      { status: 500 }
    );
  }
}
