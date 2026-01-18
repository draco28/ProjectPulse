import { PrismaClient } from './apps/web/prisma/generated/client';
import { getConfig } from '@projectpulse/infra-config';

const infraConfig = getConfig();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: infraConfig.databaseUrl
    }
  }
});

async function main() {
  // Check all projects
  const projects = await prisma.project.findMany({
    select: { id: true, name: true }
  });

  console.log('\n=== Projects ===');
  for (const p of projects) {
    console.log(`ID ${p.id}: ${p.name}`);
  }

  // Check health scores per project
  const scores = await prisma.healthScore.groupBy({
    by: ['projectId'],
    _count: true
  });

  console.log('\n=== Health Scores by Project ===');
  for (const s of scores) {
    console.log(`Project ${s.projectId}: ${s._count} scores`);
  }

  await prisma.$disconnect();
}

main();
