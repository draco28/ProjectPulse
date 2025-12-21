import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log('Projects:', JSON.stringify(projects, null, 2));

  const project3 = await prisma.project.findUnique({ where: { id: 3 } });
  if (project3) {
    console.log('Project 3 exists:', project3.name);
  } else {
    console.log('Project 3 DOES NOT exist.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
