/**
 * @jest-environment node
 *
 * Hierarchy CRUD Tests
 *
 * Tests basic Create, Read, Update, Delete operations for 5-level hierarchy
 *
 * Test Coverage:
 * 1. Create Phase with nested structure
 * 2. Read Phase with all children (Prisma includes)
 * 3. Update Phase title and progress
 * 4. Delete Phase (verify cascade works)
 */

import { PrismaClient } from '@prisma/client';
import { getFullTree, getChildren, getParent } from '@/lib/db/hierarchy';

const prisma = new PrismaClient();

describe('Hierarchy CRUD Operations', () => {
  let phaseId: string;

  afterAll(async () => {
    // Cleanup: Delete test data if it exists
    if (phaseId) {
      await prisma.phase.delete({ where: { id: phaseId } }).catch(() => {
        // Ignore error if already deleted
      });
    }
    await prisma.$disconnect();
  });

  /**
   * Test 1: Create Phase with nested structure
   */
  it('should create Phase with nested Week → Day → Task structure', async () => {
    const phase = await prisma.phase.create({
      data: {
        title: 'Test Phase - CRUD',
        description: 'Phase for testing CRUD operations',
        status: 'NOT_STARTED',
        progress: 0,
        startDate: new Date('2025-11-06'),
        endDate: new Date('2025-11-20'),
        weeks: {
          create: {
            title: 'Test Week 1',
            status: 'NOT_STARTED',
            progress: 0,
            startDate: new Date('2025-11-06'),
            endDate: new Date('2025-11-13'),
            days: {
              create: {
                title: 'Test Day 1',
                status: 'NOT_STARTED',
                progress: 0,
                startDate: new Date('2025-11-06'),
                tasks: {
                  create: {
                    title: 'Test Task 1',
                    status: 'NOT_STARTED',
                    progress: 0,
                    startDate: new Date('2025-11-06'),
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

    // Store phase ID for cleanup
    phaseId = phase.id;

    // Assertions
    expect(phase).toBeDefined();
    expect(phase.title).toBe('Test Phase - CRUD');
    expect(phase.status).toBe('NOT_STARTED');
    expect(phase.progress).toBe(0);
    expect(phase.weeks).toHaveLength(1);
    expect(phase.weeks[0].title).toBe('Test Week 1');
    expect(phase.weeks[0].days).toHaveLength(1);
    expect(phase.weeks[0].days[0].title).toBe('Test Day 1');
    expect(phase.weeks[0].days[0].tasks).toHaveLength(1);
    expect(phase.weeks[0].days[0].tasks[0].title).toBe('Test Task 1');
  });

  /**
   * Test 2: Read Phase with all children (using getFullTree helper)
   */
  it('should read Phase with all nested children using getFullTree', async () => {
    const tree = await getFullTree(phaseId);

    // Assertions
    expect(tree).toBeDefined();
    expect(tree?.id).toBe(phaseId);
    expect(tree?.title).toBe('Test Phase - CRUD');
    expect(tree?.weeks).toHaveLength(1);
    expect(tree?.weeks[0].days).toHaveLength(1);
    expect(tree?.weeks[0].days[0].tasks).toHaveLength(1);

    // Verify helper functions work
    const weeks = await getChildren(phaseId, 'phase');
    expect(weeks).toHaveLength(1);
    expect(weeks[0].id).toBe(tree!.weeks[0].id);

    // Verify getParent works
    const weekId = tree!.weeks[0].id;
    const parentPhase = await getParent(weekId, 'week');
    expect(parentPhase).toBeDefined();
    expect(parentPhase?.id).toBe(phaseId);
  });

  /**
   * Test 3: Update Phase title and progress
   */
  it('should update Phase title and progress', async () => {
    // Update Phase
    const updated = await prisma.phase.update({
      where: { id: phaseId },
      data: {
        title: 'Test Phase - CRUD (Updated)',
        progress: 50,
        status: 'IN_PROGRESS',
      },
    });

    // Assertions
    expect(updated).toBeDefined();
    expect(updated.title).toBe('Test Phase - CRUD (Updated)');
    expect(updated.progress).toBe(50);
    expect(updated.status).toBe('IN_PROGRESS');

    // Verify update persisted
    const fetched = await prisma.phase.findUnique({
      where: { id: phaseId },
    });
    expect(fetched?.title).toBe('Test Phase - CRUD (Updated)');
    expect(fetched?.progress).toBe(50);
  });

  /**
   * Test 4: Delete Phase (verify cascade works)
   */
  it('should delete Phase and cascade delete all children', async () => {
    // Get child IDs before deletion
    const tree = await getFullTree(phaseId);
    expect(tree).toBeDefined();

    const weekId = tree!.weeks[0].id;
    const dayId = tree!.weeks[0].days[0].id;
    const taskId = tree!.weeks[0].days[0].tasks[0].id;

    // Delete Phase
    await prisma.phase.delete({ where: { id: phaseId } });

    // Verify Phase deleted
    const deletedPhase = await prisma.phase.findUnique({ where: { id: phaseId } });
    expect(deletedPhase).toBeNull();

    // Verify children cascade deleted
    const deletedWeek = await prisma.week.findUnique({ where: { id: weekId } });
    expect(deletedWeek).toBeNull();

    const deletedDay = await prisma.day.findUnique({ where: { id: dayId } });
    expect(deletedDay).toBeNull();

    const deletedTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(deletedTask).toBeNull();

    // Clear phaseId to prevent double deletion in afterAll
    phaseId = '';
  });
});
