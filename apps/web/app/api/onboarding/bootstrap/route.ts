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
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Session 3 library imports
import { detectTechStack } from '@/lib/onboarding/tech-stack-detection';
import { createAgentPersonas } from '@/lib/onboarding/create-agent-personas';
import { createSkills } from '@/lib/onboarding/create-skills';
import { createWorkflowsAndSOPs } from '@/lib/onboarding/create-workflows-sops';
import { createInitialCurrentWork } from '@/lib/onboarding/create-current-work';
import { writeRepoFiles } from '@/lib/onboarding/generate-repo-files';

// Roadmap tools (Sprint 8.5)
import { parseProjectPlan } from '@projectpulse/roadmap-tools';

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
          projectContextJson: true  // Sprint 9 Refactor: use projectContextJson instead of response
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
    // Sprint 9 Refactor: projectContextJson is now flat field, not nested in response
    const projectContext = (session1.projectContextJson as any) || {};
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
    // DEPRECATED: Roadmap materialization decoupled from Session 3 (Sprint 9 Fix)
    // We still parse the plan to get metadata if needed, but we DO NOT create roadmap records
    // or materialize them here. That will happen in a separate, manual step later.
    console.log('[POST /api/onboarding/bootstrap] Finding 13-Project-Plan.md for context...');

    // Find 13-Project-Plan.md document from Session 2
    // Sprint 9 Refactor: Documents are now linked to Session 2
    const projectPlanDoc = await prisma.document.findFirst({
      where: {
        onboardingSessionId: session2.id,  // Documents are linked to Session 2
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
    
    if (projectPlanDoc) {
      console.log('[POST /api/onboarding/bootstrap] Found 13-Project-Plan.md', {
        docId: projectPlanDoc.id,
        filename: projectPlanDoc.filename
      });
      
      // We parse it just to log/verify it's valid, but we don't use the output for DB creation
      try {
        // Sprint 9 Refactor: Only parsing for validation, not using the output
        await parseProjectPlan(projectPlanDoc.id);
        console.log('[POST /api/onboarding/bootstrap] Project plan parsed successfully (metadata only)');
      } catch (e) {
        console.warn('[POST /api/onboarding/bootstrap] Failed to parse project plan (non-fatal)', e);
      }
    } else {
      console.warn('[POST /api/onboarding/bootstrap] 13-Project-Plan.md not found. Skipping context parsing.');
    }
    
    // SKIPPED: Roadmap Record Creation
    // SKIPPED: Roadmap Materialization
    // SKIPPED: CurrentPlan & CurrentTodos (depends on roadmap)
    
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
        activationConditions: true
      }
    });
    
    // 11. Write CLAUDE.md & AGENTS.md to user's repository
    const filesWritten = await writeRepoFiles(repoPath, projectName, agentPersonas);
    
    if (filesWritten.claudeMd && filesWritten.agentsMd) {
      console.log('[POST /api/onboarding/bootstrap] Repository files written ✅');
    } else {
      console.warn('[POST /api/onboarding/bootstrap] Some repository files failed to write:', filesWritten);
    }
    
    // 12. Upsert Session 3 record (Sprint 9 Fix: Idempotency)
    // Use upsert to prevent conflicts with MCP agent's parallel usage
    const session3 = await prisma.onboardingSession.upsert({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 3 }
      },
      update: {
        status: 'complete',
        response: {
          techStack: techStack as unknown as Prisma.InputJsonValue,
          agentPersonasCreated: agentPersonasCount,
          skillsCreated: skillsCount,
          workflowsCreated: workflows,
          sopsCreated: sops,
          roadmapId: null,
          roadmapStats: null,
          currentPlanCreated: false,
          currentTodosCreated: false,
          filesWritten
        } as Prisma.InputJsonValue,
        completedAt: new Date()
      },
      create: {
        projectId,
        sessionNumber: 3,
        status: 'complete',
        response: {
          techStack: techStack as unknown as Prisma.InputJsonValue,
          agentPersonasCreated: agentPersonasCount,
          skillsCreated: skillsCount,
          workflowsCreated: workflows,
          sopsCreated: sops,
          roadmapId: null,
          roadmapStats: null,
          currentPlanCreated: false,
          currentTodosCreated: false,
          filesWritten
        } as Prisma.InputJsonValue,
        startedAt: new Date(),
        completedAt: new Date()
      }
    });
    
    console.log('[POST /api/onboarding/bootstrap] Session 3 complete! ✅', {
      sessionId: session3.id
    });
    
    // Revalidate paths to update dashboard immediately
    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    
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
        roadmap: null,
        currentPlan: false,
        currentTodos: false,
        files: filesWritten
      },
      message: 'Session 3 complete! Your project is fully configured for AI-assisted development. (Roadmap generation skipped)'
    }, { status: 201 });
    
  } catch (error) {
    console.error('[POST /api/onboarding/bootstrap] Error:', error);
    
    return NextResponse.json({
      error: 'Failed to bootstrap project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
