/**
 * Test script for unified embedding service
 * Run with: npx tsx lib/embeddings/test-unified.ts
 */

import { generateEmbedding, checkEmbeddingProviders } from './index';

async function testUnifiedEmbedding() {
  console.log('🧪 Testing Unified Embedding Service...\n');

  // Check provider availability
  console.log('1. Checking provider availability...');
  const providers = await checkEmbeddingProviders();
  console.log(`   Ollama: ${providers.ollama ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`   OpenAI: ${providers.openai ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`   Recommended: ${providers.recommended}\n`);

  if (!providers.ollama && !providers.openai) {
    console.log('❌ No embedding providers available!');
    console.log('   - Install Ollama: brew install ollama && ollama pull nomic-embed-text');
    console.log('   - Or set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  // Test automatic provider selection
  console.log('2. Testing automatic provider selection...');
  const testText = 'PostgreSQL full-text search with tsvector and GIN indexes';
  const start = Date.now();

  try {
    const result = await generateEmbedding(testText);
    const duration = Date.now() - start;

    console.log(`   ✅ Generated embedding in ${duration}ms`);
    console.log(`   Provider used: ${result.provider}`);
    console.log(`   Dimensions: ${result.embedding.length}`);
    console.log(`   First 5 values: [${result.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Verify dimensions
    if (result.embedding.length === 768) {
      console.log('✅ All tests passed! Unified embedding service is working correctly.');
      console.log(`\nProvider Summary:`);
      console.log(`  - Primary: ${providers.ollama ? 'Ollama (nomic-embed-text, free)' : 'Not available'}`);
      console.log(`  - Fallback: ${providers.openai ? 'OpenAI (text-embedding-3-large, paid)' : 'Not configured'}`);
      console.log(`  - Active: ${result.provider === 'ollama' ? 'Ollama ✅' : 'OpenAI (fallback)'}`);
    } else {
      console.log(`❌ Expected 768 dimensions, got ${result.embedding.length}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('\nTroubleshooting:');
    console.log('  - Ensure Ollama is running: ollama serve');
    console.log('  - Ensure model is pulled: ollama pull nomic-embed-text');
    console.log('  - Or set OPENAI_API_KEY for fallback');
    process.exit(1);
  }
}

testUnifiedEmbedding();
