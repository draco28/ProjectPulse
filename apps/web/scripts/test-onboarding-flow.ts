/**
 * Test script for onboarding flow
 *
 * Tests the complete 3-session onboarding workflow:
 * 1. GET prompt for session 1
 * 2. POST response for session 1
 * 3. GET prompt for session 2 (with variables from session 1)
 * 4. POST response for session 2
 * 5. GET prompt for session 3 (with variables from sessions 1 & 2)
 * 6. POST response for session 3
 * 7. Verify all sessions complete
 */

import db from '../lib/db';

const API_BASE = 'http://192.168.1.15:3000';

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Flow\n');

  try {
    // Ensure we have a project
    let project = await db.project.findFirst();
    if (!project) {
      console.log('Creating test project...');
      project = await db.project.create({
        data: {
          name: 'Test Project for Onboarding',
          description: 'Testing onboarding flow',
        },
      });
      console.log(`✅ Created project ID: ${project.id}\n`);
    } else {
      console.log(`✅ Using existing project ID: ${project.id}\n`);
    }

    const projectId = project.id;

    // ========================================================================
    // SESSION 1: Executive Summary
    // ========================================================================
    console.log('📋 Session 1: Executive Summary');

    const prompt1Response = await fetch(
      `${API_BASE}/api/onboarding/prompt?projectId=${projectId}&sessionNumber=1`
    );
    const prompt1 = await prompt1Response.json();

    if (!prompt1Response.ok) {
      throw new Error(`Failed to get prompt 1: ${JSON.stringify(prompt1)}`);
    }

    console.log(`✅ Got Session ${prompt1.sessionNumber}: ${prompt1.sessionName}`);
    console.log(`   Expected variables: ${prompt1.expectedVariables.join(', ')}`);

    const session1Data = {
      project_name: 'My Awesome App',
      target_users: 'Small businesses',
      problem_statement: 'Managing tasks is chaotic',
      tech_stack: 'React, Node.js, PostgreSQL',
      project_phase: 'Active development',
      team_size: '3 developers',
      timeline: '6 months',
      key_features: 'Task tracking, Team collaboration, Analytics',
      technical_constraints: 'Must be self-hosted',
      success_criteria: '100 active users in 3 months',
    };

    const submit1Response = await fetch(`${API_BASE}/api/onboarding/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        sessionNumber: 1,
        data: session1Data,
      }),
    });

    const submit1 = await submit1Response.json();
    console.log(`✅ Submitted Session 1. Next: ${submit1.nextSession}\n`);

    // ========================================================================
    // SESSION 2: Industry Documentation
    // ========================================================================
    console.log('📋 Session 2: Industry Documentation');

    const prompt2Response = await fetch(
      `${API_BASE}/api/onboarding/prompt?projectId=${projectId}&sessionNumber=2`
    );
    const prompt2 = await prompt2Response.json();

    console.log(`✅ Got Session ${prompt2.sessionNumber}: ${prompt2.sessionName}`);
    console.log(`   Resolved variables from S1: ${Object.keys(prompt2.resolvedVariables).length}`);
    console.log(`   Sample: project_name = "${prompt2.resolvedVariables.project_name}"`);

    const session2Data = {
      prd_generated: true,
      srs_generated: true,
      architecture_generated: true,
    };

    const submit2Response = await fetch(`${API_BASE}/api/onboarding/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        sessionNumber: 2,
        data: session2Data,
      }),
    });

    const submit2 = await submit2Response.json();
    console.log(`✅ Submitted Session 2. Next: ${submit2.nextSession}\n`);

    // ========================================================================
    // SESSION 3: AI Workflow Blueprint
    // ========================================================================
    console.log('📋 Session 3: AI Workflow Blueprint');

    const prompt3Response = await fetch(
      `${API_BASE}/api/onboarding/prompt?projectId=${projectId}&sessionNumber=3`
    );
    const prompt3 = await prompt3Response.json();

    console.log(`✅ Got Session ${prompt3.sessionNumber}: ${prompt3.sessionName}`);
    console.log(`   Resolved variables from S1+S2: ${Object.keys(prompt3.resolvedVariables).length}`);

    const session3Data = {
      memory_banks_created: true,
      sops_created: true,
      skills_created: true,
    };

    const submit3Response = await fetch(`${API_BASE}/api/onboarding/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        sessionNumber: 3,
        data: session3Data,
      }),
    });

    const submit3 = await submit3Response.json();
    console.log(`✅ Submitted Session 3. Next: ${submit3.nextSession}\n`);

    // ========================================================================
    // VERIFY COMPLETION
    // ========================================================================
    console.log('🔍 Verifying onboarding completion...');

    const sessions = await db.onboardingSession.findMany({
      where: { projectId },
      orderBy: { sessionNumber: 'asc' },
    });

    console.log(`   Found ${sessions.length} sessions`);
    sessions.forEach((s) => {
      console.log(`   Session ${s.sessionNumber}: ${s.status}`);
    });

    const allComplete = sessions.every((s) => s.status === 'complete');
    if (allComplete && sessions.length === 3) {
      console.log('\n✅ All onboarding sessions complete!');
    } else {
      console.log('\n❌ Onboarding incomplete');
    }

    // Test auto-detection (next incomplete session)
    console.log('\n🔍 Testing auto-detection (should return "all complete")...');
    const autoResponse = await fetch(`${API_BASE}/api/onboarding/prompt?projectId=${projectId}`);
    const auto = await autoResponse.json();

    if (autoResponse.status === 404 && auto.error === 'All onboarding sessions complete') {
      console.log('✅ Auto-detection works correctly\n');
    } else {
      console.log('❌ Auto-detection failed\n');
    }

    console.log('✅ ONBOARDING FLOW TEST COMPLETE!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

testOnboardingFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
