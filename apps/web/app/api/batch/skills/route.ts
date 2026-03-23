import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const skillSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
});

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  skills: z.array(skillSchema).min(1).max(10),
});

//=============================================================================
// POST /api/batch/skills
//=============================================================================

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    log.info({ projectId: body.projectId, count: body.skills?.length }, 'Request received');

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

    const { projectId, skills } = validation.data;

    // 2. Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found', projectId }, { status: 404 });
    }

    // 3. Check for duplicate slugs
    const existingSkills = await prisma.skill.findMany({
      where: {
        projectId,
        slug: { in: skills.map((s) => s.slug) },
      },
      select: { slug: true },
    });

    const duplicates = existingSkills.map((s) => s.slug);

    if (duplicates.length > 0) {
      log.warn({ duplicates }, 'Duplicates found');
    }

    // 4. Filter out duplicates
    const newSkills = skills.filter((s) => !duplicates.includes(s.slug));

    if (newSkills.length === 0) {
      return NextResponse.json({
        success: true,
        projectId,
        created: 0,
        duplicates,
        skipped: skills.length,
        message: `All ${skills.length} skills already exist. 0 created.`,
      });
    }

    // 5. Bulk create skills in transaction
    const createdSkills = await prisma.$transaction(
      newSkills.map((skill) =>
        prisma.skill.create({
          data: {
            projectId,
            ...skill,
          },
        })
      )
    );

    log.info(
      { projectId, created: createdSkills.length, duplicates: duplicates.length },
      'Skills created'
    );

    return NextResponse.json({
      success: true,
      projectId,
      created: createdSkills.length,
      duplicates,
      skipped: duplicates.length,
      total: skills.length,
      message: `Created ${createdSkills.length}/${skills.length} skills. ${duplicates.length} duplicates skipped.`,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to create skill batch'
    );
    return NextResponse.json(
      {
        error: 'Failed to create skill batch',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
