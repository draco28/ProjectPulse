#!/usr/bin/env ts-node
/**
 * Sprint 9: Agent OAuth - Executable Test Runner
 *
 * Run with: npx ts-node tests/run-sprint-9-tests.ts
 * Or: node --loader ts-node/esm tests/run-sprint-9-tests.ts
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.1.15:3000';
const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'http://192.168.1.15:3001';

// Test state
let testProjectId: number;
let testToken: string;
let testTokenId: number;
let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  }
  testsPassed++;
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAILED: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    testsFailed++;
    throw new Error(message);
  }
  testsPassed++;
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    console.log(`\n🧪 ${name}`);
    await fn();
    console.log(`✅ PASSED`);
  } catch (error: any) {
    console.error(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

// Main test suite
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Sprint 9: Agent OAuth & Project Settings - Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`MCP URL: ${MCP_URL}`);
  console.log('='.repeat(60));

  // Phase 1: Token Service & APIs
  await test('Create test project', async () => {
    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `OAuth Test ${Date.now()}`,
        description: 'Test project for Sprint 9',
      }),
    });

    const data = await response.json();
    assert(response.status === 201, `Expected 201, got ${response.status}`);
    assert(data.project?.id > 0, 'Project ID should be positive');
    testProjectId = data.project.id;
    console.log(`  Project ID: ${testProjectId}`);
  });

  await test('Generate agent token', async () => {
    const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Token',
        expiresInDays: 30,
      }),
    });

    const data = await response.json();
    assert(response.status === 201, `Expected 201, got ${response.status}`);
    assert(data.token?.length === 64, `Token should be 64 chars, got ${data.token?.length}`);
    assert(data.name === 'Test Token', 'Token name should match');
    testToken = data.token;
    testTokenId = data.id;
    console.log(`  Token: ${testToken.substring(0, 16)}...`);
  });

  await test('Reject duplicate token name', async () => {
    const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Token',
        expiresInDays: 30,
      }),
    });

    const data = await response.json();
    assert(response.status === 409, `Expected 409, got ${response.status}`);
    assert(data.error?.includes('already exists'), 'Should mention token already exists');
  });

  await test('List project tokens', async () => {
    const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`);
    const data = await response.json();
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(Array.isArray(data.tokens), 'Should return array of tokens');
    assert(data.tokens.length > 0, 'Should have at least one token');
    console.log(`  Found ${data.tokens.length} token(s)`);
  });

  // Phase 2: Token Validation
  await test('Validate valid token', async () => {
    const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: testToken }),
    });

    const data = await response.json();
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assertEqual(data.projectId, testProjectId, 'Project ID should match');
    assertEqual(data.tokenId, testTokenId, 'Token ID should match');
    console.log(`  Validated for project ${data.projectId}`);
  });

  await test('Reject invalid token', async () => {
    const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid_token_12345' }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  // Phase 3: MCP Bearer Auth
  await test('Reject MCP request without token', async () => {
    const response = await fetch(`${MCP_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  await test('Reject MCP request with invalid token', async () => {
    const response = await fetch(`${MCP_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_12345',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  await test('Accept MCP request with valid token', async () => {
    const response = await fetch(`${MCP_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    const data = await response.json();
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(data.result?.tools, 'Should return tools list');
    console.log(`  Found ${data.result.tools.length} MCP tools`);
  });

  // Phase 4: Token Revocation
  await test('Revoke token', async () => {
    const response = await fetch(
      `${BASE_URL}/api/projects/${testProjectId}/tokens/${testTokenId}/revoke`,
      { method: 'POST' }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
  });

  await test('Reject revoked token validation', async () => {
    const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: testToken }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  await test('Reject MCP request with revoked token', async () => {
    const response = await fetch(`${MCP_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  // Phase 5: Project Settings
  await test('Update mcpWriteFiles setting', async () => {
    const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcpWriteFiles: true }),
    });

    const data = await response.json();
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assertEqual(data.project.mcpWriteFiles, true, 'mcpWriteFiles should be true');
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(60) + '\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
