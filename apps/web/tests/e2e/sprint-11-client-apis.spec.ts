/**
 * Sprint 11 E2E Tests - Client Agent Integration APIs
 * 
 * Tests the full flow of personas, skills, and SOPs APIs:
 * - EPIC-013: Client Agent Integration
 * - US-013-01, US-013-02: Persona APIs
 * - US-013-03, US-013-04: Skill APIs
 * - US-013-05, US-013-06: SOP APIs
 * - US-013-07, US-013-08: Template Generation
 * 
 * Run: pnpm exec playwright test sprint-11-client-apis
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.15:3000';
const TEST_PROJECT_ID = 1; // Assumes seeded project exists

test.describe('Sprint 11: Client Agent Integration E2E', () => {
  test.describe('Personas API', () => {
    test('GET /api/personas returns list with metadata only', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/personas?projectId=${TEST_PROJECT_ID}`);
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('personas');
      expect(body).toHaveProperty('count');
      expect(body).toHaveProperty('projectId', TEST_PROJECT_ID);
      expect(Array.isArray(body.personas)).toBeTruthy();
      
      // Verify metadata-only (no systemPrompt)
      if (body.personas.length > 0) {
        const persona = body.personas[0];
        expect(persona).toHaveProperty('id');
        expect(persona).toHaveProperty('name');
        expect(persona).toHaveProperty('slug');
        expect(persona).toHaveProperty('expertise');
        expect(persona).not.toHaveProperty('systemPrompt');
        expect(persona).not.toHaveProperty('skills');
        expect(persona).not.toHaveProperty('tools');
      }
    });

    test('GET /api/personas filters by isActive', async ({ request }) => {
      const activeResponse = await request.get(
        `${BASE_URL}/api/personas?projectId=${TEST_PROJECT_ID}&isActive=true`
      );
      expect(activeResponse.ok()).toBeTruthy();
      
      const activeBody = await activeResponse.json();
      if (activeBody.personas.length > 0) {
        activeBody.personas.forEach((p: { isActive: boolean }) => {
          expect(p.isActive).toBe(true);
        });
      }
    });

    test('GET /api/personas returns 400 without projectId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/personas`);
      
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Validation failed');
    });

    test('GET /api/personas/[id] returns full persona', async ({ request }) => {
      // First get list to find an ID
      const listResponse = await request.get(`${BASE_URL}/api/personas?projectId=${TEST_PROJECT_ID}`);
      const listBody = await listResponse.json();
      
      if (listBody.personas.length === 0) {
        test.skip();
        return;
      }
      
      const personaId = listBody.personas[0].id;
      const response = await request.get(
        `${BASE_URL}/api/personas/${personaId}?projectId=${TEST_PROJECT_ID}`
      );
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('id', personaId);
      expect(body).toHaveProperty('systemPrompt');
      expect(body).toHaveProperty('skills');
      expect(body).toHaveProperty('tools');
      expect(body).toHaveProperty('rules');
    });

    test('GET /api/personas/by-slug/[slug] returns full persona', async ({ request }) => {
      // First get list to find a slug
      const listResponse = await request.get(`${BASE_URL}/api/personas?projectId=${TEST_PROJECT_ID}`);
      const listBody = await listResponse.json();
      
      if (listBody.personas.length === 0) {
        test.skip();
        return;
      }
      
      const personaSlug = listBody.personas[0].slug;
      const response = await request.get(
        `${BASE_URL}/api/personas/by-slug/${personaSlug}?projectId=${TEST_PROJECT_ID}`
      );
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('slug', personaSlug);
      expect(body).toHaveProperty('systemPrompt');
    });

    test('GET /api/personas/[id] enforces multi-tenancy', async ({ request }) => {
      // Try to access with wrong projectId
      const response = await request.get(`${BASE_URL}/api/personas/1?projectId=99999`);
      
      expect(response.status()).toBe(404);
    });
  });

  test.describe('SOPs API', () => {
    test('GET /api/sops returns list with metadata only', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/sops?projectId=${TEST_PROJECT_ID}`);
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('sops');
      expect(body).toHaveProperty('count');
      expect(body).toHaveProperty('projectId', TEST_PROJECT_ID);
      expect(Array.isArray(body.sops)).toBeTruthy();
      
      // Verify metadata-only (no content)
      if (body.sops.length > 0) {
        const sop = body.sops[0];
        expect(sop).toHaveProperty('id');
        expect(sop).toHaveProperty('title');
        expect(sop).toHaveProperty('slug');
        expect(sop).toHaveProperty('category');
        expect(sop).not.toHaveProperty('content');
      }
    });

    test('GET /api/sops filters by category', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/sops?projectId=${TEST_PROJECT_ID}&category=Development`
      );
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      if (body.sops.length > 0) {
        body.sops.forEach((s: { category: string }) => {
          expect(s.category).toBe('Development');
        });
      }
    });

    test('GET /api/sops returns 400 without projectId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/sops`);
      
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Validation failed');
    });

    test('GET /api/sops/[id] returns full SOP with content', async ({ request }) => {
      const listResponse = await request.get(`${BASE_URL}/api/sops?projectId=${TEST_PROJECT_ID}`);
      const listBody = await listResponse.json();
      
      if (listBody.sops.length === 0) {
        test.skip();
        return;
      }
      
      const sopId = listBody.sops[0].id;
      const response = await request.get(
        `${BASE_URL}/api/sops/${sopId}?projectId=${TEST_PROJECT_ID}`
      );
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('id', sopId);
      expect(body).toHaveProperty('content');
      expect(typeof body.content).toBe('string');
    });

    test('GET /api/sops/by-slug/[slug] returns full SOP', async ({ request }) => {
      const listResponse = await request.get(`${BASE_URL}/api/sops?projectId=${TEST_PROJECT_ID}`);
      const listBody = await listResponse.json();
      
      if (listBody.sops.length === 0) {
        test.skip();
        return;
      }
      
      const sopSlug = listBody.sops[0].slug;
      const response = await request.get(
        `${BASE_URL}/api/sops/by-slug/${sopSlug}?projectId=${TEST_PROJECT_ID}`
      );
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('slug', sopSlug);
      expect(body).toHaveProperty('content');
    });
  });

  test.describe('Skills API', () => {
    test('GET /api/skills returns list with pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/skills?projectId=${TEST_PROJECT_ID}`);
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('skills');
      expect(body.data).toHaveProperty('pagination');
      expect(body.data.pagination).toHaveProperty('page');
      expect(body.data.pagination).toHaveProperty('total');
      expect(body.data.pagination).toHaveProperty('hasMore');
      
      // Verify metadata-only (no content)
      if (body.data.skills.length > 0) {
        const skill = body.data.skills[0];
        expect(skill).toHaveProperty('id');
        expect(skill).toHaveProperty('title');
        expect(skill).toHaveProperty('slug');
        expect(skill).toHaveProperty('category');
        expect(skill).not.toHaveProperty('content');
      }
    });

    test('GET /api/skills filters by category', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/skills?projectId=${TEST_PROJECT_ID}&category=framework`
      );
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      if (body.data.skills.length > 0) {
        body.data.skills.forEach((s: { category: string }) => {
          expect(s.category).toBe('framework');
        });
      }
    });

    test('GET /api/skills supports pagination params', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/skills?projectId=${TEST_PROJECT_ID}&page=1&limit=5`
      );
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(5);
      expect(body.data.skills.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/skills returns 400 without projectId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/skills`);
      
      expect(response.status()).toBe(400);
    });

    test('GET /api/skills/[slug] returns full skill with content', async ({ request }) => {
      const listResponse = await request.get(`${BASE_URL}/api/skills?projectId=${TEST_PROJECT_ID}`);
      const listBody = await listResponse.json();
      
      if (listBody.data.skills.length === 0) {
        test.skip();
        return;
      }
      
      const skillSlug = listBody.data.skills[0].slug;
      const response = await request.get(
        `${BASE_URL}/api/skills/${skillSlug}?projectId=${TEST_PROJECT_ID}`
      );
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      // API returns { data: skill }
      const skill = body.data || body;
      expect(skill).toHaveProperty('slug', skillSlug);
      expect(skill).toHaveProperty('content');
      expect(typeof skill.content).toBe('string');
    });
  });

  test.describe('Token Efficiency', () => {
    test('List endpoints exclude heavy fields for token efficiency', async ({ request }) => {
      // Personas
      const personasResponse = await request.get(`${BASE_URL}/api/personas?projectId=${TEST_PROJECT_ID}`);
      const personas = await personasResponse.json();
      if (personas.personas.length > 0) {
        expect(personas.personas[0]).not.toHaveProperty('systemPrompt');
      }
      
      // SOPs
      const sopsResponse = await request.get(`${BASE_URL}/api/sops?projectId=${TEST_PROJECT_ID}`);
      const sops = await sopsResponse.json();
      if (sops.sops.length > 0) {
        expect(sops.sops[0]).not.toHaveProperty('content');
      }
      
      // Skills
      const skillsResponse = await request.get(`${BASE_URL}/api/skills?projectId=${TEST_PROJECT_ID}`);
      const skills = await skillsResponse.json();
      if (skills.data.skills.length > 0) {
        expect(skills.data.skills[0]).not.toHaveProperty('content');
      }
    });
  });

  test.describe('Multi-tenancy', () => {
    test('APIs enforce project isolation', async ({ request }) => {
      // Try to access resources with non-existent project
      const wrongProjectId = 99999;
      
      const personasResponse = await request.get(`${BASE_URL}/api/personas?projectId=${wrongProjectId}`);
      expect(personasResponse.ok()).toBeTruthy();
      const personasBody = await personasResponse.json();
      expect(personasBody.personas).toHaveLength(0);
      
      const sopsResponse = await request.get(`${BASE_URL}/api/sops?projectId=${wrongProjectId}`);
      expect(sopsResponse.ok()).toBeTruthy();
      const sopsBody = await sopsResponse.json();
      expect(sopsBody.sops).toHaveLength(0);
    });
  });

  test.describe('Error Handling', () => {
    test('APIs return proper error format for invalid requests', async ({ request }) => {
      // Invalid projectId type
      const response = await request.get(`${BASE_URL}/api/personas?projectId=abc`);
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('Get endpoints return 404 for non-existent resources', async ({ request }) => {
      const personaResponse = await request.get(
        `${BASE_URL}/api/personas/99999?projectId=${TEST_PROJECT_ID}`
      );
      expect(personaResponse.status()).toBe(404);
      
      const sopResponse = await request.get(
        `${BASE_URL}/api/sops/99999?projectId=${TEST_PROJECT_ID}`
      );
      expect(sopResponse.status()).toBe(404);
    });
  });
});
