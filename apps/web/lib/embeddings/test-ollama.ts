/**
 * Quick test script for Ollama embeddings
 * Run with: npx tsx lib/embeddings/test-ollama.ts
 */

import { generateOllamaEmbedding, isOllamaAvailable } from './ollama';

async function testOllama() {
  console.log('🧪 Testing Ollama embeddings...\n');

  // Check availability
  console.log('1. Checking Ollama availability...');
  const available = await isOllamaAvailable();
  console.log(`   ${available ? '✅' : '❌'} Ollama is ${available ? 'available' : 'NOT available'}\n`);

  if (!available) {
    console.log('❌ Ollama is not running or all-minilm model is not installed');
    console.log('   Start Ollama: ollama serve');
    console.log('   Pull model: ollama pull all-minilm');
    process.exit(1);
  }

  // Generate embedding
  console.log('2. Generating embedding for test text...');
  const testText = 'PostgreSQL full-text search with tsvector and GIN indexes';
  const start = Date.now();

  try {
    const embedding = await generateOllamaEmbedding(testText);
    const duration = Date.now() - start;

    console.log(`   ✅ Generated embedding in ${duration}ms`);
    console.log(`   Dimensions: ${embedding.length}`);
    console.log(`   Model: nomic-embed-text`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Verify dimensions
    if (embedding.length === 768) {
      console.log('✅ All tests passed! nomic-embed-text is working correctly.');
    } else {
      console.log(`❌ Expected 768 dimensions for nomic-embed-text, got ${embedding.length}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

testOllama();
