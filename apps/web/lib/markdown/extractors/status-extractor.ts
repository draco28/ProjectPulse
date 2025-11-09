import { prisma } from '@/lib/db';
import { DataExtractor } from '../data-extractors';
import { StatusDataSchema, StatusData } from '../templates/status-template';

/**
 * Status Data Extractor
 * Extracts current hierarchy state for STATUS.md
 */
export const statusExtractor: DataExtractor<StatusData> = {
  id: 'status-template', // Matches template ID
  name: 'Status Extractor',
  description: 'Extract current phase, week, day, and task data',
  outputSchema: StatusDataSchema,

  async extract(projectId: number): Promise<StatusData> {
    // 1. Get current phase (most recent IN_PROGRESS or first NOT_STARTED)
    const currentPhase = await prisma.phase.findFirst({
      where: {
        OR: [
          { status: 'IN_PROGRESS' },
          { status: 'NOT_STARTED' },
        ],
      },
      orderBy: [
        { status: 'asc' }, // IN_PROGRESS first
        { startDate: 'asc' },
      ],
    });

    if (!currentPhase) {
      throw new Error('No active phase found');
    }

    // 2. Get current week within phase
    const currentWeek = await prisma.week.findFirst({
      where: {
        phaseId: currentPhase.id,
        OR: [
          { status: 'IN_PROGRESS' },
          { status: 'NOT_STARTED' },
        ],
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' },
      ],
      include: {
        days: {
          orderBy: { startDate: 'asc' },
          include: {
            tasks: {
              orderBy: { startDate: 'asc' },
            },
          },
        },
      },
    });

    if (!currentWeek) {
      throw new Error('No active week found');
    }

    // 3. Get last completed task (across entire project)
    const lastCompletedTask = await prisma.task.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
    });

    // 4. Format data for template
    return {
      phase: {
        name: currentPhase.name,
        progress: currentPhase.progress,
        status: currentPhase.status,
        startDate: currentPhase.startDate,
        endDate: currentPhase.endDate ?? undefined,
      },
      currentWeek: {
        weekNumber: currentWeek.weekNumber,
        progress: currentWeek.progress,
        status: currentWeek.status,
        days: currentWeek.days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          progress: day.progress,
          tasks: day.tasks.map((task) => ({
            title: task.title,
            status: task.status,
            progress: task.progress,
          })),
        })),
      },
      lastTaskCompleted: lastCompletedTask
        ? {
            title: lastCompletedTask.title,
            completedAt: lastCompletedTask.updatedAt,
          }
        : undefined,
      timestamp: new Date(),
    };
  },
};
