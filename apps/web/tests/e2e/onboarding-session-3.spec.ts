/**
 * E2E Test: Onboarding Session 3 - AI Workflow Bootstrap (Template-Based)
 *
 * Tests:
 * - POST /api/onboarding/bootstrap (complete workflow)
 * - Agent personas creation (tech stack-based)
 * - Skills library creation
 * - Workflows and SOPs creation
 * - Roadmap materialization from 13-Project-Plan.md
 * - CurrentPlan and CurrentTodos creation via API
 * - CLAUDE.md and AGENTS.md file writes
 * - Error scenarios
 *
 * Architecture: Template-Based (NO AI generation)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_PROJECT_ID = 1;

// Helper: Create temporary directory for repo files
async function createTempRepo(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'onboarding-test-'));
  return tmpDir;
}

// Helper: Clean up temporary directory
async function cleanupTempRepo(repoPath: string) {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup ${repoPath}:`, error);
  }
}

test.describe('Onboarding Session 3: AI Workflow Bootstrap', () => {
  
  test('should bootstrap complete workflow', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Call bootstrap API', async () => {
        console.log(`Bootstrapping project ${projectId} to ${repoPath}`);
        
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: {
            projectId,
            repoPath
          }
        });
        
        if (!bootstrapRes.ok()) {
          const error = await bootstrapRes.json();
          console.error('Bootstrap failed:', error);
        }
        
        expect(bootstrapRes.ok()).toBeTruthy();
        
        const result = await bootstrapRes.json();
        expect(result.success).toBe(true);
        expect(result.session3Complete).toBe(true);
        
        // Verify counts
        expect(result.created.agentPersonas).toBeGreaterThanOrEqual(3);
        expect(result.created.agentPersonas).toBeLessThanOrEqual(10);
        expect(result.created.skills).toBeGreaterThanOrEqual(5);
        expect(result.created.skills).toBeLessThanOrEqual(15);
        expect(result.created.workflows).toBe(3);
        expect(result.created.sops).toBe(5);
        expect(result.created.roadmap.phases).toBeGreaterThan(0);
        expect(result.created.currentPlan).toBe(true);
        expect(result.created.currentTodos).toBe(true);
        expect(result.created.files.claudeMd).toBe(true);
        expect(result.created.files.agentsMd).toBe(true);
        
        console.log('Bootstrap complete! ✅');
        console.log(`- Agent personas: ${result.created.agentPersonas}`);
        console.log(`- Skills: ${result.created.skills}`);
        console.log(`- Workflows: ${result.created.workflows}`);
        console.log(`- SOPs: ${result.created.sops}`);
        console.log(`- Roadmap: ${result.created.roadmap.phases} phases, ${result.created.roadmap.weeks} weeks`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should create agent personas based on tech stack', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Bootstrap', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { projectId, repoPath }
        });
        
        const result = await bootstrapRes.json();
        expect(result.created.agentPersonas).toBeGreaterThanOrEqual(3);
        expect(result.created.agentPersonas).toBeLessThanOrEqual(10);
        
        console.log(`Created ${result.created.agentPersonas} agent personas ✅`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should create skills library', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Bootstrap', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { projectId, repoPath }
        });
        
        const result = await bootstrapRes.json();
        expect(result.created.skills).toBeGreaterThanOrEqual(5);
        
        console.log(`Created ${result.created.skills} skills ✅`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should create workflows and SOPs', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Bootstrap', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { projectId, repoPath }
        });
        
        const result = await bootstrapRes.json();
        expect(result.created.workflows).toBe(3);
        expect(result.created.sops).toBe(5);
        
        console.log(`Created ${result.created.workflows} workflows and ${result.created.sops} SOPs ✅`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should materialize roadmap from 13-Project-Plan.md', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Bootstrap and verify roadmap', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { projectId, repoPath }
        });
        
        const result = await bootstrapRes.json();
        expect(result.created.roadmap.phases).toBeGreaterThan(0);
        expect(result.created.roadmap.weeks).toBeGreaterThan(0);
        
        console.log(`Roadmap materialized: ${result.created.roadmap.phases} phases, ${result.created.roadmap.weeks} weeks ✅`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should create CurrentPlan and CurrentTodos', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Bootstrap and verify current work', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { projectId, repoPath }
        });
        
        const result = await bootstrapRes.json();
        expect(result.created.currentPlan).toBe(true);
        expect(result.created.currentTodos).toBe(true);
        
        console.log('CurrentPlan and CurrentTodos created ✅');
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should write CLAUDE.md and AGENTS.md to repository', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    const repoPath = await createTempRepo();
    
    try {
      test.step('Bootstrap', async () => {
        await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { projectId, repoPath }
        });
      });
      
      test.step('Verify CLAUDE.md exists', async () => {
        const claudePath = path.join(repoPath, 'CLAUDE.md');
        const stat = await fs.stat(claudePath);
        expect(stat.isFile()).toBe(true);
        
        const claudeContent = await fs.readFile(claudePath, 'utf-8');
        expect(claudeContent).toContain('Claude Code Integration Guide');
        expect(claudeContent).toContain('ProjectPulse');
        expect(claudeContent).toContain('5-Step Protocol');
        expect(claudeContent).toContain('Memory Bank');
        
        console.log(`CLAUDE.md written (${claudeContent.length} chars) ✅`);
      });
      
      test.step('Verify AGENTS.md exists', async () => {
        const agentsPath = path.join(repoPath, 'AGENTS.md');
        const stat = await fs.stat(agentsPath);
        expect(stat.isFile()).toBe(true);
        
        const agentsContent = await fs.readFile(agentsPath, 'utf-8');
        expect(agentsContent).toContain('Available Agent Personas');
        expect(agentsContent).toContain('projectpulse.agent.invoke');
        
        console.log(`AGENTS.md written (${agentsContent.length} chars) ✅`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should prevent bootstrap without Session 1 complete', async ({ request }) => {
    const projectId = TEST_PROJECT_ID + 200; // New project
    const repoPath = await createTempRepo();
    
    try {
      test.step('Try to bootstrap', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: {
            projectId,
            repoPath
          }
        });
        
        expect(bootstrapRes.status()).toBe(400);
        
        const error = await bootstrapRes.json();
        expect(error.error).toContain('Session 1 must be complete');
        
        console.log(`Validation working: ${error.error}`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should prevent bootstrap without Session 2 complete', async ({ request }) => {
    const projectId = TEST_PROJECT_ID + 201; // New project
    const repoPath = await createTempRepo();
    
    try {
      test.step('Try to bootstrap without prerequisites', async () => {
        const bootstrapRes = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: {
            projectId,
            repoPath
          }
        });
        
        expect(bootstrapRes.status()).toBe(400);
        
        const error = await bootstrapRes.json();
        expect(error.error).toContain('Session');
        
        console.log(`Validation working: ${error.error}`);
      });
    } finally {
      await cleanupTempRepo(repoPath);
    }
  });
  
  test('should validate required parameters', async ({ request }) => {
    test.step('POST bootstrap without projectId', async () => {
      const repoPath = await createTempRepo();
      
      try {
        const res = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
          data: { repoPath }
        });
        expect(res.status()).toBe(400);
      } finally {
        await cleanupTempRepo(repoPath);
      }
    });
    
    test.step('POST bootstrap without repoPath', async () => {
      const res = await request.post(`${API_BASE}/api/onboarding/bootstrap`, {
        data: { projectId: 1 }
      });
      expect(res.status()).toBe(400);
    });
  });
  
});
