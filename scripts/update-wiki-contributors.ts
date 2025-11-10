/**
 * Update Wiki Pages with Contributors
 *
 * Adds contributor data, reading time, views, and tags to existing wiki pages.
 * Run: DATABASE_URL="..." npx tsx scripts/update-wiki-contributors.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Calculate reading time (200 words per minute)
function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

// Sample contributors
const contributors = [
  { name: 'Moksha Dev', editCount: 12 },
  { name: 'Sarah Chen', editCount: 5 },
  { name: 'Alex Kumar', editCount: 3 },
];

async function main() {
  console.log('🔄 Updating wiki pages with contributors...\n');

  const pages = await prisma.wikiPage.findMany();

  console.log(`Found ${pages.length} wiki pages to update\n`);

  for (const page of pages) {
    const readingTime = calculateReadingTime(page.content);
    const views = Math.floor(Math.random() * 1000) + 100; // Random views (100-1100)
    const revisions = Math.floor(Math.random() * 20) + 1; // Random revisions (1-20)

    // Assign 1-3 contributors randomly
    const contributorCount = Math.floor(Math.random() * 3) + 1;
    const pageContributors = contributors
      .sort(() => Math.random() - 0.5)
      .slice(0, contributorCount)
      .map((c) => ({
        ...c,
        lastEditAt: new Date().toISOString(),
      }));

    // Add tags based on category
    let tags: string[] = [];
    switch (page.category) {
      case 'getting-started':
        tags = ['tutorial', '5 min read'];
        break;
      case 'core-concepts':
        tags = ['concepts', 'fundamentals'];
        break;
      case 'api-reference':
        tags = ['api', 'reference'];
        break;
      case 'guides':
        tags = ['guide', 'how-to'];
        break;
      default:
        tags = ['documentation'];
    }

    await prisma.wikiPage.update({
      where: { id: page.id },
      data: {
        views,
        revisions,
        contributors: pageContributors,
        readingTime,
        tags,
        excerpt: page.content.slice(0, 200) + '...',
      },
    });

    console.log(`✓ Updated: ${page.title}`);
    console.log(`  - Views: ${views}, Revisions: ${revisions}, Reading time: ${readingTime} min`);
    console.log(`  - Contributors: ${pageContributors.map((c) => c.name).join(', ')}`);
    console.log(`  - Tags: ${tags.join(', ')}\n`);
  }

  console.log('✅ All wiki pages updated successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
