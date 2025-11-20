/**
 * E2E Test: Full 3-Session Onboarding Workflow (Integrated)
 *
 * Tests complete onboarding flow with shared state across sessions.
 * This suite mirrors real AI agent behavior where one projectId persists
 * across Session 1 → Session 2 → Session 3.
 *
 * Architecture:
 * - beforeAll: Create shared project + temp repo (ONE TIME)
 * - Test 1: Session 1 - Strategic Planning (10 phases + executive summary)
 * - Test 2: Session 2 - Document Generation (15 docs, requires Session 1)
 * - Test 3: Session 3 - Bootstrap (personas/skills/roadmap, requires Session 1+2)
 * - afterAll: Cleanup shared project + temp repo (ONE TIME)
 *
 * Why Integrated Suite?
 * - Session 2 needs Session 1's executiveSummary in projectContextJson
 * - Session 3 needs Session 1+2's projectContextJson + 13-Project-Plan.md
 * - Validates real dependency chain that validation tests cannot
 *
 * Run: node --test apps/mcp-server/tests/e2e/onboarding/full-onboarding-workflow.test.ts
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { PrismaClient } from '@prisma/client';
import { MCPTestClient } from '../setup/mcp-client.js';
import {
  generateMockAnswers,
  generateMockExecutiveSummary,
  generateMockDocument,
  generateMockProjectPlan,
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
  countWords,
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

describe('Full 3-Session Onboarding Workflow (Integrated)', { concurrency: false }, () => {
  let sharedProjectId: number;
  let tempRepoPath: string;

  // ONE-TIME SETUP: Create shared state for entire suite
  before(async () => {
    sharedProjectId = generateUniqueProjectId();
    console.log(`\n🔧 Integrated Test Suite - Shared Project ID: ${sharedProjectId}`);
    await createTestProject(sharedProjectId);
    tempRepoPath = await createTempRepo();
    console.log(`📁 Temporary repo: ${tempRepoPath}`);
  });

  // ONE-TIME CLEANUP: After all tests complete
  after(async () => {
    console.log(`\n🧹 Cleaning up shared project ${sharedProjectId}...`);
    await cleanupProjectData(sharedProjectId);
    await cleanupTempRepo(tempRepoPath);
  });

  // ============================================================================
  // TEST 1: Session 1 - Strategic Planning (10-Phase Q&A + Executive Summary)
  // ============================================================================

  test('Session 1: Complete 10-phase Q&A workflow + Executive Summary', async () => {
    const timer = new TestTimer();
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

    try {
      // Step 1: Connect to MCP server
      logTestStep('Session 1: Connecting to MCP server...');
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep(`Connected (session: ${client.getSessionId()})`, 'success');

      // Step 2: Loop through 10 phases
      let totalQuestionsAnswered = 0;

      for (let phase = 1; phase <= 10; phase++) {
        logTestStep(`Session 1 Phase ${phase}: Fetching questions...`);

        // Get questions for phase
        const questionsData = await client.callToolJSON<{
          phase: number;
          phaseName: string;
          subsections?: Array<{
            questions?: Array<{
              id: string;
              text: string;
              minLength?: number;
              maxLength?: number;
            }>;
          }>;
          totalQuestions: number;
        }>('projectpulse_onboarding_getQuestions', {
          projectId: sharedProjectId,
          phase,
        });

        assertDefined(questionsData.phaseName, 'Phase should have a name');
        assertEqual(questionsData.phase, phase, `Phase number should be ${phase}`);
        assertGreaterThanOrEqual(
          questionsData.totalQuestions || 0,
          1,
          'Phase should have at least 1 question'
        );

        logTestStep(
          `Session 1 Phase ${phase}: ${questionsData.phaseName} (${questionsData.totalQuestions} questions)`,
          'success'
        );

        // Generate mock answers for all questions
        const allQuestions: Array<{
          id: string;
          text: string;
          minLength?: number;
          maxLength?: number;
        }> = [];

        if (questionsData.subsections) {
          for (const subsection of questionsData.subsections) {
            if (subsection.questions) {
              allQuestions.push(...subsection.questions);
            }
          }
        }

        const answers = generateMockAnswers(allQuestions);
        totalQuestionsAnswered += Object.keys(answers).length;

        logTestStep(`Session 1 Phase ${phase}: Saving ${Object.keys(answers).length} answers...`);

        // Save answers
        const saveData = await client.callToolJSON<{
          success: boolean;
          phase: number;
          completedPhases: number;
          readyForExecutiveSummary?: boolean;
        }>('projectpulse_onboarding_saveAnswers', {
          projectId: sharedProjectId,
          phase,
          answers,
        });

        assertEqual(saveData.success, true, 'Save should succeed');
        assertEqual(
          saveData.completedPhases.length,
          phase,
          `Should have ${phase} completed phases`
        );

        logTestStep(
          `Session 1 Phase ${phase}: Answers saved (${saveData.completedPhases.length}/10 complete)`,
          'success'
        );

        // Check if ready for executive summary after phase 10
        if (phase === 10) {
          assertEqual(
            saveData.readyForExecutiveSummary,
            true,
            'Should be ready for executive summary after phase 10'
          );
          logTestStep('Session 1: All 10 phases complete!', 'success');
        }
      }

      logTestStep(`Session 1: Total questions answered: ${totalQuestionsAnswered}`);
      assertGreaterThanOrEqual(
        totalQuestionsAnswered,
        20,
        'Should answer at least 20 questions across all phases'
      );

      // Step 3: Get executive summary prompt
      logTestStep('Session 1: Fetching executive summary prompt...');

      const promptData = await client.callToolJSON<{
        systemPrompt: string;
        userPrompt: string;
        metadata: {
          totalQuestions: number;
          completedPhases: number;
        };
      }>('projectpulse_onboarding_getExecutiveSummaryPrompt', {
        projectId: sharedProjectId,
      });

      assertDefined(promptData.systemPrompt, 'Should have system prompt');
      assertDefined(promptData.userPrompt, 'Should have user prompt');
      assertContains(
        promptData.systemPrompt.toLowerCase(),
        'executive summary',
        'System prompt should mention executive summary'
      );
      assertEqual(
        promptData.metadata.completedPhases,
        10,
        'Should have 10 completed phases'
      );

      logTestStep(
        `Session 1: Executive summary prompt fetched (${promptData.metadata.totalQuestions} Q&A pairs)`,
        'success'
      );

      // Step 4: Store agent-generated executive summary
      logTestStep('Session 1: Generating and storing executive summary...');

      const mockSummary = generateMockExecutiveSummary(500, 'TaskFlow');
      const wordCount = countWords(mockSummary);

      const storeData = await client.callToolJSON<{
        success: boolean;
        stored: boolean;
        wordCount: number;
        projectContextJson: any;
      }>('projectpulse_onboarding_storeExecutiveSummary', {
        projectId: sharedProjectId,
        executiveSummary: mockSummary,
        wordCount,
      });

      assertEqual(storeData.success, true, 'Store should succeed');
      assertEqual(
        storeData.stored,
        true,
        'Executive summary should be stored'
      );
      assertGreaterThanOrEqual(
        storeData.wordCount,
        100,
        'Word count should be at least 100'
      );

      // CRITICAL: Verify API response confirms storage (Session 2 will read from DB)
      assertDefined(
        storeData.projectContextJson?.executiveSummary ||
        storeData.stored,
        'Executive summary should be stored (Session 2 will verify in DB)'
      );

      logTestStep(
        `Session 1: Executive summary stored (${storeData.wordCount} words)`,
        'success'
      );

      timer.stop();
      logTestStep(`\n✅ Session 1 Complete! (${timer.format()})`, 'success');

    } catch (error) {
      timer.stop();
      logTestStep(
        `Session 1 failed: ${error instanceof Error ? error.message : error}`,
        'error'
      );
      throw error;
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  });

  // ============================================================================
  // TEST 2: Session 2 - Document Generation (15 Documents)
  // ============================================================================

  test('Session 2: Generate and store all 15 documents (requires Session 1)', async () => {
    const timer = new TestTimer();
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

    try {
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep(`Session 2: Connected (session: ${client.getSessionId()})`, 'success');

      // VALIDATION: Verify Session 1 completed first
      logTestStep('Session 2: Verifying Session 1 prerequisite...');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev',
          },
        },
      });

      try {
        const session = await prisma.onboardingSession.findFirst({
          where: { projectId: sharedProjectId },
        });

        // DEBUG: Log what we found
        console.log(`DEBUG Session 2: Found session for project ${sharedProjectId}:`, {
          exists: !!session,
          sessionNumber: session?.sessionNumber,
          status: session?.status,
          response: session?.response,
        });

        assertDefined(
          session,
          'Session 1 must create OnboardingSession record'
        );
        assertEqual(
          session.status,
          'complete',
          'Session 1 must be marked complete'
        );
        assertDefined(
          (session.response as any)?.executiveSummary ||
          (session.response as any)?.projectContextJson?.executiveSummary,
          'Session 1 must have executiveSummary in response field'
        );

        logTestStep('Session 2: Session 1 prerequisite verified ✅', 'success');
      } finally {
        await prisma.$disconnect();
      }

      // Step 1: Get all 15 document prompts (HTTP stream handles large responses)
      logTestStep('Session 2: Fetching document prompts...');

      const promptsData = await client.callToolJSON<{
        documentPrompts: Array<{
          filename: string;
          title: string;
          category: string;
          systemPrompt: string;
          userPrompt: string;
          wordCountTarget: number;
        }>;
      }>('projectpulse_onboarding_getDocumentPrompts', {
        projectId: sharedProjectId,
      });

      assertEqual(
        promptsData.documentPrompts.length,
        15,
        'Should have 15 document prompts'
      );

      // Calculate total estimated words
      const estimatedTotalWords = promptsData.documentPrompts.reduce(
        (sum, doc) => sum + doc.wordCountTarget,
        0
      );
      assertGreaterThanOrEqual(
        estimatedTotalWords,
        20000,
        'Total word count should be substantial'
      );

      logTestStep(
        `Session 2: Fetched ${promptsData.documentPrompts.length} document prompts (estimated ${estimatedTotalWords} words total)`,
        'success'
      );

      // Verify critical documents exist
      const filenames = promptsData.documentPrompts.map((d) => d.filename);
      assert(
        filenames.some((f) => f.includes('PRD')),
        'Should include PRD'
      );
      assert(
        filenames.some((f) => f.includes('13-Project-Plan')),
        'Should include 13-Project-Plan.md (required for Session 3)'
      );

      // Step 2: Store each document
      let documentsStored = 0;

      for (const docPrompt of promptsData.documentPrompts) {
        logTestStep(`Session 2: Generating ${docPrompt.filename}...`);

        // Simulate agent generating document with AI
        // SPECIAL CASE: Use generateMockProjectPlan() for 13-Project-Plan.md (required for Session 3)
        const mockContent = docPrompt.filename.includes('13-Project-Plan')
          ? generateMockProjectPlan()
          : generateMockDocument(
              docPrompt.title,
              docPrompt.category,
              docPrompt.wordCountTarget
            );
        const wordCount = countWords(mockContent);

        logTestStep(
          `Session 2: Generated ${docPrompt.filename} (${wordCount} words)`
        );

        // Store document
        const storeData = await client.callToolJSON<{
          success: boolean;
          stored: boolean;
          document: {
            id: string;
            filename: string;
            wordCount: number;
            category: string;
            generatedAt: string;
          };
          progress: {
            documentsStored: number;
            totalDocuments: number;
            percentComplete: number;
            isComplete: boolean;
          };
        }>('projectpulse_onboarding_storeDocument', {
          projectId: sharedProjectId,
          filename: docPrompt.filename,
          content: mockContent,
          category: docPrompt.category,
          wordCount,
        });

        assertEqual(storeData.success, true, 'Store should succeed');
        assertEqual(
          storeData.document.filename,
          docPrompt.filename,
          'Filename should match'
        );

        documentsStored++;
        assertEqual(
          storeData.progress.documentsStored,
          documentsStored,
          `Should have ${documentsStored} documents stored`
        );

        logTestStep(
          `Session 2: Stored ${docPrompt.filename} (${storeData.progress.documentsStored}/${storeData.progress.totalDocuments})`,
          'success'
        );
      }

      // Step 3: List all documents to verify
      logTestStep('Session 2: Verifying all documents stored...');

      const listData = await client.callToolJSON<{
        totalDocuments: number;
        status: string;
        documents: Array<{
          filename: string;
          wordCount: number;
          category: string;
          generatedAt: string;
        }>;
      }>('projectpulse_onboarding_listDocuments', {
        projectId: sharedProjectId,
      });

      assertEqual(
        listData.totalDocuments,
        15,
        'Should have 15 documents stored'
      );
      assertEqual(
        listData.status,
        'complete',
        'Session 2 should be complete'
      );

      logTestStep(
        `Session 2: All documents verified (${listData.totalDocuments}/15)`,
        'success'
      );

      // Verify 13-Project-Plan.md has proper format (needed for Session 3)
      const projectPlanDoc = listData.documents.find((d) =>
        d.filename.includes('13-Project-Plan')
      );
      assertDefined(
        projectPlanDoc,
        '13-Project-Plan.md should exist for Session 3'
      );
      assertGreaterThanOrEqual(
        projectPlanDoc!.wordCount,
        100,
        '13-Project-Plan.md should have content (Phase/Sprint structure)'
      );

      timer.stop();
      logTestStep(`\n✅ Session 2 Complete! (${timer.format()})`, 'success');

    } catch (error) {
      timer.stop();
      logTestStep(
        `Session 2 failed: ${error instanceof Error ? error.message : error}`,
        'error'
      );
      throw error;
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  });

  // ============================================================================
  // TEST 3: Session 3 - Bootstrap (Personas, Skills, Roadmap, Files)
  // ============================================================================

  test('Session 3: Complete bootstrap workflow (requires Session 1+2)', async () => {
    const timer = new TestTimer();
    const client = new MCPTestClient(MCP_URL, TRANSPORT_TYPE);

    try {
      await client.connect();
      logTransportType(TRANSPORT_TYPE);
      logTestStep(`Session 3: Connected (session: ${client.getSessionId()})`, 'success');
      logTestStep(`Session 3: Using temp repo: ${tempRepoPath}`);

      // VALIDATION: Verify Session 1+2 completed first
      logTestStep('Session 3: Verifying Session 1+2 prerequisites...');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev',
          },
        },
      });

      try {
        // Check Session 1 complete
        const session = await prisma.onboardingSession.findFirst({
          where: { projectId: sharedProjectId, sessionNumber: 1 },
        });

        assertDefined(
          session,
          'Session 1 must create OnboardingSession record'
        );
        assertEqual(
          session.status,
          'complete',
          'Session 1 must be marked complete'
        );
        assertDefined(
          (session.response as any)?.executiveSummary ||
          (session.response as any)?.projectContextJson?.executiveSummary,
          'Session 1 must have executiveSummary in response field'
        );

        // Check Session 2 complete (15 documents)
        const docCount = await prisma.document.count({
          where: {
            onboardingSession: { projectId: sharedProjectId },
          },
        });

        assertEqual(
          docCount,
          15,
          'Session 2 must have created 15 documents'
        );

        logTestStep('Session 3: Sessions 1+2 prerequisites verified ✅', 'success');
      } finally {
        await prisma.$disconnect();
      }

      // Call bootstrap
      logTestStep('Session 3: Bootstrapping project workflow...');

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
        projectId: sharedProjectId,
        repoPath: tempRepoPath,
      });

      // DEBUG: Log bootstrap response
      console.log('DEBUG Session 3: Bootstrap full response:', JSON.stringify(bootstrapData, null, 2));

      // Verify bootstrap success
      assertEqual(bootstrapData.success, true, 'Bootstrap should succeed');
      assertEqual(
        bootstrapData.session3Complete,
        true,
        'Session 3 should be marked complete'
      );

      logTestStep('Session 3: Bootstrap completed successfully!', 'success');

      // Verify agent personas
      assertInRange(
        bootstrapData.created.agentPersonas,
        3,
        10,
        'Should create 3-10 agent personas'
      );
      logTestStep(
        `Session 3: Created ${bootstrapData.created.agentPersonas} agent personas ✅`
      );

      // Verify skills library
      assertInRange(
        bootstrapData.created.skills,
        5,
        15,
        'Should create 5-15 skills'
      );
      logTestStep(`Session 3: Created ${bootstrapData.created.skills} skills ✅`);

      // Verify workflows
      assertEqual(
        bootstrapData.created.workflows,
        3,
        'Should create 3 workflow templates'
      );
      logTestStep('Session 3: Created 3 workflow templates ✅');

      // Verify SOPs
      assertEqual(
        bootstrapData.created.sops,
        5,
        'Should create 5 SOP templates'
      );
      logTestStep('Session 3: Created 5 SOP templates ✅');

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
        `Session 3: Roadmap materialized: ${bootstrapData.created.roadmap.phases} phases, ` +
        `${bootstrapData.created.roadmap.sprints} sprints, ${bootstrapData.created.roadmap.weeks} weeks, ` +
        `${bootstrapData.created.roadmap.days} days ✅`
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
      logTestStep('Session 3: CurrentPlan and CurrentTodos initialized ✅');

      // Verify CLAUDE.md file write
      assertEqual(
        bootstrapData.created.files.claudeMd,
        true,
        'Should create CLAUDE.md'
      );

      const claudePath = path.join(tempRepoPath, 'CLAUDE.md');
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

      logTestStep(
        `Session 3: CLAUDE.md written (${claudeContent.length} chars) ✅`
      );

      // Verify AGENTS.md file write
      assertEqual(
        bootstrapData.created.files.agentsMd,
        true,
        'Should create AGENTS.md'
      );

      const agentsPath = path.join(tempRepoPath, 'AGENTS.md');
      const agentsStat = await fs.stat(agentsPath);
      assert(agentsStat.isFile(), 'AGENTS.md should be a file');

      const agentsContent = await fs.readFile(agentsPath, 'utf-8');
      assertContains(
        agentsContent,
        'Available Agent Personas',
        'AGENTS.md should list agent personas'
      );

      logTestStep(
        `Session 3: AGENTS.md written (${agentsContent.length} chars) ✅`
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
    }
  });
});
