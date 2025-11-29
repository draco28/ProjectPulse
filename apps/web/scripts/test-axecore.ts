/**
 * Test axe-core scanner only
 */

import { createAxeCoreScanner } from '../lib/health/scanners/axecore';
import type { ScanOptions } from '../lib/health/scanners/types';

async function testAxeCore() {
  console.log('🔍 Testing axe-core Scanner\n');
  console.log('Target: http://localhost:3000\n');

  try {
    const scanner = createAxeCoreScanner();
    console.log('Scanner created, starting scan...');

    const scanOptions: ScanOptions = {
      config: { baseUrl: 'http://localhost:3000' },
      timeout: 30000,
    };
    const result = await scanner.scan('/Users/draco/projects/AI_HUB/apps/web', scanOptions);

    console.log('\n✅ axe-core scan completed successfully!\n');
    console.log('📊 Results:');
    console.log(`   Total Findings: ${result.findings.length}`);
    console.log(`   Critical: ${result.summary.bySeverity.critical}`);
    console.log(`   High: ${result.summary.bySeverity.high}`);
    console.log(`   Medium: ${result.summary.bySeverity.medium}`);
    console.log(`   Low: ${result.summary.bySeverity.low}`);

    if (result.findings.length > 0) {
      console.log('\n🔎 Top 5 Findings:');
      result.findings.slice(0, 5).forEach((finding, i) => {
        console.log(`\n${i + 1}. [${finding.severity}] ${finding.ruleId}`);
        console.log(`   ${finding.message}`);
        if (finding.codeSnippet) {
          console.log(`   Code: ${finding.codeSnippet.substring(0, 80)}...`);
        }
      });
    }

    console.log('\n✨ Test complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ axe-core scanner failed:');
    console.error((error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testAxeCore();
