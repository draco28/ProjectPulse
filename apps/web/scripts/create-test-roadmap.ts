/**
 * Sprint 8.5: Manual Roadmap Creation Script
 *
 * Purpose: Create a test Roadmap for development/testing
 * Use: npx tsx scripts/create-test-roadmap.ts [projectId]
 *
 * This script:
 * 1. Creates a minimal ParsedRoadmap structure (without parsing 13-Project-Plan.md)
 * 2. Inserts it into the Roadmap table
 * 3. Enables UI development and testing without full Session 3 integration
 *
 * Note: Full Session 3 integration (parsing real docs) will be completed in Task A.2
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedRoadmap {
  phases: Array<{
    name: string;
    duration: string;
    sprints: Array<{
      name: string;
      duration: string;
      weeks: string;
      goals: string[];
      deliverables: string[];
      storyPoints: number;
    }>;
  }>;
}

/**
 * Test roadmap data based on actual 13-Project-Plan.md structure
 */
const TEST_ROADMAP: ParsedRoadmap = {
  phases: [
    {
      name: 'Phase A: Foundation & Core Infrastructure',
      duration: '6 weeks',
      sprints: [
        {
          name: 'Sprint 1: Foundation Setup',
          duration: '2 weeks',
          weeks: '1-2',
          goals: [
            'Set up development environment and tooling',
            'Initialize database schema with hierarchy models',
            'Create basic API structure',
          ],
          deliverables: [
            'PostgreSQL database with Phase/Week/Day/Task models',
            'Next.js 14 App Router structure',
            'Basic MCP server configuration',
          ],
          storyPoints: 12,
        },
        {
          name: 'Sprint 2: Wiki System',
          duration: '2 weeks',
          weeks: '3-4',
          goals: [
            'Implement documentation wiki system',
            'Create onboarding flow (3 sessions)',
            'Build wiki page management UI',
          ],
          deliverables: [
            'WikiPage CRUD API',
            'Onboarding session system',
            'Wiki editor with TipTap',
          ],
          storyPoints: 10,
        },
        {
          name: 'Sprint 3: Knowledge Base',
          duration: '2 weeks',
          weeks: '5-6',
          goals: [
            'Build knowledge management system',
            'Implement full-text search',
            'Create knowledge item workflows',
          ],
          deliverables: [
            'KnowledgeItem model and API',
            'PostgreSQL tsvector search',
            'Knowledge base UI',
          ],
          storyPoints: 11,
        },
      ],
    },
    {
      name: 'Phase B: Development Tools & Integration',
      duration: '4 weeks',
      sprints: [
        {
          name: 'Sprint 4: Issue Management',
          duration: '2 weeks',
          weeks: '7-8',
          goals: [
            'Build issue tracking system',
            'Implement issue workflows',
            'Create issue management UI',
          ],
          deliverables: [
            'Issue model and API',
            'Issue status transitions',
            'Issue list and detail pages',
          ],
          storyPoints: 9,
        },
      ],
    },
  ],
};

async function createTestRoadmap(projectId?: number) {
  try {
    // 1. Find or create project
    let project;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        console.error(`Project ${projectId} not found`);
        process.exit(1);
      }
    } else {
      // Create or get a test user
      const testUser = await prisma.user.upsert({
        where: { email: 'roadmap-test@local' },
        update: {},
        create: {
          id: 'roadmap-test-user-id',
          email: 'roadmap-test@local',
          name: 'Roadmap Test User',
          passwordHash: 'not-used-for-testing',
        },
      });

      // Create a test project
      project = await prisma.project.create({
        data: {
          name: 'Test Project for Roadmap',
          description: 'Automatically created for roadmap testing',
          ownerId: testUser.id,
        },
      });
      console.log(`Created test project: ${project.id}`);
    }

    // 2. Check if roadmap already exists
    const existingRoadmap = await prisma.roadmap.findUnique({
      where: { projectId: project.id },
    });

    if (existingRoadmap) {
      console.log(`Roadmap already exists for project ${project.id}`);
      console.log(`Roadmap ID: ${existingRoadmap.id}`);
      console.log(`Deleting existing roadmap...`);

      await prisma.roadmap.delete({
        where: { id: existingRoadmap.id },
      });
    }

    // 3. Create roadmap
    const roadmap = await prisma.roadmap.create({
      data: {
        projectId: project.id,
        phases: TEST_ROADMAP.phases as any, // Prisma Json type
        currentPhase: TEST_ROADMAP.phases[0]?.name,
        currentSprint: TEST_ROADMAP.phases[0]?.sprints[0]?.name,
      },
    });

    console.log('\n✅ Test roadmap created successfully!');
    console.log(`\nRoadmap ID: ${roadmap.id}`);
    console.log(`Project ID: ${project.id}`);
    console.log(`Project Name: ${project.name}`);
    console.log(`\nPhases: ${TEST_ROADMAP.phases.length}`);
    console.log(
      `Total Sprints: ${TEST_ROADMAP.phases.reduce((sum, p) => sum + p.sprints.length, 0)}`
    );
    console.log(`\nCurrent Position:`);
    console.log(`  Phase: ${roadmap.currentPhase}`);
    console.log(`  Sprint: ${roadmap.currentSprint}`);

    console.log(`\nNext step: Run materialization to create Phase/Sprint/Week/Day records`);
    console.log(`  (Task A.3: Materialization Tool)`);
  } catch (error) {
    console.error('Error creating test roadmap:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const projectId = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;

if (projectId && isNaN(projectId)) {
  console.error('Invalid project ID. Usage: npx tsx scripts/create-test-roadmap.ts [projectId]');
  process.exit(1);
}

createTestRoadmap(projectId);
