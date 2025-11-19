/**
 * Clean Up Test Data
 *
 * Removes existing onboarding sessions for test project to ensure clean test runs
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
  const projectId = parseInt(process.env.TEST_PROJECT_ID || '3', 10);

  try {
    // Delete existing onboarding sessions for this project
    const deleted = await prisma.onboardingSession.deleteMany({
      where: { projectId }
    });

    console.log(`✅ Cleaned up ${deleted.count} onboarding sessions for project ${projectId}`);

    // Verify cleanup
    const remaining = await prisma.onboardingSession.count({
      where: { projectId }
    });

    if (remaining === 0) {
      console.log(`✅ Test project ${projectId} is ready for fresh E2E tests`);
    } else {
      console.warn(`⚠️  Warning: ${remaining} sessions still remain for project ${projectId}`);
    }

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
