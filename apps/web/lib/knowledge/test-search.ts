/**
 * Test script for knowledge search
 * Run with: npx tsx lib/knowledge/test-search.ts
 */

import { semanticSearch, fullTextSearch, hybridSearch } from './search';

async function testSearch() {
  console.log('🔍 Testing Knowledge Search...\n');

  const testQueries = [
    'PostgreSQL indexing',
    'database performance',
    'Docker container',
    'API security',
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"\n`);

    // Test semantic search with lower threshold
    try {
      const semanticResults = await semanticSearch(query, { limit: 3, threshold: 0.3 });
      console.log(`  Semantic (${semanticResults.length} results):`);
      semanticResults.forEach((result, idx) => {
        console.log(`    ${idx + 1}. [${result.score.toFixed(3)}] ${result.title}`);
      });
    } catch (error) {
      console.log(`  Semantic: ❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test full-text search
    try {
      const fulltextResults = await fullTextSearch(query, { limit: 3 });
      console.log(`  Full-text (${fulltextResults.length} results):`);
      fulltextResults.forEach((result, idx) => {
        console.log(`    ${idx + 1}. [${result.score.toFixed(3)}] ${result.title}`);
      });
    } catch (error) {
      console.log(`  Full-text: ❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test hybrid search
    try {
      const hybridResults = await hybridSearch(query, { limit: 3 });
      console.log(`  Hybrid (${hybridResults.length} results):`);
      hybridResults.forEach((result, idx) => {
        console.log(`    ${idx + 1}. [${result.score.toFixed(3)}] ${result.title}`);
      });
    } catch (error) {
      console.log(`  Hybrid: ❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n✅ Search test complete!');
}

testSearch();
