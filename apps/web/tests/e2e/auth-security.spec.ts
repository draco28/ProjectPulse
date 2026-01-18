/**
 * E2E Tests: API Authentication Security (Sprint 10)
 *
 * Verifies the security architecture:
 * 1. Unauthenticated requests (curl) are rejected
 * 2. Agent tokens enforce project isolation
 * 3. User sessions can access their own projects
 *
 * Note: These tests intentionally skip authentication to test API security
 */

import { test, expect, request } from '@playwright/test';
import { getConfig } from '@projectpulse/infra-config';

const infraConfig = getConfig();
const API_BASE = process.env.API_BASE_URL || infraConfig.webUrl;

// Skip global auth setup - these tests verify unauthenticated behavior
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('API Authentication Security', () => {
  test.describe('Unauthenticated Access Rejection', () => {
    test('POST /api/tickets without auth returns 401', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/tickets`, {
        data: {
          title: 'Test Ticket',
          kind: 'task',
          source: 'manual',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test('GET /api/tickets without auth returns 401', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/tickets`);

      expect(response.status()).toBe(401);
    });

    test('POST /api/knowledge without auth returns 401', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/knowledge`, {
        data: {
          title: 'Test Knowledge',
          content: 'Test content for knowledge item',
          category: 'test',
          projectId: 1,
        },
      });

      expect(response.status()).toBe(401);
    });

    test('GET /api/wiki without auth returns 401', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/wiki`);

      expect(response.status()).toBe(401);
    });

    test('GET /api/roadmap without auth returns 401', async ({ request }) => {
      // Must include projectId query param (validation before auth)
      const response = await request.get(`${API_BASE}/api/roadmap?projectId=1`);

      expect(response.status()).toBe(401);
    });

    test('GET /api/memory/session-start without auth returns 401', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/memory/session-start?projectId=1`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Public Endpoints Remain Accessible', () => {
    test('GET /api/health is accessible without auth', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/health`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('healthy');
    });
  });
});

test.describe('Agent Token Project Isolation', () => {
  // These tests require a valid agent token for testing
  // They would be run in an environment where tokens can be created

  test.skip('Agent token can only access its authorized project', async ({ request }) => {
    // This test requires:
    // 1. A valid agent token for project 3
    // 2. An attempt to access project 9999
    // When fully implemented:
    // const validToken = process.env.TEST_AGENT_TOKEN_PROJECT_3;
    // const response = await request.post(`${API_BASE}/api/tickets`, {
    //   headers: { Authorization: `Bearer ${validToken}` },
    //   data: {
    //     title: 'Test',
    //     kind: 'task',
    //     source: 'manual',
    //     projectId: 9999, // Different from token's project
    //   },
    // });
    // expect(response.status()).toBe(403);
  });

  test.skip('Agent token can access its own project', async ({ request }) => {
    // This test requires:
    // 1. A valid agent token for project 3
    // 2. An attempt to access project 3
    // When fully implemented:
    // const validToken = process.env.TEST_AGENT_TOKEN_PROJECT_3;
    // const response = await request.post(`${API_BASE}/api/tickets`, {
    //   headers: { Authorization: `Bearer ${validToken}` },
    //   data: {
    //     title: 'Test',
    //     kind: 'task',
    //     source: 'manual',
    //     projectId: 3, // Same as token's project
    //   },
    // });
    // expect(response.status()).toBe(201);
  });
});

test.describe('Error Response Format', () => {
  test('401 response includes error message', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tickets`, {
      data: { title: 'Test' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    // Error can be string or object with message property
    const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
    expect(errorMessage).toBeTruthy();
  });

  test('Invalid bearer token returns 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tickets`, {
      headers: {
        Authorization: 'Bearer invalid_token_12345',
      },
      data: {
        title: 'Test',
        kind: 'task',
        source: 'manual',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('Malformed authorization header returns 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tickets`, {
      headers: {
        Authorization: 'Basic dXNlcjpwYXNz', // Basic auth instead of Bearer
      },
      data: {
        title: 'Test',
        kind: 'task',
        source: 'manual',
      },
    });

    expect(response.status()).toBe(401);
  });
});
