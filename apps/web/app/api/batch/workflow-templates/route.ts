import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const workflowTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().min(1),
  steps: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        action: z.string(),
        dependencies: z.array(z.string()).optional(),
      })
    )
    .min(1),
  isActive: z.boolean().default(true),
});

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  workflows: z.array(workflowTemplateSchema).min(1).max(10),
});

//=============================================================================
// POST /api/batch/workflow-templates
//=============================================================================

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    log.info({ projectId: body.projectId, count: body.workflows?.length }, 'Request received');

    // 1. Validate request
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      log.warn({ error: validation.error }, 'Validation failed');
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { projectId, workflows } = validation.data;

    // 2. Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found', projectId }, { status: 404 });
    }

    // 3. Check for duplicate names
    const existingWorkflows = await prisma.workflowTemplate.findMany({
      where: {
        projectId,
        name: { in: workflows.map((w) => w.name) },
      },
      select: { name: true },
    });

    const duplicates = existingWorkflows.map((w) => w.name);

    if (duplicates.length > 0) {
      log.warn({ duplicates }, 'Duplicates found');
    }

    // 4. Filter out duplicates
    const newWorkflows = workflows.filter((w) => !duplicates.includes(w.name));

    if (newWorkflows.length === 0) {
      return NextResponse.json({
        success: true,
        projectId,
        created: 0,
        duplicates,
        skipped: workflows.length,
        message: `All ${workflows.length} workflow templates already exist. 0 created.`,
      });
    }

    // 5. Bulk create workflow templates in transaction
    const createdWorkflows = await prisma.$transaction(
      newWorkflows.map((workflow) =>
        prisma.workflowTemplate.create({
          data: {
            projectId,
            ...workflow,
          },
        })
      )
    );

    log.info(
      { projectId, created: createdWorkflows.length, duplicates: duplicates.length },
      'Workflow templates created'
    );

    return NextResponse.json({
      success: true,
      projectId,
      created: createdWorkflows.length,
      duplicates,
      skipped: duplicates.length,
      total: workflows.length,
      message: `Created ${createdWorkflows.length}/${workflows.length} workflow templates. ${duplicates.length} duplicates skipped.`,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to create workflow template batch'
    );
    return NextResponse.json(
      {
        error: 'Failed to create workflow template batch',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
