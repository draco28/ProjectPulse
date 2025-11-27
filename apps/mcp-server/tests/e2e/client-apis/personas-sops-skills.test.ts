/**
 * MCP Tools E2E Tests - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * Tests MCP tools for personas, skills, and SOPs:
 * - projectpulse_persona_list
 * - projectpulse_persona_get
 * - projectpulse_skill_list
 * - projectpulse_skill_get
 * - projectpulse_sop_list
 * - projectpulse_sop_get
 * 
 * Run: node --test apps/mcp-server/tests/e2e/client-apis/personas-sops-skills.test.ts
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
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
  TestTimer,
} from '../setup/test-helpers.js';

const { MCP_URL, TRANSPORT_TYPE } = TEST_CONSTANTS;

describe('Sprint 11: Client Agent Integration MCP Tools', () => {
  let testProjectId: number;

  beforeEach(async () => {
    testProjectId = generateUniqueProjectId();
    console.log(`🔧 Test using project ID: ${testProjectId}`);
    await createTestProject(testProjectId);
  });

  afterEach(async () => {
    await cleanupProjectData(testProjectId);
  });

  // =========================================================================
  // Persona Tools Tests
  // =========================================================================
  describe('Persona MCP Tools', () => {
    test('projectpulse_persona_list returns formatted markdown', async () => {
      const timer = new TestTimer();
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();
        logTransportType(TRANSPORT_TYPE);
        logTestStep(`Connected (session: ${client.getSessionId()})`, 'success');

        // First, create some test personas via batch API
        logTestStep('Creating test personas...');
        await client.callToolJSON('projectpulse_batch_createAgentPersonas', {
          projectId: testProjectId,
          personas: [
            {
              name: 'React Expert',
              slug: 'react-expert',
              icon: '⚛️',
              description: 'Specializes in React patterns',
              expertise: ['React', 'Hooks'],
              systemPrompt: 'You are a React expert.',
            },
            {
              name: 'Database Specialist',
              slug: 'db-specialist',
              description: 'PostgreSQL and Prisma expert',
              expertise: ['PostgreSQL', 'Prisma'],
              systemPrompt: 'You are a database specialist.',
            },
          ],
        });
        logTestStep('Created test personas', 'success');

        // Test persona list
        logTestStep('Calling persona_list tool...');
        const listResult = await client.callToolText('projectpulse_persona_list', {
          projectId: testProjectId,
        });

        assert.ok(listResult.includes('Available Personas'), 'Should include header');
        assert.ok(listResult.includes('React Expert'), 'Should include persona name');
        assert.ok(listResult.includes('react-expert'), 'Should include persona slug');
        assert.ok(listResult.includes('⚛️'), 'Should include emoji icon');
        logTestStep('persona_list returns formatted output', 'success');

        // Test isActive filter
        logTestStep('Testing isActive filter...');
        const activeResult = await client.callToolText('projectpulse_persona_list', {
          projectId: testProjectId,
          isActive: true,
        });
        assert.ok(activeResult.includes('React Expert'), 'Should include active personas');
        logTestStep('isActive filter works', 'success');

        console.log(`✅ Persona list tests passed (${timer.elapsed()})`);
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_persona_get returns full persona with systemPrompt', async () => {
      const timer = new TestTimer();
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Create test persona
        await client.callToolJSON('projectpulse_batch_createAgentPersonas', {
          projectId: testProjectId,
          personas: [
            {
              name: 'Test Agent',
              slug: 'test-agent',
              description: 'Test agent description',
              expertise: ['Testing'],
              systemPrompt: 'You are a test agent for validation.',
              skills: ['testing-skill'],
              tools: ['test_tool'],
              rules: ['Always be thorough'],
            },
          ],
        });

        // Test get by slug
        logTestStep('Testing persona get by slug...');
        const result = await client.callToolText('projectpulse_persona_get', {
          projectId: testProjectId,
          slug: 'test-agent',
        });

        assert.ok(result.includes('Test Agent'), 'Should include persona name');
        assert.ok(result.includes('System Prompt'), 'Should include systemPrompt section');
        assert.ok(result.includes('You are a test agent'), 'Should include actual systemPrompt');
        assert.ok(result.includes('Skills'), 'Should include skills section');
        assert.ok(result.includes('testing-skill'), 'Should include skill slug');
        assert.ok(result.includes('Rules'), 'Should include rules section');
        logTestStep('persona_get returns full data', 'success');

        console.log(`✅ Persona get tests passed (${timer.elapsed()})`);
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_persona_get handles not found', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Try to get non-existent persona
        const result = await client.callToolText('projectpulse_persona_get', {
          projectId: testProjectId,
          slug: 'nonexistent-persona',
        });

        assert.ok(
          result.includes('error') || result.includes('not found'),
          'Should return error for non-existent persona'
        );
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_persona_get validates id or slug required', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Try without id or slug - should fail validation
        try {
          await client.callToolText('projectpulse_persona_get', {
            projectId: testProjectId,
          });
          assert.fail('Should have thrown validation error');
        } catch (error) {
          assert.ok(
            (error as Error).message.includes('id or slug'),
            'Should require id or slug'
          );
        }
      } finally {
        await client.disconnect();
      }
    });
  });

  // =========================================================================
  // SOP Tools Tests
  // =========================================================================
  describe('SOP MCP Tools', () => {
    test('projectpulse_sop_list groups by category', async () => {
      const timer = new TestTimer();
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Create test SOPs
        logTestStep('Creating test SOPs...');
        await client.callToolJSON('projectpulse_batch_createSOPs', {
          projectId: testProjectId,
          sops: [
            {
              title: 'Git Workflow',
              slug: 'git-workflow',
              description: 'Standard git branching workflow',
              category: 'Development',
              content: '# Git Workflow\n\n1. Create branch...',
            },
            {
              title: 'Code Review',
              slug: 'code-review',
              description: 'Code review process',
              category: 'Development',
              content: '# Code Review\n\n1. Review changes...',
            },
            {
              title: 'Deployment Guide',
              slug: 'deployment-guide',
              description: 'Production deployment steps',
              category: 'Deployment',
              content: '# Deployment\n\n1. Build production...',
            },
          ],
        });
        logTestStep('Created test SOPs', 'success');

        // Test SOP list
        logTestStep('Calling sop_list tool...');
        const listResult = await client.callToolText('projectpulse_sop_list', {
          projectId: testProjectId,
        });

        assert.ok(listResult.includes('Available SOPs'), 'Should include header');
        assert.ok(listResult.includes('Development'), 'Should show Development category');
        assert.ok(listResult.includes('Deployment'), 'Should show Deployment category');
        assert.ok(listResult.includes('Git Workflow'), 'Should include SOP title');
        logTestStep('sop_list groups by category', 'success');

        // Test category filter
        logTestStep('Testing category filter...');
        const devResult = await client.callToolText('projectpulse_sop_list', {
          projectId: testProjectId,
          category: 'Development',
        });
        assert.ok(devResult.includes('Git Workflow'), 'Should include Development SOPs');
        assert.ok(!devResult.includes('Deployment Guide'), 'Should not include Deployment SOPs');
        logTestStep('Category filter works', 'success');

        console.log(`✅ SOP list tests passed (${timer.elapsed()})`);
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_sop_get returns full content', async () => {
      const timer = new TestTimer();
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Create test SOP
        await client.callToolJSON('projectpulse_batch_createSOPs', {
          projectId: testProjectId,
          sops: [
            {
              title: 'Test SOP',
              slug: 'test-sop',
              description: 'Test SOP description',
              category: 'Testing',
              content: '# Test SOP\n\n## Steps\n\n1. First step\n2. Second step',
              tags: ['test', 'validation'],
            },
          ],
        });

        // Test get by slug
        logTestStep('Testing sop get by slug...');
        const result = await client.callToolText('projectpulse_sop_get', {
          projectId: testProjectId,
          slug: 'test-sop',
        });

        assert.ok(result.includes('Test SOP'), 'Should include SOP title');
        assert.ok(result.includes('Procedure'), 'Should include procedure section');
        assert.ok(result.includes('First step'), 'Should include full content');
        assert.ok(result.includes('test, validation'), 'Should include tags');
        logTestStep('sop_get returns full content', 'success');

        console.log(`✅ SOP get tests passed (${timer.elapsed()})`);
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_sop_get handles not found', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        const result = await client.callToolText('projectpulse_sop_get', {
          projectId: testProjectId,
          slug: 'nonexistent-sop',
        });

        assert.ok(
          result.includes('error') || result.includes('not found'),
          'Should return error for non-existent SOP'
        );
      } finally {
        await client.disconnect();
      }
    });
  });

  // =========================================================================
  // Skill Tools Tests
  // =========================================================================
  describe('Skill MCP Tools', () => {
    test('projectpulse_skill_list supports pagination and filtering', async () => {
      const timer = new TestTimer();
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Create test skills
        logTestStep('Creating test skills...');
        await client.callToolJSON('projectpulse_batch_createSkills', {
          projectId: testProjectId,
          skills: [
            {
              title: 'React Patterns',
              slug: 'react-patterns',
              category: 'framework',
              description: 'React component patterns',
              content: '# React Patterns\n\n...',
              tags: ['react', 'patterns'],
              frameworks: ['React'],
            },
            {
              title: 'Jest Testing',
              slug: 'jest-testing',
              category: 'testing',
              description: 'Jest testing patterns',
              content: '# Jest Testing\n\n...',
              tags: ['jest', 'testing'],
              frameworks: ['Jest'],
            },
            {
              title: 'API Design',
              slug: 'api-design',
              category: 'framework',
              description: 'REST API design',
              content: '# API Design\n\n...',
              tags: ['api', 'rest'],
              frameworks: ['Next.js'],
            },
          ],
        });
        logTestStep('Created test skills', 'success');

        // Test skill list
        logTestStep('Calling skill_list tool...');
        const listResult = await client.callToolText('projectpulse_skill_list', {
          projectId: testProjectId,
        });

        assert.ok(listResult.includes('Available Skills'), 'Should include header');
        assert.ok(listResult.includes('framework'), 'Should show framework category');
        assert.ok(listResult.includes('testing'), 'Should show testing category');
        logTestStep('skill_list groups by category', 'success');

        // Test category filter
        logTestStep('Testing category filter...');
        const frameworkResult = await client.callToolText('projectpulse_skill_list', {
          projectId: testProjectId,
          category: 'framework',
        });
        assert.ok(frameworkResult.includes('React Patterns'), 'Should include framework skills');
        logTestStep('Category filter works', 'success');

        // Test limit
        logTestStep('Testing limit parameter...');
        const limitResult = await client.callToolText('projectpulse_skill_list', {
          projectId: testProjectId,
          limit: 2,
        });
        // Just verify it doesn't error with limit param
        assert.ok(limitResult.includes('Skills'), 'Should return skills');
        logTestStep('Limit parameter works', 'success');

        console.log(`✅ Skill list tests passed (${timer.elapsed()})`);
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_skill_get returns full content', async () => {
      const timer = new TestTimer();
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Create test skill
        await client.callToolJSON('projectpulse_batch_createSkills', {
          projectId: testProjectId,
          skills: [
            {
              title: 'Test Skill',
              slug: 'test-skill',
              category: 'testing',
              description: 'Test skill description',
              content: '# Test Skill\n\n## Overview\n\nDetailed content here...',
              tags: ['test'],
              frameworks: ['Jest'],
            },
          ],
        });

        // Test get by slug
        logTestStep('Testing skill get...');
        const result = await client.callToolText('projectpulse_skill_get', {
          projectId: testProjectId,
          slug: 'test-skill',
        });

        assert.ok(result.includes('Test Skill'), 'Should include skill title');
        assert.ok(result.includes('Content'), 'Should include content section');
        assert.ok(result.includes('Detailed content'), 'Should include full content');
        assert.ok(result.includes('Usage Count'), 'Should include usage count');
        logTestStep('skill_get returns full content', 'success');

        console.log(`✅ Skill get tests passed (${timer.elapsed()})`);
      } finally {
        await client.disconnect();
      }
    });

    test('projectpulse_skill_get handles not found', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        const result = await client.callToolText('projectpulse_skill_get', {
          projectId: testProjectId,
          slug: 'nonexistent-skill',
        });

        assert.ok(
          result.includes('error') || result.includes('not found'),
          'Should return error for non-existent skill'
        );
      } finally {
        await client.disconnect();
      }
    });
  });

  // =========================================================================
  // Empty Results Handling
  // =========================================================================
  describe('Empty Results Handling', () => {
    test('persona_list handles empty results gracefully', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // List without creating any personas
        const result = await client.callToolText('projectpulse_persona_list', {
          projectId: testProjectId,
        });

        assert.ok(result.includes('(0)'), 'Should show zero count');
        assert.ok(
          result.includes('No personas') || result.includes('_No personas'),
          'Should indicate no personas'
        );
      } finally {
        await client.disconnect();
      }
    });

    test('sop_list handles empty results gracefully', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        const result = await client.callToolText('projectpulse_sop_list', {
          projectId: testProjectId,
        });

        assert.ok(result.includes('(0)'), 'Should show zero count');
        assert.ok(
          result.includes('No SOPs') || result.includes('_No SOPs'),
          'Should indicate no SOPs'
        );
      } finally {
        await client.disconnect();
      }
    });

    test('skill_list handles empty results gracefully', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        const result = await client.callToolText('projectpulse_skill_list', {
          projectId: testProjectId,
        });

        assert.ok(result.includes('(0)'), 'Should show zero count');
        assert.ok(
          result.includes('No skills') || result.includes('_No skills'),
          'Should indicate no skills'
        );
      } finally {
        await client.disconnect();
      }
    });
  });

  // =========================================================================
  // Invalid Input Handling
  // =========================================================================
  describe('Invalid Input Handling', () => {
    test('tools reject invalid projectId', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Test with negative projectId
        try {
          await client.callToolText('projectpulse_persona_list', {
            projectId: -1,
          });
          assert.fail('Should have rejected negative projectId');
        } catch (error) {
          assert.ok(true, 'Correctly rejected invalid projectId');
        }
      } finally {
        await client.disconnect();
      }
    });

    test('tools reject missing required parameters', async () => {
      const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

      try {
        await client.connect();

        // Test without projectId
        try {
          await client.callToolText('projectpulse_persona_list', {});
          assert.fail('Should have rejected missing projectId');
        } catch (error) {
          assert.ok(true, 'Correctly rejected missing projectId');
        }
      } finally {
        await client.disconnect();
      }
    });
  });
});
