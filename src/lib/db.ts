/**
 * Prisma Client Singleton
 * Ensures a single Prisma Client instance is used across the application
 * Prevents multiple connections in development with hot reload
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Instantiate Prisma Client as a singleton
 * In development, this prevents exhausting the database connection limit
 * due to hot module reloading creating new client instances
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Export Prisma client for use throughout the application
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/db';
 *
 * const user = await prisma.user.findUnique({
 *   where: { email: 'user@example.com' }
 * });
 * ```
 *
 * Features:
 * - Single instance across the entire application
 * - Automatic query logging in development
 * - Error-only logging in production
 * - Full type safety with TypeScript
 * - All Prisma methods available (create, findUnique, update, delete, etc.)
 */
export default prisma;
