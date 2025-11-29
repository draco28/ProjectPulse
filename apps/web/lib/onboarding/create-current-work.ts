/**
 * CurrentPlan & CurrentTodos Creation for Session 3 Onboarding
 * 
 * Purpose: Initialize CurrentPlan and CurrentTodos for first week/day
 * Used by: Bootstrap API route
 * 
 * Architecture: Template-based (reads first week/day from materialized roadmap)
 */

import { prisma } from '@/lib/prisma';

/**
 * Create initial CurrentPlan and CurrentTodos
 * 
 * @param projectId - Project ID
 * @param roadmapId - Roadmap ID (after materialization)
 * @returns Promise<void>
 */
export async function createInitialCurrentWork(
  projectId: number,
  roadmapId: string
): Promise<void> {
  console.log('[Session 3] Creating initial current work', { projectId, roadmapId });
  
  // Find first week and first day from materialized roadmap
  const firstWeek = await prisma.week.findFirst({
    where: {
      sprint: {
        phase: {
          roadmapId
        }
      }
    },
    include: {
      days: {
        orderBy: { startDate: 'asc' },
        take: 1
      },
      sprint: {
        include: {
          phase: true
        }
      }
    },
    orderBy: { startDate: 'asc' }
  });
  
  if (!firstWeek) {
    throw new Error(`No weeks found for roadmap ${roadmapId}`);
  }
  
  if (!firstWeek.days || firstWeek.days.length === 0) {
    throw new Error(`No days found for first week ${firstWeek.id}`);
  }
  
  const firstDay = firstWeek.days[0]!;
  
  console.log('[Session 3] Found first week/day', {
    weekId: firstWeek.id,
    weekTitle: firstWeek.title,
    dayId: firstDay.id,
    dayTitle: firstDay.title
  });
  
  // Create CurrentPlan
  try {
    await prisma.currentPlan.create({
      data: {
        projectId,
        weekId: firstWeek.id,
        dayId: firstDay.id,
        content: generateInitialPlanContent(firstWeek, firstDay),
        goals: [
          'Review all 15 generated documents from onboarding',
          'Verify roadmap structure at /roadmap',
          'Check agent personas at /agents',
          'Review skills library',
          'Set up development environment',
          'Begin Phase 1 implementation'
        ]
      }
    });
    
    console.log('[Session 3] CurrentPlan created successfully');
  } catch (error) {
    console.error('[Session 3] Failed to create CurrentPlan:', error);
    throw error;
  }
  
  // Create CurrentTodos
  try {
    await prisma.currentTodos.create({
      data: {
        projectId,
        weekId: firstWeek.id,
        dayId: firstDay.id,
        todos: [
          {
            content: 'Review all 15 generated documents from Session 2',
            status: 'pending',
            priority: 'high',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Verify roadmap structure at /roadmap',
            status: 'pending',
            priority: 'high',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Check agent personas at /agents',
            status: 'pending',
            priority: 'high',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Review skills library at /agents (Skills tab)',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Review workflows and SOPs at /workflows',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Set up development environment (install dependencies)',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Read CLAUDE.md and AGENTS.md in repository',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date().toISOString()
          },
          {
            content: 'Begin first development phase (from roadmap)',
            status: 'pending',
            priority: 'low',
            createdAt: new Date().toISOString()
          }
        ]
      }
    });
    
    console.log('[Session 3] CurrentTodos created successfully');
  } catch (error) {
    console.error('[Session 3] Failed to create CurrentTodos:', error);
    throw error;
  }
  
  console.log('[Session 3] Initial current work created successfully');
}

/**
 * Generate initial plan content markdown
 */
function generateInitialPlanContent(firstWeek: any, firstDay: any): string {
  const phaseName = firstWeek.sprint?.phase?.title || 'Phase 1';
  const sprintName = firstWeek.sprint?.title || 'Sprint 1';
  
  return `
# ${phaseName} → ${sprintName} → ${firstWeek.title}
## ${firstDay.title}

## 🎉 Welcome to ProjectPulse!

Congratulations! You've completed the 3-session onboarding and your project is fully configured.

### What's Been Set Up

1. **Strategic Planning** (Session 1)
   - ✅ Executive summary created
   - ✅ Project context captured
   - ✅ Tech stack detected

2. **Documentation** (Session 2)
   - ✅ 15 industry-standard documents generated
   - ✅ Complete project documentation available

3. **AI Workflow Bootstrap** (Session 3)
   - ✅ Agent personas configured (${firstWeek.sprint?.phase?.project?.id || 'multiple'} experts)
   - ✅ Skills library populated
   - ✅ Workflows and SOPs created
   - ✅ Development roadmap materialized
   - ✅ CLAUDE.md and AGENTS.md in your repository

### Today's Goals

**Primary Focus**: Get familiar with ProjectPulse and verify all onboarding artifacts.

1. **Review Documentation**
   - Read through the 15 generated documents
   - Verify project plan aligns with expectations
   - Check architecture and technical specifications

2. **Explore ProjectPulse Features**
   - Navigate to /roadmap to see full development plan
   - Visit /agents to see available expert personas
   - Check /workflows for workflow templates
   - Review /sops for standard operating procedures

3. **Set Up Development Environment**
   - Install dependencies
   - Configure environment variables
   - Verify database connection
   - Run initial tests

4. **Begin Development**
   - Start with first task from roadmap
   - Use agent personas for guidance
   - Follow workflows and SOPs

### Week Overview

**${firstWeek.title}**
${firstWeek.description || 'Foundation week - set up project and begin initial development.'}

### Next Steps

After completing today's todos:
1. Mark todos as complete in ProjectPulse
2. Move to next day's tasks
3. Use MCP tools to track progress
4. Consult expert agents when needed

---

**Current Position**: ${phaseName} / ${sprintName} / ${firstWeek.title} / ${firstDay.title}
**Status**: Ready to begin development 🚀
  `.trim();
}
