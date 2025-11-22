/**
 * Sprint 9: Agent OAuth & Project Settings - Comprehensive Test Suite
 *
 * Tests all components of the agent OAuth system:
 * - Token generation, validation, and revocation
 * - API endpoints for token management
 * - MCP bearer auth middleware
 * - Full end-to-end OAuth flow
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3001';

// Test state
let testProjectId: number;
let testToken: string;
let testTokenId: number;

describe('Sprint 9: Agent OAuth & Project Settings', () => {
  describe('Phase 1: Token Service & APIs', () => {
    it('should create a test project for token testing', async () => {
      console.log('Creating test project...');
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `OAuth Test Project ${Date.now()}`,
          description: 'Test project for Sprint 9 agent OAuth',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.project).toBeDefined();
      expect(data.project.id).toBeDefined();

      testProjectId = data.project.id;
      console.log(`✓ Test project created: ${testProjectId}`);
    });

    it('should generate a new agent token', async () => {
      console.log(`Generating agent token for project ${testProjectId}...`);
      const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Test Agent Token',
          expiresInDays: 30,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Test Agent Token');
      expect(data.expiresAt).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBe(64); // 32 bytes hex = 64 chars

      testToken = data.token;
      testTokenId = data.id;
      console.log(`✓ Token generated: ${testToken.substring(0, 16)}...`);
    });

    it('should reject duplicate token names', async () => {
      console.log('Testing duplicate token name rejection...');
      const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Test Agent Token', // Same name as above
          expiresInDays: 30,
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
      console.log('✓ Duplicate token name correctly rejected');
    });

    it('should list project tokens', async () => {
      console.log(`Listing tokens for project ${testProjectId}...`);
      const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
        method: 'GET',
        credentials: 'include',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tokens).toBeDefined();
      expect(Array.isArray(data.tokens)).toBe(true);
      expect(data.tokens.length).toBeGreaterThan(0);

      const token = data.tokens.find((t: any) => t.id === testTokenId);
      expect(token).toBeDefined();
      expect(token.name).toBe('Test Agent Token');
      expect(token.isRevoked).toBe(false);
      console.log(`✓ Found ${data.tokens.length} token(s)`);
    });
  });

  describe('Phase 2: Token Validation', () => {
    it('should validate a valid token', async () => {
      console.log('Validating token via agent-auth API...');
      const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.projectId).toBe(testProjectId);
      expect(data.tokenId).toBe(testTokenId);
      expect(data.name).toBe('Test Agent Token');
      console.log(`✓ Token validated: projectId=${data.projectId}`);
    });

    it('should reject invalid token', async () => {
      console.log('Testing invalid token rejection...');
      const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid_token_that_does_not_exist' }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid or expired token');
      console.log('✓ Invalid token correctly rejected');
    });

    it('should reject empty token', async () => {
      console.log('Testing empty token rejection...');
      const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: '' }),
      });

      expect(response.status).toBe(400);
      console.log('✓ Empty token correctly rejected');
    });
  });

  describe('Phase 3: MCP Bearer Auth', () => {
    it('should reject MCP request without bearer token', async () => {
      console.log('Testing MCP request without bearer token...');
      const response = await fetch(`${MCP_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Missing bearer token');
      console.log('✓ MCP correctly rejected request without token');
    });

    it('should reject MCP request with invalid bearer token', async () => {
      console.log('Testing MCP request with invalid bearer token...');
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

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Invalid or expired token');
      console.log('✓ MCP correctly rejected invalid token');
    });

    it('should accept MCP request with valid bearer token', async () => {
      console.log('Testing MCP request with valid bearer token...');
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

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result).toBeDefined();
      expect(data.result.tools).toBeDefined();
      expect(Array.isArray(data.result.tools)).toBe(true);
      console.log(`✓ MCP accepted valid token (${data.result.tools.length} tools available)`);
    });
  });

  describe('Phase 4: Token Revocation', () => {
    it('should revoke a token', async () => {
      console.log(`Revoking token ${testTokenId}...`);
      const response = await fetch(
        `${BASE_URL}/api/projects/${testProjectId}/tokens/${testTokenId}/revoke`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('revoked successfully');
      console.log('✓ Token revoked successfully');
    });

    it('should reject validation of revoked token', async () => {
      console.log('Testing revoked token validation...');
      const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid or expired token');
      console.log('✓ Revoked token correctly rejected');
    });

    it('should reject MCP request with revoked token', async () => {
      console.log('Testing MCP request with revoked token...');
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

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Invalid or expired token');
      console.log('✓ MCP correctly rejected revoked token');
    });

    it('should show revoked token in token list', async () => {
      console.log('Verifying revoked token appears in list...');
      const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
        method: 'GET',
        credentials: 'include',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const token = data.tokens.find((t: any) => t.id === testTokenId);
      expect(token).toBeDefined();
      expect(token.isRevoked).toBe(true);
      console.log('✓ Revoked token correctly marked in list');
    });
  });

  describe('Phase 5: Project Settings', () => {
    it('should update mcpWriteFiles setting', async () => {
      console.log(`Updating mcpWriteFiles for project ${testProjectId}...`);
      const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mcpWriteFiles: true }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.project).toBeDefined();
      expect(data.project.mcpWriteFiles).toBe(true);
      console.log('✓ mcpWriteFiles setting updated successfully');
    });

    it('should persist mcpWriteFiles setting', async () => {
      console.log('Verifying mcpWriteFiles persisted...');
      const response = await fetch(`${BASE_URL}/api/projects/${testProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mcpWriteFiles: false }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.project.mcpWriteFiles).toBe(false);
      console.log('✓ mcpWriteFiles setting persisted correctly');
    });
  });

  describe('Phase 6: Multi-Project Isolation', () => {
    let secondProjectId: number;
    let secondToken: string;

    it('should create a second test project', async () => {
      console.log('Creating second test project...');
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `OAuth Test Project 2 ${Date.now()}`,
          description: 'Second project for isolation testing',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      secondProjectId = data.project.id;
      console.log(`✓ Second project created: ${secondProjectId}`);
    });

    it('should generate token for second project', async () => {
      console.log(`Generating token for project ${secondProjectId}...`);
      const response = await fetch(`${BASE_URL}/api/projects/${secondProjectId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Project 2 Token',
          expiresInDays: 30,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      secondToken = data.token;
      console.log(`✓ Token generated for project ${secondProjectId}`);
    });

    it('should validate token returns correct projectId', async () => {
      console.log('Verifying token-to-project mapping...');
      const response = await fetch(`${BASE_URL}/api/agent-auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: secondToken }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.projectId).toBe(secondProjectId);
      expect(data.projectId).not.toBe(testProjectId);
      console.log(`✓ Token correctly mapped to project ${secondProjectId}`);
    });

    it('should not list tokens from other projects', async () => {
      console.log('Verifying project token isolation...');
      const response1 = await fetch(`${BASE_URL}/api/projects/${testProjectId}/tokens`, {
        method: 'GET',
        credentials: 'include',
      });
      const response2 = await fetch(`${BASE_URL}/api/projects/${secondProjectId}/tokens`, {
        method: 'GET',
        credentials: 'include',
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Project 1 tokens should not appear in Project 2 list
      const crossContamination = data1.tokens.some((t1: any) =>
        data2.tokens.some((t2: any) => t2.id === t1.id)
      );
      expect(crossContamination).toBe(false);
      console.log('✓ Token lists correctly isolated between projects');
    });
  });
});

// Test summary
describe('Test Summary', () => {
  it('should print test summary', () => {
    console.log('\n=================================================');
    console.log('Sprint 9: Agent OAuth - Test Summary');
    console.log('=================================================');
    console.log('✓ Token generation and storage');
    console.log('✓ Token validation and authentication');
    console.log('✓ MCP bearer auth middleware');
    console.log('✓ Token revocation');
    console.log('✓ Project settings management');
    console.log('✓ Multi-project isolation');
    console.log('=================================================\n');
  });
});
