/**
 * Project Plan Parser Tests - Sprint 8.5 Phase 1
 *
 * Tests parseProjectPlan function:
 * - Parses Phase headers
 * - Parses Sprint headers
 * - Extracts goals/deliverables
 * - Handles invalid input
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { parseProjectPlan } from '../parseProjectPlan';

const prisma = new PrismaClient();

describe('parseProjectPlan', () => {
  let testDocumentId: string;
  let testOnboardingSessionId: number;

  const sampleMarkdown = `
# Project Implementation Plan

## Phase A: Foundation & Core Infrastructure (Weeks 1-6, Sprints 1-3)

**Overview**: Foundation phase

### Sprint 1 (Weeks 1-2): Foundation Setup - 12 points

**Goals**:
- Setup infrastructure
- Create base models
- Configure database

**Deliverables**:
- Database schema
- API endpoints
- Basic UI components

### Sprint 2 (Weeks 3-4): Core Features - 15 points

**Goals**:
- Implement authentication
- Add user management
- Create dashboard

**Deliverables**:
- Auth system
- User CRUD
- Dashboard UI

### Sprint 3 (Weeks 5-6): Integration - 10 points

**Goals**:
- Integrate components
- Add testing
- Polish UI

**Deliverables**:
- E2E tests
- Integration tests
- UI polish

## Phase B: Advanced Features (Weeks 7-10, Sprints 4-5)

**Overview**: Advanced phase

### Sprint 4 (Weeks 7-8): Advanced Features - 18 points

**Goals**:
- Add analytics
- Implement notifications
- Create reporting

**Deliverables**:
- Analytics dashboard
- Notification system
- Report generator
`;

  beforeEach(async () => {
    // Create test onboarding session
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Parser test project',
      },
    });

    const session = await prisma.onboardingSession.create({
      data: {
        projectId: project.id,
        sessionNumber: 3,
        sessionType: 'bootstrap',
        status: 'completed',
      },
    });
    testOnboardingSessionId = session.id;

    // Create test document
    const doc = await prisma.document.create({
      data: {
        onboardingSessionId: testOnboardingSessionId,
        filename: '13-Project-Plan.md',
        content: sampleMarkdown,
        wordCount: sampleMarkdown.split(/\s+/).length,
        category: 'planning',
      },
    });
    testDocumentId = doc.id;
  });

  afterEach(async () => {
    await prisma.document.deleteMany();
    await prisma.onboardingSession.deleteMany({ where: { id: testOnboardingSessionId } });
    await prisma.project.deleteMany();
  });

  it('should parse Phase headers correctly', async () => {
    const result = await parseProjectPlan(testDocumentId);

    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].name).toBe('Phase A: Foundation & Core Infrastructure');
    expect(result.phases[0].duration).toBe('6 weeks');
    expect(result.phases[1].name).toBe('Phase B: Advanced Features');
    expect(result.phases[1].duration).toBe('4 weeks');
  });

  it('should parse Sprint headers correctly', async () => {
    const result = await parseProjectPlan(testDocumentId);

    const phase1Sprints = result.phases[0].sprints;
    expect(phase1Sprints).toHaveLength(3);

    expect(phase1Sprints[0].name).toBe('Sprint 1: Foundation Setup');
    expect(phase1Sprints[0].duration).toBe('2 weeks');
    expect(phase1Sprints[0].weeks).toBe('Weeks 1-2');
    expect(phase1Sprints[0].storyPoints).toBe(12);

    expect(phase1Sprints[1].name).toBe('Sprint 2: Core Features');
    expect(phase1Sprints[1].storyPoints).toBe(15);

    expect(phase1Sprints[2].name).toBe('Sprint 3: Integration');
    expect(phase1Sprints[2].storyPoints).toBe(10);
  });

  it('should extract goals from sprints', async () => {
    const result = await parseProjectPlan(testDocumentId);

    const sprint1 = result.phases[0].sprints[0];
    expect(sprint1.goals).toHaveLength(3);
    expect(sprint1.goals[0]).toBe('Setup infrastructure');
    expect(sprint1.goals[1]).toBe('Create base models');
    expect(sprint1.goals[2]).toBe('Configure database');
  });

  it('should extract deliverables from sprints', async () => {
    const result = await parseProjectPlan(testDocumentId);

    const sprint1 = result.phases[0].sprints[0];
    expect(sprint1.deliverables).toHaveLength(3);
    expect(sprint1.deliverables[0]).toBe('Database schema');
    expect(sprint1.deliverables[1]).toBe('API endpoints');
    expect(sprint1.deliverables[2]).toBe('Basic UI components');
  });

  it('should handle Phase B sprints correctly', async () => {
    const result = await parseProjectPlan(testDocumentId);

    const phase2Sprints = result.phases[1].sprints;
    expect(phase2Sprints).toHaveLength(1);
    expect(phase2Sprints[0].name).toBe('Sprint 4: Advanced Features');
    expect(phase2Sprints[0].storyPoints).toBe(18);
  });

  it('should throw error if document not found', async () => {
    await expect(parseProjectPlan('invalid-id')).rejects.toThrow('Document not found');
  });

  it('should warn if filename is not 13-Project-Plan.md', async () => {
    const wrongDoc = await prisma.document.create({
      data: {
        onboardingSessionId: testOnboardingSessionId,
        filename: 'wrong-file.md',
        content: sampleMarkdown,
        wordCount: 100,
        category: 'planning',
      },
    });

    // Should still parse but log warning
    const result = await parseProjectPlan(wrongDoc.id);
    expect(result.phases).toHaveLength(2);

    await prisma.document.delete({ where: { id: wrongDoc.id } });
  });
});
