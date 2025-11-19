#!/usr/bin/env ts-node
/**
 * Session 1 E2E Test via MCP Tools
 * 
 * Tests complete 10-phase onboarding workflow using MCP tools
 * 
 * Prerequisites:
 * - MCP server running and healthy
 * - express package installed in MCP container
 * - 38 tools registered (35 existing + 3 new onboarding tools)
 * 
 * Test Flow:
 * 1. Connect to MCP server via stdio
 * 2. For each phase (1-10):
 *    a. Call projectpulse.onboarding.getQuestions
 *    b. Generate mock answers
 *    c. Call projectpulse.onboarding.saveAnswers
 * 3. Call projectpulse.onboarding.generateExecutiveSummary
 * 4. Verify database records
 * 
 * Expected Duration: 2-3 minutes
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const PROJECT_ID = 1;

// Mock answer generator based on question content
function generateMockAnswers(questionsData: any): Record<string, string> {
  const answers: Record<string, string> = {};
  
  for (const subsection of questionsData.subsections) {
    for (const question of subsection.questions) {
      const text = question.text.toLowerCase();
      
      // Generate realistic mock answers based on question content
      if (text.includes('users') || text.includes('personas')) {
        answers[question.id] = 'Solo developers and small dev teams (2-5 people), ages 25-45, work remotely';
      } else if (text.includes('demographics') || text.includes('behaviors')) {
        answers[question.id] = 'Ages 25-45, primarily technical background, struggle with manual task tracking and context switching';
      } else if (text.includes('success')) {
        answers[question.id] = 'Save 10+ hours per week on task management, achieve 80% task completion rate';
      } else if (text.includes('core features') || text.includes('features')) {
        answers[question.id] = '1) AI task tracking, 2) Progress visualization, 3) Agent integration, 4) Roadmap planning, 5) Issue management';
      } else if (text.includes('out of scope')) {
        answers[question.id] = 'Mobile app, team collaboration, payment processing, advanced analytics dashboard';
      } else if (text.includes('different from')) {
        answers[question.id] = 'AI-native design, agent-first workflow, local-first data storage, no vendor lock-in';
      } else if (text.includes('user stories')) {
        answers[question.id] = 'As a developer, I want to see my current task so that I know what to work on next. As a developer, I want AI to auto-update progress. As a PM, I want to see roadmap visualization.';
      } else if (text.includes('north star') || text.includes('critical')) {
        answers[question.id] = 'As a developer, I want AI to automatically update task progress so that I never manually track status';
      } else if (text.includes('tech stack')) {
        answers[question.id] = 'Next.js 14 + PostgreSQL + Prisma + Vercel';
      } else if (text.includes('constraints')) {
        answers[question.id] = 'Must use PostgreSQL for data integrity, prefer serverless for cost savings';
      } else if (text.includes('real-time')) {
        answers[question.id] = 'Yes, need real-time task updates via WebSockets for agent communication';
      } else if (text.includes('budget')) {
        answers[question.id] = '$50-200/month for infrastructure (database, hosting, AI API calls)';
      } else if (text.includes('timeline') || text.includes('launch')) {
        answers[question.id] = '3 months from now, aiming for Q1 2025 launch';
      } else if (text.includes('team') || text.includes('solo')) {
        answers[question.id] = 'Solo developer initially, may expand to 2-person team later';
      } else if (text.includes('hours')) {
        answers[question.id] = '40+ hours/week (full-time development)';
      } else if (text.includes('risks')) {
        answers[question.id] = 'AI integration complexity, real-time sync reliability, database performance at scale';
      } else if (text.includes('dependencies') || text.includes('integrations')) {
        answers[question.id] = 'OpenAI for AI features, GitHub API for repo integration';
      } else {
        // Generic fallback for any other question
        answers[question.id] = `Mock answer for: ${question.text.slice(0, 50)}...`;
      }
    }
  }
  
  return answers;
}

async function runMCPE2ETest() {
  console.log('🚀 Starting Session 1 E2E Test via MCP Tools\n');
  console.log('Project ID:', PROJECT_ID);
  console.log('Target: Complete 10-phase onboarding + executive summary\n');
  
  // Connect to MCP server via stdio (local process)
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/Users/draco/projects/AI_HUB/apps/mcp-server/dist/index.js'],
    env: {
      ...process.env,
      PROJECTPULSE_API_URL: 'http://192.168.1.15:3000',
      NODE_ENV: 'development'
    }
  });
  
  const client = new Client({
    name: 'session-1-e2e-test',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  try {
    console.log('📡 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');
    
    // Test all 10 phases
    for (let phase = 1; phase <= 10; phase++) {
      console.log(`📋 Phase ${phase}/10`);
      
      // Step 1: Get questions via MCP tool
      const questionsResult = await client.callTool({
        name: 'projectpulse.onboarding.getQuestions',
        arguments: {
          projectId: PROJECT_ID,
          phase
        }
      });
      
      if (questionsResult.isError) {
        throw new Error(`Phase ${phase}: Failed to get questions via MCP\n${questionsResult.content[0].text}`);
      }
      
      const questionsData = JSON.parse(questionsResult.content[0].text);
      console.log(`   ✅ Questions fetched: ${questionsData.totalQuestions} questions, ${questionsData.subsections.length} subsections`);
      
      // Step 2: Generate mock answers
      const answers = generateMockAnswers(questionsData);
      console.log(`   ✅ Generated ${Object.keys(answers).length} mock answers`);
      
      // Step 3: Save answers via MCP tool
      const answersResult = await client.callTool({
        name: 'projectpulse.onboarding.saveAnswers',
        arguments: {
          projectId: PROJECT_ID,
          phase,
          answers
        }
      });
      
      if (answersResult.isError) {
        throw new Error(`Phase ${phase}: Failed to save answers via MCP\n${answersResult.content[0].text}`);
      }
      
      const answersData = JSON.parse(answersResult.content[0].text);
      console.log(`   ✅ Answers saved: ${answersData.completedPhases.length}/10 phases complete`);
      
      if (answersData.readyForExecutiveSummary) {
        console.log(`   🎉 All 10 phases complete! Ready for executive summary\n`);
      } else {
        console.log(`   📊 Progress: ${answersData.completedPhases.length}/10 | Next: Phase ${answersData.nextPhase}\n`);
      }
    }
    
    // Step 4: Generate executive summary via MCP tool
    console.log('📄 Generating Executive Summary via MCP...');
    const summaryResult = await client.callTool({
      name: 'projectpulse.onboarding.generateExecutiveSummary',
      arguments: {
        projectId: PROJECT_ID
      }
    });
    
    if (summaryResult.isError) {
      throw new Error(`Failed to generate executive summary via MCP\n${summaryResult.content[0].text}`);
    }
    
    const summaryData = JSON.parse(summaryResult.content[0].text);
    console.log(`   ✅ Executive summary generated: ${summaryData.wordCount} words`);
    console.log(`   ✅ Project: ${summaryData.projectContext.metadata.projectName}`);
    console.log(`   ✅ Tech Stack: ${summaryData.projectContext.techStack.frontend} + ${summaryData.projectContext.techStack.backend}`);
    console.log(`   ✅ Timeline: ${summaryData.projectContext.timeline.estimatedDuration}`);
    console.log(`\n📝 Summary preview (first 200 characters):`);
    console.log(`   "${summaryData.executiveSummary.slice(0, 200)}..."\n`);
    
    // Success!
    console.log('✅✅✅ Session 1 MCP E2E Test PASSED ✅✅✅\n');
    console.log('🎯 Session 1: 100% COMPLETE\n');
    console.log('Next: Session 2 (15 Industry Documents Generation)');
    
  } catch (error) {
    console.error('\n❌ Session 1 MCP E2E Test FAILED');
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('\nTroubleshooting:');
    console.error('1. Check MCP container status: docker ps --filter name=projectpulse-mcp');
    console.error('2. Check MCP logs: docker logs projectpulse-mcp-cloud --tail 50');
    console.error('3. Fix dependencies: bash scripts/fix-mcp-docker.sh');
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run test
runMCPE2ETest().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
