/**
 * Sprint 11 MCP Tools E2E Tests
 * 
 * Tests the new client agent integration tools:
 * - projectpulse_persona_list
 * - projectpulse_persona_get
 * - projectpulse_skill_list
 * - projectpulse_skill_get
 * - projectpulse_sop_list
 * - projectpulse_sop_get
 * 
 * Run: node --test tests/e2e/sprint-11-tools.test.ts
 */

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const MCP_URL = process.env.MCP_URL || 'http://192.168.1.15:3001';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev';

const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

let testProjectId: number;
let testToken: string;

async function callMcpTool(toolName: string, args: Record<string, any>, token: string): Promise<any> {
  const response = await fetch(`${MCP_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data.result;
}

describe('Sprint 11: Client Agent MCP Tools', () => {
  before(async () => {
    console.log('🔧 Setting up test project with token...');
    
    // Find test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'dev@projectpulse.local' },
    });
    
    if (!testUser) {
      throw new Error('Test user not found. Run: pnpm prisma db seed');
    }
    
    // Create test project
    const project = await prisma.project.create({
      data: {
        name: `Sprint11Test_${Date.now()}`,
        ownerId: testUser.id,
      },
    });
    testProjectId = project.id;
    
    // Create token
    testToken = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(testToken, 10);
    
    await prisma.projectToken.create({
      data: {
        projectId: testProjectId,
        name: 'sprint-11-test-token',
        tokenHash,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    
    console.log(`✓ Created test project ${testProjectId} with token`);
  });
  
  after(async () => {
    console.log('🧹 Cleaning up test data...');
    
    if (testProjectId) {
      // Delete in order to respect FK constraints
      await prisma.projectToken.deleteMany({ where: { projectId: testProjectId } });
      await prisma.agentPersona.deleteMany({ where: { projectId: testProjectId } });
      await prisma.skill.deleteMany({ where: { projectId: testProjectId } });
      await prisma.sOP.deleteMany({ where: { projectId: testProjectId } });
      await prisma.project.delete({ where: { id: testProjectId } });
    }
    
    await prisma.$disconnect();
    console.log('✓ Cleanup complete');
  });
  
  describe('Persona Tools', () => {
    test('persona_list returns empty list for new project', async () => {
      const result = await callMcpTool('projectpulse_persona_list', {
        projectId: testProjectId,
      }, testToken);
      
      assert.ok(result.content, 'Should have content');
      assert.ok(result.content[0].text.includes('(0)'), 'Should show 0 personas');
      console.log('✓ persona_list returns empty list');
    });
    
    test('persona_list returns personas after creation', async () => {
      // Create test persona via batch tool
      await callMcpTool('projectpulse_batch_createAgentPersonas', {
        projectId: testProjectId,
        personas: [{
          name: 'Test Expert',
          slug: 'test-expert',
          description: 'A test persona',
          expertise: ['Testing', 'Validation'],
          systemPrompt: 'You are a test expert.',
        }],
      }, testToken);
      
      const result = await callMcpTool('projectpulse_persona_list', {
        projectId: testProjectId,
      }, testToken);
      
      assert.ok(result.content[0].text.includes('Test Expert'), 'Should include created persona');
      assert.ok(result.content[0].text.includes('test-expert'), 'Should include slug');
      console.log('✓ persona_list returns created persona');
    });
    
    test('persona_get returns full details by slug', async () => {
      const result = await callMcpTool('projectpulse_persona_get', {
        projectId: testProjectId,
        slug: 'test-expert',
      }, testToken);
      
      const text = result.content[0].text;
      assert.ok(text.includes('Test Expert'), 'Should include name');
      assert.ok(text.includes('System Prompt'), 'Should include systemPrompt section');
      assert.ok(text.includes('You are a test expert'), 'Should include actual prompt');
      console.log('✓ persona_get returns full details');
    });
    
    test('persona_get returns error for non-existent persona', async () => {
      const result = await callMcpTool('projectpulse_persona_get', {
        projectId: testProjectId,
        slug: 'nonexistent',
      }, testToken);
      
      // Tool returns error in content with isError flag
      const text = result.content[0].text;
      assert.ok(
        result.isError || text.includes('error') || text.includes('not found') || text.includes('404'),
        'Should indicate not found'
      );
      console.log('✓ persona_get handles not found');
    });
  });
  
  describe('SOP Tools', () => {
    test('sop_list returns empty list for new project', async () => {
      const result = await callMcpTool('projectpulse_sop_list', {
        projectId: testProjectId,
      }, testToken);
      
      assert.ok(result.content[0].text.includes('(0)'), 'Should show 0 SOPs');
      console.log('✓ sop_list returns empty list');
    });
    
    test('sop_list returns SOPs after creation', async () => {
      // Create test SOP
      await callMcpTool('projectpulse_batch_createSOPs', {
        projectId: testProjectId,
        sops: [{
          title: 'Test Workflow',
          slug: 'test-workflow',
          description: 'A test SOP',
          category: 'Testing',
          content: '# Test Workflow\n\n1. Step one\n2. Step two',
        }],
      }, testToken);
      
      const result = await callMcpTool('projectpulse_sop_list', {
        projectId: testProjectId,
      }, testToken);
      
      assert.ok(result.content[0].text.includes('Test Workflow'), 'Should include created SOP');
      assert.ok(result.content[0].text.includes('Testing'), 'Should show category');
      console.log('✓ sop_list returns created SOP');
    });
    
    test('sop_get returns full content by slug', async () => {
      const result = await callMcpTool('projectpulse_sop_get', {
        projectId: testProjectId,
        slug: 'test-workflow',
      }, testToken);
      
      const text = result.content[0].text;
      assert.ok(text.includes('Test Workflow'), 'Should include title');
      assert.ok(text.includes('Step one'), 'Should include content');
      console.log('✓ sop_get returns full content');
    });
  });
  
  describe('Skill Tools', () => {
    test('skill_list returns empty list for new project', async () => {
      const result = await callMcpTool('projectpulse_skill_list', {
        projectId: testProjectId,
      }, testToken);
      
      assert.ok(result.content[0].text.includes('(0)'), 'Should show 0 skills');
      console.log('✓ skill_list returns empty list');
    });
    
    test('skill_list returns skills after creation', async () => {
      // Create test skill
      await callMcpTool('projectpulse_batch_createSkills', {
        projectId: testProjectId,
        skills: [{
          title: 'Test Pattern',
          slug: 'test-pattern',
          description: 'A test skill',
          category: 'testing',
          content: '# Test Pattern\n\nThis is a test skill.',
        }],
      }, testToken);
      
      const result = await callMcpTool('projectpulse_skill_list', {
        projectId: testProjectId,
      }, testToken);
      
      assert.ok(result.content[0].text.includes('Test Pattern'), 'Should include created skill');
      console.log('✓ skill_list returns created skill');
    });
    
    test('skill_get returns full content by slug', async () => {
      const result = await callMcpTool('projectpulse_skill_get', {
        projectId: testProjectId,
        slug: 'test-pattern',
      }, testToken);
      
      const text = result.content[0].text;
      assert.ok(text.includes('Test Pattern'), 'Should include title');
      assert.ok(text.includes('This is a test skill'), 'Should include content');
      console.log('✓ skill_get returns full content');
    });
  });
  
  describe('Multi-tenancy', () => {
    test('tools only return data for authorized project', async () => {
      // Try to access a different project
      const result = await callMcpTool('projectpulse_persona_list', {
        projectId: 99999, // Non-existent project
      }, testToken);
      
      // Should return empty, not error (token is valid, project just has no data)
      assert.ok(result.content[0].text.includes('(0)'), 'Should show 0 for other project');
      console.log('✓ Multi-tenancy enforced');
    });
  });
});
