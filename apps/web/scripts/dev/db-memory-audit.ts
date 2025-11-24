import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 DB Read-Only Audit: Memory Banks per Project');

  try {
    // List projects with MemoryBank counts
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
        _count: { select: { memoryBanks: true } },
      },
      orderBy: { id: 'asc' },
    });

    console.log('\n📁 Projects + MemoryBank counts:');
    for (const p of projects) {
      console.log(
        `- id=${p.id} | name="${p.name}" | memoryBanks=${p._count.memoryBanks} | ownerId=${p.ownerId} | createdAt=${p.createdAt.toISOString()}`
      );
    }

    // Detail for System Wiki Templates project (if present)
    const systemProject = await prisma.project.findFirst({
      where: { name: 'System Wiki Templates' },
      select: { id: true, name: true },
    });

    if (systemProject) {
      console.log(`\n🎯 System Project: id=${systemProject.id} name="${systemProject.name}"`);
      const banks = await prisma.memoryBank.findMany({
        where: { projectId: systemProject.id },
        orderBy: { type: 'asc' },
      });
      if (banks.length === 0) {
        console.log('  (no MemoryBanks for System Project)');
      } else {
        for (const b of banks) {
          console.log(`  - ${b.type}: tokens=${b.summaryTokens ?? 0}`);
        }
      }
    } else {
      console.log('\n🎯 System Project: not found');
    }
  } catch (error) {
    console.error('\n❌ Memory audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal memory audit error:', error);
  process.exit(1);
});
