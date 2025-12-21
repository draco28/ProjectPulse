import { PrismaClient, MemoryBankType } from '@prisma/client';
import { INITIAL_MEMORY_BANKS } from '../../lib/memory/system-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Backfill MemoryBanks for all projects');

  try {
    const projects = await prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });

    const templateByType = new Map(INITIAL_MEMORY_BANKS.map((bank) => [bank.type, bank]));

    for (const project of projects) {
      const existingBanks = await prisma.memoryBank.findMany({
        where: { projectId: project.id },
        select: { type: true },
      });

      const existingTypes = new Set<MemoryBankType>(existingBanks.map((b) => b.type));
      const toCreate: {
        projectId: number;
        type: MemoryBankType;
        content: string;
        summaryTokens: number;
      }[] = [];

      for (const bank of INITIAL_MEMORY_BANKS) {
        if (!existingTypes.has(bank.type)) {
          toCreate.push({
            projectId: project.id,
            type: bank.type,
            content: bank.content,
            summaryTokens: bank.summaryTokens,
          });
        }
      }

      if (toCreate.length > 0) {
        console.log(
          `➡️  Project id=${project.id} ("${project.name}") is missing ${toCreate.length} MemoryBanks. Inserting...`
        );
        await prisma.memoryBank.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      } else {
        console.log(`✅ Project id=${project.id} ("${project.name}") already has all MemoryBanks.`);
      }
    }

    console.log('\n✅ Backfill complete.');
  } catch (error) {
    console.error('\n❌ Backfill failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal backfill error:', error);
  process.exit(1);
});
