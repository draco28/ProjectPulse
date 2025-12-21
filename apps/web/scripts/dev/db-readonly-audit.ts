import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 DB Read-Only Audit: Projects & Onboarding');

  try {
    // List users (basic info)
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    console.log('\n👤 Users (first 10):');
    for (const u of users) {
      console.log(`- ${u.id} | ${u.email} | ${u.createdAt.toISOString()}`);
    }

    // List all projects
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, ownerId: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
    console.log('\n📁 Projects:');
    for (const p of projects) {
      console.log(
        `- id=${p.id} | name="${p.name}" | ownerId=${p.ownerId} | createdAt=${p.createdAt.toISOString()}`
      );
    }

    // Focus on project id 3
    const project3 = await prisma.project.findUnique({
      where: { id: 3 },
      select: { id: true, name: true, ownerId: true, createdAt: true },
    });
    console.log('\n🎯 Project id=3:');
    if (!project3) {
      console.log('  ❌ Not found');
    } else {
      console.log(
        `  ✅ id=${project3.id} | name="${project3.name}" | ownerId=${project3.ownerId} | createdAt=${project3.createdAt.toISOString()}`
      );
    }

    // Onboarding sessions for project 3
    const sessions3 = await prisma.onboardingSession.findMany({
      where: { projectId: 3 },
      select: {
        id: true,
        sessionNumber: true,
        status: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { sessionNumber: 'asc' },
    });
    console.log('\n📑 OnboardingSessions for project 3:');
    if (sessions3.length === 0) {
      console.log('  (none found)');
    } else {
      for (const s of sessions3) {
        console.log(
          `  - id=${s.id} | session=${s.sessionNumber} | status=${s.status} | completedAt=${s.completedAt ?? 'null'} | createdAt=${s.createdAt.toISOString()}`
        );
      }
    }
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal audit error:', error);
  process.exit(1);
});
