/**
 * Create Test Project for E2E Tests
 *
 * Creates a test project in the database for MCP E2E tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev'
    }
  }
});

async function main() {
  try {
    // Check if test project already exists
    const existing = await prisma.project.findFirst({
      where: { name: 'E2E Test Project' }
    });

    if (existing) {
      console.log(`✅ Test project already exists (ID: ${existing.id})`);
      console.log(`Project Name: ${existing.name}`);
      return existing.id;
    }

    // Create new test project
    const project = await prisma.project.create({
      data: {
        name: 'E2E Test Project',
        description: 'Test project for MCP E2E onboarding tests'
      }
    });

    console.log(`✅ Created test project (ID: ${project.id})`);
    console.log(`Project Name: ${project.name}`);
    console.log(`\n💡 Update TEST_PROJECT_ID in fixtures.ts to: ${project.id}`);

    return project.id;
  } catch (error) {
    console.error('❌ Error creating test project:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
