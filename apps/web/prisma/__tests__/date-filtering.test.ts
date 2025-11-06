/**
 * Date Filtering Tests
 *
 * Verify that date range queries work correctly using Prisma's
 * gte (greater than or equal) and lte (less than or equal) operators.
 *
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Date Filtering', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should filter days by date range', async () => {
    // Arrange: Query days within Week 1 (Nov 1-8, 2025)
    const startDate = new Date('2025-11-01');
    const endDate = new Date('2025-11-10');

    // Act: Query days within date range
    const days = await prisma.day.findMany({
      where: {
        startDate: { gte: startDate },
        OR: [
          { endDate: { lte: endDate } },
          { endDate: null }, // Include days without endDate
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    console.log(
      `Found ${days.length} days between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`
    );

    // Assert: Should find at least the seeded days (Day 1 and Day 2)
    expect(days.length).toBeGreaterThan(0);

    // Verify all returned days are within range
    days.forEach((day) => {
      expect(day.startDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());

      if (day.endDate) {
        expect(day.endDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      }

      console.log(
        `  - ${day.title}: ${day.startDate.toISOString().split('T')[0]} to ${day.endDate ? day.endDate.toISOString().split('T')[0] : 'ongoing'}`
      );
    });

    console.log('✓ Date filtering successful: All days within date range');
  });

  it('should filter tasks by date range', async () => {
    // Arrange: Query tasks on Nov 1, 2025 (Day 1 tasks)
    const targetDate = new Date('2025-11-01');
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Act: Query tasks within single day
    const tasks = await prisma.task.findMany({
      where: {
        startDate: { gte: startOfDay },
        OR: [
          { endDate: { lte: endOfDay } },
          { endDate: null }, // Include tasks without endDate
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    console.log(`Found ${tasks.length} tasks on ${startOfDay.toISOString().split('T')[0]}`);

    // Assert: Should find the 4 tasks from Day 1
    expect(tasks.length).toBeGreaterThan(0);

    // Verify all returned tasks are within the day
    tasks.forEach((task) => {
      expect(task.startDate.getTime()).toBeGreaterThanOrEqual(startOfDay.getTime());

      if (task.endDate) {
        expect(task.endDate.getTime()).toBeLessThanOrEqual(endOfDay.getTime());
      }

      console.log(
        `  - ${task.title}: ${task.startDate.toISOString()} to ${task.endDate ? task.endDate.toISOString() : 'ongoing'}`
      );
    });

    console.log('✓ Date filtering successful: All tasks within target day');
  });

  it('should filter sessions by exact time range', async () => {
    // Arrange: Query sessions within first hour of Day 2 (10:00-11:00)
    const rangeStart = new Date('2025-11-06T10:00:00Z');
    const rangeEnd = new Date('2025-11-06T11:00:00Z');

    // Act: Query sessions within time range
    const sessions = await prisma.session.findMany({
      where: {
        startDate: { gte: rangeStart },
        OR: [
          { endDate: { lte: rangeEnd } },
          { endDate: null }, // Include ongoing sessions
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    console.log(
      `Found ${sessions.length} sessions between ${rangeStart.toISOString()} and ${rangeEnd.toISOString()}`
    );

    // Assert: Should find sessions from seed data
    expect(sessions.length).toBeGreaterThan(0);

    // Verify all returned sessions are within range
    sessions.forEach((session) => {
      expect(session.startDate.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());

      if (session.endDate) {
        expect(session.endDate.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());
      }

      console.log(
        `  - ${session.title}: ${session.startDate.toISOString()} to ${session.endDate ? session.endDate.toISOString() : 'ongoing'}`
      );
    });

    console.log('✓ Date filtering successful: All sessions within time range');
  });
});
