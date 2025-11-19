/**
 * E2E Test: Onboarding Session 2 - Document Generation (MCP Tools)
 *
 * Simulates real AI agent experience generating and storing 15 industry-standard documents.
 * Tests agent-side AI generation pattern where agent generates content and server stores it.
 *
 * MCP Tools Used:
 * - projectpulse_onboarding_getDocumentPrompts (1 call)
 * - projectpulse_onboarding_storeDocument (15 calls)
 * - projectpulse_onboarding_listDocuments (1 call)
 *
 * Run: node --test apps/mcp-server/tests/e2e/onboarding/session2-document-generation.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MCPTestClient } from '../setup/mcp-client.js';
import {
  generateMockDocument,
  TEST_CONSTANTS,
} from '../setup/fixtures.js';
import {
  logTestStep,
  assertDefined,
  assertEqual,
  assertGreaterThanOrEqual,
  assertContains,
  TestTimer,
  countWords,
} from '../setup/test-helpers.js';

const { MCP_URL, TEST_PROJECT_ID } = TEST_CONSTANTS;

describe('Session 2: Document Generation (MCP Tool E2E)', () => {
  test('Generate and store all 15 documents', async () => {
    const timer = new TestTimer();
    const client = new MCPTestClient(MCP_URL);

    try {
      await client.connect();
      logTestStep(`Connected (session: ${client.getSessionId()})`, 'success');

      // Step 1: Get all 15 document prompts (90s timeout for large response)
      logTestStep('Fetching document prompts...');

      const promptsData = await client.callToolJSON<{
        totalDocuments: number;
        documents: Array<{
          filename: string;
          title: string;
          category: string;
          systemPrompt: string;
          userPrompt: string;
          wordCountTarget: number;
        }>;
        estimatedTotalWords: number;
      }>('projectpulse_onboarding_getDocumentPrompts', {
        projectId: TEST_PROJECT_ID,
      }, 90000); // 90 second timeout for large response

      assertEqual(
        promptsData.totalDocuments,
        15,
        'Should have 15 document prompts'
      );
      assertEqual(
        promptsData.documents.length,
        15,
        'Should have 15 document objects'
      );
      assertGreaterThanOrEqual(
        promptsData.estimatedTotalWords,
        20000,
        'Total word count should be substantial'
      );

      logTestStep(
        `Fetched ${promptsData.totalDocuments} document prompts (estimated ${promptsData.estimatedTotalWords} words total)`,
        'success'
      );

      // Verify critical documents exist
      const filenames = promptsData.documents.map((d) => d.filename);
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

      for (const docPrompt of promptsData.documents) {
        logTestStep(`Generating ${docPrompt.filename}...`);

        // Simulate agent generating document with AI
        const mockContent = generateMockDocument(
          docPrompt.title,
          docPrompt.category,
          docPrompt.wordCountTarget
        );
        const wordCount = countWords(mockContent);

        logTestStep(
          `Generated ${docPrompt.filename} (${wordCount} words, target: ${docPrompt.wordCountTarget})`
        );

        // Store document
        const storeData = await client.callToolJSON<{
          success: boolean;
          filename: string;
          progress: {
            documentsStored: number;
            totalDocuments: number;
            percentComplete: number;
          };
        }>('projectpulse_onboarding_storeDocument', {
          projectId: TEST_PROJECT_ID,
          filename: docPrompt.filename,
          content: mockContent,
          category: docPrompt.category,
          wordCount,
        });

        assertEqual(storeData.success, true, 'Store should succeed');
        assertEqual(
          storeData.filename,
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
          `Stored ${docPrompt.filename} (${storeData.progress.documentsStored}/${storeData.progress.totalDocuments} - ${storeData.progress.percentComplete}% complete)`,
          'success'
        );
      }

      // Step 3: List all documents to verify
      logTestStep('Verifying all documents stored...');

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
        projectId: TEST_PROJECT_ID,
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
        `All documents verified (${listData.totalDocuments}/15)`,
        'success'
      );

      // Verify 13-Project-Plan.md has proper format
      const projectPlanDoc = listData.documents.find((d) =>
        d.filename.includes('13-Project-Plan')
      );
      assertDefined(
        projectPlanDoc,
        '13-Project-Plan.md should exist'
      );
      assertGreaterThanOrEqual(
        projectPlanDoc!.wordCount,
        500,
        '13-Project-Plan.md should have substantial content'
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

  test('Should prevent Session 2 without Session 1 complete', async () => {
    const client = new MCPTestClient(MCP_URL);

    try {
      await client.connect();
      logTestStep('Testing Session 1 prerequisite validation...');

      // Use a different project ID without Session 1
      const newProjectId = TEST_PROJECT_ID + 200;

      try {
        await client.callToolJSON(
          'projectpulse_onboarding_getDocumentPrompts',
          {
            projectId: newProjectId,
          }
        );

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
    }
  });

  test('Should validate required fields when storing documents', async () => {
    const client = new MCPTestClient(MCP_URL);

    try {
      await client.connect();
      logTestStep('Testing document validation...');

      // Try to store document without required fields
      try {
        await client.callToolJSON('projectpulse_onboarding_storeDocument', {
          projectId: TEST_PROJECT_ID,
          // Missing filename, content, category
        });

        throw new Error('Should have thrown an error for missing fields');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        assert(
          errorMessage.toLowerCase().includes('required') ||
            errorMessage.toLowerCase().includes('missing'),
          'Error should mention required fields'
        );
        logTestStep('Required field validation working ✅', 'success');
      }
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  });
});
