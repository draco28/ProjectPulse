/**
 * Prisma Client Singleton
 *
 * Ensures only one Prisma Client instance is created
 * Prevents multiple instances in development (hot reload)
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Note: Don't set datasources.db.url explicitly here!
    // Prisma reads DATABASE_URL from environment automatically.
    // Explicit undefined breaks Next.js production builds (Docker).
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
