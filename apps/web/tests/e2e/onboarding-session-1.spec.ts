/**
 * E2E Test: Onboarding Session 1 - Strategic Planning (Agent-Side AI)
 *
 * Tests:
 * - GET questions for all 10 phases
 * - POST answers for each phase
 * - GET executive summary prompt (agent-side AI)
 * - POST agent-generated executive summary
 * - Verify API responses
 * - Error scenarios
 *
 * Architecture: Agent-Side AI (NO server-side OpenAI)
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_PROJECT_ID = 1;

// Helper: Generate mock answers for questions
function generateMockAnswers(questions: any): Record<string, string> {
  const answers: Record<string, string> = {};

  questions.subsections?.forEach((subsection: any) => {
    subsection.questions?.forEach((question: any) => {
      answers[question.id] = `Mock answer for: ${question.text}`;
    });
  });

  return answers;
}

// Helper: Generate mock executive summary
function generateMockExecutiveSummary(): string {
  return `TaskFlow is an AI-powered task management platform designed for solo developers and small dev teams (2-5 people). 
  
The platform addresses the core problem of chaotic task management by providing an intuitive, AI-enhanced interface that helps teams organize, prioritize, and track their work efficiently.

Key features include:
1. Intelligent task tracking with AI-powered categorization
2. Real-time team collaboration features
3. Advanced analytics and reporting dashboards
4. Seamless integration with popular development tools
5. Customizable workflows and automation

Built with React, Node.js, and PostgreSQL, the platform leverages modern web technologies to deliver a fast, responsive user experience. The system is designed for self-hosting, giving teams full control over their data and infrastructure.

Success metrics include achieving 100 active users within 3 months of launch, maintaining 95%+ uptime, and receiving positive feedback from early adopters. The project timeline spans 6 months with a team of 3 developers, focusing on iterative development and continuous user feedback integration.`;
}

test.describe('Onboarding Session 1: Strategic Planning', () => {
  test('should complete all 10 phases of questions', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;

    // Phase 1-10: Get questions and submit answers
    for (let phase = 1; phase <= 10; phase++) {
      test.step(`Phase ${phase}: Get questions and submit answers`, async () => {
        // Get questions for phase
        const questionsRes = await request.get(
          `${API_BASE}/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
        );
        expect(questionsRes.ok()).toBeTruthy();

        const questions = await questionsRes.json();
        expect(questions.phase).toBe(phase);
        expect(questions.subsections.length).toBeGreaterThan(0);
        expect(questions.totalQuestions).toBeGreaterThan(0);

        console.log(
          `Phase ${phase}: ${questions.phaseName} - ${questions.totalQuestions} questions`
        );

        // Generate mock answers
        const answers = generateMockAnswers(questions);
        expect(Object.keys(answers).length).toBe(questions.totalQuestions);

        // Submit answers for phase
        const answersRes = await request.post(`${API_BASE}/api/onboarding/answers`, {
          data: {
            projectId,
            phase,
            answers,
          },
        });
        expect(answersRes.ok()).toBeTruthy();

        const result = await answersRes.json();
        expect(result.success).toBe(true);
        expect(result.completedPhases).toContain(phase);
        expect(result.phase).toBe(phase);

        if (phase < 10) {
          expect(result.nextPhase).toBe(phase + 1);
          expect(result.readyForExecutiveSummary).toBe(false);
        } else {
          expect(result.nextPhase).toBeNull();
          expect(result.readyForExecutiveSummary).toBe(true);
        }
      });
    }
  });

  test('should get executive summary prompt with all 96 Q&A pairs', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;

    test.step('Complete all 10 phases first', async () => {
      for (let phase = 1; phase <= 10; phase++) {
        const questionsRes = await request.get(
          `${API_BASE}/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
        );
        const questions = await questionsRes.json();
        const answers = generateMockAnswers(questions);

        await request.post(`${API_BASE}/api/onboarding/answers`, {
          data: { projectId, phase, answers },
        });
      }
    });

    test.step('Get executive summary prompt', async () => {
      const promptRes = await request.get(
        `${API_BASE}/api/onboarding/executive-summary-prompt?projectId=${projectId}`
      );
      expect(promptRes.ok()).toBeTruthy();

      const prompt = await promptRes.json();

      // Verify prompt structure
      expect(prompt.systemPrompt).toBeDefined();
      expect(prompt.systemPrompt).toContain('product strategist');
      expect(prompt.userPrompt).toBeDefined();
      expect(prompt.userPrompt).toContain('Phase 1:');
      expect(prompt.userPrompt).toContain('Phase 10:');

      // Verify metadata
      expect(prompt.metadata.totalQuestions).toBeGreaterThanOrEqual(90); // ~96 questions
      expect(prompt.metadata.completedPhases).toBe(10);
      expect(prompt.metadata.userPromptCharacters).toBeGreaterThan(10000);

      // Verify required fields
      expect(prompt.requiredSections).toBeDefined();
      expect(prompt.wordCountTarget).toBe(500);
      expect(prompt.temperature).toBe(0.7);

      console.log(
        `Prompt metadata: ${prompt.metadata.totalQuestions} questions, ${prompt.metadata.userPromptCharacters} chars`
      );
    });
  });

  test('should store agent-generated executive summary', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;

    test.step('Complete all 10 phases', async () => {
      for (let phase = 1; phase <= 10; phase++) {
        const questionsRes = await request.get(
          `${API_BASE}/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
        );
        const questions = await questionsRes.json();
        const answers = generateMockAnswers(questions);

        await request.post(`${API_BASE}/api/onboarding/answers`, {
          data: { projectId, phase, answers },
        });
      }
    });

    test.step('Store agent-generated summary', async () => {
      // Agent generates summary with their AI (simulated)
      const executiveSummary = generateMockExecutiveSummary();
      const wordCount = executiveSummary.split(/\s+/).length;

      console.log(`Storing executive summary: ${wordCount} words`);

      // Store agent-generated summary
      const storeRes = await request.post(`${API_BASE}/api/onboarding/executive-summary`, {
        data: {
          projectId,
          executiveSummary,
          wordCount,
        },
      });
      expect(storeRes.ok()).toBeTruthy();

      const result = await storeRes.json();
      expect(result.success).toBe(true);
      expect(result.stored).toBe(true);
      expect(result.wordCount).toBe(wordCount);
      expect(result.projectContextJson).toBeDefined();
      expect(result.projectContextJson.metadata).toBeDefined();
      expect(result.projectContextJson.metadata.projectName).toBeDefined();

      console.log(`Project context generated: ${result.projectContextJson.metadata.projectName}`);
    });
  });

  test('should verify Session 1 completion via API', async ({ request }) => {
    const projectId = TEST_PROJECT_ID;

    test.step('Complete Session 1', async () => {
      // Complete all phases
      for (let phase = 1; phase <= 10; phase++) {
        const questionsRes = await request.get(
          `${API_BASE}/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
        );
        const questions = await questionsRes.json();
        const answers = generateMockAnswers(questions);

        await request.post(`${API_BASE}/api/onboarding/answers`, {
          data: { projectId, phase, answers },
        });
      }

      // Store executive summary
      const executiveSummary = generateMockExecutiveSummary();
      const storeRes = await request.post(`${API_BASE}/api/onboarding/executive-summary`, {
        data: { projectId, executiveSummary },
      });

      const result = await storeRes.json();
      expect(result.success).toBe(true);
      expect(result.projectContextJson).toBeDefined();
      expect(result.projectContextJson.metadata.projectName).toBeDefined();

      console.log('Session 1 completion verified via API ✅');
    });
  });

  test('should prevent executive summary generation without all phases', async ({ request }) => {
    const projectId = TEST_PROJECT_ID + 1; // New project

    test.step('Complete only 5 phases', async () => {
      for (let phase = 1; phase <= 5; phase++) {
        const questionsRes = await request.get(
          `${API_BASE}/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
        );
        const questions = await questionsRes.json();
        const answers = generateMockAnswers(questions);

        await request.post(`${API_BASE}/api/onboarding/answers`, {
          data: { projectId, phase, answers },
        });
      }
    });

    test.step('Try to get prompt (should fail)', async () => {
      const promptRes = await request.get(
        `${API_BASE}/api/onboarding/executive-summary-prompt?projectId=${projectId}`
      );

      expect(promptRes.status()).toBe(400);

      const error = await promptRes.json();
      expect(error.error).toContain('All 10 phases must be complete');
      expect(error.completedPhases).toBeLessThan(10);

      console.log(`Error validation working: ${error.error}`);
    });
  });

  test('should validate required parameters', async ({ request }) => {
    test.step('GET questions without projectId', async () => {
      const res = await request.get(`${API_BASE}/api/onboarding/questions?phase=1`);
      expect(res.status()).toBe(400);
    });

    test.step('GET questions without phase', async () => {
      const res = await request.get(`${API_BASE}/api/onboarding/questions?projectId=1`);
      expect(res.status()).toBe(400);
    });

    test.step('GET questions with invalid phase', async () => {
      const res = await request.get(`${API_BASE}/api/onboarding/questions?projectId=1&phase=11`);
      expect(res.status()).toBe(400);
    });

    test.step('POST executive summary without all required fields', async () => {
      const res = await request.post(`${API_BASE}/api/onboarding/executive-summary`, {
        data: { projectId: 1 }, // Missing executiveSummary
      });
      expect(res.status()).toBe(400);
    });
  });
});
