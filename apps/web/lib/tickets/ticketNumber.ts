/**
 * Ticket Number Generation Helper (Sprint 17)
 *
 * Generates project-scoped sequential ticket numbers.
 * Each project has its own sequence: 1, 2, 3...
 */

import type { PrismaClient } from '@prisma/client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Get the next ticket number for a project
 *
 * IMPORTANT: Call this within a transaction to prevent race conditions.
 * The sequence is: max(ticketNumber) + 1 for the project.
 *
 * @param tx - Prisma client or transaction client
 * @param projectId - The project to generate ticketNumber for
 * @returns The next sequential ticketNumber for the project
 */
export async function getNextTicketNumber(
  tx: PrismaClient | TransactionClient,
  projectId: number
): Promise<number> {
  const maxResult = await tx.ticket.aggregate({
    where: { projectId },
    _max: { ticketNumber: true },
  });
  return (maxResult._max.ticketNumber ?? 0) + 1;
}

/**
 * Get multiple sequential ticket numbers for bulk creation
 *
 * @param tx - Prisma client or transaction client
 * @param projectId - The project to generate ticketNumbers for
 * @param count - How many sequential numbers to reserve
 * @returns Array of sequential ticketNumbers
 */
export async function getNextTicketNumbers(
  tx: PrismaClient | TransactionClient,
  projectId: number,
  count: number
): Promise<number[]> {
  const start = await getNextTicketNumber(tx, projectId);
  return Array.from({ length: count }, (_, i) => start + i);
}
