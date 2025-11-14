/**
 * Manual scanner testing script
 * Tests axe-core and Lighthouse scanners against local dev server
 */

import { createAxeCoreScanner, createLighthouseScanner } from '../lib/health/scanners';

async function testScanners() {
  console.log('🔍 Testing Accessibility Scanners\n');
  console.log('Target: http://localhost:3000\n');

  // Test axe-core scanner
  console.log('1️⃣ Testing axe-core scanner...');
  try {
    const axeScanner = createAxeCoreScanner();
    const axeResult = await axeScanner.scan('/Users/draco/projects/AI_HUB/apps/web', {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
    });

    console.log('✅ axe-core scan completed');
    console.log(`   Findings: ${axeResult.findings.length}`);
    console.log(`   Critical: ${axeResult.summary.bySeverity.critical}`);
    console.log(`   High: ${axeResult.summary.bySeverity.high}`);
    console.log(`   Medium: ${axeResult.summary.bySeverity.medium}`);
    console.log(`   Low: ${axeResult.summary.bySeverity.low}`);

    if (axeResult.findings.length > 0) {
      console.log('\n   Sample findings:');
      axeResult.findings.slice(0, 3).forEach((finding, i) => {
        console.log(`   ${i + 1}. [${finding.severity}] ${finding.ruleId}: ${finding.message}`);
      });
    }
  } catch (error) {
    console.error('❌ axe-core scanner failed:', (error as Error).message);
  }

  console.log('\n---\n');

  // Test Lighthouse scanner
  console.log('2️⃣ Testing Lighthouse scanner...');
  try {
    const lighthouseScanner = createLighthouseScanner();
    const lighthouseResult = await lighthouseScanner.scan('/Users/draco/projects/AI_HUB/apps/web', {
      baseUrl: 'http://localhost:3000',
      timeout: 60000,
    });

    console.log('✅ Lighthouse scan completed');
    console.log(`   Findings: ${lighthouseResult.findings.length}`);
    console.log(`   Critical: ${lighthouseResult.summary.bySeverity.critical}`);
    console.log(`   High: ${lighthouseResult.summary.bySeverity.high}`);
    console.log(`   Medium: ${lighthouseResult.summary.bySeverity.medium}`);
    console.log(`   Low: ${lighthouseResult.summary.bySeverity.low}`);

    if (lighthouseResult.findings.length > 0) {
      console.log('\n   Sample findings:');
      lighthouseResult.findings.slice(0, 3).forEach((finding, i) => {
        console.log(`   ${i + 1}. [${finding.severity}] ${finding.ruleId}: ${finding.message}`);
      });
    }
  } catch (error) {
    console.error('❌ Lighthouse scanner failed:', (error as Error).message);
  }

  console.log('\n✨ Scanner testing complete!\n');
}

testScanners().catch(console.error);
