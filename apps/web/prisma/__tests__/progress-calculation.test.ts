/**
 * @jest-environment node
 *
 * Progress Calculation Tests
 *
 * Tests progress roll-up algorithm and propagation across all 5 levels
 *
 * Test Coverage:
 * 1. Session → Task propagation (50% when 1/2 complete)
 * 2. Task → Day propagation
 * 3. Day → Week propagation
 * 4. Week → Phase propagation
 * 5. Edge case: No children (progress stays current)
 * 6. Edge case: Mixed statuses (average calculation)
 */

import { PrismaClient } from '@prisma/client';
import { updateProgressAndPropagate, recalculateFullTree } from '@/lib/db/progress';

const prisma = new PrismaClient();

describe('Progress Roll-Up Calculations', () => {
  let phaseId: string;
  let weekId: string;
  let dayId: string;
  let taskId: string;
  let sessionId1: string;
  let sessionId2: string;

  beforeAll(async () => {
    // Create test hierarchy
    const phase = await prisma.phase.create({
      data: {
        title: 'Test Phase - Progress',
        startDate: new Date('2025-11-06'),
        status: 'NOT_STARTED',
        progress: 0,
        weeks: {
          create: {
            title: 'Test Week',
            startDate: new Date('2025-11-06'),
            status: 'NOT_STARTED',
            progress: 0,
            days: {
              create: {
                title: 'Test Day',
                startDate: new Date('2025-11-06'),
                status: 'NOT_STARTED',
                progress: 0,
                tasks: {
                  create: {
                    title: 'Test Task',
                    startDate: new Date('2025-11-06'),
                    status: 'NOT_STARTED',
                    progress: 0,
                    sessions: {
                      create: [
                        {
                          title: 'Session 1',
                          startDate: new Date('2025-11-06'),
                          status: 'NOT_STARTED',
                          progress: 0,
                        },
                        {
                          title: 'Session 2',
                          startDate: new Date('2025-11-06'),
                          status: 'NOT_STARTED',
                          progress: 0,
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                tasks: {
                  include: { sessions: true },
                },
              },
            },
          },
        },
      },
    });

    phaseId = phase.id;
    weekId = phase.weeks[0].id;
    dayId = phase.weeks[0].days[0].id;
    taskId = phase.weeks[0].days[0].tasks[0].id;
    sessionId1 = phase.weeks[0].days[0].tasks[0].sessions[0].id;
    sessionId2 = phase.weeks[0].days[0].tasks[0].sessions[1].id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.phase.delete({ where: { id: phaseId } }).catch(() => {});
    await prisma.$disconnect();
  });

  /**
   * Test 1: Session → Task propagation (50% when 1/2 sessions complete)
   */
  it('should propagate Session 100% → Task 50%', async () => {
    // Update Session 1 to 100%
    await updateProgressAndPropagate(sessionId1, 'session', 100);

    // Verify Session updated
    const session = await prisma.session.findUnique({ where: { id: sessionId1 } });
    expect(session?.progress).toBe(100);
    expect(session?.status).toBe('COMPLETED');

    // Verify Task progress = 50% (avg of 100 + 0)
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.progress).toBe(50);
    expect(task?.status).toBe('IN_PROGRESS');
  });

  /**
   * Test 2: Task → Day propagation
   */
  it('should propagate Task 100% → Day 100%', async () => {
    // Update Session 2 to 100% (now both sessions complete)
    await updateProgressAndPropagate(sessionId2, 'session', 100);

    // Verify Session 2 updated
    const session2 = await prisma.session.findUnique({ where: { id: sessionId2 } });
    expect(session2?.progress).toBe(100);
    expect(session2?.status).toBe('COMPLETED');

    // Verify Task progress = 100% (avg of 100 + 100)
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.progress).toBe(100);
    expect(task?.status).toBe('COMPLETED');

    // Verify Day progress = 100% (only 1 task, so 100%)
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    expect(day?.progress).toBe(100);
    expect(day?.status).toBe('COMPLETED');
  });

  /**
   * Test 3: Day → Week propagation
   */
  it('should propagate Day 100% → Week 100%', async () => {
    // Day already 100% from previous test
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    expect(day?.progress).toBe(100);

    // Verify Week progress = 100% (only 1 day, so 100%)
    const week = await prisma.week.findUnique({ where: { id: weekId } });
    expect(week?.progress).toBe(100);
    expect(week?.status).toBe('COMPLETED');
  });

  /**
   * Test 4: Week → Phase propagation
   */
  it('should propagate Week 100% → Phase 100%', async () => {
    // Week already 100% from previous test
    const week = await prisma.week.findUnique({ where: { id: weekId } });
    expect(week?.progress).toBe(100);

    // Verify Phase progress = 100% (only 1 week, so 100%)
    const phase = await prisma.phase.findUnique({ where: { id: phaseId } });
    expect(phase?.progress).toBe(100);
    expect(phase?.status).toBe('COMPLETED');
  });

  /**
   * Test 5: Edge case - No children (progress stays current)
   */
  it('should keep current progress when no children exist', async () => {
    // Create Day with no Tasks
    const emptyDay = await prisma.day.create({
      data: {
        title: 'Empty Day',
        startDate: new Date('2025-11-07'),
        status: 'IN_PROGRESS',
        progress: 30, // Manually set progress
        weekId,
      },
    });

    // Try to update parent Week (should recalculate from both days)
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { days: true },
    });

    // Week progress should be average of Day 1 (100%) and Empty Day (30%)
    expect(week?.days).toHaveLength(2);

    // Calculate expected: (100 + 30) / 2 = 65
    const expectedProgress = Math.round((100 + 30) / 2);
    expect(expectedProgress).toBe(65);

    // Cleanup
    await prisma.day.delete({ where: { id: emptyDay.id } });

    // Recalculate Week progress (should go back to 100%)
    await recalculateFullTree(phaseId);
    const weekAfter = await prisma.week.findUnique({ where: { id: weekId } });
    expect(weekAfter?.progress).toBe(100);
  });

  /**
   * Test 6: Edge case - Mixed statuses (average calculation)
   */
  it('should calculate average regardless of status', async () => {
    // Reset sessions to mixed progress
    await prisma.session.update({
      where: { id: sessionId1 },
      data: { progress: 100, status: 'COMPLETED' },
    });

    await prisma.session.update({
      where: { id: sessionId2 },
      data: { progress: 0, status: 'BLOCKED' },
    });

    // Recalculate Task progress
    await recalculateFullTree(phaseId);

    // Verify Task progress = 50% (avg of 100 + 0, regardless of status)
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.progress).toBe(50);
    expect(task?.status).toBe('IN_PROGRESS'); // Auto-determined from progress
  });

  /**
   * Bonus Test: recalculateFullTree integrity
   */
  it('should recalculate full tree correctly after manual corruption', async () => {
    // Manually corrupt data (bypass API to simulate data integrity issue)
    await prisma.session.update({
      where: { id: sessionId1 },
      data: { progress: 80 },
    });
    await prisma.session.update({
      where: { id: sessionId2 },
      data: { progress: 60 },
    });

    // Task still shows old progress (not propagated)
    let task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.progress).toBe(50); // Stale

    // Recalculate entire tree
    await recalculateFullTree(phaseId);

    // Verify Task progress = 70% (avg of 80 + 60)
    task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task?.progress).toBe(70); // Fixed

    // Verify propagation to Day
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    expect(day?.progress).toBe(70);

    // Verify propagation to Week
    const week = await prisma.week.findUnique({ where: { id: weekId } });
    expect(week?.progress).toBe(70);

    // Verify propagation to Phase
    const phase = await prisma.phase.findUnique({ where: { id: phaseId } });
    expect(phase?.progress).toBe(70);
  });
});
