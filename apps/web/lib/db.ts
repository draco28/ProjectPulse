/**
 * Database connection singleton
 *
 * This module exports a single Prisma Client instance that is reused across
 * the application. In development, it prevents hot reload from creating
 * multiple database connections.
 */

import { PrismaClient } from '@prisma/client';

// Extend global namespace to store Prisma instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create or reuse Prisma Client instance
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// In development, store instance on global to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export default for convenience
export default prisma;
