import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const agentPersonaSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  systemPrompt: z.string().min(10),
  skills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  icon: z.string().optional(),
  expertise: z.array(z.string()).default([]),
  personality: z.string().optional(),
  isActive: z.boolean().default(true),
  isBuiltIn: z.boolean().default(false)
});

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  personas: z.array(agentPersonaSchema).min(1).max(10)
});

//=============================================================================
// POST /api/batch/agent-personas
//=============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[POST /api/batch/agent-personas] Request received', {
      projectId: body.projectId,
      count: body.personas?.length
    });
    
    // 1. Validate request
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('[POST /api/batch/agent-personas] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }
    
    const { projectId, personas } = validation.data;
    
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
    
    // 3. Check for duplicate names/slugs in existing personas
    const existingPersonas = await prisma.agentPersona.findMany({
      where: {
        projectId,
        OR: [
          { name: { in: personas.map(p => p.name) } },
          { slug: { in: personas.map(p => p.slug) } }
        ]
      },
      select: { name: true, slug: true }
    });
    
    const duplicateNames = existingPersonas.map(p => p.name);
    const duplicateSlugs = existingPersonas.map(p => p.slug);
    const duplicates = [...new Set([...duplicateNames, ...duplicateSlugs])];
    
    if (duplicates.length > 0) {
      console.warn('[POST /api/batch/agent-personas] Duplicates found', { duplicates });
    }
    
    // 4. Filter out duplicates, create only new personas
    const newPersonas = personas.filter(p => 
      !duplicateNames.includes(p.name) && !duplicateSlugs.includes(p.slug)
    );
    
    if (newPersonas.length === 0) {
      return NextResponse.json({
        success: true,
        projectId,
        created: 0,
        duplicates,
        skipped: personas.length,
        message: `All ${personas.length} personas already exist. 0 created.`
      });
    }
    
    // 5. Bulk create personas in transaction
    const createdPersonas = await prisma.$transaction(
      newPersonas.map(persona =>
        prisma.agentPersona.create({
          data: {
            projectId,
            ...persona
          }
        })
      )
    );
    
    console.log('[POST /api/batch/agent-personas] Personas created', {
      projectId,
      created: createdPersonas.length,
      duplicates: duplicates.length
    });
    
    return NextResponse.json({
      success: true,
      projectId,
      created: createdPersonas.length,
      duplicates,
      skipped: duplicates.length,
      total: personas.length,
      message: `Created ${createdPersonas.length}/${personas.length} personas. ${duplicates.length} duplicates skipped.`
    });
    
  } catch (error) {
    console.error('[POST /api/batch/agent-personas] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create agent persona batch',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
