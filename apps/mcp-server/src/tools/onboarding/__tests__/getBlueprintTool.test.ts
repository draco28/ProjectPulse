/**
 * Blueprint Get Tool Tests - Sprint 8.5 Phase 2
 *
 * Tests blueprintGetTool:
 * - Returns Session 3 blueprint when found
 * - Returns 404 when Session 3 not found
 * - Validates project-context.json structure
 * - Handles missing response gracefully
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { blueprintGetTool } from '../getBlueprintTool';
import type { ToolContext } from '../../types';

const prisma = new PrismaClient();

describe('blueprintGetTool', () => {
  let testProjectId: number;
  let testOnboardingSessionId: string;
  let mockContext: ToolContext;

  // Sample project-context.json data
  const sampleProjectContext = {
    metadata: {
      projectName: 'TestProject',
      projectType: 'SaaS',
      domain: 'Project Management',
      targetUsers: ['Developers', 'Teams'],
      valueProposition: 'Simplify project tracking',
      version: '1.0.0',
      lastUpdated: '2025-11-18',
      createdBy: 'session-2-detailed',
    },
    techStack: {
      frontend: 'Next.js 15 + React 19',
      backend: 'Next.js API Routes',
      database: 'PostgreSQL 16',
      hosting: 'Vercel',
    },
    phases: [
      {
        id: 1,
        name: 'Phase 1: Foundation',
        duration: '2 weeks',
        goals: ['Setup infrastructure', 'Create models'],
        deliverables: ['Database schema', 'API endpoints'],
        status: 'pending',
      },
      {
        id: 2,
        name: 'Phase 2: Core Features',
        duration: '3 weeks',
        goals: ['Implement auth', 'Build dashboard'],
        deliverables: ['Auth system', 'Dashboard UI'],
        status: 'pending',
      },
    ],
    timeline: {
      startDate: '2025-11-20',
      estimatedDuration: '10 weeks',
      targetLaunch: '2026-01-29',
    },
    budget: {
      development: '$0 (solo)',
      monthly_operating: '$200-400',
    },
  };

  beforeEach(async () => {
    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Blueprint Project',
        description: 'Test project for blueprint tool tests',
      },
    });
    testProjectId = project.id;

    // Create Session 3 onboarding session with blueprint data
    const session = await prisma.onboardingSession.create({
      data: {
        projectId: testProjectId,
        sessionNumber: 3,
        status: 'completed',
        response: {
          projectContextJson: sampleProjectContext,
        },
        completedAt: new Date(),
      },
    });
    testOnboardingSessionId = session.id;

    // Mock ToolContext
    mockContext = {
      config: {
        baseUrl: 'http://localhost:3000',
        apiKey: 'test-api-key',
      },
      httpClient: {
        get: async <T = any>(url: string): Promise<T> => {
          // Mock HTTP client that returns from database
          if (url.includes('/api/onboarding/blueprint')) {
            const session = await prisma.onboardingSession.findFirst({
              where: {
                projectId: testProjectId,
                sessionNumber: 3,
                status: 'completed',
              },
            });
            if (!session || !session.response) {
              throw { response: { status: 404, data: { error: 'Not found' } } };
            }
            const blueprint = session.response as any;
            return (blueprint.projectContextJson || blueprint) as T;
          }
          throw new Error('Invalid URL');
        },
        post: async <T = any>(): Promise<T> => ({} as T),
        put: async <T = any>(): Promise<T> => ({} as T),
        patch: async <T = any>(): Promise<T> => ({} as T),
        delete: async <T = any>(): Promise<T> => ({} as T),
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    };
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.onboardingSession.deleteMany({
      where: { projectId: testProjectId },
    });
    await prisma.project.delete({
      where: { id: testProjectId },
    });
  });

  // ========================================================================
  // Test 1: Should return Session 3 blueprint with correct structure
  // ========================================================================
  it('should return Session 3 blueprint when found', async () => {
    const result = await blueprintGetTool.execute(
      { projectId: testProjectId },
      mockContext
    );

    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');

    const response = JSON.parse(result.content[0]?.text as string);
    expect(response.message).toContain('Retrieved Session 3 blueprint');
    expect(response.projectName).toBe('TestProject');
    expect(response.blueprint).toBeDefined();
    expect(response.blueprint.metadata).toMatchObject({
      projectName: 'TestProject',
      projectType: 'SaaS',
    });
    expect(response.blueprint.techStack).toBeDefined();
    expect(response.blueprint.phases).toHaveLength(2);
    expect(response.summary.totalPhases).toBe(2);
  });

  // ========================================================================
  // Test 2: Should throw 404 if Session 3 not found
  // ========================================================================
  it('should return error when Session 3 not found', async () => {
    // Delete the test session to simulate 404
    await prisma.onboardingSession.delete({
      where: { id: testOnboardingSessionId },
    });

    const result = await blueprintGetTool.execute(
      { projectId: testProjectId },
      mockContext
    );

    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    const response = JSON.parse(result.content[0]?.text as string);
    expect(response.error).toBe('Failed to retrieve Session 3 blueprint');
    expect(response.details).toContain('Not found');
    expect(response.troubleshooting).toBeDefined();
  });

  // ========================================================================
  // Test 3: Should return correct project-context.json structure
  // ========================================================================
  it('should return correct project-context.json structure', async () => {
    const result = await blueprintGetTool.execute(
      { projectId: testProjectId },
      mockContext
    );

    expect(result.content[0]).toBeDefined();
    const response = JSON.parse(result.content[0]?.text as string);
    const blueprint = response.blueprint;

    // Verify all required sections
    expect(blueprint.metadata).toBeDefined();
    expect(blueprint.metadata).toHaveProperty('projectName');
    expect(blueprint.metadata).toHaveProperty('projectType');
    expect(blueprint.metadata).toHaveProperty('domain');
    expect(blueprint.metadata).toHaveProperty('targetUsers');

    expect(blueprint.techStack).toBeDefined();
    expect(blueprint.techStack).toHaveProperty('frontend');
    expect(blueprint.techStack).toHaveProperty('backend');
    expect(blueprint.techStack).toHaveProperty('database');
    expect(blueprint.techStack).toHaveProperty('hosting');

    expect(blueprint.phases).toBeInstanceOf(Array);
    expect(blueprint.phases[0]).toHaveProperty('id');
    expect(blueprint.phases[0]).toHaveProperty('name');
    expect(blueprint.phases[0]).toHaveProperty('goals');
    expect(blueprint.phases[0]).toHaveProperty('deliverables');

    expect(blueprint.timeline).toBeDefined();
    expect(blueprint.timeline).toHaveProperty('startDate');
    expect(blueprint.timeline).toHaveProperty('targetLaunch');

    expect(blueprint.budget).toBeDefined();
    expect(blueprint.budget).toHaveProperty('development');
    expect(blueprint.budget).toHaveProperty('monthly_operating');
  });

  // ========================================================================
  // Test 4: Should handle missing response gracefully
  // ========================================================================
  it('should handle missing response gracefully', async () => {
    // Update session to have null response
    await prisma.onboardingSession.update({
      where: { id: testOnboardingSessionId },
      data: { response: null },
    });

    const result = await blueprintGetTool.execute(
      { projectId: testProjectId },
      mockContext
    );

    expect(result.content[0]).toBeDefined();
    const response = JSON.parse(result.content[0]?.text as string);
    expect(response.error).toBe('Failed to retrieve Session 3 blueprint');
    expect(response.details).toContain('Not found');
  });
});
