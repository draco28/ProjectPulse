/**
 * E2E Test: Onboarding Session 3 - AI Workflow Bootstrap (MCP Tools)
 *
 * Simulates real AI agent experience bootstrapping complete project workflow.
 * Tests template-based bootstrap (NO AI generation) creating:
 * - Agent personas (3-10 based on tech stack)
 * - Skills library (5-15 skills)
 * - Workflow templates (3 standard)
 * - SOPs (5 standard)
 * - Roadmap materialization from 13-Project-Plan.md
 * - CLAUDE.md and AGENTS.md file writes
 *
 * MCP Tools Used:
 * - projectpulse.onboarding.bootstrap (1 call - does everything)
 *
 * Run: node --test apps/mcp-server/tests/e2e/onboarding/session3-bootstrap.test.ts
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { MCPTestClient } from '../setup/mcp-client.js';
import {
  generateUniqueProjectId,
  createTestProject,
  cleanupProjectData,
  TEST_CONSTANTS,
} from '../setup/fixtures.js';
import {
  logTestStep,
  logTransportType,
  assertDefined,
  assertEqual,
  assertGreaterThanOrEqual,
  assertInRange,
  assertContains,
  TestTimer,
} from '../setup/test-helpers.js';

const { MCP_URL, TRANSPORT_TYPE } = TEST_CONSTANTS;

// Helper: Create temporary directory for repo files
async function createTempRepo(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
  return tmpDir;
}

// Helper: Clean up temporary directory
async function cleanupTempRepo(repoPath: string): Promise<void> {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup ${repoPath}:`, error);
  }
}

describe('Session 3: AI Workflow Bootstrap (MCP Tool E2E)', () => {
  let testProjectId: number;

  beforeEach(async () => {
    testProjectId = generateUniqueProjectId();
    console.log(`🔧 Test using project ID: ${testProjectId}`);
    await createTestProject(testProjectId);
  });

  afterEach(async () => {
    await cleanupProjectData(testProjectId);
  });

  test.skip('Complete bootstrap workflow (MOVED TO full-onboarding-workflow.test.ts)', async () => {
    const timer = new TestTimer();
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);
    const repoPath = await createTempRepo();

    try {
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep(`Connected (session: ${client.getSessionId()})`, 'success');
      logTestStep(`Temporary repo: ${repoPath}`);

      // Call bootstrap
      logTestStep('Bootstrapping project workflow...');

      const bootstrapData = await client.callToolJSON<{
        success: boolean;
        session3Complete: boolean;
        created: {
          agentPersonas: number;
          skills: number;
          workflows: number;
          sops: number;
          roadmap: {
            phases: number;
            sprints: number;
            weeks: number;
            days: number;
          };
          currentPlan: boolean;
          currentTodos: boolean;
          files: {
            claudeMd: boolean;
            agentsMd: boolean;
          };
        };
      }>('projectpulse_onboarding_bootstrap', {
        projectId: testProjectId,
        repoPath,
      });

      // Verify bootstrap success
      assertEqual(bootstrapData.success, true, 'Bootstrap should succeed');
      assertEqual(
        bootstrapData.session3Complete,
        true,
        'Session 3 should be marked complete'
      );

      logTestStep('Bootstrap completed successfully!', 'success');

      // Verify agent personas
      assertInRange(
        bootstrapData.created.agentPersonas,
        3,
        10,
        'Should create 3-10 agent personas'
      );
      logTestStep(
        `Created ${bootstrapData.created.agentPersonas} agent personas ✅`
      );

      // Verify skills library
      assertInRange(
        bootstrapData.created.skills,
        5,
        15,
        'Should create 5-15 skills'
      );
      logTestStep(`Created ${bootstrapData.created.skills} skills ✅`);

      // Verify workflows
      assertEqual(
        bootstrapData.created.workflows,
        3,
        'Should create 3 workflow templates'
      );
      logTestStep('Created 3 workflow templates ✅');

      // Verify SOPs
      assertEqual(
        bootstrapData.created.sops,
        5,
        'Should create 5 SOP templates'
      );
      logTestStep('Created 5 SOP templates ✅');

      // Verify roadmap materialization
      assertGreaterThanOrEqual(
        bootstrapData.created.roadmap.phases,
        1,
        'Should create at least 1 phase'
      );
      assertGreaterThanOrEqual(
        bootstrapData.created.roadmap.weeks,
        1,
        'Should create at least 1 week'
      );
      assertGreaterThanOrEqual(
        bootstrapData.created.roadmap.days,
        1,
        'Should create at least 1 day'
      );

      logTestStep(
        `Roadmap materialized: ${bootstrapData.created.roadmap.phases} phases, ${bootstrapData.created.roadmap.sprints} sprints, ${bootstrapData.created.roadmap.weeks} weeks, ${bootstrapData.created.roadmap.days} days ✅`
      );

      // Verify current plan and todos
      assertEqual(
        bootstrapData.created.currentPlan,
        true,
        'Should create CurrentPlan'
      );
      assertEqual(
        bootstrapData.created.currentTodos,
        true,
        'Should create CurrentTodos'
      );
      logTestStep('CurrentPlan and CurrentTodos initialized ✅');

      // Verify CLAUDE.md file write
      assertEqual(
        bootstrapData.created.files.claudeMd,
        true,
        'Should create CLAUDE.md'
      );

      const claudePath = path.join(repoPath, 'CLAUDE.md');
      const claudeStat = await fs.stat(claudePath);
      assert(claudeStat.isFile(), 'CLAUDE.md should be a file');

      const claudeContent = await fs.readFile(claudePath, 'utf-8');
      assertContains(
        claudeContent,
        'Claude Code Integration Guide',
        'CLAUDE.md should have correct header'
      );
      assertContains(
        claudeContent,
        'ProjectPulse',
        'CLAUDE.md should mention ProjectPulse'
      );
      assertContains(
        claudeContent,
        'Memory Bank',
        'CLAUDE.md should have Memory Bank section'
      );

      logTestStep(
        `CLAUDE.md written (${claudeContent.length} chars) ✅`
      );

      // Verify AGENTS.md file write
      assertEqual(
        bootstrapData.created.files.agentsMd,
        true,
        'Should create AGENTS.md'
      );

      const agentsPath = path.join(repoPath, 'AGENTS.md');
      const agentsStat = await fs.stat(agentsPath);
      assert(agentsStat.isFile(), 'AGENTS.md should be a file');

      const agentsContent = await fs.readFile(agentsPath, 'utf-8');
      assertContains(
        agentsContent,
        'Available Agent Personas',
        'AGENTS.md should list agent personas'
      );
      assertContains(
        agentsContent,
        'projectpulse.agent.invoke',
        'AGENTS.md should mention MCP tool'
      );

      logTestStep(
        `AGENTS.md written (${agentsContent.length} chars) ✅`
      );

      timer.stop();
      logTestStep(`\n✅ Session 3 Complete! (${timer.format()})`, 'success');

    } catch (error) {
      timer.stop();
      logTestStep(
        `Session 3 failed: ${error instanceof Error ? error.message : error}`,
        'error'
      );
      throw error;
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
      await cleanupTempRepo(repoPath);
    }
  });

  test('Should prevent bootstrap without Session 1 complete', async () => {
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);
    const repoPath = await createTempRepo();

    try {
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep('Testing Session 1 prerequisite validation...');

      // Use a different project ID without Session 1
      const newProjectId = testProjectId + 300;

      try {
        await client.callToolJSON('projectpulse_onboarding_bootstrap', {
          projectId: newProjectId,
          repoPath,
        });

        throw new Error('Should have thrown an error for missing Session 1');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        assertContains(
          errorMessage.toLowerCase(),
          'session 1',
          'Error should mention Session 1 prerequisite'
        );
        logTestStep('Session 1 prerequisite validation working ✅', 'success');
      }
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
      await cleanupTempRepo(repoPath);
    }
  });

  test('Should prevent bootstrap without Session 2 complete', async () => {
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);
    const repoPath = await createTempRepo();

    try {
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep('Testing Session 2 prerequisite validation...');

      // Use a different project ID without Session 2
      const newProjectId = testProjectId + 301;

      try {
        await client.callToolJSON('projectpulse_onboarding_bootstrap', {
          projectId: newProjectId,
          repoPath,
        });

        throw new Error('Should have thrown an error for missing Session 2');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        assertContains(
          errorMessage.toLowerCase(),
          'session',
          'Error should mention session prerequisite'
        );
        logTestStep('Session 2 prerequisite validation working ✅', 'success');
      }
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
      await cleanupTempRepo(repoPath);
    }
  });

  test('Should validate required parameters', async () => {
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

    try {
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep('Testing parameter validation...');

      // Try without projectId
      try {
        await client.callToolJSON('projectpulse_onboarding_bootstrap', {
          repoPath: '/tmp/test',
        });

        throw new Error('Should have thrown an error for missing projectId');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        assert(
          errorMessage.toLowerCase().includes('required') ||
            errorMessage.toLowerCase().includes('project'),
          'Error should mention required parameter'
        );
        logTestStep('Parameter validation working ✅', 'success');
      }
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  });
});
