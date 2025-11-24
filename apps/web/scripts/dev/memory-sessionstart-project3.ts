import { loadSessionStart } from '../../lib/memory/memory-bank-service';

async function main() {
  const projectId = 3;
  console.log(`🧪 MemoryBank SessionStart audit for project ${projectId}`);

  try {
    const payload = await loadSessionStart(projectId);

    console.log('\n📦 Banks:');
    for (const bank of payload.banks) {
      const preview = bank.content.length > 120 ? bank.content.slice(0, 120) + '…' : bank.content;
      console.log(`- ${bank.type}: tokens=${bank.summaryTokens ?? 0}`);
      console.log(`  preview: ${JSON.stringify(preview)}`);
    }

    console.log(`\n🔢 Total tokens: ${payload.totalTokens}`);
    console.log(`📅 Timestamp: ${payload.timestamp.toISOString()}`);

    // Budget checks from spec
    const within10k = payload.totalTokens <= 10_000;
    console.log(`\n✅ Within 10K session-start budget: ${within10k}`);
  } catch (error) {
    console.error('\n❌ SessionStart audit failed:', error);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
