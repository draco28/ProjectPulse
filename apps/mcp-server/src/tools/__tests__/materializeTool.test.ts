/**
 * Materialization Tool Tests - Sprint 8.5 Phase 1 Part A
 *
 * Tests the projectpulse.roadmap.materialize MCP tool
 * Verifies Phase/Sprint/Week/Day record creation from Roadmap JSON
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { materializeRoadmapTool } from '../roadmap/materializeTool.js';

const prisma = new PrismaClient();

test('materializeRoadmapTool creates Phase/Sprint/Week/Day records', async () => {
  // Setup: Create test project and roadmap
  const project = await prisma.project.create({
    data: {
      name: 'Test Materialization Project',
      description: 'Test project for roadmap materialization',
      status: 'PLANNING',
    },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      projectId: project.id,
      phases: {
        phases: [
          {
            name: 'Phase A: Foundation',
            duration: '4 weeks',
            sprints: [
              {
                name: 'Sprint 1: Setup',
                weeks: 'Weeks 1-2',
                goals: ['Setup environment', 'Database schema'],
              },
            ],
          },
        ],
      },
    },
  });

  try {
    // When: Call materialize tool
    const result = await materializeRoadmapTool.handler({
      roadmapId: roadmap.id,
      projectId: project.id,
    });

    // Then: Success response
    assert.ok(result.content[0]);
    const response = JSON.parse(result.content[0].text);
    assert.equal(response.success, true);
    assert.equal(response.materialization.phases, 1);
    assert.equal(response.materialization.sprints, 1);
    assert.ok(response.materialization.weeks >= 2); // Weeks 1-2
    assert.ok(response.materialization.days >= 10); // 2 weeks × 5 days

    // Verify database records created
    const phaseCount = await prisma.phase.count({
      where: { roadmapId: roadmap.id },
    });
    assert.equal(phaseCount, 1);

    const sprintCount = await prisma.sprint.count({
      where: {
        phase: { roadmapId: roadmap.id },
      },
    });
    assert.equal(sprintCount, 1);
  } finally {
    // Cleanup
    await prisma.project.delete({ where: { id: project.id } });
  }
});

test('materializeRoadmapTool validates projectId ownership', async () => {
  // Setup: Create two projects
  const projectA = await prisma.project.create({
    data: {
      name: 'Project A',
      description: 'Test project A',
      status: 'PLANNING',
    },
  });

  const projectB = await prisma.project.create({
    data: {
      name: 'Project B',
      description: 'Test project B',
      status: 'PLANNING',
    },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      projectId: projectA.id,
      phases: {
        phases: [
          {
            name: 'Phase A',
            duration: '1 week',
            sprints: [{ name: 'Sprint 1', weeks: 'Weeks 1', goals: ['Test'] }],
          },
        ],
      },
    },
  });

  try {
    // When: Call materialize with wrong project ID
    const result = await materializeRoadmapTool.handler({
      roadmapId: roadmap.id,
      projectId: projectB.id, // Wrong project!
    });

    // Then: Security violation error
    const response = JSON.parse(result.content[0].text);
    assert.equal(response.success, false);
    assert.equal(response.error, 'Security violation');
    assert.ok(response.message.includes('does not belong to project'));

    // Verify NO records created
    const phaseCount = await prisma.phase.count({
      where: { roadmapId: roadmap.id },
    });
    assert.equal(phaseCount, 0);
  } finally {
    // Cleanup
    await prisma.project.delete({ where: { id: projectA.id } });
    await prisma.project.delete({ where: { id: projectB.id } });
  }
});

test('materializeRoadmapTool handles non-existent roadmap', async () => {
  // When: Call with fake roadmap ID
  const result = await materializeRoadmapTool.handler({
    roadmapId: 'roadmap_nonexistent123',
    projectId: 999,
  });

  // Then: Not found error
  const response = JSON.parse(result.content[0].text);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Roadmap not found');
  assert.ok(response.message.includes('roadmap_nonexistent123'));
});

test('materializeRoadmapTool returns detailed IDs', async () => {
  // Setup
  const project = await prisma.project.create({
    data: {
      name: 'Test Project IDs',
      description: 'Test ID returns',
      status: 'PLANNING',
    },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      projectId: project.id,
      phases: {
        phases: [
          {
            name: 'Phase A',
            duration: '2 weeks',
            sprints: [
              {
                name: 'Sprint 1',
                weeks: 'Weeks 1-2',
                goals: ['Goal 1'],
              },
            ],
          },
        ],
      },
    },
  });

  try {
    // When: Materialize
    const result = await materializeRoadmapTool.handler({
      roadmapId: roadmap.id,
      projectId: project.id,
    });

    // Then: Response includes arrays of IDs
    const response = JSON.parse(result.content[0].text);
    assert.equal(response.success, true);
    assert.ok(Array.isArray(response.ids.phases));
    assert.ok(Array.isArray(response.ids.sprints));
    assert.ok(Array.isArray(response.ids.weeks));
    assert.ok(Array.isArray(response.ids.days));

    // Verify IDs are valid
    assert.ok(response.ids.phases.length > 0);
    const phase = await prisma.phase.findUnique({
      where: { id: response.ids.phases[0] },
    });
    assert.ok(phase);
    assert.equal(phase.roadmapId, roadmap.id);
  } finally {
    // Cleanup
    await prisma.project.delete({ where: { id: project.id } });
  }
});
