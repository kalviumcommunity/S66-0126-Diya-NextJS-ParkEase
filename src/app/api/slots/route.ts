import { NextRequest } from 'next/server';
import { paginatedResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { completeExpiredBookings, markActiveBookingsAsOccupied } from '@/lib/bookingService';
import { getOrSetCache } from '@/lib/redis';
import { withErrorHandler } from '@/lib/errorHandler';

/**
 * GET /api/slots?status=AVAILABLE&row=1&column=5
 * List all parking slots with optional filters
 *
 * Query parameters:
 * - status: AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE
 * - row: Filter by row number
 * - column: Filter by column number
 * - limit: Number of results (default 50)
 * - offset: Pagination offset (default 0)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  await completeExpiredBookings();
  await markActiveBookingsAsOccupied();

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const row = searchParams.get('row');
  const column = searchParams.get('column');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build cache key based on query parameters
  const cacheKey = `slots:${status || 'all'}:${row || 'all'}:${column || 'all'}:${limit}:${offset}`;

  // Use cache with 30 second TTL
  const result = await getOrSetCache(
    cacheKey,
    async () => {
      // Build where clause for filters
      const where: Record<string, any> = {};
      if (status) {
        where.status = status as any;
      }
      if (row) {
        where.row = parseInt(row);
      }
      if (column) {
        where.column = parseInt(column);
      }

      // Query database with pagination
      const [slots, total] = await Promise.all([
        prisma.parkingSlot.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: [{ row: 'asc' }, { column: 'asc' }],
          select: {
            id: true,
            row: true,
            column: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.parkingSlot.count({ where }),
      ]);

      return { slots, total, limit, offset };
    },
    30 // 30 seconds TTL
  );

  return paginatedResponse(result.slots, result.total, result.limit, result.offset, 200);
}, 'GET /api/slots');
