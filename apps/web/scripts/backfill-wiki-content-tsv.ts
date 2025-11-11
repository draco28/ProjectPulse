import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Backfilling WikiPage.content_tsv ...');
  const pages = await prisma.wikiPage.count();
  console.log(`Found ${pages} wiki page(s)`);
  console.log('Generated column updates automatically from triggers, no manual work needed.');
}

main()
  .catch((error) => {
    console.error('Failed to backfill content_tsv', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
