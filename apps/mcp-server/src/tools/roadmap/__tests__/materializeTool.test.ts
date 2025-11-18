/**
 * Materialization Tool Tests - Sprint 8.5 Phase 1
 *
 * Tests materializeRoadmap function:
 * - Creates Phase/Sprint/Week/Day records from Roadmap JSON
 * - Handles transaction rollback on error
 * - Returns created IDs
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { materializeRoadmap } from '@projectpulse/roadmap-tools';
import type { ParsedRoadmap } from '@projectpulse/roadmap-tools';

const prisma = new PrismaClient();

describe('materializeRoadmap', () => {
  let testRoadmapId: string;
  let testProjectId: number;

  beforeEach(async () => {
    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test project for materialization',
      },
    });
    testProjectId = project.id;

    // Create test roadmap with phases JSON
    const phasesJson: ParsedRoadmap = {
      phases: [
        {
          name: 'Phase A: Foundation',
          duration: '4 weeks',
          sprints: [
            {
              name: 'Sprint 1: Setup',
              duration: '2 weeks',
              weeks: 'Weeks 1-2',
              goals: ['Setup infrastructure', 'Create base models'],
              deliverables: ['Database schema', 'API routes'],
              storyPoints: 12,
            },
            {
              name: 'Sprint 2: Core Features',
              duration: '2 weeks',
              weeks: 'Weeks 3-4',
              goals: ['Implement core features', 'Add authentication'],
              deliverables: ['User system', 'Auth flow'],
              storyPoints: 15,
            },
          ],
        },
        {
          name: 'Phase B: Advanced',
          duration: '2 weeks',
          sprints: [
            {
              name: 'Sprint 3: Polish',
              duration: '2 weeks',
              weeks: 'Weeks 5-6',
              goals: ['Polish UI', 'Add testing'],
              deliverables: ['E2E tests', 'UI improvements'],
              storyPoints: 10,
            },
          ],
        },
      ],
    };

    const roadmap = await prisma.roadmap.create({
      data: {
        projectId: testProjectId,
        phases: phasesJson as any, // JSONB
      },
    });
    testRoadmapId = roadmap.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.day.deleteMany();
    await prisma.week.deleteMany();
    await prisma.sprint.deleteMany();
    await prisma.phase.deleteMany();
    await prisma.roadmap.deleteMany();
    await prisma.project.deleteMany({ where: { id: testProjectId } });
  });

  it('should create Phase/Sprint/Week/Day records', async () => {
    const result = await materializeRoadmap(testRoadmapId);

    expect(result.success).toBe(true);
    expect(result.counts.phases).toBe(2);
    expect(result.counts.sprints).toBe(3);
    expect(result.counts.weeks).toBe(6); // 2 + 2 + 2 weeks
    expect(result.counts.days).toBe(30); // 6 weeks × 5 days

    // Verify Phase records created
    const phases = await prisma.phase.findMany({
      where: { roadmapId: testRoadmapId },
    });
    expect(phases.length).toBe(2);
    expect(phases[0].title).toBe('Phase A: Foundation');
    expect(phases[0].duration).toBe(4);
    expect(phases[1].title).toBe('Phase B: Advanced');
    expect(phases[1].duration).toBe(2);
  });

  it('should create Sprint records linked to Phases', async () => {
    await materializeRoadmap(testRoadmapId);

    const sprints = await prisma.sprint.findMany({
      include: { phase: true },
      orderBy: { order: 'asc' },
    });

    expect(sprints.length).toBe(3);
    expect(sprints[0].title).toBe('Sprint 1: Setup');
    expect(sprints[0].storyPoints).toBe(12);
    expect(sprints[0].phase.title).toBe('Phase A: Foundation');

    expect(sprints[1].title).toBe('Sprint 2: Core Features');
    expect(sprints[1].storyPoints).toBe(15);

    expect(sprints[2].title).toBe('Sprint 3: Polish');
    expect(sprints[2].phase.title).toBe('Phase B: Advanced');
  });

  it('should create Week records linked to Sprints (5-level hierarchy)', async () => {
    await materializeRoadmap(testRoadmapId);

    // CRITICAL: Week.sprintId not Week.phaseId (5-level hierarchy)
    const weeks = await prisma.week.findMany({
      include: { sprint: true },
      orderBy: { weekNumber: 'asc' },
    });

    expect(weeks.length).toBe(6);
    expect(weeks[0].title).toBe('Week 1');
    expect(weeks[0].weekNumber).toBe(1);
    expect(weeks[0].sprint.title).toBe('Sprint 1: Setup');

    expect(weeks[2].title).toBe('Week 3');
    expect(weeks[2].weekNumber).toBe(3);
    expect(weeks[2].sprint.title).toBe('Sprint 2: Core Features');
  });

  it('should create Day records (5 per week, Mon-Fri)', async () => {
    await materializeRoadmap(testRoadmapId);

    const days = await prisma.day.findMany({
      include: { week: true },
    });

    expect(days.length).toBe(30); // 6 weeks × 5 days

    // Check first week has Mon-Fri
    const week1Days = days.filter(d => d.week.weekNumber === 1);
    expect(week1Days.length).toBe(5);

    const dayNames = week1Days.map(d => d.title).sort();
    expect(dayNames).toEqual(['Friday', 'Monday', 'Thursday', 'Tuesday', 'Wednesday']);
  });

  it('should update Roadmap with current phase/sprint IDs', async () => {
    await materializeRoadmap(testRoadmapId);

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: testRoadmapId },
    });

    expect(roadmap?.currentPhaseId).toBeTruthy();
    expect(roadmap?.currentSprintId).toBeTruthy();
  });

  it('should throw error if roadmap not found', async () => {
    await expect(materializeRoadmap('invalid-id')).rejects.toThrow('Roadmap not found');
  });

  it('should return created IDs', async () => {
    const result = await materializeRoadmap(testRoadmapId);

    expect(result.phaseIds.length).toBe(2);
    expect(result.sprintIds.length).toBe(3);
    expect(result.weekIds.length).toBe(6);
    expect(result.dayIds.length).toBe(30);

    // Verify IDs are valid
    const phase = await prisma.phase.findUnique({
      where: { id: result.phaseIds[0] },
    });
    expect(phase).toBeTruthy();
  });
});
