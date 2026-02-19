import { successResponse, errorResponse } from '@/lib/apiResponse';
import { authenticate, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateCachePattern } from '@/lib/redis';

/**
 * GET /api/bookings/[id]
 * Get a single booking by ID
 */
export const GET = authenticate(
  async (request: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context?.params;
      const bookingId = params?.id;

      if (!bookingId) {
        return errorResponse('Booking ID is required', 400, 'MISSING_PARAM');
      }

      const user = request.user;
      if (!user) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          slot: {
            select: {
              id: true,
              row: true,
              column: true,
              status: true,
            },
          },
        },
      });

      if (!booking) {
        return errorResponse('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
        return errorResponse('Forbidden', 403, 'FORBIDDEN');
      }

      return successResponse(
        {
          id: booking.id,
          slotId: booking.slotId,
          slot: booking.slot,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
        },
        200
      );
    } catch (error) {
      console.error('Get booking error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

/**
 * DELETE /api/bookings/[id]
 * Cancel a parking booking
 *
 * Path parameters:
 * - id: Booking ID (UUID)
 *
 * Authorization:
 * - Requires JWT token
 * - User can only cancel their own bookings (unless admin)
 */
export const DELETE = authenticate(
  async (request: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context?.params;
      const bookingId = params?.id;

      if (!bookingId) {
        return errorResponse('Booking ID is required', 400, 'MISSING_PARAM');
      }

      const user = request.user;
      if (!user) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return errorResponse('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
        return errorResponse('Forbidden', 403, 'FORBIDDEN');
      }

      if (booking.status === 'CANCELLED') {
        return successResponse(
          {
            bookingId: booking.id,
            status: booking.status,
            message: 'Booking already cancelled',
          },
          200
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
        });

        await tx.parkingSlot.update({
          where: { id: cancelled.slotId },
          data: { status: 'AVAILABLE' },
        });

        return cancelled;
      });

      await invalidateCachePattern('slots:*');

      return successResponse(
        {
          bookingId: updated.id,
          status: updated.status,
          message: 'Booking cancelled successfully',
        },
        200
      );
    } catch (error) {
      console.error('Cancel booking error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);
