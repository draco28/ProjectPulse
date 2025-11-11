import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Backfilling wiki content_tsv vector...');
  const updated = await prisma.$executeRawUnsafe('UPDATE "WikiPage" SET title = title');
  console.log(`✅ Recomputed content_tsv for ${updated ?? 0} rows`);
}

main()
  .catch((error) => {
    console.error('Failed to backfill wiki search vectors', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
