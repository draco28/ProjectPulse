/**
 * E2E Test: Health Check Tool (MCP Tools)
 *
 * Tests the MCP server health check tool to verify connectivity
 * and server status before running onboarding workflows.
 *
 * MCP Tools Used:
 * - projectpulse.health_check
 *
 * Run: node --test apps/mcp-server/tests/e2e/tools/health-check.test.ts
 */

import { test, describe } from 'node:test';
import { MCPTestClient } from '../setup/mcp-client.js';
import { TEST_CONSTANTS } from '../setup/fixtures.js';
import {
  logTestStep,
  assertEqual,
  assertContains,
  TestTimer,
} from '../setup/test-helpers.js';

const { MCP_URL } = TEST_CONSTANTS;

describe('Health Check Tool (MCP Tool E2E)', () => {
  test('Should connect and verify server health', async () => {
    const timer = new TestTimer();
    const client = new MCPTestClient(MCP_URL);

    try {
      // Connect
      logTestStep('Connecting to MCP server...');
      await client.connect();
      logTestStep(`Connected (session: ${client.getSessionId()})`, 'success');

      // Call health check
      logTestStep('Calling health_check tool...');

      const healthData = await client.callToolJSON<{
        status: string;
        timestamp: string;
        database: string;
      }>('projectpulse_health_check', { verbose: true });

      assertEqual(healthData.status, 'healthy', 'Server should be healthy');
      assertEqual(healthData.database, 'connected', 'Database should be connected');

      logTestStep(
        `Server healthy: ${healthData.status} • Database: ${healthData.database}`,
        'success'
      );

      timer.stop();
      logTestStep(`✅ Health check passed! (${timer.format()})`, 'success');

    } catch (error) {
      timer.stop();
      logTestStep(
        `Health check failed: ${error instanceof Error ? error.message : error}`,
        'error'
      );
      throw error;
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  });

  test('Should list all MCP tools', async () => {
    const client = new MCPTestClient(MCP_URL);

    try {
      await client.connect();
      logTestStep('Listing all MCP tools...');

      const toolsList = await client.listTools();

      logTestStep(`Found ${toolsList.tools.length} total MCP tools`);

      // Count tools by category
      const onboarding = toolsList.tools.filter((t) =>
        t.name.startsWith('projectpulse.onboarding')
      );
      const sprint = toolsList.tools.filter((t) =>
        t.name.startsWith('projectpulse.sprint')
      );
      const wiki = toolsList.tools.filter((t) =>
        t.name.startsWith('projectpulse.wiki')
      );
      const issue = toolsList.tools.filter((t) =>
        t.name.startsWith('projectpulse.issue')
      );
      const workflow = toolsList.tools.filter((t) =>
        t.name.startsWith('projectpulse.workflow')
      );

      logTestStep(`  - Onboarding tools: ${onboarding.length}`);
      logTestStep(`  - Sprint tools: ${sprint.length}`);
      logTestStep(`  - Wiki tools: ${wiki.length}`);
      logTestStep(`  - Issue tools: ${issue.length}`);
      logTestStep(`  - Workflow tools: ${workflow.length}`);

      assertEqual(
        onboarding.length >= 8,
        true,
        'Should have at least 8 onboarding tools'
      );

      logTestStep('✅ Tool listing complete', 'success');

    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  });
});
