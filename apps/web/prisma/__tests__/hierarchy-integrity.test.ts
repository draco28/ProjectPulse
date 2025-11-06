/**
 * @jest-environment node
 *
 * Hierarchy Integrity Tests (US-014)
 *
 * Tests data integrity validation for 5-level hierarchy
 *
 * User Story US-014: As an agent, I want to validate hierarchy integrity
 * (no orphaned tasks) so that data remains consistent
 *
 * Test Coverage:
 * 1. Detect orphaned Tasks (Task with invalid Day FK)
 * 2. Detect orphaned Sessions (Session with invalid Task FK)
 * 3. Validate circular references (prevent Phase → Phase)
 * 4. Validate date ranges (child dates within parent dates)
 */

import { PrismaClient } from '@prisma/client';
import {
  validateDateRange,
  validateProgress,
  validateCircularReference,
  validateHierarchyIntegrity,
} from '@/lib/db/validation';

const prisma = new PrismaClient();

describe('Hierarchy Integrity Validation (US-014)', () => {
  let phaseId: string;
  let weekId: string;
  let dayId: string;
  let taskId: string;

  beforeAll(async () => {
    // Create test hierarchy
    const phase = await prisma.phase.create({
      data: {
        title: 'Test Phase - Integrity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        status: 'NOT_STARTED',
        progress: 0,
        weeks: {
          create: {
            title: 'Test Week',
            startDate: new Date('2025-11-01'),
            endDate: new Date('2025-11-07'),
            status: 'NOT_STARTED',
            progress: 0,
            days: {
              create: {
                title: 'Test Day',
                startDate: new Date('2025-11-01'),
                endDate: new Date('2025-11-02'),
                status: 'NOT_STARTED',
                progress: 0,
                tasks: {
                  create: {
                    title: 'Test Task',
                    startDate: new Date('2025-11-01'),
                    status: 'NOT_STARTED',
                    progress: 0,
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
                tasks: true,
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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.phase.delete({ where: { id: phaseId } }).catch(() => {});
    await prisma.$disconnect();
  });

  /**
   * Test 1: Detect orphaned Tasks (Task with invalid Day FK)
   */
  it('should detect orphaned Tasks with invalid Day FK', async () => {
    // Create fake Task with non-existent Day FK
    const fakeTask = {
      id: 'fake-task-id',
      dayId: 'non-existent-day-id',
      title: 'Orphaned Task',
      startDate: new Date(),
      endDate: null,
      status: 'NOT_STARTED' as const,
      progress: 0,
    };

    // Validate hierarchy integrity
    const result = validateHierarchyIntegrity({
      phases: [{ id: phaseId, startDate: new Date(), progress: 0 }],
      weeks: [{ id: weekId, phaseId, startDate: new Date(), progress: 0 }],
      days: [{ id: dayId, weekId, startDate: new Date(), progress: 0 }],
      tasks: [
        { id: taskId, dayId, startDate: new Date(), progress: 0 }, // Valid
        fakeTask, // Invalid (orphaned)
      ],
      sessions: [],
    });

    // Assertions
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Orphaned Task');
    expect(result.errors[0]).toContain('non-existent-day-id');
  });

  /**
   * Test 2: Detect orphaned Sessions (Session with invalid Task FK)
   */
  it('should detect orphaned Sessions with invalid Task FK', async () => {
    // Create fake Session with non-existent Task FK
    const fakeSession = {
      id: 'fake-session-id',
      taskId: 'non-existent-task-id',
      title: 'Orphaned Session',
      startDate: new Date(),
      endDate: null,
      status: 'NOT_STARTED' as const,
      progress: 0,
    };

    // Validate hierarchy integrity
    const result = validateHierarchyIntegrity({
      phases: [{ id: phaseId, startDate: new Date(), progress: 0 }],
      weeks: [{ id: weekId, phaseId, startDate: new Date(), progress: 0 }],
      days: [{ id: dayId, weekId, startDate: new Date(), progress: 0 }],
      tasks: [{ id: taskId, dayId, startDate: new Date(), progress: 0 }],
      sessions: [fakeSession], // Invalid (orphaned)
    });

    // Assertions
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Orphaned Session');
    expect(result.errors[0]).toContain('non-existent-task-id');
  });

  /**
   * Test 3: Validate circular references (prevent Phase → Phase)
   */
  it('should prevent circular references', () => {
    // Test circular reference validation
    const circular = validateCircularReference('phase1', 'phase1');
    expect(circular).toBe(false); // Circular reference detected

    const valid = validateCircularReference('phase1', 'phase2');
    expect(valid).toBe(true); // Different entities, valid

    const noParent = validateCircularReference('phase1', null);
    expect(noParent).toBe(true); // No parent, valid
  });

  /**
   * Test 4: Validate date ranges (child dates within parent dates)
   */
  it('should validate child dates are within parent dates', () => {
    const parentStart = new Date('2025-11-01');
    const parentEnd = new Date('2025-11-30');

    // Valid: Child dates within parent dates
    const validChild = validateDateRange(
      new Date('2025-11-05'), // child start
      new Date('2025-11-10'), // child end
      parentStart,
      parentEnd
    );
    expect(validChild).toBe(true);

    // Invalid: Child start before parent start
    const invalidStart = validateDateRange(
      new Date('2025-10-30'), // child start BEFORE parent start
      new Date('2025-11-10'),
      parentStart,
      parentEnd
    );
    expect(invalidStart).toBe(false);

    // Invalid: Child end after parent end
    const invalidEnd = validateDateRange(
      new Date('2025-11-05'),
      new Date('2025-12-05'), // child end AFTER parent end
      parentStart,
      parentEnd
    );
    expect(invalidEnd).toBe(false);

    // Valid: Child end before child start (should fail)
    const invalidRange = validateDateRange(
      new Date('2025-11-15'), // child start
      new Date('2025-11-10'), // child end BEFORE child start
      parentStart,
      parentEnd
    );
    expect(invalidRange).toBe(false);

    // Valid: No end date
    const noEndDate = validateDateRange(new Date('2025-11-05'), null, parentStart, parentEnd);
    expect(noEndDate).toBe(true);
  });

  /**
   * Test 5: Validate progress values (0-100)
   */
  it('should validate progress is 0-100', () => {
    expect(validateProgress(0)).toBe(true);
    expect(validateProgress(50)).toBe(true);
    expect(validateProgress(100)).toBe(true);
    expect(validateProgress(-1)).toBe(false); // Negative
    expect(validateProgress(101)).toBe(false); // Over 100
    expect(validateProgress(50.5)).toBe(false); // Not integer
  });

  /**
   * Test 6: Full hierarchy integrity validation
   */
  it('should validate full hierarchy integrity with no errors', async () => {
    // Fetch real data from database
    const phases = await prisma.phase.findMany({
      where: { id: phaseId },
      select: { id: true, startDate: true, endDate: true, progress: true },
    });

    const weeks = await prisma.week.findMany({
      where: { phaseId },
      select: { id: true, phaseId: true, startDate: true, endDate: true, progress: true },
    });

    const days = await prisma.day.findMany({
      where: { weekId },
      select: { id: true, weekId: true, startDate: true, endDate: true, progress: true },
    });

    const tasks = await prisma.task.findMany({
      where: { dayId },
      select: { id: true, dayId: true, startDate: true, endDate: true, progress: true },
    });

    const sessions = await prisma.session.findMany({
      where: { taskId },
      select: { id: true, taskId: true, startDate: true, endDate: true, progress: true },
    });

    // Validate integrity
    const result = validateHierarchyIntegrity({
      phases,
      weeks,
      days,
      tasks,
      sessions,
    });

    // Assertions: No integrity errors
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
