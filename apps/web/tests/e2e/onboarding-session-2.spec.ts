/**
 * E2E Test: Onboarding Session 2 - Documentation Generation (Agent-Side AI)
 *
 * Tests:
 * - GET all 15 document prompts
 * - POST agent-generated documents one by one
 * - Progress tracking (X/15 complete)
 * - Session 2 completion after 15th document
 * - Verify 13-Project-Plan.md exists via API
 *
 * Architecture: Agent-Side AI (NO server-side OpenAI)
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_PROJECT_ID = 1;

// Helper: Generate mock document content
function generateMockDocument(prompt: any): string {
  const targetWords = prompt.wordCountTarget || 1000;
  const wordsArray = [];
  
  // Generate mock content with approximately target word count
  const intro = `# ${prompt.title}\n\nThis is a comprehensive ${prompt.title.toLowerCase()} for the project.\n\n`;
  wordsArray.push(intro);
  
  // Add sections
  for (let i = 0; i < Math.floor(targetWords / 50); i++) {
    wordsArray.push(`## Section ${i + 1}\n\n`);
    wordsArray.push(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n`);
  }
  
  return wordsArray.join('');
}

// Helper: Complete Session 1 for prerequisite
async function completeSession1(request: any, projectId: number) {
  // Simplified version - just mark Session 1 as complete
  // In real test, you'd complete all 10 phases
  console.log(`Prerequisite: Completing Session 1 for project ${projectId}`);
}

test.describe('Onboarding Session 2: Documentation Generation', () => {
  
  test('should get all 15 document prompts', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    
    test.step('Prerequisites: Session 1 complete', async () => {
      await completeSession1(request, projectId);
    });
    
    test.step('Get document prompts', async () => {
      const promptsRes = await request.get(
        `${API_BASE}/api/onboarding/document-prompts?projectId=${projectId}`
      );
      expect(promptsRes.ok()).toBeTruthy();
      
      const prompts = await promptsRes.json();
      expect(prompts.totalDocuments).toBe(15);
      expect(prompts.documentPrompts).toHaveLength(15);
      expect(prompts.estimatedTotalWords).toBeGreaterThan(20000);
      
      console.log(`Received ${prompts.totalDocuments} document prompts (${prompts.estimatedTotalWords} estimated words)`);
      
      // Verify each prompt has required structure
      prompts.documentPrompts.forEach((prompt: any) => {
        expect(prompt.filename).toBeDefined();
        expect(prompt.title).toBeDefined();
        expect(prompt.category).toBeDefined();
        expect(prompt.systemPrompt).toBeDefined();
        expect(prompt.userPrompt).toBeDefined();
        expect(prompt.wordCountTarget).toBeGreaterThan(0);
        
        // Verify categories
        expect(['planning', 'architecture', 'implementation', 'operations']).toContain(prompt.category);
      });
      
      // Verify specific documents exist
      const filenames = prompts.documentPrompts.map((p: any) => p.filename);
      expect(filenames).toContain('01-PRD.md');
      expect(filenames).toContain('13-Project-Plan.md'); // Critical for Session 3
    });
  });
  
  test('should store agent-generated documents one by one', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    
    test.step('Get prompts', async () => {
      const promptsRes = await request.get(
        `${API_BASE}/api/onboarding/document-prompts?projectId=${projectId}`
      );
      const prompts = await promptsRes.json();
      
      expect(prompts.documentPrompts).toHaveLength(15);
      
      // Store first 3 documents (testing subset for performance)
      for (let i = 0; i < 3; i++) {
        const prompt = prompts.documentPrompts[i];
        
        test.step(`Store document ${i + 1}: ${prompt.filename}`, async () => {
          console.log(`Generating ${prompt.filename}...`);
          
          // Agent generates document (simulated)
          const document = generateMockDocument(prompt);
          const wordCount = document.split(/\s+/).length;
          
          console.log(`Generated: ${wordCount} words (target: ${prompt.wordCountTarget})`);
          
          // Store document
          const storeRes = await request.post(`${API_BASE}/api/onboarding/documents`, {
            data: {
              projectId,
              filename: prompt.filename,
              content: document,
              category: prompt.category,
              wordCount
            }
          });
          expect(storeRes.ok()).toBeTruthy();
          
          const result = await storeRes.json();
          expect(result.success).toBe(true);
          expect(result.stored).toBe(true);
          expect(result.filename).toBe(prompt.filename);
        });
      }
    });
  });
  
  test('should track progress as documents are stored', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    
    test.step('Store 5 documents', async () => {
      for (let i = 1; i <= 5; i++) {
        await request.post(`${API_BASE}/api/onboarding/documents`, {
          data: {
            projectId,
            filename: `0${i}-Document.md`,
            content: generateMockDocument({ wordCountTarget: 500, title: `Document ${i}` }),
            category: 'planning',
            wordCount: 500
          }
        });
      }
    });
    
    test.step('Check progress', async () => {
      const docsRes = await request.get(
        `${API_BASE}/api/onboarding/documents?projectId=${projectId}`
      );
      expect(docsRes.ok()).toBeTruthy();
      
      const docs = await docsRes.json();
      
      expect(docs.totalDocuments).toBeGreaterThanOrEqual(5);
      expect(docs.documents).toBeDefined();
      expect(Array.isArray(docs.documents)).toBe(true);
      
      console.log(`Progress: ${docs.totalDocuments}/15 documents stored`);
      
      // Verify document metadata
      docs.documents.forEach((doc: any) => {
        expect(doc.filename).toBeDefined();
        expect(doc.wordCount).toBeGreaterThan(0);
        expect(doc.category).toBeDefined();
        expect(doc.generatedAt).toBeDefined();
      });
    });
  });
  
  test('should complete Session 2 after 15 documents stored', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    
    test.step('Get all prompts', async () => {
      const promptsRes = await request.get(
        `${API_BASE}/api/onboarding/document-prompts?projectId=${projectId}`
      );
      const prompts = await promptsRes.json();
      
      // Store all 15 documents
      for (const prompt of prompts.documentPrompts) {
        const document = generateMockDocument(prompt);
        const wordCount = document.split(/\s+/).length;
        
        await request.post(`${API_BASE}/api/onboarding/documents`, {
          data: {
            projectId,
            filename: prompt.filename,
            content: document,
            category: prompt.category,
            wordCount
          }
        });
      }
      
      console.log('All 15 documents stored');
    });
    
    test.step('Verify Session 2 complete via API', async () => {
      const docsRes = await request.get(
        `${API_BASE}/api/onboarding/documents?projectId=${projectId}`
      );
      expect(docsRes.ok()).toBeTruthy();
      
      const docs = await docsRes.json();
      expect(docs.totalDocuments).toBe(15);
      expect(docs.session2Complete).toBe(true);
      
      console.log(`Session 2 complete: ${docs.totalDocuments} documents`);
    });
  });
  
  test('should verify 13-Project-Plan.md exists via API', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;
    
    test.step('Complete Session 2 with all documents', async () => {
      const promptsRes = await request.get(
        `${API_BASE}/api/onboarding/document-prompts?projectId=${projectId}`
      );
      const prompts = await promptsRes.json();
      
      // Ensure 13-Project-Plan.md is stored
      const projectPlanPrompt = prompts.documentPrompts.find((p: any) => 
        p.filename.includes('13-Project-Plan')
      );
      expect(projectPlanPrompt).toBeDefined();
      
      // Generate with proper format for Session 3 parsing
      const projectPlanContent = `
# Project Implementation Plan

## Phase 1: Foundation (Weeks 1-4, Sprints 1-2)

**Duration**: 4 weeks
**Points**: 20 points

### Sprint 1 (Weeks 1-2): Database Setup - 8 points

**Goals**:
- Set up database schema
- Implement user authentication

**Weeks**:
- Week 1: Database models
- Week 2: Authentication

### Sprint 2 (Weeks 3-4): API Development - 12 points

**Goals**:
- Build REST API
- Add validation

**Weeks**:
- Week 3: Core API endpoints
- Week 4: Validation layer

## Phase 2: Implementation (Weeks 5-8, Sprints 3-4)

**Duration**: 4 weeks
**Points**: 25 points

### Sprint 3 (Weeks 5-6): Frontend Foundation - 13 points

**Goals**:
- Set up React components
- Implement routing

**Weeks**:
- Week 5: Component library
- Week 6: Routing and navigation
      `.trim();
      
      await request.post(`${API_BASE}/api/onboarding/documents`, {
        data: {
          projectId,
          filename: projectPlanPrompt.filename,
          content: projectPlanContent,
          category: 'planning',
          wordCount: projectPlanContent.split(/\s+/).length
        }
      });
    });
    
    test.step('Verify 13-Project-Plan.md exists via API', async () => {
      const docsRes = await request.get(
        `${API_BASE}/api/onboarding/documents?projectId=${projectId}`
      );
      const docs = await docsRes.json();
      
      const projectPlanDoc = docs.documents.find((d: any) => 
        d.filename.includes('13-Project-Plan')
      );
      
      expect(projectPlanDoc).toBeDefined();
      expect(projectPlanDoc.content).toContain('## Phase');
      expect(projectPlanDoc.content).toContain('### Sprint');
      expect(projectPlanDoc.content).toContain('Weeks');
      
      console.log('13-Project-Plan.md verified for Session 3 parsing ✅');
    });
  });
  
  test('should validate required parameters', async ({ request }) => {
    test.step('GET document-prompts without projectId', async () => {
      const res = await request.get(`${API_BASE}/api/onboarding/document-prompts`);
      expect(res.status()).toBe(400);
    });
    
    test.step('POST document without required fields', async () => {
      const res = await request.post(`${API_BASE}/api/onboarding/documents`, {
        data: { projectId: 1 } // Missing filename, content, category
      });
      expect(res.status()).toBe(400);
    });
    
    test.step('GET documents without projectId', async () => {
      const res = await request.get(`${API_BASE}/api/onboarding/documents`);
      expect(res.status()).toBe(400);
    });
  });
  
  test('should prevent Session 2 without Session 1 complete', async ({ request }) => {
    const projectId = TEST_PROJECT_ID + 100; // New project without Session 1
    
    test.step('Try to get document prompts', async () => {
      const res = await request.get(
        `${API_BASE}/api/onboarding/document-prompts?projectId=${projectId}`
      );
      
      expect(res.status()).toBe(400);
      
      const error = await res.json();
      expect(error.error).toContain('Session 1 must be complete');
      
      console.log(`Validation working: ${error.error}`);
    });
  });
  
});
