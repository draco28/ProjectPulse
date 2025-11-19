/**
 * POST /api/onboarding/bootstrap
 * 
 * Session 3: AI Workflow Bootstrap
 * 
 * Purpose: Create project-specific AI workflow artifacts:
 * - Agent personas (3-5 based on tech stack)
 * - Skills library (5-10 based on tech stack)
 * - Workflow templates (3 static)
 * - SOPs (5 static)
 * - Roadmap materialization (from 13-Project-Plan.md)
 * - CurrentPlan & CurrentTodos (initial state)
 * - CLAUDE.md & AGENTS.md (write to user's repo)
 * 
 * Architecture: Template-based (NO AI generation)
 * Prerequisite: Sessions 1 & 2 must be complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Session 3 library imports
import { detectTechStack } from '@/lib/onboarding/tech-stack-detection';
import { createAgentPersonas } from '@/lib/onboarding/create-agent-personas';
import { createSkills } from '@/lib/onboarding/create-skills';
import { createWorkflowsAndSOPs } from '@/lib/onboarding/create-workflows-sops';
import { createInitialCurrentWork } from '@/lib/onboarding/create-current-work';
import { writeRepoFiles } from '@/lib/onboarding/generate-repo-files';

// Roadmap tools (Sprint 8.5)
import { parseProjectPlan, materializeRoadmap } from '@projectpulse/roadmap-tools';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const bootstrapRequestSchema = z.object({
  projectId: z.number().int().positive(),
  repoPath: z.string().min(1).max(500)
});

type BootstrapRequest = z.infer<typeof bootstrapRequestSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[POST /api/onboarding/bootstrap] Starting Session 3...');
  
  try {
    // 1. Validate request
    const body = await request.json();
    const validation = bootstrapRequestSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[POST /api/onboarding/bootstrap] Validation failed:', validation.error);
      
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { projectId, repoPath }: BootstrapRequest = validation.data;
    
    console.log('[POST /api/onboarding/bootstrap] Request validated', {
      projectId,
      repoPath
    });
    
    // 2. Verify Sessions 1 & 2 complete
    const [session1, session2] = await Promise.all([
      prisma.onboardingSession.findUnique({
        where: {
          projectId_sessionNumber: { projectId, sessionNumber: 1 }
        },
        select: {
          id: true,
          status: true,
          response: true
        }
      }),
      prisma.onboardingSession.findUnique({
        where: {
          projectId_sessionNumber: { projectId, sessionNumber: 2 }
        },
        select: {
          id: true,
          status: true
        }
      })
    ]);
    
    if (!session1 || session1.status !== 'complete') {
      return NextResponse.json(
        { error: 'Session 1 must be complete before starting Session 3' },
        { status: 400 }
      );
    }
    
    if (!session2 || session2.status !== 'complete') {
      return NextResponse.json(
        { error: 'Session 2 must be complete before starting Session 3' },
        { status: 400 }
      );
    }
    
    console.log('[POST /api/onboarding/bootstrap] Sessions 1 & 2 verified ✅');
    
    // 3. Extract project context from Session 1
    const projectContextJson = session1.response as any;
    const projectContext = projectContextJson.projectContextJson || projectContextJson;
    const projectName = projectContext.metadata?.projectName || 'Unknown Project';
    const projectType = projectContext.metadata?.projectType || 'web application';
    
    console.log('[POST /api/onboarding/bootstrap] Project context loaded', {
      projectName,
      projectType
    });
    
    // 4. Detect tech stack
    const techStack = detectTechStack(projectContext);
    
    console.log('[POST /api/onboarding/bootstrap] Tech stack detected', techStack);
    
    // 5. Create agent personas
    const agentPersonasCount = await createAgentPersonas(projectId, techStack);
    
    console.log(`[POST /api/onboarding/bootstrap] Created ${agentPersonasCount} agent personas ✅`);
    
    // 6. Create skills
    const skillsCount = await createSkills(projectId, projectType, techStack);
    
    console.log(`[POST /api/onboarding/bootstrap] Created ${skillsCount} skills ✅`);
    
    // 7. Create workflows & SOPs
    const { workflows, sops } = await createWorkflowsAndSOPs(projectId);
    
    console.log(`[POST /api/onboarding/bootstrap] Created ${workflows} workflows, ${sops} SOPs ✅`);
    
    // 8. Materialize roadmap from 13-Project-Plan.md
    console.log('[POST /api/onboarding/bootstrap] Starting roadmap materialization...');
    
    // Find 13-Project-Plan.md document from Session 2
    const projectPlanDoc = await prisma.document.findFirst({
      where: {
        onboardingSessionId: session1.id,  // Documents are linked to session1, not session2
        filename: {
          contains: '13-Project-Plan'
        }
      },
      select: {
        id: true,
        content: true,
        filename: true
      }
    });
    
    if (!projectPlanDoc) {
      return NextResponse.json(
        { error: '13-Project-Plan.md document not found. Session 2 may be incomplete.' },
        { status: 404 }
      );
    }
    
    console.log('[POST /api/onboarding/bootstrap] Found 13-Project-Plan.md', {
      docId: projectPlanDoc.id,
      filename: projectPlanDoc.filename
    });
    
    // Parse project plan to extract roadmap structure
    const parsedRoadmap = await parseProjectPlan(projectPlanDoc.id);
    
    console.log('[POST /api/onboarding/bootstrap] Project plan parsed', {
      phases: parsedRoadmap.phases.length,
      totalSprints: parsedRoadmap.phases.reduce((sum, phase) => sum + phase.sprints.length, 0)
    });
    
    // Create Roadmap record with parsed JSON
    const roadmap = await prisma.roadmap.create({
      data: {
        projectId,
        phases: parsedRoadmap as any, // Store as JSONB
        currentPhase: parsedRoadmap.phases[0]?.name || null,
        currentSprint: parsedRoadmap.phases[0]?.sprints[0]?.name || null,
        currentWeek: null
      }
    });
    
    console.log('[POST /api/onboarding/bootstrap] Roadmap record created', {
      roadmapId: roadmap.id
    });
    
    // Materialize roadmap (create Phase/Sprint/Week/Day records)
    const materializationResult = await materializeRoadmap(roadmap.id);
    
    console.log('[POST /api/onboarding/bootstrap] Roadmap materialized ✅', {
      phases: materializationResult.counts.phases,
      sprints: materializationResult.counts.sprints,
      weeks: materializationResult.counts.weeks,
      days: materializationResult.counts.days
    });
    
    // 9. Create CurrentPlan & CurrentTodos
    await createInitialCurrentWork(projectId, roadmap.id);
    
    console.log('[POST /api/onboarding/bootstrap] Initial current work created ✅');
    
    // 10. Fetch created agent personas for CLAUDE.md/AGENTS.md
    const agentPersonas = await prisma.agentPersona.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        skills: true,
        tools: true,
        activationTriggers: true
      }
    });
    
    // 11. Write CLAUDE.md & AGENTS.md to user's repository
    const filesWritten = await writeRepoFiles(repoPath, projectName, agentPersonas);
    
    if (filesWritten.claudeMd && filesWritten.agentsMd) {
      console.log('[POST /api/onboarding/bootstrap] Repository files written ✅');
    } else {
      console.warn('[POST /api/onboarding/bootstrap] Some repository files failed to write:', filesWritten);
    }
    
    // 12. Create Session 3 record
    const session3 = await prisma.onboardingSession.create({
      data: {
        projectId,
        sessionNumber: 3,
        status: 'complete',
        response: {
          techStack,
          agentPersonasCreated: agentPersonasCount,
          skillsCreated: skillsCount,
          workflowsCreated: workflows,
          sopsCreated: sops,
          roadmapId: roadmap.id,
          roadmapStats: {
            phases: materializationResult.counts.phases,
            sprints: materializationResult.counts.sprints,
            weeks: materializationResult.counts.weeks,
            days: materializationResult.counts.days
          },
          currentPlanCreated: true,
          currentTodosCreated: true,
          filesWritten
        },
        startedAt: new Date(),
        completedAt: new Date()
      }
    });
    
    console.log('[POST /api/onboarding/bootstrap] Session 3 complete! ✅', {
      sessionId: session3.id
    });
    
    // 13. Return success response
    return NextResponse.json({
      success: true,
      session3Complete: true,
      sessionId: session3.id,
      created: {
        agentPersonas: agentPersonasCount,
        skills: skillsCount,
        workflows,
        sops,
        roadmap: {
          id: roadmap.id,
          phases: materializationResult.counts.phases,
          sprints: materializationResult.counts.sprints,
          weeks: materializationResult.counts.weeks,
          days: materializationResult.counts.days
        },
        currentPlan: true,
        currentTodos: true,
        files: filesWritten
      },
      message: 'Session 3 complete! Your project is fully configured for AI-assisted development.'
    }, { status: 201 });
    
  } catch (error) {
    console.error('[POST /api/onboarding/bootstrap] Error:', error);
    
    return NextResponse.json({
      error: 'Failed to bootstrap project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
