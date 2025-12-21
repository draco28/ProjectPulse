import { PrismaClient, MemoryBankType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SYSTEM_PROJECT_NAME = 'System Wiki Templates';

// Default Memory Bank Templates (minimal bootstrap content)
export const INITIAL_MEMORY_BANKS = [
  {
    type: MemoryBankType.PROJECT_BRIEF,
    content: `# Project Brief

## Overview
This project is currently being set up. Complete the onboarding process to generate a comprehensive project brief.

## Goals
- Define project goals and requirements
- Establish technical architecture
- Plan sprint roadmap

## Constraints
- Token budget: Optimize for context efficiency
- Development velocity: Prioritize MVP features
`,
    summaryTokens: 80,
  },
  {
    type: MemoryBankType.SYSTEM_PATTERNS,
    content: `# System Patterns

## API Routes
- Next.js App Router pattern: \`app/api/[entity]/route.ts\`
- Use Zod for request validation
- Return \`NextResponse.json\` with appropriate status codes

## Database Access
- Use Prisma for all database operations
- Parameterized queries only (no raw string interpolation)
- Project-scoped queries: always include \`where: { projectId }\`

## MCP Tool Design
- Input schema: Include \`projectId: number\` for all project-scoped tools
- Validation: Use Zod schemas
- Error handling: Return structured errors with actionable messages
`,
    summaryTokens: 150,
  },
  {
    type: MemoryBankType.TECH_CONTEXT,
    content: `# Tech Context

## Stack
- **Frontend**: Next.js 14 (App Router), React Server Components, shadcn/ui, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16 (pgvector for embeddings, tsvector for full-text search)
- **MCP Server**: TypeScript-based Model Context Protocol server for AI agent integration

## Infrastructure
- **Deployment**: Docker on Mac mini (192.168.1.15)
- **Services**: Next.js (port 3000), MCP server (port 3001), PostgreSQL (port 5432)

## Key Dependencies
- \`@prisma/client\`: Database ORM
- \`zod\`: Schema validation
- \`next-auth\`: Authentication
`,
    summaryTokens: 160,
  },
  {
    type: MemoryBankType.ACTIVE_CONTEXT,
    content: `# Active Context

## Current Sprint
Sprint 9 - Context Management & Knowledge Base Integration

## Current Focus
Setting up Memory Bank system for token-efficient context management.

## Status
- Memory Banks initialized with default templates
- Ready for onboarding content generation
`,
    summaryTokens: 60,
  },
  {
    type: MemoryBankType.PROGRESS,
    content: `# Progress

## Completed
- Project initialization
- Memory Bank system setup

## In Progress
- Complete onboarding to generate comprehensive documentation
- Define project roadmap

## Upcoming
- Sprint planning and implementation
`,
    summaryTokens: 50,
  },
];

/**
 * Ensures the System Template Project exists.
 * Used as the master copy for Memory Bank templates.
 */
async function ensureSystemProject() {
  let systemProject = await prisma.project.findUnique({
    where: { name: SYSTEM_PROJECT_NAME },
    include: { memoryBanks: true },
  });

  if (systemProject) {
    // If the System project exists but has no MemoryBanks yet, seed them now
    if (!systemProject.memoryBanks || systemProject.memoryBanks.length === 0) {
      console.log('📦 Seeding default Memory Bank templates for existing System Project...');
      await prisma.memoryBank.createMany({
        data: INITIAL_MEMORY_BANKS.map((bank) => ({
          projectId: systemProject!.id,
          type: bank.type,
          content: bank.content,
          summaryTokens: bank.summaryTokens,
        })),
        skipDuplicates: true,
      });

      systemProject = await prisma.project.findUnique({
        where: { id: systemProject.id },
        include: { memoryBanks: true },
      });
    }

    return systemProject;
  }

  console.log('🛠️ Bootstrapping System Project for Memory Banks...');

  const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!adminUser) {
    console.warn('⚠️ No users found. Cannot bootstrap System Project yet.');
    return null;
  }

  systemProject = await prisma.project.create({
    data: {
      name: SYSTEM_PROJECT_NAME,
      description:
        'Master templates for default project documentation. Edit these pages to update defaults for new projects.',
      ownerId: adminUser.id,
      repository: '',
    },
    include: { memoryBanks: true },
  });

  // Seed Memory Banks for freshly created System project
  console.log('📦 Seeding default Memory Bank templates...');
  await prisma.memoryBank.createMany({
    data: INITIAL_MEMORY_BANKS.map((bank) => ({
      projectId: systemProject!.id,
      type: bank.type,
      content: bank.content,
      summaryTokens: bank.summaryTokens,
    })),
    skipDuplicates: true,
  });

  return prisma.project.findUnique({
    where: { id: systemProject.id },
    include: { memoryBanks: true },
  });
}

/**
 * Clones Memory Banks from the System Project to a new User Project.
 * Creates one bank per type (5 total) for the target project.
 */
export async function cloneMemoryBanks(targetProjectId: number) {
  try {
    const systemProject = await ensureSystemProject();

    if (!systemProject || systemProject.memoryBanks.length === 0) {
      console.warn('⚠️ System Project not ready or Memory Banks empty. Skipping cloning.');
      // Create minimal defaults inline as fallback
      await prisma.memoryBank.createMany({
        data: INITIAL_MEMORY_BANKS.map((bank) => ({
          projectId: targetProjectId,
          type: bank.type,
          content: bank.content,
          summaryTokens: bank.summaryTokens,
        })),
        skipDuplicates: true,
      });
      return;
    }

    const newBanks = systemProject.memoryBanks.map((bank) => ({
      projectId: targetProjectId,
      type: bank.type,
      content: bank.content,
      summaryTokens: bank.summaryTokens,
    }));

    console.log(`🔄 Cloning ${newBanks.length} Memory Banks to project ${targetProjectId}...`);

    await prisma.memoryBank.createMany({
      data: newBanks,
      skipDuplicates: true,
    });

    console.log('✅ Memory Bank cloning complete.');
  } catch (error) {
    console.error('❌ Memory Bank cloning failed:', error);
    // Do NOT throw - project creation should succeed even if Memory Bank seeding fails
  }
}
