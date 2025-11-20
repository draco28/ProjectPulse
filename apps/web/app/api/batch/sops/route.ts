import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const sopSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().min(1),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).default([])
});

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  sops: z.array(sopSchema).min(1).max(10)
});

//=============================================================================
// POST /api/batch/sops
//=============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[POST /api/batch/sops] Request received', {
      projectId: body.projectId,
      count: body.sops?.length
    });
    
    // 1. Validate request
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('[POST /api/batch/sops] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }
    
    const { projectId, sops } = validation.data;
    
    // 2. Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', projectId },
        { status: 404 }
      );
    }
    
    // 3. Check for duplicate slugs
    const existingSOPs = await prisma.sOP.findMany({
      where: {
        projectId,
        slug: { in: sops.map(s => s.slug) }
      },
      select: { slug: true }
    });
    
    const duplicates = existingSOPs.map(s => s.slug);
    
    if (duplicates.length > 0) {
      console.warn('[POST /api/batch/sops] Duplicates found', { duplicates });
    }
    
    // 4. Filter out duplicates
    const newSOPs = sops.filter(s => !duplicates.includes(s.slug));
    
    if (newSOPs.length === 0) {
      return NextResponse.json({
        success: true,
        projectId,
        created: 0,
        duplicates,
        skipped: sops.length,
        message: `All ${sops.length} SOPs already exist. 0 created.`
      });
    }
    
    // 5. Bulk create SOPs in transaction
    const createdSOPs = await prisma.$transaction(
      newSOPs.map(sop =>
        prisma.sOP.create({
          data: {
            projectId,
            ...sop
          }
        })
      )
    );
    
    console.log('[POST /api/batch/sops] SOPs created', {
      projectId,
      created: createdSOPs.length,
      duplicates: duplicates.length
    });
    
    return NextResponse.json({
      success: true,
      projectId,
      created: createdSOPs.length,
      duplicates,
      skipped: duplicates.length,
      total: sops.length,
      message: `Created ${createdSOPs.length}/${sops.length} SOPs. ${duplicates.length} duplicates skipped.`
    });
    
  } catch (error) {
    console.error('[POST /api/batch/sops] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create SOP batch',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
