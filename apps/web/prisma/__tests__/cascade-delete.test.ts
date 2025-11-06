/**
 * Cascade Delete Tests
 *
 * Verify that deleting parent entities automatically deletes children
 * via Prisma's onDelete: Cascade foreign key constraints.
 *
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Cascade Delete', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete all tasks when day is deleted', async () => {
    // Arrange: Create test hierarchy (Phase → Week → Day → Tasks)
    const phase = await prisma.phase.create({
      data: {
        title: 'Test Phase for Cascade Delete',
        status: 'IN_PROGRESS',
        progress: 50,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-15'),
        weeks: {
          create: {
            title: 'Test Week for Cascade Delete',
            status: 'IN_PROGRESS',
            progress: 50,
            startDate: new Date('2025-11-01'),
            endDate: new Date('2025-11-08'),
            days: {
              create: {
                title: 'Test Day for Cascade Delete',
                status: 'IN_PROGRESS',
                progress: 50,
                startDate: new Date('2025-11-01'),
                endDate: new Date('2025-11-01'),
                tasks: {
                  create: [
                    {
                      title: 'Test Task 1',
                      status: 'COMPLETED',
                      progress: 100,
                      startDate: new Date('2025-11-01T09:00:00Z'),
                      endDate: new Date('2025-11-01T10:00:00Z'),
                    },
                    {
                      title: 'Test Task 2',
                      status: 'IN_PROGRESS',
                      progress: 50,
                      startDate: new Date('2025-11-01T10:00:00Z'),
                      endDate: new Date('2025-11-01T11:00:00Z'),
                    },
                  ],
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
              include: { tasks: true },
            },
          },
        },
      },
    });

    const day = phase.weeks[0].days[0];
    const taskIds = day.tasks.map((t) => t.id);

    expect(day.tasks.length).toBe(2);
    console.log(`Created Day "${day.title}" with ${taskIds.length} tasks`);

    // Act: Delete the day
    await prisma.day.delete({ where: { id: day.id } });

    // Assert: Verify all tasks under this day are also deleted
    const remainingTasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    expect(remainingTasks).toHaveLength(0);
    console.log('✓ Cascade delete successful: All tasks deleted with day');

    // Cleanup: Delete the test phase (will cascade delete week and day)
    await prisma.phase.delete({ where: { id: phase.id } });
  });

  it('should delete all sessions when task is deleted', async () => {
    // Arrange: Create test hierarchy with sessions (Phase → Week → Day → Task → Sessions)
    const phase = await prisma.phase.create({
      data: {
        title: 'Test Phase for Session Cascade',
        status: 'IN_PROGRESS',
        progress: 50,
        startDate: new Date('2025-11-02'),
        endDate: new Date('2025-11-15'),
        weeks: {
          create: {
            title: 'Test Week for Session Cascade',
            status: 'IN_PROGRESS',
            progress: 50,
            startDate: new Date('2025-11-02'),
            endDate: new Date('2025-11-08'),
            days: {
              create: {
                title: 'Test Day for Session Cascade',
                status: 'IN_PROGRESS',
                progress: 50,
                startDate: new Date('2025-11-02'),
                endDate: new Date('2025-11-02'),
                tasks: {
                  create: {
                    title: 'Test Task with Sessions',
                    status: 'COMPLETED',
                    progress: 100,
                    startDate: new Date('2025-11-02T09:00:00Z'),
                    endDate: new Date('2025-11-02T11:00:00Z'),
                    sessions: {
                      create: [
                        {
                          title: 'Test Session 1',
                          status: 'COMPLETED',
                          progress: 100,
                          startDate: new Date('2025-11-02T09:00:00Z'),
                          endDate: new Date('2025-11-02T10:00:00Z'),
                        },
                        {
                          title: 'Test Session 2',
                          status: 'COMPLETED',
                          progress: 100,
                          startDate: new Date('2025-11-02T10:00:00Z'),
                          endDate: new Date('2025-11-02T11:00:00Z'),
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

    const task = phase.weeks[0].days[0].tasks[0];
    const sessionIds = task.sessions.map((s) => s.id);

    expect(task.sessions.length).toBe(2);
    console.log(`Created Task "${task.title}" with ${sessionIds.length} sessions`);

    // Act: Delete the task
    await prisma.task.delete({ where: { id: task.id } });

    // Assert: Verify all sessions under this task are also deleted
    const remainingSessions = await prisma.session.findMany({
      where: { id: { in: sessionIds } },
    });

    expect(remainingSessions).toHaveLength(0);
    console.log('✓ Cascade delete successful: All sessions deleted with task');

    // Cleanup: Delete the test phase (will cascade delete everything)
    await prisma.phase.delete({ where: { id: phase.id } });
  });
});
